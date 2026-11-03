# Compte-rendu — Loupe lightbox ×130 % (original)

Date : 3 novembre 2026.

## Règle de zoom

- Lightbox normale : web, contain, plafond natif.
- Loupe : charge le **fichier original** (pas `web/`).
- Taille affichée = **1,3 ×** la taille lightbox normale (`LOUPE_DISPLAY_SCALE`).
- Clamp : jamais au-delà de `naturalWidth` / `naturalHeight` (pas d’upscale).
- Fiche infos masquée ; dialog quasi plein viewport ; fond quasi noir conservés.
- Pan si l’image dépasse la zone (glisser) ; clic = quitter.

## Deploy (package cohérent + Functions)

| Cible | Id / URL |
|---|---|
| Prod | `44653fe2` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://44653fe2.galerie-vittet-preview.pages.dev/ |
| Atelier | `97494dd4` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

Cache-bust : `?v=20261103-loupe130`

Arbres sync : `/tmp/galerie-vittet-pages`, `/tmp/galerie-vittet-site`, `/tmp/galerie-vittet-atelier-cf` (deploy depuis atelier-cf avec `functions/`).

## Vérif (portrait hauteur-limité — avant : loupe = même taille)

| Mode | Affichage | Source |
|---|---|---|
| Défaut | 773×884 | `/images/ajouts/web/…` |
| Loupe | 1005×1149 (×1,30) | `/images/ajouts/…` original 6598×7544 |

Artefacts : `lightbox-loupe130-default.png`, `lightbox-loupe130-mode.png`, `lightbox-loupe130-verify.json`.
