import { listPerPage } from './filters.mjs';

/**
 * Query params → inbox list options (parity with admin/index.php GET).
 */
export function parseInboxQuery(query = {}) {
  let source = query.source_name ?? query.source ?? null;
  if (source === '%' || source === '%25' || source === '' || source === 'Tous les flux') {
    source = null;
  }
  const keywordId = Number(query.keyword_id || 0) || 0;
  let tri = String(query.tri || 'date');
  if (!['date', 'pertinence', 'tendance'].includes(tri)) tri = 'date';
  const page = Math.max(1, Number(query.page || 1) || 1);
  return {
    source,
    keywordId,
    tri,
    page,
    perPage: listPerPage('index'),
  };
}

/**
 * Full inbox page model for UI / API.
 */
export async function loadInboxPage(db, query = {}) {
  const opts = parseInboxQuery(query);
  const [inbox, counts, themes, sources, keywords] = await Promise.all([
    db.listInbox(opts),
    db.navCounts(),
    db.listThemes(),
    db.listSources(),
    typeof db.listKeywords === 'function' ? db.listKeywords() : Promise.resolve([]),
  ]);

  let keywordName = null;
  if (opts.keywordId > 0) {
    const hit = keywords.find((k) => Number(k.id_keyword) === opts.keywordId);
    keywordName = hit ? hit.name_keyword : null;
  }

  return {
    filters: opts,
    counts,
    themes,
    sources,
    keywords,
    keywordName,
    rows: inbox.rows,
    page: inbox.page,
    totalPages: inbox.totalPages,
    totalRows: inbox.totalRows,
    offset: inbox.offset,
  };
}
