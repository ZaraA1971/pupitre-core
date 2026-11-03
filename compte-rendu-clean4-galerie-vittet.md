# Compte-rendu — cleanup4 + snapshot git Galerie Vittet

Date : 3 novembre 2026.

## Objectif

Nettoyage prudent post-srchx / galmid, puis ancrage du package déployable dans le dépôt git (`galerie-vittet/`). Comportements récents conservés (functions, search clear→collection, texte « La galerie » entre photos, ink95, NICOLLE, loupe 130 %, pageSize 15).

## Retiré / sécurisé

| Élément | Action |
|---|---|
| `visibleCards()` | mort (jamais appelé) |
| Mot de passe Basic Auth en défaut dans `scripts/apply-artlogic-metadata.py` | retiré ; `--apply` exige `ATELIER_USER`/`ATELIER_PASS` ou flags |
| Trees pages/site | resync depuis atelier-cf (`force` syncSearchInput inclus) |

Conservé : seed images statiques hero/about, math/layout `#galerie`, aquarelle côté atelier/CMS, `search-lede`, Functions + wrangler bindings (ids publics seulement).

Cache-bust `?v=20261103-clean4`.

## Où

- Live source : `/tmp/galerie-vittet-atelier-cf/` (+ `functions/`)
- Sync : `scripts/sync-trees.sh` → `/tmp/galerie-vittet-pages/` + `/tmp/galerie-vittet-site/`
- Durable : `/workspace/galerie-vittet/` (sans `.wrangler`, sans secrets, sans blobs KV `images/ajouts`)

## Deploy (package cohérent + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `f47f3012` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://f47f3012.galerie-vittet-preview.pages.dev/ |
| Atelier | `20416734` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- `GET /api/oeuvres` → 200 · 100 œuvres · `pageSize` 15 · sections peinture/miniature/nicolle
- Image KV preview → 200 JPEG
- `main.js` déployé : pas de `visibleCards` ; `leaveSearchView` + loupe 1.3 + `PAGE_SIZE` 15 présents
- Cache-bust prod `?v=20261103-clean4`
- Atelier `/atelier/` → 401 (Basic Auth OK)
