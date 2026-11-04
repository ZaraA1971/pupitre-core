# Compte-rendu — Harmonisation taux de gris des polices

Date : 4 novembre 2026.

## Objectif

Un seul taux de gris pour tout le texte de lecture sur `--paper` `#f5ede5` (inchangé). Hiérarchie = taille / graisse, pas des gris concurrents. Wordmark VITTET + MAÎTRES reste `--ink-full`.

## Tokens avant → après

| Token | Avant | Après | Rôle |
|---|---|---|---|
| `--paper` | `#f5ede5` | `#f5ede5` | fond (verrouillé) |
| `--ink-full` | `#2c261f` | `#2c261f` | wordmark only (100 %) |
| `--ink-lg` | `#413c35` (90 %) | `var(--ink)` → `#413c35` | alias — même taux |
| `--ink` | `#4c4741` (85 %) | `#413c35` | **seul gris lecture** (~90 %) |
| `--muted` | `#4c4741` (85 %) | `var(--ink)` → `#413c35` | alias — même taux |

Cache-bust `?v=20261104-inkharmo`.

## Mapping

- **Plein (`--ink-full`)** : `.wordmark` + MAÎTRES ANCIENS (header + footer).
- **Lecture unifiée (`--ink` / `--ink-lg` / `--muted`)** : titres, artistes, body, meta, téléphones, adresse, search, filtres, footer credit, lightbox — tous `#413c35`.
- Accents or (`--gold`) inchangés (eyebrows).

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Preview | `bbe09d6c` · https://bbe09d6c.galerie-vittet-preview.pages.dev/ |
| Prod (main) | `f602e7d4` · https://galerie-vittet-preview.pages.dev/ |
| Hash prod | https://f602e7d4.galerie-vittet-preview.pages.dev/ |

## Vérif

- Tokens computed : paper `#f5ede5` · ink-full `#2c261f` · ink = ink-lg = muted `#413c35`
- Wordmark / MAÎTRES : `rgb(44, 38, 31)` = full
- Adresse, téléphones, heures, « La collection », artistes, facts, filtres, search, footer : `rgb(65, 60, 53)` = unifié
- `GET /api/oeuvres` → 200 · 99 œuvres (functions OK)
- Screenshots : `inkharmo-header-desktop.png`, `inkharmo-collection-desktop.png`, `inkharmo-cdp.json`
