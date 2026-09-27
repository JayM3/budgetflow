export type TransactionType = 'income' | 'expense';

export type UserRole = 'admin' | 'member';

export interface UserPermissions {
  canAddBills: boolean;
  canAddGoals: boolean;
  canEditBudgets: boolean;
  canViewHouseholdReports: boolean;
}

export interface FamilyUser {
  id: string;
  name: string;
  role: UserRole;
  avatar: string; // Emoji avatar or icon
  color: string;
  patternSequence?: number[]; // [0..8] dot indices (used locally / client-side)
  patternHash?: string;       // Salted hash stored in DB
  salt?: string;
  allowedWalletIds: string[]; // If empty and admin: all wallets. If member: whitelist.
  permissions: UserPermissions;
}

export interface HouseholdSettings {
  householdName: string;
  currency: string;
  currencySymbol: string;
  isSetupCompleted: boolean;
}

export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  date: string; // ISO YYYY-MM-DD
  amount: number;
  type: TransactionType;
  walletId?: string;
  notes?: string;
  isRecurring?: boolean;
  userId?: string;
  userName?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string; // Hex or Tailwind color
  icon: string;  // Icon identifier
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  category: string;
  isPaid: boolean;
  autoPay: boolean;
  frequency: 'monthly' | 'yearly' | 'weekly';
  paidByUserId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category?: string;
  color: string;
  contributions?: {
    userId: string;
    userName: string;
    amount: number;
    date: string;
  }[];
}

export interface Wallet {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash';
  balance: number;
  limit?: number; // For credit cards
  color: string;
  ownerId?: string; // Optional user owner, or shared household
  isShared?: boolean;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'tip';
  metricDelta?: string;
}

export interface UserPreferences {
  userName: string;
  currency: string;
  currencySymbol: string;
  selectedMonth: string;
}

export type GuideId = 
  | 'safe-to-spend' 
  | 'envelope-budget' 
  | 'what-if' 
  | 'savings-jars' 
  | 'pattern-lock' 
  | 'tablet-mode' 
  | 'family-wallets';

export interface GuideTopic {
  id: GuideId;
  title: string;
  subtitle: string;
  badge: string;
  concept: string;
  steps: string[];
  proTip: string;
}
