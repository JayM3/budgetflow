import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Target,
  ArrowRight,
  Wallet as WalletIcon,
  Percent,
  Clock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatCurrencyExact } from '../../utils/formatters';

export const ReportsView: React.FC = () => {
  const {
    totalIncome,
    totalSpent,
    remainingBudget,
    savingsRate,
    categories,
    insights,
    preferences,
    goals,
    wallets,
    calculateLeftoverSurplus,
    openSmartAllocation,
    setActiveView,
  } = useFinance();

  const [viewMode, setViewMode] = useState<'pie' | 'bars'>('pie');

  const totalCatSpend = categories.reduce((sum, c) => sum + c.spent, 0);
  const safeLeftover = calculateLeftoverSurplus();

  // Goal Savings Recommendations based on % allocation and required pace
  const goalRecommendations = useMemo(() => {
    const now = new Date();
    return goals.map((goal) => {
      const targetDateObj = new Date(goal.targetDate);
      const monthsLeft = Math.max(
        1,
        (targetDateObj.getFullYear() - now.getFullYear()) * 12 +
          (targetDateObj.getMonth() - now.getMonth())
      );
      const remainingTarget = Math.max(0, goal.targetAmount - goal.currentAmount);
      const requiredMonthlyPace = Math.ceil(remainingTarget / monthsLeft);
      const allocPct = goal.allocationPercentage || 0;
      const recommendedMonthlySavings = Math.round(safeLeftover * (allocPct / 100));
      const connectedWallet = wallets.find((w) => w.id === goal.walletId);
      const isCompleted = goal.currentAmount >= goal.targetAmount;
      const isAhead = !isCompleted && recommendedMonthlySavings >= requiredMonthlyPace;
      const shortfall = Math.max(0, requiredMonthlyPace - recommendedMonthlySavings);

      return {
        ...goal,
        monthsLeft,
        remainingTarget,
        requiredMonthlyPace,
        allocPct,
        recommendedMonthlySavings,
        connectedWallet,
        isCompleted,
        isAhead,
        shortfall,
      };
    });
  }, [goals, safeLeftover, wallets]);

  const totalRecommendedSavings = goalRecommendations.reduce(
    (sum, g) => sum + (g.isCompleted ? 0 : g.recommendedMonthlySavings),
    0
  );

  const pieData = useMemo(() => {
    const active = categories
      .filter((c) => c.spent > 0)
      .map((c) => ({
        name: c.name,
        value: c.spent,
        color: c.color,
      }));

    if (active.length === 0) {
      return categories.map((c) => ({
        name: c.name,
        value: c.allocated || 1,
        color: c.color,
      }));
    }
    return active;
  }, [categories]);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const pct = totalCatSpend > 0 ? Math.round((data.value / totalCatSpend) * 100) : 0;
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
            <span className="font-bold">{data.name}</span>
          </div>
          <div className="mt-1 font-mono">
            {formatCurrencyExact(data.value, preferences.currencySymbol)}
            <span className="text-slate-400 text-[10px] ml-1.5 font-sans">({pct}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 1. Algorithmic "Budget Copilot" Insights Digest */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Budget Copilot • Algorithmic Financial Insights
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              100% offline, privacy-safe mathematical heuristics calculated in real time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                item.type === 'success'
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-950 dark:text-emerald-200'
                  : item.type === 'warning'
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/50 text-amber-950 dark:text-amber-200'
                  : 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200/80 dark:border-cyan-800/50 text-cyan-950 dark:text-cyan-200'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold">{item.title}</h4>
                  {item.metricDelta && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/70 dark:bg-[#0B131F]/80 border border-current shadow-sm">
                      {item.metricDelta}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Cash Flow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#131F33] rounded-3xl p-5 border border-slate-100 dark:border-[#1F304B] shadow-card">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 block">Total Inflow</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
            +{formatCurrency(totalIncome, preferences.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Monthly deposits & salary</span>
        </div>

        <div className="bg-white dark:bg-[#131F33] rounded-3xl p-5 border border-slate-100 dark:border-[#1F304B] shadow-card">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 block">Total Outflow</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
            -{formatCurrency(totalSpent, preferences.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Fixed & discretionary spend</span>
        </div>

        <div className="bg-white dark:bg-[#131F33] rounded-3xl p-5 border border-slate-100 dark:border-[#1F304B] shadow-card">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 block">Net Surplus / Savings</span>
          <span className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-400 mt-1 block">
            +{formatCurrency(totalIncome - totalSpent, preferences.currencySymbol)}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{savingsRate}% savings rate</span>
        </div>
      </div>

      {/* 3. Savings Allocation & Recommended Contributions Planner */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1F304B]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
              <Target className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Savings Recommendations & Goal Allocation Plan
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 uppercase tracking-wider">
                  Automated
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated dynamically from your goal allocation percentages and safe monthly leftover surplus.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveView('goals')}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] hover:border-cyan-300 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-[#1A283E] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>Manage Goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                openSmartAllocation({
                  defaultAmount: safeLeftover > 0 ? safeLeftover : 500,
                  source: 'month_end',
                  title: 'Allocate Surplus to Savings Goals',
                  subtitle: `Allocate your unspent monthly surplus (${formatCurrency(safeLeftover, preferences.currencySymbol)}) according to your goal weights.`,
                });
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Allocate Leftover ({formatCurrency(safeLeftover, preferences.currencySymbol)})</span>
            </button>
          </div>
        </div>

        {/* Goal Recommendation Cards / Table */}
        {goalRecommendations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-[#1F304B] rounded-2xl">
            No savings goals found. Create goals in the Savings Goals tab to see automated monthly contribution recommendations.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalRecommendations.map((goal) => {
              const currentPct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0B131F] border border-slate-100 dark:border-[#1F304B] flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                >
                  <div>
                    {/* Header: Title, Category & Allocation */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#131F33] border border-slate-200 dark:border-[#1F304B] px-2 py-0.5 rounded-full uppercase">
                            {goal.category || 'Savings'}
                          </span>
                          <span className="text-[10px] font-black text-teal-800 dark:text-teal-300 bg-teal-100/70 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800/50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Percent className="w-2.5 h-2.5" />
                            <span>{goal.allocPct}% Share</span>
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">{goal.name}</h4>
                      </div>

                      {/* Health Status Badge */}
                      {goal.isCompleted ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Funded</span>
                        </span>
                      ) : goal.isAhead ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>On Track</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                          <span>Pace Gap</span>
                        </span>
                      )}
                    </div>

                    {/* Connected Wallet Info */}
                    {goal.connectedWallet && (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-3">
                        <WalletIcon className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        <span>Connected to: <strong className="text-slate-700 dark:text-slate-200">{goal.connectedWallet.name}</strong></span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Progress: {currentPct}%</span>
                        <span>
                          {formatCurrency(goal.currentAmount, preferences.currencySymbol)} / {formatCurrency(goal.targetAmount, preferences.currencySymbol)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/80 dark:bg-[#1A283E] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${currentPct}%`,
                            backgroundColor: goal.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Metric Breakdown */}
                  <div className="p-3.5 bg-white dark:bg-[#131F33] rounded-xl border border-slate-200/80 dark:border-[#1F304B] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Recommended Monthly Put-In:
                      </span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(goal.recommendedMonthlySavings, preferences.currencySymbol)} / mo
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-[#1F304B]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Required Pace ({goal.monthsLeft} mo left):</span>
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {formatCurrency(goal.requiredMonthlyPace, preferences.currencySymbol)} / mo
                      </span>
                    </div>

                    {!goal.isCompleted && !goal.isAhead && goal.shortfall > 0 && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded-lg border border-amber-100 dark:border-amber-900/50">
                        Pace gap of {formatCurrency(goal.shortfall, preferences.currencySymbol)}/mo. Consider increasing allocation % or adjusting target date.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Category Breakdown Distribution */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Category Distribution Analysis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Breakdown of spending across your budget categories
            </p>
          </div>

          {/* View Mode Toggle: Pie vs Bars */}
          <div className="flex bg-slate-100 dark:bg-[#0B131F] p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 self-start sm:self-auto border border-transparent dark:border-[#1F304B]">
            <button
              type="button"
              onClick={() => setViewMode('pie')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'pie'
                  ? 'bg-white dark:bg-[#131F33] shadow-sm text-cyan-900 dark:text-cyan-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="View as Pie Chart"
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Pie Chart</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'bars'
                  ? 'bg-white dark:bg-[#131F33] shadow-sm text-cyan-900 dark:text-cyan-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="View as Bar List"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bar List</span>
            </button>
          </div>
        </div>

        {viewMode === 'pie' ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
            <div className="w-full md:w-1/2 h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Pie Legend & Breakdown */}
            <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const pct = totalCatSpend > 0 ? Math.round((cat.spent / totalCatSpend) * 100) : 0;
                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#0B131F] border border-slate-100 dark:border-[#1F304B] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {cat.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {formatCurrency(cat.spent, preferences.currencySymbol)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => {
              const pctOfSpend = totalCatSpend > 0 ? Math.round((cat.spent / totalCatSpend) * 100) : 0;
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">{pctOfSpend}% of spend</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(cat.spent, preferences.currencySymbol)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-[#1A283E] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pctOfSpend}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
