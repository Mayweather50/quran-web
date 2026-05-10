/* =============================================================
   Lookup tables — age_groups, levels, disciplines.
   Plus /api/booking-info?age_group=… that aggregates
   teachers + disciplines for a given age group.

   Note: the level "Хафиз" was removed from the product.
   It is filtered out at the API layer.
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');

// ---------------- GET /api/age-groups ----------------
router.get('/age-groups', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT name FROM age_groups
       ORDER BY name`
    );
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// ---------------- GET /api/levels --------------------
router.get('/levels', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT name FROM levels
       ORDER BY CASE name
         WHEN 'Начальный' THEN 1
         WHEN 'Средний' THEN 2
         WHEN 'Продвинутый' THEN 3
         ELSE 99
       END, name`
    );
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// ---------------- GET /api/disciplines ---------------
router.get('/disciplines', async (req, res, next) => {
  try {
    const r = await query('SELECT name FROM disciplines ORDER BY name');
    res.json(r.rows);
  } catch (err) {
    next(err);
  }
});

// ---------------- GET /api/booking-info?age_group=… --
// Returns disciplines + teachers available for the given age group.
// Used by booking.html to populate the right-side card.
router.get('/booking-info', async (req, res, next) => {
  try {
    const ageGroup = req.query.age_group;
    if (!ageGroup) {
      return res.status(400).json({ error: 'age_group query param required' });
    }

    // Verify age group exists
    const exists = await query('SELECT 1 FROM age_groups WHERE name = $1', [ageGroup]);
    if (!exists.rows.length) {
      return res.status(404).json({ error: `Age group "${ageGroup}" not found` });
    }

    const teachersSql = `
      SELECT t.id, t.name, t.photo_url, t.rating, t.review_count
      FROM teachers t
      JOIN teacher_age_groups tag ON tag.teacher_id = t.id
      WHERE tag.age_group_name = $1 AND t.is_active = TRUE
      ORDER BY t.rating DESC NULLS LAST, t.name
    `;
    const disciplinesSql = `
      SELECT DISTINCT td.discipline_name AS name
      FROM teacher_disciplines td
      JOIN teacher_age_groups tag ON tag.teacher_id = td.teacher_id
      JOIN teachers t ON t.id = td.teacher_id
      WHERE tag.age_group_name = $1 AND t.is_active = TRUE
      ORDER BY td.discipline_name
    `;

    const [teachers, disciplines] = await Promise.all([
      query(teachersSql, [ageGroup]),
      query(disciplinesSql, [ageGroup]),
    ]);

    res.json({
      age_group: ageGroup,
      teachers: teachers.rows,
      disciplines: disciplines.rows,
      default_teacher: teachers.rows[0] || null,
      default_duration: 45,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
