# Transfert Galerie Vittet → compte Cloudflare dédié

**Statut : bloqué — attente API token du compte Vittet**

## Tri atelier défaut récent (2026-11-02)
- Défaut : « Plus récente téléchargée ou modifiée » (`updated_at` / max avec `created_at`)
- D1 `updated_at` + bump PATCH/import ; front public inchangé
- Atelier `246911bc` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/
- Détail : `compte-rendu-atelier-tri-recent-galerie-vittet.md`

## Séparation sections (2026-11-02)
- Padding / overflow:clip / spy 38vh — Galerie ne se mélange plus avec Contact
- Cache-bust `?v=20261102-sections`
- Prod `9bd42b34` · atelier `12f0d4a7`
- Détail : `compte-rendu-sections-separation-galerie-vittet.md`

## Photo salle #galerie (2026-11-02)
- Diptyque couple + intérieur (`images/galerie-salle.webp`, 1024×530, ~69 Ko)
- Cache-bust `?v=20261102-salle` (remplacé par sections)
- Prod `ea41db80` · preview atelier `7ee3f392`
- Détail : `compte-rendu-salle-galerie-vittet.md`

## Cible
- Email: vittet.claude@yahoo.fr
- Account ID: `485af5da677b9be3c881813bc01b9ee8`
- Dashboard: https://dash.cloudflare.com/485af5da677b9be3c881813bc01b9ee8/home

## Token
- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_VITTET_API_TOKEN` : absents
- Wrangler OAuth actif = Compte Emmanuel seulement (`69008766…`) — ne pas l’utiliser pour provisionner Vittet

## Crédit footer (2026-11-01)
- « Site réalisé par Emmanuel Torregano » + mailto `emmanueltorregano@mac.com`
- Cache-bust `?v=20261101-credit`
- Prod `6591ed92` · preview atelier `21432cc1`
- Détail : `compte-rendu-credit-footer-galerie-vittet.md`

## Cleanup 3 recherche (2026-11-01)
- Unification route / soft-fold / debounce / bindSiteSearch ; pas de régression bruegel
- Cache-bust `?v=20261101-cleanup3` (remplacé par credit)
- Prod `914f35ba` · preview atelier `6ee9e695`
- Détail : `compte-rendu-cleanup3-galerie-vittet.md`

## Recherche instantanée (2026-11-01)
- Debounce 200 ms sur le champ header → `#recherche?q=` (replaceState)
- Soft-fold conservé ; `brue` / `bruegel` → 3 hits
- Cache-bust `?v=20261101-instant` (remplacé par cleanup3)
- Prod `15526b15` · preview atelier `02ff4d80`
- Détail : `compte-rendu-recherche-instant-galerie-vittet.md`

## Recherche Bruegel soft-fold (2026-11-01)
- `bruegel` manquait `BRUEGHEL` (gh) — softFold gh→g + ue↔eu
- Cache-bust `?v=20261101-bruegel` (remplacé par instant)
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
