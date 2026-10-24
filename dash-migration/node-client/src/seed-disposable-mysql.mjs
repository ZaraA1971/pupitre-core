/**
 * Wipe + load client fixture seed into disposable MySQL.
 * Requires DASH_DB_ALLOW_SCHEMA_INIT=1. Never production.
 */
import { loadFixtureSeed } from './fake-db.mjs';
import { initClientDisposableSchema } from './mysql-db.mjs';

/**
 * @param {import('mysql2/promise').Pool} pool
 * @param {object} [seed]
 */
export async function seedClientDisposableMysql(pool, seed = loadFixtureSeed()) {
  await initClientDisposableSchema(pool);

  await pool.query('SET FOREIGN_KEY_CHECKS=0');
  for (const t of [
    'client_users',
    'client_config',
    'post_keyword',
    'rss_post',
    'keyword',
    'theme',
  ]) {
    try {
      await pool.query(`DELETE FROM ${t}`);
    } catch {
      /* ignore */
    }
  }
  await pool.query('SET FOREIGN_KEY_CHECKS=1');

  for (const row of seed.theme || []) {
    await pool.query('INSERT INTO theme(id, name) VALUES (?, ?)', [row.id, row.name]);
  }
  for (const row of seed.keyword || []) {
    await pool.query(
      'INSERT INTO keyword(id_keyword, name_keyword, alias_keyword) VALUES (?, ?, NULL)',
      [row.id_keyword, row.name_keyword]
    );
  }
  for (const row of seed.rss_post || []) {
    await pool.query(
      `INSERT INTO rss_post(
        id, title, text, source, link, author, date, hash,
        bin, new, sent, deleted, alert, id_theme, date_add_theme, breve_spip
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        row.id,
        row.title,
        row.text,
        row.source,
        row.link,
        row.author || '',
        row.date,
        row.hash,
        row.bin ?? 0,
        row.new ?? 0,
        row.sent ?? 1,
        row.deleted ?? 0,
        row.alert ?? 0,
        row.id_theme ?? 0,
        row.date_add_theme || row.date,
        row.breve_spip ?? 0,
      ]
    );
  }
  for (const row of seed.post_keyword || []) {
    await pool.query('INSERT INTO post_keyword(hash_post, id_keyword) VALUES (?, ?)', [
      row.hash_post,
      row.id_keyword,
    ]);
  }
  for (const idTheme of seed.config_themes || []) {
    await pool.query('INSERT INTO client_config(id_theme) VALUES (?)', [idTheme]);
  }
  for (const row of seed.users || []) {
    await pool.query(
      `INSERT INTO client_users(
        id_user, login_user, pass_user, active_user, admin_user, help, last_connexion
      ) VALUES (?,?,?,?,?,?,?)`,
      [
        row.id_user,
        row.login_user,
        row.pass_user,
        row.active_user ?? 1,
        row.admin_user ?? '0',
        row.help ?? '1',
        row.last_connexion || null,
      ]
    );
  }

  const [[{ c }]] = await pool.query('SELECT COUNT(*) AS c FROM rss_post');
  return Number(c);
}
