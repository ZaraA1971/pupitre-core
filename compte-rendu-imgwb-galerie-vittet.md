# Compte-rendu — chaleur WB sans sépia

Date : 3 novembre 2026.

## Objectif

Retirer `sepia(...)` : ne pas colorer dans un ton brun, seulement **réchauffer** un peu (balance des blancs).

## Ancien vs nouveau

| | Recette |
|---|---|
| Avant | `contrast(1.06) brightness(1.015) sepia(0.10) saturate(1.12)` |
| Après | `url(#img-warm-wb) contrast(1.06) brightness(1.01) saturate(1.03)` |

`#img-warm-wb` = SVG `feColorMatrix` diagonale sRGB :

| Canal | Coeff |
|---|---|
| R | **1.03** |
| G | **1.012** |
| B | **0.975** |

Même `--img-enhance` sur grid / hero / lightbox / loupe.

Cache-bust `?v=20261103-imgwb`.

## Deploy (+ `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `5df69f7f` · https://galerie-vittet-preview.pages.dev/ |
| Preview | `9a166a8b` · https://9a166a8b.galerie-vittet-preview.pages.dev/ |
| Atelier | `6a93773f` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| Computed filter | `url("#img-warm-wb") contrast(1.06) brightness(1.01) saturate(1.03)` |
| `sepia` in CSS | absent |
| Matrix | R 1.03 · G 1.012 · B 0.975 |
| `GET /api/oeuvres` | 200 · **99** œuvres |

Screenshots : `imgwb-collection-grid.png`, `imgwb-collection-card.png`, `imgwb-lightbox.png`, `imgwb-verify.json`.
