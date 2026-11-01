# Transfert Galerie Vittet → compte Cloudflare dédié

**Statut : bloqué — attente API token du compte Vittet**

## Cible
- Email: vittet.claude@yahoo.fr
- Account ID: `485af5da677b9be3c881813bc01b9ee8`
- Dashboard: https://dash.cloudflare.com/485af5da677b9be3c881813bc01b9ee8/home

## Token
- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_VITTET_API_TOKEN` : absents
- Wrangler OAuth actif = Compte Emmanuel seulement (`69008766…`) — ne pas l’utiliser pour provisionner Vittet

## Recherche Bruegel soft-fold (2026-11-01)
- `bruegel` manquait `BRUEGHEL` (gh) — softFold gh→g + ue↔eu
- Cache-bust `?v=20261101-bruegel`
- Prod `965760b7` · preview atelier `adff276b`
- Détail : `compte-rendu-recherche-bruegel-galerie-vittet.md`

## Recherche catalogue (2026-11-01)
- Champ header + vue `#recherche` / `#recherche?q=` (filtre client `/api/oeuvres`)
- Cache-bust `?v=20261101-recherche` (remplacé par bruegel)
- Prod `504c609a` · preview atelier `88c7459e`
- Détail : `compte-rendu-recherche-galerie-vittet.md`

## Retrait CTA collection (2026-11-01)
- Retrait « Demander une œuvre » sous `#collection` (lien déjà en lightbox + Contact nav/footer)
- Cache-bust `?v=20261101-nocollectcta`
- Prod `6bf64466` · preview atelier `9117b690`
- Détail : `compte-rendu-nocollectcta-galerie-vittet.md`

## Dédoublonnage home (2026-11-01)
- Retrait CTAs / footer doublons (`#collection`, `#contact`, OSM, tel, mailto, retour haut)
- Densification chrome + sections home
- Cache-bust `?v=20261101-dedupe`
- Prod `42a7a64a` · preview atelier `51919561`
- Détail : `compte-rendu-dedupe-home-galerie-vittet.md`

## Cleanup code (2026-10-31)
- Pass 2 : helpers image/loupe unifiés, CSS filter 1.06/1.03, CORS obsolete retiré
- Cache-bust `?v=20261031-cleanup2` (remplacé par dedupe)
- Prod `9f271d9a` · preview atelier `c9ede335`
- Détail : `compte-rendu-cleanup2-galerie-vittet.md`

## Source Emmanuel (intact)
- https://galerie-vittet-preview.pages.dev/
- Dumps prêts : 112 œuvres, 336 clés KV

## Nouvelles URLs
Aucune (pas encore de projet Pages sur le compte Vittet).
