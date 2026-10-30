import { isEditorialInboxRow, listPerPage, paginationState } from './filters.mjs';

export function createFakeAdminDb(seed = {}) {
  const state = {
    rss_post: seed.rss_post ? structuredClone(seed.rss_post) : [],
    rss_url: seed.rss_url ? structuredClone(seed.rss_url) : [],
    theme: seed.theme ? structuredClone(seed.theme) : [],
    keyword: seed.keyword ? structuredClone(seed.keyword) : [],
    post_keyword: seed.post_keyword ? structuredClone(seed.post_keyword) : [],
    aliases: seed.aliases ? structuredClone(seed.aliases) : [],
    users: seed.users ? structuredClone(seed.users) : [],
    dash_keys: seed.dash_keys ? structuredClone(seed.dash_keys) : [],
    authors: seed.authors ? structuredClone(seed.authors) : [],
    authors_posts: seed.authors_posts ? structuredClone(seed.authors_posts) : [],
    sectionDbs: seed.sectionDbs ? structuredClone(seed.sectionDbs) : {},
    refresh_rss: seed.refresh_rss
      ? structuredClone(seed.refresh_rss)
      : {
          id: 1,
          status: '0',
          last_refresh: null,
          last_update: null,
          current: 0,
        },
  };
  let nextPostId =
    state.rss_post.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;

  function vigieSources() {
    return new Set(
      state.rss_url.filter((u) => u.audience === 'vigie').map((u) => String(u.name))
    );
  }

  function keywordCount(hash) {
    return state.post_keyword.filter((pk) => pk.hash_post === hash).length;
  }

  function trendScore(hash) {
    // Approximate PHP "tendance": sum of keyword frequencies in recent posts
    const recent = state.rss_post.filter((r) => {
      const t = Date.parse(String(r.date).replace(' ', 'T') + 'Z');
      return Number.isFinite(t) && Date.now() - t < 19 * 864e5;
    });
    const freq = new Map();
    for (const r of recent) {
      for (const pk of state.post_keyword.filter((x) => x.hash_post === r.hash)) {
        freq.set(pk.id_keyword, (freq.get(pk.id_keyword) || 0) + 1);
      }
    }
    let sum = 0;
    for (const pk of state.post_keyword.filter((x) => x.hash_post === hash)) {
      sum += freq.get(pk.id_keyword) || 0;
    }
    return sum;
  }

  function formatRow(r) {
    const d = new Date(String(r.date).replace(' ', 'T') + 'Z');
    const ok = Number.isFinite(d.getTime());
    return {
      id: r.id,
      id_theme: r.id_theme,
      source: r.source,
      author: r.author,
      title: r.title,
      text: String(r.text || '').slice(0, 1200),
      link: r.link,
      hash: r.hash,
      jour: ok ? String(d.getUTCDate()).padStart(2, '0') : '',
      numero_mois: ok ? String(d.getUTCMonth() + 1) : '',
      annee_heure: ok
        ? `${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`
        : String(r.date || ''),
      keywords: state.post_keyword
        .filter((pk) => pk.hash_post === r.hash)
        .map((pk) => {
          const k = state.keyword.find((x) => Number(x.id_keyword) === Number(pk.id_keyword));
          return k
            ? { id_keyword: k.id_keyword, name_keyword: k.name_keyword }
            : null;
        })
        .filter(Boolean),
    };
  }

  return {
    kind: 'fixtures',
    state,
    async close() {},

    async getPost(id) {
      return state.rss_post.find((p) => Number(p.id) === Number(id)) || null;
    },

    async listThemes() {
      return [...state.theme].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    },

    async listSources() {
      return [...new Set(state.rss_post.map((r) => r.source).filter(Boolean))].sort();
    },

    async listKeywords() {
      return [...state.keyword].sort((a, b) =>
        String(a.name_keyword).localeCompare(String(b.name_keyword))
      );
    },

    async listAuthors() {
      return [...state.authors].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    },

    async listSent({ page = 1, perPage = listPerPage('sent') } = {}) {
      const rows = state.rss_post
        .filter(
          (r) => Number(r.bin) === 0 && Number(r.sent) === 1 && Number(r.deleted) === 0
        )
        .sort(
          (a, b) =>
            String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id)
        );
      const totalRows = rows.length;
      const pagination = paginationState(page, totalRows, perPage);
      return {
        rows: rows.slice(pagination.offset, pagination.offset + perPage).map(formatRow),
        ...pagination,
      };
    },

    async listDeleted({ page = 1, perPage = listPerPage('deleted') } = {}) {
      const rows = state.rss_post
        .filter((r) => Number(r.deleted) === 1)
        .sort(
          (a, b) =>
            String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id)
        );
      const totalRows = rows.length;
      const pagination = paginationState(page, totalRows, perPage);
      return {
        rows: rows.slice(pagination.offset, pagination.offset + perPage).map(formatRow),
        ...pagination,
      };
    },

    async listInbox({
      page = 1,
      perPage = listPerPage('index'),
      source = null,
      keywordId = 0,
      tri = 'date',
    } = {}) {
      const vigie = vigieSources();
      let rows = state.rss_post.filter((r) => isEditorialInboxRow(r, vigie));
      if (source) rows = rows.filter((r) => r.source === source);
      if (keywordId > 0) {
        const hashes = new Set(
          state.post_keyword
            .filter((pk) => Number(pk.id_keyword) === Number(keywordId))
            .map((pk) => pk.hash_post)
        );
        rows = rows.filter((r) => hashes.has(r.hash));
      }
      if (tri === 'pertinence') {
        rows.sort((a, b) => {
          const d = keywordCount(b.hash) - keywordCount(a.hash);
          if (d) return d;
          return String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id);
        });
      } else if (tri === 'tendance') {
        rows.sort((a, b) => {
          const d = trendScore(b.hash) - trendScore(a.hash);
          if (d) return d;
          return String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id);
        });
      } else {
        rows.sort(
          (a, b) =>
            String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id)
        );
      }
      const totalRows = rows.length;
      const pagination = paginationState(page, totalRows, perPage);
      const slice = rows.slice(pagination.offset, pagination.offset + perPage).map(formatRow);
      return { rows: slice, ...pagination };
    },

    /** @deprecated use listInbox */
    async listEditorialInbox(opts) {
      return this.listInbox(opts);
    },

    async navCounts() {
      const vigie = vigieSources();
      return {
        new: state.rss_post.filter((r) => isEditorialInboxRow(r, vigie)).length,
        sent: state.rss_post.filter(
          (r) => Number(r.bin) === 0 && Number(r.sent) === 1 && Number(r.deleted) === 0
        ).length,
        deleted: state.rss_post.filter((r) => Number(r.deleted) === 1).length,
      };
    },

    async markSent(postId, { idTheme = null, dateAddTheme = null } = {}) {
      const row = await this.getPost(postId);
      if (!row) return false;
      row.sent = 1;
      row.new = 0;
      row.deleted = 0;
      if (idTheme != null) {
        row.id_theme = idTheme;
        row.date_add_theme = dateAddTheme || nowSql();
      }
      return true;
    },

    async markAlert(postId, { isAlert, dateAddTheme }) {
      const row = await this.getPost(postId);
      if (!row) return false;
      row.sent = 1;
      row.new = 0;
      row.deleted = 0;
      row.alert = isAlert ? 1 : 0;
      row.date_add_theme = dateAddTheme;
      return true;
    },

    async markDeleted(postId) {
      const row = await this.getPost(postId);
      if (!row) return false;
      row.sent = 0;
      row.new = 0;
      row.deleted = 1;
      return true;
    },

    async deleteAllNew() {
      let n = 0;
      for (const row of state.rss_post) {
        if (
          Number(row.bin) === 0 &&
          Number(row.new) === 1 &&
          Number(row.deleted) === 0 &&
          Number(row.sent) === 0
        ) {
          row.bin = 1;
          row.new = 0;
          row.deleted = 1;
          row.sent = 0;
          n += 1;
        }
      }
      return n;
    },

    async markDesk(postId) {
      const row = await this.getPost(postId);
      if (!row) return false;
      row.sent = 1;
      row.new = 0;
      row.deleted = 0;
      row.breve_spip = 1;
      return true;
    },

    async listAlertUsers() {
      return state.users.filter((u) => Number(u.active) === 1 && Number(u.notif) === 1);
    },

    async userMatchesTheme(user, postId) {
      const post = await this.getPost(postId);
      if (!post) return null;
      const themes = String(user.themes || '')
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => n > 0);
      if (themes.length && !themes.includes(Number(post.id_theme))) return null;
      return { mail: user.mail, dash: user.dash, title: post.title };
    },

    async listActiveDashIds() {
      return state.dash_keys.filter((d) => Number(d.expired) === 0).map((d) => d.dash_id);
    },

    async sectionFollowsTheme(dashId, themeId) {
      const sec = state.sectionDbs[`dash_${dashId}`];
      if (!sec) return false;
      return (sec.config || []).some((c) => Number(c.id_theme) === Number(themeId));
    },

    async sectionAlertTokens(dashId) {
      const sec = state.sectionDbs[`dash_${dashId}`];
      if (!sec) return [];
      return (sec.push_devices || [])
        .filter((d) => Number(d.alert) === 1)
        .map((d) => ({ token: d.token, dash: dashId }));
    },

    async linkAuthorIfKnown(post) {
      const authorName = String(post.author || '');
      if (!authorName || authorName === 'Auteur inconnu') return false;
      const link = String(post.link || '');
      if (!link) return false;
      const author = state.authors.find((a) => a.name === authorName);
      if (!author) return false;
      if (state.authors_posts.some((ap) => ap.link === link)) return false;
      state.authors_posts.push({
        id_author: author.id,
        title: post.title,
        link,
        source: post.source,
        date: post.date,
      });
      return true;
    },

    // --- refresh / cron surface (fixtures) ---

    async listRssUrls() {
      return state.rss_url
        .filter((u) => u.url)
        .map((u) => ({
          url: String(u.url),
          name: String(u.name || ''),
          audience: String(u.audience || 'editorial'),
          theme: u.theme != null ? String(u.theme) : '',
        }));
    },

    async loadKeywordData() {
      const keywords = state.keyword.map((k) => ({
        id_keyword: Number(k.id_keyword),
        name_keyword: String(k.name_keyword),
      }));
      const aliases = [...state.aliases];
      for (const k of state.keyword) {
        if (k.alias_keyword) {
          for (const part of String(k.alias_keyword).split(',')) {
            const name_alias = part.trim();
            if (name_alias) {
              aliases.push({
                id_keyword: Number(k.id_keyword),
                name_alias,
              });
            }
          }
        }
      }
      return { keywords, aliases };
    },

    async countByHash(hash) {
      return state.rss_post.filter((r) => r.hash === hash).length;
    },

    async markAllNewAsBin() {
      let n = 0;
      for (const row of state.rss_post) {
        if (Number(row.new) === 1) {
          row.bin = 1;
          n += 1;
        }
      }
      return n;
    },

    async clearBinByHash(hash) {
      let n = 0;
      for (const row of state.rss_post) {
        if (row.hash === hash) {
          row.bin = 0;
          n += 1;
        }
      }
      return n;
    },

    async insertRssPost(row) {
      const post = {
        id: nextPostId++,
        title: row.title,
        text: row.text,
        source: row.source,
        link: row.link,
        author: row.author || '',
        date: row.date,
        hash: row.hash,
        bin: row.bin ?? 0,
        new: row.new ?? 1,
        sent: row.sent ?? 0,
        deleted: row.deleted ?? 0,
        alert: row.alert ?? 0,
        id_theme: row.id_theme ?? 0,
        breve_spip: row.breve_spip ?? 0,
      };
      state.rss_post.push(post);
      return post;
    },

    async attachPostKeyword(hash, idKeyword) {
      const id = Number(idKeyword);
      if (
        state.post_keyword.some(
          (pk) => pk.hash_post === hash && Number(pk.id_keyword) === id
        )
      ) {
        return false;
      }
      state.post_keyword.push({ hash_post: hash, id_keyword: id });
      return true;
    },

    async trashLowKeywordHash(hash) {
      let n = 0;
      for (const row of state.rss_post) {
        if (row.hash === hash) {
          row.new = 0;
          row.deleted = 1;
          n += 1;
        }
      }
      return n;
    },

    async deleteOlderThanDays(days, nowMs = Date.now()) {
      if (days < 1) return 0;
      const cutoff = nowMs - days * 864e5;
      const doomed = new Set();
      for (const row of state.rss_post) {
        const t = Date.parse(String(row.date).replace(' ', 'T') + 'Z');
        if (Number.isFinite(t) && t < cutoff) doomed.add(row.hash);
      }
      state.post_keyword = state.post_keyword.filter((pk) => !doomed.has(pk.hash_post));
      const before = state.rss_post.length;
      state.rss_post = state.rss_post.filter((r) => !doomed.has(r.hash));
      return before - state.rss_post.length;
    },

    async deleteStaleBinUnsent() {
      const doomed = new Set(
        state.rss_post
          .filter(
            (r) =>
              Number(r.bin) === 1 && Number(r.sent) === 0 && Number(r.deleted) === 0
          )
          .map((r) => r.hash)
      );
      state.post_keyword = state.post_keyword.filter((pk) => !doomed.has(pk.hash_post));
      const before = state.rss_post.length;
      state.rss_post = state.rss_post.filter((r) => !doomed.has(r.hash));
      return before - state.rss_post.length;
    },

    async getRefreshRow() {
      return { ...state.refresh_rss };
    },

    async setRefreshStatus(status) {
      state.refresh_rss.status = String(status);
    },

    async setRefreshCurrent(n) {
      state.refresh_rss.current = Number(n) || 0;
    },

    async setLastRefresh(ts) {
      state.refresh_rss.last_refresh = ts;
    },

    async touchRefreshActivity(ts) {
      state.refresh_rss.last_update = ts;
    },
  };
}

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}
