import React, { useState } from 'react';
import {
  Users,
  Plus,
  Shield,
  ShieldAlert,
  Wallet,
  Check,
  X,
  Edit2,
  Trash2,
  KeyRound,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { FamilyUser, UserRole } from '../../types/finance';
import { GuideButton } from '../guide/GuideButton';
import { PatternLock } from '../auth/PatternLock';

const AVATARS = ['👩', '👨', '👧', '👦', '👵', '👴', '🧑‍🎓', '🦁', '🦉', '🚀', '⭐', '💎'];
const COLORS = ['#0d9488', '#0284c7', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981'];

export const FamilyMembersView: React.FC = () => {
  const {
    familyUsers,
    currentUser,
    wallets,
    addFamilyUser,
    updateFamilyUser,
    deleteFamilyUser,
    setIsGuideOpenWithId,
  } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<FamilyUser | null>(null);
  const [resetPatternUser, setResetPatternUser] = useState<FamilyUser | null>(null);

  // New Member Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [avatar, setAvatar] = useState('👧');
  const [color, setColor] = useState('#0d9488');
  const [allowedWalletIds, setAllowedWalletIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState({
    canAddBills: false,
    canAddGoals: true,
    canEditBudgets: false,
    canViewHouseholdReports: false,
  });
  const [newMemberPattern, setNewMemberPattern] = useState<number[]>([]);
  const [patternStep, setPatternStep] = useState(false);

  // Reset Form
  const resetForm = () => {
    setName('');
    setRole('member');
    setAvatar('👧');
    setColor('#0d9488');
    setAllowedWalletIds(wallets.map((w) => w.id)); // default to all
    setPermissions({
      canAddBills: false,
      canAddGoals: true,
      canEditBudgets: false,
      canViewHouseholdReports: false,
    });
    setNewMemberPattern([]);
    setPatternStep(false);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleSaveNewMember = () => {
    if (!name.trim()) return;

    addFamilyUser({
      name: name.trim(),
      role,
      avatar,
      color,
      patternSequence: newMemberPattern.length > 0 ? newMemberPattern : [0, 1, 2, 4],
      allowedWalletIds: role === 'admin' ? [] : allowedWalletIds,
      permissions:
        role === 'admin'
          ? {
              canAddBills: true,
              canAddGoals: true,
              canEditBudgets: true,
              canViewHouseholdReports: true,
            }
          : permissions,
    });

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleSaveEdit = (user: FamilyUser) => {
    updateFamilyUser(user);
    setEditingUser(null);
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </span>
              <h2 className="text-2xl font-bold text-slate-800">
                Family Members & Permissions
              </h2>
              <GuideButton
                guideId="family-wallets"
                onOpenGuide={(id) => setIsGuideOpenWithId(id)}
              />
            </div>
            <p className="text-sm text-slate-500 max-w-2xl">
              Control household access. Assign Admin vs. Member roles, customize which wallets each member can view or spend from, and manage 9-dot patterns.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Family Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice if logged in as Member */}
      {!isAdmin && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-800 text-xs sm:text-sm flex items-center space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>
            You are currently logged in as a <strong>Member</strong>. Only <strong>Admins</strong> can adjust wallet permissions, create members, or reset patterns.
          </span>
        </div>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {familyUsers.map((user) => {
          const userWallets =
            user.role === 'admin' || user.allowedWalletIds.length === 0
              ? wallets
              : wallets.filter((w) => user.allowedWalletIds.includes(w.id));

          return (
            <div
              key={user.id}
              className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* User Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                      style={{ backgroundColor: `${user.color}18` }}
                    >
                      <span>{user.avatar}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-800 text-base">
                          {user.name}
                        </h3>
                        {currentUser?.id === user.id && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          user.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-teal-100 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Edit permissions"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setResetPatternUser(user)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Reset 9-dot pattern"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {familyUsers.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${user.name} from family hub?`)) {
                              deleteFamilyUser(user.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Wallets Allowed */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                    <span className="flex items-center space-x-1">
                      <Wallet className="w-3.5 h-3.5 text-teal-600" />
                      <span>Accessible Wallets ({userWallets.length}):</span>
                    </span>
                    {user.role === 'admin' && (
                      <span className="text-[10px] text-teal-700 font-bold">
                        Full Access
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {userWallets.map((w) => (
                      <span
                        key={w.id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium flex items-center space-x-1 border border-slate-200/70"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: w.color }}
                        />
                        <span>{w.name}</span>
                      </span>
                    ))}
                    {userWallets.length === 0 && (
                      <span className="text-xs text-rose-500 italic">
                        No wallets permitted (read only)
                      </span>
                    )}
                  </div>
                </div>

                {/* Permissions Badges */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Household Reports:</span>
                    <span className="font-semibold text-slate-800">
                      {user.role === 'admin' || user.permissions.canViewHouseholdReports
                        ? 'Household'
                        : 'Personal Only'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Manage Bills:</span>
                    <span className="font-semibold text-slate-800">
                      {user.role === 'admin' || user.permissions.canAddBills ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Savings Goals:</span>
                    <span className="font-semibold text-slate-800">
                      {user.role === 'admin' || user.permissions.canAddGoals ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pattern Lock Status Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>9-Dot Pattern:</span>
                </span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                  Protected ✓
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD MEMBER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                Add Family Member
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!patternStep ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Member Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex (Teen)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 font-medium text-slate-800 bg-white"
                    >
                      <option value="member">Member (Restricted)</option>
                      <option value="admin">Admin (Full Control)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Accent Color
                    </label>
                    <div className="flex items-center space-x-1.5 pt-1.5">
                      {COLORS.slice(0, 5).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            color === c ? 'scale-125 ring-2 ring-teal-500' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Avatar
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatar(emoji)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                          avatar === emoji
                            ? 'bg-teal-500 text-white shadow-md'
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {role === 'member' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Accessible Wallets
                    </label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {wallets.map((w) => {
                        const checked = allowedWalletIds.includes(w.id);
                        return (
                          <label
                            key={w.id}
                            className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-colors ${
                              checked
                                ? 'bg-teal-50/60 border-teal-300'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <span className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: w.color }}
                              />
                              <span>{w.name}</span>
                            </span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAllowedWalletIds((prev) => [...prev, w.id]);
                                } else {
                                  setAllowedWalletIds((prev) =>
                                    prev.filter((id) => id !== w.id)
                                  );
                                }
                              }}
                              className="rounded text-teal-600 focus:ring-teal-400"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setPatternStep(true)}
                    disabled={!name.trim()}
                    className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-teal-500/20"
                  >
                    <span>Set 9-Dot Pattern</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <PatternLock
                  mode="create"
                  size={260}
                  onPatternCreated={(pat) => setNewMemberPattern(pat)}
                  onComplete={() => {
                    handleSaveNewMember();
                  }}
                  onCancel={() => setPatternStep(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                Edit Permissions: {editingUser.name}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      role: e.target.value as UserRole,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 bg-white"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {editingUser.role === 'member' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Allowed Wallets (Member can only see & spend from checked wallets)
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {wallets.map((w) => {
                      const checked = editingUser.allowedWalletIds.includes(w.id);
                      return (
                        <label
                          key={w.id}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-teal-50/60 border-teal-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <span className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: w.color }}
                            />
                            <span>{w.name}</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const newAllowed = e.target.checked
                                ? [...editingUser.allowedWalletIds, w.id]
                                : editingUser.allowedWalletIds.filter(
                                    (id) => id !== w.id
                                  );
                              setEditingUser({
                                ...editingUser,
                                allowedWalletIds: newAllowed,
                              });
                            }}
                            className="rounded text-teal-600 focus:ring-teal-400"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="w-1/3 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveEdit(editingUser)}
                  className="w-2/3 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl shadow-md shadow-teal-500/20"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET PATTERN MODAL */}
      {resetPatternUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                Reset Pattern for {resetPatternUser.name}
              </h3>
              <button
                onClick={() => setResetPatternUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <PatternLock
              mode="create"
              size={260}
              onComplete={(newPattern) => {
                updateFamilyUser({
                  ...resetPatternUser,
                  patternSequence: newPattern,
                });
                setResetPatternUser(null);
              }}
              onCancel={() => setResetPatternUser(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
