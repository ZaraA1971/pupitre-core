# Compte-rendu — galerie13 Galerie Vittet

Date : 9 novembre 2026 · commit `182e3dc` · branche `cursor/mobile-tableaux-d186` (rapport `cursor/galerie13-deploy-c77d`).

## Objectif

Déployer Collection / Galerie dans le header au-dessus du switch UK/FR. Cache-bust `?v=20261107-galerie13`.

## Contenu

- `.header-nav` — liens Collection (`#collection`) et Galerie (`#galerie`) au-dessus de `.lang-switch`
- Front : `style.css` / `i18n.js` / `main.js` en `?v=20261107-galerie13`

## Compte Cloudflare

Compte Emmanuel (`69008766…`) · token API présent (len=53) · `CLOUDFLARE_ACCOUNT_ID` len=32 · pas de token Vittet.

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages/` + front mirror `/tmp/galerie-vittet-site/`. Gate `functions/images/ajouts` conservée.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `2d9d8345` · https://galerie-vittet-preview.pages.dev/ |
| Hash main | https://2d9d8345.galerie-vittet-preview.pages.dev/ |
| Preview | `3639f182` · https://preview.galerie-vittet-preview.pages.dev/ |
| Hash preview | https://3639f182.galerie-vittet-preview.pages.dev/ |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| `GET /api/oeuvres` | 200 · JSON · **103** œuvres · functions OK (prod + preview) |
| Cache-bust | `galerie13` ×3 (style/i18n/main) sur prod + preview + hashes |
| Header | `header-nav` présent · Collection/Galerie avant UK/FR |
| CSS | `.header-nav` live sur prod + preview |
| Atelier `/atelier/` | 401 (Basic Auth) |
