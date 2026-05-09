/* =============================================================
   set-user-password.js — DEV ONLY.
   Sets a password (bcrypt hash) on an existing user by email.

   Usage:
     node scripts/set-user-password.js <email> <password>

   Touches ONLY users.password_hash. Does not change role, id,
   is_active, or any other field.
============================================================= */
'use strict';

require('dotenv').config();

const bcrypt = require('bcryptjs');
const { query, shutdown } = require('../db');

const BCRYPT_ROUNDS = 10;

async function main() {
  const [emailArg, passwordArg] = process.argv.slice(2);

  if (!emailArg || !passwordArg) {
    console.error('Usage: node scripts/set-user-password.js <email> <password>');
    process.exit(1);
  }

  const email = String(emailArg).trim().toLowerCase();
  const password = String(passwordArg);

  if (password.length < 6) {
    console.error('error: password must be at least 6 characters');
    process.exit(1);
  }

  // 1. Look the user up.
  const found = await query(
    'SELECT id, email FROM users WHERE LOWER(email) = $1',
    [email]
  );
  if (!found.rows.length) {
    console.error(`error: no user with email ${email}`);
    process.exit(2);
  }

  // 2. Hash and update — ONLY password_hash.
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await query(
    'UPDATE users SET password_hash = $1 WHERE LOWER(email) = $2',
    [hash, email]
  );

  console.log(`password updated for ${email}`);
}

main()
  .catch((err) => {
    console.error('error:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Always close the pool so the process exits cleanly.
    try { await shutdown(); } catch (_) {}
  });
