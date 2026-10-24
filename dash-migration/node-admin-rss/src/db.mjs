import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createFakeAdminDb } from './fake-db.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));

export function loadFixtureSeed() {
  const file = path.resolve(root, '../fixtures/seed.json');
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** @param {ReturnType<import('./config.mjs').loadConfig>} config */
export async function createAdminDb(config) {
  if (config.mode === 'fixtures') {
    return createFakeAdminDb(loadFixtureSeed());
  }
  if (config.mode === 'mysql') {
    const { createMysqlAdminDb } = await import('./mysql-db.mjs');
    return createMysqlAdminDb(config);
  }
  throw new Error(`Mode DB inconnu: ${config.mode}`);
}
