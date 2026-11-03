# Compte-rendu — nettoyage code Galerie Vittet

Date : 3 novembre 2026.

## Objectif

Nettoyage prudent après itérations UI (header, loupe 130 %, collection 15/NICOLLE, carousel, fond densifié, retrait lede/couple/nav). Aucun changement de comportement voulu.

## Retiré / unifié

| Élément | Action |
|---|---|
| `.text-link` (CSS + reduced-motion) | mort après retrait nav / CTA |
| `--dusk` | variable inutilisée |
| `setMenu` no-op + appels | nav absente → appels retirés (recherche inchangée) |
| `images/galeristes.webp` | plus référencé (couple hors `#galerie`) |
| Commentaires d’historique CSS (`was #…`, `halved`, `+20% again`…) | raccourcis / retirés |
| Doublon `.section-heading h2` | une seule règle (= taille effective) |
| Stub `data/oeuvres.json` | `sections` + `pageSize` alignés (toujours `deprecated`) |
| `sync-trees.sh` | prune orphan `galeristes.webp` (+ `exposes.js`) |

Conservé volontairement : math spacer `#galerie` (`--photos-couple-fr` / `--photos-fr-sum`) pour tailles façade/salle ; aquarelle côté atelier/CMS ; `search-lede` (page recherche).

Cache-bust `?v=20261103-cleanup`.

## Où

- Source : `/tmp/galerie-vittet-atelier-cf/` (+ `functions/`)
- Sync : `scripts/sync-trees.sh` → `/tmp/galerie-vittet-pages/` + `/tmp/galerie-vittet-site/`

## Deploy (package cohérent + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `ac31dfc1` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://ac31dfc1.galerie-vittet-preview.pages.dev/ |
| Atelier | `d9fe513f` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- `GET /api/oeuvres` → 200 JSON · 100 œuvres · `pageSize` 15 · sections peinture/miniature/nicolle
- Image KV `images/ajouts/preview/…` → 200 JPEG
- Tabs : Peintures (51) / Miniatures (14) / NICOLLE (35) · grille 15 · pas Aquarelles
- Recherche `#recherche?q=nicolle` → 35 résultats · 0 erreur `setMenu`
- Lightbox + loupe (original, fiche masquée, scale ~130 % clamp viewport)
- Hero 801 px @1440 · `--paper` `#e8e2da` · 2 photos `#galerie` · pas lede personnel

Artefacts : `cleanup-*.png`, `cleanup-verify.json`.
