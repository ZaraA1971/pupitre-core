# Transfert Galerie Vittet → compte Cloudflare dédié

**Statut : bloqué — attente API token du compte Vittet**

## Lbmini1 — lightbox miniatures = taille grille (2026-11-27)

- Plus de cm→px « taille réelle » pour les miniatures
- Soft + aspect comme la grille (`--phys-soft`)
- Cache-bust `?v=20261127-lbmini1`
- Compte Emmanuel · sync-trees · deploy main `081ed95e` · preview `e49efb84` · atelier `04d3ec37`
- Vérif : miniature lightbox `is-true-size=false`, soft 0.9
- Prod https://galerie-vittet-preview.pages.dev/

## Mode d’emploi Atelier (2026-11-26)

- `galerie-vittet/MODE-EMPLOI-ATELIER.md` — guide simple pour l’utilisateur quotidien
- Lien atelier + gestes : ajout, coches, Enregistrer, Remplacer, recadrage, ordre, PDF

## Aboutnop1 — galerie sans portrait (essai) (2026-11-25)

- Retrait figure Claude ; texte seul + façade/salle
- Cache-bust `?v=20261125-aboutnop1`
- Compte Emmanuel · sync-trees · deploy

## Aboutlay3 — portrait galerie + écart photos (2026-11-25)

- Portrait float, hauteur ~texte − 2 lignes (wrap du 3ᵉ § dessous)
- Écart façade/salle élargi (`--gal-photo-gap` ~64–112px)
- Cache-bust `?v=20261125-aboutlay3`
- Compte Emmanuel · sync-trees · deploy main `c61e68d8` · preview `6e3fb3b1` · atelier `1b15f081`
- Prod https://galerie-vittet-preview.pages.dev/

## Csstour1 — tour CSS P2 + fit hero fenêtre (2026-11-25)

- Carte de sections A–K dans `style.css` (tokens inchangés)
- Media crop carousel 700px fusionné dans le bloc mobile principal
- Sélecteurs carousel-crop simplifiés
- `fitHeroWindow` = active ±1 (aligné hydrate)
- Filtres img conservés (coût << images)
- Cache-bust `?v=20261125-csstour1`
- Compte Emmanuel · sync-trees · deploy main `8a57546f` · preview `0906cdbd` · atelier `e677c074`
- Vérif desktop/mobile hero + collection OK
- Prod https://galerie-vittet-preview.pages.dev/

## Fontsapi1 — fonts self-host + cache API (2026-11-25)

- Self-host DM Sans + Playfair (latin/latin-ext woff2, ~95 Ko) — plus d’appel Google Fonts
- Preload fonts + `GET /api/oeuvres` ; fetch `credentials:omit`
- Cache edge API : s-maxage=300 + stale-while-revalidate=600
- Cache-bust `?v=20261125-fontsapi1`
- Compte Emmanuel · sync-trees · deploy main `f983b64c` · preview `1fa690e8` · atelier `2f57d83f`
- Vérif : 0 req Google Fonts ; woff2 locaux ; familles Playfair/DM Sans OK
- Prod https://galerie-vittet-preview.pages.dev/

## Webpcap1 — WebP + budgets poids dérivés (2026-11-25)

- Web max edge 1600, qualité ~0.78, cible ~220 Ko (boucle qualité/edge)
- Carousel crop max 1680, cible ~200 Ko
- Preview cible ~90 Ko
- Backfill script → WebP (plus JPEG forcé)
- Cache-bust atelier `?v=20261125-webpcap1`
- Compte Emmanuel · sync-trees · deploy main `237b1eb9` · preview `da0fd4a1` · atelier `30576619`
- Backfill carousel `--force` : 11/11 WebP, total ~2,1 Mo (~192 Ko/slide)
- Prod https://galerie-vittet-preview.pages.dev/

## Herolazy1 — hero charge active + voisines seulement (2026-11-25)

- `data-src` + hydrate au `showHero` (loading=lazy inefficace en absolute)
- Fenêtre : slide active ±1 (wrap)
- Cache-bust `?v=20261125-herolazy1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview

## Cleanup10 — mort légendes hero + cache (2026-11-25)

- Retrait is-swap / heroReady / styles titres photo masqués
- Cache-bust `?v=20261125-clean10`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Plan perf : voir canvas / compte-rendu optimisation

## Heropend1 — carousel sans flash 01–04 (2026-11-25)

- Plus de 4 slides HTML statiques ni `showHero(0)` avant l’API
- Cadre `--stage` en attendant `/api/oeuvres` (`hero-stage.is-pending`)
- Un seul démarrage après `syncHeroFromWorks`
- Cache-bust `?v=20261125-heropend1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview

## Cleanup9 — mort saveflags + cache unifié (2026-11-25)

- Retrait `readEditorFields` (inutilisé)
- `.wrangler/` dans `.gitignore`
- Cache-bust unifié `?v=20261125-clean9` (front + atelier)
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Puis unification git `main` ← branche mobile-tableaux

## Lbwhite1 — fond lightbox blanc (2026-11-25)

- `--lightbox-well: #ffffff` (plus de blanc cassé `--paper`)
- Cache-bust front `?v=20261125-lbwhite1`
- Compte Emmanuel · sync-trees · deploy preview + **main/production** (+ atelier-kv-preview)

## Saveflags1 — Enregistrer = texte ; coches immédiates (2026-11-25)

- Enregistrer ne touche plus aux coches ni au recadrage carousel
- Peinture/miniature/aquarelle, Exposée, Carousel : PATCH immédiat
- Recadrage reste via le bouton Recadrer / à l’activation Carousel
- Cache-bust atelier `?v=20261125-saveflags1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview

## Aboutvign2 — vignette gauche magazine + photos taille d’origine (2026-11-25)

- Vignette Claude sous « La galerie », texte à droite
- Façade/salle : même hauteur qu’avant (~405 px), gap un peu resserré
- Cache-bust `?v=20261125-aboutvign2`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `87a2ee79` · https://galerie-vittet-preview.pages.dev/


## Aboutvign1 — portrait vignette + paire façade/salle (2026-11-25)

- Portrait Claude = vignette à droite du texte « La galerie »
- Façade + salle centrées en dessous, gap serré (~28 px)
- Cache-bust `?v=20261125-aboutvign1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `dce33440` · preview `d0ac6f47` · atelier `627cd71d` · https://galerie-vittet-preview.pages.dev/

## Imgreplace3 — dirty Enregistrer + cache Remplacer (2026-11-25)

- Cause « Bibliothèque indisponible » : `wireSaveDirtyState` avant `item.append` → lecture `exposed` null
- Enregistrer grisé (opacity 0,45) sans changement ; actif dès `input`/`change` sur le cartouche
- Front : `?v=updated_at` (espaces → `T`) sur preview/web/original ; TTL ajouts 60 s
- Cache-bust atelier `?v=20261125-imgreplace3` (front reste `imgreplace2`)
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `f6d37fcc` · preview `f28eb1a3` · atelier `80add77e` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/

## Imgreplace1 — Remplacer image dans le cartouche Atelier (2026-11-25)

- Bouton **Remplacer** sous la miniature bibliothèque (ajouts KV)
- `POST /atelier/api/oeuvres/:id/image` : original + web + vignette ; métadonnées gardées ; crop carousel invalidé
- Cache-bust atelier `?v=20261125-imgreplace1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `20c128e7` · preview `8508e17b` · atelier `ab1e9342` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/

## Physclean2 — nettoyage helpers phys (2026-11-24)

- Réordre parse / soft log / physBox ; plancher dans `softSizeScale` ; commentaire mobile 92vw/640
- Comportement inchangé (guides soft log + true-size + légendes)
- Cache-bust `?v=20261124-physclean2`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `9e247f2a` · preview `25c87125` · atelier `f3bbcab1` · https://galerie-vittet-preview.pages.dev/

## Metacen1 — légendes centrées, texte à gauche (2026-11-24)

- `.art-meta` : `width: fit-content; margin-inline: auto; text-align: left`
- Cache-bust `?v=20261124-metacen1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `4053e827` · preview `e23d781b` · atelier `e235e0a8` · https://galerie-vittet-preview.pages.dev/

## Physlog1 — soft log adouci pour &lt;16 cm (2026-11-24)

- soft = ln(1+k·cm)/ln(1+k·ref), k=0.8, ref=24, plancher 90 %
- Ex. Philippe soft≈0,93 (était 0,79) ; Ø10,5 / 12,5 → 0,90
- Cache-bust `?v=20261124-physlog1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `76a5119c` · preview `4935ea83` · atelier `374d600a` · https://galerie-vittet-preview.pages.dev/

## Physgrid1 — grille quasi pleine taille (2026-11-24)

- Remplacé par physabs1 (incohérences portrait/paysage)

## Taille2 — aperçu inch cm→in seulement (2026-11-23)

- Saisie cm uniquement ; retrait du convertisseur inch → cm
- Aperçu `≈ … in` conservé
- Cache-bust `?v=20261123-taille2`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `0d25a5d4` · preview `160788d3` · atelier `2af1e076` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/

## Taille1 — champ taille Atelier normé + inch (2026-11-23)

- Éditeur H×L cm (cadre optionnel) ou diamètre ; canon FR enregistré
- Aperçu inch live (+ convertisseur inverse retiré en taille2)
- Cache-bust `?v=20261123-taille1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `3337d4d9` · preview `a0f70952` · atelier `366a38e2` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/

## Physreal1 — lightbox taille réelle des petites (2026-11-23)

- Petites (grand côté `< 30 cm`) : cm Atelier → px écran (`1cm` CSS mesuré)
- Grandes : échelle relative inchangée ; loupe plein puits
- Cache-bust `?v=20261123-physreal1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `4469267e` · preview `5d304eb8` · atelier `f5b6c9f1` · https://galerie-vittet-preview.pages.dev/

## Physclean1 — nettoyage code échelle physique (2026-11-23)

- Mort retiré : `physicalSizeScale`, `--size-scale`, wrappers CSS token
- Helpers unifiés (`cssNum`, `setPhysCss`) ; parse lightbox une seule fois
- Comportement inchangé (avec cadre, log, loupe 120 % / 180 %)
- Cache-bust `?v=20261123-physclean1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `97dbc38f` · preview `9ac12b13` · atelier `6e62c2d7` · https://galerie-vittet-preview.pages.dev/

## Crop169 — cadre carousel 16:9 (2026-11-21)

- Cause : crop atelier en 16:10 alors que le hero plein écran est souvent ~16:9 → bandes noires latérales (contain)
- Fix : hero desktop verrouillé 16:9 ; atelier `CAROUSEL_AR = 16/9` ; contain si crop≈stage, sinon cover (vieux 16:10 / mobile)
- Cache-bust `?v=20261121-crop169`
- Prod `771009a9` · preview `93c82893` · atelier `2fbe303c`
- **À faire** : re-Valider les Recadré existants en 16:9 pour un affichage 1:1 exact

## Lbwell — fond lightbox blanc cassé (2026-11-21)

- Puits image lightbox : `--lightbox-well` (blanc légèrement cassé) à la place de `--stage` sombre
- Cache-bust `?v=20261121-lbwell2`
- Prod `7b90d25e` · preview `22d2923b` · atelier `72b71573` (lbwell2 = --paper) · https://galerie-vittet-preview.pages.dev/

## Navsec — sections en header (2026-11-21)

- Menus Peintures / Miniatures / Aquarelles de J. V. Nicolle : retirés sous le carousel, placés en haut à droite à la place de Collection
- Galerie + UK inchangés ; recherche reste dans la collection
- Cache-bust `?v=20261121-navsec`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `92c942e4` · preview `3e4af5b8` · atelier `7f4bf930` · https://galerie-vittet-preview.pages.dev/


## Cropexact2 — crop carousel 1:1 sans re-zoom CSS (2026-11-19)

- Cause : `.hero-slide img { object-fit: cover; width/height: 100% }` re-coupait le bitmap atelier
- Fix : slides `data-carousel-crop` → `contain` (CSS + inline) ; figure marquée aussi ; cadre atelier fixe 16:10
- Cache-bust `?v=20261119-cropexact2`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `2be6a96f` · preview `577b5a7d` · atelier `94b307fd` · https://galerie-vittet-preview.pages.dev/

## Cropfill — carousel sans bandes noires (2026-11-19) — remplacé par cropexact2

- Hero : crops `object-fit: cover` (remplit le stage, plus de letterbox) → trop zoomé vs crop réel
- Atelier : cadre crop = proportions hero live (`carouselStageAr`)
- Cache-bust `?v=20261119-cropfill`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `0cfe8573` · preview `668cca7b` · atelier `04cf2f2d` · https://galerie-vittet-preview.pages.dev/

## Croprev — dernier crop visible dans le carousel (2026-11-19)

- croprev2 : seuil cover resserré (vieux 16:9 → contain) ; prod `cc51696b` · atelier `28e8437e` · `?v=20261119-croprev2`
- Cause : même URL crop réécrit → cache 1 h ; stage ≠ cadre → contain letterbox
- Fix : `updated_at` public + `?v=` sur `carousel_image` ; TTL crop 60 s ; cover si AR proche du stage
- Cache-bust `?v=20261119-croprev`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `d4d48995` · preview `495fd99b` · atelier `5eb938da` · https://galerie-vittet-preview.pages.dev/

## Cropthumb — miniature du recadrage (2026-11-19)

- Atelier : vignette 16:10 du `carousel_image` à côté de **Recadré** (lien plein cadre)
- Cache-bust `?v=20261119-cropthumb`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `fed02038` · preview `cd961fe2` · atelier `aaf41516` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/

## Cropclean — nettoyage code recadrage carousel (2026-11-19)

- Helpers crop simplifiés ; badge « prêt » retiré (libellé Recadré suffit)
- Boutons dialog cachés une fois ; Annuler reste actif pendant l’envoi
- API carousel : helpers auth/id partagés
- Cache-bust `?v=20261119-cropclean`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `b13f6c6f` · preview `43b88c9c` · atelier `07f0ce40` · https://galerie-vittet-preview.pages.dev/

## Cropfix2 — Valider Recadré ne reste plus bloqué (2026-11-19)

- Boutons `type=button` (plus de `method=dialog` submit)
- Pendant l’envoi : Valider grisé, **Annuler reste actif**
- Timeout encode + fallback JPEG ; réactivation systématique
- Cache-bust `?v=20261119-cropfix2` · atelier `be077b14`

## Cropbtns — boutons Valider/Annuler réactivés (2026-11-19)

- Bug : après un Valider réussi, Confirm/Cancel restaient `disabled` sur le dialog persistant
- Fix : `resetCropSession()` réactive les boutons à chaque ouverture
- Cache-bust `?v=20261119-cropbtns` · atelier `17f626ee`

## Cropfit — crop hero affiché intégralement (2026-11-19)

- Hero : `carousel_image` → `object-fit: contain` (plus de 2ᵉ coupe CSS)
- Cadre Atelier ~16:10 (stage desktop typique), plus 16:9
- Cache-bust `?v=20261119-cropfit`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `6eff3c6b` · preview `ba78656a` · atelier `31b4d5a6`

## Recadré — libellé bouton crop déjà fait (2026-11-19)

- Bouton Atelier : **Recadré** si `carousel_image` présent ; sinon **Recadrer pour le carousel**
- Cache-bust `?v=20261119-recadre`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Atelier https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/

## Expcarousel — filtre Exposition → Carousel (2026-11-19)

- Menu déroulant Exposition : option **Carousel** (œuvres `carousel=1`)
- Cache-bust `?v=20261119-expcarousel`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `f0b3f189` · preview `a273d5f8` · atelier `fe1c3668` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/

## Carousel-crop — recadrage 16:9 dédié au hero (2026-11-19)

- Atelier : si Carousel coché et ratio trop loin du 16:9 → outil pan/zoom ; dérivé `carousel_image` (KV + D1)
- Front : hero préfère `carousel_image` ; collection / loupe restent sur web/original
- Cache-bust `?v=20261119-carousel-crop`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `4b80875d` · preview `05e578ca` · atelier `e808f232` · https://galerie-vittet-preview.pages.dev/

## Artistnl — retours à la ligne artiste (2026-11-19)

- `cleanMultiline` pour artist (POST/PATCH) ; `white-space: pre-line` cartes + lightbox
- Cache-bust `?v=20261119-artistnl`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `3a700a70` · preview `3ce45d72` · atelier `cce70e6f` · https://galerie-vittet-preview.pages.dev/

## Claude1 — portrait milieu galerie (2026-11-19)

- Remplace le couple par `galerie-claude.webp` ; alt + `--gal-ar-sum` 4.04
- Cache-bust `?v=20261119-claude1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `3259ff39` · preview `fc97ccb6` · atelier `f8983ea4` · https://galerie-vittet-preview.pages.dev/

## About3 — nouveau texte galerie (2026-11-19)

- 3 paragraphes FR + UK ; cache-bust `?v=20261119-about3`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `b2ad60c1` · preview `2a0a00c5` · atelier `7c134ff0` · https://galerie-vittet-preview.pages.dev/

## Hours-et — horaires « et sur rendez-vous » (2026-11-19)

- Header : `·` remplacé par `et` (UK : `and`)
- Cache-bust `?v=20261119-hours-et`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `faed7ec5` · preview `097e5c61` · atelier `ea031c61` · https://galerie-vittet-preview.pages.dev/

## Herocaption0 — titres carousel masqués (2026-11-19)

- Titre / artiste plus affichés sur les photos du carrousel (données inchangées)
- Cache-bust `?v=20261119-herocaption0`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `0dff32d4` · preview `5ee41a5e` · atelier `f594e788` · https://galerie-vittet-preview.pages.dev/

## Noeyebrows — libellés inutiles retirés (2026-11-19)

- Retrait des eyebrows « À la une », « Œuvres choisies », « Depuis 1988 »
- Cache-bust `?v=20261119-noeyebrows`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `b0a87ff4` · preview `6e400bb7` · atelier `754ccce5` · https://galerie-vittet-preview.pages.dev/

## Page2row — galerie masquée dès page 2 (2026-11-19)

- Page 1 : 15 œuvres + bloc `#galerie` ; page 2+ : 18 œuvres, galerie masquée
- Cache-bust `?v=20261119-page2row2`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `9b830942` · preview `69d62211` · atelier `3fd514d3` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-page2row-galerie-vittet.md`

## Hero4s — carrousel 4 s (2026-11-19)

- `HERO_AUTOPLAY_MS` 5000 → 4000 ; cache-bust `?v=20261119-hero4s`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `0921d08e` · preview `d0111f00` · atelier `7225c38a` · https://galerie-vittet-preview.pages.dev/
- Mesure live : intervalles 4000 / 3999 ms

## Hero5s — carrousel 5 s (2026-11-19)

- `HERO_AUTOPLAY_MS` 10000 → 5000 ; cache-bust `?v=20261119-hero5s`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `eed1d376` · preview `8c278c2f` · atelier `8c2bdebe` · https://galerie-vittet-preview.pages.dev/
- Mesure live : intervalles ~5000 / ~4999 ms

## Metaen1 — support EN + dimensions inches (2026-11-19)

- Affichage UK : traduction support + conversion cm → inches (source D1 FR inchangée)
- Cache-bust `?v=20261119-metaen1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `c67564d7` · preview `d07aaeba` · atelier `f098471f` · https://galerie-vittet-preview.pages.dev/?lang=uk
- Détail : `compte-rendu-metaen1-galerie-vittet.md`

## Mobheader1 — vraie barre menus mobile (2026-11-13)

- Mobile ≤700px : menu Collection / Galerie / UK en bandeau dédié (plus de mélange avec contact)
- Cache-bust `?v=20261113-mobheader1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `1ff89d7b` · preview `13a0b86e` · atelier `e5c17ea8` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-mobheader1-galerie-vittet.md`

## Atelierpag — pagination haut, champs longs, carousel en collection (2026-11-11)

- Atelier : pagination haut+bas ; textareas + `META_MAX` (note 4000) ; cache-bust `atelierpag2`
- Front : plus d’exclusion `!carousel` dans `worksFor` — cache-bust `atelierpag1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `6dc77083` · preview `e28132e8` · atelier `7d09edbc` · https://galerie-vittet-preview.pages.dev/
- Atelier https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/
- Détail : `compte-rendu-atelierpag-galerie-vittet.md`

## Galerie18 header vertical spacing tightened again (2026-11-09)

- Header paddings / row-gaps encore resserrés (`4px` / `6px`, `row-gap: 6px`) — typo inchangée
- Cache-bust `?v=20261109-galerie18` · commit `a563aa1`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `52f4efc6` · preview `56c358a0` · atelier `73088590` · https://galerie-vittet-preview.pages.dev/
- Atelier https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/
- Détail : `compte-rendu-galerie18-galerie-vittet.md`

## Galerie17 header vertical spacing tightened again (2026-11-09)

- Header paddings / row-gaps / brand+contact margins encore resserrés (typo inchangée)
- Cache-bust `?v=20261109-galerie17` · commit `1cbf2ee`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `ff80a850` · preview `21d5416f` · atelier `a317bc4b` · https://galerie-vittet-preview.pages.dev/
- Atelier https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/
- Détail : `compte-rendu-galerie17-galerie-vittet.md`

## Galerie16 header vertical spacing tightened (2026-11-09)

- Header paddings / row-gaps / brand+contact margins resserrés (typo inchangée)
- Cache-bust `?v=20261109-galerie16` · commit `0e7ae55`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `48a70705` · preview `20e43692` · atelier `94652da7` · https://galerie-vittet-preview.pages.dev/
- Atelier https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/
- Détail : `compte-rendu-galerie16-galerie-vittet.md`

## Galerie15 header Collection/Galerie/UK top-aligned with VITTET (2026-11-09)

- `.header-menu-row` sibling de `.header-contact` · aligné au haut de VITTET
- Cache-bust `?v=20261109-galerie15` · commit `82682bc`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `1c0741b9` · preview `ef2b3065` · atelier `3161c744` · https://galerie-vittet-preview.pages.dev/
- Atelier https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/
- Détail : `compte-rendu-galerie15-galerie-vittet.md`

## Galerie14 header UK/FR same row (2026-11-09)

- UK/FR dans `.header-menu-row` avec Collection / Galerie
- Cache-bust `?v=20261109-galerie14` · commit `35591f2`
- Compte Emmanuel · sync-trees · deploy main + preview + atelier-kv-preview
- Prod `8643629c` · preview `bb97072e` · atelier `764c4e6d` · https://galerie-vittet-preview.pages.dev/
- Atelier https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/
- Détail : `compte-rendu-galerie14-galerie-vittet.md`

## Search1 atelier instant search (2026-11-09)

- `#catalog-filter-search` après le tri · filtre instantané catalogue
- Cache-bust `?v=20261109-search1` · commit `016960f`
- Compte Emmanuel · sync-trees · deploy preview + main
- Prod `cc8ce71e` · preview `c7d7f321` · https://galerie-vittet-preview.pages.dev/
- Atelier https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/
- Détail : `compte-rendu-search1-galerie-vittet.md`

## Galerie12 about photo gaps ~72px desktop (2026-11-09)

- `--gal-photo-gap: clamp(40px, 5vw, 80px)` · hauteur pinnée galerie9 (~390 / `405px`)
- Cache-bust `?v=20261107-galerie12` · commit `8999c93`
- Compte Emmanuel · sync-trees · deploy preview + main
- Prod `c1d2d430` · preview `63ede33b` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-galerie12-galerie-vittet.md`

## Galerie11 about photo gaps ~50px desktop (2026-11-09)

- `--gal-photo-gap: clamp(28px, 3.5vw, 56px)` · hauteur pinnée galerie9 (~390 / `405px`)
- Cache-bust `?v=20261107-galerie11` · commit `69528c7`
- Compte Emmanuel · sync-trees · deploy preview + main
- Prod `1f517e1e` · preview `2923ff41` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-galerie11-galerie-vittet.md`

## Galerie10 about photo gaps widened (2026-11-09)

- `--gal-photo-gap: clamp(20px, 2.6vw, 40px)` · hauteur pinnée galerie9 (~390 / `405px`)
- Cache-bust `?v=20261107-galerie10` · commit `190e351`
- Compte Emmanuel · sync-trees · deploy preview + main
- Prod `17291cba` · preview `8cd625fc` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-galerie10-galerie-vittet.md`

## Galerie9 about photos +20% / equal-height fit (2026-11-09)

- `--gal-photo-h: min(405px, fit-row)` · +20 % vs galerie8 (338→405) · hauteur égale, contain
- Cache-bust `?v=20261107-galerie9` · commit `9fe3358`
- Compte Emmanuel · sync-trees · deploy preview + main
- Prod `e8302a88` · preview `ef3ed627` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-galerie9-galerie-vittet.md`

## Galerie8 about photos +30% / equal-height fit (2026-11-09)

- `--gal-photo-h: min(338px, fit-row)` · +30 % vs galerie7 (260→338) · hauteur égale, contain
- Cache-bust `?v=20261107-galerie8` · commit `f31dff6`
- Compte Emmanuel · sync-trees · deploy preview + main
- Prod `edbe1881` · preview `c258950d` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-galerie8-galerie-vittet.md`

## Cleanup8 après hero-stage / paper / carousel (2026-11-06)

- Conservé : header-carousel, paper `#e3d1be`, letterbox `--stage`, carousel≠collection, hero filter, mobile 1-col, fit adaptatif
- Mort : `--page-pad-sm` ; `dataset.heroFit` / `is-contain` (hooks morts) ; cache-bust atelier `paper` → `clean8`
- Cache-bust `?v=20261106-clean8`
- Prod `9810d4b1` · preview `bb8615b0` · atelier `3a5e8219` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-cleanup8-galerie-vittet.md`

## Cleanup7 après loupe max natif (2026-11-05)

- Confirmé : plus de `LOUPE_ZOOM_MAX` / markup 150 ; jauge dynamique `loupeZoomMax` conservée
- Mort : export inutilisé `activityAt` (functions) ; tri atelier inchangé
- Cache-bust `?v=20261105-clean7`
- Prod `0972b5eb` · preview `2413e619` · atelier `31a91e1c` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-cleanup7-galerie-vittet.md`

## Loupe jauge max natif (anti-pixelisation) (2026-11-05)

- `maxZoom = min(naturalW/displayW, naturalH/displayH)` ; jauge max = ce coeff. (plus de 150 % fixe)
- Entrée 100 % ; si maxZoom &lt; 1 → jauge 100 % désactivée ; jamais au-delà du natif
- Échantillons 1440×900 : van Loo portrait **×8,85** (884 %) ; Nicolle Thermes **×3,13** (313 %)
- Cache-bust `?v=20261105-loupemax`
- Prod `f2f35d15` · preview `9b854504` · atelier `1a9e9f06` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-loupemax-galerie-vittet.md`

## Cleanup6 + sync unify atelier (2026-11-05)

- Mort : quick-import dual (package git) ; `categoryLabel()` ; `--ink-lg`
- Sync : atelier unifié EXIF (FileList + dates) + front loupe 150 / layout / header / paper-ink
- Cache-bust `?v=20261105-clean6`
- Prod `09fe5448` · preview `46d8db33` · atelier `aec219ce` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-cleanup6-galerie-vittet.md`

## Loupe jauge max 150 % (2026-11-05)

- Jauge **100 → 150 %** (entrée 100 %, clamp natif, idle 3 s inchangés)
- Cache-bust `?v=20261105-loupe150`
- Prod `9c429341` · preview `d235ee00` · https://galerie-vittet-preview.pages.dev/

## Loupe jauge 100–130 % (2026-11-05)

- Entrée loupe = **100 %** du fit lightbox (original) ; jauge jusqu’à **130 %** (clamp natif)
- Chrome (Quitter + jauge) idle 3 s comme avant
- Cache-bust `?v=20261105-loupegauge`
- Prod `c5ae2967` · preview `8ddc6b17` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-loupegauge-galerie-vittet.md`

## Header top padding 3 — moitié (2026-11-05)

- Outer `.header` top pad **5 → 2** px (mobile idem) ; bottom inchangé
- Ornement · + bas contact = bas adresse conservés
- Cache-bust `?v=20261105-hdrtop3`
- Prod `7bf38fce` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-hdrtop3-galerie-vittet.md`

## Header top padding 2 (2026-11-05)

- Outer `.header` top pad **8 → 5** px (mobile idem) ; bottom inchangé
- Ornement · + bas contact = bas adresse conservés
- Cache-bust `?v=20261105-hdrtop2`
- Prod `6f4f20ba` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-hdrtop2-galerie-vittet.md`

## Header top padding (2026-11-05)

- Outer `.header` top pad **12 → 8** px (mobile **10 → 8**) ; bottom inchangé
- Ornement horizontal · + bas contact = bas adresse conservés
- Cache-bust `?v=20261105-hdrtop`
- Prod `e8feb2a7` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-hdrtop-galerie-vittet.md`

## #galerie h2 top = photos (2026-11-05)

- « La galerie » aligné au haut des photos · « Depuis 1988 » au-dessus
- Cache-bust `?v=20261105-galh2`
- Prod `a279bccb` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-galh2-galerie-vittet.md`

## #galerie texte top-aligné photos (2026-11-05)

- Copy `top: 0` + `align-items: start` · top Δ **0** · photos/spacing inchangés
- Cache-bust `?v=20261104-galtop`
- Prod `ce67e74c` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-galtop-galerie-vittet.md`

## #galerie photos +15 % (2026-11-05)

- Hauteur 306 → **351 px** (≈352) · pad = gap 27,4 · texte Δ 0
- Cache-bust `?v=20261104-gal15`
- Prod `09dffd1d` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-gal15-galerie-vittet.md`

## #galerie photos +10 % (2026-11-05)

- Hauteur 278 → **306** px · pad = gap conservé · texte Δ 0
- Cache-bust `?v=20261104-gal10`
- Prod `7b5b9ee8` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-gal10-galerie-vittet.md`

## #galerie équilibre repères (2026-11-05)

- `1fr\|240\|1fr` + `--gal-space` (= pad = gap) · photos ~278 px · texte Δ 0
- Espaces figure 31,7 × 4 · plus d’absolute
- Cache-bust `?v=20261104-galbal`
- Prod `a13df133` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-galbal-galerie-vittet.md`

## #galerie photos agrandies + recentrées (2026-11-04)

- Hauteur 288 → 331 @1440 ; photos centrées dans les tracks, pad extérieur ~36 px
- Texte toujours Δ 0 sur l’axe page (copy absolute + gouttière 48 px)
- Cache-bust `?v=20261104-galgrow`
- Prod `317cdb6d` · preview `d4d7188d` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-galgrow-galerie-vittet.md`

## #galerie texte centré page (2026-11-04)

- Grille `1fr · 240px · 1fr` : colonne texte sur l’axe page (Δ 0 px)
- Photos égales hauteur, contain, collées aux bords → blanc extérieur ~17 px
- Cache-bust `?v=20261104-galpage`
- Prod `bad0f641` · preview `a9903805` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-galpage-galerie-vittet.md`

## #galerie contenu centré (2026-11-04)

- Triptyque façade \| texte \| salle : colonnes `auto` + `justify-content: center`
- Hauteur photos égale `--gal-photo-h`, proportions naturelles, pas de crop
- Cache-bust `?v=20261104-galctr`
- Prod `f33466a5` · preview `70c5711c` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-galctr-galerie-vittet.md`

## Section ornament mutualisé (2026-11-04)

- `.ornament-rule` partagé : header + junction `#collection` → `#galerie`
- Cache-bust `?v=20261104-secorn2`
- Prod `6d516929` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-secorn-galerie-vittet.md`


## Header horizontal rule (2026-11-04)

- Filet vertical retiré → filet horizontal + `·` dans le vide central
- Pas de cadres ; padding serré conservé
- Cache-bust `?v=20261104-hdrhoriz`
- Prod `163717e6` · preview `292fc4c8` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-hdrhoriz-galerie-vittet.md`

## Header dress (sans cadres) (2026-11-04)

- Cadres retirés ; padding chrome serré conservé
- Ornement central : filet vertical `--line` + `·` ; horizontal en mobile
- Cache-bust `?v=20261104-hdrdress`
- Prod `f9ef3397` · preview `9ff78973` · https://galerie-vittet-preview.pages.dev/
- CDP bottoms Δ0 · ornament @720 · API 200 · 99
- Détail : `compte-rendu-hdrdress-galerie-vittet.md`

## Header frames + padding serré (2026-11-04)

- Outer `.header` padding `22/30` → `10/12` (mobile `8/10`) ; `min-height` retiré
- Cadres filet `--line` sur `.header-brand` + `.header-contact` (padding interne `10px 14px 12px`)
- Cache-bust `?v=20261104-hdrframe`
- Prod `7a013604` · preview `826d0fa7` · https://galerie-vittet-preview.pages.dev/
- CDP bottoms Δ0 · MAÎTRES Δ0 · API 200 · 99
- Détail : `compte-rendu-hdrframe-galerie-vittet.md`

## CSS mutualisé (2026-11-04)

- `:root` structuré (surfaces / ink / type / space / img) ; patterns type + surfaces partagés ; cascade sans couleurs concurrentes
- Atelier : `--atelier-hint/ok/err` aligné sur tokens site pour paper/ink/line
- Cache-bust `?v=20261104-cssmut`
- Prod `45702573` · preview `40c845f7` · https://galerie-vittet-preview.pages.dev/
- CDP paper `#f5ede5` · ink unifié `#413c35` · API 200 · 99
- Détail : `compte-rendu-cssmut-galerie-vittet.md`

## Papier = encre éclaircie (2026-11-04)

- Correction « éclaircir le fond pas la fonte » : `--paper` `#e3d7ca` → `#f5ede5` (OKLCH L≈0.95, H encre) ; ink text tokens inchangés
- `--paper-lift` `#f9f4ee` · `--shade` `#ded6cc` · theme-color `#f5ede5`
- Cache-bust `?v=20261104-paperlight`
- Prod `7a37c0f9` · preview `3741b1f5` · https://galerie-vittet-preview.pages.dev/
- CDP body `rgb(245,237,229)` · ink-full `#2c261f` · API 200 · 99
- Détail : `compte-rendu-inkpaper-galerie-vittet.md`

## CSS solide papier (2026-11-04)

- Modèle unique `--paper` / `--paper-lift` / `--shade` (skeleton only) ; `--wall` retiré
- Body sans bande `#dbd3ca` ; `#galerie` et letterbox hero/collection = papier
- Cache-bust `?v=20261104-cssolid`
- Prod `793cdbd1` · preview `89c0ad4d` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-cssolid-galerie-vittet.md`

## Cleanup5 + sync functions/images (2026-11-03)

- Doublon media 1100px fusionné ; `mousemove` loupe retiré (pointermove) ; prune `ajouts/preview` vide
- Snapshot git : restauration `functions/images/ajouts/[[path]].js` (écart sync)
- Cache-bust `?v=20261103-clean5`
- Prod `bf8e5733` · preview `f4df42c1` · atelier `60167eaf` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-cleanup5-galerie-vittet.md`

## Chaleur WB sans sépia (2026-11-03)

- Retrait `sepia` ; SVG `feColorMatrix` `#img-warm-wb` (R 1.03 / G 1.012 / B 0.975) + contrast 1.06 + brightness 1.01 + saturate 1.03
- Cache-bust `?v=20261103-imgwb`
- Prod `5df69f7f` · preview `9a166a8b` · atelier `6a93773f` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-imgwb-galerie-vittet.md`

## Chaleur images + loupe idle (2026-11-03)

- `--img-enhance` : contrast 1.06 + brightness 1.015 + sepia 0.10 + saturate 1.12
- Loupe : plus de résolution fichier ; bouton masqué après 3 s idle, réveil à l’action
- Cache-bust `?v=20261103-warmloupe`
- Prod `655e8cbd` · preview `5111d71b` · atelier `553f6413` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-warmloupe-galerie-vittet.md`

## Cleanup4 + source git `galerie-vittet/` (2026-11-03)

- Mort : `visibleCards()` ; plus de défaut mot de passe dans `apply-artlogic-metadata.py`
- Snapshot durable : `galerie-vittet/` (front + atelier + functions, sans secrets / sans KV blobs)
- Cache-bust `?v=20261103-clean4`
- Prod `f47f3012` · atelier `20416734` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-clean4-galerie-vittet.md`

## « La galerie » entre les 2 photos (2026-11-03)

- Desktop : façade \| texte \| salle ; mobile : pile façade → texte → salle
- Cache-bust `?v=20261103-galmid`
- Prod `d034173f` · https://galerie-vittet-preview.pages.dev/#galerie
- Détail : `compte-rendu-galmid-galerie-vittet.md`

## Croix recherche → sortie `#recherche` (2026-11-03)

- Vider (X / input vide / submit vide) quitte `view-recherche` → `#collection` (catalogue visible)
- Plus de page « Saisissez un titre… » / sans résultats
- Cache-bust `?v=20261103-srchx`
- Prod `5cf2548f` · atelier `2aa093ab` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-srchx-clear-galerie-vittet.md`

## Densité d’encre typo 95 % hors logo (2026-11-03)

- `--ink` `#2c261f` → `#37312a` (95 % mix white) ; `--ink-full` `#2c261f` pour `.wordmark`
- Cache-bust `?v=20261103-ink95`
- Prod `b9d31fe4` · atelier `2924550f` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-ink95-galerie-vittet.md`

## Centrage « MAÎTRES ANCIENS » sous VITTET (2026-11-03)

- Sous-titre exact : `MAÎTRES ANCIENS` ; `text-align: center` dans la largeur du wordmark VITTET (pas l’adresse)
- Cache-bust `?v=20261103-wmcenter`
- Prod `9c523c56` · atelier `0c57864f` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-wmcenter-galerie-vittet.md`

## Cleanup code post-itérations UI (2026-11-03)

- Mort : `.text-link`, `--dusk`, `setMenu` no-op, `galeristes.webp`, commentaires d’historique
- Unifié : `.section-heading h2` ; stub `data/oeuvres.json` ; prune sync orphans
- Comportement conservé (API images, search, NICOLLE, loupe 130 %, 15/page, hero, paper, header…)
- Cache-bust `?v=20261103-cleanup`
- Prod `ac31dfc1` · atelier `d9fe513f` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-cleanup-galerie-vittet.md`

## Retrait lede collection (2026-11-03)

- Paragraphe sous `#collection` retiré (« Un ensemble personnel… »)
- Cache-bust `?v=20261103-nolede`
- Prod `9d29bdd7` · atelier `6920b656` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-nolede-galerie-vittet.md`

## Carousel hero +20 % (2ᵉ passe) (2026-11-03)

- `.hero-viewport` `min(74vh,768px)` → `min(89vh,922px)` ; `67vh`→`80vh` ; `58vh`→`70vh`
- Mesure @1440×900 : **666 → 801 px (+20,3 %)** ; header OK
- Package cohérent functions ; cache-bust `?v=20261103-hero20b`
- Prod `37ff48b0` · atelier `27ea4273` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-hero20b-galerie-vittet.md`

## Onglet Victor-Jean NICOLLE + retrait Aquarelles (2026-11-03)

- Tabs publics : Peintures / Miniatures / **Victor-Jean NICOLLE** (plus Aquarelles)
- NICOLLE = filtre `artist` (fold + `nicolle` ∧ `victor`) ; 35 œuvres
- Peintures/Miniatures = tags catégorie ; `PAGE_SIZE` 15 ; recherche/loupe OK
- Cache-bust `?v=20261103-nicolle`
- Prod `2dee1a03` · atelier `01ca715f` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-nicolle-tab-galerie-vittet.md`

## Loupe lightbox ×130 % (original) (2026-11-03)

- Affichage loupe = 1,3 × fit lightbox normal, clamp `naturalWidth/Height` (pas d’upscale)
- Source loupe = fichier **original** (hors `web/`) ; fiche masquée inchangée
- Cache-bust `?v=20261103-loupe130`
- Prod `44653fe2` · atelier `97494dd4` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-loupe130-galerie-vittet.md`

## Collection 5×3 (15/page) + recherche rétablie (2026-11-03)

- `PAGE_SIZE` 15 ; grille 3 colonnes ; API `pageSize: 15`
- Cause recherche : `setMenu` manquant après retrait nav → `ReferenceError` avant résultats
- Fix : no-op `setMenu` + `refreshSearchDom` ; cache-bust `?v=20261103-coll15`
- Prod `e313c7c6` · atelier `82889d52` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-coll15-search-galerie-vittet.md`

## Images restaurées + merge bgdens / carousel (2026-11-03)

- Cause : deploy sans Functions (`978fd987`) → `/images/ajouts/*` et `/api` en HTML ; race bgdens vs carousel
- Fix : package cohérent functions+KV ; `#e8e2da` + hero `74vh`/`768px` ; `?v=20261103-imgfix`
- Prod `4907be72` · atelier `dc5fda73` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-imgfix-galerie-vittet.md`

## Fond papier densifié ~15% (2026-11-03)

- `--paper` `#ebe6df` → `#e8e2da` ; wall/line + gradients assortis
- Cache-bust `?v=20261103-bgdens`
- Prod `8448149a` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-bgdens-galerie-vittet.md`

## Marges ÷2 + images collection (2026-11-03)

- Gutters 5vw → 2.5vw (`--page-pad`) ; grille gap 22→14 px ; inset preview 10→6 px
- Cartes +7 %, previews +9 % @1440 ; `?v=20261103-sidemargin`
- Prod `fb79beea` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-sidemargin-galerie-vittet.md`

## #galerie sans couple + écart (2026-11-03)

- Retrait `galeristes.webp` dans `#galerie` (pas le footer) ; façade + salle inchangées (Δ0 px)
- Gap 14 → ≈210 px (track couple absorbé) ; `?v=20261103-nocouple`
- Prod `f69eebd0` · https://galerie-vittet-preview.pages.dev/
- Détail : `compte-rendu-nocouple-gap-galerie-vittet.md`

## Wordmark VITTET plus haut (2026-11-03)
- font-size 56→72px ; line-height 1→1.2 ; pas de scaleY
- Cache-bust `?v=20261103-wmheight2`
- Prod `d8c2ebb2` · atelier `a07711dd`
- Détail : `compte-rendu-wordmark-height-galerie-vittet.md`

## Header adresse ×2 + sans menus Collection/Galerie (2026-11-03)
- Adresse 14px → 28px ; nav header retirée ; recherche centrée conservée
- Cache-bust `?v=20261103-hdrnonav`
- Prod `b06101f2` · atelier `48fab794`
- Détail : `compte-rendu-header-nonav-galerie-vittet.md`

## Lightbox plus grande + loupe sans fiche (2026-11-03)
- Dialog quasi plein viewport (−8 px) ; loupe masque la colonne infos
- Cap native `min(100%, naturalW/H)` — pas d’upscale
- Cache-bust `?v=20261103-lbloupe`
- Prod `1bdef92d`
- Détail : `compte-rendu-lightbox-loupe-galerie-vittet.md`

## Header adresse sous Vittet + nav/recherche centrés (2026-11-03)
- Adresse sous wordmark ; centre = Collection/Galerie + recherche ; droite phones/mailto/horaires
- Playfair 600–700 sur chrome ; tokens typeink conservés
- Cache-bust `?v=20261103-hdrplace`
- Prod `53863478` · atelier `1c89e120`
- Détail : `compte-rendu-header-place-galerie-vittet.md`

## Textes petits / muted agrandis + noircis (2026-11-03)
- `--muted` `#6f6b64` → `#3f3a33` ; tokens `--type-xs/sm/meta` 12/13/14px
- Cache-bust `?v=20261103-typeink`
- Prod `5984d827`
- Détail : `compte-rendu-typeink-galerie-vittet.md`

## Header empilé marque / recherche / contact (2026-11-03)
- VITTET ~56px ; nav 15px ; recherche centrée ; contact empilé à droite
- Cache-bust `?v=20261103-hdrstack`
- Prod `897852ae` · atelier `f29bed8f`
- Détail : `compte-rendu-header-stack-galerie-vittet.md`

## Header contact + footer minimal (2026-11-03)
- Bande contact sticky : téléphones +33, mailto, adresse, horaires ; nav sans Contact
- Section `.visit` et footer adresse retirés ; crédit Emmanuel conservé
- Cache-bust `?v=20261103-hdrcontact`
- Prod `bcdea24f` · atelier `a6d8a6cf`
- Détail : `compte-rendu-header-contact-galerie-vittet.md`

## Téléphones contact +33 (2026-11-03)
- Affichage `01…` / `06…` → `+33 1…` / `+33 6…` ; police 12px → 22px
- Cache-bust `?v=20261103-phone`
- Prod `24157937` · atelier `aa710034`
- Détail : `compte-rendu-phones-intl-galerie-vittet.md`

## Lightbox dim presque noir (2026-11-03)
- `.lightbox[open]::backdrop` : `rgba(22, 20, 16, .8)` → `rgba(0, 0, 0, 0.94)`
- Cache-bust `?v=20261103-lbdim`
- Prod `749baa0e` · atelier `599fb307`
- Détail : `compte-rendu-lightbox-dim-galerie-vittet.md`

## Cleanup ordre front (2026-11-03)
- PATCH delta + debounce 280 ms ; optimistic UI ; `compareByFrontOrder` unifié
- Prod `e777cebb` · atelier `42f3ccdb` · cache-bust `orderclean`
- Détail : `compte-rendu-orderclean-galerie-vittet.md`

## Ordre d’affichage front atelier (2026-11-03)
- Tri « Ordre d’affichage front » : drag + ↑↓ → D1 `sort_order` (PATCH bulk)
- Nouveaux imports append (`MAX+10`) ; densify initial 10…1120
- Prod `c8ee9922` · atelier `6d0ee0b3` (remplacé par orderclean)
- Détail : `compte-rendu-ordre-front-atelier-galerie-vittet.md`

## #galerie espace vs collection (2026-11-02)
- Collection pb 80px · about pt 96px (+40 px au total)
- Cache-bust `?v=20261102-gutter`
- Prod `f2b3e952` · atelier `e668b5b2`
- Détail : `compte-rendu-gutter-galerie-vittet.md`

## #galerie typo colonne (2026-11-02)
- H2 plus grand ; retrait 1ʳᵉ ligne ; colonne 220px ; triptyque inchangé
- Cache-bust `?v=20261102-copytune`
- Prod `f54b7525` · atelier `68c4739d`
- Détail : `compte-rendu-copytune-galerie-vittet.md`

## #galerie titre simple (2026-11-02)
- H2 « La galerie » + eyebrow « Depuis 1988 » ; triptyque hauteurs inchangées
- Cache-bust `?v=20261102-titre`
- Prod `ba5d3e5a` · atelier `7cf0cb1e`
- Détail : `compte-rendu-titre-galerie-vittet.md`

## #galerie triptyque + texte droite (2026-11-02)
- 3 photos même hauteur (gap 14px) ; texte colonne droite pleine hauteur ; mobile pile puis texte
- Cache-bust `?v=20261102-triptych`
- Prod `ddf1f3a7` · atelier `9ffe3823`
- Détail : `compte-rendu-triptych-galerie-vittet.md`

## #galerie nettoyage code (2026-11-02)
- HTML/CSS #galerie simplifiés ; design nofrm23 inchangé (parité ≤0,1 px)
- Cache-bust `?v=20261102-galclean`
- Prod `8c3d5c4e` · atelier `f0fe2ab1`
- Détail : `compte-rendu-galclean-galerie-vittet.md`

## #galerie sans cadre + couple 2/3 (2026-11-02)
- Cadre lieux retiré ; portrait = 2/3 hauteur diptyque ; tops alignés ; texte justifié
- Cache-bust `?v=20261102-nofrm23`
- Prod `723122e1` · atelier `e1a7673f`
- Détail : `compte-rendu-nofrm23-galerie-vittet.md`

## #galerie tops alignés + sans H2 (2026-11-02)
- Hauts façade / salle / portrait alignés ; retrait « Le goût des œuvres rares. » ; texte justifié sous portrait
- Cache-bust `?v=20261102-galigntops`
- Prod `ad977e25` · atelier `595af358`
- Détail : `compte-rendu-galigntops-galerie-vittet.md`

## Carousel hero départ aléatoire (2026-11-02)
- `syncHeroFromWorks` : index de départ random si ≥2 œuvres carousel ; ordre CMS + wrap next/prev inchangés
- Cache-bust `?v=20261102-herorand`
- Prod `c25435cc` · atelier `6ece3b38`
- Détail : `compte-rendu-herorand-galerie-vittet.md`

## Tri atelier défaut récent (2026-11-02)
- Défaut : « Plus récente téléchargée ou modifiée » (`updated_at` / max avec `created_at`)
- D1 `updated_at` + bump PATCH/import ; front public inchangé
- Atelier `246911bc` · https://atelier-kv-preview.galerie-vittet-preview.pages.dev/atelier/
- Détail : `compte-rendu-atelier-tri-recent-galerie-vittet.md`

## Séparation sections (2026-11-02)
- Padding / overflow:clip / spy 38vh — Galerie ne se mélange plus avec Contact
- Cache-bust `?v=20261102-sections`
- Prod `9bd42b34` · atelier `12f0d4a7`
- Détail : `compte-rendu-sections-separation-galerie-vittet.md`

## Photo salle #galerie (2026-11-02)
- Diptyque couple + intérieur (`images/galerie-salle.webp`, 1024×530, ~69 Ko)
- Cache-bust `?v=20261102-salle` (remplacé par sections)
- Prod `ea41db80` · preview atelier `7ee3f392`
- Détail : `compte-rendu-salle-galerie-vittet.md`

## Cible
- Email: vittet.claude@yahoo.fr
- Account ID: `485af5da677b9be3c881813bc01b9ee8`
- Dashboard: https://dash.cloudflare.com/485af5da677b9be3c881813bc01b9ee8/home

## Token
- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_VITTET_API_TOKEN` : absents
- Wrangler OAuth actif = Compte Emmanuel seulement (`69008766…`) — ne pas l’utiliser pour provisionner Vittet

## Crédit footer (2026-11-01)
- « Site réalisé par Emmanuel Torregano » + mailto `emmanueltorregano@mac.com`
- Cache-bust `?v=20261101-credit`
- Prod `6591ed92` · preview atelier `21432cc1`
- Détail : `compte-rendu-credit-footer-galerie-vittet.md`

## Cleanup 3 recherche (2026-11-01)
- Unification route / soft-fold / debounce / bindSiteSearch ; pas de régression bruegel
- Cache-bust `?v=20261101-cleanup3` (remplacé par credit)
- Prod `914f35ba` · preview atelier `6ee9e695`
- Détail : `compte-rendu-cleanup3-galerie-vittet.md`

## Recherche instantanée (2026-11-01)
- Debounce 200 ms sur le champ header → `#recherche?q=` (replaceState)
- Soft-fold conservé ; `brue` / `bruegel` → 3 hits
- Cache-bust `?v=20261101-instant` (remplacé par cleanup3)
- Prod `15526b15` · preview atelier `02ff4d80`
- Détail : `compte-rendu-recherche-instant-galerie-vittet.md`

## Recherche Bruegel soft-fold (2026-11-01)
- `bruegel` manquait `BRUEGHEL` (gh) — softFold gh→g + ue↔eu
- Cache-bust `?v=20261101-bruegel` (remplacé par instant)
- Prod `965760b7` · preview atelier `adff276b`
- Détail : `compte-rendu-recherche-bruegel-galerie-vittet.md`

## Recherche catalogue (2026-11-01)
- Champ header + vue `#recherche` / `#recherche?q=` (filtre client `/api/oeuvres`)
- Cache-bust `?v=20261101-recherche` (remplacé par bruegel)
- Prod `504c609a` · preview atelier `88c7459e`
- Détail : `compte-rendu-recherche-galerie-vittet.md`

## Retrait CTA collection (2026-11-01)
- Retrait « Demander une œuvre » sous `#collection` (lien déjà en lightbox + Contact nav/footer)
- Cache-bust `?v=20261101-nocollectcta`
- Prod `6bf64466` · preview atelier `9117b690`
- Détail : `compte-rendu-nocollectcta-galerie-vittet.md`

## Dédoublonnage home (2026-11-01)
- Retrait CTAs / footer doublons (`#collection`, `#contact`, OSM, tel, mailto, retour haut)
- Densification chrome + sections home
- Cache-bust `?v=20261101-dedupe`
- Prod `42a7a64a` · preview atelier `51919561`
- Détail : `compte-rendu-dedupe-home-galerie-vittet.md`

## Cleanup code (2026-10-31)
- Pass 2 : helpers image/loupe unifiés, CSS filter 1.06/1.03, CORS obsolete retiré
- Cache-bust `?v=20261031-cleanup2` (remplacé par dedupe)
- Prod `9f271d9a` · preview atelier `c9ede335`
- Détail : `compte-rendu-cleanup2-galerie-vittet.md`

## Source Emmanuel (intact)
- https://galerie-vittet-preview.pages.dev/
- Dumps prêts : 112 œuvres, 336 clés KV

## Nouvelles URLs
Aucune (pas encore de projet Pages sur le compte Vittet).
