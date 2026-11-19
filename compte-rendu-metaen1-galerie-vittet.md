# Compte-rendu — metaen1 Galerie Vittet

Date : 19 novembre 2026 · branche `cursor/mobile-tableaux-d186`.

## Objectif

En version UK, traduire automatiquement **support** et convertir **dimensions** en inches (source D1 reste en français / cm).

## Contenu

- `i18n.js` : `localizeSupport` / `localizeDimensions` / `localizeFacts` (phrases exactes + tokens UK)
- `main.js` : légendes grille + lightbox utilisent ces helpers ; bascule `galerie:lang` recalcule
- Cache-bust `?v=20261119-metaen1`

## Deploy

| Cible | Id / URL |
|---|---|
| Prod (main) | `c67564d7` · https://galerie-vittet-preview.pages.dev/ |
| Preview | `d07aaeba` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `f098471f` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| UK grille | `Oil on copper · 14.2 × 21.5 in` |
| UK lightbox | Medium EN + inches |
| FR | `Huile sur cuivre · 36 x 54,5 cm` inchangé |
