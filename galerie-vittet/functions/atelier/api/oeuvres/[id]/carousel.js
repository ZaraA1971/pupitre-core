import { requireBasicAuth } from "../../../../_shared/auth.js";
import {
  APP_MAX_BODY_BYTES,
  ASSET_RE,
  LIBRARY_ID_RE,
  json,
  kvKeys,
  validateImageForKv,
} from "../../../../_shared/limits.js";
import {
  getWork,
  updateWorkCarouselImage,
} from "../../../../_shared/works.js";

/** Dérivé carousel (cadre hero). Ne touche ni original, ni web, ni collection. */

function requireAtelierHeader(request) {
  if (request.headers.get("X-Atelier") !== "1") {
    return json(403, { error: "Requête refusée." });
  }
  return null;
}

function parseWorkId(context) {
  const workId = context.params.id;
  if (!LIBRARY_ID_RE.test(workId || "")) return null;
  return workId;
}

async function onPost(context) {
  const { request, env } = context;
  const denied = requireAtelierHeader(request);
  if (denied) return denied;

  const workId = parseWorkId(context);
  if (!workId) return json(400, { error: "Œuvre inconnue." });

  const lengthHeader = request.headers.get("Content-Length");
  if (lengthHeader != null) {
    const length = Number(lengthHeader);
    if (!Number.isFinite(length) || length < 0 || length > APP_MAX_BODY_BYTES) {
      return json(413, { error: "Fichier trop lourd." });
    }
  }

  const target = await getWork(env.DB, workId);
  if (!target) return json(404, { error: "Œuvre inconnue." });

  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: "Formulaire invalide." });
  }

  const cropFile = form.get("carousel");
  if (!(cropFile instanceof File)) {
    return json(400, { error: "Image carousel manquante." });
  }

  const crop = validateImageForKv(await cropFile.arrayBuffer(), "Image carousel");
  if (!crop.ok) return json(crop.status, { error: crop.error });

  const carouselPath = `images/ajouts/carousel/${workId}.${crop.ext}`;
  if (!ASSET_RE.test(carouselPath)) {
    return json(400, { error: "Chemin refusé." });
  }

  const keys = kvKeys(workId);
  const previous = target.carousel_image || "";
  try {
    await env.IMAGES.put(keys.carousel, crop.bytes, {
      metadata: { contentType: crop.ctype, kind: "carousel", id: workId },
    });
  } catch {
    return json(500, { error: "Écriture KV impossible." });
  }

  try {
    const updated = await updateWorkCarouselImage(env.DB, workId, {
      carousel_image: carouselPath,
    });
    if (!updated) {
      await env.IMAGES.delete(keys.carousel).catch(() => {});
      return json(404, { error: "Œuvre inconnue." });
    }
    return json(200, {
      ok: true,
      id: workId,
      carousel_image: carouselPath,
      previous_carousel_image: previous,
      bytes: crop.bytes.byteLength,
      work: updated,
    });
  } catch {
    await env.IMAGES.delete(keys.carousel).catch(() => {});
    return json(500, { error: "Enregistrement métadonnées impossible." });
  }
}

async function onDelete(context) {
  const { request, env } = context;
  const denied = requireAtelierHeader(request);
  if (denied) return denied;

  const workId = parseWorkId(context);
  if (!workId) return json(400, { error: "Œuvre inconnue." });

  const target = await getWork(env.DB, workId);
  if (!target) return json(404, { error: "Œuvre inconnue." });

  const keys = kvKeys(workId);
  await env.IMAGES.delete(keys.carousel).catch(() => {});
  const updated = await updateWorkCarouselImage(env.DB, workId, {
    carousel_image: "",
  });
  return json(200, { ok: true, id: workId, work: updated });
}

export async function onRequest(context) {
  const denied = requireBasicAuth(context.request, context.env);
  if (denied) return denied;
  if (context.request.method === "POST") return onPost(context);
  if (context.request.method === "DELETE") return onDelete(context);
  return json(405, { error: "Méthode non autorisée." });
}
