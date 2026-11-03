# Compte-rendu — header contact + footer minimal

Date : 3 novembre 2026.

## Changement

Nouveau chrome sticky en deux bandes :

1. **Bande contact** (`#contact` / `.header-contact`) : téléphones `+33` (≈21 px desktop), lien `Écrire à la galerie` (mailto), adresse quai Voltaire, horaires mar–sam 14h30–19h · sur rendez-vous.
2. **Bande marque** : wordmark VITTET, recherche, nav **La collection** / **La galerie** (lien Contact retiré — redondant).

Retiré :

- section mid-page `.visit` / ancien bloc contact sombre
- ligne footer adresse / horaires (`.footer-info`)
- ancienne topline « Galerie de peintures anciennes »

Footer minimal : wordmark + crédit « Site réalisé par Emmanuel Torregano » (mailto).

Hero : aucun « Une histoire de regard » ; récit inchangé dans `#galerie` (« La galerie »).

## Arbres

Source `galerie-vittet-atelier-cf` → `scripts/sync-trees.sh` → `galerie-vittet-pages` + `galerie-vittet-site`.

Cache-bust : `?v=20261103-hdrcontact` (front + atelier).

## Déploiement

| Cible | URL / id |
|---|---|
| Front production | https://galerie-vittet-preview.pages.dev/ |
| Prod deploy | `bcdea24f` (branche `main`) |
| Atelier | https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |
| Atelier deploy | `a6d8a6cf` (branche `atelier-kv-preview`) |

## Preuve

Live : header contact présent, `.visit` absent, footer sans adresse, phones `+33` / `tel:+33…`, mailto galerie, nav 2 liens, pas de « Une histoire de regard ».

Artefacts : `/opt/cursor/artifacts/hdrcontact-desktop-header.png`, `hdrcontact-desktop-footer.png`, `hdrcontact-mobile-header.png`, `hdrcontact-mobile-footer.png`, `hdrcontact-*-verify.json`.
