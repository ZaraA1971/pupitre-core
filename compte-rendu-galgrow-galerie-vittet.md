# Compte-rendu — agrandir + recentrer les photos `#galerie`

Date : 4 novembre 2026.

## Changement

| | Avant (galpage) | Après (galgrow) |
|---|---|---|
| Hauteur photos @1440 | **288 × 288** | **331 × 331** (+43 px) |
| Largeurs | 418 / 556 | 481 / 640 |
| Placement | collées aux bords (`flex-start` / `flex-end`) | centrées dans les tracks |
| Pad extérieur | ~17 px | ~36 px (`max(28px, 2.5vw)`) |
| Grille | `1fr · 240 · 1fr` | `1fr · 48px · 1fr` + copy absolute centre page |
| Centre texte | Δ 0 | Δ **0** (conservé) |

La gouttière `--mid: 48px` libère de la largeur pour les photos ; le texte reste ancré au milieu de la page (`left: 50%` + `translate`) avec fond `--paper` là où les images rencontrent la colonne.

Cache-bust `?v=20261104-galgrow`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `317cdb6d` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://317cdb6d.galerie-vittet-preview.pages.dev/#galerie |
| Preview | `d4d7188d` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `06880902` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- Copy Δ page = **0 px** · hauteurs égales · contain uncropped
- `GET /api/oeuvres` → 200 · 99
- Screenshots : `galgrow-desktop.png`, `galgrow-desktop-viewport.png`, `galgrow-mobile.png`, `galgrow-verify.json`
