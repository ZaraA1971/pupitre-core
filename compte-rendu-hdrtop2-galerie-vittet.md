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

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `6f4f20ba` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://6f4f20ba.galerie-vittet-preview.pages.dev/ |
| Preview | `30f04d08` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `bc4493e7` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif @1440

| Mesure | Valeur |
|---|---|
| Outer pad top | **5** px (était 8) |
| Outer pad bottom | 14 px |
| placeBottom / contactBottom | 186.56 / 186.56 · **Δ 0** |
| `GET /api/oeuvres` | 200 · **99** · functions OK |

Screenshots : `hdrtop2-desktop-header.png`, `hdrtop2-desktop-top.png`.
