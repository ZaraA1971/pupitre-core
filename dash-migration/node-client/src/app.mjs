import { URL } from 'node:url';
import { attemptLogin, sessionStillValid } from './auth.mjs';
import { loadLiveFeed, renderGetArticlesHtml, timelineJson } from './feed.mjs';
import {
  renderIndexHtml,
  renderLoginHtml,
  renderTimelineHtml,
} from './render.mjs';
import { parseCookies, sessionCookieHeader } from './session.mjs';

/**
 * Local HTTP app — client read lot only.
 */
export function createApp({ db, sessions, config }) {
  return async function app(req, res) {
    const host = req.headers.host || `${config.listenHost}:${config.listenPort}`;
    const url = new URL(req.url || '/', `http://${host}`);
    const path = url.pathname;
    const cookies = parseCookies(req.headers.cookie);
    const sid = cookies[sessions.COOKIE];
    let session = sessions.get(sid);
    if (session && !(await sessionStillValid(db, session))) {
      sessions.destroy(sid);
      session = null;
    }

    try {
      if (req.method === 'GET' && (path === '/health' || path === '/api/health')) {
        return json(res, 200, {
          ok: true,
          mode: config.mode,
          disableExternal: config.disableExternal,
          authenticated: Boolean(session),
        });
      }

      if (path === '/login') {
        if (session) {
          res.writeHead(303, { Location: '/' });
          res.end();
          return;
        }
        if (req.method === 'GET') {
          return html(res, 200, renderLoginHtml());
        }
        if (req.method === 'POST') {
          const body = await readBody(req);
          const result = await attemptLogin(db, {
            username: body.TB_Nom_Utilisateur,
            password: body.TB_Mot_de_Passe,
          });
          if (!result.ok) {
            return html(res, 200, renderLoginHtml({ message: result.message }));
          }
          const newSid = sessions.create(result.user.id_user, result.user.login_user);
          // stash last_connexion on session via store mutation
          const s = sessions.get(newSid);
          if (s) s.last_connexion = result.user.last_connexion;
          res.writeHead(303, {
            Location: '/',
            'Set-Cookie': sessionCookieHeader(
              sessions.COOKIE,
              newSid,
              config.sessionTtlSeconds
            ),
          });
          res.end();
          return;
        }
      }

      if (req.method === 'GET' && path === '/disconnect') {
        sessions.destroy(sid);
        res.writeHead(303, {
          Location: '/login',
          'Set-Cookie': sessionCookieHeader(sessions.COOKIE, '', 0, { clear: true }),
        });
        res.end();
        return;
      }

      // Auth gate for the rest
      if (!session && path !== '/login') {
        if (path.startsWith('/api/') || path === '/get_articles' || path === '/results.json') {
          return json(res, 401, { ok: false, error: 'auth_required' });
        }
        res.writeHead(303, { Location: '/login' });
        res.end();
        return;
      }

      const userRow = await db.findUserById(session.userId);
      const user = {
        id_user: session.userId,
        login_user: session.login,
        last_connexion:
          session.last_connexion || userRow?.last_connexion || '1970-01-01 00:00:00',
      };

      if (req.method === 'GET' && (path === '/' || path === '/index')) {
        const page = Number(url.searchParams.get('page') || 1);
        const feed = await loadLiveFeed(db, user, {
          page,
          textMax: config.textMax,
          pageSize: config.pageSize,
        });
        return html(
          res,
          200,
          renderIndexHtml({
            login: user.login_user,
            feed,
            flash: url.searchParams.get('flash'),
          })
        );
      }

      if (req.method === 'GET' && path === '/api/feed') {
        const page = Number(url.searchParams.get('page') || 1);
        const feed = await loadLiveFeed(db, user, {
          page,
          textMax: config.textMax,
          pageSize: config.pageSize,
        });
        return json(res, 200, {
          ok: true,
          login: user.login_user,
          themeIds: feed.themeIds,
          page: feed.page,
          newCount: feed.newArticles.length,
          oldCount: feed.oldArticles.length,
          articles: feed.articles,
        });
      }

      if (req.method === 'POST' && path === '/get_articles') {
        const body = await readBody(req);
        const keywordId = Number(body.keyword_id || 0);
        const date2 = String(body.date2 || '').trim();
        if (keywordId < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(date2)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<p class="graph-day-empty">Paramètres invalides.</p>');
          return;
        }
        const posts = await db.articlesByKeywordDay(keywordId, date2);
        const label = String(body.date || date2).trim() || date2;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderGetArticlesHtml(posts, label));
        return;
      }

      if (req.method === 'GET' && path === '/timeline') {
        return html(res, 200, renderTimelineHtml({ login: user.login_user }));
      }

      if (req.method === 'GET' && path === '/results.json') {
        const events = await db.timelineEvents();
        return json(res, 200, timelineJson(events));
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

function html(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
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
  const params = new URLSearchParams(raw);
  const body = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    body[key] = all.length > 1 ? all : all[0];
  }
  return body;
}
