# Retrait « Demander une œuvre » sous la collection — Galerie Vittet

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Déploiement main | https://6bf64466.galerie-vittet-preview.pages.dev |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Déploiement atelier | https://9117b690.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261101-nocollectcta`.

## Retiré

| Lien retiré | Emplacement | Raison |
|---|---|---|
| « Demander une œuvre » → `#contact` | Fin de `#collection` (`.collection-end`) | Doublon : déjà en lightbox + Contact nav / section `#contact` |

## Conservé

- Lightbox `mailto` « Demander cette œuvre → »
- Nav « Contact » → `#contact`
- Section `#contact` (« Écrire à la galerie »)
- Footer info adresse / horaires (sans mailto doublon)
- Dédoublonnage home précédent, typo, loupe, CMS same-origin, helpers cleanup2

## Sync / deploy

- Source : `/tmp/galerie-vittet-pages/`
- Sync HTML/CSS/JS → `/tmp/galerie-vittet-atelier-cf/`
- Prod : `pages deploy` branche `main`
- Atelier : `pages deploy` branche `atelier-kv-preview`

## Preuve

Artefacts : `/opt/cursor/artifacts/nocollectcta-collection-end.png`, `nocollectcta-lightbox.png`, `nocollectcta-nav-top.png`, `nocollectcta-contact.png`, `nocollectcta-verify.json`.
