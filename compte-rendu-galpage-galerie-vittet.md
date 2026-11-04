# Compte-rendu — texte `#galerie` centré page + photos latérales

Date : 4 novembre 2026.

## Problème

`auto · 240px · auto` + `justify-content: center` centrait le **bloc** triptyque, pas le texte. Comme la salle est plus large que la façade, « La galerie » dérivait à gauche avec un grand crème à droite.

## Approche

| Avant | Après |
|---|---|
| `auto · 240px · auto` + `justify-content: center` | `1fr · minmax(200px,240px) · 1fr` |
| Photos content-sized → bloc drift | Colonnes `fr` égales → colonne texte sur l’axe page |
| Pad `var(--page-pad)` (~36 px @1440) | Pad `max(12px, 1.2vw)` (~17 px) |
| Photos centrées dans leur colonne | Façade `flex-start` / salle `flex-end` (bords extérieurs) |
| `--gal-photo-h` max 252 px | max 288 px (salle remplit presque son `1fr`) |

Hauteurs égales, `object-fit: contain`, pas de crop. Mobile ≤980 : pile inchangée.

Cache-bust `?v=20261104-galpage`.

## Où

- Source : `/tmp/galerie-vittet-atelier-cf/` (+ `functions/`)
- Sync : `scripts/sync-trees.sh` → pages + site
- Durable : `/workspace/galerie-vittet/`

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod | `bad0f641` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://bad0f641.galerie-vittet-preview.pages.dev/#galerie |
| Preview | `a9903805` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `9bf1c0bc` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif @1440

| Mesure | Valeur |
|---|---|
| Grille | `558.7 · 240 · 558.7` |
| Centre texte − centre page | **0 px** |
| Ornement · − centre page | **0 px** |
| Blanc extérieur L / R | **17,3 / 17,3** (avant ~142 / 142) |
| Photos | façade 418×288 · salle 556×288 · contain · uncropped |
| `GET /api/oeuvres` | 200 · 99 (functions OK) |

Screenshots : `galpage-desktop.png`, `galpage-desktop-ornament.png`, `galpage-desktop-viewport.png`, `galpage-mobile.png`, `galpage-verify.json`.
