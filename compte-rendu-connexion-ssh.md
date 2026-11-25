# Connexion SSH — préparation de la migration

Date : 24 octobre 2026, 19 h 14, heure de Paris.

Cette étape vérifie seulement l'accès. Aucun inventaire détaillé et aucune migration n'ont été lancés. Rien n'a été modifié sur le serveur. Aucune clé, aucun secret et aucun contenu de fichier sensible ne figurent ici.

## Connexion

La connexion SSH à `root@163.172.185.4` fonctionne avec les accès déjà présents dans l'environnement.

- Utilisateur distant : `root`
- Nom de la machine : `rag-server-EL`

## Répertoires applicatifs visibles

La lecture s'est arrêtée aux noms des dossiers de premier niveau. Leur contenu, les données et les secrets n'ont pas été ouverts.

Sous `/srv` :

- `agents`
- `certif_snep`
- `cursor-bridge-mcp`
- `desinfo`
- `editorial`
- `electronlibre`
- `geo`
- `intel`
- `ops`
- `orchestrator`
- `trading`

Sous `/var/www` :

- `champions-du-monde`
- `dash.electronlibre.info`
- `desinfo`
- `el-astro`
- `electronlibre.info`
- `el-media`
- `kriptopilot`

Ces dossiers pourront être inventoriés plus tard en lecture seule, en restant dans le code applicatif.

## Écartés de cette liste

Ces emplacements n'ont pas été parcourus. Ils ne sont pas retenus comme cibles d'inventaire du code :

- `/srv/backups`
- les copies de validation `cursor-bridge-mcp-validation-20261017-cloud-readonly` et `cursor-bridge-mcp-validation-20261017-plan`
- `/var/www/letsencrypt`, `/var/www/acme-challenge` et `/var/www/html`
- `/opt/containerd` et `/opt/cursor`

Deux fichiers de notes sont aussi présents directement dans `/srv` : `pureev-catalog.md` et `roadmap_agent_global.md`. Ils n'ont pas été lus.
