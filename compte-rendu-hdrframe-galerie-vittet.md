# Compte-rendu — padding header + cadres légers

Date : 4 novembre 2026.

## Objectif

1. Réduire l’espace vertical haut/bas du chrome (écriture trop loin des bords).
2. Ajouter des cadres légers (filet `--line`) autour des blocs marque (gauche) et contact (droite).

Conservé : bas contact = bas adresse ; MAÎTRES centré sous VITTET ; paper `#f5ede5` ; encre unifiée ; recherche à droite des onglets collection.

## CSS

```css
.header {
  min-height: 0;
  padding: 10px var(--page-pad) 12px; /* était 22px / 30px */
}

.header-brand,
.header-contact {
  border: 1px solid var(--line);
  padding: 10px 14px 12px;
}
```

Mobile ≤900 / ≤700 : outer `8px / 10px` ; frame padding `8px 12px 10px`.

Cache-bust `?v=20261104-hdrframe`.

## Deploy (package + `functions/`)

| Cible | Id / URL |
|---|---|
| Prod (main) | `7a013604` · https://galerie-vittet-preview.pages.dev/ |
| Hash | https://7a013604.galerie-vittet-preview.pages.dev/ |
| Preview | `826d0fa7` · https://preview.galerie-vittet-preview.pages.dev/ |
| Atelier | `aaab22a5` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/ |

## Vérif @1440

| Mesure | Valeur |
|---|---|
| Outer pad top / bottom | **10 / 13** px (était 22 / 30) |
| placeBottom / hoursBottom | 202.56 / 202.56 · **Δ 0** |
| Frame bottoms | **Δ 0** |
| Centre VITTET / MAÎTRES | **Δ 0** |
| Borders | `1px solid` `--line` `#c1bab0` |
| Paper / ink | `#f5ede5` / `#413c35` |
| `GET /api/oeuvres` | 200 · **99** · pageSize 15 · functions OK |

Screenshots : `hdrframe-desktop-header(_guide).png`, `hdrframe-desktop-top.png`, `hdrframe-mobile-header.png`, `hdrframe-prod-header.png`.
