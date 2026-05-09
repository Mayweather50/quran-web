/* =============================================================
   /api/users — current user + lookup by id + avatar upload
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');
const { requireAuth } = require('../auth');

const SELECT_USER = `
  SELECT id, role, name, email, phone, avatar_url, age_text, level_name, created_at
  FROM users
  WHERE id = $1
`;

async function fetchUser(id, res) {
  const r = await query(SELECT_USER, [id]);
  if (!r.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(r.rows[0]);
}

// GET /api/users/me — current user (from auth shim)
router.get('/me', async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    await fetchUser(req.user.id, res);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/me/avatar  body: { avatar_url: "data:image/jpeg;base64,..." | null }
// We accept a data URL (the frontend resizes the image client-side
// to under ~150 KB before sending), or null to clear the avatar.
router.patch('/me/avatar', requireAuth, async (req, res, next) => {
  try {
    let url = req.body?.avatar_url;
    if (url !== null && url !== undefined) {
      url = String(url);
      if (!/^(data:image\/(png|jpe?g|webp|gif);base64,|https?:\/\/)/i.test(url)) {
        return res.status(400).json({ error: 'avatar_url must be a data: image URL or http(s) URL' });
      }
      // Sanity-cap size at ~512KB encoded — refuse anything bigger
      // so we don't fill the row with megabyte-large photos.
      if (url.length > 700_000) {
        return res.status(413).json({ error: 'Image too large — please pick a smaller photo' });
      }
    } else {
      url = null;
    }
    await query('UPDATE users SET avatar_url = $1 WHERE id = $2', [url, req.user.id]);
    res.json({ ok: true, avatar_url: url });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    await fetchUser(req.params.id, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
