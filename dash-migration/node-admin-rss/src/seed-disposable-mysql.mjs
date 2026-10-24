/**
 * Wipe + load seed into a disposable MySQL/MariaDB.
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
    'keyword_alias',
    'alias',
    'keyword',
    'rss_post',
    'theme',
    'rss_url',
  ]) {
    try {
      await pool.query(`DELETE FROM ${t}`);
    } catch {
      /* table may not exist yet on older benches */
    }
  }
  await pool.query('SET FOREIGN_KEY_CHECKS=1');

  await pool.query(
    `INSERT INTO refresh_rss (id, status, last_refresh, last_update, current)
     VALUES (1, '0', NULL, NULL, 0)
     ON DUPLICATE KEY UPDATE status='0', last_refresh=NULL, last_update=NULL, current=0`
  );

  for (const row of seed.rss_url || []) {
    await pool.query(
      'INSERT INTO rss_url(name, audience, url, theme) VALUES (?, ?, ?, ?)',
      [
        row.name,
        row.audience || 'editorial',
        row.url || null,
        row.theme || null,
      ]
    );
  }
  for (const row of seed.theme || []) {
    await pool.query('INSERT INTO theme(id, name) VALUES (?, ?)', [row.id, row.name]);
  }
  for (const row of seed.keyword || []) {
    await pool.query(
      'INSERT INTO keyword(id_keyword, name_keyword, alias_keyword) VALUES (?, ?, ?)',
      [row.id_keyword, row.name_keyword, row.alias_keyword || null]
    );
  }
  for (const row of seed.alias || []) {
    await pool.query('INSERT INTO alias(id_alias, name_alias) VALUES (?, ?)', [
      row.id_alias,
      row.name_alias,
    ]);
  }
  for (const row of seed.keyword_alias || []) {
    await pool.query(
      'INSERT INTO keyword_alias(id_keyword, id_alias) VALUES (?, ?)',
      [row.id_keyword, row.id_alias]
    );
  }
  // Flat aliases from seed.aliases → disposable alias + keyword_alias rows
  let nextAliasId = 1000;
  for (const row of seed.aliases || []) {
    const idAlias = nextAliasId++;
    await pool.query('INSERT INTO alias(id_alias, name_alias) VALUES (?, ?)', [
      idAlias,
      row.name_alias,
    ]);
    await pool.query(
      'INSERT INTO keyword_alias(id_keyword, id_alias) VALUES (?, ?)',
      [row.id_keyword, idAlias]
    );
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
  if (seed.refresh_rss) {
    const r = seed.refresh_rss;
    await pool.query(
      `UPDATE refresh_rss SET status=?, last_refresh=?, last_update=?, current=? WHERE id=1`,
      [
        r.status ?? '0',
        r.last_refresh ?? null,
        r.last_update ?? null,
        r.current ?? 0,
      ]
    );
  }

  const [[c]] = await pool.query('SELECT COUNT(*) AS n FROM rss_post');
  return Number(c.n);
}
