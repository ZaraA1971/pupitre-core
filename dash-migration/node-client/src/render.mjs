import { formatDaySeparator } from './feed.mjs';

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderLoginHtml({ message = null } = {}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Le Dash — connexion (Node local)</title>
  <style>
    :root { --bg:#eef2ef; --ink:#1a1f1c; --accent:#0b5f4b; --card:#fff; --line:#c5d0c8; }
    body { margin:0; min-height:100vh; font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
      color:var(--ink); background:radial-gradient(ellipse 70% 45% at 80% -10%,#cfe0d6,transparent 55%),linear-gradient(180deg,#e4ebe6,var(--bg));
      display:grid; place-items:center; }
    #login { width:min(22rem,92vw); background:var(--card); border:1px solid var(--line); padding:1.5rem; }
    h1 { margin:0 0 .75rem; font-size:1.35rem; }
    .brand { font-size:1.75rem; font-weight:700; letter-spacing:-.02em; margin:0 0 1rem; }
    label { display:block; margin:.65rem 0 .25rem; font-size:.9rem; }
    input { width:100%; font:inherit; padding:.4rem .5rem; border:1px solid var(--line); }
    button { margin-top:1rem; font:inherit; padding:.45rem .9rem; background:var(--accent); color:#fff; border:0; cursor:pointer; }
    .err { color:#8b2e2e; }
    .banner { font-size:.85rem; color:#445; margin:0 0 1rem; }
  </style>
</head>
<body>
  <div id="login">
    <p class="brand">Le Dash</p>
    <p class="banner">Banc local Node — session fixtures, aucun réseau externe.</p>
    ${message ? `<p class="err">${esc(message)}</p>` : ''}
    <form method="post" action="/login">
      <h1>Connexion</h1>
      <label>Nom d'utilisateur
        <input name="TB_Nom_Utilisateur" autocomplete="username" required />
      </label>
      <label>Mot de passe
        <input type="password" name="TB_Mot_de_Passe" autocomplete="current-password" required />
      </label>
      <button type="submit" name="BT_Envoyer" value="1">Se connecter</button>
    </form>
  </div>
</body>
</html>`;
}

function renderArticle(a) {
  return `<article class="post" data-id="${esc(a.id_post)}">
  <h2 class="title"><a href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}</a></h2>
  <p class="meta">${esc(a.source)} · ${esc(a.name)} · ${esc(a.heure)}:${esc(a.minute)}</p>
  <p class="excerpt">${esc(a.text)}</p>
</article>`;
}

export function renderIndexHtml({ login, feed, flash = null }) {
  const blocks = [];
  let lastDay = '';
  for (const group of [
    { label: 'Nouveaux', rows: feed.newArticles },
    { label: 'Précédents', rows: feed.oldArticles },
  ]) {
    if (!group.rows.length) continue;
    blocks.push(`<h2 class="section">${esc(group.label)}</h2>`);
    for (const row of group.rows) {
      if (row.last_date !== lastDay) {
        lastDay = row.last_date;
        blocks.push(`<div class="date_separator">${esc(formatDaySeparator(row))}</div>`);
      }
      blocks.push(renderArticle(row));
    }
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Le Dash — flux live (Node local)</title>
  <style>
    :root { --bg:#eef2ef; --ink:#1a1f1c; --accent:#0b5f4b; --line:#c5d0c8; --card:#fff; --muted:#5c675f; }
    body { margin:0; font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif; color:var(--ink);
      background:radial-gradient(ellipse 80% 50% at 10% -10%,#d5e6dc,transparent 55%),linear-gradient(180deg,#e8efe9,var(--bg)); }
    header { padding:1.2rem 1.5rem .8rem; border-bottom:1px solid var(--line); background:rgba(255,255,255,.7); }
    header h1 { margin:0; font-size:clamp(1.6rem,3vw,2.2rem); }
    .banner { padding:.65rem 1.5rem; background:#1a1f1c; color:#eef2ef; font-size:.9rem; }
    .nav { display:flex; flex-wrap:wrap; gap:.75rem 1.25rem; padding:.85rem 1.5rem; border-bottom:1px solid var(--line); }
    .nav a { color:var(--ink); }
    #container { padding:1rem 1.5rem 3rem; max-width:920px; }
    .post { background:var(--card); border:1px solid var(--line); margin:.75rem 0; padding:.85rem 1rem; }
    .meta, .excerpt { color:var(--muted); }
    .date_separator { margin:1.25rem 0 .5rem; font-weight:700; }
    .flash { margin:1rem 1.5rem 0; padding:.6rem .8rem; border:1px solid var(--accent); background:#e7f3ee; }
  </style>
</head>
<body>
  <header>
    <h1>Le Dash</h1>
    <p>Flux live local — thèmes config fixtures. Hors production.</p>
  </header>
  <aside class="banner">Banc Node client — DASH_DISABLE_EXTERNAL=1 · pas de webservice HTTP ni push.</aside>
  ${flash ? `<div class="flash">${esc(flash)}</div>` : ''}
  <div class="nav">
    <span>Connecté·e <strong>${esc(login)}</strong></span>
    <a href="/">Flux Live</a>
    <a href="/timeline">Chronologie</a>
    <a href="/api/feed">API feed JSON</a>
    <a href="/disconnect">Déconnexion</a>
  </div>
  <div id="container">
    ${blocks.join('\n') || '<p>Aucun article dans vos thèmes.</p>'}
  </div>
</body>
</html>`;
}

export function renderTimelineHtml({ login }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Le Dash · Chronologie (Node local)</title>
  <style>
    body { margin:0; font-family:"Iowan Old Style",Palatino,Georgia,serif; background:#eef2ef; color:#1a1f1c; }
    header, .nav { padding:1rem 1.5rem; border-bottom:1px solid #c5d0c8; }
    header h1 { margin:0; }
    #my-timeline { margin:1.5rem; padding:1rem; border:1px solid #aaa; background:#fff; min-height:200px; }
    .event { padding:.5rem 0; border-bottom:1px solid #eee; }
    .banner { padding:.65rem 1.5rem; background:#1a1f1c; color:#eef2ef; font-size:.9rem; }
  </style>
</head>
<body>
  <header><h1><a href="/">Le Dash</a></h1></header>
  <aside class="banner">Chronologie locale — charge <code>/results.json</code> (fixtures), sans Timeline.js CDN obligatoire.</aside>
  <div class="nav">
    <span>${esc(login)}</span>
    <a href="/">Flux Live</a>
    <a href="/disconnect">Déconnexion</a>
  </div>
  <div id="my-timeline"><p class="muted">Événements via <a href="/results.json">results.json</a>.</p></div>
  <script>
    fetch('/results.json').then(r=>r.json()).then(data=>{
      const root=document.getElementById('my-timeline');
      root.innerHTML = (data.events||[]).map(e=>'<div class="event"><strong>'+e.start+'</strong> — '+e.title+' <em>('+(e.caption||'')+')</em></div>').join('')
        || '<p>Aucun événement.</p>';
    });
  </script>
</body>
</html>`;
}
