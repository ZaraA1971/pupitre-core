# Compte-rendu — recherche à droite des onglets collection

Date : 3 novembre 2026.

## Placement

- Champ recherche retiré du centre du header (marque à gauche + contact à droite seuls)
- Sous `#collection`, même rangée que les onglets Peintures / Miniatures / Victor-Jean NICOLLE, marge droite
- Mobile : recherche pleine largeur juste au-dessus des onglets
- En vue `#recherche`, le formulaire est remonté dans `#recherche-search-slot` (comportement inchangé : instantané, clear → `#collection`, soft-fold)

## Technique

- Markup : `.collection-toolbar` (filters + `.site-search-slot`)
- CSS : header 2 colonnes ; toolbar flex ; ink90/85 (`--ink-lg` / `--ink`) et `#galerie` 80 % conservés
- JS : `mountSiteSearch()` dans `setSearchMode`
- Cache-bust `?v=20261103-srchtabs`

## Deploy (package cohérent + `functions/`)

Source `/tmp/galerie-vittet-atelier-cf/` → sync `galerie-vittet-pages` (avec Functions) :

| Cible | Id / URL |
|---|---|
| Prod | `a7c2e81e` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://a7c2e81e.galerie-vittet-preview.pages.dev/ |
| Preview | `282a9b24` · https://282a9b24.galerie-vittet-preview.pages.dev/ |

## Vérif

- Layout : header sans search ; toolbar same-row, search near right
- `bruegel` → 2 œuvres, form parent `recherche-search-slot`
- Clear / X → `#collection`, form revient dans `collection-search-slot`
- `GET /api/oeuvres` → 200 · pageSize 15

Artefacts : `srchtabs-desktop-collection.png`, `srchtabs-mobile-collection.png`, `srchtabs-desktop-search.png`, `srchtabs-verify.json`.
