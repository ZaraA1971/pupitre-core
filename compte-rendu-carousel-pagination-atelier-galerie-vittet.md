# Compte-rendu — carousel atelier + pagination 25

Date : 29 octobre 2026.

## URLs

| Surface | URL |
|---|---|
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Front public preview | https://galerie-vittet-preview.pages.dev/ |
| API publique | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/api/oeuvres |
| Auth | `vittet` / (mot de passe atelier inchangé) |

Scaleway / DNS / secrets / prod hors preview : **non touchés**.

## 1. Coche « Carousel »

- Champ D1 `carousel INTEGER NOT NULL DEFAULT 0` (comme `exposed`).
- GET atelier `/atelier/api/oeuvres` et PATCH `/atelier/api/oeuvres/:id` exposent `carousel` (bool).
- POST ajout classique accepte `carousel=1` ; import rapide : toujours `false`.
- UI édition : coche **Carousel** à côté de **Exposée**.
- Formulaire ajout : option « Inclure dans le carousel hero ».
- Public : une œuvre apparaît au hero si `exposed=1` **et** `carousel=1`.

## 2. Pagination atelier

- **25 fichiers / page** après filtres + tri existants.
- Contrôles **Précédent / Suivant** + indicateur `n / N`.
- Compteur : `page 1/14 (1–25)` sur 343 œuvres.
- « Tout sélectionner (filtrées) » porte sur **toutes** les œuvres filtrées (pas seulement la page).

## 3. Front — slides dynamiques

- `GET /api/oeuvres` renvoie `carousel: bool` sur chaque œuvre exposée + tableau `carousel[]`.
- Ordre stable : `sort_order ASC`, puis `id` (même ordre que `listWorks`).
- `main.js` remplace le hero par les œuvres `carousel=1` ; si 0 coche → fallback des 4 slides HTML historiques.
- Front Pages sans Functions : `data/oeuvres.json` inclut aussi les flags `carousel`.

Seed initial (si aucune coche) :  
`exposee-cathedrale-neef`, `exposee-fils-prodigue`, `exposee-descente-croix`, `exposee-tour-babel`.

## Déploiements

| Cible | Déploiement |
|---|---|
| Branche `atelier-kv-preview` | `15a9b5ea` → https://atelier-kv-preview.galerie-vittet-preview.pages.dev |
| Front production Pages preview | `978fd987` → https://galerie-vittet-preview.pages.dev/ |

## Preuves

- `/opt/cursor/artifacts/atelier-carousel-coche.png`
- `/opt/cursor/artifacts/atelier-pagination-25.png`
- `/opt/cursor/artifacts/front-carousel-hero.png`
- `/opt/cursor/artifacts/carousel-pagination-verify.json`
