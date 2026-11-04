# Compte rendu — Tout supprimer (legacy)

Date : 25 octobre 2026 (Europe/Paris).

## Livrable

- `POST /api/rss/actions` `{ "action": "delete_all" }`
- SQL identique à PHP : `bin=1, new=0, deleted=1, sent=0` où `bin=0 AND new=1 AND deleted=0 AND sent=0`
- Bouton **Tout supprimer** sur l’onglet Flux (admin/éditeur), avec confirm
- Inbox Astro alignée legacy : `new=1 AND sent=0` (plus tous les non-deleted)

Backup : `/var/www/el-astro/backups/admin-rss-delete-all-20261025103203/`

## Smoke

- Bouton présent dans le HTML public
- API sans session → 401
- Eligible delete_all compté sans exécuter le wipe en smoke agent
