import fs from 'fs';
import path from 'path';
import net from 'net';
import { execSync } from 'child_process';
import { c, printBox, printKV } from './ui.js';
import { ROOT_DIR, DATA_DIR, getLocalIp, getStoredPid, isProcessRunning } from './processManager.js';

/**
 * Check if a network port is available
 */
function checkPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, '0.0.0.0');
  });
}

/**
 * Check environment and print doctor diagnostics
 */
export async function runDoctor(options = {}) {
  const targetPort = options.port || process.env.PORT || 5050;

  console.log('');
  console.log(c.cyan('🌊 Running BudgetFlow Hub Doctor Diagnostics...'));
  console.log(c.dim('Checking runtime environment, file system permissions, and network ports.\n'));

  const results = [];

  // 1. Node.js version check
  const nodeVer = process.version;
  const majorNode = parseInt(nodeVer.replace('v', '').split('.')[0], 10);
  if (majorNode >= 18) {
    results.push({ name: 'Node.js Version', status: 'pass', detail: `${nodeVer} (Supported >= 18)` });
  } else {
    results.push({ name: 'Node.js Version', status: 'fail', detail: `${nodeVer} (Requires v18 or newer)` });
  }

  // 2. npm check
  let npmVer = 'Unknown';
  try {
    npmVer = execSync('npm -v', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    results.push({ name: 'npm Package Manager', status: 'pass', detail: `v${npmVer}` });
  } catch (_) {
    results.push({ name: 'npm Package Manager', status: 'warn', detail: 'Not detected in PATH' });
  }

  // 3. Platform Detection
  const isTermux = Boolean(process.env.TERMUX_VERSION) || fs.existsSync('/data/data/com.termux');
  const platform = isTermux ? 'Android Termux (ARM64)' : `${process.platform} (${process.arch})`;
  results.push({ name: 'Operating Platform', status: 'pass', detail: platform });

  // 4. Frontend Build check
  const distIndex = path.join(ROOT_DIR, 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    const stat = fs.statSync(distIndex);
    results.push({ name: 'Frontend Bundle (/dist)', status: 'pass', detail: `Present (${(stat.size / 1024).toFixed(1)} KB)` });
  } else {
    results.push({ name: 'Frontend Bundle (/dist)', status: 'warn', detail: 'Missing index.html. Run `budgetflow build` or `npm run build`' });
  }

  // 5. Data Directory & Write Permissions
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const testFile = path.join(DATA_DIR, '.doctor_test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    results.push({ name: 'Data Storage Permissions', status: 'pass', detail: `Writable (${DATA_DIR})` });
  } catch (err) {
    results.push({ name: 'Data Storage Permissions', status: 'fail', detail: `Permission error: ${err.message}` });
  }

  // 6. Network & Port Check
  const pid = getStoredPid();
  const serverRunning = pid ? isProcessRunning(pid) : false;
  const portAvailable = await checkPortFree(targetPort);

  if (serverRunning) {
    results.push({ name: `Server Port (${targetPort})`, status: 'pass', detail: `Active by BudgetFlow (PID: ${pid})` });
  } else if (portAvailable) {
    results.push({ name: `Server Port (${targetPort})`, status: 'pass', detail: 'Available for binding' });
  } else {
    results.push({ name: `Server Port (${targetPort})`, status: 'warn', detail: 'Port in use by another application' });
  }

  // 7. LAN IP Detection
  const lanIp = getLocalIp();
  results.push({ name: 'LAN Network IP', status: 'pass', detail: `${lanIp} (Wi-Fi access ready)` });

  // 8. GitHub Connectivity & Update Engine
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const ghRes = await fetch('https://api.github.com/zen', {
      headers: { 'User-Agent': 'BudgetFlow-Doctor' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (ghRes.ok) {
      results.push({ name: 'GitHub Update Service', status: 'pass', detail: 'Online (Ready for budgetflow update)' });
    } else {
      results.push({ name: 'GitHub Update Service', status: 'warn', detail: `HTTP ${ghRes.status} response` });
    }
  } catch (_) {
    results.push({ name: 'GitHub Update Service', status: 'warn', detail: 'Unreachable (Offline or blocked)' });
  }

  // Print Summary Table
  console.log('═'.repeat(65));
  for (const r of results) {
    const icon = r.status === 'pass' ? c.green('✓') : r.status === 'warn' ? c.yellow('▲') : c.red('✗');
    const namePadded = r.name.padEnd(28, ' ');
    console.log(` ${icon}  ${c.bold(namePadded)} ${c.dim(r.detail)}`);
  }
  console.log('═'.repeat(65));

  const hasFailures = results.some(r => r.status === 'fail');
  if (hasFailures) {
    console.log(c.red('\nSome critical requirements were not met. Please review the errors above.'));
  } else {
    console.log(c.green('\n✓ System is healthy and ready to run BudgetFlow!'));
  }
  console.log('');
}
