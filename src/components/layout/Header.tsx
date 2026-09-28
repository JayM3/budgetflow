import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Tablet,
  Users,
  Lock,
  LogOut,
  HelpCircle,
  Server,
  Globe,
  CalendarDays,
  History,
  RefreshCw,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const {
    preferences,
    upcomingBillsCount,
    setActiveView,
    resetToDemoData,
    clearToFreshSlate,
    isSelfHosted,
    serverStatus,
    currentUser,
    logoutUser,
    setIsTabletMode,
    setIsUserSelectModalOpen,
    setIsGuideOpenWithId,
    setIsCalendarModalOpen,
    setIsActivityLogOpen,
    isRefreshing,
    refreshData,
    theme,
    setTheme,
    isDarkMode,
  } = useFinance();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      {/* Title & Greeting */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <p className="font-bold text-sm tracking-wide flex items-center gap-1.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent">
            <span>Welcome back, {currentUser?.name || preferences.userName.split(' ')[0]}</span>
            <span className="inline-block animate-pulse">👋</span>
          </p>

          {/* Mode Pill Indicator */}
          {isSelfHosted ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Family Hub ({serverStatus?.lanIp || 'Local'})</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              <Globe className="w-3 h-3 text-teal-600" />
              <span>Demo Mode</span>
            </span>
          )}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
          {title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 font-normal">
          {subtitle}
        </p>
      </div>

      {/* Right Controls: Tablet Mode, Safe-to-spend, Quick Add, Omnibar, Bell, User Profile */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 relative">
        {/* Quick Theme Toggle Button */}
        <button
          onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/90 dark:bg-[#131F33] backdrop-blur border border-slate-200/80 dark:border-[#1F304B] flex items-center justify-center text-slate-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 hover:border-amber-300 dark:hover:border-amber-400/50 hover:shadow-sm transition-all active:scale-95 shadow-sm"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Light / Dark Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Tablet Mode Quick Launcher Button */}
        <button
          onClick={() => setIsTabletMode(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-teal-300 rounded-xl text-xs font-bold border border-slate-700 shadow-sm transition-all active:scale-95 group"
          title="Switch to Perpetual Tablet Kiosk Mode"
        >
          <Tablet className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Tablet Mode</span>
        </button>

        {/* Guides Overview Button */}
        <button
          onClick={() => setIsGuideOpenWithId('safe-to-spend')}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-[#131F33] backdrop-blur border border-slate-200 dark:border-[#1F304B] text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-500/50 rounded-xl text-xs font-semibold shadow-sm transition-all"
          title="Interactive Feature Guides & Walkthroughs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="hidden md:inline">Guides (?)</span>
        </button>

        {/* Device Calendar Sync Button */}
        <button
          onClick={() => setIsCalendarModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-[#131F33] backdrop-blur border border-slate-200 dark:border-[#1F304B] text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-500/50 rounded-xl text-xs font-semibold shadow-sm transition-all"
          title="Sync with Apple Calendar, Google Calendar, or Outlook"
        >
          <CalendarDays className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden lg:inline">Calendar Sync</span>
        </button>

        {/* Fetch Latest Numbers Button (In-memory, no hard reload) */}
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/90 dark:bg-[#131F33] backdrop-blur border border-slate-200/80 dark:border-[#1F304B] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-500/50 hover:shadow-sm transition-all active:scale-95 disabled:opacity-75"
          title="Fetch Latest Numbers"
          aria-label="Fetch Latest Numbers"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/90 dark:bg-[#131F33] backdrop-blur border border-slate-200/80 dark:border-[#1F304B] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-500/50 hover:shadow-sm transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {upcomingBillsCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center border border-white dark:border-[#131F33]">
                {upcomingBillsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-[#131F33]/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 dark:border-[#1F304B] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1F304B]">
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Alerts & Radar</span>
                <span className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-100 dark:border-cyan-800/40">
                  {upcomingBillsCount} bills due
                </span>
              </div>
              <div className="mt-2.5 space-y-2">
                <div
                  onClick={() => {
                    setShowNotifications(false);
                    setActiveView('bills');
                  }}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1A283E]/70 hover:bg-cyan-50/70 dark:hover:bg-cyan-950/50 transition-all cursor-pointer flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {upcomingBillsCount} upcoming recurring bills
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Totaling upcoming commitments this month. Click to review.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-[#131F33] backdrop-blur border border-slate-200/80 dark:border-[#1F304B] hover:border-cyan-300 dark:hover:border-cyan-500/50 hover:shadow-sm transition-all"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-base shadow-sm"
              style={{ backgroundColor: `${currentUser?.color || '#0d9488'}20` }}
            >
              <span>{currentUser?.avatar || '👤'}</span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
                {currentUser?.name || preferences.userName}
              </p>
              <span className="text-[9px] uppercase font-bold text-teal-600 dark:text-teal-400 leading-none">
                {currentUser?.role || 'User'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Quick Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-[#131F33]/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 dark:border-[#1F304B] p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-[#1F304B]">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  {currentUser?.role === 'admin' ? 'Family Administrator' : 'Family Member'}
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsUserSelectModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg flex items-center justify-between"
                >
                  <span>Switch Family User</span>
                  <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                </button>

                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setActiveView('family');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between"
                  >
                    <span>Manage Family & Wallets</span>
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsCalendarModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between"
                >
                  <span>Device Calendar Sync</span>
                  <CalendarDays className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsActivityLogOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between"
                >
                  <span>Activity Audit Log</span>
                  <History className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                </button>

                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setActiveView('settings');
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between"
                  >
                    <span>Settings & Data Backup</span>
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}

                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-[#1F304B] space-y-0.5">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setIsUserSelectModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center space-x-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lock Screen</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logoutUser();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center space-x-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Log Out Device</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
