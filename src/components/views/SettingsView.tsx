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
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { useFinance } from '../../context/FinanceContext';

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
  } = useFinance();

  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 1. Profile & Preferences */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">User Profile & Currency</h3>
            <p className="text-xs text-slate-400">Configure your display name and default currency symbol.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={preferences.userName}
              onChange={(e) => updatePreferences({ userName: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
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

      {/* 2. Zero-Cost & Static Hosting Guarantee */}
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
          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-semibold border border-cyan-300/30">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>Zero-Telemetry</span>
          </span>
        </div>
        <p className="text-xs text-cyan-100/80 leading-relaxed relative z-10">
          BudgetFlow has <strong className="text-white">zero servers</strong>, uses <strong className="text-white">zero external paid AI APIs</strong>, and costs <strong className="text-white">$0.00</strong> to run indefinitely. All transaction logs, merchant categorization rules, and safe-to-spend velocity calculations occur purely inside your browser.
        </p>
      </div>

      {/* 3. Data Backup, Export & Import */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Data Backup & Restore</h3>
            <p className="text-xs text-slate-400">Download a full JSON copy of your budget data or import an existing backup.</p>
          </div>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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

          <label className="px-5 py-2.5 rounded-xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 active:scale-95 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-2 transition-all">
            <Upload className="w-4 h-4 text-cyan-600" />
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

      {/* 4. Family Hub & Tablet Kiosk */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Family Hub & Tablet Kiosk</h3>
              <p className="text-xs text-slate-400">Configure household users, wallet permissions, and always-on tablet display.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">Family Members & Roles</h4>
              <p className="text-xs text-slate-500 mb-3">
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

          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col justify-between">
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

        <div className="p-3.5 bg-cyan-50/70 rounded-2xl border border-cyan-100 text-xs text-cyan-900 leading-relaxed">
          <strong>Self-Hosting Tip:</strong> BudgetFlow is lightweight and zero-compilation. To host permanently on a tablet running <strong>Termux</strong> or a home Linux server, run <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-[11px]">./install.sh</code> and access it via <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-[11px]">http://&lt;tablet-ip&gt;:5050</code> from any phone or laptop on your Wi-Fi!
        </div>
      </div>

      {/* 5. Demo Data & Reset Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">State Management & Resets</h3>
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
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>Restore Showcase Demo Data (Alex Carter)</span>
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all data to start fresh?')) {
                clearToFreshSlate();
              }
            }}
            className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All & Start Clean Slate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
