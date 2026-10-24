import { URL } from 'node:url';
import { handleIndexActions } from './actions.mjs';
import { loadInboxPage, parseInboxQuery } from './inbox.mjs';
import { renderInboxHtml } from './render.mjs';
import { handleSendToDesk } from './send-to-desk.mjs';
import { createLocalDeskInjectables } from './local-desk.mjs';

/**
 * Minimal HTTP app for the local admin inbox journey.
 * Desk (`to_desk`) uses local injectables (fixture HTML + deterministic LLM), never real OpenAI/Desk HTTP.
 * @param {{
 *   db: object,
 *   externals: object,
 *   config: object,
 *   fetchArticle?: Function,
 *   llm?: Function,
 *   resolveRssHint?: Function,
 * }} deps
 */
export function createApp({
  db,
  externals,
  config,
  fetchArticle,
  llm,
  resolveRssHint,
} = {}) {
  const localDesk = createLocalDeskInjectables();
  const deskFetchArticle = typeof fetchArticle === 'function' ? fetchArticle : localDesk.fetchArticle;
  const deskLlm = typeof llm === 'function' ? llm : localDesk.llm;

  return async function app(req, res) {
    const host = req.headers.host || `${config.listenHost}:${config.listenPort}`;
    const url = new URL(req.url || '/', `http://${host}`);
    const path = url.pathname;

    try {
      if (req.method === 'GET' && (path === '/health' || path === '/api/health')) {
        return json(res, 200, {
          ok: true,
          mode: config.mode,
          disableExternal: config.disableExternal,
          deskLocal: true,
        });
      }

      if (req.method === 'GET' && path === '/api/inbox') {
        const model = await loadInboxPage(db, Object.fromEntries(url.searchParams));
        return json(res, 200, model);
      }

      if (req.method === 'GET' && (path === '/' || path === '/index')) {
        const model = await loadInboxPage(db, Object.fromEntries(url.searchParams));
        const flash = url.searchParams.get('flash');
        const html = renderInboxHtml(model, { flash, deskEnabled: true });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      if (req.method === 'POST' && (path === '/actions' || path === '/index')) {
        const body = await readBody(req);
        if (body.to_desk !== undefined) {
          const out = await handleSendToDesk(body, {
            db,
            externals,
            fetchArticle: deskFetchArticle,
            llm: deskLlm,
            resolveRssHint,
          });
          return json(res, out.status, out.json);
        }

        const result = await handleIndexActions(body, { db, externals, config });
        const wantsJson =
          (req.headers.accept || '').includes('application/json') ||
          body.format === 'json' ||
          url.searchParams.get('format') === 'json';

        if (wantsJson) {
          const counts = await db.navCounts();
          return json(res, 200, { ...result, counts });
        }

        const flash = `Actions: ${(result.actions || []).join(', ') || 'aucune'}`;
        const redirectQs = new URLSearchParams();
        redirectQs.set('flash', flash);
        const filters = parseInboxQuery(body);
        if (filters.source) redirectQs.set('source_name', filters.source);
        if (filters.tri !== 'date') redirectQs.set('tri', filters.tri);
        if (filters.keywordId > 0) redirectQs.set('keyword_id', String(filters.keywordId));
        res.writeHead(303, { Location: `/?${redirectQs.toString()}` });
        res.end();
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    } catch (err) {
      console.error(err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: String(err?.message || err) }));
    }
  };
}

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  const type = String(req.headers['content-type'] || '');
  if (type.includes('application/json')) {
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  }
  // application/x-www-form-urlencoded (admin form)
  const params = new URLSearchParams(raw);
  const body = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    body[key] = all.length > 1 || key.endsWith('[]') ? all : all[0];
  }
  // Normalize id_post[] → id_post array
  if (body['id_post[]'] !== undefined && body.id_post === undefined) {
    body.id_post = Array.isArray(body['id_post[]'])
      ? body['id_post[]']
      : [body['id_post[]']];
  } else if (body.id_post !== undefined && !Array.isArray(body.id_post)) {
    body.id_post = [body.id_post];
  }
  return body;
}
