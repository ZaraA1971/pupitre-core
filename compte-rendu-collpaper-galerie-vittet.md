# Compte-rendu — fond collection = papier

Date : 4 novembre 2026.

## Problème

Bande / halo gris plus foncé autour des previews de la collection (voile `.collection` + fond `--wall` des cartes), distinct du `--paper` du chrome.

## CSS

| Sélecteur | Avant | Après |
|---|---|---|
| `.collection` | `linear-gradient(… rgba(240,234,226,.52) → rgba(210,201,189,.56))` | `var(--paper)` |
| `.art-open` | `background: var(--wall)` | `background: var(--paper)` |

Hover (soulèvement `.art-preview`) inchangé. Cache-bust `?v=20261104-collpaper`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Preview | `255ec864` · https://255ec864.galerie-vittet-preview.pages.dev/ |
| Prod (main) | `0f0f529e` · https://galerie-vittet-preview.pages.dev/ |
| Alias preview | https://preview.galerie-vittet-preview.pages.dev/ |

Vérif live : `.collection` et `.art-open` → `rgb(232, 226, 218)` (`#e8e2da` = `--paper`) ; gutters / marges screenshot identiques ; `GET /api/oeuvres` 200 · 99 œuvres.
