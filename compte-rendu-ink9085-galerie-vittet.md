# Compte-rendu — encre typo 90 % / 85 % (hors logo)

Date : 3 novembre 2026.

## Objectif

Hiérarchie d’encre front Galerie Vittet :

1. **Ne pas toucher** VITTET + MAÎTRES ANCIENS (plein encre).
2. **Grandes polices** → 90 % de noir.
3. **Autres / petites** → 85 % de noir.

## Tokens

| Token | Valeur | Mix |
|---|---|---|
| `--ink-full` | `#2c261f` | 100 % (inchangé) |
| `--ink-lg` (nouveau) | `#413c35` | `mix(#2c261f 90%, white)` |
| `--ink` | `#4c4741` | `mix(#2c261f 85%, white)` |
| `--muted` | `#4c4741` | même palier 85 % |

Cache-bust `?v=20261103-ink9085`.

## Mapping

- **Plein (`--ink-full`)** : `.wordmark` + span MAÎTRES ANCIENS (header + footer).
- **90 % (`--ink-lg`)** : `.section-heading h2`, `.about-copy h2`, `.art-meta .art-artist`, `.hero-artist`, `.lightbox-artist`, `.header-phones a`, `.search-status.is-empty`.
- **85 % (`--ink` / `--muted`)** : body, adresse, mail, search, filtres, titres d’œuvre, facts, footer credit, copy galerie, etc.

## Deploy (package cohérent + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `92ff6313` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://92ff6313.galerie-vittet-preview.pages.dev/ |
| Atelier | `e4adffe0` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

- Computed wordmark / MAÎTRES : `rgb(44, 38, 31)` = full
- Computed La collection / artistes / téléphones : `rgb(65, 60, 53)` = 90 %
- Computed body / adresse / facts : `rgb(76, 71, 65)` = 85 %
- `GET /api/oeuvres` → 200 · 99 œuvres (functions OK)
- Screenshots : `ink9085-header-desktop(_crop).png`, `ink9085-collection-desktop.png`, `ink9085-collection-heading_crop.png`, `ink9085-verify.json`
