import React, { useState } from 'react';
import { Sparkles, Shield, User, Wallet, ArrowRight, Check } from 'lucide-react';
import { PatternLock } from './PatternLock';
import { FamilyUser, Wallet as WalletType } from '../../types/finance';

interface InitialSetupModalProps {
  isOpen: boolean;
  onCompleteSetup: (data: {
    householdName: string;
    currency: string;
    currencySymbol: string;
    adminUser: FamilyUser;
    initialWallets: WalletType[];
  }) => void;
}

const CURRENCIES = [
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone (kr / NOK)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
];

const AVATAR_OPTIONS = ['👑', '🦁', '🦉', '🦊', '🐼', '🚀', '🌱', '☀️', '⭐', '💎'];
const COLOR_OPTIONS = ['#0d9488', '#0284c7', '#6366f1', '#8b5cf6', '#ec4899', '#f97316'];

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({
  isOpen,
  onCompleteSetup,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Household Details
  const [householdName, setHouseholdName] = useState('Our Family Hub');
  const [currencyCode, setCurrencyCode] = useState('NOK');

  // Step 2: Admin Profile
  const [adminName, setAdminName] = useState('Admin');
  const [selectedAvatar, setSelectedAvatar] = useState('👑');
  const [selectedColor, setSelectedColor] = useState('#0d9488');

  // Step 3: Admin Pattern
  const [adminPattern, setAdminPattern] = useState<number[]>([]);

  // Step 4: Initial Wallets
  const [wallets, setWallets] = useState([
    { name: 'Family Checking', type: 'checking' as const, balance: 0, color: '#0d9488' },
    { name: 'Emergency Savings', type: 'savings' as const, balance: 0, color: '#0284c7' },
    { name: 'Cash Wallet', type: 'cash' as const, balance: 0, color: '#10b981' },
  ]);

  if (!isOpen) return null;

  const currentCurrency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  const handleFinishSetup = () => {
    const adminUser: FamilyUser = {
      id: 'admin_' + Date.now(),
      name: adminName.trim() || 'Admin',
      role: 'admin',
      avatar: selectedAvatar,
      color: selectedColor,
      patternSequence: adminPattern.length > 0 ? adminPattern : [0, 1, 2, 4], // default if skipped
      allowedWalletIds: [], // Empty for admin means all wallets
      permissions: {
        canAddBills: true,
        canAddGoals: true,
        canEditBudgets: true,
        canViewHouseholdReports: true,
      },
    };

    const initialWalletObjects: WalletType[] = wallets.map((w, idx) => ({
      id: `wallet_${idx + 1}`,
      name: w.name,
      type: w.type,
      balance: Number(w.balance) || 0,
      color: w.color,
      isShared: true,
    }));

    onCompleteSetup({
      householdName: householdName.trim() || 'Our Family Hub',
      currency: currentCurrency.code,
      currencySymbol: currentCurrency.symbol,
      adminUser,
      initialWallets: initialWalletObjects,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-8 shadow-2xl border border-slate-100 relative my-auto max-h-[92dvh] sm:max-h-[88vh] flex flex-col transform-gpu"
        style={{ transform: 'translateZ(0)' }}
      >

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-8 bg-teal-500'
                    : s < step
                    ? 'w-4 bg-teal-300'
                    : 'w-4 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Step {step} of 4
          </span>
        </div>

        {/* Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain pr-1 -mr-1">
          {/* STEP 1: Household Name & Currency */}
          {step === 1 && (
            <div className="space-y-6 relative z-10">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Welcome to BudgetFlow Hub
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Let's set up your private, self-hosted household finance system.
              </p>
              <div className="mt-2.5 p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-xl text-[11px] text-amber-800 text-left">
                <strong>First-time Installation:</strong> This wizard creates your master household and admin profile. If your family already has a Hub running, connect to that Hub's Wi-Fi / IP address to log into your existing profile.
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Household or Hub Name
                </label>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="e.g. Carter Family Hub"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Primary Currency
                </label>
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 font-medium bg-white"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98"
            >
              <span>Next: Setup Admin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Admin Profile */}
        {step === 2 && (
          <div className="space-y-6 relative z-10">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 shadow-inner">
                <User className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Create Admin Account
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Admins manage family members, wallet permissions, and budgets.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Admin Name
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Alex (Dad)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Choose Avatar Icon
                </label>
                <div className="flex flex-wrap gap-2 justify-center py-1">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedAvatar(emoji)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                        selectedAvatar === emoji
                          ? 'bg-teal-500 text-white scale-110 shadow-md shadow-teal-500/20 ring-2 ring-teal-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Accent Color
                </label>
                <div className="flex gap-3 justify-center">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-teal-500' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98"
              >
                <span>Next: 9-Dot Pattern</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 9-Dot Pattern Setup */}
        {step === 3 && (
          <div className="space-y-4 relative z-10">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Set Admin 9-Dot Pattern
              </h2>
              <p className="text-xs text-slate-500">
                Draw a pattern connecting at least 4 dots. You will use this to sign in and confirm changes.
              </p>
            </div>

            <PatternLock
              mode="create"
              size={typeof window !== 'undefined' && (window.innerWidth < 640 || window.innerHeight < 750) ? 210 : 250}
              minPoints={4}
              onPatternCreated={(pattern) => {
                setAdminPattern(pattern);
              }}
              onComplete={() => {
                setStep(4);
              }}
            />

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                Back to Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  if (adminPattern.length === 0) {
                    setAdminPattern([0, 1, 2, 4]); // fallback default
                  }
                  setStep(4);
                }}
                className="text-xs text-teal-600 font-semibold hover:underline"
              >
                Skip Pattern for Now →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Initial Wallets */}
        {step === 4 && (
          <div className="space-y-5 relative z-10">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 shadow-inner">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Initial Household Wallets
              </h2>
              <p className="text-xs text-slate-500">
                Your installation starts clean with $0. Name your primary household accounts.
              </p>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {wallets.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/70"
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: w.color }}
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={w.name}
                      onChange={(e) => {
                        const updated = [...wallets];
                        updated[i].name = e.target.value;
                        setWallets(updated);
                      }}
                      className="w-full text-xs font-semibold bg-transparent border-none focus:outline-none text-slate-800"
                    />
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {w.type} account
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-600">
                      {currentCurrency.symbol}0.00
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-teal-50 rounded-2xl border border-teal-100 flex items-start space-x-2.5">
              <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-teal-800 leading-relaxed">
                You can add more family members, invite teens with restricted wallet access, and connect your bank statements anytime from Settings.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-1/3 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinishSetup}
                className="w-2/3 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transition-all active:scale-98 text-sm"
              >
                <span>Launch BudgetFlow Hub</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
