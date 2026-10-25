# Compte rendu — readiness refresh RSS (dépôt Node)

Date : 25 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-refresh-readiness.md`.  
Lot : `dash-migration/node-admin-rss/`.  
Branche : `cursor/plan-migration-php-nodejs-daf6`.

**Verdict :** le moteur refresh Node du nouveau dépôt fonctionne correctement sur le banc (fixtures + MySQL jetable). **Il n’est pas encore en prod** — le pipeline Dash continue d’utiliser le cron PHP.

## Attestation

- Aucune écriture prod ; aucun changement de crontab, vhost, service ou PHP installé.
- SSH lecture seule sur `rag-server-EL` pour cartographier le cron PHP.
- Banc Node : `DASH_DISABLE_EXTERNAL=1` ; feeds = fixtures locales uniquement ; MySQL = `127.0.0.1` / `dash_disposable`.

## Preuves banc Node (nouveau dépôt)

| Commande | Résultat |
| --- | --- |
| `npm run test:refresh` | **13/13** pass |
| `npm run test:mysql-refresh` | **7/7** pass |
| `npm run refresh:once` | `ok: true`, inserted 4, skippedPromo 1, trashedLowKw 3, vigieEvents 1 |
| `npm test` (fixtures, env MySQL retiré) | **63/63** pass |
| `npm test` (MySQL jetable) | **74/74** pass |

Journaux :  
`/opt/cursor/artifacts/dash-refresh-fixtures-2026-10-25.log`,  
`/opt/cursor/artifacts/dash-refresh-mysql-2026-10-25.log`,  
`/opt/cursor/artifacts/dash-refresh-once-2026-10-25.log`,  
`/opt/cursor/artifacts/dash-admin-full-fixtures-2026-10-25.log`,  
`/opt/cursor/artifacts/dash-admin-full-mysql-2026-10-25.log`.

Comportements couverts : lock idle/busy/stale/phantom, ingest fixtures, dédup hash injectable, promo/bruit, seuil mots-clés, purge 38 j, manual vs cron (`deleteStaleBinUnsent`), exitCode 2 si busy en cron, stub Vigie (log only).

## État prod (inchangé)

| Élément | Observation |
| --- | --- |
| Crontab | `/etc/cron.d/dash-cron` → `*/30 * * * * www-data php -f …/admin/cron.php` |
| Moteur | PHP `rss_refresh_engine.php` + SimplePie |
| Dernier run observé | 25 oct. 2026 **12:32:53** Europe/Paris, durée **171,7 s** (`[qualif-dash-cron] Terminé`) |
| `refresh_rss` | `status=0`, `last_refresh=2026-10-25 12:32:53`, `last_update=2026-10-25 12:32:53` (Europe/Paris) |
| Node refresh sur `el-astro` | **Absent** (API Astro = inbox/actions seulement) |

## Écarts bloquants avant bascule prod

1. **Fetch HTTP réel** — `loadFeed` refuse tout hors carte fixtures ; pas de client réseau / UA / cache SimplePie.  
2. **Hash ≠ SimplePie `get_id(true)`** — risque de doublons ou pertes à la bascule si on change de hash sans migration.  
3. **Worker Node + cron** — aucun service/crontab Node déployé ; Astro n’expose pas de refresh.  
4. **Vigie réel** — stub seulement (`DASH_DISABLE_EXTERNAL=1`).  
5. **Adaptateur MySQL prod** — `mysql-db.mjs` est le schéma jetable + garde-fous loopback ; pas le DSN / schéma prod.  
6. **Retrait PHP** — seulement après bascule Node stable (désactiver `/etc/cron.d/dash-cron`, pas avant).

## Suite recommandée (ordre)

1. Qualif contrôlée : `loadFeed` HTTP + hash de parité (ou table de migration de hash) sur une DB non-prod.  
   → **Fait en banc** le 25 oct. 2026 : voir `compte-rendu-refresh-http-hash.md` (hash `get_id(true)` + HTTP loopback). Reste : vrais flux / DB miroir.  
2. Déployer un worker Node one-shot (`refresh:once` mode cron) derrière un cron, **en parallèle** du PHP (lecture seule / dry-run stats) ou sur schéma miroir.  
3. Bascule : Node seul → observer inbox Astro + `refresh_rss` + logs.  
4. **Ensuite** retirer PHP du pipeline Dash (`dash-cron` + chemins refresh admin PHP).
