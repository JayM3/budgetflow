import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

interface FinanceContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  isWhatIfOpen: boolean;
  setIsWhatIfOpen: (open: boolean) => void;
  isCsvImportOpen: boolean;
  setIsCsvImportOpen: (open: boolean) => void;

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
  updateCategoryAllocation: (categoryId: string, amount: number) => void;
  rebalanceCategories: (fromCategoryId: string, toCategoryId: string, amount: number) => void;
  contributeToGoal: (goalId: string, amount: number) => void;
  bulkImportTransactions: (newTxs: Omit<Transaction, 'id'>[]) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetToDemoData: () => void;
  clearToFreshSlate: () => void;
  exportDataJson: () => void;
  importDataJson: (jsonStr: string) => boolean;
  triggerConfetti: () => void;

  // Family Management Actions
  addFamilyUser: (user: Omit<FamilyUser, 'id'>) => void;
  updateFamilyUser: (user: FamilyUser) => void;
  deleteFamilyUser: (id: string) => void;
  switchUser: (user: FamilyUser) => void;
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
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const LS_PREFIX = 'budgetflow_state_';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isTabletMode, setIsTabletMode] = useState(false);
  const [activeGuideId, setActiveGuideId] = useState<GuideId | null>(null);

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
      if (saved) return JSON.parse(saved);
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
            if (!savedUser || !remoteUsers.some((u: any) => u.id === savedUser.id)) {
              setCurrentUser(null);
              setIsUserSelectModalOpen(true);
            } else {
              setCurrentUser(savedUser);
            }
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
            }
          }
        }
      }
    };
    initServerCheck();
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

  // Wallet Permissions Filter:
  // If currentUser is a member with allowedWalletIds, filter wallets and transactions
  const wallets = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin' || currentUser.allowedWalletIds.length === 0) {
      return allWallets;
    }
    return allWallets.filter((w) => currentUser.allowedWalletIds.includes(w.id));
  }, [allWallets, currentUser]);

  const visibleTransactions = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin' || currentUser.allowedWalletIds.length === 0) {
      return transactions;
    }
    const allowedSet = new Set(currentUser.allowedWalletIds);
    return transactions.filter(
      (t) => !t.walletId || allowedSet.has(t.walletId) || t.userId === currentUser.id
    );
  }, [transactions, currentUser]);

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

  const safeToSpendMetrics = useMemo(() => {
    return calculateSafeToSpend(totalBudget, totalSpent);
  }, [totalBudget, totalSpent]);

  const unpaidBills = bills.filter((b) => !b.isPaid);
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

  // Actions
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now(),
      userId: tx.userId || currentUser?.id,
      userName: tx.userName || currentUser?.name,
    };

    saveLearnedMerchant(tx.merchant, tx.category);
    setTransactions((prev) => [newTx, ...prev]);

    // Backend sync if self-hosted
    if (isSelfHosted) {
      api.createTransaction(newTx);
    }

    // Update wallet balance
    if (tx.walletId) {
      setAllWallets((prevWallets) =>
        prevWallets.map((w) => {
          if (w.id === tx.walletId) {
            if (w.type === 'credit') {
              return {
                ...w,
                balance: tx.type === 'expense' ? w.balance + tx.amount : w.balance - tx.amount,
              };
            } else {
              return {
                ...w,
                balance: tx.type === 'income' ? w.balance + tx.amount : w.balance - tx.amount,
              };
            }
          }
          return w;
        })
      );
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (isSelfHosted) {
      api.deleteTransaction(id);
    }
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
  };

  const toggleBillPaid = (billId: string) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.id === billId) {
          const nextPaid = !b.isPaid;
          if (nextPaid) triggerConfetti();
          return { ...b, isPaid: nextPaid, paidByUserId: currentUser?.id };
        }
        return b;
      })
    );
  };

  const updateCategoryAllocation = (categoryId: string, amount: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, allocated: amount } : c))
    );
  };

  const rebalanceCategories = (
    fromCategoryId: string,
    toCategoryId: string,
    amount: number
  ) => {
    if (amount <= 0) return;
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === fromCategoryId) {
          return { ...c, allocated: Math.max(0, c.allocated - amount) };
        }
        if (c.id === toCategoryId) {
          return { ...c, allocated: c.allocated + amount };
        }
        return c;
      })
    );
    triggerConfetti();
  };

  const contributeToGoal = (goalId: string, amount: number) => {
    if (amount <= 0) return;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updated = g.currentAmount + amount;
          triggerConfetti();
          return { ...g, currentAmount: updated };
        }
        return g;
      })
    );
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

  const updateFamilyUser = (updatedUser: FamilyUser) => {
    setFamilyUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    if (isSelfHosted) {
      api.updateMember(updatedUser.id, updatedUser);
    }
  };

  const deleteFamilyUser = (id: string) => {
    setFamilyUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      const remaining = familyUsers.filter((u) => u.id !== id);
      setCurrentUser(remaining[0] || null);
    }
    if (isSelfHosted) {
      api.deleteMember(id);
    }
  };

  const switchUser = (user: FamilyUser) => {
    setCurrentUser(user);
    setPreferences((prev) => ({ ...prev, userName: user.name }));
    setIsUserSelectModalOpen(false);
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
        bills,
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
        updateCategoryAllocation,
        rebalanceCategories,
        contributeToGoal,
        bulkImportTransactions,
        updatePreferences,
        resetToDemoData,
        clearToFreshSlate,
        exportDataJson,
        importDataJson,
        triggerConfetti,
        addFamilyUser,
        updateFamilyUser,
        deleteFamilyUser,
        switchUser,
        logoutUser,
        completeInitialSetup,
        registerMember,
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
