# Compte rendu — hash SimplePie + loadFeed HTTP (qualif)

Date : 25 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-refresh-http-hash.md`.  
Lot : `dash-migration/node-admin-rss/`.  
Branche : `cursor/plan-migration-php-nodejs-daf6`.

**Étape plan :** après readiness refresh fixtures/MySQL, avancer les prérequis de bascule : parité `get_id(true)` + fetch HTTP **contrôlé** (loopback), sans toucher au cron PHP prod.

## Attestation

- Aucune modification de `/etc/cron.d/dash-cron`, PHP installé, ni vhost.
- `DASH_DISABLE_EXTERNAL=1` conserve : pas de Vigie/Desk/Firebase/LLM réels.
- Fetch HTTP seulement si `DASH_ALLOW_FEED_HTTP=1` ; démo = serveur loopback servant les fixtures XML.
- Oracle hash : lecture seule SimplePie sur `rag-server-EL` (`get_id(true)` → `md5(permalink.title)`).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/simplepie-hash.mjs` | `simplePieGetIdTrue` / `simplePieHashItem` |
| `src/http-feed.mjs` | `createHttpFeedLoader` + `assertSafeFeedUrl` |
| `src/feed-parse.mjs` | `titleRaw` pour hash avant `nettoyerTexteAvance` |
| `src/config.mjs` | `DASH_ALLOW_FEED_HTTP` + `assertFeedHttpAllowed` |
| `scripts/refresh-http-local.mjs` | Qualif HTTP loopback + hash SimplePie |
| `test/simplepie-hash.test.mjs` | Vecteurs oracle PHP + ingest md5 |
| `test/http-feed.test.mjs` | Garde-fous + fetch loopback → refresh |
| `.env.example` / `package.json` | `test:feed-http`, `refresh:http-local` |

## Contrat hash (PHP)

```text
SimplePie_Item::get_id(true)
  → md5(permalink . title) si permalink ou title non null
  → sinon md5(serialize($data))  [non porté]
```

Oracle (fixture lemonde, item lm-1) : `6eb7504a2459a4007b2bf5e2ab27a2dc`.

Écart résiduel : titres avec entités XML où SimplePie conserve `&amp;` vs décodage Node — documenté ; fixtures ASCII/UTF-8 sans entité alignées.

## Tests

```bash
cd dash-migration/node-admin-rss
npm run test:feed-http
npm run refresh:http-local
npm run test:refresh   # non-régression guid fixtures
```

## Hors lot (suite)

1. Fetch vers vrais flux (allowlist) sur DB jetable / miroir — pas encore.
2. Worker Node + cron en parallèle du PHP.
3. Bascule puis retrait `dash-cron` PHP.
