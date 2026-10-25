# Compte rendu — coupure admin PHP sur `dash.electronlibre.info`

Date : 25 octobre 2026 (Europe/Paris).  
Chemin : `dash-migration/compte-rendu-coupure-admin-php.md`.  
Hôte : `rag-server-EL`.

## Objectif

Couper l’ancienne UI PHP derrière  
`https://dash.electronlibre.info/admin/index.php`  
et servir l’UI Astro RSS à la place.

## URL après bascule

| URL | Comportement |
| --- | --- |
| `https://dash.electronlibre.info/admin/index.php` | **302** → `/admin/rss/` |
| `https://dash.electronlibre.info/admin/` | **302** → `/admin/rss/` |
| `https://dash.electronlibre.info/admin/rss/` | **200** Astro — titre « Administration RSS \| ElectronLibre », marqueur « Articles RSS » |
| `https://dash.electronlibre.info/admin/*.php` (autres) | **410** (snippet) ou redirection vers `/admin/rss/` pour les chemins prefix |

L’ancienne page « Administration · Electron Libre » (PHP) n’est plus renvoyée sur ces URLs.

## Modifications serveur

| Élément | Action |
| --- | --- |
| `/etc/nginx/snippets/dash-admin-auth.conf` | Proxy Astro `:4322` (`/admin/rss`, `/_astro/`), API `:8787` (`/api/rss`, `/api/desk`), Desk static `/desk/`, redirections `/admin` → `/admin/rss/`, PHP admin → 302/410 |
| Backup snippet | `dash-admin-auth.conf.php-cut-backup-20261025-130831` (+ basic-auth backup antérieur) |
| `/etc/nginx/sites-available/dash.electronlibre.info` | Retrait du `location = /admin` (conflit duplicate avec le snippet) |
| Backup site | `dash.electronlibre.info.php-cut-site-fix-*` |
| `sites-enabled` | Suppression du symlink parasite `dash.electronlibre.info.php-cut-backup-*` (même cible → double `server_name`) |
| nginx | `nginx -t` OK + `systemctl reload nginx` |

Snapshots repo :  
`dash-migration/deploy-snapshots/dash-admin-auth.conf.astro-cut`  
`dash-migration/deploy-snapshots/dash.electronlibre.info.astro-cut`

## Vérifications

```text
curl -sSI https://dash.electronlibre.info/admin/index.php
  → HTTP/2 302  Location: /admin/rss/

curl -sS -L https://dash.electronlibre.info/admin/index.php
  → title Administration RSS | ElectronLibre
  → Articles RSS présent ; titre PHP absent
```

Services locaux actifs : `el-astro-web` (:4322), `el-astro-rag-proxy` (:8787).

## Auth

Session Desk (`el_session`) via `/api/desk` proxifié sur le même host `dash.electronlibre.info`.  
Le client `/client/` Dash PHP n’est pas touché.

## Rollback

```bash
# sur rag-server-EL
cp -a /etc/nginx/snippets/dash-admin-auth.conf.php-cut-backup-20261025-130831 \
      /etc/nginx/snippets/dash-admin-auth.conf
# restaurer aussi le bloc location = /admin dans le site
# (backup: /etc/nginx/sites-available/dash.electronlibre.info.php-cut-site-fix-*)
nginx -t && systemctl reload nginx
```
