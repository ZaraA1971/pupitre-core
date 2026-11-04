# Compte rendu — isolation API Cursor vs garde-fou MCP (`dash-migration`)

Date : 24 octobre 2026 (Europe/Paris).  
Lecture seule. Aucun secret lu, aucun SSH, aucun redémarrage, aucune modification du pont actif `/srv/cursor-bridge-mcp`.

Sources :

- Copie du pont : `dash-migration/cursor-bridge-mcp-dash-guard/` (`cloud_reader.py`, `execution.py`, `plan_sender.py`)
- Documentation publique Cursor Cloud Agents API (`https://cursor.com/docs/cloud-agent/api/endpoints`, overview)
- État agent courant (outil cloud, sans secret) : dépôt unique `github.com/ZaraA1971/pupitre-core`, environnement `ZaraA1971/Scaleway`

## Verdict

**L’API Cursor telle qu’utilisée par le pont ne permet pas d’exécuter une mission dans un workspace réellement isolé qui ne contiendrait que le code sanitizé `dash-migration/`, ni de fixer explicitement la branche/ref sur chaque mission d’exécution.**

Conséquence pour cette migration : **garder les écritures MCP désactivées** (`CURSOR_BRIDGE_ALLOW_EXECUTION` / `cursor_request_execution` non déployés, ou laissés off sur le service actif). Les consignes textuelles et le post-check `modified_files` ne compensent pas l’absence d’isolation API.

## Ce que le pont appelle réellement

| Appel | URL | Corps observé dans le code |
| --- | --- | --- |
| Identité agent | `GET /v1/agents/{AGENT_ID}` | — |
| Plan / exécution | `POST /v1/agents/{AGENT_ID}/runs` | `prompt`, `mode` (`plan` ou `agent`), `mcpServers: []` |
| Résultat | `GET /v1/agents/{AGENT_ID}/runs/{runId}` | — |

Point critique (`execution.py`) : le payload d’exécution **interdit** la présence d’un champ `repos` (`if "repos" in payload … raise`). Même si l’API create-agent documente `repos` / `startingRef`, **ce chemin n’est pas celui du pont** : le pont envoie un **follow-up** sur un agent déjà attaché.

Documentation Create A Run (`POST /v1/agents/{id}/runs`) : corps documenté = `prompt`, `mcpServers` (optionnel), `mode` (optionnel), `delivery` (optionnel).  
**Pas** de `repos`, **pas** de `startingRef`, **pas** de filtre de sous-répertoire. La doc précise que le follow-up « uses the agent's current conversation and workspace state ».

## Garanties API vs non-garanties

### Pris en charge par l’API (hors chemin actuel du pont)

À la **création** d’un agent (`POST /v1/agents`) :

- `repos[].url` : dépôt Git complet (provider supporté).
- `repos[].startingRef` : nom de branche ou SHA (40 car.) comme point de départ ; `prUrl` peut remplacer le ref.
- `workOnCurrentBranch` : poussée sur le ref de départ vs branche `cursor/...` générée.
- Environnement nommé (`env`) **ou** `repos` explicites (mutuellement exclusifs avec un env cloud nommé).

Limites documentées / forum :

- Un nom de branche en `startingRef` se résout au **HEAD au démarrage**, ce n’est pas un pin immuable comme un SHA.
- Un SHA non présent sur la branche par défaut / hors PR peut être rejeté.
- Pas de paramètre documenté du type « checkout sparse / uniquement `dash-migration/` ».

### Non pris en charge (pour l’objectif « workspace = seulement dash-migration »)

| Besoin | Statut API documenté |
| --- | --- |
| Workspace contenant **uniquement** le sous-arbre sanitizé `dash-migration/` | **Non** — l’unité est le **dépôt** (ou multi-repos entiers), pas un sous-dossier |
| Agent « isolé dash-migration » distinct du reste de `pupitre-core` via un flag API | **Non** trouvé |
| Sur `POST …/runs` (follow-up du pont) : fixer `startingRef` / changer de dépôt | **Non** documenté ; le pont refuse même `repos` dans le payload |
| Isolation OS empêchant l’écriture hors d’un préfixe | **Non** — VM cloud avec checkout dépôt ; pas une sandbox de sous-arbre |

L’environnement cloud actuel de Code Vigie liste `repos: [github.com/ZaraA1971/pupitre-core]` — dépôt **entier**, pas un extrait sanitizé.

## Distinction des trois couches

| Couche | Nature | Isole `dash-migration` ? | Pin branche/ref de la mission ? |
| --- | --- | --- | --- |
| **API Cursor** (create agent + `startingRef`) | Contrat plateforme | Non (repo entier) | Oui **à la création** seulement (branche/SHA/PR), pas sur chaque follow-up du pont |
| **API Cursor** (follow-up `/runs` utilisé par le pont) | Contrat plateforme | Non | **Non** |
| **Consigne `PREFIX` + filtres texte** | Soft | Non (obéissance modèle) | Non |
| **Vérif GitHub contents pré-POST** | Preuve d’existence du dossier sur un ref déclaré | Non | Non (ne pinne pas le run) |
| **`modified_files` post-run** | Détection sur métadonnées signalées | Non (après coup, liste non garantie exhaustive ; souvent au statut `CREATING`) | Non |

## Recommandation pour la migration Le Dash

1. **Ne pas activer** `cursor_request_execution` / `CURSOR_BRIDGE_ALLOW_EXECUTION` pour faire écrire l’agent via MCP dans `dash-migration/`.
2. Continuer la migration par la voie déjà utilisée : commits / PR sur la branche de migration dans le dépôt, revue humaine, sans s’appuyer sur le pont pour l’écriture.
3. Les outils MCP en **lecture** (`cursor_status`, résultats) peuvent rester utiles ; l’écriture MCP reste hors périmètre sûr.
4. Une évolution future éventuelle (hors scope immédiat) serait un **nouvel agent** créé via `POST /v1/agents` avec `repos[].startingRef` pointant vers la branche de migration — cela pinne au mieux le **repo entier** à un ref, **pas** un workspace « dash-migration only ». Cela ne suffit toujours pas à l’objectif d’isolation sous-arbre ; les écritures MCP resteraient déconseillées pour cette raison.

## Fichiers de référence dans le workspace

- Pont (copie) : `dash-migration/cursor-bridge-mcp-dash-guard/execution.py`, `cloud_reader.py`
- Audit garde-fou : `dash-migration/audit-mcp-cible-dash-migration.md`
- Limite post-check : `dash-migration/cursor-bridge-mcp-dash-guard/LIMITATION-POSTCHECK.md`
- **Ce compte rendu :** `dash-migration/compte-rendu-api-cursor-isolation.md`
