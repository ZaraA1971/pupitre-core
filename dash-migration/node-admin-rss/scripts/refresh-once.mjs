#!/usr/bin/env node
/**
 * Local refresh once against fixtures DB (in-memory) or injectable loaders.
 * Never opens network. Requires DASH_DISABLE_EXTERNAL=1 (default).
 *
 * Usage (dev): node scripts/refresh-once.mjs
 * Prefer unit tests for deterministic coverage.
 */
import { loadConfig, ConfigError } from '../src/config.mjs';
import { loadFixtureSeed } from '../src/db.mjs';
import { createFakeAdminDb } from '../src/fake-db.mjs';
import { createFixtureFeedLoader, defaultFixtureHash } from '../src/feed-parse.mjs';
import { simplePieHashItem } from '../src/simplepie-hash.mjs';
import { runRefreshOnce } from '../src/run-refresh.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const feedsDir = path.resolve(root, '../fixtures/feeds');

try {
  loadConfig({ ...process.env, DASH_DISABLE_EXTERNAL: '1', DASH_DB_MODE: 'fixtures' });
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(err.message);
    process.exit(err.exitCode ?? 2);
  }
  throw err;
}

const seed = loadFixtureSeed();
// Attach fixture feed URLs for local ingest demo (does not mutate committed seed.json)
seed.rss_url = [
  {
    name: 'Le Monde',
    audience: 'editorial',
    url: 'https://example.test/feeds/lemonde.xml',
  },
  {
    name: 'Ars Technica',
    audience: 'editorial',
    url: 'https://example.test/feeds/ars.xml',
  },
  {
    name: 'High-tech · Vigie Source',
    audience: 'vigie',
    theme: 'hightech',
    url: 'https://example.test/feeds/vigie.xml',
  },
];

const db = createFakeAdminDb(seed);
const loadFeed = createFixtureFeedLoader({
  'https://example.test/feeds/lemonde.xml': path.join(feedsDir, 'editorial-lemonde.xml'),
  'https://example.test/feeds/ars.xml': path.join(feedsDir, 'editorial-ars.xml'),
  'https://example.test/feeds/vigie.xml': path.join(feedsDir, 'vigie-source.xml'),
});

const mode = process.argv.includes('--cron') ? 'cron' : 'manual';
const useSimplePie = process.argv.includes('--simplepie-hash');
const result = await runRefreshOnce({
  mode,
  db,
  loadFeed,
  hashItem: useSimplePie ? simplePieHashItem : defaultFixtureHash,
  disableExternal: true,
});
console.log(
  JSON.stringify(
    { ...result, hashMode: useSimplePie ? 'simplepie_get_id_true' : 'fixture_guid' },
    null,
    2
  )
);
await db.close();
