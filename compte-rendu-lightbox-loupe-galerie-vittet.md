# Compte-rendu — lightbox plus grande + loupe sans colonne

Date : 3 novembre 2026.

## Layout

| Mode | Règle |
|---|---|
| Dialog | Quasi plein écran : `100vw/dvh − 8px` (mobile `− 6px`) ; plus de plafond 1320×960 |
| Défaut | Grille photo + fiche ; CTA « Demander cette œuvre » dans la colonne droite |
| Loupe | Classe `.lightbox.is-loupe` : fiche masquée (`display: none`), photo seule en pleine largeur |

## Résolution native

`applyNativeSizeCap()` pose `max-width/max-height: min(100%, naturalWidth/Height px)` — web et original. Aucun `scale` > 1 ; plus d’upscale loupe ×2,25.

## Conservé

Backdrop quasi noir · loupe charge l’original · `filter: var(--img-enhance)` · Escape / Quitter sort de la loupe (fiche + CTA reviennent) · Fermer / Escape ferment la lightbox.

## Arbres / deploy

Source `galerie-vittet-atelier-cf` → sync `pages` + `site`.  
Cache-bust `?v=20261103-lbloupe`.

| Cible | URL / id |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/ |
| Deploy | https://1bdef92d.galerie-vittet-preview.pages.dev/ |

## Vérif (1440×900)

- Marges dialog : 8 px.
- Portrait : fiche absente en loupe ; display ≤ natif (original 6598×7544).
- Paysage : 1096×612 → **1424×795** en loupe (original 8153×4551), toujours ≤ natif.

Artefacts : `lightbox-loupe-default.png`, `lightbox-loupe-mode.png`, `lightbox-loupe-landscape-default.png`, `lightbox-loupe-landscape-mode.png`, `lightbox-loupe-verify.json`.
