# Diagnostic préparatoire Vigie (lecture seule)

**Date** : 4 novembre 2026 (Europe/Paris)  
**Mode** : diagnostic uniquement — aucun service, secret, SSH prod, Telegram, test ou déploiement modifié  
**Dépôt d’écriture de ce rapport** : `ZaraA1971/pupitre-core`  
**Chemin** : `dash-migration/DIAGNOSTIC-VIGIE-PREPARATOIRE.md`

---

## 1. Dépôt, branche, version réellement accessibles

| Élément | Constat |
|---|---|
| Dépôt workspace | `https://github.com/ZaraA1971/pupitre-core` sous `/workspace` |
| Branche au moment du diagnostic | `cursor/desinfo-bridge-allowlist-daf6` @ `90eaa7e` |
| Contenu Vigie dans ce dépôt | Clients d’**ingress RSS** et audience `vigie` uniquement — **pas** le moteur Telegram / missions |
| Arbre agent attendu | `/srv/ops/incident-hub` et `/srv/ops/vigie-dev` |
| Présence dans ce workspace (4 nov. 2026) | **Absents** (`/srv/ops` introuvable) |
| Dépôt GitHub nommé `incident-hub` / `vigie` sous `ZaraA1971` | **Non listé** parmi les repos publics accessibles (`pupitre-core`, `Desinfo`, `EL_ASTRO_CMS`) |
| Version agent « live » | **Non relisible** ici ; empreintes historiques seulement dans artefacts |
| Chaîne littérale `V5.1.7` / note `18/20` | **Non trouvée** ; proches : campagnes `v515`/`v516`, profil `documentary_readonly`, série V5.5-* |

### Preuves locales (pas le source agent)

| Rôle | Chemin |
|---|---|
| Ingress PHP | `dash-migration/reference/admin-rss/admin/inc/vigie_ingress.php` |
| Ingress Node | `dash-migration/node-admin-rss/src/vigie-ingress.mjs` |
| « Code Vigie » = agent Cursor cloud (distinct du bot Telegram) | `dash-migration/cursor-bridge-mcp-dash-guard/` |
| Cartographie AST antérieure | `/cursor/stores/self/artifacts/plans/diagnostic_vigie_absent_92bf943e.plan.md` |
| Snapshots partiels (ère V4.2, incomplets) | `/cursor/stores/self/artifacts/vigie-v42/src/*.py` |
| Qualifs documentaires / Telegram | `/cursor/stores/self/artifacts/Vigie_V5.4*.md`, `Vigie_V5.5*.md` |

### Prérequis montage lecture seule — résultat de la tentative

**Statut : non satisfait dans cet environnement.**

Tentative locale :

- `ls /srv/ops` → absent
- `ls /srv/ops/incident-hub` → absent
- `ls /srv/ops/vigie-dev` → absent
- Aucun clone GitHub `incident-hub` / `vigie-dev` sous le compte accessible
- Snapshots store = partiels V4.2 + rapports ; **insuffisants** comme code live

**Éléments nécessaires pour reprendre un diagnostic code-complet** (sans les inventer) :

1. Montage ou checkout **lecture seule** de `/srv/ops/incident-hub` (révision courante + empreintes `app/mission_plan.py`, `mission_persist.py`, `chat_llm.py`, `scripts/poll_telegram.py`)
2. Idéalement la copie `/srv/ops/vigie-dev` (arbre qualifié V5.5-J…O)
3. Accès lecture aux fiches `data/missions/` / traces récentes **hors** secrets `.env`
4. Confirmation explicite si une empreinte / tag « V5.1.7 · 18/20 » existe ailleurs

Aucun SSH production n’a été utilisé dans cette passe (conforme au cadrage diagnostic).

---

## 2. Constats confirmés / hypothèses / manques

### Confirmés (traces et artefacts accessibles)

1. **Échec documentaire** décrit par l’utilisateur = mission `m-563f46ca` (V5.5-M3) : pages déjà obtenues écartées → index hors résultats → lecture partielle transformée en refus → cycle clos avec étapes encore `à faire` (`Vigie_V5.5M3_echec_documentaire.md`).
2. **NO GO** répétés : V5.4-J (lanceur/migration), V5.5-J (intégration contrôlée), M1/M2 Telegram — le poller prod **n’emprunte pas** le parcours qualifié stage.
3. **Écart prod / dev** (V5.5-J) : 117 modules `app` identiques, 3 divergents (`mission_plan.py`, `mission_autonomy.py`, `chat_llm.py`) ; en prod le dialogue **ouvre** une mission **sans** `depart_immediat` ; poller avec `VIGIE_MISSION_AUTONOMY=1`, `VIGIE_MISSION_PERSIST=1` ; hub `VIGIE_EXECUTION_POLICY=shadow`.
4. **Désalignement statut ↔ plan** (V5.5-O) : étapes `à faire` alors que mission `bloquée` ; clefs d’étape fusionnées ; plafonds comptés avant résultat HTTP.
5. Concentration : `mission_plan.py` ~5k LOC ; double persistance (`mission_persist.py` + `fcntl` vs `store.py` incidents).
6. Réussites « URL connue + plan manuel » ≠ parcours Telegram prod (NO GO déploiement ; `assess_launch` absent du poller prod — docs V5.4-I/J).

### Hypothèses (non re-vérifiées sur code live)

- La faible chatbotité Telegram vient surtout du chemin **dialogue → mission → cycle** (pas de départ immédiat en prod ; fenêtres d’essai souvent NO GO), pas d’un défaut de modèle isolé.
- Correctifs V5.5-J…O documentés sous `vigie-dev` **ne sont pas tous en prod** ; une copie aveugle sur le poller changerait le live.
- Remplacer par OpenClaw/Hermes ne corrigerait pas, à lui seul, contrats d’outils / plafonds / clôture Vigie.

### Manques

- Code live et empreintes actuelles
- Preuve du label **V5.1.7 / 18/20**
- Fiches mission postérieures aux artefacts stockés

---

## 3. Cause principale (évaluation)

Sans présumer un changement de modèle :

| Rang | Facteur | Rôle |
|---|---|---|
| 1 | **Orchestration + persistance d’état** | Primaire — révision qui jette les URL trouvées ; clôture vs `_pending` ; plafonds mal alignés ; cycle unique qui fige l’échec |
| 2 | **Routage conversationnel Telegram** | Co-primaire chatbot — poller prod ≠ harnais qualif ; dialogue prod n’arme pas le même départ de cycle |
| 3 | **Contrats d’outils / harnais** | `plafond_*` ; index vs pages ; `policy_denied` écrasant un `partiel` |
| 4 | **Qualification** | Plans manuels / URL connues ne valident pas le parcours Telegram réel |
| 5 | **Modèle** | Secondaire — contribue aux révisions hors sujet, mais M3/N/O montrent surtout des transitions d’état |

---

## 4. Plan fonctionnel priorisé (non exécuté)

Garde-fous à préserver : **shadow en production**, aucune écriture ni envoi Telegram sans autorisation explicite, éviter le micromanagement.

1. Monter le code agent en lecture seule (prérequis — **encore bloqué ici**).
2. Fiabiliser la machine à états documentaire (section 5).
3. Aligner plafonds sur le résultat HTTP (section 5).
4. Parcours Telegram unique qualifiable sous shadow (section 6).
5. Réduire l’écart prod/dev après requalif (pas de copie aveugle).
6. Non-régression : rejouer M3 + parcours recherche-lecture + scénario Telegram comme portes GO/NO GO.
7. Couches chatbot (reprise / accord / historique) **après** (4), pas via un nouveau framework.

---

## 5. Plan de correctifs — machine à états / clôture / URL

**Statut : planifié uniquement. Aucun correctif appliqué.**

Cible documentée (après montage) : modules sous `/srv/ops/vigie-dev` puis promotion contrôlée — en particulier `app/mission_plan.py`, `app/web_search.py`, harnais qualif. S’appuyer sur les corrections déjà décrites en V5.5-N / V5.5-O **sans les rejouer ici**.

### 5.1 Clôture et cohérence du plan

- Ne **jamais** passer la mission en `bloquée` / terminée tant qu’une étape **réalisable** reste `à faire`.
- À la clôture : toute étape encore `à faire` dont la clef est déjà tentée prend l’état de la tentative (ou `bloquée` + raison), pour aligner statut mission et plan.
- Critère de preuve : ne pas traiter comme « travail ouvert » une étape `à faire` que `_pending` ne peut plus lancer.

### 5.2 Révision de plan et conservation des URL

- Avant `_revise` : transmettre au modèle les URL / résultats structurés déjà stockés (pas seulement ~180 caractères d’observation).
- Ne pas laisser une révision **remplacer** des lectures anonymes liées à une recherche réussie par des `site:` / index hors résultats.
- Filtrer les faux positifs d’obligations (`schedule_list` déclenché par « calendrier grégorien » dans un extrait).
- Poser le profil `documentary_readonly` dès qu’un objectif demande de consulter des sources / documents (motif déjà partiellement documenté en V5.5-N).

### 5.3 Sélection d’URL (index vs pages)

- Les lectures du plan initial se lient d’abord via `choisir_urls_precises` / `_prochaine_url` sur les résultats de recherche.
- Ne pas promouvoir une page d’accueil ou un index si des pages article existent.
- Une URL explicite utilisateur n’est pas remplacée ; une URL inventée par le modèle avant recherche **attend** la recherche (V5.5-O).

### 5.4 Plafonds et lectures partielles

- Compter un document **après** résultat HTTP exploitable ; 403/404 ≠ document consommé ; ajouter `http_404` aux accès impossibles.
- Repli vers la prochaine URL exploitable après échec d’accès.
- Un `partiel` avec faits reste une preuve ; un `policy_denied` de poursuite de segment **ne doit pas** écraser le statut `partiel` déjà obtenu (V5.5-N).
- Profil documentaire : un seul `web_search` texte, sans second appel images (V5.5-O).

### 5.5 Portes de non-régression (à exécuter seulement après autorisation + montage)

- Rejeu déterministe du scénario M3 (`m-563f46ca`)
- Suite `tests/v55o/test_parcours_recherche.py` (et H/I/J/N documentés)
- Aucun envoi Telegram ; shadow conservé

---

## 6. Plan — parcours Telegram unique sous shadow

**Statut : planifié uniquement. Aucun poller arrêté, aucun message envoyé.**

### 6.1 Problème

- Qualifs Telegram (V5.4-D…J, V5.5-M1/M2) : **NO GO** déploiement ; poller prod sans barrière `assess_launch` / lanceur contrôlé.
- Dialogue prod : `mission_depuis_dialogue` ouvre sans `execute` / sans `depart_immediat` (V5.5-J §2.3).
- Les réussites hors Telegram (URL + plan manuel) ne valident pas ce chemin.

### 6.2 Contrat cible (un seul)

```text
message Telegram
  → poll_telegram / getUpdates (consommateur unique pendant la fenêtre)
  → chat_reply
  → mission_depuis_dialogue (+ execute si autonomie armée et plan lecture-only)
  → cycle mission_plan
  → réponse préfixée / archivée
  → reprise éventuelle (/reprendre, accord)
```

### 6.3 Étapes de qualification (ordre strict)

1. **Hors prod** : harnais isolé (`vigie-dev` + `blank.env` + secrets masqués), poller historique **non** concurrent — uniquement après confirmation humaine (protocole M2 documenté).
2. **Shadow** : `VIGIE_EXECUTION_POLICY=shadow` conservé ; journaliser jugements sans élargir les écritures.
3. **GO contrôlé** seulement si : offset stable, un consommateur, pas de double exécution, barrière d’état ambigu refusée, tests M3/O verts sur le même binaire.
4. **Promotion prod** : modules divergents un par un après empreintes ; ne jamais écraser `data/`, `.env`, drop-ins systemd.

### 6.4 Chatbot (après le contrat ci-dessus)

- Couches : historique, `/reprendre`, `/accord`, `/missions` — déjà esquissées (`mission_telegram.py` snapshots) ; les fiabiliser **sur** le parcours unique, pas via un agent externe.

---

## 7. Comparaison architecturale et recommandation

| Voie | Apport | Risque |
|---|---|---|
| **A. Maintenir Vigie + orchestration durable** | Capitalise shadow, persist, PILOT_READS, quals V5.4–V5.5 ; cible bugs d’état déjà diagnostiqués | Dette `mission_plan.py` ; discipline de déploiement |
| B. Vigie + couche d’orchestration externe légère | Découpage ultérieur du monolithe | Double vérité d’état si mal bornée |
| C. Remplacer par OpenClaw / Hermes | Reset chat générique | Perte shadow/outils/Telegram EL ; ne répare pas M3 ; requalif totale |

**Recommandation : voie A.**

Motifs : (i) échec M3 = moteur d’état, (ii) NO GO Telegram = parcours non branché, (iii) shadow et contrats d’outils déjà présents, (iv) pas de preuve que le modèle est le goulot principal. **Ne pas** remplacer le modèle ni adopter OpenClaw/Hermes dans l’immédiat.

---

## 8. Synthèse exécutive

- Workspace = **pupitre-core** (ingress) ; **moteur Vigie absent** de cet environnement.
- Cause principale : **orchestration / état** + **écart Telegram prod vs qualif** ; modèle secondaire.
- Rapport enregistré ici ; correctifs **planifiés**, non appliqués.
- Prochaine action bloquante : fournir `/srv/ops/incident-hub` (+ `vigie-dev`) en lecture seule, puis autoriser une passe de correctifs sous shadow.

---

## 9. Références artefacts (store agent)

- `Vigie_V5.5M3_echec_documentaire.md` — échec `m-563f46ca`
- `Vigie_V5.5J_stabilisation_audit.md` — NO GO intégration ; écart prod/dev
- `Vigie_V5.5N_autonomie_documentaire.md` / `Vigie_V5.5O_parcours_recherche_lecture.md` — correctifs documentaires décrits sous vigie-dev
- `Vigie_V5.4J_frontiere_migration_lanceur.md` / `Vigie_V5.5M2_parcours_telegram.md` — NO GO Telegram
- `plans/diagnostic_vigie_absent_92bf943e.plan.md` — cartographie AST partielle
