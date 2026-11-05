# Compte-rendu — padding haut du header

Date : 5 novembre 2026.

## Objectif

Réduire un peu l’espace entre VITTET et le haut de la page — serrage modéré, pas collé.

Conservé : ornement horizontal · ; bas contact = bas adresse ; structure header.

## CSS

```css
.header {
  padding: 8px max(var(--page-pad), 3.2vw) 14px; /* était 12 / 14 */
}
/* ≤900 / ≤700 */
.header {
  padding: 8px var(--page-pad) 12px; /* était 10 / 12 */
}
```

Cache-bust `?v=20261105-hdrtop`.
