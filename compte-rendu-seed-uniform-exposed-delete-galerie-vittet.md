# Compte-rendu — seeds = mêmes logiques (Supprimer + Exposée)

Date : 30 octobre 2026.

## URLs

| Rôle | URL |
|---|---|
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Front preview | https://galerie-vittet-preview.pages.dev/ |
| API publique | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/api/oeuvres |
| Auth | `vittet` / (inchangé) |

## Ce qui bloquait

1. **Supprimer** réservé aux `ajout-*` (UI + `DELETE` API → 400 « seed protégée » ; `deleteWork` refusait aussi les `exposee-*`).
2. **Front production** : `/api/oeuvres` absent (HTML) → fallback `data/oeuvres.json` (12 seeds hardcodées) → décocher Exposée en D1 ne changeait rien à l’affichage public.
3. **Reseed** : `seedExposedWorks` réinjectait une seed absente au prochain `ensureLibrary` (DELETE seed inutile).

## Correctifs

| Zone | Changement |
|---|---|
| `DELETE /atelier/api/oeuvres/:id` | Autorise tout `LIBRARY_ID_RE` (`ajout-*` et `exposee-*`) ; D1 puis KV |
| `deleteWork` | Même règle `LIBRARY_ID_RE` |
| `seedExposedWorks` | Bootstrap **seulement** si table vide (plus de réinjection) |
| `atelier.js` | Bouton **Supprimer** sur toutes les fiches ; badges Exposée / Non exposée ; kind `D1 · assets site` / `D1 · KV` |
| `main.js` (front) | Sources live `/api/oeuvres` puis URL atelier ; **plus** de `data/oeuvres.json` ; hero vide si 0 carousel (pas de slides HTML seed) |

## Déploiements

| Cible | Déploiement |
|---|---|
| Branche `atelier-kv-preview` | `97383d1f` → alias atelier-kv-preview.… |
| Production front (`main`) | `68122d25` → https://galerie-vittet-preview.pages.dev/ |
| Scaleway / DNS / prod hors preview | **Non touchés** |

## Preuves

- Seed `exposee-fils-prodigue` : badge Exposée + bouton **Supprimer** visible.
- `DELETE` seed `exposee-tour-babel` → `{"ok":true}` (puis restaurée en D1, `exposed=0`).
- Décoche Exposée (`exposee-raisins` / `exposee-nature-morte`) → absente de `/api/oeuvres` et de la grille front (compteurs 08/01/01 = 10).
- Recoche → revient (11 exposées ; babel reste hors ligne).

Artifacts : `atelier-seed-delete-btn.png`, `atelier-seed-delete-btn-card.png`, `front-collection-unexpose.png`, `seed-uniform-ui.json`, `seed-uniform-api-verify.json`.
