# Compte rendu — notifications client (non lus)

Date : 25 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-client-notifications.md`.  
Lot : `dash-migration/node-client/`.  
Branche : `cursor/plan-migration-php-nodejs-daf6`.

## Attestation d’isolement

- Import SSH **lecture seule** de `client/notifications.php`, `notification_*.php`, `inc/notifications*.php` → `reference/client/client/`.
- Périmètre Node : **messages non lus uniquement** (`to_user=me AND has_been_read=0`) — pas de mentions AJAX PHP.
- `DASH_DISABLE_EXTERNAL=1` ; pas de route HTTP `/webservice` ; MySQL `dash_disposable` seulement.

## Livrable Node

| Route / module | Rôle |
| --- | --- |
| `db.countUnread` / `listUnread` | Fixtures + MySQL |
| `GET /api/unread` | `{ ok, count }` (auth requise) |
| `GET /notifications` | Centre non lus + badge |
| Badge nav | Index / timeline fetch `/api/unread` ; messages SSR `unreadCount` |
| Marquage lu | `?id_message=` sur `/messages` (existant) vide le badge |

## Tests

```bash
# fixtures
DASH_DB_MODE=fixtures DASH_DISABLE_EXTERNAL=1 npm test
# → suite « notifications unread UI » + reste (25 pass hors MySQL)

# mysql jetable
set -a && . /tmp/dash-mysql-disposable.env && set +a
DASH_DISABLE_EXTERNAL=1 npm test
# → 30 pass dont unread MySQL
```

Journaux : `/opt/cursor/artifacts/dash-client-notifications-fixtures.log`, `dash-client-notifications-mysql.log`.

## Limites

| Point | Statut |
| --- | --- |
| Mentions / notification_title AJAX | Non porté |
| Config client / favoris / mail | Hors lot |
| APNS badge réel | Interdit sur ce banc |
