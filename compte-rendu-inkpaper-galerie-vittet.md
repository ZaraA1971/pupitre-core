# Compte-rendu — Papier = encre éclaircie (renforcé)

Date : 4 novembre 2026.

## Verdict déploiement

Oui, la 1ʳᵉ passe **était** déployée (`d7f51c90` / `4be06495`, `--paper` `#ede5db`, `?v=20261104-inkpaper`) — mais Δ RGB ≈ 6 vs l’ancien crème `#e8e2da` : **invisible**.

## Renfort (cette passe)

OKLCH sur `--ink-full` `#2c261f` : **H ≈ 71,4°**, **C ≈ 0,022**, **L ≈ 0,885** → fond encre éclaircie **visible**, toujours un papier de page clair.

| Token | Avant (live) | Après |
|---|---|---|
| `--paper` | `#ede5db` (ex-`#e8e2da`) | `#e3d7ca` |
| `--paper-lift` | `#f5eee6` | `#ede5db` |
| `--shade` | `#d6cec5` | `#cdc2b6` |
| `theme-color` | `#ede5db` | `#e3d7ca` |

Cache-bust `?v=20261104-inkpaper-b`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Preview | `dd93f7be` · https://dd93f7be.galerie-vittet-preview.pages.dev/ |
| Prod (main) | `936278d7` · https://galerie-vittet-preview.pages.dev/ |

## Preuve curl / CDP

```
theme-color: #e3d7ca
link: style.css?v=20261104-inkpaper-b
--paper: #e3d7ca
--ink-full: #2c261f
CDP bodyBg: rgb(227, 215, 202)
GET /api/oeuvres → 200 · 99
```

Artefacts : `inkpaper-b-desktop.png`, `inkpaper-b-curl.txt`, `inkpaper-b-cdp.json`, `inkpaper-b-verify.json`.
