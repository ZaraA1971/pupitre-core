# Compte-rendu — tri atelier « plus récente téléchargée ou modifiée »

Date : 2 novembre 2026.

## Verdict

Dans l’atelier CMS, le tri par défaut de la bibliothèque est **Plus récente téléchargée ou modifiée** (`max(updated_at, created_at)` DESC).

## Champ / schéma

| Élément | Détail |
|---|---|
| Champ | `updated_at` (TEXT, D1 `oeuvres`) |
| Activité | `max(updated_at, created_at)` côté UI |
| Création | `created_at` + `updated_at` posés à l’INSERT |
| Modification | PATCH meta et backfill web bumpent `updated_at` |
| Migration | `ALTER` + backfill `updated_at = created_at` (112 lignes) |

Le front public garde `ORDER BY sort_order ASC, created_at ASC` via `listWorks` ; `updated_at` n’est pas exposé dans `/api/oeuvres`.

## Label défaut

**Plus récente téléchargée ou modifiée** (`#catalog-sort` value `recent`, `selected` + `localStorage` clé `atelier-catalog-sort`).

Autres options : Plus ancienne · Ordre d’exposition · Artiste (A→Z) · Titre (A→Z).

## Déploiement

| Cible | URL |
|---|---|
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Déploiement | `246911bc` (branche `atelier-kv-preview`) |
| Source | `/tmp/galerie-vittet-atelier-cf/` (+ sync `scripts/sync-trees.sh` → pages) |

## Preuve

- API atelier : `updated_at` présent sur 112 œuvres.
- PATCH `ajout-jeune-homme-a5` → `updated_at=2026-11-02 15:56:50` → 1ʳᵉ de la liste au chargement.
- Select Tri = « Plus récente téléchargée ou modifiée » sans choix utilisateur.
- Public `/api/oeuvres` : 101 exposées, ordre `sort_order` non décroissant, pas de `updated_at` public.

Captures : `/opt/cursor/artifacts/atelier-sort-control-default.png`, `atelier-library-sort-recent.png`.
