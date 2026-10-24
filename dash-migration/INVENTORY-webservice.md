# Inventaire `webservice/` (référence sanitizée)

Source installée : `/var/www/dash.electronlibre.info/webservice` sur `rag-server-EL`.  
Référence locale : `dash-migration/reference/webservice/` (sans secrets ni certificats).

## Fichiers exclus de la copie

| Élément | Motif |
| --- | --- |
| `CertificatePush.pem` | certificat / matériel cryptographique |
| `CertificatePushSandbox.pem` | idem |
| Mot de passe BDD en clair dans `auth.php` et `send__push_.php` | secret — remplacé par `getenv` / variables d’environnement sans valeur réelle |
| Phrase secrète APNS dans `send__push_.php` | secret — remplacé par `DASH_APNS_PASSPHRASE` |
| Renouvellement du mot de passe de production | **non effectué** ; à planifier séparément |

## Routes HTTP (script = chemin)

Toutes prennent les paramètres GET d’auth hérités de `auth.php` : `login`, `password`, `section` (base `dash_{section}`).

| Script | Auth | Bases | Réponse observable | Effets |
| --- | --- | --- | --- | --- |
| `connect.php` | oui | `dash_*` (+ thèmes via auth) | `{success, infos.id_user?}` | lecture users |
| `auth.php` | — | idem | corps vide si appelé seul | lit users / theme |
| `list_themes.php` | oui | admin via auth | `{success, themes?}` | lecture |
| `list_contacts.php` | oui | `dash_*` | `{success, contacts?}` | lecture users |
| `list_messages.php` | oui | `dash_*` | `{success, last_messages?}` | lecture messages |
| `history_messages.php` | oui | `dash_*` | `{success, messages?}` | lecture ; `user`, `since`, `old` |
| `new_message.php` | oui | `dash_*` | `{success, insert?}` | INSERT messages + `sendPush` |
| `read_contact.php` | oui | `dash_*` | `{success}` | UPDATE `has_been_read` |
| `list_news.php` | oui | `admin_dash` | `{success, news?}` | lecture `rss_post`/`theme` |
| `read_news.php` | oui | `admin_dash` | `{success, news?}` | lecture `rss_post` |
| `read_settings.php` | oui | `admin_dash` | `{success, settings?}` | lecture users + ios_devices |
| `save_settings.php` | oui | `dash_*` + `admin_dash` | `{success, message?}` | UPDATE login/pass/mail/push flags |
| `register_push.php` | oui | `admin_dash` | **corps vide** (pas d’`echo` en PHP) | INSERT ios_devices |
| `send__push_.php` | n/a | `admin_dash` | bibliothèque, pas une route | APNS sandbox (désactivé en Node tests) |

Authentification : comparaison en clair `GET password == pass_user`, utilisateur `active_user == 1`. Content-Type : `text/json; charset=utf-8`.

## Appelants trouvés dans le code applicatif

- Aucune référence URL `/webservice/<script>` hors du dossier lui-même.
- `client/messages.php` et `admin/index_actions.php` incluent `send__push_.php` et appellent `sendPush(...)` (usage serveur PHP interne, hors périmètre HTTP de cette étape).
- Aucune mention dans `/var/www/el-astro`.
- Client mobile iOS historique : **non présent** dans les sources inspectées. Usage réel des routes HTTP : **non prouvé** par le code serveur actuel.

## Incertitudes

- Schéma exact des colonnes `messages` (INSERT à 7 valeurs positionnelles).
- Fuseau des `DATE_FORMAT` / `strtotime` (serveur PHP vs UTC Node).
- APNS : certificat sandbox uniquement dans le code ; production APNS non vue.
- `register_push` sans réponse JSON : bug ou contrat volontaire ? Conservé tel quel.
- Sections `dash_*` réellement utilisées en production : non lues (données).
