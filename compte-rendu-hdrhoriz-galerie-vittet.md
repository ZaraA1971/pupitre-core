# Compte-rendu — ornement header horizontal

Date : 4 novembre 2026.

## Choix

Le filet **vertical** ne marchait pas.  
Remplacé par un **filet horizontal** centré dans la bande médiane, interrompu par un `·`, dans le vide entre marque et contact (même motif en pile mobile). Pas de cadres.

## CSS

```css
.header-ornament {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  display: flex; flex-direction: row;
  width: min(300px, 26vw);
  gap: 14px;
}
.header-ornament::before,
.header-ornament::after { height: 1px; flex: 1; background: var(--line); }
```

Padding chrome serré conservé (`12/14`). Cache-bust `?v=20261104-hdrhoriz`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `163717e6` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://163717e6.galerie-vittet-preview.pages.dev/ |
| Preview | `292fc4c8` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `f73d5e09` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif @1440

Horizontal · centre 720 · dans le gap · pas de overlap · bottoms Δ0 · API 99.

Screenshots : `hdrhoriz-desktop-header.png`, `hdrhoriz-mobile-header.png`.
