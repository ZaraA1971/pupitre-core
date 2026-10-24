/**
 * Orchestrate manual vs cron refresh with lock — no HTTP, no crontab install.
 */
import {
  cronRefreshOptions,
  manualRefreshOptions,
  runRssRefresh,
} from './rss-refresh-engine.mjs';
import { createRssLock, sqlNow } from './rss-lock.mjs';
import { createVigieIngress } from './vigie-ingress.mjs';

/**
 * @param {object} opts
 * @param {'manual'|'cron'} opts.mode
 * @param {object} opts.db
 * @param {Function} opts.loadFeed
 * @param {Function} [opts.hashItem]
 * @param {() => number} [opts.nowMs]
 * @param {boolean} [opts.disableExternal]
 * @param {object} [opts.vigie]
 */
export async function runRefreshOnce({
  mode = 'manual',
  db,
  loadFeed,
  hashItem,
  nowMs = () => Date.now(),
  disableExternal = true,
  vigie,
} = {}) {
  if (!disableExternal) {
    throw new Error(
      'runRefreshOnce refuse disableExternal=false sur ce banc (feeds/Vigie réels interdits).'
    );
  }

  const lock = createRssLock({ db, nowMs });
  await lock.tryUnlock();
  if (await lock.isLocked()) {
    return {
      ok: false,
      busy: true,
      exitCode: mode === 'cron' ? 2 : 0,
      message: 'Already Processing.',
    };
  }

  await lock.setBusy(true);
  const options = mode === 'cron' ? cronRefreshOptions() : manualRefreshOptions();
  const vigieClient =
    vigie ||
    createVigieIngress({
      disableExternal: true,
    });

  try {
    const stats = await runRssRefresh({
      db,
      loadFeed,
      hashItem,
      nowMs,
      vigie: vigieClient,
      ...options,
    });
    const ts = sqlNow(nowMs);
    await db.setLastRefresh(ts);
    if (typeof db.touchRefreshActivity === 'function') {
      await db.touchRefreshActivity(ts);
    }
    await lock.setBusy(false);
    return {
      ok: true,
      busy: false,
      mode,
      stats,
      vigieLog: vigieClient.log,
      lastRefresh: ts,
    };
  } catch (err) {
    try {
      await lock.setBusy(false);
    } catch {
      /* ignore */
    }
    throw err;
  }
}
