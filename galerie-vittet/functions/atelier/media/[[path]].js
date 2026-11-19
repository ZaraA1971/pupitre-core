import { requireBasicAuth } from "../../_shared/auth.js";
import { PUBLIC_ASSET_RE } from "../../_shared/limits.js";
import { listWorks } from "../../_shared/works.js";

/**
 * Proxy Basic Auth des assets site (hors /images/ajouts KV) pour l’atelier.
 * Allowlist = chemins image/web/preview des œuvres D1 (pas de liste seed parallèle).
 */
function collectAllowed(works) {
  const allowed = new Set();
  for (const work of works) {
    for (const key of ["image", "web", "preview"]) {
      const path = work[key];
      if (
        typeof path === "string" &&
        PUBLIC_ASSET_RE.test(path) &&
        !path.includes("/ajouts/")
      ) {
        allowed.add(path);
      }
    }
  }
  return allowed;
}

export async function onRequest(context) {
  const denied = requireBasicAuth(context.request, context.env);
  if (denied) return denied;

  const parts = context.params.path;
  const rel = Array.isArray(parts) ? parts.join("/") : String(parts || "");
  const assetPath = rel.startsWith("images/") ? rel : `images/${rel}`;

  let allowed = new Set();
  try {
    const fromDb = await listWorks(context.env.DB);
    allowed = collectAllowed(fromDb);
  } catch {
    return new Response("Médias indisponibles.", { status: 502 });
  }

  if (!allowed.has(assetPath)) {
    return new Response("Introuvable.", { status: 404 });
  }

  const assetUrl = new URL(`/${assetPath}`, context.request.url);
  const assetRequest = new Request(assetUrl.toString(), {
    method: "GET",
    headers: { Accept: context.request.headers.get("Accept") || "*/*" },
  });

  let upstream;
  try {
    if (context.env.ASSETS && typeof context.env.ASSETS.fetch === "function") {
      upstream = await context.env.ASSETS.fetch(assetRequest);
    } else {
      upstream = await fetch(assetRequest);
    }
  } catch {
    return new Response("Médias indisponibles.", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("Introuvable.", { status: 404 });
  }

  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "private, max-age=300");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(upstream.body, { status: upstream.status, headers });
}
