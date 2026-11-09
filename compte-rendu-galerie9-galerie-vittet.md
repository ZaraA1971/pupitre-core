# Compte-rendu — galerie9 Galerie Vittet

Date : 9 novembre 2026 · commit `9fe3358` · branche `cursor/mobile-tableaux-d186`.

## Objectif

Déployer photos about ~+20 % / max equal-height fit. Cache-bust `?v=20261107-galerie9`.

## Contenu

- `--gal-photo-h: min(405px, fit-row)` — cible +20 % vs galerie8 (338→405)
- Une hauteur partagée ; proportions natives ; pas de crop
- Front : `style.css` / `i18n.js` / `main.js` en `?v=20261107-galerie9`

## Compte Cloudflare

Compte Emmanuel (`69008766…`) · token API présent (len=53) · `CLOUDFLARE_ACCOUNT_ID` len=32 · pas de token Vittet.

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages/` + front mirror `/tmp/galerie-vittet-site/`. Gate `functions/images/ajouts` conservée.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `e8302a88` · https://galerie-vittet-preview.pages.dev/ |
| Hash main | https://e8302a88.galerie-vittet-preview.pages.dev/ |
| Preview | `ef3ed627` · https://preview.galerie-vittet-preview.pages.dev/ |
| Hash preview | https://ef3ed627.galerie-vittet-preview.pages.dev/ |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| `GET /api/oeuvres` | 200 · JSON · **103** œuvres · 7 carousel · functions OK |
| Cache-bust | `galerie9` ×3 (style/i18n/main) sur prod + preview + hashes |
| CSS | `405px` + commentaire +20% vs galerie8 live |
| Atelier `/atelier/` | 401 (Basic Auth) |
