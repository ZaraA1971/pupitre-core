# Compte-rendu — atelierpag Galerie Vittet

Date : 11 novembre 2026 · branche `cursor/mobile-tableaux-d186`.

## Objectif

1. Pagination bibliothèque atelier aussi en haut de la liste images
2. Champs métadonnées : accepter et afficher un texte long
3. Ne plus exclure les œuvres carousel de la grille collection

## Contenu

- Atelier : double pagination (`data-catalog-pager` haut + bas), sync page / disabled
- Plafonds `META_MAX` (note 4000, titre 500, …) + `cleanMultiline` côté API
- Champs atelier en `textarea` (note 4 lignes ; artiste/titre/support/éditions/alt 2 lignes)
- Front `worksFor` : plus de filtre `!work.carousel` — carousel reste au hero et apparaît aussi en collection
- Cache-bust `?v=20261111-atelierpag2` (atelier) / `atelierpag1` (front)

## Compte Cloudflare

Compte Emmanuel · token API présent · deploy package `/tmp/galerie-vittet-pages/`

## Deploy

| Cible | Id / URL |
|---|---|
| Prod (main) | `6dc77083` · https://galerie-vittet-preview.pages.dev/ |
| Preview | `e28132e8` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `7d09edbc` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| Pagination haut + bas (mock 40 œuvres) | 1/2 → Suivant → 2/2 (15 items) |
| Note textarea | `maxLength=4000`, 1739 car. chargés, wrap + scroll |
| Autres champs longs | textarea 2 lignes (sauf dimensions input) |
| Collection + carousel | 6/6 œuvres carousel dans pool peinture ; `main.js` sans exclusion |
| `GET /api/oeuvres` | 200 · 104 œuvres |
