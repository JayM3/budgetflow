import React, { useState } from 'react';
import { Target, Sparkles, Plus, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { GuideButton } from '../guide/GuideButton';

export const GoalsView: React.FC = () => {
  const { goals, contributeToGoal, preferences, setIsGuideOpenWithId } = useFinance();
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('100');

  const handleCustomDeposit = (goalId: string) => {
    const amt = parseFloat(customAmount);
    if (amt > 0) {
      contributeToGoal(goalId, amt);
      setDepositGoalId(null);
      setCustomAmount('100');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0c2a40] via-[#09476b] to-[#0284c7] rounded-3xl p-6 text-white shadow-card border border-cyan-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-white/20 text-white">
              <Target className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
              Visual Savings Jars
            </span>
            <GuideButton
              guideId="savings-jars"
              onOpenGuide={(id) => setIsGuideOpenWithId(id)}
              className="text-cyan-200 hover:text-white"
            />
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Turn Intentions Into Reality
          </h2>
          <p className="text-xs text-cyan-100/90 max-w-lg mt-1">
            Micro-contributions build financial freedom. Allocate spare cash into dedicated jars and watch your dreams fund themselves.
          </p>
        </div>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {goal.category || 'Savings'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {goal.name}
                    </h3>
                  </div>
                  <span className="text-xl font-extrabold text-cyan-700">
                    {pct}%
                  </span>
                </div>

                {/* Visual Progress Jar Graphic */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Current Balance</span>
                    <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                      {formatCurrency(goal.currentAmount, preferences.currencySymbol)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-medium block">Target Goal</span>
                    <span className="text-sm font-bold text-slate-600 mt-0.5 block">
                      {formatCurrency(goal.targetAmount, preferences.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-500 transition-all duration-1000"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 mb-5">
                  <span>{formatCurrency(remaining, preferences.currencySymbol)} to go</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Target: {formatDateDisplay(goal.targetDate)}
                  </span>
                </div>
              </div>

              {/* Deposit Action */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Deposit Funds
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => contributeToGoal(goal.id, 25)}
                    className="flex-1 py-1.5 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 text-xs font-bold text-slate-700 transition-all"
                  >
                    +$25
                  </button>
                  <button
                    onClick={() => contributeToGoal(goal.id, 50)}
                    className="flex-1 py-1.5 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 text-xs font-bold text-slate-700 transition-all"
                  >
                    +$50
                  </button>
                  <button
                    onClick={() => contributeToGoal(goal.id, 100)}
                    className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>+$100</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
