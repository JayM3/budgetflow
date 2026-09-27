import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Transaction,
  BudgetCategory,
  Bill,
  SavingsGoal,
  Wallet,
  UserPreferences,
  Insight,
  FamilyUser,
  HouseholdSettings,
  GuideId,
  ActivityLog,
} from '../types/finance';
import {
  initialCategories,
  initialTransactions,
  initialBills,
  initialGoals,
  initialWallets,
  initialPreferences,
  initialFamilyUsers,
  initialHouseholdSettings,
  demoCategories,
  demoTransactions,
  demoBills,
  demoGoals,
  demoWallets,
  demoPreferences,
  demoFamilyUsers,
  demoHouseholdSettings,
} from '../data/initialData';
import { isGitHubPages } from '../utils/env';
import {
  calculateSafeToSpend,
  generateAlgorithmicInsights,
  SafeToSpendMetrics,
} from '../utils/insightsEngine';
import { saveLearnedMerchant } from '../utils/merchantRules';
import { api, ServerStatus } from '../services/api';
import { getTodayISO, calculateNextDueDate, advanceDueDateToFuture } from '../utils/formatters';

export type ActiveView = 
  | 'dashboard'
  | 'budgets'
  | 'transactions'
  | 'bills'
  | 'goals'
  | 'reports'
  | 'wallets'
  | 'family'
  | 'settings';

export const VALID_VIEWS: readonly ActiveView[] = [
  'dashboard',
  'budgets',
  'transactions',
  'bills',
  'goals',
  'reports',
  'wallets',
  'family',
  'settings',
] as const;

export const isValidView = (val: unknown): val is ActiveView => {
  return typeof val === 'string' && VALID_VIEWS.includes(val as ActiveView);
};

interface FinanceContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  isWhatIfOpen: boolean;
  setIsWhatIfOpen: (open: boolean) => void;
  isCsvImportOpen: boolean;
  setIsCsvImportOpen: (open: boolean) => void;
  isAddRecurringOpen: boolean;
  setIsAddRecurringOpen: (open: boolean) => void;

  // Environment & Modes
  isSelfHosted: boolean;
  serverStatus: ServerStatus | null;
  isTabletMode: boolean;
  setIsTabletMode: (mode: boolean) => void;

  // Household & Multi-User State
  householdSettings: HouseholdSettings;
  familyUsers: FamilyUser[];
  currentUser: FamilyUser | null;
  setCurrentUser: (user: FamilyUser | null) => void;
  isUserSelectModalOpen: boolean;
  setIsUserSelectModalOpen: (open: boolean) => void;
  isInitialSetupModalOpen: boolean;
  setIsInitialSetupModalOpen: (open: boolean) => void;

  // Contextual Guides
  activeGuideId: GuideId | null;
  setIsGuideOpenWithId: (id: GuideId | null) => void;

  // Financial Data
  preferences: UserPreferences;
  categories: BudgetCategory[];
  transactions: Transaction[];
  bills: Bill[];
  allBills: Bill[];
  goals: SavingsGoal[];
  wallets: Wallet[];
  allWallets: Wallet[]; // Unfiltered for Admin view

  // Computed values
  totalBudget: number;
  totalSpent: number;
  totalIncome: number;
  remainingBudget: number;
  spentPercentage: number;
  savingsRate: number;
  safeToSpendMetrics: SafeToSpendMetrics;
  insights: Insight[];
  upcomingBillsCount: number;
  upcomingBillsTotal: number;
  emergencyFundAmount: number;
  creditUtilizationPercent: number;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (tx: Transaction) => void;
  toggleBillPaid: (billId: string) => void;
  checkAndProcessDueBills: () => void;
  updateCategoryAllocation: (categoryId: string, amount: number) => void;
  rebalanceCategories: (fromCategoryId: string, toCategoryId: string, amount: number) => void;
  createCategory: (cat: Omit<BudgetCategory, 'id'>) => void;
  updateCategory: (cat: BudgetCategory) => void;
  deleteCategory: (id: string) => void;
  addBill: (bill: Omit<Bill, 'id'>) => void;
  updateBill: (bill: Bill) => void;
  deleteBill: (id: string) => void;
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (goal: SavingsGoal) => void;
  deleteGoal: (id: string) => void;
  addWallet: (wallet: Omit<Wallet, 'id'>) => void;
  updateWallet: (wallet: Wallet) => void;
  deleteWallet: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, sourceWalletId?: string, note?: string) => void;
  bulkImportTransactions: (newTxs: Omit<Transaction, 'id'>[]) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetToDemoData: () => void;
  clearToFreshSlate: () => void;
  exportDataJson: () => void;
  importDataJson: (jsonStr: string) => boolean;
  triggerConfetti: () => void;

  // Global Calendar & Activity Audit Logs
  isCalendarModalOpen: boolean;
  setIsCalendarModalOpen: (open: boolean) => void;
  isActivityLogOpen: boolean;
  setIsActivityLogOpen: (open: boolean) => void;
  activityLogs: ActivityLog[];
  logActivity: (action: ActivityLog['action'], entity: ActivityLog['entity'], description: string, details?: any) => void;

  // Family Management Actions
  addFamilyUser: (user: Omit<FamilyUser, 'id'>) => void;
  updateFamilyUser: (user: FamilyUser) => void | Promise<void>;
  deleteFamilyUser: (id: string) => void | Promise<void>;
  switchUser: (user: FamilyUser) => void | Promise<void>;
  logoutUser: () => void;
  completeInitialSetup: (data: {
    householdName: string;
    currency: string;
    currencySymbol: string;
    adminUser: FamilyUser;
    initialWallets: Wallet[];
  }) => void;
  registerMember: (data: {
    name: string;
    avatar: string;
    color: string;
    patternSequence: number[];
  }) => Promise<{ success: boolean; error?: string }>;

  // Leftover & Goal Allocation
  calculateLeftoverSurplus: () => number;
  allocateToGoals: (params: {
    totalAmount: number;
    source: 'income' | 'month_end' | 'manual';
    sourceWalletId?: string;
    goalAllocations?: { goalId: string; amount: number; targetWalletId?: string }[];
    note?: string;
  }) => void;
  isSmartAllocationOpen: boolean;
  setIsSmartAllocationOpen: (open: boolean) => void;
  smartAllocationConfig: {
    defaultAmount: number;
    source: 'income' | 'month_end' | 'manual';
    sourceWalletId?: string;
    title: string;
    subtitle: string;
  };
  openSmartAllocation: (config: {
    defaultAmount: number;
    source: 'income' | 'month_end' | 'manual';
    sourceWalletId?: string;
    title?: string;
    subtitle?: string;
  }) => void;
  closeSmartAllocation: () => void;

  // In-Memory Data Refresh (No Hard Reload)
  isRefreshing: boolean;
  refreshData: () => Promise<void>;

  // Data Persistence & Manual Tab Saves
  saveAll: () => Promise<boolean>;
  saveBudgetsState: () => Promise<boolean>;
  saveTransactionsState: () => Promise<boolean>;
  saveBillsState: () => Promise<boolean>;
  saveGoalsState: () => Promise<boolean>;
  saveWalletsState: () => Promise<boolean>;
  saveFamilyUsersState: () => Promise<boolean>;
}


const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const LS_PREFIX = 'budgetflow_state_';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    try {
      const saved = localStorage.getItem(LS_PREFIX + 'activeView');
      if (saved && isValidView(saved)) {
        return saved;
      }
      return 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [isTabletMode, setIsTabletMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_PREFIX + 'isTabletMode') === 'true';
    } catch {
      return false;
    }
  });
  const [activeGuideId, setActiveGuideId] = useState<GuideId | null>(null);

  // Smart Allocation Modal State
  const [isSmartAllocationOpen, setIsSmartAllocationOpen] = useState<boolean>(false);
  const [smartAllocationConfig, setSmartAllocationConfig] = useState<{
    defaultAmount: number;
    source: 'income' | 'month_end' | 'manual';
    sourceWalletId?: string;
    title: string;
    subtitle: string;
  }>({
    defaultAmount: 0,
    source: 'month_end',
    sourceWalletId: undefined,
    title: 'Smart Savings Allocation',
    subtitle: 'Distribute funds into your savings jars based on your goal allocation percentages.',
  });

  const openSmartAllocation = (config: {
    defaultAmount: number;
    source: 'income' | 'month_end' | 'manual';
    sourceWalletId?: string;
    title?: string;
    subtitle?: string;
  }) => {
    setSmartAllocationConfig({
      defaultAmount: config.defaultAmount,
      source: config.source,
      sourceWalletId: config.sourceWalletId,
      title: config.title || (config.source === 'income' ? 'Income Received • Allocate to Goals' : 'Month-End Surplus Sweep'),
      subtitle: config.subtitle || 'Distribute funds into your savings jars based on your goal allocation percentages.',
    });
    setIsSmartAllocationOpen(true);
  };

  const closeSmartAllocation = () => {
    setIsSmartAllocationOpen(false);
  };

  // Self-Hosted / Server Status Detection
  const [isSelfHosted, setIsSelfHosted] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [isInitialSetupModalOpen, setIsInitialSetupModalOpen] = useState<boolean>(false);
  const [isUserSelectModalOpen, setIsUserSelectModalOpen] = useState<boolean>(false);

  const isGHP = isGitHubPages();

  // Household Settings
  const [householdSettings, setHouseholdSettings] = useState<HouseholdSettings>(() => {
    try {
      const saved = localStorage.getItem(LS_PREFIX + 'household');
      if (saved) return JSON.parse(saved);
      return isGHP ? demoHouseholdSettings : initialHouseholdSettings;
    } catch {
      return initialHouseholdSettings;
    }
  });

  // Family Users
  const [familyUsers, setFamilyUsers] = useState<FamilyUser[]>(() => {
    try {
      const saved = localStorage.getItem(LS_PREFIX + 'familyUsers');
      if (saved) return JSON.parse(saved);
      return isGHP ? demoFamilyUsers : initialFamilyUsers;
    } catch {
      return initialFamilyUsers;
    }
  });

  // Active Current User
  const [currentUser, setCurrentUser] = useState<FamilyUser | null>(() => {
    try {
      const saved = localStorage.getItem(LS_PREFIX + 'currentUser');
      if (saved) return JSON.parse(saved);
      return isGHP ? demoFamilyUsers[0] : null;
    } catch {
      return null;
    }
  });

  // Preferences
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem(LS_PREFIX + 'preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialPreferences,
          ...parsed,
          tabletAutoRefreshEnabled: parsed.tabletAutoRefreshEnabled ?? true,
          tabletRefreshIntervalMinutes: parsed.tabletRefreshIntervalMinutes ?? 5,
        };
      }
      return isGHP ? demoPreferences : initialPreferences;
    } catch {
      return initialPreferences;
    }
  });

  // Categories
  const [categories, setCategories] = useState<BudgetCategory[]>(() => {
    try {
      const saved = localStorage.getItem(LS_PREFIX + 'categories');
      if (saved) return JSON.parse(saved);
      return isGHP ? demoCategories : initialCategories;
    } catch {
      return initialCategories;
    }
  });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(LS_PREFIX + 'transactions');
      if (saved) return JSON.parse(saved);
      return isGHP ? demoTransactions : initialTransactions;
    } catch {
      return initialTransactions;
    }
  });

  // Bills
  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const saved = localStorage.getItem(LS_PREFIX + 'bills');
      if (saved) return JSON.parse(saved);
      return isGHP ? demoBills : initialBills;
    } catch {
      return initialBills;
    }
  });

  // Goals
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem(LS_PREFIX + 'goals');
      if (saved) return JSON.parse(saved);
      return isGHP ? demoGoals : initialGoals;
    } catch {
      return initialGoals;
    }
  });

  // Raw Wallets
  const [allWallets, setAllWallets] = useState<Wallet[]>(() => {
    try {
      const saved = localStorage.getItem(LS_PREFIX + 'wallets');
      if (saved) return JSON.parse(saved);
      return isGHP ? demoWallets : initialWallets;
    } catch {
      return initialWallets;
    }
  });

  // Global Modals State
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Activity Logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(LS_PREFIX + 'activityLogs');
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'activityLogs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Live ref holding latest state to guarantee beforeunload / timer callbacks never access stale closures
  const stateRef = useRef({
    householdSettings,
    familyUsers,
    currentUser,
    preferences,
    categories,
    transactions,
    bills,
    goals,
    allWallets,
    activityLogs,
  });

  useEffect(() => {
    stateRef.current = {
      householdSettings,
      familyUsers,
      currentUser,
      preferences,
      categories,
      transactions,
      bills,
      goals,
      allWallets,
      activityLogs,
    };
  });

  const categoryDebounceTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  // Check backend server status on mount
  useEffect(() => {
    const initServerCheck = async () => {
      const status = await api.checkStatus();
      if (status) {
        setIsSelfHosted(true);
        setServerStatus(status);
        if (!status.isSetupCompleted) {
          setIsInitialSetupModalOpen(true);
        } else {
          // Fetch family members from server
          const remoteUsers = await api.getFamilyUsers();
          if (remoteUsers && remoteUsers.length > 0) {
            setFamilyUsers(remoteUsers);
            const savedUserStr = localStorage.getItem(LS_PREFIX + 'currentUser');
            const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
            if (!savedUser) {
              setCurrentUser(null);
              setIsUserSelectModalOpen(true);
            } else {
              const matchedUser = remoteUsers.find((u: any) => u.id === savedUser.id);
              if (!matchedUser) {
                setCurrentUser(null);
                setIsUserSelectModalOpen(true);
              } else {
                // Ensure currentUser always has the latest role & permissions from the server!
                setCurrentUser(matchedUser);
                localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(matchedUser));
                setPreferences((prev) => ({ ...prev, userName: matchedUser.name }));
              }
            }
          }

          // Fetch full data from server
          const remoteData = await api.getData();
          if (remoteData) {
            if (remoteData.currentUser) {
              setCurrentUser((prev) => {
                const updated = { ...(prev || {}), ...remoteData.currentUser };
                localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(updated));
                return updated;
              });
            }
            if (remoteData.allUsers && remoteData.allUsers.length > 0) {
              setFamilyUsers(remoteData.allUsers);
            }
            if (remoteData.categories && remoteData.categories.length > 0) setCategories(remoteData.categories);
            if (remoteData.wallets && remoteData.wallets.length > 0) setAllWallets(remoteData.wallets);
            if (remoteData.transactions) setTransactions(remoteData.transactions);
            if (remoteData.bills) setBills(remoteData.bills);
            if (remoteData.goals) setGoals(remoteData.goals);
            if (remoteData.activityLogs) setActivityLogs(remoteData.activityLogs);
          }
        }
      } else {
        // Standalone / Static mode
        if (!isGitHubPages()) {
          const savedHousehold = localStorage.getItem(LS_PREFIX + 'household');
          const isSetup = savedHousehold ? JSON.parse(savedHousehold).isSetupCompleted : false;
          if (!isSetup) {
            setIsInitialSetupModalOpen(true);
          } else {
            const savedUserStr = localStorage.getItem(LS_PREFIX + 'currentUser');
            if (!savedUserStr) {
              setIsUserSelectModalOpen(true);
            } else {
              try {
                const savedUser = JSON.parse(savedUserStr);
                const matchedUser = familyUsers.find((u) => u.id === savedUser.id);
                if (matchedUser) {
                  setCurrentUser(matchedUser);
                  localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(matchedUser));
                }
              } catch {}
            }
          }
        }
      }
    };
    initServerCheck();
  }, []);

  // Periodic & Focus auto-sync for live household updates (e.g. role promotions, wallet permission changes)
  useEffect(() => {
    if (!isSelfHosted) return;

    let isSubscribed = true;

    const syncLiveUserAndData = async () => {
      try {
        const savedUserStr = localStorage.getItem(LS_PREFIX + 'currentUser');
        if (!savedUserStr) return;
        const currentSaved = JSON.parse(savedUserStr);
        if (!currentSaved?.id) return;

        const remoteUsers = await api.getFamilyUsers();
        if (!isSubscribed || !remoteUsers || remoteUsers.length === 0) return;

        const freshUser = remoteUsers.find((u: any) => u.id === currentSaved.id);
        if (!freshUser) return;

        const roleChanged = freshUser.role !== currentSaved.role;
        const permsChanged = JSON.stringify(freshUser.permissions) !== JSON.stringify(currentSaved.permissions);
        const walletsChanged = JSON.stringify(freshUser.allowedWalletIds) !== JSON.stringify(currentSaved.allowedWalletIds);
        const nameChanged = freshUser.name !== currentSaved.name;

        if (roleChanged || permsChanged || walletsChanged || nameChanged) {
          setFamilyUsers(remoteUsers);
          setCurrentUser(freshUser);
          localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(freshUser));
          setPreferences((prev) => ({ ...prev, userName: freshUser.name }));

          // Refresh dataset with updated role privileges
          const remoteData = await api.getData();
          if (isSubscribed && remoteData) {
            if (remoteData.wallets) setAllWallets(remoteData.wallets);
            if (remoteData.transactions) setTransactions(remoteData.transactions);
            if (remoteData.bills) setBills(remoteData.bills);
            if (remoteData.goals) setGoals(remoteData.goals);
            if (remoteData.categories) setCategories(remoteData.categories);
            if (remoteData.activityLogs) setActivityLogs(remoteData.activityLogs);
          }
        }
      } catch (err) {
        // Silent background sync
      }
    };

    const handleFocus = () => syncLiveUserAndData();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncLiveUserAndData();
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LS_PREFIX + 'currentUser' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setCurrentUser(parsed);
        } catch {}
      } else if (e.key === LS_PREFIX + 'familyUsers' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setFamilyUsers(parsed);
        } catch {}
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleStorage);

    const interval = setInterval(syncLiveUserAndData, 5000);

    return () => {
      isSubscribed = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [isSelfHosted]);

  // Recurring Commitments Auto-Check:
  // Automatically check due bills & recurring income on scheduled date, spawning the next cycle
  useEffect(() => {
    // Check shortly after mount to allow initial remote/local sync to settle
    const initialTimer = setTimeout(() => {
      checkAndProcessDueBills();
    }, 600);

    // Periodically check every 30 seconds
    const recurringInterval = setInterval(() => {
      checkAndProcessDueBills();
    }, 30000);

    const handleFocusCheck = () => {
      checkAndProcessDueBills();
    };

    window.addEventListener('focus', handleFocusCheck);
    document.addEventListener('visibilitychange', handleFocusCheck);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(recurringInterval);
      window.removeEventListener('focus', handleFocusCheck);
      document.removeEventListener('visibilitychange', handleFocusCheck);
    };
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'household', JSON.stringify(householdSettings));
  }, [householdSettings]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'familyUsers', JSON.stringify(familyUsers));
  }, [familyUsers]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(LS_PREFIX + 'wallets', JSON.stringify(allWallets));
  }, [allWallets]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_PREFIX + 'activeView', activeView);
    } catch (e) {
      console.error('Failed to save activeView to localStorage', e);
    }
  }, [activeView]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_PREFIX + 'isTabletMode', String(isTabletMode));
    } catch (e) {
      console.error('Failed to save isTabletMode to localStorage', e);
    }
  }, [isTabletMode]);

  // Universal full-state save function
  const saveAll = async (): Promise<boolean> => {
    const current = stateRef.current;
    try {
      localStorage.setItem(LS_PREFIX + 'household', JSON.stringify(current.householdSettings));
      localStorage.setItem(LS_PREFIX + 'familyUsers', JSON.stringify(current.familyUsers));
      localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(current.currentUser));
      localStorage.setItem(LS_PREFIX + 'preferences', JSON.stringify(current.preferences));
      localStorage.setItem(LS_PREFIX + 'categories', JSON.stringify(current.categories));
      localStorage.setItem(LS_PREFIX + 'transactions', JSON.stringify(current.transactions));
      localStorage.setItem(LS_PREFIX + 'bills', JSON.stringify(current.bills));
      localStorage.setItem(LS_PREFIX + 'goals', JSON.stringify(current.goals));
      localStorage.setItem(LS_PREFIX + 'wallets', JSON.stringify(current.allWallets));
      localStorage.setItem(LS_PREFIX + 'activityLogs', JSON.stringify(current.activityLogs));
    } catch (e) {
      console.error('Failed to sync to localStorage', e);
    }

    if (isSelfHosted) {
      const payload = {
        householdSettings: current.householdSettings,
        users: current.familyUsers,
        preferences: current.preferences,
        categories: current.categories,
        transactions: current.transactions,
        bills: current.bills,
        goals: current.goals,
        wallets: current.allWallets,
        activityLogs: current.activityLogs,
      };
      const res = await api.saveAll(payload);
      return res.success;
    }
    return true;
  };

  const saveBudgetsState = async (): Promise<boolean> => {
    const currentCats = stateRef.current.categories;
    try {
      localStorage.setItem(LS_PREFIX + 'categories', JSON.stringify(currentCats));
    } catch (_) {}
    if (isSelfHosted) {
      const ok = await api.saveCategories(currentCats);
      if (!ok) {
        return await saveAll();
      }
      return ok;
    }
    return true;
  };

  const saveTransactionsState = async (): Promise<boolean> => {
    return await saveAll();
  };

  const saveBillsState = async (): Promise<boolean> => {
    return await saveAll();
  };

  const saveGoalsState = async (): Promise<boolean> => {
    return await saveAll();
  };

  const saveWalletsState = async (): Promise<boolean> => {
    return await saveAll();
  };

  const saveFamilyUsersState = async (): Promise<boolean> => {
    return await saveAll();
  };

  // Hard reload (F5 / browser refresh) & window unload listener to automatically save all values
  useEffect(() => {
    const handleBeforeUnload = () => {
      const current = stateRef.current;
      try {
        localStorage.setItem(LS_PREFIX + 'household', JSON.stringify(current.householdSettings));
        localStorage.setItem(LS_PREFIX + 'familyUsers', JSON.stringify(current.familyUsers));
        localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(current.currentUser));
        localStorage.setItem(LS_PREFIX + 'preferences', JSON.stringify(current.preferences));
        localStorage.setItem(LS_PREFIX + 'categories', JSON.stringify(current.categories));
        localStorage.setItem(LS_PREFIX + 'transactions', JSON.stringify(current.transactions));
        localStorage.setItem(LS_PREFIX + 'bills', JSON.stringify(current.bills));
        localStorage.setItem(LS_PREFIX + 'goals', JSON.stringify(current.goals));
        localStorage.setItem(LS_PREFIX + 'wallets', JSON.stringify(current.allWallets));
        localStorage.setItem(LS_PREFIX + 'activityLogs', JSON.stringify(current.activityLogs));
      } catch (_) {}

      if (isSelfHosted) {
        api.saveAllKeepAlive({
          householdSettings: current.householdSettings,
          users: current.familyUsers,
          preferences: current.preferences,
          categories: current.categories,
          transactions: current.transactions,
          bills: current.bills,
          goals: current.goals,
          wallets: current.allWallets,
          activityLogs: current.activityLogs,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [isSelfHosted]);

  // In-Memory Data Refresh: queries server / local storage without hard page reloads
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // First save all in-memory values so auto-refresh never reverts user modifications!
      await saveAll();
      if (isSelfHosted) {
        const [remoteUsers, remoteData] = await Promise.all([
          api.getFamilyUsers().catch(() => null),
          api.getData().catch(() => null),
        ]);

        if (remoteUsers && remoteUsers.length > 0) {
          setFamilyUsers(remoteUsers);
          const savedUserStr = localStorage.getItem(LS_PREFIX + 'currentUser');
          if (savedUserStr) {
            try {
              const savedUser = JSON.parse(savedUserStr);
              const matched = remoteUsers.find((u: any) => u.id === savedUser.id);
              if (matched) {
                setCurrentUser(matched);
                localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(matched));
                setPreferences((prev) => ({ ...prev, userName: matched.name }));
              }
            } catch (_) {}
          }
        }

        if (remoteData) {
          if (remoteData.householdSettings) {
            setHouseholdSettings(remoteData.householdSettings);
          }
          if (remoteData.currentUser) {
            setCurrentUser((prev) => {
              const updated = { ...(prev || {}), ...remoteData.currentUser };
              localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(updated));
              return updated;
            });
          }
          if (remoteData.allUsers && remoteData.allUsers.length > 0) {
            setFamilyUsers(remoteData.allUsers);
          }
          if (remoteData.categories && remoteData.categories.length > 0) setCategories(remoteData.categories);
          if (remoteData.wallets && remoteData.wallets.length > 0) setAllWallets(remoteData.wallets);
          if (remoteData.transactions) setTransactions(remoteData.transactions);
          if (remoteData.bills) setBills(remoteData.bills);
          if (remoteData.goals) setGoals(remoteData.goals);
          if (remoteData.activityLogs) setActivityLogs(remoteData.activityLogs);
        }
      } else {
        // Standalone / Offline mode: re-read localStorage
        try {
          const cat = localStorage.getItem(LS_PREFIX + 'categories');
          if (cat) setCategories(JSON.parse(cat));
          const tx = localStorage.getItem(LS_PREFIX + 'transactions');
          if (tx) setTransactions(JSON.parse(tx));
          const bl = localStorage.getItem(LS_PREFIX + 'bills');
          if (bl) setBills(JSON.parse(bl));
          const gl = localStorage.getItem(LS_PREFIX + 'goals');
          if (gl) setGoals(JSON.parse(gl));
          const wl = localStorage.getItem(LS_PREFIX + 'wallets');
          if (wl) setAllWallets(JSON.parse(wl));
          const usr = localStorage.getItem(LS_PREFIX + 'familyUsers');
          if (usr) setFamilyUsers(JSON.parse(usr));
        } catch (_) {}
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      // Retain a smooth tactile spinning duration
      setTimeout(() => {
        setIsRefreshing(false);
      }, 450);
    }
  };

  // Wallet Permissions Filter:
  // If currentUser is a member with allowedWalletIds, filter wallets, transactions, and bills
  const wallets = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') {
      return allWallets;
    }
    const allowed = currentUser.allowedWalletIds || [];
    return allWallets.filter((w) => allowed.includes(w.id));
  }, [allWallets, currentUser]);

  const visibleTransactions = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') {
      return transactions;
    }
    const allowedSet = new Set(currentUser.allowedWalletIds || []);
    return transactions.filter(
      (t) => t.walletId && allowedSet.has(t.walletId)
    );
  }, [transactions, currentUser]);

  const visibleBills = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') {
      return bills;
    }
    const allowedSet = new Set(currentUser.allowedWalletIds || []);
    return bills.filter(
      (b) => b.walletId && allowedSet.has(b.walletId)
    );
  }, [bills, currentUser]);

  // Recalculate category spending dynamically
  useEffect(() => {
    setCategories((prevCats) => {
      return prevCats.map((cat) => {
        const catSpent = transactions
          .filter((t) => t.type === 'expense' && t.category.toLowerCase() === cat.name.toLowerCase())
          .reduce((sum, t) => sum + t.amount, 0);

        return { ...cat, spent: Math.round(catSpent) };
      });
    });
  }, [transactions]);

  // Computed totals (dynamic and clean starting from 0)
  const totalBudget = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.allocated || 0), 0);
  }, [categories]);

  const totalSpent = useMemo(() => {
    const raw = visibleTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return Math.round(raw);
  }, [visibleTransactions]);

  const totalIncome = useMemo(() => {
    const raw = visibleTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    return Math.round(raw);
  }, [visibleTransactions]);

  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const spentPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalSpent) / totalIncome) * 100)) : 0;

  const spentThisWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(now.getFullYear(), now.getMonth(), diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const pad = (n: number) => String(n).padStart(2, '0');
    const monISO = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
    const sunISO = `${sun.getFullYear()}-${pad(sun.getMonth() + 1)}-${pad(sun.getDate())}`;

    const raw = visibleTransactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const d = t.date.split('T')[0];
        return d >= monISO && d <= sunISO;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    return Math.round(raw);
  }, [visibleTransactions]);

  const safeToSpendMetrics = useMemo(() => {
    return calculateSafeToSpend(totalBudget, totalSpent, new Date(), spentThisWeek);
  }, [totalBudget, totalSpent, spentThisWeek]);

  const unpaidBills = visibleBills.filter((b) => !b.isPaid && b.type !== 'income');
  const upcomingBillsCount = unpaidBills.length;
  const upcomingBillsTotal = unpaidBills.reduce((acc, b) => acc + b.amount, 0);

  const emergencyGoal = goals.find((g) => g.name.toLowerCase().includes('emergency'));
  const emergencyFundAmount = emergencyGoal ? emergencyGoal.currentAmount : 0;

  const creditCard = wallets.find((w) => w.type === 'credit');
  const creditUtilizationPercent =
    creditCard && creditCard.limit && creditCard.limit > 0
      ? Math.round((creditCard.balance / creditCard.limit) * 100)
      : 0;

  const insights = useMemo(() => {
    return generateAlgorithmicInsights(
      categories,
      bills,
      safeToSpendMetrics,
      creditUtilizationPercent
    );
  }, [categories, bills, safeToSpendMetrics, creditUtilizationPercent]);

  // Keyboard shortcut listener: Ctrl+K or N for quick add
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickAddOpen((prev) => !prev);
      } else if (e.key === 'n' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsQuickAddOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0D9488', '#14B8A6', '#10B981', '#3B82F6', '#F59E0B'],
    });
  };

  const logActivity = (
    action: ActivityLog['action'],
    entity: ActivityLog['entity'],
    description: string,
    details?: any
  ) => {
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id,
      userName: currentUser?.name || 'Admin',
      action,
      entity,
      description,
      details,
    };
    setActivityLogs((prev) => [newLog, ...prev].slice(0, 200));
  };

  // Actions
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const nowIso = new Date().toISOString();
    const todayStr = getTodayISO();
    const txDateStr = (tx.date || nowIso).split('T')[0];
    const isHistorical = tx.alreadyHappened !== undefined ? Boolean(tx.alreadyHappened) : (txDateStr < todayStr);

    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now(),
      date: tx.date || nowIso,
      createdAt: nowIso,
      alreadyHappened: isHistorical,
      userId: tx.userId || currentUser?.id,
      userName: tx.userName || currentUser?.name,
    };

    saveLearnedMerchant(tx.merchant, tx.category);
    setTransactions((prev) => [newTx, ...prev]);

    // Backend sync if self-hosted
    if (isSelfHosted) {
      api.createTransaction(newTx);
    }

    // Update wallet balance ONLY if transaction is not historical / already happened
    if (newTx.walletId && !newTx.alreadyHappened) {
      setAllWallets((prevWallets) =>
        prevWallets.map((w) => {
          if (w.id === newTx.walletId) {
            if (w.type === 'credit') {
              return {
                ...w,
                balance: newTx.type === 'expense' ? w.balance + newTx.amount : w.balance - newTx.amount,
              };
            } else {
              return {
                ...w,
                balance: newTx.type === 'income' ? w.balance + newTx.amount : w.balance - newTx.amount,
              };
            }
          }
          return w;
        })
      );
    }

    logActivity(
      'create',
      'transaction',
      `Added transaction '${newTx.merchant}' (${newTx.amount} ${preferences.currencySymbol})${newTx.alreadyHappened ? ' [Historical - Wallet unchanged]' : ''}`
    );

    // When income arrives, offer smart allocation if goals have % allocation
    if (newTx.type === 'income' && !newTx.alreadyHappened) {
      const activeGoalsWithAlloc = goals.filter((g) => (g.allocationPercentage || 0) > 0);
      if (activeGoalsWithAlloc.length > 0) {
        setTimeout(() => {
          openSmartAllocation({
            defaultAmount: newTx.amount,
            source: 'income',
            sourceWalletId: newTx.walletId,
            title: `Income Received: ${newTx.merchant}`,
            subtitle: `Allocate your savings percentage from this ${newTx.amount} ${preferences.currencySymbol} deposit across your jars.`,
          });
        }, 150);
      }
    }
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (isSelfHosted) {
      api.deleteTransaction(id);
    }

    if (tx.walletId && !tx.alreadyHappened) {
      setAllWallets((prevWallets) =>
        prevWallets.map((w) => {
          if (w.id === tx.walletId) {
            if (w.type === 'credit') {
              return {
                ...w,
                balance: tx.type === 'expense' ? w.balance - tx.amount : w.balance + tx.amount,
              };
            } else {
              return {
                ...w,
                balance: tx.type === 'income' ? w.balance - tx.amount : w.balance + tx.amount,
              };
            }
          }
          return w;
        })
      );
    }

    logActivity('delete', 'transaction', `Deleted transaction '${tx.merchant}'`);
  };

  const updateTransaction = (updatedTx: Transaction) => {
    const oldTx = transactions.find((t) => t.id === updatedTx.id);
    if (!oldTx) return;

    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));

    if (isSelfHosted) {
      api.updateTransaction(updatedTx.id, updatedTx);
    }

    // Reconcile wallet balances for old vs new wallet/amount/type
    setAllWallets((prevWallets) => {
      let next = [...prevWallets];
      if (oldTx.walletId && !oldTx.alreadyHappened) {
        next = next.map((w) => {
          if (w.id === oldTx.walletId) {
            if (w.type === 'credit') {
              return { ...w, balance: oldTx.type === 'expense' ? w.balance - oldTx.amount : w.balance + oldTx.amount };
            } else {
              return { ...w, balance: oldTx.type === 'income' ? w.balance - oldTx.amount : w.balance + oldTx.amount };
            }
          }
          return w;
        });
      }
      if (updatedTx.walletId && !updatedTx.alreadyHappened) {
        next = next.map((w) => {
          if (w.id === updatedTx.walletId) {
            if (w.type === 'credit') {
              return { ...w, balance: updatedTx.type === 'expense' ? w.balance + updatedTx.amount : w.balance - updatedTx.amount };
            } else {
              return { ...w, balance: updatedTx.type === 'income' ? w.balance + updatedTx.amount : w.balance - updatedTx.amount };
            }
          }
          return w;
        });
      }
      return next;
    });

    logActivity('update', 'transaction', `Edited transaction '${updatedTx.merchant}' (${updatedTx.amount} ${preferences.currencySymbol})`);
  };

  const createCategory = (cat: Omit<BudgetCategory, 'id'>) => {
    const newCat: BudgetCategory = {
      ...cat,
      id: 'cat-' + Date.now(),
      spent: 0,
    };
    setCategories((prev) => [...prev, newCat]);
    if (isSelfHosted) {
      api.createCategory(newCat);
    }
    logActivity('create', 'budget', `Created budget envelope '${newCat.name}' (Cap: ${newCat.allocated} ${preferences.currencySymbol})`);
    triggerConfetti();
  };

  const updateCategory = (cat: BudgetCategory) => {
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
    if (isSelfHosted) {
      api.updateCategory(cat.id, cat);
    }
    logActivity('update', 'budget', `Updated budget '${cat.name}' (Cap: ${cat.allocated} ${preferences.currencySymbol})`);
  };

  const deleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (isSelfHosted) {
      api.deleteCategory(id);
    }
    if (cat) {
      logActivity('delete', 'budget', `Removed budget envelope '${cat.name}'`);
    }
  };

  const addBill = (bill: Omit<Bill, 'id'>) => {
    const newBill: Bill = {
      ...bill,
      id: 'bill-' + Date.now(),
      type: bill.type || 'bill',
    };
    setBills((prev) => [...prev, newBill]);
    if (isSelfHosted) {
      api.createBill(newBill);
    }
    logActivity(
      'create',
      'bill',
      `Added ${newBill.type === 'income' ? 'recurring income' : 'bill'} '${newBill.name}' (${newBill.amount} ${preferences.currencySymbol})`
    );
    triggerConfetti();
  };

  const updateBill = (bill: Bill) => {
    setBills((prev) => prev.map((b) => (b.id === bill.id ? bill : b)));
    if (isSelfHosted) {
      api.updateBill(bill.id, bill);
    }
    logActivity(
      'update',
      'bill',
      `Updated ${bill.type === 'income' ? 'recurring income' : 'bill'} '${bill.name}'`
    );
  };

  const deleteBill = (id: string) => {
    const bill = bills.find((b) => b.id === id);
    setBills((prev) => prev.filter((b) => b.id !== id));
    if (isSelfHosted) {
      api.deleteBill(id);
    }
    if (bill) {
      logActivity('delete', 'bill', `Removed ${bill.type === 'income' ? 'recurring income' : 'bill'} '${bill.name}'`);
    }
  };

  const addGoal = (goal: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: 'g-' + Date.now(),
      currentAmount: goal.currentAmount || 0,
      walletId: goal.walletId,
      allocationPercentage: goal.allocationPercentage !== undefined ? Number(goal.allocationPercentage) : 0,
      contributions: [],
    };
    setGoals((prev) => [...prev, newGoal]);
    if (isSelfHosted) {
      api.createGoal(newGoal);
    }
    logActivity('create', 'goal', `Created savings goal '${newGoal.name}' (Target: ${newGoal.targetAmount} ${preferences.currencySymbol})`);
    triggerConfetti();
  };

  const updateGoal = (goal: SavingsGoal) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
    if (isSelfHosted) {
      api.updateGoal(goal.id, goal);
    }
    logActivity('update', 'goal', `Updated savings goal '${goal.name}'`);
  };

  const deleteGoal = (id: string) => {
    const goal = goals.find((g) => g.id === id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    if (isSelfHosted) {
      api.deleteGoal(id);
    }
    if (goal) {
      logActivity('delete', 'goal', `Removed savings goal '${goal.name}'`);
    }
  };

  const addWallet = (wallet: Omit<Wallet, 'id'>) => {
    const newWallet: Wallet = {
      ...wallet,
      id: 'w-' + Date.now(),
      balance: Number(wallet.balance) || 0,
    };
    setAllWallets((prev) => [...prev, newWallet]);
    if (isSelfHosted) {
      api.createWallet(newWallet);
    }
    logActivity('create', 'wallet', `Added new wallet '${newWallet.name}' (Balance: ${newWallet.balance} ${preferences.currencySymbol})`);
    triggerConfetti();
  };

  const updateWallet = (wallet: Wallet) => {
    setAllWallets((prev) => prev.map((w) => (w.id === wallet.id ? wallet : w)));
    if (isSelfHosted) {
      api.updateWallet(wallet.id, wallet);
    }
    logActivity('reconcile', 'wallet', `Reconciled/Updated wallet '${wallet.name}' (Balance: ${wallet.balance} ${preferences.currencySymbol})`);
  };

  const deleteWallet = (id: string) => {
    if (allWallets.length <= 1) return;
    const wallet = allWallets.find((w) => w.id === id);
    setAllWallets((prev) => prev.filter((w) => w.id !== id));
    if (isSelfHosted) {
      api.deleteWallet(id);
    }
    if (wallet) {
      logActivity('delete', 'wallet', `Removed wallet '${wallet.name}'`);
    }
  };

  const isAutoProcessingRef = useRef(false);

  const toggleBillPaid = (billId: string) => {
    const targetBill = stateRef.current.bills.find((b) => b.id === billId);
    if (!targetBill) return;

    const willBePaid = !targetBill.isPaid;
    const todayStr = getTodayISO();

    if (willBePaid) {
      triggerConfetti();

      // 1. Advance due date to the next future scheduled cycle
      const nextDueDate = advanceDueDateToFuture(targetBill.dueDate, targetBill.frequency, todayStr);
      const newBillInstance: Bill = {
        ...targetBill,
        id: 'bill-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        dueDate: nextDueDate,
        isPaid: false,
        paidByUserId: undefined,
      };

      // 2. Mark existing bill paid and append new instance
      setBills((prev) =>
        prev
          .map((b) => (b.id === billId ? { ...b, isPaid: true, paidByUserId: currentUser?.id } : b))
          .concat(newBillInstance)
      );

      // 3. Automatically record the payment transaction in the ledger
      addTransaction({
        merchant: targetBill.name,
        amount: targetBill.amount,
        category: targetBill.type === 'income' ? 'Income' : targetBill.category,
        type: targetBill.type === 'income' ? 'income' : 'expense',
        date: targetBill.dueDate || todayStr,
        walletId: targetBill.walletId || stateRef.current.allWallets[0]?.id,
        notes: `Recorded from recurring ${targetBill.type === 'income' ? 'income' : 'bill'} schedule`,
        isRecurring: true,
      });

      // 4. Log audit activity
      logActivity(
        'pay',
        'bill',
        `Marked ${targetBill.type === 'income' ? 'recurring income' : 'bill'} '${targetBill.name}' paid (${targetBill.amount} ${preferences.currencySymbol}). Next cycle scheduled for ${nextDueDate}.`
      );

      if (isSelfHosted) {
        api.updateBill(targetBill.id, { isPaid: true, paidByUserId: currentUser?.id });
        api.createBill(newBillInstance);
      }
    } else {
      // Uncheck an already paid bill
      setBills((prev) =>
        prev.map((b) => (b.id === billId ? { ...b, isPaid: false, paidByUserId: undefined } : b))
      );
      if (isSelfHosted) {
        api.updateBill(billId, { isPaid: false, paidByUserId: undefined });
      }
      logActivity('update', 'bill', `Unmarked ${targetBill.type === 'income' ? 'recurring income' : 'bill'} '${targetBill.name}'`);
    }
  };

  const checkAndProcessDueBills = () => {
    if (isAutoProcessingRef.current) return;
    const todayStr = getTodayISO();
    const currentBills = stateRef.current.bills;
    const dueUnpaidBills = currentBills.filter((b) => !b.isPaid && b.dueDate <= todayStr);
    if (dueUnpaidBills.length === 0) return;

    isAutoProcessingRef.current = true;
    try {
      const newBillsToAdd: Bill[] = [];
      const updatedBillsList = currentBills.map((b) => {
        if (!b.isPaid && b.dueDate <= todayStr) {
          const updatedBill: Bill = { ...b, isPaid: true, paidByUserId: currentUser?.id };

          const nextDueDate = advanceDueDateToFuture(b.dueDate, b.frequency, todayStr);
          const nextInstance: Bill = {
            ...b,
            id: 'bill-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            dueDate: nextDueDate,
            isPaid: false,
            paidByUserId: undefined,
          };
          newBillsToAdd.push(nextInstance);

          addTransaction({
            merchant: b.name,
            amount: b.amount,
            category: b.type === 'income' ? 'Income' : b.category,
            type: b.type === 'income' ? 'income' : 'expense',
            date: b.dueDate,
            walletId: b.walletId || stateRef.current.allWallets[0]?.id,
            notes: `Automatic payment on scheduled date (${b.dueDate})`,
            isRecurring: true,
          });

          logActivity(
            'pay',
            'bill',
            `Auto-paid recurring ${b.type === 'income' ? 'income' : 'bill'} '${b.name}'. Next cycle scheduled for ${nextDueDate}.`
          );

          return updatedBill;
        }
        return b;
      });

      const finalBills = [...updatedBillsList, ...newBillsToAdd];
      setBills(finalBills);

      if (isSelfHosted) {
        saveAll();
      }
    } finally {
      isAutoProcessingRef.current = false;
    }
  };

  const updateCategoryAllocation = (categoryId: string, amount: number) => {
    const rounded = Math.round(amount);
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, allocated: rounded } : c))
    );

    if (isSelfHosted) {
      if (categoryDebounceTimers.current[categoryId]) {
        clearTimeout(categoryDebounceTimers.current[categoryId]);
      }
      categoryDebounceTimers.current[categoryId] = setTimeout(() => {
        api.updateCategory(categoryId, { allocated: rounded });
      }, 300);
    }
  };

  const rebalanceCategories = (
    fromCategoryId: string,
    toCategoryId: string,
    amount: number
  ) => {
    if (amount <= 0) return;
    setCategories((prev) => {
      const updated = prev.map((c) => {
        if (c.id === fromCategoryId) {
          return { ...c, allocated: Math.max(0, c.allocated - amount) };
        }
        if (c.id === toCategoryId) {
          return { ...c, allocated: c.allocated + amount };
        }
        return c;
      });

      if (isSelfHosted) {
        const fromCat = updated.find((c) => c.id === fromCategoryId);
        const toCat = updated.find((c) => c.id === toCategoryId);
        if (fromCat) api.updateCategory(fromCat.id, { allocated: fromCat.allocated });
        if (toCat) api.updateCategory(toCat.id, { allocated: toCat.allocated });
      }

      return updated;
    });
    triggerConfetti();
  };

  const contributeToGoal = (
    goalId: string,
    amount: number,
    sourceWalletId?: string,
    note?: string
  ) => {
    if (amount <= 0) return;
    const targetGoal = goals.find((g) => g.id === goalId);
    if (!targetGoal) return;

    const targetWalletId = targetGoal.walletId;
    const contribution = {
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      amount,
      date: new Date().toISOString(),
      note: note || 'Direct deposit',
      source: 'manual' as const,
      sourceWalletId,
      targetWalletId,
    };

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updated = g.currentAmount + amount;
          return {
            ...g,
            currentAmount: updated,
            contributions: [contribution, ...(g.contributions || [])],
          };
        }
        return g;
      })
    );

    if (sourceWalletId && targetWalletId && sourceWalletId !== targetWalletId) {
      setAllWallets((prevWallets) =>
        prevWallets.map((w) => {
          if (w.id === sourceWalletId) return { ...w, balance: w.balance - amount };
          if (w.id === targetWalletId) return { ...w, balance: w.balance + amount };
          return w;
        })
      );
    }

    if (isSelfHosted) {
      api.updateGoal(goalId, {
        currentAmount: targetGoal.currentAmount + amount,
        contributions: [contribution, ...(targetGoal.contributions || [])],
      });
    }

    logActivity('rebalance', 'goal', `Deposited ${amount} ${preferences.currencySymbol} into '${targetGoal.name}'`);
    triggerConfetti();
  };

  const calculateLeftoverSurplus = () => {
    const unpaidBills = visibleBills.filter((b) => !b.isPaid && b.type !== 'income');
    const upcomingBillsTotal = unpaidBills.reduce((acc, b) => acc + b.amount, 0);
    return Math.max(0, totalIncome - totalSpent - upcomingBillsTotal);
  };

  const allocateToGoals = (params: {
    totalAmount: number;
    source: 'income' | 'month_end' | 'manual';
    sourceWalletId?: string;
    goalAllocations?: { goalId: string; amount: number; targetWalletId?: string }[];
    note?: string;
  }) => {
    const { totalAmount, source, sourceWalletId, goalAllocations, note } = params;
    if (totalAmount <= 0) return;

    let effectiveAllocations = goalAllocations;
    if (!effectiveAllocations || effectiveAllocations.length === 0) {
      const activeGoals = goals.filter((g) => (g.allocationPercentage || 0) > 0);
      const totalPct = activeGoals.reduce((sum, g) => sum + (g.allocationPercentage || 0), 0);
      if (totalPct === 0) return;

      effectiveAllocations = activeGoals
        .map((g) => {
          const portion = (g.allocationPercentage || 0) / 100;
          const amt = Math.round(totalAmount * portion * 100) / 100;
          return {
            goalId: g.id,
            amount: amt,
            targetWalletId: g.walletId,
          };
        })
        .filter((a) => a.amount > 0);
    }

    if (!effectiveAllocations || effectiveAllocations.length === 0) return;

    const sourceLabel =
      source === 'income'
        ? 'Income allocation'
        : source === 'month_end'
        ? 'Month-end surplus sweep'
        : 'Manual allocation';

    // 1. Update goals state
    setGoals((prevGoals) =>
      prevGoals.map((g) => {
        const item = effectiveAllocations!.find((a) => a.goalId === g.id);
        if (!item || item.amount <= 0) return g;

        const contribution = {
          userId: currentUser?.id || 'admin',
          userName: currentUser?.name || 'Admin',
          amount: item.amount,
          date: new Date().toISOString(),
          note: note || sourceLabel,
          source: (source === 'income' ? 'income_allocation' : 'leftover_sweep') as any,
          sourceWalletId,
          targetWalletId: item.targetWalletId || g.walletId,
        };

        return {
          ...g,
          currentAmount: (g.currentAmount || 0) + item.amount,
          contributions: [contribution, ...(g.contributions || [])],
        };
      })
    );

    // 2. Adjust wallet balances if sourceWalletId provided and target wallets differ
    setAllWallets((prevWallets) => {
      let next = [...prevWallets];
      effectiveAllocations!.forEach((item) => {
        const targetWalletId = item.targetWalletId;
        if (sourceWalletId && targetWalletId && sourceWalletId !== targetWalletId) {
          next = next.map((w) => {
            if (w.id === sourceWalletId) return { ...w, balance: w.balance - item.amount };
            if (w.id === targetWalletId) return { ...w, balance: w.balance + item.amount };
            return w;
          });
        }
      });
      return next;
    });

    // 3. Backend sync if self-hosted
    if (isSelfHosted) {
      api.allocateLeftoverToGoals({
        allocations: effectiveAllocations,
        sourceWalletId,
        description: `${sourceLabel} of ${totalAmount} ${preferences.currencySymbol}`,
      });
    }

    logActivity(
      'rebalance',
      'goal',
      `${sourceLabel}: Allocated ${totalAmount} ${preferences.currencySymbol} into ${effectiveAllocations.length} goal jars`
    );

    triggerConfetti();
    setIsSmartAllocationOpen(false);
  };

  const bulkImportTransactions = (newTxs: Omit<Transaction, 'id'>[]) => {
    const formatted: Transaction[] = newTxs.map((t, idx) => ({
      ...t,
      id: `tx-import-${Date.now()}-${idx}`,
      userId: currentUser?.id,
      userName: currentUser?.name,
    }));
    setTransactions((prev) => [...formatted, ...prev]);
    triggerConfetti();
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const resetToDemoData = () => {
    setHouseholdSettings(demoHouseholdSettings);
    setFamilyUsers(demoFamilyUsers);
    setCurrentUser(demoFamilyUsers[0]);
    setPreferences(demoPreferences);
    setCategories(demoCategories);
    setTransactions(demoTransactions);
    setBills(demoBills);
    setGoals(demoGoals);
    setAllWallets(demoWallets);
  };

  const clearToFreshSlate = () => {
    setTransactions([]);
    setCategories(initialCategories.map((c) => ({ ...c, spent: 0 })));
    setBills([]);
    setGoals([]);
    setAllWallets(allWallets.map((w) => ({ ...w, balance: 0 })));
  };

  const exportDataJson = () => {
    const payload = {
      householdSettings,
      familyUsers,
      preferences,
      categories,
      transactions,
      bills,
      goals,
      wallets: allWallets,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budgetflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.householdSettings) setHouseholdSettings(data.householdSettings);
      if (data.familyUsers) setFamilyUsers(data.familyUsers);
      if (data.preferences) setPreferences(data.preferences);
      if (data.categories) setCategories(data.categories);
      if (data.transactions) setTransactions(data.transactions);
      if (data.bills) setBills(data.bills);
      if (data.goals) setGoals(data.goals);
      if (data.wallets) setAllWallets(data.wallets);
      return true;
    } catch (e) {
      console.error('Failed to import JSON', e);
      return false;
    }
  };

  // Family Management Actions
  const addFamilyUser = (user: Omit<FamilyUser, 'id'>) => {
    const newUser: FamilyUser = {
      ...user,
      id: 'user-' + Date.now(),
    };
    setFamilyUsers((prev) => [...prev, newUser]);
    if (isSelfHosted) {
      api.addMember(newUser);
    }
  };

  const updateFamilyUser = async (updatedUser: FamilyUser) => {
    setFamilyUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(updatedUser));
      setPreferences((prev) => ({ ...prev, userName: updatedUser.name }));
      if (updatedUser.role === 'member' && !['dashboard', 'transactions', 'wallets'].includes(activeView)) {
        setActiveView('dashboard');
      }
    }
    if (isSelfHosted) {
      await api.updateMember(updatedUser.id, updatedUser);
      const [remoteUsers, remoteData] = await Promise.all([
        api.getFamilyUsers(),
        api.getData(),
      ]);
      if (remoteUsers && remoteUsers.length > 0) {
        setFamilyUsers(remoteUsers);
      }
      if (remoteData) {
        if (remoteData.wallets) setAllWallets(remoteData.wallets);
        if (remoteData.transactions) setTransactions(remoteData.transactions);
        if (remoteData.bills) setBills(remoteData.bills);
        if (remoteData.goals) setGoals(remoteData.goals);
        if (remoteData.categories) setCategories(remoteData.categories);
        if (remoteData.activityLogs) setActivityLogs(remoteData.activityLogs);
      }
    }
  };

  const deleteFamilyUser = async (id: string) => {
    setFamilyUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      const remaining = familyUsers.filter((u) => u.id !== id);
      const nextUser = remaining[0] || null;
      setCurrentUser(nextUser);
      if (nextUser) {
        localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(LS_PREFIX + 'currentUser');
      }
    }
    if (isSelfHosted) {
      await api.deleteMember(id);
    }
  };

  const switchUser = async (user: FamilyUser) => {
    const latestUser = familyUsers.find((u) => u.id === user.id) || user;
    setCurrentUser(latestUser);
    localStorage.setItem(LS_PREFIX + 'currentUser', JSON.stringify(latestUser));
    setPreferences((prev) => ({ ...prev, userName: latestUser.name }));
    setIsUserSelectModalOpen(false);
    if (latestUser.role === 'member' && !['dashboard', 'transactions', 'wallets'].includes(activeView)) {
      setActiveView('dashboard');
    }
    if (isSelfHosted) {
      const remoteData = await api.getData();
      if (remoteData) {
        if (remoteData.wallets) setAllWallets(remoteData.wallets);
        if (remoteData.transactions) setTransactions(remoteData.transactions);
        if (remoteData.bills) setBills(remoteData.bills);
        if (remoteData.goals) setGoals(remoteData.goals);
        if (remoteData.categories) setCategories(remoteData.categories);
        if (remoteData.activityLogs) setActivityLogs(remoteData.activityLogs);
      }
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem(LS_PREFIX + 'currentUser');
    api.clearToken();
    setIsUserSelectModalOpen(true);
  };

  const registerMember = async (memberData: {
    name: string;
    avatar: string;
    color: string;
    patternSequence: number[];
  }): Promise<{ success: boolean; error?: string }> => {
    if (isSelfHosted) {
      const res = await api.registerMember(memberData);
      if (res.success && res.user) {
        setFamilyUsers((prev) => [...prev, res.user]);
        setCurrentUser(res.user);
        setPreferences((prev) => ({ ...prev, userName: res.user.name }));
        setIsUserSelectModalOpen(false);
        triggerConfetti();
        return { success: true };
      }
      return { success: false, error: res.error || 'Failed to register member' };
    } else {
      const newMember: FamilyUser = {
        id: 'user_' + Date.now(),
        name: memberData.name.trim(),
        role: 'member',
        avatar: memberData.avatar || '👤',
        color: memberData.color || '#0d9488',
        patternSequence: memberData.patternSequence,
        allowedWalletIds: allWallets.map((w) => w.id),
        permissions: {
          canAddBills: false,
          canAddGoals: true,
          canEditBudgets: false,
          canViewHouseholdReports: false,
        },
      };
      setFamilyUsers((prev) => [...prev, newMember]);
      setCurrentUser(newMember);
      setPreferences((prev) => ({ ...prev, userName: newMember.name }));
      setIsUserSelectModalOpen(false);
      triggerConfetti();
      return { success: true };
    }
  };

  const completeInitialSetup = (setupData: {
    householdName: string;
    currency: string;
    currencySymbol: string;
    adminUser: FamilyUser;
    initialWallets: Wallet[];
  }) => {
    const newHousehold: HouseholdSettings = {
      householdName: setupData.householdName,
      currency: setupData.currency,
      currencySymbol: setupData.currencySymbol,
      isSetupCompleted: true,
    };

    setHouseholdSettings(newHousehold);
    setFamilyUsers([setupData.adminUser]);
    setCurrentUser(setupData.adminUser);
    setAllWallets(setupData.initialWallets);
    setPreferences((prev) => ({
      ...prev,
      userName: setupData.adminUser.name,
      currency: setupData.currency,
      currencySymbol: setupData.currencySymbol,
    }));
    setTransactions([]);
    setBills([]);
    setGoals([]);

    setIsInitialSetupModalOpen(false);

    if (isSelfHosted) {
      api.setupHousehold(setupData);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        activeView,
        setActiveView,
        isQuickAddOpen,
        setIsQuickAddOpen,
        isWhatIfOpen,
        setIsWhatIfOpen,
        isCsvImportOpen,
        setIsCsvImportOpen,
        isAddRecurringOpen,
        setIsAddRecurringOpen,
        isSelfHosted,
        serverStatus,
        isTabletMode,
        setIsTabletMode,
        householdSettings,
        familyUsers,
        currentUser,
        setCurrentUser,
        isUserSelectModalOpen,
        setIsUserSelectModalOpen,
        isInitialSetupModalOpen,
        setIsInitialSetupModalOpen,
        activeGuideId,
        setIsGuideOpenWithId: (id) => setActiveGuideId(id),
        preferences,
        categories,
        transactions: visibleTransactions,
        bills: visibleBills,
        allBills: bills,
        goals,
        wallets,
        allWallets,
        totalBudget,
        totalSpent,
        totalIncome,
        remainingBudget,
        spentPercentage,
        savingsRate,
        safeToSpendMetrics,
        insights,
        upcomingBillsCount,
        upcomingBillsTotal,
        emergencyFundAmount,
        creditUtilizationPercent,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        toggleBillPaid,
        checkAndProcessDueBills,
        updateCategoryAllocation,
        rebalanceCategories,
        createCategory,
        updateCategory,
        deleteCategory,
        addBill,
        updateBill,
        deleteBill,
        addGoal,
        updateGoal,
        deleteGoal,
        addWallet,
        updateWallet,
        deleteWallet,
        contributeToGoal,
        bulkImportTransactions,
        updatePreferences,
        resetToDemoData,
        clearToFreshSlate,
        exportDataJson,
        importDataJson,
        triggerConfetti,
        isCalendarModalOpen,
        setIsCalendarModalOpen,
        isActivityLogOpen,
        setIsActivityLogOpen,
        activityLogs,
        logActivity,
        addFamilyUser,
        updateFamilyUser,
        deleteFamilyUser,
        switchUser,
        logoutUser,
        completeInitialSetup,
        registerMember,
        calculateLeftoverSurplus,
        allocateToGoals,
        isSmartAllocationOpen,
        setIsSmartAllocationOpen,
        smartAllocationConfig,
        openSmartAllocation,
        closeSmartAllocation,
        isRefreshing,
        refreshData,
        saveAll,
        saveBudgetsState,
        saveTransactionsState,
        saveBillsState,
        saveGoalsState,
        saveWalletsState,
        saveFamilyUsersState,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
