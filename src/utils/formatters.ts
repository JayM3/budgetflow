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
  if (!dateString) return '';
  try {
    // If simple YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const parts = dateString.split('-');
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, monthIndex, day);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? dateString
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
};

export const formatDateTimeDisplay = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return formatDateDisplay(dateString);
    
    const dateFormatted = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return `${dateFormatted} at ${timeFormatted}`;
  } catch {
    return dateString;
  }
};

export const formatTimeDisplay = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
};

/**
 * Returns formatted YYYY-MM-DDTHH:mm string for local datetime-local input
 */
export const toLocalDatetimeInputString = (input?: Date | string): string => {
  const d = input ? (typeof input === 'string' ? new Date(input) : input) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    return formatLocalDatetime(now);
  }
  return formatLocalDatetime(d);
};

function formatLocalDatetime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

