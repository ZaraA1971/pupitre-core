/**
 * In-memory DB for local tests. Shapes mirror tables used by webservice/.
 */
export function createFakeDb(seed = {}) {
  const state = {
    sections: seed.sections || {},
    admin: seed.admin || {
      users: [],
      theme: [],
      ios_devices: [],
      rss_post: [],
    },
  };

  function sectionUsers(sectionDb) {
    if (!state.sections[sectionDb]) {
      state.sections[sectionDb] = { users: [], messages: [] };
    }
    return state.sections[sectionDb];
  }

  return {
    state,
    async findUserByLogin(sectionDb, login) {
      return sectionUsers(sectionDb).users.find((u) => u.login_user === login) || null;
    },
    async getUserThemeIds(_adminDb, idUser) {
      const row = state.admin.users.find((u) => Number(u.id_user) === Number(idUser));
      if (!row || !row.themes) return [];
      return String(row.themes)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number);
    },
    async getThemesByIds(_adminDb, ids) {
      const set = new Set(ids.map(Number));
      return state.admin.theme
        .filter((t) => set.has(Number(t.id)))
        .map((t) => ({
          id: t.id,
          name: String(t.name || '').replace(/\\'/g, "'"),
          img: t.img,
        }));
    },
    async listContacts(sectionDb, idUser) {
      return sectionUsers(sectionDb)
        .users.filter((u) => Number(u.id_user) !== Number(idUser))
        .map((u) => ({ id_user: u.id_user, login_user: u.login_user }));
    },
    async listLastMessages(sectionDb, idUser) {
      const msgs = [...sectionUsers(sectionDb).messages].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      const seen = new Set();
      const out = [];
      for (const row of msgs) {
        const direction = Number(row.from_user) === Number(idUser) ? 'sent' : 'received';
        const contact =
          Number(row.from_user) === Number(idUser) ? row.to_user : row.from_user;
        if (Number(row.from_user) !== Number(idUser) && Number(row.to_user) !== Number(idUser)) {
          continue;
        }
        if (seen.has(Number(contact))) continue;
        seen.add(Number(contact));
        out.push({
          id_message: row.id,
          contact,
          direction,
          text: row.text,
          date: Math.floor(new Date(row.date).getTime() / 1000),
          read: row.has_been_read,
        });
      }
      return out;
    },
    async historyMessages(sectionDb, idUser, otherUser, since, old) {
      let msgs = sectionUsers(sectionDb).messages.filter((m) => {
        const a = Number(m.from_user) === Number(idUser) && Number(m.to_user) === Number(otherUser);
        const b = Number(m.from_user) === Number(otherUser) && Number(m.to_user) === Number(idUser);
        return a || b;
      });
      if (since > 0) {
        msgs = msgs.filter((m) => (old === 1 ? Number(m.id) < since : Number(m.id) > since));
      }
      msgs = msgs
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 20)
        .map((row) => ({
          id_message: row.id,
          direction: Number(row.from_user) === Number(idUser) ? 'sent' : 'received',
          text: row.text,
          date: Math.floor(new Date(row.date).getTime() / 1000),
          read: row.has_been_read,
        }));
      return msgs.reverse();
    },
    async insertMessage(sectionDb, fromUser, toUser, text) {
      const bag = sectionUsers(sectionDb);
      const id = bag.messages.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
      bag.messages.push({
        id,
        from_user: Number(fromUser),
        to_user: Number(toUser),
        flag: 0,
        text: String(text),
        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        has_been_read: 0,
      });
      return id;
    },
    async markConversationRead(sectionDb, idUser, otherUser) {
      for (const m of sectionUsers(sectionDb).messages) {
        const pair =
          (Number(m.from_user) === Number(idUser) && Number(m.to_user) === Number(otherUser)) ||
          (Number(m.from_user) === Number(otherUser) && Number(m.to_user) === Number(idUser));
        if (pair && String(m.has_been_read) === '0') {
          m.has_been_read = '1';
        }
      }
    },
    async listNews(theme, since, before) {
      let rows = [...state.admin.rss_post];
      if (theme > 0) rows = rows.filter((r) => Number(r.id_theme) === Number(theme));
      if (since && since !== '(null)') {
        rows = rows.filter((r) =>
          before ? String(r.date) < String(since) : String(r.date) > String(since)
        );
      }
      rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      return rows.slice(0, 20).map((row) => {
        const themeRow = state.admin.theme.find((t) => Number(t.id) === Number(row.id_theme));
        const d = new Date(row.date);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          id: row.id,
          hash: row.hash,
          alert: row.alert,
          id_theme: row.id_theme,
          source: row.source,
          title: String(row.title || '').replace(/<[^>]+>/g, ''),
          day: String(d.getUTCDate()).padStart(2, '0'),
          month: months[d.getUTCMonth()],
          hour: String(d.getUTCHours()).padStart(2, '0'),
          minute: String(d.getUTCMinutes()).padStart(2, '0'),
          theme: themeRow?.name || '',
          date: row.date,
        };
      });
    },
    async getNewsById(id) {
      return state.admin.rss_post.find((r) => Number(r.id) === Number(id)) || null;
    },
    async getSettings(idUser) {
      const u = state.admin.users.find((x) => Number(x.id_user) === Number(idUser));
      const d = state.admin.ios_devices.find((x) => Number(x.id_user) === Number(idUser));
      return {
        mail: u?.mail ?? null,
        push_message: d?.push_message ?? null,
        push_alert: d?.push_alert ?? null,
      };
    },
    async saveSettings(sectionDb, idUser, { newLogin, newPassword, newMail, notifMessage, notifAlert }) {
      const result = { message: '.' };
      const sec = sectionUsers(sectionDb);
      const clash = sec.users.some(
        (u) => u.login_user === newLogin && Number(u.id_user) !== Number(idUser)
      );
      if (clash) {
        result.message = "Ce nom d'utilisateur est déjà utilisé.";
      } else {
        const u = sec.users.find((x) => Number(x.id_user) === Number(idUser));
        if (u) u.login_user = newLogin;
      }
      const u = sec.users.find((x) => Number(x.id_user) === Number(idUser));
      if (u) {
        u.pass_user = newPassword;
        u.mail_user = newMail;
      }
      const au = state.admin.users.find((x) => Number(x.id_user) === Number(idUser));
      if (au) au.mail = newMail;
      for (const d of state.admin.ios_devices.filter((x) => Number(x.id_user) === Number(idUser))) {
        d.push_message = notifMessage;
        d.push_alert = notifAlert;
      }
      return result;
    },
    async registerPush(idUser, token) {
      state.admin.ios_devices.push({
        id: state.admin.ios_devices.length + 1,
        id_user: Number(idUser),
        token: String(token),
        push_message: 1,
        push_alert: 1,
      });
    },
  };
}
