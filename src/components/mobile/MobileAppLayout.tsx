import React, { useState, useMemo } from 'react';
import {
  Home,
  Receipt,
  PieChart,
  Target,
  MoreHorizontal,
  Search,
  Bell,
  Plus,
  ChevronRight,
  TrendingUp,
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  DollarSign,
  Moon,
  Sun,
  Monitor,
  X,
  Sliders,
  Filter,
  ArrowLeft,
  ShoppingBag,
  Car,
  Zap,
  Utensils,
  HeartPulse,
  Gamepad2,
  Coffee,
  Tag,
  Film,
  Plane,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Calendar,
  Smartphone,
  Tablet,
  ChevronDown,
  Info,
  Clock,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatCurrencyExact, formatDateDisplay } from '../../utils/formatters';
import { BudgetCategory, Transaction } from '../../types/finance';
import logoImg from '../../assets/logo.png';

// Subviews available through the "More" tab
import { WalletsView } from '../views/WalletsView';
import { BillsView } from '../views/BillsView';
import { FamilyMembersView } from '../views/FamilyMembersView';
import { SettingsView } from '../views/SettingsView';

const ReportsView = React.lazy(() =>
  import('../views/ReportsView').then((m) => ({ default: m.ReportsView }))
);

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  Home,
  Car,
  Zap,
  Utensils,
  HeartPulse,
  Gamepad2,
  Coffee,
  Tag,
  Film,
  Plane,
};

type MobileTab = 'home' | 'transactions' | 'budgets' | 'goals' | 'more';
type MobileSubView = 'wallets' | 'bills' | 'reports' | 'family' | 'settings' | null;

export const MobileAppLayout: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    categories,
    transactions,
    totalBudget,
    totalSpent,
    totalIncome,
    remainingBudget,
    spentPercentage,
    savingsRate,
    wallets,
    goals,
    currentUser,
    setIsUserSelectModalOpen,
    setIsQuickAddOpen,
    setIsTabletMode,
    theme,
    setTheme,
    isDarkMode,
    previewMobileOnPc,
    setPreviewMobileOnPc,
    deleteTransaction,
    contributeToGoal,
    updateCategoryAllocation,
    deviceScreen,
    displayScale,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [subView, setSubView] = useState<MobileSubView>(null);

  // Dynamic scaling based on detected screen resolution (e.g. 2712x1220) and user preference
  const isSpacious = useMemo(() => {
    if (displayScale === 'large' || displayScale === 'comfortable') return true;
    if (displayScale === 'standard') return false;
    return Boolean(
      deviceScreen?.isHighResPhone ||
      deviceScreen?.isTallPhone ||
      deviceScreen?.isSpaciousHeight ||
      (deviceScreen?.viewportHeight && deviceScreen.viewportHeight >= 820)
    );
  }, [displayScale, deviceScreen]);

  // Home & Global Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Budgets Tab Filter
  const [budgetCategorySearch, setBudgetCategorySearch] = useState('');

  // Transactions Tab Filter
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');
  const [txSearchQuery, setTxSearchQuery] = useState('');

  // Category Detail Modal (for budget adjustment)
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [editAllocationAmount, setEditAllocationAmount] = useState<string>('');

  // Quick Contribute Modal for Goals
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState<string>('50');

  // Notifications dropdown
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = currentUser?.name || preferences.userName || 'Alex';

  // Total balance calculation from active wallets
  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, w) => sum + (w.type === 'credit' ? -w.balance : w.balance), 0);
  }, [wallets]);

  // Filtered categories for Budgets Tab (Screen 2)
  const filteredBudgetCategories = useMemo(() => {
    return categories
      .map((cat) => {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.category.toLowerCase() === cat.name.toLowerCase())
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          ...cat,
          spent: Math.round(spent),
          percent: cat.allocated > 0 ? Math.min(100, Math.round((spent / cat.allocated) * 100)) : 0,
        };
      })
      .filter((cat) =>
        cat.name.toLowerCase().includes(budgetCategorySearch.toLowerCase())
      );
  }, [categories, transactions, budgetCategorySearch]);

  // Filtered transactions for Transactions Tab
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
      if (txCategoryFilter !== 'all' && tx.category.toLowerCase() !== txCategoryFilter.toLowerCase())
        return false;
      if (txSearchQuery.trim()) {
        const q = txSearchQuery.toLowerCase();
        const matchMerchant = tx.merchant.toLowerCase().includes(q);
        const matchCategory = tx.category.toLowerCase().includes(q);
        const matchNotes = tx.notes?.toLowerCase().includes(q);
        if (!matchMerchant && !matchCategory && !matchNotes) return false;
      }
      return true;
    });
  }, [transactions, txTypeFilter, txCategoryFilter, txSearchQuery]);

  // Recent transactions: show 7 on tall/spacious phones (e.g. 2712x1220) to eliminate empty dead space, 5 on compact
  const recentTransactions = useMemo(() => {
    const limit = isSpacious ? 7 : 5;
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [transactions, isSpacious]);

  // Adaptive SVG Donut Math (144px on spacious/high-res phones, 122px on compact phones)
  const donutSize = isSpacious ? 144 : 122;
  const strokeWidth = isSpacious ? 15 : 13;
  const donutRadius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * donutRadius;
  const strokeDashoffset = circumference - (spentPercentage / 100) * circumference;

  // Handle Tab Change
  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
    setSubView(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen bg-[#F0F6FA] dark:bg-[#0B131F] text-slate-800 dark:text-slate-100 transition-colors ${
        previewMobileOnPc
          ? 'max-w-md mx-auto shadow-2xl border-x border-slate-200/80 dark:border-[#1F304B] relative'
          : 'w-full'
      }`}
    >
      {/* PC Preview Mode Banner (Allows PC users to easily exit preview) */}
      {previewMobileOnPc && (
        <div className="sticky top-0 z-50 bg-teal-600 text-white px-3.5 py-1.5 flex items-center justify-between text-xs font-bold shadow-md">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>PC Mobile Preview Active</span>
          </div>
          <button
            onClick={() => setPreviewMobileOnPc(false)}
            className="px-2 py-0.5 rounded bg-black/25 hover:bg-black/40 text-teal-100 font-bold active:scale-95 transition-all"
          >
            Exit to Desktop ✕
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 1. TOP MOBILE APP BAR (Matching Screenshot)                             */}
      {/* ---------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#111C2D]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-[#1F304B] px-4 py-3 transition-colors">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Name */}
          <div
            onClick={() => handleTabChange('home')}
            className="flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-600 p-0.5 shadow-sm flex items-center justify-center">
              <img src={logoImg} alt="BudgetFlow" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              Budget<span className="text-teal-600 dark:text-teal-400">Flow</span>
            </h1>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Quick 1-Click Dark/Light Mode Toggle */}
            <button
              onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A283E] active:scale-90 transition-all"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Tablet Mode Quick Launcher Button */}
            <button
              onClick={() => setIsTabletMode(true)}
              className="p-2 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-slate-100 dark:hover:bg-[#1A283E] active:scale-90 transition-all"
              title="Switch to Perpetual Tablet Mode"
              aria-label="Switch to Tablet Mode"
            >
              <Tablet className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A283E] active:scale-90 transition-all relative"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              </button>

              {/* Notification Popover */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 p-3.5 bg-white dark:bg-[#131F33] rounded-2xl shadow-xl border border-slate-200/80 dark:border-[#1F304B] z-50 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1F304B]">
                    <span className="font-bold text-slate-800 dark:text-white">Smart Insights</span>
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200">
                    <p className="font-bold text-xs">Safe-to-Spend on Track</p>
                    <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">
                      You are pacing at {spentPercentage}% of monthly envelope limits.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200">
                    <p className="font-bold text-xs">Savings Rate Healthy</p>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-0.5">
                      Household savings rate is currently {savingsRate}%.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Circle */}
            <button
              onClick={() => setIsUserSelectModalOpen(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-400 text-white font-bold text-xs flex items-center justify-center shadow-sm active:scale-90 transition-all border border-white/20"
              title="Switch Family Member"
            >
              {currentUser?.avatar || userName.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </div>

        {/* Global Search Input (Toggled) */}
        {isSearchOpen && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-[#1F304B]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search across transactions and budgets..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-[#1A283E] text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
              <button
                onClick={() => {
                  setGlobalSearch('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. MAIN SCROLLABLE CONTENT BODY                                        */}
      {/* ---------------------------------------------------------------------- */}
      <main className={`px-4 py-4 pb-28 ${isSpacious ? 'space-y-6' : 'space-y-4'}`}>
        {/* Render Subview if selected from "More" tab */}
        {subView ? (
          <div className="space-y-4">
            <button
              onClick={() => setSubView(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#131F33] border border-slate-200/80 dark:border-[#1F304B] text-xs font-bold text-teal-600 dark:text-teal-400 shadow-sm active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to More Hub</span>
            </button>

            {subView === 'wallets' && <WalletsView />}
            {subView === 'bills' && <BillsView />}
            {subView === 'family' && <FamilyMembersView />}
            {subView === 'settings' && <SettingsView />}
            {subView === 'reports' && (
              <React.Suspense fallback={<div className="p-8 text-center text-slate-400">Loading reports...</div>}>
                <ReportsView />
              </React.Suspense>
            )}
          </div>
        ) : (
          <>
            {/* ================================================================ */}
            {/* TAB: HOME (SCREEN 1 OF SCREENSHOT)                                */}
            {/* ================================================================ */}
            {activeTab === 'home' && (
              <>
                {/* Greeting & Date */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {greeting}, {userName} 👋
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Here's your financial overview for this month.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setIsTabletMode(true)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/25 shadow-xs text-xs font-bold active:scale-95 transition-all"
                      title="Switch to Perpetual Tablet Mode"
                      aria-label="Switch to Tablet Mode"
                    >
                      <Tablet className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                      <span>Tablet</span>
                    </button>
                    <div className="px-3 py-1 rounded-full bg-white dark:bg-[#131F33] border border-slate-200/80 dark:border-[#1F304B] text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                      {preferences.selectedMonth}
                    </div>
                  </div>
                </div>

                {/* This Month's Budget Donut Card (Matching Screenshot Screen 1) */}
                <div className={`bg-white dark:bg-[#131F33] rounded-3xl ${isSpacious ? 'p-6' : 'p-5'} border border-slate-100 dark:border-[#1F304B] shadow-card transition-colors`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">This Month's Budget</h3>
                    <span className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400">
                      {spentPercentage}% spent
                    </span>
                  </div>

                  <div className="flex items-center justify-around gap-4 py-1">
                    {/* Compact / Spacious SVG Donut */}
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg width={donutSize} height={donutSize} className="rotate-[-90deg]">
                        <circle
                          cx={donutSize / 2}
                          cy={donutSize / 2}
                          r={donutRadius}
                          fill="transparent"
                          stroke={isDarkMode ? '#1E2D44' : '#E2E8F0'}
                          strokeWidth={strokeWidth}
                        />
                        <circle
                          cx={donutSize / 2}
                          cy={donutSize / 2}
                          r={donutRadius}
                          fill="transparent"
                          stroke="#0D9488"
                          strokeWidth={strokeWidth}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      {/* Center percentage */}
                      <div className="absolute text-center">
                        <span className={`${isSpacious ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-black text-slate-900 dark:text-white tracking-tight`}>
                          {spentPercentage}%
                        </span>
                        <span className="block text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                          Spent
                        </span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-3.5 shrink-0">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                          <span>Total Spent</span>
                        </div>
                        <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white ml-4 block mt-0.5">
                          {formatCurrency(totalSpent, preferences.currency)}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-[#1E2D44]" />
                          <span>Remaining</span>
                        </div>
                        <span className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400 ml-4 block mt-0.5">
                          {formatCurrency(remainingBudget, preferences.currency)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-[#1F304B]">
                        Cap: {formatCurrency(totalBudget, preferences.currency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2x2 Metric Cards Grid (Matching Screenshot Screen 1) */}
                <div className={`grid grid-cols-2 ${isSpacious ? 'gap-3.5' : 'gap-3'}`}>
                  {/* Total Balance */}
                  <div className={`bg-white dark:bg-[#131F33] rounded-2xl ${isSpacious ? 'p-4 sm:p-5' : 'p-3.5 sm:p-4'} border border-slate-100 dark:border-[#1F304B] shadow-card transition-colors`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <WalletIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        +3.2%
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                      Total Balance
                    </span>
                    <span className={`${isSpacious ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-black text-slate-900 dark:text-white tracking-tight mt-0.5 block truncate`}>
                      {formatCurrency(totalBalance, preferences.currency)}
                    </span>
                  </div>

                  {/* Monthly Income */}
                  <div className={`bg-white dark:bg-[#131F33] rounded-2xl ${isSpacious ? 'p-4 sm:p-5' : 'p-3.5 sm:p-4'} border border-slate-100 dark:border-[#1F304B] shadow-card transition-colors`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        +12.0%
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                      Monthly Income
                    </span>
                    <span className={`${isSpacious ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-black text-slate-900 dark:text-white tracking-tight mt-0.5 block truncate`}>
                      {formatCurrency(totalIncome, preferences.currency)}
                    </span>
                  </div>

                  {/* Monthly Expenses */}
                  <div className={`bg-white dark:bg-[#131F33] rounded-2xl ${isSpacious ? 'p-4 sm:p-5' : 'p-3.5 sm:p-4'} border border-slate-100 dark:border-[#1F304B] shadow-card transition-colors`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        -4.5%
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                      Monthly Expenses
                    </span>
                    <span className={`${isSpacious ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-black text-slate-900 dark:text-white tracking-tight mt-0.5 block truncate`}>
                      {formatCurrency(totalSpent, preferences.currency)}
                    </span>
                  </div>

                  {/* Net Savings */}
                  <div className={`bg-white dark:bg-[#131F33] rounded-2xl ${isSpacious ? 'p-4 sm:p-5' : 'p-3.5 sm:p-4'} border border-slate-100 dark:border-[#1F304B] shadow-card transition-colors`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                        {savingsRate}% saved
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                      Net Savings
                    </span>
                    <span className={`${isSpacious ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-black text-slate-900 dark:text-white tracking-tight mt-0.5 block truncate`}>
                      {formatCurrency(Math.max(0, totalIncome - totalSpent), preferences.currency)}
                    </span>
                  </div>
                </div>

                {/* Quick Add Action Banner */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsQuickAddOpen(true)}
                    className={`flex-1 ${isSpacious ? 'py-3.5 px-5 text-sm' : 'py-3 px-4 text-xs'} rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 active:scale-95 text-white font-bold shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log New Expense / Income</span>
                  </button>
                </div>

                {/* Recent Transactions Section (Matching Screenshot Screen 1) */}
                <div className={`bg-white dark:bg-[#131F33] rounded-3xl ${isSpacious ? 'p-6' : 'p-5'} border border-slate-100 dark:border-[#1F304B] shadow-card transition-colors`}>
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">Recent Transactions</h3>
                    <button
                      onClick={() => handleTabChange('transactions')}
                      className="text-xs sm:text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      See all
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-[#1F304B]">
                    {recentTransactions.map((tx) => {
                      const matchedCat = categories.find(
                        (c) => c.name.toLowerCase() === tx.category.toLowerCase()
                      );
                      const IconComponent =
                        (matchedCat && categoryIconMap[matchedCat.icon]) || ShoppingBag;
                      const isIncome = tx.type === 'income';

                      return (
                        <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: matchedCat?.color || '#0D9488' }}
                            >
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {tx.merchant}
                              </h4>
                              <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                                {tx.category} • {formatDateDisplay(tx.date)}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`font-black text-xs sm:text-sm shrink-0 ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(tx.amount, preferences.currency)}
                          </span>
                        </div>
                      );
                    })}

                    {recentTransactions.length === 0 && (
                      <p className="text-center py-6 text-xs text-slate-400">
                        No transactions recorded yet. Tap the button above to log one!
                      </p>
                    )}
                  </div>
                </div>

                {/* Savings Goals Sneak Peek */}
                {goals.length > 0 && (
                  <div
                    onClick={() => handleTabChange('goals')}
                    className="bg-gradient-to-r from-teal-900/40 via-cyan-950/40 to-slate-900 p-4 sm:p-5 rounded-3xl border border-teal-500/20 text-white cursor-pointer active:scale-98 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-teal-400" />
                        <span className="text-xs sm:text-sm font-bold text-white">Savings Goal: {goals[0].name}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-teal-300">
                        {Math.round((goals[0].currentAmount / (goals[0].targetAmount || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.round((goals[0].currentAmount / (goals[0].targetAmount || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-teal-200/80 mt-2">
                      <span>{formatCurrency(goals[0].currentAmount, preferences.currency)} saved</span>
                      <span>Target: {formatCurrency(goals[0].targetAmount, preferences.currency)}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ================================================================ */}
            {/* TAB: BUDGETS / SPENDING BY CATEGORY (SCREEN 2 OF SCREENSHOT)      */}
            {/* ================================================================ */}
            {activeTab === 'budgets' && (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Spending by Category
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Monthly envelope limits & spending progress
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#131F33] border border-slate-200/80 dark:border-[#1F304B] text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-1.5">
                    <span>{preferences.selectedMonth}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Search Categories Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={budgetCategorySearch}
                    onChange={(e) => setBudgetCategorySearch(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#131F33] border border-slate-200/80 dark:border-[#1F304B] text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors shadow-sm"
                  />
                  {budgetCategorySearch && (
                    <button
                      onClick={() => setBudgetCategorySearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Spending List View (Screen 2 Matching Rows) */}
                <div className="bg-white dark:bg-[#131F33] rounded-3xl p-2 border border-slate-100 dark:border-[#1F304B] shadow-card divide-y divide-slate-100 dark:divide-[#1F304B] transition-colors">
                  {filteredBudgetCategories.map((cat) => {
                    const IconComponent = categoryIconMap[cat.icon] || ShoppingBag;
                    const isOverBudget = cat.allocated > 0 && cat.spent > cat.allocated;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setEditAllocationAmount(cat.allocated.toString());
                        }}
                        className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-[#1A283E]/50 rounded-2xl transition-colors cursor-pointer active:scale-98"
                      >
                        {/* Circular colored category icon */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: cat.color || '#0D9488' }}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {cat.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 sm:w-28 h-2 rounded-full bg-slate-100 dark:bg-[#1A283E] overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isOverBudget ? 'bg-rose-500' : 'bg-teal-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, cat.percent)}%`,
                                  }}
                                />
                              </div>
                              <span
                                className={`text-xs font-bold ${
                                  isOverBudget
                                    ? 'text-rose-500'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {cat.percent}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & Right Chevron Arrow */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white block">
                              {formatCurrency(cat.spent, preferences.currency)}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-400 block">
                              of {formatCurrency(cat.allocated, preferences.currency)}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        </div>
                      </div>
                    );
                  })}

                  {filteredBudgetCategories.length === 0 && (
                    <div className="text-center py-8 text-xs sm:text-sm text-slate-400">
                      No categories match "{budgetCategorySearch}".
                    </div>
                  )}
                </div>

                {/* Helpful rebalance note */}
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center italic">
                  Tap any category row to adjust its envelope allocation or rebalance funds.
                </p>
              </div>
            )}

            {/* ================================================================ */}
            {/* TAB: TRANSACTIONS                                                */}
            {/* ================================================================ */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Transactions
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {filteredTransactions.length} records found
                    </p>
                  </div>
                  <button
                    onClick={() => setIsQuickAddOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={txSearchQuery}
                    onChange={(e) => setTxSearchQuery(e.target.value)}
                    placeholder="Search merchant, notes..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#131F33] border border-slate-200/80 dark:border-[#1F304B] text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                  />
                  {txSearchQuery && (
                    <button
                      onClick={() => setTxSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {(['all', 'expense', 'income'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTxTypeFilter(type)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all active:scale-95 shrink-0 ${
                        txTypeFilter === type
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-white dark:bg-[#131F33] border border-slate-200/80 dark:border-[#1F304B] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {type === 'all' ? 'All Transactions' : `${type}s`}
                    </button>
                  ))}
                </div>

                {/* Transactions List */}
                <div className="bg-white dark:bg-[#131F33] rounded-3xl p-2 border border-slate-100 dark:border-[#1F304B] shadow-card divide-y divide-slate-100 dark:divide-[#1F304B] transition-colors">
                  {filteredTransactions.map((tx) => {
                    const matchedCat = categories.find(
                      (c) => c.name.toLowerCase() === tx.category.toLowerCase()
                    );
                    const IconComponent =
                      (matchedCat && categoryIconMap[matchedCat.icon]) || ShoppingBag;
                    const isIncome = tx.type === 'income';

                    return (
                      <div
                        key={tx.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-[#1A283E]/50 rounded-2xl transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: matchedCat?.color || '#0D9488' }}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {tx.merchant}
                            </h4>
                            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                              {tx.category} • {formatDateDisplay(tx.date)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`font-black text-xs sm:text-sm ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {isIncome ? '+' : '-'}
                            {formatCurrency(tx.amount, preferences.currency)}
                          </span>

                          <button
                            onClick={() => {
                              if (window.confirm(`Delete transaction "${tx.merchant}"?`)) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 dark:text-slate-600 dark:hover:text-rose-400 active:scale-90 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {filteredTransactions.length === 0 && (
                    <div className="text-center py-10 text-xs sm:text-sm text-slate-400">
                      No transactions match the selected filters.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================================================================ */}
            {/* TAB: GOALS                                                       */}
            {/* ================================================================ */}
            {activeTab === 'goals' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                      Savings Goals
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Visual milestone jars & future targets
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {goals.map((goal) => {
                    const percent = Math.min(
                      100,
                      Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100)
                    );

                    return (
                      <div
                        key={goal.id}
                        className="bg-white dark:bg-[#131F33] rounded-3xl p-5 border border-slate-100 dark:border-[#1F304B] shadow-card space-y-3 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: goal.color || '#0D9488' }}
                            >
                              <Target className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                                {goal.name}
                              </h4>
                              <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                                Target Date: {formatDateDisplay(goal.targetDate)}
                              </p>
                            </div>
                          </div>

                          <span className="font-black text-sm sm:text-base text-teal-600 dark:text-teal-400">
                            {percent}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#1A283E] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              backgroundColor: goal.color || '#0D9488',
                              width: `${percent}%`,
                            }}
                          />
                        </div>

                        {/* Financial Stats */}
                        <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            Saved:{' '}
                            <strong className="text-slate-900 dark:text-white">
                              {formatCurrency(goal.currentAmount, preferences.currency)}
                            </strong>
                          </span>
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            Target: {formatCurrency(goal.targetAmount, preferences.currency)}
                          </span>
                        </div>

                        {/* Contribute Action */}
                        <button
                          onClick={() => {
                            setSelectedGoalId(goal.id);
                            setContributeAmount('50');
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Quick Contribute</span>
                        </button>
                      </div>
                    );
                  })}

                  {goals.length === 0 && (
                    <div className="bg-white dark:bg-[#131F33] rounded-3xl p-8 border border-slate-100 dark:border-[#1F304B] text-center text-xs text-slate-400 space-y-2">
                      <Target className="w-8 h-8 text-teal-500 mx-auto" />
                      <p className="font-bold text-slate-700 dark:text-slate-200">No Goals Created</p>
                      <p>Create a savings goal to visualize your emergency fund or vacation savings!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================================================================ */}
            {/* TAB: MORE HUB                                                    */}
            {/* ================================================================ */}
            {activeTab === 'more' && (
              <div className="space-y-4">
                {/* User Profile Card */}
                <div className="bg-white dark:bg-[#131F33] rounded-3xl p-5 border border-slate-100 dark:border-[#1F304B] shadow-card flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                      {currentUser?.avatar || userName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{userName}</h3>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
                        {currentUser?.role || 'Admin'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsUserSelectModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A283E] active:scale-95 transition-all"
                  >
                    Switch User
                  </button>
                </div>

                {/* Appearance & Dark Mode Selection */}
                <div className="bg-white dark:bg-[#131F33] rounded-3xl p-5 border border-slate-100 dark:border-[#1F304B] shadow-card space-y-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white uppercase tracking-wider">
                      Appearance & Theme
                    </span>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 capitalize">
                      {theme}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                        theme === 'light'
                          ? 'border-teal-500 bg-teal-50/50 text-teal-900 font-bold'
                          : 'border-slate-200/80 dark:border-[#1F304B] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Sun className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                      <span className="text-xs sm:text-sm font-semibold">Light</span>
                    </button>

                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                        theme === 'dark'
                          ? 'border-teal-500 bg-teal-950/40 text-teal-300 font-bold'
                          : 'border-slate-200/80 dark:border-[#1F304B] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Moon className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                      <span className="text-xs sm:text-sm font-semibold">Dark</span>
                    </button>

                    <button
                      onClick={() => setTheme('system')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                        theme === 'system'
                          ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-300 font-bold'
                          : 'border-slate-200/80 dark:border-[#1F304B] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Monitor className="w-4 h-4 mx-auto mb-1 text-cyan-500" />
                      <span className="text-xs sm:text-sm font-semibold">System</span>
                    </button>
                  </div>
                </div>

                {/* PC Mobile Preview Toggle (if browsed on desktop) */}
                {previewMobileOnPc && (
                  <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 rounded-3xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-teal-900 dark:text-teal-200 block">
                          PC Mobile Simulation
                        </span>
                        <span className="text-xs text-teal-700 dark:text-teal-300">
                          Return to multi-column desktop layout
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPreviewMobileOnPc(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
                    >
                      Exit Preview
                    </button>
                  </div>
                )}

                {/* Subview Navigations */}
                <div className="bg-white dark:bg-[#131F33] rounded-3xl p-2 border border-slate-100 dark:border-[#1F304B] shadow-card divide-y divide-slate-100 dark:divide-[#1F304B] transition-colors">
                  <button
                    onClick={() => setSubView('wallets')}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1A283E]/50 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <WalletIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Accounts & Wallets</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-400">
                          {wallets.length} active banks and accounts
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setSubView('bills')}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1A283E]/50 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Recurring Bills</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-400">
                          Scheduled expenses and subscriptions
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setSubView('reports')}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1A283E]/50 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Financial Analytics</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-400">
                          Cash flow, spending velocity & charts
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setSubView('family')}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1A283E]/50 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Family Members</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-400">
                          Roles, lock screen patterns & permissions
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setSubView('settings')}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1A283E]/50 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Full Settings</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-400">
                          Display scaling, currency, backup & daemon
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Footer Credits */}
                <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2">
                  BudgetFlow • Local-First • Zero-Telemetry
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. DOCKED BOTTOM NAVIGATION BAR (Matching Screenshot)                   */}
      {/* ---------------------------------------------------------------------- */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111C2D]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-[#1F304B] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 transition-colors">
        <div className={`flex items-center justify-around ${previewMobileOnPc ? 'max-w-md mx-auto' : ''}`}>
          {/* Home */}
          <button
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'home' && !subView
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <Home className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
            <span className="text-[11px] sm:text-xs font-semibold">Home</span>
            {activeTab === 'home' && !subView && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 absolute -top-1" />
            )}
          </button>

          {/* Transactions */}
          <button
            onClick={() => handleTabChange('transactions')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'transactions' && !subView
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <Receipt className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
            <span className="text-[11px] sm:text-xs font-semibold">Transactions</span>
            {activeTab === 'transactions' && !subView && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 absolute -top-1" />
            )}
          </button>

          {/* Budgets (Screen 2) */}
          <button
            onClick={() => handleTabChange('budgets')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'budgets' && !subView
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <PieChart className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
            <span className="text-[11px] sm:text-xs font-semibold">Budgets</span>
            {activeTab === 'budgets' && !subView && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 absolute -top-1" />
            )}
          </button>

          {/* Goals */}
          <button
            onClick={() => handleTabChange('goals')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'goals' && !subView
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <Target className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
            <span className="text-[11px] sm:text-xs font-semibold">Goals</span>
            {activeTab === 'goals' && !subView && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 absolute -top-1" />
            )}
          </button>

          {/* More */}
          <button
            onClick={() => handleTabChange('more')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'more' || subView
                ? 'text-teal-600 dark:text-teal-400 font-bold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
            <span className="text-[11px] sm:text-xs font-semibold">More</span>
            {(activeTab === 'more' || subView) && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 absolute -top-1" />
            )}
          </button>
        </div>
      </nav>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. MODALS (Category Allocation Adjustment & Quick Goal Contribution)    */}
      {/* ---------------------------------------------------------------------- */}
      {/* Category Allocation Adjustment Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-2xl w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1F304B]">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedCategory.color || '#0D9488' }}
                >
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                    {selectedCategory.name}
                  </h3>
                  <span className="text-xs text-slate-400 dark:text-slate-400">
                    Adjust Monthly Spending Cap
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Monthly Cap ({preferences.currency})
                </label>
                <input
                  type="number"
                  value={editAllocationAmount}
                  onChange={(e) => setEditAllocationAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-[#1A283E] focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A283E]/50 text-xs space-y-1">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Current Spent:</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {formatCurrency(selectedCategory.spent, preferences.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-slate-700 dark:text-slate-300 font-bold text-xs active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(editAllocationAmount);
                  if (!isNaN(val) && val >= 0) {
                    updateCategoryAllocation(selectedCategory.id, val);
                    setSelectedCategory(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all"
              >
                Save Cap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Quick Contribution Modal */}
      {selectedGoalId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-2xl w-full max-w-sm space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1F304B]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-500" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                  Contribute to Goal
                </h3>
              </div>
              <button
                onClick={() => setSelectedGoalId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Contribution Amount ({preferences.currency})
                </label>
                <input
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-sm font-semibold text-slate-800 dark:text-white bg-slate-50 dark:bg-[#1A283E] focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                {[25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setContributeAmount(amt.toString())}
                    className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1A283E] text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600"
                  >
                    +${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSelectedGoalId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-slate-700 dark:text-slate-300 font-bold text-xs active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(contributeAmount);
                  if (!isNaN(val) && val > 0) {
                    contributeToGoal(selectedGoalId, val, undefined, 'Mobile App Contribution');
                    setSelectedGoalId(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all"
              >
                Contribute Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
