# Compte rendu — validation inbox MySQL jetable (Node)

Date : 24 octobre 2026 (Europe/Paris).  
Chemin exact de ce document : `dash-migration/compte-rendu-mysql-inbox-jetable.md`.  
Lot validé : `dash-migration/node-admin-rss/`.

Espace isolé uniquement. PHP installé, vhost et services serveur **non modifiés**. Aucun déploiement. Aucune donnée, secret ou service de production. Externes coupés (`DASH_DISABLE_EXTERNAL=1`). Endpoints HTTP `webservice/*.php` **laissés en PHP**.

## Base jetable utilisée

| Paramètre | Valeur (locale uniquement) |
| --- | --- |
| Moteur | MariaDB bind `127.0.0.1:3306` (démarrage manuel `mysqld`, hors systemd) |
| Base | `dash_disposable` |
| Utilisateur | `dash_local` (mot de passe uniquement hors dépôt : `/tmp/dash-mysql-disposable.env`) |
| Schéma | init autorisé via `DASH_DB_ALLOW_SCHEMA_INIT=1` |
| Seed | `fixtures/seed.json` → `npm run seed:mysql` / `src/seed-disposable-mysql.mjs` |

Sans cette base isolée, la suite MySQL est **skipped** (`DASH_DB_MODE` ≠ `mysql`) et le parcours n’est pas considéré validé contre SQL.

## Corrections dans l’espace de migration

1. **Idempotence des tests MySQL** — un run précédent (`delete_all`) vidait `rss_post` ; le suite échouait au run suivant.  
   Correction : re-seed automatique dans `before` de `test/mysql-inbox-journey.test.mjs` via `seedDisposableMysql`, conditionné à `DASH_DB_ALLOW_SCHEMA_INIT=1`.
2. **Module seed partagé** — `src/seed-disposable-mysql.mjs` + script `scripts/seed-mysql.mjs` (évite la duplication wipe/insert).
3. **Scripts npm** — `seed:mysql`, `test:mysql`, `start:mysql` dans `package.json`.

Aucun écart fonctionnel de l’adaptateur `mysql-db.mjs` constaté sur le parcours exercé (list / filter / send / alert / delete / delete_all / to_desk 503).  
Tokens push multi-bases `dash_*` restent stubbés (vide) en mode MySQL — comportement attendu sur banc jetable.

## Vérifications exécutées

### Suite automatisée

```bash
set -a && . /tmp/dash-mysql-disposable.env && set +a
cd dash-migration/node-admin-rss && npm test
```

Résultat : **33 tests, 33 passés**, 0 échec (dont 6 parcours MySQL).  
Journal : `/opt/cursor/artifacts/dash-admin-mysql-inbox-tests.log`.

Sans env MySQL : suite `MySQL disposable inbox journey` → **SKIP** (comportement voulu).

### Smoke HTTP local (MySQL)

```bash
npm run seed:mysql
DASH_DB_MODE=mysql DASH_DISABLE_EXTERNAL=1 DASH_ADMIN_PORT=8792 npm start
```

| Étape | Résultat |
| --- | --- |
| `GET /health` | `mode=mysql`, `disableExternal=true` |
| `GET /api/inbox` | compteurs éditoriaux `new=4` / `sent=1` (hors Vigie / promo seed) |
| `POST /actions` send id=1 thème 5 | `actions:["send"]`, `sendPushUsed=false`, `new=3` / `sent=2` |
| `POST /actions` to_desk | **503** `disabled:true`, `missing` OpenAI/Desk |

Journal serveur : `/opt/cursor/artifacts/dash-admin-mysql-server.log`.

## Limites inchangées

- `to_desk` / Desk / OpenAI non branchés sur ce banc.
- Mail / Firebase d’alerte journalisés uniquement (pas d’envoi réseau).
- Pas de cross-DB tokens en MySQL jetable.
- Hôtes prod refusés par `loadConfig` sans `DASH_DB_ALLOW_REMOTE=1` (non utilisé ici).
- Credentials uniquement dans `/tmp/dash-mysql-disposable.env` (hors git).

## Ordre de migration proposé — cron RSS puis pages client

Les endpoints HTTP `webservice/*.php` restent en PHP tant que leurs usages externes ne sont pas identifiés (voir `dash-migration/statut-lot-webservice.md` et `dash-migration/INVENTORY-webservice.md`).

Ordre recommandé dans `dash-migration/` uniquement, toujours avec externes désactivables et sans toucher au vhost prod :

1. **Cron / refresh RSS admin** (alimente l’inbox déjà validée)  
   Cibles PHP : `admin/cron.php`, `admin/refresh_rss.php`, `admin/rss_refresh_engine.php`, `admin/check_rss.php`, `admin/verif_rss.php` (+ lock, filtres, éventuel `vigie_ingress` en lecture seule d’abord).  
   Livrable Node isolé : ingestion feeds → écriture `rss_url` / `rss_post` / mots-clés sur **base jetable**, tests de non-régression inbox après refresh.  
   Ne pas activer de push Vigie réel sur le banc.

2. **Pont Desk admin** (optionnel mais proche du flux éditorial)  
   `admin/send_to_desk.php` / `inc/desk.php` derrière secrets préprod + `DASH_DISABLE_EXTERNAL` levable seulement hors banc actuel.

3. **Pages `client/` — cœur lecture**  
   Session (`login` / `connect` / `disconnect`), flux (`index.php`, `get_articles.php`, `timeline.php`) en lecture sur le même schéma `rss_post` que l’admin.  
   Priorité trafic : live + archives avant modules secondaires.

4. **Pages `client/` — écriture / notifications**  
   Messages (`messages.php` et loaders) : extraire `sendPush` comme module Node **interne** consommé par ce chemin prouvé, sans basculer le vhost `/webservice`.  
   Puis notifications UI, config / favoris / mail.

5. **Config éditoriale admin restante**  
   `config_theme`, `config_keyword`, `config_author`, vues `sent` / `deleted` / storify — après stabilité inbox + cron.

6. **Rouvrir le lot HTTP `webservice/*.php` seulement si**  
   hits nginx `/webservice/<script>` ou client externe identifié. Jusque-là : PHP inchangé ; parité `node-webservice/` reste banc local.

### Ce qu’il ne faut pas faire ensuite

- Déployer ou modifier le PHP / vhost / cron système de production depuis cet agent.
- Pointer `DASH_DB_*` vers un hôte ou une base de production.
- Remplacer les endpoints HTTP `webservice/*.php` « par précaution » sans preuve d’usage.

## Fichiers touchés (cette passe)

- `dash-migration/node-admin-rss/src/seed-disposable-mysql.mjs`
- `dash-migration/node-admin-rss/scripts/seed-mysql.mjs`
- `dash-migration/node-admin-rss/test/mysql-inbox-journey.test.mjs`
- `dash-migration/node-admin-rss/package.json` (`seed:mysql`, `test:mysql`, `start:mysql`)
- `dash-migration/compte-rendu-mysql-inbox-jetable.md` — ce document
