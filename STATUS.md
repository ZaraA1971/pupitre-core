# Transfert Galerie Vittet → compte Cloudflare dédié

**Statut : bloqué — attente API token du compte Vittet**

## Wordmark VITTET plus haut (2026-11-03)
- font-size 56→72px ; line-height 1→1.2 ; pas de scaleY
- Cache-bust `?v=20261103-wmheight2`
- Prod `d8c2ebb2` · atelier `a07711dd`
- Détail : `compte-rendu-wordmark-height-galerie-vittet.md`

## Header adresse ×2 + sans menus Collection/Galerie (2026-11-03)
- Adresse 14px → 28px ; nav header retirée ; recherche centrée conservée
- Cache-bust `?v=20261103-hdrnonav`
- Prod `b06101f2` · atelier `48fab794`
- Détail : `compte-rendu-header-nonav-galerie-vittet.md`

## Lightbox plus grande + loupe sans fiche (2026-11-03)
- Dialog quasi plein viewport (−8 px) ; loupe masque la colonne infos
- Cap native `min(100%, naturalW/H)` — pas d’upscale
- Cache-bust `?v=20261103-lbloupe`
- Prod `1bdef92d`
- Détail : `compte-rendu-lightbox-loupe-galerie-vittet.md`

## Header adresse sous Vittet + nav/recherche centrés (2026-11-03)
- Adresse sous wordmark ; centre = Collection/Galerie + recherche ; droite phones/mailto/horaires
- Playfair 600–700 sur chrome ; tokens typeink conservés
- Cache-bust `?v=20261103-hdrplace`
- Prod `53863478` · atelier `1c89e120`
- Détail : `compte-rendu-header-place-galerie-vittet.md`

## Textes petits / muted agrandis + noircis (2026-11-03)
- `--muted` `#6f6b64` → `#3f3a33` ; tokens `--type-xs/sm/meta` 12/13/14px
- Cache-bust `?v=20261103-typeink`
- Prod `5984d827`
- Détail : `compte-rendu-typeink-galerie-vittet.md`

## Header empilé marque / recherche / contact (2026-11-03)
- VITTET ~56px ; nav 15px ; recherche centrée ; contact empilé à droite
- Cache-bust `?v=20261103-hdrstack`
- Prod `897852ae` · atelier `f29bed8f`
- Détail : `compte-rendu-header-stack-galerie-vittet.md`

## Header contact + footer minimal (2026-11-03)
- Bande contact sticky : téléphones +33, mailto, adresse, horaires ; nav sans Contact
- Section `.visit` et footer adresse retirés ; crédit Emmanuel conservé
- Cache-bust `?v=20261103-hdrcontact`
- Prod `bcdea24f` · atelier `a6d8a6cf`
- Détail : `compte-rendu-header-contact-galerie-vittet.md`

## Téléphones contact +33 (2026-11-03)
- Affichage `01…` / `06…` → `+33 1…` / `+33 6…` ; police 12px → 22px
- Cache-bust `?v=20261103-phone`
- Prod `24157937` · atelier `aa710034`
- Détail : `compte-rendu-phones-intl-galerie-vittet.md`

## Lightbox dim presque noir (2026-11-03)
- `.lightbox[open]::backdrop` : `rgba(22, 20, 16, .8)` → `rgba(0, 0, 0, 0.94)`
- Cache-bust `?v=20261103-lbdim`
- Prod `749baa0e` · atelier `599fb307`
- Détail : `compte-rendu-lightbox-dim-galerie-vittet.md`

## Cleanup ordre front (2026-11-03)
- PATCH delta + debounce 280 ms ; optimistic UI ; `compareByFrontOrder` unifié
- Prod `e777cebb` · atelier `42f3ccdb` · cache-bust `orderclean`
- Détail : `compte-rendu-orderclean-galerie-vittet.md`

## Ordre d’affichage front atelier (2026-11-03)
- Tri « Ordre d’affichage front » : drag + ↑↓ → D1 `sort_order` (PATCH bulk)
- Nouveaux imports append (`MAX+10`) ; densify initial 10…1120
- Prod `c8ee9922` · atelier `6d0ee0b3` (remplacé par orderclean)
- Détail : `compte-rendu-ordre-front-atelier-galerie-vittet.md`

## #galerie espace vs collection (2026-11-02)
- Collection pb 80px · about pt 96px (+40 px au total)
- Cache-bust `?v=20261102-gutter`
- Prod `f2b3e952` · atelier `e668b5b2`
- Détail : `compte-rendu-gutter-galerie-vittet.md`

## #galerie typo colonne (2026-11-02)
- H2 plus grand ; retrait 1ʳᵉ ligne ; colonne 220px ; triptyque inchangé
- Cache-bust `?v=20261102-copytune`
- Prod `f54b7525` · atelier `68c4739d`
- Détail : `compte-rendu-copytune-galerie-vittet.md`

## #galerie titre simple (2026-11-02)
- H2 « La galerie » + eyebrow « Depuis 1988 » ; triptyque hauteurs inchangées
- Cache-bust `?v=20261102-titre`
- Prod `ba5d3e5a` · atelier `7cf0cb1e`
- Détail : `compte-rendu-titre-galerie-vittet.md`

## #galerie triptyque + texte droite (2026-11-02)
- 3 photos même hauteur (gap 14px) ; texte colonne droite pleine hauteur ; mobile pile puis texte
- Cache-bust `?v=20261102-triptych`
- Prod `ddf1f3a7` · atelier `9ffe3823`
- Détail : `compte-rendu-triptych-galerie-vittet.md`

## #galerie nettoyage code (2026-11-02)
- HTML/CSS #galerie simplifiés ; design nofrm23 inchangé (parité ≤0,1 px)
- Cache-bust `?v=20261102-galclean`
- Prod `8c3d5c4e` · atelier `f0fe2ab1`
- Détail : `compte-rendu-galclean-galerie-vittet.md`

## #galerie sans cadre + couple 2/3 (2026-11-02)
- Cadre lieux retiré ; portrait = 2/3 hauteur diptyque ; tops alignés ; texte justifié
- Cache-bust `?v=20261102-nofrm23`
- Prod `723122e1` · atelier `e1a7673f`
- Détail : `compte-rendu-nofrm23-galerie-vittet.md`

## #galerie tops alignés + sans H2 (2026-11-02)
- Hauts façade / salle / portrait alignés ; retrait « Le goût des œuvres rares. » ; texte justifié sous portrait
- Cache-bust `?v=20261102-galigntops`
- Prod `ad977e25` · atelier `595af358`
- Détail : `compte-rendu-galigntops-galerie-vittet.md`

## Carousel hero départ aléatoire (2026-11-02)
- `syncHeroFromWorks` : index de départ random si ≥2 œuvres carousel ; ordre CMS + wrap next/prev inchangés
- Cache-bust `?v=20261102-herorand`
- Prod `c25435cc` · atelier `6ece3b38`
- Détail : `compte-rendu-herorand-galerie-vittet.md`

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
