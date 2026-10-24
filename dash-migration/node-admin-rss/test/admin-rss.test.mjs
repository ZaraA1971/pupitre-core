import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createFakeAdminDb } from '../src/fake-db.mjs';
import { createExternals } from '../src/externals.mjs';
import { loadConfig } from '../src/config.mjs';
import { handleIndexActions } from '../src/actions.mjs';
import { handleSendToDesk } from '../src/send-to-desk.mjs';
import {
  isEditorialInboxRow,
  postIdsFromRequest,
  rssEditorialInboxSql,
  rssInboxSql,
} from '../src/filters.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const phpIndexActions = path.resolve(
  here,
  '../../reference/admin-rss/admin/index_actions.php'
);

function seed() {
  return createFakeAdminDb({
    rss_url: [
      { name: 'Le Monde', audience: 'editorial' },
      { name: 'Vigie Source', audience: 'vigie' },
    ],
    rss_post: [
      {
        id: 1,
        title: 'Article utile',
        text: 'Corps',
        source: 'Le Monde',
        link: 'https://example.test/a',
        author: 'Alice',
        date: '2026-10-20 10:00:00',
        bin: 0,
        new: 1,
        sent: 0,
        deleted: 0,
        alert: 0,
        id_theme: 0,
        breve_spip: 0,
      },
      {
        id: 2,
        title: 'Bon plan smartphone',
        text: 'code promo XYZ',
        source: 'Le Monde',
        link: 'https://example.test/b',
        author: '',
        date: '2026-10-20 11:00:00',
        bin: 0,
        new: 1,
        sent: 0,
        deleted: 0,
        alert: 0,
        id_theme: 0,
        breve_spip: 0,
      },
      {
        id: 3,
        title: 'Info Vigie',
        text: 'x',
        source: 'Vigie Source',
        link: 'https://example.test/c',
        author: '',
        date: '2026-10-20 12:00:00',
        bin: 0,
        new: 1,
        sent: 0,
        deleted: 0,
        alert: 0,
        id_theme: 0,
        breve_spip: 0,
      },
      {
        id: 4,
        title: 'Déjà thème',
        text: 'y',
        source: 'Le Monde',
        link: 'https://example.test/d',
        author: 'Alice',
        date: '2026-10-19 09:00:00',
        bin: 0,
        new: 1,
        sent: 0,
        deleted: 0,
        alert: 0,
        id_theme: 5,
        breve_spip: 0,
      },
    ],
    users: [
      {
        id: 10,
        mail: 'u@example.test',
        dash: 'demo',
        themes: '5',
        active: 1,
        notif: 1,
      },
    ],
    authors: [{ id: 1, name: 'Alice' }],
    authors_posts: [],
    dash_keys: [{ dash_id: 'demo', expired: 0 }],
    sectionDbs: {
      dash_demo: {
        config: [{ id_config: 1, id_theme: 5 }],
        push_devices: [{ token: 'tok-1', alert: 1 }],
      },
    },
  });
}

describe('PHP sendPush include is dead code', () => {
  it('index_actions.php requires send__push_ but never calls sendPush(', () => {
    const src = readFileSync(phpIndexActions, 'utf8');
    assert.match(src, /send__push_\.php/);
    assert.equal(/\bsendPush\s*\(/.test(src), false);
  });
});

describe('filters parity', () => {
  it('matches PHP inbox SQL fragments', () => {
    assert.equal(
      rssInboxSql(),
      'bin = 0 AND new = 1 AND sent = 0 AND deleted = 0'
    );
    assert.match(rssEditorialInboxSql('r'), /audience = 'vigie'/);
  });

  it('editorial inbox predicate excludes vigie and promo', () => {
    const db = seed();
    const vigie = new Set(['Vigie Source']);
    const kept = db.state.rss_post.filter((r) => isEditorialInboxRow(r, vigie));
    assert.deepEqual(
      kept.map((r) => r.id).sort(),
      [1, 4]
    );
  });

  it('postIdsFromRequest mirrors PHP', () => {
    assert.deepEqual(postIdsFromRequest({ id_post: ['1', '0', '2', 'x'] }), [
      1, 2,
    ]);
    assert.deepEqual(postIdsFromRequest({}), []);
  });
});

describe('index actions', () => {
  it('send marks posts and optional theme', async () => {
    const db = seed();
    const config = loadConfig({
      DASH_DISABLE_EXTERNAL: '1',
      DASH_FIREBASE_PUSH_AUTH: '',
    });
    const externals = createExternals({ config });
    const r = await handleIndexActions(
      { send: '1', id_post: ['1'], theme_1: '7' },
      { db, externals, config }
    );
    assert.deepEqual(r.actions, ['send']);
    assert.equal(r.sendPushUsed, false);
    const p = await db.getPost(1);
    assert.equal(Number(p.sent), 1);
    assert.equal(Number(p.new), 0);
    assert.equal(Number(p.id_theme), 7);
    assert.equal(externals.log.filter((x) => x.kind === 'mail').length, 0);
  });

  it('delete and delete_all', async () => {
    const db = seed();
    const config = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    const externals = createExternals({ config });
    await handleIndexActions({ delete: '1', id_post: ['1'] }, { db, externals, config });
    assert.equal(Number((await db.getPost(1)).deleted), 1);
    await handleIndexActions({ delete_all: '1' }, { db, externals, config });
    // remaining new editorial rows become bin/deleted
    assert.equal(Number((await db.getPost(4)).bin), 1);
    assert.equal(Number((await db.getPost(4)).deleted), 1);
  });

  it('alert oui updates row, mails and firebase are recorded not sent', async () => {
    const db = seed();
    const config = loadConfig({
      DASH_DISABLE_EXTERNAL: '1',
      DASH_FIREBASE_PUSH_AUTH: 'Bearer test-not-real',
      DASH_SERVER_NAME: 'dash.example.test',
    });
    const externals = createExternals({ config });
    const r = await handleIndexActions(
      { alert: 'oui', id_post: ['4'] },
      { db, externals, config }
    );
    assert.ok(r.actions.includes('alert'));
    assert.equal(r.sendPushUsed, false);
    const p = await db.getPost(4);
    assert.equal(Number(p.alert), 1);
    assert.equal(Number(p.sent), 1);
    assert.ok(r.mailAttempts >= 1);
    assert.ok(r.firebaseAttempts >= 1);
    assert.ok(externals.log.some((x) => x.kind === 'mail' && x.payload.to === 'u@example.test'));
    assert.ok(externals.log.some((x) => x.kind === 'firebase' && x.payload.skipped !== false));
    // skipped flag on firebase return
    const fb = externals.log.find((x) => x.kind === 'firebase');
    assert.ok(fb);
  });

  it('never invokes sendPush', async () => {
    const db = seed();
    const config = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    const externals = createExternals({ config });
    const r = await handleIndexActions(
      { send: '1', id_post: ['1'] },
      { db, externals, config }
    );
    assert.equal(r.sendPushUsed, false);
    assert.equal(
      externals.log.some((x) => x.kind === 'apns' || x.kind === 'sendPush'),
      false
    );
  });
});

describe('send_to_desk', () => {
  it('creates desk draft via injectable llm/fetch without real HTTP', async () => {
    const db = seed();
    const config = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    const externals = createExternals({ config });
    let llmCalls = 0;
    const out = await handleSendToDesk(
      { to_desk: '1', id_post: ['1'] },
      {
        db,
        externals,
        async fetchArticle() {
          return 'Long source text about a policy decision in Brussels.';
        },
        async llm(prompt) {
          llmCalls += 1;
          if (prompt.includes('titre') || prompt.includes('Tâche : produire UN titre')) {
            return 'Décision politique à Bruxelles';
          }
          return 'Un paragraphe de résumé en français.\nSecond paragraphe.';
        },
      }
    );
    assert.equal(out.status, 200);
    assert.equal(out.json.success, true);
    assert.deepEqual(out.json.processed, [1]);
    assert.equal(out.json.created[0].rss_id, 1);
    assert.ok(out.json.created[0].article_id >= 900000);
    assert.equal(llmCalls, 2);
    const p = await db.getPost(1);
    assert.equal(Number(p.breve_spip), 1);
    assert.equal(Number(p.sent), 1);
    assert.ok(externals.log.some((x) => x.kind === 'desk'));
  });

  it('returns LLM error without falling back to English source', async () => {
    const db = seed();
    const config = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    const externals = createExternals({ config });
    const out = await handleSendToDesk(
      { to_desk: '1', id_post: ['1'] },
      {
        db,
        externals,
        async fetchArticle() {
          return 'English only source';
        },
        async llm() {
          throw new Error('LLM disabled');
        },
      }
    );
    assert.equal(out.json.success, false);
    assert.equal(out.json.errors[0].error, 'Génération FR impossible (LLM). Réessayez.');
    assert.equal(Number((await db.getPost(1)).breve_spip || 0), 0);
  });
});

describe('nav counts', () => {
  it('counts editorial new / sent / deleted', async () => {
    const db = seed();
    const c = await db.navCounts();
    assert.equal(c.new, 2);
    assert.equal(c.sent, 0);
    assert.equal(c.deleted, 0);
  });
});
