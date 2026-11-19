# Compte-rendu — cleanup6 Galerie Vittet

Date : 5 novembre 2026.

## Objectif

Nettoyage prudent + sync du package durable. Conservé : loupe jauge **100–150 %** + idle 3 s, upload atelier unifié EXIF/IPTC, layout `#galerie`, header, tokens paper/ink.

## Mort retiré

- Atelier dual **quick-import** (git package encore sur l’ancienne voie) → sync vers picker unique fichiers/dossier + EXIF (branche unify, y compris correctifs FileList / dates)
- `categoryLabel()` jamais appelée
- Alias CSS inutilisé `--ink-lg`

## Sync

`galerie-vittet/` ↔ `/tmp/galerie-vittet-atelier-cf/` ↔ pages ↔ site front. Ghost `site/images/ajouts/preview` prune. Functions `images/ajouts` conservée.

Cache-bust `?v=20261105-clean6`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `09fe5448` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://09fe5448.galerie-vittet-preview.pages.dev/ |
| Preview | `46d8db33` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `aec219ce` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| `GET /api/oeuvres` | 200 · JSON · **103** œuvres · functions OK |
| Cache-bust | `clean6` sur style/main |
| Loupe markup | `max` / `aria-valuemax` **150** |
| Atelier package | `pick-menu` + exifr · pas de `quick-` |
| `node --check` | main.js + atelier.js OK |
