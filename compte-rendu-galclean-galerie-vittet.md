# Compte-rendu — nettoyage code #galerie

## Retiré / simplifié

**HTML**
- Wrappers inutiles `.about-image` / `--facade` / `--salle` / `--couple`
- `.about-frame` → `.about-places` (plus de cadre)
- Portrait : `<img class="about-couple">` direct

**CSS**
- Bordures / outline / padding / fond du faux cadre
- Règles mortes d’itérations (framesm, leftfill, dipleft, max-width 240, `text-justify`)
- Mobile : overrides réduits à pile + `--places-h`
- Une formule `--places-h` + colonnes `1.4525fr / 1.9321fr`

**JS** : inchangé (spy / reveal sur `.about` déjà OK)

## Design conservé

Diptyque façade|salle sans cadre, couple à ⅔, tops alignés, texte justifié, séparation Contact.

## Parité (desktop 1440)

Δ ≤ 0,1 px vs déploiement `nofrm23` · ratio couple **0.666** · tops spread **0**

## URLs

| Surface | URL |
|---|---|
| Front | https://galerie-vittet-preview.pages.dev/#galerie |
| Prod | https://8c3d5c4e.galerie-vittet-preview.pages.dev |
| Atelier | https://f0fe2ab1.galerie-vittet-preview.pages.dev |

Cache-bust : `?v=20261102-galclean`
