# Fontsapi1 — fonts self-host + cache API

## Changements
- Self-host DM Sans + Playfair Display (latin / latin-ext woff2, ~95 Ko total)
- Retrait des liens Google Fonts (front + atelier)
- Preload `fonts/*.woff2` + `GET /api/oeuvres` ; `fetch` en `credentials:omit`
- Cache API : `s-maxage=300` + `stale-while-revalidate=600` (+ `CDN-Cache-Control`)
- Cache-bust `?v=20261125-fontsapi1`

## Déploiements
- main `f983b64c` · preview `1fa690e8` · atelier `2f57d83f`

## Preuve
- 0 requête fonts.googleapis / gstatic
- Fonts locaux 200 ; wordmark Playfair 700, body DM Sans
- Headers API avec CDN cache
