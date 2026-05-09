/* =============================================================
   /api/schedule/me — aggregated payload for schedule.html
   Returns:
     - week:     7 days (Mon..Sun) of the current week with event flags
     - upcoming: next 2 active bookings of the current user
     - future:   following 3 active bookings
   Frontend formats Russian weekday names + UI quotes itself.
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');

router.get('/me', async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.json({ week: [], upcoming: [], future: [] });
    }
    const userId = req.user.id;

    // ---- WEEK strip: Mon..Sun of the current ISO week
    const weekSql = `
      WITH days AS (
        SELECT generate_series(
          date_trunc('week', CURRENT_DATE)::date,
          (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::date,
          '1 day'::interval
        )::date AS d
      ),
      events AS (
        SELECT
          b.lesson_date AS d,
          bool_or(b.is_public) AS has_public,
          count(*)::int AS lesson_count
        FROM bookings b
        WHERE b.student_id = $1
          AND b.status IN ('pending','confirmed')
        GROUP BY b.lesson_date
      )
      SELECT
        days.d AS date,
        EXTRACT(ISODOW FROM days.d)::int AS dow,
        (days.d = CURRENT_DATE) AS is_today,
        (events.lesson_count IS NOT NULL) AS has_event,
        CASE
          WHEN events.has_public IS TRUE  THEN 'gold'
          WHEN events.lesson_count > 0    THEN 'green'
          ELSE NULL
        END AS event_color
      FROM days
      LEFT JOIN events ON events.d = days.d
      ORDER BY days.d
    `;

    // ---- Active bookings from today onward
    const bookingsSql = `
      SELECT
        b.id,
        b.lesson_date AS date,
        b.time_slot,
        b.status,
        b.discipline_name AS discipline,
        b.is_public,
        COALESCE(t.name, b.teacher_name) AS teacher_name,
        t.photo_url AS teacher_photo_url,
        b.meeting_provider,
        COALESCE(b.meeting_url, b.zoom_link) AS meeting_url,
        b.meeting_id,
        b.meeting_password
      FROM bookings b
      LEFT JOIN teachers t ON t.id = b.teacher_id
      WHERE b.student_id = $1
        AND b.lesson_date >= CURRENT_DATE
        AND b.status IN ('pending','confirmed')
      ORDER BY b.lesson_date, b.time_slot
      LIMIT 20
    `;

    const [week, bookings] = await Promise.all([
      query(weekSql, [userId]),
      query(bookingsSql, [userId]),
    ]);

    res.json({
      week: week.rows,
      upcoming: bookings.rows.slice(0, 2),
      future: bookings.rows.slice(2, 5),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
