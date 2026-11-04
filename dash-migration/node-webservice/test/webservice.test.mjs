import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createFakeDb } from '../src/fake-db.mjs';
import { createPushSender } from '../src/push.mjs';
import { createApp } from '../src/app.mjs';
import { loadConfig } from '../src/config.mjs';

const servers = [];

function seedDb() {
  return createFakeDb({
    sections: {
      dash_demo: {
        users: [
          {
            id_user: 1,
            login_user: 'alice',
            pass_user: 'plain-alice',
            active_user: 1,
            mail_user: 'alice@example.test',
          },
          {
            id_user: 2,
            login_user: 'bob',
            pass_user: 'plain-bob',
            active_user: 1,
            mail_user: 'bob@example.test',
          },
          {
            id_user: 3,
            login_user: 'inactive',
            pass_user: 'x',
            active_user: 0,
          },
        ],
        messages: [
          {
            id: 10,
            from_user: 2,
            to_user: 1,
            text: 'hello',
            date: '2026-10-01 10:00:00',
            has_been_read: 0,
          },
        ],
      },
    },
    admin: {
      users: [{ id_user: 1, themes: '5,7', mail: 'alice@example.test' }],
      theme: [
        { id: 5, name: 'Tech', img: 't.png' },
        { id: 7, name: 'Droit', img: 'd.png' },
      ],
      ios_devices: [{ id: 1, id_user: 1, token: 'tok1', push_message: 1, push_alert: 0 }],
      rss_post: [
        {
          id: 100,
          hash: 'abc',
          id_theme: 5,
          source: 'Agence',
          title: '<b>Titre</b>',
          author: 'A',
          alert: 0,
          text: 'Corps',
          link: 'https://example.test/a',
          date: '2026-10-02 12:30:00',
          new: 1,
          sent: 0,
          deleted: 0,
        },
      ],
    },
  });
}

function startServer(db, push) {
  const app = createApp({ db, push });
  const server = http.createServer((req, res) => {
    app(req, res).catch((err) => {
      res.writeHead(500);
      res.end(String(err));
    });
  });
  servers.push(server);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        async get(path) {
          const res = await fetch(`http://127.0.0.1:${port}${path}`);
          const text = await res.text();
          let json = null;
          if (text) {
            try {
              json = JSON.parse(text);
            } catch {
              json = text;
            }
          }
          return { status: res.status, text, json };
        },
      });
    });
  });
}

after(() => {
  for (const s of servers) {
    try {
      s.close();
    } catch {
      /* ignore */
    }
  }
});

const authQ = 'login=alice&password=plain-alice&section=demo';

describe('dash webservice node parity', () => {
  let db;
  let push;
  let ctx;

  beforeEach(async () => {
    db = seedDb();
    push = createPushSender({ config: loadConfig({ DASH_DISABLE_EXTERNAL: '1' }) });
    ctx = await startServer(db, push);
  });

  it('rejects bad password on connect', async () => {
    const r = await ctx.get('/webservice/connect.php?login=alice&password=wrong&section=demo');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { success: 0 });
  });

  it('connect returns id_user on success', async () => {
    const r = await ctx.get(`/webservice/connect.php?${authQ}`);
    assert.deepEqual(r.json, { success: 1, infos: { id_user: 1 } });
  });

  it('list_themes returns themes from admin_dash', async () => {
    const r = await ctx.get(`/webservice/list_themes.php?${authQ}`);
    assert.equal(r.json.success, 1);
    assert.equal(r.json.themes.length, 2);
    assert.equal(r.json.themes[0].name, 'Tech');
  });

  it('list_contacts omits self', async () => {
    const r = await ctx.get(`/webservice/list_contacts.php?${authQ}`);
    assert.equal(r.json.contacts.length, 2);
    assert.ok(r.json.contacts.every((c) => c.id_user !== 1));
  });

  it('list_messages returns last message per contact', async () => {
    const r = await ctx.get(`/webservice/list_messages.php?${authQ}`);
    assert.equal(r.json.last_messages.length, 1);
    assert.equal(r.json.last_messages[0].contact, 2);
    assert.equal(r.json.last_messages[0].direction, 'received');
  });

  it('new_message inserts and records push without sending externally', async () => {
    const r = await ctx.get(
      `/webservice/new_message.php?${authQ}&user=2&text=bonjour`
    );
    assert.equal(r.json.success, 1);
    assert.ok(r.json.insert >= 1);
    assert.equal(push.calls.length, 1);
    assert.equal(push.calls[0].idUser, 2);
    assert.match(push.calls[0].message, /^Alice : bonjour$/);
    assert.equal(push.calls[0].type, 'message');
  });

  it('history_messages returns chronological slice', async () => {
    await ctx.get(`/webservice/new_message.php?${authQ}&user=2&text=suite`);
    const r = await ctx.get(`/webservice/history_messages.php?${authQ}&user=2&since=0`);
    assert.equal(r.json.success, 1);
    assert.ok(r.json.messages.length >= 2);
  });

  it('read_contact marks unread', async () => {
    await ctx.get(`/webservice/read_contact.php?${authQ}&user=2`);
    const msg = db.state.sections.dash_demo.messages.find((m) => m.id === 10);
    assert.equal(String(msg.has_been_read), '1');
  });

  it('list_news strips tags in title', async () => {
    const r = await ctx.get(`/webservice/list_news.php?${authQ}&theme=0&since=(null)`);
    assert.equal(r.json.news[0].title, 'Titre');
    assert.equal(r.json.news[0].theme, 'Tech');
  });

  it('read_news returns admin row', async () => {
    const r = await ctx.get(`/webservice/read_news.php?${authQ}&news=100`);
    assert.equal(r.json.news.hash, 'abc');
  });

  it('read_settings and save_settings', async () => {
    const r = await ctx.get(`/webservice/read_settings.php?${authQ}`);
    assert.equal(r.json.settings.mail, 'alice@example.test');
    const s = await ctx.get(
      `/webservice/save_settings.php?${authQ}&newLogin=alice&newPassword=plain-alice&newMail=new@example.test&notifMessage=1&notifAlert=1`
    );
    assert.equal(s.json.message, '.');
    const r2 = await ctx.get(`/webservice/read_settings.php?${authQ}`);
    assert.equal(r2.json.settings.mail, 'new@example.test');
  });

  it('register_push keeps empty body like PHP', async () => {
    const r = await ctx.get(`/webservice/register_push.php?${authQ}&token=abc`);
    assert.equal(r.text, '');
    assert.equal(db.state.admin.ios_devices.filter((d) => d.token === 'abc').length, 1);
  });

  it('inactive user cannot authenticate', async () => {
    const r = await ctx.get(
      '/webservice/connect.php?login=inactive&password=x&section=demo'
    );
    assert.deepEqual(r.json, { success: 0 });
  });
});
