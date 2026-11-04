/**
 * Internal sendPush module — parity with webservice/send__push_.php as a library.
 * Consumed by client/messages.php path only. Never opens APNS when disableExternal=1.
 * Does NOT expose an HTTP /webservice route.
 */

/**
 * @param {{
 *   config: { disableExternal: boolean },
 *   listDevices?: (idUser: number) => Promise<Array<{ token: string, push_message?: number|string, push_alert?: number|string }>>,
 *   sendImpl?: (entry: object) => Promise<object>,
 * }} opts
 */
export function createSendPush({ config, listDevices, sendImpl } = {}) {
  const calls = [];

  /**
   * @param {number} idUser
   * @param {string} message
   * @param {string} type  e.g. 'message' | 'alert'
   * @param {number} badge
   */
  async function sendPush(idUser, message, type, badge) {
    const entry = {
      idUser: Number(idUser),
      message: String(message ?? ''),
      type: String(type ?? 'message'),
      badge: Number(badge) || 0,
      at: Date.now(),
    };

    let devices = [];
    if (typeof listDevices === 'function') {
      devices = await listDevices(entry.idUser);
    }
    const eligible = (devices || []).filter((d) => {
      const flag = d[`push_${entry.type}`];
      return d.token && (flag === undefined || Number(flag) !== 0);
    });
    entry.deviceCount = eligible.length;
    entry.tokensPreview = eligible.map((d) => String(d.token).slice(0, 8));
    calls.push(entry);

    if (config?.disableExternal) {
      return {
        ok: true,
        skipped: true,
        reason: 'DASH_DISABLE_EXTERNAL',
        deviceCount: eligible.length,
      };
    }
    if (typeof sendImpl === 'function') {
      return sendImpl({ ...entry, devices: eligible });
    }
    throw new Error(
      'APNS réel non configuré. Garder DASH_DISABLE_EXTERNAL=1 (pas de bascule webservice HTTP).'
    );
  }

  return { sendPush, calls };
}
