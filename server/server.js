import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { hashPattern, verifyPattern, createSession, getSession, updateSessionsForUser, removeSessionsForUser } from './auth.js';
import { checkForUpdate, runUpdate } from './cli/updater.js';
import { restartServerGracefully } from './cli/processManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Serve static frontend build if it exists
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Helper: Get Local LAN IPv4 Address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Helper to resolve user from token, header, or body, falling back to household admin
function resolveHouseholdUser(req) {
  const state = db.getState();
  const users = state.users || [];
  if (users.length === 0) return null;

  // 1. Try Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token && token !== 'null' && token !== 'undefined') {
      const session = getSession(token);
      if (session) {
        const dbUser = users.find((u) => u.id === session.userId);
        if (dbUser) return dbUser;
      }
    }
  }

  // 2. Try explicit userId in header or body
  const explicitUserId = req.headers['x-user-id'] || req.body?.userId;
  if (explicitUserId) {
    const dbUser = users.find((u) => u.id === explicitUserId);
    if (dbUser) return dbUser;
  }

  // 3. Fallback to Admin or first user in household for LAN resilience
  const adminUser = users.find((u) => u.role === 'admin') || users[0];
  return adminUser || null;
}

// Session middleware helper
function authenticate(req, res, next) {
  const user = resolveHouseholdUser(req);
  if (!user) {
    return res.status(401).json({ error: 'No household users found. Please complete setup.' });
  }

  req.user = {
    userId: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    color: user.color,
    allowedWalletIds: user.allowedWalletIds || [],
    permissions: user.permissions || {
      canAddBills: true,
      canAddGoals: user.role === 'admin',
      canEditBudgets: user.role === 'admin',
      canViewHouseholdReports: user.role === 'admin',
    },
  };
  next();
}

function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token && token !== 'null' && token !== 'undefined') {
      const session = getSession(token);
      if (session) {
        const state = db.getState();
        const dbUser = state.users?.find((u) => u.id === session.userId);
        if (dbUser) {
          req.user = {
            userId: dbUser.id,
            name: dbUser.name,
            role: dbUser.role,
            avatar: dbUser.avatar,
            color: dbUser.color,
            allowedWalletIds: dbUser.allowedWalletIds || [],
            permissions: dbUser.permissions || {
              canAddBills: true,
              canAddGoals: dbUser.role === 'admin',
              canEditBudgets: dbUser.role === 'admin',
              canViewHouseholdReports: dbUser.role === 'admin',
            },
            sessionCreatedAt: session.createdAt,
          };
          return next();
        }
      }
    }
  }
  req.user = null;
  next();
}

// Activity Audit Log helper
function addActivityLog(action, entity, description, user, details) {
  try {
    const state = db.getState();
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: user?.userId || user?.id || 'system',
      userName: user?.name || 'Admin',
      action,
      entity,
      description,
      details,
    };
    const logs = [log, ...(state.activityLogs || [])].slice(0, 200);
    db.setState({ activityLogs: logs });
    return log;
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}

/* =========================================================
   PUBLIC / SETUP API ENDPOINTS
   ========================================================= */

// 1. Server Status
app.get('/api/status', (req, res) => {
  const state = db.getState();
  const isConfigured = Boolean(
    state.householdSettings?.isSetupCompleted ||
    (state.users && state.users.length > 0)
  );
  res.json({
    status: 'online',
    mode: 'self-hosted-family-hub',
    isSetupCompleted: isConfigured,
    householdName: state.householdSettings?.householdName || 'BudgetFlow Family Hub',
    currency: state.householdSettings?.currency || 'NOK',
    currencySymbol: state.householdSettings?.currencySymbol || 'kr',
    hasUsers: Boolean(state.users && state.users.length > 0),
    userCount: (state.users || []).length,
    lanIp: getLocalIp(),
    port: PORT,
  });
});

// 1b. Live iCalendar Subscription Feed (RFC 5545) for Device Calendar Sync
app.get('/api/calendar/feed.ics', (req, res) => {
  const state = db.getState();
  const currencySymbol = state.householdSettings.currencySymbol || 'kr';

  const formatIcalDate = (dStr) => {
    if (!dStr) return new Date().toISOString().replace(/[-:]/g, '').split('T')[0];
    return dStr.split('T')[0].replace(/-/g, '');
  };

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BudgetFlow Hub//Recurring Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${(state.householdSettings.householdName || 'BudgetFlow') + ' Recurring Finances'}`,
    'X-WR-TIMEZONE:UTC',
  ];

  // Bills and Recurring Income
  (state.bills || []).forEach((b) => {
    const isIncome = b.type === 'income';
    const cleanDate = formatIcalDate(b.dueDate);
    const summary = isIncome
      ? `💰 +${b.amount} ${currencySymbol} - ${b.name}`
      : `🧾 Due: ${b.name} (${b.amount} ${currencySymbol})`;
    const desc = `${isIncome ? 'Recurring Income' : 'Scheduled Bill'}: ${b.name}\\nAmount: ${b.amount} ${currencySymbol}\\nCategory: ${b.category}\\nFrequency: ${b.frequency}\\nStatus: ${b.isPaid ? 'Completed/Paid' : 'Pending'}`;
    const freqUpper = (b.frequency || 'monthly').toUpperCase();
    const rrule = freqUpper === 'WEEKLY' ? 'RRULE:FREQ=WEEKLY' : freqUpper === 'YEARLY' ? 'RRULE:FREQ=YEARLY' : 'RRULE:FREQ=MONTHLY';

    icsLines.push(
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

  // Savings Goals target milestones
  (state.goals || []).forEach((g) => {
    if (g.targetDate) {
      const cleanDate = formatIcalDate(g.targetDate);
      icsLines.push(
        'BEGIN:VEVENT',
        `UID:goal-${g.id}@budgetflow`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;VALUE=DATE:${cleanDate}`,
        `SUMMARY:🎯 Target: ${g.name} (${g.targetAmount} ${currencySymbol})`,
        `DESCRIPTION:Target milestone for savings goal '${g.name}'. Target: ${g.targetAmount} ${currencySymbol}`,
        'END:VEVENT'
      );
    }
  });

  icsLines.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="budgetflow_calendar.ics"');
  res.send(icsLines.join('\r\n'));
});

// 2. Initial Setup (First time installation clean slate)
app.post('/api/setup', (req, res) => {
  const state = db.getState();

  // Strict lockdown: Never allow setup if household is already configured or has users/transactions
  const hasExistingHousehold =
    Boolean(state.householdSettings?.isSetupCompleted) ||
    (Array.isArray(state.users) && state.users.length > 0) ||
    (Array.isArray(state.transactions) && state.transactions.length > 0);

  if (hasExistingHousehold) {
    return res.status(403).json({
      error: 'Household setup has already been completed on this Hub. New devices should log in or join as a family member.',
      isSetupCompleted: true,
    });
  }

  const { householdName, currency, currencySymbol, adminUser, initialWallets } = req.body;
  if (!adminUser || !adminUser.name) {
    return res.status(400).json({ error: 'Admin user details required.' });
  }

  // Create an automated safety backup snapshot before applying initial setup
  try {
    db.createBackup();
  } catch (err) {
    console.error('Failed to create pre-setup safety backup:', err);
  }

  // Hash Admin pattern
  const patternSeq = adminUser.patternSequence || [0, 1, 2, 4];
  const { hash, salt } = hashPattern(patternSeq);

  const newAdmin = {
    id: 'admin_1',
    name: adminUser.name,
    role: 'admin',
    avatar: adminUser.avatar || '👑',
    color: adminUser.color || '#0d9488',
    patternHash: hash,
    salt,
    allowedWalletIds: [], // All wallets
    permissions: {
      canAddBills: true,
      canAddGoals: true,
      canEditBudgets: true,
      canViewHouseholdReports: true,
    },
  };

  const configuredWallets = (initialWallets && initialWallets.length > 0)
    ? initialWallets.map((w, i) => ({
        id: w.id || `wallet_${i + 1}`,
        name: w.name,
        type: w.type || 'checking',
        balance: Number(w.balance) || 0,
        color: w.color || '#0d9488',
        isShared: true,
      }))
    : (state.wallets && state.wallets.length > 0)
    ? state.wallets
    : [
        { id: 'wallet_1', name: 'Family Checking', type: 'checking', balance: 0, color: '#0d9488', isShared: true },
        { id: 'wallet_2', name: 'Emergency Savings', type: 'savings', balance: 0, color: '#0284c7', isShared: true },
        { id: 'wallet_3', name: 'Cash Wallet', type: 'cash', balance: 0, color: '#10b981', isShared: true },
      ];

  db.setState({
    householdSettings: {
      householdName: householdName || 'Our Family Hub',
      currency: currency || 'NOK',
      currencySymbol: currencySymbol || 'kr',
      isSetupCompleted: true,
    },
    users: [newAdmin],
    wallets: configuredWallets,
    transactions: state.transactions && state.transactions.length > 0 ? state.transactions : [],
    bills: state.bills && state.bills.length > 0 ? state.bills : [],
    goals: state.goals && state.goals.length > 0 ? state.goals : [],
  });

  const sessionToken = createSession(newAdmin);
  res.json({
    success: true,
    token: sessionToken,
    user: {
      id: newAdmin.id,
      name: newAdmin.name,
      role: newAdmin.role,
      avatar: newAdmin.avatar,
      color: newAdmin.color,
      allowedWalletIds: [],
      permissions: newAdmin.permissions,
    },
  });
});

// 3. List Family Users (Public info for family portal / lockscreen)
app.get('/api/users', (req, res) => {
  const state = db.getState();
  const safeUsers = state.users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    avatar: u.avatar,
    color: u.color,
    theme: u.theme,
    allowedWalletIds: u.allowedWalletIds || [],
    permissions: u.permissions,
    hasPattern: Boolean(u.patternHash),
  }));
  res.json(safeUsers);
});

// 4. Verify 9-Dot Pattern for User Login
app.post('/api/auth/verify-pattern', (req, res) => {
  const { userId, pattern } = req.body;
  if (!userId || !pattern || !Array.isArray(pattern)) {
    return res.status(400).json({ error: 'User ID and pattern sequence required.' });
  }

  const state = db.getState();
  const user = state.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // If user has patternHash, verify it
  if (user.patternHash && user.salt) {
    const isValid = verifyPattern(pattern, user.patternHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect 9-dot pattern.' });
    }
  }

  const token = createSession(user);
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      color: user.color,
      allowedWalletIds: user.allowedWalletIds || [],
      permissions: user.permissions,
    },
  });
});

// 4b. Member Self-Registration (Other devices joining the household)
app.post('/api/auth/register-member', (req, res) => {
  const state = db.getState();
  if (!state.householdSettings.isSetupCompleted) {
    return res.status(400).json({ error: 'Household setup must be completed by an admin first.' });
  }

  const { name, avatar, color, patternSequence } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!patternSequence || !Array.isArray(patternSequence) || patternSequence.length < 3) {
    return res.status(400).json({ error: 'Please draw a pattern connecting at least 3 dots.' });
  }

  const { hash, salt } = hashPattern(patternSequence);

  const newMember = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    role: 'member', // Strictly member
    avatar: avatar || '👤',
    color: color || '#0d9488',
    patternHash: hash,
    salt,
    allowedWalletIds: state.wallets.length > 0 ? [state.wallets[0].id] : [],
    permissions: {
      canAddBills: true,
      canAddGoals: false,
      canEditBudgets: false,
      canViewHouseholdReports: false,
    },
  };

  db.setState({ users: [...state.users, newMember] });

  const token = createSession(newMember);
  res.json({
    success: true,
    token,
    user: {
      id: newMember.id,
      name: newMember.name,
      role: newMember.role,
      avatar: newMember.avatar,
      color: newMember.color,
      allowedWalletIds: newMember.allowedWalletIds,
      permissions: newMember.permissions,
    },
  });
});

// 4c. Current Authenticated User Info
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.userId,
      name: req.user.name,
      role: req.user.role,
      avatar: req.user.avatar,
      color: req.user.color,
      allowedWalletIds: req.user.allowedWalletIds || [],
      permissions: req.user.permissions || {},
    },
  });
});

/* =========================================================
   AUTHENTICATED DATA APIS (WALLET-PERMISSION FILTERED)
   ========================================================= */

function getTodayISOServer() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function calculateNextDueDateServer(currentDueDateStr, frequency = 'monthly') {
  if (!currentDueDateStr) return getTodayISOServer();
  const parts = currentDueDateStr.split('T')[0].split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  if (isNaN(y) || isNaN(m) || isNaN(d)) return getTodayISOServer();
  const pad = (n) => String(n).padStart(2, '0');

  if (frequency === 'weekly') {
    const dt = new Date(y, m, d + 7);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  }
  if (frequency === 'biweekly') {
    const dt = new Date(y, m, d + 14);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  }
  if (frequency === 'yearly') {
    const targetY = y + 1;
    const maxDays = new Date(targetY, m + 1, 0).getDate();
    const targetD = Math.min(d, maxDays);
    return `${targetY}-${pad(m + 1)}-${pad(targetD)}`;
  }

  // Monthly
  let targetY = y;
  let targetM = m + 1;
  if (targetM > 11) {
    targetY += Math.floor(targetM / 12);
    targetM = targetM % 12;
  }
  const maxDays = new Date(targetY, targetM + 1, 0).getDate();
  const targetD = Math.min(d, maxDays);
  return `${targetY}-${pad(targetM + 1)}-${pad(targetD)}`;
}

function advanceDueDateToFutureServer(currentDueDateStr, frequency = 'monthly', referenceTodayStr) {
  const todayStr = referenceTodayStr || getTodayISOServer();
  let nextDueDate = calculateNextDueDateServer(currentDueDateStr, frequency);
  let iterations = 0;
  while (nextDueDate <= todayStr && iterations < 100) {
    nextDueDate = calculateNextDueDateServer(nextDueDate, frequency);
    iterations++;
  }
  return nextDueDate;
}

function processServerDueBills() {
  const state = db.getState();
  if (!state.bills || !Array.isArray(state.bills)) return;

  const todayStr = getTodayISOServer();
  const dueBills = state.bills.filter((b) => !b.isPaid && b.dueDate <= todayStr);
  if (dueBills.length === 0) return;

  const newBillsToAdd = [];
  const newTransactionsToAdd = [];
  let updatedWallets = [...state.wallets];
  let updatedCategories = [...state.categories];

  const updatedBills = state.bills.map((b) => {
    if (!b.isPaid && b.dueDate <= todayStr) {
      const updated = { ...b, isPaid: true };
      const nextDueDate = advanceDueDateToFutureServer(b.dueDate, b.frequency, todayStr);
      const nextInstance = {
        ...b,
        id: `bill_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        dueDate: nextDueDate,
        isPaid: false,
        paidByUserId: undefined,
      };
      newBillsToAdd.push(nextInstance);

      // Create transaction
      const isPast = b.dueDate < todayStr;
      const tx = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        merchant: b.name,
        category: b.type === 'income' ? 'Income' : b.category,
        amount: b.amount,
        type: b.type === 'income' ? 'income' : 'expense',
        date: b.dueDate,
        createdAt: new Date().toISOString(),
        alreadyHappened: isPast,
        walletId: b.walletId || (state.wallets[0]?.id || ''),
        notes: `Automatic payment on scheduled date (${b.dueDate})`,
        isRecurring: true,
        userId: 'system',
        userName: 'Auto-Pay',
      };
      newTransactionsToAdd.push(tx);

      // Update wallets if not historical
      if (tx.walletId && !tx.alreadyHappened) {
        updatedWallets = updatedWallets.map((w) => {
          if (w.id === tx.walletId) {
            const delta = tx.type === 'income' ? tx.amount : -tx.amount;
            return { ...w, balance: w.balance + delta };
          }
          return w;
        });
      }

      // Update category spent
      if (tx.type === 'expense') {
        updatedCategories = updatedCategories.map((c) => {
          if (c.name.toLowerCase() === tx.category.toLowerCase()) {
            return { ...c, spent: c.spent + tx.amount };
          }
          return c;
        });
      }

      return updated;
    }
    return b;
  });

  db.setState({
    bills: [...updatedBills, ...newBillsToAdd],
    transactions: [...newTransactionsToAdd, ...state.transactions],
    wallets: updatedWallets,
    categories: updatedCategories,
  });
}

// Check due bills on server startup and every 60s
setInterval(processServerDueBills, 60000);

// 5. Get Financial Data (Filtered according to user's wallet permissions, with graceful fallback for kiosk / client mount)
app.get('/api/data', optionalAuthenticate, (req, res) => {
  processServerDueBills();
  const state = db.getState();
  const user = req.user;

  // Wallet filtering
  const isUserAdmin = !user || user.role === 'admin';
  const allowedWallets = isUserAdmin || !user.allowedWalletIds || user.allowedWalletIds.length === 0
    ? state.wallets
    : state.wallets.filter((w) => user.allowedWalletIds.includes(w.id));

  const allowedWalletIdsSet = new Set(allowedWallets.map((w) => w.id));

  // Transactions filtering: only show transactions belonging to permitted wallets
  const visibleTransactions = isUserAdmin
    ? state.transactions
    : state.transactions.filter((tx) => !tx.walletId || allowedWalletIdsSet.has(tx.walletId));

  res.json({
    householdSettings: state.householdSettings,
    wallets: allowedWallets,
    allWallets: state.wallets,
    categories: state.categories,
    transactions: visibleTransactions,
    bills: state.bills,
    goals: state.goals,
    preferences: state.preferences || {},
    activityLogs: state.activityLogs || [],
    merchantRules: state.merchantRules || {},
    updatedAt: state.updatedAt || new Date().toISOString(),
    currentUser: user
      ? {
          id: user.userId,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          color: user.color,
          allowedWalletIds: user.allowedWalletIds || [],
          permissions: user.permissions || {},
        }
      : null,
    allUsers: state.users.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      color: u.color,
      theme: u.theme,
      allowedWalletIds: u.allowedWalletIds || [],
      permissions: u.permissions,
      hasPattern: Boolean(u.patternHash),
    })),
  });
});

// 6. Add Transaction
app.post('/api/transactions', authenticate, (req, res) => {
  const state = db.getState();
  const txData = req.body;
  const user = req.user;

  // Validate wallet permission
  if (
    user.role !== 'admin' &&
    user.allowedWalletIds &&
    user.allowedWalletIds.length > 0 &&
    txData.walletId &&
    !user.allowedWalletIds.includes(txData.walletId)
  ) {
    return res.status(403).json({ error: 'You do not have permission to spend from this wallet.' });
  }

  const todayStr = getTodayISOServer();
  const txDateStr = (txData.date || new Date().toISOString()).split('T')[0];
  const isHistorical = txData.alreadyHappened !== undefined ? Boolean(txData.alreadyHappened) : (txDateStr < todayStr);

  const newTx = {
    id: txData.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    merchant: txData.merchant,
    category: txData.category,
    amount: Number(txData.amount) || 0,
    type: txData.type || 'expense',
    date: txData.date || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    alreadyHappened: isHistorical,
    walletId: txData.walletId,
    notes: txData.notes,
    userId: user.userId,
    userName: user.name,
  };

  // Adjust wallet balance ONLY if not historical
  const updatedWallets = state.wallets.map((w) => {
    if (w.id === newTx.walletId && !newTx.alreadyHappened) {
      const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
      return { ...w, balance: w.balance + delta };
    }
    return w;
  });

  // Adjust category spent
  const updatedCategories = state.categories.map((c) => {
    if (c.name.toLowerCase() === newTx.category.toLowerCase() && newTx.type === 'expense') {
      return { ...c, spent: c.spent + newTx.amount };
    }
    return c;
  });

  const updatedTxs = [newTx, ...state.transactions];

  db.setState({
    transactions: updatedTxs,
    wallets: updatedWallets,
    categories: updatedCategories,
  });

  addActivityLog('create', 'transaction', `Added transaction '${newTx.merchant}' (${newTx.amount})${newTx.alreadyHappened ? ' [Historical]' : ''}`, user);

  res.json({ success: true, transaction: newTx });
});

// 6b. Edit Transaction
app.put('/api/transactions/:id', authenticate, (req, res) => {
  const state = db.getState();
  const oldTx = state.transactions.find((t) => t.id === req.params.id);
  if (!oldTx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  const user = req.user;
  if (user.role !== 'admin' && oldTx.userId && oldTx.userId !== user.userId) {
    return res.status(403).json({ error: 'You can only edit transactions you created.' });
  }

  const updates = req.body;
  const newTx = {
    ...oldTx,
    merchant: updates.merchant !== undefined ? updates.merchant : oldTx.merchant,
    category: updates.category !== undefined ? updates.category : oldTx.category,
    amount: updates.amount !== undefined ? Number(updates.amount) : oldTx.amount,
    type: updates.type !== undefined ? updates.type : oldTx.type,
    date: updates.date !== undefined ? updates.date : oldTx.date,
    alreadyHappened: updates.alreadyHappened !== undefined ? Boolean(updates.alreadyHappened) : oldTx.alreadyHappened,
    walletId: updates.walletId !== undefined ? updates.walletId : oldTx.walletId,
    notes: updates.notes !== undefined ? updates.notes : oldTx.notes,
  };

  // Revert old transaction balance if old was not historical
  let updatedWallets = state.wallets.map((w) => {
    if (w.id === oldTx.walletId && !oldTx.alreadyHappened) {
      const revertDelta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
      return { ...w, balance: w.balance + revertDelta };
    }
    return w;
  });

  // Apply new transaction balance if new is not historical
  updatedWallets = updatedWallets.map((w) => {
    if (w.id === newTx.walletId && !newTx.alreadyHappened) {
      const applyDelta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
      return { ...w, balance: w.balance + applyDelta };
    }
    return w;
  });

  // Revert old category spent
  let updatedCategories = state.categories.map((c) => {
    if (c.name.toLowerCase() === oldTx.category.toLowerCase() && oldTx.type === 'expense') {
      return { ...c, spent: Math.max(0, c.spent - oldTx.amount) };
    }
    return c;
  });

  // Apply new category spent
  updatedCategories = updatedCategories.map((c) => {
    if (c.name.toLowerCase() === newTx.category.toLowerCase() && newTx.type === 'expense') {
      return { ...c, spent: c.spent + newTx.amount };
    }
    return c;
  });

  const updatedTxs = state.transactions.map((t) => (t.id === req.params.id ? newTx : t));

  db.setState({
    transactions: updatedTxs,
    wallets: updatedWallets,
    categories: updatedCategories,
  });

  addActivityLog('update', 'transaction', `Edited transaction '${newTx.merchant}' (${newTx.amount})`, user);

  res.json({ success: true, transaction: newTx });
});

// 7. Delete Transaction
app.delete('/api/transactions/:id', authenticate, (req, res) => {
  const state = db.getState();
  const tx = state.transactions.find((t) => t.id === req.params.id);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // Adjust balance back only if not historical
  const updatedWallets = state.wallets.map((w) => {
    if (w.id === tx.walletId && !tx.alreadyHappened) {
      const delta = tx.type === 'income' ? -tx.amount : tx.amount;
      return { ...w, balance: w.balance + delta };
    }
    return w;
  });

  const updatedCategories = state.categories.map((c) => {
    if (c.name.toLowerCase() === tx.category.toLowerCase() && tx.type === 'expense') {
      return { ...c, spent: Math.max(0, c.spent - tx.amount) };
    }
    return c;
  });

  db.setState({
    transactions: state.transactions.filter((t) => t.id !== req.params.id),
    wallets: updatedWallets,
    categories: updatedCategories,
  });

  addActivityLog('delete', 'transaction', `Deleted transaction '${tx.merchant}'`, req.user);

  res.json({ success: true });
});

// 7b. Category / Budget Management (Create, Update, Remove Budget)
app.post('/api/categories', authenticate, (req, res) => {
  const user = req.user;
  if (user.role !== 'admin' && !user.permissions?.canEditBudgets) {
    return res.status(403).json({ error: 'Permission denied: cannot create budget categories.' });
  }

  const { name, allocated, color, icon } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Budget name is required.' });
  }

  const state = db.getState();
  const newCat = {
    id: req.body.id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    allocated: Number(allocated) || 0,
    spent: 0,
    color: color || '#10b981',
    icon: icon || 'ShoppingBag',
  };

  db.setState({ categories: [...state.categories, newCat] });
  addActivityLog('create', 'budget', `Created budget envelope '${newCat.name}' (Cap: ${newCat.allocated})`, user);
  res.json({ success: true, category: newCat });
});

// 7b-2. Bulk Update Budget Categories
app.put('/api/categories', authenticate, (req, res) => {
  const user = req.user;
  if (user.role !== 'admin' && !user.permissions?.canEditBudgets) {
    return res.status(403).json({ error: 'Permission denied: cannot edit budget categories.' });
  }

  const { categories } = req.body;
  if (!Array.isArray(categories)) {
    return res.status(400).json({ error: 'Categories array is required.' });
  }

  const state = db.getState();
  const currentCategories = state.categories || [];

  const updatedCategories = categories.map((cat) => {
    const existing = currentCategories.find((c) => c.id === cat.id);
    return {
      id: cat.id,
      name: cat.name !== undefined ? String(cat.name).trim() : existing?.name || '',
      allocated: cat.allocated !== undefined ? Number(cat.allocated) : existing?.allocated || 0,
      spent: cat.spent !== undefined ? Number(cat.spent) : existing?.spent || 0,
      color: cat.color || existing?.color || '#10b981',
      icon: cat.icon || existing?.icon || 'ShoppingBag',
    };
  });

  db.setState({ categories: updatedCategories });
  addActivityLog('update', 'budget', `Saved all budget categories allocations (${updatedCategories.length} categories)`, user);
  res.json({ success: true, categories: updatedCategories });
});

app.put('/api/categories/:id', authenticate, (req, res) => {
  const user = req.user;
  if (user.role !== 'admin' && !user.permissions?.canEditBudgets) {
    return res.status(403).json({ error: 'Permission denied: cannot edit budget categories.' });
  }

  const state = db.getState();
  const cat = state.categories.find((c) => c.id === req.params.id);
  if (!cat) {
    return res.status(404).json({ error: 'Budget category not found.' });
  }

  const updates = req.body;
  const updatedCat = {
    ...cat,
    name: updates.name !== undefined ? updates.name.trim() : cat.name,
    allocated: updates.allocated !== undefined ? Number(updates.allocated) : cat.allocated,
    spent: updates.spent !== undefined ? Number(updates.spent) : cat.spent,
    color: updates.color || cat.color,
    icon: updates.icon || cat.icon,
  };

  const updatedCategories = state.categories.map((c) => (c.id === req.params.id ? updatedCat : c));
  db.setState({ categories: updatedCategories });
  addActivityLog('update', 'budget', `Updated budget '${updatedCat.name}' (Cap: ${updatedCat.allocated})`, user);
  res.json({ success: true, category: updatedCat });
});

// Remove Budget function
app.delete('/api/categories/:id', authenticate, (req, res) => {
  const user = req.user;
  if (user.role !== 'admin' && !user.permissions?.canEditBudgets) {
    return res.status(403).json({ error: 'Permission denied: cannot delete budget categories.' });
  }

  const state = db.getState();
  const cat = state.categories.find((c) => c.id === req.params.id);
  if (!cat) {
    return res.status(404).json({ error: 'Budget category not found.' });
  }

  const filteredCategories = state.categories.filter((c) => c.id !== req.params.id);
  db.setState({ categories: filteredCategories });
  addActivityLog('delete', 'budget', `Removed budget envelope '${cat.name}'`, user);
  res.json({ success: true });
});

// 7c. Bills & Recurring Income CRUD
app.post('/api/bills', authenticate, (req, res) => {
  const user = req.user;
  if (user.role !== 'admin' && !user.permissions?.canAddBills) {
    return res.status(403).json({ error: 'Permission denied: cannot add recurring commitments.' });
  }

  const { name, amount, dueDate, category, isPaid, autoPay, frequency, type, walletId } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  const state = db.getState();
  const newBill = {
    id: req.body.id || `bill_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    amount: Number(amount) || 0,
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    category: category || (type === 'income' ? 'Income' : 'Utilities'),
    isPaid: Boolean(isPaid),
    autoPay: Boolean(autoPay),
    frequency: frequency || 'monthly',
    type: type || 'bill',
    walletId: walletId || (state.wallets[0]?.id || ''),
  };

  db.setState({ bills: [...state.bills, newBill] });
  addActivityLog(
    'create',
    'bill',
    `Added ${newBill.type === 'income' ? 'recurring income' : 'bill'} '${newBill.name}' (${newBill.amount})`,
    user
  );
  res.json({ success: true, bill: newBill });
});

app.put('/api/bills/:id', authenticate, (req, res) => {
  const user = req.user;
  if (user.role !== 'admin' && !user.permissions?.canAddBills) {
    return res.status(403).json({ error: 'Permission denied: cannot edit bills.' });
  }

  const state = db.getState();
  const bill = state.bills.find((b) => b.id === req.params.id);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found.' });
  }

  const updates = req.body;
  const updatedBill = {
    ...bill,
    name: updates.name !== undefined ? updates.name.trim() : bill.name,
    amount: updates.amount !== undefined ? Number(updates.amount) : bill.amount,
    dueDate: updates.dueDate !== undefined ? updates.dueDate : bill.dueDate,
    category: updates.category !== undefined ? updates.category : bill.category,
    isPaid: updates.isPaid !== undefined ? Boolean(updates.isPaid) : bill.isPaid,
    autoPay: updates.autoPay !== undefined ? Boolean(updates.autoPay) : bill.autoPay,
    frequency: updates.frequency !== undefined ? updates.frequency : bill.frequency,
    type: updates.type !== undefined ? updates.type : bill.type,
    walletId: updates.walletId !== undefined ? updates.walletId : bill.walletId,
    paidByUserId: updates.paidByUserId !== undefined ? updates.paidByUserId : bill.paidByUserId,
  };

  const updatedBills = state.bills.map((b) => (b.id === req.params.id ? updatedBill : b));
  db.setState({ bills: updatedBills });
  addActivityLog(
    'update',
    'bill',
    `Updated ${updatedBill.type === 'income' ? 'recurring income' : 'bill'} '${updatedBill.name}' (Status: ${updatedBill.isPaid ? 'Paid' : 'Unpaid'})`,
    user
  );
  res.json({ success: true, bill: updatedBill });
});

app.delete('/api/bills/:id', authenticate, (req, res) => {
  const user = req.user;
  if (user.role !== 'admin' && !user.permissions?.canAddBills) {
    return res.status(403).json({ error: 'Permission denied: cannot delete bills.' });
  }

  const state = db.getState();
  const bill = state.bills.find((b) => b.id === req.params.id);
  if (!bill) {
    return res.status(404).json({ error: 'Bill not found.' });
  }

  const filteredBills = state.bills.filter((b) => b.id !== req.params.id);
  db.setState({ bills: filteredBills });
  addActivityLog('delete', 'bill', `Removed ${bill.type === 'income' ? 'recurring income' : 'bill'} '${bill.name}'`, user);
  res.json({ success: true });
});

// 7d. Goals CRUD
app.post('/api/goals', authenticate, (req, res) => {
  const user = req.user;
  if (user.role !== 'admin' && !user.permissions?.canAddGoals) {
    return res.status(403).json({ error: 'Permission denied: cannot create goals.' });
  }

  const { name, targetAmount, currentAmount, targetDate, category, color, walletId, allocationPercentage } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Goal name is required.' });
  }

  const state = db.getState();
  const newGoal = {
    id: req.body.id || `goal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    targetAmount: Number(targetAmount) || 0,
    currentAmount: Number(currentAmount) || 0,
    targetDate: targetDate || new Date().toISOString().split('T')[0],
    category: category || 'Savings',
    color: color || '#0d9488',
    walletId: walletId || undefined,
    allocationPercentage: allocationPercentage !== undefined ? Number(allocationPercentage) : 0,
    contributions: [],
  };

  db.setState({ goals: [...state.goals, newGoal] });
  addActivityLog('create', 'goal', `Created savings goal '${newGoal.name}' (Target: ${newGoal.targetAmount})`, user);
  res.json({ success: true, goal: newGoal });
});

app.put('/api/goals/:id', authenticate, (req, res) => {
  const user = req.user;
  if (user.role !== 'admin' && !user.permissions?.canAddGoals) {
    return res.status(403).json({ error: 'Permission denied: cannot edit goals.' });
  }

  const state = db.getState();
  const goal = state.goals.find((g) => g.id === req.params.id);
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found.' });
  }

  const updates = req.body;
  const updatedGoal = {
    ...goal,
    name: updates.name !== undefined ? updates.name.trim() : goal.name,
    targetAmount: updates.targetAmount !== undefined ? Number(updates.targetAmount) : goal.targetAmount,
    currentAmount: updates.currentAmount !== undefined ? Number(updates.currentAmount) : goal.currentAmount,
    targetDate: updates.targetDate !== undefined ? updates.targetDate : goal.targetDate,
    category: updates.category !== undefined ? updates.category : goal.category,
    color: updates.color || goal.color,
    walletId: updates.walletId !== undefined ? updates.walletId : goal.walletId,
    allocationPercentage: updates.allocationPercentage !== undefined ? Number(updates.allocationPercentage) : goal.allocationPercentage,
    contributions: updates.contributions || goal.contributions,
  };

  const updatedGoals = state.goals.map((g) => (g.id === req.params.id ? updatedGoal : g));
  db.setState({ goals: updatedGoals });
  addActivityLog('update', 'goal', `Updated savings goal '${updatedGoal.name}' (Current: ${updatedGoal.currentAmount}/${updatedGoal.targetAmount})`, user);
  res.json({ success: true, goal: updatedGoal });
});

// Batch leftover / income allocation endpoint
app.post('/api/goals/allocate-leftover', authenticate, (req, res) => {
  const user = req.user;
  const { allocations, sourceWalletId, description } = req.body; // allocations: [{ goalId, amount, targetWalletId }]
  if (!Array.isArray(allocations) || allocations.length === 0) {
    return res.status(400).json({ error: 'Allocations array is required.' });
  }

  const state = db.getState();
  let updatedGoals = [...state.goals];
  let updatedWallets = [...state.wallets];
  let totalAllocated = 0;

  allocations.forEach(({ goalId, amount, targetWalletId }) => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    totalAllocated += amt;

    const gIdx = updatedGoals.findIndex((g) => g.id === goalId);
    if (gIdx !== -1) {
      const g = updatedGoals[gIdx];
      const contribution = {
        userId: user.id,
        userName: user.name,
        amount: amt,
        date: new Date().toISOString(),
        note: description || 'Leftover allocation',
        source: 'leftover_sweep',
        sourceWalletId,
        targetWalletId: targetWalletId || g.walletId,
      };
      updatedGoals[gIdx] = {
        ...g,
        currentAmount: (g.currentAmount || 0) + amt,
        contributions: [contribution, ...(g.contributions || [])],
      };
    }

    // Move money between wallets if requested
    if (sourceWalletId && targetWalletId && sourceWalletId !== targetWalletId) {
      updatedWallets = updatedWallets.map((w) => {
        if (w.id === sourceWalletId) return { ...w, balance: w.balance - amt };
        if (w.id === targetWalletId) return { ...w, balance: w.balance + amt };
        return w;
      });
    }
  });

  db.setState({ goals: updatedGoals, wallets: updatedWallets });
  addActivityLog('rebalance', 'goal', description || `Allocated ${totalAllocated} to savings goals`, user);
  res.json({ success: true, goals: updatedGoals, wallets: updatedWallets });
});

app.delete('/api/goals/:id', authenticate, (req, res) => {
  const user = req.user;
  if (user.role !== 'admin' && !user.permissions?.canAddGoals) {
    return res.status(403).json({ error: 'Permission denied: cannot delete goals.' });
  }

  const state = db.getState();
  const goal = state.goals.find((g) => g.id === req.params.id);
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found.' });
  }

  const filteredGoals = state.goals.filter((g) => g.id !== req.params.id);
  db.setState({ goals: filteredGoals });
  addActivityLog('delete', 'goal', `Removed savings goal '${goal.name}'`, user);
  res.json({ success: true });
});

// 7e. Wallets CRUD (Admin-only for adding, editing, reconciling, deleting)
app.post('/api/wallets', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can add wallets.' });
  }

  const { name, type, balance, limit, color, isShared } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Wallet name is required.' });
  }

  const state = db.getState();
  const newWallet = {
    id: req.body.id || `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim(),
    type: type || 'checking',
    balance: Number(balance) || 0,
    limit: limit !== undefined ? Number(limit) : undefined,
    color: color || '#0d9488',
    isShared: isShared !== undefined ? Boolean(isShared) : true,
  };

  db.setState({ wallets: [...state.wallets, newWallet] });
  addActivityLog('create', 'wallet', `Added new wallet '${newWallet.name}' (${newWallet.type}, balance: ${newWallet.balance})`, req.user);
  res.json({ success: true, wallet: newWallet });
});

app.put('/api/wallets/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can edit wallets.' });
  }

  const state = db.getState();
  const wallet = state.wallets.find((w) => w.id === req.params.id);
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found.' });
  }

  const updates = req.body;
  const updatedWallet = {
    ...wallet,
    name: updates.name !== undefined ? updates.name.trim() : wallet.name,
    type: updates.type !== undefined ? updates.type : wallet.type,
    balance: updates.balance !== undefined ? Number(updates.balance) : wallet.balance,
    limit: updates.limit !== undefined ? Number(updates.limit) : wallet.limit,
    color: updates.color || wallet.color,
    isShared: updates.isShared !== undefined ? Boolean(updates.isShared) : wallet.isShared,
  };

  const updatedWallets = state.wallets.map((w) => (w.id === req.params.id ? updatedWallet : w));
  db.setState({ wallets: updatedWallets });
  addActivityLog('reconcile', 'wallet', `Reconciled/Updated wallet '${updatedWallet.name}' (Balance: ${updatedWallet.balance})`, req.user);
  res.json({ success: true, wallet: updatedWallet });
});

app.delete('/api/wallets/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can remove wallets.' });
  }

  const state = db.getState();
  if (state.wallets.length <= 1) {
    return res.status(400).json({ error: 'Cannot delete the only remaining wallet in the household.' });
  }

  const wallet = state.wallets.find((w) => w.id === req.params.id);
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found.' });
  }

  const filteredWallets = state.wallets.filter((w) => w.id !== req.params.id);
  db.setState({ wallets: filteredWallets });
  addActivityLog('delete', 'wallet', `Removed wallet '${wallet.name}'`, req.user);
  res.json({ success: true });
});

// 7f. Get Activity Logs
app.get('/api/activity-logs', authenticate, (req, res) => {
  const state = db.getState();
  res.json(state.activityLogs || []);
});

// 8. Admin: Add Family Member
app.post('/api/admin/users', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can manage family members.' });
  }

  const { name, role, avatar, color, patternSequence, allowedWalletIds, permissions } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const { hash, salt } = hashPattern(patternSequence || [0, 1, 2, 4]);

  const newUser = {
    id: req.body.id || `user_${Date.now()}`,
    name,
    role: role || 'member',
    avatar: avatar || '👤',
    color: color || '#0d9488',
    patternHash: hash,
    salt,
    allowedWalletIds: allowedWalletIds || [],
    permissions: permissions || {
      canAddBills: false,
      canAddGoals: true,
      canEditBudgets: false,
      canViewHouseholdReports: false,
    },
  };

  const state = db.getState();
  db.setState({ users: [...state.users, newUser] });

  res.json({ success: true, user: newUser });
});

// 9. Admin: Update Family Member Permissions / Pattern
app.put('/api/admin/users/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can manage family members.' });
  }

  const state = db.getState();
  const user = state.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const updates = req.body;
  if (updates.patternSequence && Array.isArray(updates.patternSequence)) {
    const { hash, salt } = hashPattern(updates.patternSequence);
    updates.patternHash = hash;
    updates.salt = salt;
    delete updates.patternSequence;
  }

  // If promoted to admin, grant full permissions and wallet access
  if (updates.role === 'admin') {
    updates.allowedWalletIds = [];
    updates.permissions = {
      canAddBills: true,
      canAddGoals: true,
      canEditBudgets: true,
      canViewHouseholdReports: true,
      ...(updates.permissions || {}),
    };
  }

  const updatedUsers = state.users.map((u) =>
    u.id === req.params.id ? { ...u, ...updates } : u
  );

  db.setState({ users: updatedUsers });

  // Update in-memory sessions for user immediately
  updateSessionsForUser(req.params.id, {
    role: updates.role || user.role,
    name: updates.name || user.name,
    allowedWalletIds: updates.allowedWalletIds !== undefined ? updates.allowedWalletIds : user.allowedWalletIds,
    permissions: updates.permissions || user.permissions,
  });

  const finalUser = updatedUsers.find((u) => u.id === req.params.id);
  addActivityLog('update', 'user', `Updated user '${user.name}' (${updates.role || user.role})`, req.user);

  res.json({ success: true, user: finalUser });
});

// 9b. User: Update Personal Theme Preference
app.put('/api/users/:id/theme', authenticate, (req, res) => {
  const { theme } = req.body || {};
  if (!theme || !['light', 'dark', 'system'].includes(theme)) {
    return res.status(400).json({ error: 'Valid theme (light, dark, system) required.' });
  }

  if (req.user && req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Cannot update theme for another user.' });
  }

  const state = db.getState();
  const user = state.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const updatedUsers = state.users.map((u) =>
    u.id === req.params.id ? { ...u, theme } : u
  );

  db.setState({ users: updatedUsers, updatedAt: new Date().toISOString() });
  res.json({ success: true, theme });
});

// 10. Admin: Delete Family Member
app.delete('/api/admin/users/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can remove family members.' });
  }
  const state = db.getState();
  const user = state.users.find((u) => u.id === req.params.id);
  db.setState({
    users: state.users.filter((u) => u.id !== req.params.id),
  });
  removeSessionsForUser(req.params.id);
  if (user) {
    addActivityLog('delete', 'user', `Removed family member '${user.name}'`, req.user);
  }
  res.json({ success: true });
});

// 11. Full Backup Export & Restore
app.get('/api/backup', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const backupFile = db.createBackup();
  res.download(backupFile);
});

app.post('/api/restore', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (!req.body || !req.body.householdSettings) {
    return res.status(400).json({ error: 'Invalid backup structure' });
  }
  db.setState(req.body);
  res.json({ success: true });
});

// 11b. Universal Full-State Save (Used by Save buttons, hard reload beforeunload, and auto-refresh)
app.post('/api/save-all', authenticate, (req, res) => {
  const user = req.user;
  const state = db.getState();
  const {
    categories,
    transactions,
    bills,
    goals,
    wallets,
    householdSettings,
    users,
    activityLogs,
    preferences,
    merchantRules,
  } = req.body || {};

  const nextState = { updatedAt: new Date().toISOString() };

  if (Array.isArray(categories) && (user.role === 'admin' || user.permissions?.canEditBudgets)) {
    nextState.categories = categories.map((cat) => ({
      id: cat.id,
      name: String(cat.name || '').trim(),
      allocated: Number(cat.allocated) || 0,
      spent: Number(cat.spent) || 0,
      color: cat.color || '#10b981',
      icon: cat.icon || 'ShoppingBag',
    }));
  }

  // Anti-Wipe Safeguard: Block accidental empty-state wipes when server already has populated collections
  const allowEmptyWipe = Boolean(req.body && req.body.allowEmptyWipe);

  if (Array.isArray(transactions)) {
    if (transactions.length === 0 && (state.transactions || []).length > 0 && !allowEmptyWipe) {
      console.warn('[Safety Guard] Blocked attempt to wipe existing transactions with empty array via /api/save-all');
    } else {
      nextState.transactions = transactions;
    }
  }

  if (Array.isArray(bills) && (user.role === 'admin' || user.permissions?.canAddBills)) {
    if (bills.length === 0 && (state.bills || []).length > 0 && !allowEmptyWipe) {
      console.warn('[Safety Guard] Blocked attempt to wipe existing bills with empty array via /api/save-all');
    } else {
      nextState.bills = bills;
    }
  }

  if (Array.isArray(goals) && (user.role === 'admin' || user.permissions?.canAddGoals)) {
    if (goals.length === 0 && (state.goals || []).length > 0 && !allowEmptyWipe) {
      console.warn('[Safety Guard] Blocked attempt to wipe existing goals with empty array via /api/save-all');
    } else {
      nextState.goals = goals;
    }
  }

  if (Array.isArray(wallets) && user.role === 'admin') {
    if (wallets.length === 0 && (state.wallets || []).length > 0 && !allowEmptyWipe) {
      console.warn('[Safety Guard] Blocked attempt to wipe existing wallets with empty array via /api/save-all');
    } else {
      nextState.wallets = wallets;
    }
  }

  if (householdSettings && typeof householdSettings === 'object' && user.role === 'admin') {
    nextState.householdSettings = { ...state.householdSettings, ...householdSettings };
  }

  if (Array.isArray(users) && user.role === 'admin') {
    if (users.length === 0 && (state.users || []).length > 0 && !allowEmptyWipe) {
      console.warn('[Safety Guard] Blocked attempt to wipe all users with empty array via /api/save-all');
    } else {
      const mergedUsers = users.map((u) => {
        const existing = state.users.find((eu) => eu.id === u.id);
        return {
          ...u,
          patternHash: u.patternHash || existing?.patternHash,
          salt: u.salt || existing?.salt,
        };
      });
      nextState.users = mergedUsers;
    }
  }

  if (Array.isArray(activityLogs)) {
    nextState.activityLogs = activityLogs.slice(0, 200);
  }

  if (preferences && typeof preferences === 'object') {
    const cleanPrefs = { ...preferences };
    delete cleanPrefs.theme;
    nextState.preferences = { ...(state.preferences || {}), ...cleanPrefs };
  }

  if (merchantRules && typeof merchantRules === 'object') {
    nextState.merchantRules = { ...(state.merchantRules || {}), ...merchantRules };
  }

  if (Object.keys(nextState).length > 0) {
    db.setState(nextState);
    addActivityLog('update', 'system', 'Universal financial data save executed', user);
  }

  res.json({ success: true, savedAt: new Date().toISOString() });
});

// 11c. Bulk Import Transactions
app.post('/api/transactions/bulk', authenticate, (req, res) => {
  const state = db.getState();
  const user = req.user;
  const { transactions } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'Transactions array required.' });
  }

  const nowIso = new Date().toISOString();
  const newTransactions = transactions.map((t, idx) => ({
    id: t.id || `tx_import_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
    merchant: String(t.merchant || 'Unknown').trim(),
    category: String(t.category || 'Uncategorized').trim(),
    amount: Number(t.amount) || 0,
    type: t.type || 'expense',
    date: t.date || nowIso,
    createdAt: t.createdAt || nowIso,
    alreadyHappened: t.alreadyHappened !== undefined ? Boolean(t.alreadyHappened) : true,
    walletId: t.walletId || null,
    notes: t.notes || '',
    userId: t.userId || user?.userId || 'admin_1',
    userName: t.userName || user?.name || 'Admin',
  }));

  const updatedTxs = [...newTransactions, ...state.transactions];

  db.setState({
    transactions: updatedTxs,
    updatedAt: new Date().toISOString(),
  });

  addActivityLog('create', 'transaction', `Bulk imported ${newTransactions.length} transactions`, user);

  res.json({ success: true, count: newTransactions.length, transactions: newTransactions });
});

// 11d. Household Preferences Endpoints
app.get('/api/preferences', (req, res) => {
  const state = db.getState();
  res.json(state.preferences || {});
});

app.put('/api/preferences', authenticate, (req, res) => {
  const state = db.getState();
  const user = req.user;
  const updates = { ...(req.body || {}) };
  delete updates.theme;

  const updatedPreferences = {
    ...(state.preferences || {}),
    ...updates,
  };
  delete updatedPreferences.theme;

  db.setState({
    preferences: updatedPreferences,
    updatedAt: new Date().toISOString(),
  });

  addActivityLog('update', 'system', 'Updated household preferences', user);
  res.json({ success: true, preferences: updatedPreferences });
});

// 11e. Merchant Rules Endpoint
app.post('/api/merchant-rules', (req, res) => {
  const { merchant, category } = req.body || {};
  if (!merchant || !category) {
    return res.status(400).json({ error: 'Merchant and category are required' });
  }

  const state = db.getState();
  const cleanMerchant = String(merchant).trim().toLowerCase();
  const cleanCategory = String(category).trim();

  const rules = { ...(state.merchantRules || {}), [cleanMerchant]: cleanCategory };
  db.setState({ merchantRules: rules, updatedAt: new Date().toISOString() });

  res.json({ success: true, rules });
});

// 11f. Migrate / Sync Client Local Data to Server Host
app.post('/api/sync/migrate-from-client', authenticate, (req, res) => {
  const state = db.getState();
  const user = req.user;
  const clientData = req.body || {};

  const nextState = { updatedAt: new Date().toISOString() };

  // Only import / populate if server collection is empty or if forced
  if ((!state.transactions || state.transactions.length === 0) && Array.isArray(clientData.transactions) && clientData.transactions.length > 0) {
    nextState.transactions = clientData.transactions;
  }
  if ((!state.bills || state.bills.length === 0) && Array.isArray(clientData.bills) && clientData.bills.length > 0) {
    nextState.bills = clientData.bills;
  }
  if ((!state.goals || state.goals.length === 0) && Array.isArray(clientData.goals) && clientData.goals.length > 0) {
    nextState.goals = clientData.goals;
  }
  if ((!state.categories || state.categories.length === 0) && Array.isArray(clientData.categories) && clientData.categories.length > 0) {
    nextState.categories = clientData.categories;
  }
  if ((!state.wallets || state.wallets.length === 0) && Array.isArray(clientData.wallets) && clientData.wallets.length > 0) {
    nextState.wallets = clientData.wallets;
  }
  if (clientData.preferences && typeof clientData.preferences === 'object') {
    nextState.preferences = { ...(state.preferences || {}), ...clientData.preferences };
  }
  if (clientData.merchantRules && typeof clientData.merchantRules === 'object') {
    nextState.merchantRules = { ...(state.merchantRules || {}), ...clientData.merchantRules };
  }

  if (Object.keys(nextState).length > 1) {
    db.setState(nextState);
    addActivityLog('create', 'system', 'Migrated client local storage data to server host', user);
  }

  res.json({ success: true, state: db.getState() });
});

// 12. Check For Updates (Admin only)
app.get('/api/system/check-update', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const status = await checkForUpdate();
    res.json({
      success: true,
      repo: status.repo,
      currentVersion: status.currentVersion,
      latestVersion: status.release?.tagName || status.latestCommit || status.currentVersion,
      updateAvailable: status.updateAvailable,
      releaseNotes: status.release?.body || (status.latestCommit ? `Latest commit: ${status.latestCommit}` : undefined),
      publishedAt: status.release?.publishedAt,
      commitsBehind: status.commitsBehind,
      isGit: status.isGit,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Execute Self-Update (Admin only, SSE streaming progress)
app.post('/api/system/update', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { force = false, channel = 'main' } = req.body || {};

  // Setup Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (payload) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (_) {}
  };

  try {
    addActivityLog('update', 'system', 'Initiated system software update', req.user);

    sendEvent({
      step: 1,
      totalSteps: 6,
      percent: 5,
      stage: 'init',
      message: 'Initializing update engine...',
      status: 'progress',
    });

    await runUpdate(
      { force, channel, noRestart: true },
      (progress) => sendEvent(progress)
    );

    // Final restart step notification
    sendEvent({
      step: 6,
      totalSteps: 6,
      percent: 100,
      stage: 'restarting',
      message: 'Restarting BudgetFlow server daemon...',
      status: 'progress',
    });

    res.end();

    // Trigger graceful server restart: closes port 5050 and launches new detached instance
    restartServerGracefully(server, 1200);

  } catch (err) {
    sendEvent({
      status: 'error',
      error: err.message || 'Update failed',
      stage: 'error',
      percent: 0,
    });
    res.end();
  }
});

// Fallback all SPA routes to index.html
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>BudgetFlow Hub</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white;">
            <h1>🌊 BudgetFlow Hub Server is Running!</h1>
            <p>Please compile the frontend with <code>npm run build</code> in the project directory.</p>
          </body>
        </html>
      `);
    }
  });
});

const pidFile = path.join(__dirname, 'data', 'budgetflow.pid');

const server = app.listen(PORT, '0.0.0.0', () => {
  try {
    fs.mkdirSync(path.dirname(pidFile), { recursive: true });
    fs.writeFileSync(pidFile, String(process.pid), 'utf-8');
  } catch (_) {}
  const lanIp = getLocalIp();
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                   🌊 BUDGETFLOW FAMILY HUB 🌊                     ║
║            Private, Lightweight Household Finance Server          ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  📱 Local Tablet Access:      http://localhost:${PORT}               ║
║  🏠 Household Wi-Fi Access:   http://${lanIp}:${PORT}          ║
║                                                                   ║
║  Features: Multi-User, 9-Dot Pattern Auth, Tablet Kiosk Mode,     ║
║            Wallet Permissions & Termux / Linux Ready              ║
╚═══════════════════════════════════════════════════════════════════╝
`);
});

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down BudgetFlow server gracefully...`);
  server.close(() => {
    try {
      if (fs.existsSync(pidFile)) {
        const stored = fs.readFileSync(pidFile, 'utf-8').trim();
        if (stored === String(process.pid)) {
          fs.unlinkSync(pidFile);
        }
      }
    } catch (_) {}
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

