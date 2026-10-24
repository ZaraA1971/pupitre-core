import { authenticate } from './auth.mjs';

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'text/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function empty(res, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/json; charset=utf-8' });
  res.end('');
}

/**
 * Route name = PHP script basename without .php
 */
export async function handleWebservice(name, req, res, { db, push, query }) {
  const auth = await authenticate(db, query);

  switch (name) {
    case 'auth': {
      // auth.php alone sets variables; connect.php is the usual entry that echoes.
      // Observable if called directly: headers set, no echo in original → empty body.
      return empty(res);
    }
    case 'connect': {
      const body = { success: auth.success };
      if (auth.success) body.infos = { id_user: auth.id_user };
      return json(res, 200, body);
    }
    case 'list_themes': {
      const body = { success: auth.success };
      if (auth.success) body.themes = auth.themes;
      return json(res, 200, body);
    }
    case 'list_contacts': {
      const body = { success: auth.success };
      if (auth.success) {
        body.contacts = await db.listContacts(auth.sectionDb, auth.id_user);
      }
      return json(res, 200, body);
    }
    case 'list_messages': {
      const body = { success: auth.success };
      if (auth.success) {
        body.last_messages = await db.listLastMessages(auth.sectionDb, auth.id_user);
      }
      return json(res, 200, body);
    }
    case 'history_messages': {
      const body = { success: auth.success };
      if (auth.success) {
        const since = Number(query.since) || 0;
        const old = Number(query.old) || 0;
        const other = Number(query.user) || 0;
        body.messages = await db.historyMessages(
          auth.sectionDb,
          auth.id_user,
          other,
          since,
          old
        );
      }
      return json(res, 200, body);
    }
    case 'new_message': {
      const body = { success: auth.success };
      if (auth.success) {
        const toUser = query.user;
        const text = query.text ?? '';
        body.insert = await db.insertMessage(auth.sectionDb, auth.id_user, toUser, text);
        await push.sendPush(
          Number(toUser),
          `${String(auth.name_user).charAt(0).toUpperCase()}${String(auth.name_user).slice(1)} : ${text}`,
          'message',
          1
        );
      }
      return json(res, 200, body);
    }
    case 'read_contact': {
      const body = { success: auth.success };
      if (auth.success) {
        await db.markConversationRead(auth.sectionDb, auth.id_user, query.user);
      }
      return json(res, 200, body);
    }
    case 'list_news': {
      const body = { success: auth.success };
      if (auth.success) {
        const theme = Number(query.theme) || 0;
        const since = query.since ?? '(null)';
        const before = Boolean(query.before);
        body.news = await db.listNews(theme, since, before);
      }
      return json(res, 200, body);
    }
    case 'read_news': {
      const body = { success: auth.success };
      if (auth.success) {
        body.news = await db.getNewsById(query.news);
      }
      return json(res, 200, body);
    }
    case 'read_settings': {
      const body = { success: auth.success };
      if (auth.success) {
        body.settings = await db.getSettings(auth.id_user);
      }
      return json(res, 200, body);
    }
    case 'save_settings': {
      const body = { success: auth.success };
      if (auth.success) {
        const result = await db.saveSettings(auth.sectionDb, auth.id_user, {
          newLogin: query.newLogin ?? '',
          newPassword: query.newPassword ?? '',
          newMail: query.newMail ?? '',
          notifMessage: query.notifMessage ?? '',
          notifAlert: query.notifAlert ?? '',
        });
        body.message = result.message;
      }
      return json(res, 200, body);
    }
    case 'register_push': {
      // Original PHP never echoes — preserve empty body.
      if (auth.success) {
        await db.registerPush(auth.id_user, query.token ?? '');
      }
      return empty(res);
    }
    default:
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
  }
}

export const WEBSERVICE_ROUTES = [
  'auth',
  'connect',
  'list_themes',
  'list_contacts',
  'list_messages',
  'history_messages',
  'new_message',
  'read_contact',
  'list_news',
  'read_news',
  'read_settings',
  'save_settings',
  'register_push',
];
