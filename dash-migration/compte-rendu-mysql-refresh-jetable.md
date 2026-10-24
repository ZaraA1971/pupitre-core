# Compte rendu — adaptateur MySQL jetable pour le refresh RSS

Date : 24 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-mysql-refresh-jetable.md`.  
Lot : `dash-migration/node-admin-rss/`.  
Branche : `cursor/plan-migration-php-nodejs-daf6`.

## Attestation d’isolement

- Aucune connexion à la base ElectronLibre.
- Aucun SSH, secret prod, `.env` système, flux RSS réel, Vigie/Desk/Firebase/SMTP/LLM.
- Aucun cron, vhost, service ou déploiement modifié ; PHP installé inchangé.
- Avant tout pool MySQL : `assertLoopbackDisposableMysql` exige hôte ∈ `{127.0.0.1, localhost, ::1}` et nom de schéma matching `disposable|jetable|_test|test_`.
- Écritures refresh : `assertRefreshMysqlWritesAllowed` exige en plus `DASH_DB_ALLOW_SCHEMA_INIT=1` et `DASH_DISABLE_EXTERNAL=1`.
- Feeds : uniquement `createFixtureFeedLoader` → fichiers sous `fixtures/feeds/`.
- Banc utilisé pour les tests MySQL : MariaDB locale `127.0.0.1`, schéma `dash_disposable` (jetable), credentials hors dépôt (`/tmp/dash-mysql-disposable.env`).

## Fichiers modifiés / ajoutés

| Fichier | Rôle |
| --- | --- |
| `src/config.mjs` | `assertLoopbackDisposableMysql`, `assertRefreshMysqlWritesAllowed` |
| `src/mysql-db.mjs` | DDL jetable étendu + API refresh miroir fake-db ; `dateStrings: true` |
| `src/seed-disposable-mysql.mjs` | Seed url/theme/refresh_rss/alias/keyword_alias |
| `src/rss-lock.mjs` | Parse DATETIME `Date` ou string (horloge banc) |
| `test/mysql-rss-refresh.test.mjs` | Garde-fous sans connexion + parcours MySQL jetable |
| `package.json` | `test:mysql-refresh` ; `--test-concurrency=1` (évite courses sur DB partagée) |
| `dash-migration/compte-rendu-mysql-refresh-jetable.md` | ce document |

Moteur / parseur : **non modifiés** (interfaces injectables préservées).

## Schéma jetable retenu (non prod)

- `rss_url` : `name` PK + `audience` + `url` + `theme` (ALTER si table ancienne)
- `refresh_rss` : `id=1`, `status`, `last_refresh`, `last_update`, `current`
- `keyword.alias_keyword` + tables `alias` / `keyword_alias` (forme join PHP simplifiée)
- Purge âge : cutoff calculé en JS depuis `nowMs` injecté (**écart** vs `DATE_SUB(NOW(),…)` PHP, pour tests déterministes)

## Comportements portés sur MySQL jetable

API alignée fake-db : `listRssUrls`, `loadKeywordData`, `countByHash`, `markAllNewAsBin`, `clearBinByHash`, `insertRssPost`, `attachPostKeyword`, `trashLowKeywordHash`, `deleteOlderThanDays`, `deleteStaleBinUnsent`, `getRefreshRow`, `setRefreshStatus`, `setRefreshCurrent`, `setLastRefresh`, `touchRefreshActivity`.

## Points non portés / limites

| Point | Statut |
| --- | --- |
| Schéma / PK prod exacts | Non — DDL disposable explicite |
| Hash SimplePie | Toujours injectable / fixture guid |
| Overrides `refresh_rss_*.local.php` | Défauts idle=`0` / busy=`1` |
| check_rss / verif_rss | Hors lot |
| Feed HTTP / Vigie réel | Interdits |

## Tests exécutés

### 1) Sans env MySQL (garde-fous + fixtures)

```bash
env -u DASH_DB_MODE … DASH_DISABLE_EXTERNAL=1 npm test
```

Résultat : **43 pass** (suites MySQL skipped).  
Journal : `/opt/cursor/artifacts/dash-mysql-refresh-fixtures.log`.

### 2) Avec MySQL jetable loopback (après preuve des garde-fous)

```bash
# assertRefreshMysqlWritesAllowed → host 127.0.0.1, db dash_disposable, schemaInit, ext off
set -a && . /tmp/dash-mysql-disposable.env && set +a
npm test   # --test-concurrency=1
```

Résultat : **53 tests, 53 passés**, 0 échec (dont 3 garde-fous config + 4 parcours MySQL refresh + 6 inbox MySQL + fixtures).  
Journal : `/opt/cursor/artifacts/dash-mysql-refresh-full.log`.

## Suite recommandée

- Ne pas déployer ; ne pas pointer d’hôte hors loopback.
- Documenter/porter un `hashItem` SimplePie seulement si la lib est sanitizée en référence.
