/* =============================================================
   /api/student-progress — current user / specific student
   Plus completed-surahs sub-resource.
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');

const PROGRESS_SQL = `
  SELECT
    sp.student_id,
    u.name        AS student_name,
    u.email,
    u.avatar_url,
    sp.level_name,
    sp.lessons_completed,
    sp.hours_studied,
    sp.updated_at,
    COALESCE(
      (SELECT json_agg(
                json_build_object(
                  'surah_number', cs.surah_number,
                  'name',         cs.name,
                  'arabic_name',  cs.arabic_name,
                  'completed_at', cs.completed_at
                ) ORDER BY cs.surah_number)
         FROM completed_surahs cs WHERE cs.student_id = sp.student_id),
      '[]'::json
    ) AS completed_surahs
  FROM student_progress sp
  JOIN users u ON u.id = sp.student_id
  WHERE sp.student_id = $1
`;

const SURAHS_SQL = `
  SELECT cs.surah_number, cs.name, cs.arabic_name, cs.completed_at
    FROM completed_surahs cs
   WHERE cs.student_id = $1
   ORDER BY cs.surah_number
`;

async function fetchProgress(studentId, res) {
  const r = await query(PROGRESS_SQL, [studentId]);
  if (!r.rows.length) return res.status(404).json({ error: 'Progress not found' });
  res.json(r.rows[0]);
}

async function fetchSurahs(studentId, res) {
  const r = await query(SURAHS_SQL, [studentId]);
  res.json(r.rows);
}

// ---- /me variants (current user via auth shim) ----
router.get('/me', async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    await fetchProgress(req.user.id, res);
  } catch (err) {
    next(err);
  }
});

router.get('/me/completed-surahs', async (req, res, next) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Not authenticated' });
    await fetchSurahs(req.user.id, res);
  } catch (err) {
    next(err);
  }
});

// ---- /:studentId variants ----
router.get('/:studentId', async (req, res, next) => {
  try {
    await fetchProgress(req.params.studentId, res);
  } catch (err) {
    next(err);
  }
});

router.get('/:studentId/completed-surahs', async (req, res, next) => {
  try {
    await fetchSurahs(req.params.studentId, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
