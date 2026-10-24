export function loadConfig(env = process.env) {
  const disableExternal = String(env.DASH_DISABLE_EXTERNAL ?? '1') !== '0';
  return {
    disableExternal,
    dbHost: env.DASH_DB_HOST || 'localhost',
    dbUser: env.DASH_DB_USER || '',
    dbPassword: env.DASH_DB_PASSWORD || '',
    dbDsn: env.DASH_DB_DSN || '',
    deskUrl: env.DASH_DESK_INGEST_URL || '',
    deskKey: env.DASH_DESK_INGEST_KEY || '',
    firebaseAuth: env.DASH_FIREBASE_PUSH_AUTH || '',
    openaiKey: env.DASH_OPENAI_API_KEY || '',
    openaiModel: env.DASH_OPENAI_MODEL || '',
    mailFrom: env.DASH_MAIL_FROM || 'dash@electronlibre.info',
    serverName: env.DASH_SERVER_NAME || 'localhost',
  };
}
