# Compte-rendu — cleanup9 atelier Galerie Vittet

Date : 9 novembre 2026.

## Objectif

Nettoyage prudent du code atelier uniquement. Aucun changement de comportement voulu. Les trois versions d’image (original / web / preview) restent utilisées.

## Mort retiré

| Élément | Action |
|---|---|
| `KV_VALUE_MAX_BYTES` (atelier.js) | défini, jamais lu — limite KV déjà côté Functions |
| `exifFilled` sur les items pending | écrit, jamais lu |
| `detailMeta.width/height/source` | écrits, seul `keptOriginal` sert au nom de fichier |
| classe CSS fantôme `added-item` | posée en JS, aucune règle |
| export `WEB_MAX_EDGE` (`limits.js`) | jamais importé (1800 reste dans atelier.js + script Python) |

## Conservé (volontairement)

- Dérivés **detail / web / preview** + backfill web + PDF + jspdf
- Routes `functions/atelier/*`, flag `quick`, colonnes D1 `detail_ctype` / `preview_ctype` (INSERT)
- Recherche photos sous le tri (`#catalog-filter-search`)
- Auth Basic `/atelier/*`

## Cache-bust

`?v=20261109-clean9` sur atelier (style + atelier.css + atelier.js).

## Deploy

Déployer **main**, **preview** et la branche Pages **`atelier-kv-preview`** (alias https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/).
