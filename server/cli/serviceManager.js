import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { c, printBox } from './ui.js';
import { ROOT_DIR } from './processManager.js';

/**
 * Configure auto-start service (systemd or Termux:Boot)
 */
export function setupService(action = 'install') {
  const isTermux = Boolean(process.env.TERMUX_VERSION) || fs.existsSync('/data/data/com.termux');

  if (isTermux) {
    handleTermuxBoot(action);
  } else if (process.platform === 'linux') {
    handleLinuxSystemd(action);
  } else {
    console.log(c.yellow(`Automatic service installation is optimized for Linux and Android Termux.`));
    console.log(c.dim(`On ${process.platform}, you can start BudgetFlow automatically via Task Scheduler or Startup items.`));
  }
}

function handleTermuxBoot(action) {
  const bootDir = path.join(os.homedir(), '.termux', 'boot');
  const bootScript = path.join(bootDir, 'start-budgetflow');

  if (action === 'uninstall' || action === 'disable') {
    if (fs.existsSync(bootScript)) {
      fs.unlinkSync(bootScript);
      console.log(c.success('Termux:Boot script removed.'));
    } else {
      console.log(c.yellow('No Termux:Boot script was found.'));
    }
    return;
  }

  if (!fs.existsSync(bootDir)) {
    fs.mkdirSync(bootDir, { recursive: true });
  }

  const scriptContent = `#!/data/data/com.termux/files/usr/bin/sh
# Auto-start BudgetFlow Family Hub on Android Boot
termux-wake-lock
cd "${ROOT_DIR}"
node server/server.js > server/data/budgetflow.log 2>&1 &
`;

  fs.writeFileSync(bootScript, scriptContent, { mode: 0o755 });
  console.log(c.success(`Termux:Boot script created at: ${bootScript}`));
  console.log(c.dim('Note: Make sure the Termux:Boot app is installed from F-Droid to enable boot execution.'));
}

function handleLinuxSystemd(action) {
  const userConfigDir = path.join(os.homedir(), '.config', 'systemd', 'user');
  const serviceFile = path.join(userConfigDir, 'budgetflow.service');

  if (action === 'uninstall' || action === 'disable') {
    try {
      execSync('systemctl --user stop budgetflow.service', { stdio: 'ignore' });
      execSync('systemctl --user disable budgetflow.service', { stdio: 'ignore' });
    } catch (_) {}
    if (fs.existsSync(serviceFile)) {
      fs.unlinkSync(serviceFile);
    }
    console.log(c.success('BudgetFlow systemd user service removed.'));
    return;
  }

  if (!fs.existsSync(userConfigDir)) {
    fs.mkdirSync(userConfigDir, { recursive: true });
  }

  const nodePath = process.execPath;
  const serverPath = path.join(ROOT_DIR, 'server', 'server.js');

  const unitContent = `[Unit]
Description=BudgetFlow Family Hub Server
After=network.target

[Service]
Type=simple
WorkingDirectory=${ROOT_DIR}
ExecStart=${nodePath} ${serverPath}
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=5050

[Install]
WantedBy=default.target
`;

  fs.writeFileSync(serviceFile, unitContent, 'utf-8');

  try {
    execSync('systemctl --user daemon-reload', { stdio: 'ignore' });
    execSync('systemctl --user enable --now budgetflow.service', { stdio: 'ignore' });
    console.log(c.success('BudgetFlow systemd service installed and started!'));
    console.log(c.cyan('\nTo keep the service running even when you log out of SSH:'));
    console.log(c.dim(`    loginctl enable-linger ${process.env.USER || '$USER'}\n`));
  } catch (err) {
    console.log(c.yellow(`Created service file at ${serviceFile}, but could not auto-enable:`));
    console.log(c.dim('Run manually:'));
    console.log(`    systemctl --user daemon-reload`);
    console.log(`    systemctl --user enable --now budgetflow.service`);
  }
}
