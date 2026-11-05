# Compte-rendu — loupe jauge 100–130 %

Date : 5 novembre 2026.

## Objectif

Améliorer la loupe lightbox : ouverture à **100 %** (même taille visuelle que la lightbox), jauge jusqu’à **130 %**, chrome (Quitter + jauge) masqué après ~3 s d’inaction.

Conservé : colonne infos masquée en loupe, fond quasi noir, filtre WB, source = fichier original, plafond natif.

## Zoom

- `zoomLevel` 1.0 → 1.3 (jauge 100–130)
- Taille cible = `fitLightbox × zoomLevel`, clamp `naturalWidth/Height`
- Scale CSS = cible / contain loupe courant
- Entrée = 100 % ; jauge pour monter jusqu’à 130 %

## Idle

Même timer que le bouton loupe (`LOUPE_CHROME_IDLE_MS = 3000`) : jauge + Quitter s’effacent, réapparaissent à l’action.

Cache-bust `?v=20261105-loupegauge`.

## Deploy (package + `functions/` via atelier-cf sync)

| Cible | Id / URL |
|---|---|
| Prod (main) | `c5ae2967` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://c5ae2967.galerie-vittet-preview.pages.dev/ |
| Preview | `8ddc6b17` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| `GET /api/oeuvres` | 200 · JSON · **103** œuvres · functions OK |
| Entrée loupe | 100 % + jauge visible |
| Jauge | 100 → 130 % (scale CSS, clamp natif) |
| Idle 3 s | Quitter + jauge opacity 0 |

Screenshots : `loupegauge-100-with-gauge.png`, `loupegauge-130-zoomed.png`, `loupegauge-idle-hidden.png`.
