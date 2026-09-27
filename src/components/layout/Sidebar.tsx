import React from 'react';
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
  const { activeView, setActiveView, setIsWhatIfOpen, setIsTabletMode, setIsActivityLogOpen, currentUser } = useFinance();

  const isMember = currentUser?.role === 'member';
  const visibleNavItems = navItems.filter((item) => {
    if (isMember) {
      return ['dashboard', 'transactions', 'wallets'].includes(item.id);
    }
    return true;
  });

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/70 min-h-screen flex flex-col justify-between p-6 select-none shrink-0 transition-all z-20">
      <div>
        {/* Brand Logo & Title */}
        <div
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-3.5 px-1 mb-8 cursor-pointer group"
        >
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-50 via-white to-teal-50 p-1 flex items-center justify-center border border-cyan-100/80 shadow-sm group-hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] group-hover:scale-105 transition-all duration-300">
            <img
              src={logoImg}
              alt="BudgetFlow Logo"
              className="w-full h-full object-contain drop-shadow-[0_3px_8px_rgba(6,182,212,0.25)]"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
              Budget<span className="bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-600 bg-clip-text text-transparent">Flow</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-1">
              Family Hub & Wealth
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-600/25 font-semibold translate-x-1'
                    : 'text-slate-600 hover:text-cyan-900 hover:bg-cyan-50/70'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* "What-If" Purchase Simulator Callout */}
        <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-teal-400/5 to-sky-500/10 border border-cyan-200/60 shadow-sm">
          <div className="flex items-center gap-2 text-cyan-900 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>Smart Simulator</span>
          </div>
          <p className="text-xs text-slate-600 mb-2.5">
            Testing a big purchase? See its impact on your daily budget.
          </p>
          <button
            onClick={() => setIsWhatIfOpen(true)}
            className="w-full py-2 px-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all text-center"
          >
            What-If Calculator
          </button>
        </div>
      </div>

      {/* Bottom Section: Divider & Settings & Tablet Mode */}
      <div className="pt-4 border-t border-slate-100 space-y-1.5">
        <button
          onClick={() => setIsTabletMode(true)}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl font-bold text-xs bg-slate-900 text-teal-300 hover:bg-slate-800 transition-all shadow-sm"
        >
          <Tablet className="w-4 h-4 text-teal-400" />
          <span>Launch Tablet Kiosk</span>
        </button>

        <button
          onClick={() => setIsActivityLogOpen(true)}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl font-medium text-sm text-slate-600 hover:text-cyan-900 hover:bg-cyan-50/70 transition-all duration-200"
        >
          <History className="w-5 h-5 text-slate-500" />
          <span>Activity Log</span>
        </button>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all duration-200 ${
              activeView === 'settings'
                ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-600/25 font-semibold'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-cyan-50/70'
            }`}
          >
            <Settings className={`w-5 h-5 ${activeView === 'settings' ? 'text-white' : 'text-slate-500'}`} />
            <span>Settings</span>
          </button>
        )}
      </div>

    </aside>
  );
};
