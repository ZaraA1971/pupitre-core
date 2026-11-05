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

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `e8feb2a7` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://e8feb2a7.galerie-vittet-preview.pages.dev/ |
| Preview | `d2237344` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `c4684494` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif @1440

| Mesure | Avant | Après |
|---|---|---|
| Outer pad top | **12** px | **8** px |
| Outer pad bottom | 14 px | 14 px |
| Mobile pad top (≤900/700) | 10 px | **8** px |
| placeBottom / contactBottom | — | 189.56 / 189.56 · **Δ 0** |
| `GET /api/oeuvres` | — | 200 · **99** · functions OK |

Screenshots : `hdrtop-desktop-header.png`, `hdrtop-desktop-top.png`.
