# Compte-rendu — Fond éclairci (pas la fonte)

Date : 4 novembre 2026.

## Correction

« éclaircir la couleur de fond pas de font » — seules les surfaces papier changent ; **aucun** token d’encre texte modifié.

| Token | Rôle | Valeur |
|---|---|---|
| `--paper` | fond page | `#e3d7ca` → **`#f5ede5`** (OKLCH H≈71.4°, C≈0.014, L≈0.95) |
| `--paper-lift` | chrome wash | `#f9f4ee` |
| `--shade` | skeleton only | `#ded6cc` |
| `theme-color` | meta | `#f5ede5` |
| `--ink-full` / `--ink-lg` / `--ink` / `--muted` | texte | **inchangés** `#2c261f` / `#413c35` / `#4c4741` / `#4c4741` |

Cache-bust `?v=20261104-paperlight`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Preview | `3741b1f5` · https://3741b1f5.galerie-vittet-preview.pages.dev/ |
| Prod (main) | `7a37c0f9` · https://galerie-vittet-preview.pages.dev/ |

## Preuve

- Curl CSS : `--paper: #f5ede5` · `--ink-full: #2c261f`
- CDP : `bodyBg rgb(245,237,229)` · ink tokens inchangés
- API `/api/oeuvres` 200 · 99

Artefacts : `paperlight-desktop.png`, `paperlight-curl.txt`, `paperlight-cdp.json`.
