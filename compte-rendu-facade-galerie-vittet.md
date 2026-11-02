# Compte-rendu — façade en première dans #galerie

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/#galerie |
| Déploiement main | https://32c28774.galerie-vittet-preview.pages.dev |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Déploiement atelier | https://bc0eb093.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261102-nocrop`.

## Ordre des images (#galerie)

1. `images/galerie-facade.webp` — façade 21 quai Voltaire (nouvelle)
2. `images/galeristes.webp` — couple
3. `images/galerie-salle.webp` — salle

## Layout

Section `#galerie` (`.about`) : triptyque `.about-images` (façade | couple | salle) à gauche, copy à droite.

- **Sans crop** : `height: auto` + `object-fit: contain` ; colonnes ≈ ratios 1.45 / 0.75 / 1.93 (même hauteur visuelle sans couper).
- Desktop : grille section `1.85fr / .55fr` (images élargies, copy `max-width: 340px`), align-items end.
- ≤980 px : pile façade → couple → salle, images entières.
- Séparation Contact conservée (`overflow: clip`, padding bas 96 px / 72 px mobile).

## Image

- Chemin source de vérité : `/tmp/galerie-vittet-atelier-cf/images/galerie-facade.webp`
- Source JPEG 1024×705 → WebP q82 method 6, **82 340** octets
- Alt : « Façade de la Galerie Claude Vittet, 21 quai Voltaire »
- Pattern inchangé vs couple/salle : asset statique dans `images/` (pas de demi-CMS)

## Sync / deploy

- Source : `/tmp/galerie-vittet-atelier-cf/` → `scripts/sync-trees.sh` → pages + site
- Prod : `pages deploy` branche `main`
- Atelier : `pages deploy` branche `atelier-kv-preview`

## Preuve

Artefacts : `/opt/cursor/artifacts/galerie-facade-desktop.png`, `galerie-facade-mobile.png`, `galerie-facade-verify.json`.
Vérif : ordre DOM + lefts desktop croissants ; tops mobile croissants ; 3 naturalWidth > 0.
