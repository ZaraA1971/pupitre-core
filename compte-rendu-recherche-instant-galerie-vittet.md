# Recherche instantanée — Galerie Vittet

## Comportement

- Saisie dans le champ header → debounce **200 ms** → ouverture `#recherche` + résultats
- URL mise à jour via `history.replaceState` (`#recherche?q=…`) pendant la frappe
- Entrée (submit) toujours supportée (scroll explicite)
- Soft-fold conservé (`gh`→`g`, `ue`↔`eu`) — `brue` / `bruegel` → 3 BRUEGHEL

Cache-bust : `?v=20261101-instant`.

## URLs

| Surface | URL |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/ |
| Deploy main | https://15526b15.galerie-vittet-preview.pages.dev |
| Atelier | https://02ff4d80.galerie-vittet-preview.pages.dev |

Preuve : `/opt/cursor/artifacts/search-instant-brue-desktop.png`, `search-instant-bruegel-desktop.png`, `search-instant-brue-mobile.png`, `search-instant-verify.json`.
