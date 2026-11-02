# Compte-rendu — #galerie triptyque + texte à droite

## Layout

| Zone | Contenu |
|---|---|
| `.about-photos` | façade \| salle \| couple — même hauteur, gap 14 px |
| `.about-copy` | texte justifié, colonne droite sur toute la hauteur |

Colonnes photos en `fr` ≈ aspects (1.4525 / 1.9321 / 0.7333) → equal height, `object-fit: contain`, sans crop.

Mobile : pile des 3 photos puis texte.

## Mesures desktop 1440

- hauteurs : 233,1 × 3 (spread 0)
- tops alignés ; copyH = photosH ; texte à droite

## URLs

| Surface | URL |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/#galerie |
| Prod | https://ddf1f3a7.galerie-vittet-preview.pages.dev |
| Atelier | https://9ffe3823.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261102-triptych`
