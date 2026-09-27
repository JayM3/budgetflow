import React from 'react';
import { Wallet as WalletIcon, CreditCard, Landmark, Coins, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { GuideButton } from '../guide/GuideButton';

const getWalletIcon = (type: string) => {
  switch (type) {
    case 'checking':
      return <Landmark className="w-5 h-5" />;
    case 'savings':
      return <WalletIcon className="w-5 h-5" />;
    case 'credit':
      return <CreditCard className="w-5 h-5" />;
    default:
      return <Coins className="w-5 h-5" />;
  }
};

export const WalletsView: React.FC = () => {
  const { wallets, preferences, creditUtilizationPercent, setIsGuideOpenWithId } = useFinance();

  const totalAssets = wallets
    .filter((w) => w.type !== 'credit')
    .reduce((sum, w) => sum + w.balance, 0);

  const totalLiabilities = wallets
    .filter((w) => w.type === 'credit')
    .reduce((sum, w) => sum + w.balance, 0);

  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="space-y-6">
      {/* Top Net Worth Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Net Worth
            </span>
            <GuideButton
              guideId="family-wallets"
              onOpenGuide={(id) => setIsGuideOpenWithId(id)}
            />
          </div>
          <span className="text-3xl font-black text-slate-900 mt-1 block">
            {formatCurrency(netWorth, preferences.currencySymbol)}
          </span>
          <span className="text-xs text-cyan-700 font-semibold">Across your permitted family accounts</span>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Liquid Assets</span>
            <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
              {formatCurrency(totalAssets, preferences.currencySymbol)}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <span className="text-xs text-slate-400 block font-medium">Credit Balances</span>
            <span className="text-lg font-bold text-rose-500 mt-0.5 block">
              {formatCurrency(totalLiabilities, preferences.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Credit Utilization Alert Card */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
          creditUtilizationPercent < 30
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/60 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {creditUtilizationPercent < 30 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div>
            <h4 className="text-xs font-bold">
              Total Credit Utilization: {creditUtilizationPercent}%
            </h4>
            <p className="text-xs opacity-80">
              {creditUtilizationPercent < 30
                ? 'Your credit usage is well below the 30% threshold. Ideal for protecting your score.'
                : 'Your utilization is above 30%. Paying down before statement closing will boost your credit rating.'}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-white shadow-sm shrink-0">
          Target: &lt;30%
        </span>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {wallets.map((w) => {
          const isCredit = w.type === 'credit';
          const utilPct = isCredit && w.limit ? Math.round((w.balance / w.limit) * 100) : 0;

          return (
            <div
              key={w.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
                    style={{ backgroundColor: w.color }}
                  >
                    {getWalletIcon(w.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{w.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {w.type}
                    </span>
                  </div>
                </div>

                <span className="text-lg font-black text-slate-900">
                  {formatCurrency(w.balance, preferences.currencySymbol)}
                </span>
              </div>

              {isCredit && w.limit && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Credit Limit: {formatCurrency(w.limit, preferences.currencySymbol)}</span>
                    <span className="font-bold text-slate-700">{utilPct}% used</span>
                  </div>
                  <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        utilPct > 30 ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${utilPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
