# Compte-rendu — Rehaussement discret images (CSS)

Date : 30 octobre 2026.

## URL

**https://galerie-vittet-preview.pages.dev/**

Déploiement Pages : `81991a5c` (projet `galerie-vittet-preview`).  
Sources : `/tmp/galerie-vittet-pages/` (+ miroirs `site` / `atelier-cf` front).  
Scaleway / DNS / atelier données : non touchés.

## Réponse utilisateur (pros + correctif)

Oui : les photographes / labos galerie font surtout ce travail à l’**export** (courbe de contraste + unsharp léger calibré pour l’écran).  
Le filtre CSS ci-dessous est un **correctif léger** en attendant un éventuel retraitement des fichiers.

## Appliqué

Variables `:root` :

| Variable | Valeur |
|---|---|
| `--img-contrast` | `1.06` |
| `--img-saturate` | `1.03` |
| `--img-enhance` | `contrast(var(--img-contrast)) saturate(var(--img-saturate))` |

Cibles `filter: var(--img-enhance)` :

- `.hero-slide img`
- `.art-open .art-preview` (grille collection)
- `.lightbox-photo img.art-detail`

Palette page, ombres viewport et hovers (scale / opacity « Voir ») **inchangés**.  
Pas de sharpen SVG (évite un effet « Instagram ») — le contraste 1.06 suffit pour un peu de relief perçu.

## Vérif live

`getComputedStyle` hero + preview → `contrast(1.06) saturate(1.03)`.  
Crop hero avant/après (même viewport) : écart-type RGB ↑ (~40→42 / ~44→46 / ~53→56), moyenne légèrement ↓ — cohérent avec un contraste discret.
