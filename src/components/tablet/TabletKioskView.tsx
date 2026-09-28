import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  PlusCircle,
  Sun,
  Moon,
  Zap,
  Maximize2,
  Minimize2,
  Calendar,
  Wallet,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Check,
  X,
  Eye,
  LogOut,
  RotateCcw,
  RefreshCw,
  Plus,
  Minus,
  ShoppingBag,
  Home,
  Car,
  Gamepad2,
  Utensils,
  HeartPulse,
  Landmark,
  Target,
  Edit2,
  LayoutDashboard,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';
import { FamilyUser, Wallet as WalletType, TransactionType } from '../../types/finance';
import { PatternLock } from '../auth/PatternLock';
import { comparePatterns } from '../../utils/patternAuth';
import { formatCurrency, formatCurrencyExact, formatDateDisplay } from '../../utils/formatters';
import { GuideButton } from '../guide/GuideButton';
import { TabletClock } from './TabletClock';
import { TabletActivityCalendar } from './TabletActivityCalendar';
import { AddActivityModal } from '../features/AddActivityModal';

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
    currentUser,
    switchUser,
    isSelfHosted,
    isAddActivityOpen,
    setIsAddActivityOpen,
    addActivityInitialDate,
    setAddActivityInitialDate,
  } = useFinance();

  // --------------------------------------------------------------------------
  // SLIDE CAROUSEL STATE (0: Dashboard, 1: Activity Calendar)
  // Supports touch swipe, arrow controls, and header toggle
  // --------------------------------------------------------------------------
  const [activeSlide, setActiveSlide] = useState<0 | 1>(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStartCarousel = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEndCarousel = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    // Dominant horizontal swipe (> 45px)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 45) {
      if (deltaX < 0) {
        // Swiped left -> Calendar (Slide 1)
        setActiveSlide(1);
      } else {
        // Swiped right -> Dashboard (Slide 0)
        setActiveSlide(0);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // --------------------------------------------------------------------------
  // 1. THEME & GRAPHICS PERFORMANCE STATE
  // --------------------------------------------------------------------------
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('budgetflow_tablet_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('budgetflow_tablet_theme', next);
  };

  const [graphicsMode, setGraphicsMode] = useState<'lite' | 'rich'>(() => {
    const saved = localStorage.getItem('budgetflow_tablet_graphics') as 'lite' | 'rich' | null;
    if (saved) return saved;
    // Auto-detect budget/older tablets (quad-core or low hardware concurrency)
    if (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 4) <= 4) {
      return 'lite';
    }
    return 'rich';
  });

  const toggleGraphicsMode = () => {
    const next = graphicsMode === 'lite' ? 'rich' : 'lite';
    setGraphicsMode(next);
    localStorage.setItem('budgetflow_tablet_graphics', next);
  };

  // --------------------------------------------------------------------------
  // 2. VIEWPORT DIMENSIONS & ORIENTATION ENGINE
  // --------------------------------------------------------------------------
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isLandscape: typeof window !== 'undefined' ? window.innerWidth >= window.innerHeight : true,
    isCompactHeight: typeof window !== 'undefined' ? window.innerHeight < 660 : false,
    isSpaciousHeight: typeof window !== 'undefined' ? window.innerHeight > 860 : false,
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({
        width: w,
        height: h,
        isLandscape: w >= h,
        isCompactHeight: h < 660,
        isSpaciousHeight: h > 860,
      });
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const responsivePatternSize = useMemo(() => {
    return Math.max(180, Math.min(260, Math.floor(viewport.height * 0.32)));
  }, [viewport.height]);

  // --------------------------------------------------------------------------
  // 3. WAKE LOCK & FULLSCREEN APIS
  // --------------------------------------------------------------------------
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
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  // --------------------------------------------------------------------------
  // 4. BALANCES MODAL STATE & WALLET QUICK EDIT
  // --------------------------------------------------------------------------
  const [isViewBalancesOpen, setIsViewBalancesOpen] = useState(false);
  const [viewBalancesStep, setViewBalancesStep] = useState<'select-user' | 'verify-pattern' | 'wallets-view'>('select-user');
  const [activeBalancesUser, setActiveBalancesUser] = useState<FamilyUser | null>(null);
  const [editingWalletForBalance, setEditingWalletForBalance] = useState<WalletType | null>(null);
  const [editBalanceInput, setEditBalanceInput] = useState<string>('');
  const [editBalanceError, setEditBalanceError] = useState<string>('');
  const [editBalanceSuccess, setEditBalanceSuccess] = useState<string>('');

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

  // --------------------------------------------------------------------------
  // 5. KIOSK LOGGING MODAL STATE
  // --------------------------------------------------------------------------
  const [isKioskActionOpen, setIsKioskActionOpen] = useState(false);
  const [kioskStep, setKioskStep] = useState<'select-user' | 'verify-pattern' | 'amount-step' | 'category-step'>('select-user');
  const [activeKioskUser, setActiveKioskUser] = useState<FamilyUser | null>(null);

  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<number>(0);
  const [amountInputStr, setAmountInputStr] = useState<string>('');
  const [merchant, setMerchant] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || 'Groceries');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // --------------------------------------------------------------------------
  // 6. EXIT TABLET MODE CONFIRMATION MODAL STATE
  // --------------------------------------------------------------------------
  const [isExitTabletModalOpen, setIsExitTabletModalOpen] = useState(false);
  const [exitUser, setExitUser] = useState<FamilyUser | null>(null);

  const handleOpenExitModal = () => {
    const activeUser = familyUsers.find((u) => u.id === currentUser?.id);
    if (activeUser) {
      setExitUser(activeUser);
    } else if (familyUsers.length === 1) {
      setExitUser(familyUsers[0]);
    } else {
      setExitUser(null);
    }
    setIsExitTabletModalOpen(true);
    resetIdleTimer();
  };

  const handleCloseExitModal = () => {
    setIsExitTabletModalOpen(false);
    setExitUser(null);
  };

  const handleExitPatternVerified = async (pattern: number[]): Promise<boolean> => {
    if (!exitUser) return false;
    if (isSelfHosted) {
      const res = await api.verifyPattern(exitUser.id, pattern);
      if (!res.success) return false;
      if (res.token) api.setToken(res.token);
    } else if (exitUser.patternSequence && exitUser.patternSequence.length > 0) {
      const match = comparePatterns(exitUser.patternSequence, pattern);
      if (!match) return false;
    }
    switchUser(exitUser);
    setIsTabletMode(false);
    setIsExitTabletModalOpen(false);
    return true;
  };

  const idleTimerRef = useRef<any>(null);

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isKioskActionOpen || isViewBalancesOpen || isExitTabletModalOpen) {
      idleTimerRef.current = setTimeout(() => {
        handleCloseKioskAction();
        handleCloseViewBalances();
        handleCloseExitModal();
      }, 25000);
    }
  };

  // Periodic Auto-Refresh for 24/7 Tablet Kiosk (Default: 5 minutes)
  const isKioskBusyRef = useRef(false);
  isKioskBusyRef.current = isKioskActionOpen || isViewBalancesOpen || isExitTabletModalOpen;
  const pendingReloadRef = useRef(false);

  useEffect(() => {
    const isAutoRefreshEnabled = preferences.tabletAutoRefreshEnabled ?? true;
    const intervalMinutes = preferences.tabletRefreshIntervalMinutes ?? 5;

    if (!isAutoRefreshEnabled || intervalMinutes <= 0) return;

    const intervalMs = intervalMinutes * 60 * 1000;

    const intervalId = setInterval(() => {
      if (isKioskBusyRef.current) {
        pendingReloadRef.current = true;
        return;
      }
      refreshData();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [preferences.tabletAutoRefreshEnabled, preferences.tabletRefreshIntervalMinutes, refreshData]);

  useEffect(() => {
    if (!isKioskActionOpen && !isViewBalancesOpen && !isExitTabletModalOpen && pendingReloadRef.current) {
      const graceTimer = setTimeout(() => {
        if (!isKioskBusyRef.current) {
          pendingReloadRef.current = false;
          refreshData();
        }
      }, 5000);
      return () => clearTimeout(graceTimer);
    }
  }, [isKioskActionOpen, isViewBalancesOpen, isExitTabletModalOpen, refreshData]);

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
    if (isSelfHosted) {
      const res = await api.verifyPattern(activeKioskUser.id, pattern);
      if (!res.success) return false;
      if (res.token) api.setToken(res.token);
    } else if (activeKioskUser.patternSequence && activeKioskUser.patternSequence.length > 0) {
      const match = comparePatterns(activeKioskUser.patternSequence, pattern);
      if (!match) return false;
    }

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

    saveAll().catch((saveErr) => {
      console.error('Failed to auto-save tablet transaction:', saveErr);
    });

    if (graphicsMode !== 'lite') {
      triggerConfetti();
    }
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

  // --------------------------------------------------------------------------
  // 6. MEMOIZED METRICS
  // --------------------------------------------------------------------------
  const activeUserWallets = useMemo(() => {
    if (!activeKioskUser) return wallets;
    return activeKioskUser.role === 'admin' || activeKioskUser.allowedWalletIds.length === 0
      ? wallets
      : wallets.filter((w) => activeKioskUser.allowedWalletIds.includes(w.id));
  }, [activeKioskUser, wallets]);

  const userWalletsForBalances = useMemo(() => {
    if (!activeBalancesUser) return [];
    return activeBalancesUser.role === 'admin' || activeBalancesUser.allowedWalletIds.length === 0
      ? wallets
      : wallets.filter((w) => activeBalancesUser.allowedWalletIds.includes(w.id));
  }, [activeBalancesUser, wallets]);

  const totalUserBalance = useMemo(() => {
    return userWalletsForBalances.reduce(
      (acc, w) => acc + (w.type === 'credit' ? -w.balance : w.balance),
      0
    );
  }, [userWalletsForBalances]);

  const totalGoalCurrent = useMemo(() => goals.reduce((acc, g) => acc + g.currentAmount, 0), [goals]);
  const totalGoalTarget = useMemo(() => goals.reduce((acc, g) => acc + g.targetAmount, 0), [goals]);
  const totalGoalPercent = totalGoalTarget > 0 ? Math.round((totalGoalCurrent / totalGoalTarget) * 100) : 0;

  // --------------------------------------------------------------------------
  // 7. THEME & GRAPHICS STYLING CLASSES
  // --------------------------------------------------------------------------
  const isDark = theme === 'dark';
  const isLite = graphicsMode === 'lite';

  const rootBgClass = isDark
    ? isLite
      ? 'bg-slate-950 text-white'
      : 'bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white'
    : isLite
    ? 'bg-[#F0F6FA] text-slate-800'
    : 'bg-gradient-to-br from-slate-100 via-teal-50/40 to-sky-100/60 text-slate-800';

  const cardClass = isDark
    ? isLite
      ? 'bg-slate-900/95 border-slate-800 shadow-lg text-white'
      : 'bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl text-white'
    : isLite
    ? 'bg-white border-slate-200 shadow-sm text-slate-800'
    : 'bg-white/80 backdrop-blur-xl border-white/80 shadow-card text-slate-800';

  const bottomBarClass = isDark
    ? isLite
      ? 'bg-slate-900/95 border-slate-800 shadow-lg'
      : 'bg-white/10 backdrop-blur-2xl border-white/15 shadow-2xl'
    : isLite
    ? 'bg-white border-slate-200 shadow-sm'
    : 'bg-white/90 backdrop-blur-2xl border-white/90 shadow-card';

  const iconBtnClass = isDark
    ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
    : 'border-slate-200/90 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-950 shadow-xs';

  const rowClass = isDark
    ? isLite
      ? 'border-slate-800 bg-slate-800/60 text-slate-300'
      : 'border-white/5 bg-white/5 text-slate-300'
    : isLite
    ? 'border-slate-200/60 bg-slate-50 text-slate-800'
    : 'border-slate-100 bg-slate-50/80 text-slate-800';

  const clockFontSize = viewport.isCompactHeight
    ? 'text-3xl sm:text-5xl'
    : viewport.isSpaciousHeight
    ? 'text-6xl sm:text-8xl'
    : 'text-4xl sm:text-6xl';

  const clockDateSize = viewport.isCompactHeight
    ? 'text-[11px] sm:text-xs'
    : 'text-xs sm:text-sm';

  return (
    <div
      onMouseMove={resetIdleTimer}
      onTouchStart={resetIdleTimer}
      className={`h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between relative overflow-hidden select-none transition-all duration-200 ${
        viewport.isCompactHeight ? 'p-3 sm:p-4' : 'p-4 sm:p-6 lg:p-8'
      } ${rootBgClass}`}
    >
      {/* Ambient background orbs (Rich Mode Only - Disabled in Lite Mode for 60fps) */}
      {!isLite && (
        <div className="pointer-events-none">
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 left-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
      )}

      {/* ========================================================
          TOP BAR: Clock, Status & Ambient Controls
          ======================================================== */}
      <div className="flex items-center justify-between relative z-10 shrink-0 gap-3">
        {/* Isolated Clock Component */}
        <TabletClock
          theme={theme}
          fontSizeClass={clockFontSize}
          dateSizeClass={clockDateSize}
        />

        {/* Slide Carousel Switcher (Dashboard / Calendar) */}
        <div className="flex items-center p-1 rounded-2xl border bg-black/25 dark:bg-slate-900/60 border-white/10 shadow-xs">
          <button
            onClick={() => setActiveSlide(0)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
              activeSlide === 0
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>
          <button
            onClick={() => setActiveSlide(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 ${
              activeSlide === 1
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calendar</span>
          </button>
        </div>

        {/* Right Icon Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Guide Button */}
          <GuideButton
            guideId="tablet-mode"
            onOpenGuide={(id) => setIsGuideOpenWithId(id)}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 border ${iconBtnClass}`}
          />

          {/* Theme Toggle: Sun / Moon */}
          <button
            onClick={toggleTheme}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 border ${iconBtnClass}`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />}
          </button>

          {/* Lite Graphics / Performance Toggle: Bolt */}
          <button
            onClick={toggleGraphicsMode}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 border ${
              isLite
                ? 'bg-emerald-500/25 text-emerald-400 border-emerald-400/50 shadow-sm'
                : iconBtnClass
            }`}
            title={isLite ? 'Lite Graphics: ON (Tap for Rich Glassmorphism)' : 'Lite Graphics: OFF (Tap for Fast Mode)'}
            aria-label="Toggle Graphics Mode"
          >
            <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${isLite ? 'fill-emerald-400' : ''}`} />
          </button>

          {/* Refresh Data Button */}
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 border ${iconBtnClass}`}
            title="Fetch Latest Numbers"
            aria-label="Fetch Latest Numbers"
          >
            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
          </button>

          {/* Full Screen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 border ${
              isFullscreen
                ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50 shadow-sm'
                : iconBtnClass
            }`}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Screen Wake Lock Button */}
          <button
            onClick={toggleWakeLock}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 border ${
              isWakeLocked
                ? 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-sm'
                : iconBtnClass
            }`}
            title={isWakeLocked ? 'Screen Awake: ON' : 'Keep Screen Awake'}
            aria-label={isWakeLocked ? 'Awake: ON' : 'Keep Awake'}
          >
            <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Exit Tablet Mode Button */}
          <button
            onClick={handleOpenExitModal}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all flex items-center justify-center active:scale-95"
            title="Exit Tablet Mode"
            aria-label="Exit Tablet Mode"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================
          SWIPABLE CAROUSEL: DASHBOARD (SLIDE 0) & CALENDAR (SLIDE 1)
          Full touch swipe gestures + responsive across all tablet sizes
          ======================================================== */}
      <div
        onTouchStart={handleTouchStartCarousel}
        onTouchEnd={handleTouchEndCarousel}
        className="flex-1 min-h-0 w-full overflow-hidden relative z-10 my-2 sm:my-3"
      >
        <div
          className="h-full flex transition-transform duration-300 ease-out will-change-transform"
          style={{
            width: '200%',
            transform: activeSlide === 0 ? 'translateX(0%)' : 'translateX(-50%)',
          }}
        >
          {/* SLIDE 0: MAIN DASHBOARD */}
          <div className="w-1/2 h-full flex flex-col justify-between pr-1.5 sm:pr-3 min-h-0">
            {/* Center Glance: 2-Widget Grid */}
            <div
              className={`flex-1 min-h-0 mb-2 sm:mb-3 grid transition-all ${
                viewport.isLandscape ? 'grid-cols-2 gap-3 sm:gap-5' : 'grid-cols-1 gap-3 sm:gap-4'
              }`}
            >
              {/* WIDGET 1: Upcoming Bills Radar */}
              <div className={`rounded-2xl sm:rounded-3xl border flex flex-col min-h-0 justify-between p-3.5 sm:p-5 transition-all ${cardClass}`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold uppercase tracking-wider flex items-center space-x-1.5 text-xs ${isDark ? 'text-teal-300' : 'text-teal-800'}`}>
                      <Calendar className="w-4 h-4 text-cyan-400" />
                      <span>Upcoming Bills</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] sm:text-xs ${
                      isDark
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                    }`}>
                      {upcomingBillsCount} due soon
                    </span>
                  </div>
                  <div className="font-black text-2xl sm:text-4xl tracking-tight leading-tight">
                    {formatCurrency(upcomingBillsTotal, preferences.currency)}
                  </div>
                </div>

                {/* Scrollable list inside card */}
                <div className="mt-3 pt-2.5 border-t border-slate-500/15 flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
                  {bills
                    .filter((b) => !b.isPaid)
                    .slice(0, 5)
                    .map((bill) => (
                      <div
                        key={bill.id}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs ${rowClass}`}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-semibold block truncate">{bill.name}</span>
                          <span className="text-[10px] opacity-70">Due {formatDateDisplay(bill.dueDate)}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold block">
                            {formatCurrency(bill.amount, preferences.currency)}
                          </span>
                          {bill.autoPay && (
                            <span className="text-[9px] font-bold text-emerald-400 uppercase">AutoPay</span>
                          )}
                        </div>
                      </div>
                    ))}
                  {bills.filter((b) => !b.isPaid).length === 0 && (
                    <p className="italic text-xs opacity-60 text-center py-4">All bills paid!</p>
                  )}
                </div>
              </div>

              {/* WIDGET 2: List of Savings Goals */}
              <div className={`rounded-2xl sm:rounded-3xl border flex flex-col min-h-0 justify-between p-3.5 sm:p-5 transition-all ${cardClass}`}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold uppercase tracking-wider flex items-center space-x-1.5 text-xs ${isDark ? 'text-teal-300' : 'text-teal-800'}`}>
                      <Target className="w-4 h-4 text-emerald-400" />
                      <span>Savings Goals</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] sm:text-xs ${
                      isDark
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {goals.length} Active
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <div className="font-black text-2xl sm:text-4xl tracking-tight leading-tight">
                      {formatCurrency(totalGoalCurrent, preferences.currency)}
                    </div>
                    <span className="text-xs font-medium opacity-70">
                      of {formatCurrency(totalGoalTarget, preferences.currency)} ({totalGoalPercent}%)
                    </span>
                  </div>
                </div>

                {/* Scrollable list inside card */}
                <div className="mt-3 pt-2.5 border-t border-slate-500/15 flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
                  {goals.map((goal) => {
                    const pct = goal.targetAmount > 0
                      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                      : 0;
                    return (
                      <div
                        key={goal.id}
                        className={`p-2 sm:p-2.5 rounded-xl border space-y-1 text-xs ${rowClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
                            <span className="font-bold truncate">{goal.name}</span>
                          </div>
                          <span className="font-extrabold text-emerald-400 shrink-0">{pct}%</span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-slate-500/20 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: goal.color }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] opacity-70">
                          <span>{formatCurrency(goal.currentAmount, preferences.currency)} saved</span>
                          <span>Target: {formatCurrency(goal.targetAmount, preferences.currency)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {goals.length === 0 && (
                    <p className="italic text-xs opacity-60 text-center py-4">No active savings goals.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div
              className={`rounded-2xl sm:rounded-3xl border relative z-10 shrink-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-3 sm:p-4 transition-all ${bottomBarClass}`}
            >
              {/* Family Member Presence */}
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  {familyUsers.map((u) => (
                    <div
                      key={u.id}
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border-2 border-slate-900 text-lg sm:text-xl shadow-xs transform hover:scale-110 transition-transform"
                      style={{ backgroundColor: u.color }}
                      title={`${u.name} (${u.role})`}
                    >
                      <span>{u.avatar}</span>
                    </div>
                  ))}
                </div>
                <div className="text-left leading-tight">
                  <p className={`font-bold text-xs sm:text-sm uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Family Hub Ready
                  </p>
                  <p className={`text-[10px] sm:text-xs ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                    Tap to view balances or log an expense
                  </p>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Button 1: View Balances */}
                <button
                  onClick={handleOpenViewBalances}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    isDark
                      ? 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                      : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 shadow-sm'
                  }`}
                >
                  <Eye className="w-4 h-4 text-teal-400" />
                  <span>View balances</span>
                </button>

                {/* Button 2: + Log */}
                <button
                  onClick={handleOpenLogExpense}
                  className={`flex-1 sm:flex-none px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                    isDark
                      ? 'bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500 text-slate-950 shadow-teal-500/25'
                      : 'bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white shadow-teal-600/25'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>+ Log</span>
                </button>
              </div>
            </div>
          </div>

          {/* SLIDE 1: INTERACTIVE ACTIVITY CALENDAR */}
          <div className="w-1/2 h-full flex flex-col min-h-0 pl-1.5 sm:pl-3">
            <TabletActivityCalendar
              viewport={viewport}
              theme={theme}
              isLite={isLite}
              onOpenAddActivity={(dateStr?: string) => {
                if (dateStr) setAddActivityInitialDate(dateStr);
                setIsAddActivityOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Slide Indicators & Quick Navigation Bar */}
      <div className="flex items-center justify-between px-2 pt-0.5 pb-0 text-xs shrink-0 select-none">
        <button
          onClick={() => setActiveSlide(0)}
          className={`flex items-center gap-1 transition-all active:scale-95 ${
            activeSlide === 0
              ? 'text-teal-400 font-bold opacity-100'
              : 'text-slate-400 opacity-60 hover:opacity-100'
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Overview</span>
        </button>

        <div className="flex items-center gap-1.5 py-0.5 px-3 rounded-full bg-slate-900/40 border border-white/5">
          <button
            onClick={() => setActiveSlide(0)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              activeSlide === 0 ? 'w-5 bg-teal-400' : 'w-1.5 bg-slate-500/40 hover:bg-slate-400'
            }`}
            title="Overview Slide"
            aria-label="Overview Slide"
          />
          <button
            onClick={() => setActiveSlide(1)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              activeSlide === 1 ? 'w-5 bg-teal-400' : 'w-1.5 bg-slate-500/40 hover:bg-slate-400'
            }`}
            title="Calendar Slide"
            aria-label="Calendar Slide"
          />
          <span className="text-[10px] ml-1 text-slate-400 font-medium tracking-wider uppercase opacity-70">
            Swipe ⇄
          </span>
        </div>

        <button
          onClick={() => setActiveSlide(1)}
          className={`flex items-center gap-1 transition-all active:scale-95 ${
            activeSlide === 1
              ? 'text-teal-400 font-bold opacity-100'
              : 'text-slate-400 opacity-60 hover:opacity-100'
          }`}
        >
          <span className="hidden sm:inline text-[11px]">Calendar</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ========================================================
          RESPONSIVE MODAL: VIEW BALANCES OVERLAY
          ======================================================== */}
      {isViewBalancesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full max-h-[88dvh] flex flex-col p-5 sm:p-6 shadow-2xl border border-slate-100 relative text-slate-800 transform-gpu"
            style={{ transform: 'translateZ(0)' }}
          >
            <button
              onClick={handleCloseViewBalances}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 1: Select User */}
            {viewBalancesStep === 'select-user' && (
              <div className="text-center space-y-4">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-2">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Which user wishes to view?</h3>
                  <p className="text-xs text-slate-500">Select your profile to view personal & shared balances.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {familyUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectBalancesUser(user)}
                      className="flex flex-col items-center p-3 rounded-2xl border-2 border-slate-100 hover:border-teal-400 hover:bg-teal-50/50 transition-all"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs mb-1"
                        style={{ backgroundColor: `${user.color}20` }}
                      >
                        <span>{user.avatar}</span>
                      </div>
                      <span className="font-bold text-slate-800 text-xs">{user.name}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-400">{user.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Pattern Verification (Responsive PatternLock Size) */}
            {viewBalancesStep === 'verify-pattern' && activeBalancesUser && (
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${activeBalancesUser.color}20` }}
                  >
                    <span>{activeBalancesUser.avatar}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeBalancesUser.name}, draw your pattern
                  </h3>
                </div>

                <div className="flex justify-center">
                  <PatternLock
                    mode="verify"
                    size={responsivePatternSize}
                    onComplete={handleBalancesPatternVerified}
                    onCancel={() => setViewBalancesStep('select-user')}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Wallets List */}
            {viewBalancesStep === 'wallets-view' && activeBalancesUser && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{activeBalancesUser.avatar}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{activeBalancesUser.name}'s Wallets</h4>
                      <span className="text-[10px] text-teal-600 font-bold uppercase">Pattern Verified ✓</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewBalancesStep('select-user')}
                    className="text-xs font-bold text-teal-600 hover:underline"
                  >
                    Switch User
                  </button>
                </div>

                {/* Net Balance Pill */}
                <div className="p-3 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-emerald-500/10 rounded-2xl border border-teal-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">Total Net Balance</span>
                    <span className="text-xl font-black text-slate-900">
                      {formatCurrency(totalUserBalance, preferences.currency)}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {userWalletsForBalances.length} Wallet(s) Active
                  </span>
                </div>

                {/* Wallets List with inline quick edit */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {userWalletsForBalances.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: w.color }}
                        >
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{w.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{w.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-sm ${w.type === 'credit' ? 'text-rose-600' : 'text-slate-900'}`}>
                          {w.type === 'credit' ? '-' : ''}
                          {formatCurrency(w.balance, preferences.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartEditWallet(w)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleCloseViewBalances}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          RESPONSIVE MODAL: LOG EXPENSE OVERLAY
          ======================================================== */}
      {isKioskActionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90dvh] flex flex-col p-5 sm:p-6 shadow-2xl border border-slate-100 relative text-slate-800 transform-gpu"
            style={{ transform: 'translateZ(0)' }}
          >
            <button
              onClick={handleCloseKioskAction}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 1: Select User */}
            {kioskStep === 'select-user' && (
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Who is logging?</h3>
                  <p className="text-xs text-slate-500">Tap your avatar to log an expense or deposit.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {familyUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="flex flex-col items-center p-3 rounded-2xl border-2 border-slate-100 hover:border-teal-400 hover:bg-teal-50/50 transition-all"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs mb-1"
                        style={{ backgroundColor: `${user.color}20` }}
                      >
                        <span>{user.avatar}</span>
                      </div>
                      <span className="font-bold text-slate-800 text-xs">{user.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Pattern Verification */}
            {kioskStep === 'verify-pattern' && activeKioskUser && (
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">{activeKioskUser.avatar}</span>
                  <h3 className="text-base font-bold text-slate-800">
                    {activeKioskUser.name}, draw your pattern
                  </h3>
                </div>
                <div className="flex justify-center">
                  <PatternLock
                    mode="verify"
                    size={responsivePatternSize}
                    onComplete={handlePatternVerified}
                    onCancel={() => setKioskStep('select-user')}
                  />
                </div>
              </div>
            )}

            {/* STEP 3A: Amount & Quick Increments */}
            {kioskStep === 'amount-step' && activeKioskUser && (
              <div className="space-y-3.5 text-left">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{activeKioskUser.avatar}</span>
                    <span className="font-bold text-xs text-slate-800">{activeKioskUser.name}</span>
                  </div>
                  {/* Segmented Type Toggle */}
                  <div className="bg-slate-100 p-0.5 rounded-xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTransactionType('expense');
                        resetIdleTimer();
                      }}
                      className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 ${
                        transactionType === 'expense'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Expense</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTransactionType('income');
                        resetIdleTimer();
                      }}
                      className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 ${
                        transactionType === 'income'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Income</span>
                    </button>
                  </div>
                </div>

                {/* Amount input */}
                <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                    Amount ({preferences.currency})
                  </span>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl font-black text-teal-600">{preferences.currencySymbol}</span>
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
                      className="text-4xl font-black text-slate-900 tracking-tight text-center max-w-[180px] bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                {/* +/- Adjuster Chips */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="w-10 text-[9px] font-bold uppercase text-rose-500 text-right">Minus</span>
                    {incrementValues.map((val) => (
                      <button
                        key={`m-${val}`}
                        type="button"
                        onClick={() => handleAdjustAmount(-val)}
                        disabled={amount <= 0}
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 active:scale-95 disabled:opacity-30"
                      >
                        -{val}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="w-10 text-[9px] font-bold uppercase text-emerald-600 text-right">Add</span>
                    {incrementValues.map((val) => (
                      <button
                        key={`p-${val}`}
                        type="button"
                        onClick={() => handleAdjustAmount(val)}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 active:scale-95"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Merchant */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Description / Merchant
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => {
                      setMerchant(e.target.value);
                      resetIdleTimer();
                    }}
                    placeholder="e.g. Grocery, Coffee, Gas"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-400"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setKioskStep('select-user')}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={amount <= 0}
                    onClick={() => setKioskStep('category-step')}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                  >
                    <span>Next: Category & Wallet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3B: Category & Wallet Selection */}
            {kioskStep === 'category-step' && activeKioskUser && (
              <div className="space-y-3.5 text-left">
                {actionSuccessMessage ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-emerald-800 font-bold text-xs flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{actionSuccessMessage}</span>
                  </div>
                ) : (
                  <>
                    {/* Category Grid */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Select Category
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
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
                              className={`p-2 rounded-xl border text-left flex items-center gap-2 text-xs transition-all ${
                                isSelected
                                  ? 'border-teal-500 bg-teal-50 text-teal-950 font-bold ring-1 ring-teal-400'
                                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${c.color}20`, color: c.color }}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="truncate">{c.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Wallet Grid */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Select Spending Wallet
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
                              className={`p-2 rounded-xl border text-left flex items-center gap-2 text-xs transition-all ${
                                isSelected
                                  ? 'border-teal-500 bg-teal-50 text-teal-950 font-bold ring-1 ring-teal-400'
                                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                                style={{ backgroundColor: w.color }}
                              >
                                <Wallet className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate font-semibold">{w.name}</span>
                                <span className="text-[9px] text-slate-400 block uppercase font-mono">{w.type}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setKioskStep('amount-step')}
                        className="text-xs text-slate-500 hover:text-slate-800"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmitTransaction()}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save Transaction</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          RESPONSIVE MODAL: EXIT TABLET MODE PATTERN CONFIRMATION
          ======================================================== */}
      {isExitTabletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full max-h-[90dvh] flex flex-col p-5 sm:p-6 shadow-2xl border border-slate-100 relative text-slate-800 transform-gpu"
            style={{ transform: 'translateZ(0)' }}
          >
            <button
              onClick={handleCloseExitModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STEP 1: Select User if no user selected */}
            {!exitUser ? (
              <div className="text-center space-y-4">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
                    <LogOut className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Exit Tablet Mode</h3>
                  <p className="text-xs text-slate-500">Select your profile to enter your pattern</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {familyUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setExitUser(user)}
                      className="flex flex-col items-center p-3 rounded-2xl border-2 border-slate-100 hover:border-teal-400 hover:bg-teal-50/50 transition-all"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs mb-1"
                        style={{ backgroundColor: `${user.color}20` }}
                      >
                        <span>{user.avatar}</span>
                      </div>
                      <span className="font-bold text-slate-800 text-xs">{user.name}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-400">{user.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* STEP 2: Draw Pattern */
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-2 mb-3 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold">
                  <span className="text-base sm:text-lg">{exitUser.avatar}</span>
                  <span>{exitUser.name}, draw pattern to exit</span>
                </div>

                <div className="bg-slate-50/80 backdrop-blur-md p-3 sm:p-4 rounded-3xl border border-slate-200/80 shadow-inner">
                  <PatternLock
                    mode="verify"
                    size={responsivePatternSize}
                    title="Exit Tablet Mode"
                    subtitle="Connect at least 4 dots to unlock"
                    onComplete={handleExitPatternVerified}
                    onCancel={handleCloseExitModal}
                  />
                </div>

                {familyUsers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setExitUser(null)}
                    className="mt-3 text-xs text-teal-600 font-semibold hover:underline"
                  >
                    Switch Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          ADD ACTIVITY MODAL (TABLET COMPATIBLE)
          ======================================================== */}
      <AddActivityModal
        isOpen={isAddActivityOpen}
        onClose={() => setIsAddActivityOpen(false)}
        initialDate={addActivityInitialDate}
      />
    </div>
  );
};

export default TabletKioskView;
