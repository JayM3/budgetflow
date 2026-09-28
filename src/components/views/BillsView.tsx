import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Zap,
  AlertCircle,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit2,
  CalendarDays,
  ExternalLink,
  X,
  Check,
  Save,
  RefreshCw,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { Bill, RecurringItemType } from '../../types/finance';
import { generateGoogleCalendarUrl } from '../../utils/calendarSync';

export const BillsView: React.FC = () => {
  const {
    bills,
    toggleBillPaid,
    addBill,
    updateBill,
    deleteBill,
    addTransaction,
    preferences,
    categories,
    wallets,
    currentUser,
    setIsCalendarModalOpen,
    saveBillsState,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'all' | 'bills' | 'income'>('all');

  // Save Button State
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveRecurring = async () => {
    setIsSaving(true);
    try {
      await saveBillsState();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Modal State for Add / Edit Recurring Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [itemType, setItemType] = useState<RecurringItemType>('bill');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('100');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(categories[0]?.name || 'Utilities');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'biweekly' | 'yearly'>('monthly');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [autoPay, setAutoPay] = useState(true);

  // Delete confirmation
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null);

  const canManageBills = !currentUser || currentUser.role === 'admin' || currentUser.permissions?.canAddBills;

  // Compute metrics
  const recurringBills = bills.filter((b) => b.type !== 'income');
  const recurringIncome = bills.filter((b) => b.type === 'income');

  const upcomingBills = recurringBills.filter((b) => !b.isPaid);
  const upcomingBillsTotal = upcomingBills.reduce((acc, b) => acc + b.amount, 0);
  const upcomingBillsCount = upcomingBills.length;

  const totalMonthlyIncome = recurringIncome.reduce((acc, b) => acc + b.amount, 0);
  const totalMonthlyBills = recurringBills.reduce((acc, b) => acc + b.amount, 0);
  const netRecurringCashflow = totalMonthlyIncome - totalMonthlyBills;

  // Filter and sort items: unpaid items first, then by dueDate
  const displayedItems = useMemo(() => {
    let list: Bill[];
    if (activeTab === 'bills') list = recurringBills;
    else if (activeTab === 'income') list = recurringIncome;
    else list = bills;

    return [...list].sort((a, b) => {
      if (a.isPaid !== b.isPaid) {
        return a.isPaid ? 1 : -1;
      }
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [bills, activeTab, recurringBills, recurringIncome]);

  const handleOpenAddModal = (defaultType: RecurringItemType = 'bill') => {
    setEditingBill(null);
    setItemType(defaultType);
    setName('');
    setAmount('100');
    setDueDate(new Date().toISOString().split('T')[0]);
    setCategory(defaultType === 'income' ? 'Income' : categories[0]?.name || 'Utilities');
    setFrequency('monthly');
    setWalletId(wallets[0]?.id || '');
    setAutoPay(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: Bill) => {
    setEditingBill(b);
    setItemType(b.type || 'bill');
    setName(b.name);
    setAmount(b.amount.toString());
    setDueDate(b.dueDate);
    setCategory(b.category);
    setFrequency(b.frequency);
    setWalletId(b.walletId || wallets[0]?.id || '');
    setAutoPay(b.autoPay);
    setIsModalOpen(true);
  };

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    if (editingBill) {
      updateBill({
        ...editingBill,
        name: name.trim(),
        amount: amt,
        dueDate,
        category: itemType === 'income' ? 'Income' : category,
        frequency,
        type: itemType,
        walletId,
        autoPay,
      });
    } else {
      addBill({
        name: name.trim(),
        amount: amt,
        dueDate,
        category: itemType === 'income' ? 'Income' : category,
        isPaid: false,
        autoPay,
        frequency,
        type: itemType,
        walletId,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingBillId) {
      deleteBill(deletingBillId);
      setDeletingBillId(null);
    }
  };

  const handleToggleItemPaid = (item: Bill) => {
    toggleBillPaid(item.id);
  };

  const billToDelete = bills.find((b) => b.id === deletingBillId);

  return (
    <div className="space-y-6">
      {/* Top Stat Summary: Bills vs Income vs Net Cashflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Upcoming Bills (Outflows)</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              {formatCurrency(upcomingBillsTotal, preferences.currencySymbol)}
            </span>
            <span className="text-xs text-rose-500 font-semibold">{upcomingBillsCount} unpaid bills this month</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Expected Recurring Income</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
              {formatCurrency(totalMonthlyIncome, preferences.currencySymbol)}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{recurringIncome.length} recurring sources</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Net Recurring Cashflow</span>
            <span className={`text-2xl font-extrabold mt-1 block ${netRecurringCashflow >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500'}`}>
              {netRecurringCashflow >= 0 ? '+' : ''}{formatCurrency(netRecurringCashflow, preferences.currencySymbol)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Monthly recurring balance</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Toolbar & Segmented Tabs */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-5 border border-slate-100 dark:border-[#1F304B] shadow-card flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        {/* Segmented Filter */}
        <div className="flex bg-slate-100 dark:bg-[#1A283E] p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'all' ? 'bg-white dark:bg-[#131F33] shadow-sm text-slate-900 dark:text-white font-bold' : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Items ({bills.length})
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'bills' ? 'bg-white dark:bg-[#131F33] shadow-sm text-rose-600 font-bold' : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Bills ({recurringBills.length})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'income' ? 'bg-white dark:bg-[#131F33] shadow-sm text-emerald-600 font-bold' : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Income ({recurringIncome.length})
          </button>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-[#1A283E] text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Sync with Device Calendar (iOS, Android, Outlook, Mac)"
          >
            <CalendarDays className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Sync Device Calendar</span>
          </button>

          {canManageBills && (
            <>
              <button
                onClick={handleSaveRecurring}
                disabled={isSaving}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-75 ${
                  isSaved
                    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-[#1F304B] hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-[#1A283E] text-slate-700 dark:text-slate-300'
                }`}
                title="Save recurring schedule to server"
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                ) : isSaved ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                )}
                <span>{isSaved ? 'Saved!' : isSaving ? 'Saving...' : 'Save'}</span>
              </button>

              <button
                onClick={() => handleOpenAddModal('bill')}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Recurring Item</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bills & Income List */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl border border-slate-100 dark:border-[#1F304B] shadow-card overflow-hidden p-6 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
            Scheduled Bills & Recurring Income Streams
          </h2>
          <span className="text-xs font-medium text-slate-400">
            Click checkbox to mark paid/received and optionally log to ledger
          </span>
        </div>

        {displayedItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No recurring items in this category yet. Click "+ Add Recurring Item" to schedule your commitments.
          </div>
        ) : (
          <div className="space-y-3">
            {displayedItems.map((item) => {
              const isIncome = item.type === 'income';

              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleItemPaid(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    item.isPaid
                      ? 'bg-slate-50/70 dark:bg-[#1A283E]/40 border-slate-200/60 dark:border-[#1F304B] opacity-75'
                      : 'bg-white dark:bg-[#131F33] border-slate-200 dark:border-[#1F304B] hover:border-cyan-400 hover:shadow-sm'
                  }`}
                >
                  {/* Left: Status Checkbox & Item Info */}
                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleItemPaid(item);
                      }}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                        item.isPaid
                          ? isIncome
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-gradient-to-r from-teal-600 to-cyan-600 border-cyan-600 text-white'
                          : 'border-slate-300 dark:border-[#1F304B] hover:border-cyan-500'
                      }`}
                    >
                      {item.isPaid && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${item.isPaid ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {item.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isIncome
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40'
                              : 'bg-slate-100 dark:bg-[#1A283E] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1F304B]'
                          }`}
                        >
                          {isIncome ? 'Income' : item.category}
                        </span>
                        {item.autoPay && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-100 dark:border-cyan-900/40">
                            Auto
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 capitalize">
                          ({item.frequency})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>Due: {formatDateDisplay(item.dueDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount, Actions & Status Badge */}
                  <div className="flex items-center justify-between sm:justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                    <span className={`font-black text-base ${item.isPaid ? 'text-slate-400' : isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                      {isIncome ? '+' : '-'}
                      {formatCurrency(item.amount, preferences.currencySymbol)}
                    </span>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        item.isPaid
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : isIncome
                          ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40'
                          : 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                      }`}
                    >
                      {item.isPaid ? (isIncome ? 'Received' : 'Paid') : isIncome ? 'Expected' : 'Unpaid'}
                    </span>

                    {/* Quick Add to Google Calendar */}
                    <a
                      href={generateGoogleCalendarUrl(item, preferences.currencySymbol)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-[#1A283E] transition-all"
                      title="Add to Google Calendar"
                    >
                      <Calendar className="w-4 h-4" />
                    </a>

                    {canManageBills && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-[#1A283E] transition-all"
                          title="Edit recurring item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingBillId(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                          title="Delete recurring item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131F33] rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-[#1F304B] p-6 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1F304B] mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                  {editingBill ? <Edit2 className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingBill ? 'Edit Recurring Commitment' : 'Add Recurring Commitment'}
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
              {/* Type Switcher */}
              <div className="flex bg-slate-100 dark:bg-[#0B131F] p-1 rounded-xl border border-transparent dark:border-[#1F304B]">
                <button
                  type="button"
                  onClick={() => {
                    setItemType('bill');
                    setCategory(categories[0]?.name || 'Utilities');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    itemType === 'bill' ? 'bg-white dark:bg-[#131F33] shadow text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Bill (Outflow)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItemType('income');
                    setCategory('Income');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    itemType === 'income' ? 'bg-white dark:bg-[#131F33] shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Income (Inflow)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Name / Payee
                </label>
                <input
                  type="text"
                  required
                  placeholder={itemType === 'income' ? 'e.g. Primary Salary, Consulting Retainer' : 'e.g. Electric Bill, Rent, Netflix'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#0B131F] text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Amount ({preferences.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] bg-white dark:bg-[#0B131F] text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e: any) => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#0B131F] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Next Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#0B131F] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  {itemType === 'income' ? (
                    <input
                      type="text"
                      disabled
                      value="Income"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-semibold bg-slate-50 dark:bg-[#0B131F] text-slate-500 dark:text-slate-400"
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#0B131F] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Associated Wallet Account
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#0B131F] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoPay"
                  checked={autoPay}
                  onChange={(e) => setAutoPay(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-[#0B131F] border-slate-300 dark:border-[#1F304B]"
                />
                <label htmlFor="autoPay" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {itemType === 'income' ? 'Automatic direct deposit' : 'Auto-pay enabled with bank'}
                </label>
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
                  {editingBill ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBillId && billToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#131F33] rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-[#1F304B] p-6 text-slate-800 dark:text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Remove Recurring Commitment?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-slate-200">'{billToDelete.name}'</span>?
              It will no longer appear in your calendar schedule.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingBillId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A283E]"
              >
                Keep Item
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
