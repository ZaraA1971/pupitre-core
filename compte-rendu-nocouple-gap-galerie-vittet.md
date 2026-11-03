# Compte-rendu — retrait photo couple + écart #galerie

Date : 3 novembre 2026.

## Où

Section `#galerie` (`.about-photos`) — pas le footer slim (wordmark + crédit uniquement ; 0 image).

Retrait de `images/galeristes.webp` (« Claude Vittet et son épouse… »). Conservés : façade + salle.

## Écart (dimensions inchangées)

| | Avant | Après |
|---|---|---|
| Photos | 3 (façade, salle, couple) | 2 (façade, salle) |
| Gap | **14 px** | **≈210 px** (couple track + 2 anciens gutters) |
| Façade (1440) | 359,8 × 247,7 | 359,8 × 247,7 (Δ0) |
| Salle (1440) | 478,6 × 247,7 | 478,6 × 247,7 (Δ0) |

CSS : grille 2 colonnes `1.4525fr / 1.9321fr` ; `gap: calc(28px + 0.7333/4.1179 × (100% − 28px))`. Mobile : stack 1 col, gap 14 px.

Cache-bust `?v=20261103-nocouple`.

## Deploy

Source `galerie-vittet-atelier-cf` → sync pages + site.

| Cible | URL / id |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/ |
| Prod | `f69eebd0` (main) |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ · `02c4f355` |

Artefacts : `nocouple-before-galerie.png`, `nocouple-live-galerie.png`, `nocouple-live-galerie-mobile.png`, `nocouple-live-footer.png`, `nocouple-verify.json`.
