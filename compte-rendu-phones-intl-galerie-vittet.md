# Compte-rendu — téléphones contact en format international

Date : 3 novembre 2026.

## Changement

Section `#contact` (`.visit-phones`) — seuls numéros affichés aux visiteurs (footer dédoublonné antérieurement) :

| | Avant | Après |
|---|---|---|
| Fixe | `01 42 60 11 39` | `+33 1 42 60 11 39` |
| Mobile | `06 19 47 14 31` | `+33 6 19 47 14 31` |
| `tel:` | déjà `+33142601139` / `+33619471431` | inchangé |
| Police | héritée `.visit-side` **12px** | `clamp(18px, 2.4vw, 22px)` → **22px** desktop |

CSS touché uniquement : `.visit-phones a` (taille, tracking, contraste). Lightbox / backdrop non modifié.

## Arbres

Source `galerie-vittet-atelier-cf` → `scripts/sync-trees.sh` → `galerie-vittet-pages` + `galerie-vittet-site`.

Cache-bust : `?v=20261103-phone` (front + atelier).

## Déploiement

| Cible | URL / id |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Prod deploy | `24157937` (branche `main`) |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Atelier deploy | `aa710034` (branche `atelier-kv-preview`) |

## Preuve

Live computed : texte `+33 1…` / `+33 6…`, `font-size: 22px`, `href` `tel:+33…`.

Artefacts : `/opt/cursor/artifacts/contact-phones-intl.png`, `contact-phones-intl.json`.
