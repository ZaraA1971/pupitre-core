# Compte-rendu — cleanup + optimisation ordre front

Date : 3 novembre 2026.

## Retiré / unifié / optimisé

**Atelier reorder**
- Persist immédiat full-library → **optimistic local** + **PATCH delta** (seuls les `id` dont `order` a changé)
- Debounce flush **280 ms** (coalesce ↑↓ / drag thrashing)
- Snapshot `savedFrontOrders` au load ; rechargement bibliothèque si PATCH échoue
- Boutons ↑↓ plus bloqués pendant le réseau (file d’attente dirty)

**Front public**
- Un seul helper `compareByFrontOrder` ; hero carousel ne re-trie plus inutilement (liste déjà ASC)

**API / comments**
- Commentaires bulk / `nextSortOrder` allégés ; chemin unique conservé : bulk `PATCH /atelier/api/oeuvres` `{ orders }` + unit `order` sur `:id` (API) + append `MAX+10` à l’upload

**Drift trees**
- `scripts/sync-trees.sh` → pages + site (hashes HTML/CSS/JS alignés) ; cache-bust atelier pages rétabli

## Conservé

Ordre d’affichage front (drag + ↑↓), append upload, API publique ASC, carousel départ aléatoire, recherche instant + soft-fold, loupe, web derivatives, galerie triptyque + copy, tagline personnel, hover peinture, export, typo auteur, tri atelier défaut « récente ».

## Déploiement

| Cible | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Prod deploy | `e777cebb` (branche `main`) |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Atelier deploy | `42f3ccdb` (branche `atelier-kv-preview`) |
| Auth | `vittet` / `oiunervkerhver` |

Cache-bust : `?v=20261103-orderclean`.

## Preuve

1. Mode « Ordre d’affichage front » + Exposées : poignée / ↑↓ / badge.
2. Clic ↓ : statut « Ordre d’affichage front enregistré. » ; PATCH **2** ids (pas 112).
3. Collection Miniatures ASC ; `#galerie` « La galerie » + triptyque.
4. Ordre test restauré : blakenberg `10` → descartes `20`.

Artefacts : `/opt/cursor/artifacts/orderclean-*.png`, `orderclean-verify.json`.
