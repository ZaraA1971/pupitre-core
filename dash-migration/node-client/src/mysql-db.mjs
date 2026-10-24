import {
  assertClientMysqlWritesAllowed,
  assertLoopbackDisposableMysql,
} from './config.mjs';

/**
 * MySQL adapter for client read path on disposable schema.
 * Reuses theme/keyword/rss_post; client session tables are client_users / client_config
 * (admin `users` shape differs — never overwrite it with client credentials).
 */
export async function createMysqlClientDb(config) {
  assertLoopbackDisposableMysql(config);

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
    dateStrings: true,
  });

  await pool.query('SELECT 1');

  if (config.allowSchemaInit) {
    await initClientDisposableSchema(pool);
  }

  function requireWrites() {
    assertClientMysqlWritesAllowed(config);
  }

  return {
    kind: 'mysql',
    pool,
    async close() {
      await pool.end();
    },

    async findUserByLogin(login) {
      const [rows] = await pool.query(
        `SELECT id_user, login_user, pass_user, active_user, admin_user, help, last_connexion
         FROM client_users WHERE login_user = ? LIMIT 1`,
        [login]
      );
      return rows[0] || null;
    },

    async findUserById(id) {
      const [rows] = await pool.query(
        `SELECT id_user, login_user, pass_user, active_user, admin_user, help, last_connexion
         FROM client_users WHERE id_user = ? LIMIT 1`,
        [id]
      );
      return rows[0] || null;
    },

    async userThemeIds(_userId) {
      const [rows] = await pool.query('SELECT id_theme FROM client_config ORDER BY id_theme');
      return rows.map((r) => Number(r.id_theme));
    },

    async listChrono({ themeIds, lastConnexion, offset = 0, limit = 25, textMax = 1200 }) {
      const themes = themeIds.map(Number).filter((n) => Number.isFinite(n));
      if (!themes.length) {
        return { newArticles: [], oldArticles: [] };
      }
      const ph = themes.map(() => '?').join(',');
      const lc = String(lastConnexion || '1970-01-01 00:00:00');
      const textLen = Number(textMax) || 1200;

      const selectList = `
        r.id AS id_post, r.id_theme, r.source, r.title,
        LEFT(r.text, ${textLen}) AS text, r.author, r.link, r.hash, r.alert,
        r.date, r.date_add_theme,
        DATE_FORMAT(r.date, '%Y-%m-%d') AS last_date,
        DATE_FORMAT(r.date, '%w') AS numero_jour,
        DATE_FORMAT(r.date, '%c') AS numero_mois,
        DATE_FORMAT(r.date, '%d') AS jour,
        DATE_FORMAT(r.date, '%Y') AS annee,
        DATE_FORMAT(r.date, '%H') AS heure,
        DATE_FORMAT(r.date, '%i') AS minute,
        t.name AS name
      `;

      const [newArticles] = await pool.query(
        `SELECT ${selectList}
         FROM rss_post r
         JOIN theme t ON r.id_theme = t.id
         WHERE r.id_theme IN (${ph})
           AND COALESCE(r.date_add_theme, r.date) > ?
         ORDER BY COALESCE(r.date_add_theme, r.date) DESC
         LIMIT ? OFFSET ?`,
        [...themes, lc, limit, offset]
      );

      const [oldArticles] = await pool.query(
        `SELECT ${selectList}
         FROM rss_post r
         JOIN theme t ON r.id_theme = t.id
         WHERE r.id_theme IN (${ph})
           AND COALESCE(r.date_add_theme, r.date) <= ?
         ORDER BY r.date DESC
         LIMIT ? OFFSET ?`,
        [...themes, lc, limit, offset]
      );

      return {
        newArticles: newArticles.map(normalizeChronoRow),
        oldArticles: oldArticles.map(normalizeChronoRow),
      };
    },

    async articlesByKeywordDay(keywordId, dateYmd) {
      const [rows] = await pool.query(
        `SELECT r.title, r.link, r.source, DATE_FORMAT(r.date, '%H:%i') AS cdate
         FROM rss_post r
         JOIN post_keyword pk ON pk.hash_post = r.hash
         JOIN keyword k ON k.id_keyword = pk.id_keyword
         WHERE pk.id_keyword = ?
           AND r.date LIKE ?
         ORDER BY r.date DESC`,
        [keywordId, `${dateYmd}%`]
      );
      return rows;
    },

    async timelineEvents() {
      const themes = await this.userThemeIds(0);
      if (!themes.length) return [];
      const ph = themes.map(() => '?').join(',');
      const [rows] = await pool.query(
        `SELECT r.date, r.title, LEFT(r.text, 200) AS description, r.link, t.name AS theme
         FROM rss_post r
         JOIN theme t ON r.id_theme = t.id
         WHERE r.id_theme IN (${ph})
         ORDER BY r.date ASC`,
        themes
      );
      return rows.map((r) => ({
        start: toIsoLocal(r.date),
        title: r.title,
        description: String(r.description || ''),
        link: r.link,
        theme: r.theme || '',
      }));
    },

    /** Exposed for seed script / tests. */
    async _requireWrites() {
      requireWrites();
    },
  };
}

function normalizeChronoRow(r) {
  return {
    ...r,
    id_post: Number(r.id_post),
    id_theme: Number(r.id_theme),
    alert: Number(r.alert || 0),
    numero_jour: Number(r.numero_jour),
    numero_mois: Number(r.numero_mois),
    jour: String(r.jour).padStart(2, '0'),
    heure: String(r.heure).padStart(2, '0'),
    minute: String(r.minute).padStart(2, '0'),
    name: r.name || '',
  };
}

function toIsoLocal(sqlTs) {
  const s = String(sqlTs || '').replace(' ', 'T');
  return s.length === 19 ? `${s}Z` : s;
}

/**
 * @param {import('mysql2/promise').Pool} pool
 */
export async function initClientDisposableSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS theme (
      id INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS keyword (
      id_keyword INT PRIMARY KEY,
      name_keyword VARCHAR(255) NOT NULL,
      alias_keyword VARCHAR(255) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_keyword (
      hash_post VARCHAR(64) NOT NULL,
      id_keyword INT NOT NULL,
      PRIMARY KEY (hash_post, id_keyword)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rss_post (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title TEXT NULL,
      text MEDIUMTEXT NULL,
      source VARCHAR(255) NULL,
      link TEXT NULL,
      author VARCHAR(255) NULL,
      date DATETIME NULL,
      hash VARCHAR(64) NULL,
      bin TINYINT NOT NULL DEFAULT 0,
      new TINYINT NOT NULL DEFAULT 1,
      sent TINYINT NOT NULL DEFAULT 0,
      deleted TINYINT NOT NULL DEFAULT 0,
      alert TINYINT NOT NULL DEFAULT 0,
      id_theme INT NOT NULL DEFAULT 0,
      date_add_theme DATETIME NULL,
      breve_spip TINYINT NOT NULL DEFAULT 0,
      KEY idx_hash (hash),
      KEY idx_theme (id_theme)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_users (
      id_user INT PRIMARY KEY,
      login_user VARCHAR(64) NOT NULL,
      pass_user VARCHAR(255) NOT NULL,
      active_user TINYINT NOT NULL DEFAULT 1,
      admin_user VARCHAR(8) NOT NULL DEFAULT '0',
      help VARCHAR(8) NOT NULL DEFAULT '1',
      last_connexion DATETIME NULL,
      UNIQUE KEY uq_login (login_user)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_config (
      id_theme INT PRIMARY KEY
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}
