#!/usr/bin/env bash
# Source of truth: galerie-vittet-atelier-cf
# → pages = full production package (front + atelier + functions)
# → site  = front-only mirror (no divergent atelier)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGES="${GALERIE_PAGES_DIR:-/tmp/galerie-vittet-pages}"
SITE="${GALERIE_SITE_DIR:-/tmp/galerie-vittet-site}"

if [[ ! -d "$ROOT/functions" || ! -f "$ROOT/main.js" ]]; then
  echo "sync-trees: unexpected source tree at $ROOT" >&2
  exit 1
fi

copy_tree() {
  local src="$1" dest="$2"
  mkdir -p "$dest"
  (
    cd "$src"
    tar -cf - \
      --exclude='.wrangler' \
      --exclude='node_modules' \
      --exclude='.git' \
      .
  ) | (
    cd "$dest"
    tar -xf -
  )
}

echo "→ sync full package to $PAGES"
mkdir -p "$PAGES"
copy_tree "$ROOT" "$PAGES"
# Ghost / retired paths — tar extract does not delete orphans on dest
rm -f "$PAGES/functions/_shared/exposes.js"
rm -f "$PAGES/images/galeristes.webp"

echo "→ sync front-only mirror to $SITE"
mkdir -p "$SITE"
cp -f "$ROOT/index.html" "$ROOT/main.js" "$ROOT/style.css" "$SITE/"
if [[ -d "$ROOT/images" ]]; then
  mkdir -p "$SITE/images"
  (
    cd "$ROOT/images"
    tar -cf - --exclude='ajouts' .
  ) | (
    cd "$SITE/images"
    tar -xf -
  )
fi
rm -f "$SITE/images/galeristes.webp"
rm -rf "$SITE/atelier" "$SITE/data" "$SITE/functions"
cat > "$SITE/README.md" <<'MD'
# Galerie Vittet — front mirror only

Do **not** edit this tree as a third CMS copy.

- Durable source (repo): `galerie-vittet/` in the git workspace
- Live edit tree: `/tmp/galerie-vittet-atelier-cf/`
- Production deploy package: `/tmp/galerie-vittet-pages/`
- Sync: `scripts/sync-trees.sh` from the source tree

Public data plane: same-origin `GET /api/oeuvres` (D1) + `/images/...` (KV / static).
MD

echo "done."
