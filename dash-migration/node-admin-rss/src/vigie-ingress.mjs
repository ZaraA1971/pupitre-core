/**
 * Vigie ingress injection point — parity shape with vigie_ingress_push_infos.
 * With disableExternal=true (required on this bench): record only, never HTTP.
 */

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
