# Launch checklist — portfolio (Story 1.10; AR-16)

The gates that must clear before, and at, public go-live. Story 1.10 ships the
site **deploy-ready and locally verified**; the items below that are marked
**user / operator action** are deliberately NOT done by code — they are the
human/deploy gates (architecture.md §AR-16). Status reflects the VM as of
**2026-06-06** (re-fetch VM `user-data` to confirm; these flags change in the
Abacus Cloud Services UI, not in this repo).

---

## 1. Public exposure — `public_url_enabled` (HARD GATE) — ❌ currently OFF

- **Status:** `public_url_enabled: false` (confirmed from VM `user-data`, 2026-06-06).
- **Owner:** **the user** (Josh) — this is a Cloud Services UI toggle. Code cannot
  and must not flip it (AR-16). The agent does not enable public internet exposure.
- **Why it gates:** until this is ON, Abacus Envoy does not route public internet
  traffic to the VM, so `https://joshuabrandt.abacusai.cloud` is not reachable
  from outside. The site is fully built and **locally verified** in the meantime
  (see §6).
- **Action to go live:** enable `public_url_enabled` in the Cloud Services UI, then
  re-fetch `user-data` and confirm `joshuabrandt.abacusai.cloud` is in
  `http_ingress_settings.hostnames` (it already is — the route exists; only the
  master public-access switch is off).

## 2. SPF / DKIM DNS — ⏳ prerequisite for launch (code shipped in Story 3.3)

- **Status:** **code shipped (Story 3.3, 2026-06-07)**. The Invite-Me endpoint
  (`POST /api/invite`) is live with email env-gated (Rule 4): `RESEND_API_KEY`
  unset → email path is a no-op (`mail_status='skipped'`; no network). The inquiry
  IS persisted to Postgres even without email. **DNS not yet configured** — required
  before activating live Resend sends.
- **Owner:** **operator / DNS admin**, once the sending domain is finalised.
  Email addresses (`MAIL_FROM` / `MAIL_TO`) are `[OPEN]` — set them in the VM's
  gitignored `.env` (or `api/.env`) before enabling `RESEND_API_KEY` (see §5).
- **Why it blocks live email:** deliverability of the Invite-Me notifications depends
  on SPF + DKIM (and ideally DMARC) being published for the sending domain BEFORE
  setting `RESEND_API_KEY`. Until DNS is set, email silently skips (`mail_status=
  'skipped'`); inquiries are never lost (Postgres is the system of record).
- **Action to enable live email:**
  1. Choose and verify the sending domain in the Resend dashboard.
  2. Publish SPF `include:` and DKIM CNAME/TXT records in DNS for the sending domain.
  3. Set `MAIL_FROM`, `MAIL_TO` in the VM's gitignored `.env` (see `.env.example`).
  4. Set `RESEND_API_KEY` (server-side secret, never committed — see §5).
  5. Restart `portfolio-api` (`sudo systemctl restart portfolio-api`) and verify
     a test submission sends cleanly (check `mail_status` in the Postgres
     `inquiries` table).

## 3. Umami analytics instance standup — ⏳ deploy/operator action

- **Status:** the **code** is shipped and env-gated (Story 1.10): the cookieless
  Umami `<head>` script renders only when `PUBLIC_UMAMI_SRC` +
  `PUBLIC_UMAMI_WEBSITE_ID` are set at build time; the `/about` channel links carry
  the 0-JS `channel-clicked` event. The **instance itself is not yet stood up**.
- **Owner:** **operator** (deploy action).
- **Why env-gated:** with the vars unset (the default), the build ships **zero
  analytics JS** — so the key-free static runtime (NFR-5) and the 0-JS-by-default
  floor (NFR-1) hold with no live Umami, and CI/tests need no analytics backend.
- **Action to enable analytics:**
  1. Stand up self-hosted **Umami v3** on the VM, using its **own schema** on the
     attached Postgres `default` database (separate from the app's `inquiries`
     tables — distinct ownership; architecture.md §Data-boundaries).
  2. Create the website entry in the Umami dashboard; copy its **website id**.
  3. Set `PUBLIC_UMAMI_SRC` (the tracker `…/script.js` URL) and
     `PUBLIC_UMAMI_WEBSITE_ID` in the VM's gitignored `.env` (see `.env.example`).
     These are **config, not secrets** (they are public by design), but still live
     in `.env`, never committed.
  4. Re-run the deploy (`scripts/deploy.sh`) so the build picks up the vars and the
     `<head>` script renders. Confirm events land in the Umami dashboard.
- **Funnel events (kebab `area-action`, no PII — NFR-7):** `guide-opened`,
  `guide-query`, `citation-followed`, `invite-submitted`, `channel-clicked`,
  `speaker-reel-played`. Only `channel-clicked` (the `/about` links) is wired in
  Stage 1; the rest fire as their surfaces land (invite/reel → Epic 3, Guide →
  Epic 4) via the `web/src/lib/analytics.ts` `track()` helper.

## 4. `github_connected` — ✅ OFF is fine (non-blocker)

- **Status:** `github_connected: false` (confirmed from VM `user-data`, 2026-06-06).
- **Why it does NOT block:** the running site makes **no runtime reads of GitHub**.
  The connector token is only used for `git push` from the VM; pushes can also use
  `gh auth login` or a user-supplied PAT. So launch is unaffected.

## 5. Secrets posture — ✅ enforced in code (NFR-5 / AR-12)

- Runtime secrets are **never** in `web/` client code and **never** committed. They
  are supplied server-side only:
  - the **systemd unit** (`deploy/systemd/portfolio-api.service`) loads an optional
    gitignored `.env` via `EnvironmentFile=-…/.env`;
  - the api also reads from the **VM metadata service (IMDSv2)** at runtime (e.g.
    `ABACUS_API_KEY` for the Guide's LLM endpoint — Epic 4).
- `.env` is gitignored; `.env.example` documents the variables with placeholder /
  empty values only. The nginx vhost additionally denies dotfiles so a stray
  `.env` can never be web-served.

## 6. Launch check — the 1.9 test harness, GREEN

- **The launch check is `pnpm test:all`** (Story 1.9's gate). It must pass green on
  the Epic-1 surfaces before go-live. It runs, in order:
  - `pnpm typecheck` — types across all packages.
  - `pnpm lint` — ESLint.
  - `pnpm format:check` — Prettier.
  - `pnpm test` — unit + build-output suites (real `astro build`; includes the
    Story 1.10 env-gated-Umami both-branches assertions and the `/about`
    `channel-clicked` wiring).
  - `pnpm test:e2e` — Playwright: **`view-source` / JS-off reachability** of the
    static Mirror, plus the accessibility (axe **AA**) checks.
  - `pnpm lh` — the **Lighthouse** performance budget (NFR-1).
- This is the same harness across `view-source`/JS-off, Lighthouse, and AA the AC
  calls for. Run it from the repo root with a clean working tree.

## 7. Deploy artifacts — installed once, then `scripts/deploy.sh` per release

First-time bring-up on the VM (operator; uses `sudo`):

1. **nginx vhost:** copy `deploy/nginx/joshuabrandt.conf` →
   `/etc/nginx/conf.d/joshuabrandt.conf`. (`server_name joshuabrandt.vm.internal`
   — the Envoy ingress forwards `Host: joshuabrandt.vm.internal`; the public host
   `joshuabrandt.abacusai.cloud` arrives in `X-Original-Host`.)
2. **systemd unit:** copy `deploy/systemd/portfolio-api.service` →
   `/etc/systemd/system/portfolio-api.service`, then
   `sudo systemctl daemon-reload && sudo systemctl enable --now portfolio-api`.
3. **Deploy:** run `scripts/deploy.sh` — it pulls, installs, builds the **api**
   explicitly (1.8 flag) + the content pipeline + web, restarts `portfolio-api`,
   and validates + reloads nginx.

**Local verification (works even with `public_url_enabled` OFF):**

```bash
# Static Mirror home (200, returns the home HTML):
curl -s -H 'Host: joshuabrandt.vm.internal' http://localhost/
# API health, proxied to the Hono systemd unit (200, {"status":"ok"}):
curl -s -H 'Host: joshuabrandt.vm.internal' http://localhost/api/health
```

---

### Go-live summary

| Gate | Owner | Status |
| --- | --- | --- |
| `public_url_enabled` | user | ❌ OFF — **hard gate** |
| SPF / DKIM DNS | operator | ⏳ code shipped (3.3); DNS + RESEND_API_KEY needed |
| Umami instance + `PUBLIC_UMAMI_*` | operator | ⏳ deploy action (code ready) |
| `github_connected` | — | ✅ OFF is fine (non-blocker) |
| Secrets server-side only | code | ✅ enforced |
| `pnpm test:all` green | dev | ✅ run before each release |
| Deploy artifacts installed | operator | one-time, then `deploy.sh` |
