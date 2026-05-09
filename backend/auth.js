/* =============================================================
   Auth helpers — JWT, password hashing, middlewares, id generator.

   This replaces the temporary "shim" that used a hard-coded
   CURRENT_USER_ID env var. The shim is still honored as a
   *fallback* in dev so the existing roles continue to work
   even before users are created in DB.
============================================================= */
'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
const BCRYPT_ROUNDS = 10;

// ---- IDs ----------------------------------------------------------
// Firebase-compatible 28-char alphanumeric (so existing seed IDs
// like "3yEiPJ71hbPxaLyVbLyFcFdjY0b2" stay sortable next to new ones).
const ID_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function genId(len = 28) {
  const bytes = crypto.randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return s;
}

// ---- Passwords ----------------------------------------------------
async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}
async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

// ---- Tokens -------------------------------------------------------
function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_) {
    return null;
  }
}

// ---- Middlewares --------------------------------------------------
/**
 * "Soft" auth: parses Authorization header, sets req.user if valid.
 * Does NOT 401 on missing/bad token — anonymous browsing is allowed
 * for public endpoints. Routes that need auth use requireAuth.
 *
 * Dev fallback: if no token AND CURRENT_USER_ID env is set, we treat
 * that user as authenticated. Matches old behaviour of the shim.
 */
async function attachUser(req, res, next) {
  try {
    let userId = null;

    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      const payload = verifyToken(auth.slice(7));
      if (payload?.sub) userId = payload.sub;
    }

    if (!userId && process.env.CURRENT_USER_ID) {
      userId = process.env.CURRENT_USER_ID;
    }

    if (userId) {
      const r = await query(
        `SELECT id, role, name, email, phone, avatar_url, age_text, level_name,
                is_active, created_at
           FROM users WHERE id = $1`,
        [userId]
      );
      if (r.rows.length && r.rows[0].is_active !== false) {
        req.user = r.rows[0];
      }
    }
    next();
  } catch (err) {
    // Don't crash the request just because the token couldn't be checked.
    console.error('[auth] attachUser failed:', err.message);
    next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

/** Strip sensitive fields before returning a user object to the client. */
function publicUser(u) {
  if (!u) return null;
  const {
    id, role, name, email, phone, avatar_url, age_text, level_name,
    is_active, created_at,
  } = u;
  return {
    id, role, name, email, phone, avatar_url, age_text, level_name,
    is_active, created_at,
  };
}

module.exports = {
  genId,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  attachUser,
  requireAuth,
  requireRole,
  publicUser,
};
