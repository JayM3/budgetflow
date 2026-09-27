import React from 'react';
import { ShoppingBag, Gamepad2, Car, Zap, ArrowDownLeft, Landmark } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrencyExact, formatDateDisplay } from '../../utils/formatters';
import { Transaction } from '../../types/finance';

const getMerchantIcon = (tx: Transaction) => {
  const m = tx.merchant.toLowerCase();
  if (m.includes('whole foods')) {
    return (
      <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-black tracking-tighter">
        WF
      </div>
    );
  }
  if (m.includes('spotify')) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#1DB954] text-white flex items-center justify-center">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      </div>
    );
  }
  if (m.includes('uber')) {
    return (
      <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
        Uber
      </div>
    );
  }
  if (m.includes('city power')) {
    return (
      <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center">
        <Zap className="w-4 h-4 fill-white" />
      </div>
    );
  }
  if (tx.type === 'income' || m.includes('salary')) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-600 text-white flex items-center justify-center">
        <Landmark className="w-4 h-4" />
      </div>
    );
  }

  // Fallback icon based on category
  return (
    <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center text-xs font-bold">
      {tx.merchant.slice(0, 2).toUpperCase()}
    </div>
  );
};

const getCategoryPill = (category: string) => {
  switch (category.toLowerCase()) {
    case 'groceries':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
          <ShoppingBag className="w-3 h-3 text-emerald-500" />
          Groceries
        </span>
      );
    case 'entertainment':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-pink-50 text-pink-700">
          <Gamepad2 className="w-3 h-3 text-pink-500" />
          Entertainment
        </span>
      );
    case 'transport':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
          <Car className="w-3 h-3 text-orange-500" />
          Transport
        </span>
      );
    case 'utilities':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
          <Zap className="w-3 h-3 text-purple-500" />
          Utilities
        </span>
      );
    case 'income':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-700">
          <ArrowDownLeft className="w-3 h-3 text-cyan-500" />
          Income
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {category}
        </span>
      );
  }
};

export const RecentTransactionsCard: React.FC = () => {
  const { transactions, preferences, setActiveView } = useFinance();

  // Show 5 most recent transactions matching the screenshot
  const recent = transactions.slice(0, 5);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100/80 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          Recent Transactions
        </h2>
        <button
          onClick={() => setActiveView('transactions')}
          className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
        >
          View all
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <p className="text-xs font-bold text-slate-600">
            No transactions recorded yet
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Tap <strong className="text-teal-600">+ Add Expense</strong> above to log your first purchase or income deposit.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-100">
                <th className="pb-3 w-8">#</th>
                <th className="pb-3">Merchant</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recent.map((tx, idx) => {
                const isIncome = tx.type === 'income';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Row Number */}
                    <td className="py-3 text-slate-400 font-medium">{idx + 1}</td>

                    {/* Merchant with Icon */}
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {getMerchantIcon(tx)}
                        <div>
                          <span className="font-semibold text-slate-800 text-xs block">
                            {tx.merchant}
                          </span>
                          {tx.userName && (
                            <span className="text-[10px] text-teal-600 font-medium">
                              by {tx.userName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category Pill */}
                    <td className="py-3">{getCategoryPill(tx.category)}</td>

                    {/* Date */}
                    <td className="py-3 text-slate-500 font-medium">
                      {formatDateDisplay(tx.date)}
                    </td>

                    {/* Amount */}
                    <td className="py-3 text-right">
                      <span
                        className={`font-bold text-xs ${
                          isIncome ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrencyExact(tx.amount, preferences.currencySymbol)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
