# Compte-rendu — #galerie sans cadre, couple à 2/3

## CSS

| Règle | Changement |
|---|---|
| `.about-frame` | `padding: 0`, `border/outline/background: none` |
| `.about-frame .about-image` | `border: none` |
| `.about-side` | `padding-top: 0` (plus de compensation de cadre) |
| `.about` | `container-type: inline-size` ; colonnes `1fr / 280px` |
| `.about-image--couple` | largeur = `(2/3 × leftH) × 660/900` via `cqw` → hauteur couple = **2/3** des photos gauches |

Conservé : tops alignés, `object-fit: contain`, pas de H2, texte justifié sous le portrait.

## Mesures (desktop 1440)

- leftH ≈ 288 px · coupleH ≈ 192 px · ratio **0.666**
- tops façade / salle / couple : même ligne (spread 0)

## URLs

| Surface | URL |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/#galerie |
| Prod | https://723122e1.galerie-vittet-preview.pages.dev |
| Atelier | https://e1a7673f.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261102-nofrm23`.

## Preuve

`galerie-nofrm23-desktop.png`, `galerie-nofrm23-mobile.png`, `*-viewport.png`, `galerie-nofrm23-verify.json`.
