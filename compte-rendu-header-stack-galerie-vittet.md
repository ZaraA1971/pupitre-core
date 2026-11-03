# Compte-rendu — header empilé (marque / recherche / contact)

Date : 3 novembre 2026.

## Structure

Une seule barre sticky en grille 3 colonnes :

| Gauche | Centre | Droite |
|---|---|---|
| **VITTET** (~56 px, ×2 vs 28 px) + sous-titre | champ **Rechercher** centré | téléphones `+33` empilés |
| Nav **La collection** / **La galerie** (~15 px) | | Écrire à la galerie |
| | | adresse + horaires |

## Tailles (desktop 1440)

- Wordmark : **56px** (avant 28px)
- Nav : **15px** (avant 11px)
- Téléphones : ~16–19px
- Recherche : centrée (écart au milieu de barre ≈ 0 px)

Mobile : marque + menu, puis contact empilé, puis recherche pleine largeur.

## Arbres / deploy

Source `galerie-vittet-atelier-cf` → sync → pages + site.  
Cache-bust `?v=20261103-hdrstack`.

| Cible | URL / id |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/ |
| Prod | `897852ae` (main) |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ · `f29bed8f` |

Artefacts : `header-stack-desktop.png`, `header-stack-mobile.png`.
