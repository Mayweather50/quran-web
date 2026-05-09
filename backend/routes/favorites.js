/* =============================================================
   Favorite teachers — list / add / remove.
   Mounted at /api so it owns the full path
   /api/users/:id/favorite-teachers/...
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');

const FAVORITES_SQL = `
  SELECT
    t.id,
    t.name,
    t.bio,
    t.experience,
    t.photo_url,
    t.rating,
    t.review_count,
    t.is_active,
    ft.created_at AS favorited_at
  FROM favorite_teachers ft
  JOIN teachers t ON t.id = ft.teacher_id
  WHERE ft.student_id = $1
  ORDER BY ft.created_at DESC
`;

async function listForStudent(studentId, res) {
  const r = await query(FAVORITES_SQL, [studentId]);
  res.json(r.rows);
}

// ---- GET /api/users/me/favorite-teachers ----
router.get('/users/me/favorite-teachers', async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    await listForStudent(req.user.id, res);
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/users/:id/favorite-teachers ----
router.get('/users/:id/favorite-teachers', async (req, res, next) => {
  try {
    await listForStudent(req.params.id, res);
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/users/me/favorite-teachers  body: { teacher_id } ----
router.post('/users/me/favorite-teachers', async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    const { teacher_id } = req.body || {};
    if (!teacher_id) return res.status(400).json({ error: 'teacher_id required' });

    const t = await query('SELECT 1 FROM teachers WHERE id = $1', [teacher_id]);
    if (!t.rows.length) return res.status(404).json({ error: 'Teacher not found' });

    await query(
      `INSERT INTO favorite_teachers (student_id, teacher_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.id, teacher_id]
    );
    res.status(201).json({ ok: true, student_id: req.user.id, teacher_id });
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/users/:id/favorite-teachers  body: { teacher_id } ----
router.post('/users/:id/favorite-teachers', async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const { teacher_id } = req.body || {};
    if (!teacher_id) return res.status(400).json({ error: 'teacher_id required' });

    const t = await query('SELECT 1 FROM teachers WHERE id = $1', [teacher_id]);
    if (!t.rows.length) return res.status(404).json({ error: 'Teacher not found' });

    await query(
      `INSERT INTO favorite_teachers (student_id, teacher_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [studentId, teacher_id]
    );
    res.status(201).json({ ok: true, student_id: studentId, teacher_id });
  } catch (err) {
    next(err);
  }
});

// ---- DELETE /api/users/me/favorite-teachers/:teacherId ----
router.delete('/users/me/favorite-teachers/:teacherId', async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    await query(
      `DELETE FROM favorite_teachers WHERE student_id = $1 AND teacher_id = $2`,
      [req.user.id, req.params.teacherId]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---- DELETE /api/users/:id/favorite-teachers/:teacherId ----
router.delete('/users/:id/favorite-teachers/:teacherId', async (req, res, next) => {
  try {
    await query(
      `DELETE FROM favorite_teachers WHERE student_id = $1 AND teacher_id = $2`,
      [req.params.id, req.params.teacherId]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
