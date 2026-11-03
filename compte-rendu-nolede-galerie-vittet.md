# Compte-rendu — retrait lede collection

Date : 3 novembre 2026.

## Changement

Retrait du paragraphe sous `#collection` :

> Un ensemble personnel de peintures, miniatures et dessins, sélectionnés pour leur qualité et leur histoire.

Conservés : eyebrow « Œuvres choisies », titre « La collection », filtres, grille.

Cache-bust `?v=20261103-nolede`.

## Où

- `/tmp/galerie-vittet-atelier-cf/index.html` (source)
- sync → `/tmp/galerie-vittet-pages/` + `/tmp/galerie-vittet-site/`

Une seule occurrence (aucune en JS/CSS).

## Deploy (package cohérent + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `9d29bdd7` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://9d29bdd7.galerie-vittet-preview.pages.dev/ |
| Atelier | `6920b656` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- HTML live : 0× « ensemble personnel »
- `#collection .section-heading` = eyebrow + h2 seulement
- `GET /api/oeuvres` Accept JSON → 200 `application/json` (Functions OK)

Artefacts : `nolede-collection.png`, `nolede-collection-heading.png`, `nolede-verify.json`.
