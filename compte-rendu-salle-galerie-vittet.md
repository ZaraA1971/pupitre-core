# Compte-rendu — photo salle à côté des galeristes

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/#galerie |
| Déploiement main | https://ea41db80.galerie-vittet-preview.pages.dev |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Déploiement atelier | https://7ee3f392.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261102-salle`.

## Layout

Section `#galerie` (`.about`) : diptyque `.about-images` (couple portrait + salle paysage) à gauche, copy à droite.

- Desktop : grille 38 % / 62 %, même hauteur (`object-fit: cover`), ombre existante conservée.
- ≤980 px : pile couple puis salle (ratio ~2:1), puis texte.

## Image

- Chemin : `images/galerie-salle.webp`
- Source JPEG 1024×530 → WebP q82, **69 120** octets (pas de downscale supplémentaire).
- Alt : « Intérieur de la Galerie Vittet, quai Voltaire »

## Sync / deploy

- Source : `/tmp/galerie-vittet-atelier-cf/` → `scripts/sync-trees.sh` → pages + site
- Prod : `pages deploy` branche `main`
- Atelier : `pages deploy` branche `atelier-kv-preview`

## Preuve

Artefacts : `/opt/cursor/artifacts/galerie-salle-desktop.png`, `galerie-salle-mobile.png`, `galerie-salle-verify.json`.
