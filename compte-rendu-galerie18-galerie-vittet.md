# Compte-rendu — galerie18 Galerie Vittet (header encore plus serré)

Date : 9 novembre 2026 · commit `a563aa1` · branche `cursor/mobile-tableaux-d186`.

## Objectif

Déployer un resserrage supplémentaire du rythme vertical du header (paddings / row-gaps) sans changer les tailles de typo ; cache-bust `?v=20261109-galerie18`.

## Contenu

- CSS : `.header` padding `4px / 6px`, `row-gap: 6px` ; rythme brand+contact resserré ; mobile aligné
- Assets front : `style.css` / `i18n.js` / `main.js` en `?v=20261109-galerie18`

## Compte Cloudflare

Compte Emmanuel (`69008766…`) · token API présent (len=53) · `CLOUDFLARE_ACCOUNT_ID` len=32 · pas de token Vittet.

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages/` + front mirror `/tmp/galerie-vittet-site/`. Gate `functions/images/ajouts` conservée.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `52f4efc6` · https://galerie-vittet-preview.pages.dev/ |
| Hash main | https://52f4efc6.galerie-vittet-preview.pages.dev/ |
| Preview | `56c358a0` · https://preview.galerie-vittet-preview.pages.dev/ |
| Hash preview | https://56c358a0.galerie-vittet-preview.pages.dev/ |
| Atelier | `73088590` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Hash atelier | https://73088590.galerie-vittet-preview.pages.dev/ |

## Vérif

| Check | Résultat |
|---|---|
| Markup package + live | `galerie18` ×3 (style/i18n/main) + CSS `padding: 4px` / `row-gap: 6px` sur main, preview, atelier (+ hashes) |
| Header markup | `header-menu-row` + `header-contact` présents (prod HTML) |
| `GET /api/oeuvres` | 200 · JSON · **104** œuvres (prod + preview + atelier) |
| Atelier `/atelier/` | 401 (Basic Auth) sur alias + hash |
