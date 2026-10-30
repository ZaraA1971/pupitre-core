const PROD_HOST_MARKERS = [
  '163.172.185.4',
  'rag-server',
  'electronlibre.info',
];

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

/** Schema name must look disposable (test bench), never a bare production name. */
const DISPOSABLE_DB_NAME_RE = /(disposable|jetable|_test$|^test_|dash_test)/i;

/** Exact production Dash schema name on rag-server-EL. */
export const PROD_DASH_DB_NAME = 'admin_dash';

/** Explicit confirm string required for production refresh writes. */
export const PROD_REFRESH_CONFIRM = 'I_UNDERSTAND_PROD_DASH_REFRESH';

/**
 * Configuration locale. Defaults to fixtures.
 * MySQL mode requires explicit disposable credentials and refuses known prod hosts
 * unless DASH_DB_ALLOW_REMOTE=1 (still never embeds secrets).
 * Production refresh: DASH_PROD_REFRESH=1 + confirm + loopback admin_dash.
 */
export function loadConfig(env = process.env) {
  const mode = String(env.DASH_DB_MODE || 'fixtures').toLowerCase();
  const prodRefresh = String(env.DASH_PROD_REFRESH || '') === '1';
  const disableExternal = String(env.DASH_DISABLE_EXTERNAL ?? '1') !== '0';
  /** Narrow escape: HTTP(S) RSS fetch only. Does not enable Desk/Vigie/Firebase/LLM. */
  const allowFeedHttp = String(env.DASH_ALLOW_FEED_HTTP || '') === '1';
  const allowRemote = String(env.DASH_DB_ALLOW_REMOTE || '') === '1';
  const host = env.DASH_DB_HOST || '';
  const user = env.DASH_DB_USER || '';
  const password = env.DASH_DB_PASSWORD || '';
  const database = env.DASH_DB_NAME || env.DASH_DB_DATABASE || '';
  const port = Number(env.DASH_DB_PORT || 3306);
  const allowSchemaInit = String(env.DASH_DB_ALLOW_SCHEMA_INIT || '') === '1';
  const timeZone = String(env.DASH_TZ || (prodRefresh ? 'Europe/Paris' : 'UTC'));

  if (mode !== 'fixtures' && mode !== 'mysql') {
    throw new ConfigError(
      `DASH_DB_MODE invalide (${mode}). Utiliser "fixtures" ou "mysql".`
    );
  }

  if (prodRefresh) {
    if (String(env.DASH_PROD_REFRESH_CONFIRM || '') !== PROD_REFRESH_CONFIRM) {
      throw new ConfigError(
        `DASH_PROD_REFRESH=1 exige DASH_PROD_REFRESH_CONFIRM=${PROD_REFRESH_CONFIRM}`
      );
    }
    if (mode !== 'mysql') {
      throw new ConfigError('DASH_PROD_REFRESH=1 exige DASH_DB_MODE=mysql');
    }
    if (!allowFeedHttp) {
      throw new ConfigError('DASH_PROD_REFRESH=1 exige DASH_ALLOW_FEED_HTTP=1');
    }
    if (allowSchemaInit) {
      throw new ConfigError(
        'DASH_DB_ALLOW_SCHEMA_INIT interdit en prod refresh (pas de DDL).'
      );
    }
  }

  if (mode === 'mysql') {
    if (!host || !user || !database) {
      throw new ConfigError(
        'Mode mysql incomplet : définir DASH_DB_HOST, DASH_DB_USER, DASH_DB_NAME (et DASH_DB_PASSWORD si besoin). Arrêt sûr — aucune connexion tentée.'
      );
    }
    const hostLower = host.toLowerCase();
    if (!allowRemote && !prodRefresh && PROD_HOST_MARKERS.some((m) => hostLower.includes(m))) {
      throw new ConfigError(
        `Hôte MySQL refusé (${host}) : ressemble à la production. Utiliser une base jetable locale, ou DASH_DB_ALLOW_REMOTE=1 seulement après arbitrage explicite.`
      );
    }
  }

  if (!disableExternal && !prodRefresh) {
    throw new ConfigError(
      'DASH_DISABLE_EXTERNAL doit rester à 1 pour ce banc local (Desk/Vigie/Firebase/OpenAI/mail/push interdits).'
    );
  }

  return {
    mode,
    prodRefresh,
    disableExternal,
    allowFeedHttp,
    allowRemote,
    dbHost: host || 'localhost',
    dbUser: user,
    dbPassword: password,
    dbName: database,
    dbPort: port,
    dbDsn: env.DASH_DB_DSN || '',
    deskUrl: env.DASH_DESK_INGEST_URL || '',
    deskKey: env.DASH_DESK_INGEST_KEY || '',
    firebaseAuth: env.DASH_FIREBASE_PUSH_AUTH || '',
    openaiKey: env.DASH_OPENAI_API_KEY || '',
    openaiModel: env.DASH_OPENAI_MODEL || '',
    mailFrom: env.DASH_MAIL_FROM || 'dash@electronlibre.info',
    serverName: env.DASH_SERVER_NAME || 'localhost',
    listenHost: env.DASH_ADMIN_BIND || '127.0.0.1',
    listenPort: Number(env.DASH_ADMIN_PORT || 8791),
    allowSchemaInit,
    timeZone,
    vigieIngressUrl: env.DASH_VIGIE_INGRESS_URL || 'http://127.0.0.1:8790/ingress',
    vigieToken: env.DASH_VIGIE_INGRESS_TOKEN || env.VIGIE_INGRESS_TOKEN || env.INCIDENT_HUB_TOKEN || '',
    vigieTokenFile:
      env.DASH_VIGIE_TOKEN_FILE || '/srv/ops/incident-hub/.env',
  };
}

/**
 * Fail before any pool/SQL: MySQL must be loopback + disposable schema name.
 * Does not open a connection.
 */
export function assertLoopbackDisposableMysql(config) {
  if (!config || config.mode !== 'mysql') {
    throw new ConfigError('assertLoopbackDisposableMysql exige DASH_DB_MODE=mysql');
  }
  const host = String(config.dbHost || '').toLowerCase();
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new ConfigError(
      `Hôte MySQL non loopback refusé pour banc jetable (${config.dbHost}). Uniquement 127.0.0.1 ou localhost.`
    );
  }
  const name = String(config.dbName || '');
  if (!DISPOSABLE_DB_NAME_RE.test(name)) {
    throw new ConfigError(
      `Nom de schéma non reconnu comme jetable (${name}). Exiger disposable|jetable|_test|test_ dans le nom.`
    );
  }
}

/**
 * HTTP feed fetch for qualif. Keeps DASH_DISABLE_EXTERNAL=1 (no Vigie/Desk)
 * unless production refresh is explicitly enabled.
 */
export function assertFeedHttpAllowed(config) {
  if (!config?.allowFeedHttp) {
    throw new ConfigError(
      'Fetch HTTP des flux refusé sans DASH_ALLOW_FEED_HTTP=1 (qualif contrôlée uniquement).'
    );
  }
  if (!config.disableExternal && !config.prodRefresh) {
    throw new ConfigError(
      'DASH_DISABLE_EXTERNAL=1 requis même avec DASH_ALLOW_FEED_HTTP=1 (Vigie/Desk restent coupés).'
    );
  }
}

/**
 * Production Dash refresh (admin_dash @ loopback). No DDL. Explicit confirm.
 */
export function assertProdRefreshAllowed(config) {
  if (!config?.prodRefresh) {
    throw new ConfigError('assertProdRefreshAllowed exige DASH_PROD_REFRESH=1');
  }
  if (config.mode !== 'mysql') {
    throw new ConfigError('Prod refresh exige DASH_DB_MODE=mysql');
  }
  const host = String(config.dbHost || '').toLowerCase();
  if (!LOOPBACK_HOSTS.has(host)) {
    throw new ConfigError(
      `Prod refresh: hôte MySQL non loopback refusé (${config.dbHost}).`
    );
  }
  if (String(config.dbName || '') !== PROD_DASH_DB_NAME) {
    throw new ConfigError(
      `Prod refresh: DASH_DB_NAME doit être exactement ${PROD_DASH_DB_NAME} (reçu ${config.dbName}).`
    );
  }
  if (config.allowSchemaInit) {
    throw new ConfigError('Prod refresh refuse DASH_DB_ALLOW_SCHEMA_INIT=1');
  }
  if (!config.allowFeedHttp) {
    throw new ConfigError('Prod refresh exige DASH_ALLOW_FEED_HTTP=1');
  }
}

/**
 * Refresh writes require schema-init flag on top of loopback disposable checks.
 */
export function assertRefreshMysqlWritesAllowed(config) {
  if (config?.prodRefresh) {
    assertProdRefreshAllowed(config);
    return;
  }
  assertLoopbackDisposableMysql(config);
  if (!config.allowSchemaInit) {
    throw new ConfigError(
      'Écritures refresh MySQL refusées sans DASH_DB_ALLOW_SCHEMA_INIT=1 (banc jetable uniquement).'
    );
  }
  if (!config.disableExternal) {
    throw new ConfigError('DASH_DISABLE_EXTERNAL=1 requis pour refresh MySQL jetable.');
  }
}

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
    this.exitCode = 2;
  }
}
