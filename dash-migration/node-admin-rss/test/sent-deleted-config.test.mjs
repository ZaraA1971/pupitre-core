import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { loadConfig, assertRefreshMysqlWritesAllowed } from '../src/config.mjs';
import { createAdminDb } from '../src/db.mjs';
import { createExternals } from '../src/externals.mjs';
import { createApp } from '../src/app.mjs';
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

async function req(base, path) {
  const res = await fetch(`${base}${path}`);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, text, json };
}

describe('sent / deleted / config fixtures', () => {
  let svc;
  let db;

  before(async () => {
    const config = loadConfig({
      DASH_DB_MODE: 'fixtures',
      DASH_DISABLE_EXTERNAL: '1',
    });
    db = await createAdminDb(config);
    const externals = createExternals({ config });
    svc = await listen(createApp({ db, externals, config }));
  });

  after(async () => {
    await svc.close();
    await db.close();
  });

  it('GET /api/sent lists sent rows', async () => {
    const r = await req(svc.base, '/api/sent');
    assert.equal(r.status, 200);
    assert.equal(r.json.kind, 'sent');
    assert.ok(r.json.rows.some((x) => Number(x.id) === 6 || /déjà envoyé/i.test(x.title)));
    assert.ok(r.json.counts.sent >= 1);
  });

  it('GET /api/deleted lists deleted rows', async () => {
    const r = await req(svc.base, '/api/deleted');
    assert.equal(r.status, 200);
    assert.equal(r.json.kind, 'deleted');
    assert.ok(r.json.rows.some((x) => Number(x.id) === 7));
    assert.equal(r.json.counts.deleted, 1);
  });

  it('GET /api/config returns read-only catalogs', async () => {
    const r = await req(svc.base, '/api/config');
    assert.equal(r.status, 200);
    assert.ok(r.json.themes.some((t) => Number(t.id) === 5));
    assert.ok(r.json.keywords.some((k) => k.name_keyword === 'ia'));
    assert.ok(r.json.authors.some((a) => a.name === 'Alice'));
    assert.ok(r.json.authors.some((a) => a.name === 'Bob'));
  });

  it('HTML pages render', async () => {
    for (const path of ['/sent', '/deleted', '/config']) {
      const r = await req(svc.base, path);
      assert.equal(r.status, 200);
      assert.match(r.text, /Le Dash/);
    }
  });
});

describe('sent / deleted / config MySQL disposable', { skip: !wantMysql }, () => {
  let svc;
  let db;
  let seedPool;
  let skipReason = '';

  before(async () => {
    let config;
    try {
      config = loadConfig(process.env);
      assertRefreshMysqlWritesAllowed(config);
    } catch (err) {
      skipReason = String(err?.message || err);
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
        dateStrings: true,
      });
      await seedDisposableMysql(seedPool);
      const externals = createExternals({ config });
      svc = await listen(createApp({ db, externals, config }));
    } catch (err) {
      skipReason = String(err?.message || err);
    }
  });

  after(async () => {
    if (svc) await svc.close();
    if (db) await db.close();
    if (seedPool) await seedPool.end();
  });

  function requireDb() {
    if (skipReason) assert.fail(`MySQL disposable unavailable: ${skipReason}`);
  }

  it('lists sent, deleted and config catalogs', async () => {
    requireDb();
    const sent = await req(svc.base, '/api/sent');
    assert.equal(sent.status, 200);
    assert.ok(sent.json.rows.some((x) => Number(x.id) === 6));
    const deleted = await req(svc.base, '/api/deleted');
    assert.equal(deleted.status, 200);
    assert.ok(deleted.json.rows.some((x) => Number(x.id) === 7));
    assert.equal(deleted.json.counts.deleted, 1);
    const configApi = await req(svc.base, '/api/config');
    assert.equal(configApi.status, 200);
    assert.ok(configApi.json.authors.some((a) => a.name === 'Bob'));
  });
});
