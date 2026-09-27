import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, Trash2, X, AlertTriangle, CheckCircle, Server, HardDrive } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const RefreshPromptModal: React.FC = () => {
  const {
    isRefreshPromptOpen,
    setIsRefreshPromptOpen,
    saveAll,
    bypassSaveOnUnload,
    isSelfHosted,
    serverStatus,
  } = useFinance();

  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  // Close on Escape or confirm on Enter
  useEffect(() => {
    if (!isRefreshPromptOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsRefreshPromptOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRefreshPromptOpen, setIsRefreshPromptOpen]);

  if (!isRefreshPromptOpen) return null;

  const handleSaveAndRefresh = async () => {
    try {
      setIsSaving(true);
      await saveAll();
      // Brief pause for visual confirmation then reload
      setTimeout(() => {
        window.location.reload();
      }, 350);
    } catch (err) {
      console.error('Failed to save before refresh:', err);
      // Reload anyway after attempting
      window.location.reload();
    }
  };

  const handleDiscardAndRefresh = () => {
    setIsDiscarding(true);
    bypassSaveOnUnload();
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  const handleCancel = () => {
    setIsRefreshPromptOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop overlay dismiss */}
      <div className="fixed inset-0" onClick={handleCancel} />

      {/* Modal Dialog Card */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200 z-10 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
              <RefreshCw className="w-6 h-6 animate-[spin_4s_linear_infinite]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Page Refresh Requested
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Keyboard shortcut (F5 / Ctrl+F5 / Ctrl+R) detected
              </p>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cancel and stay on this page"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Host Info */}
        <div className="py-5 space-y-4 relative z-10">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            You requested a page reload. Would you like to save your latest changes to the server host storage before reloading, discard any unsaved client changes, or cancel and stay here?
          </p>

          {/* Destination banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3 text-xs">
            {isSelfHosted ? (
              <>
                <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                    Server Host Storage Active
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Host: {serverStatus?.lanIp || 'localhost'}:5050 (Data saved to server host)
                  </span>
                </div>
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                    Local Browser Storage
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Data will be saved to your browser&apos;s local storage
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3 Action Buttons */}
        <div className="pt-2 space-y-2.5 relative z-10">
          {/* Action 1: Save Data & Refresh (Recommended Primary) */}
          <button
            onClick={handleSaveAndRefresh}
            disabled={isSaving || isDiscarding}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-600 hover:from-teal-600 hover:via-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center justify-between group active:scale-[0.99] disabled:opacity-75"
          >
            <div className="flex items-center gap-2.5">
              {isSaving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
              )}
              <div className="text-left">
                <span className="block font-black text-sm">
                  {isSaving ? 'Saving Data & Reloading...' : 'Save Data & Refresh'}
                </span>
                <span className="text-[11px] text-teal-100 font-medium block">
                  Persists all wallets, budgets & transactions to server host
                </span>
              </div>
            </div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-lg font-mono">
              Recommended
            </span>
          </button>

          {/* Action 2: Discard Changes & Refresh */}
          <button
            onClick={handleDiscardAndRefresh}
            disabled={isSaving || isDiscarding}
            className="w-full py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold text-sm transition-all flex items-center justify-between group active:scale-[0.99] disabled:opacity-75"
          >
            <div className="flex items-center gap-2.5">
              {isDiscarding ? (
                <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
              ) : (
                <Trash2 className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
              )}
              <div className="text-left">
                <span className="block font-bold text-xs sm:text-sm">
                  {isDiscarding ? 'Discarding & Reloading...' : 'Discard Changes & Refresh'}
                </span>
                <span className="text-[11px] text-rose-500/90 dark:text-rose-400 font-normal block">
                  Revert unsaved client changes and reload clean host data
                </span>
              </div>
            </div>
          </button>

          {/* Action 3: Cancel */}
          <button
            onClick={handleCancel}
            disabled={isSaving || isDiscarding}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <X className="w-4 h-4 text-slate-500" />
            <span>Cancel (Stay on Page)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
