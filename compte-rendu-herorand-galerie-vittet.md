# Compte-rendu — départ aléatoire du carousel hero

## Changement

Dans `syncHeroFromWorks` (`main.js`) : si ≥2 œuvres `carousel=1`, index de départ = `Math.floor(Math.random() * length)`. Ordre CMS inchangé ; next/prev restent circulaires via `wrap()`. Fallback 0/1 œuvre → index `0`. `buildHeroSlide` aligne `is-active` / `fetchPriority` sur cet index.

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Déploiement main | https://c25435cc.galerie-vittet-preview.pages.dev |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Déploiement atelier | https://6ece3b38.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261102-herorand`.

## Sync / deploy

- Source : `/tmp/galerie-vittet-atelier-cf/` → `scripts/sync-trees.sh` → pages + site
- Prod : `pages deploy` branche `main` → `c25435cc`
- Atelier : `pages deploy` branche `atelier-kv-preview` → `6ece3b38`

## Preuve

6 reloads prod → 4 premières œuvres distinctes (indexes 0, 1, 4, 5 sur 6 slides carousel).

Artefacts : `/opt/cursor/artifacts/galerie-herorand-verify.json`, `galerie-herorand-reload-1.png` … `-3.png`.
