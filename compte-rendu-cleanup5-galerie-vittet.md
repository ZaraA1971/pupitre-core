# Compte-rendu — cleanup5 Galerie Vittet

Date : 3 novembre 2026.

## Objectif

Nettoyage prudent post-WB / loupe idle / header bottom / search tabs / ink 90·85 / galmid / photos 80 %. Aucun changement de comportement voulu. Sync durable `galerie-vittet/` + pages/site.

## Retiré / unifié / restauré

| Élément | Action |
|---|---|
| Doublon `@media (max-width: 1100px)` | une seule règle (grid + header + search width) |
| `mousemove` loupe idle | retiré (couvert par `pointermove`) ; click / touch / key conservés |
| `images/ajouts/preview/` vide | prune (KV via Functions) |
| `functions/images/ajouts/[[path]].js` | **restauré** dans le snapshot git (écart sync cleanup4) |
| `sync-trees.sh` | garde-fou gate images + prune preview vide ; note exclude tar |

Conservé : WB `#img-warm-wb` (pas de sépia), loupe idle 3 s, header contact bottom-align, search à droite des tabs, ink 90/85, texte « La galerie » au milieu, photos 80 %, Functions + D1/KV.

Cache-bust `?v=20261103-clean5`.

## Où

- Live source : `/tmp/galerie-vittet-atelier-cf/` (+ `functions/`)
- Sync : `scripts/sync-trees.sh` → `/tmp/galerie-vittet-pages/` + `/tmp/galerie-vittet-site/`
- Durable : `/workspace/galerie-vittet/` (sans `.wrangler`, sans secrets, sans blobs KV)

## Deploy (package cohérent + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `bf8e5733` · https://galerie-vittet-preview.pages.dev/ |
| Preview | `f4df42c1` · https://f4df42c1.galerie-vittet-preview.pages.dev/ |
| Atelier | `60167eaf` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- `GET /api/oeuvres` → 200 · **99** œuvres · `pageSize` 15 · sections peinture/miniature/nicolle
- Cache-bust prod `?v=20261103-clean5` · SVG `#img-warm-wb` présent · pas de `sepia` CSS
- Image KV preview → 200 JPEG · atelier `/atelier/` → 401
- `functions/images/ajouts/[[path]].js` présent dans pages + git package
