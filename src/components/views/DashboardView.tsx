import React from 'react';
import { BudgetDonutCard } from '../dashboard/BudgetDonutCard';
import { CategorySpendingCard } from '../dashboard/CategorySpendingCard';
import { IncomeVsExpensesCard } from '../dashboard/IncomeVsExpensesCard';
import { StatCardsGrid } from '../dashboard/StatCardsGrid';
import { RecentTransactionsCard } from '../dashboard/RecentTransactionsCard';
import { SavingsGoalBanner } from '../dashboard/SavingsGoalBanner';
import { MemberUpcomingBillsCard } from '../dashboard/MemberUpcomingBillsCard';
import { SafeToSpendPacer } from '../features/SafeToSpendPacer';
import { useFinance } from '../../context/FinanceContext';
import { Plus } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { currentUser, setIsQuickAddOpen, setIsAddRecurringOpen } = useFinance();
  const isMember = currentUser?.role === 'member';

  if (isMember) {
    return (
      <div className="space-y-6">
        {/* Quick Action Bar for Member */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Personal Wallet Overview
            </h2>
            <p className="text-xs text-slate-500">
              Track spending, record new transactions, and schedule recurring bills.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Transaction</span>
            </button>
            <button
              onClick={() => setIsAddRecurringOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-cyan-800 border border-slate-200 text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5] text-cyan-600" />
              <span>Add Recurring</span>
            </button>
          </div>
        </div>

        {/* Member Stat Cards Grid (Savings Rate, Upcoming Bills, Emergency Fund if applicable, Credit Usage if applicable) */}
        <StatCardsGrid />

        {/* Member 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (6 cols): Income vs Expenses + Recent Transactions */}
          <div className="lg:col-span-6 space-y-6">
            <IncomeVsExpensesCard />
            <RecentTransactionsCard />
          </div>

          {/* Right Column (6 cols): Spending by Category + Member Upcoming Bills */}
          <div className="lg:col-span-6 space-y-6">
            <CategorySpendingCard />
            <MemberUpcomingBillsCard />
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="space-y-6">
      {/* Top Standout Velocity Banner */}
      <SafeToSpendPacer />

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 of 12 cols on large screen) */}
        <div className="lg:col-span-5 space-y-6">
          <BudgetDonutCard />
          <IncomeVsExpensesCard />
          <RecentTransactionsCard />
        </div>

        {/* Right Column (7 of 12 cols on large screen) */}
        <div className="lg:col-span-7 space-y-6">
          <CategorySpendingCard />
          <StatCardsGrid />
          <SavingsGoalBanner />
        </div>
      </div>
    </div>
  );
};
