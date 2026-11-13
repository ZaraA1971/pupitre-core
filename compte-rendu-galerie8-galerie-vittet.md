# Compte-rendu — galerie8 Galerie Vittet

Date : 9 novembre 2026 · commit `f31dff6` · branche `cursor/mobile-tableaux-d186`.

## Objectif

Déployer photos about ~+30 % / max equal-height fit. Cache-bust `?v=20261107-galerie8`.

## Contenu

- `--gal-photo-h: min(338px, fit-row)` — cible +30 % vs galerie7 (260→338)
- Une hauteur partagée ; proportions natives ; pas de crop
- Front : `style.css` / `i18n.js` / `main.js` en `?v=20261107-galerie8`

## Compte Cloudflare

Compte Emmanuel (`69008766…`) · token API présent (len=53) · `CLOUDFLARE_ACCOUNT_ID` len=32 · pas de token Vittet.

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages/` + front mirror `/tmp/galerie-vittet-site/`. Gate `functions/images/ajouts` conservée.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `edbe1881` · https://galerie-vittet-preview.pages.dev/ |
| Hash main | https://edbe1881.galerie-vittet-preview.pages.dev/ |
| Preview | `c258950d` · https://preview.galerie-vittet-preview.pages.dev/ |
| Hash preview | https://c258950d.galerie-vittet-preview.pages.dev/ |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| `GET /api/oeuvres` | 200 · JSON · **103** œuvres · 7 carousel · functions OK |
| Cache-bust | `galerie8` ×3 (style/i18n/main) sur prod + preview + hashes |
| CSS | `338px` + commentaire Target +30% live |
| Atelier `/atelier/` | 401 (Basic Auth) |
