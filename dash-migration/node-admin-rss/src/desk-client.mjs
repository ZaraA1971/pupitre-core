/**
 * Pure Desk ingest helpers (parity with admin/inc/desk.php payload + response parse).
 * No HTTP — callers supply transport when externals are enabled.
 */

/**
 * @param {Record<string, unknown>} article
 * @returns {Record<string, unknown>}
 */
export function buildDeskIngestPayload(article) {
  const payload = {
    title: String(article.title ?? 'Sans titre'),
    body: String(article.body ?? ''),
    draft: true,
    lang: String(article.lang ?? 'fr'),
    access: article.access === 'granted' ? 'granted' : 'subscribers',
    author: String(article.author ?? 'Emmanuel Torregano'),
    author_slug: String(article.author_slug ?? 'admin'),
    author_user_id: Number(article.author_user_id ?? 1) || 1,
  };
  const slug = article.slug != null ? String(article.slug).trim() : '';
  if (slug) payload.slug = slug;
  const sourceUrl = article.source_url != null ? String(article.source_url).trim() : '';
  if (sourceUrl) payload.source_url = sourceUrl;
  return payload;
}

/**
 * @param {string} title
 */
export function slugifyDeskTitle(title) {
  return String(title || 'draft')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/**
 * Parse Desk API JSON body (curl response decoded).
 * @param {unknown} data
 * @param {number} [httpStatus=200]
 * @returns {{ article_id: number, slug: string }}
 */
export function parseDeskIngestResponse(data, httpStatus = 200) {
  if (httpStatus < 200 || httpStatus >= 300 || !data || typeof data !== 'object') {
    const msg =
      data && typeof data === 'object' && 'error' in data
        ? String(/** @type {{ error?: unknown }} */ (data).error)
        : `HTTP ${httpStatus}`;
    throw new Error(`Desk refus : ${msg}`);
  }
  const article = /** @type {{ article?: unknown }} */ (data).article;
  if (!article || typeof article !== 'object') {
    throw new Error('Desk : article manquant dans la réponse.');
  }
  const meta =
    /** @type {{ data?: Record<string, unknown> }} */ (article).data &&
    typeof /** @type {{ data?: unknown }} */ (article).data === 'object'
      ? /** @type {{ data: Record<string, unknown> }} */ (article).data
      : /** @type {Record<string, unknown>} */ (article);
  const articleId = Number(meta.article_id ?? meta.wp_id ?? 0);
  if (!Number.isFinite(articleId) || articleId <= 0) {
    throw new Error('Desk : article_id manquant dans la réponse.');
  }
  return {
    article_id: articleId,
    slug: String(meta.slug ?? ''),
  };
}
