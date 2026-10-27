# Compte rendu — Envoyer au Pupitre (Astro)

Date : 27 octobre 2026 (Europe/Paris).  
Chemin : `dash-migration/compte-rendu-admin-rss-send-to-desk.md`.  
Hôte : `rag-server-EL` · `https://electronlibre.info/admin/rss/`.

## Problème

Le bouton Astro **Envoyer** ne faisait que `markSent` (client Dash).  
Le pont legacy **Envoyer au Pupitre** (`send_to_desk.php` → brouillon `el_articles`) n’était plus joignable (admin PHP en 410).

## Livré

Parité `send_to_desk.php` + `inc/desk.php` dans EL Astro :

1. Fetch HTML multi-UA + extraction (repli RSS)
2. LLM OpenAI → titre + résumé **FR** (pas de fallback EN)
3. `POST` ingest Desk `draft=true` (`X-Desk-Ingest-Key`)
4. Marquage `rss_post` : `sent=1`, `breve_spip='1'`
5. UI : bouton **Envoyer au Pupitre** (+ **Envoyer** client conservé)
6. `dryRun: true` : fetch+LLM sans écriture `electronlibre` / flags

### Code

- `server/lib/admin-dash-send-to-desk.mjs` (+ fetch, llm, extract, desk-client)
- `admin-dash-rss-actions.mjs` action `to_desk`
- `src/pages/admin/rss.astro`

## Précautions BDD

- Dump avant écriture : `/var/www/el-astro/backups/send-to-desk-20261027084154/el_articles.sql` (~52 Mo)
- Smoke : dry-run OK puis **1** brouillon réel `article_id=107684` (`draft=1`)
- Correctif ENUM : `breve_spip = '1'` (pas l’entier 1)

## Vérifications

- Unit tests `admin-dash-send-to-desk.test.mjs` : OK  
- Deploy `all` puis `api` : health OK  
- Page admin contient `data-action="to_desk"`

## Correctif client (27 oct. 2026)

Le flux `/client` filtre par `id_theme`. **Envoyer au Pupitre** envoie aussi vers le client :

- `themeId` obligatoire dans l’UI
- `markDeskSent` : `sent=1` + `id_theme` + `breve_spip='1'`
