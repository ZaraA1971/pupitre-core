import { requireBasicAuth } from "../../_shared/auth.js";
import { ASSET_RE, ID_RE, kvKeys } from "../../_shared/limits.js";
import { getWork } from "../../_shared/works.js";

/**
 * Sert les binaires KV derrière le même chemin logique que Scaleway.
 * Variantes : original (images/ajouts/id.ext), web/ (affichage), preview/ (vignette).
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
  }

  const match = /^([a-z0-9][a-z0-9._-]{0,80})\.(webp|jpg|png)$/.exec(fileName);
  if (!match) {
    return new Response("Introuvable.", { status: 404 });
  }
  const id = match[1];
  if (!ID_RE.test(id)) {
    return new Response("Introuvable.", { status: 404 });
  }

  const work = await getWork(context.env.DB, id);
  if (!work) {
    return new Response("Introuvable.", { status: 404 });
  }

  const expected =
    kind === "preview" ? work.preview : kind === "web" ? work.web : work.image;
  if (!expected || expected !== assetPath) {
    return new Response("Introuvable.", { status: 404 });
  }

  if (!work.exposed) {
    const denied = requireBasicAuth(context.request, context.env);
    if (denied) return denied;
  }

  const keys = kvKeys(id);
  const key = kind === "preview" ? keys.preview : kind === "web" ? keys.web : keys.detail;
  const result = await context.env.IMAGES.getWithMetadata(key, { type: "arrayBuffer" });
  if (!result || !result.value) {
    return new Response("Introuvable.", { status: 404 });
  }
  const contentType =
    (result.metadata && result.metadata.contentType) ||
    (match[2] === "png" ? "image/png" : match[2] === "jpg" ? "image/jpeg" : "image/webp");

  return new Response(result.value, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": work.exposed ? "public, max-age=3600" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
