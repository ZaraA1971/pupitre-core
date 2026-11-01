# Crédit footer discret — Galerie Vittet

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Déploiement main | https://6591ed92.galerie-vittet-preview.pages.dev |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Déploiement atelier | https://21432cc1.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261101-credit`.

## Texte

`Site réalisé par Emmanuel Torregano` — le nom est un lien `mailto:emmanueltorregano@mac.com`.

## Design

- Footer uniquement, sous l’adresse (`.footer-meta`)
- Typo 11px, couleur `#9a958c` (plus discrète que `.footer-info`)
- Pas de uppercase / tracking nav (`footer a` surchargé pour `.footer-credit a`)
- Desktop : aligné à droite ; mobile : à gauche

## Conservé

Recherche (soft-fold + debounce) ; dédoublonnage home ; pas de CTA Demander en fin de collection ; loupe ; images web ; CMS same-origin.

## Sync / deploy

- Source : `/tmp/galerie-vittet-atelier-cf/` → `scripts/sync-trees.sh` → pages + site
- Prod : `pages deploy` branche `main`
- Atelier : `pages deploy` branche `atelier-kv-preview`

## Preuve

Artefacts : `/opt/cursor/artifacts/credit-footer-desktop.png`, `credit-footer-mobile.png`, `credit-verify.json`.
`bruegel` → 3 hits.
