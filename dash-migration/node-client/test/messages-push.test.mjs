import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { loadConfig } from '../src/config.mjs';
import { createFakeClientDb, loadFixtureSeed } from '../src/fake-db.mjs';
import { createSessionStore } from '../src/session.mjs';
import { createSendPush } from '../src/send-push.mjs';
import { createApp } from '../src/app.mjs';
import { handleSendMessage } from '../src/messages.mjs';

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

describe('sendPush internal module', () => {
  it('records call and skips APNS when external disabled', async () => {
    const config = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    const devices = [
      { token: 'aabbccddeeff00112233445566778899aabbccdd', push_message: 1 },
    ];
    const push = createSendPush({
      config,
      async listDevices() {
        return devices;
      },
    });
    const out = await push.sendPush(3, 'Alice : bonjour', 'message', 1);
    assert.equal(out.skipped, true);
    assert.equal(out.deviceCount, 1);
    assert.equal(push.calls.length, 1);
    assert.equal(push.calls[0].type, 'message');
  });

  it('refuses real send without sendImpl when external would be on', async () => {
    // loadConfig forbids disableExternal=0 — simulate config object only for unit
    const push = createSendPush({
      config: { disableExternal: false },
      async listDevices() {
        return [];
      },
    });
    await assert.rejects(() => push.sendPush(1, 'x', 'message', 1), /APNS/);
  });
});

describe('handleSendMessage unit', () => {
  it('inserts message, calls sendPush, records mail skip for notify user', async () => {
    const db = createFakeClientDb(loadFixtureSeed());
    const config = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    const push = createSendPush({
      config,
      listDevices: (id) => db.listDevices(id),
    });
    const mails = [];
    const out = await handleSendMessage(
      { send_message: '1', to_user: '3', message: 'Coucou Carol' },
      { id_user: 1, login_user: 'alice' },
      {
        db,
        sendPush: push.sendPush,
        mailSend: async (p) => {
          mails.push(p);
          return { ok: true, skipped: true };
        },
        config,
        now: () => new Date('2026-10-20T12:00:00Z'),
      }
    );
    assert.equal(out.ok, true);
    assert.equal(push.calls.length, 1);
    assert.match(push.calls[0].message, /^Alice : Coucou Carol/);
    assert.equal(mails.length, 1);
    assert.equal(mails[0].to, 'carol@example.test');
    const conv = await db.listConversations(1);
    assert.ok(conv.some((c) => c.peer_id === 3));
  });
});

describe('HTTP messages journey', () => {
  let svc;
  let db;
  let push;
  let cookie = '';

  before(async () => {
    const config = loadConfig({
      DASH_DB_MODE: 'fixtures',
      DASH_DISABLE_EXTERNAL: '1',
    });
    db = createFakeClientDb(loadFixtureSeed());
    const sessions = createSessionStore({ ttlSeconds: config.sessionTtlSeconds });
    push = createSendPush({
      config,
      listDevices: (id) => db.listDevices(id),
    });
    const app = createApp({ db, sessions, config, push, mailLog: [] });
    svc = await listen(app);
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

  it('lists conversations and thread', async () => {
    const list = await req(svc.base, '/api/messages', { headers: { Cookie: cookie } });
    assert.equal(list.status, 200);
    assert.ok(list.json.conversations.some((c) => c.peer_id === 3));

    const thread = await req(svc.base, '/api/messages?user=3', {
      headers: { Cookie: cookie },
    });
    assert.equal(thread.status, 200);
    assert.ok(thread.json.thread.length >= 2);
  });

  it('POST send_message records push without APNS', async () => {
    const before = push.calls.length;
    const r = await req(svc.base, '/messages', {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        send_message: '1',
        to_user: 3,
        message: 'Ping depuis le banc local',
        sent_id_post: 1,
      }),
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
    assert.equal(r.json.push.skipped, true);
    assert.equal(push.calls.length, before + 1);
    assert.equal(push.calls.at(-1).deviceCount, 1);
  });

  it('messages_loader returns HTML chunk or 0', async () => {
    const r = await req(svc.base, '/messages_loader', {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'user=3&start=0',
    });
    assert.equal(r.status, 200);
    assert.match(r.text, /show_message|Salut Alice|Ping depuis|Oui, je regarde/);
  });

  it('health advertises internal sendPush', async () => {
    const h = await req(svc.base, '/health');
    assert.equal(h.json.sendPushInternal, true);
  });
});
