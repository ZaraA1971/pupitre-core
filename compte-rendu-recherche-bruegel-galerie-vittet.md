# Fix recherche « bruegel » — Galerie Vittet

## Pourquoi ça échouait

Le catalogue exposé contient bien 3 œuvres Bruegel, mais orthographiées **BRUEGHEL** (`gh`).
La recherche faisait un `includes` après fold accents/casse seulement → `bruegel` ∉ `brueghel`.

## Sample artist (API public)

- `Yan BRUEGHEL II dit le Jeune 1601 - Anvers - 1678` — Paysage aux moulins
- `Jan BRUEGHEL le Jeune 1601 - Anvers - 1678` — L'incendie de Troie…
- `Pieter BRUEGHEL le jeune` — Le bon Berger

Toutes `exposed` (pas un problème d’atelier / brouillon).

## Correctif

Dans `main.js` : `softFold` (`gh`→`g`, lettres doublées) + variantes `ue`↔`eu` (Breugel).
`#recherche?q=bruegel` → 3 résultats.

Cache-bust : `?v=20261101-bruegel`.

## URLs

| Surface | URL |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/ |
| Deploy main | https://965760b7.galerie-vittet-preview.pages.dev |
| Atelier | https://adff276b.galerie-vittet-preview.pages.dev |

Preuve : `/opt/cursor/artifacts/search-bruegel-desktop.png`, `search-bruegel-mobile.png`, `search-bruegel-verify.json`.
