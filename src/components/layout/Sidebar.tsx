import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  PieChart,
  ArrowLeftRight,
  CalendarDays,
  Target,
  BarChart3,
  Wallet,
  Settings,
  Sparkles,
  Users,
  History,
  Tablet,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { useFinance, ActiveView } from '../../context/FinanceContext';

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'budgets', label: 'Budgets', icon: PieChart },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'bills', label: 'Recurring', icon: CalendarDays },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'wallets', label: 'Wallets', icon: Wallet },
  { id: 'family', label: 'Family & Roles', icon: Users },
];

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    setIsWhatIfOpen,
    setIsTabletMode,
    setIsActivityLogOpen,
    currentUser,
  } = useFinance();

  // Collapsed state persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('budgetflow_sidebar_collapsed');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const toggleRail = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('budgetflow_sidebar_collapsed', String(next));
      } catch {
        // Ignore storage errors in restricted environments
      }
      return next;
    });
  };

  // Keyboard shortcut: Ctrl + B or Cmd + B to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleRail();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isMember = currentUser?.role === 'member';
  const visibleNavItems = navItems.filter((item) => {
    if (isMember) {
      return ['dashboard', 'transactions', 'wallets'].includes(item.id);
    }
    return true;
  });

  return (
    <aside
      className={`h-screen sticky top-0 bg-white/85 backdrop-blur-xl border-r border-slate-200/80 flex flex-col justify-between select-none shrink-0 transition-all duration-300 z-20 relative ${
        isCollapsed ? 'w-[76px] p-3 items-center' : 'w-64 p-5'
      }`}
    >
      {/* ================= ATTACHED TOP TOGGLE BUTTON (IN EXACT RED RECTANGLE POSITION) ================= */}
      <button
        onClick={toggleRail}
        title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        aria-label="Toggle sidebar collapse"
        className={`${
          isCollapsed
            ? 'w-9 h-9 rounded-xl border border-cyan-200/80 bg-white hover:bg-cyan-100/70 text-slate-600 hover:text-cyan-700 flex items-center justify-center transition-all duration-200 shadow-sm mb-4 shrink-0 cursor-pointer active:scale-90'
            : 'absolute top-5 right-4 w-9 h-9 rounded-xl border border-cyan-200/80 bg-gradient-to-tr from-cyan-50/90 via-white to-teal-50/80 hover:bg-cyan-100/70 hover:border-cyan-300 text-slate-600 hover:text-cyan-700 flex items-center justify-center transition-all duration-200 shadow-sm z-30 group cursor-pointer active:scale-90'
        }`}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="w-4 h-4 text-slate-600 group-hover:text-cyan-600 transition-colors" />
        ) : (
          <PanelLeftClose className="w-4 h-4 text-slate-600 group-hover:text-cyan-600 transition-colors" />
        )}
        {!isCollapsed && (
          <span className="absolute right-0 top-11 px-2.5 py-1 bg-slate-900/90 text-white text-[11px] font-medium rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Collapse sidebar
          </span>
        )}
      </button>

      {/* ================= TOP SECTION: BRAND + NAV + SMART SIMULATOR ================= */}
      <div className="flex flex-col min-h-0 w-full items-center">
        {/* Brand Logo & Title */}
        <div
          onClick={() => setActiveView('dashboard')}
          className={`flex items-center gap-3 px-1 mb-6 cursor-pointer group shrink-0 w-full ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-50 via-white to-teal-50 p-1 flex items-center justify-center border border-cyan-100/90 shadow-sm group-hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] group-hover:scale-105 transition-all duration-300 shrink-0">
            <img
              src={logoImg}
              alt="BudgetFlow Logo"
              className="w-full h-full object-contain drop-shadow-[0_3px_8px_rgba(6,182,212,0.25)]"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col pr-8 transition-opacity duration-200">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                Budget
                <span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-600 bg-clip-text text-transparent">
                  Flow
                </span>
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-1">
                Family Hub & Wealth
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items (Scrolls internally if viewport is extremely short, keeping layout safe) */}
        <nav className="space-y-1 overflow-y-auto no-scrollbar pr-0.5 w-full">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`group relative w-full flex items-center gap-3.5 py-2 rounded-2xl font-medium text-sm transition-all duration-200 ${
                  isCollapsed ? 'justify-center px-2' : 'px-3.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-600/25 font-semibold translate-x-0.5'
                    : 'text-slate-600 hover:text-cyan-900 hover:bg-cyan-50/70'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'} shrink-0`} />
                {!isCollapsed && <span>{item.label}</span>}

                {/* Floating Glass Tooltip in Collapsed Rail Mode */}
                {isCollapsed && (
                  <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 whitespace-nowrap bg-slate-900/95 backdrop-blur text-white text-xs font-semibold py-1.5 px-3 rounded-xl shadow-xl border border-slate-700/60">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* "What-If" Purchase Simulator Callout Card (Full Mode) */}
        {!isCollapsed && (
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-teal-400/5 to-sky-500/10 border border-cyan-200/70 shadow-sm shrink-0 w-full">
            <div className="flex items-center gap-2 text-cyan-900 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>Smart Simulator</span>
            </div>
            <p className="text-xs text-slate-600 mb-2.5 leading-relaxed">
              Testing a big purchase? See its impact on your daily budget.
            </p>
            <button
              onClick={() => setIsWhatIfOpen(true)}
              className="w-full py-2 px-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all text-center"
            >
              What-If Calculator
            </button>
          </div>
        )}

        {/* Collapsed Rail Sparkles Button */}
        {isCollapsed && (
          <button
            onClick={() => setIsWhatIfOpen(true)}
            className="group relative mt-3 p-2.5 rounded-2xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 flex items-center justify-center shrink-0 transition-all shadow-sm"
          >
            <Sparkles className="w-5 h-5 text-cyan-600 animate-pulse" />
            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 whitespace-nowrap bg-slate-900/95 backdrop-blur text-white text-xs font-semibold py-1.5 px-3 rounded-xl shadow-xl border border-slate-700/60">
              What-If Calculator
            </div>
          </button>
        )}
      </div>

      {/* ================= BOTTOM SECTION: PERMANENTLY DOCKED IN VIEWPORT ================= */}
      {/* The 3 buttons ALWAYS remain visible right here, never pushed down by dashboard scrolling */}
      <div className={`pt-3 border-t border-slate-200/70 space-y-1.5 shrink-0 mt-2 w-full ${isCollapsed ? 'px-0' : ''}`}>
        {/* 1. Launch Tablet Kiosk */}
        <button
          onClick={() => setIsTabletMode(true)}
          className={`group relative w-full flex items-center gap-3 py-2.5 rounded-2xl font-bold text-xs bg-slate-900 text-teal-300 hover:bg-slate-800 transition-all shadow-sm ${
            isCollapsed ? 'justify-center px-2' : 'px-3.5'
          }`}
        >
          <Tablet className="w-4 h-4 text-teal-400 shrink-0" />
          {!isCollapsed && <span>Launch Tablet Kiosk</span>}
          {isCollapsed && (
            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 whitespace-nowrap bg-slate-900/95 backdrop-blur text-teal-300 text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl border border-slate-700/60">
              Launch Tablet Kiosk
            </div>
          )}
        </button>

        {/* 2. Activity Log */}
        <button
          onClick={() => setIsActivityLogOpen(true)}
          className={`group relative w-full flex items-center gap-3 py-2 rounded-2xl font-medium text-sm text-slate-600 hover:text-cyan-900 hover:bg-cyan-50/70 transition-all ${
            isCollapsed ? 'justify-center px-2' : 'px-3.5'
          }`}
        >
          <History className="w-5 h-5 text-slate-500 shrink-0" />
          {!isCollapsed && <span>Activity Log</span>}
          {isCollapsed && (
            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 whitespace-nowrap bg-slate-900/95 backdrop-blur text-white text-xs font-semibold py-1.5 px-3 rounded-xl shadow-xl border border-slate-700/60">
              Activity Log
            </div>
          )}
        </button>

        {/* 3. Settings (Admin only) */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActiveView('settings')}
            className={`group relative w-full flex items-center gap-3 py-2 rounded-2xl font-medium text-sm transition-all duration-200 ${
              isCollapsed ? 'justify-center px-2' : 'px-3.5'
            } ${
              activeView === 'settings'
                ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-600/25 font-semibold'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-cyan-50/70'
            }`}
          >
            <Settings className={`w-5 h-5 ${activeView === 'settings' ? 'text-white' : 'text-slate-500'} shrink-0`} />
            {!isCollapsed && <span>Settings</span>}
            {isCollapsed && (
              <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 whitespace-nowrap bg-slate-900/95 backdrop-blur text-white text-xs font-semibold py-1.5 px-3 rounded-xl shadow-xl border border-slate-700/60">
                Settings
              </div>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
