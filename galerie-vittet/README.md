# Galerie Vittet — site + atelier (Cloudflare Pages)

Deployable package: static front, `/atelier` CMS UI, and `functions/` (D1 + KV).

## Layout

| Path | Role |
|---|---|
| `index.html` / `main.js` / `style.css` | Public gallery |
| `atelier/` | CMS UI (Basic Auth via Pages Functions) |
| `functions/` | `/api/oeuvres`, atelier APIs, KV image gate (`functions/images/ajouts/`) |
| `wrangler.toml` | Pages project + D1/KV bindings (ids, not secrets) |
| `scripts/sync-trees.sh` | Sync this tree → `/tmp/galerie-vittet-pages` + front mirror |

## Secrets

Do **not** commit Basic Auth passwords. Set Pages secrets `ATELIER_USER` / `ATELIER_PASS`.
Ops scripts read the same vars (or `--user` / `--password`); no password defaults in source.

## Deploy

```bash
# from this directory (package must include functions/)
npx wrangler pages deploy . --project-name=galerie-vittet-preview --branch=preview
```

Public: https://galerie-vittet-preview.pages.dev/
Atelier: https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/
