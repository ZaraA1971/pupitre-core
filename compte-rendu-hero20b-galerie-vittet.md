# Compte-rendu — carousel hero +20 % (2ᵉ passe)

Date : 3 novembre 2026.

## Changement

`.hero-viewport` max-height :

| Breakpoint | Avant | Après |
|---|---|---|
| Desktop | `min(74vh, 768px)` | `min(89vh, 922px)` |
| ≤980px | `67vh` | `80vh` |
| ≤700px | `58vh` | `70vh` |

Cache-bust `?v=20261103-hero20b`.

## Mesure @1440×900

| | Hauteur viewport |
|---|---|
| Avant | **666 px** |
| Après | **801 px** |
| Delta | **+20,3 %** |

Header intact : 202 px, brand visible, `top: 0`.

## Deploy (package cohérent + Functions)

Source : `/tmp/galerie-vittet-atelier-cf/` → sync → `/tmp/galerie-vittet-pages/` (functions + D1/KV + atelier).

| Cible | Id / URL |
|---|---|
| Prod | `37ff48b0` · https://galerie-vittet-preview.pages.dev/ |
| Deploy | https://37ff48b0.galerie-vittet-preview.pages.dev |
| Atelier | `27ea4273` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- `/api/oeuvres` 200 JSON
- Previews carousel JPEG 200 (KV via Functions)
- Aucune image hero cassée

Artefacts : `hero20b-before-desktop.png`, `hero20b-after-prod-desktop.png`, `hero20b-before-after-side.png`, `hero20b-verify.json`.
