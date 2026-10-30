# Compte rendu — pont Desk admin local (injectables)

Date : 25 octobre 2026 (Europe/Paris).  
Chemin exact : `dash-migration/compte-rendu-desk-local.md`.  
Lot : `dash-migration/node-admin-rss/`.  
Branche : `cursor/plan-migration-php-nodejs-daf6`.

## Attestation d’isolement

- Aucune connexion à ElectronLibre ni à une base distante.
- Aucun SSH, secret prod, OpenAI, Desk HTTP, Vigie, Firebase, SMTP, push.
- `DASH_DISABLE_EXTERNAL=1` inchangé (refus de `=0` par `loadConfig`).
- `to_desk` : HTML sous `fixtures/articles/` + LLM déterministe (`local-desk.mjs`) + brouillon stub (`article_id ≥ 900000`).
- Aucun déploiement, vhost, cron système ou PHP installé modifié.
- Endpoints HTTP `webservice/*.php` **non touchés**.

## Livrable

| Fichier | Rôle |
| --- | --- |
| `src/desk-client.mjs` | Payload + parse réponse Desk (parité `inc/desk.php`) |
| `src/article-extract.mjs` | Extraction HTML offline (JSON-LD, classes, densités `<p>`) |
| `src/local-desk.mjs` | Injectables banc : map URL→fixture + LLM local |
| `src/externals.mjs` | Enregistre le payload complet ; parse `deskFetch` factice même en mode local |
| `src/send-to-desk.mjs` | Prompts alignés PHP ; `resolveRssHint` ; 503 si injectables absents |
| `src/app.mjs` / `render.mjs` | Branche `POST /actions` `to_desk` ; bouton UI activé |
| `fixtures/articles/*.html` | Pages HTML locales (dont junk Cloudflare) |
| `test/desk-local.test.mjs` | Payload/parse, extract, hardening multi-id / hint RSS |
| `test/inbox-journey.test.mjs` | Parcours HTTP `to_desk` local (plus de 503) |

## Comportement

1. L’UI « Envoyer au Pupitre » est active sur le banc local.
2. `POST /actions` avec `to_desk` appelle `handleSendToDesk` avec injectables par défaut.
3. Texte source : fixture HTML si URL connue (`example.test/a|d|e`), sinon hint RSS du post.
4. Titre + résumé : `localFixtureLlm` (déterministe, FR).
5. Desk : stub `createDeskDraft` + `markDesk` / `linkAuthorIfKnown` — **aucun HTTP**.

## Limites (hors lot)

| Point | Statut |
| --- | --- |
| HTTP réel Desk / OpenAI | Interdit sur ce banc |
| XPath DOM complet PHP | Approximation regex/classes |
| Relecture flux SimplePie live | Non — `resolveRssHint` injectable seulement |
| Pages `client/` | Pas de référence locale ; lot suivant |
| Déploiement / vhost | Interdit |

## Tests exécutés

```bash
env -u DASH_DB_MODE … DASH_DISABLE_EXTERNAL=1 npm test
```

Résultat : **59 pass**, 0 échec (suites MySQL skipped sans env).  
Journal : `/opt/cursor/artifacts/dash-desk-local-fixtures.log`.

Suite MySQL jetable : non rejouée dans ce lot (inchangée côté garde-fous ; assertion `to_desk` mise à jour pour succès local si banc mysql dispos).

## Suite recommandée

1. Ne pas déployer ; ne pas lever `DASH_DISABLE_EXTERNAL`.
2. **Prochain lot** : pages `client/` lecture — après import sanitizé de référence PHP dans `dash-migration/reference/client/` (copie SSH hors agent ou fournie), scaffolder `node-client/` session + `index` / `get_articles` / `timeline` sur fixtures / MySQL jetable.
3. Laisser `webservice/*.php` HTTP en PHP tant que l’usage externe reste inconnu.
