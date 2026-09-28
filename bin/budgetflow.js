#!/usr/bin/env node

/**
 * BudgetFlow CLI
 * Intelligent, Frictionless Personal & Family Budgeting
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fs from 'fs';
import { c, printBox } from '../server/cli/ui.js';
import {
  startServer,
  stopServer,
  restartServer,
  showStatus,
  tailLogs,
  openUrl,
  ROOT_DIR,
} from '../server/cli/processManager.js';
import {
  wipeData,
  createBackup,
  restoreBackup,
  exportData,
} from '../server/cli/dataManager.js';
import { runDoctor } from '../server/cli/doctor.js';
import { setupService } from '../server/cli/serviceManager.js';
import { runUpdate } from '../server/cli/updater.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package version
let version = '1.0.2.1';
try {
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    version = pkg.version || version;
  }
} catch (_) {}

function printHelp() {
  console.log(`
${c.cyan(c.bold('🌊 BudgetFlow CLI'))} ${c.dim(`v${version}`)}
${c.dim('Intelligent, Frictionless Personal & Family Budgeting (Dual-Mode)')}

${c.bold('USAGE:')}
  ${c.cyan('budgetflow')} [command] [options]

${c.bold('SERVICE MANAGEMENT:')}
  ${c.cyan('budgetflow')} [start]        Start the server daemon ${c.green('(Default: background)')}
                           ${c.dim('Flags: -p, --port <port>  Port (default: 5050)')}
                           ${c.dim('       -f, --foreground   Run attached in terminal')}
                           ${c.dim('       -o, --open         Open in browser on start')}
  ${c.cyan('budgetflow stop')}            Stop the running BudgetFlow server
  ${c.cyan('budgetflow restart')}         Restart the running server
  ${c.cyan('budgetflow status')}          Show live status (PID, port, LAN URL, database)
  ${c.cyan('budgetflow logs')}            View recent server logs
                           ${c.dim('Flags: -f, --follow       Stream live logs')}
                           ${c.dim('       -n, --lines <n>    Number of lines to view')}
  ${c.cyan('budgetflow open')}            Open BudgetFlow in your default browser

${c.bold('DATA & FACTORY RESET:')}
  ${c.cyan('budgetflow wipe')}            Factory reset: wipes data & returns to clean slate
                           ${c.dim('(Creates automated safety backup unless --no-backup is set)')}
                           ${c.dim('Flags: -y, --yes          Skip confirmation prompt')}
                           ${c.dim('       --no-backup        Skip safety snapshot')}
                           ${c.dim('       --reinstall        Reinstall dependencies & rebuild')}
  ${c.cyan('budgetflow backup')}          Create an immediate timestamped JSON snapshot
  ${c.cyan('budgetflow restore')} <file>  Restore database from a backup file
  ${c.cyan('budgetflow export')} [format] Export data (json or csv)
                           ${c.dim('Flags: -o, --output <file> Save to specific file')}

${c.bold('MAINTENANCE & SYSTEM:')}
  ${c.cyan('budgetflow doctor')}          Run environment & network diagnostics
  ${c.cyan('budgetflow build')}           Recompile frontend production bundle
  ${c.cyan('budgetflow update')}          Self-update: downloads latest release (or repo fallback)
                           ${c.dim('Flags: --check            Inspect for updates without applying')}
                           ${c.dim('       --force            Force reinstall & rebuild even if up to date')}
                           ${c.dim('       --repo, --source   Bypass releases and update from repository')}
                           ${c.dim('       --channel <branch> Specify Git branch (default: main)')}
                           ${c.dim('       --no-restart       Update files without restarting daemon')}
                           ${c.dim('       --no-backup        Skip automated safety backup')}
  ${c.cyan('budgetflow service')} [act]   Configure autostart on boot (Linux systemd / Termux)
  ${c.cyan('budgetflow version')}         Print version information
  ${c.cyan('budgetflow help')}            Show this help guide

${c.bold('EXAMPLES:')}
  ${c.dim('$')} budgetflow                     ${c.dim('# Starts hub in background and prints URL')}
  ${c.dim('$')} budgetflow status              ${c.dim('# Checks if server is running and shows IP')}
  ${c.dim('$')} budgetflow logs -f             ${c.dim('# Follows live terminal logs')}
  ${c.dim('$')} budgetflow wipe                ${c.dim('# Resets to clean slate with safety backup')}
  ${c.dim('$')} budgetflow stop                ${c.dim('# Halts the background daemon')}
`);
}

async function main() {
  const args = process.argv.slice(2);
  let command = args[0] ? args[0].toLowerCase() : null;

  // Default behavior when run with no command or flags: defaults to `start`!
  if (!command || command.startsWith('-')) {
    if (command === '-h' || command === '--help' || command === 'help') {
      printHelp();
      return;
    }
    if (command === '-v' || command === '--version' || command === 'version') {
      console.log(`budgetflow v${version}`);
      return;
    }
    // No command or option flags passed directly to `budgetflow`: treat as start!
    command = 'start';
  } else {
    // Shift command out of arguments
    args.shift();
  }

  // Parse helper flags
  const getFlagValue = (short, long) => {
    const idx = args.findIndex((a) => a === short || a === long);
    if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('-')) {
      return args[idx + 1];
    }
    return null;
  };

  const hasFlag = (...flags) => args.some((a) => flags.includes(a));

  const port = getFlagValue('-p', '--port');
  const foreground = hasFlag('-f', '--foreground');
  const openBrowser = hasFlag('-o', '--open');
  const follow = hasFlag('-f', '--follow');
  const lines = getFlagValue('-n', '--lines');
  const yes = hasFlag('-y', '--yes');
  const noBackup = hasFlag('--no-backup');
  const reinstall = hasFlag('--reinstall');
  const json = hasFlag('--json');
  const output = getFlagValue('-o', '--output');
  const check = hasFlag('--check');
  const force = hasFlag('--force');
  const repoOnly = hasFlag('--repo', '--source');
  const channel = getFlagValue('-c', '--channel') || 'main';
  const noRestart = hasFlag('--no-restart');

  switch (command) {
    case 'start': {
      await startServer({
        port: port ? parseInt(port, 10) : undefined,
        foreground,
        open: openBrowser,
      });
      break;
    }

    case 'stop': {
      await stopServer({ force: hasFlag('--force') });
      break;
    }

    case 'restart': {
      await restartServer({
        port: port ? parseInt(port, 10) : undefined,
        foreground,
        open: openBrowser,
      });
      break;
    }

    case 'status': {
      await showStatus({
        port: port ? parseInt(port, 10) : undefined,
        json,
      });
      break;
    }

    case 'logs': {
      tailLogs({
        follow,
        lines: lines ? parseInt(lines, 10) : 35,
      });
      break;
    }

    case 'open': {
      const targetPort = port || process.env.PORT || 5050;
      openUrl(`http://localhost:${targetPort}`);
      break;
    }

    case 'wipe': {
      await wipeData({
        yes,
        noBackup,
        reinstall,
      });
      break;
    }

    case 'backup': {
      const outDir = args[0] && !args[0].startsWith('-') ? args[0] : output;
      const result = createBackup('manual', outDir);
      console.log(c.success(`Created backup snapshot: ${c.bold(result.filename)}`));
      console.log(c.dim(`Path: ${result.path} (${(result.size / 1024).toFixed(1)} KB)`));
      break;
    }

    case 'restore': {
      const targetFile = args[0] && !args[0].startsWith('-') ? args[0] : null;
      await restoreBackup(targetFile, { yes });
      break;
    }

    case 'export': {
      const format = args[0] && !args[0].startsWith('-') ? args[0] : 'json';
      exportData(format, output);
      break;
    }

    case 'doctor': {
      await runDoctor({ port: port ? parseInt(port, 10) : undefined });
      break;
    }

    case 'build': {
      console.log(c.cyan('Compiling frontend bundle with Vite...'));
      try {
        execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
        console.log(c.success('Frontend build complete (/dist).'));
      } catch (err) {
        console.error(c.error(`Build failed: ${err.message}`));
      }
      break;
    }

    case 'update': {
      await runUpdate({
        check,
        force,
        repoOnly,
        channel,
        noRestart,
        noBackup,
      });
      break;
    }

    case 'service': {
      const subAction = args[0] || 'install';
      setupService(subAction);
      break;
    }

    case 'version':
    case '-v':
    case '--version': {
      console.log(`budgetflow v${version}`);
      break;
    }

    case 'help':
    case '-h':
    case '--help': {
      printHelp();
      break;
    }

    default: {
      console.error(c.error(`Unknown command: "${command}"`));
      console.log(c.dim('Run `budgetflow help` to see available commands.'));
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(c.error(`Unexpected CLI error: ${err.message}`));
  process.exit(1);
});
