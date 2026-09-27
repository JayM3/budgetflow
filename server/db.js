import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'budgetflow.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

const DEFAULT_STATE = {
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
    { id: 'cat_2', name: 'Rent', allocated: 0, spent: 0, color: '#3b82f6', icon: 'Home' },
    { id: 'cat_3', name: 'Transport & Fuel', allocated: 0, spent: 0, color: '#f59e0b', icon: 'Car' },
    { id: 'cat_4', name: 'Utilities', allocated: 0, spent: 0, color: '#8b5cf6', icon: 'Zap' },
  ],
  transactions: [],
  bills: [],
  goals: [],
  activityLogs: [],
  merchantRules: {},
};

export class Database {
  constructor() {
    this.ensureDirs();
    this.data = this.loadData();
  }

  ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  loadData() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return { ...DEFAULT_STATE, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('Failed to read database, falling back to defaults:', err.message);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  /**
   * Atomic file save to prevent corruption on sudden power loss (Termux / tablet)
   */
  save() {
    try {
      const tmpFile = `${DB_FILE}.${Date.now()}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Atomic write failed:', err);
    }
  }

  getState() {
    return this.data;
  }

  setState(newData) {
    this.data = { ...this.data, ...newData };
    this.save();
    return this.data;
  }

  // Backup
  createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(this.data, null, 2), 'utf-8');
    return backupFile;
  }
}

export const db = new Database();
