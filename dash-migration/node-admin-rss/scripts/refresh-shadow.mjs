#!/usr/bin/env node
/**
 * Worker shadow : fetch HTTP réel (catalogue sous-ensemble) → MySQL jetable loopback.
 *
 * Garde-fous :
 * - DASH_DISABLE_EXTERNAL=1 (pas Vigie/Desk)
 * - DASH_ALLOW_FEED_HTTP=1
 * - DASH_DB_MODE=mysql + host loopback + schéma disposable + SCHEMA_INIT
 * - Aucune écriture prod, aucun cron système
 *
 * Usage :
 *   set -a && . /tmp/dash-mysql-disposable.env && set +a
 *   DASH_ALLOW_FEED_HTTP=1 DASH_SHADOW_FEED_LIMIT=3 npm run refresh:shadow
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadConfig,
  assertFeedHttpAllowed,
  assertRefreshMysqlWritesAllowed,
  ConfigError,
} from '../src/config.mjs';
import { createMysqlAdminDb } from '../src/mysql-db.mjs';
import { seedDisposableMysql } from '../src/seed-disposable-mysql.mjs';
import { loadFixtureSeed } from '../src/db.mjs';
import { createHttpFeedLoader } from '../src/http-feed.mjs';
import { simplePieHashItem } from '../src/simplepie-hash.mjs';
import { runRefreshOnce } from '../src/run-refresh.mjs';
import {
  loadShadowCatalog,
  loadProdHashSample,
  limitFeeds,
  compareProdHashSample,
  catalogFingerprint,
} from '../src/shadow-refresh.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const defaultCatalog = path.resolve(root, '../fixtures/shadow-catalog.json');
const defaultSample = path.resolve(root, '../fixtures/shadow-prod-sample.json');

function exitConfig(err) {
  if (err instanceof ConfigError) {
    console.error(err.message);
    process.exit(err.exitCode ?? 2);
  }
  throw err;
}

let config;
try {
  config = loadConfig({
    ...process.env,
    DASH_DISABLE_EXTERNAL: '1',
    DASH_ALLOW_FEED_HTTP: process.env.DASH_ALLOW_FEED_HTTP || '1',
    DASH_DB_MODE: 'mysql',
  });
  assertFeedHttpAllowed(config);
  assertRefreshMysqlWritesAllowed(config);
} catch (err) {
  exitConfig(err);
}

const catalogPath = process.env.DASH_SHADOW_CATALOG || defaultCatalog;
const samplePath = process.env.DASH_SHADOW_PROD_SAMPLE || defaultSample;
const feedLimit = Number(process.env.DASH_SHADOW_FEED_LIMIT || 3);

const catalog = loadShadowCatalog(catalogPath);
const feeds = limitFeeds(catalog.feeds, feedLimit);
const sample = loadProdHashSample(samplePath);

const seed = loadFixtureSeed();
seed.rss_url = feeds.map((f) => ({
  name: f.name,
  audience: f.audience || 'editorial',
  theme: f.theme || null,
  url: f.url,
}));
seed.rss_post = [];
seed.post_keyword = [];

// Warm schema (CREATE IF NOT EXISTS) then seed via dedicated pool.
const warm = await createMysqlAdminDb(config);
await warm.close();

const mysql = await import('mysql2/promise');
const seedPool = mysql.createPool({
  host: config.dbHost,
  port: config.dbPort,
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  namedPlaceholders: true,
});

await seedDisposableMysql(seedPool, seed);
await seedPool.end();

const allowHosts = new Set(
  feeds.map((f) => {
    try {
      return new URL(f.url).host.toLowerCase();
    } catch {
      return '';
    }
  }).filter(Boolean)
);

const loadFeed = createHttpFeedLoader({
  allowFeedHttp: true,
  timeoutMs: Number(process.env.DASH_FEED_TIMEOUT_MS || 20000),
  allowUrl: (u) => {
    try {
      return allowHosts.has(new URL(u).host.toLowerCase());
    } catch {
      return false;
    }
  },
});

const db = await createMysqlAdminDb(config);
const mode = process.argv.includes('--cron') ? 'cron' : 'manual';
const started = Date.now();

let result = null;
let compare = null;
try {
  result = await runRefreshOnce({
    mode,
    db,
    loadFeed,
    hashItem: simplePieHashItem,
    disableExternal: true,
  });
  compare = await compareProdHashSample(db, sample.items);
} catch (err) {
  compare = await compareProdHashSample(db, sample.items).catch(() => null);
  console.log(
    JSON.stringify(
      {
        ok: false,
        error: String(err?.message || err),
        mode,
        hashMode: 'simplepie_get_id_true',
        catalogFile: catalogPath,
        catalogFingerprint: catalogFingerprint(feeds),
        feedsUsed: feeds.map((f) => ({ name: f.name, url: f.url })),
        durationMs: Date.now() - started,
        prodSampleCompare: compare,
      },
      null,
      2
    )
  );
  await db.close();
  process.exit(1);
}

const report = {
  ok: Boolean(result?.ok),
  mode,
  hashMode: 'simplepie_get_id_true',
  catalogFile: catalogPath,
  catalogFingerprint: catalogFingerprint(feeds),
  feedsUsed: feeds.map((f) => ({ name: f.name, url: f.url })),
  durationMs: Date.now() - started,
  refresh: result,
  prodSampleCompare: compare,
  note: 'Écritures limitées à MySQL jetable loopback. Cron PHP prod inchangé.',
};
console.log(JSON.stringify(report, null, 2));
await db.close();
if (!result?.ok) process.exit(1);
