import React from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
} from 'lucide-react';
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
  } = useFinance();

  const totalCatSpend = categories.reduce((sum, c) => sum + c.spent, 0);

  return (
    <div className="space-y-6">
      {/* 1. Algorithmic "Budget Copilot" Insights Digest */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Budget Copilot • Algorithmic Financial Insights
            </h3>
            <p className="text-xs text-slate-500">
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
                  ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                  : item.type === 'warning'
                  ? 'bg-amber-50/50 border-amber-200/80 text-amber-950'
                  : 'bg-cyan-50/50 border-cyan-200/80 text-cyan-950'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-cyan-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold">{item.title}</h4>
                  {item.metricDelta && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/70 border border-current shadow-sm">
                      {item.metricDelta}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Cash Flow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
          <span className="text-xs font-semibold text-slate-400 block">Total Inflow</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
            +{formatCurrency(totalIncome, preferences.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Monthly deposits & salary</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
          <span className="text-xs font-semibold text-slate-400 block">Total Outflow</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            -{formatCurrency(totalSpent, preferences.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Fixed & discretionary spend</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
          <span className="text-xs font-semibold text-slate-400 block">Net Surplus / Savings</span>
          <span className="text-2xl font-extrabold text-cyan-700 mt-1 block">
            +{formatCurrency(totalIncome - totalSpent, preferences.currencySymbol)}
          </span>
          <span className="text-[11px] text-emerald-600 font-bold">{savingsRate}% savings rate</span>
        </div>
      </div>

      {/* 3. Category Breakdown Distribution */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
        <h3 className="text-base font-bold text-slate-800 mb-4">
          Category Distribution Analysis
        </h3>

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
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-medium">{pctOfSpend}% of spend</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(cat.spent, preferences.currencySymbol)}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
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
      </div>
    </div>
  );
};
