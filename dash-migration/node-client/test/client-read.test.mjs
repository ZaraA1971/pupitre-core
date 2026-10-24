import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { loadConfig, ConfigError } from '../src/config.mjs';
import { md5, verifyPassword, looksLikeMd5 } from '../src/password.mjs';
import { createFakeClientDb, loadFixtureSeed } from '../src/fake-db.mjs';
import { createSessionStore } from '../src/session.mjs';
import { createApp } from '../src/app.mjs';
import { attemptLogin } from '../src/auth.mjs';
import { renderGetArticlesHtml, timelineJson } from '../src/feed.mjs';

function listen(app) {
  const server = http.createServer((req, res) => {
    app(req, res).catch((err) => {
      res.writeHead(500);
      res.end(String(err));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        base: `http://127.0.0.1:${port}`,
        async close() {
          await new Promise((r) => server.close(r));
        },
      });
    });
  });
}

async function req(base, path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${base}${path}`, { method, headers, body, redirect: 'manual' });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return {
    status: res.status,
    text,
    json,
    headers: res.headers,
    setCookie: res.headers.getSetCookie?.() || [],
  };
}

function cookieFrom(setCookie) {
  const line = setCookie.find((c) => c.startsWith('dash_client_sid='));
  if (!line) return '';
  return line.split(';')[0];
}

describe('config guards', () => {
  it('refuses DASH_DISABLE_EXTERNAL=0', () => {
    assert.throws(
      () => loadConfig({ DASH_DISABLE_EXTERNAL: '0' }),
      (e) => e instanceof ConfigError
    );
  });

  it('refuses non-fixtures DB mode in this lot', () => {
    assert.throws(
      () => loadConfig({ DASH_DISABLE_EXTERNAL: '1', DASH_DB_MODE: 'mysql' }),
      /fixtures uniquement/
    );
  });
});

describe('password md5 parity', () => {
  it('verifies md5 like PHP QualifPassword legacy path', () => {
    const h = md5('alice');
    assert.equal(looksLikeMd5(h), true);
    assert.equal(verifyPassword('alice', h), true);
    assert.equal(verifyPassword('wrong', h), false);
  });
});

describe('auth unit', () => {
  it('logs in active user and rejects inactive/bad pass', async () => {
    const db = createFakeClientDb(loadFixtureSeed());
    const ok = await attemptLogin(db, { username: 'alice', password: 'alice' });
    assert.equal(ok.ok, true);
    assert.equal(ok.user.id_user, 1);

    const inactive = await attemptLogin(db, { username: 'bobby', password: 'bobby' });
    assert.equal(inactive.ok, false);
    assert.match(inactive.message, /activé/);

    const bad = await attemptLogin(db, { username: 'alice', password: 'nope' });
    assert.equal(bad.ok, false);
  });
});

describe('get_articles / timeline helpers', () => {
  it('renders day panel HTML', () => {
    const html = renderGetArticlesHtml(
      [{ title: 'T', link: 'https://example.test/a', source: 'S', cdate: '10:00' }],
      '2026-10-20'
    );
    assert.match(html, /graph-day-panel/);
    assert.match(html, /1 article/);
    assert.match(html, /example\.test\/a/);
  });

  it('builds timeline JSON envelope', () => {
    const j = timelineJson([
      {
        start: '2026-10-20T10:00:00Z',
        title: 'A',
        description: 'd',
        link: 'https://example.test/a',
        theme: 'Tech',
      },
    ]);
    assert.equal(j.dateTimeFormat, 'iso8601');
    assert.equal(j.events[0].caption, 'Tech');
  });
});

describe('HTTP client read journey (fixtures)', () => {
  let svc;
  let db;
  let cookie = '';

  before(async () => {
    const config = loadConfig({
      DASH_DB_MODE: 'fixtures',
      DASH_DISABLE_EXTERNAL: '1',
    });
    db = createFakeClientDb(loadFixtureSeed());
    const sessions = createSessionStore({ ttlSeconds: config.sessionTtlSeconds });
    const app = createApp({ db, sessions, config });
    svc = await listen(app);
  });

  after(async () => {
    await svc.close();
    await db.close();
  });

  it('health + login redirect', async () => {
    const health = await req(svc.base, '/health');
    assert.equal(health.status, 200);
    assert.equal(health.json.mode, 'fixtures');
    assert.equal(health.json.authenticated, false);

    const gate = await req(svc.base, '/');
    assert.equal(gate.status, 303);
    assert.equal(gate.headers.get('location'), '/login');
  });

  it('POST login sets cookie and serves feed', async () => {
    const login = await req(svc.base, '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'TB_Nom_Utilisateur=alice&TB_Mot_de_Passe=alice&BT_Envoyer=1',
    });
    assert.equal(login.status, 303);
    assert.equal(login.headers.get('location'), '/');
    cookie = cookieFrom(login.setCookie);
    assert.match(cookie, /^dash_client_sid=/);

    const feed = await req(svc.base, '/api/feed', {
      headers: { Cookie: cookie },
    });
    assert.equal(feed.status, 200);
    assert.equal(feed.json.ok, true);
    assert.deepEqual(feed.json.themeIds, [5, 7]);
    const ids = feed.json.articles.map((a) => a.id_post);
    assert.ok(ids.includes(1));
    assert.ok(ids.includes(5));
    assert.ok(!ids.includes(9), 'theme 99 excluded');
    assert.ok(feed.json.newCount >= 1);

    const html = await req(svc.base, '/', { headers: { Cookie: cookie } });
    assert.equal(html.status, 200);
    assert.match(html.text, /Le Dash/);
    assert.match(html.text, /Article utile sur l(?:'|&#39;)IA/);
    assert.doesNotMatch(html.text, /Hors thèmes user/);
  });

  it('get_articles day panel for keyword ia', async () => {
    const r = await req(svc.base, '/get_articles', {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'keyword_id=1&date2=2026-10-20&date=20%20octobre',
    });
    assert.equal(r.status, 200);
    assert.match(r.text, /graph-day-panel/);
    assert.match(r.text, /Article utile/);
    assert.match(r.text, /10:00/);
  });

  it('timeline page + results.json', async () => {
    const page = await req(svc.base, '/timeline', { headers: { Cookie: cookie } });
    assert.equal(page.status, 200);
    assert.match(page.text, /Chronologie/);

    const results = await req(svc.base, '/results.json', {
      headers: { Cookie: cookie },
    });
    assert.equal(results.status, 200);
    assert.equal(results.json.dateTimeFormat, 'iso8601');
    assert.ok(results.json.events.length >= 2);
    assert.ok(results.json.events.every((e) => e.title && e.start));
  });

  it('disconnect clears session', async () => {
    const out = await req(svc.base, '/disconnect', { headers: { Cookie: cookie } });
    assert.equal(out.status, 303);
    const again = await req(svc.base, '/api/feed', { headers: { Cookie: cookie } });
    assert.equal(again.status, 401);
  });
});
