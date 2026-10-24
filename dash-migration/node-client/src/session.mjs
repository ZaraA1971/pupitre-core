import { randomBytes } from 'node:crypto';

const GUEST_USER_ID = 999;
const COOKIE = 'dash_client_sid';

/**
 * In-memory session store (local bench only).
 */
export function createSessionStore({ ttlSeconds }) {
  /** @type {Map<string, { userId: number, login: string, expires: number }>} */
  const store = new Map();

  function purge() {
    const now = Date.now();
    for (const [id, s] of store) {
      if (s.expires <= now) store.delete(id);
    }
  }

  function create(userId, login) {
    purge();
    const id = randomBytes(24).toString('hex');
    store.set(id, {
      userId: Number(userId),
      login: String(login),
      expires: Date.now() + ttlSeconds * 1000,
    });
    return id;
  }

  function get(id) {
    if (!id) return null;
    purge();
    const s = store.get(id);
    if (!s) return null;
    if (s.expires <= Date.now()) {
      store.delete(id);
      return null;
    }
    if (!s.userId || s.userId === GUEST_USER_ID) return null;
    return s;
  }

  function destroy(id) {
    if (id) store.delete(id);
  }

  return { create, get, destroy, COOKIE, GUEST_USER_ID };
}

export function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function sessionCookieHeader(name, value, ttlSeconds, { clear = false } = {}) {
  if (clear) {
    return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttlSeconds}`;
}
