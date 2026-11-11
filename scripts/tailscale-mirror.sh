#!/usr/bin/env bash
#
# Tailnet port mirror — public port N serves local port N.
#
#   127.0.0.1:3000   ->  https://home-lab.tail2e98a8.ts.net:3000   (MoneyFlows dev)
#   127.0.0.1:3010   ->  https://home-lab.tail2e98a8.ts.net:3010   (OpenChamber)
#   127.0.0.1:4173   ->  https://home-lab.tail2e98a8.ts.net:4173   (vite preview)
#
# The point is that the port you see in the URL is the port the app actually
# runs on — no more remembering that the dev server is :5173 locally but
# :8443 on the tailnet, and no more "which of these four URLs is the app?".
#
# The bare hostname (the default HTTPS port, 443) points at the ROOT_PORT
# service — OpenChamber, the chat UI — so that address keeps working.
#
# Usage:
#   bash scripts/tailscale-mirror.sh                 # the default set
#   bash scripts/tailscale-mirror.sh 5173 8080       # specific ports
#   bash scripts/tailscale-mirror.sh --list          # show the current mapping
#
# Re-applying a rule is idempotent: it replaces the config for that HTTPS
# port only and leaves every other rule alone.

set -uo pipefail

DEFAULT_PORTS="3000 3010 4173"
ROOT_PORT="${ROOT_PORT:-3010}"   # what the bare hostname (443) points at

if [ "${1:-}" = "--list" ]; then
  tailscale serve status
  exit 0
fi

if [ "$#" -gt 0 ]; then
  PORTS="$*"
else
  PORTS="${MIRROR_PORTS:-$DEFAULT_PORTS}"
fi

if ! command -v tailscale >/dev/null 2>&1; then
  echo "[mirror] ERROR: tailscale CLI not found." >&2
  exit 1
fi

DNS_NAME="$(tailscale status --json 2>/dev/null \
  | grep -o '"DNSName"[[:space:]]*:[[:space:]]*"[^"]*"' \
  | head -1 | sed -E 's/.*"([^"]*)"$/\1/' | sed 's/\.$//')"

if [ -z "${DNS_NAME}" ]; then
  echo "[mirror] ERROR: could not read this node's tailnet name — is tailscaled running?" >&2
  exit 1
fi

FAILED=0

# --- the bare hostname keeps pointing at the root service ---
if [ -n "${ROOT_PORT}" ]; then
  if tailscale serve --bg --yes "http://127.0.0.1:${ROOT_PORT}" >/dev/null 2>&1; then
    echo "[mirror] https://${DNS_NAME}/          ->  http://127.0.0.1:${ROOT_PORT}/   (bare hostname)"
  else
    echo "[mirror] ERROR: could not apply the rule for the bare hostname." >&2
    FAILED=1
  fi
fi

# --- one-for-one port mirror ---
for p in ${PORTS}; do
  if tailscale serve --bg --yes --https="${p}" "http://127.0.0.1:${p}" >/dev/null 2>&1; then
    echo "[mirror] https://${DNS_NAME}:${p}/  ->  http://127.0.0.1:${p}/"
  else
    echo "[mirror] ERROR: could not apply the rule for port ${p}." >&2
    FAILED=1
  fi
done

exit ${FAILED}
