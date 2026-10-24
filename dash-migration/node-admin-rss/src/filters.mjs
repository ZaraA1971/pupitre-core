/** Parity with admin/inc/rss-filter.php SQL fragments (string form for SQL adapters). */

export function rssInboxSql(alias = null) {
  const p = alias ? `${alias}.` : '';
  return `${p}bin = 0 AND ${p}new = 1 AND ${p}sent = 0 AND ${p}deleted = 0`;
}

export function rssEditorialInboxSql(alias = null) {
  const p = alias ? `${alias}.` : '';
  return (
    rssInboxSql(alias) +
    ` AND ${p}source NOT IN (SELECT name FROM rss_url WHERE audience = 'vigie')`
  );
}

export function rssVigieInboxSql(alias = null) {
  const p = alias ? `${alias}.` : '';
  return (
    rssInboxSql(alias) +
    ` AND ${p}source IN (SELECT name FROM rss_url WHERE audience = 'vigie')`
  );
}

export function rssSentSql(alias = null) {
  const p = alias ? `${alias}.` : '';
  return `${p}bin = 0 AND ${p}sent = 1 AND ${p}deleted = 0`;
}

export function rssDeletedSql(alias = null) {
  const p = alias ? `${alias}.` : '';
  return `${p}deleted = 1`;
}

export function indexPromoSqlFragment() {
  return `
                  AND r.title NOT LIKE "%bon plan%"
                  AND r.title NOT LIKE "%promo%"
                  AND r.title NOT LIKE "%offre%"
                  AND r.title NOT LIKE "%réduction%"
                  AND r.text NOT LIKE "%code promo%"`;
}

/** In-memory predicate equivalent of editorial inbox + promo fragment (tests). */
export function isEditorialInboxRow(row, vigieSources = new Set()) {
  if (Number(row.bin) !== 0) return false;
  if (Number(row.new) !== 1) return false;
  if (Number(row.sent) !== 0) return false;
  if (Number(row.deleted) !== 0) return false;
  if (vigieSources.has(String(row.source || ''))) return false;
  const title = String(row.title || '').toLowerCase();
  const text = String(row.text || '').toLowerCase();
  if (title.includes('bon plan')) return false;
  if (title.includes('promo')) return false;
  if (title.includes('offre')) return false;
  if (title.includes('réduction')) return false;
  if (text.includes('code promo')) return false;
  return true;
}

export function postIdsFromRequest(body = {}) {
  const raw = body.id_post;
  if (!Array.isArray(raw)) return [];
  const ids = [];
  for (const id of raw) {
    const n = Number(id);
    if (Number.isInteger(n) && n > 0) ids.push(n);
  }
  return ids;
}

export function listPerPage(list) {
  const limits = { index: 75, sent: 75, deleted: 200 };
  return limits[list] ?? 75;
}

export function paginationState(page, totalRows, perPage) {
  const totalPages = Math.max(1, Math.ceil(totalRows / Math.max(1, perPage)));
  const p = Math.min(Math.max(1, page), totalPages);
  return {
    page: p,
    totalPages,
    offset: (p - 1) * perPage,
    totalRows,
  };
}
