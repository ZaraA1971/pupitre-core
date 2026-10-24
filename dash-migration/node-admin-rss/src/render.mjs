function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function qs(params) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || v === false) continue;
    u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

const MOIS = [
  '',
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

/**
 * Local admin inbox HTML (functional parity, not a pixel clone of PHP CSS).
 */
export function renderInboxHtml(model, { flash = null, externalsNote = true } = {}) {
  const { filters, counts, themes, sources, rows, page, totalPages, totalRows, keywordName } =
    model;
  const baseParams = {
    tri: filters.tri !== 'date' ? filters.tri : null,
    keyword_id: filters.keywordId > 0 ? filters.keywordId : null,
    source_name: filters.source,
  };
  const sortLink = (mode) =>
    qs({ ...baseParams, tri: mode === 'date' ? null : mode, page: 1 });
  const pageLink = (p) => qs({ ...baseParams, page: p });

  const themeOptions = themes
    .map(
      (t) =>
        `<option value="${esc(t.id)}">${esc(t.name)}</option>`
    )
    .join('');

  const sourceOptions = sources
    .map((s) => {
      const sel = filters.source === s ? ' selected' : '';
      return `<option value="${esc(s)}"${sel}>${esc(s)}</option>`;
    })
    .join('');

  const articles = rows
    .map((r) => {
      const themeId = Number(r.id_theme || 0);
      const themeApplied = themeId > 0;
      const dateLabel = `${r.jour || ''} ${MOIS[Number(r.numero_mois)] || ''} ${r.annee_heure || ''}`.trim();
      const kws = (r.keywords || [])
        .map((k, i) => {
          const href = qs({
            ...baseParams,
            keyword_id: k.id_keyword,
            page: 1,
          });
          return `${i ? ', ' : ''}<a href="${esc(href)}" class="kw">${esc(k.name_keyword)}</a>`;
        })
        .join('');
      return `
<article class="post" data-id="${esc(r.id)}">
  <header class="post-head">
    <label class="check">
      <input type="checkbox" name="id_post[]" value="${esc(r.id)}" />
      <span class="title"><a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.title)}</a>
      — <em>${esc(r.source)}</em></span>
    </label>
  </header>
  <p class="excerpt">${esc(String(r.text || '').slice(0, 400))}</p>
  <p class="meta">${esc(dateLabel)}${r.author ? ` — ${esc(r.author)}` : ''}</p>
  <div class="controls">
    <select name="theme_${esc(r.id)}" class="theme-select${themeApplied ? ' applied' : ''}">
      <option value="empty"${!themeApplied ? ' selected' : ''} disabled>Ajouter un thème</option>
      <option value="0"${themeId === 0 && themeApplied ? ' selected' : ''}>Ne pas mettre de thème</option>
      ${themes
        .map(
          (t) =>
            `<option value="${esc(t.id)}"${themeId === Number(t.id) ? ' selected' : ''}>${esc(t.name)}</option>`
        )
        .join('')}
    </select>
    <button type="submit" name="alert" value="oui" formaction="/actions" class="alert-btn"
      onclick="this.form.querySelectorAll('input[name=&quot;id_post[]&quot;]').forEach(c=>c.checked=c.value==='${esc(r.id)}')">Alerte</button>
  </div>
  <p class="keywords">${kws || '<span class="muted">Aucun mot-clé</span>'}</p>
</article>`;
    })
    .join('\n');

  const flashHtml = flash
    ? `<div class="flash" role="status">${esc(flash)}</div>`
    : '';

  const note = externalsNote
    ? `<aside class="banner">Banc local Node — effets externes désactivés (Desk / Vigie / Firebase / OpenAI / mail / push). « Envoyer au Pupitre » reste derrière une interface désactivée sans LLM injectable.</aside>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Le Dash — inbox admin (Node local)</title>
  <style>
    :root {
      --bg: #f3efe6;
      --ink: #1c1a16;
      --line: #c9c0b0;
      --accent: #0b5f4b;
      --danger: #8b2e2e;
      --card: #fffdf8;
      --muted: #6b6458;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
      color: var(--ink);
      background:
        radial-gradient(ellipse 80% 50% at 10% -10%, #d9e8df 0%, transparent 55%),
        linear-gradient(180deg, #efe8d8 0%, var(--bg) 40%, #e7e0d2 100%);
      min-height: 100vh;
    }
    header.top {
      padding: 1.25rem 1.5rem 0.75rem;
      border-bottom: 1px solid var(--line);
      background: rgba(255,253,248,0.72);
      backdrop-filter: blur(6px);
    }
    header.top h1 {
      margin: 0;
      font-size: clamp(1.6rem, 3vw, 2.2rem);
      letter-spacing: -0.02em;
      font-weight: 700;
    }
    header.top p { margin: 0.35rem 0 0; color: var(--muted); max-width: 42rem; }
    .banner {
      margin: 0;
      padding: 0.65rem 1.5rem;
      background: #1c1a16;
      color: #f3efe6;
      font-size: 0.9rem;
    }
    .flash {
      margin: 0.75rem 1.5rem 0;
      padding: 0.65rem 0.9rem;
      border: 1px solid var(--accent);
      background: #e7f3ee;
    }
    .nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.25rem;
      padding: 0.85rem 1.5rem;
      align-items: center;
      border-bottom: 1px solid var(--line);
    }
    .counts span {
      display: inline-block;
      margin-right: 0.85rem;
      font-variant-numeric: tabular-nums;
    }
    .counts strong { color: var(--accent); }
    form.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    select, button {
      font: inherit;
      padding: 0.35rem 0.6rem;
      border: 1px solid var(--line);
      background: var(--card);
      border-radius: 2px;
    }
    button.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
    button.danger { background: var(--danger); color: #fff; border-color: var(--danger); }
    button:disabled { opacity: 0.45; cursor: not-allowed; }
    .sort { padding: 0.75rem 1.5rem; display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .sort a { color: var(--ink); text-decoration: none; border-bottom: 1px solid transparent; }
    .sort a.current { border-bottom-color: var(--accent); font-weight: 700; }
    #container { padding: 0 1.5rem 6rem; max-width: 920px; }
    .post {
      background: var(--card);
      border: 1px solid var(--line);
      margin: 0.85rem 0;
      padding: 0.9rem 1rem;
    }
    .post-head .title { font-size: 1.05rem; }
    .excerpt { color: var(--muted); line-height: 1.45; }
    .meta, .keywords { font-size: 0.9rem; color: var(--muted); }
    .kw { color: var(--accent); }
    .controls { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.5rem 0; }
    .bar {
      position: fixed; left: 0; right: 0; bottom: 0;
      display: flex; flex-wrap: wrap; gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: rgba(28,26,22,0.94);
      color: #fff;
    }
    .bar button { cursor: pointer; }
    .pager { margin: 1rem 0; display: flex; gap: 0.75rem; align-items: center; }
    .muted { color: var(--muted); }
  </style>
</head>
<body>
  <header class="top">
    <h1>Le Dash</h1>
    <p>Inbox admin locale (Node) — articles éditoriaux, filtres et actions. Hors production.</p>
  </header>
  ${note}
  ${flashHtml}
  <div class="nav">
    <div class="counts" aria-label="Compteurs">
      <span>Nouveaux <strong data-count="new">${esc(counts.new)}</strong></span>
      <span>Envoyés <strong data-count="sent">${esc(counts.sent)}</strong></span>
      <span>Supprimés <strong data-count="deleted">${esc(counts.deleted)}</strong></span>
    </div>
    <form class="filters" method="get" action="/">
      ${filters.tri !== 'date' ? `<input type="hidden" name="tri" value="${esc(filters.tri)}" />` : ''}
      ${filters.keywordId > 0 ? `<input type="hidden" name="keyword_id" value="${esc(filters.keywordId)}" />` : ''}
      <label>Source
        <select name="source_name" onchange="this.form.submit()">
          <option value="%">Tous les flux</option>
          ${sourceOptions}
        </select>
      </label>
    </form>
  </div>
  <div class="sort">
    <a href="${esc(sortLink('date'))}" class="${filters.tri === 'date' ? 'current' : ''}">Chronologique</a>
    ${
      filters.keywordId <= 0
        ? `<a href="${esc(sortLink('pertinence'))}" class="${filters.tri === 'pertinence' ? 'current' : ''}">Pertinence</a>
           <a href="${esc(sortLink('tendance'))}" class="${filters.tri === 'tendance' ? 'current' : ''}">Tendance</a>`
        : `<span>Mot-clé « ${esc(keywordName || filters.keywordId)} » · <a href="/">Tous les flux</a></span>`
    }
  </div>
  <div id="container">
    <form name="actionform" id="actionform" method="post" action="/actions">
      ${filters.source ? `<input type="hidden" name="source_name" value="${esc(filters.source)}" />` : ''}
      <p class="muted">${esc(totalRows)} article(s) — page ${esc(page)} / ${esc(totalPages)}</p>
      ${articles || '<p class="muted">Aucun article dans l’inbox éditoriale.</p>'}
      <div class="pager">
        ${page > 1 ? `<a href="${esc(pageLink(page - 1))}">← Précédent</a>` : ''}
        ${page < totalPages ? `<a href="${esc(pageLink(page + 1))}">Suivant →</a>` : ''}
      </div>
      <div class="bar" role="toolbar">
        <button type="submit" name="send" value="1" class="primary">Envoyer</button>
        <button type="submit" name="to_desk" value="1" disabled title="Désactivé localement : LLM / Desk non configurés">Envoyer au Pupitre</button>
        <button type="submit" name="delete" value="1" class="danger">Supprimer</button>
        <button type="submit" name="delete_all" value="1" class="danger"
          onclick="return confirm('Tout supprimer de l\\'inbox ?')">Tout supprimer</button>
      </div>
    </form>
  </div>
  <!-- themeOptions reserved for future bulk UI: ${themeOptions.length} -->
</body>
</html>`;
}
