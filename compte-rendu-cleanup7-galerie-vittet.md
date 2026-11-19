# Compte-rendu — cleanup7 Galerie Vittet

Date : 5 novembre 2026.

## Objectif

Nettoyage prudent après loupe **maxZoom natif**. Conservé : entrée loupe **100 %**, jauge jusqu’au coeff. natif par image, idle 3 s, upload atelier unifié EXIF/IPTC, layout `#galerie`, header, tokens paper/ink.

## Mort retiré

- `LOUPE_ZOOM_MAX = 1.5` / markup `max`·`aria-valuemax` **150** : déjà absents (purgés par loupemax) — confirmé sur les 3 arbres
- Export mort `activityAt()` dans `functions/_shared/works.js` (jamais importé ; copie atelier conservée pour le tri)

## Sync

`/tmp/galerie-vittet-atelier-cf/` → pages → site front → `galerie-vittet/`. Gate `functions/images/ajouts` conservée.

Cache-bust `?v=20261105-clean7`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `0972b5eb` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://0972b5eb.galerie-vittet-preview.pages.dev/ |
| Preview | `2413e619` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `31a91e1c` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| `GET /api/oeuvres` | 200 · JSON · **103** œuvres · functions OK |
| Cache-bust | `clean7` sur style/main |
| `LOUPE_ZOOM_MAX` | absent |
| Loupe van Loo | original 5482×7823 · jauge max **884 %** · start **100 %** |
| `node --check` | main.js + atelier.js OK |
