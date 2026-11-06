/**
 * Sauvegarde du texte de brouillon — hors cache navigateur, sans publier.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createArticleHelpers } from '../article-helpers.mjs';
import { handleCoreArticles } from './router.mjs';

function mockRes() {
  return {
    status: null,
    body: null,
  };
}

function ctxFor(pool, existing) {
  const helpers = createArticleHelpers({
    tableName: 'articles',
    canAccessDesk: (role) => role === 'editor',
    canEditAll: (role) => role === 'editor',
  });
  return {
    pool,
    sendJson(_res, status, body) {
      _res.status = status;
      _res.body = body;
    },
    readBody: async (req) => Buffer.from(req.raw || ''),
    session: { role: 'editor', uid: 7, login: 'ed', name: 'Ed' },
    actor: { id: 7 },
    ip: '127.0.0.1',
    plugins: null,
    articleHelpers: helpers,
    rowToArticle: (row) => ({
      id: row.article_id,
      title: row.title,
      body: row.body,
      draft: row.draft,
    }),
    parseJsonArray: () => [],
    canEditAll: () => true,
    canPublish: () => true,
    cleanHtml: (html) => `clean:${html}`,
    chapo: () => '',
  };
}

function poolFor(row) {
  const queries = [];
  return {
    queries,
    query: async (sql, params = []) => {
      queries.push({ sql, params });
      if (sql.startsWith('SHOW COLUMNS')) return [[{ Field: 'x' }]];
      if (sql.startsWith('SELECT')) return [[row]];
      if (sql.startsWith('UPDATE') && sql.includes('draft_body')) {
        row.draft_title = params[0];
        row.draft_body = params[1];
        row.draft_saved_at = params[2];
      }
      return [{ affectedRows: 1 }];
    },
  };
}

describe('article draft text backup', () => {
  it('stores the text without touching the published copy', async () => {
    const row = {
      article_id: 42,
      title: 'Publié',
      body: '<p>version publique</p>',
      draft: 0,
      author_user_id: 7,
      slug: 'publie',
      draft_title: null,
      draft_body: null,
      draft_saved_at: null,
    };
    const pool = poolFor(row);
    const res = mockRes();
    const handled = await handleCoreArticles(
      {
        method: 'POST',
        raw: JSON.stringify({
          title: 'Brouillon du soir',
          body: '<p>texte encore au pupitre</p>',
        }),
      },
      res,
      ['api', 'desk', 'articles', '42', 'draft-text'],
      ctxFor(pool, row)
    );
    assert.equal(handled, true);
    assert.equal(res.status, 200);
    assert.equal(res.body.draftText.title, 'Brouillon du soir');
    assert.equal(res.body.draftText.body, 'clean:<p>texte encore au pupitre</p>');
    assert.match(res.body.draftText.savedAt, /^\d{4}-\d{2}-\d{2} /);
    assert.equal(row.title, 'Publié');
    assert.equal(row.body, '<p>version publique</p>');
    assert.equal(row.draft, 0);
    const update = pool.queries.find((q) => q.sql.startsWith('UPDATE'));
    assert.match(update.sql, /draft_title = \?/);
    assert.doesNotMatch(update.sql, /\bbody=/);
  });

  it('returns the saved draft so a cleared browser cache can restore it', async () => {
    const row = {
      article_id: 42,
      title: 'Publié',
      body: '<p>version publique</p>',
      draft: 0,
      author_user_id: 7,
      slug: 'publie',
      draft_title: 'Brouillon du soir',
      draft_body: '<p>texte encore au pupitre</p>',
      draft_saved_at: '2026-11-06 14:00:00',
    };
    const pool = poolFor(row);
    const res = mockRes();
    await handleCoreArticles(
      { method: 'GET' },
      res,
      ['api', 'desk', 'articles', '42'],
      ctxFor(pool, row)
    );
    assert.equal(res.status, 200);
    assert.equal(res.body.article.body, '<p>version publique</p>');
    assert.deepEqual(res.body.draftText, {
      title: 'Brouillon du soir',
      body: '<p>texte encore au pupitre</p>',
      savedAt: '2026-11-06 14:00:00',
    });
  });

  it('refuses a backup that carries no text', async () => {
    const row = {
      article_id: 42,
      title: 'Publié',
      body: '<p>version publique</p>',
      draft: 0,
      author_user_id: 7,
    };
    const res = mockRes();
    await handleCoreArticles(
      { method: 'POST', raw: JSON.stringify({}) },
      res,
      ['api', 'desk', 'articles', '42', 'draft-text'],
      ctxFor(poolFor(row), row)
    );
    assert.equal(res.status, 400);
  });
});
