import http from 'node:http';
import { ConfigError, loadConfig } from './config.mjs';
import { createAdminDb } from './db.mjs';
import { createExternals } from './externals.mjs';
import { createApp } from './app.mjs';

/**
 * Local HTTP entry for the admin inbox journey.
 * Defaults to fixtures. MySQL only with explicit disposable env vars.
 * Never starts if DASH_DISABLE_EXTERNAL is off or mysql config is incomplete.
 */
let config;
try {
  config = loadConfig(process.env);
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(`[config] ${err.message}`);
    process.exit(err.exitCode ?? 2);
  }
  throw err;
}

const db = await createAdminDb(config);
const externals = createExternals({ config });
const app = createApp({ db, externals, config });

const server = http.createServer((req, res) => {
  app(req, res).catch((err) => {
    console.error(err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('error');
    }
  });
});

server.listen(config.listenPort, config.listenHost, () => {
  console.log(
    `dash-admin-rss listening on http://${config.listenHost}:${config.listenPort} (mode=${config.mode}, external=off)`
  );
});

async function shutdown() {
  server.close();
  await db.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
