/**
 * Outbound side effects. With disableExternal=true (default), only records calls.
 * No real desk / Firebase / mail / OpenAI / APNS.
 */

export function createExternals({ config, deskFetch, mailSend, firebasePush, llmRequest } = {}) {
  const log = [];

  function record(kind, payload) {
    log.push({ kind, payload, at: Date.now() });
  }

  async function sendMail({ to, subject, content, headers }) {
    record('mail', { to, subject, contentLength: String(content || '').length });
    if (config.disableExternal) {
      return { ok: true, skipped: true };
    }
    if (typeof mailSend === 'function') return mailSend({ to, subject, content, headers });
    throw new Error('mailSend not configured');
  }

  async function pushFirebase(order) {
    record('firebase', {
      postId: order.postId,
      deviceCount: Array.isArray(order.devices) ? order.devices.length : 0,
    });
    if (config.disableExternal) {
      return { ok: true, skipped: true };
    }
    if (!config.firebaseAuth) {
      record('firebase_skipped_no_auth', {});
      return { ok: false, skipped: true, reason: 'no_auth' };
    }
    if (typeof firebasePush === 'function') return firebasePush(order);
    throw new Error('firebasePush not configured');
  }

  async function createDeskDraft(article) {
    record('desk', { title: article.title, source_url: article.source_url });
    if (config.disableExternal) {
      // Local safe stub: deterministic fake id, no HTTP
      return {
        article_id: 900000 + (log.filter((x) => x.kind === 'desk').length),
        slug: String(article.slug || article.title || 'draft')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 80),
        skipped: true,
      };
    }
    if (typeof deskFetch === 'function') return deskFetch(article);
    if (!config.deskUrl || !config.deskKey) {
      throw new Error('Desk ingest config missing (DASH_DESK_INGEST_URL/KEY)');
    }
    throw new Error('deskFetch not configured while externals enabled');
  }

  async function llm(prompt) {
    record('llm', { promptLength: String(prompt || '').length });
    if (config.disableExternal) {
      throw new Error('LLM disabled (DASH_DISABLE_EXTERNAL=1)');
    }
    if (typeof llmRequest === 'function') return llmRequest(prompt);
    throw new Error('llmRequest not configured');
  }

  return { sendMail, pushFirebase, createDeskDraft, llm, log };
}
