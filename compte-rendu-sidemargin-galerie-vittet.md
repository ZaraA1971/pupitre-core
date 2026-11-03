# Compte-rendu — marges latérales ÷2 + images collection

Date : 3 novembre 2026.

## Marges (desktop 1440)

| Zone | Avant | Après |
|---|---|---|
| Gutter | **5vw** (72 px) | **2.5vw** (36 px) |
| Hero L/R | 5vw / 4vw | `--page-pad` / `--page-pad-sm` (36 / 28.8 px) |
| About @980 | 6vw | `--page-pad-lg` (3vw) |

Variables : `--page-pad`, `--page-pad-sm`, `--page-pad-lg`. Header, hero, collection, `#galerie`, footer, search.

## Collection

| | Avant | Après |
|---|---|---|
| Gap grille | 44×22 px | 40×14 px |
| Inset preview | 10 px | 6 px |
| Carte (1440) | 417 px | **447 px** (+7 %) |
| Image preview | 397 px | **435 px** (+9 %) |

3 colonnes conservées. Header / lightbox / `#galerie` inchangés hors gutters.

Cache-bust `?v=20261103-sidemargin`.

## Deploy

Source `galerie-vittet-atelier-cf` → sync pages + site.

| Cible | URL / id |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/ |
| Prod | `fb79beea` (main) |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ · `a36065d1` |

Artefacts : `sidemargin-before-*.png`, `sidemargin-live-*.png`, `sidemargin-verify.json`.
