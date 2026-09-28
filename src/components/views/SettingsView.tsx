import React, { useState } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  User,
  DollarSign,
  Github,
  Clock,
  ArrowUpCircle,
  ShieldAlert,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Palette,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { useFinance } from '../../context/FinanceContext';
import { api, SystemUpdateStatus } from '../../services/api';
import { UpdateModal } from '../features/UpdateModal';
import { isGitHubPages } from '../../utils/env';

const CURRENCIES = [
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone (kr / NOK)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
];

export const SettingsView: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    resetToDemoData,
    clearToFreshSlate,
    exportDataJson,
    importDataJson,
    triggerConfetti,
    setActiveView,
    setIsTabletMode,
    currentUser,
    isSelfHosted,
    theme,
    setTheme,
    isDarkMode,
    previewMobileOnPc,
    setPreviewMobileOnPc,
  } = useFinance();

  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Software & System Updates State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<SystemUpdateStatus | null>(null);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      const res = await api.checkForUpdate();
      setUpdateInfo(res);
      setLastCheckedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (res.updateAvailable) {
        setIsUpdateModalOpen(true);
      }
    } catch (_) {
      setUpdateInfo({
        success: false,
        updateAvailable: false,
        currentVersion: '1.0.2.2',
        error: 'Could not contact server to check updates.',
      });

    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const success = importDataJson(text);
        if (success) {
          triggerConfetti();
          setImportStatus('Backup successfully restored!');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('Failed to restore backup. Invalid JSON format.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Admin-Only Route Guard
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-8 border border-slate-100 dark:border-[#1F304B] shadow-card text-center max-w-md mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Admin Access Required</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Application settings and system configurations are restricted exclusively to household administrators.
        </p>
        <button
          onClick={() => setActiveView('dashboard')}
          className="px-4 py-2 bg-slate-900 dark:bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 dark:hover:bg-teal-700 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* 1. Appearance & Theme (From Reference Screenshot) */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card space-y-5 transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1F304B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Appearance & Theme</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                Choose your color mode preference or sync automatically with your device OS.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/40">
            {theme === 'dark' ? '🌙 Dark Active' : theme === 'light' ? '☀️ Light Active' : '💻 System Match'}
          </span>
        </div>

        {/* 3 Theme Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Light Mode */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative cursor-pointer active:scale-95 ${
              theme === 'light'
                ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 shadow-sm'
                : 'border-slate-200/80 dark:border-[#1F304B] bg-slate-50/50 dark:bg-[#1A283E]/50 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              {theme === 'light' && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              )}
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">Light Mode</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Clean white cards with soft ice mint background.
            </p>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative cursor-pointer active:scale-95 ${
              theme === 'dark'
                ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 shadow-sm'
                : 'border-slate-200/80 dark:border-[#1F304B] bg-slate-50/50 dark:bg-[#1A283E]/50 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-teal-300 flex items-center justify-center border border-slate-700">
                <Moon className="w-5 h-5" />
              </div>
              {theme === 'dark' && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              )}
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">Dark Mode</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Deep midnight obsidian navy with glowing teal accents.
            </p>
          </button>

          {/* System Default */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-2xl border-2 text-left transition-all relative cursor-pointer active:scale-95 ${
              theme === 'system'
                ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 shadow-sm'
                : 'border-slate-200/80 dark:border-[#1F304B] bg-slate-50/50 dark:bg-[#1A283E]/50 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 flex items-center justify-center">
                <Monitor className="w-5 h-5" />
              </div>
              {theme === 'system' && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              )}
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">System Sync</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Adapts automatically based on your device or browser settings.
            </p>
          </button>
        </div>

        {/* Mobile View Preview for PC Testing */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#1F304B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 mt-0.5">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>Preview Mobile Phone Layout on PC</span>
                {previewMobileOnPc && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    Preview Active
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Simulates the smartphone bottom navigation and touch cards on this PC screen. (Real phones switch automatically).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPreviewMobileOnPc(!previewMobileOnPc)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              previewMobileOnPc ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            role="switch"
            aria-checked={previewMobileOnPc}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                previewMobileOnPc ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Profile & Preferences */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card space-y-5 transition-colors">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-[#1F304B]">
          <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">User Profile & Currency</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400">Configure your display name and default currency symbol.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={preferences.userName}
              onChange={(e) => updatePreferences({ userName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-sm font-semibold text-slate-800 dark:text-white bg-white dark:bg-[#1A283E] focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Currency
            </label>
            <select
              value={preferences.currency}
              onChange={(e) => {
                const found = CURRENCIES.find((c) => c.code === e.target.value);
                if (found) {
                  updatePreferences({ currency: found.code, currencySymbol: found.symbol });
                }
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-sm font-semibold text-slate-800 dark:text-white bg-white dark:bg-[#1A283E] focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Zero-Cost & Static Hosting Guarantee */}
      <div className="bg-gradient-to-br from-[#0c283f] via-[#093a5c] to-[#061e31] rounded-3xl p-6 text-white shadow-card space-y-3.5 border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md p-1 border border-white/20 flex items-center justify-center">
              <img src={logoImg} alt="BudgetFlow" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                100% Private, Client-Side & GitHub Pages Ready
              </h3>
              <p className="text-[11px] text-cyan-200">Local-First Architecture • Offline Ready</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/JayM3/budgetflow"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-cyan-200 hover:text-white text-xs font-semibold border border-white/20 transition-all"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-semibold border border-cyan-300/30">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>Zero-Telemetry</span>
            </span>
          </div>
        </div>
        <p className="text-xs text-cyan-100/80 leading-relaxed relative z-10">
          BudgetFlow has <strong className="text-white">zero servers</strong>, uses <strong className="text-white">zero external paid AI APIs</strong>, and costs <strong className="text-white">$0.00</strong> to run indefinitely. All transaction logs, merchant categorization rules, and safe-to-spend velocity calculations occur purely inside your browser.
        </p>
      </div>

      {/* 4. Data Backup, Export & Import */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card space-y-5 transition-colors">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-[#1F304B]">
          <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Data Backup & Restore</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400">Download a full JSON copy of your budget data or import an existing backup.</p>
          </div>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={exportDataJson}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Full JSON Backup</span>
          </button>

          <label className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-[#1A283E] active:scale-95 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer flex items-center gap-2 transition-all">
            <Upload className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Restore From JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleJsonUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 4. Software & System Updates (Admin Only) */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card space-y-5 transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1F304B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
              <ArrowUpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Software & System Updates</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400">
                Check for official releases, inspect changelog, and self-update the server daemon.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#1A283E] text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-[#1F304B]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>v{updateInfo?.currentVersion || '1.0.2.2'}</span>
            </span>
          </div>
        </div>

        {/* Update Status Banner / Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50/30 dark:from-[#1A283E]/70 dark:to-[#131F33] border border-slate-200/80 dark:border-[#1F304B] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Update Status</h4>
                {updateInfo?.updateAvailable ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    Update Available
                  </span>
                ) : updateInfo ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Up to Date
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {updateInfo?.updateAvailable
                  ? `A newer version (${updateInfo.latestVersion}) is ready to download.`
                  : updateInfo
                  ? `You are running the latest official version (v${updateInfo.currentVersion}).`
                  : 'Check GitHub releases for the latest enhancements, features, and fixes.'}
              </p>
              {lastCheckedTime && (
                <span className="text-[11px] text-slate-400 block mt-1">
                  Last checked today at {lastCheckedTime}
                </span>
              )}
            </div>

            {/* Check Button */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCheckForUpdates}
                disabled={isCheckingUpdate}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-75 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin text-teal-400' : ''}`} />
                <span>{isCheckingUpdate ? 'Checking GitHub...' : 'Check for Updates'}</span>
              </button>

              {updateInfo?.updateAvailable && (
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 text-white text-xs font-bold shadow-md shadow-cyan-600/25 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Update to {updateInfo.latestVersion}</span>
                </button>
              )}

              {updateInfo && !updateInfo.updateAvailable && (
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] hover:border-cyan-300 hover:bg-cyan-50/50 dark:hover:bg-[#1A283E] text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all active:scale-95"
                  title="Reinstall dependencies and rebuild production bundle"
                >
                  Force Reinstall / Rebuild
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Informational tip */}
        <div className="text-[11px] text-slate-400 leading-relaxed">
          Self-updates automatically create a timestamped database snapshot in{' '}
          <code className="bg-slate-100 dark:bg-[#1A283E] px-1 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">server/data/backups/</code>,
          synchronizing all files, refreshing dependencies, rebuilding the frontend, and safely restarting the background daemon.
        </div>
      </div>

      {/* 5. Family Hub & Tablet Kiosk */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card space-y-5 transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1F304B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Family Hub & Tablet Kiosk</h3>
              <p className="text-xs text-slate-400">Configure household users, wallet permissions, and always-on tablet display.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A283E]/60 border border-slate-200/70 dark:border-[#1F304B] flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1">Family Members & Roles</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Create Member or Admin users, assign allowed wallets, and configure 9-dot patterns.
              </p>
            </div>
            <button
              onClick={() => setActiveView('family')}
              className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all text-center"
            >
              Open Family Manager →
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col justify-between border border-transparent dark:border-teal-500/20">
            <div>
              <h4 className="font-bold text-sm text-teal-300 mb-1">Perpetual Tablet Mode</h4>
              <p className="text-xs text-slate-300 mb-3">
                Full-screen ambient kitchen kiosk with rapid 9-dot pattern check for logging expenses.
              </p>
            </div>
            <button
              onClick={() => setIsTabletMode(true)}
              className="w-full py-2 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all text-center"
            >
              Launch Tablet Mode 📱
            </button>
          </div>
        </div>

        {/* Tablet Auto-Refresh Configuration */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-[#1A283E]/70 dark:to-[#131F33] border border-slate-200/80 dark:border-[#1F304B] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-100/70 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 mt-0.5">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <span>Tablet Kiosk Auto-Refresh</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      preferences.tabletAutoRefreshEnabled !== false
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {preferences.tabletAutoRefreshEnabled !== false ? 'Active' : 'Disabled'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automatically reloads the wall tablet display at regular intervals to sync changes and keep browser memory fresh.
                </p>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const nextVal = !(preferences.tabletAutoRefreshEnabled ?? true);
                updatePreferences({ tabletAutoRefreshEnabled: nextVal });
              }}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                preferences.tabletAutoRefreshEnabled !== false ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={preferences.tabletAutoRefreshEnabled !== false}
              title={
                preferences.tabletAutoRefreshEnabled !== false
                  ? 'Disable Tablet Auto-Refresh'
                  : 'Enable Tablet Auto-Refresh'
              }
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  preferences.tabletAutoRefreshEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Interval Configuration (visible when enabled) */}
          {preferences.tabletAutoRefreshEnabled !== false && (
            <div className="pt-3 border-t border-slate-200/60 dark:border-[#1F304B] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Refresh Interval</span>
                </label>
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  Every {preferences.tabletRefreshIntervalMinutes ?? 5} minute
                  {(preferences.tabletRefreshIntervalMinutes ?? 5) === 1 ? '' : 's'}
                </span>
              </div>

              {/* Preset Interval Buttons */}
              <div className="flex flex-wrap gap-2">
                {[1, 2, 5, 10, 15, 30, 60].map((mins) => {
                  const isSelected = (preferences.tabletRefreshIntervalMinutes ?? 5) === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => updatePreferences({ tabletRefreshIntervalMinutes: mins })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                          : 'bg-white dark:bg-[#1A283E] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1F304B] hover:border-teal-300 hover:bg-teal-50/50 dark:hover:bg-[#1F304B]'
                      }`}
                    >
                      {mins === 5 ? '5m (Default)' : mins === 60 ? '1 hour' : `${mins}m`}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Note: In Tablet Mode, auto-refresh intelligently defers if someone is currently logging an expense or viewing balances.
              </p>
            </div>
          )}
        </div>

        <div className="p-3.5 bg-cyan-50/70 dark:bg-cyan-950/30 rounded-2xl border border-cyan-100 dark:border-cyan-900/40 text-xs text-cyan-900 dark:text-cyan-200 leading-relaxed">
          <strong>Self-Hosting Tip:</strong> BudgetFlow is lightweight and zero-compilation. To host permanently on a tablet running <strong>Termux</strong> or a home Linux server, run <code className="bg-white/80 dark:bg-[#1A283E] px-1.5 py-0.5 rounded font-mono text-[11px] dark:text-cyan-300">./install.sh</code> and access it via <code className="bg-white/80 dark:bg-[#1A283E] px-1.5 py-0.5 rounded font-mono text-[11px] dark:text-cyan-300">http://&lt;tablet-ip&gt;:5050</code> from any phone or laptop on your Wi-Fi!
        </div>
      </div>

      {/* 5. Demo Data & Reset Controls */}
      <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100 dark:border-[#1F304B] shadow-card space-y-4 transition-colors">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-[#1F304B]">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">State Management & Resets</h3>
            <p className="text-xs text-slate-400">Quickly toggle between the screenshot's pre-loaded demo or start fresh.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          {isGitHubPages() && (
            <button
              onClick={() => {
                resetToDemoData();
                triggerConfetti();
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1A283E] hover:bg-cyan-50 dark:hover:bg-[#1F304B] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 border border-transparent dark:border-[#1F304B]"
            >
              <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Restore Showcase Demo Data (Alex Carter)</span>
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all data to start fresh?')) {
                clearToFreshSlate();
              }
            }}
            className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All & Start Clean Slate</span>
          </button>
        </div>
      </div>

      {/* 6. GitHub Repository & Creator Credits Bar */}
      <div className="bg-[#020b18] border border-cyan-950/80 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs shadow-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="text-cyan-500 font-bold select-none">•</span>
          <a
            href="https://github.com/JayM3/budgetflow"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium transition-colors group"
          >
            <Github className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Source Code</span>
          </a>
          <span className="text-cyan-500 font-bold select-none">•</span>
          <a
            href="https://github.com/JayM3/budgetflow/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            Report an Issue
          </a>
        </div>
        <div className="text-slate-400 text-xs font-medium flex items-center gap-1">
          <span>By</span>
          <a
            href="https://github.com/JayM3"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-white hover:text-cyan-300 transition-colors"
          >
            JayM3
          </a>
        </div>
      </div>

      {/* Software Self-Update Modal */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateInfo={updateInfo}
        onCheckAgain={handleCheckForUpdates}
      />
    </div>
  );
};

