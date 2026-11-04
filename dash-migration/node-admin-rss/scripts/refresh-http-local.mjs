#!/usr/bin/env node
/**
 * Qualif contrôlée : sert les fixtures XML en HTTP loopback, puis refresh
 * avec hash SimplePie get_id(true).
 *
 * Garde-fous : DASH_DISABLE_EXTERNAL=1 + DASH_ALLOW_FEED_HTTP=1.
 * Aucun flux public, aucun Vigie/Desk.
 *
 * Usage: npm run refresh:http-local
 */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { loadConfig, assertFeedHttpAllowed, ConfigError } from '../src/config.mjs';
import { loadFixtureSeed } from '../src/db.mjs';
import { createFakeAdminDb } from '../src/fake-db.mjs';
import { createHttpFeedLoader } from '../src/http-feed.mjs';
import { simplePieHashItem } from '../src/simplepie-hash.mjs';
import { runRefreshOnce } from '../src/run-refresh.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const feedsDir = path.resolve(root, '../fixtures/feeds');

const FILES = {
  '/feeds/lemonde.xml': 'editorial-lemonde.xml',
  '/feeds/ars.xml': 'editorial-ars.xml',
  '/feeds/vigie.xml': 'vigie-source.xml',
};

let config;
try {
  config = loadConfig({
    ...process.env,
    DASH_DISABLE_EXTERNAL: '1',
    DASH_ALLOW_FEED_HTTP: '1',
    DASH_DB_MODE: 'fixtures',
  });
  assertFeedHttpAllowed(config);
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(err.message);
    process.exit(err.exitCode ?? 2);
  }
  throw err;
}

const server = http.createServer((req, res) => {
  const file = FILES[req.url];
  if (!file) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const body = readFileSync(path.join(feedsDir, file));
  res.writeHead(200, { 'content-type': 'application/rss+xml; charset=utf-8' });
  res.end(body);
});

await new Promise((resolve, reject) => {
  server.listen(0, '127.0.0.1', resolve);
  server.on('error', reject);
});
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

const seed = loadFixtureSeed();
seed.rss_url = [
  { name: 'Le Monde', audience: 'editorial', url: `${base}/feeds/lemonde.xml` },
  { name: 'Ars Technica', audience: 'editorial', url: `${base}/feeds/ars.xml` },
  {
    name: 'High-tech · Vigie Source',
    audience: 'vigie',
    theme: 'hightech',
    url: `${base}/feeds/vigie.xml`,
  },
];

const db = createFakeAdminDb(seed);
const loadFeed = createHttpFeedLoader({
  allowFeedHttp: true,
  allowUrl: (u) => u.startsWith(base),
  timeoutMs: 5000,
});

try {
  const mode = process.argv.includes('--cron') ? 'cron' : 'manual';
  const result = await runRefreshOnce({
    mode,
    db,
    loadFeed,
    hashItem: simplePieHashItem,
    disableExternal: true,
  });
  console.log(JSON.stringify({ ...result, feedBase: base, hashMode: 'simplepie_get_id_true' }, null, 2));
} finally {
  await db.close();
  await new Promise((resolve) => server.close(resolve));
}
