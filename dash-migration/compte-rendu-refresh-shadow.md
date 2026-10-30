# Compte rendu — worker shadow refresh (HTTP réel → MySQL jetable)

Date : 25 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-refresh-shadow.md`.  
Lot : `dash-migration/node-admin-rss/`.  
Branche : `cursor/plan-migration-php-nodejs-daf6`.

**Étape plan :** après hash SimplePie + HTTP loopback, lancer un **worker shadow** qui tire de vrais flux publics dans `dash_disposable`, compare des hash prod, **sans** toucher au cron PHP.

## Attestation

- Aucune modification de `/etc/cron.d/dash-cron`, PHP installé, vhost, ni base ElectronLibre (écritures).
- Lecture seule prod : échantillon `rss_url` (147 flux) + 2 hash Guardian pour oracle.
- Écritures : uniquement `127.0.0.1` / `dash_disposable` + `DASH_DB_ALLOW_SCHEMA_INIT=1`.
- `DASH_DISABLE_EXTERNAL=1` : pas de Vigie/Desk/Firebase.
- Catalogue shadow = sous-ensemble public commité (`fixtures/shadow-catalog.json`), pas le dump complet prod.

## Preuve de parité hash (live)

Item Guardian encore présent en prod et dans le flux :

| Champ | Valeur |
| --- | --- |
| link | `…/demand-uk-government-action-after-british-man-death-grenada` |
| hash prod | `79bdd33dadf4fefc3d3b7c2428533798` |
| hash PHP SimplePie `get_id(true)` | identique |
| hash Node `simplePieHashItem` | identique |

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `fixtures/shadow-catalog.json` | 5 flux publics (Guardian, RFI, BBC tech, Arcom, 01Net) |
| `fixtures/shadow-prod-sample.json` | 2 hash Guardian lecture seule |
| `src/shadow-refresh.mjs` | catalogue, limit, compare |
| `scripts/refresh-shadow.mjs` | worker CLI |
| `test/shadow-refresh.test.mjs` | helpers sans réseau |
| `package.json` | `refresh:shadow`, `test:shadow` |

## Commandes

```bash
cd dash-migration/node-admin-rss
npm run test:shadow
set -a && . /tmp/dash-mysql-disposable.env && set +a
DASH_ALLOW_FEED_HTTP=1 DASH_SHADOW_FEED_LIMIT=3 npm run refresh:shadow
```

## Résultat du run (25 oct. 2026, Europe/Paris)

| Métrique | Valeur |
| --- | --- |
| Flux | Guardian world, RFI, BBC tech |
| `itemsSeen` / `inserted` | 89 / 89 |
| `prodSampleCompare.matchRate` | **1.0** (2/2 hash Guardian) |
| `trashedLowKw` | 89 (attendu : seed mots-clés fixtures ≠ lexique prod) |
| Durée | ~480 ms |
| Cron PHP | inchangé |

Journaux : `/opt/cursor/artifacts/dash-refresh-shadow-2026-10-25.log`.

## Suite

1. Élargir catalogue / mots-clés (export sanitizé) pour taux d’inbox plus réaliste.  
2. Installer un timer Node **en parallèle** du PHP (même hôte, DB jetable ou dry-run) — pas encore.  
3. Bascule puis retrait `dash-cron` PHP.
