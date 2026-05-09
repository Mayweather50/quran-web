/* =============================================================
   /api/auth — register, login, me, change-password
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');
const {
  genId,
  hashPassword,
  verifyPassword,
  signToken,
  requireAuth,
  publicUser,
} = require('../auth');

// Simple email format check (good enough for the UI; DB has the unique index).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------- POST /api/auth/register ----------------
// Body: { name, email, password }
// Always creates a "student" user. Admin/teacher roles are
// promoted later via the admin panel.
router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (name.length < 2)        return res.status(400).json({ error: 'name must be at least 2 chars' });
    if (!EMAIL_RE.test(email))  return res.status(400).json({ error: 'invalid email' });
    if (password.length < 6)    return res.status(400).json({ error: 'password must be at least 6 chars' });

    // Email collision?
    const dup = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (dup.rows.length) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const id = genId();
    const password_hash = await hashPassword(password);

    const ins = await query(
      `INSERT INTO users (id, role, name, email, password_hash, is_active)
       VALUES ($1, 'student', $2, $3, $4, TRUE)
       RETURNING id, role, name, email, phone, avatar_url, age_text, level_name,
                 is_active, created_at`,
      [id, name, email, password_hash]
    );

    const user = ins.rows[0];

    // Bootstrap student_progress so /me/progress doesn't 404 on first call.
    await query(
      `INSERT INTO student_progress (student_id, level_name, lessons_completed, hours_studied)
       VALUES ($1, 'Начальный', 0, 0) ON CONFLICT DO NOTHING`,
      [id]
    );

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ---------------- POST /api/auth/login -------------------
// Body: { email, password }
router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const r = await query(
      `SELECT id, role, name, email, phone, avatar_url, age_text, level_name,
              is_active, created_at, password_hash
         FROM users WHERE email = $1`,
      [email]
    );
    if (!r.rows.length) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    const u = r.rows[0];

    if (u.is_active === false) {
      return res.status(403).json({ error: 'Аккаунт заблокирован' });
    }
    const ok = await verifyPassword(password, u.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    res.json({ token: signToken(u), user: publicUser(u) });
  } catch (err) {
    next(err);
  }
});

// ---------------- GET /api/auth/me -----------------------
router.get('/me', requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

// ---------------- PATCH /api/auth/me ---------------------
// Editable: name, phone, avatar_url
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const updates = {};
    if (typeof req.body?.name === 'string') {
      const v = req.body.name.trim();
      if (v.length < 2) return res.status(400).json({ error: 'name must be at least 2 chars' });
      updates.name = v;
    }
    if (typeof req.body?.phone === 'string') updates.phone = req.body.phone.trim() || null;
    if (typeof req.body?.avatar_url === 'string') updates.avatar_url = req.body.avatar_url.trim() || null;

    const keys = Object.keys(updates);
    if (!keys.length) return res.json(publicUser(req.user));

    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = keys.map((k) => updates[k]);
    vals.push(req.user.id);

    const upd = await query(
      `UPDATE users SET ${sets} WHERE id = $${vals.length}
       RETURNING id, role, name, email, phone, avatar_url, age_text, level_name,
                 is_active, created_at`,
      vals
    );
    res.json(publicUser(upd.rows[0]));
  } catch (err) {
    next(err);
  }
});

// ---------------- POST /api/auth/change-password ---------
// Body: { currentPassword, newPassword }
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const current = String(req.body?.currentPassword || '');
    const next1   = String(req.body?.newPassword     || '');

    if (!current || !next1) return res.status(400).json({ error: 'fields required' });
    if (next1.length < 6)   return res.status(400).json({ error: 'new password must be at least 6 chars' });

    const r = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'user not found' });

    const ok = await verifyPassword(current, r.rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Текущий пароль неверный' });

    const newHash = await hashPassword(next1);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
