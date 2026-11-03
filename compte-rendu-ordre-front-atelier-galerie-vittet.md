# Compte-rendu — ordre d’affichage front (atelier)

Date : 3 novembre 2026.

## UX choisie

Dans la bibliothèque atelier, le tri **Ordre d’affichage front** active le mode vitrine :

- poignée glisser-déposer + boutons **↑ / ↓**
- badge `sort_order`
- enregistrement immédiat D1 (PATCH bulk)
- filtre **Exposées** recommandé pour regrouper la vitrine
- le tri « Plus récente… » reste le défaut atelier (navigation CMS), distinct de l’ordre public

Nouveaux imports : `sort_order = MAX + 10` (**append en fin**), pour ne pas casser les groupes.

Carousel (`carousel=1`) reste indépendant ; départ aléatoire hero inchangé.

## API / champs

| Élément | Détail |
|---|---|
| Champ D1 | `oeuvres.sort_order` (INTEGER) |
| Public | `GET /api/oeuvres` → `order` ; tri `sort_order ASC, created_at ASC, id ASC` |
| Bulk atelier | `PATCH /atelier/api/oeuvres` `{ "orders": [{ "id", "order" }, …] }` |
| Unitaire | `PATCH /atelier/api/oeuvres/:id` accepte aussi `order` |
| Insert | `nextSortOrder()` → append |
| Densify | une fois : 112 lignes → 10…1120 (stables) |

Source : `/tmp/galerie-vittet-atelier-cf/` → `scripts/sync-trees.sh` → pages / site.

## Déploiement

| Cible | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Prod deploy | `c8ee9922` (branche `main`) |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Atelier deploy | `6d0ee0b3` (branche `atelier-kv-preview`) |
| Auth | `vittet` / `oiunervkerhver` |

## Preuve

1. Mode atelier « Ordre d’affichage front » + Exposées : poignée / ↑↓ / badge visibles.
2. Clic **↓** sur la 1ʳᵉ œuvre → statut « Ordre d’affichage front enregistré. » ; Blakenberg passe en tête.
3. Public Miniatures : adjacency `boite-blakenberg` → `descartes` → `jeune-homme-a5` (même ordre API `order` 10 / 20 / 30).
4. Onglets : ordre relatif stable dans chaque filtre (sous-ensemble de `sort_order`).

Captures : `/opt/cursor/artifacts/frontorder-atelier-mode.png`, `frontorder-atelier-after-down.png`, `frontorder-collection-miniatures.png`.
