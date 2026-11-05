# Compte-rendu — padding haut header (moitié)

Date : 5 novembre 2026.

## Objectif

Diminuer de moitié l’espace au-dessus de VITTET : top pad **5 → 2** px.

Conservé : bottom pad, ornement ·, bas contact = bas adresse.

## CSS

```css
.header { padding: 2px max(var(--page-pad), 3.2vw) 14px; }
/* ≤900 / ≤700 */
.header { padding: 2px var(--page-pad) 12px; }
```

Cache-bust `?v=20261105-hdrtop3`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `7bf38fce` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://7bf38fce.galerie-vittet-preview.pages.dev/ |
| Preview | `ddaa2858` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `6c0ddaa6` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif @1440

| Mesure | Valeur |
|---|---|
| Outer pad top | **2** px (était 5) |
| Outer pad bottom | 14 px |
| placeBottom / contactBottom | Δ 0 |
| `GET /api/oeuvres` | 200 · **99** · functions OK |

Screenshots : `hdrtop3-desktop-header.png`, `hdrtop3-desktop-top.png`.
