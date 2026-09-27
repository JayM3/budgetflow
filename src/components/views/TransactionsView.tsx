import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  Gamepad2,
  Car,
  Zap,
  Landmark,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrencyExact, formatDateDisplay } from '../../utils/formatters';
import { Transaction } from '../../types/finance';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    deleteTransaction,
    setIsQuickAddOpen,
    setIsCsvImportOpen,
    preferences,
    categories,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' || t.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesType = selectedType === 'all' || t.type === selectedType;

      return matchesSearch && matchesCat && matchesType;
    });
  }, [transactions, searchQuery, selectedCategory, selectedType]);

  const handleExportCsv = () => {
    const headers = ['ID', 'Date', 'Merchant', 'Category', 'Type', 'Amount', 'Notes'];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      `"${t.merchant.replace(/"/g, '""')}"`,
      t.category,
      t.type,
      t.amount,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budgetflow_transactions_${new Date().toISOString().split('T')[0]}.csv`;
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
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
            title="Export transactions to CSV"
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Merchant & Notes</th>
                <th className="p-4">Category</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-slate-500 font-medium">
                      {formatDateDisplay(tx.date)}
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
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
