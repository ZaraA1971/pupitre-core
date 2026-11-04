# Compte-rendu — suppression du filet pagination → statut collection

Date : 4 novembre 2026.

## Changement

Retrait du `border-top` plein largeur sur `.collection-end` (entre la pagination `1 2 3 4` et « Peintures · 1–15 sur 50 »).

| Avant | Après |
|---|---|
| `.collection-end { border-top: 1px solid var(--line); }` | `border-top: 0` |
| Filet edge-to-edge sous le pager | Plus de filet entre pager et statut |

Conservé : `.section-ornament` entre `#collection` et `#galerie` · centrage `#galerie` inchangé.

Cache-bust `?v=20261104-collend0`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `af6373a9` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://af6373a9.galerie-vittet-preview.pages.dev/ |
| Preview | `0d24782d` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `e906d1e1` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- CDP : `.collection-end` border-top `0px` · pagination border-bottom `0px`
- `.section-ornament` présent · `.about` border-top `0px`
- `GET /api/oeuvres` → 200 · 99 œuvres (functions OK)
- Screenshots : `collend0-pager-status-tight.png`, `collend0-pager-status.png`
