/**
 * Local RSS/Atom fixture parser — no HTTP.
 * Does not claim SimplePie parity; extracts items for injectable ingest tests.
 */
import { readFileSync } from 'node:fs';
import { nettoyerTexteAvance } from './text.mjs';

function decodeXmlEntities(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function tagContents(xml, tag) {
  const re = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>|<${tag}([^>]*)/>`,
    'gi'
  );
  const out = [];
  let m;
  while ((m = re.exec(xml))) {
    if (m[1] != null) out.push(m[1]);
    else out.push('');
  }
  return out;
}

function firstTag(xml, tag) {
  const all = tagContents(xml, tag);
  return all.length ? all[0] : '';
}

function attr(xmlOpen, name) {
  const m = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i').exec(xmlOpen || '');
  return m ? m[1] : '';
}

function parsePubDate(raw) {
  if (!raw) return null;
  const t = Date.parse(raw.trim());
  return Number.isFinite(t) ? t : null;
}

/**
 * @param {string} xml
 * @param {{ feedUrl?: string }} [meta]
 * @returns {{ feedUrl: string, feedTitle: string, items: object[] }}
 */
export function parseFeedXml(xml, meta = {}) {
  const feedUrl = meta.feedUrl || '';
  const trimmed = String(xml || '').trim();
  const isAtom = /<feed[\s>]/i.test(trimmed);

  if (isAtom) {
    const feedTitle = nettoyerTexteAvance(decodeXmlEntities(firstTag(trimmed, 'title')));
    const entries = trimmed.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
    const items = entries.map((entry) => {
      const title = nettoyerTexteAvance(decodeXmlEntities(firstTag(entry, 'title')));
      let link = '';
      const linkTags = entry.match(/<link\b[^>]*>/gi) || [];
      for (const lt of linkTags) {
        const rel = attr(lt, 'rel') || 'alternate';
        const href = attr(lt, 'href');
        if (href && (rel === 'alternate' || !attr(lt, 'rel'))) {
          link = href;
          break;
        }
      }
      if (!link) link = decodeXmlEntities(firstTag(entry, 'link')).trim();
      const id = decodeXmlEntities(firstTag(entry, 'id')).trim();
      const summary = decodeXmlEntities(
        firstTag(entry, 'content') || firstTag(entry, 'summary')
      );
      const text = nettoyerTexteAvance(summary);
      const updated = firstTag(entry, 'updated') || firstTag(entry, 'published');
      const authorBlock = firstTag(entry, 'author');
      const author =
        nettoyerTexteAvance(decodeXmlEntities(firstTag(authorBlock, 'name'))) ||
        'Auteur inconnu';
      return {
        id: id || link,
        title,
        text,
        link,
        author,
        dateMs: parsePubDate(updated),
        feedUrl,
      };
    });
    return { feedUrl, feedTitle, items };
  }

  // RSS 2.0
  const channel = firstTag(trimmed, 'channel') || trimmed;
  const feedTitle = nettoyerTexteAvance(decodeXmlEntities(firstTag(channel, 'title')));
  const itemBlocks = channel.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  const items = itemBlocks.map((item) => {
    const title = nettoyerTexteAvance(decodeXmlEntities(firstTag(item, 'title')));
    const link = decodeXmlEntities(firstTag(item, 'link')).trim();
    const guid = decodeXmlEntities(firstTag(item, 'guid')).trim();
    const description = decodeXmlEntities(
      firstTag(item, 'content:encoded') ||
        firstTag(item, 'description') ||
        firstTag(item, 'content')
    );
    const text = nettoyerTexteAvance(description);
    const pub = firstTag(item, 'pubDate') || firstTag(item, 'dc:date');
    let author = nettoyerTexteAvance(
      decodeXmlEntities(firstTag(item, 'author') || firstTag(item, 'dc:creator'))
    );
    if (!author) author = 'Auteur inconnu';
    return {
      id: guid || link,
      title,
      text,
      link,
      author,
      dateMs: parsePubDate(pub),
      feedUrl,
    };
  });
  return { feedUrl, feedTitle, items };
}

export function loadFeedXmlFile(filePath, feedUrl) {
  const xml = readFileSync(filePath, 'utf8');
  return parseFeedXml(xml, { feedUrl });
}

/**
 * Default hash for fixtures: prefer explicit item.id (guid), else fixture:link.
 * Not SimplePie get_id(true) — inject hashItem in tests/prod parity later.
 */
export function defaultFixtureHash(item) {
  const id = String(item?.id || '').trim();
  if (id) return id;
  const link = String(item?.link || '').trim();
  if (link) return `fixture:${link}`;
  return `fixture:empty:${String(item?.title || '')}`;
}

/**
 * Build loadFeed(url) from a map of url → absolute file path.
 * Throws if URL unknown (never fetches network).
 */
export function createFixtureFeedLoader(urlToFile) {
  const map = new Map(Object.entries(urlToFile || {}));
  return async function loadFeed(url) {
    const file = map.get(url);
    if (!file) {
      throw new Error(
        `Fixture feed introuvable pour URL locale ${url} (pas de fetch réseau).`
      );
    }
    return loadFeedXmlFile(file, url);
  };
}
