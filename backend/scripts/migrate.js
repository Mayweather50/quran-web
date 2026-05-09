/* =============================================================
   Run all *.sql files in sql/ in alphabetical order.
   Usage: npm run migrate
============================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const { pool, shutdown } = require('../db');

(async () => {
  const dir = path.join(__dirname, '..', 'sql');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  if (!files.length) {
    console.log('[migrate] no .sql files in', dir);
    return shutdown();
  }
  const client = await pool.connect();
  try {
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      console.log(`[migrate] applying ${f} ...`);
      await client.query(sql);
      console.log(`[migrate] ✓ ${f}`);
    }
    console.log('[migrate] done.');
  } catch (err) {
    console.error('[migrate] failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await shutdown();
  }
})();
