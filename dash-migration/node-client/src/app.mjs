import { URL } from 'node:url';
import { attemptLogin, sessionStillValid } from './auth.mjs';
import { loadLiveFeed, renderGetArticlesHtml, timelineJson } from './feed.mjs';
import {
  handleSendMessage,
  listConversations,
  listThread,
  markRead,
} from './messages.mjs';
import {
  renderIndexHtml,
  renderLoginHtml,
  renderMessagesHtml,
  renderTimelineHtml,
} from './render.mjs';
import { parseCookies, sessionCookieHeader } from './session.mjs';

/**
 * Local HTTP app — client read + messages (internal sendPush).
 */
export function createApp({ db, sessions, config, push, mailLog } = {}) {
  if (!push || typeof push.sendPush !== 'function') {
    throw new Error('createApp requires push={ sendPush, calls } (internal sendPush module)');
  }
  const mailSend = async (payload) => {
    mailLog?.push?.({ kind: 'mail', ...payload, at: Date.now() });
    return { ok: true, skipped: true, reason: 'DASH_DISABLE_EXTERNAL', to: payload.to };
  };

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
          sendPushInternal: true,
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

      if (!session && path !== '/login') {
        if (
          path.startsWith('/api/') ||
          path === '/get_articles' ||
          path === '/results.json' ||
          path === '/messages_loader'
        ) {
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

      // —— Messages (internal sendPush) ——
      if (path === '/messages' || path === '/messages_post') {
        if (req.method === 'POST') {
          const body = await readBody(req);
          const wantsJson =
            (req.headers.accept || '').includes('application/json') ||
            body.format === 'json';
          const result = await handleSendMessage(body, user, {
            db,
            sendPush: push.sendPush,
            mailSend,
            config,
          });
          if (wantsJson) {
            return json(res, result.ok ? 200 : 400, {
              ...result,
              pushCalls: push.calls.length,
            });
          }
          if (result.ok) {
            const to = Number(body.to_user);
            const loc =
              path === '/messages_post'
                ? `/messages?user=${to}&flash=${encodeURIComponent(result.alert)}`
                : `/messages?user=${to}&flash=${encodeURIComponent(result.alert)}`;
            res.writeHead(303, { Location: loc });
            res.end();
            return;
          }
        }

        const peerId = Number(url.searchParams.get('user') || 0);
        const idPost = Number(url.searchParams.get('id_post') || 0);
        const flash = url.searchParams.get('flash');
        const msgId = Number(url.searchParams.get('id_message') || 0);
        if (msgId > 0) await markRead(db, user.id_user, msgId);

        if (peerId > 0) {
          const thread = await listThread(db, user.id_user, peerId, {
            offset: 0,
            limit: 50,
          });
          const peerUser = await db.findUserById(peerId);
          return html(
            res,
            200,
            renderMessagesHtml({
              login: user.login_user,
              peer: { id: peerId, login_user: peerUser?.login_user },
              thread,
              alert: flash,
              idPost,
            })
          );
        }

        if (path === '/messages_post' || idPost > 0) {
          const users = await db.listUsersExcept(user.id_user);
          const postBrief = idPost ? await db.getPostBrief(idPost) : null;
          return html(
            res,
            200,
            renderMessagesHtml({
              login: user.login_user,
              users,
              idPost: idPost || 1,
              postBrief,
              alert: flash,
            })
          );
        }

        const conversations = await listConversations(db, user.id_user);
        return html(
          res,
          200,
          renderMessagesHtml({
            login: user.login_user,
            conversations,
            alert: flash,
          })
        );
      }

      if (req.method === 'POST' && path === '/messages_loader') {
        const body = await readBody(req);
        const peerId = Number(body.user || 0);
        const start = Math.max(0, Number(body.start || 0));
        if (!peerId) {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('0');
          return;
        }
        const thread = await listThread(db, user.id_user, peerId, {
          offset: start,
          limit: 5,
        });
        if (!thread.length) {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('0');
          return;
        }
        const htmlBits = thread
          .map(
            (m) =>
              `<div class="show_message ${m.from_self ? 'right from_me' : 'left not_from_me'}">` +
              `<p><strong>${esc(m.login_user)}</strong><br/><span class="grey2 small">[${esc(m.converted_date)}]</span></p>` +
              `<p>${m.text}</p></div>`
          )
          .join('\n');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlBits);
        return;
      }

      if (req.method === 'GET' && path === '/api/messages') {
        const peerId = Number(url.searchParams.get('user') || 0);
        if (peerId > 0) {
          const thread = await listThread(db, user.id_user, peerId, {
            offset: 0,
            limit: 50,
          });
          return json(res, 200, { ok: true, peerId, thread });
        }
        const conversations = await listConversations(db, user.id_user);
        return json(res, 200, { ok: true, conversations });
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

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
