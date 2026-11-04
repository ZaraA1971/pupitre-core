# Compte-rendu — ornement mutualisé collection → galerie

Date : 4 novembre 2026.

## Mutualisation

Classe partagée `.ornament-rule` (+ `.ornament-rule-mark`) = filet horizontal + `·`.

| Usage | Classes |
|---|---|
| Header | `ornament-rule header-ornament` (position absolue centre) |
| Junction | `ornament-rule section-ornament` (entre `#collection` et `#galerie`) |

`border-top` de `.about` retiré (le divider est l’ornement).

Cache-bust `?v=20261104-secorn`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `6e9ac419` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://6e9ac419.galerie-vittet-preview.pages.dev/ |
| Preview | `fa33f1e2` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `340996bb` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

Screenshots : `secorn-desktop-junction(-band).png`, `secorn-mobile-junction.png`, `secorn-desktop-header.png`.
