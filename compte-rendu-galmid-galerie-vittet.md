# Compte-rendu — « La galerie » entre les 2 photos

Date : 3 novembre 2026.

## Objectif

Positionner le bloc texte complet **La galerie** entre les deux photos dans `#galerie`.

## Layout

| Viewport | Structure |
|---|---|
| Desktop | **façade \| texte \| salle** — grille 3 colonnes (`1.4525fr` · `240px` · `1.9321fr`), `align-items: center`, photos même hauteur, `object-fit: contain` (pas de crop) |
| Mobile (≤980px) | pile **façade → texte → salle** (ordre source) |

HTML : deux `<figure class="about-photo">` + `.about-copy` en enfants directs de `.about` (plus de `.about-photos` + spacer couple).

Cache-bust déployé : `?v=20261103-galmid`.

## Où

- Source : `/tmp/galerie-vittet-atelier-cf/` (+ `functions/`)
- Sync : `scripts/sync-trees.sh` → `/tmp/galerie-vittet-pages/` + `/tmp/galerie-vittet-site/`

## Deploy (package cohérent + `functions/`)

| Cible | Id / URL |
|---|---|
| Hash (ce changement) | `d034173f` · https://d034173f.galerie-vittet-preview.pages.dev/ |
| Section | https://d034173f.galerie-vittet-preview.pages.dev/#galerie |
| Prod alias | https://galerie-vittet-preview.pages.dev/#galerie |

## Vérif

- Desktop @1440 : colonnes façade / copy / salle · hauteurs photos 314.4 px · aspects naturels
- Mobile @390 : façade → copy → salle
- `GET /api/oeuvres` → 200 · 100 œuvres (functions OK)
- Screenshots : `galmid-desktop.png`, `galmid-mobile.png` (+ viewport)
