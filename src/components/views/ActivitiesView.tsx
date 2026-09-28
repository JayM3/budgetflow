import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ListTodo,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Trash2,
  Coins,
  Filter,
  Users,
  GraduationCap,
  HeartPulse,
  PartyPopper,
  Briefcase,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ActivityCategory, ActivityItem } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';
import { AddActivityModal } from '../features/AddActivityModal';

const CATEGORY_META: Record<
  ActivityCategory,
  { label: string; color: string; bgLight: string; textDark: string; icon: React.ComponentType<{ className?: string }> }
> = {
  family: { label: 'Family', color: '#10B981', bgLight: 'bg-emerald-50 dark:bg-emerald-950/40', textDark: 'text-emerald-700 dark:text-emerald-300', icon: Users },
  school: { label: 'School', color: '#3B82F6', bgLight: 'bg-blue-50 dark:bg-blue-950/40', textDark: 'text-blue-700 dark:text-blue-300', icon: GraduationCap },
  health: { label: 'Health', color: '#06B6D4', bgLight: 'bg-cyan-50 dark:bg-cyan-950/40', textDark: 'text-cyan-700 dark:text-cyan-300', icon: HeartPulse },
  social: { label: 'Social', color: '#8B5CF6', bgLight: 'bg-purple-50 dark:bg-purple-950/40', textDark: 'text-purple-700 dark:text-purple-300', icon: PartyPopper },
  work: { label: 'Work', color: '#F97316', bgLight: 'bg-amber-50 dark:bg-amber-950/40', textDark: 'text-amber-700 dark:text-amber-300', icon: Briefcase },
  chores: { label: 'Chores', color: '#EC4899', bgLight: 'bg-pink-50 dark:bg-pink-950/40', textDark: 'text-pink-700 dark:text-pink-300', icon: CheckSquare },
};

export const ActivitiesView: React.FC = () => {
  const {
    activities,
    deleteActivity,
    toggleActivityComplete,
    familyUsers,
    preferences,
    isAddActivityOpen,
    setIsAddActivityOpen,
    addActivityInitialDate,
    setAddActivityInitialDate,
  } = useFinance();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  // Calendar Date State (defaults to current month)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

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

  // Calendar Grid Days Calculation
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

    const todayStr = new Date().toISOString().split('T')[0];

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
  }, [currentDate]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (selectedCategory !== 'all' && act.category !== selectedCategory) return false;
      if (selectedMember !== 'all' && act.assignedUserId !== selectedMember) return false;
      return true;
    });
  }, [activities, selectedCategory, selectedMember]);

  // Map activities by date string for fast calendar lookup
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    filteredActivities.forEach((act) => {
      const existing = map.get(act.date) || [];
      existing.push(act);
      map.set(act.date, existing);
    });
    return map;
  }, [filteredActivities]);

  // Activities for selected day
  const selectedDayActivities = useMemo(() => {
    return activitiesByDate.get(selectedDayStr) || [];
  }, [activitiesByDate, selectedDayStr]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      family: 0,
      school: 0,
      health: 0,
      social: 0,
      work: 0,
      chores: 0,
    };
    activities.forEach((act) => {
      if (counts[act.category] !== undefined) {
        counts[act.category]++;
      }
    });
    return counts;
  }, [activities]);

  const handleOpenAddForDay = (dayStr: string) => {
    setAddActivityInitialDate(dayStr);
    setIsAddActivityOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#131F33] p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-[#1F304B] shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Household Activities & Chores</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 font-semibold">
              {activities.length} total
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Coordinate family events, sports, school calendars, and household chores.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-[#1A283E] p-1 border border-slate-200/60 dark:border-[#1F304B]">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-[#131F33] text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#131F33] text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>List & Chores</span>
            </button>
          </div>

          {/* Add Activity Button */}
          <button
            onClick={() => {
              setAddActivityInitialDate(selectedDayStr);
              setIsAddActivityOpen(true);
            }}
            className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {/* Category & Member Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-[#131F33] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-[#1F304B] hover:bg-slate-50'
          }`}
        >
          All Categories ({activities.length})
        </button>

        {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
          const Icon = meta.icon;
          const count = categoryCounts[catKey] || 0;
          const isSelected = selectedCategory === catKey;
          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isSelected
                  ? 'ring-2 shadow-xs text-white'
                  : 'bg-white dark:bg-[#131F33] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-[#1F304B] hover:bg-slate-50'
              }`}
              style={{
                backgroundColor: isSelected ? meta.color : undefined,
                borderColor: isSelected ? meta.color : undefined,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{meta.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 dark:bg-[#1A283E] text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}

        {familyUsers.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5 shrink-0 pl-2">
            <span className="text-xs text-slate-400">Member:</span>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-[#131F33] border border-slate-200 dark:border-[#1F304B] text-slate-700 dark:text-slate-300"
            >
              <option value="all">Everyone</option>
              {familyUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.avatar} {u.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* =========================================================
          VIEW 1: CALENDAR VIEW (MONTH GRID + DAY INSPECTOR)
         ========================================================= */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Month Calendar Card */}
          <div className="lg:col-span-8 bg-white dark:bg-[#131F33] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-[#1F304B] shadow-sm space-y-4">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                  Activity Calendar
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {monthYearLabel}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl border border-slate-200 dark:border-[#1F304B] hover:bg-slate-50 dark:hover:bg-[#1A283E] text-slate-600 dark:text-slate-300 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1A283E] transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl border border-slate-200 dark:border-[#1F304B] hover:bg-slate-50 dark:hover:bg-[#1A283E] text-slate-600 dark:text-slate-300 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-[#1F304B]">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((cell) => {
                const dayActs = activitiesByDate.get(cell.dateStr) || [];
                const isSelected = selectedDayStr === cell.dateStr;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDayStr(cell.dateStr)}
                    className={`min-h-[82px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-500 ring-2 ring-teal-400 bg-teal-50/30 dark:bg-teal-950/20 shadow-xs'
                        : cell.isToday
                        ? 'border-teal-300/80 bg-teal-50/15 dark:bg-teal-950/10'
                        : cell.isCurrentMonth
                        ? 'border-slate-100 dark:border-[#1F304B] bg-slate-50/60 dark:bg-[#1A283E]/40 hover:border-slate-300 dark:hover:border-slate-600'
                        : 'border-transparent bg-slate-50/20 dark:bg-transparent opacity-40 hover:opacity-75'
                    }`}
                  >
                    {/* Day number header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          cell.isToday
                            ? 'bg-teal-500 text-white font-black'
                            : isSelected
                            ? 'text-teal-700 dark:text-teal-300 font-black'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {dayActs.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {dayActs.length}
                        </span>
                      )}
                    </div>

                    {/* Activity Pills (Max 2 shown, +N if more) */}
                    <div className="space-y-1 my-1 flex-1 overflow-hidden">
                      {dayActs.slice(0, 2).map((act) => {
                        const meta = CATEGORY_META[act.category] || CATEGORY_META.family;
                        return (
                          <div
                            key={act.id}
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold truncate flex items-center gap-1 ${
                              act.isCompleted ? 'line-through opacity-60' : ''
                            }`}
                            style={{
                              backgroundColor: `${meta.color}20`,
                              color: meta.color,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: meta.color }}
                            />
                            <span className="truncate">{act.title}</span>
                          </div>
                        );
                      })}

                      {dayActs.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400 block text-right pr-0.5">
                          +{dayActs.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Day Inspector & Category Breakdown */}
          <div className="lg:col-span-4 space-y-4">
            {/* Selected Day Inspector */}
            <div className="bg-white dark:bg-[#131F33] rounded-3xl p-5 border border-slate-100 dark:border-[#1F304B] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1F304B]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Day Schedule
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {new Date(selectedDayStr + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h4>
                </div>
                <button
                  onClick={() => handleOpenAddForDay(selectedDayStr)}
                  className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 hover:bg-teal-100 transition-colors"
                  title="Add activity for this day"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {selectedDayActivities.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-slate-50 dark:bg-[#1A283E] text-slate-400 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    No activities scheduled for this day.
                  </p>
                  <button
                    onClick={() => handleOpenAddForDay(selectedDayStr)}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    + Add one now
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {selectedDayActivities.map((act) => {
                    const meta = CATEGORY_META[act.category] || CATEGORY_META.family;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={act.id}
                        className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                          act.isCompleted
                            ? 'bg-slate-50/70 dark:bg-[#1A283E]/30 border-slate-200/60 dark:border-[#1F304B] opacity-75'
                            : 'bg-white dark:bg-[#131F33] border-slate-100 dark:border-[#1F304B] shadow-2xs hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleActivityComplete(act.id)}
                            className="mt-0.5 text-slate-400 hover:text-teal-500 transition-colors cursor-pointer"
                          >
                            {act.isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <h5
                              className={`text-xs sm:text-sm font-bold truncate ${
                                act.isCompleted
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {act.title}
                            </h5>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <span
                                className="px-1.5 py-0.2 rounded font-bold text-[9px] uppercase tracking-wider"
                                style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                              >
                                {meta.label}
                              </span>

                              {act.startTime && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{act.startTime}{act.endTime ? ` - ${act.endTime}` : ''}</span>
                                </span>
                              )}

                              {act.location && (
                                <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span className="truncate">{act.location}</span>
                                </span>
                              )}

                              {act.hasReward && act.rewardAmount && (
                                <span className="px-1.5 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-0.5 text-[10px]">
                                  <Coins className="w-2.5 h-2.5" />
                                  <span>+{formatCurrency(act.rewardAmount, preferences.currency)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteActivity(act.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A283E]"
                          title="Delete activity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category Distribution Card */}
            <div className="bg-white dark:bg-[#131F33] rounded-3xl p-5 border border-slate-100 dark:border-[#1F304B] shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Activity Distribution
              </h4>
              <div className="space-y-2">
                {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
                  const count = categoryCounts[catKey] || 0;
                  const percent = activities.length > 0 ? (count / activities.length) * 100 : 0;
                  return (
                    <div key={catKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                          {meta.label}
                        </span>
                        <span className="font-bold text-slate-500 dark:text-slate-400">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-[#1A283E] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%`, backgroundColor: meta.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW 2: LIST & CHORE BOARD VIEW
         ========================================================= */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-[#131F33] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-[#1F304B] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1F304B]">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              All Scheduled Activities & Household Chores
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Showing {filteredActivities.length} items
            </span>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">No activities found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No events match your current filter. Click "+ Add Activity" to schedule an event or chore.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#1F304B]">
              {filteredActivities.map((act) => {
                const meta = CATEGORY_META[act.category] || CATEGORY_META.family;
                const Icon = meta.icon;
                return (
                  <div
                    key={act.id}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-[#1A283E]/30 px-2 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleActivityComplete(act.id)}
                        className="text-slate-400 hover:text-teal-500 transition-colors cursor-pointer shrink-0"
                      >
                        {act.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: meta.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-bold truncate ${
                              act.isCompleted
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {act.title}
                          </h4>
                          {act.assignedUserName && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1A283E] text-slate-600 dark:text-slate-300 font-semibold truncate">
                              👤 {act.assignedUserName}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {act.date}
                          </span>
                          {act.startTime && (
                            <span>• {act.startTime}{act.endTime ? ` - ${act.endTime}` : ''}</span>
                          )}
                          {act.location && <span>• 📍 {act.location}</span>}
                          {act.hasReward && act.rewardAmount && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 text-[11px]">
                              <Coins className="w-3 h-3" />
                              <span>+{formatCurrency(act.rewardAmount, preferences.currency)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteActivity(act.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-[#1A283E] shrink-0"
                      title="Delete activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Activity Modal */}
      <AddActivityModal
        isOpen={isAddActivityOpen}
        onClose={() => setIsAddActivityOpen(false)}
        initialDate={addActivityInitialDate}
      />
    </div>
  );
};
