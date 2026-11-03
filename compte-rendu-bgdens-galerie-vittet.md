# Compte-rendu — fond papier +15 % densité

Date : 3 novembre 2026.

## Couleurs

Densification ≈15 % depuis le blanc (distance × 1,15), même teinte crème.

| Token / zone | Avant | Après |
|---|---|---|
| `--paper` / theme-color | `#ebe6df` | `#e8e2da` |
| `--wall` | `#d9d3cb` | `#d3ccc3` |
| `--line` | `#c9c3ba` | `#c1bab0` |
| Body gradient | `#f1ece6` → `#ebe6df` → `#e0d9d1` | `#efe9e2` → `#e8e2da` → `#dbd3ca` |
| Chrome sticky | `#f3eee8` → paper | `#f1ebe5` → paper |
| Collection veil | `rgb(242,237,230)` / `rgb(216,208,198)` | `rgb(240,234,226)` / `rgb(210,201,189)` |
| Radial accent | `rgba(128,112,98,.11)` | `.126` |

Cache-bust `?v=20261103-bgdens`.

## Deploy

Source `galerie-vittet-atelier-cf` → sync pages + site.

| Cible | URL / id |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/ |
| Prod | `8448149a` (main) |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ · `b718e817` |

Artefacts : `bgdens-before-*.png`, `bgdens-after-*.png`, `bgdens-verify.json`.
