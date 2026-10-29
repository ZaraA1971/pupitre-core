# Rapport matching Artlogic → D1 (atelier-kv-preview)

**Date :** 2026-10-29  
**Cible :** `https://atelier-kv-preview.galerie-vittet-preview.pages.dev/` (Basic auth)  
**Source :** `artlogicwebsite1111.artworks.all_33fd.csv`  
**Script :** `scripts/apply-artlogic-metadata.py` (amélioré : `main_image` URL, garde-fou seeds, rivaux filename)

---

## 1. Export CSV

| | |
|---|---|
| Délimiteur | `;` |
| Lignes données | **230** |
| Colonnes | 59 |

### Colonnes utilisées pour le matching / PATCH

| Rôle | Colonne CSV |
|---|---|
| Filename (match principal) | `main_image` (stem extrait de l’URL Artlogic) |
| Stock | `stock_number` (**vide** sur les 230 lignes) |
| Artiste | `artist` |
| Titre | `title` |
| Note (medium · dimensions · year · description) | `medium`, `dimensions`, `year`, `description` |

`stock_number` vide → matching quasi exclusivement via **filename stem** (et quelques **slug** titre).

### Échantillon

- Augustin QUESNEL — *Portrait d'Anne d'Autriche* — `anne-d-autriche-.jpg`
- David TENIERS le Jeune — *L'Alchimiste* — `alchimiste-david-teniers.jpg`
- 221/230 ont une `main_image` ; 228/230 un `artist`.

---

## 2. D1 atelier preview

| | Avant | Après |
|---|---|---|
| Œuvres totales | 343 | 343 |
| Artiste vide | 331 | **263** |
| Seeds exposées (`exposed=1`) | 12 | **12** (inchangées) |

Images KV : **non touchées** (PATCH légendes seulement).

---

## 3. Matching (seuil ≥ 0.85)

| Statut | N |
|---|---|
| Matchs clairs | **68** |
| dont appliqués (artiste vide) | **68** |
| Ambiguïtés / conflits | **29** |
| Non-matchés (lignes CSV) | **133** |
| Erreurs PATCH | **0** |

Raisons des 68 clairs : **filename 62**, **slug 6**.

### Améliorations script

1. Alias `main_image` + extraction stem depuis URL.
2. Ne pas mapper `id` Artlogic numérique comme stock.
3. Garde-fou : jamais PATCH une seed `exposed`.
4. Match filename ≥0,95 : ignorer rivaux nettement plus faibles (ex. slug seed).

---

## 4. Appliqués (exemples)

- `ajout-anne-d-autriche` → Augustin QUESNEL — *Portrait d'Anne d'Autriche* — note `Huile sur panneau de chêne · 18 x 13 cm`
- `ajout-alchimiste-david-teniers` → David TENIERS le Jeune — *L'Alchimiste…*
- `ajout-vanite-adriaen-van-nieulandt` → Adriaen VAN NIEULANDT — *Nature morte à la Vanité*
- `ajout-grazziani-1` → Francesco GRAZIANI — *Choc de cavalerie d'une paire*

---

## 5. Non-matchés (exemples)

Fichiers Artlogic absents (ou nommés autrement) côté D1 `ajout-*` :

- `peinture-etrange-1.jpg` — *Bij het volk is de nering…*
- `eglise-de-neeffs-1-site.jpg` — *Intérieur d'église animé*
- `marine-1.jpg` — *Scène de port avec pêcheurs*
- `van-orley-1.jpg` / `van-orley-2.jpg`
- `bon-pasteur-1.jpg`, `golgotha-cawlery-.jpg`
- `francois-de-nom-paysage-imaginaire-.jpg`

→ Typiquement œuvres Artlogic non encore uploadées en ajouts rapides, ou stems divergents.

---

## 6. Conflits / ambiguïtés (29)

| Raison | N | Commentaire |
|---|---|---|
| `duplicate-work-target` | 17 | Plusieurs lignes CSV pointent vers une œuvre D1 déjà prise par un match clair |
| `filename` (égalité) | 6 | Ex. `…bataille-des-ma` vs `…-ma-2` (troncature slug) ; `christ-minia-biface-{1,2}` |
| `skip-exposed-seed` | 4 | Ciblait `exposee-nature-morte` — **bloqué** |
| `slug` faible | 2 | *Portrait d'homme* → plusieurs candidats |

Seeds exposées : **aucune modification** (vérifié champ à champ artist/title/note/image).

---

## 7. Hors périmètre (respecté)

- Pas d’écriture Scaleway / DNS / prod pages.dev principale
- Pas de modification images KV
- Uniquement atelier-kv-preview

## Artefacts

- `matching-report-dryrun.json` / `matching-report-apply.json`
- `apply.log`, `dryrun3.log`
- `apply-artlogic-metadata.py` (copie script amélioré)
