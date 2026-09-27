import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  CalendarDays,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet as WalletIcon,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { RecurringItemType } from '../../types/finance';

export const AddRecurringModal: React.FC = () => {
  const {
    isAddRecurringOpen,
    setIsAddRecurringOpen,
    addBill,
    categories,
    wallets,
    currentUser,
  } = useFinance();

  const [itemType, setItemType] = useState<RecurringItemType>('bill');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('100');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(categories[0]?.name || 'Utilities');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'biweekly' | 'yearly'>('monthly');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [autoPay, setAutoPay] = useState(true);

  // Sync wallet default if wallets change
  useEffect(() => {
    if (wallets.length > 0 && (!walletId || !wallets.some((w) => w.id === walletId))) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  if (!isAddRecurringOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || Number(amount) <= 0) return;

    addBill({
      name: name.trim(),
      amount: parseFloat(amount),
      dueDate,
      category: itemType === 'income' ? 'Income' : category,
      isPaid: false,
      autoPay,
      frequency,
      type: itemType,
      walletId: walletId || wallets[0]?.id,
      paidByUserId: currentUser?.id,
    });

    setIsAddRecurringOpen(false);
    setName('');
    setAmount('100');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Add Recurring {itemType === 'income' ? 'Income' : 'Bill'}
              </h3>
              <p className="text-xs text-cyan-100">
                Schedule recurring subscriptions, expenses, or income deposits.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddRecurringOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Type Toggle: Bill vs Recurring Income */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Item Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setItemType('bill')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  itemType === 'bill'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Recurring Bill</span>
              </button>
              <button
                type="button"
                onClick={() => setItemType('income')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  itemType === 'income'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Recurring Income</span>
              </button>
            </div>
          </div>

          {/* Name & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Name / Merchant
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={itemType === 'income' ? 'e.g. Salary, Side Gig' : 'e.g. Netflix, Gym'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Amount
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Category & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {itemType === 'bill' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Budget Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Income Category
                </label>
                <input
                  type="text"
                  disabled
                  value="Income Stream"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-400 bg-slate-50 cursor-not-allowed"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly (Every 2 wks)</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* Due Date & Wallet Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                First Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Target Account / Wallet
              </label>
              {wallets.length === 0 ? (
                <div className="text-xs text-rose-500 p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                  No wallets available
                </div>
              ) : (
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.type})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Auto-pay checkbox */}
          <div className="pt-1">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPay}
                onChange={(e) => setAutoPay(e.target.checked)}
                className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-700">
                Mark as Auto-Pay (Direct Debit / Automatic Transfer)
              </span>
            </label>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 flex space-x-3">
            <button
              type="button"
              onClick={() => setIsAddRecurringOpen(false)}
              className="w-1/3 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || Number(amount) <= 0 || wallets.length === 0}
              className="w-2/3 py-2.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Recurring {itemType === 'income' ? 'Income' : 'Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
