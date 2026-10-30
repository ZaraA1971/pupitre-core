# Compte rendu — exposition URL admin Dash

Date : 25 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-expose-admin-url.md`.  
Hôte : `rag-server-EL`.

## URL canonique

**https://dash.electronlibre.info/admin/index.php**

Accessible publiquement en **HTTP 200** (plus de Basic Auth nginx). Titre page : « Administration · Electron Libre ». Auth restante = session PHP Dash (« Connexion »).

## Modifications serveur

| Élément | Action |
| --- | --- |
| `/etc/nginx/snippets/dash-admin-auth.conf` | Basic Auth retiré ; conservation du refus referer depuis `/client/` |
| Backup snippet | `dash-admin-auth.conf.basic-auth-backup-20261025-125443` |
| `/var/www/dash.electronlibre.info/admin/.htaccess` | Directives Auth* neutralisées |
| Backup htaccess | `.htaccess.basic-auth-backup-*` |
| nginx | `nginx -t` OK + restart |

## Vérifications

```text
curl -sI https://dash.electronlibre.info/admin/index.php  → HTTP/2 200
curl -s  https://dash.electronlibre.info/admin/index.php  → title Administration · Electron Libre
```

## Contexte migration

- Refresh RSS : worker Node (`/etc/cron.d/dash-node-refresh`), PHP `dash-cron` désactivé.
- Surface de test Astro `https://electronlibre.info/admin/rss/` : inchangée (Desk) ; URL métier Dash = hostname `dash.electronlibre.info`.

## Rollback Basic Auth

```bash
cp -a /etc/nginx/snippets/dash-admin-auth.conf.basic-auth-backup-20261025-125443 \
      /etc/nginx/snippets/dash-admin-auth.conf
# restaurer aussi admin/.htaccess.basic-auth-backup-* si besoin
nginx -t && systemctl reload nginx
```
