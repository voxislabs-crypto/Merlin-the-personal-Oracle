#!/usr/bin/env bash
set -euo pipefail

# Configure Voxis for OpenRouter (LLM) + Piper (TTS) on Ubuntu/DigitalOcean.
# Idempotent and safe to re-run.
#
# Usage (on server):
#   sudo APP_DIR=/opt/voxis OPENROUTER_API_KEY="sk-or-v1-..." \
#     bash deploy/configure-openrouter-piper.sh
#
# Optional vars:
#   APP_DIR=/opt/voxis
#   ENV_FILE=/opt/voxis/backend/.env
#   OPENROUTER_MODEL=meta-llama/llama-3.3-8b-instruct:free
#   PIPER_MODEL_ID=en_US-lessac-medium
#   PIPER_VENV_DIR=/opt/piper-venv
#   PIPER_MODELS_DIR=/opt/piper/models
#   PIPER_BIN=/usr/local/bin/piper
#   PM2_APP_NAME=voxis-backend
#   RESTART_PM2=true

APP_DIR="${APP_DIR:-/opt/voxis}"
ENV_FILE="${ENV_FILE:-$APP_DIR/backend/.env}"
OPENROUTER_MODEL="${OPENROUTER_MODEL:-meta-llama/llama-3.3-8b-instruct:free}"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
PIPER_MODEL_ID="${PIPER_MODEL_ID:-en_US-lessac-medium}"
PIPER_VENV_DIR="${PIPER_VENV_DIR:-/opt/piper-venv}"
PIPER_MODELS_DIR="${PIPER_MODELS_DIR:-/opt/piper/models}"
PIPER_BIN="${PIPER_BIN:-/usr/local/bin/piper}"
PM2_APP_NAME="${PM2_APP_NAME:-voxis-backend}"
RESTART_PM2="${RESTART_PM2:-true}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo/root."
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Create it first (example): cp $APP_DIR/backend/.env.example $APP_DIR/backend/.env"
  exit 1
fi

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1"
    exit 1
  }
}

set_kv() {
  local file="$1"
  local key="$2"
  local value="$3"

  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

voice_path_parts() {
  # en_US-lessac-medium -> en/en_US/lessac/medium
  local voice_id="$1"
  local locale="${voice_id%%-*}"
  local rest="${voice_id#*-}"
  local name="${rest%-*}"
  local quality="${voice_id##*-}"
  local lang="${locale%%_*}"

  printf '%s/%s/%s/%s' "$lang" "$locale" "$name" "$quality"
}

need_cmd python3
need_cmd curl

echo "[1/6] Install/refresh Piper runtime"
mkdir -p "$PIPER_VENV_DIR" "$PIPER_MODELS_DIR"
python3 -m venv "$PIPER_VENV_DIR"
"$PIPER_VENV_DIR/bin/pip" install --upgrade pip setuptools wheel
"$PIPER_VENV_DIR/bin/pip" install --upgrade piper-tts

cat > "$PIPER_BIN" <<EOF
#!/usr/bin/env bash
set -euo pipefail
exec $PIPER_VENV_DIR/bin/piper "\$@"
EOF
chmod +x "$PIPER_BIN"

echo "[2/6] Download Piper model: $PIPER_MODEL_ID"
MODEL_REL="$(voice_path_parts "$PIPER_MODEL_ID")"
MODEL_BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main"
MODEL_ONNX="$PIPER_MODELS_DIR/${PIPER_MODEL_ID}.onnx"
MODEL_JSON="$PIPER_MODELS_DIR/${PIPER_MODEL_ID}.onnx.json"

if [[ ! -f "$MODEL_ONNX" ]]; then
  curl -fL "$MODEL_BASE/$MODEL_REL/${PIPER_MODEL_ID}.onnx" -o "$MODEL_ONNX"
fi
if [[ ! -f "$MODEL_JSON" ]]; then
  curl -fL "$MODEL_BASE/$MODEL_REL/${PIPER_MODEL_ID}.onnx.json" -o "$MODEL_JSON" || true
fi

echo "[3/6] Update Voxis .env for OpenRouter + Piper"
set_kv "$ENV_FILE" "LLM_BASE_URL" "$OPENROUTER_BASE_URL"
set_kv "$ENV_FILE" "LLM_MODEL" "$OPENROUTER_MODEL"
set_kv "$ENV_FILE" "TTS_ENGINE" "piper"
set_kv "$ENV_FILE" "PIPER_COMMAND" "$PIPER_BIN"
set_kv "$ENV_FILE" "PIPER_MODEL_PATH" "$MODEL_ONNX"
set_kv "$ENV_FILE" "TTS_BASE_URL" "$OPENROUTER_BASE_URL"
set_kv "$ENV_FILE" "TTS_MODEL" "openai/tts-1"

# Optional: if passed, write key into env.
if [[ -n "${OPENROUTER_API_KEY:-}" ]]; then
  set_kv "$ENV_FILE" "LLM_API_KEY" "$OPENROUTER_API_KEY"
fi

echo "[4/6] Local Piper smoke test"
TEST_WAV="/tmp/voxis-piper-test.wav"
printf '%s\n' "Piper smoke test from Voxis." | "$PIPER_BIN" --model "$MODEL_ONNX" --output_file "$TEST_WAV"
if [[ ! -s "$TEST_WAV" ]]; then
  echo "Smoke test failed: Piper produced no output."
  exit 1
fi

if [[ "$RESTART_PM2" == "true" ]] && command -v pm2 >/dev/null 2>&1; then
  echo "[5/6] Restart PM2 app (if present)"
  if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$PM2_APP_NAME" --update-env
  else
    echo "PM2 app not found: $PM2_APP_NAME (skipping restart)"
  fi
else
  echo "[5/6] PM2 restart skipped"
fi

echo "[6/6] Proof snapshot"
echo "--- ENV CHECK ---"
grep -nE '^(LLM_BASE_URL|LLM_MODEL|TTS_ENGINE|PIPER_COMMAND|PIPER_MODEL_PATH|TTS_BASE_URL|TTS_MODEL)=' "$ENV_FILE" || true

echo "--- PIPER CHECK ---"
"$PIPER_BIN" --help >/dev/null && echo "Piper CLI OK"
ls -lh "$MODEL_ONNX"
ls -lh "$TEST_WAV"

if command -v curl >/dev/null 2>&1; then
  echo "--- /health/tts ---"
  curl -fsS "http://localhost:3101/health/tts" | grep -o '"piper":{"available":[^,]*' || echo "health endpoint unavailable (backend may be stopped)"
fi

echo "Done. OpenRouter + Piper configuration applied."