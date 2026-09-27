import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Minus,
  Check,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  ShoppingBag,
  Home,
  Car,
  Gamepad2,
  Utensils,
  HeartPulse,
  Landmark,
  Wallet,
  Zap,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatCurrencyExact } from '../../utils/formatters';
import { TransactionType } from '../../types/finance';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  Home,
  Car,
  Gamepad2,
  Zap,
  Utensils,
  HeartPulse,
  Landmark,
  Wallet,
};

export const QuickAddModal: React.FC = () => {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    addTransaction,
    categories,
    wallets,
    preferences,
    triggerConfetti,
    currentUser,
  } = useFinance();

  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [amount, setAmount] = useState<number>(0);
  const [type, setType] = useState<TransactionType>('expense');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Groceries');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [hasDate, setHasDate] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [alreadyHappened, setAlreadyHappened] = useState(false);
  const [notes, setNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const isFutureDate = date > todayStr;
  const isPastDate = date < todayStr;
  const isTodayDate = date === todayStr;

  // Auto-check "Already happened" when a past date is selected
  useEffect(() => {
    if (hasDate && isPastDate) {
      setAlreadyHappened(true);
    } else if (hasDate && isFutureDate) {
      setAlreadyHappened(false);
    }
  }, [hasDate, isPastDate, isFutureDate]);

  // Sync default category and wallet
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.name === category)) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  useEffect(() => {
    if (wallets.length > 0 && (!walletId || !wallets.some((w) => w.id === walletId))) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  if (!isQuickAddOpen) return null;

  // Determine increment presets according to currency
  const isCentsCurrency = preferences.currency === 'USD' || preferences.currency === 'EUR';
  const incrementValues = isCentsCurrency ? [0.25, 1, 5, 25, 100] : [1, 5, 25, 100, 500];

  const handleAdjustAmount = (delta: number) => {
    setAmount((prev) => {
      const next = Math.max(0, parseFloat((prev + delta).toFixed(2)));
      return next;
    });
  };

  const handleResetAmount = () => {
    setAmount(0);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (amount <= 0) return;

    const finalDate = hasDate ? date : new Date().toISOString().split('T')[0];
    const isHistorical = alreadyHappened || (hasDate && isPastDate);

    addTransaction({
      merchant: merchant.trim() || (type === 'income' ? 'Income Deposit' : category),
      amount,
      category: type === 'income' ? 'Income' : category,
      type,
      date: finalDate,
      alreadyHappened: isHistorical,
      walletId,
      notes: notes.trim() || undefined,
      userId: currentUser?.id,
      userName: currentUser?.name,
    });

    triggerConfetti();
    setIsQuickAddOpen(false);
    // Reset state for next open
    setStep(1);
    setAmount(0);
    setMerchant('');
    setNotes('');
    setHasDate(false);
    setAlreadyHappened(false);
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {step === 1
                  ? 'Step 1: Put in Amount'
                  : type === 'income'
                  ? 'Step 2: Choose Receiving Account'
                  : 'Step 2: Choose Category & Account'}
              </h3>
              <p className="text-xs text-cyan-100">
                {step === 1
                  ? 'Use quick +/- buttons or enter the exact sum.'
                  : type === 'income'
                  ? 'Tap the receiving wallet to record your entry.'
                  : 'Tap the category and wallet to record your entry.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsQuickAddOpen(false);
              setStep(1);
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Presence & Type Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center space-x-1.5">
            <span>Logging for:</span>
            <strong className="text-slate-800 flex items-center space-x-1 font-semibold">
              <span>{currentUser?.avatar || '👤'}</span>
              <span>{currentUser?.name || preferences.userName}</span>
            </strong>
          </span>

          {/* Expense / Income Toggle */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                type === 'expense' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                type === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* STEP 1: Put in Amount */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            {/* Amount Display with Currency */}
            <div className="text-center py-2 bg-slate-50/80 rounded-3xl border border-slate-100 p-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                Total Amount ({preferences.currency})
              </span>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={amount === 0 ? '' : amount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAmount(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  placeholder="0"
                  className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight text-center max-w-[240px] bg-transparent focus:outline-none focus:ring-0"
                />
                <span className="text-xl sm:text-2xl font-extrabold text-teal-600">
                  {preferences.currencySymbol}
                </span>
              </div>
            </div>

            {/* Currency-Sensitive Increment / Decrement Buttons */}
            <div className="space-y-2">
              {/* Minus Row */}
              <div className="flex items-center gap-1.5 justify-center">
                <span className="w-10 text-[10px] font-bold uppercase text-rose-500 text-right pr-1">
                  Minus
                </span>
                {incrementValues.map((val) => (
                  <button
                    key={`minus-${val}`}
                    type="button"
                    onClick={() => handleAdjustAmount(-val)}
                    disabled={amount <= 0}
                    className="flex-1 max-w-[68px] py-2 bg-rose-50 hover:bg-rose-100 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-0.5"
                  >
                    <Minus className="w-3 h-3" />
                    <span>{val}</span>
                  </button>
                ))}
              </div>

              {/* Plus Row */}
              <div className="flex items-center gap-1.5 justify-center">
                <span className="w-10 text-[10px] font-bold uppercase text-emerald-600 text-right pr-1">
                  Add
                </span>
                {incrementValues.map((val) => (
                  <button
                    key={`plus-${val}`}
                    type="button"
                    onClick={() => handleAdjustAmount(val)}
                    className="flex-1 max-w-[68px] py-2 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{val}</span>
                  </button>
                ))}
              </div>

              {/* Quick Clear Button */}
              {amount > 0 && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleResetAmount}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to 0</span>
                  </button>
                </div>
              )}
            </div>

            {/* Merchant / Description (Optional) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {type === 'income' ? 'Income Source / Description (Optional)' : 'Merchant or Item (Optional)'}
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder={type === 'income' ? 'e.g. Salary, Client payment, Bonus' : 'e.g. Rema 1000, Starbucks, Gas'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 text-xs font-semibold text-slate-800"
              />
            </div>

            {/* Date Checkmark Toggle */}
            <div className="pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasDate}
                  onChange={(e) => setHasDate(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  <span>Specify date (happened or upcoming)</span>
                </span>
              </label>

              {hasDate && (
                <div className="mt-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 animate-in fade-in slide-in-from-top-1 duration-150 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Transaction Date
                    </span>
                    {isFutureDate && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center gap-1">
                        <span>⏳ Will happen / Scheduled</span>
                      </span>
                    )}
                    {isPastDate && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <span>🕒 Happened</span>
                      </span>
                    )}
                    {isTodayDate && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span>✓ Today</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <p className="text-[11px] text-slate-400 font-medium">
                    {isFutureDate
                      ? 'This transaction is scheduled for a future date.'
                      : isPastDate
                      ? 'This transaction occurred on a past date.'
                      : 'This transaction took place today.'}
                  </p>

                  {/* Already happened toggle */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={alreadyHappened}
                        onChange={(e) => setAlreadyHappened(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">
                            Already happened
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                            Won't minus wallet balance
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">
                          Records transaction in budget envelopes & history without altering your current wallet balance.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Next Step Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsQuickAddOpen(false);
                  setStep(1);
                  setHasDate(false);
                  setAlreadyHappened(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={amount <= 0}
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <span>{type === 'income' ? 'Next: Choose Account' : 'Next: Choose Category & Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Categories and Family Checking / Wallets as BUTTONS */}
        {step === 2 && (
          <div className="p-6 space-y-5 animate-in fade-in duration-150">
            {/* Amount Summary Pill */}
            <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                  Amount:
                </span>
                <span className="text-lg font-black text-slate-900">
                  {formatCurrencyExact(amount, preferences.currencySymbol)}
                </span>
                {merchant && (
                  <span className="text-xs text-slate-500 font-medium truncate max-w-[140px]">
                    ({merchant})
                  </span>
                )}
                {hasDate && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isFutureDate
                        ? 'bg-cyan-100 text-cyan-800 border-cyan-200'
                        : isPastDate
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {isFutureDate ? '⏳ Upcoming: ' : isPastDate ? '🕒 Past: ' : '📅 '}
                    {date}
                  </span>
                )}
                {(alreadyHappened || (hasDate && isPastDate)) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    🕒 Historical • Wallet unchanged
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-teal-700 hover:underline shrink-0"
              >
                Change
              </button>
            </div>

            {/* CATEGORIES BUTTONS GRID - Only for Expense */}
            {type === 'expense' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Select Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {categories.map((c) => {
                    const Icon = iconMap[c.icon] || ShoppingBag;
                    const isSelected = category.toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.name)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-400 text-teal-950 font-bold shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${c.color}20`,
                            color: c.color,
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FAMILY CHECKING / WALLET BUTTONS */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {type === 'expense' ? '2. Select Account / Wallet' : 'Select Receiving Account / Wallet'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {wallets.map((w) => {
                  const isSelected = walletId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setWalletId(w.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? type === 'income'
                            ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400 text-emerald-950 font-bold shadow-xs'
                            : 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-400 text-teal-950 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: w.color }}
                      >
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs block truncate">{w.name}</span>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                          {w.type}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Amount</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                className={`px-6 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 ${
                  type === 'income'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                    : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:to-sky-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{type === 'income' ? 'Confirm & Save Income' : 'Confirm & Save Expense'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
