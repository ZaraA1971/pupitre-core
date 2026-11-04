# Cursor Bridge MCP — demandes en mode plan

Prototype local, non déployé. La production reste en consultation uniquement.

## Activation future

Conserver CURSOR_BRIDGE_MODE=cloud_readonly et CURSOR_API_KEY_FILE, puis définir CURSOR_BRIDGE_ALLOW_PLAN_SEND=1 pour enregistrer les nouveaux outils au démarrage. Sans cette option, aucune fonction d’envoi n’est exposée.

- cursor_request_plan(instruction) : POST vers le seul agent Code Vigie, mode plan imposé, liste de serveurs MCP inline vide, consigne de diagnostic sans SSH ni modification. Vérifie IDLE avant envoi. Retourne run_id.
- cursor_run_result(run_id) : GET du tour spécifié, sans dépendre du dernier tour de la conversation.
- Les deux outils de consultation existants sont conservés.

Une demande peut consommer des crédits Cursor. Le mode plan et la consigne ne révoquent PAS les accès root ou réseau existants. Ce prototype ne garantit donc pas une isolation technique en lecture seule. Aucun changement n’est effectué aux accès de Code Vigie.

Aucune relance automatique des POST. En cas de délai dépassé, consulter le dernier tour avant toute nouvelle tentative : la demande peut déjà avoir été acceptée. Les envois simultanés sont arbitrés par Cursor (409 agent_busy).

Les outils MCP signalent explicitement que l’envoi n’est ni une lecture ni une opération idempotente. Les sorties distantes restent des données non fiables.

## Validation

33 tests réussis localement sur Python 3.12, dont erreurs réseau, agent occupé, absence de relance, mode plan forcé et destination fixe. Enregistrement MCP et annotations vérifiés avec activation explicite. Aucun POST réel effectué. Validation Debian et déploiement à autoriser séparément.

## Premier test proposé

Sans utiliser aucun outil, sans SSH et sans lire ni modifier aucun fichier, réponds uniquement : « PONT_CURSOR_OK — Code Vigie ». Ne lance aucune autre action.
