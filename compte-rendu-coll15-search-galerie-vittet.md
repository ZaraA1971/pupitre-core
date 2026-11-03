# Compte-rendu — collection 5×3 + recherche

Date : 3 novembre 2026.

## Collection

- `PAGE_SIZE` 12 → **15** (5 lignes × 3 colonnes)
- Grille CSS déjà `repeat(3, …)` ; `min-height` grille ajusté ; skeletons ×15
- API `pageSize: 15` (`functions/api/oeuvres.js`)
- Cache-bust `?v=20261103-coll15`

## Recherche — cause

Après retrait de la nav header, `setMenu(false)` était encore appelé dans `applySearchRoute` / submit **sans définition** → `ReferenceError` avant `renderSearchResults`. Saisie live mettait à jour le hash mais n’affichait pas les résultats.

## Correctif

- `setMenu` no-op rétabli
- `refreshSearchDom()` + rebind après changements header
- Soft-fold inchangé (`bruegel` → BRUEGHEL)

## Deploy (package cohérent + `functions/`)

Source `/tmp/galerie-vittet-atelier-cf/` → sync `galerie-vittet-pages` (avec Functions) :

| Cible | Id / URL |
|---|---|
| Prod | `e313c7c6` · https://galerie-vittet-preview.pages.dev/ |
| Atelier | `82889d52` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- Collection : **15** cartes, **3** colonnes, label `1–15 sur 51`
- Recherche `bruegel` / `BRUEGHEL` : **2** œuvres (Yan / Jan BRUEGHEL)
- API GET `/api/oeuvres` JSON `pageSize: 15` ; previews JPEG 200

Artefacts : `coll15-collection-5x3.png`, `coll15-search-bruegel.png`, `coll15-verify.json`.
