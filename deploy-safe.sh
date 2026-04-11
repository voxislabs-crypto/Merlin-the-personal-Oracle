#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/voxis}"
BRANCH="${BRANCH:-NeuronMap}"
PM2_APP_NAME="${PM2_APP_NAME:-voxis-backend}"
STASH_NAME="Pre-deploy auto-stash $(date +%Y-%m-%d_%H-%M-%S)"
STASH_CREATED=0

echo "=== Safe Voxis Deploy Started ==="
echo "App dir: ${APP_DIR}"
echo "Branch: ${BRANCH}"

cd "${APP_DIR}"

echo "→ Fetching latest changes..."
git fetch origin

echo "→ Stashing any local changes (including untracked files)..."
if git stash push -u -m "${STASH_NAME}" | grep -qv "No local changes to save"; then
	STASH_CREATED=1
fi

echo "→ Checking out ${BRANCH}..."
git checkout "${BRANCH}" 2>/dev/null || git checkout -b "${BRANCH}" "origin/${BRANCH}"

echo "→ Pulling latest code..."
git pull origin "${BRANCH}" --ff-only || git pull origin "${BRANCH}" --rebase

echo "→ Installing dependencies..."
npm install

echo "→ Ensuring prosody tools are installed..."
if ! command -v yt-dlp >/dev/null 2>&1 || ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
	sudo apt-get update -y
	sudo apt-get install -y yt-dlp ffmpeg
fi

echo "→ Building frontend..."
npm run build

echo "→ Restarting backend..."
if [[ -f "${APP_DIR}/ecosystem.config.cjs" ]]; then
	pm2 startOrReload "${APP_DIR}/ecosystem.config.cjs" --only "${PM2_APP_NAME}" --update-env
else
	pm2 restart "${PM2_APP_NAME}" --update-env
fi
pm2 save >/dev/null 2>&1 || true

echo "→ Reloading nginx..."
sudo systemctl reload nginx

if [[ "${STASH_CREATED}" -eq 1 ]]; then
	echo "→ Cleaning up deploy stash..."
	STASH_REF=$(git stash list | grep -F "${STASH_NAME}" | head -n1 | cut -d: -f1)
	if [[ -n "${STASH_REF}" ]]; then
		git stash drop "${STASH_REF}"
	fi
fi

echo "=== Safe Voxis Deploy Completed Successfully ==="