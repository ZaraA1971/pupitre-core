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
| Prod | _(à remplir)_ · https://galerie-vittet-preview.pages.dev/ |
| Hash | _(à remplir)_ |
| Preview | _(à remplir)_ · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | _(à remplir)_ · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- Desktop @1440 : bloc centré, hauteurs photos égales, aspects naturels
- `GET /api/oeuvres` → 200 JSON (functions OK)
- Screenshots : `galctr-desktop.png`
