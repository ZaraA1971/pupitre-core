# Compte rendu — lot client lecture (référence + Node fixtures)

Date : 25 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-client-lecture.md`.  
Branche : `cursor/plan-migration-php-nodejs-daf6`.

## Attestation d’isolement

- Copie SSH **lecture seule** des sources PHP depuis `rag-server-EL:/var/www/dash.electronlibre.info` → staging `/tmp` distant → `dash-migration/reference/client/` ; staging distant effacé ; clé temporaire effacée.
- Aucune requête SQL / connexion à ElectronLibre ou `admin_dash` prod.
- Aucun déploiement, vhost, cron, secret prod, push, Desk, OpenAI.
- Banc Node : `DASH_DISABLE_EXTERNAL=1`, `DASH_DB_MODE=fixtures` uniquement.
- Endpoints HTTP `webservice/*.php` **non touchés**.

## Référence PHP sanitizée

Chemin : `dash-migration/reference/client/` (25 fichiers + `SANITIZE_META.json`).

Session / accès : `login.php`, `connect.php`, `disconnect.php`, `connect_admin.php`, `inc/bootstrap.php`, `shared/{Session,Auth,Password,bootstrap}.php`.  
Flux : `index.php`, `get_articles.php`, `timeline.php` + includes / partials / `shared/dash/*`.  
Scan local : aucun secret littéral restant ; hashes original == sanitizé (pas de littéral à redacter).

## Livrable Node

Package `dash-migration/node-client/` :

| Surface | Route Node | Parité |
| --- | --- | --- |
| Santé | `GET /health` | mode + auth flag |
| Login / logout | `GET|POST /login`, `GET /disconnect` | règles login.php + session cookie HttpOnly |
| Flux live | `GET /`, `GET /api/feed` | chrono new/old par `config` thèmes + `last_connexion` |
| Panneau jour | `POST /get_articles` | HTML `graph-day-panel` (keyword_id + date) |
| Timeline | `GET /timeline`, `GET /results.json` | shell + JSON iso8601 (sans CDN obligatoire) |

Mots de passe fixtures : md5 (chemin legacy `QualifPassword`) ; bcrypt non vérifié sur ce banc.

## Limites (hors lot)

| Point | Statut |
| --- | --- |
| Pixel-perfect `index.php` (98 ko) | Non — UI locale fonctionnelle |
| Favoris / commentaires / archives / mail | Non |
| MySQL jetable client | Non (lot suivant possible) |
| Messages + `sendPush` | Non (écriture ultérieure) |
| Déploiement | Interdit |

## Tests exécutés

```bash
cd dash-migration/node-client && DASH_DISABLE_EXTERNAL=1 npm test
```

Résultat : **11 tests, 11 passés**.  
Journal : `/opt/cursor/artifacts/dash-client-read-fixtures.log`.

## Suite recommandée

1. Ne pas déployer ; ne pas pointer de base réelle.
2. Option : adaptateur MySQL jetable client (loopback + schéma disposable) partageant `rss_post` avec `node-admin-rss`.
3. Puis messages client + module `sendPush` interne (sans bascule vhost `/webservice`).
