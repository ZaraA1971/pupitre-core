/**
 * Export métadonnées D1 (catalogue CMS complet, pas seulement exposed).
 * Protégé par Basic Auth (middleware /atelier + requireBasicAuth).
 * Chemins image uniquement — pas de binaires.
 */
import { requireBasicAuth } from "../../../_shared/auth.js";
import { ensureLibrary, listWorks } from "../../../_shared/works.js";

function exportFilename(date = new Date()) {
  const stamp = date.toISOString().slice(0, 10);
  return `galerie-vittet-oeuvres-${stamp}.json`;
}

function exportPayload(works) {
  return {
    version: 1,
    format: "galerie-vittet-oeuvres-export",
    exported_at: new Date().toISOString(),
    source: "galerie-vittet-oeuvres",
    count: works.length,
    oeuvres: works.map((work) => ({
      id: work.id,
      artist: work.artist || "",
      title: work.title || "",
      note: work.note || "",
      signed_dated: work.signed_dated || "",
      support: work.support || "",
      dimensions: work.dimensions || "",
      editions: work.editions || "",
      source_file: work.source_file || "",
      alt: work.alt || "",
      categories: Array.isArray(work.categories) ? work.categories : [],
      image: work.image || "",
      web: work.web || "",
      preview: work.preview || "",
      created_at: work.created_at || "",
      updated_at: work.updated_at || work.created_at || "",
      exposed: !!work.exposed,
      carousel: !!work.carousel,
      order: Number.isFinite(work.order) ? work.order : 1000,
      source: work.source || "",
    })),
  };
}

async function onGet(context) {
  try {
    await ensureLibrary(context.env.DB);
    const works = await listWorks(context.env.DB);
    const payload = exportPayload(works);
    const body = `${JSON.stringify(payload, null, 2)}\n`;
    const filename = exportFilename();
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Export-Count": String(payload.count),
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Export impossible." }), {
      status: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}

export async function onRequest(context) {
  const denied = requireBasicAuth(context.request, context.env);
  if (denied) return denied;
  if (context.request.method === "GET") return onGet(context);
  return new Response(JSON.stringify({ error: "Méthode non autorisée." }), {
    status: 405,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      Allow: "GET",
    },
  });
}
