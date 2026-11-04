/**
 * Environment-only configuration. No embedded credentials.
 */
export function loadConfig(env = process.env) {
  return {
    host: env.DASH_DB_HOST || 'localhost',
    user: env.DASH_DB_USER || '',
    password: env.DASH_DB_PASSWORD || '',
    dsn: env.DASH_DB_DSN || '',
    apnsHost: env.DASH_APNS_HOST || 'gateway.sandbox.push.apple.com',
    apnsPort: Number(env.DASH_APNS_PORT || 2195),
    apnsCert: env.DASH_APNS_CERT || '',
    apnsPassphrase: env.DASH_APNS_PASSPHRASE || '',
    port: Number(env.DASH_WEBSERVICE_PORT || 8790),
    disableExternal: String(env.DASH_DISABLE_EXTERNAL ?? '1') !== '0',
  };
}
