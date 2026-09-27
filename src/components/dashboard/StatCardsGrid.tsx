import React from 'react';
import { TrendingUp, Calendar, PiggyBank, CreditCard } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const StatCardsGrid: React.FC = () => {
  const {
    savingsRate,
    upcomingBillsCount,
    upcomingBillsTotal,
    emergencyFundAmount,
    creditUtilizationPercent,
    preferences,
    setActiveView,
  } = useFinance();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. Savings Rate */}
      <div
        onClick={() => setActiveView('reports')}
        className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-card hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Savings Rate</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {savingsRate}%
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                ▲ +5% <span className="text-slate-400 font-normal">vs last month</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Upcoming Bills */}
      <div
        onClick={() => setActiveView('bills')}
        className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-card hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Upcoming Bills</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {upcomingBillsCount}
              </span>
              <span className="text-xs font-medium text-slate-600">
                {formatCurrency(upcomingBillsTotal, preferences.currencySymbol)}{' '}
                <span className="text-slate-400 font-normal">due this month</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Emergency Fund */}
      <div
        onClick={() => setActiveView('goals')}
        className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-card hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <PiggyBank className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Emergency Fund</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(emergencyFundAmount, preferences.currencySymbol)}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                ▲ +12% <span className="text-slate-400 font-normal">vs last month</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Credit Usage */}
      <div
        onClick={() => setActiveView('wallets')}
        className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-card hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Credit Usage</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {creditUtilizationPercent}%
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                ▼ -6% <span className="text-slate-400 font-normal">vs last month</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
