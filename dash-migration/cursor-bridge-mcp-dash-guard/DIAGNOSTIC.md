# Diagnostic — Cursor Bridge MCP

Date du constat : 24 octobre 2026, 18 h 20, heure de Paris.
Aucune configuration n'a été modifiée pour écrire ce diagnostic. Le service n'a pas été redémarré. Le jeton MCP et la clé Cursor ne sont pas recopiés ici.

## Constat

Le serveur qui répond sur `127.0.0.1:8815`, et donc aussi sur `https://api.electronlibre.info`, n'expose pas un seul outil. Un client MCP officiel a reçu quatre outils :

| Outil | Rôle actuel |
| --- | --- |
| `cursor_status` | Lit l'état de l'agent Cursor déjà choisi |
| `cursor_last_result` | Lit le dernier résultat de cet agent |
| `cursor_request_plan` | Envoie une demande en mode plan, avec interdiction de modifier |
| `cursor_run_result` | Relit un tour précis de cet agent |

`cursor_status` répond aujourd'hui : agent `Code Vigie`, état `IDLE`, `simulated` faux, `capability` égal à `cloud_readonly`.

Le dernier commit Git, `1a5a298`, ne contient encore que `cursor_status`, et celui-ci renvoie le faux statut `READY_MOCK`. Les quatre outils viennent de fichiers présents sur le disque mais non commités. Le processus lancé le 17 octobre 2026 à 14 h 22, heure de Paris, a chargé cette version de travail. Il tourne encore avec ce code.

## Pourquoi le serveur annonce `cloud_readonly`

Ce n'est pas un statut renvoyé par Cursor. L'API Cursor dit que l'agent est `IDLE`.

Le mot est ajouté par le pont, dans `cloud_reader.py` : le champ `capability` est écrit en dur avec la valeur `cloud_readonly`.

Cette branche est prise parce que le processus a la variable `CURSOR_BRIDGE_MODE=cloud_readonly`. Elle ne vient pas du fichier d'unité principal. Ce fichier demande encore `local_mock`. Un ajout systemd, `/etc/systemd/system/cursor-bridge-mcp.service.d/cloud-readonly.conf`, remplace la commande de démarrage et force `cloud_readonly` ainsi que `CURSOR_BRIDGE_ALLOW_PLAN_SEND=1`.

Conséquence : `cursor_status` n'emprunte plus le chemin simulé. Il interroge l'agent Cursor fixe `bc-01a10cbc-5519-749c-823d-1785c3eadaf6` et recopie `cloud_readonly` dans la réponse.

## Pourquoi l'on peut croire qu'un seul outil est exposé

Trois niveaux ne disent pas la même chose.

1. Le commit publié ne déclare que `cursor_status`.
2. Le texte de cet outil dit qu'il ne transmet aucune instruction.
3. Le client public, lui, reçoit bien les quatre outils. Cela a été vérifié à la fois en local et par l'adresse HTTPS du connecteur.

Les deux outils d'envoi ne sont enregistrés qu'au démarrage du programme, et seulement si `CURSOR_BRIDGE_ALLOW_PLAN_SEND` vaut `1`. Cette condition est remplie dans le processus actuel. Sans elle, ou avec le code du dernier commit, il ne resterait que la lecture. `cursor_last_result` est enregistré même sans cette option, mais il refuse de fonctionner hors de `cloud_readonly`.

`cursor_request_plan` est marqué comme pouvant modifier quelque chose à l'extérieur (`destructiveHint` vrai, `readOnlyHint` faux). Un afficheur peut le ranger à part d'un outil de lecture. Le protocole MCP, lui, le liste.

Il n'existe pas d'outil nommé pour écrire dans un dépôt. L'outil le plus proche, `cursor_request_plan`, fait l'inverse : il interdit les modifications.

## Périmètre déjà configuré

L'agent `Code Vigie` est lié à un seul dépôt :

`https://github.com/ZaraA1971/pupitre-core`

Son environnement cloud s'appelle `ZaraA1971/Scaleway`. La liste `repos` ne contient pas d'autre adresse. `workOnCurrentBranch` est faux. Le pont ne choisit pas le dépôt : il ne l'envoie pas dans la requête. Le tour part donc sur le dépôt déjà attaché à cet agent.

Le pont ne vérifie pas cette liste avant un envoi. Il se contente de l'identifiant d'agent écrit dans le code. Tant que cet identifiant ne change pas, un autre dépôt n'est pas ajouté. Si l'agent Cursor était réattaché à un autre dépôt, le pont suivrait sans s'en apercevoir.

## Pourquoi aucune instruction de lecture ou de modification du dépôt n'est possible

`cursor_request_plan` envoie un POST à l'adresse fixe de cet agent, avec trois verrous :

- `mode` est forcé à `plan` ;
- le texte ajouté devant la demande interdit de modifier un fichier, un dépôt, un service, un secret ou une configuration, interdit SSH, et interdit commit et pull request ;
- `mcpServers` est une liste vide.

L'envoi n'a lieu que si l'agent est `IDLE`. Il n'y a pas de seconde tentative automatique. Le README du répertoire indique en plus que le mode plan n'enlève pas les droits déjà donnés à l'agent, notamment un accès SSH ou production. L'interdiction de modifier est donc une consigne, pas une barrière technique sur les droits de l'agent.

Les autres outils ne font que des lectures GET. Aucun paramètre ne permet de désigner un autre dépôt, une autre branche, ou un mode d'écriture.

## Authentification

Les règles d'accès du connecteur n'ont pas été touchées. Il n'y a plus de code OAuth ni Auth0 dans ce dépôt. L'accès reste le secret déjà en place : en-tête Bearer sur `/mcp`, ou le même secret dans le chemin `/t/<secret>/mcp`. Ce diagnostic ne le relit pas et ne le change pas.

## Écart avec l'objectif

L'objectif est un outil supplémentaire qui envoie une instruction à cette instance Cursor pour lire et modifier le dépôt autorisé, sans ouvrir d'autres dépôts.

Aujourd'hui, le trou est celui-ci : le seul outil d'envoi force le mode plan et une consigne de non-modification. Le dépôt autorisé est déjà unique, `pupitre-core`, mais le pont ne le contrôle pas dans la requête. Un futur outil d'écriture devrait rester sur le même agent, refuser tout autre dépôt, et ne pas réutiliser le préfixe qui interdit les modifications. Ce travail n'est pas fait ici.
