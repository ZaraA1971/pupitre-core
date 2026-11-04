# Compte rendu — bascule refresh RSS Node (retrait dash-cron PHP)

Date : 25 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-bascule-refresh-node.md`.  
Branche : `cursor/plan-migration-php-nodejs-daf6`.  
Hôte : `rag-server-EL`.

## Décision exécutée

1. **Timer Node en parallèle** (`/etc/cron.d/dash-node-refresh` à :15/:45) pendant que PHP tournait encore.  
2. **Run manuel prod** Node réussi sur `admin_dash`.  
3. **Bascule** : cron PHP désactivé ; Node seul `*/30`.

## Attestation

- Worker : `/srv/ops/dash-node-refresh` (code depuis `dash-migration/node-admin-rss`).  
- Env : `/etc/electronlibre/dash-node-refresh.env` (gates `DASH_PROD_REFRESH` + confirm ; credentials dérivés de `admin-dash-readonly.env`, non commités).  
- PHP cron : renommé `/etc/cron.d/dash-cron.disabled-20261025-123846` (fichier source `cron.php` **non modifié**).  
- Node cron actif : `/etc/cron.d/dash-node-refresh` → `deploy/run-cron.sh` en `www-data`.  
- Rollback documenté dans `/srv/ops/dash-node-refresh/CUTOVER.txt`.

## Run Node prod (manuel, avant bascule solo)

| Métrique | Valeur |
| --- | --- |
| Horodatage fin | **25 oct. 2026 13:38:07** Europe/Paris |
| Durée | ~933 s (~15,5 min) |
| `feedsOk` / `feedsFailed` | 124 / 23 |
| `itemsSeen` | 4666 |
| `inserted` / `revisited` | 2398 / 1921 |
| `skippedPromo` | 347 |
| `trashedLowKw` | 1625 |
| `deletedOlder` / `deletedStaleBin` | 1919 / 200 |
| `vigieEvents` | 253 |
| `refresh_rss.status` après | `0` (libre) |
| Hash Guardian Grenada | toujours présent |

Échecs flux typiques : HTTP 403/404 (déjà cassés côté sources), quelques `feed://` (normalisés ensuite).

## Fichiers dépôt

| Fichier | Rôle |
| --- | --- |
| `scripts/refresh-prod.mjs` | Worker prod |
| `deploy/run-cron.sh` | Wrapper cron + flock |
| `deploy/dash-node-refresh.cron.parallel` / `.solo` | Crontabs |
| `src/config.mjs` | Gates `DASH_PROD_REFRESH` |
| `src/http-feed.mjs` | Fetch + `feed://` → http |
| `src/rss-refresh-engine.mjs` | Tolérance erreur par flux |
| `src/vigie-ingress.mjs` | Push localhost :8790 |

## Suite / risques

- Durée Node (~15 min) > PHP (~3 min) : fetch séquentiel ; OK pour `*/30` mais à surveiller (`flock` évite le chevauchement).  
- Inbox Astro consomme la même `admin_dash` — vérifier listes après prochain tick.  
- Retrait du **code** PHP `cron.php` / moteur : non fait (seulement le cron système).  
- Rollback : `mv /etc/cron.d/dash-cron.disabled-* /etc/cron.d/dash-cron && rm /etc/cron.d/dash-node-refresh`.
