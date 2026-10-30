#!/usr/bin/env node
/**
 * Load fixtures/seed.json into a disposable MySQL/MariaDB.
 * Requires DASH_DB_MODE=mysql + credentials + DASH_DB_ALLOW_SCHEMA_INIT=1.
 * Never reads production .env files.
 */
import { loadConfig, ConfigError } from '../src/config.mjs';
import { createAdminDb } from '../src/db.mjs';
import { seedDisposableMysql } from '../src/seed-disposable-mysql.mjs';

const config = (() => {
  try {
    return loadConfig(process.env);
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`[config] ${err.message}`);
      process.exit(err.exitCode ?? 2);
    }
    throw err;
  }
})();

if (config.mode !== 'mysql') {
  console.error('seed-mysql requires DASH_DB_MODE=mysql');
  process.exit(2);
}
if (!config.allowSchemaInit) {
  console.error('seed-mysql requires DASH_DB_ALLOW_SCHEMA_INIT=1 (disposable schema only)');
  process.exit(2);
}

const db = await createAdminDb(config);

const mysql = await import('mysql2/promise');
const pool = mysql.createPool({
  host: config.dbHost,
  port: config.dbPort,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  namedPlaceholders: true,
});

const n = await seedDisposableMysql(pool);
console.log(`seed-mysql ok: ${n} rss_post rows in ${config.dbName}@${config.dbHost}`);

await pool.end();
await db.close();
