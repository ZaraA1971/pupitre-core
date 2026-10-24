import { listPerPage } from './filters.mjs';

export async function loadSentPage(db, query = {}) {
  const page = Math.max(1, Number(query.page || 1) || 1);
  const list = await db.listSent({ page, perPage: listPerPage('sent') });
  const counts = await db.navCounts();
  return { kind: 'sent', counts, ...list };
}

export async function loadDeletedPage(db, query = {}) {
  const page = Math.max(1, Number(query.page || 1) || 1);
  const list = await db.listDeleted({ page, perPage: listPerPage('deleted') });
  const counts = await db.navCounts();
  return { kind: 'deleted', counts, ...list };
}

export async function loadConfigCatalog(db) {
  const [themes, keywords, authors, counts] = await Promise.all([
    db.listThemes(),
    db.listKeywords(),
    typeof db.listAuthors === 'function' ? db.listAuthors() : Promise.resolve([]),
    db.navCounts(),
  ]);
  return { themes, keywords, authors, counts };
}
