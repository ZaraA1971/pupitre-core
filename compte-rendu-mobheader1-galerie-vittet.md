# Compte-rendu — mobheader1 Galerie Vittet

Date : 13 novembre 2026 · branche `cursor/mobile-tableaux-d186`.

## Objectif

Sur mobile, Collection / Galerie / UK se mélangeaient avec les téléphones et l’e-mail. Donner une **vraie barre de menus** dédiée.

## Contenu

- ≤700px : `.header-menu-row` en pleine largeur (ligne 1) avec séparateur
- Brand + contact en ligne 2, sans overlap
- Desktop inchangé (menus coin haut droit, baseline contact)
- Cache-bust `?v=20261113-mobheader1`

## Deploy

| Cible | Id / URL |
|---|---|
| Prod (main) | `1ff89d7b` · https://galerie-vittet-preview.pages.dev/ |
| Preview | `13a0b86e` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `e5c17ea8` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| Mobile 390×844 overlaps | aucun (menu vs brand/contact/phones) |
| Menu bar | Collection + Galerie à gauche, UK à droite, pleine largeur |
| Desktop baseline | `deltaBottom: 0` brand/contact |
