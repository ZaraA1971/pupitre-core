# Compte rendu — typo titres RSS + retrait flux Vigie

Date : 25 octobre 2026 (Europe/Paris).  
Chemin : `dash-migration/compte-rendu-admin-rss-entities-vigie.md`.  
Hôte : `rag-server-EL` · surface `https://electronlibre.info/admin/rss/`.

## Problème

Titres du Flux affichés avec entités HTML brutes (`&#xE9;`, `&#160;`) au lieu de `é` / espace insécable — `esc()` échappait `&` sans décoder d’abord.

## Livré

1. **Plus de flux Vigie** dans la nav principale (Flux / Envoyés / Supprimés / Config).  
   La config Vigie reste en sous-onglet **Espace Vigie** (sources `audience=vigie`).
2. **Décodage entités** :
   - API : `decodeHtmlEntities` (`he.decode`) sur titre, source, auteur, thème, mots-clés, texte détail.
   - UI : `decodeEntities` avant `esc()` (filet si entités encore présentes).

### Code (EL Astro)

- `server/lib/admin-dash-rss.mjs` + `admin-dash-rss-entities.test.mjs`
- `src/pages/admin/rss.astro`

Backup serveur : `/var/www/el-astro/backups/admin-rss-entities-20261025135146/`.  
Déploiement : `./scripts/deploy.sh all` (249 tests OK, web+api health OK).

## Vérifications

- Unit tests `admin-dash-rss-entities.test.mjs` : OK  
- Probe prod inbox : titres « responsabilité politico-médiatique », « Gmail ? » sans littéraux `&#…;` ; `bad=0` sur 20 titres  
- Page `/admin/rss/` : `data-view` = inbox|sent|deleted|config uniquement  
