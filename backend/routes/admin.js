/* =============================================================
   /api/admin/* — admin-only management endpoints.
   All require role='admin'.
============================================================= */
'use strict';

const router = require('express').Router();
const { query, getClient } = require('../db');
const {
  requireRole,
  hashPassword,
  genId,
} = require('../auth');

const ALLOWED_ROLES = ['student', 'teacher', 'admin'];
const ALLOWED_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.use(requireRole('admin'));

// =============================================================
//                         STATS / DASHBOARD
// =============================================================
// Quick aggregates the admin panel header shows at a glance.
router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoIso = weekAgo.toISOString();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = yesterday.toISOString().slice(0, 10);

    const [users, teachers, todayLessons, pending, weekDeltas, recentRows] = await Promise.all([
      query(`SELECT
               COUNT(*)::int                                    AS total,
               COUNT(*) FILTER (WHERE role = 'student')::int    AS students,
               COUNT(*) FILTER (WHERE role = 'teacher')::int    AS teachers,
               COUNT(*) FILTER (WHERE role = 'admin')::int      AS admins,
               COUNT(*) FILTER (WHERE is_active = FALSE)::int   AS blocked
             FROM users`),
      query(`SELECT COUNT(*)::int AS active FROM teachers WHERE is_active = TRUE`),
      query(`SELECT COUNT(*)::int AS n FROM bookings
              WHERE lesson_date = $1 AND status IN ('pending','confirmed')`,
            [today]),
      query(`SELECT COUNT(*)::int AS n FROM bookings WHERE status = 'pending'`),
      // Week-over-week deltas for the four hero cards
      query(`
        SELECT
          (SELECT COUNT(*)::int FROM users    WHERE role='student' AND created_at >= $1) AS students_week,
          (SELECT COUNT(*)::int FROM teachers WHERE created_at >= $1)                    AS teachers_week,
          (SELECT COUNT(*)::int FROM bookings WHERE created_at >= $1
              AND status IN ('pending','confirmed','completed'))                         AS bookings_week,
          (SELECT COUNT(*)::int FROM bookings WHERE lesson_date = $2
              AND status IN ('pending','confirmed','completed'))                         AS lessons_yesterday
      `, [weekAgoIso, yesterdayIso]),
      // Latest 6 admin-relevant events: new users, new bookings, status changes
      query(`
        WITH events AS (
          SELECT 'user_added' AS kind,
                 u.id::text   AS ref_id,
                 u.name       AS title,
                   u.role::text AS subtitle,
                 u.created_at AS happened_at
            FROM users u
           WHERE u.created_at >= NOW() - INTERVAL '14 days'
          UNION ALL
          SELECT 'booking_created' AS kind,
                 b.id::text         AS ref_id,
                 COALESCE(b.student_name, 'Группа') || ' → ' || COALESCE(t.name, b.teacher_name) AS title,
                   b.discipline_name::text AS subtitle,
                 b.created_at       AS happened_at
            FROM bookings b
            LEFT JOIN teachers t ON t.id = b.teacher_id
           WHERE b.created_at >= NOW() - INTERVAL '14 days'
        )
        SELECT * FROM events ORDER BY happened_at DESC LIMIT 6
      `),
    ]);

    res.json({
      users: users.rows[0],
      active_teachers: teachers.rows[0].active,
      today_lessons: todayLessons.rows[0].n,
      pending_bookings: pending.rows[0].n,
      week_deltas: weekDeltas.rows[0],
      recent_activity: recentRows.rows.map((r) => ({
        kind: r.kind,
        ref_id: r.ref_id,
        title: r.title,
        subtitle: r.subtitle,
        happened_at: r.happened_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/pending-bookings — feeds the "Заявки на подтверждение"
// card on the admin dashboard. Returns the oldest pending bookings.
router.get('/pending-bookings', async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const sql = `
      SELECT
        b.id,
        b.student_id,
        b.student_name,
        b.teacher_id,
        COALESCE(t.name, b.teacher_name) AS teacher_name,
        b.lesson_date,
        b.time_slot,
        b.discipline_name,
        b.created_at
      FROM bookings b
      LEFT JOIN teachers t ON t.id = b.teacher_id
      WHERE b.status = 'pending'
      ORDER BY b.lesson_date, b.time_slot
      LIMIT $1
    `;
    const r = await query(sql, [limit]);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/today-lessons — feeds the "Ближайшие уроки" card on the
// admin dashboard. Returns today's confirmed lessons sorted by time.
router.get('/today-lessons', async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 6));
    const sql = `
      SELECT
        b.id,
        b.student_id,
        b.student_name,
        b.teacher_id,
        COALESCE(t.name, b.teacher_name) AS teacher_name,
        b.lesson_date,
        b.time_slot,
        b.discipline_name,
        b.is_public,
        b.meeting_provider,
        b.status,
        COALESCE(b.meeting_url, b.zoom_link) AS meeting_url
      FROM bookings b
      LEFT JOIN teachers t ON t.id = b.teacher_id
      WHERE b.lesson_date = $1
        AND b.status IN ('pending','confirmed')
      ORDER BY b.time_slot
      LIMIT $2
    `;
    const r = await query(sql, [today, limit]);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/students-summary — header metrics for the Students page
router.get('/students-summary', async (req, res, next) => {
  try {
    const r = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE role='student')                           AS total,
        (SELECT COUNT(*)::int FROM users WHERE role='student' AND is_active = TRUE)      AS active,
        (SELECT COUNT(*)::int FROM users WHERE role='student'
                 AND created_at >= NOW() - INTERVAL '7 days')                            AS new_this_week,
        (SELECT COUNT(*)::int FROM users WHERE role='student'
                 AND created_at >= NOW() - INTERVAL '14 days'
                 AND created_at <  NOW() - INTERVAL '7 days')                            AS new_last_week,
        (SELECT
            CASE WHEN c+x = 0 THEN NULL
                 ELSE ROUND(100.0 * c / NULLIF(c+x, 0))::int END
          FROM (
            SELECT
              COUNT(*) FILTER (WHERE status='completed')::int AS c,
              COUNT(*) FILTER (WHERE status='cancelled')::int AS x
            FROM bookings
          ) sub)                                                                          AS attendance_pct,
        (SELECT
            CASE WHEN c+x = 0 THEN NULL
                 ELSE ROUND(100.0 * c / NULLIF(c+x, 0))::int END
          FROM (
            SELECT
              COUNT(*) FILTER (WHERE status='completed')::int AS c,
              COUNT(*) FILTER (WHERE status='cancelled')::int AS x
            FROM bookings WHERE created_at <  NOW() - INTERVAL '7 days'
          ) sub)                                                                          AS attendance_pct_prev
    `);
    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/teachers-summary — header metrics for the Catalog/Groups page
router.get('/teachers-summary', async (req, res, next) => {
  try {
    const r = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM teachers)                              AS total,
        (SELECT COUNT(*)::int FROM teachers WHERE is_active = TRUE)       AS active,
        (SELECT COUNT(DISTINCT b.teacher_id)::int FROM bookings b
            WHERE b.is_public = TRUE)                                     AS group_teachers,
        (SELECT COUNT(*)::int FROM teachers
            WHERE created_at >= NOW() - INTERVAL '7 days')                AS new_this_week
    `);
    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
});

// =============================================================
//                         USERS
// =============================================================
router.get('/users', async (req, res, next) => {
  try {
    const { q, role, status } = req.query;
    const conds = [];
    const params = [];
    if (q) {
      params.push(`%${q.trim()}%`);
      conds.push(`(LOWER(u.name) LIKE LOWER($${params.length}) OR LOWER(u.email) LIKE LOWER($${params.length}))`);
    }
    if (role && ALLOWED_ROLES.includes(role)) {
      params.push(role);
      conds.push(`u.role = $${params.length}`);
    }
    // status: 'active' | 'new' | 'archived' (synthetic UI categories)
    if (status === 'active')   conds.push(`u.is_active = TRUE`);
    if (status === 'archived') conds.push(`u.is_active = FALSE`);
    if (status === 'new') {
      // arrived in the last 14 days
      conds.push(`u.created_at >= NOW() - INTERVAL '14 days'`);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const sql = `
      SELECT
        u.id, u.role, u.name, u.email, u.phone, u.avatar_url, u.age_text,
        u.level_name, u.is_active, u.created_at,
        sp.lessons_completed,
        sp.hours_studied,
        sp.level_name AS progress_level,
        -- The most recent confirmed teacher for this student (best guess
        -- at "their teacher")
        (SELECT t.name FROM bookings b
            LEFT JOIN teachers t ON t.id = b.teacher_id
            WHERE b.student_id = u.id AND t.id IS NOT NULL
            ORDER BY b.lesson_date DESC, b.time_slot DESC LIMIT 1) AS current_teacher,
        -- Most-recent-booked discipline → treat as "current course"
        (SELECT b.discipline_name FROM bookings b
            WHERE b.student_id = u.id AND b.discipline_name IS NOT NULL
            ORDER BY b.lesson_date DESC, b.time_slot DESC LIMIT 1) AS current_course,
        -- Best guess at the student's age group (most common across bookings)
        (SELECT tag.age_group_name
            FROM bookings b
            JOIN teacher_age_groups tag ON tag.teacher_id = b.teacher_id
            WHERE b.student_id = u.id
            GROUP BY tag.age_group_name
            ORDER BY COUNT(*) DESC, tag.age_group_name LIMIT 1) AS group_name,
        -- attendance % = completed / (completed+cancelled) over all time
        (SELECT
            CASE WHEN c+x = 0 THEN NULL
                 ELSE ROUND(100.0 * c / NULLIF(c+x, 0))::int END
          FROM (
            SELECT
              COUNT(*) FILTER (WHERE status='completed')::int AS c,
              COUNT(*) FILTER (WHERE status='cancelled')::int AS x
            FROM bookings WHERE student_id = u.id
          ) sub) AS attendance_pct
      FROM users u
      LEFT JOIN student_progress sp ON sp.student_id = u.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT 500
    `;
    const r = await query(sql, params);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users  body: { name, email, password, role? }
// Creates a new user with a password set immediately.
router.post('/users', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const role = req.body?.role || 'student';

    if (name.length < 2)        return res.status(400).json({ error: 'name must be at least 2 chars' });
    if (!EMAIL_RE.test(email))  return res.status(400).json({ error: 'invalid email' });
    if (password.length < 6)    return res.status(400).json({ error: 'password must be at least 6 chars' });
    if (!ALLOWED_ROLES.includes(role)) return res.status(400).json({ error: 'invalid role' });

    const dup = await query('SELECT 1 FROM users WHERE LOWER(email) = $1', [email]);
    if (dup.rows.length) return res.status(409).json({ error: 'Email already in use' });

    const id = genId();
    const hash = await hashPassword(password);

    const ins = await query(
      `INSERT INTO users (id, role, name, email, password_hash, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, role, name, email, phone, avatar_url, age_text, level_name,
                 is_active, created_at`,
      [id, role, name, email, hash]
    );
    const u = ins.rows[0];

    // If the new user is a teacher, also create a teachers row.
    if (role === 'teacher') {
      await query(
        `INSERT INTO teachers (id, user_id, name, is_active)
         SELECT $1, $2, $3, TRUE
         WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = $2)`,
        [u.id, u.id, u.name]
      );
    }
    if (role === 'student') {
      await query(
        `INSERT INTO student_progress (student_id, level_name, lessons_completed, hours_studied)
         VALUES ($1, 'Начальный', 0, 0)
         ON CONFLICT (student_id) DO NOTHING`,
        [u.id]
      );
    }

    res.status(201).json(u);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id  body: { role?, is_active?, name?, password? }
router.patch('/users/:id', async (req, res, next) => {
  try {
    const id = req.params.id;

    // Self-protection: don't let an admin demote / disable themselves.
    if (id === req.user.id) {
      const hasDisable = req.body && Object.prototype.hasOwnProperty.call(req.body, 'is_active');
      const hasRole    = req.body && Object.prototype.hasOwnProperty.call(req.body, 'role');
      if (hasDisable && req.body.is_active === false) {
        return res.status(400).json({ error: 'You cannot disable your own account' });
      }
      if (hasRole && req.body.role !== 'admin') {
        return res.status(400).json({ error: 'You cannot change your own role' });
      }
    }

    const updates = {};
    if (req.body?.role !== undefined) {
      if (!ALLOWED_ROLES.includes(req.body.role)) {
        return res.status(400).json({ error: 'invalid role' });
      }
      updates.role = req.body.role;
    }
    if (req.body?.is_active !== undefined) {
      updates.is_active = !!req.body.is_active;
    }
    if (typeof req.body?.name === 'string') {
      const v = req.body.name.trim();
      if (v.length < 2) return res.status(400).json({ error: 'name too short' });
      updates.name = v;
    }
    // Password reset (admin can reset any user's password without
    // knowing the old one — useful for "forgotten" cases).
    if (typeof req.body?.password === 'string' && req.body.password.length) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ error: 'password must be at least 6 chars' });
      }
      updates.password_hash = await hashPassword(req.body.password);
    }

    const keys = Object.keys(updates);
    if (!keys.length) return res.status(400).json({ error: 'nothing to update' });

    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = keys.map((k) => updates[k]);
    vals.push(id);

    const upd = await query(
      `UPDATE users SET ${sets} WHERE id = $${vals.length}
       RETURNING id, role, name, email, phone, avatar_url, age_text, level_name,
                 is_active, created_at`,
      vals
    );
    if (!upd.rows.length) return res.status(404).json({ error: 'User not found' });

    // If user was promoted to teacher and didn't have a teachers row,
    // create one so /teacher/me works for them right away.
    if (updates.role === 'teacher') {
      const u = upd.rows[0];
      await query(
        `INSERT INTO teachers (id, user_id, name, is_active)
         SELECT $1, $2, $3, TRUE
         WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = $2)`,
        [u.id, u.id, u.name || 'Преподаватель']
      );
    }

    res.json(upd.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id  — full hard delete. Cascades to
// teachers/bookings/reviews/progress via FK ON DELETE rules.
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const r = await query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    next(err);
  }
});

// =============================================================
//                         BOOKINGS
// =============================================================
router.get('/bookings', async (req, res, next) => {
  try {
    const { q, status, from, to } = req.query;
    const conds = [];
    const params = [];
    if (q) {
      params.push(`%${q.trim()}%`);
      conds.push(`(LOWER(b.student_name) LIKE LOWER($${params.length})
                OR LOWER(t.name)         LIKE LOWER($${params.length})
                OR LOWER(b.discipline_name) LIKE LOWER($${params.length}))`);
    }
    if (status && ALLOWED_STATUSES.includes(status)) {
      params.push(status);
      conds.push(`b.status = $${params.length}`);
    }
    if (from) {
      params.push(from);
      conds.push(`b.lesson_date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conds.push(`b.lesson_date <= $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const sql = `
      SELECT
        b.id,
        b.student_id,
        b.teacher_id,
        b.student_name,
        COALESCE(t.name, b.teacher_name) AS teacher_name,
        b.lesson_date,
        b.time_slot,
        b.status,
        b.discipline_name,
        b.is_public,
        b.meeting_provider,
        COALESCE(b.meeting_url, b.zoom_link) AS meeting_url,
        b.created_at,
        b.updated_at
      FROM bookings b
      LEFT JOIN teachers t ON t.id = b.teacher_id
      ${where}
      ORDER BY b.lesson_date DESC, b.time_slot DESC
      LIMIT 500
    `;
    const r = await query(sql, params);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/bookings/:id
// body fields (any): status, lesson_date, time_slot, discipline_name,
//                    meeting_url, meeting_provider, student_id
// Lets the admin re-schedule, change discipline, attach a meeting URL,
// or even reassign to a different student.
router.patch('/bookings/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const updates = {};

    if (req.body?.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ error: 'invalid status' });
      }
      updates.status = req.body.status;
    }

    if (typeof req.body?.lesson_date === 'string') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.lesson_date)) {
        return res.status(400).json({ error: 'lesson_date must be YYYY-MM-DD' });
      }
      updates.lesson_date = req.body.lesson_date;
    }
    if (typeof req.body?.time_slot === 'string') {
      if (!/^\d{2}:\d{2}(:\d{2})?$/.test(req.body.time_slot)) {
        return res.status(400).json({ error: 'time_slot must be HH:MM' });
      }
      updates.time_slot = req.body.time_slot.length === 5
        ? req.body.time_slot + ':00'
        : req.body.time_slot;
    }
    if (typeof req.body?.discipline_name === 'string') {
      const v = req.body.discipline_name.trim();
      if (v.length) {
        const ok = await query('SELECT 1 FROM disciplines WHERE name = $1', [v]);
        if (!ok.rows.length) return res.status(400).json({ error: 'Unknown discipline' });
        updates.discipline_name = v;
      }
    }
    if (typeof req.body?.meeting_url === 'string') {
      updates.meeting_url = req.body.meeting_url.trim() || null;
    }
    if (typeof req.body?.meeting_provider === 'string') {
      updates.meeting_provider = req.body.meeting_provider.trim() || null;
    }
    if (req.body?.student_id !== undefined) {
      if (req.body.student_id === null || req.body.student_id === '') {
        // Removing the student turns this into a "public" booking
        updates.student_id = null;
        updates.student_name = 'Группа';
        updates.is_public = true;
      } else {
        const u = await query('SELECT id, name FROM users WHERE id = $1', [req.body.student_id]);
        if (!u.rows.length) return res.status(404).json({ error: 'Student not found' });
        updates.student_id = u.rows[0].id;
        updates.student_name = u.rows[0].name;
        updates.is_public = false;
      }
    }
    if (req.body?.attended !== undefined) {
      // attended: true | false | null
      const v = req.body.attended;
      if (v !== null && typeof v !== 'boolean') {
        return res.status(400).json({ error: 'attended must be boolean or null' });
      }
      updates.attended = v;
      // When the admin marks a lesson attended/missed, also bump status
      // for convenience so dashboards stay coherent.
      if (v === true)  updates.status = 'completed';
      if (v === false) updates.status = 'cancelled';
    }

    const keys = Object.keys(updates);
    if (!keys.length) return res.status(400).json({ error: 'nothing to update' });

    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = keys.map((k) => updates[k]);
    vals.push(id);

    const r = await query(
      `UPDATE bookings SET ${sets}, updated_at = now()
       WHERE id = $${vals.length}
       RETURNING id`,
      vals
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/bookings/:id  — hard delete (irreversible).
// For "soft" cancel use PATCH ... { status: 'cancelled' } instead.
router.delete('/bookings/:id', async (req, res, next) => {
  try {
    const r = await query('DELETE FROM bookings WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    next(err);
  }
});

// =============================================================
//                         TEACHERS
// =============================================================
router.get('/teachers', async (req, res, next) => {
  try {
    const sql = `
      SELECT
        t.id, t.user_id, t.name, t.bio, t.experience, t.photo_url,
        t.rating, t.review_count, t.is_active, t.created_at,
        u.email, u.is_active AS user_active
      FROM teachers t
      LEFT JOIN users u ON u.id = t.user_id
      ORDER BY t.created_at DESC, t.name
    `;
    const r = await query(sql);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/teachers/:id  body: { is_active?, name?, bio?, experience?, photo_url? }
router.patch('/teachers/:id', async (req, res, next) => {
  try {
    const updates = {};
    if (req.body?.is_active !== undefined) updates.is_active = !!req.body.is_active;
    if (typeof req.body?.name       === 'string') updates.name       = req.body.name.trim();
    if (typeof req.body?.bio        === 'string') updates.bio        = req.body.bio;
    if (typeof req.body?.experience === 'string') updates.experience = req.body.experience;
    if (typeof req.body?.photo_url  === 'string') updates.photo_url  = req.body.photo_url || null;

    const keys = Object.keys(updates);
    if (!keys.length) return res.status(400).json({ error: 'nothing to update' });

    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const vals = keys.map((k) => updates[k]);
    vals.push(req.params.id);

    const upd = await query(
      `UPDATE teachers SET ${sets} WHERE id = $${vals.length}
       RETURNING id, user_id, name, bio, experience, photo_url, rating, review_count,
                 is_active, created_at`,
      vals
    );
    if (!upd.rows.length) return res.status(404).json({ error: 'Teacher not found' });
    res.json(upd.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/teachers/:id - remove a teacher profile and its linked
// teacher user account. Schedule slots/bookings cascade from teachers.
router.delete('/teachers/:id', async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const found = await client.query(
      'SELECT id, user_id FROM teachers WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (!found.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacher = found.rows[0];
    await client.query('DELETE FROM teachers WHERE id = $1', [teacher.id]);

    let deletedUserId = null;
    if (teacher.user_id) {
      const deletedUser = await client.query(
        `DELETE FROM users
          WHERE id = $1 AND role = 'teacher'
          RETURNING id`,
        [teacher.user_id]
      );
      deletedUserId = deletedUser.rows[0]?.id || null;
    }

    await client.query('COMMIT');
    res.json({ ok: true, id: teacher.id, deleted_user_id: deletedUserId });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    next(err);
  } finally {
    client.release();
  }
});

// =============================================================
//          SLOTS (admin can manage any teacher's schedule)
// =============================================================
// GET /api/admin/teachers/:id/slots?date=YYYY-MM-DD
router.get('/teachers/:id/slots', async (req, res, next) => {
  try {
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
    const r = await query(sql, [req.params.id, date]);
    res.json(r.rows.map((row) => ({
      ...row,
      free: Math.max(0, row.capacity - row.booked),
    })));
  } catch (err) {
    next(err);
  }
});

// =============================================================
//                       GROUPS (age × level × teacher)
// =============================================================
// Our DB doesn't have an explicit "groups" table — but the combination
// of (teacher × age_group × level) plus public/group bookings on the
// teacher's slots forms a virtual group. This endpoint synthesizes
// that view for the admin Groups page.

router.get('/groups', async (req, res, next) => {
  try {
    const sql = `
      WITH base AS (
        SELECT
          t.id                             AS teacher_id,
          t.name                           AS teacher_name,
          tag.age_group_name               AS age_name,
          tl.level_name                    AS level_name
        FROM teachers t
        LEFT JOIN teacher_age_groups tag ON tag.teacher_id = t.id
        LEFT JOIN teacher_levels    tl  ON tl.teacher_id  = t.id
        WHERE t.is_active = TRUE
      ),
      grouped AS (
        SELECT
          teacher_id, teacher_name, age_name, level_name,
          ROW_NUMBER() OVER (PARTITION BY teacher_id ORDER BY age_name, level_name) AS rn
        FROM base
      ),
      bk AS (
        SELECT
          b.teacher_id,
          tag.age_group_name AS age_name,
          COUNT(DISTINCT b.student_id) FILTER (WHERE b.student_id IS NOT NULL)::int AS students,
          COUNT(*)                                 FILTER (WHERE b.is_public = TRUE)::int AS group_lessons
        FROM bookings b
        LEFT JOIN teacher_age_groups tag ON tag.teacher_id = b.teacher_id
        WHERE b.status IN ('confirmed','pending','completed')
        GROUP BY b.teacher_id, tag.age_group_name
      )
      SELECT
        g.teacher_id, g.teacher_name, g.age_name, g.level_name,
        COALESCE(bk.students, 0)::int      AS students_count,
        COALESCE(bk.group_lessons, 0)::int AS group_lessons,
        (
          SELECT string_agg(DISTINCT
                   CASE EXTRACT(DOW FROM s.slot_date)::int
                     WHEN 1 THEN 'Пн' WHEN 2 THEN 'Вт' WHEN 3 THEN 'Ср'
                     WHEN 4 THEN 'Чт' WHEN 5 THEN 'Пт' WHEN 6 THEN 'Сб'
                     WHEN 0 THEN 'Вс' END,
                 ', ')
          FROM teacher_schedule_slots s
          WHERE s.teacher_id = g.teacher_id
            AND s.slot_date >= CURRENT_DATE - INTERVAL '7 days'
            AND s.slot_date <  CURRENT_DATE + INTERVAL '14 days'
        ) AS weekdays,
        (
          SELECT to_char(MIN(s.slot_time), 'HH24:MI') || '–' ||
                 to_char((MIN(s.slot_time) + INTERVAL '1 hour')::time, 'HH24:MI')
          FROM teacher_schedule_slots s
          WHERE s.teacher_id = g.teacher_id
        ) AS time_window
      FROM grouped g
      LEFT JOIN bk ON bk.teacher_id = g.teacher_id AND bk.age_name = g.age_name
      WHERE g.age_name IS NOT NULL OR g.level_name IS NOT NULL
      ORDER BY g.teacher_name, g.age_name NULLS LAST, g.level_name NULLS LAST
    `;
    const r = await query(sql);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/groups/summary — top metrics for the Groups page.
router.get('/groups/summary', async (req, res, next) => {
  try {
    const r = await query(`
      WITH grp AS (
        SELECT t.id AS teacher_id, tag.age_group_name AS age_name, tl.level_name AS level_name
        FROM teachers t
        LEFT JOIN teacher_age_groups tag ON tag.teacher_id = t.id
        LEFT JOIN teacher_levels    tl  ON tl.teacher_id  = t.id
        WHERE t.is_active = TRUE AND tag.age_group_name IS NOT NULL
      )
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE lower(age_name) ~ '(дет|4-6|7-10|6-12)'
        )::int AS kids_groups,
        COUNT(*) FILTER (
          WHERE lower(age_name) ~ '(подрост|молод|11-14|11-15|13-17|15-17|15-20|18-25)'
        )::int AS teen_groups,
        COUNT(*) FILTER (
          WHERE lower(age_name) ~ '(взрос|стар|20[+]|26|45)'
        )::int AS adult_groups
      FROM grp
    `);
    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
});

// =============================================================
//                       REPORTS
// =============================================================
// Aggregated statistics for the Reports page (charts + summary numbers).

router.get('/reports/summary', async (req, res, next) => {
  try {
    const r = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE role='student')                                         AS students_total,
        (SELECT COUNT(*)::int FROM users WHERE role='student'
              AND created_at >= NOW() - INTERVAL '30 days')                                            AS students_new_30d,
        (SELECT COUNT(*)::int FROM bookings
              WHERE created_at >= NOW() - INTERVAL '30 days')                                          AS bookings_30d,
        (SELECT COUNT(*)::int FROM bookings
              WHERE status='completed' AND lesson_date >= CURRENT_DATE - INTERVAL '30 days')           AS lessons_done_30d,
        (SELECT COUNT(*)::int FROM bookings
              WHERE status='cancelled' AND lesson_date >= CURRENT_DATE - INTERVAL '30 days')           AS lessons_cancelled_30d,
        (SELECT
            CASE WHEN c+x = 0 THEN NULL
                 ELSE ROUND(100.0 * c / NULLIF(c+x, 0))::int END
          FROM (
            SELECT
              COUNT(*) FILTER (WHERE status='completed')::int AS c,
              COUNT(*) FILTER (WHERE status='cancelled')::int AS x
            FROM bookings
            WHERE lesson_date >= CURRENT_DATE - INTERVAL '30 days'
          ) sub)                                                                                       AS attendance_pct_30d
    `);
    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/lessons-by-day?days=14
// Returns a 14-day series (oldest → newest): { date, completed, cancelled, pending, total }
router.get('/reports/lessons-by-day', async (req, res, next) => {
  try {
    const days = Math.min(60, Math.max(7, parseInt(req.query.days, 10) || 14));
    const sql = `
      WITH dates AS (
        SELECT (CURRENT_DATE - (n || ' days')::interval)::date AS d
          FROM generate_series(0, $1 - 1) AS n
      )
      SELECT
        d::text AS date,
        COALESCE(SUM(CASE WHEN b.status='completed' THEN 1 ELSE 0 END), 0)::int AS completed,
        COALESCE(SUM(CASE WHEN b.status='cancelled' THEN 1 ELSE 0 END), 0)::int AS cancelled,
        COALESCE(SUM(CASE WHEN b.status='pending'   THEN 1 ELSE 0 END), 0)::int AS pending,
        COALESCE(SUM(CASE WHEN b.status='confirmed' THEN 1 ELSE 0 END), 0)::int AS confirmed,
        COUNT(b.id)::int                                                        AS total
      FROM dates
      LEFT JOIN bookings b ON b.lesson_date = dates.d
      GROUP BY d
      ORDER BY d ASC
    `;
    const r = await query(sql, [days]);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/by-discipline — pie / breakdown of recent
// bookings by discipline.
router.get('/reports/by-discipline', async (req, res, next) => {
  try {
    const sql = `
      SELECT
        COALESCE(b.discipline_name, '(не указана)')::text AS name,
        COUNT(*)::int                                     AS count
      FROM bookings b
      WHERE b.lesson_date >= CURRENT_DATE - INTERVAL '60 days'
      GROUP BY b.discipline_name
      ORDER BY count DESC
      LIMIT 10
    `;
    const r = await query(sql);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/reports/teacher-load — top teachers by recent activity.
router.get('/reports/teacher-load', async (req, res, next) => {
  try {
    const r = await query(`
      SELECT
        t.id, t.name,
        COUNT(b.id) FILTER (WHERE b.lesson_date >= CURRENT_DATE - INTERVAL '30 days')::int AS lessons_30d,
        COUNT(b.id) FILTER (WHERE b.status = 'completed'
                            AND  b.lesson_date >= CURRENT_DATE - INTERVAL '30 days')::int  AS done_30d,
        COUNT(DISTINCT b.student_id) FILTER (WHERE b.student_id IS NOT NULL
                                             AND  b.lesson_date >= CURRENT_DATE - INTERVAL '30 days')::int AS students_30d
      FROM teachers t
      LEFT JOIN bookings b ON b.teacher_id = t.id
      GROUP BY t.id, t.name
      ORDER BY lessons_30d DESC, t.name
      LIMIT 10
    `);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// =============================================================
//                       ATTENDANCE
// =============================================================
// Compact endpoints for the new "Посещаемость" admin page.

// GET /api/admin/attendance/summary
router.get('/attendance/summary', async (req, res, next) => {
  try {
    const r = await query(`
      SELECT
        COUNT(*) FILTER (WHERE attended = TRUE)::int  AS attended,
        COUNT(*) FILTER (WHERE attended = FALSE)::int AS missed,
        COUNT(*) FILTER (WHERE attended IS NULL
                          AND lesson_date < CURRENT_DATE
                          AND status IN ('confirmed','pending'))::int AS pending,
        COUNT(*) FILTER (WHERE lesson_date = CURRENT_DATE)::int AS today_total,
        COUNT(*) FILTER (WHERE lesson_date >= CURRENT_DATE - INTERVAL '7 days'
                         AND attended = TRUE)::int AS attended_week,
        COUNT(*) FILTER (WHERE lesson_date >= CURRENT_DATE - INTERVAL '7 days'
                         AND attended IS NOT NULL)::int AS marked_week
      FROM bookings
    `);
    const s = r.rows[0];
    const pct = s.marked_week > 0
      ? Math.round((s.attended_week * 100) / s.marked_week)
      : null;
    res.json({ ...s, attendance_pct_week: pct });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/attendance/recent?limit=N — recent lessons that need
// attendance marked (or were just marked), used for the panel under
// the summary cards on the page.
router.get('/attendance/recent', async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const sql = `
      SELECT
        b.id,
        b.student_id, b.student_name,
        b.teacher_id, COALESCE(t.name, b.teacher_name) AS teacher_name,
        b.lesson_date, b.time_slot, b.status,
        b.discipline_name, b.attended, b.is_public
      FROM bookings b
      LEFT JOIN teachers t ON t.id = b.teacher_id
      WHERE b.lesson_date <= CURRENT_DATE
        AND b.status IN ('pending','confirmed','completed','cancelled')
      ORDER BY b.lesson_date DESC, b.time_slot DESC
      LIMIT $1
    `;
    const r = await query(sql, [limit]);
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// =============================================================
//                       GROUPS
// =============================================================
// "Groups" are derived from teacher_age_groups + teacher_levels +
// the public group bookings. Each (age_group, level, teacher) tuple
// that has public bookings forms a virtual group.

router.get('/groups/summary', async (req, res, next) => {
  try {
    const r = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM age_groups)                     AS total_age_groups,
        (SELECT COUNT(*)::int FROM levels)                         AS total_levels,
        (SELECT COUNT(DISTINCT teacher_id)::int FROM bookings
            WHERE is_public = TRUE)                                AS active_teachers_with_groups,
        (SELECT COUNT(*)::int FROM bookings
            WHERE is_public = TRUE
              AND status IN ('pending','confirmed'))               AS active_group_lessons
    `);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// GET /api/admin/groups — virtual groups list
// Each group: { id, age_group, level, teacher, lessons_count, students_count, capacity_used }
router.get('/groups', async (req, res, next) => {
  try {
    const sql = `
      WITH grp AS (
        SELECT
          tag.age_group_name      AS age_group,
          tl.level_name           AS level,
          t.id                    AS teacher_id,
          t.name                  AS teacher_name,
          t.photo_url             AS teacher_photo,
          COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('pending','confirmed','completed'))::int AS lessons_count,
          COUNT(DISTINCT b.student_id) FILTER (WHERE b.student_id IS NOT NULL)::int AS students_count,
          MAX(s.capacity)         AS max_capacity
        FROM teachers t
        JOIN teacher_age_groups tag ON tag.teacher_id = t.id
        JOIN teacher_levels     tl  ON tl.teacher_id  = t.id
        LEFT JOIN bookings b
          ON b.teacher_id = t.id AND b.is_public = TRUE
        LEFT JOIN teacher_schedule_slots s
          ON s.teacher_id = t.id AND s.capacity > 1
        WHERE t.is_active = TRUE
        GROUP BY tag.age_group_name, tl.level_name, t.id, t.name, t.photo_url
      )
      SELECT * FROM grp
      ORDER BY age_group, level, teacher_name
    `;
    const r = await query(sql);
    res.json(r.rows);
  } catch (err) { next(err); }
});

// =============================================================
//                       REPORTS / ANALYTICS
// =============================================================
// Pre-computed series and totals for the Reports admin page.

router.get('/reports/overview', async (req, res, next) => {
  try {
    const days = Math.min(60, Math.max(7, parseInt(req.query.days, 10) || 30));

    // 1) Lessons-per-day series (the headline chart).
    const series = await query(
      `WITH days AS (
         SELECT generate_series(
           (CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day')::date,
           CURRENT_DATE::date,
           INTERVAL '1 day'
         )::date AS d
       )
       SELECT
         d AS day,
         COALESCE(SUM(CASE WHEN b.status IN ('confirmed','completed','pending') THEN 1 ELSE 0 END), 0)::int AS lessons,
         COALESCE(SUM(CASE WHEN b.attended = TRUE THEN 1 ELSE 0 END), 0)::int                              AS attended,
         COALESCE(SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END), 0)::int                         AS cancelled
       FROM days
       LEFT JOIN bookings b ON b.lesson_date = days.d
       GROUP BY d ORDER BY d`,
      [days]
    );

    // 2) Discipline breakdown (donut)
    const byDiscipline = await query(`
      SELECT discipline_name AS name, COUNT(*)::int AS value
      FROM bookings
      WHERE lesson_date >= CURRENT_DATE - INTERVAL '30 days'
        AND discipline_name IS NOT NULL
      GROUP BY discipline_name
      ORDER BY value DESC
    `);

    // 3) Top teachers by completed lessons (bars)
    const topTeachers = await query(`
      SELECT COALESCE(t.name, b.teacher_name) AS name,
             COUNT(*)::int                    AS lessons
      FROM bookings b
      LEFT JOIN teachers t ON t.id = b.teacher_id
      WHERE b.status IN ('confirmed','completed')
        AND b.lesson_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY name
      ORDER BY lessons DESC
      LIMIT 5
    `);

    // 4) Status distribution
    const statusDist = await query(`
      SELECT status, COUNT(*)::int AS n
      FROM bookings
      WHERE lesson_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY status
    `);

    // 5) Totals & deltas
    const totals = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM bookings WHERE lesson_date >= CURRENT_DATE - INTERVAL '7 days')                AS lessons_week,
        (SELECT COUNT(*)::int FROM bookings WHERE lesson_date >= CURRENT_DATE - INTERVAL '14 days'
                                              AND lesson_date <  CURRENT_DATE - INTERVAL '7 days')                AS lessons_prev_week,
        (SELECT COUNT(*)::int FROM users WHERE role = 'student' AND created_at >= NOW() - INTERVAL '30 days')     AS new_students_month,
        (SELECT COUNT(*)::int FROM users WHERE role = 'student' AND is_active = TRUE)                             AS active_students,
        (SELECT
          CASE WHEN c+x = 0 THEN NULL
               ELSE ROUND(100.0 * c / NULLIF(c+x, 0))::int END
         FROM (
           SELECT
             COUNT(*) FILTER (WHERE attended = TRUE)::int AS c,
             COUNT(*) FILTER (WHERE attended = FALSE)::int AS x
           FROM bookings
         ) sub)                                                                                                    AS attendance_pct_total
    `);

    res.json({
      days,
      series:        series.rows,
      by_discipline: byDiscipline.rows,
      top_teachers:  topTeachers.rows,
      status_dist:   statusDist.rows,
      totals:        totals.rows[0],
    });
  } catch (err) { next(err); }
});

// =============================================================
//                       GROUPS
// =============================================================
// "Groups" = synthetic units derived from age_group × level. Each
// group has: a teacher (the most-frequent teacher who has slots
// matching this combination), capacity (sum of capacities of
// matching slots), enrolled count (active bookings), and a
// schedule snippet (weekdays).

router.get('/groups-summary', async (req, res, next) => {
  try {
    const r = await query(`
      WITH base AS (
        SELECT DISTINCT
          tag.age_group_name AS age_group,
          tl.level_name      AS level
        FROM teacher_age_groups tag
        JOIN teacher_levels tl ON tl.teacher_id = tag.teacher_id
      )
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM bookings b
            JOIN teacher_age_groups tag2 ON tag2.teacher_id = b.teacher_id
            WHERE tag2.age_group_name = base.age_group
              AND b.status IN ('pending','confirmed')
          )
        )::int AS active,
        COUNT(*) FILTER (WHERE age_group ~ '^(4-6|7-10|11-15|11-14|7-10 лет|4-6 лет)')::int  AS kids,
        COUNT(*) FILTER (WHERE age_group ~ '^(15-20|15-17)')::int                            AS teens
      FROM base
    `);
    res.json(r.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/groups — list of synthetic groups
router.get('/groups', async (req, res, next) => {
  try {
    // Build the cross product of (age_group, level) that some teacher
    // actually offers, then enrich with one representative teacher,
    // total capacity, and active student count.
    const sql = `
      WITH base AS (
        SELECT DISTINCT
          tag.age_group_name AS age_group,
          tl.level_name      AS level
        FROM teacher_age_groups tag
        JOIN teacher_levels tl ON tl.teacher_id = tag.teacher_id
      ),
      enriched AS (
        SELECT
          b.age_group,
          b.level,
          -- pick one teacher who covers BOTH this age group and this
          -- level. Most-frequent first by # of slots.
          (
            SELECT t.id || '|' || t.name
              FROM teachers t
              JOIN teacher_age_groups tag ON tag.teacher_id = t.id
              JOIN teacher_levels    tl  ON tl.teacher_id  = t.id
              LEFT JOIN teacher_schedule_slots s ON s.teacher_id = t.id
              WHERE tag.age_group_name = b.age_group
                AND tl.level_name      = b.level
                AND t.is_active = TRUE
              GROUP BY t.id, t.name
              ORDER BY COUNT(s.id) DESC, t.name
              LIMIT 1
          ) AS teacher_pair,
          -- total active bookings tagged with this age group + on a teacher with this level
          (
            SELECT COUNT(*)::int FROM bookings bk
              JOIN teacher_age_groups tag2 ON tag2.teacher_id = bk.teacher_id
              JOIN teacher_levels    tl2  ON tl2.teacher_id  = bk.teacher_id
              WHERE tag2.age_group_name = b.age_group
                AND tl2.level_name      = b.level
                AND bk.status IN ('pending','confirmed')
          ) AS enrolled,
          -- nominal capacity = sum of capacities on matching slots
          (
            SELECT COALESCE(SUM(s.capacity), 0)::int
              FROM teacher_schedule_slots s
              JOIN teacher_age_groups tag3 ON tag3.teacher_id = s.teacher_id
              JOIN teacher_levels    tl3  ON tl3.teacher_id  = s.teacher_id
              WHERE tag3.age_group_name = b.age_group
                AND tl3.level_name      = b.level
                AND s.slot_date >= CURRENT_DATE - INTERVAL '7 days'
          ) AS capacity,
          -- weekdays + first daily window (HH:MM–HH:MM)
          (
            SELECT string_agg(DISTINCT
                     CASE EXTRACT(DOW FROM s.slot_date)::int
                       WHEN 1 THEN 'Пн' WHEN 2 THEN 'Вт' WHEN 3 THEN 'Ср'
                       WHEN 4 THEN 'Чт' WHEN 5 THEN 'Пт' WHEN 6 THEN 'Сб'
                       WHEN 0 THEN 'Вс' END,
                   ', ')
              FROM teacher_schedule_slots s
              JOIN teacher_age_groups tag4 ON tag4.teacher_id = s.teacher_id
              JOIN teacher_levels    tl4  ON tl4.teacher_id  = s.teacher_id
              WHERE tag4.age_group_name = b.age_group
                AND tl4.level_name      = b.level
                AND s.slot_date >= CURRENT_DATE - INTERVAL '7 days'
                AND s.slot_date <  CURRENT_DATE + INTERVAL '14 days'
          ) AS weekdays,
          (
            SELECT MIN(s.slot_time)::text || '–' ||
                   (MIN(s.slot_time) + INTERVAL '1 hour')::time::text
              FROM teacher_schedule_slots s
              JOIN teacher_age_groups tag5 ON tag5.teacher_id = s.teacher_id
              JOIN teacher_levels    tl5  ON tl5.teacher_id  = s.teacher_id
              WHERE tag5.age_group_name = b.age_group
                AND tl5.level_name      = b.level
          ) AS time_window
        FROM base b
      )
      SELECT
        age_group, level,
        split_part(teacher_pair, '|', 1) AS teacher_id,
        split_part(teacher_pair, '|', 2) AS teacher_name,
        COALESCE(enrolled, 0)  AS enrolled,
        COALESCE(capacity, 0)  AS capacity,
        weekdays, time_window
      FROM enriched
      ORDER BY age_group, level
    `;
    const r = await query(sql);
    // Tag groups with a synthetic id and a course label
    const out = r.rows.map((g, i) => ({
      id: `g_${i + 1}`,
      ...g,
      course_name: courseFromAgeAndLevel(g.age_group, g.level),
    }));
    res.json(out);
  } catch (err) {
    next(err);
  }
});

function courseFromAgeAndLevel(age, level) {
  // Friendly title for the card. Tries to map common combinations to a
  // recognizable Quran-curriculum name; falls back to "<level> · <age>".
  const a = String(age || '').toLowerCase();
  const l = String(level || '').toLowerCase();
  if (l.includes('начальн'))   return a.includes('11-15') ? 'Основы Корана для детей' : 'Основы Корана';
  if (l.includes('средн'))     return 'Таджвид · ' + age;
  if (l.includes('продвинут')) return 'Хифз для ' + (a.includes('15-20') ? 'подростков' : 'взрослых');
  return `${level} · ${age}`;
}

// =============================================================
//                       REPORTS / ANALYTICS
module.exports = router;
