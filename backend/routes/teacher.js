/* =============================================================
   /api/teacher/me/* — current teacher's own dashboard data.
   All endpoints require role='teacher' and look the teacher
   record up via teachers.user_id.
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');
const { requireRole } = require('../auth');

/**
 * Resolve the teachers.id linked to the currently logged-in user.
 * Throws 404 if no teacher record exists for this user.
 */
async function resolveMyTeacher(userId) {
  const r = await query(
    'SELECT id, name, bio, experience, photo_url, rating, review_count, is_active FROM teachers WHERE user_id = $1',
    [userId]
  );
  return r.rows[0] || null;
}

// ---------------- GET /api/teacher/me ----------------
router.get('/me', requireRole('teacher'), async (req, res, next) => {
  try {
    const t = await resolveMyTeacher(req.user.id);
    if (!t) return res.status(404).json({ error: 'Teacher profile not found' });
    res.json({
      ...t,
      // Echo a few user fields the dashboard wants to show.
      email: req.user.email,
      user_id: req.user.id,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------- GET /api/teacher/me/schedule ----------------
// Splits this teacher's bookings into today / upcoming / past.
router.get('/me/schedule', requireRole('teacher'), async (req, res, next) => {
  try {
    const t = await resolveMyTeacher(req.user.id);
    if (!t) return res.status(404).json({ error: 'Teacher profile not found' });

    const sql = `
      SELECT
        b.id,
        b.student_id,
        b.teacher_id,
        b.lesson_date AS date,
        b.time_slot,
        b.status,
        b.discipline_name,
        b.is_public,
        b.meeting_provider,
        COALESCE(b.meeting_url, b.zoom_link) AS meeting_url,
        b.meeting_id,
        b.meeting_password,
        COALESCE(u.name, b.student_name) AS student_name,
        u.avatar_url AS student_avatar_url
      FROM bookings b
      LEFT JOIN users u ON u.id = b.student_id
      WHERE b.teacher_id = $1
      ORDER BY b.lesson_date, b.time_slot
    `;
    const r = await query(sql, [t.id]);

    const today = [];
    const upcoming = [];
    const past = [];
    const todayStr = new Date().toISOString().slice(0, 10);

    for (const b of r.rows) {
      const d = b.date;                                // already 'YYYY-MM-DD'
      if (b.status === 'cancelled' || b.status === 'completed') {
        past.push(b);
      } else if (d === todayStr) {
        today.push(b);
      } else if (d > todayStr) {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    }

    res.json({ teacher_id: t.id, today, upcoming, past });
  } catch (err) {
    next(err);
  }
});

// ---------------- GET /api/teacher/me/slots?date=YYYY-MM-DD ----------------
// Returns ALL slots for this teacher on a given date. Availability follows
// the slot's own is_available flag; capacity/booked are informational.
router.get('/me/slots', requireRole('teacher'), async (req, res, next) => {
  try {
    const t = await resolveMyTeacher(req.user.id);
    if (!t) return res.status(404).json({ error: 'Teacher profile not found' });

    const date = String(req.query.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) required' });
    }

    const sql = `
      SELECT
        s.id,
        s.slot_date,
        s.slot_time,
        s.duration_minutes,
        s.capacity,
        s.is_available AS schedule_available,
        COALESCE((
          SELECT COUNT(*) FROM bookings b
          WHERE b.teacher_id = s.teacher_id
            AND b.lesson_date = s.slot_date
            AND b.time_slot   = s.slot_time
            AND b.status IN ('pending','confirmed')
        ), 0)::int AS booked
      FROM teacher_schedule_slots s
      WHERE s.teacher_id = $1 AND s.slot_date = $2
      ORDER BY s.slot_time
    `;
    const r = await query(sql, [t.id, date]);
    const slots = r.rows.map((row) => ({
      id: row.id,
      slot_date: row.slot_date,
      slot_time: row.slot_time,
      duration_minutes: row.duration_minutes,
      capacity: row.capacity,
      booked: row.booked,
      free: Math.max(0, row.capacity - row.booked),
      is_group: row.capacity > 1,
      is_available: !!row.schedule_available,
    }));
    res.json({ teacher_id: t.id, date, slots });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
