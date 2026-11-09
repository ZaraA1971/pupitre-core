# Compte-rendu — galerie15 Galerie Vittet (header aligné top VITTET)

Date : 9 novembre 2026 · commit `82682bc` · branche `cursor/mobile-tableaux-d186`.

## Objectif

Déployer le correctif header front : Collection / Galerie / UK alignés avec le haut de VITTET ; `header-menu-row` sibling de `header-contact` (pas imbriqué) ; cache-bust `?v=20261109-galerie15`.

## Contenu

- Markup : `.header-menu-row` et `.header-contact` enfants directs de `.header` (siblings)
- CSS : menu-row en `grid-row: 1` / `align-self: start` (niveau haut du wordmark) ; contact épinglé à la baseline adresse
- Assets front : `style.css` / `i18n.js` / `main.js` en `?v=20261109-galerie15`

## Compte Cloudflare

Compte Emmanuel (`69008766…`) · token API présent (len=53) · `CLOUDFLARE_ACCOUNT_ID` len=32 · pas de token Vittet.

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages/` + front mirror `/tmp/galerie-vittet-site/`. Gate `functions/images/ajouts` conservée.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `1c0741b9` · https://galerie-vittet-preview.pages.dev/ |
| Hash main | https://1c0741b9.galerie-vittet-preview.pages.dev/ |
| Preview | `ef2b3065` · https://preview.galerie-vittet-preview.pages.dev/ |
| Hash preview | https://ef2b3065.galerie-vittet-preview.pages.dev/ |
| Atelier | `3161c744` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Hash atelier | https://3161c744.galerie-vittet-preview.pages.dev/ |

## Vérif

| Check | Résultat |
|---|---|
| Markup package + live | `header-menu-row` sibling de `header-contact` + `galerie15` ×3 (style/i18n/main) sur main, preview, atelier (+ hashes) |
| UK/FR dans la row menu | `lang-switch` à l’intérieur de `.header-menu-row` (prod HTML) |
| `GET /api/oeuvres` | 200 · JSON · **104** œuvres (prod + preview + atelier) |
| Atelier `/atelier/` | 401 (Basic Auth) sur alias + hash |
