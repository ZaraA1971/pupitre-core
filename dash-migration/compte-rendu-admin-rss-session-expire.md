# Compte rendu — session expirée admin RSS → login Pupitre

Date : 30 octobre 2026 (Europe/Paris).  
Chemin : `dash-migration/compte-rendu-admin-rss-session-expire.md`.

## Comportement

Sans cookie `el_session` valide (expiré / absent), `/admin/rss/` ne laisse plus le message « Accès pupitre refusé ».

Redirection vers la **page de connexion Pupitre** :

`/desk/?redirect=/admin/rss/`

Après login réussi (ou si déjà connecté), retour automatique vers le `redirect` (chemin relatif same-origin uniquement).

## Fichiers

- `src/pages/admin/rss.astro` (+ détail `[id].astro`)
- `desk/views/login.js`, `desk/app.js`, cache-bust `desk/index.html`

## Note

Pas de refresh auto du cookie web (14 j). À l’expiration : reconnexion Pupitre, puis retour admin.
