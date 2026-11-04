import { requireBasicAuth } from "../../../_shared/auth.js";
import {
  ALLOWED_CATEGORIES,
  LIBRARY_ID_RE,
  clean,
  json,
  kvKeys,
} from "../../../_shared/limits.js";
import { deleteWork, getWork, updateWorkMeta } from "../../../_shared/works.js";

export async function onRequestDelete(context) {
  const denied = requireBasicAuth(context.request, context.env);
  if (denied) return denied;
  if (context.request.headers.get("X-Atelier") !== "1") {
    return json(403, { error: "Requête refusée." });
  }
  const workId = context.params.id;
  // Toute entrée bibliothèque (ajouts KV et seeds assets site).
  if (!LIBRARY_ID_RE.test(workId || "")) {
    return json(400, { error: "Œuvre inconnue." });
  }
  const target = await getWork(context.env.DB, workId);
  if (!target) {
    return json(404, { error: "Œuvre inconnue." });
  }
  const keys = kvKeys(workId);
  // D1 d’abord : si l’écriture KV échoue ensuite, pas de fiche orpheline cassée.
  try {
    await deleteWork(context.env.DB, workId);
  } catch {
    return json(500, { error: "Suppression des métadonnées impossible." });
  }
  await context.env.IMAGES.delete(keys.detail).catch(() => {});
  await context.env.IMAGES.delete(keys.web).catch(() => {});
  await context.env.IMAGES.delete(keys.preview).catch(() => {});
  return json(200, { ok: true, id: workId });
}

async function onRequestPatch(context) {
  const denied = requireBasicAuth(context.request, context.env);
  if (denied) return denied;
  if (context.request.headers.get("X-Atelier") !== "1") {
    return json(403, { error: "Requête refusée." });
  }
  const workId = context.params.id;
  if (!LIBRARY_ID_RE.test(workId || "")) {
    return json(400, { error: "Œuvre inconnue." });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json(400, { error: "JSON invalide." });
  }
  if (!body || typeof body !== "object") {
    return json(400, { error: "JSON invalide." });
  }

  const patch = {};
  if ("artist" in body) patch.artist = clean(body.artist, 120);
  if ("title" in body) patch.title = clean(body.title, 140);
  if ("note" in body) patch.note = clean(body.note, 200);
  if ("signed_dated" in body) patch.signed_dated = clean(body.signed_dated, 120);
  if ("support" in body) patch.support = clean(body.support, 180);
  if ("dimensions" in body) patch.dimensions = clean(body.dimensions, 120);
  if ("editions" in body) patch.editions = clean(body.editions, 180);
  if ("alt" in body) patch.alt = clean(body.alt, 180);
  if ("categories" in body) {
    const raw = Array.isArray(body.categories)
      ? body.categories
      : String(body.categories || "").split(/[\s,]+/);
    patch.categories = raw
      .map((item) => clean(item, 40))
      .filter((item) => ALLOWED_CATEGORIES.has(item));
    if (!patch.categories.length) {
      return json(400, {
        error: "Cochez au moins une option : peinture, miniature ou aquarelle.",
      });
    }
  }
  if ("exposed" in body) {
    patch.exposed = body.exposed === true || body.exposed === 1 || body.exposed === "1";
  }
  if ("carousel" in body) {
    patch.carousel =
      body.carousel === true || body.carousel === 1 || body.carousel === "1";
  }
  if ("order" in body) {
    const order = Number(body.order);
    if (!Number.isFinite(order) || order < 0 || order > 1_000_000_000) {
      return json(400, { error: "Ordre invalide." });
    }
    patch.order = Math.floor(order);
  }

  const patchKeys = [
    "artist",
    "title",
    "note",
    "signed_dated",
    "support",
    "dimensions",
    "editions",
    "alt",
    "categories",
    "exposed",
    "carousel",
    "order",
  ];
  if (!patchKeys.some((key) => key in patch)) {
    return json(400, { error: "Aucun champ à enregistrer." });
  }
  if ("artist" in patch && !patch.artist) {
    return json(400, { error: "L’artiste est nécessaire." });
  }
  if ("title" in patch && !patch.title) {
    return json(400, { error: "Le titre est nécessaire." });
  }

  try {
    const updated = await updateWorkMeta(context.env.DB, workId, patch);
    if (!updated) return json(404, { error: "Œuvre inconnue." });
    return json(200, updated);
  } catch (error) {
    if (error && error.message === "required") {
      return json(400, { error: "Le titre est nécessaire." });
    }
    if (error && error.message === "categories") {
      return json(400, {
        error: "Cochez au moins une option : peinture, miniature ou aquarelle.",
      });
    }
    if (error && error.message === "order") {
      return json(400, { error: "Ordre invalide." });
    }
    return json(500, { error: "Enregistrement impossible." });
  }
}

export async function onRequest(context) {
  if (context.request.method === "DELETE") return onRequestDelete(context);
  if (context.request.method === "PATCH") return onRequestPatch(context);
  return json(405, { error: "Méthode non autorisée." });
}
