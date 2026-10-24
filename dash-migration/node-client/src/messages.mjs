/**
 * Client messages orchestration (parity with client/messages.php send path).
 */

const PLACEHOLDER = 'Tapez ici votre message';

/**
 * @param {object} body
 * @param {{ id_user: number, login_user: string }} user
 * @param {{ db: object, sendPush: Function, mailSend?: Function, config: object, now?: () => Date }} deps
 */
export async function handleSendMessage(body, user, deps) {
  const { db, sendPush, mailSend, config, now = () => new Date() } = deps;
  const textRaw = String(body.message ?? '').trim();
  const toUser = Number(body.to_user);
  if (
    body.send_message === undefined ||
    !textRaw ||
    textRaw === PLACEHOLDER ||
    !Number.isFinite(toUser) ||
    toUser <= 0 ||
    String(body.to_user) === 'empty'
  ) {
    return { ok: false, error: 'message_invalid' };
  }

  const idPost = Number(body.sent_id_post || body.id_post || 0) || 0;
  const ts = sqlNow(now());
  const text = escapeHtml(textRaw);

  const inserted = await db.insertMessage({
    fromUser: user.id_user,
    toUser,
    idPost,
    text,
    date: ts,
  });

  const loginLabel =
    String(user.login_user || '').charAt(0).toUpperCase() +
    String(user.login_user || '').slice(1);
  const pushResult = await sendPush(
    toUser,
    `${loginLabel} : ${textRaw}`,
    'message',
    1
  );

  let mail = { skipped: true };
  const recipient = await db.findUserById(toUser);
  if (recipient && String(recipient.message_notification) === '1' && recipient.mail_user) {
    const subject = `Le Dash - Vous avez reçu un message de la part de ${loginLabel}`;
    const content =
      `${loginLabel} vous envoie : « ${text} » <br/><br/> ` +
      `<a href="/messages">Cliquez ici pour consulter votre messagerie</a>`;
    if (typeof mailSend === 'function') {
      mail = await mailSend({
        to: recipient.mail_user,
        subject,
        content,
      });
    } else if (config.disableExternal) {
      mail = { ok: true, skipped: true, reason: 'DASH_DISABLE_EXTERNAL', to: recipient.mail_user };
    }
  }

  return {
    ok: true,
    alert: 'Votre message a été envoyé.',
    messageId: inserted.id,
    push: pushResult,
    mail,
  };
}

export async function listConversations(db, userId) {
  return db.listConversations(userId);
}

export async function listThread(db, userId, peerId, { offset = 0, limit = 5 } = {}) {
  return db.listThread(userId, peerId, { offset, limit });
}

export async function markRead(db, userId, messageId) {
  return db.markMessageRead(userId, messageId);
}

function sqlNow(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
