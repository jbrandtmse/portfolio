# Lead per-story smoke — Story 3.3 (Invite-Me capture: data model, endpoint & email)

Date: 2026-06-07 · Method: api (real HTTP against the built `node dist/index.js`, real Postgres, RESEND unset) + DB side-effect reads · Result: **PASS** · iterations: 1 · **defects caught by smoke: 1** (a no-exclamation voice-rule violation in the receipt copy — fixed by the lead, re-verified)

Started the REAL production entrypoint `node api/dist/index.js` (the systemd command) with `DATABASE_URL` from the VM metadata service and `RESEND_API_KEY` UNSET (→ mail skipped), on an alt port, and exercised `POST /api/invite` over real HTTP, asserting status + body + the Postgres side-effect. Cleaned up every test row.

## SMOKE A — valid POST → receipt (AC2)
`POST /api/invite` (same-origin) with a valid body → **HTTP 201** + JSON receipt `{ id: <uuid>, mailStatus: "skipped", message: "…" }`. `mailStatus="skipped"` because RESEND is unset (Rule 4 env-gate, no live send).

## SMOKE B — row persisted in Postgres (Integration AC / system-of-record)
`SELECT … FROM inquiries WHERE email=<marker>` → the row exists with `id` === the receipt id, `name`/`email`/`org`/`topic`/`attribution` stored verbatim, `source='form'`, `status='new'`, `mail_status='skipped'`. The service's observable effect (persist → receipt) is verified live against the real DB (the Rule-1 Integration AC). camelCase receipt, snake_case DB — casing bridged in Drizzle.

## SMOKE C — honeypot blocks persistence (AC3)
`POST` with a non-empty `website` decoy → **HTTP 200** (benign, doesn't tip the bot) AND **0 rows** persisted for that email. Honeypot works.

## SMOKE D — invalid input → 400 (AC3)
`POST` missing the required `name` → **HTTP 400** (Zod validation against the shared `InviteInput`).

## SMOKE E — CORS closed (AC3)
`POST` with `Origin: https://evil.example.com` → **HTTP 403** (refused; same-origin only).

## Cleanup
Deleted all smoke marker rows → `inquiries` count = 0. The full `pnpm test:all` integration tests also self-clean (0 rows after the gate).

## Defect caught by the smoke (test-pyramid leak — automated tiers + code-review passed)
The receipt `message` returned by the live endpoint was **"Thank you! We will review your inquiry and be in touch."** — the exclamation mark violates the project's **no-exclamation-marks** voice rule ([[copy-positive-assertion-no-hype]]). The unit/integration tests didn't pin the message string and code-review focused exclamation checks on the page copy, so this user-facing API copy slipped through. **Fixed** (lead): both receipt messages in `api/src/routes/invite.ts` (the success path line 233 and the honeypot benign path line 121) changed `"Thank you! …"` → `"Thank you. …"`. Re-smoked: the live receipt now reads "Thank you. We will review your inquiry and be in touch." (no exclamation). No test pinned the old string, so no test churn.

## Canonical gate (post-fix, AC6)
Literal `pnpm test:all` re-run → **EXIT 0**: scripts vitest 107 · api vitest 59 · web vitest 591 · Playwright e2e 189 · Lighthouse on `/` + `/about/`. `inquiries` table clean (0 rows). `node dist/index.js` binds the port (Story-3.0 prod-entrypoint invariant); tests use `app.request()` (no socket). `api/.env` gitignored, never staged.

## Verdict
All ACs exercised against the real running api + real Postgres; the Integration AC (persist→receipt) confirmed live; one voice-rule copy defect caught and fixed. PASS — clear to commit.
