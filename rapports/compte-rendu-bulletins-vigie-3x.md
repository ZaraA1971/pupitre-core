# Bulletins Vigie : 3× / jour + plafonds web

Date : 2026-11-16  
Hôte : `rag-server-EL` (`163.172.185.4`)  
Politique : `VIGIE_EXECUTION_POLICY=shadow` (inchangée)

## Constat

Les messages Telegram `[Info]` partaient via le drain d’ingress à chaque refresh RSS, bornés seulement par `INFO_NOTIFY_MIN_INTERVAL_SEC=7200` (~toutes les 2 h). Trop nombreux.

Les digests calendrier / service_knock (météo 08h+19h, audience 08h, Kriptopilot 08h10, repos 00h30) restent distincts des bulletins `[Info]`.

## Décision appliquée

Trois créneaux **Europe/Paris** pour les lots `[Info]` :

| Créneau | Heure |
|---|---|
| Matin | 07:00 |
| Midi | 12:30 |
| Soir | 19:00 |

Fenêtre de grâce : 900 s après le créneau. Un seul envoi par créneau et par jour. Hors créneau : la file accumule (`hold_info`).

Plafonds web sur livraison lot / digest calendrier :

- `web_search` ≤ 1 (sans images)
- `web_read` ≤ 2
- livraison `[Info]` : `max_tools=3`, `max_steps=4`

## Fichiers modifiés

Sur `/srv/ops/vigie-dev` puis promotion `/srv/ops/incident-hub` :

- `app/config.py` — `INFO_NOTIFY_SLOTS_PARIS`, `INFO_NOTIFY_SLOT_GRACE_SEC`, `LOT_WEB_*_MAX`
- `app/ingress.py` — gating créneaux + `info_hold_fact`
- `app/chat_delivery.py` — plafonds gestes pour `info_batch`
- `app/turn_loop.py` — compteurs web sur canaux `lot` / `calendar_digest`
- `app/tools/infos.py` — pas d’images sur livraison tamponnée
- `tests/test_info_notify_slots.py` — nouveaux tests

Sauvegardes :

- `vigie-dev/backups/bulletins-3x-20261116T152231Z`
- `incident-hub/backups/bulletins-3x-20261116T152325Z`

`.env` non modifié (créneaux par défaut code). Timer `vigie-schedule-tick` conservé.

## Qualif

- `unittest tests.test_info_notify_slots` : 4/4 OK (dev + prod)
- `unittest tests.test_ingress` : 21/21 OK (dev + prod)
- Hub redémarré, `/health` OK, shadow actif
- À 16:24 Paris : hors créneau → `cooldown_ok=False`, prochain bulletin annoncé à 19:00
- File ouverte : ~30k infos en attente ; un lot ne prend que `INFO_LOT_MAX=6` plus récents

## Contrôle à suivre

Sur 24–48 h : vérifier au plus 3 `[Info]` / jour aux créneaux, et dans les traces lot au plus 1 `web_search` / 2 `web_read`.
