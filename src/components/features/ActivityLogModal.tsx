import React, { useState } from 'react';
import {
  History,
  X,
  Search,
  Filter,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Edit3,
  PlusCircle,
  RefreshCw,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDateTimeDisplay } from '../../utils/formatters';

const getActionBadge = (action: string) => {
  switch (action) {
    case 'create':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <PlusCircle className="w-3 h-3" />
          <span>Created</span>
        </span>
      );
    case 'update':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
          <Edit3 className="w-3 h-3" />
          <span>Updated</span>
        </span>
      );
    case 'delete':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <Trash2 className="w-3 h-3" />
          <span>Deleted</span>
        </span>
      );
    case 'rebalance':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          <RefreshCw className="w-3 h-3" />
          <span>Rebalanced</span>
        </span>
      );
    case 'pay':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <ArrowUpRight className="w-3 h-3" />
          <span>Paid</span>
        </span>
      );
    case 'receive':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <ArrowDownLeft className="w-3 h-3" />
          <span>Received</span>
        </span>
      );
    case 'reconcile':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <ShieldCheck className="w-3 h-3" />
          <span>Reconciled</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
          {action}
        </span>
      );
  }
};

const getEntityBadge = (entity: string) => {
  const styles: Record<string, string> = {
    budget: 'bg-teal-50 text-teal-800 border-teal-200',
    transaction: 'bg-sky-50 text-sky-800 border-sky-200',
    bill: 'bg-amber-50 text-amber-800 border-amber-200',
    goal: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    wallet: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    user: 'bg-purple-50 text-purple-800 border-purple-200',
  };

  const style = styles[entity] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${style}`}>
      {entity}
    </span>
  );
};

export const ActivityLogModal: React.FC = () => {
  const { isActivityLogOpen, setIsActivityLogOpen, activityLogs } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('all');

  if (!isActivityLogOpen) return null;

  const filteredLogs = [...activityLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter((log) => {
      const matchesSearch =
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEntity = filterEntity === 'all' || log.entity === filterEntity;

      return matchesSearch && matchesEntity;
    });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Date & Time Activity Audit Log
                </h3>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {activityLogs.length} events
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detailed timestamps for all financial modifications and budget updates
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsActivityLogOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="py-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs by keyword, user, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['all', 'budget', 'transaction', 'bill', 'goal', 'wallet'].map((ent) => (
              <button
                key={ent}
                onClick={() => setFilterEntity(ent)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                  filterEntity === ent
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ent === 'all' ? 'All Entities' : ent}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div className="overflow-y-auto py-3 space-y-2.5 flex-1 pr-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No activity logs recorded</p>
              <p className="text-xs text-slate-400 mt-0.5">
                New modifications will appear here with second-accurate timestamps.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getActionBadge(log.action)}
                    {getEntityBadge(log.entity)}
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {log.userName}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {log.description}
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-cyan-600" />
                    <span className="text-slate-600 font-semibold">
                      {formatDateTimeDisplay(log.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Showing {filteredLogs.length} of {activityLogs.length} recorded events
          </span>
          <button
            onClick={() => setIsActivityLogOpen(false)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
