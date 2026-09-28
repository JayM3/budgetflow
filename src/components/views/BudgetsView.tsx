import React, { useState } from 'react';
import {
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Lock,
  Save,
  ShoppingBag,
  Home,
  Car,
  Zap,
  Utensils,
  HeartPulse,
  Gamepad2,
  Coffee,
  Landmark,
  Tag,
  Film,
  Plane,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { GuideButton } from '../guide/GuideButton';

const ICON_OPTIONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  Home,
  Car,
  Zap,
  Utensils,
  HeartPulse,
  Gamepad2,
  Coffee,
  Landmark,
  Tag,
  Film,
  Plane,
};

const COLOR_PALETTE = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f97316', // orange
  '#8b5cf6', // purple
  '#0d9488', // teal
  '#ec4899', // pink
  '#f59e0b', // amber
  '#6366f1', // indigo
];

export const BudgetsView: React.FC = () => {
  const {
    categories,
    preferences,
    updateCategoryAllocation,
    rebalanceCategories,
    createCategory,
    deleteCategory,
    currentUser,
    setIsGuideOpenWithId,
    saveBudgetsState,
  } = useFinance();

  const [fromCatId, setFromCatId] = useState(categories[1]?.id || categories[0]?.id || '');
  const [toCatId, setToCatId] = useState(categories[0]?.id || '');
  const [transferAmount, setTransferAmount] = useState('100');

  // Direct editing of cap state
  const [editingCapCatId, setEditingCapCatId] = useState<string | null>(null);
  const [editingCapVal, setEditingCapVal] = useState<string>('');

  // Save Button State
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveBudgets = async () => {
    setIsSaving(true);
    try {
      await saveBudgetsState();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Create Budget Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBudgetName, setNewBudgetName] = useState('');
  const [newBudgetCap, setNewBudgetCap] = useState('1000');
  const [newBudgetColor, setNewBudgetColor] = useState(COLOR_PALETTE[0]);
  const [newBudgetIcon, setNewBudgetIcon] = useState('ShoppingBag');

  // Delete confirmation state
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Check admin/budget editing permissions
  const canEditBudgets = !currentUser || currentUser.role === 'admin' || currentUser.permissions?.canEditBudgets;

  const handleRebalance = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!amt || isNaN(amt) || amt <= 0 || fromCatId === toCatId) return;

    rebalanceCategories(fromCatId, toCatId, amt);
    setTransferAmount('100');
  };

  const handleStartEditCap = (catId: string, currentCap: number) => {
    if (!canEditBudgets) return;
    setEditingCapCatId(catId);
    setEditingCapVal(currentCap.toString());
  };

  const handleSaveCap = (catId: string) => {
    const val = parseFloat(editingCapVal);
    if (!isNaN(val) && val >= 0) {
      updateCategoryAllocation(catId, Math.round(val));
    }
    setEditingCapCatId(null);
  };

  const handleCreateBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetName.trim()) return;

    createCategory({
      name: newBudgetName.trim(),
      allocated: Math.max(0, parseFloat(newBudgetCap) || 0),
      color: newBudgetColor,
      icon: newBudgetIcon,
      spent: 0,
    });

    setIsCreateModalOpen(false);
    setNewBudgetName('');
    setNewBudgetCap('1000');
  };

  const handleConfirmDelete = () => {
    if (deletingCatId) {
      deleteCategory(deletingCatId);
      setDeletingCatId(null);
    }
  };

  const categoryToDelete = categories.find((c) => c.id === deletingCatId);

  return (
    <div className="space-y-6">
      {/* Top Banner: Dynamic Envelope Smoothing Explainer + Actions */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
              <RefreshCw className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider">
              Dynamic Envelope Smoothing
            </span>
            <GuideButton
              guideId="envelope-budget"
              onOpenGuide={(id) => setIsGuideOpenWithId(id)}
            />
            {!canEditBudgets && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1A283E] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1F304B]">
                <Lock className="w-3 h-3 text-slate-500" />
                View-Only Budgets
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Flexible, No-Guilt Budgeting
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mt-1">
            Adjust monthly budgets, create custom spending categories, or smooth out unexpected expenses by shifting surplus funds with 1 click.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {canEditBudgets && (
            <>
              <button
                onClick={handleSaveBudgets}
                disabled={isSaving}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-75 ${
                  isSaved
                    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-[#1F304B] hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-[#1A283E] text-slate-700 dark:text-slate-300'
                }`}
                title="Save all budget allocations to server"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-600" />
                ) : isSaved ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Save className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                )}
                <span>{isSaved ? 'Saved!' : isSaving ? 'Saving...' : 'Save'}</span>
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/20 flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Budget Category</span>
              </button>
            </>
          )}

          {/* Quick Rebalance Form */}
          <form
            onSubmit={handleRebalance}
            className="bg-slate-50 dark:bg-[#1A283E]/60 p-3 rounded-2xl border border-slate-200/80 dark:border-[#1F304B] flex flex-wrap items-center gap-2 text-xs w-full md:w-auto"
          >
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">From</label>
              <select
                value={fromCatId}
                onChange={(e) => setFromCatId(e.target.value)}
                className="px-2 py-1 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#1A283E] font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({formatCurrency(c.allocated - c.spent, preferences.currencySymbol)} left)
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-400 mt-3 hidden sm:block" />

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">To</label>
              <select
                value={toCatId}
                onChange={(e) => setToCatId(e.target.value)}
                className="px-2 py-1 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#1A283E] font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col w-20">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-0.5">Amount</label>
              <input
                type="number"
                min="1"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="px-2 py-1 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#1A283E] font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
              />
            </div>

            <button
              type="submit"
              className="mt-3 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 text-xs"
            >
              <Sparkles className="w-3 h-3" />
              <span>Shift</span>
            </button>
          </form>
        </div>
      </div>

      {/* Category Envelopes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const remaining = cat.allocated - cat.spent;
          const isOver = remaining < 0;
          const pct = cat.allocated > 0 ? Math.min(100, Math.round((cat.spent / cat.allocated) * 100)) : 0;
          const Icon = ICON_OPTIONS[cat.icon] || ShoppingBag;
          const maxSliderValue = Math.max(30000, cat.allocated * 2, 10000);

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-[#131F33] rounded-3xl p-5 border border-slate-100 dark:border-[#1F304B] shadow-card flex flex-col justify-between hover:shadow-md transition-all group relative"
            >
              <div>
                {/* Header with Title and Delete Button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{cat.name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isOver
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                      }`}
                    >
                      {isOver ? 'Over Budget' : `${100 - pct}% left`}
                    </span>

                    {canEditBudgets && (
                      <button
                        onClick={() => setDeletingCatId(cat.id)}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all"
                        title={`Remove ${cat.name} budget`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bg-slate-100 dark:bg-[#1A283E] h-2.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isOver ? '#E11D48' : cat.color,
                    }}
                  />
                </div>

                <div className="flex justify-between items-baseline text-xs mb-4">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Spent: <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(cat.spent, preferences.currencySymbol)}</span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Remaining:{' '}
                    <span className={`font-bold ${isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                      {formatCurrency(remaining, preferences.currencySymbol)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Adjust Cap Controls */}
              <div className="pt-3 border-t border-slate-100 dark:border-[#1F304B] space-y-2">
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-semibold">
                  <span>Monthly Budget</span>
                  {editingCapCatId === cat.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        autoFocus
                        value={editingCapVal}
                        onChange={(e) => setEditingCapVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveCap(cat.id);
                          if (e.key === 'Escape') setEditingCapCatId(null);
                        }}
                        className="w-24 px-2 py-0.5 rounded-lg border border-cyan-400 bg-white dark:bg-[#1A283E] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <button
                        onClick={() => handleSaveCap(cat.id)}
                        className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                        title="Save cap"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingCapCatId(null)}
                        className="p-1 rounded-md bg-slate-100 dark:bg-[#1A283E] text-slate-500 hover:bg-slate-200"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEditCap(cat.id, cat.allocated)}
                      disabled={!canEditBudgets}
                      className="group/cap flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer disabled:cursor-default"
                      title={canEditBudgets ? 'Click to type exact cap' : undefined}
                    >
                      <span className="underline decoration-dotted decoration-slate-300 dark:decoration-slate-600 group-hover/cap:decoration-cyan-500">
                        {formatCurrency(cat.allocated, preferences.currencySymbol)}
                      </span>
                      {canEditBudgets && <Edit2 className="w-3 h-3 text-slate-400 group-hover/cap:text-cyan-500" />}
                    </button>
                  )}
                </div>

                {/* Adaptive Range Slider (disabled if cannot edit) */}
                {canEditBudgets ? (
                  <input
                    type="range"
                    min="0"
                    max={maxSliderValue}
                    step="50"
                    value={cat.allocated}
                    onChange={(e) => updateCategoryAllocation(cat.id, parseInt(e.target.value, 10))}
                    onPointerUp={() => updateCategoryAllocation(cat.id, cat.allocated)}
                    onKeyUp={() => updateCategoryAllocation(cat.id, cat.allocated)}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                ) : (
                  <div className="h-1.5 bg-slate-100 dark:bg-[#1A283E] rounded-full" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE BUDGET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131F33] rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-[#1F304B] p-6 text-slate-800 dark:text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1F304B] mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">New Budget Category</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1A283E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBudgetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Budget / Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gym & Fitness, Vacation, Coffee"
                  value={newBudgetName}
                  onChange={(e) => setNewBudgetName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#1A283E] text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Monthly Budget ({preferences.currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={newBudgetCap}
                  onChange={(e) => setNewBudgetCap(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#1A283E] text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-2.5">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewBudgetColor(color)}
                      className={`w-7 h-7 rounded-xl transition-all ${
                        newBudgetColor === color ? 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-[#131F33] scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(ICON_OPTIONS).map(([key, IconComponent]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewBudgetIcon(key)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                        newBudgetIcon === key
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 shadow-sm'
                          : 'border-slate-200 dark:border-[#1F304B] text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-[#1A283E]'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-[#1F304B]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A283E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white font-bold text-xs shadow-md shadow-cyan-600/20 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 transition-all"
                >
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE BUDGET CONFIRMATION MODAL */}
      {deletingCatId && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131F33] rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-[#1F304B] p-6 text-slate-800 dark:text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Remove Budget Category?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to remove the <span className="font-bold text-slate-800 dark:text-white">'{categoryToDelete.name}'</span> category?
              Existing transactions in this category will remain safe in your transaction history.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCatId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A283E]"
              >
                Keep Budget
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                Yes, Remove Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
