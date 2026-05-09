/* =============================================================
   /api/chats — 1-1 conversations between users.
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');
const { requireAuth } = require('../auth');

router.use(requireAuth);

function pairOf(a, b) { return a < b ? [a, b] : [b, a]; }

router.get('/', async (req, res, next) => {
  try {
    const me = req.user.id;
    const sql = `
      WITH my_chats AS (
        SELECT c.id, c.user_a, c.user_b, c.pinned, c.last_at,
               CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END AS peer_id
          FROM chats c
         WHERE c.user_a = $1 OR c.user_b = $1
      )
      SELECT
        mc.id, mc.peer_id,
        u.name AS peer_name, u.role AS peer_role, u.avatar_url AS peer_avatar,
        mc.pinned, mc.last_at,
        (SELECT body      FROM messages WHERE chat_id = mc.id ORDER BY created_at DESC LIMIT 1) AS last_body,
        (SELECT sender_id FROM messages WHERE chat_id = mc.id ORDER BY created_at DESC LIMIT 1) AS last_sender,
        (SELECT COUNT(*)::int FROM messages
            WHERE chat_id = mc.id AND sender_id <> $1 AND read_at IS NULL)                     AS unread
      FROM my_chats mc
      JOIN users u ON u.id = mc.peer_id
      ORDER BY mc.pinned DESC NULLS LAST, mc.last_at DESC NULLS LAST, mc.id DESC
      LIMIT 200
    `;
    const r = await query(sql, [me]);
    res.json(r.rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const me = req.user.id;
    const peer = String(req.body?.peer_id || '');
    if (!peer || peer === me) return res.status(400).json({ error: 'peer_id required' });
    const u = await query('SELECT id, role FROM users WHERE id = $1', [peer]);
    if (!u.rows.length) return res.status(404).json({ error: 'Peer not found' });
    if (req.user.role === 'student' && u.rows[0].role !== 'teacher') {
      return res.status(403).json({ error: 'Ученики могут писать только преподавателям' });
    }
    const [a, b] = pairOf(me, peer);
    await query(`INSERT INTO chats (user_a, user_b) VALUES ($1, $2)
                 ON CONFLICT (user_a, user_b) DO NOTHING`, [a, b]);
    const r = await query('SELECT id FROM chats WHERE user_a=$1 AND user_b=$2', [a, b]);
    res.status(201).json({ id: r.rows[0].id });
  } catch (err) { next(err); }
});

router.get('/:id/messages', async (req, res, next) => {
  try {
    const me = req.user.id;
    const chatId = parseInt(req.params.id, 10);
    if (!Number.isInteger(chatId)) return res.status(400).json({ error: 'bad id' });
    const member = await query(
      `SELECT 1 FROM chats WHERE id = $1 AND (user_a = $2 OR user_b = $2)`, [chatId, me]);
    if (!member.rows.length) return res.status(403).json({ error: 'Forbidden' });

    const before = req.query.before;
    const params = [chatId];
    let where = 'chat_id = $1';
    if (before) { params.push(before); where += ` AND created_at < $${params.length}`; }
    const r = await query(
      `SELECT id, sender_id, body, read_at, created_at
         FROM messages WHERE ${where}
         ORDER BY created_at DESC LIMIT 50`, params);
    res.json(r.rows.reverse());
  } catch (err) { next(err); }
});

router.post('/:id/messages', async (req, res, next) => {
  try {
    const me = req.user.id;
    const chatId = parseInt(req.params.id, 10);
    if (!Number.isInteger(chatId)) return res.status(400).json({ error: 'bad id' });
    const body = String(req.body?.body || '').trim();
    if (!body) return res.status(400).json({ error: 'body is required' });
    if (body.length > 4000) return res.status(413).json({ error: 'message too long' });
    const member = await query(
      `SELECT 1 FROM chats WHERE id = $1 AND (user_a = $2 OR user_b = $2)`, [chatId, me]);
    if (!member.rows.length) return res.status(403).json({ error: 'Forbidden' });
    const r = await query(
      `INSERT INTO messages (chat_id, sender_id, body) VALUES ($1, $2, $3)
       RETURNING id, sender_id, body, read_at, created_at`,
      [chatId, me, body]);
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

router.post('/:id/read', async (req, res, next) => {
  try {
    const me = req.user.id;
    const chatId = parseInt(req.params.id, 10);
    if (!Number.isInteger(chatId)) return res.status(400).json({ error: 'bad id' });
    const member = await query(
      `SELECT 1 FROM chats WHERE id = $1 AND (user_a = $2 OR user_b = $2)`, [chatId, me]);
    if (!member.rows.length) return res.status(403).json({ error: 'Forbidden' });
    await query(
      `UPDATE messages SET read_at = now()
        WHERE chat_id = $1 AND sender_id <> $2 AND read_at IS NULL`, [chatId, me]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const me = req.user.id;
    const chatId = parseInt(req.params.id, 10);
    if (!Number.isInteger(chatId)) return res.status(400).json({ error: 'bad id' });
    const member = await query(
      `SELECT 1 FROM chats WHERE id = $1 AND (user_a = $2 OR user_b = $2)`, [chatId, me]);
    if (!member.rows.length) return res.status(403).json({ error: 'Forbidden' });
    if (typeof req.body?.pinned === 'boolean') {
      await query('UPDATE chats SET pinned = $1 WHERE id = $2', [req.body.pinned, chatId]);
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
