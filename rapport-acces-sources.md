# Accès aux sources avant la migration PHP vers Node.js

Vérification du 24 octobre 2026, 19 h 07, heure de Paris. Aucune connexion à un serveur n’a été ouverte. Aucun fichier du dépôt n’a été modifié pour cette vérification, hors le présent compte rendu. Aucun secret n’est recopié ici.

## Dépôt et branche lisibles

Le seul dépôt cloné dans cet environnement est `github.com/ZaraA1971/pupitre-core`.

- Distant : `origin`, URL GitHub `https://github.com/ZaraA1971/pupitre-core`.
- Branche lue et suivie : `cursor/plan-migration-php-nodejs-daf6`, commit `0766b1d87b7927052e8030c51e5d84d3d8cebb88`.
- Branche par défaut du dépôt GitHub : `main`, présente localement au commit `51c7270d37e97291dc9b4367b8b25c9f91a2453f`.
- Lecture GitHub : le compte `cursor` configuré pour `gh` peut interroger ce dépôt. `gh repo view` a renvoyé le propriétaire, l’URL et la branche par défaut.

Le contenu local est le paquet Node `@electronlibre/pupitre-core`. Aucun fichier `.php` et aucun `composer.json` ne s’y trouvent.

Deux autres dépôts publics du même propriétaire sont visibles dans la liste GitHub, sans être clonés ici : `ZaraA1971/EL_ASTRO_CMS` et `ZaraA1971/Desinfo`. Leur code n’a pas été ouvert pour cette vérification. Ils ne constituent pas une copie locale.

## Code installé sur un serveur

Je ne peux pas lire le code installé sur un serveur de production ou de préproduction, parce que je ne m’y suis pas connecté.

Ce qui est configuré, et ce qui ne l’est pas :

- Une variable d’environnement nommée `SCALEWAY_SSH_PRIVATE_KEY` est injectée dans cet environnement. Elle est aussi le seul nom listé par `CLOUD_AGENT_INJECTED_SECRET_NAMES`. Sa valeur n’a pas été lue ni affichée, et elle n’a pas servi à ouvrir de session.
- Il n’y a pas de répertoire `/home/ubuntu/.ssh`, donc pas de configuration SSH, pas de `known_hosts` et pas de clé déposée sous forme de fichier.
- `/srv` existe et ne contient aucune entrée. Aucune arborescence d’application n’y est montée.
- Le seul dépôt Git local d’application est `/workspace/.git`. Aucune autre copie de travail n’est présente sous `/opt`, `/home/ubuntu` ou `/tmp`.

La présence de la variable ne prouve pas que la clé est encore acceptée par un hôte, ni quel utilisateur, quel nom d’hôte ou quel répertoire elle atteindrait. Ces points n’ont pas été testés.

## Comparaison serveur et dépôt

Je ne vois que le dépôt GitHub et sa copie locale. Je ne peux pas comparer ce dépôt au code installé sur un serveur : ce second terme est absent de l’environnement, et aucune connexion n’a été faite pour aller le chercher.

Il n’y a donc pas d’écart constaté entre un serveur et `pupitre-core`. Il n’y a pas non plus de confirmation qu’ils sont identiques.

## Limites

- Interdiction respectée : pas de SSH, pas de service distant, pas de lecture de secret.
- Pas de client SSH configuré, même si une clé est injectée sous forme de variable.
- Pas de copie de production ni de préproduction sur le disque local.
- Les dépôts `EL_ASTRO_CMS` et `Desinfo` sont listables, pas extraits localement.
- Le code PHP dont la migration a été envisagée n’est pas dans la copie lisible. Cette vérification ne le rend pas accessible.
