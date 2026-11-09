/**
 * Limites explicites KV + application.
 * Cloudflare KV : valeur max 25 MiB (https://developers.cloudflare.com/kv/platform/limits/).
 * Free plan KV : 1 Go stockage / compte, 1 000 écritures / jour (inclus, pas de facturation ajoutée).
 */
export const KV_VALUE_MAX_BYTES = 25 * 1024 * 1024;
export const APP_MAX_IMAGE_BYTES = 12_000_000;
export const APP_MAX_BODY_BYTES = 28_000_000;
export const ALLOWED_CATEGORIES = new Set(["peinture", "miniature", "aquarelle"]);
/** Ajouts atelier (KV). */
export const ID_RE = /^ajout-[a-z0-9-]{1,80}$/;
/** Anciens ids assets site (hors KV) encore acceptés en bibliothèque. */
export const EXPOSEE_ID_RE = /^exposee-[a-z0-9-]{1,80}$/;
/** Toute entrée bibliothèque D1. */
export const LIBRARY_ID_RE = /^(ajout|exposee)-[a-z0-9-]{1,80}$/;
/** original | web/ (affichage) | preview/ (vignette) — même stem id. */
export const ASSET_RE =
  /^images\/ajouts\/(?:preview\/|web\/)?[a-z0-9][a-z0-9._-]{0,80}\.(webp|jpg|png)$/;
/** Chemins images site (hors /ajouts KV) pour proxy atelier/media. */
export const PUBLIC_ASSET_RE =
  /^images\/(?:preview\/|web\/)?[a-z0-9][a-z0-9._-]{0,80}\.(webp|jpg|png)$/;
/* Web encode max edge stays 1800 in atelier.js + scripts/backfill-web-derivatives.py. */

const WEBP = [0x52, 0x49, 0x46, 0x46];
const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function clean(value, limit) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ")
    .slice(0, limit);
}

export function slugify(value) {
  const ascii = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return ascii || "oeuvre";
}

function startsWith(bytes, prefix) {
  if (bytes.byteLength < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (bytes[i] !== prefix[i]) return false;
  }
  return true;
}

export function imageKind(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (startsWith(view, PNG)) return "png";
  if (startsWith(view, JPEG)) return "jpeg";
  if (
    startsWith(view, WEBP) &&
    view.byteLength >= 12 &&
    view[8] === 0x57 &&
    view[9] === 0x45 &&
    view[10] === 0x42 &&
    view[11] === 0x50
  ) {
    return "webp";
  }
  return "";
}

export function extensionFor(kind) {
  return { webp: "webp", jpeg: "jpg", png: "png" }[kind] || "";
}

export function contentTypeFor(kind) {
  return { webp: "image/webp", jpeg: "image/jpeg", png: "image/png" }[kind] || "";
}

/**
 * Valide un binaire image pour stockage KV.
 * @returns {{ ok: true, kind: string, ext: string, ctype: string, bytes: Uint8Array } | { ok: false, error: string, status: number }}
 */
export function validateImageForKv(buffer, label) {
  if (!buffer || (!(buffer instanceof ArrayBuffer) && !(buffer instanceof Uint8Array))) {
    return { ok: false, status: 400, error: `${label} manquante.` };
  }
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.byteLength === 0) {
    return { ok: false, status: 400, error: `${label} manquante.` };
  }
  if (bytes.byteLength > APP_MAX_IMAGE_BYTES) {
    return {
      ok: false,
      status: 400,
      error: `${label} trop lourde (limite application ${APP_MAX_IMAGE_BYTES} octets).`,
    };
  }
  if (bytes.byteLength > KV_VALUE_MAX_BYTES) {
    return {
      ok: false,
      status: 413,
      error: `${label} dépasse la limite KV (${KV_VALUE_MAX_BYTES} octets / 25 MiB).`,
    };
  }
  const kind = imageKind(bytes);
  const ext = extensionFor(kind);
  const ctype = contentTypeFor(kind);
  if (!ext || !ctype) {
    return { ok: false, status: 400, error: `${label} : format non accepté (WebP, JPEG ou PNG).` };
  }
  return { ok: true, kind, ext, ctype, bytes };
}

export function kvKeys(workId) {
  return {
    detail: `detail:${workId}`,
    web: `web:${workId}`,
    preview: `preview:${workId}`,
  };
}
