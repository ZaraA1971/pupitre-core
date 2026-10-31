# Typographie œuvres — hiérarchie titre / artiste / technique

## Live
**https://galerie-vittet-preview.pages.dev/**

Déploiement Production : `11ac9dd7` (projet `galerie-vittet-preview`, branch `main`).  
Atelier preview : `0dd8eba3` → https://atelier-kv-preview.galerie-vittet-preview.pages.dev/

Sources : `/tmp/galerie-vittet-pages/` (+ miroirs `site` / `atelier-cf` front).  
Atelier UI conservée dans le paquet prod (copie de `/tmp/galerie-vittet-atelier-cf/atelier/`).

## Changement
Feedback : titre et ligne « Huile sur toile · 100 x 140 cm » trop similaires.

| Niveau | Rôle | Style |
|--------|------|--------|
| Primaire | Titre | Playfair Display 500 — grille 19px, lightbox 26px (22px mobile), hero 20px, encre |
| Secondaire | Artiste | DM Sans 400 — 13px grille / 15px lightbox, encre, tracking un peu ouvert |
| Tertiaire | Support · dimensions | DM Sans 400 — 11px grille / 12px lightbox, `--muted`, tracking plus ouvert |

Fichiers : `style.css` (`.art-meta`, `.hero-title` / `.hero-artist`, `.lightbox-*`), `main.js` (ordre titre → artiste → facts, classe `art-artist`).

## Vérif
Œuvre cible : *Les préparatifs du repas* / Abraham LEROY / Huile sur toile · 100 x 140 cm.  
Captures : `/opt/cursor/artifacts/typo-hierarchy-caption-desktop.png`, `typo-hierarchy-card-desktop.png`, `typo-hierarchy-lightbox-desktop.png`, variantes mobile.
