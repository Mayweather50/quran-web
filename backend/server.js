/* =============================================================
   Express app — entry point.
   Mounts all routers and configures CORS, JSON parsing,
   the JWT auth middleware, and a global error handler.
============================================================= */
'use strict';

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { query, shutdown } = require('./db');
const { attachUser } = require('./auth');

const app = express();

// ---------------------------------------------------------------
// CORS
// ---------------------------------------------------------------
const allowedOrigins = (process.env.FRONTEND_ORIGIN ||
  'http://127.0.0.1:5500,http://localhost:5500')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Dev convenience: also auto-allow any localhost / 127.0.0.1 port,
// because Live Server / vite / etc. don't always pick 5500.
function isOriginAllowed(origin) {
  if (!origin) return true; // curl, Postman, server-to-server
  if (origin === 'null' && process.env.ALLOW_FILE_ORIGIN !== 'false') return true; // local file:// development
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin(origin, cb) {
      if (isOriginAllowed(origin)) return cb(null, true);
      console.warn(`[cors] blocked origin: ${origin}`);
      return cb(null, false); // no CORS headers → browser blocks with clear message
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------
// Optional request logger
// ---------------------------------------------------------------
if (process.env.LOG_REQUESTS !== 'false') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(
        `${req.method.padEnd(6)} ${res.statusCode} ${Date.now() - start}ms  ${req.originalUrl}`
      );
    });
    next();
  });
}

// ---------------------------------------------------------------
// AUTH (JWT)
// Reads `Authorization: Bearer <jwt>`, looks the user up, sets
// req.user when valid. Does NOT 401 — anonymous browsing is
// allowed for public endpoints. Routes that need auth use
// requireAuth / requireRole from ./auth.
//
// Falls back to CURRENT_USER_ID env var if no token (legacy dev shim).
// ---------------------------------------------------------------
app.use(attachUser);

// ---------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api', require('./routes/lookups'));            // /age-groups, /levels, /disciplines, /booking-info
app.use('/api/quotes', require('./routes/quotes'));       // /api/quotes — rotating citations
app.use('/api/teachers', require('./routes/teachers'));   // public list + slot CRUD
app.use('/api/teacher', require('./routes/teacher'));     // /teacher/me/* (logged-in teacher)
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/student-progress', require('./routes/progress'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api', require('./routes/favorites'));           // /users/:id/favorite-teachers/...
app.use('/api/admin', require('./routes/admin'));         // admin panel
app.use('/api/chats', require('./routes/chats'));         // 1-1 chats

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ---------------------------------------------------------------
// Boot
// ---------------------------------------------------------------
const PORT = parseInt(process.env.PORT, 10) || 3000;

(async () => {
  try {
    const r = await query('SELECT now() AS now, current_database() AS db');
    console.log(`[db] connected to "${r.rows[0].db}" at ${r.rows[0].now}`);
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    console.error('     check .env values: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
    console.log(`[cors]   allowed origins: ${allowedOrigins.join(', ')}`);
    if (process.env.CURRENT_USER_ID) {
      console.log(`[auth]   dev fallback user: ${process.env.CURRENT_USER_ID}`);
    }
    if (!process.env.JWT_SECRET) {
      console.warn(`[auth]   ⚠ JWT_SECRET not set — using "dev-secret-change-me". DO NOT use in production.`);
    }
  });
})();

// Graceful shutdown
['SIGINT', 'SIGTERM'].forEach((sig) =>
  process.on(sig, async () => {
    console.log(`\n[server] ${sig} received, closing pool…`);
    await shutdown().catch(() => {});
    process.exit(0);
  })
);
