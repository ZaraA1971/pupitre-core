# Cleanup10 — Galerie Vittet

## Objectif
Nettoyage prudent après retrait de la taille réelle lightbox et du portrait About.

## Fait
- Suppression `images/galerie-claude.webp` (plus référencé)
- Suppression clés i18n `claudeAlt` (FR/EN)
- `--gal-ar-sum` 4.04 → 3.39 (façade + salle uniquement)
- `physBox` / `lightboxSizeProps` : drop `wCm`/`hCm` morts
- `sync-trees.sh` : purge `galerie-claude.webp` sur pages + site
- Cache-bust front `?v=20261127-clean10`

## Non touché
- Atelier « taille réelle en cm » (saisie dimensions)
- Soft grille lightbox (comportement conservé)
- Historique STATUS / comptes-rendus
