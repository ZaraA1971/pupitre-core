import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ConfigError,
  PROD_REFRESH_CONFIRM,
  loadConfig,
  assertProdRefreshAllowed,
  assertFeedHttpAllowed,
} from '../src/config.mjs';
import { sqlNowInZone } from '../src/rss-lock.mjs';

describe('prod refresh config gates', () => {
  const base = {
    DASH_PROD_REFRESH: '1',
    DASH_PROD_REFRESH_CONFIRM: PROD_REFRESH_CONFIRM,
    DASH_DB_MODE: 'mysql',
    DASH_DB_HOST: '127.0.0.1',
    DASH_DB_USER: 'qualif_dash',
    DASH_DB_PASSWORD: 'x',
    DASH_DB_NAME: 'admin_dash',
    DASH_ALLOW_FEED_HTTP: '1',
    DASH_DISABLE_EXTERNAL: '0',
    DASH_DB_ALLOW_SCHEMA_INIT: '0',
  };

  it('accepts explicit prod refresh on loopback admin_dash', () => {
    const cfg = loadConfig(base);
    assert.equal(cfg.prodRefresh, true);
    assert.equal(cfg.disableExternal, false);
    assert.equal(cfg.timeZone, 'Europe/Paris');
    assert.doesNotThrow(() => assertProdRefreshAllowed(cfg));
    assert.doesNotThrow(() => assertFeedHttpAllowed(cfg));
  });

  it('refuses missing confirm', () => {
    assert.throws(
      () => loadConfig({ ...base, DASH_PROD_REFRESH_CONFIRM: 'nope' }),
      ConfigError
    );
  });

  it('refuses schema init and wrong db name', () => {
    assert.throws(
      () => loadConfig({ ...base, DASH_DB_ALLOW_SCHEMA_INIT: '1' }),
      ConfigError
    );
    const cfg = loadConfig({ ...base, DASH_DB_NAME: 'dash_disposable' });
    assert.throws(() => assertProdRefreshAllowed(cfg), /admin_dash/);
  });

  it('formats Paris SQL timestamps', () => {
    // After 2026-10-25 DST end, Paris is UTC+1 → 12:00Z = 13:00 local.
    const ts = sqlNowInZone(() => Date.parse('2026-10-25T12:00:00Z'), 'Europe/Paris');
    assert.equal(ts, '2026-10-25 13:00:00');
    const summer = sqlNowInZone(() => Date.parse('2026-07-01T12:00:00Z'), 'Europe/Paris');
    assert.equal(summer, '2026-07-01 14:00:00');
  });
});
