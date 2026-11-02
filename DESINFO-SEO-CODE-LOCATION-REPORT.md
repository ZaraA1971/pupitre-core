# Rapport — localisation du code source Desinfo

Date : 2 novembre 2026 (Europe/Paris).  
Dépôt inspecté (seul autorisé) : `https://github.com/ZaraA1971/pupitre-core`  
Branche de nettoyage : `cursor/desinfo-seo-indexation-daf6`

## Verdict

**Le code source réel de `https://desinfo.electronlibre.info/` n’est pas présent dans ce dépôt.**

`pupitre-core` est le paquet Node portable `@electronlibre/pupitre-core` (registry plugins / CRUD éditorial). Il ne contient pas l’application Next.js de l’Observatoire de la désinformation, ni ses routes publiques, ni ses données de classement.

## Nettoyage effectué (cette mission)

Le run précédent avait ajouté par erreur une application d’exemple sous `desinfo/` et le fichier `DESINFO-SEO-INDEXATION-REPORT.md`, plus des lignes `desinfo/…` dans `.gitignore` (commit `4927672`).

Actions :

1. Inspection de `git status` / `git diff` / contenu du commit erroné.
2. Retour de la branche au commit parent `51c7270` (`main`) via `git reset --hard 51c7270`.
3. Suppression du répertoire local `desinfo/` (y compris `.next` / `node_modules` non versionnés) et de `DESINFO-SEO-INDEXATION-REPORT.md`.
4. Vérification : arbre identique à `main` (`51c7270`) avant l’ajout du présent rapport.
5. Aucune modification de `main`, de `cursor/plan-migration-php-nodejs-daf6`, ni d’autres branches.
6. Aucun déploiement, aucune config serveur.

Fichiers retirés (ceux introduits par `4927672`) :

- `desinfo/**` (app Next d’exemple)
- `DESINFO-SEO-INDEXATION-REPORT.md`
- entrées `.gitignore` : `desinfo/.next/`, `desinfo/node_modules/`, `desinfo/out/`

## Indices pour identifier le bon dépôt / workspace

Sources **internes à `pupitre-core` uniquement** (autres branches / historique git local), sans ouvrir un autre dépôt ni accéder à un service externe :

| Indice | Détail |
|--------|--------|
| Nom de dépôt GitHub listé | Sur la branche `cursor/plan-migration-php-nodejs-daf6`, `rapport-acces-sources.md` indique un dépôt public du même propriétaire : **`ZaraA1971/Desinfo`**, explicitement « listable, pas extrait localement ». |
| Même document | Liste aussi `ZaraA1971/EL_ASTRO_CMS` (CMS Electron Libre) — distinct de Desinfo. |
| `dash-migration/statut-lot-webservice.md` | Mentionne les dépôts GitHub listés : `pupitre-core`, `EL_ASTRO_CMS`, **`Desinfo`**. |
| Contenu de `main` | Arbre limité à `src/`, `examples/`, packaging npm — aucun `app/`, `pages/`, `next.config.*`, ni chaîne produit « Observatoire ». |
| README de `main` | Décrit le cœur Pupitre ; le front / hôte ElectronLibre (et donc Desinfo) sont des **non-objectifs** hors paquet. |
| Diagnostic mission (fourni) | Site live Next.js avec `BAILOUT_TO_CLIENT_SIDE_RENDERING`, `h1` « Observatoire de la désinformation », domaine `desinfo.electronlibre.info` — signatures d’une app front dédiée, absente de ce clone. |
| Workspace agent | Une seule copie git applicative : `/workspace` → `pupitre-core`. Pas de second checkout Desinfo sous ce workspace. |

## Ce qu’il ne faut pas faire dans `pupitre-core`

- Ne pas y recréer une app Next « Desinfo » d’exemple pour contourner l’absence de sources.
- Ne pas fusionner un correctif SEO Desinfo ici en espérant qu’il déploie `desinfo.electronlibre.info`.

## Suite attendue (hors périmètre de ce run)

Rouvrir la mission SEO **dans le workspace / dépôt qui contient réellement** l’app Desinfo (indice principal dans ce dépôt : **`ZaraA1971/Desinfo`**), puis y corriger SSR/SSG, canonique, `robots.txt` et `sitemap.xml` sur le code de production.
