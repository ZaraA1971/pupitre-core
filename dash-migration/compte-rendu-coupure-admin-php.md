# Compte rendu — coupure admin PHP sur `dash.electronlibre.info`

Date : 25 octobre 2026 (Europe/Paris).  
Chemin : `dash-migration/compte-rendu-coupure-admin-php.md`.  
Hôte : `rag-server-EL`.

## Objectif

Couper l’ancienne UI PHP derrière  
`https://dash.electronlibre.info/admin/index.php`  
et aboutir sur l’UI Astro RSS avec session Desk valide.

## Cause du « Accès pupitre refusé »

Premier essai : proxy Astro + API sur le host `dash`.  
Le cookie `el_session` est **host-only** (pas de `Domain=.electronlibre.info`) ; la session Desk créée sur `electronlibre.info` n’est pas envoyée à `dash`.  
De plus `/api/auth/login` n’était pas proxifié sur dash → impossible de se reconnecter proprement.  
Résultat UI : message API `Accès pupitre refusé` (403 `/api/desk/me`).

## URL après bascule (correctif auth)

| URL | Comportement |
| --- | --- |
| `https://dash.electronlibre.info/admin/index.php` | **302** → `https://electronlibre.info/admin/rss/` |
| `https://dash.electronlibre.info/admin/` | **302** → même cible |
| `https://dash.electronlibre.info/admin/rss/` | **302** → même cible |
| `https://dash.electronlibre.info/admin/*.php` (autres) | **410** |
| `https://electronlibre.info/admin/rss/` | **200** Astro — auth Desk inchangée |

## Modifications serveur

| Élément | Action |
| --- | --- |
| `/etc/nginx/snippets/dash-admin-auth.conf` | Redirections absolues vers `electronlibre.info/admin/rss/` ; PHP admin 410 |
| Backups snippet | `*.php-cut-backup-*`, `*.auth-fix-backup-*`, `*.basic-auth-backup-*` |
| Site vhost | `location = /admin` retiré (conflit) ; symlink backup `sites-enabled` retiré |
| nginx | `nginx -t` OK + reload |

Snapshots repo :  
`dash-migration/deploy-snapshots/dash-admin-auth.conf.astro-cut`  
`dash-migration/deploy-snapshots/dash.electronlibre.info.astro-cut`

## Vérifications

```text
curl -sSI https://dash.electronlibre.info/admin/index.php
  → HTTP/2 302  Location: https://electronlibre.info/admin/rss/

curl -sS -L …/admin/index.php
  → url=https://electronlibre.info/admin/rss/
  → title Administration RSS | ElectronLibre
```

Sans session Desk sur `electronlibre.info`, l’UI demande toujours une connexion Pupitre (comportement normal) — pas le 403 « host dash ».

## Rollback

```bash
# sur rag-server-EL
cp -a /etc/nginx/snippets/dash-admin-auth.conf.php-cut-backup-20261025-130831 \
      /etc/nginx/snippets/dash-admin-auth.conf
# ou le backup auth-fix le plus récent si besoin
# restaurer aussi le site *.php-cut-site-fix-* si le bloc location = /admin manque
nginx -t && systemctl reload nginx
```
