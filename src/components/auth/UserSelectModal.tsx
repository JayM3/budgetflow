import React, { useState } from 'react';
import { Shield, Sparkles, UserCheck, UserPlus, LogIn, X, Check, ArrowRight } from 'lucide-react';
import { PatternLock } from './PatternLock';
import { FamilyUser } from '../../types/finance';
import { comparePatterns } from '../../utils/patternAuth';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';

interface UserSelectModalProps {
  isOpen: boolean;
  users: FamilyUser[];
  householdName: string;
  isSelfHosted: boolean;
  onSelectUser: (user: FamilyUser) => void;
  onClose?: () => void;
}

const AVATAR_OPTIONS = ['👩', '👨', '👧', '👦', '👵', '👴', '🧑‍🎓', '🦁', '🦉', '🦊', '🐼', '🚀', '🌱', '☀️', '⭐', '💎'];
const COLOR_OPTIONS = ['#0d9488', '#0284c7', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

export const UserSelectModal: React.FC<UserSelectModalProps> = ({
  isOpen,
  users,
  householdName,
  isSelfHosted,
  onSelectUser,
  onClose,
}) => {
  const { registerMember } = useFinance();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(users.length > 0 ? 'login' : 'signup');

  // Login State
  const [selectedUser, setSelectedUser] = useState<FamilyUser | null>(null);
  const [authError, setAuthError] = useState<string>('');

  // Signup State
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👧');
  const [color, setColor] = useState('#0d9488');
  const [firstPattern, setFirstPattern] = useState<number[]>([]);
  const [patternConfirmed, setPatternConfirmed] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle Login Pattern Verification
  const handleLoginPattern = async (pattern: number[]): Promise<boolean> => {
    if (!selectedUser) return false;

    // In Self-Hosted Hub mode, verify with server to retrieve active session token
    if (isSelfHosted) {
      const res = await api.verifyPattern(selectedUser.id, pattern);
      if (res.success && res.user) {
        setAuthError('');
        setTimeout(() => {
          onSelectUser(res.user);
          setSelectedUser(null);
        }, 300);
        return true;
      } else {
        setAuthError(res.error || 'Incorrect pattern. Please try again.');
        return false;
      }
    }

    if (selectedUser.patternSequence && selectedUser.patternSequence.length > 0) {
      const match = comparePatterns(selectedUser.patternSequence, pattern);
      if (match) {
        setAuthError('');
        setTimeout(() => {
          onSelectUser(selectedUser);
          setSelectedUser(null);
        }, 300);
        return true;
      } else {
        setAuthError('Incorrect pattern. Please try again.');
        return false;
      }
    }

    onSelectUser(selectedUser);
    setSelectedUser(null);
    return true;
  };

  const handleCompleteSignup = async () => {
    if (!name.trim()) {
      setSignupError('Name is required.');
      return;
    }
    if (!patternConfirmed || firstPattern.length < 3) {
      setSignupError('Please draw and confirm your 9-dot pattern.');
      return;
    }

    setIsSubmitting(true);
    setSignupError('');
    try {
      const res = await registerMember({
        name: name.trim(),
        avatar,
        color,
        patternSequence: firstPattern,
      });

      if (!res.success) {
        setSignupError(res.error || 'Failed to register member.');
      } else {
        // Reset state
        setName('');
        setFirstPattern([]);
        setPatternConfirmed(false);
        setSignupStep(1);
      }
    } catch (err: any) {
      setSignupError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden transition-all text-slate-800">
        {/* Glow ambient */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button if user already has an active session and is just switching */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-20"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Tabs: Log In vs Join Family */}
        <div className="relative z-10 mb-6">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {householdName || 'BudgetFlow Family Hub'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure family finance portal with 9-dot pattern check
            </p>
          </div>

          <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setSelectedUser(null);
                setAuthError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-teal-600" />
              <span>Log In ({users.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setSignupStep(1);
                setSignupError('');
                setPatternConfirmed(false);
                setFirstPattern([]);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-teal-600" />
              <span>Join Family / Sign Up</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            TAB 1: LOG IN EXISTING USER
           ========================================================= */}
        {activeTab === 'login' && (
          <div className="relative z-10">
            {!selectedUser ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-500 text-center">
                  Select your profile to unlock this device:
                </p>

                {users.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                    <p className="text-xs text-slate-600">No users found in this household yet.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('signup')}
                      className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl"
                    >
                      Sign Up as First Member →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setAuthError('');
                        }}
                        className="flex flex-col items-center p-3.5 rounded-2xl border-2 border-slate-100 hover:border-teal-400 hover:bg-teal-50/40 bg-white transition-all transform hover:-translate-y-0.5 shadow-sm group"
                      >
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md mb-2 group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: `${user.color}15`, borderColor: user.color }}
                        >
                          <span>{user.avatar || '👤'}</span>
                        </div>
                        <span className="font-bold text-slate-800 text-xs truncate max-w-[120px]">
                          {user.name}
                        </span>
                        <span
                          className={`mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            user.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex flex-col items-center justify-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md mb-1.5"
                    style={{ backgroundColor: `${selectedUser.color}20` }}
                  >
                    <span>{selectedUser.avatar}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Hi, {selectedUser.name}!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Draw your 9-dot pattern to unlock your dashboard.
                  </p>
                </div>

                <PatternLock
                  mode="verify"
                  size={240}
                  onComplete={handleLoginPattern}
                  onCancel={() => setSelectedUser(null)}
                />

                {authError && (
                  <p className="text-xs font-bold text-rose-500 animate-shake">
                    {authError}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    ← Choose Another User
                  </button>

                  {!isSelfHosted && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectUser(selectedUser);
                        setSelectedUser(null);
                      }}
                      className="text-xs text-teal-600 hover:text-teal-800 font-bold hover:underline flex items-center space-x-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Demo Unlock</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: JOIN FAMILY / SIGN UP AS MEMBER
           ========================================================= */}
        {activeTab === 'signup' && (
          <div className="relative z-10 space-y-4">
            {signupStep === 1 ? (
              /* Step 1: Name, Avatar, Color */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah, Dad, Sam"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm font-semibold text-slate-800"
                  />
                </div>

                {/* Avatar Picker */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Choose Your Avatar
                  </label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setAvatar(av)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform ${
                          avatar === av
                            ? 'bg-teal-100 ring-2 ring-teal-500 scale-110 shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Profile Color Theme
                  </label>
                  <div className="flex items-center gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-teal-50/70 border border-teal-200/60 rounded-xl text-[11px] text-teal-800 leading-snug">
                  🛡️ You will be registered as a <strong>Family Member</strong> with access to household shared wallets. Next, you'll set your secret 9-dot lock pattern.
                </div>

                <button
                  type="button"
                  disabled={!name.trim()}
                  onClick={() => {
                    setSignupStep(2);
                    setFirstPattern([]);
                    setPatternConfirmed(false);
                    setSignupError('');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Next: Set 9-Dot Pattern</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Step 2: 9-Dot Pattern Registration & Confirmation */
              <div className="text-center space-y-3">
                <div>
                  <span className="text-2xl">{avatar}</span>
                  <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                    {name}, create your secret unlock pattern
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Connect at least 3 dots. You will be asked to draw it again to confirm.
                  </p>
                </div>

                <PatternLock
                  mode="create"
                  size={240}
                  minPoints={3}
                  onPatternCreated={(pattern) => {
                    setFirstPattern(pattern);
                    setPatternConfirmed(true);
                    setSignupError('');
                  }}
                  onComplete={(pattern) => {
                    setFirstPattern(pattern);
                    setPatternConfirmed(true);
                    setSignupError('');
                  }}
                  onCancel={() => {
                    setPatternConfirmed(false);
                    setFirstPattern([]);
                    setSignupError('');
                  }}
                />

                {signupError && (
                  <p className="text-xs font-bold text-rose-500 animate-shake">
                    {signupError}
                  </p>
                )}

                {patternConfirmed && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Pattern Set & Confirmed ✓</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep(1);
                      setPatternConfirmed(false);
                    }}
                    className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    ← Back to Details
                  </button>

                  <button
                    type="button"
                    disabled={!patternConfirmed || isSubmitting}
                    onClick={handleCompleteSignup}
                    className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
                  >
                    <span>{isSubmitting ? 'Registering...' : 'Complete Sign Up'}</span>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
