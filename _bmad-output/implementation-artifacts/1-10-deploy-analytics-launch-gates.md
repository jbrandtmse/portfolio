---
baseline_commit: 037323cafb80ea41b4250b602001ae002e176099
---

# Story 1.10: Deploy, analytics & launch gates

Status: done

<!-- Epic 1, Story 1.10 (final). Builds on 1.1–1.9. Ships the deploy artifacts (deploy.sh + nginx vhost + systemd unit), the privacy-first analytics foundation (analytics.ts + cookieless Umami, env-gated), and clears/surfaces the launch gates. The lead deploys to the VM nginx + verifies LOCALLY; public go-live is gated on the user enabling public_url_enabled (currently False — AR-16 hard gate). -->

## Story

As Josh,
I want the site deployed behind nginx with privacy-first analytics and the launch gates cleared,
so that a credible cut is live, shareable, and measurable (FR-36, SM-4).

## Acceptance Criteria

1. **Given** the VM **When** the deploy script runs **Then** `scripts/deploy.sh` performs `git pull → pnpm install → pnpm build → systemctl restart portfolio-api → nginx -t && systemctl reload nginx`, nginx serves `web/dist/` and reverse-proxies `/api/*` to the Hono service (under a systemd unit), and secrets are read server-side via VM metadata / a gitignored `.env` (never in `web/` client code, NFR-5).

2. **Given** the live site **When** a visitor browses **Then** self-hosted cookieless Umami (its own schema on the attached Postgres) records no-PII events (`guide-opened`, `guide-query`, `citation-followed`, `invite-submitted`, `channel-clicked`, `speaker-reel-played`) wired via an `analytics.ts` helper (events fire as their surfaces land).

3. **Given** the launch checklist **When** preparing to go public **Then** `public_url_enabled` is enabled (hard gate), SPF/DKIM DNS is recorded as a prerequisite for Epic 3 email, and a launch check confirms `view-source`/JS-off reachability, the Lighthouse budget, and AA — `github_connected` OFF is noted as a non-blocker.

## Integration ACs

*(Rule 1 — introduces the deploy pipeline + `analytics.ts`; consumers = nginx/systemd (runtime) + the site (analytics).)*

- **IAC-1 (deploy serves the site + proxies the api):** after the deploy, the VM nginx serves the built site and proxies `/api/*` to the Hono systemd service. **Verifiable LOCALLY** (public_url is OFF): `curl -s -H 'Host: joshuabrandt.vm.internal' http://localhost/` returns the home HTML (200), and `curl -s -H 'Host: joshuabrandt.vm.internal' http://localhost/api/health` returns `{"status":"ok"}` (200, proxied to the Hono service under systemd). The Hono service runs under the `portfolio-api` systemd unit (auto-restart).
- **IAC-2 (analytics foundation, no-PII, env-gated):** `analytics.ts` exports the 6 typed event names + a `track(event)` helper for island-driven events; the cookieless Umami script is wired in `BaseLayout` `<head>` **env-gated** (`PUBLIC_UMAMI_SRC` + `PUBLIC_UMAMI_WEBSITE_ID` — omitted/inert when unset, so the static build + tests stay clean and 0-JS-by-default holds without a live Umami). The one Stage-1 surface — **`channel-clicked`** on the `/about` channel links — is wired (Umami `data-umami-event` attribute on the real `<a>`s, 0-JS). The other 5 events are defined for their epics (Guide → Epic 4, invite/reel → Epic 3). No PII / no inquiry bodies in events.
- **IAC-3 (launch checks reuse the 1.9 harness):** the launch check runs the 1.9 gate — `view-source`/JS-off reachability (Playwright), the Lighthouse NFR-1 budget, and axe AA — all GREEN on the Epic-1 surfaces.
- **HARD GATE surfaced (NOT a defect):** `public_url_enabled` is currently **False** (AR-16). Only the user can enable public internet exposure (Cloud Services UI). The site is deploy-ready + locally verified; **going public is the user's gate**. SPF/DKIM DNS + standing up the Umami instance are likewise user/deploy actions recorded on the launch checklist, not 1.10 code defects.

## Consumed-by

- **The deploy pipeline (`deploy.sh` + nginx vhost + systemd unit):** every future deploy of any epic. **`analytics.ts` + the Umami integration:** Epic 3 (invite-submitted, speaker-reel-played, channel-clicked at the Close), Epic 4 (guide-opened, guide-query, citation-followed).

## Tasks / Subtasks

- [x] **Task 1 — `scripts/deploy.sh` (AC: 1)**
  - [x] `git pull → pnpm install → (build api: `pnpm --filter api build`) → pnpm build (content pipeline + web — note 1.8 made root build pipeline+web only, so build the api explicitly) → `sudo systemctl restart portfolio-api` → `sudo nginx -t && sudo systemctl reload nginx`. Idempotent, `set -euo pipefail`, logs each step. Secrets read server-side from a gitignored `.env` on the VM / VM metadata (NFR-5) — NEVER baked into `web/` client code.
- [x] **Task 2 — nginx vhost artifact (AC: 1)**
  - [x] `deploy/nginx/joshuabrandt.conf`: `listen 80; server_name joshuabrandt.vm.internal;` (the VM's Envoy ingress forwards `Host: <subdomain>.vm.internal` — per the VM ingress model; the public hostname `joshuabrandt.abacusai.cloud` arrives in `X-Original-Host`). `root` = the repo's `web/dist`; `location /` `try_files $uri $uri/ /index.html =404` (serve the static Mirror); `location /api/` `proxy_pass http://127.0.0.1:8787;` with `proxy_set_header Host $http_x_original_host;` + upgrade headers (mirrors the 1.1 dev proxy). Document that this file is installed to `/etc/nginx/conf.d/joshuabrandt.conf` by the deploy/the lead.
- [x] **Task 3 — systemd unit artifact (AC: 1)**
  - [x] `deploy/systemd/portfolio-api.service`: runs the Hono api (`node dist/index.js`, `WorkingDirectory` = `api/`, `Environment=API_PORT=8787` + `EnvironmentFile=-<gitignored .env>`), `Restart=always`, `User=ubuntu`, boot-persistent. Document install to `/etc/systemd/system/portfolio-api.service`.
- [x] **Task 4 — `web/src/lib/analytics.ts` + Umami (AC: 2, IAC-2)**
  - [x] `analytics.ts`: export the 6 typed event names (`guide-opened`, `guide-query`, `citation-followed`, `invite-submitted`, `channel-clicked`, `speaker-reel-played`) + a `track(event, data?)` helper (calls `window.umami?.track(...)`; no-op/SSR-safe if Umami absent; never sends PII). Document the kebab `area-action` convention.
  - [x] Wire the cookieless Umami `<script>` into `BaseLayout` `<head>` **env-gated**: render it only when `PUBLIC_UMAMI_SRC` + `PUBLIC_UMAMI_WEBSITE_ID` are set (Astro `import.meta.env.PUBLIC_*`); `data-website-id`, `defer`, no cookies. When unset (default/CI/test), render nothing → static build clean, 0-JS-by-default preserved, tests pass without a live Umami. Add the two PUBLIC_ vars to `.env.example` (documented, no secrets — Umami URL + website id are config, not secrets).
  - [x] Wire the one Stage-1 surface: **`channel-clicked`** on the `/about` channel `<a>`s (YouTube/GitHub/Suno) via `data-umami-event="channel-clicked"` (+ `data-umami-event-channel="<name>"`) — 0-JS (Umami's own script handles it). The other 5 fire in their epics.
- [x] **Task 5 — Launch checks + checklist (AC: 3, IAC-3)**
  - [x] A launch-check command/doc that runs the 1.9 gate (Playwright view-source/JS-off + Lighthouse budget + axe AA) on the Epic-1 surfaces and confirms green. Reuse `pnpm test:all` (or a `pnpm launch-check` that runs the relevant subset).
  - [x] A `docs/launch-checklist.md` (or in the story) recording: **public_url_enabled** (HARD GATE — user enables via Cloud Services UI; currently False), **SPF/DKIM DNS** (prerequisite for Epic 3 transactional email), **Umami instance standup** (self-hosted on the VM, own Postgres schema; set `PUBLIC_UMAMI_*`), **github_connected OFF = non-blocker** (no runtime GitHub reads; `gh`/PAT for pushes).
- [x] **Task 6 — Verify (AC: all, IAC-1/2/3)**
  - [x] `pnpm -r typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test`, `pnpm build` exit 0. The env-gated Umami means the default build/tests stay clean (no live Umami required). Add a focused test: `analytics.ts` event names + `track` SSR-safety/no-op-without-umami; the Umami script renders ONLY when env set (and is absent + 0-JS when unset); `/about` channel links carry `data-umami-event`.
  - [x] (Lead will execute the actual VM deploy + local curl verification as the per-story smoke — the dev need not run sudo/systemctl; ensure the artifacts are correct + installable.)
- [x] **Task 7 — Self-check vs ACs + architecture.**

## Dev Notes

### Authoritative sources

- architecture.md §AR-8 (nginx vhost serves `web/dist` + reverse-proxies `/api/*` → Hono on a localhost high port; Hono under systemd; deploy script steps), §AR-10 (self-hosted Umami v3, own schema on the attached Postgres, cookieless `<head>` script; the 6 kebab `area-action` events), §AR-12 (secrets server-side: VM metadata + gitignored `.env`, never in `web/`), §AR-16 (launch gates: public_url_enabled OFF → must enable; SPF/DKIM; github OFF fine). FR-36 (privacy-first analytics), NFR-5 (key-free static runtime), SM-4. EXPERIENCE.md §Communication-Patterns (the 6 Umami events).

### VM facts (confirmed 2026-06-06)

- `public_url_enabled: False` (AR-16 HARD GATE — user-only, Cloud Services UI). `joshuabrandt.abacusai.cloud` IS routed to this VM (Envoy → `Host: joshuabrandt.vm.internal:80`). nginx 1.31.1; existing vhosts `default.conf`, `remus.conf` (so `joshuabrandt.conf` is free). systemd present. Postgres `default` available for Umami. `github_connected: False` (non-blocker).
- The api port is `8787` (1.1). The api is a stub (`/api/health`) now; `/api/guide` (Epic 4) + `/api/invite` (Epic 3) land later — the deploy topology (systemd + nginx proxy) is established now against the health endpoint.
- **1.8 flag:** root `pnpm build` no longer compiles the api (pipeline + web only) — `deploy.sh` MUST build the api explicitly (`pnpm --filter api build`) before `systemctl restart portfolio-api`.

### nginx server_name (reconcile architecture vs VM ingress)

architecture.md §AR-8 says `server_name joshuabrandt.abacusai.cloud`. The ACTUAL VM uses Envoy ingress that forwards `Host: <subdomain>.vm.internal`, so the LIVE vhost uses **`server_name joshuabrandt.vm.internal`** and reads the public host from `X-Original-Host` (this is the VM-ingress reality and what makes it serve). Keep the committed `deploy/nginx/joshuabrandt.conf` matching the VM (`.vm.internal`) with a comment noting the public hostname.

### Analytics (env-gated; 0-JS preserved)

- Umami is cookieless, no-PII. The `<head>` script is the ONLY analytics JS, env-gated so the default static build (and CI/tests) ship NOTHING when `PUBLIC_UMAMI_*` is unset (preserves NFR-1 0-JS-by-default + the build-output 0-executable-script assertions). Static-surface events use `data-umami-event` attributes (no custom JS); island events (Epics 3/4) call `analytics.ts` `track()`.
- The Umami INSTANCE (self-hosted on the VM, own Postgres schema) is a deploy/launch action (set `PUBLIC_UMAMI_*` once it's up) — recorded on the launch checklist; not required for the 1.10 code to be correct/testable.

### Project Structure Notes

- New: `scripts/deploy.sh`, `deploy/nginx/joshuabrandt.conf`, `deploy/systemd/portfolio-api.service`, `web/src/lib/analytics.ts`, `docs/launch-checklist.md`. Modify: `web/src/layouts/BaseLayout.astro` (env-gated Umami `<head>` script), `web/src/pages/about.astro` (`data-umami-event` on channel links), `.env.example` (`PUBLIC_UMAMI_SRC`, `PUBLIC_UMAMI_WEBSITE_ID`, API_PORT already there), tests.
- Reuse 1.9 harness for launch checks; 1.1 api/health + dev-proxy topology; 1.8 deploy-flag (build api). Keep secrets out of `web/` (NFR-5).
- No ADR registry (`docs/adr/` absent) → Rule 6 no-op.

### Gotchas

- **Leave the working tree UNCOMMITTED** (lead commits after smoke). Suppress dev-story auto-commit. The dev does NOT run sudo/systemctl/nginx (the LEAD executes the VM deploy as the smoke) — just produce correct, installable artifacts.
- Env-gated Umami: with `PUBLIC_UMAMI_*` UNSET (the default/CI), `BaseLayout` must render NO analytics script → the existing 0-executable-script build-output assertions stay green. Verify both branches (set → script present with `data-website-id` + no cookies; unset → absent).
- `deploy.sh` must build the api explicitly (1.8 flag) and use `set -euo pipefail`; secrets only from the gitignored `.env`/metadata.
- The public go-live, SPF/DKIM, and Umami standup are user/launch actions — document them clearly; do not fake them. `public_url_enabled=False` is surfaced, not worked around.

### References

- [Source: epics.md#Story-1.10 — ACs verbatim]
- [Source: architecture.md#AR-8 (deploy/nginx/systemd) + #AR-10 (Umami) + #AR-12 (secrets) + #AR-16 (launch gates); FR-36; NFR-5]
- [Source: EXPERIENCE.md#Communication-Patterns (the 6 events)]
- [Source: VM user-data 2026-06-06 (public_url_enabled False; joshuabrandt routed; Postgres default; github OFF)]
- [Source: skill-rules.md#Rule-1, #Rule-2]
- [Previous: 1.1 api/health + dev proxy; 1.8 root-build-excludes-api flag; 1.9 test:all launch gate.]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (1M context) — `claude-opus-4-8[1m]` — via the `/epic-cycle` dev-story stage.

### Debug Log References

- Verified the Astro/Vite env mechanism before implementing (Perplexity): `import.meta.env.PUBLIC_*` is statically replaced at BUILD time, and shell-process `PUBLIC_`-prefixed vars are honored by Vite at build with highest precedence (no `.env` file needed). This drove the test design: the env-SET branch is proven by a REAL `astro build` invoked with `PUBLIC_UMAMI_*` inline (a single vitest process cannot flip a build-inlined value), and the env-UNSET branch by the default build + an isolated Container render.
- Verified Umami embed shape (Perplexity / umami.is): cookieless by default, `<script async/defer src=".../script.js" data-website-id="…">`; `data-umami-event` + `data-umami-event-<key>` give 0-JS click tracking; `window.umami.track(name, data)` for island JS.
- Verified Astro `<script>` handling: a `<script>` with attributes beyond `src` is left UNPROCESSED automatically; added `is:inline` to be explicit so the third-party tag ships exactly as authored.
- nginx Connection/Upgrade header: used the nginx-documented `proxy_set_header Connection "upgrade";` (the `map`-based form needs `http{}` context, unavailable in a drop-in conf.d/ server block).
- Test bug self-caught + fixed: the first "gate closed" assertion used `not.toMatch(/umami/i)`, which collided with the intended `data-umami-event` attributes on `/about`; narrowed it to the tracker SCRIPT + `data-website-id` discriminators.
- EXDEV fix: the env-set build test originally wrote to a `/tmp` outDir; Astro finalizes via cross-device `rename` (fails EXDEV), so the temp outDir was moved INSIDE `webRoot` (`.test-umami-build-*`, gitignored, cleaned up in `afterAll`).

### Completion Notes List

- **Deploy artifacts (AC1):** `scripts/deploy.sh` (`set -euo pipefail`, logged steps, builds the api EXPLICITLY per the 1.8 flag then content+web, restarts the systemd api, validates+reloads nginx); `deploy/nginx/joshuabrandt.conf` (`server_name joshuabrandt.vm.internal`, `root web/dist`, SPA-fallback `/`, `/api/` → `127.0.0.1:8787` with `Host $http_x_original_host` + upgrade headers, dotfile deny); `deploy/systemd/portfolio-api.service` (`node dist/index.js`, `WorkingDirectory=api/`, `Environment=API_PORT=8787`, optional gitignored `EnvironmentFile=-…/.env`, `Restart=always`, `User=ubuntu`, `WantedBy=multi-user.target`). Validated: `bash -n` ✓, `systemd-analyze verify` ✓ (exit 0), nginx `-t` "syntax is ok" ✓. shellcheck is NOT installed in this environment (apt blocked, no npm equivalent) — `bash -n` is the available syntax gate; the script is written to shellcheck-clean standards.
- **Analytics foundation (AC2 / IAC-2):** `web/src/lib/analytics.ts` exports `ANALYTICS_EVENTS` (the 6 kebab `area-action` names) + `AnalyticsEvent`/`AnalyticsEventData` types + an SSR-safe, no-op-without-Umami `track()` (guards `typeof window`, calls `window.umami?.track`, no `undefined` 2nd arg when data omitted, never PII). Cookieless Umami `<head>` script wired ENV-GATED in `BaseLayout` via `import.meta.env.PUBLIC_UMAMI_SRC` + `PUBLIC_UMAMI_WEBSITE_ID` (renders NOTHING unless BOTH set → default/CI build ships 0 analytics JS). `.env.example` documents the two PUBLIC_ vars (config, not secrets). `/about` channel `<a>`s carry `data-umami-event="channel-clicked"` + `data-umami-event-channel="<label>"` (0-JS). Both env branches proven against REAL builds.
- **Launch gates (AC3 / IAC-3):** `docs/launch-checklist.md` records public_url_enabled (HARD GATE, user, currently False — re-confirmed False from fresh VM user-data), SPF/DKIM DNS (Epic 3 prereq), Umami standup (self-hosted, own Postgres schema, set `PUBLIC_UMAMI_*`), github_connected OFF = non-blocker, secrets posture, and the launch check = `pnpm test:all`. Added a `launch-check` root script aliasing `test:all`.
- **HARD GATE surfaced, not worked around:** `public_url_enabled: false` confirmed from fresh VM metadata; left for the user. No sudo/systemctl/nginx/deploy run by the dev — the lead executes the VM deploy + local curl smoke (IAC-1).
- **Full gate GREEN (with PUBLIC_UMAMI_* UNSET):** `pnpm -r typecheck` ✓ (web `astro check` 0/0/0), `pnpm lint` ✓, `pnpm format:check` ✓, unit tests ✓ (scripts 19, api 2, web 245 = 266), `pnpm build` ✓ (0 analytics JS confirmed). Also ran the rest of `test:all`: Playwright e2e ✓ (37 — view-source/JS-off/axe-AA/reduced-motion on / and /about), Lighthouse budget ✓. Rule 5 (no NFR tripwire) and Rule 6 (no `docs/adr/` → no-op) both apply as no-ops. Working tree left UNCOMMITTED for the lead.

### File List

**New:**

- `scripts/deploy.sh`
- `deploy/nginx/joshuabrandt.conf`
- `deploy/systemd/portfolio-api.service`
- `web/src/lib/analytics.ts`
- `docs/launch-checklist.md`
- `web/test/analytics.test.ts`
- `web/test/BaseLayout.component.test.ts`

**Modified:**

- `web/src/layouts/BaseLayout.astro` (env-gated cookieless Umami `<head>` script)
- `web/src/pages/about.astro` (`data-umami-event` channel-clicked on channel links)
- `.env.example` (`PUBLIC_UMAMI_SRC`, `PUBLIC_UMAMI_WEBSITE_ID`)
- `.gitignore` (ignore the `.test-umami-build-*` test scratch dir)
- `package.json` (add the `launch-check` script alias)
- `web/test/build-output.test.ts` (Story 1.10 assertions: gate-off default, `/about` channel-clicked, env-set build = cookieless script present)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (1.10 → in-progress → review)
- `_bmad-output/implementation-artifacts/1-10-deploy-analytics-launch-gates.md` (this file: baseline_commit, task checkboxes, Dev Agent Record, status)

### Change Log

- 2026-06-06 — Implemented Story 1.10: deploy artifacts (deploy.sh + nginx vhost + systemd unit), env-gated cookieless Umami analytics foundation (analytics.ts + BaseLayout + /about channel-clicked), and launch checklist. Full gate green with PUBLIC_UMAMI_* unset (0 analytics JS by default); both env-gate branches proven against real builds. Status → review. Left uncommitted for the lead's VM-deploy smoke.

## Review Findings

Adversarial code review (`/bmad-code-review`, `/epic-cycle` CR stage), 2026-06-06. Three layers
(Blind Hunter / Edge Case Hunter / Acceptance Auditor) run as analytical passes over the full
diff (`git diff 037323c` + the untracked `deploy/`, `scripts/`, `docs/`, `web/src/lib/analytics.ts`
+ test files). All gates re-run GREEN by the reviewer with `PUBLIC_UMAMI_*` UNSET: `pnpm -r typecheck`
(web astro check 0/0/0), `pnpm lint`, `pnpm format:check` all exit 0; `pnpm -r --if-present test`
= 287 pass (scripts 40 incl. the 21 new deploy-artifacts tests, api 2, web 245); `pnpm build` exit 0.

**Build-output verification (the load-bearing NFR checks, asserted directly against `web/dist`):**
- NFR-1 (0-JS-by-default): gate-closed build ships ZERO Umami tracker scripts and ZERO
  `data-website-id` anywhere in `web/dist`; home keeps its single scene-rail `<script type="module">`
  (+ a non-executable `ld+json` DATA block), Mirror routes keep 0 external scripts. ✓
- IAC-2 (channel-clicked): `/about` carries exactly 3 `data-umami-event="channel-clicked"` on real
  `<a href rel="me">` anchors with non-PII `data-umami-event-channel` props (YouTube/GitHub/Suno),
  JS-off followable. ✓
- NFR-5 (Rule-5 tripwire): no secret-looking literals in `web/dist`; secrets server-side only
  (systemd `EnvironmentFile=-…/.env` + IMDSv2); nginx denies dotfiles; `PUBLIC_UMAMI_*` are config,
  not secrets. No violation. ✓

**Independently verified correctness points:**
- nginx `location /api/ { proxy_pass http://127.0.0.1:8787; }` (NO trailing URI) preserves the full
  `/api/health` path to the upstream (confirmed via nginx-docs research) → matches Hono's
  `.basePath('/api')`. The trailing-slash form (`…:8787/;`) would have stripped the prefix and broken
  it; the author chose the correct form. ✓
- systemd `ExecStart=/usr/bin/node dist/index.js` + `WorkingDirectory=…/api` resolves to
  `api/dist/index.js`, which the api `tsc` (outDir `dist`, rootDir `src`) emits — `api/dist/index.js`
  present. The 1.8 flag is honored: `deploy.sh` builds the api EXPLICITLY (`pnpm --filter api build`)
  BEFORE `systemctl restart portfolio-api`, in the correct order (api build → root build → restart api
  → `nginx -t` → reload), `set -euo pipefail`, `bash -n` clean. ✓
- `.gitignore` `.test-umami-build-*/` correctly ignores the env-set build test's scratch dir at
  `web/.test-umami-build-*` (verified with a simulated leftover dir); `afterAll` cleanup leaves none. ✓
- AC2 events: `analytics.ts` exports the 6 EXACT kebab `area-action` events in locked order;
  `track()` SSR-safe + no-op-without-Umami + no `undefined` 2nd arg (call-arity preserved). ✓

**Rules:** Rule 1 (deploy pipeline + analytics — IAC-1/IAC-2 real). Rule 3 — analytics user-facing
surface has real-runtime evidence (env-gated Umami proven against real `astro build`, BOTH branches +
build-output assertions on `web/dist`); the deploy topology's real exercise is the LEAD's VM curl
smoke (IAC-1), with the static shape pinned by the 21 deploy-artifacts tests so a regression fails CI
— exemption noted and satisfied. Rule 5 — NFR-5 tripwire verified met (no workaround). Rule 6 — no
`docs/adr/` registry → no-op. Rule 8 — both new test files match their package globs and ran in the
default suite.

**Outcome: no HIGH, no MEDIUM findings.** All ACs / Integration ACs met. The HARD GATE
(`public_url_enabled` OFF) is a surfaced user gate, not a code defect (the user has stated public URL
is now active; the LEAD deploys + verifies at the smoke). 1 LOW deferred, 2 LOW dismissed as
by-design/handled.

- [x] [Review][Defer] `deploy.sh` has no clean-working-tree precheck before `git pull --ff-only` [scripts/deploy.sh:44] — deferred (operator-ergonomics nit; `git pull --ff-only` already fails safely on a dirty/diverged tree, so this is a nicety, not a correctness gap — see deferred-work.md).
- [x] [Review][Dismiss] `launch-check` alias = full `test:all` (includes the Lighthouse `lhci` rebuild) — heavier than a "quick" launch gate implies — dismissed: it is a SUPERSET that satisfies AC3 (view-source/JS-off + Lighthouse budget + axe AA are all inside `test:all`); the directive explicitly accepts confirming the alias/doc rather than requiring a lighter subset.
- [x] [Review][Dismiss] `Connection "upgrade"` hardcoded on all `/api/` requests rather than `map`-gated [deploy/nginx/joshuabrandt.conf:56] — dismissed: this is nginx's documented WebSocket-proxy pattern for a drop-in `conf.d/` server block (the cleaner `map $http_upgrade $connection_upgrade` form requires `http{}` context, unavailable here); harmless for plain requests, and required for the Epic-4 Guide streaming over `/api/*`.
