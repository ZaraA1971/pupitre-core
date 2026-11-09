# Compte-rendu — galerie14 Galerie Vittet (header UK/FR same row)

Date : 9 novembre 2026 · commit `35591f2` · branche `cursor/mobile-tableaux-d186`.

## Objectif

Déployer le correctif header front : UK/FR sur la même ligne que Collection / Galerie (`header-menu-row`), cache-bust `?v=20261109-galerie14`.

## Contenu

- Markup : `lang-switch` dans `.header-menu-row` avec la nav Collection / Galerie
- CSS : `.header-menu-row` aligne nav + langue (desktop + mobile)
- Assets front : `style.css` / `i18n.js` / `main.js` en `?v=20261109-galerie14`

## Compte Cloudflare

Compte Emmanuel (`69008766…`) · token API présent (len=53) · `CLOUDFLARE_ACCOUNT_ID` len=32 · pas de token Vittet.

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages/` + front mirror `/tmp/galerie-vittet-site/`. Gate `functions/images/ajouts` conservée.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `8643629c` · https://galerie-vittet-preview.pages.dev/ |
| Hash main | https://8643629c.galerie-vittet-preview.pages.dev/ |
| Preview | `bb97072e` · https://preview.galerie-vittet-preview.pages.dev/ |
| Hash preview | https://bb97072e.galerie-vittet-preview.pages.dev/ |
| Atelier | `764c4e6d` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Hash atelier | https://764c4e6d.galerie-vittet-preview.pages.dev/ |

## Vérif

| Check | Résultat |
|---|---|
| Markup package + live | `header-menu-row` + `galerie14` ×3 (style/i18n/main) sur main, preview, atelier (+ hashes) |
| UK/FR dans la row menu | `lang-switch` à l’intérieur de `.header-menu-row` (prod HTML) |
| `GET /api/oeuvres` | 200 · JSON · **104** œuvres (prod + preview + atelier + hashes) |
| Atelier `/atelier/` | 401 (Basic Auth) sur les six URLs |
