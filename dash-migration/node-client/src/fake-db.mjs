import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { md5 } from './password.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function loadFixtureSeed() {
  const raw = JSON.parse(readFileSync(path.join(HERE, '..', 'fixtures', 'seed.json'), 'utf8'));
  // Ensure alice/bob md5 hashes match known plains used in tests
  for (const u of raw.users) {
    if (u.login_user === 'alice') u.pass_user = md5('alice');
    if (u.login_user === 'bobby') u.pass_user = md5('bobby');
    if (u.login_user === 'carol') u.pass_user = md5('carol');
  }
  return raw;
}

/**
 * In-memory dual-DB shape: section users (dash_electron) + admin rss (admin_dash).
 */
export function createFakeClientDb(seed = loadFixtureSeed()) {
  const state = {
    users: structuredClone(seed.users || []),
    configThemes: [...(seed.config_themes || [])],
    userKeyword: structuredClone(seed.user_keyword || []),
    favorites: structuredClone(seed.favorites || []),
    theme: structuredClone(seed.theme || []),
    keyword: structuredClone(seed.keyword || []),
    postKeyword: structuredClone(seed.post_keyword || []),
    rssPost: structuredClone(seed.rss_post || []),
    messages: structuredClone(seed.messages || []),
    iosDevices: structuredClone(seed.ios_devices || []),
    nextMessageId:
      (seed.messages || []).reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1,
  };

  return {
    state,
    async findUserByLogin(login) {
      return state.users.find((u) => u.login_user === login) || null;
    },
    async findUserById(id) {
      return state.users.find((u) => Number(u.id_user) === Number(id)) || null;
    },
    async listUsersExcept(userId) {
      return state.users
        .filter((u) => Number(u.id_user) !== Number(userId) && Number(u.active_user) === 1)
        .map((u) => ({ id_user: u.id_user, login_user: u.login_user }));
    },
    async userThemeIds(_userId) {
      // PHP reads global config table (not per-user themes) for live feed filters
      return state.configThemes.map(Number);
    },
    async listDevices(idUser) {
      return state.iosDevices.filter((d) => Number(d.id_user) === Number(idUser));
    },
    async insertMessage({ fromUser, toUser, idPost, text, date }) {
      const id = state.nextMessageId++;
      const row = {
        id,
        from_user: Number(fromUser),
        to_user: Number(toUser),
        id_post: Number(idPost) || 0,
        text: String(text),
        date: String(date),
        has_been_read: 0,
      };
      state.messages.push(row);
      return row;
    },
    async listConversations(userId) {
      const uid = Number(userId);
      const byPeer = new Map();
      const sorted = [...state.messages].sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
      );
      for (const m of sorted) {
        const a = Number(m.from_user);
        const b = Number(m.to_user);
        if (a !== uid && b !== uid) continue;
        const peer = a === uid ? b : a;
        if (byPeer.has(peer)) continue;
        const peerUser = state.users.find((u) => Number(u.id_user) === peer);
        byPeer.set(peer, {
          peer_id: peer,
          login_user: peerUser?.login_user || String(peer),
          text: m.text,
          date: m.date,
          has_been_read: Number(m.has_been_read),
          from_self: a === uid,
        });
      }
      return [...byPeer.values()];
    },
    async listThread(userId, peerId, { offset = 0, limit = 5 } = {}) {
      const uid = Number(userId);
      const peer = Number(peerId);
      const thread = state.messages
        .filter((m) => {
          const a = Number(m.from_user);
          const b = Number(m.to_user);
          return (a === uid && b === peer) || (a === peer && b === uid);
        })
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .slice(offset, offset + limit)
        .reverse()
        .map((m) => {
          const from = state.users.find((u) => Number(u.id_user) === Number(m.from_user));
          return {
            id: m.id,
            id_post: Number(m.id_post) || 0,
            from_user: Number(m.from_user),
            to_user: Number(m.to_user),
            login_user: from?.login_user || '',
            text: m.text,
            date: m.date,
            converted_date: formatFr(m.date),
            from_self: Number(m.from_user) === uid,
          };
        });
      return thread;
    },
    async markMessageRead(userId, messageId) {
      const m = state.messages.find((x) => Number(x.id) === Number(messageId));
      if (!m) return false;
      if (Number(m.from_user) === Number(userId)) return false;
      m.has_been_read = 1;
      return true;
    },
    async getPostBrief(idPost) {
      const r = state.rssPost.find((p) => Number(p.id) === Number(idPost));
      if (!r) return null;
      const theme = state.theme.find((t) => Number(t.id) === Number(r.id_theme));
      return {
        id_post: Number(r.id),
        title: r.title,
        source: r.source,
        link: r.link,
        theme: theme?.name || '',
      };
    },
    async listChrono({ themeIds, lastConnexion, offset = 0, limit = 25, textMax = 1200 }) {
      const themes = new Set(themeIds.map(Number));
      const themeName = new Map(state.theme.map((t) => [Number(t.id), t.name]));
      const rows = state.rssPost
        .filter((r) => themes.has(Number(r.id_theme)))
        .map((r) => enrichDateFields(r, themeName.get(Number(r.id_theme)) || '', textMax));

      const lc = String(lastConnexion || '1970-01-01 00:00:00');
      const newer = rows
        .filter((r) => String(r.date_add_theme || r.date) > lc)
        .sort((a, b) => String(b.date_add_theme).localeCompare(String(a.date_add_theme)));
      const older = rows
        .filter((r) => String(r.date_add_theme || r.date) <= lc)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

      return {
        newArticles: newer.slice(offset, offset + limit),
        oldArticles: older.slice(offset, offset + limit),
      };
    },
    async articlesByKeywordDay(keywordId, dateYmd) {
      const hashes = new Set(
        state.postKeyword
          .filter((pk) => Number(pk.id_keyword) === Number(keywordId))
          .map((pk) => pk.hash_post)
      );
      return state.rssPost
        .filter((r) => hashes.has(r.hash) && String(r.date).startsWith(dateYmd))
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .map((r) => ({
          title: r.title,
          link: r.link,
          source: r.source,
          cdate: String(r.date).slice(11, 16),
        }));
    },
    async timelineEvents() {
      const themeName = new Map(state.theme.map((t) => [Number(t.id), t.name]));
      return state.rssPost
        .filter((r) => state.configThemes.map(Number).includes(Number(r.id_theme)))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map((r) => ({
          start: toIsoLocal(r.date),
          title: r.title,
          description: String(r.text || '').slice(0, 200),
          link: r.link,
          theme: themeName.get(Number(r.id_theme)) || '',
        }));
    },
    async close() {},
  };
}

function enrichDateFields(r, themeName, textMax) {
  const d = String(r.date || '1970-01-01 00:00:00');
  const [ymd, hm = '00:00:00'] = d.split(' ');
  const [Y, M, D] = ymd.split('-').map(Number);
  const [H, Min] = hm.split(':');
  const dt = new Date(Date.UTC(Y, M - 1, D, Number(H), Number(Min)));
  return {
    id_post: Number(r.id),
    id_theme: Number(r.id_theme),
    source: r.source,
    title: r.title,
    text: String(r.text || '').slice(0, textMax),
    author: r.author || '',
    link: r.link,
    hash: r.hash,
    alert: Number(r.alert || 0),
    date: r.date,
    date_add_theme: r.date_add_theme || r.date,
    last_date: ymd,
    numero_jour: dt.getUTCDay(),
    numero_mois: M,
    jour: String(D).padStart(2, '0'),
    annee: String(Y),
    heure: String(H).padStart(2, '0'),
    minute: String(Min).padStart(2, '0'),
    name: themeName,
  };
}

function toIsoLocal(sqlTs) {
  // SIMILE-friendly: YYYY-MM-DDTHH:mm:ssZ from SQL datetime (treat as UTC for fixtures)
  const s = String(sqlTs || '').replace(' ', 'T');
  return s.length === 19 ? `${s}Z` : s;
}

function formatFr(sqlTs) {
  const s = String(sqlTs || '');
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return s;
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
}
