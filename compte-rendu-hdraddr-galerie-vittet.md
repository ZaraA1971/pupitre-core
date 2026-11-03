# Compte-rendu — espace MAÎTRES → adresse + alignement contact

Date : 3 novembre 2026.

## Objectif

1. Un peu plus d’espace vertical entre **MAÎTRES ANCIENS** et l’adresse sous VITTET.
2. Aligner le **haut** du bloc contact de droite (téléphones, email, horaires) sur la **ligne de l’adresse** (plus sur le haut de VITTET).

Conservé : centrage du sous-titre sous VITTET ; hiérarchie d’encre 100 / 90 / 85 ; recherche à droite des onglets collection.

## Approche

- `.header` en grille **2 × 2** : `grid-template-rows: auto auto`, `align-items: start`, `row-gap: 16px` (était ~10 px via `gap: 8px` + `margin-top: 2px`).
- `.header-brand` en **`subgrid`** sur les deux rangées → wordmark rangée 1, adresse rangée 2.
- `.header-contact` en `grid-row: 2` + `align-self: start` → même top que l’adresse.
- Mobile (≤700 px) : 3 rangées (wordmark / adresse / contact), contact en `grid-row: 3`.

Cache-bust `?v=20261103-hdraddr`.

## Où

- Source live : `/tmp/galerie-vittet-atelier-cf/` (+ `functions/`)
- Durable : `/workspace/galerie-vittet/`
- Sync : `scripts/sync-trees.sh` → `/tmp/galerie-vittet-pages/` + `/tmp/galerie-vittet-site/`

## Deploy (package cohérent + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `2a6238c7` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://2a6238c7.galerie-vittet-preview.pages.dev/ |
| Atelier | `3536631b` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif @1440

| Mesure | Valeur |
|---|---|
| `placeTop` / `contactTop` | 153.77 / 153.77 · **Δ 0 px** |
| Gap MAÎTRES → adresse | **18.9 px** (row-gap 16 + métriques) |
| Centre VITTET / MAÎTRES | 194.48 / 194.48 · Δ 0 |
| Encre wordmark / phones / adresse | full / 90 % / 85 % |
| Recherche vs onglets | searchLeft 1186 ≥ filtersRight |
| `GET /api/oeuvres` | 200 · **99** œuvres |

Screenshots : `hdraddr-header-desktop(_crop|_guide).png`, `hdraddr-addr-row_crop.png`, `hdraddr-header-mobile(_crop).png`, `hdraddr-collection-toolbar.png`.
