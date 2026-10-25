/**
 * HTTP(S) feed loader for controlled qualif — gated, no Vigie/Desk side effects.
 * Default bank still uses createFixtureFeedLoader (no network).
 */
import { parseFeedXml } from './feed-parse.mjs';

const DEFAULT_UA = 'LeDash/1.0 (+https://dash.electronlibre.info/)';
const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * @param {string} url
 * @returns {URL}
 */
export function assertSafeFeedUrl(url) {
  let parsed;
  try {
    parsed = new URL(String(url || ''));
  } catch {
    throw new Error(`URL de flux invalide: ${url}`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Protocole de flux refusé (${parsed.protocol}). http/https seulement.`);
  }
  const host = parsed.hostname.toLowerCase();
  // Block cloud metadata / obvious SSRF targets. Loopback allowed for local HTTP fixture server.
  if (
    host === '169.254.169.254' ||
    host === 'metadata.google.internal' ||
    host.endsWith('.internal')
  ) {
    throw new Error(`Hôte de flux refusé (${host}).`);
  }
  return parsed;
}

/**
 * @param {object} opts
 * @param {number} [opts.timeoutMs]
 * @param {string} [opts.userAgent]
 * @param {typeof fetch} [opts.fetchImpl]
 * @param {(url: string) => boolean} [opts.allowUrl] extra allowlist predicate
 * @param {boolean} [opts.allowFeedHttp] must be true
 */
export function createHttpFeedLoader({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  userAgent = DEFAULT_UA,
  fetchImpl = globalThis.fetch,
  allowUrl,
  allowFeedHttp = false,
} = {}) {
  if (!allowFeedHttp) {
    throw new Error(
      'createHttpFeedLoader refuse allowFeedHttp=false (activer DASH_ALLOW_FEED_HTTP=1 explicitement).'
    );
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetchImpl requis pour le chargeur HTTP.');
  }

  return async function loadFeed(url) {
    const parsed = assertSafeFeedUrl(url);
    if (typeof allowUrl === 'function' && !allowUrl(parsed.href)) {
      throw new Error(`URL de flux hors allowlist: ${parsed.href}`);
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res;
    try {
      res = await fetchImpl(parsed.href, {
        method: 'GET',
        redirect: 'follow',
        signal: ctrl.signal,
        headers: {
          'user-agent': userAgent,
          accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        },
      });
    } catch (err) {
      const msg = err?.name === 'AbortError' ? `timeout ${timeoutMs}ms` : String(err?.message || err);
      throw new Error(`Fetch flux échoué (${parsed.href}): ${msg}`);
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      throw new Error(`Fetch flux HTTP ${res.status} pour ${parsed.href}`);
    }
    const xml = await res.text();
    return parseFeedXml(xml, { feedUrl: parsed.href });
  };
}
