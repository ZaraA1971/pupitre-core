# Compte-rendu — cleanup8 Galerie Vittet

Date : 6 novembre 2026.

## Objectif

Nettoyage prudent après header-carousel, paper `#e3d1be`, letterbox `--stage`, carousel≠collection, hero filter, mobile 1-col, fit adaptatif. Aucun changement de comportement voulu.

## Mort retiré

| Élément | Action |
|---|---|
| `--page-pad-sm` | token CSS défini, jamais référencé |
| `dataset.heroFit` + classe `is-contain` | écrits par `fitHeroImage`, jamais lus / pas de règle CSS — `object-fit` inline conservé |
| Cache-bust atelier `?v=20261106-paper` | aligné sur le front (`clean8`) |

## Conservé

- Header + carousel fusionnés, paper `#e3d1be`, letterbox dark `--stage`
- Carousel exclu de `#collection`, filtre hero, mobile 1-col, fit cover/contain adaptatif
- Loupe max natif, upload atelier unifié, layout `#galerie`, Functions + D1/KV

## Sync

`/tmp/galerie-vittet-atelier-cf/` → pages → site front → `galerie-vittet/`. Gate `functions/images/ajouts` conservée.

Cache-bust `?v=20261106-clean8`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `9810d4b1` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://9810d4b1.galerie-vittet-preview.pages.dev/ |
| Preview | `bb8615b0` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `3a5e8219` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| `GET /api/oeuvres` | 200 · JSON · **103** œuvres · 5 carousel · functions OK |
| Cache-bust | `clean8` sur style/main + atelier |
| `--page-pad-sm` / `is-contain` / `dataset.heroFit` | absents |
| Atelier `/atelier/` | 401 (Basic Auth) |
| `node --check` | main.js + atelier.js OK |
