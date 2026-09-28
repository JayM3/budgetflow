import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  Plus,
  Calendar,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Percent,
  RefreshCw,
  Wallet as WalletIcon,
  ArrowRight,
  Save,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { SavingsGoal } from '../../types/finance';
import { GuideButton } from '../guide/GuideButton';

const GOAL_COLORS = [
  '#0d9488', // teal
  '#0284c7', // sky
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
];

export const GoalsView: React.FC = () => {
  const {
    goals,
    contributeToGoal,
    addGoal,
    updateGoal,
    deleteGoal,
    preferences,
    wallets,
    currentUser,
    setIsGuideOpenWithId,
    calculateLeftoverSurplus,
    openSmartAllocation,
    saveGoalsState,
  } = useFinance();

  // Save Button State
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveGoals = async () => {
    setIsSaving(true);
    try {
      await saveGoalsState();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('5000');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('2025-12-31');
  const [category, setCategory] = useState('Savings');
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [walletId, setWalletId] = useState('');
  const [allocationPercentage, setAllocationPercentage] = useState('25');

  // Custom Deposit Modal State
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositWalletId, setDepositWalletId] = useState<string>('');
  const [customDepositAmt, setCustomDepositAmt] = useState('100');

  // Delete confirmation
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const canManageGoals = !currentUser || currentUser.role === 'admin' || currentUser.permissions?.canAddGoals;

  const totalAllocPct = goals.reduce((sum, g) => sum + (g.allocationPercentage || 0), 0);
  const safeSurplus = calculateLeftoverSurplus();

  const handleOpenAddModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('5000');
    setCurrentAmount('0');
    setTargetDate('2025-12-31');
    setCategory('General');
    setColor(GOAL_COLORS[0]);

    // Default to a savings wallet if available, otherwise first wallet
    const defaultSavingsWallet = wallets.find((w) => w.type === 'savings') || wallets[0];
    setWalletId(defaultSavingsWallet ? defaultSavingsWallet.id : '');

    // Default allocation % to remaining unallocated or 20%
    const remainingUnalloc = Math.max(0, 100 - totalAllocPct);
    setAllocationPercentage(remainingUnalloc > 0 ? remainingUnalloc.toString() : '20');

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setTargetDate(goal.targetDate);
    setCategory(goal.category || 'General');
    setColor(goal.color || GOAL_COLORS[0]);
    setWalletId(goal.walletId || wallets[0]?.id || '');
    setAllocationPercentage((goal.allocationPercentage || 0).toString());
    setIsModalOpen(true);
  };

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const target = parseFloat(targetAmount);
    const initial = parseFloat(currentAmount) || 0;
    const allocPct = Math.max(0, Math.min(100, parseFloat(allocationPercentage) || 0));
    if (isNaN(target) || target <= 0) return;

    if (editingGoal) {
      updateGoal({
        ...editingGoal,
        name: name.trim(),
        targetAmount: target,
        currentAmount: initial,
        targetDate,
        category,
        color,
        walletId: walletId || undefined,
        allocationPercentage: allocPct,
      });
    } else {
      addGoal({
        name: name.trim(),
        targetAmount: target,
        currentAmount: initial,
        targetDate,
        category,
        color,
        walletId: walletId || undefined,
        allocationPercentage: allocPct,
      });
    }

    setIsModalOpen(false);
  };

  const handleAutoBalance = () => {
    if (goals.length === 0) return;
    const baseShare = Math.floor(100 / goals.length);
    const remainder = 100 - baseShare * goals.length;

    goals.forEach((g, idx) => {
      updateGoal({
        ...g,
        allocationPercentage: baseShare + (idx === 0 ? remainder : 0),
      });
    });
  };

  const handleOpenMonthEndSweep = () => {
    openSmartAllocation({
      defaultAmount: safeSurplus > 0 ? safeSurplus : 500,
      source: 'month_end',
      title: 'Month-End Leftover Allocation',
      subtitle: `Allocate your unspent monthly surplus (${formatCurrency(safeSurplus, preferences.currencySymbol)}) across your jars.`,
    });
  };

  const handleConfirmDelete = () => {
    if (deletingGoalId) {
      deleteGoal(deletingGoalId);
      setDeletingGoalId(null);
    }
  };

  const handleOpenDepositModal = (goal: SavingsGoal) => {
    setDepositGoalId(goal.id);
    const checking = wallets.find((w) => w.type === 'checking') || wallets[0];
    setDepositWalletId(checking ? checking.id : '');
    setCustomDepositAmt('100');
  };

  const handleCustomDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;

    const amt = parseFloat(customDepositAmt);
    if (!isNaN(amt) && amt > 0) {
      contributeToGoal(depositGoalId, amt, depositWalletId || undefined, 'Manual deposit');
      setDepositGoalId(null);
      setCustomDepositAmt('100');
    }
  };

  const goalToDelete = goals.find((g) => g.id === deletingGoalId);
  const goalToDeposit = goals.find((g) => g.id === depositGoalId);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
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
            Connect each goal to a bank account and assign an allocation percentage. When income is received or month-end arrives, leftover funds are automatically distributed into your jars!
          </p>
        </div>

        {canManageGoals && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleSaveGoals}
              disabled={isSaving}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-75 ${
                isSaved
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-white/30 bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Save savings goals to server"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : isSaved ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Save className="w-4 h-4 text-white" />
              )}
              <span>{isSaved ? 'Saved!' : isSaving ? 'Saving...' : 'Save'}</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-white text-cyan-900 hover:bg-cyan-50 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Savings Goal</span>
            </button>
          </div>
        )}
      </div>

      {/* Top Allocation Distribution Bar & Month-End Action */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-5 border border-slate-100 dark:border-[#1F304B] shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
                <Percent className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Savings Allocation Distribution
              </h3>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  totalAllocPct === 100
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : totalAllocPct > 100
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800'
                }`}
              >
                {totalAllocPct}% / 100%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {totalAllocPct === 100
                ? 'All savings pools are 100% balanced across your goals.'
                : totalAllocPct < 100
                ? `${100 - totalAllocPct}% remains in your checking account as an unallocated liquid cushion.`
                : 'Warning: Total goal allocations exceed 100%! Please rebalance.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canManageGoals && goals.length > 0 && (
              <button
                type="button"
                onClick={handleAutoBalance}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-[#1A283E] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Normalize goal percentages to exactly 100%"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Auto-Balance 100%</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenMonthEndSweep}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Allocate Leftover ({formatCurrency(safeSurplus, preferences.currencySymbol)})
              </span>
            </button>
          </div>
        </div>

        {/* Multi-segment allocation distribution bar */}
        {goals.length > 0 && (
          <div className="w-full bg-slate-100 dark:bg-[#1A283E] h-3 rounded-full overflow-hidden flex">
            {goals.map((g) => {
              const pct = g.allocationPercentage || 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={g.id}
                  style={{ width: `${pct}%`, backgroundColor: g.color }}
                  title={`${g.name}: ${pct}%`}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 hover:opacity-80"
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Goals Cards Grid */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-[#131F33] rounded-3xl p-12 text-center text-slate-400 dark:text-slate-500 text-xs border border-slate-100 dark:border-[#1F304B] shadow-card">
          No savings goals yet. Click "+ New Savings Goal" above to create your first visual savings jar!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
            const connectedWallet = wallets.find((w) => w.id === goal.walletId);
            const allocPct = goal.allocationPercentage || 0;
            const estimatedMonthlyShare = Math.round(safeSurplus * (allocPct / 100));

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card flex flex-col justify-between hover:shadow-lg transition-all group"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {goal.category || 'Savings'}
                      </span>
                      <span className="text-[10px] font-extrabold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border border-teal-200/80 dark:border-teal-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Percent className="w-2.5 h-2.5" />
                        <span>{allocPct}% Allocation</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xl font-extrabold text-cyan-700 dark:text-cyan-400">
                        {pct}%
                      </span>

                      {canManageGoals && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(goal)}
                            className="p-1 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                            title="Edit goal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingGoalId(goal.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            title="Delete goal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {goal.name}
                  </h3>

                  {/* Connected Wallet Badge */}
                  <div className="mb-4 flex items-center justify-between text-xs bg-slate-50 dark:bg-[#0B131F] border border-slate-100 dark:border-[#1F304B] rounded-xl px-3 py-1.5">
                    <span className="text-slate-400 font-medium">Connected Account</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 truncate max-w-[160px]">
                      <WalletIcon className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <span className="truncate">{connectedWallet ? connectedWallet.name : 'Unassigned'}</span>
                    </span>
                  </div>

                  {/* Visual Progress Jar Graphic */}
                  <div className="bg-slate-50 dark:bg-[#0B131F] border border-slate-100 dark:border-[#1F304B] rounded-2xl p-4 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-medium block">Current Balance</span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">
                        {formatCurrency(goal.currentAmount, preferences.currencySymbol)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-medium block">Target Goal</span>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5 block">
                        {formatCurrency(goal.targetAmount, preferences.currencySymbol)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-[#1A283E] h-3 rounded-full overflow-hidden p-0.5 mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: goal.color || '#0d9488',
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400 mb-4">
                    <span>{formatCurrency(remaining, preferences.currencySymbol)} to go</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Target: {formatDateDisplay(goal.targetDate)}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Allocation Information & Deliberate Deposit */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#1F304B] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-medium">Est. Monthly Share</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(estimatedMonthlyShare, preferences.currencySymbol)} / mo
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenDepositModal(goal)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1F304B] hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-[#1A283E] text-cyan-900 dark:text-cyan-300 text-xs font-bold active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span>Deposit</span>
                    <ArrowRight className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT GOAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131F33] rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-[#1F304B] p-6 text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1F304B] mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                  <Target className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Vacation, Emergency Reserve, New Car"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#0B131F] text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* CONNECTED WALLET SELECTION */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Connected Wallet / Account
                  </label>
                  <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-semibold">Where funds are stored</span>
                </div>
                <select
                  required
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0B131F] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="" disabled>Select an account</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.type} • {formatCurrency(w.balance, preferences.currencySymbol)})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Leftover money or income allocations will automatically be linked to this account.
                </p>
              </div>

              {/* ALLOCATION % OPTION */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Savings Allocation Share (%)
                  </label>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400 font-extrabold">0% to 100%</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={allocationPercentage}
                    onChange={(e) => setAllocationPercentage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#0B131F] text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Percentage of monthly surplus or incoming paycheck allocated to this goal.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Target Goal ({preferences.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#0B131F] text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Current Balance
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#0B131F] text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#0B131F] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#0B131F] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Savings">Savings</option>
                    <option value="Travel">Travel</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Tech">Tech</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Home">Home</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Color Theme
                </label>
                <div className="flex items-center gap-2.5">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-xl transition-all ${
                        color === c ? 'ring-2 ring-offset-2 ring-cyan-500 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-[#1F304B]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A283E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white font-bold text-xs shadow-md shadow-cyan-600/20 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 transition-all"
                >
                  {editingGoal ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELIBERATE DEPOSIT MODAL */}
      {depositGoalId && goalToDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131F33] rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-[#1F304B] p-6 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1F304B] mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Deposit to {goalToDeposit.name}</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Transfer funds into this savings jar</p>
              </div>
              <button onClick={() => setDepositGoalId(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCustomDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Funding From Account
                </label>
                <select
                  value={depositWalletId}
                  onChange={(e) => setDepositWalletId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0B131F] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance, preferences.currencySymbol)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Amount to Deposit ({preferences.currencySymbol})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  autoFocus
                  value={customDepositAmt}
                  onChange={(e) => setCustomDepositAmt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#0B131F] text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A283E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold text-xs shadow-md shadow-cyan-600/20 hover:from-teal-700 hover:to-cyan-700 active:scale-95 transition-all"
                >
                  Deposit Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingGoalId && goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131F33] rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-[#1F304B] p-6 text-slate-800 dark:text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Remove Savings Goal?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-slate-200">'{goalToDelete.name}'</span>?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingGoalId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A283E]"
              >
                Keep Goal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
