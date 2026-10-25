/**
 * Shadow refresh helpers — real HTTP feeds into disposable MySQL only.
 * Never writes production. Vigie/Desk stay disabled.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

/**
 * @param {string} filePath
 * @returns {{ feeds: Array<{name:string,audience?:string,theme?:string|null,url:string}> }}
 */
export function loadShadowCatalog(filePath) {
  const raw = JSON.parse(readFileSync(filePath, 'utf8'));
  const feeds = Array.isArray(raw.feeds) ? raw.feeds : [];
  if (!feeds.length) {
    throw new Error(`Catalogue shadow vide: ${filePath}`);
  }
  for (const f of feeds) {
    if (!f?.url || !f?.name) {
      throw new Error(`Entrée catalogue invalide (name+url requis) dans ${filePath}`);
    }
  }
  return { ...raw, feeds };
}

/**
 * @param {string} filePath
 * @returns {{ items: Array<{hash:string,link?:string,title?:string,source?:string}> }}
 */
export function loadProdHashSample(filePath) {
  const raw = JSON.parse(readFileSync(filePath, 'utf8'));
  const items = Array.isArray(raw.items) ? raw.items : [];
  return { ...raw, items };
}

/**
 * Limit catalog size for safe qualif runs.
 * @param {object[]} feeds
 * @param {number} limit
 */
export function limitFeeds(feeds, limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return feeds;
  return feeds.slice(0, n);
}

/**
 * Compare sample prod hashes against disposable db.countByHash.
 * @param {{ countByHash: (h: string) => Promise<number> }} db
 * @param {Array<{hash:string,link?:string,title?:string}>} sampleItems
 */
export async function compareProdHashSample(db, sampleItems) {
  const results = [];
  let matched = 0;
  for (const item of sampleItems || []) {
    const hash = String(item.hash || '').trim();
    if (!hash) continue;
    const count = await db.countByHash(hash);
    const ok = count > 0;
    if (ok) matched += 1;
    results.push({
      hash,
      link: item.link || null,
      title: item.title || null,
      inDisposable: ok,
      count,
    });
  }
  return {
    sampleSize: results.length,
    matched,
    miss: results.length - matched,
    matchRate: results.length ? matched / results.length : 0,
    results,
  };
}

/**
 * Fingerprint of catalog URLs for logs (no secrets).
 */
export function catalogFingerprint(feeds) {
  const urls = (feeds || []).map((f) => String(f.url || '')).sort().join('\n');
  return createHash('sha256').update(urls, 'utf8').digest('hex').slice(0, 16);
}
