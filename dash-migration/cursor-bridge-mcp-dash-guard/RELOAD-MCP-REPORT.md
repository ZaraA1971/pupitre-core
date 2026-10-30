# Compte rendu — rechargement de Cursor Bridge MCP

Date : 24 octobre 2026, 18 h 35, heure de Paris.

Seul le service Cursor Bridge a été redémarré. Aucun dépôt applicatif, aucun fichier de `pupitre-core`, aucune règle d'accès du connecteur et aucune autorisation de dépôt n'ont été modifiés. Aucune mission n'a été envoyée à Cursor.

## Unité systemd

Unité utilisée : `cursor-bridge-mcp.service`.

Fichier principal : `/etc/systemd/system/cursor-bridge-mcp.service`.

Compléments :

- `/etc/systemd/system/cursor-bridge-mcp.service.d/cloud-readonly.conf` (inchangé)
- `/etc/systemd/system/cursor-bridge-mcp.service.d/execution.conf` (ajouté)

## Modification d'environnement

Le nouveau complément contient uniquement :

```
[Service]
Environment=CURSOR_BRIDGE_ALLOW_EXECUTION=1
```

Après redémarrage, le processus a ces trois réglages :

- `CURSOR_BRIDGE_MODE=cloud_readonly`
- `CURSOR_BRIDGE_ALLOW_PLAN_SEND=1`
- `CURSOR_BRIDGE_ALLOW_EXECUTION=1`

Le mode lecture cloud et l'envoi en mode plan sont conservés. Le dépôt autorisé reste `https://github.com/ZaraA1971/pupitre-core`.

## Redémarrage

`systemctl daemon-reload` a été exécuté, puis `systemctl restart cursor-bridge-mcp.service` seulement.

Résultat : `success`. État : `active` / `running`. Nouveau processus : `426802`, démarré le 24 octobre 2026 à 18 h 35, heure de Paris. L'ancien processus `9892` s'est arrêté proprement. `NRestarts` vaut 0.

Le journal signale l'avertissement déjà connu de `pydantic` au chargement, puis « Application startup complete ». Le serveur écoute sur `127.0.0.1:8815`. Aucune erreur de démarrage.

## Outils exposés

Le client MCP officiel a reçu cinq outils, en local et par `https://api.electronlibre.info` :

1. `cursor_status`
2. `cursor_last_result`
3. `cursor_request_plan`
4. `cursor_run_result`
5. `cursor_request_execution`

## Capacité

`cursor_status` répond : capacité `cloud_readonly`, agent libre (`IDLE`), simulation fausse.

`cursor_request_execution` est bien chargé. Son paramètre `confirm_write` est un booléen dont la valeur par défaut est faux. Seul `instruction` est obligatoire dans le schéma.

Un appel sans `confirm_write`, puis un appel avec `confirm_write` faux, ont tous les deux été refusés. Le message indique qu'une confirmation explicite est exigée. L'identifiant du dernier tour Cursor est resté `run-f094dccf-2dce-4a09-9b0d-337f4722c072` avant et après ces appels : aucune mission n'a été créée.

## Erreurs

Aucune erreur de service. Le seul message non bloquant est l'avertissement interne de `pydantic` au démarrage.
