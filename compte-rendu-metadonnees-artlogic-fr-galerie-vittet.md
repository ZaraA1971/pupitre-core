# Compte-rendu — métadonnées Artlogic en français (atelier + D1)

Date : 29 octobre 2026.

## URLs

| Surface | URL |
|---|---|
| Atelier preview (Basic Auth) | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Front public preview | https://galerie-vittet-preview.pages.dev/ |
| Auth | `vittet` / (mot de passe atelier inchangé) |

Scaleway / DNS / secrets / production hors preview : **non touchés**.

## Mapping CSV Artlogic → champs FR

Séparateur `;`. Colonnes vérifiées sur `artlogicwebsite1111.artworks.all_33fd.csv` (230 lignes).

| Label FR (UI / métier) | Clé API / D1 | Colonne CSV Artlogic | Rempli (échantillon) |
|---|---|---|---|
| artiste | `artist` | `artist` | 228 |
| titre | `title` | `title` | 229 |
| note | `note` | `description` (puis `description2`) | 1 / 6 — souvent vide |
| signé et date | `signed_dated` | `signed_and_dated` | 130 |
| support | `support` | `medium` | 224 |
| dimensions | `dimensions` | `dimensions` | 223 |
| éditions | `editions` | `edition_details` | 4 |

Avant : `note` était un composite `medium · dimensions · year · description`.  
Maintenant : champs **séparés** ; `note` = description seule.

## Coches (tags)

Remplacent portraits / paysages / etc.

| Coche | Valeur stockée |
|---|---|
| peinture | `peinture` |
| miniature | `miniature` |
| aquarelle | `aquarelle` |

UI : légende **à cocher** (ajout classique + édition bibliothèque).  
Filtres catalogue et onglets front public inchangés sur ces 3 valeurs.

## Schéma D1

Colonnes ajoutées sur `oeuvres` :

- `signed_dated TEXT NOT NULL DEFAULT ''`
- `support TEXT NOT NULL DEFAULT ''`
- `dimensions TEXT NOT NULL DEFAULT ''`
- `editions TEXT NOT NULL DEFAULT ''`

Migration remote + `ensureSchema()` lazy dans les Functions.

## Re-sync matchs

Script : `scripts/apply-artlogic-metadata.py --refresh --apply`

| | |
|---|---|
| Matchs clairs | **67** (seuil ≥ 0,85) |
| PATCH OK | **67** / 0 erreur |
| Seeds exposées | non touchées |
| Images KV | non touchées |

Exemple : `ajout-anne-d-autriche` → artiste Augustin QUESNEL, support *Huile sur panneau de chêne*, dimensions *18 x 13 cm*, signé et date *Monogrammé*, coche *peinture*.

## Déploiements

| Cible | Déploiement |
|---|---|
| Branche `atelier-kv-preview` | `87341ae3` → alias atelier-kv-preview.… |
| Front production Pages preview | `60d0d621` → https://galerie-vittet-preview.pages.dev/ |

Front : légendes grille/lightbox = `support · dimensions · note` (caption).

## Preuves

- `/opt/cursor/artifacts/atelier-meta-classic-defaults.png`
- `/opt/cursor/artifacts/atelier-meta-upload-fields-filled.png`
- `/opt/cursor/artifacts/atelier-meta-library-editor.png`
- `/opt/cursor/artifacts/atelier-meta-fields-fr-walkthrough.mp4`
- `/opt/cursor/artifacts/artlogic-ready/matching-report-refresh-apply.json`
