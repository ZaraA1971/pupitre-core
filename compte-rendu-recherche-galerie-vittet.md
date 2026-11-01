# Recherche catalogue — Galerie Vittet

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Déploiement main | https://504c609a.galerie-vittet-preview.pages.dev |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Déploiement atelier | https://88c7459e.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261101-recherche`.

## Où vit la recherche

- Champ discret dans le chrome header (`.site-search`), à gauche de la nav (desktop) / entre wordmark et menu (mobile).
- Vue résultats : section `#recherche` (mode `body.view-recherche` — masque hero / collection / about / visit).
- Filtre client sur le catalogue déjà chargé via `GET /api/oeuvres` (exposed only).
- Cartes = même `makeCard` + lightbox (source `search`), loupe / typo titre→auteur→taille inchangés.

## Schéma d’URL

| Entrée | Effet |
|---|---|
| `#recherche` | Vue recherche, état invite (query vide) |
| `#recherche?q=Neefs` | Résultats filtrés, partageable / bookmarkable |
| `?q=Neefs` (query string) | Adopté puis réécrit en `#recherche?q=Neefs` |

Pas de nouvel onglet nav (évite CTA doublon) — le champ header est l’entrée unique.

## Conservé

- Loupe lightbox, images web, typo hiérarchie, hover peinture
- Nav dédoublonnée (pas de lien « Recherche » ajouté)
- Tagline ensemble personnel, pas de CTA fin de collection
- CMS same-origin

## Sync / deploy

- Source : `/tmp/galerie-vittet-pages/`
- Sync HTML/CSS/JS (+ `functions/api/oeuvres.js` : `source_file` public) → atelier-cf + site
- Prod : `pages deploy` branche `main`
- Atelier : `pages deploy` branche `atelier-kv-preview`

## Preuve

Artefacts : `/opt/cursor/artifacts/search-desktop-*.png`, `search-mobile-*.png`, `search-verify.json`.
