# Compte-rendu — UX complète front Galerie Vittet

Date : 30 octobre 2026.

## URL

**https://galerie-vittet-preview.pages.dev/**

Déploiements Pages : `c42d3959` puis `6a1544b3` (projet `galerie-vittet-preview`).  
Sources : `/tmp/galerie-vittet-pages/` (+ miroirs site/atelier-cf front).  
Scaleway / DNS / atelier données : non touchés.

## Livré (10/10)

1. Légendes grille : artiste → titre → `support · dimensions` (API) ; note seulement en lightbox
2. Footer : marque · 21 quai Voltaire + mar–sam 14h30–19h · tél + mailto · Retour en haut
3. Hover vignettes : scale ~1.02 / fondu image + libellé « Voir » gold
4. Lightbox : Artiste · Titre · Technique/support · Dimensions · Note + CTA mailto titre prérempli + flèches
5. Onglets : compteurs `(n)` ; onglet à 0 masqué/désactivé ; soulignement gold 2px
6. Pagination : flèches + numéros (fenêtre ≤ 5) ; masquée si une seule page
7. Grille : 3 colonnes desktop, gap ~44px ; mobile 2 col + air
8. Nav sticky paper + bordure ; ancre active au scroll
9. Hero : clic → lightbox ; dots sous compteur ; fallback 1ʳᵉ œuvre collection si carousel=0
10. Skeleton `--wall` + min-height grille puis fade-in

## Note données

Seeds exposées : `support` / `dimensions` encore vides en API → 3ᵉ ligne grille absente tant que non renseignée ; la note longue s’affiche bien en lightbox.
