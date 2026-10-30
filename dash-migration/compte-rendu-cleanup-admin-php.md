# Compte rendu — nettoyage admin PHP (vigilant)

Date : 27 octobre 2026 (Europe/Paris).  
Chemin : `dash-migration/compte-rendu-cleanup-admin-php.md`.  
Hôte : `rag-server-EL`.

## Périmètre

Retrait de l’arbre **admin PHP** déjà hors service (nginx 302/410 → Astro).  
**Conservé intact** : `client/`, `webservice/`, `api/`, Node refresh, Astro.

## Actions

1. Archive tar+sha256 :  
   `/var/www/el-astro/backups/php-admin-cleanup-20261027085919/admin.tar.gz` (5,1 Mo)
2. Déplacement (pas `rm`) :  
   `/var/www/dash.electronlibre.info/admin`  
   → `admin.legacy-20261027085919`
3. Stub `admin/README.ARCHIVED.md` (instructions rollback)

## Smoke post-nettoyage

| URL | Résultat |
| --- | --- |
| `dash…/admin/index.php` | 302 → `electronlibre.info/admin/rss/` |
| `dash…/client/login.php` | 200 |
| Astro `/admin/rss/` | 200 |
| API `:8787/health` | ok |

## Rollback

```bash
DASH=/var/www/dash.electronlibre.info
STAMP=20261027085919
rm -rf "$DASH/admin"
mv "$DASH/admin.legacy-$STAMP" "$DASH/admin"
# ou : tar -C "$DASH" -xzf /var/www/el-astro/backups/php-admin-cleanup-$STAMP/admin.tar.gz
```

## Hors périmètre (volontaire)

- Pas de suppression de `client/` / `webservice/` / `php8.3-fpm`
- Pas de réactivation `dash-cron` PHP
- Code Astro send-to-desk : léger ménage (réponses API, commentaires) uniquement
