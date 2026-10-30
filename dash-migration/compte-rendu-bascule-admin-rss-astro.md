# Compte rendu — bascule test public `/admin/rss/` (Astro)

Date : 25 octobre 2026 (Europe/Paris).  
Chemin : `dash-migration/compte-rendu-bascule-admin-rss-astro.md`.  
Autorisation produit : bascule sur l’URL publique existante.

## Clarification d’architecture

| Surface | Rôle |
| --- | --- |
| `https://electronlibre.info/admin/rss/` | Pupitre **Astro** (`el-astro`, API `:8787`) — **cible de test public** |
| `dash.electronlibre.info/admin/` | Admin PHP historique — **inchangé** |
| `dash-migration/node-admin-rss/` | Banc Node isolé (fixtures / MySQL jetable) — **non proxifié** |

La demande « tester sur l’URL publique » s’applique donc à **EL Astro**, pas au banc `node-admin-rss` localhost.

## Déployé (lecture seule)

Sur `rag-server-EL` (`/var/www/el-astro`) :

- API : `GET /api/rss/sent`, `/api/rss/deleted`, `/api/rss/counts`, `/api/rss/config` (+ `scope` / `allowDeleted` pour le détail)
- UI : onglets Flux / Envoyés / Supprimés / Config sur `/admin/rss/`
- BDD : pool **read-only** existant `admin-dash-readonly.env` → `admin_dash`
- Auth : session Desk inchangée (`/api/desk/me` + cookie)

Backup pré-déploiement : `/var/www/el-astro/backups/admin-rss-20261025095551/`.

Smoke module (serveur) : inbox 488 · sent 134 · deleted 42696 · thèmes 50 · auteurs 329 · mots-clés 2352.

## Comment tester

1. Ouvrir https://electronlibre.info/admin/rss/ (compte Desk autorisé).
2. Vérifier les onglets **Envoyés**, **Supprimés**, **Config**.
3. Sans session, `/api/rss/counts` → `401` (comportement attendu).

## Rollback

```bash
# sur rag-server-EL
B=/var/www/el-astro/backups/admin-rss-20261025095551
cp -a $B/* /var/www/el-astro/server/lib/  # ajuster chemins rss.astro / css
# restaurer rss.astro + admin-rss.css depuis $B
cd /var/www/el-astro && npm run build
systemctl restart el-astro-rag-proxy el-astro-web
```

## Limites

- Pas d’écriture CRUD config / pas d’actions send-to-desk dans ces onglets.
- Mots-clés config : 200 premiers (sur 2352).
- Sources `admin-dash-rss*` étaient locales non commités sur le serveur ; copies de travail aussi sous `/workspace/EL_ASTRO_CMS/` (à pousser sur `EL_ASTRO_CMS` séparément).
