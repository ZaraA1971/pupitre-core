# Transfert Galerie Vittet → compte Cloudflare dédié

**Statut : bloqué côté utilisateur** — inventaire + runbook prêts ; aucun faux transfert.

## Compte source (inchangé, prod live)

| Champ | Valeur |
|---|---|
| Compte | Compte Emmanuel |
| Account ID | `69008766b3a7e792dea17459d47b60ea` |
| Login wrangler | `emmanueltorregano@me.com` |
| Pages | `galerie-vittet-preview` → https://galerie-vittet-preview.pages.dev/ |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/ |
| D1 | `galerie-vittet-oeuvres` / `b44e630e-cd76-4ca2-83f5-351cb63f2650` — **112** œuvres |
| KV | `galerie-vittet-images` / `a89aa092eea540729f94cf302370d453` — **336** clés (112× detail/preview/web) |
| KV preview | `galerie-vittet-images_preview` / `15b72a6cba40401099a9f28c8a4e3306` |
| Arbres | `/tmp/galerie-vittet-atelier-cf`, `/tmp/galerie-vittet-pages` |
| Scaleway | non touché |

## Compte cible Galerie Vittet

Cloudflare = **email + mot de passe** (pas un simple username « Vittet »).

- Email candidat documenté (contact site) : `vittet.claude@yahoo.fr`
- Login atelier Basic Auth déjà en place : `vittet` (distinct du compte dashboard Cloudflare)
- Compte **non créé** dans ce tour (signup / vérif email hors autonomie complète)

## Docs Cloudflare

Pas de « transfer Pages project » inter-comptes. Chemin réel : créer D1+KV+Pages sur le nouveau compte → importer données → redéployer → attacher le domaine plus tard. Les membres d’un compte partagent le **même** compte (pas un compte dédié).

## Artefacts migration prêts

- `01-schema.sql`, `oeuvres-dump.json` (112 rows), `kv-keys.json` (336)
- `migrate-to-vittet-account.sh` — à lancer **après** API token du compte Vittet
- Ne supprime rien sur Emmanuel

## À faire par l’utilisateur

1. Confirmer l’email Cloudflare (ex. `vittet.claude@yahoo.fr` ou autre).
2. Signup + vérif email → compte nommé « Galerie Vittet ».
3. Secrets : `CLOUDFLARE_VITTET_ACCOUNT_EMAIL`, `CLOUDFLARE_VITTET_API_TOKEN` (Pages/D1/KV Edit), optionnel password + Account ID.
4. Ensuite l’agent : create resources → migrate D1/KV → deploy → vérifier front+atelier.
5. Domaine custom : après transfert DNS / zone sur le compte Vittet (Scaleway / zones hors scope non touchées).
