import React from 'react';
import { Calendar, Plus, CheckCircle2, Clock, ArrowDownLeft, ArrowUpRight, Zap } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';
import { Bill } from '../../types/finance';

export const MemberUpcomingBillsCard: React.FC = () => {
  const { bills, toggleBillPaid, addTransaction, preferences, wallets, setIsAddRecurringOpen } = useFinance();

  // bills in context is already scoped to visibleBills (user's allowed wallets)
  const unpaidItems = bills.filter((b) => !b.isPaid);

  const handleTogglePaid = (item: Bill) => {
    toggleBillPaid(item.id);
    if (!item.isPaid) {
      addTransaction({
        merchant: item.name,
        amount: item.amount,
        category: item.type === 'income' ? 'Income' : item.category,
        type: item.type === 'income' ? 'income' : 'expense',
        date: new Date().toISOString(),
        walletId: item.walletId || wallets[0]?.id,
        notes: `Recorded from recurring ${item.type === 'income' ? 'income' : 'bill'} schedule`,
        isRecurring: true,
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100/80 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            Upcoming Bills & Income
          </h2>
          <p className="text-xs text-slate-400">
            Recurring commitments scheduled for your wallets.
          </p>
        </div>
        <button
          onClick={() => setIsAddRecurringOpen(true)}
          className="px-3 py-1.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Recurring</span>
        </button>
      </div>

      {unpaidItems.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-700">All caught up!</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            No upcoming bills due for your wallets. Tap "+ Add Recurring" to schedule a payment or income stream.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {unpaidItems.slice(0, 5).map((item) => {
            const isIncome = item.type === 'income';
            return (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTogglePaid(item)}
                    className="w-5 h-5 rounded-lg border-2 border-slate-300 hover:border-teal-500 flex items-center justify-center text-transparent hover:text-teal-500 transition-all shrink-0"
                    title="Mark paid and log transaction"
                  >
                    <CheckCircle2 className="w-4 h-4 fill-teal-500 text-white" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {item.name}
                      </span>
                      {item.autoPay && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                          Auto
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Due {formatDateDisplay(item.dueDate)}</span>
                      <span>•</span>
                      <span className="capitalize">{item.frequency}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold ${
                      isIncome ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(item.amount, preferences.currencySymbol)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
