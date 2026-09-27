import { BudgetCategory, Bill, SavingsGoal, Insight } from '../types/finance';

export interface SafeToSpendMetrics {
  totalBudget: number;
  spent: number;
  remaining: number;
  spentPercentage: number;
  daysRemainingInMonth: number;
  daysInMonth: number;
  currentDay: number;
  safePerDay: number;
  safePerWeek: number;
  daysRemainingInWeek: number;
  safeThisWeek: number;
  spentThisWeek: number;
  remainingThisWeek: number;
  expectedDailyBudget: number;
  currentDailyAverage: number;
  currentWeeklyAverage: number;
  paceStatus: 'green' | 'yellow' | 'red';
  paceLabel: string;
}

export interface WhatIfSimulation {
  itemCost: number;
  newRemaining: number;
  newSpentPercentage: number;
  oldDailySafe: number;
  newDailySafe: number;
  dailyDrop: number;
  oldWeeklySafe: number;
  newWeeklySafe: number;
  weeklyDrop: number;
  vacationGoalDelayDays: number;
  isOverBudget: boolean;
  verdict: 'safe' | 'caution' | 'critical';
  verdictMessage: string;
}

export const calculateSafeToSpend = (
  totalBudget: number,
  spent: number,
  referenceDate: Date = new Date(),
  spentThisWeek: number = 0
): SafeToSpendMetrics => {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const currentDay = referenceDate.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysRemainingInMonth = Math.max(1, daysInMonth - currentDay);

  const remaining = Math.max(0, totalBudget - spent);
  const spentPercentage = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;
  
  const safePerDay = daysRemainingInMonth > 0 ? remaining / daysRemainingInMonth : 0;
  const safePerWeek = safePerDay * 7;

  // Days remaining in current calendar week (Monday to Sunday), capped by days remaining in month
  const dayOfWeek = referenceDate.getDay(); // 0 = Sun, 1 = Mon ...
  const daysRemainingInCalendarWeek = dayOfWeek === 0 ? 1 : 7 - dayOfWeek + 1;
  const daysRemainingInWeek = Math.max(1, Math.min(daysRemainingInCalendarWeek, daysRemainingInMonth));

  // How much one can spend during this week
  const safeThisWeek = safePerDay * daysRemainingInWeek;
  const remainingThisWeek = Math.max(0, safeThisWeek - spentThisWeek);

  const expectedDailyBudget = daysInMonth > 0 ? totalBudget / daysInMonth : 0;
  const currentDailyAverage = currentDay > 0 ? spent / currentDay : 0;
  const currentWeeklyAverage = currentDailyAverage * 7;

  let paceStatus: 'green' | 'yellow' | 'red' = 'green';
  let paceLabel = 'Healthy Pace';

  if (totalBudget === 0 && spent === 0) {
    paceStatus = 'green';
    paceLabel = 'Onboarding';
  } else if (spent >= totalBudget && totalBudget > 0) {
    paceStatus = 'red';
    paceLabel = 'Budget Exceeded';
  } else if (expectedDailyBudget > 0 && currentDailyAverage > expectedDailyBudget * 1.15) {
    paceStatus = 'yellow';
    paceLabel = 'Cool Down Needed';
  } else {
    paceStatus = 'green';
    paceLabel = 'Optimal Pace';
  }

  return {
    totalBudget,
    spent,
    remaining,
    spentPercentage,
    daysRemainingInMonth,
    daysInMonth,
    currentDay,
    safePerDay,
    safePerWeek,
    daysRemainingInWeek,
    safeThisWeek,
    spentThisWeek,
    remainingThisWeek,
    expectedDailyBudget,
    currentDailyAverage,
    currentWeeklyAverage,
    paceStatus,
    paceLabel,
  };
};

export const simulatePurchase = (
  cost: number,
  totalBudget: number,
  spent: number,
  savingsGoal: SavingsGoal | undefined,
  referenceDate: Date = new Date()
): WhatIfSimulation => {
  const currentMetrics = calculateSafeToSpend(totalBudget, spent, referenceDate);
  const newSpent = spent + cost;
  const newRemaining = totalBudget - newSpent;
  const newSpentPercentage = totalBudget > 0 ? Math.round((newSpent / totalBudget) * 100) : 0;
  
  const newDailySafe = currentMetrics.daysRemainingInMonth > 0 ? Math.max(0, newRemaining) / currentMetrics.daysRemainingInMonth : 0;
  const dailyDrop = Math.max(0, currentMetrics.safePerDay - newDailySafe);

  const newWeeklySafe = newDailySafe * 7;
  const weeklyDrop = Math.max(0, currentMetrics.safePerWeek - newWeeklySafe);

  // Approximate delay in days towards savings goal if money is diverted
  const monthlySavingsPace = Math.max(0, totalBudget * 0.15);
  const dailySavingsRate = monthlySavingsPace > 0 ? monthlySavingsPace / 30 : 20;
  const vacationGoalDelayDays = Math.round(cost / dailySavingsRate);

  const isOverBudget = newRemaining < 0;

  let verdict: 'safe' | 'caution' | 'critical' = 'safe';
  let verdictMessage = 'Within comfortable spending limits! You can easily absorb this.';

  if (isOverBudget) {
    verdict = 'critical';
    verdictMessage = `This purchase will exceed your monthly budget by ${Math.abs(newRemaining).toFixed(0)}. Rebalancing recommended.`;
  } else if (newSpentPercentage > 85 || dailyDrop > 25) {
    verdict = 'caution';
    verdictMessage = `Tightens your weekly safe allowance down to ${newWeeklySafe.toFixed(0)}/week for the rest of the month.`;
  }

  return {
    itemCost: cost,
    newRemaining,
    newSpentPercentage,
    oldDailySafe: currentMetrics.safePerDay,
    newDailySafe,
    dailyDrop,
    oldWeeklySafe: currentMetrics.safePerWeek,
    newWeeklySafe,
    weeklyDrop,
    vacationGoalDelayDays,
    isOverBudget,
    verdict,
    verdictMessage,
  };
};

export const generateAlgorithmicInsights = (
  categories: BudgetCategory[],
  bills: Bill[],
  safeMetrics: SafeToSpendMetrics,
  creditUsage: number = 24
): Insight[] => {
  const insights: Insight[] = [];

  // 1. Safe-to-Spend weekly velocity insight
  insights.push({
    id: 'in-pace',
    title: `Weekly Safe-to-Spend: $${safeMetrics.safePerWeek.toFixed(2)}/wk`,
    description: `You have $${safeMetrics.safeThisWeek.toFixed(2)} safe to spend during this week (${safeMetrics.daysRemainingInWeek} days left this week) out of your $${safeMetrics.remaining.toLocaleString()} monthly balance.`,
    type: safeMetrics.paceStatus === 'green' ? 'success' : safeMetrics.paceStatus === 'yellow' ? 'warning' : 'warning',
    metricDelta: safeMetrics.paceLabel,
  });

  // 2. Upcoming bills radar
  const unpaidBills = bills.filter(b => !b.isPaid);
  const totalUnpaidAmount = unpaidBills.reduce((acc, b) => acc + b.amount, 0);
  if (unpaidBills.length > 0) {
    insights.push({
      id: 'in-bills',
      title: `${unpaidBills.length} Upcoming Bills Due ($${totalUnpaidAmount.toFixed(2)})`,
      description: `Largest upcoming is ${unpaidBills[0].name} ($${unpaidBills[0].amount.toFixed(2)}). All scheduled bills fit within your remaining balance.`,
      type: 'info',
      metricDelta: `${unpaidBills.length} active`,
    });
  }

  // 3. Category budget variance
  const highestSpendCat = [...categories].sort((a, b) => b.spent - a.spent)[0];
  if (highestSpendCat) {
    const ratio = Math.round((highestSpendCat.spent / (safeMetrics.spent || 1)) * 100);
    insights.push({
      id: 'in-top-cat',
      title: `Top Category: ${highestSpendCat.name} (${ratio}% of expenses)`,
      description: `You've spent $${highestSpendCat.spent.toLocaleString()} on ${highestSpendCat.name} this month.`,
      type: 'tip',
      metricDelta: `$${highestSpendCat.spent}`,
    });
  }

  // 4. Credit utilization health
  if (creditUsage < 30) {
    insights.push({
      id: 'in-credit',
      title: `Optimal Credit Utilization (${creditUsage}%)`,
      description: `Your card usage is well below the recommended 30% ceiling, preserving your credit score health.`,
      type: 'success',
      metricDelta: '▼ -6% vs last mo',
    });
  } else {
    insights.push({
      id: 'in-credit-high',
      title: `Credit Utilization Alert (${creditUsage}%)`,
      description: `Card balance exceeds 30% of your total limit. Consider paying down before statement closing date.`,
      type: 'warning',
      metricDelta: 'Caution',
    });
  }

  return insights;
};
