# Compte rendu — actions Astro `/admin/rss` (send / delete / restore)

Date : 25 octobre 2026 (Europe/Paris).  
Chemin : `dash-migration/compte-rendu-admin-rss-actions-astro.md`.  
Suite après validation utilisateur des listes/tris sur https://electronlibre.info/admin/rss/.

## Livrable

| Élément | Détail |
| --- | --- |
| `POST /api/rss/actions` | `{ action: send\|delete\|restore, ids: [], themeId? }` |
| Droits | session Desk + rôle `admin` ou `editor` (`canEditAll`) |
| Externes | mail / Firebase / sendPush **non** branchés |
| UI | panneau détail : Envoyer (+ thème), Supprimer, Restaurer |

Backup : `/var/www/el-astro/backups/admin-rss-actions-20261025100246/`.

## Preuve

Smoke module sur prod (article restauré ensuite) :

- delete → inbox 490→489, deleted +1  
- restore → compteurs revenus  

UI publique contient `data-action="send|delete|restore"`.

## Limites

- Pas d’alerte mail/Firebase ni `to_desk` dans ce lot.  
- `delete_all` non exposé.  
- Pousser `EL_ASTRO_CMS` sur GitHub : droits `cursor[bot]` insuffisants — copie locale `/workspace/EL_ASTRO_CMS`.
