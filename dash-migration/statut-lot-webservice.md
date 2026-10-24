# Statut du lot `webservice/` — usages et suite recommandée

Date : 24 octobre 2026, heure de Paris.  
Lecture seule. Aucun fichier PHP installé modifié, aucun déploiement, aucun redémarrage.  
Espace : `dash-migration/`. SSH vers `rag-server-EL` confirmé. Aucun secret ni paramètre d’URL n’est reproduit.

## Distinction

| Nature | Exemples | Mode d’appel |
| --- | --- | --- |
| Endpoints HTTP | `webservice/connect.php`, `list_*.php`, `new_message.php`, … | Client externe → `GET/POST https://…/webservice/<script>.php` |
| Bibliothèque PHP incluse | `sendPush()` dans `webservice/send__push_.php` | `include` / `require` depuis un autre script PHP du serveur |

Ces deux surfaces ne se migrent pas au même rythme : remplacer les endpoints HTTP n’enlève pas l’`include` de `sendPush` dans `client/` / `admin/`, et inversement.

## Endpoints HTTP `webservice/*.php`

Scripts concernés : `auth`, `connect`, `list_themes`, `list_contacts`, `list_messages`, `history_messages`, `new_message`, `read_contact`, `list_news`, `read_news`, `read_settings`, `save_settings`, `register_push`.

### Références dans le code

| Source consultée | Résultat |
| --- | --- |
| Arbre Dash hors `webservice/` | Aucune URL `/webservice/<script>.php` |
| `/var/www/el-astro` (dont `docs/ios-auth.md`, `server/lib/ios`) | Aucune mention de `webservice` Dash |
| Dépôts GitHub listés (`pupitre-core`, `EL_ASTRO_CMS`, `Desinfo`) | Pas de client mobile Dash / Qualif ; iOS d’`EL_ASTRO_CMS` est l’API site `/api/ios/v1/*`, pas Le Dash |
| Espace de travail Cursor | Seulement la référence sanitizée et les tests Node locaux |

### Indices d’usage réel

Agrégats nginx (`/var/log/nginx/access.log*` complets, hôte `dash.electronlibre.info` uniquement) :

| Préfixe | Période observée (jours avec trafic) | Hits |
| --- | --- | --- |
| `/webservice` | — | **0** |
| `/admin` | 12–24 oct. 2026 | trafic régulier (ex. 1309 le 23, 1577 le 22) |
| `/client` | 11–24 oct. 2026 | trafic régulier (ex. 277 le 22, 113 le 23) |
| `/api` ou `/api-min` | quasi absent sur cet hôte dans la fenêtre | 1 hit `/api` le 19 oct. |

Aucun hit contenant la sous-chaîne `webservice` dans les journaux d’accès échantillonnés.  
Mtime des scripts PHP `webservice/*.php` : 8 mai 2026, 16:36 UTC (inchangés depuis).

### Verdict par endpoint HTTP

Pour **chaque** script HTTP listé ci-dessus : statut d’usage externe = **inconnu**.

- Zéro hit nginx et zéro appelant dans Dash/Astro **ne suffisent pas** à déclarer l’endpoint inutilisé : un client hors dépôts accessibles (ancienne app iOS, script privé) pourrait encore exister.
- **Conservation** : laisser l’implémentation PHP installée en place. Ne pas basculer le vhost vers Node pour ces routes tant qu’un propriétaire produit n’a pas tranché.

La parité Node déjà écrite dans `dash-migration/node-webservice/` reste un banc local, non déployé.

## Bibliothèque `sendPush`

| Fichier | Référence | Appel `sendPush(` | Usage |
| --- | --- | --- | --- |
| `client/messages.php` | `include("../webservice/send__push_.php")` | **oui** (après envoi de message POST) | **Confirmé dans le code** : chemin serveur actif si un utilisateur poste un message |
| `admin/index_actions.php` | `require_once …/send__push_.php` | **non** | Include mort ; les alertes admin passent par Firebase (`FIREBASE_PUSH_AUTH`, `electron-libre.firebaseio.com`) |
| `webservice/new_message.php` | `include` + appel | oui | Endpoint HTTP ; usage externe **inconnu** (voir plus haut) |
| `admin/test-dash-push.php` | autre mécanisme « Custom Dash Push » | pas `sendPush` | Script de test admin |

Trafic `/client` présent dans les journaux : le module messages (et donc l’appel `sendPush` s’il est exercé) reste plausible. Les journaux ne détaillent pas le sous-chemin `/client/messages.php` dans ce compte rendu (agrégat `/client` seulement).

## Carte `client/` et `admin/` (PHP encore servi)

Trafic nginx : **`/admin` et `/client` sont actifs** sur `dash.electronlibre.info` en octobre 2026.

### `client/` — fonctions visibles par les fichiers

| Zone | Fichiers repères | Dépendances typiques | `sendPush` |
| --- | --- | --- | --- |
| Session / accès | `login.php`, `disconnect.php`, `activate.php`, `register.php`, `connect.php` | session, BDD section | non |
| Flux live | `index.php` (volumineux), `get_articles.php`, `timeline.php` | `connect_admin`, RSS/`rss_post` | non |
| Archives / auteurs / graph | `archives.php`, `archives_pdf.php`, `author.php`, `graph.php` | session, admin DB | non |
| Messages | `messages.php`, `messages_loader.php`, `messages_post.php` | session, `messages`, users | **oui** (`messages.php`) — Node local |
| Notifications UI | `notification_*.php`, `notifications.php`, `inc/notifications*.php` | messages non lus | non (Node : non lus seulement) |
| Config / mail / favoris | `config.php`, `mail.php`, `favorites.php`, `user_*` | users, mails | non |
| Storify / events / aide | `storify.php`, `events.php`, `help.php`, `vcard.php` | divers | non |

### `admin/` — fonctions visibles par les fichiers

| Zone | Fichiers repères | Dépendances | `sendPush` |
| --- | --- | --- | --- |
| Inbox RSS | `index.php`, `index_actions.php`, `get_articles.php` | `rss_post`, thèmes, Firebase push (pas APNS `sendPush`) | include mort seulement |
| Refresh RSS / cron | `cron.php`, `refresh_rss.php`, `rss_refresh_engine.php`, `check_rss.php`, `verif_rss.php` | feeds, lock, parfois Vigie (`vigie_ingress`) | non (`vigie_ingress_push_infos` ≠ `sendPush`) |
| Config éditoriale | `config.php`, `config_theme.php`, `config_keyword.php`, `config_author.php` | thèmes, mots-clés, auteurs | non (Node : lecture catalogues) |
| Desk Astro | `send_to_desk.php`, `inc/desk.php` | `POST /api/desk/articles` | non |
| Envoyés / supprimés / storify | `sent.php`, `deleted.php`, `storify.php`, `edit_*` | `rss_post` | non (Node : sent/deleted lecture) |
| Ops / tests | `ops.php`, `test_*.php`, `test-dash-push.php` | diagnostics | non |

## Prochain périmètre Node recommandé (non commencé)

Ordre guidé par les **usages observés**, pas par la parité déjà écrite :

1. **Ne pas basculer les endpoints HTTP `webservice/*.php`.** Statut externe inconnu ; PHP conservé. La rotation du secret BDD/APNS reste un prérequis séparé avant tout branchement réel.
2. **Extraire `sendPush` comme module Node (ou service interne) consommé uniquement par le chemin prouvé** `client/messages.php`, avec externes désactivables — *après* rotation des secrets et sans toucher encore au vhost `/webservice`.
3. **Chantier à plus fort impact trafic** (si l’objectif est la migration Dash utile) : cœur **admin RSS** (`index` / `index_actions` / moteur de refresh) et pont **desk** (`send_to_desk` / `inc/desk.php`), qui portent l’essentiel du trafic `/admin`. Ce n’est plus le lot `webservice` HTTP.

Critère pour rouvrir le lot HTTP `webservice` : apparition de hits agrégés `/webservice/<script>` dans les journaux, ou identification d’un client hors arbre actuel qui appelle encore ces scripts.

## Limites

- Pas de source d’app mobile Dash dans les dépôts accessibles.
- Agrégats limités aux journaux nginx présents ; pas d’analyse des corps ni des query strings.
- `admin/index_actions.php` charge `send__push_.php` sans l’appeler : dette locale, pas une preuve d’usage APNS admin.
- Aucune modification serveur dans cette passe.
