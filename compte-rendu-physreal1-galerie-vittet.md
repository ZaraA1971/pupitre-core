# Compte-rendu — physreal1 Galerie Vittet

Date : 23 novembre 2026.

## Objectif

Lightbox : afficher les petites œuvres à la **taille réelle** (cm Atelier → pixels écran).

## Principe

- Mesure `1cm` CSS → px écran (`measureCssPxPerCm`, ~96 dpi navigateur)
- Si grand côté `< --true-size-max-cm` (30) → `width/height` en px réels
- Plafond = puits lightbox + résolution native (pas d’upscale)
- « avec cadre » reste prioritaire ; grille inchangée ; loupe = plein puits

## Limite

Le cm CSS suit le pixel de référence du navigateur (~96 dpi), pas une règle calibrée écran. Approche standard web pour une taille « réelle ».

## Cache-bust

`?v=20261123-physreal1`

## Deploy

| Cible | Id |
|---|---|
| Prod (main) | `4469267e` |
| Preview | `5d304eb8` |
| Atelier | `f5b6c9f1` |

https://galerie-vittet-preview.pages.dev/

## Vérif CDP

| Œuvre | true-size | Affichage |
|---|---|---|
| CHIGI (cadre 22,9 cm) | oui | 870 px ≈ 22,9 × 38 px/cm |
| Embuscade 12×17,5 | oui | 456×665 px |
| Brueghel 66 cm | non | échelle relative |
