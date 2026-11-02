# Compte-rendu — façade en première dans #galerie

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/#galerie |
| Déploiement main | https://14d46140.galerie-vittet-preview.pages.dev |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Déploiement atelier | https://a54be8fd.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261102-facade`.

## Ordre des images (#galerie)

1. `images/galerie-facade.webp` — façade 21 quai Voltaire (nouvelle)
2. `images/galeristes.webp` — couple
3. `images/galerie-salle.webp` — salle

## Layout

Section `#galerie` (`.about`) : triptyque `.about-images` (façade | couple | salle) à gauche, copy à droite.

- Desktop : grille ~1.12 / 0.70 / 1.12, hauteur commune (~280–400 px), `object-fit: cover`, max-width 740 px.
- ≤980 px : pile façade → couple (max 260 px) → salle (ratio ~2:1), puis texte.
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
