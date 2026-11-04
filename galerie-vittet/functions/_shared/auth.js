/** Authentification Basic réelle (équivalent Nginx auth_basic). */

export function unauthorized() {
  return new Response("Authentification requise.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Galerie Vittet Atelier", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.byteLength !== right.byteLength) {
    let acc = 0;
    for (let i = 0; i < left.byteLength; i++) acc |= left[i];
    for (let i = 0; i < right.byteLength; i++) acc |= right[i];
    return acc < 0;
  }
  let diff = 0;
  for (let i = 0; i < left.byteLength; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

export function requireBasicAuth(request, env) {
  const user = env.ATELIER_USER;
  const pass = env.ATELIER_PASS;
  if (!user || !pass) {
    return new Response("Atelier non configuré (secrets auth manquants).", {
      status: 503,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  }
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ")) return unauthorized();
  let decoded = "";
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return unauthorized();
  const givenUser = decoded.slice(0, sep);
  const givenPass = decoded.slice(sep + 1);
  if (!timingSafeEqual(givenUser, user) || !timingSafeEqual(givenPass, pass)) {
    return unauthorized();
  }
  return null;
}
