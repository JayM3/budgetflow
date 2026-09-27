import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, ArrowRight, ArrowDownRight, Clock } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { simulatePurchase } from '../../utils/insightsEngine';
import { formatCurrency, formatCurrencyExact } from '../../utils/formatters';
import { GuideButton } from '../guide/GuideButton';

export const WhatIfSimulatorModal: React.FC = () => {
  const {
    isWhatIfOpen,
    setIsWhatIfOpen,
    totalBudget,
    totalSpent,
    goals,
    categories,
    preferences,
    addTransaction,
    triggerConfetti,
    setIsGuideOpenWithId,
  } = useFinance();

  const [costInput, setCostInput] = useState('250');
  const [itemName, setItemName] = useState('Weekend Getaway / Dinner');
  const [selectedCategory, setSelectedCategory] = useState('Entertainment');

  if (!isWhatIfOpen) return null;

  const cost = parseFloat(costInput) || 0;
  const vacationGoal = goals.find(g => g.name.toLowerCase().includes('vacation')) || goals[0];
  const sim = simulatePurchase(cost, totalBudget, totalSpent, vacationGoal);

  const handleApplyPurchase = () => {
    if (cost <= 0) return;
    addTransaction({
      merchant: itemName || 'Simulated Purchase',
      category: selectedCategory,
      amount: cost,
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      notes: 'Added from What-If Simulator',
    });
    triggerConfetti();
    setIsWhatIfOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#0c283f] via-[#093a5c] to-[#061e31] text-white flex items-center justify-between border-b border-cyan-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">What-If Purchase Simulator</h3>
                <GuideButton
                  guideId="what-if"
                  onOpenGuide={(id) => setIsGuideOpenWithId(id)}
                  className="text-cyan-300 hover:text-white"
                />
              </div>
              <p className="text-xs text-cyan-200/80">
                Test an expense before you spend. 100% free client-side math.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWhatIfOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Item / Activity Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. New Headphones"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Estimated Cost ({preferences.currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
                  {preferences.currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedCategory === cat.name
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Quick Amount Adjust:</span>
              <span className="font-bold text-slate-800">{formatCurrency(cost, preferences.currencySymbol)}</span>
            </div>
            <input
              type="range"
              min="10"
              max="1500"
              step="10"
              value={cost}
              onChange={(e) => setCostInput(e.target.value)}
              className="w-full accent-cyan-600 cursor-pointer"
            />
          </div>

          {/* Real-Time Impact Forecast Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Impact Analysis
            </span>

            {/* Verdict Alert */}
            <div
              className={`p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium ${
                sim.verdict === 'safe'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : sim.verdict === 'caution'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {sim.verdict === 'safe' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold uppercase tracking-wider text-[11px] block">
                  {sim.verdict === 'safe' ? 'Safe to Spend' : sim.verdict === 'caution' ? 'Cautionary Spend' : 'Exceeds Budget'}
                </span>
                <span>{sim.verdictMessage}</span>
              </div>
            </div>

            {/* Metric Comparisons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Weekly Safe Impact */}
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block">New Safe-to-Spend</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-extrabold text-slate-900">
                    {formatCurrencyExact(sim.newWeeklySafe, preferences.currencySymbol)}
                  </span>
                  <span className="text-xs text-slate-400">/wk</span>
                </div>
                <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5">
                  <ArrowDownRight className="w-3 h-3" />
                  -{formatCurrencyExact(sim.weeklyDrop, preferences.currencySymbol)} drop/wk
                </span>
              </div>

              {/* Goal Impact */}
              <div className="bg-white p-3 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  {vacationGoal?.name || 'Vacation Goal'} Delay
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-lg font-extrabold text-slate-900">
                    +{sim.vacationGoalDelayDays}
                  </span>
                  <span className="text-xs text-slate-400">days</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5 mt-0.5">
                  <Clock className="w-3 h-3 text-teal-600" />
                  based on savings pace
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={() => setIsWhatIfOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyPurchase}
            disabled={cost <= 0}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-cyan-600/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>Log This Expense Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
