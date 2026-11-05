# Compte-rendu — loupe jauge 100–130 %

Date : 5 novembre 2026.

## Objectif

Améliorer la loupe lightbox : ouverture à **100 %** (même taille visuelle que la lightbox), jauge jusqu’à **130 %**, chrome (Quitter + jauge) masqué après ~3 s d’inaction.

Conservé : colonne infos masquée en loupe, fond quasi noir, filtre WB, source = fichier original, plafond natif.

## Zoom

- `zoomLevel` 1.0 → 1.3 (jauge 100–130)
- Taille cible = `fitLightbox × zoomLevel`, clamp `naturalWidth/Height`
- Scale CSS = cible / contain loupe courant
- Entrée = 100 % ; jauge pour monter jusqu’à 130 %

## Idle

Même timer que le bouton loupe (`LOUPE_CHROME_IDLE_MS = 3000`) : jauge + Quitter s’effacent, réapparaissent à l’action.

Cache-bust `?v=20261105-loupegauge`.
