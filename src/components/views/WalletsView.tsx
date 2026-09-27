import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  CreditCard,
  Landmark,
  Coins,
  AlertCircle,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  ShieldAlert,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Wallet } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { GuideButton } from '../guide/GuideButton';

const WALLET_COLORS = [
  '#0d9488', // Teal
  '#0284c7', // Sky
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#64748b', // Slate
];

const getWalletIcon = (type: string) => {
  switch (type) {
    case 'checking':
      return <Landmark className="w-5 h-5" />;
    case 'savings':
      return <WalletIcon className="w-5 h-5" />;
    case 'credit':
      return <CreditCard className="w-5 h-5" />;
    default:
      return <Coins className="w-5 h-5" />;
  }
};

export const WalletsView: React.FC = () => {
  const {
    wallets,
    preferences,
    creditUtilizationPercent,
    setIsGuideOpenWithId,
    currentUser,
    addWallet,
    updateWallet,
    deleteWallet,
  } = useFinance();

  const isAdmin = !currentUser || currentUser.role === 'admin';

  // Add / Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'cash';
    balance: number;
    limit?: number;
    color: string;
    isShared: boolean;
  }>({
    name: '',
    type: 'checking',
    balance: 0,
    limit: 0,
    color: WALLET_COLORS[0],
    isShared: true,
  });

  const totalAssets = wallets
    .filter((w) => w.type !== 'credit')
    .reduce((sum, w) => sum + w.balance, 0);

  const totalLiabilities = wallets
    .filter((w) => w.type === 'credit')
    .reduce((sum, w) => sum + w.balance, 0);

  const netWorth = totalAssets - totalLiabilities;

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      type: 'checking',
      balance: 0,
      limit: 1000,
      color: WALLET_COLORS[Math.floor(Math.random() * WALLET_COLORS.length)],
      isShared: true,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      limit: wallet.limit || 0,
      color: wallet.color,
      isShared: wallet.isShared ?? true,
    });
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addWallet({
      name: formData.name.trim(),
      type: formData.type,
      balance: Number(formData.balance) || 0,
      limit: formData.type === 'credit' ? Number(formData.limit) || 0 : undefined,
      color: formData.color,
      isShared: formData.isShared,
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWallet || !formData.name.trim()) return;

    updateWallet({
      ...editingWallet,
      name: formData.name.trim(),
      type: formData.type,
      balance: Number(formData.balance) || 0,
      limit: formData.type === 'credit' ? Number(formData.limit) || 0 : undefined,
      color: formData.color,
      isShared: formData.isShared,
    });

    setEditingWallet(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingWallet) return;
    deleteWallet(deletingWallet.id);
    setDeletingWallet(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Net Worth Banner & Action Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Net Worth
            </span>
            <GuideButton
              guideId="family-wallets"
              onOpenGuide={(id) => setIsGuideOpenWithId(id)}
            />
          </div>
          <span className="text-3xl font-black text-slate-900 mt-1 block">
            {formatCurrency(netWorth, preferences.currencySymbol)}
          </span>
          <span className="text-xs text-cyan-700 font-semibold">Across your permitted household accounts</span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Liquid Assets</span>
            <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
              {formatCurrency(totalAssets, preferences.currencySymbol)}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-xs text-slate-400 block font-medium">Credit Balances</span>
            <span className="text-lg font-bold text-rose-500 mt-0.5 block">
              {formatCurrency(totalLiabilities, preferences.currencySymbol)}
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/20 active:scale-95 transition-all ml-auto"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Credit Utilization Alert Card */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
          creditUtilizationPercent < 30
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/60 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {creditUtilizationPercent < 30 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div>
            <h4 className="text-xs font-bold">
              Total Credit Utilization: {creditUtilizationPercent}%
            </h4>
            <p className="text-xs opacity-80">
              {creditUtilizationPercent < 30
                ? 'Your credit usage is well below the 30% threshold. Ideal for protecting your score.'
                : 'Your utilization is above 30%. Paying down before statement closing will boost your credit rating.'}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-white shadow-sm shrink-0">
          Target: &lt;30%
        </span>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {wallets.map((w) => {
          const isCredit = w.type === 'credit';
          const utilPct = isCredit && w.limit ? Math.min(100, Math.round((w.balance / w.limit) * 100)) : 0;

          return (
            <div
              key={w.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ backgroundColor: w.color }}
                  >
                    {getWalletIcon(w.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{w.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {w.type}
                      </span>
                      {w.isShared && (
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                          Shared
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Balance display */}
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900 block">
                    {formatCurrency(w.balance, preferences.currencySymbol)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Current Balance</span>
                </div>
              </div>

              {/* Credit Limit / Usage Progress Bar */}
              {isCredit && w.limit && (
                <div className="mt-2 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">
                      Limit: {formatCurrency(w.limit, preferences.currencySymbol)}
                    </span>
                    <span className={`font-bold ${utilPct > 30 ? 'text-amber-600' : 'text-slate-700'}`}>
                      {utilPct}% used
                    </span>
                  </div>
                  <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        utilPct > 50 ? 'bg-rose-500' : utilPct > 30 ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${utilPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Admin Actions Bar */}
              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Admin Actions:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(w)}
                      className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-all font-medium"
                      title="Edit wallet details or balance"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingWallet(w)}
                      className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all font-medium"
                      title="Delete wallet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Wallet Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <WalletIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add New Wallet</h3>
                  <p className="text-xs text-slate-500">Create a checking, savings, credit, or cash account</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Wallet Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Checking, High-Yield Savings, Amex Gold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'checking' | 'savings' | 'credit' | 'cash',
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="cash">Cash / Petty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Starting Balance ({preferences.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                  />
                </div>
              </div>

              {formData.type === 'credit' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Credit Limit ({preferences.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.limit || ''}
                    onChange={(e) => setFormData({ ...formData, limit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                </div>
              )}

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Wallet Color Badge
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {WALLET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center ${
                        formData.color === c ? 'scale-110 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {formData.color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shared Household Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isShared}
                    onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Shared with entire household
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 rounded-xl shadow-md shadow-cyan-600/20 transition-all active:scale-95"
                >
                  Save Wallet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Wallet Modal (Balance Reconciliation) */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit & Reconcile Wallet</h3>
                  <p className="text-xs text-slate-500">Update account name, type, and current balance</p>
                </div>
              </div>
              <button
                onClick={() => setEditingWallet(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Wallet Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'checking' | 'savings' | 'credit' | 'cash',
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="cash">Cash / Petty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Adjust Balance ({preferences.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-cyan-900"
                  />
                </div>
              </div>

              {formData.type === 'credit' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Credit Limit ({preferences.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formData.limit || ''}
                    onChange={(e) => setFormData({ ...formData, limit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                  />
                </div>
              )}

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Wallet Color Badge
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {WALLET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center ${
                        formData.color === c ? 'scale-110 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {formData.color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shared Household Checkbox */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isShared}
                    onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                    className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Shared with entire household
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingWallet(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 rounded-xl shadow-md shadow-cyan-600/20 transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Wallet Confirmation Modal */}
      {deletingWallet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-slate-900 text-lg mb-1">
              Delete Wallet?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-800">"{deletingWallet.name}"</span>?
              {wallets.length <= 1 ? (
                <span className="block mt-2 font-bold text-rose-600">
                  Cannot delete the only remaining wallet in the household.
                </span>
              ) : (
                ' This action will remove this wallet from household accounts.'
              )}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingWallet(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={wallets.length <= 1}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-rose-600/20 transition-all active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
