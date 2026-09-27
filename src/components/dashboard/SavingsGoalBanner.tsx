import React from 'react';
import { Sparkles, ArrowRight, Plane, Palmtree, Coins } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const SavingsGoalBanner: React.FC = () => {
  const { goals, setActiveView, contributeToGoal, preferences } = useFinance();

  // Find Vacation Fund goal or fallback to first
  const vacationGoal = goals.find(g => g.name.toLowerCase().includes('vacation')) || goals[0];
  const percent = vacationGoal && vacationGoal.targetAmount > 0
    ? Math.min(100, Math.round((vacationGoal.currentAmount / vacationGoal.targetAmount) * 100))
    : 0;

  const handleQuickAddFifty = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vacationGoal) {
      contributeToGoal(vacationGoal.id, 50);
    }
  };

  if (!vacationGoal) {
    return (
      <div
        onClick={() => setActiveView('goals')}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E2F7F8] via-[#E0F2FE] to-[#D5F5EE] p-6 border border-cyan-200/80 shadow-card cursor-pointer group hover:shadow-lg transition-all"
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-300/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-teal-300/25 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xs space-y-2.5">
            <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-cyan-900 bg-cyan-100/90 border border-cyan-200/60 px-2.5 py-0.5 rounded-full">
              SAVINGS GOALS
            </span>
            <h3 className="text-2xl font-extrabold text-[#072d47] tracking-tight leading-snug">
              Start building your future funds
            </h3>
            <p className="text-xs text-[#0a3858]/80 font-medium">
              Create your first savings goal — whether for a rainy day, vacation, or milestone dream!
            </p>
            <div className="pt-2">
              <button
                onClick={() => setActiveView('goals')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0c4a6e] to-[#0284c7] hover:from-[#082f49] hover:to-[#0369a1] text-white text-xs font-bold shadow-md shadow-cyan-900/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>+ Create First Goal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative w-48 h-36 flex items-center justify-center select-none">
            <div className="w-20 h-24 rounded-2xl bg-white/70 backdrop-blur-md border-2 border-teal-200/90 shadow-xl flex flex-col items-center justify-center p-2">
              <Sparkles className="w-8 h-8 text-teal-600 mb-1" />
              <span className="text-[10px] font-bold text-teal-800 uppercase">Save</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setActiveView('goals')}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#E2F7F8] via-[#E0F2FE] to-[#D5F5EE] p-6 border border-cyan-200/80 shadow-card cursor-pointer group hover:shadow-lg transition-all"
    >
      {/* Background ambient lighting */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-300/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-teal-300/25 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Copy & Action */}
        <div className="max-w-xs space-y-2.5">
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-cyan-900 bg-cyan-100/90 border border-cyan-200/60 px-2.5 py-0.5 rounded-full">
            SAVINGS GOAL
          </span>
          <h3 className="text-2xl font-extrabold text-[#072d47] tracking-tight leading-snug">
            Plan today for a brighter tomorrow
          </h3>
          <p className="text-xs text-[#0a3858]/80 font-medium">
            You're <span className="font-bold text-[#072d47]">{percent}%</span> of the way to your{' '}
            {vacationGoal.name} goal! (
            {formatCurrency(vacationGoal.currentAmount, preferences.currencySymbol)} of{' '}
            {formatCurrency(vacationGoal.targetAmount, preferences.currencySymbol)})
          </p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => setActiveView('goals')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0c4a6e] to-[#0284c7] hover:from-[#082f49] hover:to-[#0369a1] text-white text-xs font-bold shadow-md shadow-cyan-900/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>View goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleQuickAddFifty}
              className="px-3 py-2.5 rounded-xl bg-white/90 hover:bg-white text-cyan-900 text-xs font-semibold border border-cyan-200/80 shadow-sm active:scale-95 transition-all flex items-center gap-1"
              title="Add $50 deposit now"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>+$50</span>
            </button>
          </div>
        </div>

        {/* Right 3D-styled Visual Element */}
        <div className="relative w-48 h-36 flex items-center justify-center select-none">
          {/* 3D Glass Jar with Coins & Sprout */}
          <div className="relative flex flex-col items-center">
            {/* Sprouting Plant */}
            <div className="w-8 h-8 -mb-1 text-emerald-600 animate-bounce duration-1000">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 20h10" />
                <path d="M12 20v-8" />
                <path d="M12 12c2.5-4 7-3 7-3s0 5-4.5 5.5" />
                <path d="M12 14c-2.5-3.5-7-2.5-7-2.5s0 4.5 4.5 5" />
              </svg>
            </div>

            {/* Glowing Money Jar */}
            <div className="w-20 h-24 rounded-2xl bg-white/70 backdrop-blur-md border-2 border-teal-200/90 shadow-xl flex flex-col items-center justify-end p-2 relative overflow-hidden group-hover:scale-105 transition-transform">
              <div className="absolute top-1 left-2 right-2 h-1 bg-teal-200/80 rounded-full" />
              {/* Stacked Gold Coins inside */}
              <div className="space-y-1 w-full flex flex-col items-center pb-1">
                <div className="w-12 h-3 rounded-full bg-amber-400 border border-amber-500 shadow-sm flex items-center justify-center text-[7px] font-bold text-amber-900">$</div>
                <div className="w-14 h-3 rounded-full bg-amber-400 border border-amber-500 shadow-sm flex items-center justify-center text-[7px] font-bold text-amber-900">$</div>
                <div className="w-14 h-3.5 rounded-full bg-amber-500 border border-amber-600 shadow-sm flex items-center justify-center text-[8px] font-black text-amber-950">$</div>
              </div>
            </div>
          </div>

          {/* Floating Travel Airplane */}
          <div className="absolute top-1 left-2 bg-white/90 p-2 rounded-xl shadow-md border border-white text-teal-600 -rotate-12 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
            <Plane className="w-5 h-5 fill-teal-100" />
          </div>

          {/* Beach Polaroid / Postcard */}
          <div className="absolute bottom-2 right-2 bg-white p-1.5 rounded-xl shadow-md border border-slate-100 rotate-6 group-hover:rotate-12 transition-transform">
            <div className="w-12 h-10 bg-gradient-to-b from-sky-300 via-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
              <Palmtree className="w-5 h-5 text-emerald-700" />
            </div>
          </div>

          {/* Golden Coin Stack */}
          <div className="absolute -bottom-1 left-6 flex items-center gap-0.5 text-amber-500 drop-shadow">
            <Coins className="w-6 h-6 fill-amber-300 stroke-amber-600" />
          </div>
        </div>
      </div>
    </div>
  );
};
