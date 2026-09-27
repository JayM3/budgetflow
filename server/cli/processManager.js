import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { c, colors, printBox, printKV } from './ui.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project directories
export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const SERVER_DIR = path.join(ROOT_DIR, 'server');
export const DATA_DIR = path.join(SERVER_DIR, 'data');
export const PID_FILE = path.join(DATA_DIR, 'budgetflow.pid');
export const LOG_FILE = path.join(DATA_DIR, 'budgetflow.log');
export const SERVER_SCRIPT = path.join(SERVER_DIR, 'server.js');

/**
 * Get LAN IPv4 Address
 */
export function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

/**
 * Read the stored PID from PID_FILE
 */
export function getStoredPid() {
  try {
    if (fs.existsSync(PID_FILE)) {
      const raw = fs.readFileSync(PID_FILE, 'utf-8').trim();
      const pid = parseInt(raw, 10);
      return isNaN(pid) ? null : pid;
    }
  } catch (_) {}
  return null;
}

/**
 * Check if a process with the given PID is actively running
 */
export function isProcessRunning(pid) {
  if (!pid || isNaN(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM'; // Process exists but we lack permission to signal
  }
}

/**
 * Check HTTP health of the server via /api/status
 */
export function queryServerStatus(port = 5050, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/status',
        timeout: timeoutMs,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ ok: true, data: parsed });
          } catch (_) {
            resolve({ ok: false, error: 'Malformed JSON from server' });
          }
        });
      }
    );

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Request timed out' });
    });
  });
}

/**
 * Launch the BudgetFlow server (daemon mode by default, or foreground)
 */
export async function startServer(options = {}) {
  const port = options.port || process.env.PORT || 5050;
  const foreground = options.foreground || false;
  const openBrowser = options.open || false;

  const currentPid = getStoredPid();
  if (currentPid && isProcessRunning(currentPid)) {
    const health = await queryServerStatus(port);
    const lanIp = getLocalIp();

    printBox('🌊 BUDGETFLOW IS ALREADY RUNNING', [
      `${c.bold('Status:')}   ${c.green('● ACTIVE (Running)')}`,
      `${c.bold('PID:')}      ${currentPid}`,
      `${c.bold('Port:')}     ${port}`,
      '',
      `${c.bold('Local:')}    ${c.cyan(`http://localhost:${port}`)}`,
      `${c.bold('LAN:')}      ${c.cyan(`http://${lanIp}:${port}`)}`,
      '',
      `${c.dim('Commands: `budgetflow stop` to stop, `budgetflow restart` to restart')}`
    ], colors.green);

    if (openBrowser) {
      openUrl(`http://localhost:${port}`);
    }
    return;
  }

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Remove stale PID file if present
  if (fs.existsSync(PID_FILE)) {
    try { fs.unlinkSync(PID_FILE); } catch (_) {}
  }

  if (foreground) {
    console.log(c.cyan(`Starting BudgetFlow in foreground on port ${port}... (Press Ctrl+C to stop)`));
    fs.writeFileSync(PID_FILE, String(process.pid), 'utf-8');

    const cleanup = () => {
      try {
        if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
      } catch (_) {}
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', () => {
      try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch (_) {}
    });

    // Run directly
    process.env.PORT = String(port);
    await import(`file://${SERVER_SCRIPT}`);
    return;
  }

  // DAEMON MODE (Default)
  console.log(c.dim('Spawning BudgetFlow background server...'));

  const outLog = fs.openSync(LOG_FILE, 'a');
  const errLog = fs.openSync(LOG_FILE, 'a');

  const child = spawn(process.execPath, [SERVER_SCRIPT], {
    detached: true,
    stdio: ['ignore', outLog, errLog],
    windowsHide: true,
    cwd: ROOT_DIR,
    env: { ...process.env, PORT: String(port) },
  });

  // Close parent copies of file handles
  try { fs.closeSync(outLog); } catch (_) {}
  try { fs.closeSync(errLog); } catch (_) {}

  const pid = child.pid;
  fs.writeFileSync(PID_FILE, String(pid), 'utf-8');
  child.unref();

  // Wait 700ms to verify process didn't immediately crash (e.g. port conflict)
  await new Promise((r) => setTimeout(r, 700));

  if (!isProcessRunning(pid)) {
    console.error(c.error(`BudgetFlow failed to start (Process exited immediately).`));
    if (fs.existsSync(LOG_FILE)) {
      console.log(c.yellow('\nLast 10 lines of budgetflow.log:'));
      tailLogs({ lines: 10, follow: false });
    }
    try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch (_) {}
    process.exit(1);
  }

  const lanIp = getLocalIp();
  const statusCheck = await queryServerStatus(port, 1000);
  const isSetup = statusCheck.ok && statusCheck.data.isSetupCompleted;

  printBox('🌊 BUDGETFLOW FAMILY HUB STARTED', [
    `${c.bold('Status:')}     ${c.green('● ONLINE (Background Daemon)')}`,
    `${c.bold('PID:')}        ${pid}`,
    `${c.bold('Port:')}       ${port}`,
    `${c.bold('Setup:')}      ${isSetup ? c.green('Configured') : c.yellow('Setup Wizard Ready (Clean Slate)')}`,
    '',
    `${c.bold('📱 Tablet / Local:')}   ${c.cyan(`http://localhost:${port}`)}`,
    `${c.bold('🏠 Household Wi-Fi:')}  ${c.cyan(`http://${lanIp}:${port}`)}`,
    '',
    `${c.dim('Logs:    `budgetflow logs -f`')}`,
    `${c.dim('Stop:    `budgetflow stop`')}`,
    `${c.dim('Restart: `budgetflow restart`')}`
  ], colors.cyan);

  if (openBrowser) {
    openUrl(`http://localhost:${port}`);
  }
}

/**
 * Stop the running BudgetFlow server
 */
export async function stopServer(options = {}) {
  const force = options.force || false;
  const silent = options.silent || false;
  const pid = getStoredPid();

  if (!pid || !isProcessRunning(pid)) {
    if (fs.existsSync(PID_FILE)) {
      try { fs.unlinkSync(PID_FILE); } catch (_) {}
    }
    if (!silent) {
      console.log(c.yellow('BudgetFlow server is not currently running.'));
    }
    return false;
  }

  if (!silent) {
    console.log(c.dim(`Stopping BudgetFlow server (PID: ${pid})...`));
  }

  // Attempt graceful shutdown
  try {
    process.kill(pid, 'SIGTERM');
  } catch (err) {
    try {
      process.kill(pid);
    } catch (_) {}
  }

  // Poll for process shutdown (up to 3.5 seconds)
  let stopped = false;
  for (let i = 0; i < 18; i++) {
    await new Promise((r) => setTimeout(r, 200));
    if (!isProcessRunning(pid)) {
      stopped = true;
      break;
    }
  }

  // If still alive, escalate force kill
  if (!stopped) {
    if (process.platform === 'win32') {
      try {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
        stopped = true;
      } catch (_) {}
    } else {
      try {
        process.kill(pid, 'SIGKILL');
        stopped = true;
      } catch (_) {}
    }
  }

  // Clean up PID file
  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  } catch (_) {}

  if (!silent) {
    if (stopped) {
      console.log(c.success(`BudgetFlow server (PID: ${pid}) has been stopped.`));
    } else {
      console.log(c.warning(`Could not confirm termination of PID ${pid}.`));
    }
  }

  return stopped;
}

/**
 * Restart BudgetFlow server
 */
export async function restartServer(options = {}) {
  console.log(c.cyan('Restarting BudgetFlow server...'));
  await stopServer({ silent: false });
  await new Promise((r) => setTimeout(r, 600));
  await startServer(options);
}

/**
 * Check and display live status of BudgetFlow
 */
export async function showStatus(options = {}) {
  const port = options.port || process.env.PORT || 5050;
  const asJson = options.json || false;
  let pid = getStoredPid();
  let health = await queryServerStatus(port);
  const running = (pid && isProcessRunning(pid)) || (health && health.ok);

  const lanIp = getLocalIp();

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          running,
          pid: running ? pid : null,
          port,
          lanIp,
          apiStatus: health ? health.data : null,
        },
        null,
        2
      )
    );
    return;
  }

  console.log('');
  if (running) {
    const isSetup = health && health.ok && health.data.isSetupCompleted;
    const householdName = health && health.ok ? health.data.householdName : 'BudgetFlow Hub';

    printBox('🌊 BUDGETFLOW STATUS: ONLINE', [
      `${c.bold('Process:')}        ${c.green('● ACTIVE (PID: ' + pid + ')')}`,
      `${c.bold('Port:')}           ${port}`,
      `${c.bold('Household:')}      ${householdName}`,
      `${c.bold('Setup State:')}    ${isSetup ? c.green('Configured') : c.yellow('Clean Slate (First-time Wizard)')}`,
      '',
      `${c.bold('Local Access:')}    ${c.cyan(`http://localhost:${port}`)}`,
      `${c.bold('Wi-Fi / LAN:')}     ${c.cyan(`http://${lanIp}:${port}`)}`,
      `${c.bold('Log File:')}        ${LOG_FILE}`,
    ], colors.green);
  } else {
    printBox('🌊 BUDGETFLOW STATUS: OFFLINE', [
      `${c.bold('Process:')}        ${c.red('○ STOPPED (No active instance)')}`,
      `${c.bold('Default Port:')}   ${port}`,
      `${c.bold('Local IP:')}        ${lanIp}`,
      '',
      `${c.dim('Start server anytime with: `budgetflow start` or simply `budgetflow`')}`
    ], colors.yellow);
  }
  console.log('');
}

/**
 * Stream or print log output
 */
export function tailLogs(options = {}) {
  const linesCount = options.lines || 35;
  const follow = options.follow || false;

  if (!fs.existsSync(LOG_FILE)) {
    console.log(c.yellow(`No log file found at ${LOG_FILE}.`));
    console.log(c.dim('Start the server to begin logging.'));
    return;
  }

  const printLastLines = () => {
    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const allLines = content.split('\n');
    const slice = allLines.slice(-linesCount).join('\n');
    process.stdout.write(slice + (slice.endsWith('\n') ? '' : '\n'));
  };

  printLastLines();

  if (follow) {
    console.log(c.dim(`\n--- Following ${LOG_FILE} (Press Ctrl+C to exit) ---\n`));
    let lastSize = fs.statSync(LOG_FILE).size;

    const interval = setInterval(() => {
      if (!fs.existsSync(LOG_FILE)) return;
      const currentSize = fs.statSync(LOG_FILE).size;
      if (currentSize > lastSize) {
        const stream = fs.createReadStream(LOG_FILE, {
          start: lastSize,
          end: currentSize,
          encoding: 'utf-8',
        });
        stream.on('data', (chunk) => process.stdout.write(chunk));
        lastSize = currentSize;
      }
    }, 300);

    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log('\n');
      process.exit(0);
    });
  }
}

/**
 * Cross-platform open URL in browser
 */
export function openUrl(url) {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' });
    } else if (platform === 'win32') {
      execSync(`start "" "${url}"`, { stdio: 'ignore' });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    }
  } catch (_) {}
}

/**
 * Gracefully restart the server from within the running server process.
 * Closes the existing HTTP server to free port 5050, spawns a new detached server process,
 * and terminates the current process cleanly.
 */
export function restartServerGracefully(httpServer, delayMs = 1200) {
  setTimeout(() => {
    console.log(c.cyan('Initiating graceful server restart...'));

    const spawnNewInstance = () => {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        const outLog = fs.openSync(LOG_FILE, 'a');
        const errLog = fs.openSync(LOG_FILE, 'a');

        const child = spawn(process.execPath, [SERVER_SCRIPT], {
          detached: true,
          stdio: ['ignore', outLog, errLog],
          windowsHide: true,
          cwd: ROOT_DIR,
          env: { ...process.env },
        });

        const pid = child.pid;
        fs.writeFileSync(PID_FILE, String(pid), 'utf-8');
        child.unref();

        try { fs.closeSync(outLog); } catch (_) {}
        try { fs.closeSync(errLog); } catch (_) {}

        console.log(c.success(`New server process spawned (PID: ${pid}). Exiting current process.`));
      } catch (err) {
        console.error(c.error(`Failed to spawn new server instance: ${err.message}`));
      }
      process.exit(0);
    };

    if (httpServer && typeof httpServer.close === 'function') {
      httpServer.close((err) => {
        if (err) {
          console.error(c.warning(`Error closing HTTP server socket: ${err.message}`));
        }
        spawnNewInstance();
      });
      // Safety fallback in case lingering sockets don't trigger close callback within 3s
      setTimeout(spawnNewInstance, 3000);
    } else {
      spawnNewInstance();
    }
  }, delayMs);
}

