import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { c, colors, printBox } from './ui.js';
import { createBackup } from './dataManager.js';
import {
  ROOT_DIR,
  SERVER_DIR,
  DATA_DIR,
  getStoredPid,
  isProcessRunning,
  restartServer,
  queryServerStatus,
  getLocalIp,
} from './processManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default GitHub repository
const DEFAULT_REPO = 'JayM3/budgetflow';

/**
 * Detect target GitHub repository from Git remote or environment
 */
export function getRepoInfo() {
  if (process.env.BUDGETFLOW_REPO) {
    const parts = process.env.BUDGETFLOW_REPO.split('/');
    if (parts.length === 2) {
      return { owner: parts[0], repo: parts[1], fullName: process.env.BUDGETFLOW_REPO };
    }
  }

  try {
    const gitRemote = execSync('git config --get remote.origin.url', {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

    // Match HTTPS: https://github.com/owner/repo(.git)
    // Match SSH:   git@github.com:owner/repo(.git)
    const match = gitRemote.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/i);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        fullName: `${match[1]}/${match[2]}`,
      };
    }
  } catch (_) {}

  const [owner, repo] = DEFAULT_REPO.split('/');
  return { owner, repo, fullName: DEFAULT_REPO };
}

/**
 * Check if the current workspace is a Git repository and git is installed
 */
export function isGitRepo() {
  const gitDir = path.join(ROOT_DIR, '.git');
  if (!fs.existsSync(gitDir)) return false;
  try {
    const res = spawnSync('git', ['--version'], { stdio: 'ignore' });
    return res.status === 0;
  } catch (_) {
    return false;
  }
}

/**
 * Read current package version
 */
export function getCurrentVersion() {
  try {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.version || '1.0.0.1';
    }
  } catch (_) {}
  return '1.0.0.1';
}

/**
 * Safe fetch helper using native fetch with User-Agent header
 */
async function fetchGithub(url) {
  const headers = {
    'User-Agent': `BudgetFlow-CLI/${getCurrentVersion()}`,
    Accept: 'application/vnd.github.v3+json',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Check for updates against GitHub Releases and fallback repository
 */
export async function checkForUpdate(options = {}) {
  const repoInfo = getRepoInfo();
  const currentVer = getCurrentVersion();
  const channel = options.channel || 'main';

  const result = {
    repo: repoInfo.fullName,
    currentVersion: currentVer,
    hasRelease: false,
    release: null,
    isReleaseNewer: false,
    isGit: isGitRepo(),
    commitsBehind: 0,
    latestCommit: null,
    updateAvailable: false,
  };

  // 1. Query GitHub Releases API
  if (!options.repoOnly) {
    try {
      const releaseRes = await fetchGithub(
        `https://api.github.com/repos/${repoInfo.fullName}/releases/latest`
      );

      if (releaseRes.ok) {
        const data = await releaseRes.json();
        if (data && data.tag_name) {
          result.hasRelease = true;
          result.release = {
            tagName: data.tag_name,
            name: data.name || data.tag_name,
            publishedAt: data.published_at,
            body: data.body,
            tarballUrl: data.tarball_url,
            zipballUrl: data.zipball_url,
            assets: data.assets || [],
          };

          // Simple semver clean comparison
          const cleanTag = data.tag_name.replace(/^v/, '');
          const cleanLocal = currentVer.replace(/^v/, '');
          result.isReleaseNewer = cleanTag !== cleanLocal;
          if (result.isReleaseNewer) {
            result.updateAvailable = true;
            return result;
          }
        }
      }
    } catch (_) {
      // Network failure or rate limit, continue to repository fallback
    }
  }

  // 2. Fallback to Git Repository / Commits
  if (result.isGit) {
    try {
      // Fetch remote tracking branch
      execSync(`git fetch origin ${channel} --quiet`, { cwd: ROOT_DIR, stdio: 'ignore' });
      const revCount = execSync(`git rev-list --count HEAD..origin/${channel}`, {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
      }).trim();

      const count = parseInt(revCount, 10);
      result.commitsBehind = isNaN(count) ? 0 : count;

      if (result.commitsBehind > 0) {
        result.updateAvailable = true;
        const lastCommit = execSync(`git log -1 --format="%h - %s (%cr)" origin/${channel}`, {
          cwd: ROOT_DIR,
          encoding: 'utf-8',
        }).trim();
        result.latestCommit = lastCommit;
      }
    } catch (_) {}
  } else {
    // If not a git clone, query GitHub Commits API
    try {
      const commitRes = await fetchGithub(
        `https://api.github.com/repos/${repoInfo.fullName}/commits/${channel}`
      );
      if (commitRes.ok) {
        const commitData = await commitRes.json();
        if (commitData && commitData.sha) {
          result.latestCommit = `${commitData.sha.substring(0, 7)} - ${commitData.commit?.message?.split('\n')[0]}`;
          // For non-git standalone, always consider update available if requested or forced
          result.updateAvailable = true;
        }
      }
    } catch (_) {}
  }

  return result;
}

/**
 * Synchronize directory files while preserving user data and local configs
 */
function syncFilesPreservingData(sourceDir, destDir) {
  const preservedPaths = [
    path.join('server', 'data'),
    'node_modules',
    '.git',
    '.env',
    '.env.local',
  ];

  function copyRecursive(src, dst) {
    if (!fs.existsSync(dst)) {
      fs.mkdirSync(dst, { recursive: true });
    }

    const items = fs.readdirSync(src, { withFileTypes: true });
    for (const item of items) {
      const srcPath = path.join(src, item.name);
      const dstPath = path.join(dst, item.name);

      // Check if relative path should be preserved
      const relPath = path.relative(destDir, dstPath);
      const isPreserved = preservedPaths.some((p) => relPath === p || relPath.startsWith(p + path.sep));
      if (isPreserved && fs.existsSync(dstPath)) {
        continue;
      }

      if (item.isDirectory()) {
        copyRecursive(srcPath, dstPath);
      } else {
        fs.copyFileSync(srcPath, dstPath);
      }
    }
  }

  copyRecursive(sourceDir, destDir);
}

/**
 * Download archive file (handles HTTP redirects)
 */
async function downloadArchive(url, targetPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': `BudgetFlow-CLI/${getCurrentVersion()}`,
      Accept: 'application/octet-stream',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Failed to download archive: HTTP ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
}

/**
 * Extract an archive (.zip or .tar.gz) into a destination directory
 */
function extractArchive(archivePath, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Use tar if available (standard on Linux, macOS, Android Termux, and Windows 10+)
  try {
    execSync(`tar -xf "${archivePath}" -C "${destDir}"`, { stdio: 'ignore' });
    return true;
  } catch (tarErr) {
    // If on Windows and tar fails, try PowerShell Expand-Archive for zip files
    if (process.platform === 'win32' && archivePath.endsWith('.zip')) {
      try {
        execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${archivePath}' -DestinationPath '${destDir}' -Force"`, {
          stdio: 'ignore',
        });
        return true;
      } catch (psErr) {
        throw new Error(`Archive extraction failed: ${tarErr.message} / ${psErr.message}`);
      }
    }
    throw tarErr;
  }
}

/**
 * Main update runner
 */
export async function runUpdate(options = {}) {
  const {
    check = false,
    force = false,
    repoOnly = false,
    channel = 'main',
    noRestart = false,
    noBackup = false,
  } = options;

  const currentVer = getCurrentVersion();
  const repoInfo = getRepoInfo();

  console.log(`\n${c.cyan(c.bold('🌊 BudgetFlow Self-Update Engine'))}`);
  console.log(`${c.dim('Repository:')} ${repoInfo.fullName} ${c.dim(`(Channel: ${channel})`)}`);
  console.log(`${c.dim('Local Version:')} v${currentVer}\n`);

  // --- 1. DRY-RUN / CHECK MODE ---
  if (check) {
    console.log(c.dim('Checking for updates...'));
    const status = await checkForUpdate({ repoOnly, channel });

    if (status.hasRelease) {
      console.log(c.info(`Latest Release: ${c.bold(status.release.tagName)}`));
      if (status.isReleaseNewer) {
        console.log(c.success(`An update is available: v${status.currentVersion} -> ${status.release.tagName}`));
        console.log(c.dim(`Run \`budgetflow update\` to install.`));
      } else {
        console.log(c.green(`✓ You are on the latest official release (${status.release.tagName}).`));
      }
    } else {
      console.log(c.dim('No published GitHub releases found. Checking repository commits...'));
      if (status.isGit) {
        if (status.commitsBehind > 0) {
          console.log(c.success(`Repository updates available: ${status.commitsBehind} new commit(s) on ${channel}.`));
          if (status.latestCommit) {
            console.log(c.dim(`Latest: ${status.latestCommit}`));
          }
          console.log(c.dim(`Run \`budgetflow update\` to pull latest updates.`));
        } else {
          console.log(c.green(`✓ Local repository is already up to date with origin/${channel}.`));
        }
      } else {
        console.log(c.dim('Standalone installation detected. Run `budgetflow update` to sync with latest main branch.'));
      }
    }
    return;
  }

  // --- 2. PRE-UPDATE SAFETY BACKUP ---
  if (!noBackup) {
    try {
      console.log(c.dim('Creating pre-update safety backup of household database...'));
      const backup = createBackup('pre-update');
      console.log(c.success(`Safety backup created: ${c.bold(backup.filename)}`));
    } catch (err) {
      console.log(c.warning(`Pre-update backup skipped or encountered issue: ${err.message}`));
    }
  }

  // --- 3. CHECK RUNNING SERVER STATE ---
  const currentPid = getStoredPid();
  const wasRunning = currentPid && isProcessRunning(currentPid);
  if (wasRunning) {
    console.log(c.dim(`Server daemon currently running (PID: ${currentPid}). Will restart after update.`));
  }

  // --- 4. DETERMINE UPDATE SOURCE: RELEASE vs REPOSITORY ---
  console.log(c.dim('Checking update sources...'));
  const checkStatus = await checkForUpdate({ repoOnly, channel });
  let updateStrategy = null; // 'release' | 'git' | 'archive'

  if (checkStatus.hasRelease && !repoOnly) {
    if (!checkStatus.isReleaseNewer && !force) {
      console.log(c.green(`✓ BudgetFlow is already up to date with the latest release (${checkStatus.release.tagName}).`));
      console.log(c.dim('Use `budgetflow update --force` to force reinstall, or `--repo` to pull from repository.'));
      return;
    }
    updateStrategy = 'release';
  } else {
    // Fallback: Repository update
    if (checkStatus.hasRelease) {
      console.log(c.dim(`Bypassing releases (--repo specified). Updating directly from git repository...`));
    } else {
      console.log(c.info(`No published releases found on ${repoInfo.fullName}.`));
      console.log(c.dim(`Falling back smoothly to latest repository code (${channel} branch)...`));
    }

    if (checkStatus.isGit) {
      if (checkStatus.commitsBehind === 0 && !force) {
        console.log(c.green(`✓ Local repository is already up to date with origin/${channel}.`));
        console.log(c.dim('Use `budgetflow update --force` to force dependency reinstall & rebuild.'));
        return;
      }
      updateStrategy = 'git';
    } else {
      updateStrategy = 'archive';
    }
  }

  // --- 5. EXECUTE UPDATE STRATEGY ---
  console.log('');
  if (updateStrategy === 'release') {
    console.log(c.cyan(`📥 Downloading release ${checkStatus.release.tagName}...`));
    const tmpDir = path.join(os.tmpdir(), `budgetflow-release-${Date.now()}`);
    const archivePath = path.join(tmpDir, 'release.zip');
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      const downloadUrl = checkStatus.release.zipballUrl ||
        `https://github.com/${repoInfo.fullName}/archive/refs/tags/${checkStatus.release.tagName}.zip`;

      await downloadArchive(downloadUrl, archivePath);
      console.log(c.dim('Extracting release archive...'));
      const extractDir = path.join(tmpDir, 'extracted');
      extractArchive(archivePath, extractDir);

      // GitHub zipballs nest files inside a single root folder
      const subdirs = fs.readdirSync(extractDir);
      const rootPayload = subdirs.length === 1 && fs.statSync(path.join(extractDir, subdirs[0])).isDirectory()
        ? path.join(extractDir, subdirs[0])
        : extractDir;

      console.log(c.dim('Synchronizing project files (preserving database & configs)...'));
      syncFilesPreservingData(rootPayload, ROOT_DIR);
      console.log(c.success(`Release files applied.`));
    } finally {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    }

  } else if (updateStrategy === 'git') {
    if (checkStatus.commitsBehind > 0) {
      console.log(c.cyan(`🔄 Pulling latest commits from origin/${channel}...`));

      // Check if git working directory is dirty
      let stashed = false;
      try {
        const gitStatus = execSync('git status --porcelain', {
          cwd: ROOT_DIR,
          encoding: 'utf-8',
        }).trim();

        if (gitStatus.length > 0) {
          console.log(c.dim('Local modifications detected. Stashing changes temporarily...'));
          execSync('git stash push -m "budgetflow-auto-update"', { cwd: ROOT_DIR, stdio: 'ignore' });
          stashed = true;
        }

        execSync(`git pull origin ${channel}`, { cwd: ROOT_DIR, stdio: 'inherit' });

        if (stashed) {
          console.log(c.dim('Restoring stashed local modifications...'));
          try {
            execSync('git stash pop --quiet', { cwd: ROOT_DIR, stdio: 'ignore' });
          } catch (_) {
            console.log(c.warning('Could not automatically pop git stash. Run `git stash list` to inspect.'));
          }
        }
        console.log(c.success('Git pull completed successfully.'));
      } catch (err) {
        console.error(c.error(`Git update encountered an error: ${err.message}`));
        throw err;
      }
    } else {
      console.log(c.cyan(`Repository is already at latest commit (origin/${channel}).`));
      console.log(c.dim('Proceeding with full dependency refresh and frontend build (--force)...'));
    }

  } else if (updateStrategy === 'archive') {
    console.log(c.cyan(`📥 Downloading latest repository archive (${channel})...`));
    const tmpDir = path.join(os.tmpdir(), `budgetflow-repo-${Date.now()}`);
    const archivePath = path.join(tmpDir, 'repo.zip');
    fs.mkdirSync(tmpDir, { recursive: true });

    try {
      const archiveUrl = `https://github.com/${repoInfo.fullName}/archive/refs/heads/${channel}.zip`;
      await downloadArchive(archiveUrl, archivePath);

      console.log(c.dim('Extracting repository archive...'));
      const extractDir = path.join(tmpDir, 'extracted');
      extractArchive(archivePath, extractDir);

      const subdirs = fs.readdirSync(extractDir);
      const rootPayload = subdirs.length === 1 && fs.statSync(path.join(extractDir, subdirs[0])).isDirectory()
        ? path.join(extractDir, subdirs[0])
        : extractDir;

      console.log(c.dim('Synchronizing project files (preserving database & configs)...'));
      syncFilesPreservingData(rootPayload, ROOT_DIR);
      console.log(c.success('Repository archive applied.'));
    } finally {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    }
  }

  // --- 6. DEPENDENCY INSTALLATION ---
  console.log(`\n${c.cyan('📦 Refreshing frontend dependencies...')}`);
  try {
    execSync('npm install --prefer-offline --no-audit', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log(c.success('Root dependencies ready.'));
  } catch (err) {
    console.error(c.error(`Root npm install warning: ${err.message}`));
  }

  console.log(`\n${c.cyan('📦 Refreshing server dependencies...')}`);
  try {
    execSync('npm install --prefer-offline --no-audit', { cwd: SERVER_DIR, stdio: 'inherit' });
    console.log(c.success('Server dependencies ready.'));
  } catch (err) {
    console.error(c.error(`Server npm install warning: ${err.message}`));
  }

  // --- 7. RECOMPILE FRONTEND BUNDLE ---
  console.log(`\n${c.cyan('🔨 Rebuilding frontend production bundle (/dist)...')}`);
  try {
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log(c.success('Frontend bundle compiled successfully.'));
  } catch (err) {
    console.error(c.error(`Frontend build failed: ${err.message}`));
    throw err;
  }

  // --- 8. RESTART SERVER DAEMON IF IT WAS RUNNING ---
  const updatedVer = getCurrentVersion();
  const lanIp = getLocalIp();

  if (wasRunning && !noRestart) {
    console.log(`\n${c.cyan('🔄 Restarting BudgetFlow server daemon...')}`);
    await restartServer();

    // Verify health
    const health = await queryServerStatus();
    if (health.ok) {
      printBox('🎉 BUDGETFLOW UPDATED & RESTARTED', [
        `${c.bold('Version:')}    v${updatedVer}`,
        `${c.bold('Source:')}     ${updateStrategy === 'release' ? 'GitHub Release' : 'GitHub Repository (' + channel + ')'}`,
        `${c.bold('Status:')}     ${c.green('● ONLINE (Background Daemon)')}`,
        '',
        `${c.bold('Local:')}      ${c.cyan(`http://localhost:5050`)}`,
        `${c.bold('LAN / Wi-Fi:')} ${c.cyan(`http://${lanIp}:5050`)}`,
        '',
        `${c.dim('Your financial database and settings were 100% preserved.')}`,
      ], colors.green);
    } else {
      printBox('⚠ UPDATE COMPLETED WITH WARNING', [
        `${c.bold('Version:')}    v${updatedVer}`,
        `${c.bold('Warning:')}    Server restarted but health check did not respond yet.`,
        `${c.dim('Run `budgetflow logs -f` to inspect output.')}`,
      ], colors.yellow);
    }
  } else {
    printBox('🎉 BUDGETFLOW UPDATED SUCCESSFULLY', [
      `${c.bold('Version:')}    v${updatedVer}`,
      `${c.bold('Source:')}     ${updateStrategy === 'release' ? 'GitHub Release' : 'GitHub Repository (' + channel + ')'}`,
      `${c.bold('Status:')}     ${wasRunning ? c.yellow('Daemon restart skipped (--no-restart)') : c.dim('Daemon offline')}`,
      '',
      `${c.dim('Start the server anytime with: `budgetflow`')}`,
      `${c.dim('Your financial database and settings were 100% preserved.')}`,
    ], colors.cyan);
  }
}
