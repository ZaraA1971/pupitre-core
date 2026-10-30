/**
 * Outbound side effects. With disableExternal=true (default), only records calls.
 * No real desk / Firebase / mail / OpenAI / APNS.
 */
import {
  buildDeskIngestPayload,
  parseDeskIngestResponse,
  slugifyDeskTitle,
} from './desk-client.mjs';

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
    const payload = buildDeskIngestPayload(article);
    record('desk', {
      title: payload.title,
      source_url: payload.source_url,
      payload,
    });
    if (config.disableExternal) {
      // Local safe stub: deterministic fake id, no HTTP. Optional deskFetch
      // may still parse a fake response object for unit tests.
      if (typeof deskFetch === 'function') {
        const fake = await deskFetch(payload);
        if (fake && typeof fake === 'object' && 'raw' in fake) {
          return parseDeskIngestResponse(fake.raw, fake.status ?? 200);
        }
        if (fake && typeof fake === 'object' && fake.article_id) {
          return {
            article_id: Number(fake.article_id),
            slug: String(fake.slug || slugifyDeskTitle(payload.title)),
            skipped: true,
          };
        }
      }
      return {
        article_id: 900000 + log.filter((x) => x.kind === 'desk').length,
        slug: slugifyDeskTitle(payload.slug || payload.title),
        skipped: true,
        payload,
      };
    }
    if (typeof deskFetch === 'function') {
      const res = await deskFetch(payload);
      if (res && typeof res === 'object' && 'raw' in res) {
        return parseDeskIngestResponse(res.raw, res.status ?? 200);
      }
      return res;
    }
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
