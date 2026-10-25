import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { loadConfig, assertFeedHttpAllowed, ConfigError } from '../src/config.mjs';
import { assertSafeFeedUrl, createHttpFeedLoader } from '../src/http-feed.mjs';
import { simplePieHashItem } from '../src/simplepie-hash.mjs';
import { createFakeAdminDb } from '../src/fake-db.mjs';
import { runRefreshOnce } from '../src/run-refresh.mjs';
import { createVigieIngress } from '../src/vigie-ingress.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const lemondeXml = readFileSync(
  path.resolve(here, '../fixtures/feeds/editorial-lemonde.xml'),
  'utf8'
);

function startFixtureServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/feeds/lemonde.xml') {
        res.writeHead(200, { 'content-type': 'application/rss+xml; charset=utf-8' });
        res.end(lemondeXml);
        return;
      }
      res.writeHead(404);
      res.end('missing');
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        port,
        base: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((resClose, rejClose) =>
            server.close((err) => (err ? rejClose(err) : resClose()))
          ),
      });
    });
    server.on('error', reject);
  });
}

describe('feed HTTP config guards', () => {
  it('refuses without DASH_ALLOW_FEED_HTTP', () => {
    const cfg = loadConfig({
      DASH_DISABLE_EXTERNAL: '1',
      DASH_DB_MODE: 'fixtures',
    });
    assert.equal(cfg.allowFeedHttp, false);
    assert.throws(() => assertFeedHttpAllowed(cfg), ConfigError);
  });

  it('allows narrow HTTP flag while externals stay disabled', () => {
    const cfg = loadConfig({
      DASH_DISABLE_EXTERNAL: '1',
      DASH_ALLOW_FEED_HTTP: '1',
      DASH_DB_MODE: 'fixtures',
    });
    assert.equal(cfg.allowFeedHttp, true);
    assert.equal(cfg.disableExternal, true);
    assert.doesNotThrow(() => assertFeedHttpAllowed(cfg));
  });

  it('createHttpFeedLoader refuses when flag off', () => {
    assert.throws(() => createHttpFeedLoader({ allowFeedHttp: false }), /allowFeedHttp/);
  });

  it('assertSafeFeedUrl rejects non-http schemes and metadata hosts', () => {
    assert.throws(() => assertSafeFeedUrl('file:///tmp/x.xml'), /Protocole/);
    assert.throws(() => assertSafeFeedUrl('https://169.254.169.254/latest'), /refusé/);
  });
});

describe('HTTP feed loader + refresh (loopback)', () => {
  it('fetches fixture over local HTTP and ingests with SimplePie hash', async () => {
    const srv = await startFixtureServer();
    const feedUrl = `${srv.base}/feeds/lemonde.xml`;
    try {
      const loadFeed = createHttpFeedLoader({
        allowFeedHttp: true,
        allowUrl: (u) => u.startsWith(srv.base),
        timeoutMs: 5000,
      });
      const parsed = await loadFeed(feedUrl);
      assert.ok(parsed.items.length >= 3);
      assert.equal(
        simplePieHashItem(parsed.items.find((i) => i.link.includes('lm-1'))),
        '6eb7504a2459a4007b2bf5e2ab27a2dc'
      );

      const db = createFakeAdminDb({
        rss_url: [{ name: 'Le Monde', audience: 'editorial', url: feedUrl }],
        keyword: [
          { id_keyword: 1, name_keyword: 'ia' },
          { id_keyword: 2, name_keyword: 'rgpd' },
          { id_keyword: 3, name_keyword: 'régulation' },
          { id_keyword: 4, name_keyword: 'europe' },
        ],
        aliases: [{ id_keyword: 1, name_alias: 'intelligence artificielle' }],
        rss_post: [],
        post_keyword: [],
        refresh_rss: {
          id: 1,
          status: '0',
          last_refresh: null,
          last_update: null,
          current: 0,
        },
      });
      const result = await runRefreshOnce({
        mode: 'manual',
        db,
        loadFeed,
        hashItem: simplePieHashItem,
        disableExternal: true,
        vigie: createVigieIngress({ disableExternal: true }),
        nowMs: () => Date.parse('2026-10-21T08:00:00Z'),
      });
      assert.equal(result.ok, true);
      assert.ok(result.stats.inserted >= 1);
      assert.ok(
        db.state.rss_post.some((r) => r.hash === '6eb7504a2459a4007b2bf5e2ab27a2dc')
      );
      await db.close();
    } finally {
      await srv.close();
    }
  });
});
