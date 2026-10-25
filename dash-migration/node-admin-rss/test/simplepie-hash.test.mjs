import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadFeedXmlFile } from '../src/feed-parse.mjs';
import { simplePieGetIdTrue, simplePieHashItem } from '../src/simplepie-hash.mjs';
import { createFakeAdminDb } from '../src/fake-db.mjs';
import { createFixtureFeedLoader } from '../src/feed-parse.mjs';
import { runRefreshOnce } from '../src/run-refresh.mjs';
import { createVigieIngress } from '../src/vigie-ingress.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const feedsDir = path.resolve(here, '../fixtures/feeds');

function md5(s) {
  return createHash('md5').update(s, 'utf8').digest('hex');
}

describe('simplePieGetIdTrue parity', () => {
  it('matches PHP md5(permalink.title) oracle vectors', () => {
    // From SimplePie on rag-server-EL (get_id(true)), 2026-10-25.
    assert.equal(
      simplePieGetIdTrue({
        permalink: 'https://example.test/x',
        title: 'Hello &amp; Co',
      }),
      '5c9f8e2546e4ef5fc7937f326561c0ac'
    );
    assert.equal(
      simplePieGetIdTrue({ permalink: null, title: 'NoLink Title' }),
      'c79642363cc32ee70fd089a0971ebc2c'
    );
    assert.equal(
      simplePieGetIdTrue({
        link: 'https://example.test/feeds/lm-1',
        titleRaw: 'Nouvelle régulation IA et RGPD en Europe',
      }),
      '6eb7504a2459a4007b2bf5e2ab27a2dc'
    );
  });

  it('treats null side as empty string like PHP concatenation', () => {
    assert.equal(
      simplePieGetIdTrue({ permalink: 'https://example.test/a', title: null }),
      md5('https://example.test/a')
    );
    assert.equal(
      simplePieGetIdTrue({ permalink: null, title: 'OnlyTitle' }),
      md5('OnlyTitle')
    );
  });

  it('returns empty when both absent (serialize fallback not ported)', () => {
    assert.equal(simplePieGetIdTrue({}), '');
    assert.equal(simplePieGetIdTrue({ permalink: null, title: null }), '');
  });

  it('hashes fixture lemonde items like the PHP oracle', () => {
    const feed = loadFeedXmlFile(
      path.join(feedsDir, 'editorial-lemonde.xml'),
      'https://example.test/feeds/lemonde.xml'
    );
    const byLink = Object.fromEntries(feed.items.map((i) => [i.link, i]));
    assert.equal(
      simplePieHashItem(byLink['https://example.test/feeds/lm-1']),
      '6eb7504a2459a4007b2bf5e2ab27a2dc'
    );
    assert.equal(
      simplePieHashItem(byLink['https://example.test/feeds/lm-promo']),
      '7609e3990012a204b1bbaa1a013f2ee1'
    );
    assert.equal(
      simplePieHashItem(byLink['https://example.test/feeds/lm-thin']),
      '47164179fb87cbfe3aebfa5ee7b7bdea'
    );
  });
});

describe('refresh with simplePie hash', () => {
  it('inserts using md5 hashes not guid', async () => {
    const db = createFakeAdminDb({
      rss_url: [
        {
          name: 'Le Monde',
          audience: 'editorial',
          url: 'https://example.test/feeds/lemonde.xml',
        },
      ],
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
    const loadFeed = createFixtureFeedLoader({
      'https://example.test/feeds/lemonde.xml': path.join(
        feedsDir,
        'editorial-lemonde.xml'
      ),
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
    const rich = db.state.rss_post.find(
      (r) => r.hash === '6eb7504a2459a4007b2bf5e2ab27a2dc'
    );
    assert.ok(rich, 'rich editorial item stored under SimplePie md5');
    assert.equal(
      db.state.rss_post.find((r) => r.hash === 'guid-lm-1'),
      undefined
    );
    assert.equal(Number(rich.deleted), 0);
    await db.close();
  });
});
