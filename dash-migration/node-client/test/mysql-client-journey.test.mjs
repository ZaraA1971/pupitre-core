/**
 * Client read journey against disposable MySQL (loopback).
 * Skips unless DASH_DB_MODE=mysql and assertClientMysqlWritesAllowed succeeds.
 * Never targets production hosts.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  ConfigError,
  loadConfig,
  assertLoopbackDisposableMysql,
  assertClientMysqlWritesAllowed,
} from '../src/config.mjs';
import { createClientDb } from '../src/db.mjs';
import { createSessionStore } from '../src/session.mjs';
import { createApp } from '../src/app.mjs';
import { createSendPush } from '../src/send-push.mjs';
import { seedClientDisposableMysql } from '../src/seed-disposable-mysql.mjs';

const wantMysql = String(process.env.DASH_DB_MODE || '').toLowerCase() === 'mysql';

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

describe('MySQL client config guards (no connection)', () => {
  it('rejects non-loopback before pool', () => {
    const c = loadConfig({
      DASH_DISABLE_EXTERNAL: '1',
      DASH_DB_MODE: 'mysql',
      DASH_DB_HOST: '10.0.0.5',
      DASH_DB_USER: 'u',
      DASH_DB_NAME: 'dash_disposable',
      DASH_DB_ALLOW_SCHEMA_INIT: '1',
    });
    assert.throws(() => assertLoopbackDisposableMysql(c), /loopback/);
  });

  it('rejects non-disposable schema name', () => {
    const c = loadConfig({
      DASH_DISABLE_EXTERNAL: '1',
      DASH_DB_MODE: 'mysql',
      DASH_DB_HOST: '127.0.0.1',
      DASH_DB_USER: 'u',
      DASH_DB_NAME: 'admin_dash',
      DASH_DB_ALLOW_SCHEMA_INIT: '1',
    });
    assert.throws(() => assertLoopbackDisposableMysql(c), /jetable/);
  });

  it('rejects writes without schema init', () => {
    const c = loadConfig({
      DASH_DISABLE_EXTERNAL: '1',
      DASH_DB_MODE: 'mysql',
      DASH_DB_HOST: '127.0.0.1',
      DASH_DB_USER: 'u',
      DASH_DB_NAME: 'dash_disposable',
    });
    assert.throws(() => assertClientMysqlWritesAllowed(c), /SCHEMA_INIT/);
  });
});

describe('MySQL disposable client journey', { skip: !wantMysql }, () => {
  let db;
  let config;
  let svc;
  let seedPool;
  let skipReason = '';
  let cookie = '';

  before(async () => {
    try {
      config = loadConfig(process.env);
      assertClientMysqlWritesAllowed(config);
    } catch (err) {
      skipReason = err instanceof ConfigError ? err.message : String(err?.message || err);
      return;
    }
    try {
      db = await createClientDb(config);
      const mysql = await import('mysql2/promise');
      seedPool = mysql.createPool({
        host: config.dbHost,
        port: config.dbPort,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbName,
        namedPlaceholders: true,
        dateStrings: true,
      });
      const n = await seedClientDisposableMysql(seedPool);
      if (n < 1) {
        skipReason = 'seed produced zero rss_post rows';
        return;
      }
    } catch (err) {
      skipReason = String(err?.message || err);
      return;
    }
    const sessions = createSessionStore({ ttlSeconds: config.sessionTtlSeconds });
    const push = createSendPush({
      config,
      listDevices: (id) => db.listDevices(id),
    });
    const app = createApp({ db, sessions, config, push, mailLog: [] });
    svc = await listen(app);
  });

  after(async () => {
    if (svc) await svc.close();
    if (db) await db.close();
    if (seedPool) await seedPool.end();
  });

  function requireDb() {
    if (skipReason) assert.fail(`MySQL disposable unavailable: ${skipReason}`);
  }

  it('login + feed filters themes on disposable MySQL', async () => {
    requireDb();
    const health = await req(svc.base, '/health');
    assert.equal(health.status, 200);
    assert.equal(health.json.mode, 'mysql');

    const login = await req(svc.base, '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'TB_Nom_Utilisateur=alice&TB_Mot_de_Passe=alice&BT_Envoyer=1',
    });
    assert.equal(login.status, 303);
    cookie = cookieFrom(login.setCookie);
    assert.match(cookie, /^dash_client_sid=/);

    const feed = await req(svc.base, '/api/feed', { headers: { Cookie: cookie } });
    assert.equal(feed.status, 200);
    assert.equal(feed.json.ok, true);
    assert.deepEqual(feed.json.themeIds, [5, 7]);
    const ids = feed.json.articles.map((a) => a.id_post);
    assert.ok(ids.includes(1));
    assert.ok(ids.includes(5));
    assert.ok(!ids.includes(9));
  });

  it('get_articles day panel', async () => {
    requireDb();
    const r = await req(svc.base, '/get_articles', {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'keyword_id=1&date2=2026-10-20',
    });
    assert.equal(r.status, 200);
    assert.match(r.text, /graph-day-panel/);
    assert.match(r.text, /Article utile/);
  });

  it('results.json timeline events', async () => {
    requireDb();
    const results = await req(svc.base, '/results.json', {
      headers: { Cookie: cookie },
    });
    assert.equal(results.status, 200);
    assert.ok(results.json.events.length >= 2);
  });

  it('send message records internal sendPush on disposable MySQL', async () => {
    requireDb();
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
        message: 'Message MySQL jetable',
      }),
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);
    assert.equal(r.json.push.skipped, true);
    assert.ok(r.json.pushCalls >= 1);
  });
});
