import React from 'react';
import { Gauge, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatCurrencyExact } from '../../utils/formatters';

export const SafeToSpendPacer: React.FC = () => {
  const { safeToSpendMetrics, preferences, setIsWhatIfOpen } = useFinance();
  const {
    safePerDay,
    remaining,
    daysRemainingInMonth,
    paceStatus,
    paceLabel,
    currentDailyAverage,
  } = safeToSpendMetrics;

  const getPaceBadgeColor = () => {
    switch (paceStatus) {
      case 'green':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'yellow':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'red':
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#0c283f] via-[#093a5c] to-[#061e31] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-cyan-500/20">
      {/* Background radial glows inspired by the logo */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Side: Daily Safe Spend Metric */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Gauge className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
              Safe-to-Spend Velocity
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPaceBadgeColor()}`}>
              {paceLabel}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tight text-white">
              {formatCurrencyExact(safePerDay, preferences.currencySymbol)}
            </span>
            <span className="text-cyan-200/80 text-sm font-medium">/ day</span>
          </div>

          <p className="text-xs text-cyan-100/70 max-w-md">
            You have <span className="text-white font-semibold">{formatCurrency(remaining, preferences.currencySymbol)}</span> remaining across the next{' '}
            <span className="text-white font-semibold">{daysRemainingInMonth} days</span>. Spending under this limit guarantees you finish the month on budget.
          </p>
        </div>

        {/* Right Side: Quick Stats & What-If Button */}
        <div className="flex flex-wrap md:flex-col items-start md:items-end gap-3 w-full md:w-auto">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
            <div className="text-left md:text-right">
              <span className="text-[10px] text-cyan-200 uppercase font-semibold block">Pace So Far</span>
              <span className="text-xs font-bold text-white">
                ~{formatCurrencyExact(currentDailyAverage, preferences.currencySymbol)}/day
              </span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div className="text-left md:text-right">
              <span className="text-[10px] text-cyan-200 uppercase font-semibold block">Days Left</span>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-300" />
                {daysRemainingInMonth} days
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsWhatIfOpen(true)}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-300 via-cyan-300 to-sky-300 hover:from-teal-200 hover:via-cyan-200 hover:to-sky-200 text-[#071f30] font-black text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95 text-center flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Test a Purchase (What-If)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
