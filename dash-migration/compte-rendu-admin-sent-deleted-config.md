# Compte rendu — admin sent / deleted / config (lecture)

Date : 25 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-admin-sent-deleted-config.md`.  
Lot : `dash-migration/node-admin-rss/`.  
Branche : `cursor/plan-migration-php-nodejs-daf6`.

## Attestation d’isolement

- Import SSH **lecture seule** de `admin/sent.php`, `deleted.php`, `config_theme.php`, `config_keyword.php`, `config_author.php` → `reference/admin-rss/admin/` (+ `SANITIZE_META_ADMIN_CLIENT_UI.json`).
- Aucune écriture CRUD config (pas de create/update/delete thèmes / mots-clés / auteurs).
- Fixtures + MySQL loopback `dash_disposable` uniquement ; `DASH_DISABLE_EXTERNAL=1`.
- Pas de bascule vhost `/admin` ni prod.

## Livrable Node

| Route / module | Rôle |
| --- | --- |
| `src/lists.mjs` | `loadSentPage` / `loadDeletedPage` / `loadConfigCatalog` |
| `GET /sent`, `/api/sent` | Liste `sent=1` (hors bin/deleted) |
| `GET /deleted`, `/api/deleted` | Liste `deleted=1` |
| `GET /config`, `/api/config` | Catalogues thèmes, mots-clés, auteurs (lecture) |
| Seed | Post id=7 deleted + table `authors` (Alice, Bob) |

## Tests

```bash
# fixtures
DASH_DB_MODE=fixtures DASH_DISABLE_EXTERNAL=1 npm test
# → 63+ pass dont suite « sent / deleted / config fixtures »

# mysql jetable
set -a && . /tmp/dash-mysql-disposable.env && set +a
DASH_DISABLE_EXTERNAL=1 npm test
# → suite MySQL « sent / deleted / config MySQL disposable » ok
```

Journaux : `/opt/cursor/artifacts/dash-admin-sent-deleted-config-fixtures.log`, `dash-admin-sent-mysql2.log`.

## Limites

| Point | Statut |
| --- | --- |
| CRUD config_*.php | Non — lecture seule |
| Storify / edit_* | Hors lot |
| Pixel-perfect admin PHP | UI locale simplifiée |
