import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFakeAdminDb } from '../src/fake-db.mjs';
import {
  estArticleFluxBruit,
  estArticlePublicitaire,
  keywordMatchInText,
} from '../src/classifiers.mjs';
import { createFixtureFeedLoader, defaultFixtureHash } from '../src/feed-parse.mjs';
import { createRssLock, sqlNow } from '../src/rss-lock.mjs';
import {
  RSS_KEEP_DAYS,
  RSS_MIN_DISTINCT_KEYWORDS,
  cronRefreshOptions,
  manualRefreshOptions,
} from '../src/rss-refresh-engine.mjs';
import { runRefreshOnce } from '../src/run-refresh.mjs';
import { createVigieIngress } from '../src/vigie-ingress.mjs';
import { loadInboxPage } from '../src/inbox.mjs';
import { loadConfig, ConfigError } from '../src/config.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const feedsDir = path.resolve(here, '../fixtures/feeds');

const FEED_URLS = {
  lemonde: 'https://example.test/feeds/lemonde.xml',
  ars: 'https://example.test/feeds/ars.xml',
  vigie: 'https://example.test/feeds/vigie.xml',
};

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
    authors_posts: [],
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

describe('classifiers ingest parity', () => {
  it('detects promo and noise phrases', () => {
    assert.equal(estArticlePublicitaire('Bon plan smartphone', 'x'), true);
    assert.equal(estArticleFluxBruit('x', 'press release today'), true);
    assert.equal(estArticlePublicitaire('Nouvelle régulation IA', 'texte'), false);
  });

  it('matches keywords on unicode boundaries', () => {
    assert.equal(keywordMatchInText('régulation IA en Europe', 'ia'), true);
    assert.equal(keywordMatchInText('piano', 'ia'), false);
    assert.equal(RSS_MIN_DISTINCT_KEYWORDS, 3);
    assert.equal(RSS_KEEP_DAYS, 38);
  });
});

describe('manual vs cron options', () => {
  it('differs on delete_stale_bin_unsent and progress', () => {
    assert.equal(manualRefreshOptions().deleteStaleBinUnsent, false);
    assert.equal(manualRefreshOptions().progress, true);
    assert.equal(cronRefreshOptions().deleteStaleBinUnsent, true);
    assert.equal(cronRefreshOptions().progress, false);
  });
});

describe('rss lock with injectable clock', () => {
  it('unlocks stale busy heartbeat', async () => {
    let now = Date.parse('2026-10-20T12:00:00Z');
    const db = createFakeAdminDb(
      refreshSeed({
        refresh_rss: {
          id: 1,
          status: '1',
          last_refresh: '2026-10-20 10:00:00',
          last_update: '2026-10-20 10:05:00',
          current: 3,
        },
      })
    );
    const lock = createRssLock({
      db,
      nowMs: () => now,
      lockConfig: { maxAgeSeconds: 600 },
    });
    assert.equal(await lock.isLocked(), true);
    // 20 minutes later → stale
    now = Date.parse('2026-10-20T12:30:00Z');
    assert.equal(await lock.tryUnlock(), true);
    assert.equal(await lock.isLocked(), false);
  });

  it('unlocks phantom busy when last_update ≈ last_refresh', async () => {
    let now = Date.parse('2026-10-20T12:01:00Z');
    const db = createFakeAdminDb(
      refreshSeed({
        refresh_rss: {
          id: 1,
          status: '1',
          last_refresh: '2026-10-20 12:00:00',
          last_update: '2026-10-20 12:00:10',
          current: 0,
        },
      })
    );
    const lock = createRssLock({
      db,
      nowMs: () => now,
      lockConfig: { phantomMinIdleSeconds: 90, phantomTsToleranceSeconds: 600 },
    });
    // 50s after end < 90s → too soon
    assert.equal(await lock.releasePhantomBusy(), false);
    now = Date.parse('2026-10-20T12:03:00Z');
    assert.equal(await lock.releasePhantomBusy(), true);
    assert.equal((await db.getRefreshRow()).status, '0');
  });
});

describe('fixture feed ingest', () => {
  it('inserts editorial item with keywords, skips promo, trash low-kw, keeps vigie', async () => {
    const db = createFakeAdminDb(refreshSeed());
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
    assert.equal(vigie.log.length, 1);
    assert.equal(vigie.log[0].event.kind, 'info');
    assert.equal(vigie.log[0].event.drain, true);
    assert.equal(vigie.log[0].event.fingerprint, 'dash:guid-vigie-1');
    assert.match(String(vigie.log[0].event.facts?.label || ''), /Vigie Source/);

    const rich = db.state.rss_post.find((r) => r.hash === 'guid-lm-1');
    assert.ok(rich);
    assert.equal(Number(rich.new), 1);
    assert.equal(Number(rich.deleted), 0);
    const kwIds = db.state.post_keyword
      .filter((pk) => pk.hash_post === 'guid-lm-1')
      .map((pk) => Number(pk.id_keyword))
      .sort();
    assert.ok(kwIds.length >= 3);

    const promo = db.state.rss_post.find((r) => r.hash === 'guid-lm-promo');
    assert.equal(promo, undefined);

    const thin = db.state.rss_post.find((r) => r.hash === 'guid-lm-thin');
    assert.ok(thin);
    assert.equal(Number(thin.deleted), 1);
    assert.equal(Number(thin.new), 0);

    const vigiePost = db.state.rss_post.find((r) => r.hash === 'guid-vigie-1');
    assert.ok(vigiePost);
    assert.equal(Number(vigiePost.deleted), 0);
    assert.equal(Number(vigiePost.new), 1);

    const page = await loadInboxPage(db, {});
    assert.ok(page.rows.some((r) => r.hash === 'guid-lm-1'));
    assert.ok(page.rows.every((r) => r.source !== 'High-tech · Vigie Source'));
    assert.ok(!page.rows.some((r) => /bon plan/i.test(r.title)));
  });

  it('dedupes by injectable hash and clears bin on revisit; cron deletes stale bin', async () => {
    const db = createFakeAdminDb(refreshSeed());
    const loadFeed = loader();
    const nowMs = () => Date.parse('2026-10-21T08:00:00Z');

    await runRefreshOnce({
      mode: 'manual',
      db,
      loadFeed,
      disableExternal: true,
      nowMs,
    });

    // Simulate an editorial new post not in feed → marked bin on next refresh
    db.state.rss_post.push({
      id: 900,
      title: 'Orphelin',
      text: 'pas dans le flux',
      source: 'Le Monde',
      link: 'https://example.test/orphan',
      author: '',
      date: '2026-10-20 08:00:00',
      hash: 'orphan-hash',
      bin: 0,
      new: 1,
      sent: 0,
      deleted: 0,
      alert: 0,
      id_theme: 0,
      breve_spip: 0,
    });

    const before = db.state.rss_post.find((r) => r.hash === 'guid-lm-1');
    assert.equal(Number(before.new), 1);

    const second = await runRefreshOnce({
      mode: 'cron',
      db,
      loadFeed,
      disableExternal: true,
      nowMs: () => Date.parse('2026-10-21T09:00:00Z'),
    });
    assert.equal(second.ok, true);
    assert.ok(second.stats.revisited >= 1);
    assert.ok(second.stats.deletedStaleBin >= 1);
    assert.equal(
      db.state.rss_post.find((r) => r.hash === 'orphan-hash'),
      undefined
    );
    const kept = db.state.rss_post.find((r) => r.hash === 'guid-lm-1');
    assert.ok(kept);
    assert.equal(Number(kept.bin), 0);
  });

  it('manual refresh does not delete stale bin unsent', async () => {
    const db = createFakeAdminDb(refreshSeed());
    await runRefreshOnce({
      mode: 'manual',
      db,
      loadFeed: loader(),
      disableExternal: true,
      nowMs: () => Date.parse('2026-10-21T08:00:00Z'),
    });
    db.state.rss_post.push({
      id: 901,
      title: 'Reste en bin',
      text: 'x',
      source: 'Le Monde',
      link: 'https://example.test/bin',
      author: '',
      date: '2026-10-20 08:00:00',
      hash: 'bin-keep',
      bin: 1,
      new: 1,
      sent: 0,
      deleted: 0,
      alert: 0,
      id_theme: 0,
      breve_spip: 0,
    });
    // Force status idle for second run
    await db.setRefreshStatus('0');
    const r = await runRefreshOnce({
      mode: 'manual',
      db,
      loadFeed: loader(),
      disableExternal: true,
      nowMs: () => Date.parse('2026-10-21T09:00:00Z'),
    });
    assert.equal(r.stats.deletedStaleBin, 0);
    // orphan marked bin at start of refresh (new=1) then not in feed → still present if not deleted by manual
    assert.ok(db.state.rss_post.some((x) => x.hash === 'bin-keep'));
  });

    it('continues when one feed loadFeed throws', async () => {
      const db = createFakeAdminDb(refreshSeed());
      const base = loader();
      const loadFeed = async (url) => {
        if (url === FEED_URLS.ars) throw new Error('HTTP 403 fixture');
        return base(url);
      };
      const result = await runRefreshOnce({
        mode: 'manual',
        db,
        loadFeed,
        hashItem: defaultFixtureHash,
        disableExternal: true,
        nowMs: () => Date.parse('2026-10-21T08:00:00Z'),
      });
      assert.equal(result.ok, true);
      assert.equal(result.stats.feedsFailed, 1);
      assert.ok(result.stats.inserted >= 1);
      await db.close();
    });

  it('skips unknown fixture URL without aborting the run', async () => {
    const db = createFakeAdminDb(
      refreshSeed({
        rss_url: [
          {
            name: 'Ghost',
            audience: 'editorial',
            url: 'https://example.test/missing.xml',
          },
        ],
      })
    );
    const result = await runRefreshOnce({
      mode: 'manual',
      db,
      loadFeed: loader(),
      disableExternal: true,
    });
    assert.equal(result.ok, true);
    assert.equal(result.stats.feedsFailed, 1);
    assert.match(String(result.stats.feedErrors?.[0]?.error || ''), /Fixture feed introuvable/);
    await db.close();
  });

  it('busy lock short-circuits cron with exitCode 2', async () => {
    const db = createFakeAdminDb(
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
    const nowMs = () => Date.parse('2026-10-21T08:02:00Z'); // not stale yet
    const r = await runRefreshOnce({
      mode: 'cron',
      db,
      loadFeed: loader(),
      disableExternal: true,
      nowMs,
    });
    assert.equal(r.ok, false);
    assert.equal(r.busy, true);
    assert.equal(r.exitCode, 2);
  });

  it('purges posts older than RSS_KEEP_DAYS', async () => {
    const db = createFakeAdminDb(
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
    assert.equal(
      db.state.rss_post.find((r) => r.hash === 'old-hash'),
      undefined
    );
    assert.ok(!db.state.post_keyword.some((pk) => pk.hash_post === 'old-hash'));
  });
});

describe('config guards for refresh bench', () => {
  it('defaults disable external and refuses enabling it', () => {
    const c = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    assert.equal(c.disableExternal, true);
    assert.throws(
      () => loadConfig({ DASH_DISABLE_EXTERNAL: '0' }),
      (e) => e instanceof ConfigError
    );
  });

  it('sqlNow formats from injectable clock', () => {
    assert.equal(sqlNow(() => Date.parse('2026-10-21T08:00:00Z')), '2026-10-21 08:00:00');
  });
});
