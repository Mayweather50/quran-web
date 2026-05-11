/* =============================================================
   /api/bookings — list, single, create, update.
   Video-call link uses COALESCE(meeting_url, zoom_link).

   Authorization model on PATCH /:id:
   - admin:               can change anything
   - teacher of booking:  can change status / meeting_*
   - student of booking:  can only set status='cancelled'
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');
const { requireAuth } = require('../auth');

const ALLOWED_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

const BOOKING_SELECT = `
  SELECT
    b.id,
    b.student_id,
    b.teacher_id,
    b.student_name,
    COALESCE(t.name, b.teacher_name) AS teacher_name,
    b.lesson_date AS date,
    b.time_slot,
    b.status,
    b.discipline_name AS discipline,
    b.is_public,
    b.created_at,
    b.updated_at,
    b.meeting_provider,
    COALESCE(b.meeting_url, b.zoom_link) AS meeting_url,
    b.meeting_id,
    b.meeting_password,
    u.avatar_url AS student_avatar_url,
    t.photo_url  AS teacher_photo_url
  FROM bookings b
  LEFT JOIN users    u ON u.id = b.student_id
  LEFT JOIN teachers t ON t.id = b.teacher_id
`;

// ---------------- GET /api/bookings ----------------
// Filters: scope=mine | student_id | teacher_id | status | from | to
router.get('/', async (req, res, next) => {
  try {
    const { scope, student_id, teacher_id, status, from, to } = req.query;
    const conditions = [];
    const params = [];

    if (scope === 'mine') {
      if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
      params.push(req.user.id);
      conditions.push(`b.student_id = $${params.length}`);
    } else {
      if (student_id) {
        params.push(student_id);
        conditions.push(`b.student_id = $${params.length}`);
      }
      if (teacher_id) {
        params.push(teacher_id);
        conditions.push(`b.teacher_id = $${params.length}`);
      }
    }
    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'invalid status' });
      }
      params.push(status);
      conditions.push(`b.status = $${params.length}`);
    }
    if (from) {
      params.push(from);
      conditions.push(`b.lesson_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`b.lesson_date <= $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sql = `${BOOKING_SELECT} ${where} ORDER BY b.lesson_date, b.time_slot`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ---------------- GET /api/bookings/:id ----------------
router.get('/:id', async (req, res, next) => {
  try {
    const r = await query(`${BOOKING_SELECT} WHERE b.id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------------- POST /api/bookings ----------------
// Body: { teacher_id, lesson_date, time_slot, discipline_name, [is_public] }
//
// Conflict rule: a student cannot have two active bookings at the same
// (lesson_date, time_slot) — even with different teachers. There is no
// per-teacher / per-slot upper limit; many students may book the same
// (teacher, date, time). The DB partial unique index
// `uq_bookings_active_student_date_time` is the source of truth and
// also guards against parallel inserts.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      teacher_id,
      lesson_date,
      time_slot,
      discipline_name,
      is_public = false,
    } = req.body || {};

    // ---- Validate input
    if (!teacher_id) return res.status(400).json({ error: 'teacher_id required' });
    if (!lesson_date || !/^\d{4}-\d{2}-\d{2}$/.test(lesson_date)) {
      return res.status(400).json({ error: 'lesson_date (YYYY-MM-DD) required' });
    }
    if (!time_slot || !/^\d{2}:\d{2}(:\d{2})?$/.test(time_slot)) {
      return res.status(400).json({ error: 'time_slot (HH:MM) required' });
    }
    if (!discipline_name) return res.status(400).json({ error: 'discipline_name required' });

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Только ученики могут записываться на уроки' });
    }
    const finalStudentId = req.user.id;

    // ---- Verify references
    const teacher = await query(
      'SELECT id, name FROM teachers WHERE id = $1 AND is_active = TRUE',
      [teacher_id]
    );
    if (!teacher.rows.length) return res.status(404).json({ error: 'Teacher not found' });

    const discipline = await query(
      'SELECT name FROM disciplines WHERE name = $1',
      [discipline_name]
    );
    if (!discipline.rows.length) return res.status(400).json({ error: 'Unknown discipline' });

    // ---- Slot must exist in the teacher's schedule and be marked open.
    //      We do NOT count existing bookings on the slot — the platform
    //      allows multiple students to attend the same teacher at the
    //      same time (group lesson model is enforced per-student, not
    //      per-slot).
    const slot = await query(
      `SELECT is_available, meeting_provider, meeting_url
         FROM teacher_schedule_slots
        WHERE teacher_id = $1 AND slot_date = $2 AND slot_time = $3`,
      [teacher_id, lesson_date, time_slot]
    );
    if (!slot.rows.length) {
      return res.status(400).json({ error: 'Slot does not exist in teacher schedule' });
    }
    if (!slot.rows[0].is_available) {
      return res.status(409).json({ error: 'Slot is not available' });
    }

    // ---- Per-student conflict: this student already busy at (date, time)?
    //      Scoped across ALL teachers — a student can be in only one
    //      lesson at a time.
    const conflict = await query(
      `SELECT
          b.id,
          b.lesson_date AS date,
          b.time_slot,
          b.status,
          COALESCE(t.name, b.teacher_name) AS teacher_name,
          b.discipline_name AS discipline
         FROM bookings b
         LEFT JOIN teachers t ON t.id = b.teacher_id
        WHERE b.student_id = $1 AND b.lesson_date = $2 AND b.time_slot = $3
          AND b.status IN ('pending','confirmed')
        LIMIT 1`,
      [finalStudentId, lesson_date, time_slot]
    );
    if (conflict.rows.length) {
      return res.status(409).json({
        error: 'Вы уже записаны на урок в это время',
        booking: conflict.rows[0],
      });
    }

    // ---- Cache student name (snapshot, like Firestore doc)
    const u = await query('SELECT name FROM users WHERE id = $1', [finalStudentId]);
    const studentName = u.rows[0]?.name || '';

    // ---- Insert. The DB unique index is our backstop against parallel
    //      requests racing the conflict check above.
    const ins = await query(
      `INSERT INTO bookings
         (student_id, teacher_id, student_name, teacher_name,
          lesson_date, time_slot, status, discipline_name, is_public,
          meeting_provider, meeting_url)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10)
       RETURNING id`,
      [
        finalStudentId,
        teacher_id,
        studentName,
        teacher.rows[0].name,
        lesson_date,
        time_slot,
        discipline_name,
        !!is_public,
        slot.rows[0].meeting_provider || null,
        slot.rows[0].meeting_url || null,
      ]
    );

    const fetched = await query(`${BOOKING_SELECT} WHERE b.id = $1`, [ins.rows[0].id]);
    res.status(201).json(fetched.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      // uq_bookings_active_student_date_time partial unique index.
      return res.status(409).json({ error: 'Вы уже записаны на урок в это время' });
    }
    next(err);
  }
});

// ---------------- PATCH /api/bookings/:id ----------------
// Editable: status, meeting_url, meeting_provider, meeting_id, meeting_password
// Permission rules at top of file.
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const me = req.user;

    // Load the booking with the relations we need for the auth check.
    const cur = await query(
      `SELECT b.id, b.student_id, b.teacher_id, b.status,
              t.user_id AS teacher_user_id
         FROM bookings b
         LEFT JOIN teachers t ON t.id = b.teacher_id
        WHERE b.id = $1`,
      [id]
    );
    if (!cur.rows.length) return res.status(404).json({ error: 'Booking not found' });
    const booking = cur.rows[0];

    const isAdmin   = me.role === 'admin';
    const isTeacher = me.role === 'teacher' && booking.teacher_user_id === me.id;
    const isStudent = booking.student_id === me.id;

    if (!isAdmin && !isTeacher && !isStudent) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // What the caller is trying to change.
    const allowedFields = isAdmin || isTeacher
      ? ['status', 'meeting_url', 'meeting_provider', 'meeting_id', 'meeting_password']
      : ['status']; // student
    const updates = {};
    for (const k of allowedFields) {
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, k)) {
        updates[k] = req.body[k];
      }
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'nothing to update' });
    }

    // Validate status.
    if (updates.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(updates.status)) {
        return res.status(400).json({ error: 'invalid status' });
      }
      // Students can only cancel.
      if (!isAdmin && !isTeacher && updates.status !== 'cancelled') {
        return res.status(403).json({ error: 'Students can only cancel' });
      }
    }

    // Build dynamic UPDATE.
    const keys = Object.keys(updates);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = keys.map((k) => updates[k]);
    vals.push(id);

    await query(
      `UPDATE bookings SET ${sets}, updated_at = now()
       WHERE id = $${vals.length}`,
      vals
    );
    const fetched = await query(`${BOOKING_SELECT} WHERE b.id = $1`, [id]);
    res.json(fetched.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------------- PATCH /api/bookings/:id/status (legacy) ---
// Kept for any callers that still use it. New UI uses PATCH /:id.
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }
    // Reuse the main PATCH for permission checks.
    req.body = { status };
    return router.handle(
      Object.assign(req, { url: `/${req.params.id}`, method: 'PATCH' }),
      res,
      next
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
