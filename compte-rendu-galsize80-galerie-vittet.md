# Compte-rendu — photos `#galerie` −20 %

Date : 3 novembre 2026.

## Objectif

Réduire l’affichage des deux photos (façade + salle) d’environ **20 %** (→ 80 % de la taille actuelle), sans crop, proportions et layout **façade | texte | salle** conservés.

## CSS

- `.about-photo img { width: 80%; }` (était `100%`)
- Photos recentrées vers le texte : façade `flex-end`, salle `flex-start`
- Grille 3 colonnes et `object-fit: contain` inchangés

Cache-bust `?v=20261103-galsize80`.

## Tailles @1440

| Photo | Avant | Après | Ratio |
|---|---|---|---|
| Façade | 456.6 × 314.4 | 365.3 × 251.5 | 80 % |
| Salle | 607.4 × 314.4 | 485.9 × 251.5 | 80 % |

Hauteurs égales conservées (251.5 px).

## Où

- Source : `/tmp/galerie-vittet-atelier-cf/` (+ `functions/`)
- Sync : `scripts/sync-trees.sh` → pages + site
- Durable : `/workspace/galerie-vittet/`

## Deploy (package cohérent + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `c0b34e75` · https://galerie-vittet-preview.pages.dev/#galerie |
| Hash | https://c0b34e75.galerie-vittet-preview.pages.dev/#galerie |
| Atelier | `66f68834` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- Desktop @1440 : façade 365.3×251.5 · salle 485.9×251.5 (= 80 %)
- `GET /api/oeuvres` → 200 JSON · pageSize 15
- Screenshots : `galsize-before-desktop.png`, `galsize-after-desktop.png`
