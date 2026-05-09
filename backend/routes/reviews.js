/* =============================================================
   /api/reviews — list (filterable) + create
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');

const REVIEW_SELECT = `
  SELECT
    r.id,
    r.teacher_id,
    r.student_id,
    r.booking_id,
    r.rating,
    r.comment,
    r.created_at,
    COALESCE(u.name, r.student_name) AS student_name,
    u.avatar_url AS student_avatar_url,
    t.name       AS teacher_name
  FROM reviews r
  LEFT JOIN users    u ON u.id = r.student_id
  LEFT JOIN teachers t ON t.id = r.teacher_id
`;

// ---------------- GET /api/reviews ----------------
router.get('/', async (req, res, next) => {
  try {
    const { teacher_id, student_id } = req.query;
    const conditions = [];
    const params = [];

    if (teacher_id) {
      params.push(teacher_id);
      conditions.push(`r.teacher_id = $${params.length}`);
    }
    if (student_id) {
      params.push(student_id);
      conditions.push(`r.student_id = $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `${REVIEW_SELECT} ${where} ORDER BY r.created_at DESC LIMIT 100`;
    const r = await query(sql, params);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// ---------------- POST /api/reviews ----------------
// Body: { teacher_id, rating (1..5), [comment], [booking_id], [student_id] }
router.post('/', async (req, res, next) => {
  try {
    const { teacher_id, rating, comment, booking_id, student_id } = req.body || {};

    if (!teacher_id) return res.status(400).json({ error: 'teacher_id required' });
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'rating must be an integer 1..5' });
    }

    const finalStudentId = student_id || req.user?.id || null;
    if (!finalStudentId) {
      return res.status(401).json({ error: 'authentication required to leave a review' });
    }

    // Verify references
    const teacher = await query('SELECT 1 FROM teachers WHERE id = $1', [teacher_id]);
    if (!teacher.rows.length) return res.status(404).json({ error: 'teacher not found' });

    const student = await query('SELECT name FROM users WHERE id = $1', [finalStudentId]);
    if (!student.rows.length) return res.status(400).json({ error: 'student not found' });

    if (booking_id) {
      const b = await query('SELECT 1 FROM bookings WHERE id = $1', [booking_id]);
      if (!b.rows.length) return res.status(400).json({ error: 'booking not found' });
    }

    const ins = await query(
      `INSERT INTO reviews
         (student_id, teacher_id, booking_id, student_name, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [finalStudentId, teacher_id, booking_id || null, student.rows[0].name, ratingNum, comment || '']
    );

    const fetched = await query(`${REVIEW_SELECT} WHERE r.id = $1`, [ins.rows[0].id]);
    res.status(201).json(fetched.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
