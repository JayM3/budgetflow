import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  PlusCircle,
  Shield,
  Sun,
  Maximize2,
  Minimize2,
  Flame,
  Calendar,
  Wallet,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Check,
  X,
  Sparkles,
  HelpCircle,
  Eye,
  LogOut,
  RotateCcw,
  RefreshCw,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  ShoppingBag,
  Home,
  Car,
  Gamepad2,
  Utensils,
  HeartPulse,
  Landmark,
  Zap,
  Target,
  Edit2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';
import { FamilyUser, Wallet as WalletType, TransactionType } from '../../types/finance';
import { PatternLock } from '../auth/PatternLock';
import { comparePatterns } from '../../utils/patternAuth';
import { formatCurrency, formatCurrencyExact, formatDateDisplay, formatTabletDateDisplay } from '../../utils/formatters';
import { GuideButton } from '../guide/GuideButton';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  Home,
  Car,
  Gamepad2,
  Zap,
  Utensils,
  HeartPulse,
  Landmark,
  Wallet,
};

export const TabletKioskView: React.FC = () => {
  const {
    preferences,
    totalBudget,
    totalSpent,
    remainingBudget,
    spentPercentage,
    safeToSpendMetrics,
    upcomingBillsCount,
    upcomingBillsTotal,
    bills,
    goals,
    familyUsers,
    wallets,
    categories,
    addTransaction,
    updateWallet,
    saveAll,
    setIsTabletMode,
    setIsGuideOpenWithId,
    triggerConfetti,
    isRefreshing,
    refreshData,
    isSelfHosted,
  } = useFinance();


  // Clock
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setDateStr(formatTabletDateDisplay(now));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Wake Lock API
  const [isWakeLocked, setIsWakeLocked] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const toggleWakeLock = async () => {
    if ('wakeLock' in navigator) {
      if (!isWakeLocked) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setIsWakeLocked(true);
        } catch {
          setIsWakeLocked(false);
        }
      } else {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
        setIsWakeLocked(false);
      }
    }
  };

  // Full Screen API
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  // Display Scale Switcher (Standard vs Jumbo / Room View)
  const [scaleMode, setScaleMode] = useState<'standard' | 'jumbo'>(() => {
    return (localStorage.getItem('budgetflow_tablet_scale') as 'standard' | 'jumbo') || 'standard';
  });

  const toggleScaleMode = () => {
    const next = scaleMode === 'standard' ? 'jumbo' : 'standard';
    setScaleMode(next);
    localStorage.setItem('budgetflow_tablet_scale', next);
  };

  // View Balances Modal Flow (with 9-Dot Pattern Verification)
  const [isViewBalancesOpen, setIsViewBalancesOpen] = useState(false);
  const [viewBalancesStep, setViewBalancesStep] = useState<'select-user' | 'verify-pattern' | 'wallets-view'>('select-user');
  const [activeBalancesUser, setActiveBalancesUser] = useState<FamilyUser | null>(null);

  // Edit Wallet Balance in Tablet Mode
  const [editingWalletForBalance, setEditingWalletForBalance] = useState<WalletType | null>(null);
  const [editBalanceInput, setEditBalanceInput] = useState<string>('');
  const [editBalanceError, setEditBalanceError] = useState<string>('');
  const [editBalanceSuccess, setEditBalanceSuccess] = useState<string>('');

  const handleStartEditWallet = (wallet: WalletType) => {
    setEditingWalletForBalance(wallet);
    setEditBalanceInput(wallet.balance.toString());
    setEditBalanceError('');
    setEditBalanceSuccess('');
    resetIdleTimer();
  };

  const handleAdjustEditBalance = (delta: number) => {
    const current = parseFloat(editBalanceInput) || 0;
    const next = parseFloat((current + delta).toFixed(2));
    setEditBalanceInput(next.toString());
    resetIdleTimer();
  };

  const handleSaveEditBalance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingWalletForBalance) return;
    const val = parseFloat(editBalanceInput);
    if (isNaN(val)) {
      setEditBalanceError('Please enter a valid numeric balance');
      return;
    }

    updateWallet({
      ...editingWalletForBalance,
      balance: val,
    });

    try {
      await saveAll();
    } catch (saveErr) {
      console.error('Failed to auto-save wallet balance:', saveErr);
    }

    setEditBalanceSuccess(`Updated ${editingWalletForBalance.name} balance!`);
    resetIdleTimer();
    setTimeout(() => {
      setEditingWalletForBalance(null);
      setEditBalanceSuccess('');
    }, 900);
  };

  const handleOpenViewBalances = () => {
    setIsViewBalancesOpen(true);
    setViewBalancesStep('select-user');
    setActiveBalancesUser(null);
    setEditingWalletForBalance(null);
    resetIdleTimer();
  };

  const handleSelectBalancesUser = (user: FamilyUser) => {
    setActiveBalancesUser(user);
    setViewBalancesStep('verify-pattern');
    resetIdleTimer();
  };

  const handleBalancesPatternVerified = async (pattern: number[]) => {
    if (!activeBalancesUser) return false;

    if (isSelfHosted) {
      const res = await api.verifyPattern(activeBalancesUser.id, pattern);
      if (!res.success) return false;
      if (res.token) api.setToken(res.token);
    } else if (activeBalancesUser.patternSequence && activeBalancesUser.patternSequence.length > 0) {
      const match = comparePatterns(activeBalancesUser.patternSequence, pattern);
      if (!match) return false;
    }

    setViewBalancesStep('wallets-view');
    resetIdleTimer();
    return true;
  };

  const handleCloseViewBalances = () => {
    setIsViewBalancesOpen(false);
    setViewBalancesStep('select-user');
    setActiveBalancesUser(null);
    setEditingWalletForBalance(null);
  };

  // Kiosk Logging Modal Flow
  const [isKioskActionOpen, setIsKioskActionOpen] = useState(false);
  const [kioskStep, setKioskStep] = useState<'select-user' | 'verify-pattern' | 'amount-step' | 'category-step'>('select-user');
  const [activeKioskUser, setActiveKioskUser] = useState<FamilyUser | null>(null);

  // Quick Add Form Data (Supports both Expense and Income)
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<number>(0);
  const [amountInputStr, setAmountInputStr] = useState<string>('');
  const [merchant, setMerchant] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || 'Groceries');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Auto-reset timer (25 seconds idle return to ambient screen)
  const idleTimerRef = useRef<any>(null);

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isKioskActionOpen || isViewBalancesOpen) {
      idleTimerRef.current = setTimeout(() => {
        handleCloseKioskAction();
        handleCloseViewBalances();
      }, 25000);
    }
  };

  // Periodic Auto-Refresh for 24/7 Tablet Kiosk (Default: 5 minutes)
  const isKioskBusyRef = useRef(false);
  isKioskBusyRef.current = isKioskActionOpen || isViewBalancesOpen;
  const pendingReloadRef = useRef(false);

  useEffect(() => {
    const isAutoRefreshEnabled = preferences.tabletAutoRefreshEnabled ?? true;
    const intervalMinutes = preferences.tabletRefreshIntervalMinutes ?? 5;

    if (!isAutoRefreshEnabled || intervalMinutes <= 0) return;

    const intervalMs = intervalMinutes * 60 * 1000;

    const intervalId = setInterval(() => {
      // If a modal is open, defer refresh so user's interaction isn't lost
      if (isKioskBusyRef.current) {
        pendingReloadRef.current = true;
        return;
      }
      refreshData();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [preferences.tabletAutoRefreshEnabled, preferences.tabletRefreshIntervalMinutes, refreshData]);

  // When modals close, if a refresh was deferred, execute after a 5s grace period
  useEffect(() => {
    if (!isKioskActionOpen && !isViewBalancesOpen && pendingReloadRef.current) {
      const graceTimer = setTimeout(() => {
        if (!isKioskBusyRef.current) {
          pendingReloadRef.current = false;
          refreshData();
        }
      }, 5000);
      return () => clearTimeout(graceTimer);
    }
  }, [isKioskActionOpen, isViewBalancesOpen, refreshData]);


  const handleOpenLogExpense = () => {
    setIsKioskActionOpen(true);
    setKioskStep('select-user');
    setActiveKioskUser(null);
    setTransactionType('expense');
    setAmount(0);
    setAmountInputStr('');
    setMerchant('');
    setActionSuccessMessage('');
    resetIdleTimer();
  };

  const handleSelectUser = (user: FamilyUser) => {
    setActiveKioskUser(user);
    setKioskStep('verify-pattern');
    resetIdleTimer();
  };

  const handlePatternVerified = async (pattern: number[]) => {
    if (!activeKioskUser) return false;

    // Pattern matching
    if (isSelfHosted) {
      const res = await api.verifyPattern(activeKioskUser.id, pattern);
      if (!res.success) return false;
      if (res.token) api.setToken(res.token);
    } else if (activeKioskUser.patternSequence && activeKioskUser.patternSequence.length > 0) {
      const match = comparePatterns(activeKioskUser.patternSequence, pattern);
      if (!match) return false;
    }

    // Determine user's allowed wallets
    const userWallets =
      activeKioskUser.role === 'admin' || activeKioskUser.allowedWalletIds.length === 0
        ? wallets
        : wallets.filter((w) => activeKioskUser.allowedWalletIds.includes(w.id));

    setSelectedWalletId(userWallets[0]?.id || wallets[0]?.id || '');
    if (categories.length > 0) {
      setSelectedCategory(categories[0].name);
    }
    setKioskStep('amount-step');
    resetIdleTimer();
    return true;
  };

  // Adjust amount via increment buttons
  const isCentsCurrency = preferences.currency === 'USD' || preferences.currency === 'EUR';
  const incrementValues = isCentsCurrency ? [0.25, 1, 5, 25, 100] : [1, 5, 25, 100, 500];

  const handleAdjustAmount = (delta: number) => {
    setAmount((prev) => {
      const next = Math.max(0, parseFloat((prev + delta).toFixed(2)));
      setAmountInputStr(next === 0 ? '' : next.toString());
      return next;
    });
    resetIdleTimer();
  };

  const handleResetAmount = () => {
    setAmount(0);
    setAmountInputStr('');
    resetIdleTimer();
  };

  const handleSubmitTransaction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (amount <= 0) return;

    const isIncome = transactionType === 'income';

    addTransaction({
      merchant: merchant.trim() || (isIncome ? 'Income Deposit' : selectedCategory),
      amount,
      category: isIncome ? 'Income' : selectedCategory,
      type: transactionType,
      date: new Date().toISOString().split('T')[0],
      walletId: selectedWalletId,
      userId: activeKioskUser?.id,
      userName: activeKioskUser?.name,
    });

    // Automatically save data to server host immediately on adding transaction in tablet mode
    try {
      await saveAll();
    } catch (saveErr) {
      console.error('Failed to auto-save tablet transaction:', saveErr);
    }

    triggerConfetti();
    setActionSuccessMessage(
      `Logged ${formatCurrency(amount, preferences.currency)} ${isIncome ? 'income' : 'expense'} by ${activeKioskUser?.name}!`
    );

    setTimeout(() => {
      handleCloseKioskAction();
    }, 1500);
  };

  const handleCloseKioskAction = () => {
    setIsKioskActionOpen(false);
    setKioskStep('select-user');
    setActiveKioskUser(null);
    setTransactionType('expense');
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };

  // Filter wallets for active kiosk user
  const activeUserWallets = activeKioskUser
    ? activeKioskUser.role === 'admin' || activeKioskUser.allowedWalletIds.length === 0
      ? wallets
      : wallets.filter((w) => activeKioskUser.allowedWalletIds.includes(w.id))
    : wallets;

  // Filter wallets for view balances user
  const userWalletsForBalances = activeBalancesUser
    ? activeBalancesUser.role === 'admin' || activeBalancesUser.allowedWalletIds.length === 0
      ? wallets
      : wallets.filter((w) => activeBalancesUser.allowedWalletIds.includes(w.id))
    : [];

  const totalUserBalance = userWalletsForBalances.reduce(
    (acc, w) => acc + (w.type === 'credit' ? -w.balance : w.balance),
    0
  );

  // Goals summary metrics
  const totalGoalCurrent = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalGoalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalGoalPercent = totalGoalTarget > 0 ? Math.round((totalGoalCurrent / totalGoalTarget) * 100) : 0;

  const isJumbo = scaleMode === 'jumbo';

  return (
    <div
      onMouseMove={resetIdleTimer}
      onTouchStart={resetIdleTimer}
      className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white flex flex-col justify-between relative overflow-hidden select-none transition-all duration-300 ${
        isJumbo ? 'p-6 sm:p-12' : 'p-4 sm:p-8'
      }`}
    >
      {/* Ambient background orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP BAR: Clock & Kiosk Controls */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-4">
          <div className="text-left">
            <h1
              className={`font-extrabold tracking-tight text-white font-mono transition-all ${
                isJumbo ? 'text-6xl sm:text-8xl' : 'text-4xl sm:text-6xl'
              }`}
            >
              {time}
            </h1>
            <p
              className={`font-semibold text-teal-300 tracking-wider mt-1 ${
                isJumbo ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
              }`}
            >
              {dateStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          <GuideButton
            guideId="tablet-mode"
            onOpenGuide={(id) => setIsGuideOpenWithId(id)}
            className="text-white hover:text-teal-300 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
          />

          {/* Fetch Latest Numbers Button (Icon-only between ? and zoom in button) */}
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-75"
            title="Fetch Latest Numbers"
            aria-label="Fetch Latest Numbers"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
          </button>


          {/* Scale Switcher: Standard vs Jumbo Room View (Icon-only, bigger, touch-friendly) */}
          <button
            onClick={toggleScaleMode}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-95 ${
              isJumbo
                ? 'bg-teal-500/25 text-teal-300 border-teal-400/50 shadow-lg shadow-teal-500/20'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title={isJumbo ? 'Scale: Jumbo (Tap for Standard)' : 'Scale: Standard (Tap for Jumbo)'}
            aria-label={isJumbo ? 'Scale: Jumbo' : 'Scale: Standard'}
          >
            {isJumbo ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {/* Full Screen Toggle Button (Icon-only, bigger, touch-friendly) */}
          <button
            onClick={toggleFullscreen}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-95 ${
              isFullscreen
                ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Wake Lock Button (Icon-only, bigger, touch-friendly) */}
          <button
            onClick={toggleWakeLock}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-95 ${
              isWakeLocked
                ? 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title={isWakeLocked ? 'Screen Awake: ON' : 'Keep Screen Awake'}
            aria-label={isWakeLocked ? 'Awake: ON' : 'Keep Awake'}
          >
            <Sun className="w-5 h-5" />
          </button>

          {/* Exit Tablet Mode Button (Icon-only, bigger, touch-friendly) */}
          <button
            onClick={() => setIsTabletMode(false)}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-400/30 text-white border border-white/15 transition-all flex items-center justify-center active:scale-95"
            title="Exit Tablet Mode"
            aria-label="Exit Tablet Mode"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CENTER GLANCE: 2-WIDGET AMBIENT GRID */}
      {/* Notice: Daily Safe-to-Spend & Household Budget removed; Upcoming Bills & Goals List displayed */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-6 my-6 relative z-10 transition-all ${
          isJumbo ? 'gap-8 my-8' : 'gap-6 my-6'
        }`}
      >
        {/* WIDGET 1: Upcoming Bills Radar */}
        <div
          className={`bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between transition-all ${
            isJumbo ? 'p-8 sm:p-9' : 'p-6'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-teal-300 mb-2">
              <span
                className={`font-bold uppercase tracking-wider flex items-center space-x-2 ${
                  isJumbo ? 'text-sm' : 'text-xs'
                }`}
              >
                <Calendar className={`${isJumbo ? 'w-5 h-5' : 'w-4 h-4'} text-cyan-400`} />
                <span>Upcoming Bills</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 ${
                  isJumbo ? 'text-xs' : 'text-[10px]'
                }`}
              >
                {upcomingBillsCount} due soon
              </span>
            </div>
            <div
              className={`font-black text-white tracking-tight ${
                isJumbo ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-4xl'
              }`}
            >
              {formatCurrency(upcomingBillsTotal, preferences.currency)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {bills
              .filter((b) => !b.isPaid)
              .slice(0, 4)
              .map((bill) => (
                <div
                  key={bill.id}
                  className={`flex items-center justify-between text-slate-300 p-2.5 rounded-xl bg-white/5 border border-white/5 ${
                    isJumbo ? 'text-sm' : 'text-xs'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-white block truncate">{bill.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Due {formatDateDisplay(bill.dueDate)}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-white block">
                      {formatCurrency(bill.amount, preferences.currency)}
                    </span>
                    {bill.autoPay && (
                      <span className="text-[9px] font-bold text-emerald-400 uppercase">AutoPay</span>
                    )}
                  </div>
                </div>
              ))}
            {bills.filter((b) => !b.isPaid).length === 0 && (
              <p className={`text-slate-400 italic ${isJumbo ? 'text-sm' : 'text-xs'}`}>
                All bills paid!
              </p>
            )}
          </div>
        </div>

        {/* WIDGET 2: LIST OF SAVINGS GOALS (NEW WIDGET) */}
        <div
          className={`bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col justify-between transition-all ${
            isJumbo ? 'p-8 sm:p-9' : 'p-6'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-teal-300 mb-2">
              <span
                className={`font-bold uppercase tracking-wider flex items-center space-x-2 ${
                  isJumbo ? 'text-sm' : 'text-xs'
                }`}
              >
                <Target className={`${isJumbo ? 'w-5 h-5' : 'w-4 h-4'} text-emerald-400`} />
                <span>Savings Goals</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ${
                  isJumbo ? 'text-xs' : 'text-[10px]'
                }`}
              >
                {goals.length} Active
              </span>
            </div>
            <div className="flex items-baseline space-x-2">
              <div
                className={`font-black text-white tracking-tight ${
                  isJumbo ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-4xl'
                }`}
              >
                {formatCurrency(totalGoalCurrent, preferences.currency)}
              </div>
              <span className={`font-medium text-slate-400 ${isJumbo ? 'text-base' : 'text-xs'}`}>
                of {formatCurrency(totalGoalTarget, preferences.currency)} ({totalGoalPercent}%)
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {goals.map((goal) => {
              const pct = goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : 0;
              return (
                <div
                  key={goal.id}
                  className={`p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 ${
                    isJumbo ? 'text-sm' : 'text-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
                      <span className="font-bold text-white truncate">{goal.name}</span>
                    </div>
                    <span className="font-extrabold text-emerald-400 shrink-0">{pct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: goal.color }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{formatCurrency(goal.currentAmount, preferences.currency)} saved</span>
                    <span>Target: {formatCurrency(goal.targetAmount, preferences.currency)}</span>
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && (
              <p className={`text-slate-400 italic ${isJumbo ? 'text-sm' : 'text-xs'}`}>
                No active savings goals recorded.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div
        className={`bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
          isJumbo ? 'p-6 sm:p-8' : 'p-5 sm:p-6'
        }`}
      >
        {/* Family Member Presence */}
        <div className="flex items-center space-x-3.5">
          <div className="flex -space-x-2">
            {familyUsers.map((u) => (
              <div
                key={u.id}
                className={`rounded-2xl flex items-center justify-center border-2 border-slate-900 shadow-md transform hover:scale-110 transition-transform ${
                  isJumbo ? 'w-12 h-12 text-2xl' : 'w-10 h-10 text-xl'
                }`}
                style={{ backgroundColor: u.color }}
                title={`${u.name} (${u.role})`}
              >
                <span>{u.avatar}</span>
              </div>
            ))}
          </div>
          <div className="text-left">
            <p className={`font-bold text-white uppercase tracking-wider ${isJumbo ? 'text-sm' : 'text-xs'}`}>
              Family Hub Ready
            </p>
            <p className={`text-teal-300 ${isJumbo ? 'text-xs' : 'text-[11px]'}`}>
              Tap to view balances or log an expense
            </p>
          </div>
        </div>

        {/* Action Buttons: View balances & Log Expense */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* NEW BUTTON: View Balances */}
          <button
            onClick={handleOpenViewBalances}
            className={`flex-1 sm:flex-none bg-white/10 hover:bg-white/20 border border-white/20 hover:border-teal-400/50 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 group ${
              isJumbo ? 'px-8 py-5 text-lg' : 'px-6 py-4 text-sm sm:text-base'
            }`}
          >
            <Eye className="w-5 h-5 text-teal-300 group-hover:scale-110 transition-transform" />
            <span>View balances</span>
          </button>

          {/* UPDATED BUTTON: + Log */}
          <button
            onClick={handleOpenLogExpense}
            className={`flex-1 sm:flex-none min-w-[190px] sm:min-w-[210px] ${
              isJumbo ? 'min-w-[230px] px-10 py-5 text-xl' : 'px-8 py-4 text-base sm:text-lg'
            } bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-teal-500/25 flex items-center justify-center space-x-2.5 transition-all active:scale-95 group`}
          >
            <PlusCircle className="w-6 h-6 text-slate-950 group-hover:rotate-90 transition-transform duration-300" />
            <span>+ Log</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          VIEW BALANCES MODAL (with 9-Dot Pattern Verification)
          ======================================================== */}
      {isViewBalancesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative text-slate-800">
            {/* Close button */}
            <button
              onClick={handleCloseViewBalances}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 1: Select User */}
            {viewBalancesStep === 'select-user' && (
              <div className="text-center space-y-5">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Which user wishes to view?</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select your profile to view your personal and shared balances.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {familyUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectBalancesUser(user)}
                      className="flex flex-col items-center p-4 rounded-2xl border-2 border-slate-100 hover:border-teal-400 hover:bg-teal-50/50 transition-all transform hover:scale-105 shadow-sm"
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-2"
                        style={{ backgroundColor: `${user.color}20` }}
                      >
                        <span>{user.avatar}</span>
                      </div>
                      <span className="font-bold text-slate-800 text-sm">{user.name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                        {user.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Pattern Verification */}
            {viewBalancesStep === 'verify-pattern' && activeBalancesUser && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${activeBalancesUser.color}20` }}
                  >
                    <span>{activeBalancesUser.avatar}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {activeBalancesUser.name}, draw your pattern
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Verify your pattern to unlock wallet balances
                </p>

                <PatternLock
                  mode="verify"
                  size={260}
                  onComplete={handleBalancesPatternVerified}
                  onCancel={() => setViewBalancesStep('select-user')}
                />
              </div>
            )}

            {/* STEP 3: Show Wallets */}
            {viewBalancesStep === 'wallets-view' && activeBalancesUser && (
              <div className="space-y-5 text-left">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                      style={{ backgroundColor: `${activeBalancesUser.color}20` }}
                    >
                      <span>{activeBalancesUser.avatar}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-lg">
                          {activeBalancesUser.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-50 text-teal-700 border border-teal-200">
                          {activeBalancesUser.role}
                        </span>
                        <span className="text-[10px] text-teal-600 font-bold uppercase">
                          Pattern Verified ✓
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {activeBalancesUser.role === 'admin'
                          ? 'Viewing all household accounts & wallets'
                          : `Viewing ${userWalletsForBalances.length} authorized personal wallet(s)`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewBalancesStep('select-user')}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    Switch User
                  </button>
                </div>

                {/* Net Balance Banner */}
                <div className="p-4 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-emerald-500/10 rounded-2xl border border-teal-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
                      Total Net Balance
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      {formatCurrency(totalUserBalance, preferences.currency)}
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-semibold">
                    {userWalletsForBalances.length} Wallet(s) Shown
                  </div>
                </div>

                {/* Wallets List */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {userWalletsForBalances.map((w) => {
                    const isCredit = w.type === 'credit';
                    return (
                      <div
                        key={w.id}
                        className="p-4 rounded-2xl border border-slate-200/80 hover:border-teal-400/80 bg-slate-50/50 hover:bg-teal-50/30 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs font-bold text-sm"
                            style={{ backgroundColor: w.color }}
                          >
                            <Wallet className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {w.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono uppercase">
                              {w.isShared ? 'Shared • ' + w.type : w.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="text-right">
                            <span
                              className={`text-base font-black ${
                                isCredit ? 'text-rose-600' : 'text-slate-900'
                              } block`}
                            >
                              {isCredit ? '-' : ''}
                              {formatCurrency(w.balance, preferences.currency)}
                            </span>
                            {w.limit ? (
                              <span className="text-[10px] text-slate-400 font-semibold">
                                Limit: {formatCurrency(w.limit, preferences.currency)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold uppercase">
                                {w.type}
                              </span>
                            )}
                          </div>

                          {/* Edit Wallet Balance Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEditWallet(w)}
                            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition-all flex items-center gap-1.5 active:scale-95 border border-slate-200/70"
                            title={`Edit ${w.name} balance`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold hidden sm:inline">Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {userWalletsForBalances.length === 0 && (
                    <p className="text-center py-6 text-xs text-slate-400 italic">
                      No wallets configured for this profile.
                    </p>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleCloseViewBalances}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* EDIT WALLET BALANCE OVERLAY MODAL */}
            {editingWalletForBalance && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: editingWalletForBalance.color }}
                      >
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          Edit Wallet Balance
                        </h4>
                        <p className="text-xs text-slate-400">
                          {editingWalletForBalance.name} ({editingWalletForBalance.type})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingWalletForBalance(null)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {editBalanceSuccess ? (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-sm font-bold text-center flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>{editBalanceSuccess}</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveEditBalance} className="space-y-4">
                      <div className="text-center py-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                          Current / Reconciled Balance ({preferences.currency})
                        </span>
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            autoFocus
                            value={editBalanceInput}
                            onChange={(e) => {
                              setEditBalanceInput(e.target.value);
                              setEditBalanceError('');
                              resetIdleTimer();
                            }}
                            className="text-4xl font-black text-slate-900 tracking-tight text-center max-w-[200px] bg-transparent focus:outline-none"
                          />
                          <span className="text-2xl font-black text-teal-600">
                            {preferences.currencySymbol}
                          </span>
                        </div>
                      </div>

                      {/* Tablet Quick Increment Buttons */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                          Quick Adjust Balance
                        </span>
                        <div className="grid grid-cols-6 gap-1.5">
                          {[-100, -50, -10, 10, 50, 100].map((delta) => (
                            <button
                              key={delta}
                              type="button"
                              onClick={() => handleAdjustEditBalance(delta)}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                                delta < 0
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {delta > 0 ? `+${delta}` : delta}
                            </button>
                          ))}
                        </div>
                      </div>

                      {editBalanceError && (
                        <p className="text-xs text-rose-600 font-semibold text-center">
                          {editBalanceError}
                        </p>
                      )}

                      <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setEditingWalletForBalance(null)}
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Save Balance</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KIOSK LOGGING MODAL OVERLAY */}
      {isKioskActionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative text-slate-800">
            {/* Close button */}
            <button
              onClick={handleCloseKioskAction}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 1: Select User */}
            {kioskStep === 'select-user' && (
              <div className="text-center space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    Who is logging?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select your avatar to log an expense or income.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {familyUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="flex flex-col items-center p-4 rounded-2xl border-2 border-slate-100 hover:border-teal-400 hover:bg-teal-50/50 transition-all transform hover:scale-105 shadow-sm"
                    >
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm mb-2"
                        style={{ backgroundColor: `${user.color}20` }}
                      >
                        <span>{user.avatar}</span>
                      </div>
                      <span className="font-bold text-slate-800 text-sm">
                        {user.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                        {user.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Pattern Verification */}
            {kioskStep === 'verify-pattern' && activeKioskUser && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${activeKioskUser.color}20` }}
                  >
                    <span>{activeKioskUser.avatar}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {activeKioskUser.name}, draw your pattern
                  </h3>
                </div>

                <PatternLock
                  mode="verify"
                  size={260}
                  onComplete={handlePatternVerified}
                  onCancel={() => setKioskStep('select-user')}
                />
              </div>
            )}

            {/* STEP 3A: Progressive Logger - Part 1: Type & Amount */}
            {kioskStep === 'amount-step' && activeKioskUser && (
              <div className="space-y-4 text-left">
                {/* User Verification Header */}
                <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-100">
                  <span className="text-2xl">{activeKioskUser.avatar}</span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {activeKioskUser.name}
                    </h4>
                    <span className="text-[10px] text-teal-600 font-semibold uppercase">
                      Pattern Verified ✓
                    </span>
                  </div>
                </div>

                {/* Tablet-Friendly Segmented Slider: Expense vs Income */}
                <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType('expense');
                      resetIdleTimer();
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      transactionType === 'expense'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-400'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    <span>Expense</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType('income');
                      resetIdleTimer();
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      transactionType === 'income'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-400'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                    <span>Income</span>
                  </button>
                </div>

                {/* Amount Display */}
                <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-100 p-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                    Enter {transactionType === 'income' ? 'Income' : 'Expense'} Amount ({preferences.currency})
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      autoFocus
                      value={amountInputStr}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setAmountInputStr(e.target.value);
                        setAmount(isNaN(val) ? 0 : Math.max(0, val));
                        resetIdleTimer();
                      }}
                      placeholder="0"
                      className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight text-center max-w-[220px] bg-transparent focus:outline-none"
                    />
                    <span className="text-2xl font-black text-teal-600">
                      {preferences.currencySymbol}
                    </span>
                  </div>
                </div>

                {/* Currency-Sensitive Quick Increments / Decrements */}
                <div className="space-y-2">
                  {/* Minus Row */}
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="w-12 text-[10px] font-bold uppercase text-rose-500 text-right pr-1">
                      Minus
                    </span>
                    {incrementValues.map((val) => (
                      <button
                        key={`minus-${val}`}
                        type="button"
                        onClick={() => handleAdjustAmount(-val)}
                        disabled={amount <= 0}
                        className="flex-1 max-w-[65px] py-2 bg-rose-50 hover:bg-rose-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-0.5"
                      >
                        <Minus className="w-3 h-3" />
                        <span>{val}</span>
                      </button>
                    ))}
                  </div>

                  {/* Plus Row */}
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="w-12 text-[10px] font-bold uppercase text-emerald-600 text-right pr-1">
                      Add
                    </span>
                    {incrementValues.map((val) => (
                      <button
                        key={`plus-${val}`}
                        type="button"
                        onClick={() => handleAdjustAmount(val)}
                        className="flex-1 max-w-[65px] py-2 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{val}</span>
                      </button>
                    ))}
                  </div>

                  {/* Reset to 0 */}
                  {amount > 0 && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={handleResetAmount}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to 0</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Optional Merchant / Description */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {transactionType === 'income' ? 'Source or Description (Optional)' : 'Merchant or Description (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => {
                      setMerchant(e.target.value);
                      resetIdleTimer();
                    }}
                    placeholder={
                      transactionType === 'income'
                        ? 'e.g. Salary, Client Pay, Cash Gift, Bonus'
                        : 'e.g. Grocery Store, Coffee, Bakery'
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-semibold text-slate-800"
                  />
                </div>

                {/* Next Step Button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setKioskStep('select-user')}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={amount <= 0}
                    onClick={() => {
                      setKioskStep('category-step');
                      resetIdleTimer();
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <span>{transactionType === 'income' ? 'Next: Select Wallet' : 'Next: Category & Wallet'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3B: Progressive Logger - Part 2: Category & Account as Buttons */}
            {kioskStep === 'category-step' && activeKioskUser && (
              <div className="space-y-4 text-left">
                {/* Amount Summary Pill */}
                <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      transactionType === 'income'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {transactionType}
                    </span>
                    <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                      Amount:
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      {formatCurrencyExact(amount, preferences.currencySymbol)}
                    </span>
                    {merchant && (
                      <span className="text-xs text-slate-500 font-medium truncate max-w-[130px]">
                        ({merchant})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setKioskStep('amount-step');
                      resetIdleTimer();
                    }}
                    className="text-xs font-bold text-teal-700 hover:underline"
                  >
                    Change
                  </button>
                </div>

                {actionSuccessMessage ? (
                  <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-emerald-800 font-bold text-sm flex items-center justify-center space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{actionSuccessMessage}</span>
                  </div>
                ) : (
                  <>
                    {/* EXPENSE FLOW: Category Grid + Spending Wallet Grid */}
                    {transactionType === 'expense' ? (
                      <>
                        {/* Category Buttons Grid */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            1. Select Category
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1">
                            {categories.map((c) => {
                              const Icon = iconMap[c.icon] || ShoppingBag;
                              const isSelected = selectedCategory.toLowerCase() === c.name.toLowerCase();
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(c.name);
                                    resetIdleTimer();
                                  }}
                                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                                    isSelected
                                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-400 text-teal-950 font-bold shadow-xs'
                                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium'
                                  }`}
                                >
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                    style={{
                                      backgroundColor: `${c.color}20`,
                                      color: c.color,
                                    }}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="text-xs truncate">{c.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Wallet Buttons Grid */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            2. Select Spending Wallet
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {activeUserWallets.map((w) => {
                              const isSelected = selectedWalletId === w.id;
                              return (
                                <button
                                  key={w.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedWalletId(w.id);
                                    resetIdleTimer();
                                  }}
                                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                                    isSelected
                                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-400 text-teal-950 font-bold shadow-xs'
                                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium'
                                  }`}
                                >
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                                    style={{ backgroundColor: w.color }}
                                  >
                                    <Wallet className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs block truncate font-semibold">{w.name}</span>
                                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                                      {w.type}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* INCOME FLOW: Receiving Wallet Grid */
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                          Select Receiving Account / Wallet
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {activeUserWallets.map((w) => {
                            const isSelected = selectedWalletId === w.id;
                            return (
                              <button
                                key={w.id}
                                type="button"
                                onClick={() => {
                                  setSelectedWalletId(w.id);
                                  resetIdleTimer();
                                }}
                                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                                  isSelected
                                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400 text-emerald-950 font-bold shadow-xs'
                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium'
                                }`}
                              >
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                                  style={{ backgroundColor: w.color }}
                                >
                                  <Wallet className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="text-xs block truncate font-bold">{w.name}</span>
                                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                                    {w.type} • {formatCurrency(w.balance, preferences.currency)}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setKioskStep('amount-step');
                          resetIdleTimer();
                        }}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSubmitTransaction()}
                        className={`px-6 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 ${
                          transactionType === 'income'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20'
                            : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/20'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{transactionType === 'income' ? 'Save Income' : 'Save Expense'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
