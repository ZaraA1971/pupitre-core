import { requireBasicAuth } from "../../_shared/auth.js";
import { ASSET_RE, ID_RE, LIBRARY_ID_RE, kvKeys } from "../../_shared/limits.js";
import { getWork } from "../../_shared/works.js";

/**
 * Sert les binaires KV derrière le même chemin logique que Scaleway.
 * Variantes : original, web/ (affichage), preview/ (vignette), carousel/ (hero recadré).
 * Public uniquement si l’œuvre est exposed=1 ; sinon Basic Auth (brouillons).
 */
export async function onRequestGet(context) {
  const parts = context.params.path;
  const relative = Array.isArray(parts) ? parts.join("/") : String(parts || "");
  const assetPath = `images/ajouts/${relative}`;
  if (!ASSET_RE.test(assetPath)) {
    return new Response("Introuvable.", { status: 404 });
  }

  let kind = "detail";
  let fileName = relative;
  if (relative.startsWith("preview/")) {
    kind = "preview";
    fileName = relative.slice("preview/".length);
  } else if (relative.startsWith("web/")) {
    kind = "web";
    fileName = relative.slice("web/".length);
  } else if (relative.startsWith("carousel/")) {
    kind = "carousel";
    fileName = relative.slice("carousel/".length);
  }

  const match = /^([a-z0-9][a-z0-9._-]{0,80})\.(webp|jpg|png)$/.exec(fileName);
  if (!match) {
    return new Response("Introuvable.", { status: 404 });
  }
  const id = match[1];
  // Carousel crop may exist for exposee-* as well as ajout-*.
  if (kind === "carousel" ? !LIBRARY_ID_RE.test(id) : !ID_RE.test(id)) {
    return new Response("Introuvable.", { status: 404 });
  }

  const work = await getWork(context.env.DB, id);
  if (!work) {
    return new Response("Introuvable.", { status: 404 });
  }

  const expected =
    kind === "preview"
      ? work.preview
      : kind === "web"
        ? work.web
        : kind === "carousel"
          ? work.carousel_image
          : work.image;
  if (!expected || expected !== assetPath) {
    return new Response("Introuvable.", { status: 404 });
  }

  if (!work.exposed) {
    const denied = requireBasicAuth(context.request, context.env);
    if (denied) return denied;
  }

  const keys = kvKeys(id);
  const key =
    kind === "preview"
      ? keys.preview
      : kind === "web"
        ? keys.web
        : kind === "carousel"
          ? keys.carousel
          : keys.detail;
  const result = await context.env.IMAGES.getWithMetadata(key, { type: "arrayBuffer" });
  if (!result || !result.value) {
    return new Response("Introuvable.", { status: 404 });
  }
  const contentType =
    (result.metadata && result.metadata.contentType) ||
    (match[2] === "png" ? "image/png" : match[2] === "jpg" ? "image/jpeg" : "image/webp");

  // Same-path rewrites (Remplacer / Recadré) — short TTL + updated_at ETag
  // so the front sees the new binary without waiting for a 1h edge cache.
  // Query `?v=updated_at` (main.js withAssetRev) is the primary bust.
  const exposedCache = "public, max-age=60, must-revalidate";
  const headers = {
    "Content-Type": contentType,
    "Cache-Control": work.exposed ? exposedCache : "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (work.updated_at) {
    headers.ETag = `"img-${kind}-${work.updated_at}"`;
  }
  return new Response(result.value, {
    status: 200,
    headers,
  });
}
