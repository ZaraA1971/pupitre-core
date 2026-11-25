# Csstour1 — tour CSS P2

## Changements
- Carte sections A–K dans `style.css` (tokens `--paper` / `--stage` / `--hero-ar` inchangés)
- Media crop carousel ≤700px fusionné dans le bloc mobile principal
- Sélecteurs `data-carousel-crop` simplifiés
- `fitHeroWindow` (active ±1) à la place d’un refit de toutes les slides
- Filtres img hero/collection conservés (P2 : coût << poids images)

## Déploiements
- main `8a57546f` · preview `0906cdbd` · atelier `e677c074`

## Preuve
- Playwright desktop/mobile : hero OK, 11 slides, hydrate 3 src, grille mobile 1 col
