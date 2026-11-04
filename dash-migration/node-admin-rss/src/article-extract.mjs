/**
 * Offline article text extraction (parity subset of admin/inc/fetch-article.php).
 * Pure string/HTML helpers — no HTTP, no DOM libraries.
 */

export const FETCH_MIN_CHARS = 280;

export function normalizePlain(text) {
  let t = String(text ?? '');
  t = t
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  t = t.replace(/[ \t]+/gu, ' ');
  t = t.replace(/(?:\r\n|\r|\n){3,}/gu, '\n\n');
  return t.trim();
}

export function stripTags(html) {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ');
}

export function isBoilerplateParagraph(text) {
  const t = String(text ?? '').trim();
  if (!t) return true;
  if ([...t].length < 40) return true;
  return /^(Related|Share on|Subscribe|Sign up|Read (Next|more)|Comments?|Advertisement|Free daily|Global business news|Getty Images|Bloomberg\s*\/|By subscribing|Terms of Service|Privacy Policy|Email.*?required|Follow us|Newsletter)/iu.test(
    t
  );
}

export function isBlockedOrJunkText(text) {
  const t = String(text ?? '').trim();
  if (!t) return true;
  return /(security service to protect itself from online attacks|attention required|cf-browser-verification|just a moment\.\.\.|uh-oh\s*page not found|this is probably not the page you.re looking for|designed to data mine or scrape the content|enable javascript and cookies to continue|subscribe to unlock|save \d+%\s+to unlock|you.ve reached your (article|monthly) limit|please log in to (continue|read))/iu.test(
    t
  );
}

/**
 * @param {string} html
 * @returns {string|null}
 */
export function extractJsonLdArticleBody(html) {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let best = null;
  let bestLen = 0;
  let m;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (typeof node.articleBody === 'string') {
      const t = normalizePlain(stripTags(node.articleBody));
      const len = [...t].length;
      if (len > bestLen) {
        best = t;
        bestLen = len;
      }
    }
    if (Array.isArray(node)) {
      for (const v of node) walk(v);
      return;
    }
    for (const v of Object.values(node)) {
      if (v && typeof v === 'object') walk(v);
    }
  };
  while ((m = re.exec(String(html ?? '')))) {
    try {
      const decoded = JSON.parse(normalizePlain(m[1]));
      walk(decoded);
    } catch {
      /* ignore bad json-ld */
    }
  }
  return bestLen >= FETCH_MIN_CHARS ? best : null;
}

/**
 * Host-aware preferred class tokens (mirrors PHP xpath class targets, without XPath).
 * @param {string} host
 * @returns {string[]}
 */
export function articleClassTokens(host) {
  const h = String(host || '').toLowerCase();
  const specific = [];
  if (h.includes('9to5mac.com') || h.includes('9to5google.com') || h.includes('9to5toys.com')) {
    specific.push('post-content');
  }
  if (h.includes('qz.com') || h.includes('quartz')) {
    specific.push('payload-richtext');
  }
  if (h.includes('lsa-conso.fr')) {
    specific.push('article-content', 'article__content', 'contenu-article');
  }
  if (h.includes('cnet.com')) {
    specific.push('c-pageArticle_content', 'article-main-body', 'speakableContent');
  }
  if (h.includes('siecledigital.fr') || h.includes('databreaches.net')) {
    specific.push('entry-content', 'post-content');
  }
  return [
    ...specific,
    'post-content',
    'entry-content',
    'article-body',
    'article__body',
    'story-body',
    'payload-richtext',
  ];
}

/**
 * Extract text from elements whose class contains token.
 * @param {string} html
 * @param {string} token
 */
function extractByClassToken(html, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `<([a-z0-9]+)([^>]*\\bclass=["'][^"']*\\b${escaped}\\b[^"']*["'][^>]*)>([\\s\\S]*?)<\\/\\1>`,
    'gi'
  );
  const parts = [];
  let m;
  while ((m = re.exec(html))) {
    const t = normalizePlain(stripTags(m[3]));
    if (isBoilerplateParagraph(t)) continue;
    if (t) parts.push(t);
  }
  if (!parts.length) return null;
  return normalizePlain([...new Set(parts)].join('\n\n'));
}

function extractItempropArticleBody(html) {
  const re =
    /<([a-z0-9]+)([^>]*\bitemprop=["']articleBody["'][^>]*)>([\s\S]*?)<\/\1>/gi;
  const parts = [];
  let m;
  while ((m = re.exec(html))) {
    const t = normalizePlain(stripTags(m[3]));
    if (t && !isBoilerplateParagraph(t)) parts.push(t);
  }
  if (!parts.length) return null;
  return normalizePlain([...new Set(parts)].join('\n\n'));
}

function extractTagInner(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(html);
  if (!m) return null;
  return normalizePlain(stripTags(m[1]));
}

/**
 * Dense <p> aggregation under article/main/body.
 * @param {string} html
 */
export function extractParagraphDensity(html) {
  let scope = html;
  const art = /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html);
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  if (art) scope = art[1];
  else if (main) scope = main[1];

  const parts = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(scope))) {
    const t = normalizePlain(stripTags(m[1]));
    if (isBoilerplateParagraph(t)) continue;
    parts.push(t);
  }
  const unique = [...new Set(parts)];
  const joined = unique.join('\n\n');
  if (unique.length < 2 && [...joined].length < FETCH_MIN_CHARS) return null;
  return joined ? normalizePlain(joined) : null;
}

/**
 * @param {string} html
 * @param {string} [url]
 * @returns {string|null}
 */
export function extractArticleText(html, url = '') {
  let host = '';
  try {
    host = new URL(url).hostname || '';
  } catch {
    host = '';
  }

  const fromLd = extractJsonLdArticleBody(html);
  if (fromLd) return fromLd;

  const candidates = [];
  const itemprop = extractItempropArticleBody(html);
  if (itemprop && [...itemprop].length >= 120) candidates.push(itemprop);

  for (const token of articleClassTokens(host)) {
    const text = extractByClassToken(html, token);
    if (!text || [...text].length < 120) continue;
    candidates.push(text);
    if ([...text].length >= FETCH_MIN_CHARS) break;
  }

  for (const tag of ['article', 'main']) {
    const text = extractTagInner(html, tag);
    if (text && [...text].length >= 120) candidates.push(text);
  }

  const density = extractParagraphDensity(html);
  if (density) candidates.push(density);

  const filtered = candidates.filter((t) => !isBlockedOrJunkText(t));
  if (!filtered.length) {
    const plain = normalizePlain(stripTags(html));
    return plain && !isBlockedOrJunkText(plain) ? plain : null;
  }
  filtered.sort((a, b) => [...b].length - [...a].length);
  let best = filtered[0];
  best =
    best.replace(
      /\n*(By subscribing|Terms of Service|Privacy Policy|Subscribe to .*)$/iu,
      ''
    ) || best;
  best = normalizePlain(best);
  return isBlockedOrJunkText(best) ? null : best;
}

/**
 * Resolve article body from optional HTML fixture + RSS hint (no network).
 * @param {string} url
 * @param {string|null|undefined} rssHint
 * @param {string|null|undefined} html
 * @returns {string|null}
 */
export function resolveArticleText(url, rssHint, html) {
  let hint = rssHint != null ? normalizePlain(stripTags(rssHint)) : '';
  if (hint && isBlockedOrJunkText(hint)) hint = '';

  const trimmedUrl = String(url || '').trim();
  if (!trimmedUrl) return hint || null;

  let extracted = null;
  if (typeof html === 'string' && html) {
    extracted = extractArticleText(html, trimmedUrl);
    if (extracted && isBlockedOrJunkText(extracted)) extracted = null;
  }

  if (extracted && [...extracted].length >= FETCH_MIN_CHARS) return extracted;
  if (hint && [...hint].length >= [...(extracted || '')].length) return hint;
  return extracted || hint || null;
}
