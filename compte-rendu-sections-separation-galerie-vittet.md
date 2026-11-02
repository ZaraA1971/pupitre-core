# Compte-rendu — séparation Galerie / Contact / Collection

## Cause

1. Après le diptyque couple|salle, `#galerie` reste court : Contact entre souvent dans le même viewport.
2. Ombre `0 24px 50px` des photos débordait dans le bandeau sombre Contact (box-shadow hors flux).
3. Scroll-spy (sonde sous le header) gardait « La collection » active alors que Galerie était déjà visible → sensation de mélange Galerie / Peintures / Contact.

Pas de chevauchement de boîtes DOM (gap 0, pas de z-index croisé).

## Correctifs

- `.about` : padding bas 96px (72px mobile), `overflow: clip`, filet haut, fond légèrement distinct, ombre adoucie.
- `.visit` : padding 72px, `isolation: isolate`.
- `.collection` : padding bas 64px.
- Nav : sonde à ~38 % de la hauteur viewport pour activer les sections courtes.
- Cache-bust : `?v=20261102-sections`
- Diptyque conservé.

## URLs

| Surface | URL |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/#galerie |
| Prod | https://9bd42b34.galerie-vittet-preview.pages.dev |
| Atelier | https://12f0d4a7.galerie-vittet-preview.pages.dev |

## Preuve

~101 px de bande crème sous les images avant Contact (desktop) ; ~96 px mobile. Spy `@#galerie` → `galerie`.
Artefacts : `sections-fixed-desktop-junction.png`, `sections-fixed-mobile-junction.png`, gutter crops.
