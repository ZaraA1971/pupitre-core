# Compte-rendu — physclean1 Galerie Vittet

Date : 23 novembre 2026.

## Objectif

Nettoyage du code d’échelle physique (physcale) sans changer le comportement.

## Mort / simplifié

| Élément | Action |
|---|---|
| `physicalSizeScale()` | retiré (jamais appelé) |
| `--size-scale` | retiré (écrit en JS, jamais lu en CSS) |
| `scale` dans `physicalSizeProps` / `lightboxSizeProps` | retiré avec `--size-scale` |
| `sizeRefCm` / `sizeLogK` / `sizeMinScale` / `loupeMaxCap` / `loupeSmallMaxCap` / `loupeSmallEdgeCm` | fusionnés via `cssNum` + `SIZE_CSS_FALLBACKS` |
| Double parse lightbox | `lightboxSizeProps = applySizeScale(...)` une seule fois |
| `setPhysCss` | helper unique pour grille + lightbox + loupe |

## Conservé

- Tokens `:root` (`--size-ref-cm`, `--size-log-k`, `--size-min-scale`, loupe caps)
- Préférence « avec cadre » pour l’échelle
- Courbe log + plancher ; loupe `<15 cm → 120 %` / sinon `180 %`
- Dimensions FR H × W

## Sync

`galerie-vittet/` → `/tmp/galerie-vittet-pages` + mirror site. Gate `functions/images/ajouts` conservée.

Cache-bust `?v=20261123-physclean1`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `97dbc38f` · https://galerie-vittet-preview.pages.dev/ |
| Preview | `9ac12b13` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `6e62c2d7` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| `node --check main.js` | OK |
| Parse CHIGI « avec cadre » | 22,9 × 20 cm |
| Live CDP CHIGI `--phys-h` | `0.732` (> aristocrate `0.695`) |
| `size-scale` / `physicalSizeScale` | absents |
| Cache-bust | `physclean1` sur style/main |
| `GET /api/oeuvres` | 200 · 101 œuvres |
