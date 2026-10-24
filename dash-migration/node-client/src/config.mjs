export class ConfigError extends Error {
  constructor(message, exitCode = 2) {
    super(message);
    this.name = 'ConfigError';
    this.exitCode = exitCode;
  }
}

const PROD_HOST_MARKERS = [
  '163.172.185.4',
  'rag-server',
  'electronlibre.info',
];

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const DISPOSABLE_DB_NAME_RE = /(disposable|jetable|_test$|^test_|dash_test)/i;

/**
 * Local client bench config. Externals stay off; fixtures by default.
 * MySQL mode: loopback disposable only (assert before pool).
 */
export function loadConfig(env = process.env) {
  const disableExternal = String(env.DASH_DISABLE_EXTERNAL ?? '1') !== '0';
  if (!disableExternal) {
    throw new ConfigError(
      'DASH_DISABLE_EXTERNAL doit rester à 1 pour ce banc client local (pas de mail/push/Desk).'
    );
  }

  const mode = String(env.DASH_DB_MODE || 'fixtures').toLowerCase();
  if (mode !== 'fixtures' && mode !== 'mysql') {
    throw new ConfigError(
      `DASH_DB_MODE invalide (${mode}). Utiliser "fixtures" ou "mysql".`
    );
  }

  const allowRemote = String(env.DASH_DB_ALLOW_REMOTE || '') === '1';
  const host = env.DASH_DB_HOST || '';
  const user = env.DASH_DB_USER || '';
  const password = env.DASH_DB_PASSWORD || '';
  const database = env.DASH_DB_NAME || env.DASH_DB_DATABASE || '';
  const port = Number(env.DASH_DB_PORT || 3306);

  if (mode === 'mysql') {
    if (!host || !user || !database) {
      throw new ConfigError(
        'Mode mysql incomplet : définir DASH_DB_HOST, DASH_DB_USER, DASH_DB_NAME (et DASH_DB_PASSWORD si besoin). Arrêt sûr — aucune connexion tentée.'
      );
    }
    const hostLower = host.toLowerCase();
    if (!allowRemote && PROD_HOST_MARKERS.some((m) => hostLower.includes(m))) {
      throw new ConfigError(
        `Hôte MySQL refusé (${host}) : ressemble à la production. Utiliser une base jetable locale.`
      );
    }
  }

  const listenHost = env.DASH_CLIENT_HOST || env.DASH_ADMIN_BIND || '127.0.0.1';
  const listenPort = Number(env.DASH_CLIENT_PORT || 8793);

  return {
    mode,
    disableExternal,
    allowRemote,
    dbHost: host || 'localhost',
    dbUser: user,
    dbPassword: password,
    dbName: database,
    dbPort: port,
    allowSchemaInit: String(env.DASH_DB_ALLOW_SCHEMA_INIT || '') === '1',
    listenHost,
    listenPort,
    sessionTtlSeconds: 24 * 60 * 60,
    textMax: 1200,
    pageSize: 25,
  };
}

/** Fail before any pool/SQL. */
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

/** Schema seed / destructive client writes on disposable MySQL. */
export function assertClientMysqlWritesAllowed(config) {
  assertLoopbackDisposableMysql(config);
  if (!config.allowSchemaInit) {
    throw new ConfigError(
      'Écritures client MySQL refusées sans DASH_DB_ALLOW_SCHEMA_INIT=1 (banc jetable uniquement).'
    );
  }
  if (!config.disableExternal) {
    throw new ConfigError('DASH_DISABLE_EXTERNAL=1 requis pour client MySQL jetable.');
  }
}
