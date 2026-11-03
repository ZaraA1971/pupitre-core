# Compte-rendu — retrait hero « Une histoire de regard »

Date : 3 novembre 2026.

## Changement

Le bloc hero `.hero-copy` (« Une histoire de regard » + « La beauté traverse le temps. » + intro) est retiré. Le récit de la galerie reste uniquement dans `#galerie` :

- eyebrow `Depuis 1988`
- H2 `La galerie`
- deux paragraphes Claude Vittet
- triptyque photos inchangé

Le hero n’affiche plus que le carrousel (pleine largeur).

## Arbres

Source `galerie-vittet-atelier-cf` → `scripts/sync-trees.sh` → `galerie-vittet-pages` + `galerie-vittet-site`.

Cache-bust : `?v=20261103-herotext` (front + atelier).

## Déploiement

| Cible | URL / id |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Prod deploy | `45f76860` (branche `main`) |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Atelier deploy | `2eaf1a27` (branche `atelier-kv-preview`) |

## Preuve

Live DOM : `heroCopyCount: 0`, pas de « Une histoire de regard » / « La beauté traverse le temps » ; `#galerie h2` = « La galerie » + paragraphes Claude Vittet.

Artefacts : `/opt/cursor/artifacts/herotext-hero-desktop.png`, `herotext-galerie-desktop.png`, `herotext-verify.json`.
