/**
 * Verrou refresh_rss — parity with admin/inc/rss-refresh.php.
 * Clock injectable via nowMs(); no network.
 */

export const DEFAULT_LOCK_CONFIG = {
  maxAgeSeconds: 600,
  phantomMinIdleSeconds: 90,
  phantomTsToleranceSeconds: 600,
};

export function statusPair(overrides = {}) {
  return {
    idle: overrides.idle ?? '0',
    busy: overrides.busy ?? '1',
  };
}

export function statusIsBusy(raw, pair = statusPair()) {
  const busy = String(pair.busy).trim();
  const idle = String(pair.idle).trim();
  const t = String(raw ?? '').trim();
  if (t === '' || t === idle || t === '0') return false;
  if (t === busy || t === '1') return true;
  if (t.toLowerCase() === 'busy' || t.toLowerCase() === 'processing') return true;
  return false;
}

function parseSqlTs(raw) {
  if (raw == null || raw === '' || raw === '0000-00-00 00:00:00') return null;
  // mysql2 may return JS Date for DATETIME — use epoch directly (no TZ re-parse).
  if (raw instanceof Date) {
    const t = raw.getTime();
    return Number.isFinite(t) ? Math.floor(t / 1000) : null;
  }
  const s = String(raw).trim().replace(' ', 'T');
  // Treat SQL DATETIME as UTC wall clock for disposable benches (documented deviation).
  const t = Date.parse(s.endsWith('Z') ? s : `${s}Z`);
  return Number.isFinite(t) ? Math.floor(t / 1000) : null;
}

/**
 * @param {object} opts
 * @param {{ getRefreshRow: Function, setRefreshStatus: Function, setRefreshCurrent?: Function, touchRefreshActivity?: Function }} opts.db
 * @param {() => number} [opts.nowMs]
 * @param {Partial<typeof DEFAULT_LOCK_CONFIG>} [opts.lockConfig]
 * @param {{ idle: string|number, busy: string|number }} [opts.pair]
 */
export function createRssLock({
  db,
  nowMs = () => Date.now(),
  stamp = null,
  lockConfig = {},
  pair = statusPair(),
} = {}) {
  const cfg = { ...DEFAULT_LOCK_CONFIG, ...lockConfig };
  const makeTs =
    typeof stamp === 'function' ? stamp : () => sqlNow(nowMs);

  async function setBusy(busy) {
    await db.setRefreshStatus(busy ? pair.busy : pair.idle);
    if (busy && typeof db.touchRefreshActivity === 'function') {
      await db.touchRefreshActivity(makeTs());
    }
  }

  async function resetLock(reason) {
    await setBusy(false);
    if (typeof db.setRefreshCurrent === 'function') {
      try {
        await db.setRefreshCurrent(0);
      } catch {
        /* column optional */
      }
    }
    return reason;
  }

  async function releaseIfStale() {
    const row = await db.getRefreshRow();
    if (!row || !statusIsBusy(row.status, pair)) return false;
    if (row.last_update == null && row.last_update !== 0) {
      // activity unsupported when last_update never set and column unused — PHP returns false if column absent
    }
    const hasActivity = Object.prototype.hasOwnProperty.call(row, 'last_update');
    if (!hasActivity) return false;

    const now = Math.floor(nowMs() / 1000);
    const lastTouch = parseSqlTs(row.last_update);
    const lastRefreshTs = parseSqlTs(row.last_refresh);
    let stale = false;
    let reason = '';

    if (lastTouch === null) {
      stale = true;
      reason = 'status occupé, last_update vide';
    } else if (now - lastTouch > cfg.maxAgeSeconds) {
      stale = true;
      reason = `heartbeat expiré (${row.last_update})`;
    } else if (lastRefreshTs !== null && lastTouch <= lastRefreshTs) {
      stale = true;
      reason = 'occupé mais last_update <= last_refresh';
    }

    if (!stale) return false;
    await resetLock(reason);
    return true;
  }

  async function releasePhantomBusy() {
    const row = await db.getRefreshRow();
    if (!row || !statusIsBusy(row.status, pair)) return false;
    if (row.last_update == null || row.last_refresh == null) return false;
    const touch = parseSqlTs(row.last_update);
    const refresh = parseSqlTs(row.last_refresh);
    if (touch === null || refresh === null) return false;
    const endedAt = Math.max(touch, refresh);
    const now = Math.floor(nowMs() / 1000);
    if (now - endedAt < cfg.phantomMinIdleSeconds) return false;
    if (Math.abs(touch - refresh) > cfg.phantomTsToleranceSeconds) return false;
    await resetLock('verrou fantôme (refresh terminé, status bloqué)');
    return true;
  }

  async function tryUnlock() {
    if (await releaseIfStale()) return true;
    return releasePhantomBusy();
  }

  async function isLocked() {
    const row = await db.getRefreshRow();
    return Boolean(row && statusIsBusy(row.status, pair));
  }

  return {
    pair,
    cfg,
    setBusy,
    resetLock,
    tryUnlock,
    isLocked,
    releaseIfStale,
    releasePhantomBusy,
    statusIsBusy: (raw) => statusIsBusy(raw, pair),
  };
}

export function sqlNow(nowMsFn = () => Date.now()) {
  const ms = typeof nowMsFn === 'function' ? nowMsFn() : Number(nowMsFn);
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Format SQL DATETIME in an IANA timezone (PHP cron uses Europe/Paris).
 * @param {number|(() => number)} nowMsFn
 * @param {string} timeZone
 */
export function sqlNowInZone(nowMsFn = () => Date.now(), timeZone = 'Europe/Paris') {
  const ms = typeof nowMsFn === 'function' ? nowMsFn() : Number(nowMsFn);
  if (!timeZone || timeZone === 'UTC') return sqlNow(ms);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms));
  const get = (type) => parts.find((p) => p.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}
