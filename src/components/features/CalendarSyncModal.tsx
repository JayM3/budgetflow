import React, { useState } from 'react';
import {
  Calendar,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  Smartphone,
  Laptop,
  CheckCircle2,
  CalendarDays,
  BellRing,
  Info,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  downloadIcsFile,
  getLiveCalendarSubscriptionUrl,
} from '../../utils/calendarSync';

export const CalendarSyncModal: React.FC = () => {
  const {
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    bills,
    goals,
    householdSettings,
    preferences,
    serverStatus,
  } = useFinance();

  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'apple' | 'google' | 'outlook'>('apple');

  if (!isCalendarModalOpen) return null;

  const subscriptionUrl = getLiveCalendarSubscriptionUrl(serverStatus?.lanIp);
  const webcalUrl = subscriptionUrl.replace(/^http:\/\//, 'webcal://').replace(/^https:\/\//, 'webcal://');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    downloadIcsFile(
      bills,
      goals,
      householdSettings.householdName || 'BudgetFlow',
      preferences.currencySymbol
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Device Calendar Sync
              </h3>
              <p className="text-xs text-slate-500">
                Sync bills, income paydays, and goal dates with your phone or PC
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCalendarModalOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-5 space-y-6 pr-1">
          {/* Live Subscription Option */}
          <div className="bg-cyan-50/70 border border-cyan-200/80 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-xs font-bold text-cyan-950 uppercase tracking-wider">
                  Live iCalendar Subscription (Auto-Updating)
                </h4>
              </div>
              <span className="text-[10px] font-bold bg-white text-cyan-800 px-2 py-0.5 rounded-full border border-cyan-200">
                RFC 5545 Feed
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Subscribe once in Apple Calendar, Google Calendar, or Outlook. Any bill or recurring income changes in BudgetFlow will automatically sync to your device.
            </p>

            {/* URL Box */}
            <div className="flex items-center gap-2 bg-white rounded-xl border border-cyan-200 p-1.5 pl-3">
              <input
                type="text"
                readOnly
                value={subscriptionUrl}
                className="w-full text-xs font-mono text-slate-700 bg-transparent focus:outline-none select-all"
              />
              <button
                onClick={() => handleCopy(subscriptionUrl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick One-Click Download Option */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                Offline Snapshot (.ics file)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Download a static .ics file to open directly in any desktop or mobile calendar app.
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:border-cyan-500 hover:text-cyan-700 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-cyan-600" />
              <span>Download .ics</span>
            </button>
          </div>

          {/* Platform Instructions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Setup Guides By Platform
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActivePlatform('apple')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    activePlatform === 'apple'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Apple (iOS/Mac)
                </button>
                <button
                  onClick={() => setActivePlatform('google')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    activePlatform === 'google'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Google Calendar
                </button>
                <button
                  onClick={() => setActivePlatform('outlook')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    activePlatform === 'outlook'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Outlook / Windows
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
              {activePlatform === 'apple' && (
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>
                    On iPhone or iPad, open <strong className="text-slate-900">Settings</strong> &gt; <strong className="text-slate-900">Calendar</strong> &gt; <strong className="text-slate-900">Accounts</strong>.
                  </li>
                  <li>Tap <strong className="text-slate-900">Add Account</strong> &gt; <strong className="text-slate-900">Other</strong> &gt; <strong className="text-slate-900">Add Subscribed Calendar</strong>.</li>
                  <li>Paste the copied subscription link above and tap <strong className="text-slate-900">Next</strong>.</li>
                  <li>On Mac, simply open Calendar &gt; <strong className="text-slate-900">File</strong> &gt; <strong className="text-slate-900">New Calendar Subscription...</strong> and paste the link.</li>
                </ol>
              )}

              {activePlatform === 'google' && (
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Open <strong className="text-slate-900">Google Calendar</strong> in your web browser.</li>
                  <li>Next to "Other calendars" on the left sidebar, click <strong className="text-slate-900">+</strong> &gt; <strong className="text-slate-900">From URL</strong>.</li>
                  <li>Paste the copied subscription link and click <strong className="text-slate-900">Add calendar</strong>.</li>
                  <li>The calendar will now automatically show and sync across the Google Calendar app on all Android and iOS devices.</li>
                </ol>
              )}

              {activePlatform === 'outlook' && (
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Open <strong className="text-slate-900">Outlook Calendar</strong> on Windows or Outlook.com.</li>
                  <li>Click <strong className="text-slate-900">Add calendar</strong> &gt; <strong className="text-slate-900">Subscribe from web</strong>.</li>
                  <li>Paste the copied subscription link, name it "BudgetFlow Finances", and click <strong className="text-slate-900">Import</strong>.</li>
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={() => setIsCalendarModalOpen(false)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
