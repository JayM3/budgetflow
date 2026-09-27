import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { c, colors, printBox, confirm } from './ui.js';
import { ROOT_DIR, DATA_DIR, getStoredPid, isProcessRunning, stopServer, startServer } from './processManager.js';

export const DB_FILE = path.join(DATA_DIR, 'budgetflow.json');
export const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export const DEFAULT_CLEAN_STATE = {
  householdSettings: {
    householdName: '',
    currency: 'NOK',
    currencySymbol: 'kr',
    isSetupCompleted: false,
  },
  users: [],
  wallets: [],
  categories: [
    { id: 'cat_1', name: 'Groceries', allocated: 0, spent: 0, color: '#10b981', icon: 'ShoppingBag' },
    { id: 'cat_2', name: 'Housing & Utilities', allocated: 0, spent: 0, color: '#0d9488', icon: 'Home' },
    { id: 'cat_3', name: 'Transport & Fuel', allocated: 0, spent: 0, color: '#f59e0b', icon: 'Car' },
    { id: 'cat_4', name: 'Dining & Entertainment', allocated: 0, spent: 0, color: '#ec4899', icon: 'Coffee' },
    { id: 'cat_5', name: 'Health & Personal', allocated: 0, spent: 0, color: '#8b5cf6', icon: 'Heart' },
  ],
  transactions: [],
  bills: [],
  goals: [],
  merchantRules: {},
};

/**
 * Ensure directories exist
 */
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Create a timestamped backup snapshot
 */
export function createBackup(tag = 'manual', customDir = null) {
  ensureDirs();
  const targetDir = customDir ? path.resolve(customDir) : BACKUP_DIR;
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${tag}-${timestamp}.json`;
  const targetPath = path.join(targetDir, filename);

  let currentData = DEFAULT_CLEAN_STATE;
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      currentData = JSON.parse(raw);
    } catch (_) {}
  }

  fs.writeFileSync(targetPath, JSON.stringify(currentData, null, 2), 'utf-8');
  return { path: targetPath, filename, size: fs.statSync(targetPath).size };
}

/**
 * Execute factory wipe and reset
 */
export async function wipeData(options = {}) {
  const force = options.yes || false;
  const noBackup = options.noBackup || false;
  const reinstall = options.reinstall || false;

  console.log('');
  console.log(c.warning('================================================================'));
  console.log(c.warning('                 🌊 BUDGETFLOW FACTORY RESET                   '));
  console.log(c.warning('================================================================'));
  console.log(c.yellow('This will completely wipe all household data, wallets, users,'));
  console.log(c.yellow('and transactions, resetting BudgetFlow to the Initial Setup state.'));
  console.log('');

  if (!force) {
    const agreed = await confirm(c.bold('Are you absolutely sure you want to wipe all data?'), false);
    if (!agreed) {
      console.log(c.dim('Factory reset aborted by user. No changes were made.'));
      return;
    }
  }

  // 1. Check if server is currently running
  const pid = getStoredPid();
  const wasRunning = pid ? isProcessRunning(pid) : false;

  if (wasRunning) {
    console.log(c.dim('Stopping active BudgetFlow server before resetting...'));
    await stopServer({ silent: true });
  }

  // 2. Automated Safety Snapshot
  ensureDirs();
  let backupInfo = null;
  if (!noBackup) {
    console.log(c.cyan('Creating automated pre-wipe safety backup...'));
    backupInfo = createBackup('pre-wipe');
    console.log(c.success(`Safety snapshot saved to: ${c.dim(backupInfo.path)}`));
  } else {
    console.log(c.yellow('Skipping safety backup (--no-backup passed).'));
  }

  // 3. Reset Database to Clean State
  console.log(c.cyan('Resetting database to initial clean state...'));
  fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_CLEAN_STATE, null, 2), 'utf-8');

  // 4. Reinstall dependencies and rebuild if requested
  if (reinstall) {
    console.log(c.cyan('Reinstalling dependencies and rebuilding production client...'));
    try {
      execSync('npm install', { cwd: ROOT_DIR, stdio: 'inherit' });
      execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
      const serverDir = path.join(ROOT_DIR, 'server');
      execSync('npm install', { cwd: serverDir, stdio: 'inherit' });
      console.log(c.success('Reinstallation & rebuild completed successfully.'));
    } catch (err) {
      console.error(c.error(`Failed to reinstall/rebuild: ${err.message}`));
    }
  }

  // 5. Restart server if it was running before wipe
  if (wasRunning) {
    console.log(c.cyan('Restarting BudgetFlow Hub server...'));
    await startServer();
  }

  console.log('');
  printBox('🎉 FACTORY RESET COMPLETE', [
    `${c.green('✓ All household data, users, and transactions wiped.')}`,
    `${c.green('✓ Database reset to clean slate ($0 balances, initial categories).')}`,
    backupInfo ? `${c.dim('Safety Backup: ' + backupInfo.path)}` : '',
    '',
    `${c.bold('Next Step:')} Launch BudgetFlow to begin the Initial Setup Wizard:`,
    `${c.cyan('    budgetflow start')}`,
  ].filter(Boolean), colors.green);
  console.log('');
}

/**
 * Restore data from a backup snapshot
 */
export async function restoreBackup(filePath, options = {}) {
  const force = options.yes || false;
  if (!filePath) {
    console.error(c.error('Error: Please specify the backup file path.'));
    console.log(c.dim('Example: budgetflow restore server/data/backups/backup-manual-...json'));
    return;
  }

  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(c.error(`Backup file not found at: ${fullPath}`));
    return;
  }

  let parsed = null;
  try {
    const raw = fs.readFileSync(fullPath, 'utf-8');
    parsed = JSON.parse(raw);
    if (!parsed.householdSettings || !Array.isArray(parsed.categories)) {
      throw new Error('Missing core BudgetFlow schema fields');
    }
  } catch (err) {
    console.error(c.error(`Invalid backup file: ${err.message}`));
    return;
  }

  if (!force) {
    const ok = await confirm(c.bold(`Restore database from ${path.basename(fullPath)}? This will overwrite current data.`), false);
    if (!ok) {
      console.log(c.dim('Restore cancelled.'));
      return;
    }
  }

  const pid = getStoredPid();
  const wasRunning = pid ? isProcessRunning(pid) : false;
  if (wasRunning) {
    await stopServer({ silent: true });
  }

  ensureDirs();
  fs.copyFileSync(fullPath, DB_FILE);
  console.log(c.success(`Database restored successfully from: ${fullPath}`));

  if (wasRunning) {
    await startServer();
  }
}

/**
 * Export data to JSON or CSV
 */
export function exportData(format = 'json', outputPath = null) {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    console.error(c.error('Database file does not exist yet.'));
    return;
  }

  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  const data = JSON.parse(raw);

  let outputString = '';
  if (format.toLowerCase() === 'csv') {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type', 'WalletId', 'UserId'];
    const rows = (data.transactions || []).map((t) => [
      t.date || '',
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.amount || 0,
      t.type || 'expense',
      t.walletId || '',
      t.userId || '',
    ]);

    outputString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  } else {
    outputString = JSON.stringify(data, null, 2);
  }

  if (outputPath) {
    const resolved = path.resolve(outputPath);
    fs.writeFileSync(resolved, outputString, 'utf-8');
    console.log(c.success(`Exported ${format.toUpperCase()} data to: ${resolved}`));
  } else {
    process.stdout.write(outputString + '\n');
  }
}
