import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Target,
  ArrowRight,
  Wallet as WalletIcon,
  CheckCircle2,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const SmartAllocationModal: React.FC = () => {
  const {
    isSmartAllocationOpen,
    closeSmartAllocation,
    smartAllocationConfig,
    allocateToGoals,
    goals,
    wallets,
    preferences,
  } = useFinance();

  const [allocAmount, setAllocAmount] = useState<number>(0);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');

  // Default savings rate: 20% for income, 100% for month-end surplus
  useEffect(() => {
    if (isSmartAllocationOpen) {
      if (smartAllocationConfig.source === 'income') {
        const defaultRate = 0.20; // 20% Pay Yourself First recommendation
        const initial = Math.round(smartAllocationConfig.defaultAmount * defaultRate * 100) / 100;
        setAllocAmount(initial > 0 ? initial : smartAllocationConfig.defaultAmount);
      } else {
        setAllocAmount(smartAllocationConfig.defaultAmount);
      }

      // Pick source wallet
      if (smartAllocationConfig.sourceWalletId && wallets.some((w) => w.id === smartAllocationConfig.sourceWalletId)) {
        setSelectedWalletId(smartAllocationConfig.sourceWalletId);
      } else {
        const checking = wallets.find((w) => w.type === 'checking') || wallets[0];
        setSelectedWalletId(checking ? checking.id : '');
      }
    }
  }, [isSmartAllocationOpen, smartAllocationConfig, wallets]);

  if (!isSmartAllocationOpen) return null;

  const activeGoals = goals.filter((g) => (g.allocationPercentage || 0) > 0);
  const totalAllocPct = activeGoals.reduce((sum, g) => sum + (g.allocationPercentage || 0), 0);
  const selectedSourceWallet = wallets.find((w) => w.id === selectedWalletId);

  const handlePresetPercent = (pct: number) => {
    const calculated = Math.round((smartAllocationConfig.defaultAmount * (pct / 100)) * 100) / 100;
    setAllocAmount(calculated);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (allocAmount <= 0) return;

    allocateToGoals({
      totalAmount: allocAmount,
      source: smartAllocationConfig.source,
      sourceWalletId: selectedWalletId || undefined,
      note: `${smartAllocationConfig.title}: Allocated across ${activeGoals.length} savings goals`,
    });
  };

  const isIncome = smartAllocationConfig.source === 'income';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 text-white backdrop-blur-sm">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {smartAllocationConfig.title}
              </h3>
              <p className="text-xs text-cyan-100 mt-0.5 line-clamp-1">
                {smartAllocationConfig.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={closeSmartAllocation}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleConfirm} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Amount to Allocate Section */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Amount to Allocate into Goals
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                Total Base: {formatCurrency(smartAllocationConfig.defaultAmount, preferences.currencySymbol)}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                step="any"
                required
                value={allocAmount || ''}
                onChange={(e) => setAllocAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                {preferences.currencySymbol}
              </span>
            </div>

            {/* Quick Percentage Presets */}
            <div className="flex items-center gap-2 pt-1">
              {isIncome ? (
                <>
                  {[10, 20, 30, 50, 100].map((pct) => {
                    const isRec = pct === 20;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePresetPercent(pct)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isRec
                            ? 'bg-cyan-100/80 border border-cyan-300 text-cyan-900 hover:bg-cyan-200/80'
                            : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        {pct}%{isRec ? ' ★' : ''}
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  {[25, 50, 75, 100].map((pct) => {
                    const isFull = pct === 100;
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handlePresetPercent(pct)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isFull
                            ? 'bg-cyan-100/80 border border-cyan-300 text-cyan-900 hover:bg-cyan-200/80'
                            : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        {pct}%{isFull ? ' ★ Full' : ''}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Source Wallet Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Source Wallet / Account (Funding from)
            </label>
            <div className="relative">
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(w.balance, preferences.currencySymbol)})
                  </option>
                ))}
              </select>
            </div>
            {selectedSourceWallet && (
              <p className="text-[11px] text-slate-400 mt-1">
                Available balance: {formatCurrency(selectedSourceWallet.balance, preferences.currencySymbol)}
              </p>
            )}
          </div>

          {/* Jars Allocation Breakdown Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Target Savings Jars Breakdown
              </span>
              <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                Total Allocation: {totalAllocPct}%
              </span>
            </div>

            {activeGoals.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  No goals currently have an allocation percentage configured. Edit your goals in the Goals tab to set their % share!
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeGoals.map((goal) => {
                  const sharePct = (goal.allocationPercentage || 0) / 100;
                  const shareAmount = Math.round(allocAmount * sharePct * 100) / 100;
                  const newCurrent = goal.currentAmount + shareAmount;
                  const newPct = Math.min(100, Math.round((newCurrent / goal.targetAmount) * 100));
                  const targetWallet = wallets.find((w) => w.id === goal.walletId);

                  return (
                    <div
                      key={goal.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: goal.color }}
                          />
                          <span className="text-xs font-bold text-slate-900">{goal.name}</span>
                          <span className="text-[10px] font-extrabold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded-md">
                            {goal.allocationPercentage}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-600 block">
                            +{formatCurrency(shareAmount, preferences.currencySymbol)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Comparison */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {formatCurrency(goal.currentAmount, preferences.currencySymbol)} →{' '}
                          <span className="font-bold text-slate-800">
                            {formatCurrency(newCurrent, preferences.currencySymbol)}
                          </span>{' '}
                          ({newPct}%)
                        </span>
                        {targetWallet ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                            <WalletIcon className="w-3 h-3 text-cyan-600" />
                            {targetWallet.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No wallet linked</span>
                        )}
                      </div>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${newPct}%`,
                            backgroundColor: goal.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalAllocPct < 100 && (
              <p className="text-[11px] text-slate-500 italic px-1">
                Note: Goals sum to {totalAllocPct}%. The remaining {100 - totalAllocPct}% (
                {formatCurrency(
                  Math.round(allocAmount * ((100 - totalAllocPct) / 100) * 100) / 100,
                  preferences.currencySymbol
                )}
                ) remains in your source wallet.
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeSmartAllocation}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={allocAmount <= 0 || activeGoals.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>Confirm & Allocate Funds</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
