import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  User,
  Coins,
  Check,
  Sparkles,
  Users,
  GraduationCap,
  HeartPulse,
  PartyPopper,
  Briefcase,
  CheckSquare,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ActivityCategory } from '../../types/finance';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

const CATEGORIES: {
  id: ActivityCategory;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'family', label: 'Family', color: '#10B981', icon: Users },
  { id: 'school', label: 'School', color: '#3B82F6', icon: GraduationCap },
  { id: 'health', label: 'Health', color: '#06B6D4', icon: HeartPulse },
  { id: 'social', label: 'Social', color: '#8B5CF6', icon: PartyPopper },
  { id: 'work', label: 'Work', color: '#F97316', icon: Briefcase },
  { id: 'chores', label: 'Chores', color: '#EC4899', icon: CheckSquare },
];

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const {
    addActivity,
    familyUsers,
    wallets,
    preferences,
    triggerConfetti,
    currentUser,
  } = useFinance();

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('family');
  const [date, setDate] = useState(initialDate || todayStr);
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedUserId, setAssignedUserId] = useState<string>(currentUser?.id || '');

  // Optional allowance/reward
  const [hasReward, setHasReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<string>('50');
  const [rewardWalletId, setRewardWalletId] = useState<string>(wallets[0]?.id || '');

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate || todayStr);
      setTitle('');
      setLocation('');
      setNotes('');
      setHasReward(false);
      if (currentUser?.id) {
        setAssignedUserId(currentUser.id);
      }
    }
  }, [isOpen, initialDate, todayStr, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedUser = familyUsers.find((u) => u.id === assignedUserId);

    addActivity({
      title: title.trim(),
      category,
      date,
      allDay,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      assignedUserId: assignedUser?.id,
      assignedUserName: assignedUser?.name,
      hasReward,
      rewardAmount: hasReward && parseFloat(rewardAmount) > 0 ? parseFloat(rewardAmount) : undefined,
      rewardWalletId: hasReward ? rewardWalletId : undefined,
      isCompleted: false,
    });

    triggerConfetti();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 overflow-y-auto select-none">
      <div
        className="bg-white dark:bg-[#131F33] rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-[#1F304B] overflow-hidden text-slate-800 dark:text-slate-100 my-auto max-h-[92dvh] sm:max-h-[88vh] flex flex-col transform-gpu"
        style={{ transform: 'translateZ(0)' }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Add Household Activity</h3>
              <p className="text-xs text-cyan-100">Schedule events, sports, outings, or chores</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Activity Title *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gym, School play, Clean dishes, Dinner with family"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1F304B] dark:bg-[#1A283E] text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 px-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 ring-2 ring-teal-400 shadow-xs font-bold'
                        : 'border-slate-200 dark:border-[#1F304B] bg-slate-50 dark:bg-[#1A283E]/50 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] truncate w-full text-center">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] dark:bg-[#1A283E] text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Time
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allDay}
                    onChange={(e) => setAllDay(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-400"
                  />
                  <span>All day</span>
                </label>
              </div>

              {!allDay ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] dark:bg-[#1A283E] text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] dark:bg-[#1A283E] text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1A283E] border border-slate-200 dark:border-[#1F304B] text-xs text-slate-500">
                  Full day event
                </div>
              )}
            </div>
          </div>

          {/* Assigned Member & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Assigned Member
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] dark:bg-[#1A283E] text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <option value="">Everyone / Shared</option>
                {familyUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.avatar} {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Home, School, Gym"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] dark:bg-[#1A283E] text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Notes or Checklist (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring gear, homework due, pack sneakers"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1F304B] dark:bg-[#1A283E] text-slate-800 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          {/* Optional Allowance / Reward Toggle */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">
                    Assign Allowance / Reward?
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Optional: Link completing this chore/event to pocket money
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasReward}
                onChange={(e) => setHasReward(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-400 cursor-pointer"
              />
            </div>

            {hasReward && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/50 dark:border-amber-800/30">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Reward Amount ({preferences.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1F304B] dark:bg-[#131F33] text-xs font-bold text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Paying Wallet
                  </label>
                  <select
                    value={rewardWalletId}
                    onChange={(e) => setRewardWalletId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-[#1F304B] dark:bg-[#131F33] text-xs text-slate-800 dark:text-white"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-[#1F304B] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A283E] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Save Activity</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
