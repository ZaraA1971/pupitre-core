# Compte-rendu — galerie17 Galerie Vittet (header encore plus serré)

Date : 9 novembre 2026 · commit `1cbf2ee` · branche `cursor/mobile-tableaux-d186`.

## Objectif

Déployer un resserrage supplémentaire du rythme vertical du header (paddings / row-gaps / marges brand+contact) sans changer les tailles de typo ; cache-bust `?v=20261109-galerie17`.

## Contenu

- CSS : `.header` padding `5px / 8px`, `row-gap: 9px` ; wordmark / contact / phones / mail / hours gaps réduits ; mobile row-gap / padding alignés
- Assets front : `style.css` / `i18n.js` / `main.js` en `?v=20261109-galerie17`

## Compte Cloudflare

Compte Emmanuel (`69008766…`) · token API présent (len=53) · `CLOUDFLARE_ACCOUNT_ID` len=32 · pas de token Vittet.

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages/` + front mirror `/tmp/galerie-vittet-site/`. Gate `functions/images/ajouts` conservée.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `ff80a850` · https://galerie-vittet-preview.pages.dev/ |
| Hash main | https://ff80a850.galerie-vittet-preview.pages.dev/ |
| Preview | `21d5416f` · https://preview.galerie-vittet-preview.pages.dev/ |
| Hash preview | https://21d5416f.galerie-vittet-preview.pages.dev/ |
| Atelier | `a317bc4b` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Hash atelier | https://a317bc4b.galerie-vittet-preview.pages.dev/ |

## Vérif

| Check | Résultat |
|---|---|
| Markup package + live | `galerie17` ×3 (style/i18n/main) + CSS `padding: 5px` / `row-gap: 9px` sur main, preview, atelier (+ hashes) |
| Header markup | `header-menu-row` + `header-contact` présents (prod HTML) |
| `GET /api/oeuvres` | 200 · JSON · **104** œuvres (prod + preview + atelier) |
| Atelier `/atelier/` | 401 (Basic Auth) sur alias + hash |
