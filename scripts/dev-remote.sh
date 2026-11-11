#!/usr/bin/env bash
#
# Start the MoneyFlows dev server AND make it reachable over Tailscale —
# one command, so the tailnet URL can never be out of sync with the port.
#
#   npm run dev:remote
#
# Why this exists: the Tailscale Serve rule lives in tailscaled's state and
# survives a reboot, but the dev server behind it is a process. Two things
# could therefore drift apart — the rule pointing at a port nothing is
# serving, or the server running on a port the rule does not know about.
# This script closes that gap by (re)applying the tailnet mirror right
# before Vite starts, every time.
#
# The mirror is idempotent: re-applying a rule replaces the config for that
# HTTPS port only and leaves every other rule alone (the OpenChamber rule on
# 443 is untouched).
#
# tailscaled itself is a *system* service and is enabled at boot, so it is
# already running by the time this script executes — but if it is not, the
# script still starts Vite and simply warns that the app is not exposed.

set -uo pipefail

cd "$(dirname "$0")/.."

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3000}"
ALLOWED_HOSTS="${ALLOWED_HOSTS:-home-lab.tail2e98a8.ts.net}"

export HOST PORT ALLOWED_HOSTS

# --- 1. make sure the tailnet route points at the port we are about to use ---
# The tailnet mirrors local ports one-for-one (public port N serves local port
# N), so the URL always shows the port the app actually runs on.
# scripts/tailscale-mirror.sh owns that mapping; this call keeps it in sync.
if [ -x ./scripts/tailscale-mirror.sh ]; then
  if ! bash ./scripts/tailscale-mirror.sh ${MIRROR_PORTS:-"3000 3010 4173"}; then
    echo "[dev-remote] WARNING: could not apply the tailnet mirror." >&2
    echo "[dev-remote]          Is tailscaled running? 'sudo systemctl start tailscaled'" >&2
    echo "[dev-remote]          The app still works locally at http://127.0.0.1:${PORT}/" >&2
  fi
else
  echo "[dev-remote] WARNING: scripts/tailscale-mirror.sh not found — not exposed on the tailnet." >&2
fi

# --- 2. start the dev server ---
echo "[dev-remote] starting vite on ${HOST}:${PORT} (allowed host: ${ALLOWED_HOSTS})"

if [ -x ./node_modules/.bin/vite ]; then
  exec ./node_modules/.bin/vite
else
  echo "[dev-remote] ERROR: node_modules is missing — run 'npm install' first." >&2
  exit 1
fi
