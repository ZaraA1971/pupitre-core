import { handleWebservice, WEBSERVICE_ROUTES } from './handlers.mjs';

export function createApp({ db, push }) {
  return async function app(req, res) {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const parts = url.pathname.split('/').filter(Boolean);
    // Accept /webservice/<name> or /<name>.php or /<name>
    let name = '';
    if (parts[0] === 'webservice' && parts[1]) {
      name = parts[1].replace(/\.php$/, '');
    } else if (parts.length === 1) {
      name = parts[0].replace(/\.php$/, '');
    }
    if (!WEBSERVICE_ROUTES.includes(name)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const query = Object.fromEntries(url.searchParams.entries());
    await handleWebservice(name, req, res, { db, push, query });
  };
}
