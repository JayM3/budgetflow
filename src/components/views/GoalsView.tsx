import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  Plus,
  Calendar,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  Coins,
  ArrowRight,
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
  } = useFinance();

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('5000');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('2025-12-31');
  const [category, setCategory] = useState('Savings');
  const [color, setColor] = useState(GOAL_COLORS[0]);

  // Custom Deposit Modal State
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [customDepositAmt, setCustomDepositAmt] = useState('100');

  // Delete confirmation
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const canManageGoals = !currentUser || currentUser.role === 'admin' || currentUser.permissions?.canAddGoals;

  const isKr = preferences.currencySymbol.toLowerCase().includes('kr');
  const quickDeposits = isKr ? [50, 200, 500] : [25, 50, 100];

  const handleOpenAddModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('5000');
    setCurrentAmount('0');
    setTargetDate('2025-12-31');
    setCategory('General');
    setColor(GOAL_COLORS[0]);
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
    setIsModalOpen(true);
  };

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const target = parseFloat(targetAmount);
    const initial = parseFloat(currentAmount) || 0;
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
      });
    } else {
      addGoal({
        name: name.trim(),
        targetAmount: target,
        currentAmount: initial,
        targetDate,
        category,
        color,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingGoalId) {
      deleteGoal(deletingGoalId);
      setDeletingGoalId(null);
    }
  };

  const handleCustomDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;

    const amt = parseFloat(customDepositAmt);
    if (!isNaN(amt) && amt > 0) {
      contributeToGoal(depositGoalId, amt);
      setDepositGoalId(null);
      setCustomDepositAmt('100');
    }
  };

  const goalToDelete = goals.find((g) => g.id === deletingGoalId);

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

        {canManageGoals && (
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-white text-cyan-900 hover:bg-cyan-50 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Savings Goal</span>
          </button>
        )}
      </div>

      {/* Goals Cards Grid */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 text-xs border border-slate-100 shadow-card">
          No savings goals yet. Click "+ New Savings Goal" above to create your first visual savings jar!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between hover:shadow-lg transition-all group"
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

                    <div className="flex items-center gap-2">
                      <span className="text-xl font-extrabold text-cyan-700">
                        {pct}%
                      </span>

                      {canManageGoals && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(goal)}
                            className="p-1 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50"
                            title="Edit goal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingGoalId(goal.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete goal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
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
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: goal.color || '#0d9488',
                      }}
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
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quick Deposit Funds
                    </span>
                    <button
                      onClick={() => setDepositGoalId(goal.id)}
                      className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700"
                    >
                      Custom +
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {quickDeposits.map((amt, idx) => {
                      const isLast = idx === quickDeposits.length - 1;
                      return (
                        <button
                          key={amt}
                          onClick={() => contributeToGoal(goal.id, amt)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isLast
                              ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 text-white shadow-md shadow-cyan-600/20 flex items-center justify-center gap-1'
                              : 'border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 text-slate-700 active:scale-95'
                          }`}
                        >
                          {isLast && <Sparkles className="w-3 h-3" />}
                          <span>+{formatCurrency(amt, preferences.currencySymbol)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT GOAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 p-6 text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                  <Target className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Vacation, Emergency Reserve, New Car"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Target Goal ({preferences.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Current Balance
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
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

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
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

      {/* CUSTOM DEPOSIT MODAL */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Deposit Funds to Jar</h3>
              <button onClick={() => setDepositGoalId(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCustomDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Amount to Deposit ({preferences.currencySymbol})
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  autoFocus
                  value={customDepositAmt}
                  onChange={(e) => setCustomDepositAmt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold text-xs shadow-md shadow-cyan-600/20 hover:from-teal-700 hover:to-cyan-700 active:scale-95 transition-all"
                >
                  Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingGoalId && goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 text-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Remove Savings Goal?
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-800">'{goalToDelete.name}'</span>?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingGoalId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
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
