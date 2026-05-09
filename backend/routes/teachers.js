/* =============================================================
   /api/teachers — list, single profile, schedule, calendar, reviews
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');

// Reusable SELECT that aggregates many-to-many relations into JSON arrays
// and falls back to teacher_review_summary view for live rating.
const TEACHER_SELECT = `
  SELECT
    t.id,
    t.user_id,
    t.name,
    t.bio,
    t.experience,
    t.photo_url,
    t.is_active,
    t.created_at,
    -- Prefer the calculated rating from reviews, fall back to stored value
    COALESCE(NULLIF(trs.calculated_rating, 0), t.rating, 0) AS rating,
    GREATEST(t.review_count, COALESCE(trs.calculated_review_count, 0)) AS review_count,
    COALESCE(
      (SELECT json_agg(td.discipline_name ORDER BY td.discipline_name)
         FROM teacher_disciplines td WHERE td.teacher_id = t.id),
      '[]'::json
    ) AS disciplines,
    COALESCE(
      (SELECT json_agg(tag.age_group_name ORDER BY tag.age_group_name)
         FROM teacher_age_groups tag WHERE tag.teacher_id = t.id),
      '[]'::json
    ) AS age_groups,
    COALESCE(
      (SELECT json_agg(tl.level_name ORDER BY tl.level_name)
         FROM teacher_levels tl
         WHERE tl.teacher_id = t.id),
      '[]'::json
    ) AS levels
  FROM teachers t
  LEFT JOIN teacher_review_summary trs ON trs.teacher_id = t.id
`;

function buildSelect(extraWhere, params) {
  const sql =
    TEACHER_SELECT +
    (extraWhere ? '\n' + extraWhere : '') +
    '\nORDER BY t.name';
  return { sql, params };
}

// ---------------- GET /api/teachers ----------------
router.get('/', async (req, res, next) => {
  try {
    const { discipline, age_group, level, q, active } = req.query;
    const conditions = [];
    const params = [];

    if (active !== 'false') {
      conditions.push('t.is_active = TRUE');
    }
    if (discipline) {
      params.push(discipline);
      conditions.push(
        `EXISTS (SELECT 1 FROM teacher_disciplines td WHERE td.teacher_id = t.id AND td.discipline_name = $${params.length})`
      );
    }
    if (age_group) {
      params.push(age_group);
      conditions.push(
        `EXISTS (SELECT 1 FROM teacher_age_groups tag WHERE tag.teacher_id = t.id AND tag.age_group_name = $${params.length})`
      );
    }
    if (level) {
      params.push(level);
      conditions.push(
        `EXISTS (SELECT 1 FROM teacher_levels tl WHERE tl.teacher_id = t.id AND tl.level_name = $${params.length})`
      );
    }
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(t.name ILIKE $${params.length} OR t.bio ILIKE $${params.length})`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const built = buildSelect(where, params);
    const result = await query(built.sql, built.params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ---------------- GET /api/teachers/:id ----------------
router.get('/:id', async (req, res, next) => {
  try {
    const params = [req.params.id];
    const built = buildSelect(`WHERE t.id = $1`, params);
    const result = await query(built.sql, built.params);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ---------------- GET /api/teachers/:id/schedule?date=YYYY-MM-DD ----
// Returns the slots for a single day. A slot is "available" if the teacher
// has marked it open (`is_available=TRUE`); we do NOT mark a slot
// unavailable just because some students have booked it — many students
// may book the same (teacher, date, time). Per-student conflicts are
// enforced when the student tries to POST a booking.
router.get('/:id/schedule', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date query parameter required (YYYY-MM-DD)' });
    }

    const sql = `
      SELECT
        s.id,
        s.slot_time AS time,
        s.is_available AS schedule_available,
        s.duration_minutes,
        s.capacity,
        COALESCE((
          SELECT COUNT(*) FROM bookings b
          WHERE b.teacher_id = s.teacher_id
            AND b.lesson_date = s.slot_date
            AND b.time_slot   = s.slot_time
            AND b.status IN ('pending', 'confirmed')
        ), 0)::int AS booked
      FROM teacher_schedule_slots s
      WHERE s.teacher_id = $1 AND s.slot_date = $2
      ORDER BY s.slot_time
    `;
    const r = await query(sql, [id, date]);

    // First two open slots of the day are highlighted as "hot" in the UI.
    let freeIndex = 0;
    const slots = r.rows.map((row) => {
      const available = !!row.schedule_available;
      const hot = available && freeIndex++ < 2;
      return {
        id: row.id,
        time: row.time,
        available,
        duration_minutes: row.duration_minutes,
        // Informational fields — not used to gate availability.
        capacity: row.capacity,
        booked: row.booked,
        is_group: row.capacity > 1,
        hot,
      };
    });

    res.json(slots);
  } catch (err) {
    next(err);
  }
});

// ---------------- GET /api/teachers/:id/calendar?year=2026&month=4 -----
// Returns days that have status: 'green' (free slots) or 'gold' (active booking).
// Gold takes priority when both apply. It is informational only: booked lessons
// do not block other students from booking the same teacher/date/time.
router.get('/:id/calendar', async (req, res, next) => {
  try {
    const { id } = req.params;
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'year and month (1-12) query params required' });
    }

    const sql = `
      WITH days AS (
        SELECT generate_series(
          make_date($1::int, $2::int, 1),
          (make_date($1::int, $2::int, 1) + INTERVAL '1 month - 1 day')::date,
          '1 day'::interval
        )::date AS d
      ),
      free_slots AS (
        SELECT s.slot_date AS d
        FROM teacher_schedule_slots s
        WHERE s.teacher_id = $3
          AND s.is_available = TRUE
          AND s.slot_date >= make_date($1::int, $2::int, 1)
          AND s.slot_date <  (make_date($1::int, $2::int, 1) + INTERVAL '1 month')
        GROUP BY s.slot_date
      ),
      active_bookings AS (
        SELECT b.lesson_date AS d
        FROM bookings b
        WHERE b.teacher_id = $3
          AND b.status IN ('pending', 'confirmed')
          AND b.lesson_date >= make_date($1::int, $2::int, 1)
          AND b.lesson_date <  (make_date($1::int, $2::int, 1) + INTERVAL '1 month')
        GROUP BY b.lesson_date
      )
      SELECT
        EXTRACT(DAY FROM days.d)::int AS day,
        CASE
          WHEN active_bookings.d IS NOT NULL THEN 'gold'
          WHEN free_slots.d     IS NOT NULL THEN 'green'
          ELSE NULL
        END AS status
      FROM days
      LEFT JOIN free_slots     ON free_slots.d     = days.d
      LEFT JOIN active_bookings ON active_bookings.d = days.d
      ORDER BY days.d
    `;
    const r = await query(sql, [year, month, id]);
    const days = r.rows.filter((row) => row.status !== null);

    res.json({ year, month, days });
  } catch (err) {
    next(err);
  }
});

// ---------------- GET /api/teachers/:id/reviews ----------------
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const sql = `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        r.student_id,
        COALESCE(u.name, r.student_name) AS student_name,
        u.avatar_url AS student_avatar_url
      FROM reviews r
      LEFT JOIN users u ON u.id = r.student_id
      WHERE r.teacher_id = $1
      ORDER BY r.created_at DESC
    `;
    const r = await query(sql, [req.params.id]);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// ============================================================
//   SLOT CRUD — POST/DELETE /api/teachers/:id/slots
// Owner of the teacher account or admin only.
// ============================================================
const { requireAuth } = require('../auth');

async function assertCanManageSlots(teacherId, user) {
  if (!user) throw Object.assign(new Error('Not authenticated'), { status: 401 });
  if (user.role === 'admin') return true;
  if (user.role !== 'teacher') {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  const r = await query('SELECT user_id FROM teachers WHERE id = $1', [teacherId]);
  if (!r.rows.length) throw Object.assign(new Error('Teacher not found'), { status: 404 });
  if (r.rows[0].user_id !== user.id) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return true;
}

// POST /api/teachers/:id/slots
// body: { date, time, duration_minutes?, capacity? }
//   capacity defaults to 1 (individual). Set capacity > 1 to allow
//   multiple students to book the same slot (group lesson).
router.post('/:id/slots', requireAuth, async (req, res, next) => {
  try {
    await assertCanManageSlots(req.params.id, req.user);

    const date = String(req.body?.date || '');
    const rawTime = String(req.body?.time || '');
    const dur = parseInt(req.body?.duration_minutes, 10) || 45;
    const capacity = Math.max(1, parseInt(req.body?.capacity, 10) || 1);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) required' });
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(rawTime)) {
      return res.status(400).json({ error: 'time (HH:MM) required' });
    }
    const time = rawTime.length === 5 ? rawTime + ':00' : rawTime;

    const ins = await query(
      `INSERT INTO teacher_schedule_slots
         (teacher_id, slot_date, slot_time, is_available, duration_minutes, capacity)
       VALUES ($1, $2, $3, TRUE, $4, $5)
       ON CONFLICT (teacher_id, slot_date, slot_time) DO NOTHING
       RETURNING id, slot_date, slot_time, duration_minutes, capacity, is_available`,
      [req.params.id, date, time, dur, capacity]
    );

    if (!ins.rows.length) {
      return res.status(409).json({ error: 'Slot already exists' });
    }
    res.status(201).json(ins.rows[0]);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// PATCH /api/teachers/:id/slots
// body: { date, time, capacity? }
//   Lets the teacher change capacity later. Refuses to drop capacity
//   below the current number of active bookings on the slot.
router.patch('/:id/slots', requireAuth, async (req, res, next) => {
  try {
    await assertCanManageSlots(req.params.id, req.user);

    const date = String(req.body?.date || '');
    const rawTime = String(req.body?.time || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}(:\d{2})?$/.test(rawTime)) {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) and time (HH:MM) required' });
    }
    const time = rawTime.length === 5 ? rawTime + ':00' : rawTime;

    const newCap = Math.max(1, parseInt(req.body?.capacity, 10) || 1);

    const taken = await query(
      `SELECT COUNT(*)::int AS n FROM bookings
        WHERE teacher_id = $1 AND lesson_date = $2 AND time_slot = $3
          AND status IN ('pending','confirmed')`,
      [req.params.id, date, time]
    );
    if (newCap < taken.rows[0].n) {
      return res.status(409).json({
        error: `Уже записано ${taken.rows[0].n} учеников — нельзя установить вместимость меньше`,
      });
    }

    const upd = await query(
      `UPDATE teacher_schedule_slots
          SET capacity = $4
        WHERE teacher_id = $1 AND slot_date = $2 AND slot_time = $3
        RETURNING id, slot_date, slot_time, duration_minutes, capacity, is_available`,
      [req.params.id, date, time, newCap]
    );
    if (!upd.rows.length) return res.status(404).json({ error: 'Slot not found' });
    res.json(upd.rows[0]);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// DELETE /api/teachers/:id/slots   body: { date, time }
router.delete('/:id/slots', requireAuth, async (req, res, next) => {
  try {
    await assertCanManageSlots(req.params.id, req.user);

    const date = String(req.body?.date || '');
    const rawTime = String(req.body?.time || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date (YYYY-MM-DD) required' });
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(rawTime)) {
      return res.status(400).json({ error: 'time (HH:MM) required' });
    }
    const time = rawTime.length === 5 ? rawTime + ':00' : rawTime;

    // Refuse to delete slots that have an active booking on them.
    const taken = await query(
      `SELECT 1 FROM bookings
        WHERE teacher_id = $1 AND lesson_date = $2 AND time_slot = $3
          AND status IN ('pending','confirmed')`,
      [req.params.id, date, time]
    );
    if (taken.rows.length) {
      return res.status(409).json({ error: 'Slot has an active booking — cancel it first' });
    }

    await query(
      `DELETE FROM teacher_schedule_slots
        WHERE teacher_id = $1 AND slot_date = $2 AND slot_time = $3`,
      [req.params.id, date, time]
    );
    res.json({ ok: true });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

module.exports = router;
