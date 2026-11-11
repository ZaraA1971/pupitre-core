import { requireBasicAuth } from "../../_shared/auth.js";
import {
  ALLOWED_CATEGORIES,
  APP_MAX_BODY_BYTES,
  ID_RE,
  ASSET_RE,
  LIBRARY_ID_RE,
  META_MAX,
  clean,
  cleanMultiline,
  json,
  kvKeys,
  slugify,
  validateImageForKv,
} from "../../_shared/limits.js";
import {
  ensureLibrary,
  insertWork,
  listWorks,
  nextSortOrder,
  takenIds,
  updateWorkOrders,
} from "../../_shared/works.js";

async function onGet(context) {
  await ensureLibrary(context.env.DB);
  const works = await listWorks(context.env.DB);
  return json(200, works);
}

/** Bulk `{ orders: [{ id, order }] }` → D1 `sort_order` (indépendant du carousel). */
async function onPatch(context) {
  const { request, env } = context;
  if (request.headers.get("X-Atelier") !== "1") {
    return json(403, { error: "Requête refusée." });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "JSON invalide." });
  }
  if (!body || typeof body !== "object" || !Array.isArray(body.orders)) {
    return json(400, { error: "Champ orders (tableau) nécessaire." });
  }
  if (!body.orders.length) {
    return json(400, { error: "Aucune œuvre à réordonner." });
  }
  if (body.orders.length > 500) {
    return json(400, { error: "Trop d’œuvres (max 500)." });
  }
  const seen = new Set();
  const orders = [];
  for (const item of body.orders) {
    if (!item || typeof item !== "object") {
      return json(400, { error: "Entrée orders invalide." });
    }
    const id = String(item.id || "");
    if (!LIBRARY_ID_RE.test(id) || seen.has(id)) {
      return json(400, { error: "Identifiant invalide ou en double." });
    }
    seen.add(id);
    const order = Number(item.order);
    if (!Number.isFinite(order) || order < 0 || order > 1_000_000_000) {
      return json(400, { error: "Ordre invalide." });
    }
    orders.push({ id, order: Math.floor(order) });
  }

  try {
    await ensureLibrary(env.DB);
    const existing = await takenIds(env.DB);
    for (const item of orders) {
      if (!existing.has(item.id)) {
        return json(404, { error: `Œuvre inconnue : ${item.id}` });
      }
    }
    const result = await updateWorkOrders(env.DB, orders);
    return json(200, { ok: true, count: result.count, updated_at: result.updated_at });
  } catch (error) {
    if (error && (error.message === "id" || error.message === "order" || error.message === "orders")) {
      return json(400, { error: "Données d’ordre invalides." });
    }
    return json(500, { error: "Enregistrement de l’ordre impossible." });
  }
}

async function onPost(context) {
  const { request, env } = context;
  if (request.headers.get("X-Atelier") !== "1") {
    return json(403, { error: "Requête refusée." });
  }
  const lengthHeader = request.headers.get("Content-Length");
  if (lengthHeader != null) {
    const length = Number(lengthHeader);
    if (!Number.isFinite(length) || length < 0 || length > APP_MAX_BODY_BYTES) {
      return json(413, { error: "Fichier trop lourd." });
    }
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: "Formulaire invalide." });
  }

  const quick =
    clean(form.get("quick"), 8) === "1" || clean(form.get("quick"), 8) === "true";
  let artist = clean(form.get("artist"), META_MAX.artist);
  let title = clean(form.get("title"), META_MAX.title);
  const note = cleanMultiline(form.get("note"), META_MAX.note);
  const signed_dated = clean(form.get("signed_dated"), META_MAX.signed_dated);
  const support = clean(form.get("support"), META_MAX.support);
  const dimensions = clean(form.get("dimensions"), META_MAX.dimensions);
  const editions = clean(form.get("editions"), META_MAX.editions);
  const source_file = clean(form.get("source_file"), META_MAX.source_file);
  let alt = clean(form.get("alt"), META_MAX.alt);
  let categories = clean(form.get("categories"), 80)
    .split(" ")
    .filter((item) => ALLOWED_CATEGORIES.has(item));
  const exposedRaw = clean(form.get("exposed"), 8);
  const carouselRaw = clean(form.get("carousel"), 8);
  // Import rapide : jamais exposé / carousel (placeholders minimaux).
  const exposed = quick ? false : exposedRaw === "1" || exposedRaw === "true";
  const carousel = quick
    ? false
    : carouselRaw === "1" || carouselRaw === "true";

  if (quick) {
    if (!title) title = source_file || "Sans titre";
    if (!categories.length) categories = ["peinture"];
    // artiste vide autorisé ; alt = titre temporaire si absent
    if (!alt) alt = title;
  } else {
    if (!artist || !title) {
      return json(400, { error: "L’artiste et le titre sont nécessaires." });
    }
    if (!categories.length) {
      return json(400, { error: "Cochez au moins une option : peinture, miniature ou aquarelle." });
    }
    if (!alt) alt = title;
  }

  const detailFile = form.get("detail");
  const previewFile = form.get("preview");
  const webFile = form.get("web");
  if (!(detailFile instanceof File) || !(previewFile instanceof File)) {
    return json(400, { error: "Les deux images, aperçu et détail, sont nécessaires." });
  }
  if (!(webFile instanceof File)) {
    return json(400, {
      error: "L’image web (dérivé d’affichage) est nécessaire.",
    });
  }

  const detailBuf = await detailFile.arrayBuffer();
  const previewBuf = await previewFile.arrayBuffer();
  const webBuf = await webFile.arrayBuffer();
  const detail = validateImageForKv(detailBuf, "Image originale");
  if (!detail.ok) return json(detail.status, { error: detail.error });
  const preview = validateImageForKv(previewBuf, "Image aperçu");
  if (!preview.ok) return json(preview.status, { error: preview.error });
  const web = validateImageForKv(webBuf, "Image web");
  if (!web.ok) return json(web.status, { error: web.error });

  await ensureLibrary(env.DB);
  const existing = await takenIds(env.DB);
  // Préférer le nom de fichier source (meilleur matching Artlogic main_image).
  const fileStem = source_file
    ? source_file.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "")
    : "";
  const base = slugify(fileStem) || slugify(title);
  let workId = `ajout-${base}`;
  let number = 2;
  while (existing.has(workId)) {
    workId = `ajout-${base}-${number}`;
    number += 1;
  }
  if (!ID_RE.test(workId)) {
    return json(400, { error: "Le titre ne donne pas un nom de fichier utilisable." });
  }

  const stamp = new Date().toISOString().slice(0, 19).replace("T", " ");
  // Append en fin d’ordre vitrine — ne casse pas les groupes existants.
  const order = await nextSortOrder(env.DB);
  const work = {
    id: workId,
    artist,
    title,
    note,
    signed_dated,
    support,
    dimensions,
    editions,
    source_file,
    alt,
    categories,
    image: `images/ajouts/${workId}.${detail.ext}`,
    web: `images/ajouts/web/${workId}.${web.ext}`,
    preview: `images/ajouts/preview/${workId}.${preview.ext}`,
    detail_ctype: detail.ctype,
    preview_ctype: preview.ctype,
    exposed,
    carousel,
    order,
    created_at: stamp,
    updated_at: stamp,
  };
  if (!ASSET_RE.test(work.image) || !ASSET_RE.test(work.preview) || !ASSET_RE.test(work.web)) {
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
  } catch (error) {
    await env.IMAGES.delete(keys.detail).catch(() => {});
    await env.IMAGES.delete(keys.web).catch(() => {});
    await env.IMAGES.delete(keys.preview).catch(() => {});
    return json(500, {
      error: "Écriture KV impossible (quota écritures/stockage ou erreur réseau).",
    });
  }

  try {
    await insertWork(env.DB, work);
  } catch {
    await env.IMAGES.delete(keys.detail).catch(() => {});
    await env.IMAGES.delete(keys.web).catch(() => {});
    await env.IMAGES.delete(keys.preview).catch(() => {});
    return json(500, { error: "Enregistrement métadonnées impossible." });
  }

  const { detail_ctype, preview_ctype, ...publicWork } = work;
  return json(201, {
    ...publicWork,
    source: "ajout",
  });
}

export async function onRequest(context) {
  const denied = requireBasicAuth(context.request, context.env);
  if (denied) return denied;
  if (context.request.method === "GET") return onGet(context);
  if (context.request.method === "POST") return onPost(context);
  if (context.request.method === "PATCH") return onPatch(context);
  return json(405, { error: "Méthode non autorisée." });
}
