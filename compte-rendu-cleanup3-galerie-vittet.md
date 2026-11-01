# Cleanup 3 — recherche unifiée (Galerie Vittet)

## URLs

| Surface | URL |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Deploy main | https://914f35ba.galerie-vittet-preview.pages.dev |
| Atelier preview | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Deploy atelier | https://6ee9e695.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261101-cleanup3`.

## Retiré / unifié

- `isSearchHash` + `parseSearchQuery` → `readSearchRoute()` (`{ active, query }`)
- `softTokenVariants` → `tokenVariants` (même soft-fold gh→g + ue↔eu)
- Fermetures lightbox recherche dupliquées → `closeSearchLightbox()`
- Sync input header → `syncSearchInput()` ; listeners → `bindSiteSearch()`
- `navigateSearch` : défaut `scroll: false`, plus de ternaire no-op sur replace
- Commentaire CSS lightbox filter (déjà aligné `:root` 1.06 / 1.03)

## Conservé

Soft-fold + debounce 200 ms instantané ; submit Enter (scroll) ; `#recherche?q=` ; tagline personnel ; typo auteur ; loupe ; images web ; hover peinture ; carousel ; pas de CTA Demander en fin de collection ; nav dédoublonnée ; export atelier ; API same-origin.

## Sync

Source `/tmp/galerie-vittet-atelier-cf/` → `scripts/sync-trees.sh` → pages + site (hashes HTML/CSS/JS identiques).

## Preuve

`bruegel` / `brue` → 3 hits ; lightbox loupe + filter `contrast(1.06) saturate(1.03)` ; collection OK.

Artefacts : `/opt/cursor/artifacts/cleanup3-*.png`, `cleanup3-verify.json`.
