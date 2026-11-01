# Dédoublonnage liens + densification home — Galerie Vittet

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Déploiement main | https://42a7a64a.galerie-vittet-preview.pages.dev |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Déploiement atelier | https://51919561.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261101-dedupe`.

## Doublons retirés

| Lien retiré | Destination | Conservé |
|---|---|---|
| Hero « Explorer la collection » | `#collection` | Nav « La collection » |
| About « Prendre rendez-vous » | `#contact` | Nav « Contact » + fin de collection « Demander une œuvre » |
| Footer adresse OSM | OpenStreetMap | Adresse liée dans `#contact` uniquement |
| Footer téléphone | `tel:` | Téléphones dans `#contact` uniquement |
| Footer e-mail | `mailto:` | Bouton « Écrire à la galerie » + CTA lightbox |
| Footer « Retour en haut » | `#accueil` | Wordmark header + footer (marque) |

## Conservé volontairement

- Wordmarks header/footer → `#accueil` (hiérarchie de marque)
- Nav Contact + « Demander une œuvre » en fin de collection → `#contact` (chrome + CTA contextuel)
- `mailto` visite + lightbox « Demander cette œuvre » (contexte œuvre)
- Tagline « ensemble personnel », typo auteur, hover peinture, carrousel, CMS same-origin, helpers cleanup2
- Aucune fuite `/atelier` sur le front public

## Espaces home

- Topline / header plus bas (`72px` sticky)
- Hero : paddings et `max-height` carrousel réduits ; plus de CTA sous l’intro
- Collection / about / visit / footer : bandes verticales resserrées
- Mobile : header `64px`, hero et sections alignés

## Preuve

Artefacts : `/opt/cursor/artifacts/dup-before-*.png`, `dup-after-*.png`, `dup-before-after-hero-side.png`, `dup-verify.json`.
