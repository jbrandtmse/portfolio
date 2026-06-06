#!/usr/bin/env bash
#
# deploy.sh — deploy the portfolio to the VM (Story 1.10, AC1; AR-8).
#
# Pulls the latest code, installs deps, builds the api AND the site, restarts the
# Hono api under its systemd unit, then validates + reloads nginx. Idempotent:
# safe to re-run; each step is logged and any failure aborts the whole run
# (`set -euo pipefail`) so a half-deploy never silently "succeeds".
#
# WHAT THIS SCRIPT EXPECTS TO BE INSTALLED FIRST (one-time, by the operator):
#   • The nginx vhost  — deploy/nginx/joshuabrandt.conf  → /etc/nginx/conf.d/joshuabrandt.conf
#   • The systemd unit — deploy/systemd/portfolio-api.service
#                          → /etc/systemd/system/portfolio-api.service
#       (then: `sudo systemctl daemon-reload && sudo systemctl enable --now portfolio-api`)
#   See docs/launch-checklist.md for the full first-time bring-up.
#
# SECRETS (NFR-5 / AR-12): never baked into web/ client code and never committed.
# The api reads runtime secrets server-side from a gitignored `.env` on the VM
# (loaded by the systemd unit's EnvironmentFile) and/or the VM metadata service
# (IMDSv2). This script touches no secrets; it only orchestrates build + restart.
#
# 1.8 FLAG: the root `pnpm build` runs the content pipeline + the web build ONLY
# (it no longer compiles the api). So this script builds the api EXPLICITLY
# (`pnpm --filter api build` → api/dist/index.js) BEFORE restarting the unit,
# otherwise `systemctl restart portfolio-api` would relaunch stale/absent api JS.
#
# Run from anywhere — the script cd's to the repo root (its own parent's parent).

set -euo pipefail

# ── Resolve the repo root (this file lives at <repo>/scripts/deploy.sh) ───────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# ── Tiny logger so every step is greppable in the deploy output ──────────────
log() {
  printf '\n=== [deploy] %s ===\n' "$*"
}

log "Starting deploy in ${REPO_ROOT}"

log "Step 1/6 — git pull (fast-forward latest)"
git pull --ff-only

log "Step 2/6 — pnpm install (frozen lockfile)"
pnpm install --frozen-lockfile

# 1.8 flag: build the api explicitly — the root build does NOT compile it.
log "Step 3/6 — build the api (pnpm --filter api build → api/dist)"
pnpm --filter api build

# Root build = content pipeline + web (Story 1.8). Reads PUBLIC_* (e.g. the
# env-gated Umami) from the environment / a gitignored .env at build time.
log "Step 4/6 — build content pipeline + web (pnpm build → web/dist)"
pnpm build

log "Step 5/6 — restart the Hono api (systemd: portfolio-api)"
sudo systemctl restart portfolio-api

log "Step 6/6 — validate nginx config, then reload"
sudo nginx -t
sudo systemctl reload nginx

log "Deploy complete — site served from web/dist; /api/* proxied to the Hono unit"
