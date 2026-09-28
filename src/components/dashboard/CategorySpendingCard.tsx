import React, { useMemo } from 'react';
import { ShoppingBag, Home, Car, Gamepad2, Zap, Utensils, HeartPulse } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  Home,
  Car,
  Gamepad2,
  Zap,
  Utensils,
  HeartPulse,
};

export const CategorySpendingCard: React.FC = () => {
  const { categories, transactions, preferences, setActiveView, currentUser } = useFinance();

  const isMember = currentUser?.role === 'member';

  // Compute spending dynamically from transactions (scoped to member's wallets)
  const displayCategories = useMemo(() => {
    return categories.map((cat) => {
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.category.toLowerCase() === cat.name.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...cat,
        spent: Math.round(spent),
      };
    }).slice(0, 5);
  }, [categories, transactions]);

  const maxAmount = Math.max(...displayCategories.map(c => Math.max(c.spent, c.allocated)), 1);

  return (
    <div className="bg-white dark:bg-[#131F33] rounded-3xl p-6 border border-slate-100/80 dark:border-[#1F304B] shadow-card flex flex-col justify-between transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
          Spending by Category
        </h2>
        <button
          onClick={() => setActiveView(isMember ? 'transactions' : 'budgets')}
          className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
        >
          View all
        </button>
      </div>

      {/* Bar Chart Grid */}
      <div className="grid grid-cols-5 gap-3 pt-6 pb-2 items-end min-h-[220px]">
        {displayCategories.map((cat) => {
          const Icon = iconMap[cat.icon] || ShoppingBag;
          const heightPercent = cat.spent > 0 ? Math.max(8, Math.round((cat.spent / maxAmount) * 100)) : 0;

          return (
            <div key={cat.id} className="flex flex-col items-center group cursor-pointer">
              {/* Amount Label on top */}
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 transition-transform group-hover:-translate-y-1">
                {formatCurrency(cat.spent, preferences.currencySymbol)}
              </span>

              {/* Bar Pillar */}
              <div className="w-full max-w-[48px] h-32 bg-slate-100/70 dark:bg-[#1A283E] rounded-2xl p-1 flex items-end relative overflow-hidden">
                <div
                  className="w-full rounded-xl transition-all duration-700 ease-out shadow-sm group-hover:brightness-105"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>

              {/* Category Icon */}
              <div
                className="mt-3.5 w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${cat.color}20`,
                  color: cat.color,
                }}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Category Name */}
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 text-center truncate max-w-[64px]">
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
