import { requireBasicAuth } from "../../../../_shared/auth.js";
import {
  APP_MAX_BODY_BYTES,
  ASSET_RE,
  ID_RE,
  META_MAX,
  clean,
  json,
  kvKeys,
  validateImageForKv,
} from "../../../../_shared/limits.js";
import { getWork, updateWorkImages } from "../../../../_shared/works.js";

/**
 * Remplace l’image d’un ajout existant (original + web + vignette).
 * Métadonnées Artlogic inchangées ; crop carousel invalidé.
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

  const detailFile = form.get("detail");
  const previewFile = form.get("preview");
  const webFile = form.get("web");
  if (!(detailFile instanceof File) || !(previewFile instanceof File)) {
    return json(400, { error: "Les deux images, aperçu et détail, sont nécessaires." });
  }
  if (!(webFile instanceof File)) {
    return json(400, { error: "L’image web (dérivé d’affichage) est nécessaire." });
  }

  const source_file = clean(form.get("source_file"), META_MAX.source_file);

  const detailBuf = await detailFile.arrayBuffer();
  const previewBuf = await previewFile.arrayBuffer();
  const webBuf = await webFile.arrayBuffer();
  const detail = validateImageForKv(detailBuf, "Image originale");
  if (!detail.ok) return json(detail.status, { error: detail.error });
  const preview = validateImageForKv(previewBuf, "Image aperçu");
  if (!preview.ok) return json(preview.status, { error: preview.error });
  const web = validateImageForKv(webBuf, "Image web");
  if (!web.ok) return json(web.status, { error: web.error });

  const imagePath = `images/ajouts/${workId}.${detail.ext}`;
  const webPath = `images/ajouts/web/${workId}.${web.ext}`;
  const previewPath = `images/ajouts/preview/${workId}.${preview.ext}`;
  if (
    !ASSET_RE.test(imagePath) ||
    !ASSET_RE.test(webPath) ||
    !ASSET_RE.test(previewPath)
  ) {
    return json(400, { error: "Chemin refusé." });
  }

  const keys = kvKeys(workId);
  try {
    await env.IMAGES.put(keys.detail, detail.bytes, {
      metadata: { contentType: detail.ctype, kind: "original", id: workId },
    });
    await env.IMAGES.put(keys.web, web.bytes, {
      metadata: { contentType: web.ctype, kind: "web", id: workId },
    });
    await env.IMAGES.put(keys.preview, preview.bytes, {
      metadata: { contentType: preview.ctype, kind: "preview", id: workId },
    });
  } catch {
    return json(500, {
      error: "Écriture KV impossible (quota écritures/stockage ou erreur réseau).",
    });
  }

  try {
    const updated = await updateWorkImages(env.DB, workId, {
      image: imagePath,
      web: webPath,
      preview: previewPath,
      detail_ctype: detail.ctype,
      preview_ctype: preview.ctype,
      source_file,
    });
    if (!updated) {
      return json(404, { error: "Œuvre inconnue." });
    }
    // Ancien crop hero : plus valide pour la nouvelle photo.
    await env.IMAGES.delete(keys.carousel).catch(() => {});
    return json(200, updated);
  } catch (error) {
    if (error && error.message === "path") {
      return json(400, { error: "Chemin refusé." });
    }
    return json(500, { error: "Enregistrement métadonnées impossible." });
  }
}

export async function onRequest(context) {
  const denied = requireBasicAuth(context.request, context.env);
  if (denied) return denied;
  if (context.request.method === "POST") return onPost(context);
  return json(405, { error: "Méthode non autorisée." });
}
