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

PRELOAD_ARGS=()

if [[ "${KOKORO_PREWARM_VOICES:-0}" == "1" ]]; then
  PRELOAD_ARGS+=("--prewarm-voices")
fi

if [[ -n "${KOKORO_VOICE_PROFILE:-}" ]]; then
  PRELOAD_ARGS+=("--voice-profile=${KOKORO_VOICE_PROFILE}")
fi

if [[ -n "${KOKORO_VOICE_LIST:-}" ]]; then
  PRELOAD_ARGS+=("--voice-list=${KOKORO_VOICE_LIST}")
fi

if [[ "${KOKORO_LIST_VOICE_PROFILES:-0}" == "1" ]]; then
  PRELOAD_ARGS+=("--list-voice-profiles")
fi

npm --prefix "$BACKEND_DIR" run kokoro:preload -- "${PRELOAD_ARGS[@]}"

echo "[Kokoro preload] Done."
