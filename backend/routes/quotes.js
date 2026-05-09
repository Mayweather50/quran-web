/* =============================================================
   /api/quotes — feeds the rotating citation card on the home page.
   Read-only public endpoint; admin can later add CRUD if needed.
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');

// GET /api/quotes
router.get('/', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT id, source, text
         FROM quotes
        WHERE is_active = TRUE
        ORDER BY id`
    );
    res.json(r.rows);
  } catch (err) {
    // If the table doesn't exist yet on a stale install, gracefully
    // return an empty list instead of 500-ing — the UI just hides
    // the quote section.
    if (err.code === '42P01') return res.json([]);
    next(err);
  }
});

module.exports = router;
