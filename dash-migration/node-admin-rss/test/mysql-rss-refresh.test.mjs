/**
 * Refresh journey against disposable loopback MySQL.
 * Skips unless DASH_DB_MODE=mysql + loopback + disposable schema name + schema init.
 * Always uses local XML fixtures + Vigie stub — never network feeds.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ConfigError,
  assertLoopbackDisposableMysql,
  assertRefreshMysqlWritesAllowed,
  loadConfig,
} from '../src/config.mjs';
import { createAdminDb } from '../src/db.mjs';
import { seedDisposableMysql } from '../src/seed-disposable-mysql.mjs';
import { createFixtureFeedLoader, defaultFixtureHash } from '../src/feed-parse.mjs';
import { runRefreshOnce } from '../src/run-refresh.mjs';
import { createVigieIngress } from '../src/vigie-ingress.mjs';
import { loadInboxPage } from '../src/inbox.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const feedsDir = path.resolve(here, '../fixtures/feeds');

const FEED_URLS = {
  lemonde: 'https://example.test/feeds/lemonde.xml',
  ars: 'https://example.test/feeds/ars.xml',
  vigie: 'https://example.test/feeds/vigie.xml',
};

const wantMysql = String(process.env.DASH_DB_MODE || '').toLowerCase() === 'mysql';

function refreshSeed(extra = {}) {
  return {
    rss_url: [
      {
        name: 'Le Monde',
        audience: 'editorial',
        url: FEED_URLS.lemonde,
      },
      {
        name: 'Ars Technica',
        audience: 'editorial',
        url: FEED_URLS.ars,
      },
      {
        name: 'High-tech · Vigie Source',
        audience: 'vigie',
        theme: 'hightech',
        url: FEED_URLS.vigie,
      },
    ],
    keyword: [
      { id_keyword: 1, name_keyword: 'ia' },
      { id_keyword: 2, name_keyword: 'rgpd' },
      { id_keyword: 3, name_keyword: 'régulation' },
      { id_keyword: 4, name_keyword: 'europe', alias_keyword: 'européenne' },
    ],
    aliases: [{ id_keyword: 1, name_alias: 'intelligence artificielle' }],
    rss_post: [],
    post_keyword: [],
    theme: [],
    users: [],
    dash_keys: [],
    authors: [],
    refresh_rss: {
      id: 1,
      status: '0',
      last_refresh: null,
      last_update: null,
      current: 0,
    },
    ...extra,
  };
}

function loader() {
  return createFixtureFeedLoader({
    [FEED_URLS.lemonde]: path.join(feedsDir, 'editorial-lemonde.xml'),
    [FEED_URLS.ars]: path.join(feedsDir, 'editorial-ars.xml'),
    [FEED_URLS.vigie]: path.join(feedsDir, 'vigie-source.xml'),
  });
}

describe('MySQL refresh config guards (no connection)', () => {
  it('refuses non-loopback host before pool', () => {
    const c = loadConfig({
      DASH_DB_MODE: 'mysql',
      DASH_DISABLE_EXTERNAL: '1',
      DASH_DB_HOST: '10.0.0.5',
      DASH_DB_USER: 'u',
      DASH_DB_NAME: 'dash_disposable',
      DASH_DB_ALLOW_SCHEMA_INIT: '1',
      DASH_DB_ALLOW_REMOTE: '1',
    });
    assert.throws(
      () => assertLoopbackDisposableMysql(c),
      (e) => e instanceof ConfigError && /loopback/i.test(e.message)
    );
  });

  it('refuses non-disposable schema name before pool', () => {
    const c = loadConfig({
      DASH_DB_MODE: 'mysql',
      DASH_DISABLE_EXTERNAL: '1',
      DASH_DB_HOST: '127.0.0.1',
      DASH_DB_USER: 'u',
      DASH_DB_NAME: 'production_dash',
      DASH_DB_ALLOW_SCHEMA_INIT: '1',
    });
    assert.throws(
      () => assertLoopbackDisposableMysql(c),
      (e) => e instanceof ConfigError && /jetable/i.test(e.message)
    );
  });

  it('refuses refresh writes without schema init', () => {
    const c = loadConfig({
      DASH_DB_MODE: 'mysql',
      DASH_DISABLE_EXTERNAL: '1',
      DASH_DB_HOST: '127.0.0.1',
      DASH_DB_USER: 'u',
      DASH_DB_NAME: 'dash_disposable',
    });
    assert.throws(
      () => assertRefreshMysqlWritesAllowed(c),
      (e) => e instanceof ConfigError && /SCHEMA_INIT/i.test(e.message)
    );
  });
});

describe('MySQL disposable refresh journey', { skip: !wantMysql }, () => {
  let db;
  let seedPool;
  let config;
  let skipReason = '';

  before(async () => {
    try {
      config = loadConfig(process.env);
      assertRefreshMysqlWritesAllowed(config);
    } catch (err) {
      if (err instanceof ConfigError) {
        skipReason = err.message;
        return;
      }
      throw err;
    }
    try {
      db = await createAdminDb(config);
      const mysql = await import('mysql2/promise');
      seedPool = mysql.createPool({
        host: config.dbHost,
        port: config.dbPort,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbName,
      });
      await seedDisposableMysql(seedPool, refreshSeed());
    } catch (err) {
      skipReason = String(err?.message || err);
    }
  });

  after(async () => {
    if (seedPool) await seedPool.end();
    if (db) await db.close();
  });

  function requireDb() {
    if (skipReason) assert.fail(`MySQL disposable unavailable: ${skipReason}`);
  }

  it('manual refresh inserts posts/keywords, skips promo, trash low-kw, vigie stub', async () => {
    requireDb();
    const vigie = createVigieIngress({ disableExternal: true });
    const result = await runRefreshOnce({
      mode: 'manual',
      db,
      loadFeed: loader(),
      hashItem: defaultFixtureHash,
      nowMs: () => Date.parse('2026-10-21T08:00:00Z'),
      disableExternal: true,
      vigie,
    });
    assert.equal(result.ok, true);
    assert.ok(result.stats.inserted >= 2);
    assert.ok(result.stats.skippedPromo >= 1);
    assert.ok(result.stats.trashedLowKw >= 1);
    assert.equal(result.stats.vigieEvents, 1);
    assert.equal(vigie.log[0].event.fingerprint, 'dash:guid-vigie-1');

    assert.equal(await db.countByHash('guid-lm-1'), 1);
    assert.equal(await db.countByHash('guid-lm-promo'), 0);

    const page = await loadInboxPage(db, {});
    assert.ok(page.rows.some((r) => r.hash === 'guid-lm-1'));
    assert.ok(page.rows.every((r) => !/Vigie Source/i.test(r.source)));
    assert.ok(result.lastRefresh);

    const lockRow = await db.getRefreshRow();
    assert.equal(String(lockRow.status), '0');
    assert.ok(lockRow.last_refresh);
  });

  it('cron refresh clears stale bin unsent and revisits hashes', async () => {
    requireDb();
    // Re-seed clean then manual once
    await seedDisposableMysql(seedPool, refreshSeed());
    await runRefreshOnce({
      mode: 'manual',
      db,
      loadFeed: loader(),
      disableExternal: true,
      nowMs: () => Date.parse('2026-10-21T08:00:00Z'),
    });

    await seedPool.query(
      `INSERT INTO rss_post(title, text, source, link, author, date, hash, bin, new, sent, deleted)
       VALUES ('Orphelin', 'x', 'Le Monde', 'https://example.test/orphan', '', '2026-10-20 08:00:00', 'orphan-hash', 0, 1, 0, 0)`
    );

    const cron = await runRefreshOnce({
      mode: 'cron',
      db,
      loadFeed: loader(),
      disableExternal: true,
      nowMs: () => Date.parse('2026-10-21T09:00:00Z'),
    });
    assert.equal(cron.ok, true);
    assert.ok(cron.stats.revisited >= 1);
    assert.ok(cron.stats.deletedStaleBin >= 1);
    assert.equal(await db.countByHash('orphan-hash'), 0);
    assert.equal(await db.countByHash('guid-lm-1'), 1);
  });

  it('busy lock short-circuits cron with exitCode 2', async () => {
    requireDb();
    await seedDisposableMysql(
      seedPool,
      refreshSeed({
        refresh_rss: {
          id: 1,
          status: '1',
          last_refresh: '2026-10-21 08:00:00',
          last_update: '2026-10-21 08:01:00',
          current: 1,
        },
      })
    );
    const r = await runRefreshOnce({
      mode: 'cron',
      db,
      loadFeed: loader(),
      disableExternal: true,
      nowMs: () => Date.parse('2026-10-21T08:02:00Z'),
    });
    assert.equal(r.ok, false);
    assert.equal(r.busy, true);
    assert.equal(r.exitCode, 2);
  });

  it('purges posts older than keep days using injectable clock', async () => {
    requireDb();
    await seedDisposableMysql(
      seedPool,
      refreshSeed({
        rss_post: [
          {
            id: 1,
            title: 'Ancien',
            text: 'vieux',
            source: 'Le Monde',
            link: 'https://example.test/old',
            author: '',
            date: '2026-01-01 00:00:00',
            hash: 'old-hash',
            bin: 0,
            new: 0,
            sent: 1,
            deleted: 0,
            alert: 0,
            id_theme: 0,
            breve_spip: 0,
          },
        ],
        post_keyword: [{ hash_post: 'old-hash', id_keyword: 1 }],
      })
    );
    await runRefreshOnce({
      mode: 'manual',
      db,
      loadFeed: loader(),
      disableExternal: true,
      nowMs: () => Date.parse('2026-10-21T08:00:00Z'),
    });
    assert.equal(await db.countByHash('old-hash'), 0);
  });
});
