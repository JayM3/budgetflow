import { lookupMerchantCategory } from './merchantRules';
import { TransactionType } from '../types/finance';

export interface ParsedTransactionInput {
  merchant: string;
  amount: number | null;
  category: string;
  type: TransactionType;
  confidence: number;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Groceries': ['grocery', 'groceries', 'market', 'food', 'supermarket', 'produce', 'meat', 'bakery'],
  'Dining Out': ['dinner', 'lunch', 'breakfast', 'coffee', 'cafe', 'restaurant', 'pizza', 'burger', 'bar', 'drinks', 'snack'],
  'Entertainment': ['movie', 'games', 'game', 'concert', 'steam', 'netflix', 'music', 'cinema', 'theatre', 'fun', 'hobby'],
  'Transport': ['gas', 'fuel', 'petrol', 'parking', 'transit', 'bus', 'train', 'metro', 'taxi', 'ride', 'toll', 'flight'],
  'Utilities': ['bill', 'electric', 'power', 'water', 'internet', 'wifi', 'phone', 'cell', 'sewer', 'trash'],
  'Rent': ['rent', 'lease', 'apartment', 'housing', 'landlord'],
  'Health & Wellness': ['pharmacy', 'medicine', 'gym', 'fitness', 'doctor', 'dental', 'clinic', 'vitamins'],
  'Income': ['salary', 'paycheck', 'deposit', 'income', 'bonus', 'freelance', 'client', 'dividend', 'refund'],
};

export const parseNaturalLanguageTransaction = (input: string): ParsedTransactionInput => {
  const text = input.trim();
  if (!text) {
    return {
      merchant: '',
      amount: null,
      category: 'Groceries',
      type: 'expense',
      confidence: 0,
    };
  }

  // 1. Detect explicit income signs (+ or words like income, salary, deposit)
  let type: TransactionType = 'expense';
  if (text.startsWith('+') || /\b(salary|deposit|paycheck|income|bonus|freelance)\b/i.test(text)) {
    type = 'income';
  }

  // 2. Extract amount: e.g. 150 kr, kr 150, $45, €15.50, 45.50, -15, +4200
  let amount: number | null = null;
  // Match currency prefix optionally, digits, optional decimal, and optional currency suffix
  const amountMatch = text.match(/[-+]?(?:[$€£]|kr|nok)?\s*([0-9]+(?:[\.,][0-9]{1,2})?)\s*(?:kr|nok)?/i);
  if (amountMatch && amountMatch[1]) {
    const rawNum = amountMatch[1].replace(',', '.');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  }

  // 3. Remove the amount part from text to get merchant and notes
  let remainingText = text;
  if (amountMatch && amountMatch[0]) {
    remainingText = text.replace(amountMatch[0], '').trim();
  }
  // Strip common leading/trailing symbols or stray currency labels
  remainingText = remainingText.replace(/^[-+:\s]+/, '').replace(/[-+:\s]+$/, '').replace(/\b(kr|nok)\b/gi, '').trim();

  // 4. Extract Category from remaining keywords or merchant lookup
  let detectedCategory = type === 'income' ? 'Income' : 'Groceries';
  let merchant = remainingText || 'Quick Expense';

  // Check merchant lookup table
  const mappedCategory = lookupMerchantCategory(merchant);
  if (mappedCategory) {
    detectedCategory = mappedCategory;
  } else {
    // Check keyword lists against the text
    const lowerText = text.toLowerCase();
    for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        detectedCategory = catName;
        break;
      }
    }
  }

  // If merchant has words like "at Whole Foods" or "for Groceries", clean it up
  const cleanMerchant = merchant
    .replace(/\b(at|for|in|from|to)\b/gi, '')
    .trim();

  return {
    merchant: cleanMerchant.length > 0 ? (cleanMerchant.charAt(0).toUpperCase() + cleanMerchant.slice(1)) : 'Quick Expense',
    amount,
    category: detectedCategory,
    type,
    confidence: amount !== null ? 0.9 : 0.4,
  };
};
