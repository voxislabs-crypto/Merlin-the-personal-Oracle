#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/voxis}"
APP_NAME="${APP_NAME:-voxis}"
PM2_APP_NAME="${PM2_APP_NAME:-voxis-backend}"
BACKEND_PORT="${BACKEND_PORT:-3101}"
DOMAIN="${1:-${DOMAIN:-}}"
ENV_FILE="${ENV_FILE:-$APP_DIR/backend/.env}"

ok() {
  printf '[OK] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1"
}

fail() {
  printf '[FAIL] %s\n' "$1"
}

section() {
  printf '\n== %s ==\n' "$1"
}

mask_prefix() {
  local v="${1:-}"
  if [[ -z "$v" ]]; then
    printf 'missing'
    return
  fi

  if [[ "$v" == pk_live_* ]]; then
    printf 'pk_live'
  elif [[ "$v" == pk_test_* ]]; then
    printf 'pk_test'
  elif [[ "$v" == sk_live_* ]]; then
    printf 'sk_live'
  elif [[ "$v" == sk_test_* ]]; then
    printf 'sk_test'
  else
    printf 'set'
  fi
}

pick_publishable_key() {
  local value=""
  for key in CLERK_PUBLISHABLE_KEY NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY VITE_CLERK_PUBLISHABLE_KEY; do
    value="${!key:-}"
    if [[ -n "$value" ]]; then
      printf '%s:%s' "$key" "$value"
      return
    fi
  done
  printf ':'
}

section "Environment file"
if [[ -f "$ENV_FILE" ]]; then
  ok "Found env file at $ENV_FILE"
else
  fail "Env file not found at $ENV_FILE"
fi

if [[ -f "$ENV_FILE" ]]; then
  set -o allexport
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +o allexport
fi

raw_publishable="$(pick_publishable_key)"
publishable_from="${raw_publishable%%:*}"
publishable_value="${raw_publishable#*:}"
secret_value="${CLERK_SECRET_KEY:-}"

if [[ -n "$publishable_value" ]]; then
  ok "Publishable key present from ${publishable_from} ($(mask_prefix "$publishable_value"))"
else
  fail "Publishable key missing in env file"
fi

if [[ -n "$secret_value" ]]; then
  ok "Secret key present ($(mask_prefix "$secret_value"))"
else
  fail "CLERK_SECRET_KEY missing in env file"
fi

section "PM2 process"
if ! command -v pm2 >/dev/null 2>&1; then
  fail "pm2 command not found"
else
  status_line="$(pm2 describe "$PM2_APP_NAME" 2>/dev/null | grep -E '^ status' | head -n1 || true)"
  if [[ -n "$status_line" ]]; then
    ok "PM2 app ${PM2_APP_NAME} is registered"
  else
    warn "PM2 app ${PM2_APP_NAME} not found"
  fi

  pm2_env_check="$(pm2 jlist 2>/dev/null | node -e '
let data = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", d => data += d);
process.stdin.on("end", () => {
  try {
    const list = JSON.parse(data || "[]");
    const targetName = process.argv[1];
    const app = list.find(p => p && p.name === targetName);
    if (!app) {
      console.log("missing-app");
      return;
    }
    const env = app.pm2_env && app.pm2_env.env ? app.pm2_env.env : {};
    const pk = env.CLERK_PUBLISHABLE_KEY || env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || env.VITE_CLERK_PUBLISHABLE_KEY || "";
    const sk = env.CLERK_SECRET_KEY || "";
    const from = env.CLERK_PUBLISHABLE_KEY ? "CLERK_PUBLISHABLE_KEY" : (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" : (env.VITE_CLERK_PUBLISHABLE_KEY ? "VITE_CLERK_PUBLISHABLE_KEY" : "missing"));
    const keyPrefix = pk.startsWith("pk_live_") ? "pk_live" : (pk.startsWith("pk_test_") ? "pk_test" : (pk ? "set" : "missing"));
    const secPrefix = sk.startsWith("sk_live_") ? "sk_live" : (sk.startsWith("sk_test_") ? "sk_test" : (sk ? "set" : "missing"));
    console.log(`publishable=${pk ? "true" : "false"};from=${from};publishablePrefix=${keyPrefix};secret=${sk ? "true" : "false"};secretPrefix=${secPrefix}`);
  } catch {
    console.log("parse-error");
  }
});
' "$PM2_APP_NAME")"

  case "$pm2_env_check" in
    missing-app)
      warn "Could not inspect PM2 env because app was not found"
      ;;
    parse-error)
      warn "Could not parse PM2 env from pm2 jlist"
      ;;
    *)
      echo "$pm2_env_check"
      ;;
  esac
fi

section "Backend health"
if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null; then
  ok "Local backend health passed on port ${BACKEND_PORT}"
else
  fail "Local backend health failed on port ${BACKEND_PORT}"
fi

section "Nginx site"
site_path="/etc/nginx/sites-enabled/${APP_NAME}"
if [[ -f "$site_path" ]]; then
  ok "Found enabled nginx site at $site_path"
  if grep -Eq "proxy_pass\s+http://127.0.0.1:${BACKEND_PORT}" "$site_path"; then
    ok "Nginx upstream points at backend port ${BACKEND_PORT}"
  else
    warn "Nginx upstream does not clearly target port ${BACKEND_PORT}"
  fi
else
  warn "Nginx site $site_path not found"
fi

section "Public health"
if [[ -n "$DOMAIN" ]]; then
  if curl -fsS "https://${DOMAIN}/health" >/dev/null; then
    ok "HTTPS /health passed for ${DOMAIN}"
  elif curl -fsS "http://${DOMAIN}/health" >/dev/null; then
    warn "HTTP /health passed for ${DOMAIN}, HTTPS failed"
  else
    fail "Public /health failed for ${DOMAIN}"
  fi
else
  warn "No DOMAIN provided; skipping public health check"
fi

printf '\nDone. If keys were missing or PM2 env was stale, run:\n'
printf 'pm2 startOrReload ecosystem.config.cjs --only %s --update-env\n' "$PM2_APP_NAME"
