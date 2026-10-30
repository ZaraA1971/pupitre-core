# Compte-rendu — lightbox plein cadre + nav sticky

Date : 30 octobre 2026.

## URL

**https://galerie-vittet-preview.pages.dev/**

Déploiement Pages : `4c5d1fe9` (puis front CSS mobile) (projet `galerie-vittet-preview`).  
Sources : `/tmp/galerie-vittet-pages/` (+ miroirs `site` / `atelier-cf` front).  
Scaleway / DNS / atelier données : non touchés.

## Causes

1. **Lightbox** : `width: 100%` + `max-height` sur `.art-detail` forçait une boîte hors ratio ; l’image pouvait être tronquée / scrollée (`overflow: auto` sur le dialog) au lieu d’être entièrement visible en `contain`.
2. **Nav active** : `IntersectionObserver` ne regardait que les *entries changées* (mauvais onglet, clignotements, état collé). Pas de remise à zéro sur le hero, bas de page fragile.

## Correctifs

- Lightbox : dialog `overflow: hidden`, grille hauteur viewport, image `max-width/max-height: 100%` + `object-fit: contain` (grille + hero).
- Nav : scroll spy document (`scrollY` + offset header), un seul `is-active`, clear sur hero, forçage dernier onglet en bas de page, resync après clic / hash.

## Preuves

- Desktop / mobile : `object-fit: contain`, ratio image intact, `fitsPane`, maxUsage ≈ 98 % desktop.
- Onglets : collection → galerie → contact stables ; aucun multi-actif.
- Artefacts : `/opt/cursor/artifacts/live-lightbox-desktop.png`, `live-lightbox-mobile.png`, `live-nav-collection.png`, `live-nav-galerie.png`, `live-nav-contact.png`.
