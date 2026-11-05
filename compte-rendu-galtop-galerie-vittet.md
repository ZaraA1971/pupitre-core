# Compte-rendu — texte `#galerie` aligné en haut des photos

Date : 5 novembre 2026.

## CSS

| Avant | Après |
|---|---|
| `align-items: center` | `align-items: start` |
| copy `top: 50%` + `translate(-50%, -50%)` | `top: 0` + `translateX(-50%)` |
| copy `justify-content: center` · pad 8px top | `flex-start` · pad top 0 |

Photos ~351 px et pad = gap **inchangés**.

Cache-bust `?v=20261104-galtop`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `ce67e74c` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://ce67e74c.galerie-vittet-preview.pages.dev/#galerie |
| Preview | `8d68821a` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `7afbbafa` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif @1440

- Top Δ (eyebrow − photo) = **0 px** · texte Δ X = **0** · photo H 351,3 · pad = gap 27,4
- API 99 · Screenshots : `galtop-desktop.png`, `galtop-verify.json`
