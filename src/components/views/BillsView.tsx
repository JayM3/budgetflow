import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, Plus, Zap, AlertCircle, Sparkles } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDateDisplay } from '../../utils/formatters';

export const BillsView: React.FC = () => {
  const { bills, toggleBillPaid, preferences, upcomingBillsCount, upcomingBillsTotal } = useFinance();

  const paidBillsCount = bills.filter((b) => b.isPaid).length;
  const paidBillsTotal = bills.filter((b) => b.isPaid).reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Stat Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Due Soon</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {formatCurrency(upcomingBillsTotal, preferences.currencySymbol)}
            </span>
            <span className="text-xs text-rose-500 font-semibold">{upcomingBillsCount} unpaid bills</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Paid This Month</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {formatCurrency(paidBillsTotal, preferences.currencySymbol)}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">{paidBillsCount} bills completed</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Recurring Monthly Commitments</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {formatCurrency(upcomingBillsTotal + paidBillsTotal, preferences.currencySymbol)}
            </span>
            <span className="text-xs text-cyan-700 font-semibold">Automatic calendar tracker</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            Scheduled Bills & Subscriptions
          </h2>
          <span className="text-xs font-medium text-slate-400">
            Click checkbox to mark paid or toggle status
          </span>
        </div>

        <div className="space-y-3">
          {bills.map((bill) => {
            return (
              <div
                key={bill.id}
                onClick={() => toggleBillPaid(bill.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  bill.isPaid
                    ? 'bg-slate-50/70 border-slate-200/60 opacity-70'
                    : 'bg-white border-slate-200 hover:border-cyan-400 hover:shadow-sm'
                }`}
              >
                {/* Left: Status Checkbox & Bill Info */}
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBillPaid(bill.id);
                    }}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      bill.isPaid
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 border-cyan-600 text-white'
                        : 'border-slate-300 hover:border-cyan-500'
                    }`}
                  >
                    {bill.isPaid && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${bill.isPaid ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {bill.name}
                      </span>
                      {bill.autoPay && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
                          Auto-Pay
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span>Due: {formatDateDisplay(bill.dueDate)}</span>
                      <span>•</span>
                      <span>{bill.category}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Status Badge */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span className={`font-black text-base ${bill.isPaid ? 'text-slate-400' : 'text-slate-900'}`}>
                    {formatCurrency(bill.amount, preferences.currencySymbol)}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      bill.isPaid
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}
                  >
                    {bill.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
