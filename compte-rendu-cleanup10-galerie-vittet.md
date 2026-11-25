# Cleanup10 — Galerie Vittet (2026-11-25)

Nettoyage prudent après heropend1, sans changer le comportement visible.

## Retiré
- Animation `is-swap` / `captionTimer` (légendes photo déjà `display: none`)
- Flag `heroReady` redondant avec `heroSynced`
- Styles photo pour `.site-hero .hero-title/.hero-artist` (masqués)
- Classe HTML `hero-index-sep` inutile

## Conservé
- Hero pending → sync unique après `/api/oeuvres`
- Fond lightbox blanc, saveflags Atelier
- Tokens / structure CSS (tour général prévu ensuite)

## Cache-bust
- Front `?v=20261125-clean10`
