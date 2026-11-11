/**
 * Endpoint public (sans Basic Auth) — œuvres marquées exposed=1 uniquement.
 * Champ `carousel` inclus (bool). Payload : toutes les exposées (y compris
 * carousel=1) + tableau `carousel` dérivé. Le front filtre :
 * hero = carousel ; #collection = toutes les exposées (carousel inclus).
 * Ordre stable : sort_order ASC, created_at ASC, id ASC (via listWorks).
 * Sert le front preview ; les brouillons restent derrière /atelier/api.
 */
import {
  displayImagePath,
  ensureLibrary,
  listWorks,
  originalImagePath,
  workCaption,
} from "../_shared/works.js";

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * Public remap (documented):
 * - image / web = display (web derivative preferred)
 * - original = D1 `image` (loupe, lazy)
 * - atelier APIs keep D1 `image` as original, no remap
 */
function publicWork(work) {
  const display = displayImagePath(work);
  const original = originalImagePath(work);
  return {
    id: work.id,
    artist: work.artist,
    title: work.title,
    note: work.note || "",
    signed_dated: work.signed_dated || "",
    support: work.support || "",
    dimensions: work.dimensions || "",
    editions: work.editions || "",
    caption: workCaption(work),
    alt: work.alt || "",
    categories: work.categories || [],
    source_file: work.source_file || "",
    image: display,
    web: work.web || "",
    original,
    preview: work.preview,
    order: work.order || 0,
    carousel: !!work.carousel,
  };
}

export async function onRequestGet(context) {
  try {
    await ensureLibrary(context.env.DB);
    const works = await listWorks(context.env.DB);
    const oeuvres = works.filter((work) => work.exposed).map(publicWork);
    const carousel = oeuvres.filter((work) => work.carousel);
    return json(200, {
      version: 1,
      pageSize: 15,
      sections: ["peinture", "miniature", "nicolle"],
      oeuvres,
      carousel,
    });
  } catch {
    return json(500, { error: "Bibliothèque indisponible." });
  }
}
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "GET, OPTIONS",
      "Cache-Control": "no-store",
    },
  });
}
