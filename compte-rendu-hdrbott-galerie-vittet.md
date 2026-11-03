# Compte-rendu — bas du contact aligné sur le bas de l’adresse

Date : 3 novembre 2026.

## Objectif

Correction : le **bas** du bloc droite (téléphones, email, horaires) doit s’aligner sur le **bas** de l’adresse sous VITTET — plus le haut du bloc sur la ligne d’adresse.

Conserver l’espace MAÎTRES ANCIENS → adresse ; centrage wordmark ; encre ; recherche à droite des onglets.

## Approche

- `.header-contact` : `grid-row: 1 / -1` (couvre wordmark + adresse) + `align-self: end` → bas du contact = bas de la colonne marque = bas de l’adresse.
- `row-gap: 16px` conservé (gap mesuré MAÎTRES → adresse ≈ 18,9 px).
- Mobile ≤700 px : contact reste `grid-row: 3` + `align-self: start` (pile).

Cache-bust `?v=20261103-hdrbott`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `d7d41656` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://d7d41656.galerie-vittet-preview.pages.dev/ |
| Atelier | `6c4cc6ce` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif @1440

| Mesure | Valeur |
|---|---|
| `placeBottom` / `contactBottom` | 191.56 / 191.56 · **Δ 0 px** |
| Gap MAÎTRES → adresse | 18.9 px |
| Centre VITTET / MAÎTRES | Δ 0 |
| `GET /api/oeuvres` | 200 · 99 œuvres |

Screenshots : `hdrbott-desktop-header(-guide).png`, `hdrbott-mobile-header(-guide).png`.
