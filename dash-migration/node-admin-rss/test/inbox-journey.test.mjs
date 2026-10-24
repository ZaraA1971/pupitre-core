import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { loadConfig, ConfigError } from '../src/config.mjs';
import { createAdminDb, loadFixtureSeed } from '../src/db.mjs';
import { createExternals } from '../src/externals.mjs';
import { createApp } from '../src/app.mjs';
import { loadInboxPage, parseInboxQuery } from '../src/inbox.mjs';
import { createFakeAdminDb } from '../src/fake-db.mjs';

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
        server,
        base: `http://127.0.0.1:${port}`,
        async close() {
          await new Promise((r) => server.close(r));
        },
      });
    });
  });
}

async function req(base, path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body,
    redirect: 'manual',
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, headers: res.headers, text, json };
}

describe('config fail-safe', () => {
  it('defaults to fixtures with externals disabled', () => {
    const c = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    assert.equal(c.mode, 'fixtures');
    assert.equal(c.disableExternal, true);
  });

  it('stops explicitly when mysql config incomplete', () => {
    assert.throws(
      () =>
        loadConfig({
          DASH_DB_MODE: 'mysql',
          DASH_DISABLE_EXTERNAL: '1',
          DASH_DB_HOST: '',
          DASH_DB_USER: 'x',
          DASH_DB_NAME: 'y',
        }),
      (e) => e instanceof ConfigError && /incomplet/i.test(e.message)
    );
  });

  it('refuses known production host markers', () => {
    assert.throws(
      () =>
        loadConfig({
          DASH_DB_MODE: 'mysql',
          DASH_DISABLE_EXTERNAL: '1',
          DASH_DB_HOST: '163.172.185.4',
          DASH_DB_USER: 'u',
          DASH_DB_NAME: 'dash',
        }),
      (e) => e instanceof ConfigError && /refusé/i.test(e.message)
    );
  });

  it('refuses enabling externals on this bench', () => {
    assert.throws(
      () => loadConfig({ DASH_DISABLE_EXTERNAL: '0' }),
      (e) => e instanceof ConfigError
    );
  });
});

describe('fixtures inbox filters & counts', () => {
  it('lists editorial inbox excluding promo and vigie', async () => {
    const db = createFakeAdminDb(loadFixtureSeed());
    const page = await loadInboxPage(db, {});
    assert.deepEqual(
      page.rows.map((r) => r.id).sort((a, b) => a - b),
      [1, 4, 5]
    );
    assert.equal(page.counts.new, 3);
    assert.equal(page.counts.sent, 1);
    assert.equal(page.counts.deleted, 0);
  });

  it('filters by source and keyword', async () => {
    const db = createFakeAdminDb(loadFixtureSeed());
    const bySource = await loadInboxPage(db, { source_name: 'Ars Technica' });
    assert.deepEqual(
      bySource.rows.map((r) => r.id).sort((a, b) => a - b),
      [4, 5]
    );
    const byKw = await loadInboxPage(db, { keyword_id: '2' });
    assert.ok(byKw.rows.every((r) => r.keywords.some((k) => Number(k.id_keyword) === 2)));
    assert.ok(byKw.rows.map((r) => r.id).includes(1));
  });

  it('sorts by pertinence (keyword count)', async () => {
    const db = createFakeAdminDb(loadFixtureSeed());
    const page = await loadInboxPage(db, { tri: 'pertinence' });
    const ids = page.rows.map((r) => r.id);
    // h5 has 2 keywords, h1 has 2, h4 has 1 — date breaks ties
    assert.ok(ids.indexOf(5) < ids.indexOf(4));
  });

  it('parseInboxQuery normalizes % source', () => {
    assert.equal(parseInboxQuery({ source_name: '%' }).source, null);
    assert.equal(parseInboxQuery({ source_name: 'Le Monde' }).source, 'Le Monde');
  });
});

describe('HTTP inbox journey (fixtures)', () => {
  /** @type {{ close: Function, base: string }} */
  let svc;
  let db;
  let externals;

  before(async () => {
    const config = loadConfig({
      DASH_DB_MODE: 'fixtures',
      DASH_DISABLE_EXTERNAL: '1',
      DASH_FIREBASE_PUSH_AUTH: 'Bearer fixture-not-real',
      DASH_SERVER_NAME: 'localhost',
    });
    db = await createAdminDb(config);
    externals = createExternals({ config });
    const app = createApp({ db, externals, config });
    svc = await listen(app);
  });

  after(async () => {
    await svc.close();
    await db.close();
  });

  it('GET /health and HTML inbox', async () => {
    const health = await req(svc.base, '/health');
    assert.equal(health.status, 200);
    assert.equal(health.json.mode, 'fixtures');
    assert.equal(health.json.disableExternal, true);

    const html = await req(svc.base, '/');
    assert.equal(html.status, 200);
    assert.match(html.text, /Le Dash/);
    assert.match(html.text, /Article utile sur l(?:'|&#39;)IA/);
    assert.match(html.text, /data-count="new">3</);
    assert.doesNotMatch(html.text, /Bon plan smartphone/);
    assert.doesNotMatch(html.text, /Info Vigie/);
  });

  it('GET /api/inbox returns JSON model', async () => {
    const r = await req(svc.base, '/api/inbox?source_name=Ars%20Technica');
    assert.equal(r.status, 200);
    assert.equal(r.json.filters.source, 'Ars Technica');
    assert.equal(r.json.rows.length, 2);
  });

  it('POST send then counters update', async () => {
    const before = await db.navCounts();
    const r = await req(svc.base, '/actions?format=json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ send: '1', id_post: [1], theme_1: '5' }),
    });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.actions, ['send']);
    assert.equal(r.json.sendPushUsed, false);
    const after = r.json.counts;
    assert.equal(after.new, before.new - 1);
    assert.equal(after.sent, before.sent + 1);
    const post = await db.getPost(1);
    assert.equal(Number(post.sent), 1);
    assert.equal(Number(post.id_theme), 5);
  });

  it('POST alert records mail/firebase without outbound', async () => {
    const beforeLog = externals.log.length;
    const r = await req(svc.base, '/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ alert: 'oui', id_post: [4] }),
    });
    assert.equal(r.status, 200);
    assert.ok(r.json.actions.includes('alert'));
    assert.ok(r.json.mailAttempts >= 1);
    assert.ok(r.json.firebaseAttempts >= 1);
    const added = externals.log.slice(beforeLog);
    assert.ok(added.some((x) => x.kind === 'mail'));
    assert.ok(added.some((x) => x.kind === 'firebase'));
    assert.equal(Number((await db.getPost(4)).alert), 1);
  });

  it('POST delete marks deleted', async () => {
    const r = await req(svc.base, '/actions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: 'delete=1&id_post[]=5',
    });
    assert.equal(r.status, 200);
    assert.ok(r.json.actions.includes('delete'));
    assert.equal(Number((await db.getPost(5)).deleted), 1);
  });

  it('POST delete_all clears remaining new inbox', async () => {
    // re-seed a fresh row via mutating remaining — create new fixture db state:
    // after previous tests, inbox may be empty; insert a synthetic new post
    db.state.rss_post.push({
      id: 99,
      title: 'Reste à vider',
      text: 'x',
      source: 'Le Monde',
      link: 'https://example.test/z',
      author: '',
      date: '2026-10-21 10:00:00',
      hash: 'h99',
      bin: 0,
      new: 1,
      sent: 0,
      deleted: 0,
      alert: 0,
      id_theme: 0,
      breve_spip: 0,
    });
    const r = await req(svc.base, '/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ delete_all: '1' }),
    });
    assert.equal(r.status, 200);
    assert.ok(r.json.actions.includes('delete_all'));
    assert.equal(Number((await db.getPost(99)).bin), 1);
    assert.equal(Number((await db.getPost(99)).deleted), 1);
    assert.equal((await db.navCounts()).new, 0);
  });

  it('POST to_desk stays disabled with explicit missing deps', async () => {
    const r = await req(svc.base, '/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to_desk: '1', id_post: [1] }),
    });
    assert.equal(r.status, 503);
    assert.equal(r.json.disabled, true);
    assert.ok(Array.isArray(r.json.missing));
    assert.ok(r.json.missing.includes('DASH_OPENAI_API_KEY'));
  });
});

describe('MySQL adapter module loads without connecting', () => {
  it('exports createMysqlAdminDb', async () => {
    const mod = await import('../src/mysql-db.mjs');
    assert.equal(typeof mod.createMysqlAdminDb, 'function');
  });
});
