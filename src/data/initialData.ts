import {
  BudgetCategory,
  Transaction,
  Bill,
  SavingsGoal,
  Wallet,
  UserPreferences,
  FamilyUser,
  HouseholdSettings,
} from '../types/finance';

/* =========================================================
   CLEAN SLATE DEFAULTS (Start from 0 on fresh install)
   ========================================================= */

export const initialHouseholdSettings: HouseholdSettings = {
  householdName: '',
  currency: 'NOK',
  currencySymbol: 'kr',
  isSetupCompleted: false,
};

export const initialFamilyUsers: FamilyUser[] = [];

export const initialPreferences: UserPreferences = {
  userName: 'Admin',
  currency: 'NOK',
  currencySymbol: 'kr',
  selectedMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
};

export const initialCategories: BudgetCategory[] = [
  { id: 'groceries', name: 'Groceries', allocated: 0, spent: 0, color: '#10B981', icon: 'ShoppingBag' },
  { id: 'rent', name: 'Rent', allocated: 0, spent: 0, color: '#3B82F6', icon: 'Home' },
  { id: 'transport', name: 'Transport & Fuel', allocated: 0, spent: 0, color: '#F97316', icon: 'Car' },
  { id: 'utilities', name: 'Utilities', allocated: 0, spent: 0, color: '#8B5CF6', icon: 'Zap' },
];

export const initialTransactions: Transaction[] = [];
export const initialBills: Bill[] = [];
export const initialGoals: SavingsGoal[] = [];
export const initialWallets: Wallet[] = [];

/* =========================================================
   STATIC DEMO SHOWCASE DATA (Exclusively for GitHub Pages *.github.io)
   ========================================================= */

export const demoHouseholdSettings: HouseholdSettings = {
  householdName: 'Carter Family Hub',
  currency: 'USD',
  currencySymbol: '$',
  isSetupCompleted: true,
};

export const demoFamilyUsers: FamilyUser[] = [
  {
    id: 'user-alex',
    name: 'Alex Carter',
    role: 'admin',
    avatar: '👑',
    color: '#0d9488',
    patternSequence: [0, 1, 2, 4],
    allowedWalletIds: [],
    permissions: {
      canAddBills: true,
      canAddGoals: true,
      canEditBudgets: true,
      canViewHouseholdReports: true,
    },
  },
  {
    id: 'user-jamie',
    name: 'Jamie Carter',
    role: 'admin',
    avatar: '🦁',
    color: '#0284c7',
    patternSequence: [0, 1, 2, 5],
    allowedWalletIds: [],
    permissions: {
      canAddBills: true,
      canAddGoals: true,
      canEditBudgets: true,
      canViewHouseholdReports: true,
    },
  },
  {
    id: 'user-sam',
    name: 'Sam Carter (Teen)',
    role: 'member',
    avatar: '🧑‍🎓',
    color: '#8b5cf6',
    patternSequence: [0, 3, 6, 7],
    allowedWalletIds: ['w-cash'],
    permissions: {
      canAddBills: true,
      canAddGoals: false,
      canEditBudgets: false,
      canViewHouseholdReports: false,
    },
  },
];

export const demoPreferences: UserPreferences = {
  userName: 'Alex Carter',
  currency: 'USD',
  currencySymbol: '$',
  selectedMonth: 'November 2024',
};

export const demoCategories: BudgetCategory[] = [
  { id: 'groceries', name: 'Groceries', allocated: 800, spent: 620, color: '#10B981', icon: 'ShoppingBag' },
  { id: 'rent', name: 'Rent', allocated: 1200, spent: 1200, color: '#3B82F6', icon: 'Home' },
  { id: 'transport', name: 'Transport & Fuel', allocated: 450, spent: 320, color: '#F97316', icon: 'Car' },
  { id: 'utilities', name: 'Utilities', allocated: 350, spent: 260, color: '#8B5CF6', icon: 'Zap' },
];

export const demoTransactions: Transaction[] = [
  {
    id: 'tx-1',
    merchant: 'Whole Foods',
    category: 'Groceries',
    date: '2024-11-10T14:32:00',
    createdAt: '2024-11-10T14:32:00.000Z',
    amount: 72.34,
    type: 'expense',
    walletId: 'w-cc',
    notes: 'Weekly fresh produce & pantry items',
    userId: 'user-alex',
    userName: 'Alex Carter',
  },
  {
    id: 'tx-2',
    merchant: 'Spotify',
    category: 'Utilities',
    date: '2024-11-09T09:15:00',
    createdAt: '2024-11-09T09:15:00.000Z',
    amount: 9.99,
    type: 'expense',
    walletId: 'w-check',
    notes: 'Monthly family subscription',
    isRecurring: true,
    userId: 'user-jamie',
    userName: 'Jamie Carter',
  },
  {
    id: 'tx-3',
    merchant: 'Uber',
    category: 'Transport & Fuel',
    date: '2024-11-08T18:45:00',
    createdAt: '2024-11-08T18:45:00.000Z',
    amount: 18.50,
    type: 'expense',
    walletId: 'w-cc',
    notes: 'Ride downtown for client meeting',
    userId: 'user-alex',
    userName: 'Alex Carter',
  },
  {
    id: 'tx-4',
    merchant: 'City Power',
    category: 'Utilities',
    date: '2024-11-05T11:20:00',
    createdAt: '2024-11-05T11:20:00.000Z',
    amount: 120.00,
    type: 'expense',
    walletId: 'w-check',
    notes: 'Monthly electric & water bill',
    isRecurring: true,
    userId: 'user-alex',
    userName: 'Alex Carter',
  },
  {
    id: 'tx-5',
    merchant: 'Salary Deposit',
    category: 'Income',
    date: '2024-11-01T08:00:00',
    createdAt: '2024-11-01T08:00:00.000Z',
    amount: 4200.00,
    type: 'income',
    walletId: 'w-check',
    notes: 'Direct monthly payroll deposit',
    isRecurring: true,
    userId: 'user-alex',
    userName: 'Alex Carter',
  },
  {
    id: 'tx-6',
    merchant: 'Metro Properties',
    category: 'Rent',
    date: '2024-11-01T10:00:00',
    createdAt: '2024-11-01T10:00:00.000Z',
    amount: 1200.00,
    type: 'expense',
    walletId: 'w-check',
    notes: 'November apartment rent',
    isRecurring: true,
    userId: 'user-jamie',
    userName: 'Jamie Carter',
  },
  {
    id: 'tx-7',
    merchant: "Trader Joe's",
    category: 'Groceries',
    date: '2024-11-03T16:10:00',
    createdAt: '2024-11-03T16:10:00.000Z',
    amount: 185.20,
    type: 'expense',
    walletId: 'w-cc',
    userId: 'user-alex',
    userName: 'Alex Carter',
  },
  {
    id: 'tx-8',
    merchant: 'Shell Gas Station',
    category: 'Transport & Fuel',
    date: '2024-11-04T12:05:00',
    createdAt: '2024-11-04T12:05:00.000Z',
    amount: 45.00,
    type: 'expense',
    walletId: 'w-cc',
    userId: 'user-jamie',
    userName: 'Jamie Carter',
  },
];

export const demoBills: Bill[] = [
  {
    id: 'b-1',
    name: 'City Power & Light',
    amount: 140.00,
    dueDate: '2024-11-20',
    category: 'Utilities',
    isPaid: false,
    autoPay: true,
    frequency: 'monthly',
    type: 'bill',
    walletId: 'w-check',
  },
  {
    id: 'b-2',
    name: 'Fiber Internet 1Gbps',
    amount: 60.00,
    dueDate: '2024-11-24',
    category: 'Utilities',
    isPaid: false,
    autoPay: true,
    frequency: 'monthly',
    type: 'bill',
    walletId: 'w-check',
  },
  {
    id: 'b-3',
    name: 'Car Insurance (Geico)',
    amount: 220.00,
    dueDate: '2024-11-28',
    category: 'Transport & Fuel',
    isPaid: false,
    autoPay: false,
    frequency: 'monthly',
    type: 'bill',
    walletId: 'w-check',
  },
  {
    id: 'b-4',
    name: 'Spotify Premium',
    amount: 9.99,
    dueDate: '2024-11-09',
    category: 'Utilities',
    isPaid: true,
    autoPay: true,
    frequency: 'monthly',
    type: 'bill',
    walletId: 'w-check',
  },
  {
    id: 'b-5',
    name: 'Primary Household Salary',
    amount: 4200.00,
    dueDate: '2024-11-01',
    category: 'Income',
    isPaid: true,
    autoPay: true,
    frequency: 'monthly',
    type: 'income',
    walletId: 'w-check',
  },
];

export const demoGoals: SavingsGoal[] = [
  {
    id: 'g-1',
    name: 'Vacation Fund',
    targetAmount: 5000,
    currentAmount: 3100,
    targetDate: '2025-06-30',
    color: '#0D9488',
    category: 'Travel',
  },
  {
    id: 'g-2',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 8500,
    targetDate: '2025-03-31',
    color: '#8B5CF6',
    category: 'Safety',
  },
  {
    id: 'g-3',
    name: 'New M4 MacBook Pro',
    targetAmount: 2200,
    currentAmount: 1400,
    targetDate: '2025-01-15',
    color: '#3B82F6',
    category: 'Tech',
  },
];

export const demoWallets: Wallet[] = [
  {
    id: 'w-check',
    name: 'Main Checking (Chase)',
    type: 'checking',
    balance: 5420.00,
    color: '#0D9488',
  },
  {
    id: 'w-sav',
    name: 'High Yield Savings (Ally)',
    type: 'savings',
    balance: 13000.00,
    color: '#3B82F6',
  },
  {
    id: 'w-cc',
    name: 'Sapphire Preferred',
    type: 'credit',
    balance: 1200.00,
    limit: 5000.00,
    color: '#6366F1',
  },
  {
    id: 'w-cash',
    name: 'Physical Cash Envelope',
    type: 'cash',
    balance: 180.00,
    color: '#10B981',
  },
];
