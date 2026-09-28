import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Dumbbell,
  CheckSquare,
  Utensils,
  Film,
  Users,
  GraduationCap,
  HeartPulse,
  PartyPopper,
  Briefcase,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  MoreVertical,
  Activity,
  Layers,
  BarChart2,
  Wallet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ActivityCategory, ActivityItem } from '../../types/finance';
import { formatTabletDateDisplay } from '../../utils/formatters';

interface TabletActivityCalendarProps {
  viewport: {
    width: number;
    height: number;
    isLandscape: boolean;
    isCompactHeight: boolean;
    isSpaciousHeight: boolean;
  };
  theme: 'dark' | 'light';
  isLite: boolean;
  onOpenAddActivity: (dateStr?: string) => void;
  onOpenLogExpense?: () => void;
  onOpenViewBalances?: () => void;
  onSwitchToDashboard?: () => void;
}

const CATEGORY_COLORS: Record<string, { color: string; label: string }> = {
  family: { color: '#10B981', label: 'Family' },
  school: { color: '#3B82F6', label: 'School' },
  health: { color: '#06B6D4', label: 'Health' },
  social: { color: '#8B5CF6', label: 'Social' },
  work: { color: '#F97316', label: 'Work' },
  bills: { color: '#F43F5E', label: 'Bills' },
  chores: { color: '#EC4899', label: 'Chores' },
};

// Activity item icon resolver
const getActivityIcon = (category: string, title: string) => {
  const t = title.toLowerCase();
  if (t.includes('gym') || t.includes('workout') || t.includes('sport')) return Dumbbell;
  if (t.includes('dinner') || t.includes('meal') || t.includes('food') || t.includes('lunch')) return Utensils;
  if (t.includes('movie') || t.includes('film') || t.includes('watch') || t.includes('show')) return Film;
  if (t.includes('plan') || t.includes('chore') || t.includes('clean') || t.includes('task')) return CheckSquare;
  if (category === 'school') return GraduationCap;
  if (category === 'health') return HeartPulse;
  if (category === 'social') return PartyPopper;
  if (category === 'work') return Briefcase;
  return Users;
};

export const TabletActivityCalendar: React.FC<TabletActivityCalendarProps> = ({
  viewport,
  theme,
  isLite,
  onOpenAddActivity,
  onOpenLogExpense,
  onOpenViewBalances,
  onSwitchToDashboard,
}) => {
  const { activities, bills, toggleActivityComplete } = useFinance();

  const isDark = theme === 'dark';
  const todayDate = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => todayDate.toISOString().split('T')[0], [todayDate]);

  // Current viewed month
  const [currentDate, setCurrentDate] = useState(() => new Date());
  // Selected day
  const [selectedDayStr, setSelectedDayStr] = useState<string>(todayStr);

  const monthYearLabel = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDayStr(now.toISOString().split('T')[0]);
  };

  // Calendar Month Days Calculation (Sun to Sat)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = totalDaysPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const str = prevDate.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: str === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const curDate = new Date(year, month, i);
      const str = curDate.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }

    // Next month filler days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const str = nextDate.toISOString().split('T')[0];
      days.push({
        dateStr: str,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: str === todayStr,
      });
    }

    return days;
  }, [currentDate, todayStr]);

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    activities.forEach((act) => {
      const existing = map.get(act.date) || [];
      existing.push(act);
      map.set(act.date, existing);
    });
    return map;
  }, [activities]);

  // Selected Day's activities
  const selectedDayActivities = useMemo(() => {
    return activitiesByDate.get(selectedDayStr) || [];
  }, [activitiesByDate, selectedDayStr]);

  // Category counts for the current month
  const categoryCounts = useMemo(() => {
    const counts = {
      Family: 0,
      School: 0,
      Health: 0,
      Social: 0,
      Work: 0,
      Bills: 0,
    };

    activities.forEach((act) => {
      const d = new Date(act.date);
      if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
        if (act.category === 'family' || act.category === 'chores') counts.Family++;
        else if (act.category === 'school') counts.School++;
        else if (act.category === 'health') counts.Health++;
        else if (act.category === 'social') counts.Social++;
        else if (act.category === 'work') counts.Work++;
      }
    });

    // Count upcoming unpaid bills this month
    bills.forEach((b) => {
      const d = new Date(b.dueDate);
      if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
        counts.Bills++;
      }
    });

    return counts;
  }, [activities, bills, currentDate]);

  // This Week calculation
  const thisWeekStats = useMemo(() => {
    const cur = new Date();
    const firstDay = new Date(cur.setDate(cur.getDate() - cur.getDay()));
    const lastDay = new Date(cur.setDate(cur.getDate() - cur.getDay() + 6));
    const firstStr = firstDay.toISOString().split('T')[0];
    const lastStr = lastDay.toISOString().split('T')[0];

    const weekActs = activities.filter((a) => a.date >= firstStr && a.date <= lastStr);
    const family = weekActs.filter((a) => a.category === 'family' || a.category === 'chores').length;
    const school = weekActs.filter((a) => a.category === 'school').length;
    const health = weekActs.filter((a) => a.category === 'health').length;

    const label = `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    return {
      total: weekActs.length,
      family,
      school,
      health,
      rangeLabel: label,
    };
  }, [activities]);

  const selectedDateObj = useMemo(() => {
    return new Date(selectedDayStr + 'T00:00:00');
  }, [selectedDayStr]);

  const isTodaySelected = selectedDayStr === todayStr;

  return (
    <div className="h-full w-full flex flex-col justify-between select-none relative overflow-hidden">
      {/* =========================================================
          MAIN CALENDAR CONTAINER (Left: Month Grid, Right: Details)
         ========================================================= */}
      <div
        className={`flex-1 grid gap-4 overflow-hidden ${
          viewport.isLandscape ? 'grid-cols-12' : 'grid-cols-1 overflow-y-auto'
        }`}
      >
        {/* ================= LEFT COLUMN: MONTH CALENDAR ================= */}
        <div
          className={`${
            viewport.isLandscape ? 'col-span-8' : 'col-span-1'
          } rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 ${
            isDark
              ? 'bg-[#101927]/90 border border-[#1E2C42] shadow-2xl'
              : 'bg-white border border-slate-200/80 shadow-lg'
          }`}
        >
          {/* Header Row: Title & Month Navigation */}
          <div className="flex items-center justify-between pb-3 shrink-0">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-400 mb-0.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>ACTIVITY CALENDAR</span>
              </div>
              <h2
                className={`text-xl sm:text-2xl font-black tracking-tight leading-none ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {monthYearLabel}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className={`p-2 rounded-xl border transition-all ${
                  isDark
                    ? 'border-[#1E2C42] bg-[#142032] text-slate-300 hover:bg-[#1C2C45]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isDark
                    ? 'border-[#1E2C42] bg-[#142032] text-slate-300 hover:bg-[#1C2C45]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className={`p-2 rounded-xl border transition-all ${
                  isDark
                    ? 'border-[#1E2C42] bg-[#142032] text-slate-300 hover:bg-[#1C2C45]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels (Sun to Sat) */}
          <div className="grid grid-cols-7 text-center font-bold text-[11px] sm:text-xs text-slate-400 uppercase tracking-wider py-1.5 border-b border-slate-800/40 dark:border-[#1E2C42]/60 shrink-0">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Days 7-Column Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1 pt-2 overflow-hidden">
            {calendarDays.map((cell) => {
              const dayActs = activitiesByDate.get(cell.dateStr) || [];
              const isSelected = selectedDayStr === cell.dateStr;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDayStr(cell.dateStr)}
                  className={`p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'border-teal-400 ring-2 ring-teal-400/80 bg-teal-950/30 shadow-lg shadow-teal-500/10'
                      : cell.isToday
                      ? 'border-teal-500/40 bg-teal-950/15'
                      : cell.isCurrentMonth
                      ? isDark
                        ? 'border-[#1B273A] bg-[#121E2E]/60 hover:border-slate-600'
                        : 'border-slate-100 bg-slate-50/80 hover:border-slate-300'
                      : isDark
                      ? 'border-transparent bg-transparent opacity-25 hover:opacity-50'
                      : 'border-transparent bg-transparent opacity-30 hover:opacity-60'
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-bold leading-none ${
                        isSelected
                          ? 'w-5 h-5 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center font-black'
                          : cell.isToday
                          ? 'w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center font-black'
                          : cell.isCurrentMonth
                          ? isDark
                            ? 'text-slate-200'
                            : 'text-slate-800'
                          : 'text-slate-500'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                  </div>

                  {/* Activity Pills inside Month Cell */}
                  <div className="space-y-1 my-0.5 overflow-hidden">
                    {dayActs.slice(0, viewport.isCompactHeight ? 1 : 2).map((act) => {
                      const catInfo = CATEGORY_COLORS[act.category] || CATEGORY_COLORS.family;
                      return (
                        <div
                          key={act.id}
                          className="flex items-center gap-1 text-[10px] leading-tight truncate px-1 py-0.5 rounded"
                          style={{
                            backgroundColor: `${catInfo.color}15`,
                            color: isDark ? '#E2E8F0' : '#1E293B',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: catInfo.color }}
                          />
                          <span className="truncate font-semibold">{act.title}</span>
                          {act.startTime && (
                            <span className="text-[9px] text-slate-400 shrink-0 hidden sm:inline">
                              {act.startTime}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {dayActs.length > (viewport.isCompactHeight ? 1 : 2) && (
                      <span className="text-[9px] text-teal-400 font-bold block text-right pr-0.5">
                        +{dayActs.length - (viewport.isCompactHeight ? 1 : 2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: TODAY / CATEGORIES / THIS WEEK ================= */}
        <div
          className={`${
            viewport.isLandscape ? 'col-span-4' : 'col-span-1'
          } flex flex-col gap-3 justify-between overflow-hidden`}
        >
          {/* CARD 1: Selected Day Activities (Matching Screenshot) */}
          <div
            className={`rounded-3xl p-4 sm:p-5 flex-1 flex flex-col justify-between transition-all duration-300 ${
              isDark
                ? 'bg-[#101927]/90 border border-[#1E2C42] shadow-xl'
                : 'bg-white border border-slate-200/80 shadow-md'
            }`}
          >
            <div>
              {/* Day Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/40 dark:border-[#1E2C42]/60">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-teal-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {selectedDateObj.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800/40">
                  {selectedDayActivities.length} activities
                </span>
              </div>

              <div className="pt-2">
                <h3
                  className={`text-xl sm:text-2xl font-black tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {isTodaySelected ? 'Today' : selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' })}
                </h3>
              </div>
            </div>

            {/* Activities List */}
            <div className="space-y-2 my-2 flex-1 overflow-y-auto pr-1">
              {selectedDayActivities.length === 0 ? (
                <div className="py-6 text-center space-y-1.5">
                  <p className="text-xs text-slate-400 font-medium">No activities for this day</p>
                  <button
                    type="button"
                    onClick={() => onOpenAddActivity(selectedDayStr)}
                    className="text-xs font-bold text-teal-400 hover:underline"
                  >
                    + Add an activity
                  </button>
                </div>
              ) : (
                selectedDayActivities.map((act) => {
                  const Icon = getActivityIcon(act.category, act.title);
                  const catInfo = CATEGORY_COLORS[act.category] || CATEGORY_COLORS.family;

                  return (
                    <div
                      key={act.id}
                      className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        isDark
                          ? 'border-[#1C2C45] bg-[#142236]/80 hover:border-teal-500/50'
                          : 'border-slate-100 bg-slate-50 hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Time */}
                        <div className="text-[10px] font-bold text-slate-400 w-14 shrink-0 leading-tight">
                          {act.startTime ? (
                            <>
                              <div>{act.startTime}</div>
                              {act.endTime && <div className="text-slate-500">{act.endTime}</div>}
                            </>
                          ) : (
                            <span className="text-[9px] uppercase">All Day</span>
                          )}
                        </div>

                        {/* Category Icon */}
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: `${catInfo.color}30`, color: catInfo.color }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Title & Location */}
                        <div className="min-w-0">
                          <h4
                            className={`text-xs sm:text-sm font-bold truncate ${
                              act.isCompleted
                                ? 'line-through text-slate-500'
                                : isDark
                                ? 'text-white'
                                : 'text-slate-900'
                            }`}
                          >
                            {act.title}
                          </h4>
                          {act.location && (
                            <span className="text-[10px] text-slate-400 truncate block">
                              {act.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Complete Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleActivityComplete(act.id)}
                        className="text-slate-400 hover:text-teal-400 transition-colors p-1"
                      >
                        {act.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick add prompt */}
            <button
              type="button"
              onClick={() => onOpenAddActivity(selectedDayStr)}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 py-1 text-center w-full"
            >
              + Add activity for {selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </button>
          </div>

          {/* CARD 2: EVENT CATEGORIES (Matching Screenshot) */}
          <div
            className={`rounded-3xl p-3.5 sm:p-4 transition-all duration-300 ${
              isDark
                ? 'bg-[#101927]/90 border border-[#1E2C42] shadow-md'
                : 'bg-white border border-slate-200/80 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-3 h-3 text-teal-400">🏷️</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                EVENT CATEGORIES
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Family
                </span>
                <span className="font-bold text-slate-400">{categoryCounts.Family}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  School
                </span>
                <span className="font-bold text-slate-400">{categoryCounts.School}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Health
                </span>
                <span className="font-bold text-slate-400">{categoryCounts.Health}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Social
                </span>
                <span className="font-bold text-slate-400">{categoryCounts.Social}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Work
                </span>
                <span className="font-bold text-slate-400">{categoryCounts.Work}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Bills
                </span>
                <span className="font-bold text-slate-400">{categoryCounts.Bills}</span>
              </div>
            </div>
          </div>

          {/* CARD 3: THIS WEEK SUMMARY (Matching Screenshot) */}
          <div
            className={`rounded-3xl p-3.5 sm:p-4 transition-all duration-300 ${
              isDark
                ? 'bg-[#101927]/90 border border-[#1E2C42] shadow-md'
                : 'bg-white border border-slate-200/80 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                📊 THIS WEEK
              </span>
              <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded-full bg-[#142032] border border-[#1E2C42]">
                {thisWeekStats.rangeLabel}
              </span>
            </div>

            <div className="grid grid-cols-4 text-center divide-x divide-slate-800/60 dark:divide-[#1E2C42]/60 pt-1">
              <div>
                <div className="text-base font-black text-white">{thisWeekStats.total}</div>
                <div className="text-[9px] font-semibold text-slate-400 uppercase">Activities</div>
              </div>
              <div>
                <div className="text-base font-black text-emerald-400">{thisWeekStats.family}</div>
                <div className="text-[9px] font-semibold text-slate-400 uppercase">Family</div>
              </div>
              <div>
                <div className="text-base font-black text-blue-400">{thisWeekStats.school}</div>
                <div className="text-[9px] font-semibold text-slate-400 uppercase">School</div>
              </div>
              <div>
                <div className="text-base font-black text-cyan-400">{thisWeekStats.health}</div>
                <div className="text-[9px] font-semibold text-slate-400 uppercase">Health</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          BOTTOM ACTION BAR (Matching Screenshot)
         ========================================================= */}
      <div className="pt-3 flex items-center justify-between shrink-0">
        {/* Left: Family Hub Status shortcut */}
        <button
          type="button"
          onClick={onSwitchToDashboard || onOpenLogExpense}
          className="flex items-center gap-2.5 p-2 rounded-2xl hover:bg-white/5 transition-all text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm">
            🛡️
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>FAMILY HUB READY</span>
              <span className="text-[10px] text-teal-400 font-normal">← Swipe or tap for Dashboard</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Tap to view balances or log an expense
            </div>
          </div>
        </button>

        {/* Right: View week + Add activity button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDayStr(todayStr)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              isDark
                ? 'border-[#1E2C42] bg-[#142032] text-slate-300 hover:bg-[#1C2C45]'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            👁️ View week
          </button>

          <button
            type="button"
            onClick={() => onOpenAddActivity(selectedDayStr)}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add activity</span>
          </button>
        </div>
      </div>
    </div>
  );
};
