# Compte-rendu — loupe jauge max natif (anti-pixelisation)

Date : 5 novembre 2026.

## Objectif

Remplacer le plafond fixe **150 %** de la jauge loupe par le **coefficient de multiplication max** qui n’upscale pas au-delà des pixels natifs du fichier original.

## Formule

```
maxZoom = min(naturalWidth / displayWidth, naturalHeight / displayHeight)
```

- `display*` = taille visuelle à l’entrée loupe (100 % = fit lightbox courant)
- `natural*` = résolution du fichier **original**
- Zoom ≤ `maxZoom` → pas de pixelisation par upscale
- Si `maxZoom < 1` → jauge reste à 100 % et est désactivée

## Échantillons (viewport 1440×900, site live avant deploy)

| Œuvre | Orient. | Display 100 % | Natural original | maxZoom |
|---|---|---|---|---|
| Descente van Loo (`ajout-descente-van-loo-1`) | portrait | 619 × 884 | 5482 × 7823 | **×8,85** (885 %) |
| Thermes Nicolle (`ajout-nicolle-thermes-a4`) | paysage | 1096 × 707 | 3432 × 2216 | **×3,13** (313 %) |

## Implémentation

- `loupeZoomMax` calculé à l’entrée loupe après chargement de l’original
- Jauge `max` / `aria-valuemax` dynamiques ; entrée toujours à **100 %**
- Clamp `fitZoomScale` / `setZoomLevelFromPercent` sur `loupeZoomMax` + `natural*`
- Cache-bust `?v=20261105-loupemax`

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `f2f35d15` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://f2f35d15.galerie-vittet-preview.pages.dev/ |
| Preview | `9b854504` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `1a9e9f06` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif post-deploy (1440×900)

| Check | Résultat |
|---|---|
| `GET /api/oeuvres` | 200 · JSON · **103** œuvres · functions OK |
| Cache-bust | `loupemax` sur style/main |
| van Loo | display 619×884 · natif 5482×7823 · jauge max **884 %** · start 100 % · visuel ≤ natif |
| Nicolle Thermes | display 1096×707 · natif 3432×2216 · jauge max **313 %** · start 100 % · visuel ≤ natif |
