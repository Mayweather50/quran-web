/* =============================================================
   PostgreSQL connection pool + query helper.
   All routes go through `query()` so we have one place
   for parameter binding, logging and error reporting.
============================================================= */
'use strict';

const { Pool, types } = require('pg');
require('dotenv').config();

// ---- Type parsers --------------------------------------------------
// DATE (OID 1082): return as plain "YYYY-MM-DD" string instead of a JS Date.
// Avoids timezone shifts when serializing to JSON.
types.setTypeParser(1082, (val) => val);

// TIME without time zone (OID 1083): "HH:MM:SS" → "HH:MM".
types.setTypeParser(1083, (val) => (val ? String(val).substring(0, 5) : val));

// NUMERIC (OID 1700): parse to JS number so JSON looks clean.
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

// ---- Pool ----------------------------------------------------------
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'quran_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[pg] idle client error:', err.message);
});

// ---- Helpers -------------------------------------------------------
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    if (process.env.LOG_QUERIES === 'true') {
      const ms = Date.now() - start;
      const preview = text.replace(/\s+/g, ' ').trim().slice(0, 100);
      console.log(`[sql ${ms}ms ${res.rowCount ?? '-'} rows] ${preview}`);
    }
    return res;
  } catch (err) {
    const preview = text.replace(/\s+/g, ' ').trim().slice(0, 200);
    console.error('[sql error]', err.message);
    console.error('[sql query]', preview);
    if (params && params.length) console.error('[sql params]', params);
    throw err;
  }
}

async function getClient() {
  return pool.connect();
}

async function shutdown() {
  await pool.end();
}

module.exports = { query, getClient, pool, shutdown };
