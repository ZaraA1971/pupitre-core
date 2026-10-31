# Compte-rendu — dérivés web (originaux conservés)

## Objectif
Alléger l’affichage public tout en gardant les originaux KV pour l’atelier / téléchargement CMS.

## Schéma
| Rôle | Chemin | Clé KV | Champ D1 |
|------|--------|--------|----------|
| Original | `images/ajouts/{id}.{ext}` | `detail:{id}` | `image` |
| Affichage web | `images/ajouts/web/{id}.{ext}` | `web:{id}` | `web` |
| Vignette | `images/ajouts/preview/{id}.{ext}` | `preview:{id}` | `preview` |

Paramètres web : grand côté max **1800 px**, qualité JPEG ~**82**.

## Upload
Import rapide + ajout classique : original (si ≤12 Mo) + web + preview.  
Endpoint backfill : `POST /atelier/api/oeuvres/:id/web` (Basic Auth + `X-Atelier: 1`).  
Bouton atelier : « Générer versions web manquantes ».  
Script : `scripts/backfill-web-derivatives.py`.

## Front
Grille / hero : `preview` (inchangé).  
Lightbox : `web` (via `image` public remappé).  
Atelier : liens Original / Web ; original toujours en `image`.

## Preuves
Exemple `ajout-porte-peinte-monage` :
- original **11 388 889** octets
- web **690 171** octets (1800×1376)
- preview **218 740** octets

Backfill : **112 / 112** OK — ~388 Mo originaux → ~59 Mo web.

## URLs
- Front : https://galerie-vittet-preview.pages.dev/
- Atelier : https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/
