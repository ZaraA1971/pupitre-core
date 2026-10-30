# Compte rendu — moteur refresh RSS / cron Node (fixtures)

Date : 24 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-refresh-rss-node.md`.  
Lot : `dash-migration/node-admin-rss/`.  
Branche : `cursor/plan-migration-php-nodejs-daf6`.

**La migration n’est pas achevée de bout en bout** (pas de bascule prod, pas d’adaptateur MySQL refresh, hash ≠ SimplePie). Ce lot porte le comportement établi par les PHP sanitizés **sur fixtures locales** uniquement.

## Attestation d’isolement

- Aucune connexion à la base ElectronLibre (ni lecture, ni écriture).
- Aucun SSH, aucun serveur distant, aucun secret / `.env` prod lu.
- Aucun fetch de flux RSS réel, Vigie, Desk, Firebase, SMTP ou LLM.
- Aucun cron système, vhost, service ou déploiement modifié.
- Tests exécutés avec `DASH_DISABLE_EXTERNAL=1` et **sans** `DASH_DB_MODE=mysql` (suite MySQL skipped) — uniquement fake-db + fichiers XML sous `fixtures/feeds/`.
- `loadFeed` refuse toute URL absente de la carte fixtures (pas de repli réseau).

## Fichiers ajoutés / modifiés

### Ajoutés

| Fichier | Rôle |
| --- | --- |
| `src/classifiers.mjs` | `estArticlePublicitaire`, `estArticleFluxBruit`, `keywordMatchInText`, labels Vigie / journal |
| `src/rss-lock.mjs` | Verrou `refresh_rss` + horloge injectable |
| `src/feed-parse.mjs` | Parse RSS/Atom **fichier local** ; `defaultFixtureHash` ; `createFixtureFeedLoader` |
| `src/rss-refresh-engine.mjs` | Moteur `runRssRefresh` + options manual/cron |
| `src/vigie-ingress.mjs` | Point d’injection Vigie (log only si externes coupés) |
| `src/run-refresh.mjs` | Orchestration lock + refresh once |
| `scripts/refresh-once.mjs` | Démo CLI fixtures (pas de crontab) |
| `fixtures/feeds/*.xml` | 3 flux fictifs |
| `test/rss-refresh.test.mjs` | Tests déterministes du lot |

### Modifiés

| Fichier | Changement |
| --- | --- |
| `src/fake-db.mjs` | API refresh (`listRssUrls`, insert/bin/keywords/purge, `refresh_rss`) |
| `package.json` | scripts `test:refresh`, `refresh:once` ; description |

Non modifié hors `dash-migration/` ; PHP installé inchangé ; `mysql-db.mjs` **sans** API refresh (voir limites).

## Comportements portés

1. Ingestion depuis fixtures XML (RSS 2.0) via `loadFeed` injectable.  
2. Déduplication par **hash injectable** (`defaultFixtureHash` = `guid` / sinon `fixture:link`) — **pas** `SimplePie::get_id(true)`.  
3. Cycle `bin` : `markAllNewAsBin` puis `clearBinByHash` si hash déjà connu.  
4. Mots-clés + alias (`aliases` seed + `alias_keyword` legacy) ; seuil `RSS_MIN_DISTINCT_KEYWORDS = 3` → trash éditorial ; Vigie exempt.  
5. Filtres promo/bruit à l’ingest.  
6. Verrou idle/busy, stale (max 600s), phantom ; horloge `nowMs`.  
7. Purge `RSS_KEEP_DAYS = 38`.  
8. Manual : `deleteStaleBinUnsent=false`, `progress=true` ; cron : inverse + exitCode 2 si busy.  
9. Vigie `pushInfos` shape (`kind=info`, `drain`, `fingerprint: dash:{hash}`) **désactivé réseau** par défaut.

## Comportements non portés / écarts documentés

| Point | Statut |
| --- | --- |
| Équivalence exacte hash SimplePie `get_id(true)` | **Non** — injectable ; documenté |
| Adaptateur `mysql-db.mjs` (insert/lock/purge refresh) | **Non** — fake-db seulement |
| Schéma jetable MySQL (`rss_url.url`, `theme`, `refresh_rss`, alias) | **Non étendu** dans cette passe |
| `simplepie.inc` / HTTP cache / user-agent réseau | Hors banc |
| `check_rss.php` / `verif_rss.php` UI HTML | Non portés (probe réseau) |
| Overrides `refresh_rss_*.local.php` | Non copiés ; défauts idle=`0` / busy=`1` |
| Push Vigie réel vers `:8790` | Interdit sur banc |
| Installation crontab hôte | Non |

## Tests exécutés

Commande :

```bash
cd dash-migration/node-admin-rss
env -u DASH_DB_MODE -u DASH_DB_HOST -u DASH_DB_USER -u DASH_DB_PASSWORD -u DASH_DB_NAME \
  -u DASH_DB_ALLOW_SCHEMA_INIT DASH_DISABLE_EXTERNAL=1 npm test
```

Résultat : **40 tests, 40 passés**, 0 échec (inbox existants + refresh).  
Journal : `/opt/cursor/artifacts/dash-admin-rss-refresh-tests.log`.

La suite `test:mysql` n’a **pas** été exécutée dans ce run (env MySQL retiré volontairement pour garantir zéro contact DB hors process). Elle reste disponible séparément sur MariaDB jetable locale uniquement.

## Limites connues

- Parser XML minimal ≠ SimplePie (namespaces, encodings edge-case).  
- Inbox après ingest validée en fake-db ; pas de rejeu refresh→MySQL jetable.  
- `nettoyerTexteAvance` Node reste minimal vs PHP partagé.  
- Endpoints HTTP `webservice/*.php` toujours hors périmètre.

## Suite recommandée

1. Étendre schéma + méthodes refresh sur `mysql-db.mjs` jetable.  
2. Documenter/implémenter un `hashItem` de parité si le code SimplePie installé est un jour sanitizé en référence.  
3. Ne pas déployer ni brancher de feeds réels.
