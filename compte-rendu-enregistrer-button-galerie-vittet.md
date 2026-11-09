# Compte-rendu — bouton atelier « Enregistrer » Galerie Vittet

Date : 9 novembre 2026.

## Objectif

Renommer le bouton atelier de sauvegarde des légendes : **Enregistrer légendes → Enregistrer**.

## Source

- Commit `6f78836` (`cursor/mobile-tableaux-d186`)
- Cache-bust `?v=20261109-clean10` (style + atelier.css + atelier.js)
- `save.textContent = "Enregistrer"` dans `atelier/atelier.js`
- Libellé HTML `#publish-button` : `Enregistrer`

## Deploy (package + `functions/`) — Compte Emmanuel `69008766…` · commit `6f78836`

Sync : `galerie-vittet/scripts/sync-trees.sh` → `/tmp/galerie-vittet-pages`.

| Cible | Id / URL |
|---|---|
| Prod (main) | `46f47d62` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://46f47d62.galerie-vittet-preview.pages.dev/ |
| Preview | `88876a03` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `500d0c8a` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif

| Check | Résultat |
|---|---|
| Cache-bust `clean10` + `textContent = "Enregistrer"` | présents (repo + `/tmp/galerie-vittet-pages`) |
| Chaîne `Enregistrer légendes` | absente du package pages |
| Alias `atelier-kv-preview` | pointe sur `500d0c8a` |
| `GET /atelier/` | 401 (Basic Auth) |
| `GET /api/oeuvres` | 200 · JSON · **102** œuvres |
