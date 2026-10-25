#!/bin/bash
# Production wrapper — sourced env, no secrets on argv.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${DASH_NODE_REFRESH_ENV:-/etc/electronlibre/dash-node-refresh.env}"
LOG="${DASH_NODE_REFRESH_LOG:-/var/log/dash-node-refresh.log}"
LOCK_DIR="${DASH_NODE_REFRESH_FLOCK:-/tmp/dash-node-refresh.lock}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[dash-node-refresh] env manquant: $ENV_FILE" >&2
  exit 2
fi

# flock avoids overlapping Node workers if a run exceeds the interval
exec 9>"$LOCK_DIR"
if ! flock -n 9; then
  echo "[dash-node-refresh] $(date -Is) skip: flock busy" >>"$LOG"
  exit 0
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

cd "$ROOT"
{
  echo "[dash-node-refresh] $(date -Is) start"
  /usr/bin/node "$ROOT/scripts/refresh-prod.mjs" --cron
  echo "[dash-node-refresh] $(date -Is) done rc=$?"
} >>"$LOG" 2>&1
