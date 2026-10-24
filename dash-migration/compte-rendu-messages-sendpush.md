# Compte rendu — messages client + sendPush interne

Date : 25 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-messages-sendpush.md`.  
Lot : `dash-migration/node-client/` (+ référence PHP messages).  
Branche : `cursor/plan-migration-php-nodejs-daf6`.

## Attestation d’isolement

- Copie SSH **lecture seule** de `client/messages.php`, `messages_post.php`, `messages_loader.php` → `reference/client/client/`.
- **`webservice/send__push_.php` n’a pas été re-téléchargé** : la copie installée contient encore des littéraux (PDO/APNS) ; on réutilise la référence **déjà sanitizée** `reference/webservice/send__push_.php`. Staging distant effacé ; clé SSH effacée.
- Aucun APNS, mail SMTP, ni route HTTP `/webservice/*` exposée ou basculée.
- `DASH_DISABLE_EXTERNAL=1` : `sendPush` enregistre l’appel + devices éligibles, sans socket SSL.
- Banc MySQL : loopback `dash_disposable` uniquement (`client_messages`, `client_ios_devices`).

## Livrable Node

| Module / route | Rôle |
| --- | --- |
| `src/send-push.mjs` | Bibliothèque interne (contrat `sendPush(id, msg, type, badge)`) |
| `src/messages.mjs` | INSERT message + push + mail notif (enregistré) |
| `GET/POST /messages`, `/messages_post` | UI + envoi |
| `POST /messages_loader` | Pagination HTML (5) |
| `GET /api/messages` | JSON conversations / thread |
| Tables jetables | `client_messages`, `client_ios_devices` (+ colonnes mail sur `client_users`) |

## Tests

```bash
# fixtures
env -u DASH_DB_MODE … DASH_DISABLE_EXTERNAL=1 npm test   # 21 pass

# mysql jetable
set -a && . /tmp/dash-mysql-disposable.env && set +a
DASH_DISABLE_EXTERNAL=1 npm test   # 25 pass
```

Journaux : `/opt/cursor/artifacts/dash-client-messages-fixtures.log`, `dash-client-messages-mysql.log`.

## Limites

| Point | Statut |
| --- | --- |
| APNS réel / certificat | Interdit sur ce banc |
| Pixel-perfect Fancybox `messages_post` | UI locale simplifiée |
| Bascule vhost `/webservice` | **Non** — endpoints HTTP restent PHP |
| Include PHP `send__push_.php` en prod | Inchangé |

## Suite recommandée

1. Ne pas déployer ; ne pas lever `DASH_DISABLE_EXTERNAL`.
2. Config éditoriale admin restante (`config_*`, sent/deleted) ou notifications UI client — toujours hors webservice HTTP.
