export const formatCurrency = (amount: number, symbol: string = 'kr'): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const isKr = symbol.toLowerCase().includes('kr');
  const locale = isKr ? 'nb-NO' : 'en-US';

  // Format with clean whole numbers if integer, or 2 decimals
  const formatted = absAmount.toLocaleString(locale, {
    minimumFractionDigits: absAmount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  if (isKr) {
    return `${isNegative ? '-' : ''}${formatted} kr`;
  }

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
};

export const formatCurrencyExact = (amount: number, symbol: string = 'kr'): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const isKr = symbol.toLowerCase().includes('kr');
  const locale = isKr ? 'nb-NO' : 'en-US';

  const formatted = absAmount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (isKr) {
    return `${isNegative ? '-' : ''}${formatted} kr`;
  }

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
};

export const formatDateDisplay = (dateString: string): string => {
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, monthIndex, day);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
};
