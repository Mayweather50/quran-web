/* =============================================================
   Production readiness checks for the backend.
   Usage: npm run preflight
============================================================= */
'use strict';

require('dotenv').config();

const { query, shutdown } = require('../db');

const REQUIRED_ENV = [
  'NODE_ENV',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'FRONTEND_ORIGIN',
  'JWT_SECRET',
];

const REQUIRED_TABLES = [
  'age_groups',
  'levels',
  'disciplines',
  'users',
  'user_consents',
  'teachers',
  'teacher_disciplines',
  'teacher_age_groups',
  'teacher_levels',
  'teacher_schedule_slots',
  'bookings',
  'reviews',
  'favorite_teachers',
  'student_progress',
  'completed_surahs',
  'quotes',
  'chats',
  'messages',
];

const REQUIRED_INDEXES = [
  'uq_bookings_active_student_date_time',
];

const errors = [];
const warnings = [];

function hasValue(name) {
  return String(process.env[name] || '').trim().length > 0;
}

function isLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function checkEnvironment() {
  for (const name of REQUIRED_ENV) {
    if (!hasValue(name)) errors.push(`${name} is required`);
  }

  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV is not "production"');
  }

  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || /change-me|replace_with|dev-secret/i.test(secret)) {
    errors.push('JWT_SECRET must be a long random value, not a placeholder');
  }

  if (hasValue('CURRENT_USER_ID')) {
    errors.push('CURRENT_USER_ID must be empty in production');
  }

  if (process.env.ALLOW_FILE_ORIGIN !== 'false') {
    warnings.push('ALLOW_FILE_ORIGIN should be false in production');
  }

  const origins = String(process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (origins.includes('*')) {
    errors.push('FRONTEND_ORIGIN must not contain "*" in production');
  }
  if (origins.some(isLocalOrigin)) {
    warnings.push('FRONTEND_ORIGIN contains localhost/127.0.0.1');
  }

  const port = Number.parseInt(process.env.PORT || '3001', 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    errors.push('PORT must be a valid TCP port');
  }
}

async function checkDatabase() {
  const db = await query('SELECT current_database() AS name, now() AS ts');
  console.log(`[preflight] database connected: ${db.rows[0].name}`);

  const tableResult = await query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])`,
    [REQUIRED_TABLES]
  );
  const foundTables = new Set(tableResult.rows.map((r) => r.table_name));
  const missingTables = REQUIRED_TABLES.filter((name) => !foundTables.has(name));
  if (missingTables.length) {
    errors.push(`missing tables: ${missingTables.join(', ')}`);
  }

  const indexResult = await query(
    `SELECT indexname
       FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = ANY($1::text[])`,
    [REQUIRED_INDEXES]
  );
  const foundIndexes = new Set(indexResult.rows.map((r) => r.indexname));
  const missingIndexes = REQUIRED_INDEXES.filter((name) => !foundIndexes.has(name));
  if (missingIndexes.length) {
    errors.push(`missing indexes: ${missingIndexes.join(', ')}`);
  }
}

(async () => {
  console.log('[preflight] checking production readiness...');
  checkEnvironment();

  try {
    await checkDatabase();
  } catch (err) {
    errors.push(`database check failed: ${err.message}`);
  } finally {
    await shutdown().catch(() => {});
  }

  if (warnings.length) {
    console.log('\nWarnings:');
    warnings.forEach((msg) => console.log(`  - ${msg}`));
  }

  if (errors.length) {
    console.error('\nRelease blockers:');
    errors.forEach((msg) => console.error(`  - ${msg}`));
    process.exitCode = 1;
    return;
  }

  console.log('\n[preflight] OK - backend is ready for production start.');
})();
