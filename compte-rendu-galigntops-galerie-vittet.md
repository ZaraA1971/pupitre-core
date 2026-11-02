# Compte-rendu — #galerie : tops alignés, sans H2

## Changements

1. **Hauts des 3 photos alignés** (façade, salle, portrait) — `.about` et `.about-frame` en `align-items: start` ; `padding-top: 12px` sur `.about-side` pour compenser le padding du cadre lieux (écart mesuré ≤ 1 px desktop).
2. **Suppression** du H2 « Le goût des œuvres rares. »
3. **Petit texte** (deux paragraphes) conservé sous le portrait : `text-align: justify`, hyphens, mesure ~280 px — ancre / équilibre la colonne droite.

Conservé : cadre léger gauche (filet + outline or), diptyque côte à côte, images non croppées (`object-fit: contain`), séparation Contact.

## URLs

| Surface | URL |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/#galerie |
| Prod | https://ad977e25.galerie-vittet-preview.pages.dev |
| Atelier | https://595af358.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261102-galigntops`.

## Preuve

Artefacts : `galerie-galigntops-desktop.png`, `galerie-galigntops-mobile.png`, `galerie-galigntops-*-viewport.png`, `galerie-galigntops-verify.json`.

Trees : `/tmp/galerie-vittet-{atelier-cf,pages,site}`.
