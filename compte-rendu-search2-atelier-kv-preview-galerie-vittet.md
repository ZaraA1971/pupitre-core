# Compte-rendu — search2 sur alias atelier-kv-preview

Date : 9 novembre 2026 · commit `757a3a5` · branche git `cursor/atelier-kv-preview-search2-4c07`.

## Problème

L’URL atelier utilisée :
https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/

ne montrait pas le champ recherche (`#catalog-filter-search` / cache-bust `search2`).

## Diagnostic (Compte Emmanuel)

Projet Pages `galerie-vittet-preview` :

| Alias / domaine | Mapping constaté avant fix |
|---|---|
| `galerie-vittet-preview.pages.dev` | production `main` (search2 `5797d174`) |
| `preview.galerie-vittet-preview.pages.dev` | preview branch `78455c54` (search2) |
| `atelier-kv-preview.galerie-vittet-preview.pages.dev` | **stale** preview branch `atelier-kv-preview` → deploy `3a5e8219` (2026-11-06 cleanup8) |

Les deploys search1/search2 ciblant `main` / `preview` ne déplacent **pas** l’alias `atelier-kv-preview` (alias lié à la branche Pages homonyme).

Pas de `ATELIER_USER` / `ATELIER_PASS` dans les secrets agent (seulement présents chiffrés côté Pages). Vérif HTML via package local + parité des hashes fichiers Pages (alias neuf == prod search2 ≠ stale).

## Sync

`galerie-vittet/scripts/sync-trees.sh` → `/tmp/galerie-vittet-pages/`.

Gate : `#catalog-filter-search` présent · `search2` ×3 (`style.css` / `atelier.css` / `atelier.js`) dans `/tmp/galerie-vittet-pages/atelier/index.html`.

## Deploy

```bash
npx wrangler pages deploy . \
  --project-name=galerie-vittet-preview \
  --branch=atelier-kv-preview \
  --commit-hash=757a3a54c88577e8740c785064d4cc5ef6095852 \
  --commit-message='search2 atelier filter on atelier-kv-preview alias'
```

| Cible | Id / URL |
|---|---|
| Atelier alias | `909b02ea` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/ |
| Hash deploy | https://909b02ea.galerie-vittet-preview.pages.dev/ |
| Atelier UI | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Prod search2 (réf.) | `5797d174` · https://galerie-vittet-preview.pages.dev/ |
| Preview search2 | `78455c54` · https://preview.galerie-vittet-preview.pages.dev/ |

## Vérif

| Check | Résultat |
|---|---|
| Alias API → deploy | `atelier-kv-preview` → `909b02ea` · branche `atelier-kv-preview` · commit `757a3a5` |
| Hashes `/atelier/*` | `909b02ea` == prod `5797d174` · ≠ stale `3a5e8219` |
| Package markup | `#catalog-filter-search` + `search2` ×3 |
| `GET /atelier/` | 401 Basic Auth (secrets Pages présents, non lus) |
| `GET /api/oeuvres` (alias) | 200 · **104** œuvres · functions OK |
