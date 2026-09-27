import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('\x1b[36m%s\x1b[0m', '🌊 Starting BudgetFlow Family Hub (Backend + Vite Frontend)...\n');

// 1. Start Node.js Backend Server
const serverProcess = spawn('node', ['server/server.js'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

// 2. Start Vite Dev Server
const isWin = process.platform === 'win32';
const viteCmd = isWin ? 'npx.cmd' : 'npx';
const viteProcess = spawn(viteCmd, ['vite'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  shell: isWin,
});

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', 'Stopping BudgetFlow dev servers...');
  try {
    if (serverProcess && !serverProcess.killed) {
      if (isWin) {
        spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t'], { stdio: 'ignore' });
      } else {
        serverProcess.kill('SIGTERM');
      }
    }
  } catch (_) {}

  try {
    if (viteProcess && !viteProcess.killed) {
      if (isWin) {
        spawn('taskkill', ['/pid', String(viteProcess.pid), '/f', '/t'], { stdio: 'ignore' });
      } else {
        viteProcess.kill('SIGTERM');
      }
    }
  } catch (_) {}

  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
