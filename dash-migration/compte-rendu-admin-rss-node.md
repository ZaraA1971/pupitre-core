# Compte rendu — migration Node du périmètre admin RSS + pont Desk

Date : 24 octobre 2026, heure de Paris.  
Espace isolé uniquement. PHP installé sous `/var/www/dash.electronlibre.info` **non modifié**. Aucun déploiement, aucun vhost, aucun redémarrage, aucun changement de schéma. Endpoints HTTP `webservice/*.php` **non basculés**.

## Périmètre réalisé

| Comportement PHP | Module Node |
| --- | --- |
| Filtres inbox éditoriale / envoyés / supprimés (`rss-filter.php`) | `node-admin-rss/src/filters.mjs` |
| Actions `send` / `alert` / `delete` / `delete_all` (`index_actions.php`) | `node-admin-rss/src/actions.mjs` |
| Pont Desk `send_to_desk.php` + `inc/desk.php` | `node-admin-rss/src/send-to-desk.mjs` + `externals.mjs` |
| Compteurs nav (new / sent / deleted) | `fake-db.navCounts` (tests) |

Hors périmètre (non migré) : pages HTML `client/`, `api/`, `api-min/`, endpoints HTTP `webservice/*.php`, moteur cron `rss_refresh_engine.php`, extraction HTML complète `fetch-article.php` (injectable en test).

## `sendPush` dans `admin/index_actions.php`

Vérifié sur la copie sanitizée et par test automatisé :

- `require_once …/webservice/send__push_.php` est présent ;
- **aucun** appel `sendPush(` dans ce fichier ;
- l’implémentation Node **n’inclut pas** et **n’appelle pas** `sendPush` ;
- le push d’alerte admin reste le chemin Firebase (`FIREBASE_PUSH_AUTH`), enregistré localement sans HTTP quand `DASH_DISABLE_EXTERNAL=1`.

## Fichiers créés ou modifiés

- `dash-migration/reference/admin-rss/` — référence PHP sanitizée (admin RSS/desk + `rss-filter.php`), sans secrets
- `dash-migration/node-admin-rss/` — paquet Node + tests + `.env.example`
- `dash-migration/compte-rendu-admin-rss-node.md` — ce compte rendu
- Inchangé volontairement : `node-webservice/` (lot HTTP webservice), PHP serveur

## Vérifications et résultats

Commande : `cd dash-migration/node-admin-rss && npm test`  
Résultat : **11/13…** correction : **11 tests, 11 passés**, 0 échec.  
Journal : `/opt/cursor/artifacts/dash-admin-rss-node-tests.log`.

Couverture : include mort `sendPush`, fragments SQL inbox, prédicat promo/vigie, `send`/`delete`/`delete_all`, alerte (mail+Firebase enregistrés non envoyés), `send_to_desk` avec LLM/fetch injectés, refus LLM sans fallback anglais.

Scan local des secrets dans `dash-migration/` : propre (pas de `.pem`, pas de `.env` réel, pas de triplet PDO littéral).

## Limites et décisions restantes

1. **Pas d’adaptateur MySQL réel** — volontaire ; pas de test contre la base live.
2. **Extraction d’article et LLM** : en local, injectés ; le portage fidèle de `fetch-article.php` / `functions-ia.php` (router modèle, OpenAI) n’est pas recopié ligne à ligne.
3. **UI HTML** de `admin/index.php` non portée — seules les actions et le pont Desk.
4. **Cron / Vigie ingress / refresh RSS** hors lot.
5. **Rotation des secrets** production (BDD, Desk key, Firebase, OpenAI) : toujours à planifier séparément ; rien n’a été renouvelé ici.
6. Bascule vhost : non commencée ; le PHP reste la référence et le retour arrière.

## Suite recommandée (non commencée)

Brancher un adaptateur DB + Desk en préproduction isolée derrière `DASH_DISABLE_EXTERNAL=0` uniquement après rotation des secrets ; ou migrer ensuite le refresh RSS admin. Ne pas toucher aux endpoints HTTP `webservice/*.php` tant que leur usage externe reste inconnu.
