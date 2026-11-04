# Audit — étendre `cursor_request_execution` vers la cible fixe `dash-migration`

Date : 24 octobre 2026 (Europe/Paris).  
Lecture seule. Aucune modification du pont, d’Auth0, d’Alpic, de Nginx, du plugin ChatGPT, ni de `/var/www/dash.electronlibre.info`. Aucun secret recopié.

## Verdict

`dash-migration` n’est **pas** un second dépôt GitHub. C’est un **répertoire isolé** déjà présent dans le dépôt unique attaché à l’agent Code Vigie (`https://github.com/ZaraA1971/pupitre-core`), sur la branche de travail `cursor/plan-migration-php-nodejs-daf6`. Il **n’existe pas** sur `origin/main` au moment de cet audit.

La modification minimale n’est donc pas « ajouter un repo », mais **introduire une cible nommée fixe** `dash-migration` qui :

1. garde le même agent et le même dépôt autorisé ;
2. renforce le filtre d’instruction et le contrôle des fichiers modifiés pour **confiner les écritures** sous `dash-migration/` ;
3. laisse `/var/www/dash.electronlibre.info` hors périmètre (déjà bloqué par le filtre absolu `/var…`) ;
4. ne touche pas à l’authentification MCP actuelle (`MCP_TOKEN` / Bearer / `/t/<secret>/mcp`).

Sans cette cible (et sans branche contenant `dash-migration`), `cursor_request_execution` autorise aujourd’hui tout le dépôt `pupitre-core`, pas seulement l’espace isolé.

## Chaîne d’autorisation de bout en bout (état actuel)

```
Client (ChatGPT / autre)
  → HTTPS api.electronlibre.info …/mcp  (ou loopback 127.0.0.1:8815/mcp)
  → TokenGate (server.py) : Bearer ou /t/<secret>/mcp
  → outil MCP cursor_request_execution(instruction, confirm_write=false)
  → execution.configured_execution()
       exige CURSOR_BRIDGE_MODE=cloud_readonly
       et CURSOR_BRIDGE_ALLOW_EXECUTION=1
  → ExecutionSender.send()
       1) assert_instruction_allowed (confirm_write is True, longueur, OUTSIDE_WORKSPACE, repos cités)
       2) GET agent → assert_agent_repository (id fixe + exactement 1 repo = pupitre-core)
       3) agent.status == IDLE
       4) POST /v1/agents/<AGENT_ID>/runs  mode=agent, mcpServers=[], pas de champ repos
       5) PREFIX texte autorise lecture/écriture sur tout pupitre-core
       6) _checked_result / modified_files : refuse chemins absolus et autres repoUrl
  → Agent cloud Code Vigie (bc-01a10cbc-5519-749c-823d-1785c3eadaf6)
       workspace réel = checkout cloud du dépôt attaché (pas le FS Debian du pont)
```

### 1. Filtre du tool MCP (`server.py`)

- Outil enregistré seulement si `CURSOR_BRIDGE_ALLOW_EXECUTION=1`.
- Signature actuelle : `(instruction: str, confirm_write: bool = False)`.
- **Aucun paramètre de cible / sous-arbre.** La description annonce tout `pupitre-core`.
- Auth inchangée en amont (`TokenGate`) ; hors périmètre de cet audit fonctionnel.

### 2. Cible transmise (`execution.py`)

| Contrôle | Comportement actuel |
| --- | --- |
| `confirm_write is True` | Obligatoire (booléen strict) |
| `OUTSIDE_WORKSPACE` | Refuse `/srv|/etc|/root|/home|/opt|/usr|/var|/bin|/tmp`, `ssh`/`scp`/`sudo`, `cd ..`, `cd /` |
| Repos cités dans le texte | Doivent normaliser vers `github.com/zaraa1971/pupitre-core` |
| Repo agent | Exactement une URL = `pupitre-core` |
| Payload | `mode=agent`, `mcpServers=[]`, **pas** de `repos` (le dépôt vient de l’attache agent) |
| PREFIX | Autorise lire **et modifier** tout le dépôt |
| `modified_files` | Refuse chemins absolus/`~` et `repoUrl` étrangers ; **n’exige pas** le préfixe `dash-migration/` |

Conséquence : une mission confirmée peut modifier n’importe quel chemin relatif du CMS (`src/…`, etc.), pas seulement `dash-migration/`.

### 3. Workspace réel de l’agent d’exécution

Constat indépendant des secrets Debian du pont :

- L’environnement cloud de cet agent liste **un seul** dépôt : `github.com/ZaraA1971/pupitre-core` (outil `cursor-cloud` `environment-info`, session courante).
- Le pont force le même `AGENT_ID` et refuse tout autre scope repo.
- Le workspace d’exécution est le **checkout cloud** de cet agent, typiquement sous `/workspace/…` dans le pod — **pas** `/srv/cursor-bridge-mcp` ni `/var/www/…` sur `163.172.185.4`.
- Les accès SSH / fichiers de secrets de **cette** session Cloud Agent ne sont **pas** ceux du service systemd du pont ; le pont lit sa clé Cursor via `CURSOR_API_KEY_FILE` (credential systemd) pour appeler l’API. L’agent, lui, n’a pas besoin de cette clé pour travailler dans son checkout.

### 4. Droits de fichiers et accès à `dash-migration`

| Question | Réponse établie |
| --- | --- |
| L’agent peut-il voir `dash-migration` ? | **Oui, s’il checkoute une révision qui contient ce chemin.** Sur la branche `cursor/plan-migration-php-nodejs-daf6`, le chemin existe. Sur `origin/main` (**fetch du 24 oct. 2026**), `git cat-file` indique que `dash-migration` **n’est pas** dans l’arbre. |
| Est-ce un dépôt séparé ? | **Non.** |
| Accès à `/var/www/dash.electronlibre.info` ? | Hors workspace agent. Le filtre d’instruction refuse déjà les chemins `/var…`. Le pont interdit SSH. Aucune preuve que l’agent partage la clé Scaleway du pont ; ne pas le supposer. |
| Confinement écriture actuel ? | **Non** au niveau sous-arbre : seulement dépôt entier + interdiction chemins absolus / SSH. |

Précondition hors code du pont : pour qu’une mission « cible dash-migration » trouve les fichiers, l’agent doit démarrer sur une branche / un commit où `dash-migration/` existe (fusion dans `main`, ou run explicitement sur la branche de migration). Sinon l’outil peut être « autorisé » alors que le workspace ne contient pas encore le lot.

## Écart avec l’objectif

Objectif : cible **nommée et fixe** = uniquement `dash-migration`, écritures confinées, prod PHP en lecture seule (idéalement inaccessible), pas de shell root / chemins libres / SSH arbitraires, auth MCP préservée.

Écarts :

1. Pas de paramètre `target` ; portée = dépôt entier.
2. `modified_files` ne vérifie pas `dash-migration/`.
3. PREFIX n’impose pas le sous-arbre.
4. Présence Git de `dash-migration` absente de `main` → risque de workspace vide pour ce lot.

## Modification minimale proposée (non appliquée)

Périmètre code : **`/srv/cursor-bridge-mcp/execution.py`**, **`server.py`** (signature + description), **`tests/test_execution.py`**.  
Pas de changement Auth0 / Alpic / Nginx / `MCP_TOKEN` / unité Auth.  
Optionnel doc : `EXECUTION-MODE.md`.  
Redémarrage service **uniquement après** accord, pour recharger le code (les flags `CURSOR_BRIDGE_ALLOW_EXECUTION=1` sont déjà présents).

### A. Cible nommée fixe

Dans `execution.py` :

```text
ALLOWED_TARGETS = {
  "dash-migration": {
    "repository": "https://github.com/ZaraA1971/pupitre-core",  # inchangé
    "repo_key": "github.com/zaraa1971/pupitre-core",
    "path_prefix": "dash-migration/",
  },
}
```

- Seule clé acceptée : `"dash-migration"` (refus de toute autre chaîne, chemin libre, URL, ou omise si on rend le paramètre obligatoire).
- Ne **pas** accepter de chemin libre type `/workspace/...` ou `/var/www/...` comme cible.

### B. Signature outil (`server.py`)

```text
cursor_request_execution(
  instruction: str,
  confirm_write: bool = False,
  target: str = "dash-migration",  # littéral unique pour l’instant
) -> dict
```

- Si `target != "dash-migration"` → erreur avant tout POST.
- Description : écriture autorisée **uniquement** sous `dash-migration/` du dépôt `pupitre-core` ; refus prod, SSH, autres dépôts.

Variante « en plus » plus tard : ajouter une seconde clé `"pupitre-core"` pour l’ancien comportement dépôt entier — **hors minimum** si l’objectif est uniquement le lot isolé.

### C. Contrôles à ajouter / renforcer

1. **Avant POST** (`assert_instruction_allowed`)  
   - Conserver `confirm_write is True`, `OUTSIDE_WORKSPACE`, filtre repos.  
   - Ajouter : toute mention de chemin absolu Unix → refus.  
   - Ajouter : si l’instruction cite un chemin de fichier/repo relatif clairement hors `dash-migration/` **et** demande une modification (heuristique stricte ou refus de tout chemin relatif hors préfixe) → refus. Minimum sûr : exiger que si un chemin `…/…` apparaît, il commence par `dash-migration/`.  
   - Garder le blocage `/var…` (donc `/var/www/dash.electronlibre.info`).

2. **PREFIX**  
   Remplacer le texte « tu peux modifier ce dépôt » par :  
   - lecture possible du dépôt pour contexte si besoin, **mais modifications uniquement sous `dash-migration/`** ;  
   - interdiction explicite de modifier le reste de `pupitre-core`, de toucher `/var/www/dash.electronlibre.info`, SSH, sudo, chemins libres.

3. **Après réponse** (`modified_files`)  
   - Chaque chemin relatif doit matcher `^dash-migration/` (normaliser `./`, refuser `..`).  
   - Conserver refus absolus et `repoUrl` ≠ pupitre-core.  
   - Réponse outil : inclure `"target": "dash-migration"` et `"path_prefix": "dash-migration/"`.

4. **Inchangé**  
   - `assert_agent_repository` (toujours pupitre-core).  
   - Pas de champ `repos` dans le POST.  
   - Pas de shell root, pas de proxy SSH, pas d’ouverture de chemins libres côté pont.

### D. Paramètres / fichiers

| Fichier | Changement |
| --- | --- |
| `/srv/cursor-bridge-mcp/execution.py` | cibles, PREFIX, filtres, `modified_files`, `send(..., target=)` |
| `/srv/cursor-bridge-mcp/server.py` | param `target`, description outil |
| `/srv/cursor-bridge-mcp/tests/test_execution.py` | cas refus hors préfixe, acceptation sous préfixe, `target` invalide |
| systemd / Nginx / Auth0 / Alpic | **aucun** pour cette fonctionnalité |
| Dépôt GitHub / branche | précondition : `dash-migration/` présent sur le ref que l’agent checkout |

## Contrôles nécessaires avant activation

1. Fusionner ou faire démarrer l’agent sur une révision contenant `dash-migration/`.  
2. `cd /srv/cursor-bridge-mcp && .venv/bin/python -m pytest -q` (tests locaux du pont, sans POST réel).  
3. Après accord : redémarrer **uniquement** `cursor-bridge-mcp.service` pour charger le code (pas de changement de jeton).  
4. Vérifier la liste d’outils MCP : `cursor_request_execution` expose `target`.  
5. Appels négatifs (sans mission utile) :  
   - `confirm_write=false` → refus, aucun run ;  
   - `target="pupitre-core"` ou chemin libre → refus ;  
   - instruction avec `/var/www/...` ou `ssh` → refus ;  
   - instruction « modifie `src/...` » (hors préfixe) → refus.  
6. Ne pas pointer d’essai vers la prod PHP ; ne pas déployer depuis le pont.

## Moyen de vérifier le nouveau périmètre sans toucher à la production

1. **Tests unitaires** sur le pont (FakeAPI) : aucun appel réseau Cursor réel ; assert sur payload PREFIX + rejet `modified_files(["src/x"])` + acceptation `dash-migration/node-admin-rss/…`.  
2. **Smoke MCP authentifié en lecture** : `cursor_status` (IDLE) — déjà possible ; ne lance pas d’exécution.  
3. **Exécution négative** : `cursor_request_execution` avec `confirm_write=true` et instruction volontairement hors préfixe → erreur pont, **aucun** fichier produit ; contrôler que `latest_run_id` ne change pas (comme lors des tests `confirm_write` faux du rapport de reload).  
4. **Exécution positive limitée** (seulement après merge/branche OK) : mission anodine du type « ajoute une ligne dans `dash-migration/…/README` de test » ; vérifier que la réponse `files` ne contient que des chemins `dash-migration/…` ; revert/commit sur branche non prod.  
5. **Non-vérifications volontairement exclues** : pas de SSH vers Debian pour « prouver » l’absence d’écriture sous `/var/www` (le filtre + l’absence de SSH dans le PREFIX suffisent comme contrôles du pont ; un contrôle FS prod serait un accès prod à éviter).

## Synthèse

| Élément | État |
| --- | --- |
| Pont démarré, auth MCP | OK, hors modification |
| Agent = pupitre-core | OK |
| Accès agent à `dash-migration` | OK **si** ref Git le contient ; **KO sur main actuel** |
| Confinement écriture sous-arbre | **Absent** → à ajouter via cible nommée |
| Prod `/var/www/dash…` | Déjà exclue du texte d’instruction ; à rappeler dans PREFIX |
| Changement minimal | `execution.py` + `server.py` + tests ; pas d’auth ; pas de nouveau serveur |

Aucune des modifications ci-dessus n’a été appliquée dans cette passe.
