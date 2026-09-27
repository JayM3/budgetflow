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
  CheckCircle2,
  Check,
  X,
  Sparkles,
  HelpCircle,
  Eye,
  LogOut,
  RotateCcw,
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
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { FamilyUser, Wallet as WalletType } from '../../types/finance';
import { PatternLock } from '../auth/PatternLock';
import { comparePatterns } from '../../utils/patternAuth';
import { formatCurrency, formatCurrencyExact } from '../../utils/formatters';
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
    familyUsers,
    wallets,
    categories,
    addTransaction,
    setIsTabletMode,
    setIsGuideOpenWithId,
    triggerConfetti,
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
      setDateStr(
        now.toLocaleDateString([], {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
      );
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

  // Kiosk Logging Modal Flow
  const [isKioskActionOpen, setIsKioskActionOpen] = useState(false);
  const [kioskStep, setKioskStep] = useState<'select-user' | 'verify-pattern' | 'amount-step' | 'category-step'>('select-user');
  const [activeKioskUser, setActiveKioskUser] = useState<FamilyUser | null>(null);

  // Quick Add Form Data
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
    if (isKioskActionOpen) {
      idleTimerRef.current = setTimeout(() => {
        handleCloseKioskAction();
      }, 25000);
    }
  };

  const handleOpenLogExpense = () => {
    setIsKioskActionOpen(true);
    setKioskStep('select-user');
    setActiveKioskUser(null);
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

  const handlePatternVerified = (pattern: number[]) => {
    if (!activeKioskUser) return false;

    // Pattern matching
    if (activeKioskUser.patternSequence && activeKioskUser.patternSequence.length > 0) {
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

  const handleSubmitExpense = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (amount <= 0) return;

    addTransaction({
      merchant: merchant.trim() || selectedCategory,
      amount,
      category: selectedCategory,
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      walletId: selectedWalletId,
      userId: activeKioskUser?.id,
      userName: activeKioskUser?.name,
    });

    triggerConfetti();
    setActionSuccessMessage(`Logged ${formatCurrency(amount, preferences.currency)} by ${activeKioskUser?.name}!`);

    setTimeout(() => {
      handleCloseKioskAction();
    }, 1500);
  };

  const handleCloseKioskAction = () => {
    setIsKioskActionOpen(false);
    setKioskStep('select-user');
    setActiveKioskUser(null);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  };

  // Filter wallets for active kiosk user
  const activeUserWallets = activeKioskUser
    ? activeKioskUser.role === 'admin' || activeKioskUser.allowedWalletIds.length === 0
      ? wallets
      : wallets.filter((w) => activeKioskUser.allowedWalletIds.includes(w.id))
    : wallets;

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
              className={`font-semibold text-teal-300 uppercase tracking-widest mt-1 ${
                isJumbo ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
              }`}
            >
              {dateStr}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-white/10 rounded-full text-xs text-teal-200 backdrop-blur-md border border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Perpetual Hub Kiosk</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <GuideButton
            guideId="tablet-mode"
            onOpenGuide={(id) => setIsGuideOpenWithId(id)}
            className="text-white hover:text-teal-300"
          />

          {/* Scale Switcher: Standard vs Jumbo Room View */}
          <button
            onClick={toggleScaleMode}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all active:scale-95 ${
              isJumbo
                ? 'bg-teal-500/25 text-teal-300 border-teal-400/50 shadow-lg shadow-teal-500/20'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title="Toggle between Standard Display and Jumbo Room Scale"
          >
            {isJumbo ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isJumbo ? 'Scale: Jumbo' : 'Scale: Standard'}
            </span>
          </button>

          {/* Full Screen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all active:scale-95 ${
              isFullscreen
                ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}
            </span>
          </button>

          {/* Wake Lock Button */}
          <button
            onClick={toggleWakeLock}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all active:scale-95 ${
              isWakeLocked
                ? 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title="Keep tablet screen awake perpetually"
          >
            <Sun className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isWakeLocked ? 'Awake: ON' : 'Keep Awake'}
            </span>
          </button>

          {/* Exit Tablet Mode Button */}
          <button
            onClick={() => setIsTabletMode(false)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all flex items-center space-x-1.5 active:scale-95"
            title="Exit Tablet Mode to Standard Desktop"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* CENTER GLANCE: Three Big Ambient Cards */}
      <div
        className={`grid grid-cols-1 md:grid-cols-3 gap-6 my-6 relative z-10 transition-all ${
          isJumbo ? 'gap-8 my-8' : 'gap-6 my-6'
        }`}
      >
        {/* CARD 1: Safe-to-Spend Daily Pace */}
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
                <Flame className={`${isJumbo ? 'w-5 h-5' : 'w-4 h-4'} text-emerald-400`} />
                <span>Daily Safe-to-Spend</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ${
                  isJumbo ? 'text-xs' : 'text-[10px]'
                }`}
              >
                {safeToSpendMetrics.paceLabel}
              </span>
            </div>
            <div
              className={`font-black text-white tracking-tight ${
                isJumbo ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-4xl'
              }`}
            >
              {formatCurrency(safeToSpendMetrics.safePerDay, preferences.currency)}
              <span className={`font-medium text-slate-400 ${isJumbo ? 'text-base' : 'text-sm'}`}>
                {' '}
                / day
              </span>
            </div>
          </div>
          <div
            className={`mt-4 pt-4 border-t border-white/10 text-slate-300 flex items-center justify-between ${
              isJumbo ? 'text-sm' : 'text-xs'
            }`}
          >
            <span>{safeToSpendMetrics.daysRemainingInMonth} days left this month</span>
            <span className="text-emerald-400 font-semibold">
              {formatCurrency(safeToSpendMetrics.safePerDay * 7, preferences.currency)} / wk
            </span>
          </div>
        </div>

        {/* CARD 2: Monthly Budget Health */}
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
                <Wallet className={`${isJumbo ? 'w-5 h-5' : 'w-4 h-4'} text-teal-400`} />
                <span>Household Budget</span>
              </span>
              <span className={`font-bold text-slate-200 ${isJumbo ? 'text-sm' : 'text-xs'}`}>
                {spentPercentage.toFixed(0)}% Used
              </span>
            </div>
            <div
              className={`font-black text-white tracking-tight ${
                isJumbo ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-4xl'
              }`}
            >
              {formatCurrency(remainingBudget, preferences.currency)}
              <span className={`font-medium text-slate-400 ${isJumbo ? 'text-base' : 'text-sm'}`}>
                {' '}
                left
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className={`w-full rounded-full bg-white/10 overflow-hidden ${isJumbo ? 'h-4' : 'h-3'}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  spentPercentage > 90
                    ? 'bg-rose-500'
                    : spentPercentage > 75
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                }`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
            <div
              className={`flex justify-between text-slate-400 mt-2 font-medium ${
                isJumbo ? 'text-xs' : 'text-[11px]'
              }`}
            >
              <span>Spent: {formatCurrency(totalSpent, preferences.currency)}</span>
              <span>Total: {formatCurrency(totalBudget, preferences.currency)}</span>
            </div>
          </div>
        </div>

        {/* CARD 3: Upcoming Bills Radar */}
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

          <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
            {bills.filter((b) => !b.isPaid).slice(0, 2).map((bill) => (
              <div
                key={bill.id}
                className={`flex items-center justify-between text-slate-300 ${
                  isJumbo ? 'text-sm' : 'text-xs'
                }`}
              >
                <span className="truncate max-w-[160px]">{bill.name}</span>
                <span className="font-semibold text-white">
                  {formatCurrency(bill.amount, preferences.currency)}
                </span>
              </div>
            ))}
            {bills.filter((b) => !b.isPaid).length === 0 && (
              <p className={`text-slate-400 italic ${isJumbo ? 'text-sm' : 'text-xs'}`}>
                All bills paid!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR: Seamless Fast-Add for Tablet */}
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
              Tap below to log expenses with 9-dot pattern check
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleOpenLogExpense}
          className={`w-full sm:w-auto bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500 hover:from-teal-300 hover:to-emerald-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-teal-500/25 flex items-center justify-center space-x-3 transition-all active:scale-95 group ${
            isJumbo ? 'px-10 py-5 text-xl' : 'px-8 py-4 text-base sm:text-lg'
          }`}
        >
          <PlusCircle className="w-6 h-6 text-slate-950 group-hover:rotate-90 transition-transform duration-300" />
          <span>+ Log Expense (Touch)</span>
        </button>
      </div>

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
                    Who is spending?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select your avatar to unlock your personal expense wallet.
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

            {/* STEP 3A: Progressive Expense Logger - Part 1: Amount */}
            {kioskStep === 'amount-step' && activeKioskUser && (
              <div className="space-y-5 text-left">
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

                {/* Amount Display */}
                <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-100 p-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                    Enter Amount ({preferences.currency})
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
                    Merchant or Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => {
                      setMerchant(e.target.value);
                      resetIdleTimer();
                    }}
                    placeholder="e.g. Grocery Store, Coffee, Bakery"
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
                    <span>Next: Category & Wallet</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3B: Progressive Expense Logger - Part 2: Category & Account as Buttons */}
            {kioskStep === 'category-step' && activeKioskUser && (
              <div className="space-y-4 text-left">
                {/* Amount Summary Pill */}
                <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                        onClick={() => handleSubmitExpense()}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
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
    </div>
  );
};
