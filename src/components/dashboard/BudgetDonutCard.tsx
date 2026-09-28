import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { GuideButton } from '../guide/GuideButton';

export const BudgetDonutCard: React.FC = () => {
  const {
    preferences,
    totalBudget,
    totalSpent,
    remainingBudget,
    spentPercentage,
    setIsGuideOpenWithId,
    isDarkMode,
  } = useFinance();

  // SVG Circular progress math
  const size = 160;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc proportion
  const strokeDashoffset = circumference - (spentPercentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100/80 dark:border-[#1F304B] shadow-card flex flex-col justify-between transition-colors">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2">
          <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
            This Month's Budget
          </h2>
          <GuideButton
            guideId="safe-to-spend"
            onOpenGuide={(id) => setIsGuideOpenWithId(id)}
          />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-[#1A283E] border border-slate-200/80 dark:border-[#1F304B] text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#223552] transition-all">
          <span>{preferences.selectedMonth}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Main Content: Donut + Legend */}
      <div className="flex items-center justify-around gap-4 py-2">
        {/* Circular Donut Ring */}
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="rotate-[-90deg]">
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={isDarkMode ? '#1E2D44' : '#E2E8F0'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Spent Progress Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="url(#budgetGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="budgetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2DD4BF" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0284C7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center text */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {spentPercentage}%
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              spent
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-4 pr-2">
          {/* Total Budget */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-[#38BDF8]' : 'bg-[#0C4A6E]'} shrink-0`} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Budget</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalBudget, preferences.currencySymbol)}
            </span>
          </div>

          {/* Spent */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] shrink-0" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Spent</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalSpent, preferences.currencySymbol)}
            </span>
          </div>

          {/* Remaining */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2DD4BF] shrink-0" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Remaining</span>
            </div>
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
              {formatCurrency(remainingBudget, preferences.currencySymbol)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
