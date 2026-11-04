import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { loadConfig } from '../src/config.mjs';
import { createFakeClientDb, loadFixtureSeed } from '../src/fake-db.mjs';
import { createSessionStore } from '../src/session.mjs';
import { createSendPush } from '../src/send-push.mjs';
import { createApp } from '../src/app.mjs';

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

describe('notifications unread UI (fixtures)', () => {
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
    const push = createSendPush({
      config,
      listDevices: (id) => db.listDevices(id),
    });
    svc = await listen(createApp({ db, sessions, config, push, mailLog: [] }));
    const login = await req(svc.base, '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'TB_Nom_Utilisateur=alice&TB_Mot_de_Passe=alice&BT_Envoyer=1',
    });
    cookie = cookieFrom(login.setCookie);
  });

  after(async () => {
    await svc.close();
    await db.close();
  });

  it('GET /api/unread counts messages to me with has_been_read=0', async () => {
    const r = await req(svc.base, '/api/unread', { headers: { Cookie: cookie } });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
    assert.equal(r.json.count, 1);
  });

  it('GET /notifications lists unread and shows badge', async () => {
    const r = await req(svc.base, '/notifications', { headers: { Cookie: cookie } });
    assert.equal(r.status, 200);
    assert.match(r.text, /Centre de notifications/);
    assert.match(r.text, /Salut Alice/);
    assert.match(r.text, /carol/i);
    assert.match(r.text, /Badge = 1/);
  });

  it('opening message via id_message marks read and clears unread', async () => {
    const open = await req(svc.base, '/messages?user=3&id_message=1', {
      headers: { Cookie: cookie },
    });
    assert.equal(open.status, 200);
    const unread = await req(svc.base, '/api/unread', { headers: { Cookie: cookie } });
    assert.equal(unread.json.count, 0);
    const page = await req(svc.base, '/notifications', { headers: { Cookie: cookie } });
    assert.match(page.text, /Aucune notification|Badge = 0/);
  });

  it('requires auth for /api/unread', async () => {
    const r = await req(svc.base, '/api/unread');
    assert.equal(r.status, 401);
  });
});
