/**
 * Vigie ingress injection point — parity shape with vigie_ingress_push_infos.
 * With disableExternal=true (bank default): record only, never HTTP.
 * Prod: createLocalVigiePush → POST http://127.0.0.1:8790/ingress
 */
import { readFileSync } from 'node:fs';

/**
 * @param {{ disableExternal?: boolean, push?: (event: object) => Promise<boolean>|boolean, log?: object[] }} opts
 */
export function createVigieIngress({ disableExternal = true, push, log = [] } = {}) {
  async function pushOne(event) {
    log.push({ kind: 'vigie', event, at: Date.now() });
    if (disableExternal) {
      return { ok: true, skipped: true };
    }
    if (typeof push === 'function') {
      return push(event);
    }
    throw new Error(
      'Vigie push réel non configuré. Garder DASH_DISABLE_EXTERNAL=1 sur ce banc.'
    );
  }

  /** @param {object[]} events */
  async function pushInfos(events) {
    const list = Array.isArray(events) ? events : [];
    const n = list.length;
    for (let i = 0; i < n; i++) {
      const event = {
        ...list[i],
        source: list[i].source ?? 'dash',
        kind: 'info',
        drain: i === n - 1,
      };
      await pushOne(event);
    }
    return { count: n, skipped: disableExternal };
  }

  return { log, pushOne, pushInfos, disableExternal };
}

/**
 * Read INCIDENT_HUB_TOKEN / VIGIE_INGRESS_TOKEN from a dotenv-like file.
 * @param {string} filePath
 */
export function readVigieTokenFromFile(filePath) {
  try {
    const text = readFileSync(filePath, 'utf8');
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const m = /^(?:INCIDENT_HUB_TOKEN|VIGIE_INGRESS_TOKEN)\s*=\s*(.*)$/.exec(t);
      if (!m) continue;
      let v = m[1].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (v) return v;
    }
  } catch {
    /* absent */
  }
  return '';
}

/**
 * HTTP push matching admin/inc/vigie_ingress.php (localhost only).
 * @param {{ url?: string, token?: string, tokenFile?: string, fetchImpl?: typeof fetch, timeoutMs?: number }} opts
 */
export function createLocalVigiePush({
  url = 'http://127.0.0.1:8790/ingress',
  token = '',
  tokenFile = '',
  fetchImpl = globalThis.fetch,
  timeoutMs = 4000,
} = {}) {
  let resolved = String(token || '').trim();
  if (!resolved && tokenFile) {
    resolved = readVigieTokenFromFile(tokenFile);
  }

  return async function push(event) {
    const parsed = new URL(url);
    if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
      throw new Error(`Vigie ingress hôte refusé (${parsed.hostname}) — localhost seulement.`);
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const headers = { 'content-type': 'application/json' };
      if (resolved) headers['x-incident-token'] = resolved;
      const res = await fetchImpl(parsed.href, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
        signal: ctrl.signal,
      });
      return { ok: res.ok, status: res.status };
    } catch (err) {
      return { ok: false, error: String(err?.message || err) };
    } finally {
      clearTimeout(timer);
    }
  };
}
