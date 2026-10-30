# Compte rendu — MySQL jetable pour node-client lecture

Date : 25 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-mysql-client-jetable.md`.  
Lot : `dash-migration/node-client/`.  
Branche : `cursor/plan-migration-php-nodejs-daf6`.

## Attestation d’isolement

- Aucune connexion ElectronLibre / `admin_dash` / `dash_electron` prod.
- Banc MariaDB local `127.0.0.1`, schéma `dash_disposable` uniquement.
- Avant pool : `assertLoopbackDisposableMysql` (loopback + nom jetable).
- Seed / écritures : `assertClientMysqlWritesAllowed` (`DASH_DB_ALLOW_SCHEMA_INIT=1` + `DASH_DISABLE_EXTERNAL=1`).
- Credentials hors dépôt (`/tmp/dash-mysql-disposable.env`).
- Aucun déploiement, vhost, webservice HTTP.

## Schéma jetable client

| Table | Rôle |
| --- | --- |
| `client_users` | Session login (shape PHP `users` section) — **distincte** de `users` admin |
| `client_config` | Thèmes affichés (équivalent `config.id_theme`) |
| `theme` / `keyword` / `post_keyword` / `rss_post` | Réutilisées (admin jetable) ; seed client les réécrit |

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/config.mjs` | Mode mysql + gardes loopback / schema init |
| `src/mysql-db.mjs` | Adaptateur lecture + DDL `client_*` |
| `src/seed-disposable-mysql.mjs` | Seed fixtures client |
| `src/db.mjs` | Factory fixtures \| mysql |
| `scripts/seed-mysql.mjs` | CLI seed |
| `test/mysql-client-journey.test.mjs` | Gardes sans connexion + parcours HTTP MySQL |
| `package.json` | `test:mysql`, `seed:mysql`, `start:mysql`, optional `mysql2` |

## Tests exécutés

### 1) Sans env MySQL

```bash
env -u DASH_DB_MODE … DASH_DISABLE_EXTERNAL=1 npm test
```

**14 pass** (suite MySQL journey skipped).  
Journal : `/opt/cursor/artifacts/dash-client-mysql-fixtures.log`.

### 2) Avec MySQL jetable

```bash
set -a && . /tmp/dash-mysql-disposable.env && set +a
DASH_DISABLE_EXTERNAL=1 npm test
```

**17 pass** (dont 3 garde-fous + 3 parcours MySQL + fixtures).  
Journal : `/opt/cursor/artifacts/dash-client-mysql-full.log`.

## Suite recommandée

1. Ne pas déployer ; ne pas pointer hors loopback.
2. Lot suivant : messages client + module `sendPush` **interne** (chemin `messages.php`), toujours sans bascule vhost `/webservice`.
