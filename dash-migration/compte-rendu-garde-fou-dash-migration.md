# Compte rendu — garde-fou MCP `dash-migration` (copie isolée)

Date : 24 octobre 2026 (Europe/Paris).

## Emplacement du travail

Copie séparée uniquement (service actif **non** modifié) :

`dash-migration/cursor-bridge-mcp-dash-guard/`

Branche locale de la copie : `cursor/mcp-dash-migration-guard-daf6`.

**Non touchés :** `/srv/cursor-bridge-mcp` (fichiers servis), unité systemd,
Auth0, Alpic, Nginx, jetons, redémarrage, déploiement.

## Fichiers changés (dans la copie)

| Fichier | Changement |
| --- | --- |
| `execution.py` | Cible littérale `dash-migration` ; PREFIX confiné ; vérif branche via GitHub contents ; `modified_files` exige le préfixe ; refuse `..` et absolus ; doc post-check ≠ sandbox |
| `server.py` | Paramètre `target` (défaut `dash-migration`) + description alignée |
| `tests/test_execution.py` | Cibles invalides, branche sans dossier, hors préfixe, absolus, traversal, résultat post-run hors préfixe |
| `LIMITATION-POSTCHECK.md` | Limite explicite du post-contrôle |

## Résultats des tests

Commande (dans la copie) :

```bash
cd dash-migration/cursor-bridge-mcp-dash-guard
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest -q
```

Résultat : **60 passed**, 0 failed (1 warning pydantic déjà connu).  
Journal : `/opt/cursor/artifacts/cursor-bridge-dash-guard-tests.log`.

## Mode de rattachement de l’agent

Inchangé côté conception :

- Agent fixe Code Vigie (`AGENT_ID` dans `cloud_reader.py`).
- Dépôt GitHub unique toujours `https://github.com/ZaraA1971/pupitre-core`.
- Le POST d’exécution n’envoie toujours **pas** de champ `repos` : le dépôt
  reste celui déjà attaché à l’agent.
- Nouveau : l’agent doit exposer `repos[0].branch` (ou `ref`) ; le pont vérifie
  ensuite que ce ref contient le dossier `dash-migration/` via
  `GET https://api.github.com/repos/ZaraA1971/pupitre-core/contents/dash-migration?ref=<branch>`
  (dépôt public, sans secret).
- Sur `main` sans ce dossier, l’exécution est refusée avant POST Cursor.
- Sur une branche qui contient `dash-migration/` (ex. branche de migration), la
  vérification passe.

## Limite documentée (non-sandbox)

Le contrôle `modified_files()` est **après** exécution. Il peut faire échouer la
réponse MCP si un chemin hors `dash-migration/` est signalé ; il **ne garantit
pas** qu’aucun autre fichier n’a déjà été modifié. Voir
`cursor-bridge-mcp-dash-guard/LIMITATION-POSTCHECK.md` et le docstring de
`execution.py`. `/var/www/dash.electronlibre.info` reste hors écriture autorisée
(filtre `/var…` + PREFIX).

## Étapes restantes avant tout déploiement

1. Revue humaine du diff dans la copie.
2. Décider du ref que Code Vigie checkoutera (fusion `dash-migration/` dans
   `main`, ou branche agent pointant vers une révision qui contient le dossier).
3. S’assurer que l’API agent renvoie bien `repos[0].branch` / `ref` (sinon le
   pont refuse avec « Agent branch is unknown »).
4. Copier uniquement les sources validées vers `/srv/cursor-bridge-mcp` (hors
   `.venv` de la copie de test), sans toucher Auth0/Alpic/Nginx/jetons.
5. `pytest` sur la cible de déploiement, puis **accord explicite** avant
   `systemctl restart cursor-bridge-mcp`.
6. Smoke négatif : `target` invalide, `confirm_write=false`, branche sans
   dossier ; smoke positif limité sous `dash-migration/` seulement.
7. Ne pas déployer tant que ces points ne sont pas validés.
