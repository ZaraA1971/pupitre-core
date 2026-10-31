# Compte-rendu — loupe lightbox (original lazy)

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| API publique | https://galerie-vittet-preview.pages.dev/api/oeuvres |

Cache-bust front : `?v=20261031-loupe`.

Déploiements : production `28e3e4d5` (main) ; preview `1ee46bd7` (`atelier-kv-preview`).

## Original exposé

`GET /api/oeuvres` conserve :

- `image` / `web` = dérivé d’affichage (`images/ajouts/web/…`, ~1800 px)
- `preview` = vignette
- **`original`** = chemin D1 `image` (KV `detail:` → `images/ajouts/{id}.ext`)

Le front ne précharge jamais les originaux. La loupe charge `original` à la demande.

## UX

- Bouton **Loupe** (icône + libellé) sur la zone photo ; clic image = même action.
- Chargement : overlay + « Chargement de l’original… ».
- Zoom : pan drag, **Quitter** / clic / **Échap** → retour au `web/`.
- Échec original → reste sur web.

## Preuve (`ajout-porte-peinte-monage`)

| Variante | URL | Taille | naturalWidth |
|---|---|---|---|
| Défaut lightbox | `…/web/ajout-porte-peinte-monage.jpg` | **690 171** o | **1800×1376** |
| Après loupe | `…/ajout-porte-peinte-monage.jpg` | **11 388 889** o | **7983×6102** |

Artefacts : `/opt/cursor/artifacts/loupe-before-web.png`, `loupe-after-original.png`, `loupe-proof.json`, vidéo walkthrough.

## Conservé

Tagline personnel, typo auteur, hover peinture, carousel-in-collection, export, pipeline web.
