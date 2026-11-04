# Limite du garde-fou `modified_files`

`modified_files()` s’exécute **après** le tour Cursor, sur les chemins que l’API
signale comme modifiés. Ce n’est **pas** une sandbox système.

Conséquences :

- si l’agent a déjà écrit hors de `dash-migration/`, le pont peut seulement
  **faire échouer le résultat** présenté au client MCP ;
- il ne peut pas empêcher ni annuler ces écritures ;
- le confinement repose aussi sur la consigne (`PREFIX`), le littéral
  `target=dash-migration`, les filtres d’instruction, et la vérification que la
  branche agent contient `dash-migration/` (API GitHub publique contents).

Ne pas présenter ce mécanisme comme un confinement OS ou un isolement root.
