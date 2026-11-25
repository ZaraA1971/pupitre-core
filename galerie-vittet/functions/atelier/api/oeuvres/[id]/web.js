import { requireBasicAuth } from "../../../../_shared/auth.js";
import {
  APP_MAX_BODY_BYTES,
  ASSET_RE,
  ID_RE,
  json,
  kvKeys,
  validateImageForKv,
} from "../../../../_shared/limits.js";
import { getWork, updateWorkWeb } from "../../../../_shared/works.js";

/**
 * Remplace / crée le dérivé web d’une œuvre existante (backfill).
 * Ne touche jamais à l’original (KV detail: / D1 image).
 */
async function onPost(context) {
  const { request, env } = context;
  if (request.headers.get("X-Atelier") !== "1") {
    return json(403, { error: "Requête refusée." });
  }

  const workId = context.params.id;
  if (!ID_RE.test(workId || "")) {
    return json(400, { error: "Œuvre inconnue." });
  }

  const lengthHeader = request.headers.get("Content-Length");
  if (lengthHeader != null) {
    const length = Number(lengthHeader);
    if (!Number.isFinite(length) || length < 0 || length > APP_MAX_BODY_BYTES) {
      return json(413, { error: "Fichier trop lourd." });
    }
  }

  const target = await getWork(env.DB, workId);
  if (!target) {
    return json(404, { error: "Œuvre inconnue." });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: "Formulaire invalide." });
  }

  const webFile = form.get("web");
  if (!(webFile instanceof File)) {
    return json(400, { error: "Image web manquante." });
  }

  const webBuf = await webFile.arrayBuffer();
  const web = validateImageForKv(webBuf, "Image web");
  if (!web.ok) return json(web.status, { error: web.error });

  const webPath = `images/ajouts/web/${workId}.${web.ext}`;
  if (!ASSET_RE.test(webPath)) {
    return json(400, { error: "Chemin refusé." });
  }

  const keys = kvKeys(workId);
  const previousWeb = target.web || "";
  try {
    await env.IMAGES.put(keys.web, web.bytes, {
      metadata: { contentType: web.ctype, kind: "web", id: workId },
    });
  } catch {
    return json(500, { error: "Écriture KV impossible." });
  }

  try {
    const updated = await updateWorkWeb(env.DB, workId, { web: webPath });
    if (!updated) {
      await env.IMAGES.delete(keys.web).catch(() => {});
      return json(404, { error: "Œuvre inconnue." });
    }
    // Ancien fichier web d’extension différente : même clé KV (écrasée). Chemin D1 mis à jour.
    return json(200, {
      ok: true,
      id: workId,
      web: webPath,
      previous_web: previousWeb,
      bytes: web.bytes.byteLength,
    });
  } catch {
    await env.IMAGES.delete(keys.web).catch(() => {});
    return json(500, { error: "Enregistrement métadonnées impossible." });
  }
}

export async function onRequest(context) {
  const denied = requireBasicAuth(context.request, context.env);
  if (denied) return denied;
  if (context.request.method === "POST") return onPost(context);
  return json(405, { error: "Méthode non autorisée." });
}
