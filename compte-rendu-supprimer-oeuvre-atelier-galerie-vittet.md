# Compte-rendu — bouton Supprimer (atelier)

Date : 30 octobre 2026.

## URL

https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/  
Auth : `vittet` / (inchangé)

## Comportement

1. Ouvrir la bibliothèque (liste paginée 25).
2. Sur chaque **ajout** (badge Ajout / KV+D1) : bouton **Supprimer** à côté d’« Enregistrer légendes ».
3. Confirm : « Supprimer définitivement… » (D1 + KV, irréversible).
4. Succès : message « « titre » supprimée. » + rafraîchissement liste / pagination.
5. Les **12 seed exposées** n’ont pas le bouton (DELETE API → 400).

## Technique

| Pièce | Détail |
|---|---|
| API | `DELETE /atelier/api/oeuvres/:id` (Basic Auth + `X-Atelier: 1`) |
| Effet | `DELETE` D1 puis clés KV `detail:` / `preview:` |
| UI | `atelier/atelier.js` → `deleteLibraryWork` |
| Déploiement | `8456351b` → alias `atelier-kv-preview` |
| Prod / Scaleway / DNS | **Non touchés** |

## Preuve

Œuvre jetable `ajout-delete-test-jetable-582f` créée puis supprimée (UI + API).  
Compteur : 343 → 342 ; 12 exposées / 4 carousel inchangés.

Captures : `/opt/cursor/artifacts/atelier-delete-btn-card.png`, `atelier-delete-btn-desktop.png`, `atelier-delete-success-desktop.png`, `atelier-delete-ui.json`.
