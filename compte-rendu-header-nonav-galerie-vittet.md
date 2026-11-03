# Compte-rendu — adresse ×2, sans menus header

Date : 3 novembre 2026.

## Changements

- Adresse sous Vittet : **14px → 28px** (`calc(var(--type-meta) * 2)`) ; mobile 13→26px.
- Retrait nav « La collection » / « La galerie » + bouton menu.
- Centre : recherche seule ; droite : phones / mailto / horaires.
- CSS/JS nav orphelins nettoyés ; lightbox loupe inchangé.

## Deploy

Cache-bust `?v=20261103-hdrnonav`

| Cible | URL / id |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/ |
| Prod | `b06101f2` (main) |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ · `48fab794` |

Artefacts : `header-nonav-desktop.png`, `header-nonav-mobile.png`.
