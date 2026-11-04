# Compte-rendu — Papier = encre éclaircie

Date : 4 novembre 2026.

## Objectif

Fond site dérivé de `--ink-full` `#2c261f` (même famille de teinte, undertone brun chaud), pas un beige/gris séparé qui dérive au froid.

## Dérivation

OKLCH sur l’encre : conserver **H ≈ 71,4°** et **C ≈ 0,0154**, monter **L ≈ 0,925**.

| Token | Avant | Après | Note |
|---|---|---|---|
| `--paper` | `#e8e2da` | `#ede5db` | encre éclaircie (OKLCH) |
| `--paper-lift` | `#f1ebe5` | `#f5eee6` | même H, L ≈ 0,952 |
| `--shade` | `#d3ccc3` | `#d6cec5` | skeleton only, H encre |
| `theme-color` | `#e8e2da` | `#ede5db` | index + atelier |
| body radial | `rgba(128,112,98,.08)` | `rgba(44,38,31,.06)` | ink RGB |

Cache-bust `?v=20261104-inkpaper`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Preview | `4be06495` · https://4be06495.galerie-vittet-preview.pages.dev/ |
| Prod (main) | `d7f51c90` · https://galerie-vittet-preview.pages.dev/ |
| Alias preview | https://preview.galerie-vittet-preview.pages.dev/ |

## Vérif

- `GET /api/oeuvres` → 200 · **99** œuvres · `pageSize` 15
- Live CSS `--paper: #ede5db` · theme-color `#ede5db`
- Screenshot body sample Δ 0 vs `#ede5db` (chrome wash ≈ paper-lift)

Artefacts : `inkpaper-desktop.png`, `inkpaper-mobile.png`, `inkpaper-verify.json`.
