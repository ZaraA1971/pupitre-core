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
    <a href="/messages">Messages</a>
    <a href="/notifications">Notifications <span class="badge" data-unread="0">0</span></a>
    <a href="/api/feed">API feed JSON</a>
    <a href="/disconnect">Déconnexion</a>
  </div>
  <div id="container">
    ${blocks.join('\n') || '<p>Aucun article dans vos thèmes.</p>'}
  </div>
  <script>
    fetch('/api/unread').then(r=>r.json()).then(d=>{
      document.querySelectorAll('[data-unread]').forEach(el=>{ el.textContent=String(d.count||0); });
    }).catch(()=>{});
  </script>
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
    <a href="/messages">Messages</a>
    <a href="/notifications">Notifications <span data-unread="0">0</span></a>
    <a href="/disconnect">Déconnexion</a>
  </div>
  <div id="my-timeline"><p class="muted">Événements via <a href="/results.json">results.json</a>.</p></div>
  <script>
    fetch('/results.json').then(r=>r.json()).then(data=>{
      const root=document.getElementById('my-timeline');
      root.innerHTML = (data.events||[]).map(e=>'<div class="event"><strong>'+e.start+'</strong> — '+e.title+' <em>('+(e.caption||'')+')</em></div>').join('')
        || '<p>Aucun événement.</p>';
    });
    fetch('/api/unread').then(r=>r.json()).then(d=>{
      document.querySelectorAll('[data-unread]').forEach(el=>{ el.textContent=String(d.count||0); });
    }).catch(()=>{});
  </script>
</body>
</html>`;
}

export function renderMessagesHtml({
  login,
  conversations = [],
  thread = null,
  peer = null,
  users = [],
  alert = null,
  idPost = 0,
  postBrief = null,
  unreadCount = 0,
}) {
  let body;
  if (peer) {
    const msgs = (thread || [])
      .map(
        (m) => `<div class="bubble ${m.from_self ? 'mine' : 'theirs'}">
      <p><strong>${esc(m.login_user)}</strong> <span class="muted">[${esc(m.converted_date)}]</span>
      ${m.id_post ? ' <small>(à propos de l\'article)</small>' : ''}</p>
      <p>${m.text}</p>
    </div>`
      )
      .join('\n');
    body = `
    <p><a href="/messages">← Retour</a></p>
    <h2>Conversation avec ${esc(peer.login_user || peer.id)}</h2>
    ${alert ? `<p class="flash">${esc(alert)}</p>` : ''}
    <div class="thread">${msgs || '<p class="muted">Aucun message.</p>'}</div>
    <form method="post" action="/messages?user=${esc(peer.id)}" class="sendbox">
      <input type="hidden" name="to_user" value="${esc(peer.id)}" />
      ${idPost ? `<input type="hidden" name="sent_id_post" value="${esc(idPost)}" />` : ''}
      <textarea name="message" required placeholder="Tapez ici votre message"></textarea>
      <button type="submit" name="send_message" value="1">Envoyer</button>
    </form>`;
  } else if (idPost) {
    body = `
    <p><a href="/messages">← Retour</a></p>
    <h2>Nouveau message${postBrief ? ` — ${esc(postBrief.title)}` : ''}</h2>
    ${alert ? `<p class="flash">${esc(alert)}</p>` : ''}
    <form method="post" action="/messages_post?id_post=${esc(idPost)}" class="sendbox">
      <input type="hidden" name="sent_id_post" value="${esc(idPost)}" />
      <label>Pour
        <select name="to_user" required>
          <option value="empty">Sélectionnez un destinataire</option>
          ${users.map((u) => `<option value="${esc(u.id_user)}">${esc(u.login_user)}</option>`).join('')}
        </select>
      </label>
      <textarea name="message" required placeholder="Tapez ici votre message"></textarea>
      <button type="submit" name="send_message" value="1">Envoyer</button>
    </form>`;
  } else {
    const list = conversations
      .map(
        (c) => `<li>
      <a href="/messages?user=${esc(c.peer_id)}"><strong>${esc(c.login_user)}</strong></a>
      <span class="muted">${esc(c.date)}</span>
      <p>${c.text}</p>
    </li>`
      )
      .join('\n');
    body = `
    <h2>Messages privés</h2>
    ${alert ? `<p class="flash">${esc(alert)}</p>` : ''}
    <ul class="inbox">${list || '<li class="muted">Aucune conversation.</li>'}</ul>
    <p><a href="/messages_post?id_post=1">Écrire à propos de l’article #1</a></p>`;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Le Dash · Messages (Node local)</title>
  <style>
    :root { --bg:#eef2ef; --ink:#1a1f1c; --accent:#0b5f4b; --line:#c5d0c8; --card:#fff; --muted:#5c675f; }
    body { margin:0; font-family:"Iowan Old Style",Palatino,Georgia,serif; color:var(--ink);
      background:radial-gradient(ellipse 80% 50% at 10% -10%,#d5e6dc,transparent 55%),linear-gradient(180deg,#e8efe9,var(--bg)); }
    header { padding:1.2rem 1.5rem .8rem; border-bottom:1px solid var(--line); background:rgba(255,255,255,.7); }
    header h1 { margin:0; }
    .banner { padding:.65rem 1.5rem; background:#1a1f1c; color:#eef2ef; font-size:.9rem; }
    .nav { display:flex; flex-wrap:wrap; gap:.75rem 1.25rem; padding:.85rem 1.5rem; border-bottom:1px solid var(--line); }
    #container { padding:1rem 1.5rem 3rem; max-width:720px; }
    .inbox { list-style:none; padding:0; }
    .inbox li { background:var(--card); border:1px solid var(--line); margin:.6rem 0; padding:.75rem 1rem; }
    .bubble { background:var(--card); border:1px solid var(--line); margin:.5rem 0; padding:.65rem .8rem; max-width:85%; }
    .bubble.mine { margin-left:auto; border-color:var(--accent); }
    .muted { color:var(--muted); font-size:.9rem; }
    .flash { padding:.6rem .8rem; border:1px solid var(--accent); background:#e7f3ee; }
    .sendbox textarea { width:100%; min-height:5rem; font:inherit; }
    .sendbox button { margin-top:.5rem; font:inherit; background:var(--accent); color:#fff; border:0; padding:.4rem .8rem; }
  </style>
</head>
<body>
  <header><h1><a href="/">Le Dash</a></h1></header>
  <aside class="banner">Messages locaux — sendPush enregistré, APNS/mail coupés (DASH_DISABLE_EXTERNAL=1). Pas de route HTTP /webservice.</aside>
  <div class="nav">
    <span>${esc(login)}</span>
    <a href="/">Flux Live</a>
    <a href="/messages">Messages</a>
    <a href="/notifications">Notifications <strong data-unread="badge">${esc(unreadCount)}</strong></a>
    <a href="/disconnect">Déconnexion</a>
  </div>
  <div id="container">${body}</div>
</body>
</html>`;
}

export function renderNotificationsHtml({ login, unread = [], unreadCount = 0 }) {
  const items = unread
    .map(
      (n) => `<li>
  <a href="/messages?user=${esc(n.from_user)}&id_message=${esc(n.id)}">
    <strong>${esc(n.login_user)}</strong>
    <span class="muted">${esc(n.date)}</span>
    <p>${n.text}</p>
  </a>
</li>`
    )
    .join('\n');
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Le Dash · Notifications</title>
  <style>
    :root { --bg:#eef2ef; --ink:#1a1f1c; --accent:#0b5f4b; --line:#c5d0c8; --card:#fff; --muted:#5c675f; }
    body { margin:0; font-family:"Iowan Old Style",Palatino,Georgia,serif; color:var(--ink);
      background:radial-gradient(ellipse 80% 50% at 10% -10%,#d5e6dc,transparent 55%),linear-gradient(180deg,#e8efe9,var(--bg)); }
    header { padding:1.2rem 1.5rem .8rem; border-bottom:1px solid var(--line); }
    .banner { padding:.65rem 1.5rem; background:#1a1f1c; color:#eef2ef; font-size:.9rem; }
    .nav { display:flex; flex-wrap:wrap; gap:.75rem 1.25rem; padding:.85rem 1.5rem; border-bottom:1px solid var(--line); }
    #container { padding:1rem 1.5rem 3rem; max-width:720px; }
    ul { list-style:none; padding:0; }
    li { background:var(--card); border:1px solid var(--line); margin:.55rem 0; padding:.75rem 1rem; }
    .muted { color:var(--muted); font-size:.9rem; }
    a { color:var(--ink); text-decoration:none; }
  </style>
</head>
<body>
  <header><h1><a href="/">Le Dash</a></h1></header>
  <aside class="banner">Centre de notifications local — messages non lus uniquement (pas de mentions/AJAX PHP). Badge = ${esc(unreadCount)}.</aside>
  <div class="nav">
    <span>${esc(login)}</span>
    <a href="/">Flux Live</a>
    <a href="/messages">Messages</a>
    <a href="/notifications">Notifications <strong>${esc(unreadCount)}</strong></a>
    <a href="/disconnect">Déconnexion</a>
  </div>
  <div id="container">
    <h2>Non lus</h2>
    <ul>${items || '<li class="muted">Aucune notification.</li>'}</ul>
  </div>
</body>
</html>`;
}
