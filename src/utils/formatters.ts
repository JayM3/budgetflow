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

export const formatDateDisplay = (dateString?: string | null): string => {
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

/**
 * Calculates ISO 8601 week number (1-53)
 */
export const getISOWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Formats tablet kiosk ambient date: e.g. "Sunday, Sep 27 2026 - Week 39"
 */
export const formatTabletDateDisplay = (date: Date): string => {
  const weekNum = getISOWeekNumber(date);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${weekday}, ${month} ${day} ${year} - Week ${weekNum}`;
};

/**
 * Formats date range label for transaction filter button
 */
export const formatDateRangeDisplay = (startDate: string | null, endDate: string | null): string => {
  if (!startDate && !endDate) return 'All Dates';
  if (startDate && !endDate) return `From ${formatDateDisplay(startDate)}`;
  if (!startDate && endDate) return `Until ${formatDateDisplay(endDate)}`;
  if (startDate && endDate) {
    if (startDate === endDate) return formatDateDisplay(startDate);
    return `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`;
  }
  return 'All Dates';
};

