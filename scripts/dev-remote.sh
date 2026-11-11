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
# This script closes that gap by (re)applying the rule right before Vite
# starts, every time.
#
# The rule is idempotent: re-applying it replaces the config for its own
# HTTPS port and leaves any other Serve rule alone (the OpenChamber rule on
# 443 is untouched).
#
# tailscaled itself is a *system* service and is enabled at boot, so it is
# already running by the time this script executes — but if it is not, the
# script still starts Vite and simply warns that the app is not exposed.

set -uo pipefail

cd "$(dirname "$0")/.."

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-5173}"
ALLOWED_HOSTS="${ALLOWED_HOSTS:-home-lab.tail2e98a8.ts.net}"
SERVE_PORT="${SERVE_PORT:-8443}"

export HOST PORT ALLOWED_HOSTS

# --- 1. make sure the tailnet route points at the port we are about to use ---
if command -v tailscale >/dev/null 2>&1; then
  if tailscale serve --bg --yes --https="${SERVE_PORT}" "http://127.0.0.1:${PORT}" >/dev/null 2>&1; then
    DNS_NAME="$(tailscale status --json 2>/dev/null \
      | grep -o '"DNSName"[[:space:]]*:[[:space:]]*"[^"]*"' \
      | head -1 | sed -E 's/.*"([^"]*)"$/\1/' | sed 's/\.$//')"
    if [ -n "${DNS_NAME}" ]; then
      echo "[dev-remote] tailscale serve ready → https://${DNS_NAME}:${SERVE_PORT}/"
    else
      echo "[dev-remote] tailscale serve ready on port ${SERVE_PORT}"
    fi
  else
    echo "[dev-remote] WARNING: could not apply the tailscale serve rule." >&2
    echo "[dev-remote]          Is tailscaled running? 'sudo systemctl start tailscaled'" >&2
    echo "[dev-remote]          The app still works locally at http://127.0.0.1:${PORT}/" >&2
  fi
fi

# --- 2. start the dev server ---
echo "[dev-remote] starting vite on ${HOST}:${PORT} (allowed host: ${ALLOWED_HOSTS})"

if [ -x ./node_modules/.bin/vite ]; then
  exec ./node_modules/.bin/vite
else
  echo "[dev-remote] ERROR: node_modules is missing — run 'npm install' first." >&2
  exit 1
fi
