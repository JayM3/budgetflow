import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  Check,
  Calendar as CalendarIcon,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatCurrencyExact,
  formatDateDisplay,
  formatTimeDisplay,
  toLocalDatetimeInputString,
  formatDateRangeDisplay,
} from '../../utils/formatters';
import { Transaction, TransactionType } from '../../types/finance';
import { DateRangePickerModal } from '../features/DateRangePickerModal';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    updateTransaction,
    setIsQuickAddOpen,
    setIsCsvImportOpen,
    preferences,
    categories,
    wallets,
    currentUser,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState('0');
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editCategory, setEditCategory] = useState('');
  const [editWalletId, setEditWalletId] = useState('');
  const [editDatetime, setEditDatetime] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const isAdmin = !currentUser || currentUser.role === 'admin';

  const filteredTransactions = useMemo(() => {
    const list = transactions.filter((t) => {
      const matchesSearch =
        t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' || t.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesType = selectedType === 'all' || t.type === selectedType;

      const txDate = t.date.split('T')[0];
      const matchesDate =
        (!startDate || txDate >= startDate) && (!endDate || txDate <= endDate);

      return matchesSearch && matchesCat && matchesType && matchesDate;
    });

    return list.sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return dateSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [transactions, searchQuery, selectedCategory, selectedType, startDate, endDate, dateSortOrder]);

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditMerchant(tx.merchant);
    setEditAmount(tx.amount.toString());
    setEditType(tx.type);
    setEditCategory(tx.category);
    setEditWalletId(tx.walletId || wallets[0]?.id || '');
    setEditDatetime(toLocalDatetimeInputString(tx.date));
    setEditNotes(tx.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) return;

    const updated: Transaction = {
      ...editingTx,
      merchant: editMerchant.trim() || editingTx.merchant,
      amount: amt,
      type: editType,
      category: editType === 'income' ? 'Income' : editCategory,
      walletId: editWalletId || editingTx.walletId,
      date: editDatetime || editingTx.date,
      notes: editNotes.trim() || undefined,
    };

    updateTransaction(updated);
    setEditingTx(null);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Date & Time', 'Merchant', 'Category', 'Type', 'Amount', 'Wallet ID', 'Notes', 'Logged By'];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      `"${t.merchant.replace(/"/g, '""')}"`,
      t.category,
      t.type,
      t.amount,
      t.walletId || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.userName || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budgetflow_transactions_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchants, notes..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
            <option value="Income">Income</option>
          </select>

          {/* Type Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedType === 'all' ? 'bg-white shadow-sm text-slate-900 font-bold' : ''
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedType === 'expense' ? 'bg-white shadow-sm text-slate-900 font-bold' : ''
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedType === 'income' ? 'bg-white shadow-sm text-slate-900 font-bold' : ''
              }`}
            >
              Income
            </button>
          </div>

          {/* Date Range Filter Button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(true)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                startDate || endDate
                  ? 'border-cyan-400 bg-cyan-50 text-cyan-800 font-bold shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50/50'
              }`}
              title="Filter by date range or quick preset"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-cyan-600" />
              <span>{formatDateRangeDisplay(startDate, endDate)}</span>
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
                className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title="Clear date filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => setIsCsvImportOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Import bank statement CSV"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Export transactions to CSV with Date & Time logs"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Showing {filteredTransactions.length} Transactions
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Accurate date & time logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th
                  onClick={() => setDateSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                  className="p-4 cursor-pointer select-none hover:text-cyan-700 transition-colors group"
                  title={`Sort by Date & Time (${dateSortOrder === 'desc' ? 'Newest first - click for Oldest' : 'Oldest first - click for Newest'})`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date & Time</span>
                    {dateSortOrder === 'desc' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-cyan-600" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5 text-cyan-600" />
                    )}
                  </div>
                </th>
                <th className="p-4">Merchant & Notes</th>
                <th className="p-4">Category</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                const canEditTx = isAdmin || tx.userId === currentUser?.id;
                const timeString = formatTimeDisplay(tx.date);

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 font-semibold text-xs">
                            {formatDateDisplay(tx.date)}
                          </span>
                          {tx.date.split('T')[0] > new Date().toISOString().split('T')[0] && (
                            <span
                              className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200"
                              title="Scheduled / Upcoming transaction"
                            >
                              Upcoming
                            </span>
                          )}
                        </div>
                        {timeString ? (
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            {timeString}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300">00:00</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">
                          {tx.merchant}
                        </span>
                        {tx.userName && (
                          <span className="text-[10px] text-teal-600 font-semibold block">
                            Logged by {tx.userName}
                          </span>
                        )}
                        {tx.notes && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {tx.notes}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-100">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          isIncome ? 'text-emerald-600' : 'text-slate-600'
                        }`}
                      >
                        {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {isIncome ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`font-black text-sm ${
                          isIncome ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrencyExact(tx.amount, preferences.currencySymbol)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEditTx && (
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT TRANSACTION MODAL */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 p-6 text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                  <Edit2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Edit Transaction</h3>
              </div>
              <button
                onClick={() => setEditingTx(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Type toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEditType('expense')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    editType === 'expense' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setEditType('income')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    editType === 'income' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  Income
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Merchant / Description
                  </label>
                  <input
                    type="text"
                    required
                    value={editMerchant}
                    onChange={(e) => setEditMerchant(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Amount ({preferences.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editType === 'expense' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Wallet Account
                  </label>
                  <select
                    value={editWalletId}
                    onChange={(e) => setEditWalletId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>{w.name} ({w.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Accurate Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editDatetime}
                  onChange={(e) => setEditDatetime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Additional context or memo..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white font-bold text-xs shadow-md shadow-cyan-600/20 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DATE RANGE PICKER MODAL */}
      <DateRangePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        startDate={startDate}
        endDate={endDate}
        onApply={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
      />
    </div>
  );
};
