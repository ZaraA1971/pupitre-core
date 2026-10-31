# Cleanup logique — Galerie Vittet (atelier CMS → front)

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| API publique | https://galerie-vittet-preview.pages.dev/api/oeuvres |
| Export métadonnées | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/api/export/oeuvres |

Cache-bust front : `?v=20261031-cleanup`.

## Arbres

| Chemin | Rôle |
|---|---|
| `/tmp/galerie-vittet-atelier-cf/` | Source de vérité (front + atelier + Functions) |
| `/tmp/galerie-vittet-pages/` | Package de déploiement Pages |
| `/tmp/galerie-vittet-site/` | Miroir front only (README ; plus d’atelier divergent) |

Sync : `scripts/sync-trees.sh`.

## Retiré

- Fallback cross-host `OEUVRES_API_SOURCES` → atelier-kv-preview depuis `main.js`
- Merge défensif `carousel` → collection dans `normalizePayload` (l’API inclut déjà les featured)
- Module seed `functions/_shared/exposes.js` + `seedExposedWorks` / `seedDefaultCarousel`
- Catalogue statique parallèle `data/oeuvres.json` (11 œuvres) → tombstone `deprecated` + `oeuvres: []`
- Atelier obsolète dans `/tmp/galerie-vittet-site/`

## Conservé (règles produit)

- Même D1/KV ; public `exposed` only ; images privées 401 sans auth
- Collection = exposées **avec** carousel ; hero filtre `carousel`
- Affichage public `web/` + `preview/` ; original côté atelier
- Tagline « Un ensemble personnel… » ; typo titre→auteur→taille ; hover peinture seule
- Export Basic Auth ; Basic Auth atelier only
- Auth en profondeur (middleware + handlers)
- Remap public `image` → dérivé web via `displayImagePath`

## Vérifications

- `/api/oeuvres` 200 (101 exposées, 3 carousel incluses)
- Image web 200 ; export 401/200 ; atelier UI 401
- Tombstone `data/oeuvres.json` ; browser collection + hover + tagline OK
