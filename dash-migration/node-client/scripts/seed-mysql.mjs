/**
 * Seed disposable MySQL for client read bench.
 * Usage: set -a && . /tmp/dash-mysql-disposable.env && set +a && npm run seed:mysql
 */
import { loadConfig, ConfigError, assertClientMysqlWritesAllowed } from '../src/config.mjs';
import { seedClientDisposableMysql } from '../src/seed-disposable-mysql.mjs';

let config;
try {
  config = loadConfig({ ...process.env, DASH_DB_MODE: process.env.DASH_DB_MODE || 'mysql' });
  assertClientMysqlWritesAllowed(config);
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(`[config] ${err.message}`);
    process.exit(err.exitCode ?? 2);
  }
  throw err;
}

const mysql = await import('mysql2/promise');
const pool = mysql.createPool({
  host: config.dbHost,
  port: config.dbPort,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  namedPlaceholders: true,
  dateStrings: true,
});

try {
  const n = await seedClientDisposableMysql(pool);
  console.log(`seeded ${n} rss_post rows into ${config.dbName}@${config.dbHost}`);
} finally {
  await pool.end();
}
