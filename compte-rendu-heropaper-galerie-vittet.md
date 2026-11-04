# Compte-rendu — carousel papier + header rééquilibré

Date : 4 novembre 2026.

## Problème

1. Fond gris (`--wall`) du carousel hero autour des toiles en `object-fit: contain`.
2. Header un peu serré contre le filet : rythme VITTET → MAÎTRES → adresse à aérer ; contact à droite, bas aligné sur l’adresse. Pas de recherche dans le header.

## CSS

| Sélecteur | Avant | Après |
|---|---|---|
| `.hero` | (pas de fond) | `background: var(--paper)` |
| `.hero-viewport` | radial + `var(--wall)` | `background: var(--paper)` |
| `.header` | `padding 18/16`, `row-gap 16`, `min-height 112` | `padding 20/24`, `row-gap 18`, `min-height 120` |
| `.header-brand .wordmark span` | `margin-top: 8px` | `10px` (mobile `8px`) |
| Mobile `.header` | `padding 12/14`, `row-gap 12` | `padding 14/18`, `row-gap 14` |

Conservé : marque à gauche, MAÎTRES centré sous VITTET, contact `grid-row: 1 / -1; align-self: end`, recherche hors header.

Cache-bust `?v=20261104-heropaper`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Preview | `77f43ba8` · https://77f43ba8.galerie-vittet-preview.pages.dev/ |
| Prod (main) | `d99fb433` · https://galerie-vittet-preview.pages.dev/ |
| Alias preview | https://preview.galerie-vittet-preview.pages.dev/ |

## Vérif @1440

| Mesure | Valeur |
|---|---|
| `.hero-viewport` bg | `rgb(232, 226, 218)` = `--paper` (≠ `--wall` `#d3ccc3`) |
| Letterbox pixels | paper (Δ 0 vs `#e8e2da`) |
| `placeBottom` / `contactBottom` | **Δ 0 px** |
| Gap MAÎTRES → adresse | **20.9 px** |
| Centre VITTET / MAÎTRES | Δ 0 |
| Air adresse → filet | **25 px** |
| `GET /api/oeuvres` | 200 · **99** œuvres |

Screenshots : `heropaper-desktop-header.png`, `heropaper-desktop-hero.png`, `heropaper-desktop-header-hero.png`, `heropaper-mobile-header.png`.
