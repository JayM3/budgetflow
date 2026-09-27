const DEFAULT_MERCHANT_MAP: Record<string, string> = {
  'whole foods': 'Groceries',
  'trader joe': 'Groceries',
  'trader joes': 'Groceries',
  'safeway': 'Groceries',
  'kroger': 'Groceries',
  'walmart': 'Groceries',
  'costco': 'Groceries',
  'target': 'Groceries',
  'aldi': 'Groceries',
  
  'spotify': 'Entertainment',
  'netflix': 'Entertainment',
  'hulu': 'Entertainment',
  'disney': 'Entertainment',
  'steam': 'Entertainment',
  'playstation': 'Entertainment',
  'nintendo': 'Entertainment',
  'cinema': 'Entertainment',
  'amc': 'Entertainment',

  'uber': 'Transport',
  'lyft': 'Transport',
  'shell': 'Transport',
  'chevron': 'Transport',
  'bp': 'Transport',
  'exxon': 'Transport',
  'subway metro': 'Transport',
  'gas': 'Transport',
  'parking': 'Transport',

  'city power': 'Utilities',
  'electric': 'Utilities',
  'power': 'Utilities',
  'water': 'Utilities',
  'gas & electric': 'Utilities',
  'internet': 'Utilities',
  'at&t': 'Utilities',
  'verizon': 'Utilities',
  't-mobile': 'Utilities',
  'comcast': 'Utilities',

  'starbucks': 'Dining Out',
  'dunkin': 'Dining Out',
  'mcdonalds': 'Dining Out',
  'chipotle': 'Dining Out',
  'subway': 'Dining Out',
  'restaurant': 'Dining Out',
  'cafe': 'Dining Out',
  'coffee': 'Dining Out',

  'rent': 'Rent',
  'landlord': 'Rent',
  'metro properties': 'Rent',
  'apartment': 'Rent',
  'mortgage': 'Rent',

  'salary': 'Income',
  'payroll': 'Income',
  'deposit': 'Income',
  'freelance': 'Income',
  'bonus': 'Income',
  'dividend': 'Income',
};

const STORAGE_KEY = 'budgetflow_learned_merchants';

export const getLearnedMerchants = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const saveLearnedMerchant = (merchant: string, category: string): void => {
  try {
    const current = getLearnedMerchants();
    const cleanMerchant = merchant.trim().toLowerCase();
    current[cleanMerchant] = category;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save learned merchant rule to localStorage', e);
  }
};

export const lookupMerchantCategory = (merchantName: string): string | null => {
  if (!merchantName) return null;
  const clean = merchantName.trim().toLowerCase();

  // 1. Check user-learned mappings first
  const learned = getLearnedMerchants();
  if (learned[clean]) return learned[clean];

  // 2. Exact match in default map
  if (DEFAULT_MERCHANT_MAP[clean]) return DEFAULT_MERCHANT_MAP[clean];

  // 3. Substring match
  for (const [key, category] of Object.entries(DEFAULT_MERCHANT_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return category;
    }
  }

  return null;
};
