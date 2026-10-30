import { createFakeClientDb, loadFixtureSeed } from './fake-db.mjs';
import { createMysqlClientDb } from './mysql-db.mjs';

export { loadFixtureSeed };

/**
 * @param {ReturnType<import('./config.mjs').loadConfig>} config
 */
export async function createClientDb(config) {
  if (config.mode === 'mysql') {
    return createMysqlClientDb(config);
  }
  return createFakeClientDb(loadFixtureSeed());
}
