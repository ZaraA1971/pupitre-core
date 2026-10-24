/**
 * RSS refresh engine — parity with admin/rss_refresh_engine.php (fixtures / injectable I/O).
 */
import {
  estArticleFluxBruit,
  estArticlePublicitaire,
  journalFromSource,
  keywordMatchInText,
  vigieThemeLabel,
} from './classifiers.mjs';
import { defaultFixtureHash } from './feed-parse.mjs';
import { sqlNow } from './rss-lock.mjs';
import { nettoyerTexteAvance } from './text.mjs';

/** Distinct keyword IDs required to keep an editorial item (PHP RSS_MIN_DISTINCT_KEYWORDS). */
export const RSS_MIN_DISTINCT_KEYWORDS = 3;

/** Drop posts older than this many days (PHP RSS_KEEP_DAYS). */
export const RSS_KEEP_DAYS = 38;

/**
 * @param {object} opts
 * @param {object} opts.db refresh-capable admin db
 * @param {(url: string) => Promise<{ feedUrl: string, feedTitle: string, items: object[] }>} opts.loadFeed
 * @param {(item: object) => string} [opts.hashItem]
 * @param {() => number} [opts.nowMs]
 * @param {{ pushInfos: Function }} [opts.vigie]
 * @param {'manual'|'cron'} [opts.mode]
 * @param {boolean} [opts.skipMarkBin]
 * @param {number|null} [opts.deleteOlderThanDays]
 * @param {boolean} [opts.deleteStaleBinUnsent]
 * @param {boolean} [opts.progress]
 */
export async function runRssRefresh({
  db,
  loadFeed,
  hashItem = defaultFixtureHash,
  nowMs = () => Date.now(),
  vigie = null,
  mode = 'manual',
  skipMarkBin = false,
  deleteOlderThanDays = RSS_KEEP_DAYS,
  deleteStaleBinUnsent = mode === 'cron',
  progress = mode === 'manual',
} = {}) {
  if (typeof loadFeed !== 'function') {
    throw new Error('loadFeed injectable requis (fixtures locales, jamais HTTP).');
  }

  const urls = await db.listRssUrls();
  const rssUrlMap = {};
  const audienceByUrl = {};
  const themeByUrl = {};
  for (const row of urls) {
    const url = String(row.url || '');
    if (!url) continue;
    rssUrlMap[url] = String(row.name || '');
    audienceByUrl[url] =
      String(row.audience || 'editorial') === 'vigie' ? 'vigie' : 'editorial';
    const theme = String(row.theme || '').trim();
    if (theme) themeByUrl[url] = theme;
  }

  const feedUrls = urls.map((u) => u.url).filter(Boolean);
  if (feedUrls.length === 0) {
    return { ok: true, empty: true, itemsSeen: 0, inserted: 0, skippedPromo: 0 };
  }

  const kwData = await db.loadKeywordData();
  const feeds = [];
  for (const url of feedUrls) {
    feeds.push(await loadFeed(url));
  }

  // Flatten items; each item already carries feedUrl from parser
  const items = [];
  for (const feed of feeds) {
    for (const item of feed.items || []) {
      items.push({
        ...item,
        feedUrl: item.feedUrl || feed.feedUrl,
        feedTitle: feed.feedTitle,
      });
    }
  }

  return processItems({
    db,
    items,
    rssUrlMap,
    audienceByUrl,
    themeByUrl,
    kwData,
    hashItem,
    nowMs,
    vigie,
    skipMarkBin,
    deleteOlderThanDays,
    deleteStaleBinUnsent,
    progress,
  });
}

async function processItems({
  db,
  items,
  rssUrlMap,
  audienceByUrl,
  themeByUrl,
  kwData,
  hashItem,
  nowMs,
  vigie,
  skipMarkBin,
  deleteOlderThanDays,
  deleteStaleBinUnsent,
  progress,
}) {
  const stats = {
    ok: true,
    itemsSeen: items.length,
    inserted: 0,
    revisited: 0,
    skippedNoLink: 0,
    skippedPromo: 0,
    trashedLowKw: 0,
    deletedOlder: 0,
    deletedStaleBin: 0,
    vigieEvents: 0,
  };

  if (!skipMarkBin) {
    await db.markAllNewAsBin();
  }

  const vigiePushed = [];
  const num = items.length;
  let idx = 0;

  for (const item of items) {
    idx += 1;
    if (progress && (idx === 1 || idx % 50 === 0 || idx === num)) {
      await db.setRefreshCurrent(idx);
      if (typeof db.touchRefreshActivity === 'function') {
        await db.touchRefreshActivity(sqlNow(nowMs));
      }
    }

    const link = String(item.link || '').trim();
    if (!link) {
      stats.skippedNoLink += 1;
      continue;
    }

    const hash = String(hashItem(item) || '').trim();
    if (!hash) continue;

    const exists = (await db.countByHash(hash)) > 0;
    if (exists) {
      await db.clearBinByHash(hash);
      stats.revisited += 1;
      continue;
    }

    const title = String(nettoyerTexteAvance(item.title || '')).slice(0, 255);
    const text = String(nettoyerTexteAvance(item.text || '')).slice(0, 14999);
    if (estArticlePublicitaire(title, text) || estArticleFluxBruit(title, text)) {
      stats.skippedPromo += 1;
      continue;
    }

    const feedUrlKey = String(item.feedUrl || '');
    const source =
      rssUrlMap[feedUrlKey] ||
      String(item.feedTitle || feedUrlKey || 'source inconnue');
    const isVigie = (audienceByUrl[feedUrlKey] || 'editorial') === 'vigie';
    const author = String(item.author || 'Auteur inconnu') || 'Auteur inconnu';
    let date;
    if (item.dateMs && Number.isFinite(item.dateMs)) {
      date = new Date(item.dateMs).toISOString().slice(0, 19).replace('T', ' ');
    } else {
      date = sqlNow(nowMs);
    }

    await db.insertRssPost({
      date,
      source,
      title,
      text,
      author,
      link,
      hash,
      new: 1,
      bin: 0,
      sent: 0,
      deleted: 0,
      alert: 0,
      id_theme: 0,
    });
    stats.inserted += 1;

    if (isVigie) {
      const themeKey = String(themeByUrl[feedUrlKey] || '');
      const facts = {
        theme: vigieThemeLabel(themeKey),
        label: journalFromSource(source),
        date,
        link,
      };
      if (author && author.toLowerCase() !== 'auteur inconnu') {
        facts.actor = author;
      }
      vigiePushed.push({
        title,
        body: text.slice(0, 4000),
        facts,
        fingerprint: `dash:${hash}`,
      });
    }

    const trashed = await attachKeywords(db, hash, title, text, kwData, isVigie);
    if (trashed) stats.trashedLowKw += 1;
  }

  if (deleteOlderThanDays != null && deleteOlderThanDays > 0) {
    stats.deletedOlder = await db.deleteOlderThanDays(deleteOlderThanDays, nowMs());
  }

  if (deleteStaleBinUnsent) {
    stats.deletedStaleBin = await db.deleteStaleBinUnsent();
  }

  if (vigiePushed.length && vigie && typeof vigie.pushInfos === 'function') {
    await vigie.pushInfos(vigiePushed);
    stats.vigieEvents = vigiePushed.length;
  }

  return stats;
}

async function attachKeywords(db, hash, title, text, kwData, skipTrashThreshold) {
  const haystack = `${title} ${text}`;
  const matched = new Set();

  for (const kw of kwData.keywords || []) {
    const id = Number(kw.id_keyword);
    if (keywordMatchInText(haystack, kw.name_keyword)) {
      matched.add(id);
      await db.attachPostKeyword(hash, id);
    }
  }
  for (const al of kwData.aliases || []) {
    const id = Number(al.id_keyword);
    if (keywordMatchInText(haystack, al.name_alias)) {
      matched.add(id);
      await db.attachPostKeyword(hash, id);
    }
  }

  if (skipTrashThreshold) return false;
  if (matched.size < RSS_MIN_DISTINCT_KEYWORDS) {
    await db.trashLowKeywordHash(hash);
    return true;
  }
  return false;
}

/** Manual UI options (refresh_rss.php). */
export function manualRefreshOptions() {
  return {
    mode: 'manual',
    deleteOlderThanDays: RSS_KEEP_DAYS,
    deleteStaleBinUnsent: false,
    progress: true,
  };
}

/** Cron options (cron.php). */
export function cronRefreshOptions() {
  return {
    mode: 'cron',
    deleteOlderThanDays: RSS_KEEP_DAYS,
    deleteStaleBinUnsent: true,
    progress: false,
  };
}
