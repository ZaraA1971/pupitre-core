# Cleanup9 — Galerie Vittet (2026-11-25)

Nettoyage prudent après saveflags1 / lbwhite1, sans changer le comportement.

## Retiré
- `readEditorFields` (atelier) — mort depuis le split Enregistrer / coches auto
- `.wrangler/` — ignoré via `.gitignore` (artefact local Wrangler)

## Unifié
- Cache-bust front + atelier : `?v=20261125-clean9`
  - `style.css`, `main.js`, `atelier.css`, `atelier.js`
  - lien Atelier vers `../style.css` (plus de `atelierpag2` périmé)

## Conservé
- Fond lightbox blanc (`--lightbox-well: #ffffff`)
- Enregistrer = texte ; coches = PATCH immédiat
- Recadrage via Recadrer / activation Carousel

## Déploiement
- Compte Emmanuel · `sync-trees` · `galerie-vittet-preview` branches `main` + `preview` + `atelier-kv-preview`
