/**
 * Client read helpers — chrono feed, get_articles day panel, timeline JSON.
 */

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
const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export async function loadLiveFeed(db, user, { page = 1, textMax = 1200, pageSize = 25 } = {}) {
  const themeIds = await db.userThemeIds(user.id_user);
  const offset = (Math.max(1, page) - 1) * pageSize;
  const { newArticles, oldArticles } = await db.listChrono({
    themeIds,
    lastConnexion: user.last_connexion || '1970-01-01 00:00:00',
    offset,
    limit: pageSize,
    textMax,
  });
  return {
    themeIds,
    page: Math.max(1, page),
    pageSize,
    newArticles,
    oldArticles,
    articles: [...newArticles, ...oldArticles],
  };
}

/**
 * HTML fragment parity with client/get_articles.php
 */
export function renderGetArticlesHtml(posts, dateLabel) {
  const count = posts.length;
  let html = '<div class="graph-day-panel">';
  html += '<div class="date_separator graph-day-panel__separator">';
  html += esc(dateLabel);
  if (count > 0) {
    html += ` · ${count} article${count > 1 ? 's' : ''}`;
  }
  html += '</div>';
  if (count > 0) {
    html += '<ul class="graph-day-panel__list">';
    for (const post of posts) {
      html += '<li class="graph-day-panel__item">';
      html += `<time class="graph-day-panel__time">${esc(post.cdate)}</time>`;
      if (post.source) {
        html += `<span class="graph-day-panel__source grey2">${esc(post.source)}</span>`;
      }
      html += `<a class="graph-day-panel__link" href="${esc(post.link)}" target="_blank" rel="noopener noreferrer">${esc(post.title)}</a>`;
      html += '</li>';
    }
    html += '</ul>';
  } else {
    html += '<p class="graph-day-empty">Aucun article pour cette journée.</p>';
  }
  html += '</div>';
  return html;
}

export function formatDaySeparator(row) {
  const jourNom = JOURS[Number(row.numero_jour) || 0] || '';
  const moisNom = MOIS[Number(row.numero_mois) || 0] || '';
  return `${jourNom} ${row.jour} ${moisNom} ${row.annee}`;
}

export function timelineJson(events) {
  return {
    dateTimeFormat: 'iso8601',
    events: events.map((e) => ({
      start: e.start,
      title: e.title,
      description: e.description,
      link: e.link,
      caption: e.theme || '',
    })),
  };
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
