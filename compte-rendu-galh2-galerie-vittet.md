# Compte-rendu — h2 « La galerie » aligné au haut des photos

Date : 5 novembre 2026.

## Approche

`margin-top: calc(-1 * (var(--type-xs) * 1.2 + 6px))` sur `.about-copy` : remonte la colonne pour que le **haut du h2** coïncide avec le haut des photos ; « Depuis 1988 » reste ~20 px au-dessus.

Photos ~351 px et pad = gap **inchangés**.

Cache-bust `?v=20261105-galh2`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `a279bccb` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://a279bccb.galerie-vittet-preview.pages.dev/#galerie |
| Preview | `66ccddcf` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `70b0f2d4` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif @1440

- h2 − photo top = **0 px**
- eyebrow lift = **20,4 px** au-dessus (gap 6 px sous l’eyebrow)
- photo H 351,3 · pad = gap 27,4 · API 99
- Screenshots : `galh2-desktop.png`, `galh2-verify.json`
