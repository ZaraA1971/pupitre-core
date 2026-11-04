# Compte rendu — étape 1 migration Le Dash (`webservice/`)

Date : 24 octobre 2026, heure de Paris.  
SSH : confirmé vers `root@163.172.185.4` (`rag-server-EL`). Aucune clé ni secret n’est reproduit ici.  
Aucun fichier sous `/var/www/dash.electronlibre.info` n’a été modifié. Aucun service redémarré. Aucune donnée de production touchée. Aucun renouvellement de mot de passe de production.

## Secret BDD

Le mot de passe en clair présent dans le PHP installé (`webservice/auth.php`, puis aussi `webservice/send__push_.php` via PDO) **n’a pas été copié** dans le dépôt de migration, **n’a pas été commité** en clair, et **n’apparaît pas** dans ce compte rendu.

- Remplacement local : variables `DASH_DB_HOST`, `DASH_DB_USER`, `DASH_DB_PASSWORD`, `DASH_DB_DSN`, `DASH_APNS_*` (voir `dash-migration/node-webservice/.env.example`, valeurs vides).
- Certificats `CertificatePush*.pem` : **non copiés**.
- **Renouvellement du mot de passe de production : non effectué.** Cette opération doit être planifiée séparément (rotation du compte BDD, mise à jour des configs serveur hors git, invalidation de l’ancien secret encore présent dans le PHP installé).

Contrôle local après rédaction : aucune occurrence du motif utilisateur+mot de passe littéral, aucune phrase secrète APNS littérale, aucun fichier `.pem` dans `dash-migration/`.

## Espace de migration

Racine : `/workspace/dash-migration/`

| Chemin | Rôle |
| --- | --- |
| `MANIFEST.json` | Empreintes SHA-256 des originaux + état sanitizé |
| `INVENTORY-webservice.md` | Routes, auth, BDD, effets, appelants, incertitudes |
| `reference/webservice/*.php` | Référence PHP sanitizée (14 scripts, sans PEM) |
| `node-webservice/` | Implémentation Node de parité + tests |
| `node-webservice/.env.example` | Noms de variables, sans valeurs réelles |

## Inventaire (résumé)

- Auth GET : `login`, `password`, `section` → base `dash_{section}` ; thèmes dans `admin_dash`.
- Mot de passe comparé en clair (contrat legacy conservé côté Node pour la parité observable).
- Routes couvertes : `connect`, `list_*`, `history_messages`, `new_message`, `read_contact`, `read_news`, `read_settings`, `save_settings`, `register_push` (corps vide), bibliothèque `sendPush` (externe désactivé).
- Appelants HTTP dans le code Dash/Astro : **aucun chemin `/webservice/*.php` trouvé**. Seul `sendPush` est inclus depuis `client/messages.php` et `admin/index_actions.php`. Client iOS : source absente → usage live des routes HTTP **non prouvé**.

## Implémentation Node

Paquet privé `dash-webservice-node` (Node ≥ 22.12), sans dépendance npm externe.

- `src/handlers.mjs` : contrats JSON alignés sur les scripts PHP.
- `src/fake-db.mjs` : données fictives pour les tests.
- `src/push.mjs` : enregistre les appels ; n’envoie rien si `DASH_DISABLE_EXTERNAL=1` (défaut).
- `src/server.mjs` : refuse de démarrer si les externes ne sont pas désactivés.

`api-min/`, `api/`, `admin/`, `client/`, cron, schéma SQL et configuration serveur : **non modifiés**.

## Tests

Commande : `cd dash-migration/node-webservice && npm test`  
Résultat : **13/13 passés**, 0 échec (journal : `/opt/cursor/artifacts/dash-webservice-node-tests.log`).

Couverture : auth échec/succès, thèmes, contacts, messages, historique, push enregistré sans envoi, news, settings, `register_push` corps vide, utilisateur inactif.

## Limites restantes

1. Rotation du secret BDD / APNS en production : à planifier hors cette étape.
2. Pas d’adaptateur MySQL réel branché (volontaire) — pas de test contre la base live.
3. Usage réel des routes HTTP mobile non confirmé (pas de client dans les sources).
4. `sendPush` encore chargé par le PHP `client/` et `admin/` sur le serveur — hors périmètre de bascule HTTP.
5. Détails de fuseau horaire et schéma positionnel `INSERT INTO messages` encore incertains.
6. Aucun déploiement, aucun reverse-proxy, aucun cutover.

## Suite recommandée (non commencée)

Planifier la rotation du secret ; puis, si les routes HTTP sont encore nécessaires, brancher un adaptateur MySQL en préproduction uniquement ; sinon documenter l’obsolescence et migrer seulement la bibliothèque `sendPush` consommée par `client/` / `admin/`.
