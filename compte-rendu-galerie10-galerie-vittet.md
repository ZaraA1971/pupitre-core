# Compte-rendu — galerie10 Galerie Vittet

Date : 9 novembre 2026 · commit `190e351` · branche `cursor/mobile-tableaux-d186`.

## Objectif

Déployer écarts élargis entre les photos about ; hauteur inchangée (~390 / pin galerie9). Cache-bust `?v=20261107-galerie10`.

## Contenu

- `--gal-photo-gap: clamp(20px, 2.6vw, 40px)` — respiration élargie entre les 3 photos
- `--gal-photo-h: min(405px, fit-row)` — hauteur pinnée galerie9 (~390) ; le gap ne réduit plus les images
- Front : `style.css` / `i18n.js` / `main.js` en `?v=20261107-galerie10`

## Compte Cloudflare

Compte Emmanuel (`69008766…`) · token API présent (len=53) · `CLOUDFLARE_ACCOUNT_ID` len=32 · pas de token Vittet.

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages/` + front mirror `/tmp/galerie-vittet-site/`. Gate `functions/images/ajouts` conservée.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `17291cba` · https://galerie-vittet-preview.pages.dev/ |
| Hash main | https://17291cba.galerie-vittet-preview.pages.dev/ |
| Preview | `8cd625fc` · https://preview.galerie-vittet-preview.pages.dev/ |
| Hash preview | https://8cd625fc.galerie-vittet-preview.pages.dev/ |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| `GET /api/oeuvres` | 200 · JSON · **103** œuvres · functions OK (prod + preview) |
| Cache-bust | `galerie10` ×3 (style/i18n/main) sur prod + preview + hashes |
| CSS | `--gal-photo-gap: clamp(20px, 2.6vw, 40px)` + hauteur pin `405px` / commentaire ~390 live |
| Atelier `/atelier/` | 401 (Basic Auth) |
