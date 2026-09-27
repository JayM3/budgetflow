import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import { getISOWeekNumber } from '../../utils/formatters';

interface DateRangePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string | null;
  endDate: string | null;
  onApply: (start: string | null, end: string | null) => void;
}

const formatDateISO = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getMondayOfDate = (d: Date): Date => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
};

const getSundayOfDate = (d: Date): Date => {
  const mon = getMondayOfDate(d);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return sun;
};

export const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({
  isOpen,
  onClose,
  startDate: initialStart,
  endDate: initialEnd,
  onApply,
}) => {
  const [selectedStart, setSelectedStart] = useState<string | null>(initialStart);
  const [selectedEnd, setSelectedEnd] = useState<string | null>(initialEnd);

  // Month navigation for From Calendar and To Calendar
  const today = useMemo(() => new Date(), []);
  
  // Initialize view months based on selected or current dates
  const initialFromDate = initialStart ? new Date(initialStart) : new Date(today.getFullYear(), 0, 1);
  const initialToDate = initialEnd ? new Date(initialEnd) : today;

  const [fromMonth, setFromMonth] = useState<Date>(
    new Date(initialFromDate.getFullYear(), initialFromDate.getMonth(), 1)
  );
  const [toMonth, setToMonth] = useState<Date>(
    new Date(initialToDate.getFullYear(), initialToDate.getMonth(), 1)
  );

  // Sync internal state when opened
  React.useEffect(() => {
    if (isOpen) {
      setSelectedStart(initialStart);
      setSelectedEnd(initialEnd);
      if (initialStart) {
        const d = new Date(initialStart);
        setFromMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      } else {
        setFromMonth(new Date(today.getFullYear(), 0, 1)); // January of current year
      }
      if (initialEnd) {
        const d = new Date(initialEnd);
        setToMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      } else {
        setToMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      }
    }
  }, [isOpen, initialStart, initialEnd, today]);

  if (!isOpen) return null;

  // Preset Handlers
  const applyPreset = (startStr: string, endStr: string) => {
    setSelectedStart(startStr);
    setSelectedEnd(endStr);

    const s = new Date(startStr);
    const e = new Date(endStr);
    setFromMonth(new Date(s.getFullYear(), s.getMonth(), 1));
    setToMonth(new Date(e.getFullYear(), e.getMonth(), 1));
  };

  const handlePresetClick = (preset: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    switch (preset) {
      // Row 1
      case 'this_week': {
        const mon = getMondayOfDate(now);
        const sun = getSundayOfDate(now);
        applyPreset(formatDateISO(mon), formatDateISO(sun));
        break;
      }
      case 'this_month': {
        const start = new Date(currentYear, now.getMonth(), 1);
        const end = new Date(currentYear, now.getMonth() + 1, 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'this_year': {
        const start = new Date(currentYear, 0, 1);
        const end = new Date(currentYear, 11, 31);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'year_to_date': {
        const start = new Date(currentYear, 0, 1);
        applyPreset(formatDateISO(start), formatDateISO(now));
        break;
      }
      // Row 2
      case 'last_week': {
        const lastWeekNow = new Date(now);
        lastWeekNow.setDate(now.getDate() - 7);
        const mon = getMondayOfDate(lastWeekNow);
        const sun = getSundayOfDate(lastWeekNow);
        applyPreset(formatDateISO(mon), formatDateISO(sun));
        break;
      }
      case 'last_month': {
        const start = new Date(currentYear, now.getMonth() - 1, 1);
        const end = new Date(currentYear, now.getMonth(), 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'last_year': {
        const start = new Date(currentYear - 1, 0, 1);
        const end = new Date(currentYear - 1, 11, 31);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'last_year_to_date': {
        const start = new Date(currentYear - 1, 0, 1);
        const end = new Date(currentYear - 1, now.getMonth(), now.getDate());
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      // Row 3: Bi-monthly terms
      case 'term_1': {
        const start = new Date(currentYear, 0, 1);
        const end = new Date(currentYear, 2, 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'term_2': {
        const start = new Date(currentYear, 2, 1);
        const end = new Date(currentYear, 4, 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'term_3': {
        const start = new Date(currentYear, 4, 1);
        const end = new Date(currentYear, 6, 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'term_4': {
        const start = new Date(currentYear, 6, 1);
        const end = new Date(currentYear, 8, 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'term_5': {
        const start = new Date(currentYear, 8, 1);
        const end = new Date(currentYear, 10, 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'term_6': {
        const start = new Date(currentYear, 10, 1);
        const end = new Date(currentYear, 12, 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      // Row 4: Quarters
      case 'q1': {
        const start = new Date(currentYear, 0, 1);
        const end = new Date(currentYear, 3, 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'q2': {
        const start = new Date(currentYear, 3, 1);
        const end = new Date(currentYear, 6, 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'q3': {
        const start = new Date(currentYear, 6, 1);
        const end = new Date(currentYear, 9, 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
      case 'q4': {
        const start = new Date(currentYear, 9, 1);
        const end = new Date(currentYear, 12, 0);
        applyPreset(formatDateISO(start), formatDateISO(end));
        break;
      }
    }
  };

  // Calendar Day Click Handler
  const handleDateClick = (isoString: string) => {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      // First click: sets start date
      setSelectedStart(isoString);
      setSelectedEnd(null);
    } else if (selectedStart && !selectedEnd) {
      // Second click: sets end date
      if (isoString < selectedStart) {
        setSelectedEnd(selectedStart);
        setSelectedStart(isoString);
      } else {
        setSelectedEnd(isoString);
      }
    }
  };

  // Clicking a week number selects that full week
  const handleWeekClick = (weekMonday: Date) => {
    const mon = getMondayOfDate(weekMonday);
    const sun = getSundayOfDate(weekMonday);
    setSelectedStart(formatDateISO(mon));
    setSelectedEnd(formatDateISO(sun));
  };

  const handleClear = () => {
    setSelectedStart(null);
    setSelectedEnd(null);
    onApply(null, null);
    onClose();
  };

  const handleApply = () => {
    if (selectedStart && !selectedEnd) {
      onApply(selectedStart, selectedStart);
    } else {
      onApply(selectedStart, selectedEnd);
    }
    onClose();
  };

  // Calendar Generation Helper
  const generateMonthGrid = (viewMonth: Date) => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    // First day of month
    const firstDayOfMonth = new Date(year, month, 1);
    // Day of week: 0 = Sun, 1 = Mon ...
    const dayOfWeek = firstDayOfMonth.getDay();
    // Monday offset (0 if Monday, 6 if Sunday)
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Start date for the calendar view (previous month leading days)
    const startDate = new Date(year, month, 1 - mondayOffset);

    const weeks: Array<{
      weekNumber: number;
      weekMonday: Date;
      days: Array<{
        date: Date;
        iso: string;
        dayNum: number;
        isCurrentMonth: boolean;
        isSunday: boolean;
      }>;
    }> = [];

    let current = new Date(startDate);

    // 6 weeks per calendar grid
    for (let w = 0; w < 6; w++) {
      const weekMonday = new Date(current);
      const weekNumber = getISOWeekNumber(current);
      const days = [];

      for (let d = 0; d < 7; d++) {
        const isCurrentMonth = current.getMonth() === month;
        const isSunday = current.getDay() === 0;
        days.push({
          date: new Date(current),
          iso: formatDateISO(current),
          dayNum: current.getDate(),
          isCurrentMonth,
          isSunday,
        });
        current.setDate(current.getDate() + 1);
      }

      weeks.push({
        weekNumber,
        weekMonday,
        days,
      });
    }

    return weeks;
  };

  const fromWeeks = generateMonthGrid(fromMonth);
  const toWeeks = generateMonthGrid(toMonth);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const renderCalendar = (
    viewMonth: Date,
    setViewMonth: React.Dispatch<React.SetStateAction<Date>>,
    weeks: ReturnType<typeof generateMonthGrid>
  ) => {
    const prevMonth = () => {
      setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
      setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
    };

    return (
      <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
        {/* Month Header with < > arrows */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-800">
            {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days Table */}
        <table className="w-full text-center border-collapse">
          <thead>
            <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-100">
              <th className="py-1 px-1 font-semibold text-slate-400 border-r border-slate-100">
                Wk
              </th>
              <th className="py-1 px-1 font-semibold text-slate-600">Mon</th>
              <th className="py-1 px-1 font-semibold text-slate-600">Tue</th>
              <th className="py-1 px-1 font-semibold text-slate-600">Wed</th>
              <th className="py-1 px-1 font-semibold text-slate-600">Thu</th>
              <th className="py-1 px-1 font-semibold text-slate-600">Fri</th>
              <th className="py-1 px-1 font-semibold text-slate-600">Sat</th>
              <th className="py-1 px-1 font-semibold text-orange-600">Sun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {weeks.map((week, wIdx) => (
              <tr key={wIdx} className="group">
                {/* Clickable Week Number Column */}
                <td
                  onClick={() => handleWeekClick(week.weekMonday)}
                  className="py-1.5 px-1 text-[10px] font-mono font-medium text-slate-400 border-r border-slate-100 cursor-pointer hover:bg-cyan-50 hover:text-cyan-700 rounded-l transition-colors"
                  title={`Select Week ${week.weekNumber}`}
                >
                  {week.weekNumber}
                </td>

                {/* Day Cells */}
                {week.days.map((day, dIdx) => {
                  const isStart = selectedStart === day.iso;
                  const isEnd = selectedEnd === day.iso;
                  const inRange =
                    selectedStart &&
                    selectedEnd &&
                    day.iso > selectedStart &&
                    day.iso < selectedEnd;

                  let cellClass = 'cursor-pointer transition-all text-xs font-semibold py-1 px-1 ';

                  if (isStart || isEnd) {
                    cellClass += 'text-cyan-900 font-black ';
                  } else if (inRange) {
                    cellClass += 'bg-cyan-50 text-cyan-900 ';
                  } else if (day.isCurrentMonth) {
                    cellClass += day.isSunday
                      ? 'text-orange-600 hover:bg-slate-100 '
                      : 'text-slate-800 hover:bg-slate-100 ';
                  } else {
                    cellClass += 'text-slate-300 hover:bg-slate-50 ';
                  }

                  return (
                    <td
                      key={dIdx}
                      onClick={() => handleDateClick(day.iso)}
                      className={cellClass}
                      title={day.iso}
                    >
                      <div
                        className={`w-7 h-7 mx-auto flex items-center justify-center rounded-lg ${
                          isStart || isEnd
                            ? 'border-2 border-cyan-500 bg-cyan-100/60 shadow-sm font-bold'
                            : ''
                        }`}
                      >
                        {day.dayNum}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <CalendarIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Select Date Range</h3>
              <p className="text-xs text-slate-500">
                Filter and sort transactions within specific dates or presets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Quick Presets Grid (4 Rows exactly matching inspiration) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {/* Row 1: This Week | This Month | This Year | Year to Date */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
              <button
                type="button"
                onClick={() => handlePresetClick('this_week')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('this_month')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('this_year')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
              >
                This Year
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('year_to_date')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
              >
                Year to Date
              </button>
            </div>

            {/* Row 2: Last Week | Last Month | Last Year | Last Year to Date */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
              <button
                type="button"
                onClick={() => handlePresetClick('last_week')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
              >
                Last Week
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('last_month')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('last_year')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
              >
                Last Year
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('last_year_to_date')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
              >
                Last Year to Date
              </button>
            </div>

            {/* Row 3: Term 1 | Term 2 | Term 3 | Term 4 | Term 5 | Term 6 */}
            <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-slate-100">
              <button
                type="button"
                onClick={() => handlePresetClick('term_1')}
                className="py-2.5 px-2 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
                title="Jan – Feb"
              >
                Term 1
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('term_2')}
                className="py-2.5 px-2 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
                title="Mar – Apr"
              >
                Term 2
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('term_3')}
                className="py-2.5 px-2 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
                title="May – Jun"
              >
                Term 3
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('term_4')}
                className="py-2.5 px-2 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
                title="Jul – Aug"
              >
                Term 4
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('term_5')}
                className="py-2.5 px-2 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
                title="Sep – Oct"
              >
                Term 5
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('term_6')}
                className="py-2.5 px-2 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
                title="Nov – Dec"
              >
                Term 6
              </button>
            </div>

            {/* Row 4: Q1 | Q2 | Q3 | Q4 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
              <button
                type="button"
                onClick={() => handlePresetClick('q1')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
                title="Jan 1 – Mar 31"
              >
                Q1
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('q2')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
                title="Apr 1 – Jun 30"
              >
                Q2
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('q3')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
                title="Jul 1 – Sep 30"
              >
                Q3
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick('q4')}
                className="py-2.5 px-3 hover:bg-cyan-50 hover:text-cyan-700 transition-colors text-center"
                title="Oct 1 – Dec 31"
              >
                Q4
              </button>
            </div>
          </div>

          {/* Date Range Inputs Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                From date:
              </label>
              <input
                type="date"
                value={selectedStart || ''}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setSelectedStart(val);
                  if (val) {
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) {
                      setFromMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                    }
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                To date:
              </label>
              <input
                type="date"
                value={selectedEnd || ''}
                onChange={(e) => {
                  const val = e.target.value || null;
                  setSelectedEnd(val);
                  if (val) {
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) {
                      setToMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                    }
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Dual Month Calendars */}
          <div className="flex flex-col md:flex-row gap-4">
            {renderCalendar(fromMonth, setFromMonth, fromWeeks)}
            {renderCalendar(toMonth, setToMonth, toWeeks)}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filter (All Dates)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 hover:from-teal-700 hover:via-cyan-700 hover:to-sky-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>OK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
