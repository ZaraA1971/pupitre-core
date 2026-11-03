# Compte-rendu — lightbox assombrissement hors cadre

Date : 3 novembre 2026.

## Changement

Backdrop lightbox (« peinture sélectionnée ») :

| | Valeur |
|---|---|
| **Avant** | `rgba(22, 20, 16, .8)` |
| **Après** | `rgba(0, 0, 0, 0.94)` |

Sélecteur : `.lightbox[open]::backdrop` dans `style.css`.

## Arbres

Modifié dans la source `galerie-vittet-atelier-cf`, puis `scripts/sync-trees.sh` → `galerie-vittet-pages` + `galerie-vittet-site`.

Cache-bust : `?v=20261103-lbdim` (front + atelier).

## Déploiement

| Cible | URL / id |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Prod deploy | `749baa0e` (branche `main`) |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Atelier deploy | `599fb307` (branche `atelier-kv-preview`) |

## Preuve

Computed `::backdrop` live : `rgba(0, 0, 0, 0.94)`.

Artefacts : `/opt/cursor/artifacts/lightbox-dim-before.png`, `lightbox-dim-after.png`, `lightbox-dim-after.json`.
