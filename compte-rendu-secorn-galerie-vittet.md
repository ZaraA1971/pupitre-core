# Compte-rendu — ornement mutualisé collection → galerie

Date : 4 novembre 2026.

## Mutualisation

Classe partagée `.ornament-rule` (+ `.ornament-rule-mark`) = filet horizontal + `·`.

| Usage | Classes |
|---|---|
| Header | `ornament-rule header-ornament` |
| Junction | `ornament-rule section-ornament` (entre `#collection` et `#galerie`) |

`border-top` de `.about` retiré. Margin section : `-40px auto 28px` (remonte dans le pad collection, galerie reste sous le filet).

Cache-bust `?v=20261104-secorn2`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `6d516929` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://6d516929.galerie-vittet-preview.pages.dev/ |
| Preview | `1c1916e9` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `6344a14e` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

Order `collection-end` → ornament → `#galerie` · shared classes · about border 0 · API 99.

Screenshots : `secorn-desktop-junction.png`, `secorn-mobile-junction.png`.
