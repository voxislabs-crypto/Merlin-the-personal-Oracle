#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/voxis}"
BACKEND_DIR="$APP_DIR/backend"

if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "Backend directory not found: $BACKEND_DIR"
  echo "Set APP_DIR if your install location is different."
  exit 1
fi

if [[ ! -f "$BACKEND_DIR/package.json" ]]; then
  echo "Missing package.json under $BACKEND_DIR"
  exit 1
fi

echo "[Kokoro preload] Using backend: $BACKEND_DIR"
if [[ -f "$BACKEND_DIR/.env" ]]; then
  echo "[Kokoro preload] Detected backend/.env"
else
  echo "[Kokoro preload] backend/.env not found; using process environment only"
fi

npm --prefix "$BACKEND_DIR" run kokoro:preload

echo "[Kokoro preload] Done."
