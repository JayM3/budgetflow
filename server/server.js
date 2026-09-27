import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { hashPattern, verifyPattern, createSession, getSession } from './auth.js';

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

// Session middleware helper
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = authHeader.replace('Bearer ', '');
  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  req.user = session;
  next();
}

/* =========================================================
   PUBLIC / SETUP API ENDPOINTS
   ========================================================= */

// 1. Server Status
app.get('/api/status', (req, res) => {
  const state = db.getState();
  res.json({
    status: 'online',
    mode: 'self-hosted-family-hub',
    isSetupCompleted: state.householdSettings.isSetupCompleted,
    householdName: state.householdSettings.householdName || 'BudgetFlow Family Hub',
    currency: state.householdSettings.currency || 'NOK',
    currencySymbol: state.householdSettings.currencySymbol || 'kr',
    lanIp: getLocalIp(),
    port: PORT,
  });
});

// 2. Initial Setup (First time installation clean slate)
app.post('/api/setup', (req, res) => {
  const state = db.getState();
  if (state.householdSettings.isSetupCompleted) {
    return res.status(400).json({ error: 'Setup is already completed.' });
  }

  const { householdName, currency, currencySymbol, adminUser, initialWallets } = req.body;
  if (!adminUser || !adminUser.name) {
    return res.status(400).json({ error: 'Admin user details required.' });
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

  const configuredWallets = (initialWallets || []).map((w, i) => ({
    id: w.id || `wallet_${i + 1}`,
    name: w.name,
    type: w.type || 'checking',
    balance: Number(w.balance) || 0,
    color: w.color || '#0d9488',
    isShared: true,
  }));

  db.setState({
    householdSettings: {
      householdName: householdName || 'Our Family Hub',
      currency: currency || 'NOK',
      currencySymbol: currencySymbol || 'kr',
      isSetupCompleted: true,
    },
    users: [newAdmin],
    wallets: configuredWallets,
    transactions: [],
    bills: [],
    goals: [],
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
    allowedWalletIds: state.wallets.map((w) => w.id), // Access to household shared wallets
    permissions: {
      canAddBills: false,
      canAddGoals: true,
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

/* =========================================================
   AUTHENTICATED DATA APIS (WALLET-PERMISSION FILTERED)
   ========================================================= */

// 5. Get Financial Data (Filtered according to user's wallet permissions)
app.get('/api/data', authenticate, (req, res) => {
  const state = db.getState();
  const user = req.user;

  // Wallet filtering
  const isUserAdmin = user.role === 'admin';
  const allowedWallets = isUserAdmin || !user.allowedWalletIds || user.allowedWalletIds.length === 0
    ? state.wallets
    : state.wallets.filter((w) => user.allowedWalletIds.includes(w.id));

  const allowedWalletIdsSet = new Set(allowedWallets.map((w) => w.id));

  // Transactions filtering: only show transactions belonging to permitted wallets
  const visibleTransactions = state.transactions.filter(
    (tx) => !tx.walletId || allowedWalletIdsSet.has(tx.walletId)
  );

  res.json({
    householdSettings: state.householdSettings,
    wallets: allowedWallets,
    categories: state.categories,
    transactions: visibleTransactions,
    bills: state.bills,
    goals: state.goals,
    allUsers: isUserAdmin
      ? state.users.map((u) => ({
          id: u.id,
          name: u.name,
          role: u.role,
          avatar: u.avatar,
          color: u.color,
          allowedWalletIds: u.allowedWalletIds || [],
          permissions: u.permissions,
        }))
      : undefined,
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

  const newTx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    merchant: txData.merchant,
    category: txData.category,
    amount: Number(txData.amount) || 0,
    type: txData.type || 'expense',
    date: txData.date || new Date().toISOString().split('T')[0],
    walletId: txData.walletId,
    notes: txData.notes,
    userId: user.userId,
    userName: user.name,
  };

  // Adjust wallet balance
  const updatedWallets = state.wallets.map((w) => {
    if (w.id === newTx.walletId) {
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

  res.json({ success: true, transaction: newTx });
});

// 7. Delete Transaction
app.delete('/api/transactions/:id', authenticate, (req, res) => {
  const state = db.getState();
  const tx = state.transactions.find((t) => t.id === req.params.id);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // Adjust balance back
  const updatedWallets = state.wallets.map((w) => {
    if (w.id === tx.walletId) {
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

  res.json({ success: true });
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
    id: `user_${Date.now()}`,
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

  const updatedUsers = state.users.map((u) =>
    u.id === req.params.id ? { ...u, ...updates } : u
  );

  db.setState({ users: updatedUsers });
  res.json({ success: true });
});

// 10. Admin: Delete Family Member
app.delete('/api/admin/users/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can remove family members.' });
  }
  const state = db.getState();
  db.setState({
    users: state.users.filter((u) => u.id !== req.params.id),
  });
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

app.listen(PORT, '0.0.0.0', () => {
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
