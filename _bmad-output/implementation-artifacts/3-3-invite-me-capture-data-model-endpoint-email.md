---
baseline_commit: 9f1ac20bbac8b97418753e16fcb8e6e4fd709958
---

# Story 3.3: Invite-Me capture — data model, endpoint & email

Status: done

<!-- Created by the /epic-cycle lead create-story gate (Epic 3), 2026-06-07. Source: epics.md Epic 3 Story 3.3.
     FIRST service-introducing story of the project (the Hono POST /api/invite endpoint + Postgres/Drizzle
     `inquiries` + transactional email) AND the first env-consuming story (creates api/src/env.ts → resolves the
     deferred [1.1] API_PORT validation + duplicated-default items). Consumer of this service is Story 3.4 (the
     Invite-Me form). See Integration ACs. -->

## Story

As Josh,
I want every speaking inquiry reliably persisted to Postgres and emailed to me,
so that no opportunity is ever lost — even if the email send fails (FR-31, AR-2/4/5).

## Context & decisions (read first)

This is the FIRST dynamic/server story: the `api` Hono service gains its real surface (`POST /api/invite`), the attached Postgres gains the `inquiries` table (via Drizzle), and transactional email (Nodemailer → Resend) notifies the owner. **Postgres is the system of record** — a mail failure must NEVER lose the inquiry (persist first, then email; on mail failure still return success for persistence with `mail_status='failed'`). The architecture (`architecture.md`) mandates the exact file layout and patterns; follow them. The static site stays key-free (NFR-5); all secrets are server-side env.

### Decision 1 — finalize the shared `InviteInput` Zod schema (one source of truth, AR-15)

`shared/src/schemas.ts` currently has a PLACEHOLDER `InviteInput` (just `email`) with a `TODO(Story 3.3)`. Finalize it as the single cross-package contract consumed by BOTH the api (3.3) and the form island (3.4):
- `name` (required, trimmed, 1–200 chars), `email` (`z.email()`), `org` (optional, ≤200), `message` (required, trimmed, 1–5000), `topic` (optional, ≤200), `attribution` (required — the structured how-heard value; ≤200). 
- Do NOT put the honeypot or server-set fields (`source`/`status`/`mail_status`) in `InviteInput` (the client never sets those). Keep Zod 4 idioms (`z.email()`, not `z.string().email()`). Export the inferred type.

### Decision 2 — `inquiries` Drizzle schema + a real migration (architecture §Database)

`api/src/db/schema.ts` (Drizzle, snake_case columns ↔ camelCase TS props): `id` uuid PK `default gen_random_uuid()`; `created_at` timestamptz `default now()`; `updated_at` timestamptz `default now()`; `name` text; `email` text; `org` text (nullable); `message` text; `topic` text (nullable); `attribution` text; `source` text `default 'form'` (`'form'|'agent'`); `status` text `default 'new'` (`'new'|'replied'`); `mail_status` text (`'sent'|'failed'|'skipped'`). `api/src/db/client.ts` = a `pg` Pool + drizzle, reading `DATABASE_URL` from `env.ts`. Generate a Drizzle migration (`drizzle-kit`) under `api/src/db/migrations/` and a `drizzle.config.ts`; apply it to the attached Postgres so `inquiries` exists. The DB↔client casing boundary stays inside Drizzle (emit camelCase JSON; never leak snake_case).

### Decision 3 — `api/src/env.ts` (Zod-validated, fail-fast) — also resolves the deferred `[1.1]` API_PORT items

Create `api/src/env.ts` (the architecture's per-package typed env): Zod-validate + parse `process.env` once at module load, fail-fast on missing REQUIRED vars. Vars: `DATABASE_URL` (required for the endpoint; see Decision 5 for the test-time gate), `API_PORT` (default 8787, **validated as a positive integer** — resolves deferred `[1.1] API_PORT no validation`), `RESEND_API_KEY` (optional — unset ⇒ email skipped, Decision 4), `MAIL_FROM` + `MAIL_TO` (the owner notification addresses; optional with sensible `[OPEN]` defaults until set on the VM). Centralize the API_PORT default here and have `index.ts` (the bootstrap from Story 3.0) read it through `env.ts` — **resolves deferred `[1.1] API_PORT default duplicated as a literal`**. The web Astro proxy keeps its own `.env`-driven default (documented). NFR-5: env is server-side only; nothing reaches the client.

### Decision 4 — transactional email, ENV-GATED (Rule 4) so tests/CI need no live Resend

`api/src/lib/email.ts` = Nodemailer → Resend (the architecture default; SMTP-swappable). **Env-gate it (project Rule 4):** when `RESEND_API_KEY` is UNSET (default/CI/test), the email path is a no-op that returns `'skipped'` (NO network, no live send) → the inquiry persists with `mail_status='skipped'`. When SET, it sends the owner notification and returns `'sent'`, or on a send error returns `'failed'` (caught — never throws out of the request). **No PII / no message body in logs** (architecture §Observability) — log only non-PII fields (e.g. inquiry id, mail_status), never name/email/message. SPF/DKIM DNS for the sending domain is the launch prerequisite carried from Story 1.10 (documented; not blocking this story's code).

### Decision 5 — persist-first ordering, abuse controls, CORS closed

`api/src/routes/invite.ts` (`POST /api/invite`): (1) reject non-same-origin (CORS closed — the api only serves same-origin; enforce via an Origin/Host check or Hono CORS limited to the site origin); (2) honeypot — a decoy field (e.g. `website`) that real users leave empty; if non-empty, return a benign 200 receipt WITHOUT persisting/emailing (don't tip off the bot); (3) rate-limit (a simple in-memory per-IP sliding window for Stage 1) — over-limit ⇒ 429; (4) Zod-validate the body against `InviteInput` (400 on invalid); (5) **persist the row first** (Drizzle insert, `source='form'`, `status='new'`, `mail_status` set after the email step); (6) attempt the owner email (Decision 4), record `mail_status` (`sent`/`failed`/`skipped`); (7) return a JSON **receipt** (the new row `id` + a human message + `mailStatus`) — and on a mail failure STILL return success for the persistence (HTTP 200/201) so the inquiry is never lost. Mount the route on the `app` from `api/src/app.ts` (the Story-3.0 app/bootstrap split).

### Decision 6 — tests run without live deps (the EADDRINUSE lesson + Rule 4)

- **DB integration test (Rule 3 real-runtime):** drive `POST /api/invite` via Hono's in-process `app.request()` (no socket — preserves the Story-3.0 EADDRINUSE fix) against the REAL attached Postgres when `DATABASE_URL` is set: assert a row is persisted (read it back by the returned id) with the right fields + `mail_status='skipped'` (RESEND unset), then CLEAN UP (delete the test row by id in `afterEach`/`afterAll`, or use a recognizable test-marker email). If `DATABASE_URL` is UNSET, the integration test **skips-with-warning** (do NOT fail the suite — mirrors the Story-3.0 port-robustness discipline; do not normalize a red suite).
- **Unit tests (no deps):** Zod validation (valid/invalid/missing-required), honeypot rejection (non-empty decoy ⇒ no persist), rate-limit (over-limit ⇒ 429), the email lib's env-gate (`RESEND_API_KEY` unset ⇒ `'skipped'`, no network) + the `'failed'` path (mocked transport that throws ⇒ `mail_status='failed'`, row still persisted), and the no-PII-in-logs assertion (logger never receives name/email/message). Mock the db/email at the unit tier where a real DB isn't needed.

## Acceptance Criteria

1. **`inquiries` schema migrated via Drizzle (architecture §Database).**
   **Given** the attached Postgres
   **When** the Drizzle migration runs
   **Then** an `inquiries` table exists with: `id` uuid PK `default gen_random_uuid()`; `created_at` + `updated_at` `timestamptz` (UTC, defaulted); `name`, `email`, `message`, `attribution` (text, required); `org`, `topic` (text, nullable); `source` (`form`|`agent`, default `form`); `status` (`new`|`replied`, default `new`); `mail_status` (`sent`|`failed`|`skipped`) — and it is access-controlled (owned by the api's DB role; not world-writable).

2. **`POST /api/invite` validates, persists, emails, and returns a receipt (Postgres = system of record).**
   **Given** `POST /api/invite`
   **When** a valid JSON submission arrives (same-origin)
   **Then** the Hono endpoint validates the body against the shared `InviteInput` Zod schema, persists a row via Drizzle (`source='form'`, `status='new'`), triggers an owner email (Nodemailer → Resend), records `mail_status`, and returns a JSON receipt (the row `id` + `mailStatus` + a human message) — and because Postgres is the system of record, a mail failure NEVER loses the inquiry.

3. **Abuse controls — honeypot, rate-limit, closed CORS; mail-failure is non-destructive; no PII in logs.**
   **Given** requests hitting the endpoint
   **When** abuse vectors are exercised
   **Then** a non-empty honeypot field is rejected as spam (benign response, no row persisted/emailed), rate-limiting rejects floods (429), CORS is closed (same-origin only — cross-origin requests are refused), and on a mail-send failure the API STILL returns success for persistence with `mail_status='failed'` recorded — and **no PII or message body** is ever written to logs (only non-PII fields like the inquiry id + mail_status).

4. **Env-gated email + typed `env.ts` (Rule 4, NFR-5; resolves the deferred `[1.1]` API_PORT items).**
   **Given** the api configuration
   **When** the service starts / handles a request
   **Then** `api/src/env.ts` Zod-validates env and fails fast on missing required vars; when `RESEND_API_KEY` is UNSET the email path is a no-op returning `'skipped'` (no network, `mail_status='skipped'`) and when SET it sends (or records `'failed'` on error); `API_PORT` is validated as a positive integer and its default is centralized in `env.ts` (read by the `index.ts` bootstrap) — resolving deferred-work `[1.1] API_PORT no validation` + `[1.1] API_PORT duplicated default`. No secret reaches the client (the static site stays key-free).

5. **Launch prerequisite recorded (SPF/DKIM).**
   **Given** the email launch prerequisite
   **When** email is configured for production
   **Then** SPF/DKIM DNS for the sending domain is documented as the prerequisite (carried from Story 1.10) in the deploy/launch docs — not blocking this story's code, which runs in `'skipped'` mode until `RESEND_API_KEY` + DNS are set on the VM.

6. **Quality floor — the literal canonical gate stays green WITHOUT live deps (Rule 5, NFR-6, Decision 6).**
   **Given** the literal `pnpm test:all` (= `typecheck && lint && format:check && test && test:e2e && lh`)
   **When** it runs end-to-end on the deploy VM (where `DATABASE_URL` is set but `RESEND_API_KEY` is unset)
   **Then** every step is green: the api unit tests pass with no live deps; the DB integration test persists+reads+cleans-up a real row (and skips-with-warning if `DATABASE_URL` were unset — never reds the suite); importing the app opens NO socket (Story-3.0 invariant preserved); the build stays byte-deterministic (NFR-6; the web build is unaffected — this story is api/shared only); and `prettier --check .` / `eslint` / `typecheck` cover the new `api/**` + `shared/**` files (Rule 5 — new file types/paths in the root globs).

## Integration ACs

This story IS service-introducing (Rule 1): it adds `POST /api/invite` + the `inquiries` store + the email lib — a service later stories consume. It satisfies Rule 1 BOTH ways:
- **(a) An Integration AC with an observable effect (this story):** AC2 + Decision 6's DB integration test — a real `app.request()` HTTP `POST /api/invite` with valid JSON **persists an `inquiries` row that is read back from Postgres by the returned id** and returns a receipt carrying that id + `mail_status` — the service's own end-to-end observable effect (persist → receipt), verified against the real DB, not internal state.
- **(b) The first external consumer is named:** **Story 3.4** (the accessible Invite-Me form island) is the first UI consumer — it POSTs the `InviteInput` payload to `/api/invite` and renders the receipt/confirmation. Story 3.4 re-verifies the full form→endpoint→DB+email path end-to-end. The shared `InviteInput` contract finalized here is what 3.4 consumes.

## Tasks / Subtasks

- [x] **Task 1 — Finalize the shared `InviteInput` contract (AC2, Decision 1).**
  - [x] In `shared/src/schemas.ts`, replace the placeholder `InviteInput` with the finalized fields (name/email/org/message/topic/attribution; Zod 4 idioms; inferred type). Remove the `TODO(Story 3.3)` for InviteInput. Keep `GuideQuery` placeholder (Story 4.3).
- [x] **Task 2 — Add api deps + `env.ts` (AC4, Decision 3).**
  - [x] Add to `api/package.json`: `drizzle-orm`, `pg`, `nodemailer`, `zod` (deps) and `drizzle-kit`, `@types/pg`, `@types/nodemailer`, `dotenv` (devDeps). Pinned current stable versions (researched via npm view). Update `api/src/index.ts` (bootstrap) to read `API_PORT` via `env.ts`. Add a `.env.example` entry for the new vars.
  - [x] Create `api/src/env.ts` (Zod-validated, fail-fast): `DATABASE_URL`, `API_PORT` (positive int via `.refine()` + `.transform()`, default 8787 centralized HERE), `RESEND_API_KEY` (optional), `MAIL_FROM`/`MAIL_TO` (optional, `[OPEN]` defaults).
- [x] **Task 3 — Drizzle `inquiries` schema, client, migration (AC1, Decision 2).**
  - [x] `api/src/db/schema.ts` (the `inquiries` table per Decision 2), `api/src/db/client.ts` (pg Pool + drizzle reading `env.DATABASE_URL`), `api/drizzle.config.ts`. Generated migration into `api/src/db/migrations/0000_clear_tarot.sql` and applied to the attached Postgres (`inquiries` table verified). Casing stays inside Drizzle.
- [x] **Task 4 — Email lib, env-gated (AC2, AC3, AC4, Decision 4).**
  - [x] `api/src/lib/email.ts`: Nodemailer → Resend; `RESEND_API_KEY` unset ⇒ no-op returning `'skipped'`; set ⇒ send returning `'sent'`/`'failed'` (catch errors, never throw out). Logs id + mail_status only — NEVER name/email/message (no PII).
- [x] **Task 5 — The `/api/invite` route (AC2, AC3, Decision 5).**
  - [x] `api/src/routes/invite.ts`: same-origin/CORS-closed guard → honeypot check (`website` field) → rate-limit (5/60s per-IP in-memory) → Zod validate → persist (Drizzle, persist-first) → email (record `mail_status`) → JSON receipt (id + mailStatus + message); mail failure ⇒ still 201 for persistence. Mounted on `api/src/app.ts` under `/api`. `/api/health` working.
- [x] **Task 6 — Tests (AC1–AC6; Rule 3 + Rule 8 + Decision 6).**
  - [x] Unit (`api/src/**/*.test.ts`, vitest, no live deps): Zod valid/invalid/missing; honeypot rejection; rate-limit 429; email env-gate (`skipped` when unset, `failed` on mocked throw, row still persisted); no-PII-in-logs; CORS-closed rejection. 45 tests total across 5 test files, all green.
  - [x] DB integration test (`invite.integration.test.ts`): `app.request('POST','/api/invite', validBody)` against the real Postgres when `DATABASE_URL` set → row persisted + read back by id + `mail_status='skipped'`; cleanup the test row; skip-with-warning if `DATABASE_URL` unset (does not fail). Discoverable by the default suite (Rule 8). No socket bind (uses `app.request()` — Story-3.0 invariant).
- [x] **Task 7 — Resolve the deferred `[1.1]` items + SPF/DKIM doc (AC4, AC5).**
  - [x] In `deferred-work.md`, marked `[1.1] API_PORT no validation` + `[1.1] API_PORT duplicated default` RESOLVED by Story 3.3 (env.ts). Updated `docs/launch-checklist.md` SPF/DKIM section to reflect code shipped; DNS + RESEND_API_KEY still needed (operator action).
- [x] **Task 8 — Verify the floor with the LITERAL canonical gate (AC6).**
  - [x] Ran the literal `pnpm test:all` end-to-end (Rule 5). EXIT CODE 0 (all green): typecheck (0 errors), lint (clean), format:check ("All matched files use Prettier code style!"), test (743 tests: 107+45+591), test:e2e (189 passed), lh (Lighthouse assertions passed). DB integration runs with `DATABASE_URL` set, RESEND unset ⇒ skipped. Importing app opens no socket (Story-3.0 invariant). All new `api/**`+`shared/**` files are prettier/eslint/typecheck-clean.

## Dev Notes

### Current state (files being modified/created — read before editing)

- **`shared/src/schemas.ts`**: placeholder `InviteInput` (just `email`) + `TODO(Story 3.3)`; `GuideQuery` placeholder. Finalize `InviteInput`.
- **`api/src/app.ts`** (Story 3.0): exports the Hono `app` (`new Hono().basePath('/api')` + `/health`), NO `serve`. Mount the invite route here.
- **`api/src/index.ts`** (Story 3.0): the bootstrap (`import app from './app'; serve(...)`). Update to read `API_PORT` via the new `env.ts`. Keep `node dist/index.js` the prod entrypoint that binds the port (Story-3.0 AC2 invariant).
- **`api/src/health.test.ts`** (Story 3.0): in-process `app.request()` pattern — model the invite tests on it (no socket).
- **`api/package.json`**: deps = `@hono/node-server`, `hono`, `@portfolio/shared`; type:module; scripts dev/build/start/test (from 3.0). Add Drizzle/pg/nodemailer + drizzle-kit. Keep `start: node dist/index.js`.
- **Attached Postgres:** the `default` DB is reachable via `DATABASE_URL` (from the VM metadata service / a gitignored `.env` on the VM). The `inquiries` table does NOT exist yet (this story creates it). Max 25 connections; queries >5s killed; reuse one pool (architecture §pg Pool). The table is yours to create; do not touch other tables.
- **Architecture (authoritative file layout + patterns):** `architecture.md` §Database (243–249), §Auth/Security (259–275: CORS closed, Zod, rate-limit, honeypot, no-PII), §API (277–289: `/api/invite` flow + Nodemailer/Resend + Postgres-system-of-record), §Structure/casing (366–376: snake_case DB ↔ camelCase TS via Drizzle), §Env (418: typed env.ts fail-fast), §Observability (441: no PII/message bodies in logs), §dir-tree (546–565: the exact `api/src/{env.ts,routes/invite.ts,lib/email.ts,db/{schema,client,migrations}}` layout), §data-flow (650–651).

### Constraints / invariants to preserve

- **Postgres is the system of record** — persist BEFORE email; a mail failure returns success for persistence with `mail_status='failed'` (never lose an inquiry).
- **NFR-5 (key-free static runtime)** — all secrets server-side in `env.ts`/`.env`; nothing reaches the client; the web build is untouched by this story.
- **Rule 4 (env-gate runtime deps)** — email no-ops (`skipped`) when `RESEND_API_KEY` unset; tests/CI need no live Resend. Test BOTH branches.
- **Story-3.0 invariant** — tests use in-process `app.request()` (NO socket bind); `node dist/index.js` still binds the port as the prod entrypoint.
- **Rule 3 (real-runtime test)** — a real DB integration test (persist→read-back→cleanup), not a pure mock; skip-with-warning if `DATABASE_URL` unset (don't normalize a red suite — the Story-3.0 EADDRINUSE discipline).
- **No PII in logs** (NFR-7/§Observability) — never log name/email/message.
- **NFR-6** — the web build stays byte-deterministic (api/shared-only story). **Rule 5** — verify with the literal `pnpm test:all`; ensure root prettier/eslint/typecheck globs cover `api/**` + `shared/**`.
- **Determinism in the DB layer** — use DB-side `gen_random_uuid()` + `now()` defaults (server-generated), not `new Date()` in app code, for created/updated timestamps.

### Previous-story intelligence (Stories 3.0–3.2)

- Story 3.0 split `api/src/app.ts` (app) + `index.ts` (bootstrap) and made the api test port-robust (no socket on import) — BUILD ON THIS: mount `/api/invite` on `app.ts`; tests use `app.request()`. Do NOT reintroduce a module-level `serve()` or a fixed-port bind in tests (that was the EADDRINUSE bug 3.0 fixed).
- Story 3.0 explicitly DEFERRED the `[1.1]` API_PORT items to THIS story's `env.ts` — resolve them here (Task 7).
- The canonical gate is the literal `pnpm test:all` ending with `lh` — run it whole; new files must be prettier/eslint/typecheck-clean (3.0/3.1/3.2 each hit a first-run prettier miss — run `prettier --write` before the gate).
- Determinism + no-fabrication norms hold; `MAIL_TO`/`MAIL_FROM` real addresses are `[OPEN]` until Josh sets them on the VM.

### Project Structure Notes

- New: `api/src/env.ts`, `api/src/routes/invite.ts`, `api/src/lib/email.ts`, `api/src/db/{schema.ts,client.ts,migrations/*}`, `api/drizzle.config.ts`, api test files, `.env.example` additions. Modified: `shared/src/schemas.ts`, `api/src/app.ts`, `api/src/index.ts`, `api/package.json`, `deferred-work.md`, the deploy/launch doc (SPF/DKIM). No `web/` changes (the form is Story 3.4).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] — the AC source.
- [Source: architecture.md#L243-249,L259-289,L366-376,L418,L441,L546-565,L650-651] — Database/security/API/casing/env/observability/dir-tree/data-flow (authoritative).
- [Source: shared/src/schemas.ts] — the `InviteInput` placeholder to finalize (AR-15 single contract).
- [Source: api/src/app.ts, api/src/index.ts, api/src/health.test.ts] — the Story-3.0 app/bootstrap split + the in-process test pattern.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md] — `[1.1] API_PORT` no-validation + duplicated-default (resolve here); `[2.1] EADDRINUSE` discipline (env-robust tests).
- [Source: .claude/rules/project-rules.md#4,#5] — env-gate runtime deps (test both branches); canonical full-gate verification.
- [Source: ~/.claude/CLAUDE.md (VM)] — the attached Postgres `default` DB descriptor is in the metadata-service user-data (`databases[].database_url`); max 25 connections; create your own tables; don't modify others'.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6 (2026-06-07)

### Debug Log References
- Zod 4 `.transform()` throws are NOT caught by `safeParse` — used `.refine()` + `.transform()` chain instead (confirmed via Perplexity research). Fixed in both `api/src/env.ts` and `api/src/env.test.ts`.
- Vitest `env` config option doesn't support ESM `require()` — switched to `dotenv` loaded via top-level import in `vitest.config.ts` to load `api/.env` into test env.
- DB integration test initially combined with unit tests in same file, causing mock/unmock conflicts. Resolved by separating into `invite.integration.test.ts` (real deps) vs `invite.test.ts` (mocked deps).
- `api/package.json` needed explicit `zod` dep since `env.ts` uses it directly (shared package has it but api can't rely on transitive resolution for direct imports).

### Completion Notes List
- **Task 1:** `shared/src/schemas.ts` `InviteInput` finalized with 6 fields (name/email/org/message/topic/attribution). `TODO(Story 3.3)` removed; `TODO(Story 4.3)` for `GuideQuery` retained. Zod 4 `z.email()` idiom used (not deprecated `z.string().email()`).
- **Task 2:** `api/src/env.ts` created. `API_PORT` validated as positive integer via `.refine()` + `.transform()` (Zod 4 — throw in transform not caught by safeParse). `API_PORT` default 8787 is now the ONE canonical source; `index.ts` reads via `env.ts`. `RESEND_API_KEY` optional (Rule 4 env-gate). `MAIL_FROM`/`MAIL_TO` optional with `[OPEN]` placeholder defaults. `dotenv` added as devDep for `drizzle.config.ts` and `vitest.config.ts`.
- **Task 3:** `inquiries` table with all 12 columns per Decision 2 (uuid PK, timestamptz defaults, text fields, nullable org/topic, source/status/mail_status). Migration `0000_clear_tarot.sql` generated and applied to attached Postgres. Verified via `psql` `\d inquiries`. Drizzle snake_case↔camelCase boundary in `schema.ts`.
- **Task 4:** `api/src/lib/email.ts` env-gated (Rule 4): RESEND unset → `'skipped'` with zero network; set → Nodemailer+Resend SMTP → `'sent'`/`'failed'`. Errors caught, never thrown. No PII/message body in any log path (id+mail_status only).
- **Task 5:** `api/src/routes/invite.ts` — full 7-step pipeline: CORS guard (cross-origin → 403; no-Origin allowed), honeypot (`website` field), rate-limit (5/60s per-IP in-memory, exported `_resetRateLimiter()` for tests), Zod validate (400), persist first (Drizzle insert), email (update mail_status), JSON receipt (201). Mail failure → still 201 (Postgres = system of record). Mounted on `app.ts` via `app.route('/', inviteRouter)`.
- **Task 6:** 5 test files, 45 tests. Unit tests mock DB+email; integration test (`invite.integration.test.ts`) uses real Postgres — row persisted+read-back+cleaned-up; skip-with-warning if DATABASE_URL unset. No socket bind in any test (app.request() only).
- **Task 7:** Deferred `[1.1]` items in `deferred-work.md` marked RESOLVED with resolution details. `docs/launch-checklist.md` SPF/DKIM section updated to reflect code shipped; operator action still required for DNS+RESEND_API_KEY.
- **Task 8:** `pnpm test:all` exit 0. typecheck=0 errors, lint=clean, format:check=clean, test=743 passed, test:e2e=189 passed, lh=passed.

### File List
New files:
- `api/src/env.ts`
- `api/src/db/schema.ts`
- `api/src/db/client.ts`
- `api/src/db/migrations/0000_clear_tarot.sql`
- `api/src/db/migrations/meta/_journal.json`
- `api/src/db/migrations/meta/0000_snapshot.json`
- `api/src/lib/email.ts`
- `api/src/routes/invite.ts`
- `api/src/env.test.ts`
- `api/src/lib/email.test.ts`
- `api/src/routes/invite.test.ts`
- `api/src/routes/invite.integration.test.ts`
- `api/drizzle.config.ts`
- `api/.env` (gitignored — NOT committed)

Modified files:
- `shared/src/schemas.ts` (InviteInput finalized)
- `api/src/app.ts` (invite route mounted)
- `api/src/index.ts` (API_PORT via env.ts)
- `api/package.json` (new deps: drizzle-orm, pg, nodemailer, zod, drizzle-kit, @types/pg, @types/nodemailer, dotenv)
- `api/vitest.config.ts` (dotenv loading for tests)
- `.env.example` (MAIL_FROM/MAIL_TO added, RESEND_API_KEY comment updated)
- `docs/launch-checklist.md` (SPF/DKIM section updated)
- `_bmad-output/implementation-artifacts/deferred-work.md` ([1.1] items marked RESOLVED)

### Change Log
- Story 3.3 (2026-06-07): `POST /api/invite` endpoint — Drizzle `inquiries` schema + migration, `api/src/env.ts` (Zod fail-fast), `api/src/lib/email.ts` (Nodemailer→Resend env-gated), invite route with CORS/honeypot/rate-limit/persist-first/email, 45 unit+integration tests. Resolved deferred [1.1] API_PORT items. `pnpm test:all` green (743+189 tests).

### Review Findings

**Reviewer:** bmad-code-review (adversarial: Blind Hunter / Edge-Case Hunter / Acceptance Auditor) · model claude-opus-4-8 · 2026-06-07
**Verdict:** APPROVE. Zero HIGH, zero MED. One MED-shaped doc-comment inaccuracy auto-resolved inline; three LOW items deferred (all intentional Stage-1 trade-offs the story's own wording sanctions). The literal canonical gate is green and the headline security/correctness invariants are mutation-verified non-vacuous.

#### Verification performed against the REAL runtime (not just code reading)

- **AC1 — `inquiries` schema (live DB inspected via `psql \d inquiries`):** all 12 columns present with exact types — `id` uuid PK `gen_random_uuid()`; `created_at`/`updated_at` `timestamptz` NOT NULL `now()`; `name`/`email`/`message`/`attribution` text NOT NULL; `org`/`topic` nullable; `source` default `'form'`, `status` default `'new'`, `mail_status` nullable. **Access-controlled:** table owner `role_3903a9c13`, grants exclusively to that role, **no PUBLIC grants** (not world-writable). Migration `0000_clear_tarot.sql` matches the live DDL. PASS.
- **AC2 — validate/persist/email/receipt, Postgres = system of record:** the real-DB integration test issues `app.request('POST','/api/invite', validBody)`, reads the row back **by the returned id** from live Postgres, and asserts the full field round-trip + camelCase receipt (`{id, mailStatus, message}` — no snake_case leak; confirmed in `c.json()` at route lines 228-235 and in the read-back). PASS.
- **AC3 — abuse controls + non-destructive mail failure + no-PII:** honeypot (non-empty `website` → benign 200, **zero rows** in real DB), rate-limit (6th request → 429), CORS-closed (cross-origin Origin≠Host → 403), forced mail failure → row STILL persisted + **201** with `mail_status='failed'`, and logs carry only `id`/`mailStatus` (never name/email/message — confirmed in source + observed in verbose test stdout). PASS.
- **AC4 — env-gated email + typed `env.ts` (resolves deferred [1.1]):** `env.ts` Zod-validates + fails fast (real-module child-process test in `env.realmodule.test.ts` proves actual `process.exit(1)` on missing `DATABASE_URL` / bad `API_PORT`, and that `API_PORT` parses to a **number**); `RESEND_API_KEY` unset ⇒ `'skipped'` with no network; `API_PORT` validated positive-int, default `8787` centralized in `env.ts` and read by `index.ts`. `deferred-work.md` accurately marks BOTH [1.1] items resolved (no-validation + duplicated-default), correctly noting the web Astro proxy keeps its own documented `.env` default. PASS.
- **AC5 — SPF/DKIM recorded:** `docs/launch-checklist.md` §2 updated accurately — code shipped, email env-gated to `'skipped'` until DNS + `RESEND_API_KEY` set; 5-step enable runbook + summary-table row updated. PASS.
- **AC6 — literal `pnpm test:all` GREEN, no live deps:** **re-run by the reviewer, EXIT CODE 0**, ending with `lh` (Lighthouse autorun passed). typecheck 0 errors · lint clean · `format:check` "All matched files use Prettier code style!" (Rule 5 — root `prettier --check .` covers the new `api/**` `.ts`) · test 757 passed (107 scripts + 59 api + 591 web; api grew 45→59 via QA gap-fills) · test:e2e 189 passed. The DB integration suite **ran** against real Postgres (DATABASE_URL from `api/.env`; zero todo/skip in the api block; verbose re-run shows 8/8 real-DB tests) and the `inquiries` table is **clean (0 rows)** afterward. Importing the app opens NO socket; `node dist/index.js` (built fresh) binds the port and serves `/api/health` (Story-3.0 invariant preserved). PASS.
- **Integration AC (Rule 1):** the persist→receipt observable effect is real (tested against live DB, asserted on the returned id, not internal state) and names the first consumer **Story 3.4**. Accurate. PASS.

#### Mutation checks (proving the key tests are non-vacuous)

1. Injected a destructive rollback (`db.delete` on `mail_status==='failed'`) → the real-DB forced-mail-fail test went **RED** (read-back found 0 rows). Reverted.
2. Leaked `email` into the success log line → the no-PII-in-logs test went **RED**. Reverted.
3. Defeated the honeypot guard (`if (false && …)`) → both the unit honeypot tests and the real-DB "writes NO row" honeypot test went **RED**. Reverted.

All reverts byte-clean; the `inquiries` table left at 0 rows.

#### Security (scrutinized hard — first server surface)

- `api/.env` (DATABASE_URL + future keys) is **gitignored, untracked, and NOT staged**; no `.env` is tracked anywhere; `.env.example` carries placeholders only. NFR-5 holds — the web build is untouched by this story (no secret reaches the client). `dist/` is gitignored (build residue safe). The Nodemailer→Resend transport (`replyTo`, `secure:true` port 465, `user:'resend'`) is verified against the provider's documented API.

#### Findings & dispositions

- **AUTO-RESOLVED inline (MED-shaped doc accuracy):** `api/src/routes/invite.ts` Step-7 comment said "Mail failure → HTTP 200" while the code returns **201**. Both are "success" per AC3 ("200/201") so behavior was correct; rewrote the comment to state 201 + non-destructive. Re-ran prettier/eslint/30 invite tests post-edit → green.
- **DEFERRED — 3 × LOW** (logged to `deferred-work.md` under "code review of story-3.3", each with rationale + suggested resolution): (1) rate-limiter labeled "sliding window" but implemented as a fixed window — Stage-1 acceptable, AC only needs 429-on-flood; (2) `updated_at` not bumped on the `mail_status` UPDATE — no AC requires it, no consumer reads it yet; (3) `MAIL_FROM`/`MAIL_TO` validated as `z.string()` not `z.email()` — trusted operator config that fails safe.
- **DISMISSED as noise (no action):** the "sliding window" comment vs fixed-window behavior is captured as LOW above rather than dismissed; no other false-positive-class items surfaced. Rule 6 (ADR) N/A — `docs/adr/` does not exist. Story-3.0 EADDRINUSE discipline preserved.

**Counts:** resolved (inline) 1 · deferred 3 (LOW) · dismissed 0 · HIGH 0 · MED 0 · LOW 3.
