import { isEditorialInboxRow } from './filters.mjs';

export function createFakeAdminDb(seed = {}) {
  const state = {
    rss_post: seed.rss_post ? structuredClone(seed.rss_post) : [],
    rss_url: seed.rss_url ? structuredClone(seed.rss_url) : [],
    users: seed.users ? structuredClone(seed.users) : [],
    dash_keys: seed.dash_keys ? structuredClone(seed.dash_keys) : [],
    authors: seed.authors ? structuredClone(seed.authors) : [],
    authors_posts: seed.authors_posts ? structuredClone(seed.authors_posts) : [],
    sectionDbs: seed.sectionDbs ? structuredClone(seed.sectionDbs) : {},
  };

  function vigieSources() {
    return new Set(
      state.rss_url.filter((u) => u.audience === 'vigie').map((u) => String(u.name))
    );
  }

  return {
    state,
    async getPost(id) {
      return state.rss_post.find((p) => Number(p.id) === Number(id)) || null;
    },
    async listEditorialInbox({ page = 1, perPage = 75 } = {}) {
      const vigie = vigieSources();
      const rows = state.rss_post
        .filter((r) => isEditorialInboxRow(r, vigie))
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));
      const totalRows = rows.length;
      const offset = (Math.max(1, page) - 1) * perPage;
      return { rows: rows.slice(offset, offset + perPage), totalRows };
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
  };
}

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}
