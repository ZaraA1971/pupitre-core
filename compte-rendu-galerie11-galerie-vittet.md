# Compte-rendu — galerie11 Galerie Vittet

Date : 9 novembre 2026 · commit `69528c7` · branche `cursor/mobile-tableaux-d186`.

## Objectif

Déployer écarts ~50px desktop entre les photos about ; hauteur inchangée (~390 / pin galerie9). Cache-bust `?v=20261107-galerie11`.

## Contenu

- `--gal-photo-gap: clamp(28px, 3.5vw, 56px)` — respiration élargie (~50px desktop) entre les 3 photos
- `--gal-photo-h: min(405px, fit-row)` — hauteur pinnée galerie9 (~390) ; le gap ne réduit plus les images
- Front : `style.css` / `i18n.js` / `main.js` en `?v=20261107-galerie11`

## Compte Cloudflare

Compte Emmanuel (`69008766…`) · token API présent (len=53) · `CLOUDFLARE_ACCOUNT_ID` len=32 · pas de token Vittet.

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages/` + front mirror `/tmp/galerie-vittet-site/`. Gate `functions/images/ajouts` conservée.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `1f517e1e` · https://galerie-vittet-preview.pages.dev/ |
| Hash main | https://1f517e1e.galerie-vittet-preview.pages.dev/ |
| Preview | `2923ff41` · https://preview.galerie-vittet-preview.pages.dev/ |
| Hash preview | https://2923ff41.galerie-vittet-preview.pages.dev/ |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| `GET /api/oeuvres` | 200 · JSON · **103** œuvres · functions OK (prod + preview) |
| Cache-bust | `galerie11` ×3 (style/i18n/main) sur prod + preview + hashes |
| CSS | `--gal-photo-gap: clamp(28px, 3.5vw, 56px)` + hauteur pin `405px` / commentaire ~390 live |
| Atelier `/atelier/` | 401 (Basic Auth) |
