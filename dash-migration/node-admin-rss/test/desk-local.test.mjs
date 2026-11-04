import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildDeskIngestPayload,
  parseDeskIngestResponse,
  slugifyDeskTitle,
} from '../src/desk-client.mjs';
import {
  extractArticleText,
  isBlockedOrJunkText,
  resolveArticleText,
  FETCH_MIN_CHARS,
} from '../src/article-extract.mjs';
import { createLocalDeskInjectables, localFixtureLlm } from '../src/local-desk.mjs';
import { createExternals } from '../src/externals.mjs';
import { loadConfig } from '../src/config.mjs';
import { createFakeAdminDb } from '../src/fake-db.mjs';
import { handleSendToDesk } from '../src/send-to-desk.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES = path.join(HERE, '..', 'fixtures', 'articles');

describe('desk-client payload/parse', () => {
  it('builds PHP-shaped ingest payload', () => {
    const p = buildDeskIngestPayload({
      title: 'Titre',
      body: 'Corps<br/>x',
      slug: 'titre',
      source_url: 'https://example.test/a',
      access: 'granted',
    });
    assert.equal(p.draft, true);
    assert.equal(p.lang, 'fr');
    assert.equal(p.access, 'granted');
    assert.equal(p.author, 'Emmanuel Torregano');
    assert.equal(p.author_user_id, 1);
    assert.equal(p.slug, 'titre');
    assert.equal(p.source_url, 'https://example.test/a');
  });

  it('defaults access to subscribers', () => {
    const p = buildDeskIngestPayload({ title: 'T', body: 'B' });
    assert.equal(p.access, 'subscribers');
    assert.equal('slug' in p, false);
  });

  it('parses nested article.data.article_id', () => {
    const out = parseDeskIngestResponse({
      article: { data: { article_id: 42, slug: 'ok' } },
    });
    assert.deepEqual(out, { article_id: 42, slug: 'ok' });
  });

  it('parses wp_id fallback', () => {
    const out = parseDeskIngestResponse({
      article: { wp_id: 7, slug: 'w' },
    });
    assert.equal(out.article_id, 7);
  });

  it('rejects missing article_id', () => {
    assert.throws(() => parseDeskIngestResponse({ article: { data: {} } }), /article_id/);
  });

  it('slugifies titles with accents', () => {
    assert.equal(slugifyDeskTitle('Décision à Bruxelles'), 'decision-a-bruxelles');
  });
});

describe('article-extract offline', () => {
  it('extracts JSON-LD articleBody from fixture', async () => {
    const html = await readFile(path.join(ARTICLES, 'example-a.html'), 'utf8');
    const text = extractArticleText(html, 'https://example.test/a');
    assert.ok(text);
    assert.ok([...text].length >= FETCH_MIN_CHARS);
    assert.match(text, /intelligence artificielle/i);
  });

  it('extracts entry-content paragraphs', async () => {
    const html = await readFile(path.join(ARTICLES, 'example-d.html'), 'utf8');
    const text = extractArticleText(html, 'https://example.test/d');
    assert.ok(text);
    assert.match(text, /technology policy/i);
  });

  it('rejects junk / cloudflare pages', async () => {
    const html = await readFile(path.join(ARTICLES, 'junk-cloudflare.html'), 'utf8');
    assert.equal(isBlockedOrJunkText(extractArticleText(html) || ''), true);
    const resolved = resolveArticleText(
      'https://example.test/blocked',
      'Indice RSS assez long pour servir de repli lorsque la page HTML est du junk anti-bot Cloudflare.',
      html
    );
    assert.match(resolved, /Indice RSS/);
  });

  it('local fetchArticle reads fixture map without network', async () => {
    const { fetchArticle } = createLocalDeskInjectables({ articlesDir: ARTICLES });
    const text = await fetchArticle(
      'https://example.test/a',
      'hint court'
    );
    assert.ok(text);
    assert.ok([...text].length >= FETCH_MIN_CHARS);
  });

  it('localFixtureLlm returns FR title then summary', async () => {
    const source =
      'Premier paragraphe assez long sur une décision européenne relative à la régulation des modèles.\nDeuxième phrase utile.';
    const title = await localFixtureLlm(
      'SOURCE\nTâche : produire UN titre journalistique EN FRANÇAIS uniquement.\n\n' + source
    );
    assert.ok(title.length > 10);
    const resume = await localFixtureLlm(
      'SOURCE\nTâche : rédiger un résumé journalistique ENTIÈREMENT EN FRANÇAIS.\n\n' +
        source
    );
    assert.match(resume, /banc local|français|européenne/i);
  });
});

describe('createDeskDraft records full payload under disableExternal', () => {
  it('stores buildDeskIngestPayload in log', async () => {
    const config = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    const externals = createExternals({ config });
    const created = await externals.createDeskDraft({
      title: 'Hello World',
      body: 'x',
      slug: 'hello-world',
      source_url: 'https://example.test/a',
      access: 'subscribers',
    });
    assert.ok(created.article_id >= 900000);
    assert.equal(created.slug, 'hello-world');
    const desk = externals.log.find((x) => x.kind === 'desk');
    assert.equal(desk.payload.payload.draft, true);
    assert.equal(desk.payload.payload.access, 'subscribers');
    assert.equal(desk.payload.payload.source_url, 'https://example.test/a');
  });

  it('can parse fake deskFetch raw response even when external off', async () => {
    const config = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    const externals = createExternals({
      config,
      async deskFetch() {
        return {
          status: 201,
          raw: { article: { data: { article_id: 55, slug: 'from-fake' } } },
        };
      },
    });
    const created = await externals.createDeskDraft({
      title: 'T',
      body: 'B',
    });
    assert.equal(created.article_id, 55);
    assert.equal(created.slug, 'from-fake');
  });
});

describe('handleSendToDesk hardening', () => {
  it('errors on missing post and empty fetch; partial multi-id success', async () => {
    const db = createFakeAdminDb({
      rss_url: [{ name: 'Le Monde', audience: 'editorial' }],
      theme: [],
      keyword: [],
      post_keyword: [],
      rss_post: [
        {
          id: 1,
          title: 'A',
          text: 'Corps',
          source: 'Le Monde',
          link: 'https://example.test/a',
          author: '',
          date: '2026-10-20 10:00:00',
          hash: 'h1',
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
          title: 'B',
          text: '',
          source: 'Le Monde',
          link: 'https://example.test/missing',
          author: '',
          date: '2026-10-20 11:00:00',
          hash: 'h2',
          bin: 0,
          new: 1,
          sent: 0,
          deleted: 0,
          alert: 0,
          id_theme: 0,
          breve_spip: 0,
        },
      ],
    });
    const config = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    const externals = createExternals({ config });
    const out = await handleSendToDesk(
      { to_desk: '1', id_post: ['99', '2', '1'] },
      {
        db,
        externals,
        async fetchArticle(url) {
          if (url.includes('missing')) return null;
          return 'Texte source suffisamment long pour un envoi Desk de test local sans réseau externe.';
        },
        async llm(prompt) {
          if (/titre journalistique/i.test(prompt)) return 'Titre FR de test';
          return 'Résumé FR de test.\nSuite.';
        },
      }
    );
    assert.equal(out.status, 200);
    assert.equal(out.json.success, true);
    assert.deepEqual(out.json.processed, [1]);
    assert.ok(out.json.errors.some((e) => e.id === 99));
    assert.ok(out.json.errors.some((e) => e.id === 2 && /texte source/i.test(e.error)));
  });

  it('uses resolveRssHint when post.text empty', async () => {
    const db = createFakeAdminDb({
      rss_url: [{ name: 'Le Monde', audience: 'editorial' }],
      theme: [],
      keyword: [],
      post_keyword: [],
      rss_post: [
        {
          id: 8,
          title: 'Sans texte',
          text: '',
          source: 'Le Monde',
          link: 'https://example.test/empty-text',
          author: '',
          date: '2026-10-20 10:00:00',
          hash: 'h8',
          bin: 0,
          new: 1,
          sent: 0,
          deleted: 0,
          alert: 0,
          id_theme: 0,
          breve_spip: 0,
        },
      ],
    });
    const config = loadConfig({ DASH_DISABLE_EXTERNAL: '1' });
    const externals = createExternals({ config });
    let hinted = false;
    const out = await handleSendToDesk(
      { to_desk: '1', id_post: [8] },
      {
        db,
        externals,
        async resolveRssHint() {
          hinted = true;
          return 'Repli RSS local assez long pour permettre extraction et génération FR sur le banc.';
        },
        async fetchArticle(_url, rssHint) {
          return rssHint;
        },
        async llm(prompt) {
          if (/titre journalistique/i.test(prompt)) return 'Titre depuis hint';
          return 'Résumé depuis hint RSS.';
        },
      }
    );
    assert.equal(hinted, true);
    assert.equal(out.json.success, true);
    assert.deepEqual(out.json.processed, [8]);
  });
});
