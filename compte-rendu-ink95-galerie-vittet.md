# Compte-rendu — densité d’encre typo 95 % (hors logo)

Date : 3 novembre 2026.

## Objectif

Réduire la densité de noir des polices à ~95 %, **sauf** le wordmark VITTET (plein encre).

## Tokens

| Token / sélecteur | Avant | Après |
|---|---|---|
| `--ink-full` (nouveau) | — | `#2c261f` |
| `--ink` (body / textes) | `#2c261f` | `#37312a` (= `mix(#2c261f 95%, white)`) |
| `.wordmark` `color` | `var(--ink)` | `var(--ink-full)` |

Cache-bust `?v=20261103-ink95`.

## Exception logo

`.wordmark` (header + footer, y compris sous-titre dans le wordmark) reste `#2c261f`. Adresse, contact, body, titres de section utilisent `--ink` à 95 %.

## Deploy (package cohérent + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `b9d31fe4` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://b9d31fe4.galerie-vittet-preview.pages.dev/ |
| Atelier | `2924550f` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- Live CSS : `--ink: #37312a` · `--ink-full: #2c261f`
- Computed : wordmark `rgb(44, 38, 31)` · body/adresse/contact `rgb(55, 49, 42)`
- `GET /api/oeuvres` → 200 · 100 œuvres (functions OK)
- Screenshots : `ink95-header-desktop(_crop).png`, `ink95-header-mobile(_crop).png`, `ink95-verify.json`
