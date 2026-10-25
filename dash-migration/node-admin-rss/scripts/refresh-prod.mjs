#!/usr/bin/env node
/**
 * Production Dash RSS refresh worker (Node).
 *
 * Requires explicit env gates — never runs against disposable benches by mistake:
 *   DASH_PROD_REFRESH=1
 *   DASH_PROD_REFRESH_CONFIRM=I_UNDERSTAND_PROD_DASH_REFRESH
 *   DASH_DB_MODE=mysql DASH_DB_HOST=127.0.0.1 DASH_DB_NAME=admin_dash
 *   DASH_ALLOW_FEED_HTTP=1
 *   DASH_DISABLE_EXTERNAL=0  (Vigie localhost push enabled)
 *
 * Usage: node scripts/refresh-prod.mjs [--cron]
 */
import {
  loadConfig,
  assertProdRefreshAllowed,
  assertFeedHttpAllowed,
  ConfigError,
  PROD_REFRESH_CONFIRM,
} from '../src/config.mjs';
import { createMysqlAdminDb } from '../src/mysql-db.mjs';
import { createHttpFeedLoader } from '../src/http-feed.mjs';
import { simplePieHashItem } from '../src/simplepie-hash.mjs';
import { runRefreshOnce } from '../src/run-refresh.mjs';
import {
  createVigieIngress,
  createLocalVigiePush,
} from '../src/vigie-ingress.mjs';

function fail(err) {
  const msg = err instanceof ConfigError ? err.message : String(err?.stack || err);
  console.error(`[dash-node-refresh] ${msg}`);
  process.exit(err?.exitCode ?? 1);
}

let config;
try {
  config = loadConfig({
    ...process.env,
    DASH_PROD_REFRESH: process.env.DASH_PROD_REFRESH || '1',
    DASH_PROD_REFRESH_CONFIRM:
      process.env.DASH_PROD_REFRESH_CONFIRM || PROD_REFRESH_CONFIRM,
    DASH_DB_MODE: 'mysql',
    DASH_ALLOW_FEED_HTTP: '1',
    // Prod enables Vigie localhost; Desk/Firebase/LLM still unused by this script.
    DASH_DISABLE_EXTERNAL: process.env.DASH_DISABLE_EXTERNAL ?? '0',
    DASH_DB_ALLOW_SCHEMA_INIT: '0',
  });
  assertProdRefreshAllowed(config);
  assertFeedHttpAllowed(config);
} catch (err) {
  fail(err);
}

const mode = process.argv.includes('--cron') ? 'cron' : 'manual';
const started = Date.now();
const loadFeed = createHttpFeedLoader({
  allowFeedHttp: true,
  timeoutMs: Number(process.env.DASH_FEED_TIMEOUT_MS || 20000),
});

const vigiePush = createLocalVigiePush({
  url: config.vigieIngressUrl,
  token: config.vigieToken,
  tokenFile: config.vigieTokenFile,
});
const vigie = createVigieIngress({
  disableExternal: false,
  push: vigiePush,
});

const db = await createMysqlAdminDb(config);
try {
  const result = await runRefreshOnce({
    mode,
    db,
    loadFeed,
    hashItem: simplePieHashItem,
    disableExternal: false,
    allowProdRefresh: true,
    timeZone: config.timeZone || 'Europe/Paris',
    vigie,
  });
  const report = {
    ok: result.ok,
    busy: result.busy,
    mode: result.mode,
    exitCode: result.exitCode ?? (result.ok ? 0 : 1),
    hashMode: 'simplepie_get_id_true',
    lastRefresh: result.lastRefresh ?? null,
    durationMs: Date.now() - started,
    stats: result.stats ?? null,
    message: result.message ?? null,
    vigiePushed: Array.isArray(result.vigieLog) ? result.vigieLog.length : 0,
  };
  console.log(JSON.stringify(report));
  if (result.busy && mode === 'cron') process.exit(2);
  if (!result.ok) process.exit(1);
} catch (err) {
  fail(err);
} finally {
  await db.close();
}
