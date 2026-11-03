# Compte-rendu — centrage « MAÎTRES ANCIENS » sous VITTET

Date : 3 novembre 2026.

## Objectif

Centrer le sous-titre du wordmark **relativement à la largeur de « VITTET »**, pas à la colonne marque / adresse (plus large).

## Texte exact

`MAÎTRES ANCIENS` (span dans `.header-brand .wordmark`).

## Approche

- Le wordmark reste un flex item shrink-to-fit : largeur = glyphes **VITTET**.
- Sur `.header-brand .wordmark span` : `text-align: left` → `text-align: center`.
- L’adresse `.header-place` reste alignée à gauche ; son centre (plus large) n’est pas la référence.

Mesure @1440 : centre VITTET 194.48 · centre glyphes sous-titre 194.47 · Δ −0.01 px · insets L/R 66.41 / 66.42.

Cache-bust `?v=20261103-wmcenter`.

## Où

- Source : `/tmp/galerie-vittet-atelier-cf/` (+ `functions/`)
- Sync : `scripts/sync-trees.sh` → `/tmp/galerie-vittet-pages/` + `/tmp/galerie-vittet-site/`

## Deploy (package cohérent + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `9c523c56` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://9c523c56.galerie-vittet-preview.pages.dev/ |
| Atelier | `0c57864f` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- CSS live : `text-align: center` sur `.header-brand .wordmark span`
- `GET /api/oeuvres` → 200 · 100 œuvres (functions OK)
- Screenshots : `wmcenter-header-desktop(_crop).png`, `wmcenter-header-mobile(_crop).png`
