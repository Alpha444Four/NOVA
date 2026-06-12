#!/usr/bin/env node
/**
 * Apply NOVA schema to Supabase/Postgres.
 * Usage: DATABASE_URL=... node scripts/apply-supabase-sql.js
 *        POSTGRES_URL=... node scripts/apply-supabase-sql.js  (Vercel integration)
 */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const ROOT = path.join(__dirname, "..");

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
}

async function main() {
  const url = getDatabaseUrl();
  if (!url || url.includes("[YOUR-PASSWORD]")) {
    console.error("Set DATABASE_URL or POSTGRES_URL to a valid Postgres connection string.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const migration = fs.readFileSync(
    path.join(ROOT, "supabase", "migrations", "20260328000000_nova_schema.sql"),
    "utf8"
  );

  try {
    await pool.query(migration);
    const seedPath = path.join(ROOT, "supabase", "seed.sql");
    if (fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, "utf8");
      if (seed.trim()) await pool.query(seed).catch(() => {});
    }
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM products) AS products
    `);
    console.log("Schema applied. users=%d products=%d", rows[0].users, rows[0].products);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
