import {
  assertLoopbackDisposableMysql,
  assertProdRefreshAllowed,
  assertRefreshMysqlWritesAllowed,
} from './config.mjs';
import {
  indexPromoSqlFragment,
  listPerPage,
  paginationState,
  rssDeletedSql,
  rssEditorialInboxSql,
  rssSentSql,
} from './filters.mjs';

/**
 * MySQL adapter for disposable Qualif-like schema (rss_post, theme, refresh, …).
 * Requires mysql2. Never embeds credentials.
 * Pool creation refuses non-loopback / non-disposable schema names.
 * Schema init + refresh writes only when DASH_DB_ALLOW_SCHEMA_INIT=1.
 */
export async function createMysqlAdminDb(config) {
  if (config.prodRefresh) {
    assertProdRefreshAllowed(config);
  } else {
    assertLoopbackDisposableMysql(config);
  }

  let mysql;
  try {
    mysql = await import('mysql2/promise');
  } catch {
    throw new Error(
      'Paquet mysql2 absent. Installer avec: npm install mysql2 --no-save (base jetable uniquement).'
    );
  }

  const pool = mysql.createPool({
    host: config.dbHost,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    waitForConnections: true,
    connectionLimit: 4,
    namedPlaceholders: true,
    // Keep DATETIME as strings so lock/purge clocks stay deterministic vs fixtures.
    dateStrings: true,
  });

  await pool.query('SELECT 1');

  if (config.allowSchemaInit && !config.prodRefresh) {
    await initDisposableSchema(pool);
  }

  function requireRefreshWrites() {
    assertRefreshMysqlWritesAllowed(config);
  }

  const orderSql = (tri) => {
    if (tri === 'pertinence') {
      return `ORDER BY (
            SELECT COUNT(*) FROM post_keyword pk_rel WHERE pk_rel.hash_post = r.hash
        ) DESC, r.date DESC, r.id DESC`;
    }
    if (tri === 'tendance') {
      return `ORDER BY (
            SELECT COALESCE(SUM(kw_trend.cnt), 0)
            FROM post_keyword pk_tr
            INNER JOIN (
                SELECT pk2.id_keyword, COUNT(*) AS cnt
                FROM post_keyword pk2
                INNER JOIN rss_post rp ON rp.hash = pk2.hash_post
                WHERE rp.date >= DATE_SUB(NOW(), INTERVAL 19 DAY)
                GROUP BY pk2.id_keyword
            ) kw_trend ON kw_trend.id_keyword = pk_tr.id_keyword
            WHERE pk_tr.hash_post = r.hash
        ) DESC, r.date DESC, r.id DESC`;
    }
    return 'ORDER BY r.date DESC, r.id DESC';
  };

  async function attachKeywords(rows) {
    if (!rows.length) return rows;
    const hashes = [...new Set(rows.map((r) => r.hash).filter(Boolean))];
    if (!hashes.length) return rows.map((r) => ({ ...r, keywords: [] }));
    const [krows] = await pool.query(
      `SELECT pk.hash_post, k.name_keyword, k.id_keyword
       FROM post_keyword pk
       JOIN keyword k ON k.id_keyword = pk.id_keyword
       WHERE pk.hash_post IN (?)`,
      [hashes]
    );
    const byHash = new Map();
    for (const k of krows) {
      if (!byHash.has(k.hash_post)) byHash.set(k.hash_post, []);
      byHash.get(k.hash_post).push({
        id_keyword: k.id_keyword,
        name_keyword: k.name_keyword,
      });
    }
    return rows.map((r) => ({ ...r, keywords: byHash.get(r.hash) || [] }));
  }

  return {
    kind: 'mysql',
    async close() {
      await pool.end();
    },

    async getPost(id) {
      const [rows] = await pool.query('SELECT * FROM rss_post WHERE id = ? LIMIT 1', [
        id,
      ]);
      return rows[0] || null;
    },

    async listThemes() {
      const [rows] = await pool.query('SELECT id, name FROM theme ORDER BY name');
      return rows;
    },

    async listSources() {
      const [rows] = await pool.query(
        'SELECT DISTINCT source FROM rss_post WHERE source IS NOT NULL AND source != "" ORDER BY source'
      );
      return rows.map((r) => r.source);
    },

    async listKeywords() {
      const [rows] = await pool.query(
        'SELECT id_keyword, name_keyword FROM keyword ORDER BY name_keyword'
      );
      return rows;
    },

    async listAuthors() {
      const [rows] = await pool.query('SELECT id, name FROM authors ORDER BY name');
      return rows;
    },

    async listSent({ page = 1, perPage = listPerPage('sent') } = {}) {
      const [[c]] = await pool.query(
        `SELECT COUNT(*) AS c FROM rss_post WHERE ${rssSentSql()}`
      );
      const totalRows = Number(c.c || 0);
      const pagination = paginationState(page, totalRows, perPage);
      const [rows] = await pool.query(
        `SELECT id, id_theme, source, author, title, LEFT(text, 1200) AS text, link, hash,
                DATE_FORMAT(date, "%d") AS jour,
                DATE_FORMAT(date, "%c") AS numero_mois,
                DATE_FORMAT(date, "%Y %T") AS annee_heure
         FROM rss_post WHERE ${rssSentSql()}
         ORDER BY date DESC, id DESC
         LIMIT ?, ?`,
        [pagination.offset, perPage]
      );
      return { rows: await attachKeywords(rows), ...pagination };
    },

    async listDeleted({ page = 1, perPage = listPerPage('deleted') } = {}) {
      const [[c]] = await pool.query(
        `SELECT COUNT(*) AS c FROM rss_post WHERE ${rssDeletedSql()}`
      );
      const totalRows = Number(c.c || 0);
      const pagination = paginationState(page, totalRows, perPage);
      const [rows] = await pool.query(
        `SELECT id, id_theme, source, author, title, LEFT(text, 1200) AS text, link, hash,
                DATE_FORMAT(date, "%d") AS jour,
                DATE_FORMAT(date, "%c") AS numero_mois,
                DATE_FORMAT(date, "%Y %T") AS annee_heure
         FROM rss_post WHERE ${rssDeletedSql()}
         ORDER BY date DESC, id DESC
         LIMIT ?, ?`,
        [pagination.offset, perPage]
      );
      return { rows: await attachKeywords(rows), ...pagination };
    },

    async listInbox({
      page = 1,
      perPage = listPerPage('index'),
      source = null,
      keywordId = 0,
      tri = 'date',
    } = {}) {
      const promo = indexPromoSqlFragment();
      const params = {};
      let filters;
      if (keywordId > 0) {
        filters = `
          FROM rss_post r
          JOIN post_keyword pk ON pk.hash_post = r.hash
          JOIN keyword k ON k.id_keyword = pk.id_keyword
          WHERE ${rssEditorialInboxSql('r')}
            ${source ? ' AND r.source = :source_name ' : ''}
            AND pk.id_keyword = :keyword_id ${promo}`;
        params.keyword_id = keywordId;
      } else {
        filters = `
          FROM rss_post r
          WHERE ${rssEditorialInboxSql('r')}
            ${source ? ' AND r.source = :source_name ' : ''} ${promo}`;
      }
      if (source) params.source_name = source;

      const countSql =
        keywordId > 0
          ? `SELECT COUNT(DISTINCT r.id) AS c ${filters}`
          : `SELECT COUNT(*) AS c ${filters}`;
      const [countRows] = await pool.query(countSql, params);
      const totalRows = Number(countRows[0]?.c || 0);
      const pagination = paginationState(page, totalRows, perPage);

      const selectCore = keywordId > 0 ? 'SELECT DISTINCT' : 'SELECT';
      const sql = `
        ${selectCore} r.id, r.id_theme, r.source, r.author, r.title,
               LEFT(r.text, 1200) AS text, r.link, r.hash,
               DATE_FORMAT(r.date, "%d") AS jour,
               DATE_FORMAT(r.date, "%c") AS numero_mois,
               DATE_FORMAT(r.date, "%Y %T") AS annee_heure
        ${filters}
        ${orderSql(tri)}
        LIMIT :lim_offset, :lim_count`;
      const [rows] = await pool.query(sql, {
        ...params,
        lim_offset: pagination.offset,
        lim_count: perPage,
      });
      const withKw = await attachKeywords(rows);
      return { rows: withKw, ...pagination };
    },

    async listEditorialInbox(opts) {
      return this.listInbox(opts);
    },

    async navCounts() {
      const [[n]] = await pool.query(
        `SELECT COUNT(*) AS c FROM rss_post WHERE ${rssEditorialInboxSql()}`
      );
      const [[s]] = await pool.query(
        `SELECT COUNT(*) AS c FROM rss_post WHERE ${rssSentSql()}`
      );
      const [[d]] = await pool.query(
        `SELECT COUNT(*) AS c FROM rss_post WHERE ${rssDeletedSql()}`
      );
      return {
        new: Number(n.c || 0),
        sent: Number(s.c || 0),
        deleted: Number(d.c || 0),
      };
    },

    async markSent(postId, { idTheme = null, dateAddTheme = null } = {}) {
      if (idTheme != null) {
        await pool.query(
          `UPDATE rss_post SET sent = 1, new = 0, deleted = 0, id_theme = ?, date_add_theme = ? WHERE id = ?`,
          [idTheme, dateAddTheme || nowSql(), postId]
        );
      } else {
        await pool.query(
          `UPDATE rss_post SET sent = 1, new = 0, deleted = 0 WHERE id = ?`,
          [postId]
        );
      }
      return true;
    },

    async markAlert(postId, { isAlert, dateAddTheme }) {
      await pool.query(
        `UPDATE rss_post SET sent = 1, new = 0, deleted = 0, alert = ?, date_add_theme = ? WHERE id = ?`,
        [isAlert ? 1 : 0, dateAddTheme, postId]
      );
      return true;
    },

    async markDeleted(postId) {
      await pool.query(
        `UPDATE rss_post SET sent = 0, new = 0, deleted = 1 WHERE id = ?`,
        [postId]
      );
      return true;
    },

    async deleteAllNew() {
      const [res] = await pool.query(
        `UPDATE rss_post SET bin = 1, new = 0, deleted = 1, sent = 0
         WHERE bin = 0 AND new = 1 AND deleted = 0 AND sent = 0`
      );
      return res.affectedRows || 0;
    },

    async markDesk(postId) {
      await pool.query(
        `UPDATE rss_post SET sent = 1, new = 0, deleted = 0, breve_spip = 1 WHERE id = ?`,
        [postId]
      );
      return true;
    },

    async listAlertUsers() {
      const [rows] = await pool.query(
        'SELECT id, mail, dash, themes FROM users WHERE active = 1 AND notif = 1'
      );
      return rows;
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
      const [rows] = await pool.query(
        'SELECT dash_id FROM dash_keys WHERE expired = 0'
      );
      return rows.map((r) => r.dash_id);
    },

    async sectionFollowsTheme(dashId, themeId) {
      void dashId;
      void themeId;
      return false;
    },

    async sectionAlertTokens(dashId) {
      void dashId;
      return [];
    },

    async linkAuthorIfKnown(post) {
      const authorName = String(post.author || '');
      if (!authorName || authorName === 'Auteur inconnu') return false;
      const link = String(post.link || '');
      if (!link) return false;
      const [authors] = await pool.query(
        'SELECT id FROM authors WHERE name = ? LIMIT 1',
        [authorName]
      );
      if (!authors[0]) return false;
      const [exists] = await pool.query(
        'SELECT 1 FROM authors_posts WHERE link = ? LIMIT 1',
        [link]
      );
      if (exists[0]) return false;
      await pool.query(
        'INSERT INTO authors_posts(id_author, title, link, source, date) VALUES (?,?,?,?,?)',
        [
          authors[0].id,
          String(post.title || ''),
          link,
          String(post.source || ''),
          post.date || nowSql(),
        ]
      );
      return true;
    },

    // --- refresh / cron surface (disposable MySQL only) ---

    async listRssUrls() {
      requireRefreshWrites();
      const [rows] = await pool.query(
        'SELECT url, name, audience, theme FROM rss_url WHERE url IS NOT NULL AND url != ""'
      );
      return rows.map((u) => ({
        url: String(u.url),
        name: String(u.name || ''),
        audience: String(u.audience || 'editorial'),
        theme: u.theme != null ? String(u.theme) : '',
      }));
    },

    async loadKeywordData() {
      requireRefreshWrites();
      const [keywords] = await pool.query(
        'SELECT id_keyword, name_keyword FROM keyword'
      );
      const aliases = [];
      try {
        const [aliasRows] = await pool.query(`
          SELECT keyword.id_keyword, alias.name_alias
          FROM keyword
          INNER JOIN keyword_alias ON keyword.id_keyword = keyword_alias.id_keyword
          INNER JOIN alias ON alias.id_alias = keyword_alias.id_alias
        `);
        for (const row of aliasRows) {
          aliases.push({
            id_keyword: Number(row.id_keyword),
            name_alias: String(row.name_alias),
          });
        }
      } catch {
        /* disposable tables may be empty / absent on older benches */
      }
      try {
        const [legacy] = await pool.query(
          `SELECT id_keyword, alias_keyword FROM keyword
           WHERE alias_keyword IS NOT NULL AND TRIM(alias_keyword) <> ''`
        );
        for (const row of legacy) {
          for (const part of String(row.alias_keyword).split(',')) {
            const name_alias = part.trim();
            if (name_alias) {
              aliases.push({
                id_keyword: Number(row.id_keyword),
                name_alias,
              });
            }
          }
        }
      } catch {
        /* column optional */
      }
      return {
        keywords: keywords.map((k) => ({
          id_keyword: Number(k.id_keyword),
          name_keyword: String(k.name_keyword),
        })),
        aliases,
      };
    },

    async countByHash(hash) {
      requireRefreshWrites();
      const [[row]] = await pool.query(
        'SELECT COUNT(*) AS c FROM rss_post WHERE hash = ?',
        [hash]
      );
      return Number(row?.c || 0);
    },

    async markAllNewAsBin() {
      requireRefreshWrites();
      const [res] = await pool.query('UPDATE rss_post SET bin = 1 WHERE new = 1');
      return res.affectedRows || 0;
    },

    async clearBinByHash(hash) {
      requireRefreshWrites();
      const [res] = await pool.query('UPDATE rss_post SET bin = 0 WHERE hash = ?', [
        hash,
      ]);
      return res.affectedRows || 0;
    },

    async insertRssPost(row) {
      requireRefreshWrites();
      const [res] = await pool.query(
        `INSERT INTO rss_post (date, source, title, text, author, link, hash, new, bin, sent, deleted, alert, id_theme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.date,
          row.source,
          row.title,
          row.text,
          row.author || '',
          row.link,
          row.hash,
          row.new ?? 1,
          row.bin ?? 0,
          row.sent ?? 0,
          row.deleted ?? 0,
          row.alert ?? 0,
          row.id_theme ?? 0,
        ]
      );
      return { id: res.insertId, ...row };
    },

    async attachPostKeyword(hash, idKeyword) {
      requireRefreshWrites();
      const [res] = await pool.query(
        'INSERT IGNORE INTO post_keyword (hash_post, id_keyword) VALUES (?, ?)',
        [hash, Number(idKeyword)]
      );
      return (res.affectedRows || 0) > 0;
    },

    async trashLowKeywordHash(hash) {
      requireRefreshWrites();
      const [res] = await pool.query(
        'UPDATE rss_post SET new = 0, deleted = 1 WHERE hash = ?',
        [hash]
      );
      return res.affectedRows || 0;
    },

    /**
     * Purge older posts.
     * Prod: PHP parity via DATE_SUB(NOW(), INTERVAL ? DAY).
     * Disposable benches: injectable cutoff for deterministic tests.
     */
    async deleteOlderThanDays(days, nowMs = Date.now()) {
      requireRefreshWrites();
      if (days < 1) return 0;
      let removed = 0;
      for (;;) {
        let hashes;
        if (config.prodRefresh) {
          const [rows] = await pool.query(
            'SELECT hash FROM rss_post WHERE date < DATE_SUB(NOW(), INTERVAL ? DAY) LIMIT 2000',
            [days]
          );
          hashes = rows;
        } else {
          const cutoff = new Date(nowMs - days * 864e5)
            .toISOString()
            .slice(0, 19)
            .replace('T', ' ');
          const [rows] = await pool.query(
            'SELECT hash FROM rss_post WHERE date < ? LIMIT 2000',
            [cutoff]
          );
          hashes = rows;
        }
        if (!hashes.length) break;
        const list = hashes.map((h) => h.hash);
        const ph = list.map(() => '?').join(',');
        await pool.query(
          `DELETE FROM post_keyword WHERE hash_post IN (${ph})`,
          list
        );
        const [del] = await pool.query(
          `DELETE FROM rss_post WHERE hash IN (${ph})`,
          list
        );
        removed += del.affectedRows || 0;
        if (list.length < 2000) break;
      }
      return removed;
    },

    async deleteStaleBinUnsent() {
      requireRefreshWrites();
      await pool.query(`
        DELETE pk FROM post_keyword pk
        INNER JOIN rss_post r ON r.hash = pk.hash_post
        WHERE r.bin = 1 AND r.sent = 0 AND r.deleted = 0
      `);
      const [del] = await pool.query(
        'DELETE FROM rss_post WHERE bin = 1 AND sent = 0 AND deleted = 0'
      );
      return del.affectedRows || 0;
    },

    async getRefreshRow() {
      requireRefreshWrites();
      const [rows] = await pool.query(
        'SELECT status, last_refresh, last_update, current FROM refresh_rss WHERE id = 1 LIMIT 1'
      );
      return rows[0] || null;
    },

    async setRefreshStatus(status) {
      requireRefreshWrites();
      await pool.query('UPDATE refresh_rss SET status = ? WHERE id = 1', [
        String(status),
      ]);
    },

    async setRefreshCurrent(n) {
      requireRefreshWrites();
      await pool.query('UPDATE refresh_rss SET current = ? WHERE id = 1', [
        Number(n) || 0,
      ]);
    },

    async setLastRefresh(ts) {
      requireRefreshWrites();
      await pool.query('UPDATE refresh_rss SET last_refresh = ? WHERE id = 1', [ts]);
    },

    async touchRefreshActivity(ts) {
      requireRefreshWrites();
      await pool.query('UPDATE refresh_rss SET last_update = ? WHERE id = 1', [ts]);
    },
  };
}

async function addColumnIfMissing(pool, table, column, definition) {
  try {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (err) {
    const msg = String(err?.message || err);
    if (!/Duplicate column/i.test(msg)) throw err;
  }
}

async function initDisposableSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rss_url (
      name VARCHAR(255) PRIMARY KEY,
      audience VARCHAR(32) NOT NULL DEFAULT 'editorial',
      url VARCHAR(512) NULL,
      theme VARCHAR(64) NULL,
      UNIQUE KEY uq_rss_url_url (url)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await addColumnIfMissing(pool, 'rss_url', 'url', 'VARCHAR(512) NULL');
  await addColumnIfMissing(pool, 'rss_url', 'theme', 'VARCHAR(64) NULL');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS theme (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS keyword (
      id_keyword INT PRIMARY KEY AUTO_INCREMENT,
      name_keyword VARCHAR(120) NOT NULL,
      alias_keyword TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await addColumnIfMissing(pool, 'keyword', 'alias_keyword', 'TEXT NULL');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS alias (
      id_alias INT PRIMARY KEY AUTO_INCREMENT,
      name_alias VARCHAR(120) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS keyword_alias (
      id_keyword INT NOT NULL,
      id_alias INT NOT NULL,
      PRIMARY KEY (id_keyword, id_alias)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_keyword (
      hash_post VARCHAR(64) NOT NULL,
      id_keyword INT NOT NULL,
      PRIMARY KEY (hash_post, id_keyword)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rss_post (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title TEXT,
      text MEDIUMTEXT,
      source VARCHAR(255),
      link TEXT,
      author VARCHAR(255),
      date DATETIME,
      hash VARCHAR(64),
      bin TINYINT NOT NULL DEFAULT 0,
      new TINYINT NOT NULL DEFAULT 1,
      sent TINYINT NOT NULL DEFAULT 0,
      deleted TINYINT NOT NULL DEFAULT 0,
      alert TINYINT NOT NULL DEFAULT 0,
      id_theme INT NOT NULL DEFAULT 0,
      date_add_theme DATETIME NULL,
      breve_spip TINYINT NOT NULL DEFAULT 0,
      KEY idx_inbox (bin, new, sent, deleted),
      KEY idx_hash (hash)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_rss (
      id INT PRIMARY KEY,
      status VARCHAR(32) NOT NULL DEFAULT '0',
      last_refresh DATETIME NULL,
      last_update DATETIME NULL,
      current INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(
    `INSERT IGNORE INTO refresh_rss (id, status, last_refresh, last_update, current)
     VALUES (1, '0', NULL, NULL, 0)`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      mail VARCHAR(255),
      dash VARCHAR(64),
      themes VARCHAR(255),
      active TINYINT NOT NULL DEFAULT 1,
      notif TINYINT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dash_keys (
      dash_id VARCHAR(64) PRIMARY KEY,
      expired TINYINT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS authors (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS authors_posts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      id_author INT NOT NULL,
      title TEXT,
      link TEXT,
      source VARCHAR(255),
      date DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}
