import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Parity with shared/Password.php (md5 legacy path).
 * Bcrypt ($2y$/$2a$) is recognized but not verified without a crypto dep —
 * fixtures use md5 for this local lot.
 */
export function looksLikeMd5(hash) {
  return typeof hash === 'string' && hash.length === 32 && /^[a-f0-9]+$/i.test(hash);
}

export function md5(plain) {
  return createHash('md5').update(String(plain), 'utf8').digest('hex');
}

/**
 * @param {string} plain
 * @param {string} storedHash
 * @returns {boolean}
 */
export function verifyPassword(plain, storedHash) {
  const stored = String(storedHash || '');
  if (!stored) return false;
  if (looksLikeMd5(stored)) {
    const got = Buffer.from(md5(plain), 'utf8');
    const want = Buffer.from(stored.toLowerCase(), 'utf8');
    return got.length === want.length && timingSafeEqual(got, want);
  }
  if (stored.startsWith('$2y$') || stored.startsWith('$2a$') || stored.startsWith('$2b$')) {
    throw new Error(
      'Bcrypt password present but unsupported on this fixtures bench (use md5 fixture users).'
    );
  }
  return false;
}
