# Compte-rendu — équilibre `#galerie` (repères égaux)

Date : 5 novembre 2026.

## Approche

Retour à une grille lisible `1fr · 240px · 1fr` (plus d’absolute). Un seul token `--gal-space` sert de **pad extérieur** et de **gap** entre colonnes.

| | Grow (trop) | Balance |
|---|---|---|
| Hauteur photos @1440 | 331 px | **278 px** |
| Layout | gouttière 48 + copy absolute | `1fr \| texte \| 1fr` flux normal |
| Espacements figure | asymétriques (115 / 36) | **31,7 · 31,7 · 31,7 · 31,7** |
| Centre texte | Δ 0 | Δ **0** |

Cache-bust `?v=20261104-galbal`.

## Mesures @1440

| Repère | px |
|---|---|
| Outer left | 31,7 |
| Gap façade→texte | 31,7 |
| Gap texte→salle | 31,7 |
| Outer right | 31,7 |
| Texte − axe page | **0** |
| Photo H | **277,7** (equal, contain, uncropped) |

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `a13df133` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://a13df133.galerie-vittet-preview.pages.dev/#galerie |
| Preview | `4473b97b` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `013768b6` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- `GET /api/oeuvres` → 200 · 99
- Screenshots : `galbal-desktop.png`, `galbal-desktop-viewport.png`, `galbal-mobile.png`, `galbal-verify.json`
