import React from 'react';
import { BudgetDonutCard } from '../dashboard/BudgetDonutCard';
import { CategorySpendingCard } from '../dashboard/CategorySpendingCard';
import { IncomeVsExpensesCard } from '../dashboard/IncomeVsExpensesCard';
import { StatCardsGrid } from '../dashboard/StatCardsGrid';
import { RecentTransactionsCard } from '../dashboard/RecentTransactionsCard';
import { SavingsGoalBanner } from '../dashboard/SavingsGoalBanner';
import { SafeToSpendPacer } from '../features/SafeToSpendPacer';

export const DashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Standout Velocity Banner */}
      <SafeToSpendPacer />

      {/* Main 2-Column Dashboard Grid matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 of 12 cols on large screen) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. This Month's Budget Donut */}
          <BudgetDonutCard />

          {/* 2. Income vs Expenses */}
          <IncomeVsExpensesCard />

          {/* 3. Recent Transactions Table */}
          <RecentTransactionsCard />
        </div>

        {/* Right Column (7 of 12 cols on large screen) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Spending by Category Bar Chart */}
          <CategorySpendingCard />

          {/* 2. 2x2 Stat Cards Grid */}
          <StatCardsGrid />

          {/* 3. Savings Goal 3D Banner */}
          <SavingsGoalBanner />
        </div>
      </div>
    </div>
  );
};
