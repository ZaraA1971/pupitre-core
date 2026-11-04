# Compte-rendu — CSS mutualisé (tokens + cascade)

Date : 4 novembre 2026.

## Objectif

Nettoyer `style.css` pour éviter les conflits (couleurs / fonds concurrents, sélecteurs en double) et mutualiser tokens + patterns partagés, sans régression visuelle.

## Mutualisé

| Zone | Contenu |
|---|---|
| `:root` surfaces | `--paper` `#f5ede5` · `--paper-lift` · `--shade` (skeleton) · `--stage` `#1b1a17` |
| `:root` ink | `--ink-full` wordmark · `--ink` `#413c35` · aliases `--ink-lg` / `--muted` → `--ink` |
| `:root` type | `--type-xs/sm/meta/body` + `--type-artist` · `--type-display` · `--type-display-sm` |
| `:root` space | `--page-pad` / `-sm` / `-lg` |
| `:root` img | `--img-enhance` + `#img-warm-wb` (inchangé) |
| Surfaces partagées | `.hero` / `.collection` / `.about` / `.art-open` / `.hero-viewport` / contrôles / lightbox |
| Type partagé | `.hero-title` + `.art-meta h3` · `.hero-artist` + `.art-artist` · `.section-heading h2` · `.about-copy h2` |
| Couleur lecture | un seul `color: var(--ink)` mutualisé (titres, meta, filtres, footer credit, lightbox labels…) |
| Atelier | tokens locaux `--atelier-hint/ok/err/pad/max` ; surfaces via tokens site |

## Conflits retirés

- Déclarations `color` / `background: var(--paper)` répétées qui se battaient avec le body / entre sections
- Hardcodes lightbox stage `#1b1a17` → `--stage`
- Media query search `width: 100%` dupliquée (700px) déjà couverte par 900px
- Atelier : `#625f58` / `#4a5748` / `#6d3b32` → tokens atelier (visuel CMS inchangé)

Cache-bust `?v=20261104-cssmut`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Preview | `40c845f7` · https://40c845f7.galerie-vittet-preview.pages.dev/ |
| Prod (main) | `45702573` · https://galerie-vittet-preview.pages.dev/ |
| Alias preview | https://preview.galerie-vittet-preview.pages.dev/ |

## Vérif

- Tokens CDP : paper `#f5ede5` · ink-full `#2c261f` · ink = ink-lg = muted `#413c35` · stage `#1b1a17`
- Wordmark / MAÎTRES : `rgb(44, 38, 31)` · lecture unifiée `rgb(65, 60, 53)`
- Surfaces hero / viewport / collection / about = paper
- `#img-warm-wb` présent · cache-bust `cssmut`
- `GET /api/oeuvres` → 200 · 99 · pageSize 15 · functions OK
- Screenshots : `cssmut-header-desktop.png`, `cssmut-hero-desktop.png`, `cssmut-collection-desktop.png`, `cssmut-galerie-el.png`, `cssmut-header-mobile.png`, `cssmut-cdp.json`
