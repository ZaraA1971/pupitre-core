# Mode exécution — Cursor Bridge MCP

Date : 24 octobre 2026, heure de Paris.
Le service en ligne n'a pas été redémarré. Nginx, le secret du connecteur et l'unité systemd n'ont pas été modifiés.

## Diagnostic

`cursor_request_plan` reste un envoi en mode `plan`. Sa consigne interdit encore les modifications. Il ne sert pas à écrire dans le dépôt.

L'agent Code Vigie est déjà attaché à un seul dépôt, `https://github.com/ZaraA1971/pupitre-core`. Le pont ne choisit pas un autre dépôt dans la requête. Avant ce changement, il ne vérifiait pas non plus la liste renvoyée par Cursor.

L'outil ajouté s'appelle `cursor_request_execution`. Il n'est chargé qu'au démarrage du programme, et seulement si `CURSOR_BRIDGE_ALLOW_EXECUTION=1`. Cette variable n'est pas définie dans le service actuel. Un redémarrage sans elle ne publie donc pas l'outil.

## Contrôles avant toute écriture

L'envoi est refusé, sans POST, dans chacun de ces cas :

- `confirm_write` n'est pas le booléen vrai ;
- la mission cite un autre dépôt GitHub ;
- la mission demande SSH, `sudo`, ou un chemin du serveur (`/srv`, `/etc`, `/root`, `/home`, `/opt`, `/usr`, `/var`, `/bin`, `/tmp`) ;
- la mission contient `cd ..` ou `cd /` ;
- l'agent Cursor n'a pas exactement un dépôt, ou ce dépôt n'est pas `pupitre-core` ;
- l'agent n'est pas libre.

Les formes `https://`, `git@github.com:` et le suffixe `.git` du dépôt autorisé sont acceptées. Un nom proche, comme `pupitre-core-evil`, est refusé.

La requête envoyée fixe `mode` à `agent`, laisse `mcpServers` vide, et ne contient pas de champ `repos`. La consigne autorise la lecture et la modification de ce dépôt seulement.

La réponse contient `status`, `result`, `files`, le dépôt autorisé et le mode. Un fichier renvoyé avec un chemin absolu, ou une branche d'un autre dépôt, fait échouer la réponse au lieu de la présenter comme un succès.

## Authentification

Le passage par le secret existant est inchangé : Bearer sur `/mcp`, ou le même secret dans `/t/<secret>/mcp`. Aucun code OAuth n'est réintroduit ni modifié.

## Déploiement — à ne pas lancer maintenant

1. Laisser le service `cursor-bridge-mcp` tel qu'il tourne.
2. Vérifier les tests : `cd /srv/cursor-bridge-mcp && .venv/bin/python -m pytest -q`.
3. Quand l'exécution est acceptée, ajouter dans le complément systemd `CURSOR_BRIDGE_ALLOW_EXECUTION=1`, sans retirer `cloud_readonly` ni `CURSOR_BRIDGE_ALLOW_PLAN_SEND=1`.
4. Seulement ensuite : `systemctl daemon-reload` puis redémarrer `cursor-bridge-mcp`.
5. Contrôler avec le client MCP que `cursor_request_plan` existe encore et que `cursor_request_execution` refuse un appel sans `confirm_write` vrai.
6. Ne pas ouvrir de port, ne pas modifier Nginx, ne pas changer le dépôt attaché à l'agent.
