# Compte-rendu — taille1 Atelier

Date : 23 novembre 2026.

## Objectif

Normer le champ **taille** (ex-dimensions) dans l’Atelier, avec convertisseur inch simple — source de vérité pour l’échelle front.

## Canon enregistré (FR / cm)

- `H x L cm`
- `H x L cm avec cadre : H x L cm`
- `Diamètre : D cm`

Virgule décimale, `x` minuscule, espace avant `cm`. Les valeurs `px` restent brutes (avertissement, pas d’échelle).

## UI

- Modes H×L ou diamètre ; option « avec cadre »
- Aperçu inch en direct (`≈ … in`)
- Bloc « Depuis inch » → bouton **→ cm**
- Aperçu de la chaîne enregistrée

## Cache-bust

`?v=20261123-taille1` (atelier.js / atelier.css)

## Deploy

| Cible | Id |
|---|---|
| Prod (main) | `3337d4d9` |
| Preview | `a0f70952` |
| Atelier | `366a38e2` |

https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/?v=20261123-taille1

## Vérif

| Check | Résultat |
|---|---|
| Parse CHIGI + cadre | canon inchangé + inches cadre ≈ 9 × 7.9 in |
| `centimètres` / `26cm` / `X` | normalisés |
| inch 5×7 → cm | `12,7 x 17,8 cm` |
| `node --check atelier.js` | OK |
