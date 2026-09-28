import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const IncomeVsExpensesCard: React.FC = () => {
  const { preferences, totalIncome, totalSpent } = useFinance();

  // Progress relative to highest value (or 0 if no transactions)
  const maxVal = Math.max(totalIncome, totalSpent, 1);
  const incomePercent = totalIncome > 0 ? Math.min(100, Math.round((totalIncome / maxVal) * 100)) : 0;
  const expensePercent = totalSpent > 0 ? Math.min(100, Math.round((totalSpent / maxVal) * 100)) : 0;

  return (
    <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100/80 dark:border-[#1F304B] shadow-card flex flex-col justify-between transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
          Income vs Expenses
        </h2>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-[#1A283E] border border-slate-200/80 dark:border-[#1F304B] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#223552] transition-all">
          <span>This Month</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Progress Bars Comparison */}
      <div className="space-y-4 py-2">
        {/* Income Bar */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-16">Income</span>
          <div className="flex-1 bg-slate-100 dark:bg-[#1A283E] h-4 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out"
              style={{ width: `${incomePercent}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white w-20 text-right">
            {formatCurrency(totalIncome, preferences.currencySymbol)}
          </span>
        </div>

        {/* Expenses Bar */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-16">Expenses</span>
          <div className="flex-1 bg-slate-100 dark:bg-[#1A283E] h-4 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all duration-1000 ease-out"
              style={{ width: `${expensePercent}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white w-20 text-right">
            {formatCurrency(totalSpent, preferences.currencySymbol)}
          </span>
        </div>
      </div>
    </div>
  );
};
