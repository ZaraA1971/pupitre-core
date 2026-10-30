import http from 'node:http';
import { loadConfig } from './config.mjs';
import { createPushSender } from './push.mjs';
import { createApp } from './app.mjs';

/**
 * HTTP entry. Refuses to start with a live DB adapter unless explicitly configured.
 * Default: this file is for local wiring demos; tests use createApp directly.
 */
const config = loadConfig();
if (!config.disableExternal) {
  console.error('Refusing start: set DASH_DISABLE_EXTERNAL=1 until production cutover is approved.');
  process.exit(2);
}

const { createFakeDb } = await import('./fake-db.mjs');
const db = createFakeDb();
const push = createPushSender({ config });
const app = createApp({ db, push });
const server = http.createServer((req, res) => {
  app(req, res).catch((err) => {
    console.error(err);
    res.writeHead(500);
    res.end('error');
  });
});
server.listen(config.port, '127.0.0.1', () => {
  console.log(`dash-webservice-node listening on 127.0.0.1:${config.port} (external disabled)`);
});
