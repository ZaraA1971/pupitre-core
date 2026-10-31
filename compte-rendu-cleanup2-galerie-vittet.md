# Cleanup 2 — Galerie Vittet (helpers + dead paths)

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| API publique | https://galerie-vittet-preview.pages.dev/api/oeuvres |
| Export | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/api/export/oeuvres |

Cache-bust : `?v=20261031-cleanup2`.

Déploiements : production `9f271d9a` (main) ; preview `c9ede335` (`atelier-kv-preview`).

## Retiré / unifié

- Front : `absoluteAsset` + copies display/original → `assetPath` + `workAssetPaths`
- Front : fallback parse tableau nu dans `normalizePayload` ; champs inutilisés `signed_dated` / `editions` / `caption`
- CSS : override lightbox `--img-contrast: 1.08` / `--img-saturate: 1.04` → même `:root` 1.06 / 1.03
- CSS : sélecteur mort `.art-meta span` ; commentaire cartouche / « Voir »
- API publique : CORS `Access-Control-Allow-Origin: *` (front same-origin)
- Functions : `originalImagePath` à côté de `displayImagePath` ; `publicWork` unique
- Sync arbres : loupe mobile CSS manquait sur pages/site

## Conservé

Tagline personnel, typo auteur, hover peinture seule, carousel dans collection, dérivés web + originaux, loupe lazy original, export + Basic Auth atelier, `GET /api/oeuvres` same-origin.

## Preuve

`ajout-porte-peinte-monage` : lightbox web 1800×1376 (690 171 o) → loupe original 7983×6102 (11 388 889 o) ; filter CSS `contrast(1.06) saturate(1.03)`.

Artefacts : `/opt/cursor/artifacts/cleanup2-*.png`, `cleanup2-proof.json`, `cleanup2-verify.log`.
