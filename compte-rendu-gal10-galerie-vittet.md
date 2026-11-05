# Compte-rendu — photos `#galerie` +10 %

Date : 5 novembre 2026.

## Changement

| | Balance | +10 % |
|---|---|---|
| Photo H @1440 | 277,7 px | **306 px** (×1,10) |
| Alignements | pad = gap, texte Δ 0 | **conservés** |
| Espaces figure | 31,7 × 4 | **4,4 × 4** (spread 0) |

`--gal-photo-h: clamp(275px, 21.25vw, 306px)` ; `--gal-space` dérivé pour que la salle tienne encore dans chaque `1fr` (pad = gap). Grille `1fr \| 240 \| 1fr` inchangée, pas d’absolute.

Cache-bust `?v=20261104-gal10`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `7b5b9ee8` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://7b5b9ee8.galerie-vittet-preview.pages.dev/#galerie |
| Preview | `4932a096` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `d51e7495` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- Copy Δ **0** · spaces spread **0** · uncropped · `GET /api/oeuvres` 200 · 99
- Screenshots : `gal10-desktop.png`, `gal10-verify.json`
