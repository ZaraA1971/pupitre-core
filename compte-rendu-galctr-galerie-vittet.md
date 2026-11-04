# Compte-rendu — centrage du contenu `#galerie`

Date : 4 novembre 2026.

## Approche

Avec l’ornement entre `#collection` et `#galerie`, le triptyque **façade | texte | salle** est recentré comme un seul bloc.

| Avant | Après |
|---|---|
| Grille full-bleed `1.45fr · 240px · 1.93fr` + photos 80 % collées au texte | Colonnes `auto · 240px · auto` + `justify-content: center` |
| Marges latérales asymétriques (colonnes fr inégales) | Composition content-sized, marges égales |
| Photos via `width: 80%` | Hauteur égale `--gal-photo-h` (`clamp(200px, 17.5vw, 252px)`), `width: auto`, `object-fit: contain` |

Proportions naturelles conservées, texte entre les photos, pas de crop. Mobile ≤980 : pile centrée (`justify-items: center`).

Cache-bust `?v=20261104-galctr`.

## Où

- Source : `/tmp/galerie-vittet-atelier-cf/` (+ `functions/`)
- Sync : `scripts/sync-trees.sh` → pages + site
- Durable : `/workspace/galerie-vittet/`

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `f33466a5` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://f33466a5.galerie-vittet-preview.pages.dev/#galerie |
| Preview | `70c5711c` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `674397e7` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- Desktop @1440 : offset **0 px** · marges 142 / 142 · façade 366×252 · salle 487×252 · uncropped
- `GET /api/oeuvres` → 200 · 99 œuvres (functions OK)
- Screenshots : `galctr-desktop.png`, `galctr-desktop-viewport.png`, `galctr-mobile.png`
