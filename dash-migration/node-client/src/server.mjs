import http from 'node:http';
import { ConfigError, loadConfig } from './config.mjs';
import { createClientDb } from './db.mjs';
import { createSessionStore } from './session.mjs';
import { createApp } from './app.mjs';

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

const db = await createClientDb(config);
const sessions = createSessionStore({ ttlSeconds: config.sessionTtlSeconds });
const app = createApp({ db, sessions, config });

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
    `dash-client listening on http://${config.listenHost}:${config.listenPort} (mode=${config.mode}, external=off)`
  );
});

async function shutdown() {
  server.close();
  await db.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
