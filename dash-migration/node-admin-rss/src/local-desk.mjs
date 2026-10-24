import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveArticleText } from './article-extract.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ARTICLES_DIR = path.join(HERE, '..', 'fixtures', 'articles');

/**
 * Map known fixture seed URLs → local HTML files (no network).
 * Additional files can be named by host+path slug.
 */
const URL_TO_FIXTURE = {
  'https://example.test/a': 'example-a.html',
  'https://example.test/d': 'example-d.html',
  'https://example.test/e': 'example-e.html',
};

/**
 * Deterministic local LLM stand-in for Desk FR title/summary.
 * Never calls OpenAI.
 * @param {string} prompt
 */
export async function localFixtureLlm(prompt) {
  const p = String(prompt || '');
  const sourceIdx = p.indexOf('\n\n');
  const source = sourceIdx >= 0 ? p.slice(sourceIdx + 2).trim() : p;
  const firstLine =
    source
      .split(/\n+/)
      .map((l) => l.trim())
      .find((l) => l.length > 20) || source.slice(0, 120);

  if (/Tâche\s*:\s*produire UN titre/i.test(p) || /\btitre journalistique\b/i.test(p)) {
    const title = firstLine
      .replace(/^["«]|["»]$/g, '')
      .slice(0, 110)
      .trim();
    return title || 'Titre local généré';
  }

  const sentences = source
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, 4);
  const body =
    sentences.join(' ') ||
    'Résumé local généré à partir de la source fixture, entièrement en français.';
  return `${body}\n\nCe résumé de banc local ne quitte pas la machine.`;
}

/**
 * @param {string} articlesDir
 * @param {string} url
 */
async function loadFixtureHtml(articlesDir, url) {
  const mapped = URL_TO_FIXTURE[url];
  const candidates = [];
  if (mapped) candidates.push(path.join(articlesDir, mapped));
  try {
    const u = new URL(url);
    const slug = `${u.hostname}${u.pathname}`.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (slug) candidates.push(path.join(articlesDir, `${slug}.html`));
  } catch {
    /* ignore */
  }
  for (const file of candidates) {
    try {
      await access(file);
      return await readFile(file, 'utf8');
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * Local injectables for send_to_desk under DASH_DISABLE_EXTERNAL=1.
 * @param {{ articlesDir?: string }} [opts]
 */
export function createLocalDeskInjectables(opts = {}) {
  const articlesDir = opts.articlesDir || DEFAULT_ARTICLES_DIR;

  async function fetchArticle(url, rssHint) {
    const html = await loadFixtureHtml(articlesDir, String(url || ''));
    return resolveArticleText(url, rssHint, html);
  }

  return {
    fetchArticle,
    llm: localFixtureLlm,
    articlesDir,
  };
}
