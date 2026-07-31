# pupitre-core

Portable **Pupitre** CMS core — plugin registry, lifecycle hooks, and injectable HTTP CRUD for articles, categories, media, authors, and users.

**MIT** licensed. Built for hosts that bring their own auth, SQL tables, password hashing, and product plugins.

> This package is the extractable slice from [ElectronLibre](https://electronlibre.info)’s editorial desk. The ElectronLibre host, SPA, billing, Brevo, OneSignal, and RAG adapters are **not** included.

## Install

```bash
npm install @electronlibre/pupitre-core busboy
```

(Peer dependency: `busboy` for media uploads.)

From this repo without publishing:

```bash
git clone https://github.com/ZaraA1971/pupitre-core.git
cd pupitre-core
npm install busboy
npm test
npm run demo
```

## What you get

| Surface | Role |
|---------|------|
| `createPluginRegistry` | Caps, route dispatch, lifecycle hooks |
| `emitDeskLifecycle` | Bump `contentGen` + run hooks |
| `createArticleHelpers` | Slugs / ids / `canEditArticle` (inject table + role predicates) |
| `createCategoriesStore` / `createMediaStore` / `createUsersStore` | SQL stores (table names injected) |
| `tryHandleCoreCrud` | HTTP CRUD: articles, categories, media, authors, users |
| Pure utils | `slugify`, `asJson`, `nowMysql`, … |

## What you must provide (host)

- HTTP session / auth gate before calling core routers
- MySQL (or compatible) `pool`
- `rowToArticle` / `parseJsonArray` mappers for your schema
- Role predicates (`canAccessDesk`, `canEditAll`, `canPublish`, …)
- **`userPolicy.hashPassword`** — the core never hashes passwords itself
- Optional hooks: `afterPublish`, `afterUserCreate`, `afterUserDelete`, twin/keyword helpers
- Media FS helpers via `ctx.mediaFs` when using media routes

## Minimal demo

```bash
npm run demo
```

Exercises registry + lifecycle + `createArticleHelpers` (no database).

## Security notes (users)

- Core refuses to run users routes without a complete `userPolicy` (including `hashPassword`).
- Side effects (email, newsletter enrollment, reset tokens) belong in host hooks, not in this package.
- Columns such as `wp_role` / `newsletter_opt_in` are an opinionated editorial schema, not a WordPress runtime dependency.

## Non-goals

- Full SPA desk UI
- Stripe / Brevo / OneSignal / RAG
- Opinionated public front-end

## License

MIT — see [LICENSE](./LICENSE).
