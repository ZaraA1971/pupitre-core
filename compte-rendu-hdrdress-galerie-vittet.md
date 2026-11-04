# Compte-rendu — habillage header (sans cadres)

Date : 4 novembre 2026.

## Choix

Les cadres autour marque / contact étaient trop « boîte ».  
Solution retenue : **bande papier unifiée** + **ornement central discret** (filet vertical interrompu par un `·` typographique), horizontal en pile mobile. Pas de cartes, pas de search dans le header.

## CSS (résumé)

- Retrait `border` / padding-cadre sur `.header-brand` / `.header-contact`
- Padding chrome serré conservé : `12px / 14px` (mobile `10px / 12px`)
- `.header-ornament` absolu centré : filet `--line` + mark `·` en `--ink`
- Colonnes un peu plus rentrées (`max(page-pad, 3.2vw)`, `column-gap: 48px`)
- Mobile ≤700 : ornement en rangée 3, filet horizontal `min(148px, 56%)`

Cache-bust `?v=20261104-hdrdress`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `f9ef3397` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://f9ef3397.galerie-vittet-preview.pages.dev/ |
| Preview | `9ff78973` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `df655b9b` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif @1440

| Mesure | Valeur |
|---|---|
| Cadres | **0** (brand/contact border 0) |
| Ornament X | 720 = centre viewport |
| place/hours bottoms | **Δ 0** |
| MAÎTRES centre | **Δ 0** |
| Outer pad | 12 / 15 px |
| Paper / ink | `#f5ede5` / `#413c35` |
| API | 200 · **99** · functions OK |

Screenshots : `hdrdress-desktop-header.png`, `hdrdress-mobile-header.png`, `hdrdress-*-top.png`.
