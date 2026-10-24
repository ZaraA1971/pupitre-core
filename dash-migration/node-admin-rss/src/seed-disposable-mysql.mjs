/**
 * Wipe + load fixtures/seed.json into a disposable MySQL/MariaDB.
 * Only for DASH_DB_ALLOW_SCHEMA_INIT=1 benches — never production.
 */
import { loadFixtureSeed } from './db.mjs';

/**
 * @param {import('mysql2/promise').Pool} pool
 * @param {object} [seed]
 */
export async function seedDisposableMysql(pool, seed = loadFixtureSeed()) {
  await pool.query('SET FOREIGN_KEY_CHECKS=0');
  for (const t of [
    'authors_posts',
    'authors',
    'dash_keys',
    'users',
    'post_keyword',
    'keyword',
    'rss_post',
    'theme',
    'rss_url',
  ]) {
    await pool.query(`TRUNCATE TABLE ${t}`);
  }
  await pool.query('SET FOREIGN_KEY_CHECKS=1');

  for (const row of seed.rss_url || []) {
    await pool.query('INSERT INTO rss_url(name, audience) VALUES (?, ?)', [
      row.name,
      row.audience || 'editorial',
    ]);
  }
  for (const row of seed.theme || []) {
    await pool.query('INSERT INTO theme(id, name) VALUES (?, ?)', [row.id, row.name]);
  }
  for (const row of seed.keyword || []) {
    await pool.query('INSERT INTO keyword(id_keyword, name_keyword) VALUES (?, ?)', [
      row.id_keyword,
      row.name_keyword,
    ]);
  }
  for (const row of seed.rss_post || []) {
    await pool.query(
      `INSERT INTO rss_post(
        id, title, text, source, link, author, date, hash,
        bin, new, sent, deleted, alert, id_theme, breve_spip
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        row.new ?? 1,
        row.sent ?? 0,
        row.deleted ?? 0,
        row.alert ?? 0,
        row.id_theme ?? 0,
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
  for (const row of seed.users || []) {
    await pool.query(
      'INSERT INTO users(id, mail, dash, themes, active, notif) VALUES (?,?,?,?,?,?)',
      [row.id, row.mail, row.dash, row.themes, row.active ?? 1, row.notif ?? 0]
    );
  }
  for (const row of seed.authors || []) {
    await pool.query('INSERT INTO authors(id, name) VALUES (?, ?)', [row.id, row.name]);
  }
  for (const row of seed.dash_keys || []) {
    await pool.query('INSERT INTO dash_keys(dash_id, expired) VALUES (?, ?)', [
      row.dash_id,
      row.expired ?? 0,
    ]);
  }

  const [[c]] = await pool.query('SELECT COUNT(*) AS n FROM rss_post');
  return Number(c.n);
}
