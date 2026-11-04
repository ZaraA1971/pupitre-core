/**
 * Full inbox journey against disposable MySQL.
 * Skips unless DASH_DB_MODE=mysql and connection succeeds.
 * Re-seeds fixtures at suite start (requires DASH_DB_ALLOW_SCHEMA_INIT=1).
 * Never targets production hosts (loadConfig refuses them).
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { ConfigError, loadConfig } from '../src/config.mjs';
import { createAdminDb } from '../src/db.mjs';
import { createExternals } from '../src/externals.mjs';
import { createApp } from '../src/app.mjs';
import { loadInboxPage } from '../src/inbox.mjs';
import { seedDisposableMysql } from '../src/seed-disposable-mysql.mjs';

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
  return { status: res.status, text, json };
}

describe('MySQL disposable inbox journey', { skip: !wantMysql }, () => {
  /** @type {Awaited<ReturnType<typeof createAdminDb>>} */
  let db;
  let config;
  let externals;
  let svc;
  let seedPool;
  let skipReason = '';

  before(async () => {
    try {
      config = loadConfig(process.env);
    } catch (err) {
      if (err instanceof ConfigError) {
        skipReason = err.message;
        return;
      }
      throw err;
    }
    if (config.mode !== 'mysql') {
      skipReason = 'DASH_DB_MODE is not mysql';
      return;
    }
    if (!config.allowSchemaInit) {
      skipReason =
        'DASH_DB_ALLOW_SCHEMA_INIT=1 required to re-seed disposable MySQL for this suite';
      return;
    }
    try {
      db = await createAdminDb(config);
      const mysql = await import('mysql2/promise');
      seedPool = mysql.createPool({
        host: config.dbHost,
        port: config.dbPort,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbName,
        namedPlaceholders: true,
      });
      const n = await seedDisposableMysql(seedPool);
      if (n < 1) {
        skipReason = 'seed produced zero rss_post rows';
        return;
      }
    } catch (err) {
      skipReason = String(err?.message || err);
      return;
    }
    externals = createExternals({ config });
    const app = createApp({ db, externals, config });
    svc = await listen(app);
  });

  after(async () => {
    if (svc) await svc.close();
    if (seedPool) await seedPool.end();
    if (db) await db.close();
  });

  function requireDb() {
    if (skipReason) {
      assert.fail(`MySQL disposable unavailable: ${skipReason}`);
    }
  }

  it('lists editorial inbox with counters (seed required)', async () => {
    requireDb();
    const page = await loadInboxPage(db, {});
    assert.ok(page.counts.new >= 1, 'expected seeded editorial rows');
    assert.equal(typeof page.counts.sent, 'number');
    assert.equal(typeof page.counts.deleted, 'number');
    assert.ok(page.rows.every((r) => r.source !== 'Vigie Source'));
    assert.ok(page.rows.every((r) => !/bon plan/i.test(r.title)));
  });

  it('filters by source via API', async () => {
    requireDb();
    const r = await req(svc.base, '/api/inbox?source_name=Ars%20Technica');
    assert.equal(r.status, 200);
    assert.equal(r.json.filters.source, 'Ars Technica');
    assert.ok(r.json.rows.length >= 1);
    assert.ok(r.json.rows.every((row) => row.source === 'Ars Technica'));
  });

  it('HTML inbox renders brand and counters', async () => {
    requireDb();
    const html = await req(svc.base, '/');
    assert.equal(html.status, 200);
    assert.match(html.text, /Le Dash/);
    assert.match(html.text, /data-count="new">/);
  });

  it('send then alert then delete update counters', async () => {
    requireDb();
    const before = await db.navCounts();
    const inbox = await loadInboxPage(db, {});
    const candidate = inbox.rows.find((r) => Number(r.id_theme) > 0) || inbox.rows[0];
    assert.ok(candidate, 'need at least one inbox row');

    const send = await req(svc.base, '/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        send: '1',
        id_post: [candidate.id],
        [`theme_${candidate.id}`]: String(candidate.id_theme || 5),
      }),
    });
    assert.equal(send.status, 200);
    assert.deepEqual(send.json.actions, ['send']);
    assert.equal(send.json.sendPushUsed, false);
    assert.equal(send.json.counts.new, before.new - 1);
    assert.equal(send.json.counts.sent, before.sent + 1);

    // pick another remaining inbox row for alert, or re-use none
    const afterSend = await loadInboxPage(db, {});
    const forAlert =
      afterSend.rows.find((r) => Number(r.id_theme) === 5) || afterSend.rows[0];
    if (forAlert) {
      const alert = await req(svc.base, '/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ alert: 'oui', id_post: [forAlert.id] }),
      });
      assert.equal(alert.status, 200);
      assert.ok(alert.json.actions.includes('alert'));
      // MySQL adapter stubs cross-db tokens → firebaseAttempts may be 0
      assert.equal(alert.json.sendPushUsed, false);
      assert.ok(externals.log.every((x) => x.kind !== 'apns'));
    }

    const remaining = (await loadInboxPage(db, {})).rows[0];
    if (remaining) {
      const del = await req(svc.base, '/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ delete: '1', id_post: [remaining.id] }),
      });
      assert.equal(del.status, 200);
      assert.ok(del.json.actions.includes('delete'));
    }
  });

  it('delete_all clears remaining new rows', async () => {
    requireDb();
    const r = await req(svc.base, '/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ delete_all: '1' }),
    });
    assert.equal(r.status, 200);
    assert.ok(r.json.actions.includes('delete_all'));
    assert.equal((await db.navCounts()).new, 0);
  });

  it('to_desk uses local injectables on disposable MySQL', async () => {
    requireDb();
    // Prefer a still-new editorial row if any; else use id 1 after prior sends.
    const model = await loadInboxPage(db, {});
    const id = model.rows[0]?.id ?? 1;
    const r = await req(svc.base, '/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to_desk: '1', id_post: [id] }),
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.success, true);
    assert.equal(r.json.local, true);
    assert.ok(r.json.created[0].article_id >= 900000);
    assert.equal(Number((await db.getPost(id)).breve_spip), 1);
  });
});
