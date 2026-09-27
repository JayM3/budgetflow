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

// In-memory sessions store
const sessions = new Map();

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
  return token;
}

export function getSession(token) {
  if (!token) return null;
  return sessions.get(token) || null;
}

export function removeSession(token) {
  if (token) sessions.delete(token);
}

export function updateSessionsForUser(userId, updates) {
  for (const [token, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.set(token, { ...session, ...updates });
    }
  }
}

export function removeSessionsForUser(userId) {
  for (const [token, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(token);
    }
  }
}
