/**
 * Parity with SimplePie_Item::get_id(true) as used by rss_refresh_engine.php.
 *
 * When $hash is true, SimplePie ignores guid/id and returns:
 *   md5(permalink . title) if either permalink or title is non-null
 *   else md5(serialize($this->data)) — not reproduced here (no PHP serialize).
 *
 * Oracle (rag-server-EL SimplePie, 2026-10-25): 
 *   permalink=https://example.test/x title="Hello &amp; Co"
 *   → 5c9f8e2546e4ef5fc7937f326561c0ac
 */
import { createHash } from 'node:crypto';

/**
 * @param {{ permalink?: string|null, title?: string|null, link?: string|null, titleRaw?: string|null }} item
 * @returns {string} 32-char hex md5, or '' if neither permalink nor title present
 */
export function simplePieGetIdTrue(item = {}) {
  const permalink =
    item.permalink !== undefined && item.permalink !== null
      ? item.permalink
      : item.link !== undefined && item.link !== null
        ? item.link
        : null;
  const title =
    item.titleRaw !== undefined && item.titleRaw !== null
      ? item.titleRaw
      : item.title !== undefined && item.title !== null
        ? item.title
        : null;

  const hasPermalink = permalink !== null && permalink !== undefined;
  const hasTitle = title !== null && title !== undefined;
  if (!hasPermalink && !hasTitle) {
    return '';
  }

  // PHP null concatenates as ""
  const left = hasPermalink ? String(permalink) : '';
  const right = hasTitle ? String(title) : '';
  return createHash('md5').update(left + right, 'utf8').digest('hex');
}

/**
 * hashItem adapter for refresh engine items ({ link, title, titleRaw }).
 */
export function simplePieHashItem(item) {
  return simplePieGetIdTrue(item);
}
