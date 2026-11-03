# Compte-rendu — restauration images + merge bgdens / carousel

Date : 3 novembre 2026.

## Cause

Course entre deux deploys concurrentes :

1. Carousel +20 % (`5176a728`) — package OK avec Functions.
2. Densité fond (`8448149a`) — package OK avec Functions, mais CSS carousel revenu à `62vh` / `640px`.
3. Deploy fantôme `978fd987` — **sans Functions** : `/api/oeuvres` et `/images/ajouts/*` renvoyaient du `text/html` (fallback Pages) au lieu de JSON / JPEG. Les œuvres passent par KV via `functions/images/ajouts/[[path]].js`, pas par des fichiers static `images/ajouts/web`.

## Correctif

Package unique `galerie-vittet-atelier-cf` (functions + D1/KV + atelier) :

- Fond densifié conservé : `--paper` `#e8e2da`
- Carousel ~+20 % rétabli : `.hero-viewport` `min(74vh, 768px)` / `67vh` / `58vh`
- Cache-bust `?v=20261103-imgfix`

## Deploy

| Cible | Id / URL |
|---|---|
| Prod | `4907be72` · https://galerie-vittet-preview.pages.dev/ |
| Atelier | `dc5fda73` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- API `/api/oeuvres` 200 JSON
- 19/19 sample preview+web JPEG 200
- Hero viewport 666 px @1440×900 (+19,4 % vs 558)
- Collection 12/12 `naturalWidth > 0`
- Atelier library 25/25 thumbs OK

Artefacts : `imgfix-hero-desktop.png`, `imgfix-collection-desktop.png`, `imgfix-atelier-library.png`, `imgfix-verify.json`.
