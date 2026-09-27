import React, { useState } from 'react';
import { RefreshCw, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { GuideButton } from '../guide/GuideButton';

export const BudgetsView: React.FC = () => {
  const {
    categories,
    totalBudget,
    totalSpent,
    remainingBudget,
    preferences,
    updateCategoryAllocation,
    rebalanceCategories,
    setIsGuideOpenWithId,
  } = useFinance();

  const [fromCatId, setFromCatId] = useState(categories[3]?.id || categories[0]?.id || '');
  const [toCatId, setToCatId] = useState(categories[0]?.id || '');
  const [transferAmount, setTransferAmount] = useState('50');

  const handleRebalance = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!amt || isNaN(amt) || amt <= 0 || fromCatId === toCatId) return;

    rebalanceCategories(fromCatId, toCatId, amt);
    setTransferAmount('50');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Dynamic Envelope Smoothing Explainer */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
              <RefreshCw className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-cyan-800 uppercase tracking-wider">
              Dynamic Envelope Smoothing
            </span>
            <GuideButton
              guideId="envelope-budget"
              onOpenGuide={(id) => setIsGuideOpenWithId(id)}
            />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Flexible, No-Guilt Budgeting
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mt-1">
            Overspent on Groceries? Don't stress. Smooth out unexpected expenses by shifting surplus funds between envelopes with 1 click.
          </p>
        </div>

        {/* Quick Rebalance Form */}
        <form
          onSubmit={handleRebalance}
          className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-2.5 text-xs w-full md:w-auto"
        >
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">From</label>
            <select
              value={fromCatId}
              onChange={(e) => setFromCatId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatCurrency(c.allocated - c.spent, preferences.currencySymbol)} left)
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 mt-4 hidden sm:block" />

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">To</label>
            <select
              value={toCatId}
              onChange={(e) => setToCatId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col w-20">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Amount</label>
            <input
              type="number"
              min="1"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rebalance</span>
          </button>
        </form>
      </div>

      {/* Category Envelopes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const remaining = cat.allocated - cat.spent;
          const isOver = remaining < 0;
          const pct = cat.allocated > 0 ? Math.min(100, Math.round((cat.spent / cat.allocated) * 100)) : 0;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isOver
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isOver ? 'Over Budget' : `${100 - pct}% remaining`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isOver ? '#E11D48' : cat.color,
                    }}
                  />
                </div>

                <div className="flex justify-between items-baseline text-xs mb-4">
                  <span className="text-slate-500 font-medium">
                    Spent: <span className="font-bold text-slate-800">{formatCurrency(cat.spent, preferences.currencySymbol)}</span>
                  </span>
                  <span className="text-slate-500 font-medium">
                    Cap: <span className="font-bold text-slate-800">{formatCurrency(cat.allocated, preferences.currencySymbol)}</span>
                  </span>
                </div>
              </div>

              {/* Adjust Cap slider */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold mb-1">
                  <span>Adjust Envelope Cap</span>
                  <span className="text-slate-700 font-bold">
                    {formatCurrency(cat.allocated, preferences.currencySymbol)}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="25"
                  value={cat.allocated}
                  onChange={(e) => updateCategoryAllocation(cat.id, parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
