# Compte-rendu — croix recherche : sortir de `#recherche`

Date : 3 novembre 2026.

## Bug

Vider le champ via la croix (X), un submit vide ou la saisie vide laissait `#recherche` / `view-recherche` actif avec le message « Saisissez un titre… » (page sans résultats) au lieu du site normal.

## Correctif (`main.js`)

- `searchHashFor("")` → `#collection` (plus `#recherche`)
- `leaveSearchView()` : clear query/input/grille, retire `view-recherche`, masque `#recherche`
- `applySearchRoute` : recherche active **seulement** si `q` non vide ; `#recherche` nu → sortie vers `#collection`
- Chemins couverts : événement `search` (X), `input` live vide, submit vide
- Cache-bust `?v=20261103-srchx`

## Deploy (package cohérent + `functions/`)

Source `/tmp/galerie-vittet-atelier-cf/` → sync `galerie-vittet-pages` (avec Functions) :

| Cible | Id / URL |
|---|---|
| Prod | `5cf2548f` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://5cf2548f.galerie-vittet-preview.pages.dev/ |
| Atelier | `2aa093ab` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- Recherche `bruegel` → 2 œuvres, `view-recherche`
- Clic X → hash `#collection`, plus `view-recherche`, input vide, grille collection 15 cartes visible
- `#recherche` nu → redirect `#collection`
- `GET /api/oeuvres` → 200 JSON (functions OK)

Artefacts : `srchx-01-search-results.png`, `srchx-02-after-clear-collection.png`, `srchx-04-after-x-click.png`, `srchx-verify.json`.
