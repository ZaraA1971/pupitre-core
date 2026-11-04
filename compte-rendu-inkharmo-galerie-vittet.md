# Compte-rendu — Harmonisation taux de gris des polices

Date : 4 novembre 2026.

## Objectif

Un seul taux de gris pour tout le texte de lecture sur `--paper` `#f5ede5` (inchangé). Hiérarchie = taille / graisse, pas des gris concurrents. Wordmark VITTET + MAÎTRES reste `--ink-full`.

## Tokens avant → après

| Token | Avant | Après | Rôle |
|---|---|---|---|
| `--paper` | `#f5ede5` | `#f5ede5` | fond (verrouillé) |
| `--ink-full` | `#2c261f` | `#2c261f` | wordmark only (100 %) |
| `--ink-lg` | `#413c35` (90 %) | `var(--ink)` | alias — même taux |
| `--ink` | `#4c4741` (85 %) | `#413c35` | **seul gris lecture** (~90 %) |
| `--muted` | `#4c4741` (85 %) | `var(--ink)` | alias — même taux |

Cache-bust `?v=20261104-inkharmo`.

## Mapping

- **Plein (`--ink-full`)** : `.wordmark` + MAÎTRES ANCIENS (header + footer).
- **Lecture unifiée (`--ink` / `--ink-lg` / `--muted`)** : titres, artistes, body, meta, téléphones, adresse, search, filtres, footer credit, lightbox — tous le même gris `#413c35`.
