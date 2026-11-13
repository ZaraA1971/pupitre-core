# Transfert Galerie Vittet → compte Cloudflare dédié

**Statut : bloqué — attente API token**

## Cible
- Email: vittet.claude@yahoo.fr
- Account ID: `485af5da677b9be3c881813bc01b9ee8`
- Dashboard: https://dash.cloudflare.com/485af5da677b9be3c881813bc01b9ee8/home

## Token
Absent (`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_VITTET_API_TOKEN`).
Wrangler OAuth = Compte Emmanuel seulement — non utilisé pour provisionner Vittet.

## Prêt dès token
- D1 dump 112 œuvres + schema
- KV inventory 336 clés
- Arbres `/tmp/galerie-vittet-atelier-cf` + `/tmp/galerie-vittet-pages`
- Script `migrate-to-vittet-account.sh`

## Source Emmanuel (intact)
- https://galerie-vittet-preview.pages.dev/
- https://atelier-kv-preview.galerie-vittet-preview.pages.dev/

## Nouvelles URLs
Aucune tant que le token Vittet n’est pas fourni.
