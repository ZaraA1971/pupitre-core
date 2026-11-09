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

## Deploy (package + `functions/`) — Compte Emmanuel `69008766…` · commit `fc981a0`

| Cible | Id / URL |
|---|---|
| Prod (main) | `6f8621cb` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://6f8621cb.galerie-vittet-preview.pages.dev/ |
| Preview | `c96ca3ca` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `da709794` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| Cache-bust `clean9` + `#catalog-filter-search` | présents (repo + `/tmp/galerie-vittet-pages`) |
| `KV_VALUE_MAX_BYTES` / `exifFilled` | absents de `atelier.js` |
| Alias `atelier-kv-preview` | pointe sur `da709794` |
| `GET /atelier/` | 401 (Basic Auth) |
| `GET /api/oeuvres` | 200 · JSON · **102** œuvres |
