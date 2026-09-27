import crypto from 'crypto';

/**
 * Hash a 9-dot pattern sequence [0..8] using Node built-in crypto (PBKDF2)
 */
export function hashPattern(patternSequence, salt = null) {
  const userSalt = salt || crypto.randomBytes(16).toString('hex');
  const patternString = patternSequence.join('-');
  const hash = crypto
    .pbkdf2Sync(patternString, userSalt, 1000, 32, 'sha256')
    .toString('hex');

  return { hash, salt: userSalt };
}

export function verifyPattern(patternSequence, savedHash, salt) {
  const patternString = patternSequence.join('-');
  const computedHash = crypto
    .pbkdf2Sync(patternString, salt, 1000, 32, 'sha256')
    .toString('hex');

  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'hex'),
    Buffer.from(savedHash, 'hex')
  );
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Sessions store with file persistence across daemon restarts
function loadSessionsFromDisk() {
  const map = new Map();
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const obj = JSON.parse(raw);
      for (const [token, data] of Object.entries(obj)) {
        map.set(token, data);
      }
    }
  } catch (e) {
    console.error('Failed to load sessions from disk:', e.message);
  }
  return map;
}

const sessions = loadSessionsFromDisk();

function saveSessionsToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const obj = {};
    for (const [token, data] of sessions.entries()) {
      obj[token] = data;
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save sessions to disk:', e.message);
  }
}

export function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionData = {
    userId: user.id,
    name: user.name,
    role: user.role,
    allowedWalletIds: user.allowedWalletIds || [],
    createdAt: Date.now(),
  };
  sessions.set(token, sessionData);
  saveSessionsToDisk();
  return token;
}

export function getSession(token) {
  if (!token) return null;
  return sessions.get(token) || null;
}

export function removeSession(token) {
  if (token) {
    sessions.delete(token);
    saveSessionsToDisk();
  }
}

export function updateSessionsForUser(userId, updates) {
  for (const [token, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.set(token, { ...session, ...updates });
    }
  }
  saveSessionsToDisk();
}

export function removeSessionsForUser(userId) {
  for (const [token, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(token);
    }
  }
  saveSessionsToDisk();
}
