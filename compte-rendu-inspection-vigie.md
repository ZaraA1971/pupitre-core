# Compte rendu — accès et inspection de Vigie

Date : 4 novembre 2026, heure de Paris.
Aucun fichier du serveur n’a été modifié. Aucun service n’a été redémarré. Les fichiers `.env`, les clés, les certificats et les secrets n’ont pas été ouverts.

## Accès

Cet environnement peut lire les deux dossiers, par la connexion déjà en place vers la machine `rag-server-EL`.

| Dossier | Présent | Lisible |
| --- | --- | --- |
| `/srv/ops/incident-hub` | oui | oui |
| `/srv/ops/vigie-dev` | oui | oui |

## Code Vigie

Code Vigie a été prévenu et a reçu une consigne de lecture seule, sans droit d’écrire.

Tour : `run-c1885458-93d3-4950-9a51-18e8343022b5`, terminé.
Résultat de Code Vigie : ces dossiers ne sont pas sur sa machine. `/srv/ops` n’y existe pas. Il n’a donc rien lu.

L’inspection ci-dessous a été faite depuis l’environnement qui a réellement accès aux dossiers.

## `/srv/ops/incident-hub` — Vigie en service

C’est le bus d’alertes utilisé en ce moment. Le service `incident-hub` démarre dans ce dossier. Il est actif, comme le canal Telegram et le worker Cursor.

Rôle : recevoir les alertes des services, les classer, prévenir sur Telegram, et proposer une correction seulement pour les cas simples déjà autorisés.

Parties utiles, sans entrer dans les données ni les secrets :

- `app/` — le programme : incidents, chat, missions, clients vers les autres services, porte d’entrée `ingress`
- `scripts/` — vérifications, Telegram, météo, audience, statut
- `deploy/` — modèles d’unités systemd, non réinstallés pendant cette lecture
- `tests/` et `evalbench/` — contrôles et bancs d’essai
- `DOCTRINE.md`, `TELEGRAM.md`, `CURSOR_AGENT.md` — règles de dialogue
- `vigie_door.py` — porte utilisée par les autres programmes pour déposer un signal
- `OFFICIAL_RELEASE.json` — marque de la version en service

Le dossier `data/` contient les files et l’historique. Il n’a pas été parcouru. Le fichier `.env` a été vu de nom seulement, puis écarté.

## `/srv/ops/vigie-dev` — copie de travail

Même famille de programme, installée à côté pour les essais. Aucun service systemd ne la lance. Le port prévu, s’il était un jour utilisé, est `8791`. Rien n’écoute pour cet environnement.

En plus de la production, ce dossier contient :

- `qualif/` — lanceurs et protocoles des campagnes V5.5
- `rapports/` — comptes rendus de ces campagnes, de V5.5E à V5.5O, plus la note d’installation
- `isolation/blank.env` — masque vide, non lu
- `COMMANDES.md` — commandes de cet environnement

Il n’a pas de dépôt Git à la racine. La note d’installation dit que la copie vient d’une archive, pas du dossier de production, et que la production n’a pas été écrasée.

## Différences de code

Les deux arbres partagent le cœur : `app/`, `scripts/`, `deploy/`, `evalbench/`, `tests/`.

Présent seulement en production :

- la conversation native : `app/chat_native.py`, `app/native_conversation.py`, `app/conversation_route.py`
- les tests qui vont avec
- `OFFICIAL_RELEASE.json`

Présent seulement dans la copie de travail :

- `qualif/`, `rapports/`, `COMMANDES.md`, `isolation/`

## Écarts

Code Vigie ne peut pas inspecter ces dossiers tant qu’il n’est pas lancé sur cette machine. L’accès réel est ici. Aucun secret n’a été recopié dans ce compte rendu.
