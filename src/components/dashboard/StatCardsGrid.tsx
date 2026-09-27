import React from 'react';
import { TrendingUp, Calendar, PiggyBank, CreditCard, Plus } from 'lucide-react';
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
    wallets,
    goals,
    currentUser,
    setIsAddRecurringOpen,
  } = useFinance();

  const isMember = currentUser?.role === 'member';

  // Only show credit usage if there is a credit card in the user's visible wallets
  const hasCreditCard = wallets.some((w) => w.type === 'credit');

  // Only show emergency fund if there is an emergency fund goal or positive balance
  const hasEmergencyFund = goals.some(
    (g) => g.name.toLowerCase().includes('emergency') && (g.targetAmount > 0 || g.currentAmount > 0)
  ) || emergencyFundAmount > 0;

  // Compute number of cards for responsive grid layout
  const visibleCardsCount = 2 + (hasEmergencyFund ? 1 : 0) + (hasCreditCard ? 1 : 0);
  const gridColsClass =
    visibleCardsCount === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className={`grid ${gridColsClass} gap-4`}>
      {/* 1. Savings Rate */}
      <div
        onClick={() => {
          if (!isMember) setActiveView('reports');
        }}
        className={`bg-white rounded-3xl p-5 border border-slate-100/80 shadow-card hover:shadow-md transition-all flex items-center justify-between ${
          !isMember ? 'cursor-pointer' : ''
        }`}
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
        onClick={() => {
          if (isMember) {
            setIsAddRecurringOpen(true);
          } else {
            setActiveView('bills');
          }
        }}
        className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-card hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 block">Upcoming Bills</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddRecurringOpen(true);
                }}
                className="px-1.5 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold flex items-center gap-0.5 transition-colors"
                title="Add recurring bill or income"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Add</span>
              </button>
            </div>
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

      {/* 3. Emergency Fund (Only if applicable) */}
      {hasEmergencyFund && (
        <div
          onClick={() => {
            if (!isMember) setActiveView('goals');
          }}
          className={`bg-white rounded-3xl p-5 border border-slate-100/80 shadow-card hover:shadow-md transition-all flex items-center justify-between ${
            !isMember ? 'cursor-pointer' : ''
          }`}
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
      )}

      {/* 4. Credit Usage (Only if credit card exists in wallets) */}
      {hasCreditCard && (
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
      )}
    </div>
  );
};
