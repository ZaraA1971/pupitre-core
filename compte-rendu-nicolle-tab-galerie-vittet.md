# Compte-rendu — onglet Victor-Jean NICOLLE, retrait Aquarelles

Date : 3 novembre 2026.

## Onglets collection publics

| Avant | Après |
|---|---|
| Peintures · Miniatures · Aquarelles | Peintures · Miniatures · **Victor-Jean NICOLLE** |

## Règle de filtre NICOLLE

- Filtre sur le champ `artist` (pas le tag catégorie).
- Fold case / accents ; match si l’artiste contient **nicolle** et **victor**.
- Couvre `Victor-Jean NICOLLE`, `Victor Jean NICOLLE`, dates / ponctuation variées.
- Exclut homonymes (`Nicolas TAUNAY`, `Louis Nicolas BLARENBERGHE`).
- Peintures / Miniatures : tags catégorie inchangés.
- `PAGE_SIZE` 15, recherche, loupe conservés.

## Compteurs vérifiés

- Peintures **51** · Miniatures **14** · Victor-Jean NICOLLE **35**
- Pas d’onglet / DOM `#tab-aquarelle`
- API `sections: ["peinture","miniature","nicolle"]`, `pageSize: 15`

## Deploy (package cohérent + `functions/`)

Source `/tmp/galerie-vittet-atelier-cf/` → sync `galerie-vittet-pages` + `galerie-vittet-site` :

| Cible | Id / URL |
|---|---|
| Prod | `2dee1a03` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://2dee1a03.galerie-vittet-preview.pages.dev/ |
| Atelier | `01ca715f` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

Cache-bust : `?v=20261103-nicolle`

## Artefacts

- `nicolle-tab-active.png` / `nicolle-tab-grid.png` — onglet NICOLLE actif, 1–15 sur 35
- `nicolle-tabs-peinture.png` / `nicolle-no-aquarelle-peinture.png` — pas d’Aquarelles
- `nicolle-verify.json`
