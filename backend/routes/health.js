/* =============================================================
   GET /api/health — liveness + DB connectivity check
============================================================= */
'use strict';

const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const r = await query('SELECT 1 AS ok, now() AS ts');
    const payload = {
      status: 'ok',
      database: 'connected',
      timestamp: r.rows[0].ts,
    };
    if (process.env.NODE_ENV !== 'production') {
      payload.currentUserId = process.env.CURRENT_USER_ID || null;
    }
    res.json(payload);
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: err.message,
    });
  }
});

module.exports = router;
