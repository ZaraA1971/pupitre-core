# Webpcap1 — WebP + budgets dérivés

## Changements
- Atelier : `encodeFromBudget` / `encodeCanvasBudget` (WebP prioritaire, boucle qualité puis edge)
- Plafonds : web 1600/~220 Ko, carousel 1680/~200 Ko, preview 720/~90 Ko
- Backfill `scripts/backfill-web-derivatives.py` : WebP + `--carousel-only` / `--jpg-web-only`
- Cache-bust atelier `?v=20261125-webpcap1`

## Déploiements (compte Emmanuel)
- main `237b1eb9`
- preview `da0fd4a1`
- atelier-kv-preview `30576619`

## Backfill carousel
- 11 œuvres carousel → WebP OK, 0 échec
- Total dérivés web carousel ~2,1 Mo (~192 Ko / slide)
- API publique `/api/oeuvres` sert les chemins `.webp`

## Preuve
- Rapport : `/opt/cursor/artifacts/web-backfill-carousel-webpcap1.json`
- Log : `/opt/cursor/artifacts/web-backfill-carousel-webpcap1.log`
