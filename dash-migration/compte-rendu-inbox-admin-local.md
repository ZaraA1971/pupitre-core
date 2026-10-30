# Compte rendu — parcours inbox admin local (Node)

Date : 24 octobre 2026 (Europe/Paris).  
Chemin exact du lot : `dash-migration/node-admin-rss/`.  
Espace isolé uniquement. PHP installé sous `/var/www/dash.electronlibre.info` **non modifié**. Aucun déploiement. Endpoints HTTP `webservice/*.php` **conservés en PHP**. Cron RSS et pages `client/` **non migrés**.

## Périmètre achevé

| Capacité | Implémentation |
| --- | --- |
| Affichage inbox éditoriale (hors Vigie / promo) | `src/inbox.mjs` + `src/fake-db.mjs` / `src/mysql-db.mjs` |
| Filtres source, mot-clé, tri date / pertinence / tendance | `parseInboxQuery` + `listInbox` |
| Compteurs new / sent / deleted | `navCounts` exposés HTML + `/api/inbox` |
| Actions `send`, `alert`, `delete`, `delete_all` | `POST /actions` → `handleIndexActions` |
| UI locale | `src/render.mjs` + `src/server.mjs` (`npm start`) |
| Adaptateur MySQL schéma existant | `src/mysql-db.mjs` (mysql2, optionnel) |
| Fixtures jetables | `fixtures/seed.json` (mode défaut `DASH_DB_MODE=fixtures`) |
| Config env + arrêt sûr | `src/config.mjs` (`ConfigError`, exit 2) |
| Externes coupés | `DASH_DISABLE_EXTERNAL=1` obligatoire ; mail/Firebase/Desk enregistrés, non envoyés |

Architecture retenue : **petit serveur HTTP Node ESM** dans le même paquet que le cœur actions/filtres déjà créé, avec factory DB (`fixtures` | `mysql`) — pas de framework, pas de bascule vhost.

## Vérifications

Commande : `cd dash-migration/node-admin-rss && npm test`  
Résultat : **27 tests, 27 passés**, 0 échec.  
Journal : `/opt/cursor/artifacts/dash-admin-inbox-journey-tests.log`.

Serveur local (fixtures) :

```bash
DASH_DB_MODE=fixtures DASH_DISABLE_EXTERNAL=1 DASH_ADMIN_PORT=8791 npm start
```

Contrôles manuels (curl) :

| Étape | Résultat |
| --- | --- |
| `GET /health` | `mode=fixtures`, `disableExternal=true` |
| `GET /` | HTML « Le Dash », 3 articles éditoriaux, compteurs new=3 / sent=1 |
| `GET /api/inbox` | JSON filtres + rows + themes/sources/keywords |
| `POST /actions` send id=1 thème 5 | `actions:["send"]`, compteurs new=2 / sent=2 |
| `POST /actions` to_desk | **503** `disabled:true`, liste `missing` (OpenAI/Desk) |
| `DASH_DB_MODE=mysql` sans host/user/name | Arrêt explicite exit 2, **aucune** connexion |

Journal serveur : `/opt/cursor/artifacts/dash-admin-inbox-server.log`.  
Échec config mysql : `/opt/cursor/artifacts/dash-admin-config-fail.log`.

## Interfaces volontairement désactivées / non fidèles

1. **Envoyer au Pupitre** (`to_desk`) — bouton UI désactivé ; `POST` renvoie 503. Manque : secrets Desk + OpenAI, extraction HTML réelle (`fetch-article.php`), brancher `handleSendToDesk` avec injectables (déjà testé unitairement sans HTTP).
2. **Firebase / mail d’alerte** — tentatives journalisées uniquement ; pas d’appel réseau. Manque : `DASH_FIREBASE_PUSH_AUTH` réel + SMTP (jamais branchés ici).
3. **Tokens push multi-bases `dash_*`** — adaptateur MySQL renvoie `sectionFollowsTheme=false` / tokens vides (pas de cross-DB sans config explicite). En fixtures, les `sectionDbs` simulés permettent de tester le chemin.
4. **Graph mot-clé / lightbox edit_keyword / CSS PHP** — hors lot ; UI locale fonctionnelle, pas clone pixel.
5. **MySQL live** — adaptateur prêt ; non exécuté contre une base réelle dans cet environnement (pas de conteneur MySQL). Utiliser uniquement une base jetable + `DASH_DB_ALLOW_SCHEMA_INIT=1` si besoin.

## Limites

- Pas de connexion à la production ; hôtes connus (IP Scaleway / `electronlibre.info` / `rag-server`) refusés sans `DASH_DB_ALLOW_REMOTE=1`.
- Aucun secret, certificat ni `.env` réel dans le dépôt (`.env.example` seulement).
- `sendPush` APNS toujours absent (include mort PHP confirmé).
- Cron RSS (`rss_refresh_engine`) et pages client hors périmètre.

## Prochaines étapes recommandées

1. Brancher une **MySQL jetable** (Docker local) et rejouer le parcours avec `DASH_DB_MODE=mysql` + seed SQL.
2. Quand les secrets préprod seront prêts : activer Desk/LLM derrière garde-fous (hors banc actuel qui refuse `DASH_DISABLE_EXTERNAL=0`).
3. Migrer ensuite le **cron RSS** admin, puis les pages `client/` — sans toucher aux `webservice/*.php` HTTP tant que l’usage externe reste inconnu.
4. Ne pas déployer ni modifier le vhost tant que la parité inbox + refresh n’est pas validée en préprod.

## Fichiers principaux

- `dash-migration/node-admin-rss/src/{inbox,render,app,server,db,mysql-db,fake-db,config}.mjs`
- `dash-migration/node-admin-rss/fixtures/seed.json`
- `dash-migration/node-admin-rss/test/inbox-journey.test.mjs`
- `dash-migration/compte-rendu-inbox-admin-local.md` — ce document
