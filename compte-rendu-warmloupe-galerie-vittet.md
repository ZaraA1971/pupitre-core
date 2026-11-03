# Compte-rendu — chaleur images + loupe idle

Date : 3 novembre 2026.

## Objectif

1. Photos perçues trop froides → chaleur discrète à l’affichage.
2. Mode loupe : ne plus afficher la résolution fichier ; bouton loupe masqué après 3 s d’inactivité, réaffiché à l’action.

## Chaleur (CSS `--img-enhance`)

Même plan que le rehaussement existant (collection / hero / lightbox / loupe) :

| Variable | Valeur | Rôle |
|---|---|---|
| `--img-contrast` | `1.06` | inchangé |
| `--img-brightness` | `1.015` | légère ouverture |
| `--img-sepia` | `0.10` | chaleur discrète |
| `--img-saturate` | `1.12` | compense le sépia |

Chaîne : `contrast → brightness → sepia → saturate`. Pas de bake web (dérivés inchangés).

## Loupe UI

- Plus de label `Original · W×H · %` après chargement ; statut vidé (loading « Chargement… » conservé le temps du fetch).
- Bouton `.lightbox-loupe` : `pokeLoupeChrome()` → visible, puis `is-idle-hidden` après **3000 ms** ; réveil sur `pointermove` / `mousemove` / `click` / `touchstart` / `keydown` dans le dialog.

Cache-bust `?v=20261103-warmloupe`.

## Où

- Durable : `/workspace/galerie-vittet/`
- Live edit : `/tmp/galerie-vittet-atelier-cf/`
- Deploy package : `/tmp/galerie-vittet-pages/` (+ `functions/`)

## Deploy (package cohérent + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `655e8cbd` · https://galerie-vittet-preview.pages.dev/ |
| Preview | `5111d71b` · https://5111d71b.galerie-vittet-preview.pages.dev/ |
| Atelier | `553f6413` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| Filter computed (grid + lightbox) | `contrast(1.06) brightness(1.015) sepia(0.1) saturate(1.12)` |
| Après 3,2 s idle | `is-idle-hidden` · opacity `0` |
| Après mousemove | classe retirée · bouton réapparaît |
| Loupe status | `text:""` · `hidden:true` · pas de `W×H` |
| `GET /api/oeuvres` | 200 · **99** œuvres |

Screenshots : `warmloupe-collection(-grid|_card).png`, `warmloupe-lightbox-loupe-(visible|idle|awake).png`, `warmloupe-loupe-mode(-idle).png`, `warmloupe-verify.json`.
