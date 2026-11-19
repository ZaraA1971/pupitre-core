# Compte-rendu — page2row Galerie Vittet

Date : 19 novembre 2026 · branche `cursor/mobile-tableaux-d186`.

## Objectif

À partir de la page 2 de chaque section de la collection : masquer le bloc « La galerie », et afficher une rangée de peintures en plus.

## Contenu

- Page 1 : 15 œuvres (5×3) + `#galerie` visible
- Page 2+ : 18 œuvres (6×3) ; `#galerie` et `.section-ornament` masqués (`hidden` + `html.collection-page-deep`)
- Lien nav « Galerie » : revient à la page 1 puis scroll
- Cache-bust `?v=20261119-page2row2`

## Deploy

| Cible | Id / URL |
|---|---|
| Prod (main) | `9b830942` · https://galerie-vittet-preview.pages.dev/ |
| Preview | `69d62211` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `3fd514d3` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| Page 1 cartes | 15 · galerie `display:flex` |
| Page 2 cartes | 18 · plage 16–33 · galerie `display:none` |
| Retour page 1 | galerie restaurée |
