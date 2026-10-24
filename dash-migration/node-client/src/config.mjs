export class ConfigError extends Error {
  constructor(message, exitCode = 2) {
    super(message);
    this.name = 'ConfigError';
    this.exitCode = exitCode;
  }
}

/**
 * Local client bench config. Externals stay off; fixtures by default.
 */
export function loadConfig(env = process.env) {
  const disableExternal = String(env.DASH_DISABLE_EXTERNAL ?? '1') !== '0';
  if (!disableExternal) {
    throw new ConfigError(
      'DASH_DISABLE_EXTERNAL doit rester à 1 pour ce banc client local (pas de mail/push/Desk).'
    );
  }

  const mode = String(env.DASH_DB_MODE || 'fixtures').toLowerCase();
  if (mode !== 'fixtures') {
    throw new ConfigError(
      `DASH_DB_MODE=${mode} non supporté dans ce lot client lecture (fixtures uniquement).`
    );
  }

  const listenHost = env.DASH_CLIENT_HOST || env.DASH_ADMIN_BIND || '127.0.0.1';
  const listenPort = Number(env.DASH_CLIENT_PORT || 8793);

  return {
    mode,
    disableExternal,
    listenHost,
    listenPort,
    sessionTtlSeconds: 24 * 60 * 60,
    textMax: 1200,
    pageSize: 25,
  };
}
