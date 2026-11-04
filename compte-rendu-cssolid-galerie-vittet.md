# Compte-rendu — CSS solide (papier unique)

Date : 4 novembre 2026.

## Objectif

Nettoyage prudent après retrait des murs gris (collection + hero) : un seul modèle de surface papier, plus de `--wall` autour des images, tokens ink / WB / type conservés.

## Modèle CSS

| Token | Rôle |
|---|---|
| `--paper` `#e8e2da` | Champ unique : page, chrome, hero, collection, letterbox, lightbox fiche, thumbs atelier |
| `--paper-lift` `#f1ebe5` | Soft lift (chrome wash, hover contrôles) |
| `--shade` `#d3ccc3` | Skeleton shimmer **uniquement** — jamais letterbox |
| ink-full / ink-lg / ink·muted | inchangés (100 / 90 / 85 %) |
| `--img-enhance` + `#img-warm-wb` | inchangé (pas de sépia) |

## Retiré / unifié

| Élément | Action |
|---|---|
| `--wall` | retiré ; remplacé par `--shade` (skeleton) |
| Body `linear-gradient(… #dbd3ca)` | retiré (bande grisâtre bas de page) → `var(--paper)` + radial léger |
| `.about` voile blanc translucide | → `var(--paper)` |
| Hardcodes `#f1ebe5` / `#f1ede6` / `#c2bbb0` / `#eee8e1` | → tokens |
| Atelier `.upload-thumb` / `.library-thumb` | `--wall` → `--paper` (contain) |
| JS | aucun mort sûr à retirer |

Conservé : recherche par tabs, loupe idle, NICOLLE, header bottoms alignés, WB, Functions + D1/KV.

Cache-bust `?v=20261104-cssolid`.

## Où

- Live source : `/tmp/galerie-vittet-atelier-cf/` (+ `functions/`)
- Sync : `scripts/sync-trees.sh` → pages + site
- Durable : `/workspace/galerie-vittet/`

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Preview | `89c0ad4d` · https://89c0ad4d.galerie-vittet-preview.pages.dev/ |
| Prod (main) | `793cdbd1` · https://galerie-vittet-preview.pages.dev/ |
| Alias preview | https://preview.galerie-vittet-preview.pages.dev/ |

## Vérif

- `GET /api/oeuvres` → 200 · **99** œuvres · `pageSize` 15 · sections peinture/miniature/nicolle
- Cache-bust `?v=20261104-cssolid` · SVG `#img-warm-wb` · pas de `--wall` · pas de `#dbd3ca`
- Surfaces live = `rgb(232, 226, 218)` (`--paper`) : body, hero, hero-viewport, collection, art-open, about
- Letterbox hero coin = paper (Δ 0 vs `#e8e2da`)

Artefacts : `cssolid-desktop-*.png`, `cssolid-mobile-header.png`, `cssolid-verify.json`.
