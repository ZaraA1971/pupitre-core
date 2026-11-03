# Compte-rendu — textes petits / muted plus grands et plus noirs

Date : 3 novembre 2026.

## Variables

| Token | Avant | Après |
|---|---|---|
| `--muted` | `#6f6b64` | `#3f3a33` (proche `--ink` `#2c261f`) |
| `--type-xs` | — | `12px` (ex. 10–11) |
| `--type-sm` | — | `13px` (ex. 11–12) |
| `--type-meta` | — | `14px` (ex. 13) |

Gris hardcodés (`#7a756c`, `#908b82`, `#9a9284`, `#706c63`, `#817d74`, `#69655d`, `#9a958c`, …) → `var(--muted)`.

## Tailles (cascade)

Header mail / adresse · search · filters · captions `.art-facts` · footer crédit · lightbox labels/support · galerie copy : +1–2px via tokens.  
Hiérarchie préservée : auteur 22px ink ; wordmark 56px.

## Arbres / deploy

Source `galerie-vittet-atelier-cf` → sync pages + site.  
Cache-bust `?v=20261103-typeink`.

| Cible | URL / id |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/ |
| Deploy | https://5984d827.galerie-vittet-preview.pages.dev/ |

Artefacts : `typeink-header.png`, `typeink-collection-caption.png`, `typeink-footer.png`, `typeink-verify.json`.
