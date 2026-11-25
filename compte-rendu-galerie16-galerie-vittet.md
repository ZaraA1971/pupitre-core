# Compte-rendu — galerie16 Galerie Vittet (header spacing resserré)

Date : 9 novembre 2026 · commit `0e7ae55` · branche `cursor/mobile-tableaux-d186`.

## Objectif

Déployer le resserrage vertical du header (paddings / row-gaps / marges internes brand+contact) sans changer les tailles de typo ; cache-bust `?v=20261109-galerie16`.

## Contenu

- CSS : `.header` padding `6px / 10px`, `row-gap: 12px` ; wordmark / contact / phones / mail / hours gaps réduits ; mobile row-gap / padding alignés
- Assets front : `style.css` / `i18n.js` / `main.js` en `?v=20261109-galerie16`

## Compte Cloudflare

Compte Emmanuel (`69008766…`) · token API présent (len=53) · `CLOUDFLARE_ACCOUNT_ID` len=32 · pas de token Vittet.

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages/` + front mirror `/tmp/galerie-vittet-site/`. Gate `functions/images/ajouts` conservée.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `48a70705` · https://galerie-vittet-preview.pages.dev/ |
| Hash main | https://48a70705.galerie-vittet-preview.pages.dev/ |
| Preview | `20e43692` · https://preview.galerie-vittet-preview.pages.dev/ |
| Hash preview | https://20e43692.galerie-vittet-preview.pages.dev/ |
| Atelier | `94652da7` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Hash atelier | https://94652da7.galerie-vittet-preview.pages.dev/ |

## Vérif

| Check | Résultat |
|---|---|
| Markup package + live | `galerie16` ×3 (style/i18n/main) + CSS `padding: 6px` / `row-gap: 12px` sur main, preview, atelier (+ hashes) |
| Header markup | `header-menu-row` + `header-contact` présents (prod HTML) |
| `GET /api/oeuvres` | 200 · JSON · **104** œuvres (prod + preview + atelier) |
| Atelier `/atelier/` | 401 (Basic Auth) sur alias + hash |
