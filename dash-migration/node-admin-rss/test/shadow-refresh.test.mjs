import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadShadowCatalog,
  loadProdHashSample,
  limitFeeds,
  compareProdHashSample,
  catalogFingerprint,
} from '../src/shadow-refresh.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.resolve(here, '../fixtures/shadow-catalog.json');
const samplePath = path.resolve(here, '../fixtures/shadow-prod-sample.json');

describe('shadow catalog helpers', () => {
  it('loads committed catalog and sample', () => {
    const cat = loadShadowCatalog(catalogPath);
    assert.ok(cat.feeds.length >= 3);
    assert.ok(cat.feeds.every((f) => f.url && f.name));
    const sample = loadProdHashSample(samplePath);
    assert.ok(sample.items.length >= 1);
    assert.match(sample.items[0].hash, /^[a-f0-9]{32}$/);
  });

  it('limits feeds and fingerprints stably', () => {
    const cat = loadShadowCatalog(catalogPath);
    const limited = limitFeeds(cat.feeds, 2);
    assert.equal(limited.length, 2);
    assert.equal(catalogFingerprint(limited), catalogFingerprint(limited));
    assert.notEqual(
      catalogFingerprint(limited),
      catalogFingerprint(cat.feeds)
    );
  });

  it('compares prod sample hashes against fake db', async () => {
    const sample = loadProdHashSample(samplePath);
    const present = new Set([sample.items[0].hash]);
    const db = {
      async countByHash(h) {
        return present.has(h) ? 1 : 0;
      },
    };
    const cmp = await compareProdHashSample(db, sample.items);
    assert.equal(cmp.sampleSize, sample.items.length);
    assert.equal(cmp.matched, 1);
    assert.equal(cmp.miss, sample.items.length - 1);
    assert.ok(cmp.matchRate > 0 && cmp.matchRate < 1);
  });
});
