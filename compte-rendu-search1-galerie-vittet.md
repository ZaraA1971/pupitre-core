# Compte-rendu — search1 Galerie Vittet (atelier instant search)

Date : 9 novembre 2026 · commit `016960f` · branche `cursor/mobile-tableaux-d186`.

## Objectif

Déployer la recherche instantanée atelier (`#catalog-filter-search` après le tri) avec cache-bust `?v=20261109-search1`.

## Contenu

- Champ `#catalog-filter-search` placé après `#catalog-sort` dans la barre filtres atelier
- Filtre instantané titre / artiste / note / support / dimensions / id (`atelier.js`)
- Assets atelier : `style.css` / `atelier.css` / `atelier.js` en `?v=20261109-search1`

## Compte Cloudflare

Compte Emmanuel (`69008766…`) · token API présent (len=53) · `CLOUDFLARE_ACCOUNT_ID` len=32 · pas de token Vittet.

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages/` + front mirror `/tmp/galerie-vittet-site/`. Gate `functions/images/ajouts` conservée.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `cc8ce71e` · https://galerie-vittet-preview.pages.dev/ |
| Hash main | https://cc8ce71e.galerie-vittet-preview.pages.dev/ |
| Preview | `c7d7f321` · https://preview.galerie-vittet-preview.pages.dev/ |
| Hash preview | https://c7d7f321.galerie-vittet-preview.pages.dev/ |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| `GET /api/oeuvres` | 200 · JSON · **104** œuvres · functions OK (prod + preview + hashes + atelier alias) |
| Markup package | `#catalog-filter-search` **après** `#catalog-sort` · `search1` ×3 (style/atelier.css/atelier.js) |
| Atelier `/atelier/` | 401 (Basic Auth) sur prod, preview, hashes et alias atelier |
