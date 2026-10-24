# Plan de migration — application PHP vers Node.js

Dépôt examiné : `github.com/ZaraA1971/pupitre-core`, branche `main`, révision `51c7270d37e97291dc9b4367b8b25c9f91a2453f`. Aucun déploiement, aucun serveur, aucun secret et aucun service externe n’ont été touchés. Aucun test n’a été exécuté.

## Ce que le dépôt permet de conclure

Ce dépôt **n’est pas une application PHP**. Il ne contient aucun fichier `.php`, aucun Composer, aucun cron, aucune configuration de serveur. C’est déjà une bibliothèque Node.js ESM, `@electronlibre/pupitre-core` 0.1.0, moteur `node >= 22.12.0`. Le README la décrit comme la tranche extractible du pupitre éditorial d’ElectronLibre. L’hôte, le SPA, la facturation, Brevo, OneSignal et les adaptateurs RAG **ne sont pas dans ce dépôt**.

Le commentaire de `src/index.mjs` pointe un hôte `../el/index.mjs` et `../el/article-host.mjs`. Ces fichiers sont absents. Une migration PHP vers Node ne peut donc pas être planifiée depuis le code PHP : ce code n’est pas ici. Le plan ci-dessous fige le contrat Node déjà écrit, dit ce qu’il faudrait préserver si l’application PHP est l’hôte historique de ce pupitre, et s’arrête là où le dépôt ne prouve rien.

Les colonnes `wp_role` et `newsletter_opt_in` sont un schéma éditorial opinionné. `src/users/store.mjs` et le README le disent explicitement : ce n’est pas un runtime WordPress. Assimiler l’application d’origine à WordPress serait une hypothèse, pas un fait.

## Architecture actuelle vérifiée

Le paquet n’écoute pas de port. Il exporte des fonctions qu’un hôte appelle après avoir découpé l’URL en `parts` et construit un `ctx`. L’entrée unique du CRUD est `tryHandleCoreCrud` dans `src/crud.mjs`. Elle ne traite une route que si `parts[2]` vaut `categories`, `media`, `authors`, `users` ou `articles`. Le préfixe `/api/desk` apparaît dans les commentaires (`src/plugin-registry.mjs`, `src/categories/router.mjs`, `src/authors/router.mjs`) ; il n’est pas imposé par le code. L’hôte peut donc monter ces routes ailleurs. C’est à vérifier dans l’application PHP, pas ici.

Le registre de plugins (`createPluginRegistry`) ajoute des capacités, des routes et des crochets `onPublish`, `onDraft`, `onMutate`, `onCategoryChange`. `resolveEnabledPluginIds` lit une valeur de type `DESK_PLUGINS` (liste CSV) : valeur absente = tous les plugins fournis par l’hôte ; chaîne vide = aucun. `emitDeskLifecycle` incrémente un compteur `contentGen` en mémoire de processus, puis lance les crochets. Une erreur de plugin est journalisée et n’arrête pas les suivants.

L’authentification, le hash des mots de passe, les mails, la newsletter et l’audit sont injectés. Le cœur refuse les routes utilisateurs si `userPolicy` est incomplet (`hashPassword`, `generateTempPassword`, `ROLES`, `STATUSES`, et les prédicats listés dans `src/users/router.mjs`).

## Fonctionnalités à préserver

Ce qui est réellement implémenté dans ce dépôt, et qui devrait rester le comportement de référence :

- Articles : liste filtrée, création, lecture, mise à jour, suppression, publication, retour en brouillon. La liste restreint un non-rédacteur en chef à `author_user_id = session.uid`. Filtres lus dans le code : `q`, `lang`, `draft` (`0` ou `1`), `page`, `limit` (1 à 50, défaut 20). Création : slug, titre, HTML nettoyé par `ctx.cleanHtml`, chapô, date MySQL, auteur, catégories, tags, mots-clés, `access` (`granted` ou `subscribers`), langue (défaut `fr`), brouillon, `source_url`. Identifiants au-dessus d’un plancher (`COALESCE(MAX(article_id), 100000) + 1` dans `src/article-helpers.mjs`). Traductions `translation_fr` / `translation_en` dissociées à la suppression.
- Catégories : liste et création seulement. Pas de modification ni de suppression dans `src/categories/router.mjs`. Schéma créé par le store si la table manque : `slug`, `name`, `sort_order`, `show_in_nav`.
- Médias : liste paginée (`page`, `limit` ou `per_page` plafonné à 60, défaut 24, recherche `q`), envoi `multipart` (pair `busboy`), mise à jour de l’alternative textuelle, suppression logique (`deleted_at`). Le fichier et les vignettes passent par `ctx.mediaFs`, absent du paquet.
- Auteurs : une seule lecture, agrégat des noms d’articles et des comptes dont le rôle est dans `staffRoles` (défaut `admin`, `editor`, `author`).
- Utilisateurs : liste (`q`, `role`, `status`, `page`, `limit` 1 à 100, défaut 30), création, lecture, mise à jour, suppression, régénération de mot de passe. Réservé à qui `canManageUsers` accepte. Interdits vérifiés par les tests : politique incomplète, session sans droit, éditeur qui modifie un admin, suppression de son propre compte, suppression du dernier admin actif. Le mot de passe temporaire n’est renvoyé qu’une fois.
- Plugins et cycle de vie : capabilities fusionnées, dispatch de route, crochets isolés les uns des autres.

Hors de ce dépôt, donc non prouvés et à ne pas « migrer » dans ce paquet sans décision : SPA, session HTTP, facturation, Brevo, OneSignal, RAG, pages publiques, tâches planifiées.

## Routes et contrats

Convention documentée, préfixe non appliqué par le routeur : `/api/desk/...` avec `parts[2]` comme ressource.

| Méthode et chemin relatif | Module | Réponse ou effet visible dans le code |
| --- | --- | --- |
| `GET` et `POST` `categories` | `src/categories/router.mjs` | `{ categories }` ou `201 { category }` |
| `GET` et `POST` `articles` | `src/articles/router.mjs` | Liste paginée, ou création |
| `GET`, `PUT`, `DELETE` `articles/:id` | idem | Article, mise à jour, suppression |
| `POST` `articles/:id/publish` et `.../draft` | idem | Bascule de `draft`, crochet de cycle de vie |
| `GET` et `POST` `media` | `src/media/router.mjs` | Liste, ou upload |
| `PATCH` et `DELETE` `media/:id` | idem | `alt`, ou suppression logique |
| `GET` `authors` | `src/authors/router.mjs` | Autocomplétion |
| `GET` et `POST` `users` | `src/users/router.mjs` | Liste, ou création |
| `GET`, `PUT`, `DELETE` `users/:id` | idem | Compte |
| `POST` `users/:id/password` | idem | Mot de passe temporaire |

`POST` catégorie avec un autre verbe renvoie 405. Article inconnu : 404. Article sans droit : 403. `article_id` non numérique : 400. Store manquant : 500. Les corps JSON passent par `parseJsonBody`. Les noms de tables passent par `assertSafeSqlIdent`.

Le contrat de session lu par les routeurs comprend au moins `session.role`, `session.uid`, `session.ingest`, `session.name`, `session.login`. Le pool suit l’usage `pool.query` qui renvoie `[rows]` (API mysql2). Ce n’est pas un client `pg`.

## Données

MySQL ou compatible, moteur InnoDB, `utf8mb4` là où le `CREATE TABLE` est dans le dépôt (catégories et médias seulement).

- Catégories et médias : le store crée la table au premier usage (`CREATE TABLE IF NOT EXISTS`). Médias : `source` vaut `legacy` ou `upload`.
- Articles : la table n’est pas créée ici. L’`INSERT` exige les colonnes listées dans `handleCollection` (`article_id`, `slug`, `title`, `excerpt`, `body`, `date`, `modified`, `author`, `author_slug`, `author_user_id`, `categories`, `category_names`, `tags`, `ia_keywords`, `access`, `lang`, `draft`, `source_url`). D’autres requêtes supposent `translation_fr` et `translation_en`.
- Utilisateurs : pas de `CREATE TABLE`. L’`INSERT` exige `id`, `login`, `email`, `display_name`, `password_hash`, `role`, `status`, `access_until`, `wp_role`, `source`, `notes`, `newsletter_opt_in`, `registered`. Les identifiants partent au-dessus de 900000.
- `contentGen` n’est pas une table. Il repart à zéro au redémarrage du processus. S’il sert de cache-busting partagé entre plusieurs instances, ce dépôt ne le garantit pas.

Aucun script de migration SQL, aucun dump et aucune tâche planifiée ne figurent dans le dépôt.

## Intégrations

Présentes seulement comme points d’extension : `auditLog`, `afterUserCreate`, `afterUserDelete`, `afterPublish` n’est pas une fonction du cœur (le README le cite côté hôte), `cleanHtml`, `chapo`, `mediaFs`, `rowToArticle`, `userPolicy.hashPassword`. Stripe, Brevo, OneSignal et le RAG sont des non-objectifs écrits dans le README. Aucun client HTTP vers ces services n’existe ici.

## Architecture Node.js recommandée

Garder ce paquet comme bibliothèque, et ne pas le réécrire en application. Les raisons sont dans le code : les routes sont déjà en Node, le SQL est déjà paramétré, les droits et le hash sont déjà des ports injectés, et les tests de sécurité utilisateurs existent. Une seconde implémentation des mêmes routes créerait deux contrats à maintenir.

L’hôte manquant, qu’il soit aujourd’hui en PHP ou déjà ailleurs, devrait devenir un processus Node mince :

- il termine l’authentification et construit `session` ;
- il découpe l’URL et appelle `tryHandleCoreCrud`, puis le registre de plugins ;
- il fournit le pool MySQL, `userPolicy`, `mediaFs` et les crochets mail ou newsletter ;
- il ne réimplémente pas le CRUD.

Le cœur parle `IncomingMessage` et `ServerResponse` du module `http` de Node. Imposer Express ou un autre cadre **dans** le paquet n’apporte rien tant que l’hôte n’est pas lu. Le cadre du processus hôte peut attendre cette lecture. Node 22, déjà fixé par `package.json` et par `.github/workflows/publish.yml`, reste la cible.

`busboy` 1.6 reste une dépendance de pair, installée par l’hôte, pas embarquée.

## Étapes, du plus sûr au plus risqué

1. Obtenir le code PHP (ou l’hôte actuel) dans un dépôt lisible. Sans lui, aucune parité ne se mesure. Ne pas le chercher sur un serveur depuis cette étape.
2. Dresser, dans cet hôte seulement, la liste des URLs qui appellent aujourd’hui le même schéma. Les comparer au tableau de routes ci-dessus. Marquer ce qui n’a pas d’équivalent (front public, webhooks, cron).
3. Geler le schéma MySQL réel à côté des colonnes citées plus haut. Ne pas lancer les `CREATE TABLE` de catégories et de médias sur une base qui a déjà ces tables sous une autre forme : `CREATE TABLE IF NOT EXISTS` ne migre pas une table existante.
4. Brancher un hôte Node de laboratoire sur une copie de la base, avec les mêmes prédicats de rôles. Faire répondre d’abord `users` et `categories`, qui sont les surfaces les plus bornées.
5. Enchaîner `articles` (droits, brouillon, publication), puis `media` (fichiers réels), puis `authors`.
6. Laisser les plugins produit (mail, newsletter, RAG, paiement) dans l’hôte, derrière les crochets, un plugin à la fois.
7. Ne publier le paquet npm qu’après la parité des routes déjà couvertes. Le workflow `Publish npm` publie sur `release` ou lancement manuel, avec `NPM_TOKEN`. Ce n’est pas une bascule de l’application.

## Tests et critères de parité

Déjà dans le dépôt, et à garder verts (`npm test`) :

- `src/article-helpers.test.mjs` : slug, JSON, prédicats, nom de table refusé.
- `src/categories/store.test.mjs` et `src/media/store.test.mjs` : nom de table seulement. Pas de SQL exécuté.
- `src/crud.test.mjs` : une route hors CRUD retourne `false`.
- `src/plugin-registry.test.mjs` : capabilities, dispatch, isolation d’erreur, filtre `DESK_PLUGINS`.
- `src/users/router.test.mjs` : politique incomplète, 403, dernier admin, mot de passe à usage unique.
- `src/users/store.test.mjs` : plancher d’identifiant, nom de table.
- `examples/minimal/demo.mjs` : registre et cycle de vie, sans base.

Insuffisant pour une parité avec PHP. Il n’existe aucun test des routeurs articles, catégories, médias ou auteurs, ni de test contre MySQL. Critères à ajouter seulement une fois l’hôte connu, sans les écrire maintenant :

- pour chaque ligne du tableau de routes, même code HTTP et mêmes champs JSON que l’hôte actuel, sur un jeu fixé ;
- un compte non `canEditAll` ne voit que ses articles ;
- une politique utilisateurs incomplète ne démarre pas les routes comptes ;
- un upload média retrouve `path` unique et une suppression ne retire que `deleted_at` ;
- deux publications successives n’exigent pas que `contentGen` survive à un redémarrage, sauf si l’hôte prouve le contraire ;
- `npm test` reste vert, et la démo sans base aussi.

La parité est atteinte quand ces comparaisons passent sur une copie de données, pas quand le paquet compile.

## Dépendances, incompatibilités, risques

- Dépendance de pair : `busboy` ^1.6.0. Pas de runtime PHP à faire coexister dans ce paquet.
- SQL dialecte MySQL (`SHOW COLUMNS`, `INSERT IGNORE`, `TINYINT`, `ENUM`, backticks). Incompatible tel quel avec PostgreSQL.
- `contentGen` local au processus : plusieurs instances Node ne partagent pas ce compteur.
- `CREATE TABLE IF NOT EXISTS` peut masquer un écart de schéma au lieu de le signaler.
- Les noms de tables et de rôles par défaut (`articles`, `users`, `admin` / `editor` / `author`) sont remplaçables, mais les colonnes de l’`INSERT` articles et utilisateurs ne le sont pas.
- Le workflow de publication peut envoyer le paquet sur le registre public npm. Ce n’est pas la bascule de l’application, et il ne faut pas le déclencher pour « mettre Node en production ».
- Risque principal : réécrire les routes déjà présentes ici pendant que le PHP, lui, reste invisible. On obtiendrait un troisième contrat.

## Décisions à arbitrer

1. L’application PHP à migrer est-elle l’hôte ElectronLibre, un WordPress, ou un autre service ? Ce dépôt ne le dit pas.
2. Le périmètre est-il seulement le pupitre (`/api/desk` et équivalents), ou aussi le site public, les paiements et les mails ?
3. Les noms réels des tables et le plancher d’identifiants en production correspondent-ils à `articles` / `users`, 100000 et 900000 ?
4. `contentGen` doit-il rester un compteur mémoire, ou devenir une valeur partagée ? Le code actuel ne partage rien.
5. Faut-il conserver les colonnes `wp_role` et `newsletter_opt_in`, ou les laisser nulles le temps de la bascule ?
6. Qui fournit `hashPassword` et le texte des rôles ? Le cœur ne choisit pas d’algorithme.
7. La bascule se fait-elle chemin par chemin derrière le même domaine, ou par un second hôte le temps du comparatif ?

## Bascule et retour arrière

À ne pas exécuter maintenant.

Tant que l’hôte PHP répond, le processus Node ne le remplace pas. La bascule proposée, une fois les critères de parité verts sur une copie : le proxy envoie vers Node uniquement les chemins du tableau, en commençant par `categories` et `users`. Le PHP continue de servir le reste. Chaque chemin a un interrupteur indépendant. Le retour arrière consiste à renvoyer ce chemin vers le PHP, sans migration de schéma inverse si Node n’a fait qu’écrire dans les tables existantes selon le même contrat. Si un `CREATE TABLE` ou un nouvel identifiant a divergé, le retour arrière n’est plus un simple aiguillage : il faudra un dump d’avant bascule, qui n’existe pas dans ce dépôt. Ne pas couper le PHP, ne pas publier le paquet npm, et ne pas démarrer de service tant que l’arbitrage 1 et l’arbitrage 2 ne sont pas faits.

## Éléments non vérifiés

- Le code source PHP, ses routes réelles, ses sessions, ses crons et ses intégrations.
- Le schéma réel des tables `articles` et `users`.
- Le préfixe d’URL effectivement monté par l’hôte.
- Le comportement de `cleanHtml`, de l’audit, des mails et du stockage média.
- La présence d’un client npm déjà publié et le contenu du secret `NPM_TOKEN` (non lu).
- L’exécution de `npm test` dans cet environnement : non lancée, pour ne pas élargir le travail au-delà de la lecture du dépôt.
