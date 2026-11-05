# Compte-rendu — padding haut header (2ᵉ serrage)

Date : 5 novembre 2026.

## Objectif

Encore un peu plus près du haut : top pad **8 → 5** px (pas collé).

Conservé : bottom pad, ornement ·, bas contact = bas adresse.

## CSS

```css
.header { padding: 5px max(var(--page-pad), 3.2vw) 14px; }
/* ≤900 / ≤700 */
.header { padding: 5px var(--page-pad) 12px; }
```

Cache-bust `?v=20261105-hdrtop2`.
