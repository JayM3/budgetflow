/**
 * Device Calendar Synchronization Utilities (RFC 5545 iCalendar)
 * Generates standards-compliant .ics feeds and calendar links for iOS, Android, macOS, and Windows.
 */
import { Bill, SavingsGoal } from '../types/finance';

/**
 * Format a date string (YYYY-MM-DD or ISO) into iCalendar basic date format (YYYYMMDD)
 */
export function formatIcsDate(dateString: string): string {
  if (!dateString) {
    return new Date().toISOString().replace(/[-:]/g, '').split('T')[0];
  }
  const clean = dateString.split('T')[0].replace(/-/g, '');
  return clean;
}

/**
 * Generates an RFC 5545 iCalendar (.ics) string from household bills and goals
 */
export function generateIcsCalendar(
  bills: Bill[],
  goals: SavingsGoal[],
  householdName: string = 'BudgetFlow',
  currencySymbol: string = 'kr'
): string {
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BudgetFlow Hub//Recurring Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${householdName} Finances`,
    'X-WR-TIMEZONE:UTC',
  ];

  // Bills and Recurring Income
  bills.forEach((b) => {
    const isIncome = b.type === 'income';
    const cleanDate = formatIcsDate(b.dueDate);
    const summary = isIncome
      ? `💰 +${b.amount} ${currencySymbol} - ${b.name}`
      : `🧾 Due: ${b.name} (${b.amount} ${currencySymbol})`;
    const desc = `${isIncome ? 'Recurring Income' : 'Scheduled Bill'}: ${b.name}\\nAmount: ${b.amount} ${currencySymbol}\\nCategory: ${b.category}\\nFrequency: ${b.frequency}\\nStatus: ${b.isPaid ? 'Completed/Paid' : 'Pending'}`;
    const freqUpper = (b.frequency || 'monthly').toUpperCase();
    const rrule = freqUpper === 'WEEKLY' ? 'RRULE:FREQ=WEEKLY' : freqUpper === 'YEARLY' ? 'RRULE:FREQ=YEARLY' : 'RRULE:FREQ=MONTHLY';

    lines.push(
      'BEGIN:VEVENT',
      `UID:item-${b.id}@budgetflow`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${cleanDate}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      rrule,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${b.name} is due tomorrow`,
      'TRIGGER:-P1D',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  // Goals target milestones
  goals.forEach((g) => {
    if (g.targetDate) {
      const cleanDate = formatIcsDate(g.targetDate);
      lines.push(
        'BEGIN:VEVENT',
        `UID:goal-${g.id}@budgetflow`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;VALUE=DATE:${cleanDate}`,
        `SUMMARY:🎯 Goal Target: ${g.name} (${g.targetAmount} ${currencySymbol})`,
        `DESCRIPTION:Target savings date for ${g.name}. Target amount: ${g.targetAmount} ${currencySymbol}`,
        'END:VEVENT'
      );
    }
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Triggers a browser download of the .ics calendar file for device calendar import
 */
export function downloadIcsFile(
  bills: Bill[],
  goals: SavingsGoal[],
  householdName: string = 'BudgetFlow',
  currencySymbol: string = 'kr'
) {
  const icsContent = generateIcsCalendar(bills, goals, householdName, currencySymbol);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${householdName.toLowerCase().replace(/\s+/g, '_')}_calendar.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an Add to Google Calendar web link for a specific bill or recurring item
 */
export function generateGoogleCalendarUrl(bill: Bill, currencySymbol: string = 'kr'): string {
  const isIncome = bill.type === 'income';
  const title = encodeURIComponent(
    isIncome
      ? `💰 Income: ${bill.name} (+${bill.amount} ${currencySymbol})`
      : `🧾 Bill Due: ${bill.name} (${bill.amount} ${currencySymbol})`
  );
  const details = encodeURIComponent(
    `Recurring ${isIncome ? 'income' : 'bill'} managed in BudgetFlow.\\nCategory: ${bill.category}\\nAmount: ${bill.amount} ${currencySymbol}\\nStatus: ${bill.isPaid ? 'Paid' : 'Unpaid'}`
  );
  const dateStr = formatIcsDate(bill.dueDate);
  // All day event: YYYYMMDD/YYYYMMDD
  const dates = `${dateStr}/${dateStr}`;

  let recurrence = 'RRULE:FREQ=MONTHLY';
  if (bill.frequency === 'weekly') recurrence = 'RRULE:FREQ=WEEKLY';
  if (bill.frequency === 'yearly') recurrence = 'RRULE:FREQ=YEARLY';

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&recur=${encodeURIComponent(recurrence)}`;
}

/**
 * Generates the live subscription URL (webcal://)
 */
export function getLiveCalendarSubscriptionUrl(lanIp?: string, port: number = 5050): string {
  const host = lanIp && lanIp !== 'localhost' ? `${lanIp}:${port}` : window.location.host;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${host}/api/calendar/feed.ics`;
}
