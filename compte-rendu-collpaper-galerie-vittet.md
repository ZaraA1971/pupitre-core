# Compte-rendu — fond collection = papier

Date : 4 novembre 2026.

## Problème

Bande / halo gris plus foncé autour des previews de la collection (voile `.collection` + fond `--wall` des cartes), distinct du `--paper` du chrome.

## CSS

| Sélecteur | Avant | Après |
|---|---|---|
| `.collection` | `linear-gradient(… rgba(240,234,226,.52) → rgba(210,201,189,.56))` | `var(--paper)` |
| `.art-open` | `background: var(--wall)` | `background: var(--paper)` |

Hover (soulèvement `.art-preview`) inchangé. Cache-bust `?v=20261104-collpaper`.
