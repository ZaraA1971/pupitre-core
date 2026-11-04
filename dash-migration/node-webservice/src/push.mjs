/**
 * APNS sender. Disabled by default (DASH_DISABLE_EXTERNAL=1).
 * Observable PHP contract calls this from new_message; tests inject a recorder.
 */
export function createPushSender({ config, sendImpl } = {}) {
  const calls = [];
  async function sendPush(idUser, message, type, badge) {
    const entry = {
      idUser: Number(idUser),
      message: String(message ?? ''),
      type: String(type ?? ''),
      badge: Number(badge) || 0,
    };
    calls.push(entry);
    if (config?.disableExternal) {
      return { ok: true, skipped: true, reason: 'DASH_DISABLE_EXTERNAL' };
    }
    if (typeof sendImpl === 'function') {
      return sendImpl(entry);
    }
    throw new Error('External push not configured; set DASH_DISABLE_EXTERNAL=1 or provide sendImpl');
  }
  return { sendPush, calls };
}
