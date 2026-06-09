# Story 3.4: Invite-Me form (accessible, resilient)

---
baseline_commit: 55b503bd90d0abcbea3d01e7039f6550b2f66487
---

Status: done

<!-- Created by the /epic-cycle lead create-story gate (Epic 3), 2026-06-07. Source: epics.md Epic 3 Story 3.4.
     FIRST React island of the project (web/src/islands/InviteForm.tsx) — consumes the Story-3.3 /api/invite +
     the shared InviteInput contract. Resolves the deferred [1.2]/retro-A4 React-chunk items (the integration is
     now actually used; re-verify non-island routes stay 0-JS). Story 3.5 (the Close) embeds this same form. -->

## Story

As a conference organizer (Mara, UJ-2 terminal step) or any visitor,
I want a short, accessible contact form that confirms receipt and never loses my inquiry,
so that I can invite Joshua R. Brandt, MSE without friction and know it went through (FR-31, UX-DR20).

## Context & decisions (read first)

This story builds the accessible, resilient Invite-Me form that drives the SM-1 conversion path into the Story-3.3 `POST /api/invite`. It fleshes the Epic-1 `/invite` stub. Two non-negotiables shape the design: **(1) it must work as a real form post if the enhancement JS fails** (resilience — the inquiry is never silently lost), and **(2) it is the project's FIRST React island** (architecture: "React only for the three islands — the Guide pill, the Guide panel, and the Invite-Me form"). So the SAME component must render a working native `<form>` server-side (the JS-off baseline) AND hydrate to a rich client-side experience (the enhancement).

### Decision 1 — the form is a React island that progressively enhances a real `<form>` (architecture §Islands)

`web/src/islands/InviteForm.tsx` (PascalCase, `web/src/islands/`) renders a real `<form action="/api/invite" method="POST">` with native inputs + native validation attributes (`required`, `type="email"`, `maxlength`). Astro SSRs the island's initial HTML, so the working `<form>` is in `dist/invite/index.html` — **JS-off it is a native POST** (Decision 3). Mount it with `client:visible` (per architecture). On hydration the island intercepts submit (`preventDefault` → `fetch`) for the rich path (Decision 4). Wrap the island in an error boundary so a hydration failure degrades to the SSR'd static form beneath (architecture §"islands wrapped in error boundaries"). Field `name=` attributes MUST match the shared `InviteInput` keys (`name`, `email`, `org`, `message`, `topic`, `attribution`) + the honeypot field name the 3.3 endpoint checks (`website`).

### Decision 2 — every field accessible by construction (UX-DR20, EXPERIENCE §Invite-Me form)

- **Every field has a persistent visible `<label>`** (never placeholder-as-label), associated via `htmlFor`/`id`.
- **Required fields are marked in TEXT** (e.g. a "(required)" word in the label), NOT by asterisk/color alone.
- The **attribution** field ("How did you hear about Joshua?") is a labeled **`<select>`** (or radio group) capturing the FR-31 structured attribution — provide a small fixed option set (e.g. Search, YouTube, A talk, A referral, Other; values `[OPEN]`-confirmable, but the set is concrete).
- Keyboard-operable end to end; every control has a visible `:focus-visible` ring (DESIGN tokens); the `<input>`/`<select>`/`<textarea>` use the DESIGN `input` token styling (lines 317–327).

### Decision 3 — JS-off resilience: the endpoint content-negotiates; a static `/invite/thanks/` page (extends the 3.3 endpoint)

The Story-3.3 endpoint currently parses JSON only (`c.req.json()`) and returns JSON. **Extend `api/src/routes/invite.ts` to content-negotiate** so the native (JS-off) form post works end-to-end:
- A **form-encoded** request (`Content-Type: application/x-www-form-urlencoded`, i.e. the native POST) → parse via `c.req.parseBody()`, run the SAME honeypot/rate-limit/CORS/Zod/persist/email pipeline, then on success **303-redirect to `/invite/thanks/`** (a real static page → JS-off the browser lands on a server-rendered confirmation); on a validation rejection (rare JS-off, since native `required`/`type=email` block most invalid submits client-side) return a minimal self-contained **HTML 400** stating the error + a `mailto:` fallback (the inquiry is not silently lost).
- A **JSON** request (`Accept: application/json` / the island's `fetch`) → the existing JSON receipt (201/200/400/403/429), unchanged.
- New static page **`web/src/pages/invite/thanks.astro`** (MirrorLayout): a server-rendered confirmation with the response-time copy — "I reply within [N] business days · persisted + emailed, never an auto-responder" (`[OPEN: N]`) — and a link back to `/`. 0 JS (it's a Mirror route).

### Decision 4 — the hydrated state machine (EXPERIENCE §State Patterns: default / invalid / submitting / success / offline-fail)

The island's `onSubmit` (JS-on) `preventDefault`s and runs:
- **Invalid (inline):** validate against the shared `InviteInput` (reuse `@portfolio/shared` `InviteInput.safeParse`); each bad field gets `aria-invalid="true"` + an error message wired via `aria-describedby`/`aria-errormessage`; on a failed submit an **error summary** at the top **receives focus** and lists each error as a link to its field.
- **Submitting:** the submit `<button>` is `disabled` with a status (e.g. "Sending…").
- **Success:** POST `fetch('/api/invite', { headers: { Accept: 'application/json' }, body: JSON })` → on the JSON receipt, an `aria-live="polite"`/`role="status"` confirmation announces receipt + the response-time copy ("I reply within [N] business days · persisted + emailed, never an auto-responder"; `[OPEN: N]`).
- **Offline / submit-failure:** on a network/non-2xx error, a non-destructive **`role="alert"`** state that **preserves the entered values**, states the failure plainly, and offers **retry** + a **fallback** (a `mailto:` link / `/about`) — the inquiry is never silently dropped.

### Decision 5 — NFR-1 evolution: `/invite` ships the FIRST React island; non-island routes stay 0-JS (resolves [1.2]/A4)

This is the first route to ship the React client runtime (the island). NFR-1 is "0-JS-BY-DEFAULT" — islands are the sanctioned, opt-in exception (architecture §Islands; ~200–250KB budget). So:
- `/invite/` ships the React island JS (the `client.*.js` runtime + the island chunk) — **sanctioned**. The previously-unreferenced `web/dist/_astro/client.*.js` chunk (deferred `[1.2]`/A4) is now **legitimately referenced** by `/invite/` — resolve that deferred item: confirm the React integration is needed exactly where the island ships, and the chunk is no longer dead weight.
- **Re-verify every NON-island route stays 0-executable-JS** (home keeps only its scene-rail script; `/speaking` keeps only its copy script; all other Mirror routes 0) — no route gains the React runtime except `/invite/` (and, later, the Close on `/` via Story 3.5 + the Guide routes in Epic 4). 
- **Update `web/test/build-output.test.ts`** to assert the `/invite/` island carve-out (it ships the React island; the SSR'd `<form>` is present for JS-off) AND that non-island routes do NOT reference the React client chunk. Keep the Lighthouse budget green (the island is within the JS budget; `client:visible` defers it).

## Acceptance Criteria

1. **A real, accessible `<form>` POSTing to `/api/invite` that works JS-off.**
   **Given** the `/invite` page (and, later, the Close scene — Story 3.5)
   **When** the form renders
   **Then** it is a real accessible `<form action="/api/invite" method="POST">` (a React island that Astro SSRs, so the working form is in the static HTML and submits as a native POST if the enhancement JS fails), every field has a persistent visible `<label>`, required fields are marked in text (not asterisk/color alone), and the attribution field ("How did you hear about Joshua?") is a labeled `<select>`/radio group capturing the FR-31 structured attribution
   **And** the field `name=`s match the shared `InviteInput` contract + the honeypot field, so the native POST and the island fetch send the same shape.

2. **JS-off native POST succeeds end-to-end (resilience).**
   **Given** the built `/invite/` page loaded with JavaScript disabled
   **When** the visitor fills the form and submits (native POST, form-encoded)
   **Then** the endpoint (content-negotiating) persists the inquiry and the browser lands on a server-rendered `/invite/thanks/` confirmation page showing the response-time copy — the inquiry is captured with NO JavaScript (the resilience guarantee).

3. **Inline validation + focus-managed error summary (JS-on).**
   **Given** the hydrated form
   **When** the visitor submits with errors
   **Then** each bad field gets `aria-invalid="true"` + a message wired via `aria-describedby`/`aria-errormessage`, an error summary at the top **receives focus** and links to each bad field, and the submit control shows a disabled `submitting` state during the request — all keyboard-operable with a visible `:focus-visible` ring.

4. **Success confirmation announces receipt (JS-on).**
   **Given** a successful submission
   **When** the server confirms (JSON receipt)
   **Then** an `aria-live="polite"`/`role="status"` confirmation announces receipt with the stated response time ("I reply within [N] business days · persisted + emailed, never an auto-responder"; `N` flagged `[OPEN]`).

5. **Network/submit failure is non-destructive (JS-on).**
   **Given** a network or submit failure
   **When** the POST fails
   **Then** a non-destructive `role="alert"` state **preserves the entered values**, states the failure plainly, and offers retry + a fallback (a `mailto:` link / `/about`) — the inquiry is never silently lost.

6. **First React island shipped; non-island routes stay 0-JS (NFR-1; resolves [1.2]/A4).**
   **Given** the built site
   **When** the build-output NFR-1 assertions run
   **Then** `/invite/` ships the React island (its `client.*.js` runtime + island chunk are referenced) AND the SSR'd `<form>` is present for the JS-off baseline; the previously-unreferenced React chunk is now legitimately used (deferred `[1.2]`/A4 resolved); and EVERY non-island route is unchanged — 0 executable JS except the home scene-rail script and the `/speaking` copy script (no other route references the React runtime). The build-output test is updated to assert this.

7. **Quality floor — the literal canonical gate is green (Rule 5, NFR-2, NFR-6).**
   **Given** the literal `pnpm test:all` (= `typecheck && lint && format:check && test && test:e2e && lh`)
   **When** it runs end-to-end after the change
   **Then** every step is green: **axe finds 0 WCAG 2.1 AA violations** on `/invite/` (labels, required-in-text, aria-invalid/describedby, error-summary focus, aria-live/role=alert, focus-visible), the JS-off e2e proves the native POST → `/invite/thanks/` path (real DB; RESEND unset ⇒ skipped; cleans up its row), the build stays byte-deterministic (NFR-6), the Lighthouse budget holds (the `client:visible` island defers its JS), and `prettier --check .` / `eslint` / `typecheck` cover the new `.tsx` island + `api`/`web` changes (Rule 5 — the first `.tsx` enters the root globs).

## Integration ACs

This story is the first CONSUMER of the Story-3.3 service (Rule 1 closure of 3.3's named consumer): the Invite-Me form (native POST + island fetch) drives `POST /api/invite` and renders its receipt/confirmation. AC2 (JS-off native POST → persisted row → `/invite/thanks/`, verified against the real DB) and AC4 (JS-on fetch → aria-live receipt) ARE the integration verification — the full form→endpoint→Postgres(+email-skipped) path end-to-end, observable (a persisted row + a user-visible confirmation). The story also EXTENDS the 3.3 endpoint (content-negotiation) — a backward-compatible addition (JSON path unchanged); the existing 3.3 api tests must stay green. Forward-reference (not a defect): Story 3.5 (the Close) embeds this same `InviteForm` island on the home `/` Close scene and fires the `invite-submitted` conversion event (the FR-36 analytics helper from 1.10) — wired there, not here.

## Tasks / Subtasks

- [x] **Task 1 — Extend the 3.3 endpoint to content-negotiate (AC2, Decision 3).**
  - [x] In `api/src/routes/invite.ts`: detect form-encoded requests (Content-Type `application/x-www-form-urlencoded`); parse via `c.req.parseBody()`; run the SAME honeypot/rate-limit/CORS/Zod/persist/email pipeline; on success **303-redirect to `/invite/thanks/`**; on validation rejection return a minimal HTML 400 + a `mailto:` fallback. Keep the JSON path (Accept: application/json) returning the existing JSON receipt UNCHANGED. The existing 3.3 api tests must still pass.
- [x] **Task 2 — `web/src/pages/invite/thanks.astro` (AC2, Decision 3).**
  - [x] A MirrorLayout confirmation page (server-rendered, 0 JS) with the response-time copy ("I reply within [N] business days · persisted + emailed, never an auto-responder"; `[OPEN: N]`) + a link back to `/`. Answer-first lede naming "Joshua R. Brandt, MSE". Trailing-slash URL.
- [x] **Task 3 — `web/src/islands/InviteForm.tsx` (AC1, AC3, AC4, AC5, Decision 1/2/4).**
  - [x] Render a real `<form action="/api/invite" method="POST">` with labeled fields (name, email `type=email`, org, message `<textarea>`, topic, attribution `<select>`), required-in-text markers, native validation attrs, the honeypot `website` field (visually-hidden, `aria-hidden`, `tabindex=-1`, `autocomplete=off`), and a submit `<button>`. The names match `InviteInput` + `website`.
  - [x] Hydration enhancement: `onSubmit` preventDefault → `InviteInput.safeParse` → inline `aria-invalid`/`aria-describedby` + focus-managed error summary; submitting disabled state; `fetch` (Accept: application/json) → aria-live/role=status success with the response-time copy; non-destructive role=alert failure preserving values + retry + mailto/about. Style via DESIGN `input` tokens + scoped styles; visible `:focus-visible`. Wrap in an error boundary.
- [x] **Task 4 — Wire the island onto `/invite` (AC1, AC6, Decision 1/5).**
  - [x] Replace the `/invite` stub body with `<InviteForm client:visible />` (keep MirrorLayout + the answer-first lede). Confirm Astro SSRs the form HTML into `dist/invite/index.html` (JS-off baseline present) and the island hydrates.
- [x] **Task 5 — NFR-1 build-output carve-out + resolve [1.2]/A4 (AC6, Decision 5).**
  - [x] Update `web/test/build-output.test.ts`: `/invite/` ships the React island (assert the `client.*.js` runtime + island chunk are referenced + the SSR'd `<form>` present); assert NON-island routes do NOT reference the React client chunk and stay 0-executable-JS (home scene-rail + `/speaking` copy script remain the only carve-outs). In `deferred-work.md` mark `[1.2]` (unreferenced React chunk) + retro A4 RESOLVED by Story 3.4.
- [x] **Task 6 — Tests (AC1–AC7; Rule 3 + Rule 8).**
  - [x] e2e (Playwright): (a) **JS-off** (a `javaScriptEnabled:false` context) — fill + submit the native form → lands on `/invite/thanks/` AND a row is persisted in Postgres (read back, then CLEAN UP; RESEND unset ⇒ mail skipped); (b) **JS-on** — invalid submit → error summary focused + aria-invalid; valid submit → aria-live success with the response-time copy; forced fetch failure → role=alert preserves values + mailto fallback; (c) **axe AA** on `/invite/`. Component tests for the island where useful. Discoverable (Rule 8; add an `invite` Playwright project if needed).
  - [x] Confirm the existing 3.3 api tests still pass (the content-negotiation is additive).
- [x] **Task 7 — Verify the floor with the LITERAL canonical gate (AC7).**
  - [x] Run the literal `pnpm test:all` end-to-end (Rule 5). All green incl. `test:e2e` (JS-off + JS-on + axe) and `lh`. Confirm `/invite/` ships the island + the JS-off form works; non-island routes 0-JS; two clean builds byte-identical; the first `.tsx` is prettier/eslint/typecheck-clean. Note files touched in the Dev Agent Record. Do NOT commit `api/.env`.

## Dev Notes

### Current state (files being modified/created — read before editing)

- **`web/src/pages/invite.astro`** (stub): MirrorLayout + an answer-first LEDE ("Joshua R. Brandt, MSE takes speaking and collaboration inquiries here…") + a `.stub-note`. Replace the body with the island; keep MirrorLayout + the lede.
- **`api/src/routes/invite.ts`** (Story 3.3): JSON-only (`c.req.json()`), returns JSON receipts; has the honeypot (`website`)/rate-limit/CORS/Zod/persist/email pipeline. EXTEND to content-negotiate (form-encoded → parseBody → 303 `/invite/thanks/`); keep JSON path unchanged + the 3.3 tests green.
- **`shared/src/schemas.ts`** (Story 3.3): the finalized `InviteInput` (name/email/org/message/topic/attribution). The island reuses `InviteInput.safeParse` (AR-15 single contract). Field `name=`s must match these keys.
- **`web/astro.config.mjs`**: `@astrojs/react` is already registered (`integrations: [react()]`). This story ships the FIRST actual `.tsx` island — no config change needed; `client:visible` triggers hydration.
- **`web/src/components/scene/SceneRail.astro` + `web/src/components/speaker/BioBlock.astro`**: the existing sanctioned client-script carve-outs (home scene-rail; `/speaking` copy). The React island is the THIRD sanctioned client surface — keep the others' assertions intact.
- **`web/test/build-output.test.ts`**: asserts per-route executable-script counts (home = 1 scene-rail; `/speaking` = 1 copy; other Mirror routes = 0). Add the `/invite/` island carve-out + the non-island no-React-chunk assertion.
- **DESIGN `input` token** (`DESIGN.md` lines 317–327): input background/border/radius/focus (`border → --color-accent; 2px ring`) + "label always present". Visual reference: `mockups/` (no dedicated invite mock — follow the DESIGN tokens + the EXPERIENCE form spec; spine wins).
- **EXPERIENCE form spec** (`EXPERIENCE.md` lines 151, 166): the authoritative field/label/required/attribution/validation/success/failure behavior (quoted in Decisions 2/4).
- **Attached Postgres**: the JS-off e2e persists a real row — use the metadata-service `DATABASE_URL` (gitignored `api/.env`); RESEND unset ⇒ mail skipped; CLEAN UP the test row; skip-with-warning if DB unset (the Story-3.3 discipline).

### Constraints / invariants to preserve

- **Resilience (the headline):** the form works JS-off (native POST → `/invite/thanks/`); the inquiry is never silently lost (success → thanks page; failure → preserved values + mailto). 
- **NFR-1:** `/invite/` is the FIRST sanctioned React-island route; EVERY other route's JS profile is UNCHANGED (home scene-rail + `/speaking` copy are the only other carve-outs; no route gains the React runtime). Resolve [1.2]/A4. `client:visible` defers the island JS (Lighthouse budget).
- **NFR-2 / AA:** visible labels, required-in-text, `aria-invalid`+`aria-describedby`/`aria-errormessage`, focus-managed error summary, `aria-live`/`role=status` success, `role=alert` failure, visible `:focus-visible`, full keyboard operability → axe 0 violations.
- **NFR-6:** byte-deterministic build (the island's SSR output is deterministic; no `new Date()`/wall-clock in render).
- **AR-15 single contract:** the island validates with the shared `InviteInput` (don't fork the schema). The endpoint content-negotiation is ADDITIVE (3.3 JSON path + tests unchanged).
- **Voice ([[copy-positive-assertion-no-hype]]):** positive-assertion, no hype, **no exclamation marks** in all copy (the thanks page, the success/error messages — note Story 3.3's smoke caught an exclamation in the receipt; keep all new copy exclamation-free). Response-time `N` is `[OPEN]`.
- **Rule 2** trailing-slash (`/invite/thanks/`). **Rule 5** verify with the literal `pnpm test:all` (the first `.tsx` must be in the root prettier/eslint/typecheck globs — confirm). **NFR-5** no secret to the client.

### Previous-story intelligence (Stories 3.0–3.3)

- Story 3.3 built `/api/invite` (JSON, honeypot=`website`, persist-first, mail env-gated/skipped, CORS-closed) + the shared `InviteInput`. This story is its first consumer + extends it (content-negotiation). The 3.3 smoke CAUGHT an exclamation in the receipt copy — apply the same no-exclamation discipline to ALL new copy here.
- Story 3.2 set the pattern for a sanctioned client-script carve-out in `build-output.test.ts` (the `/speaking` copy script) — mirror it for the `/invite` island (but assert the React chunk specifically, and that non-island routes don't reference it).
- The canonical gate is the literal `pnpm test:all` ending with `lh` — run it whole; the FIRST `.tsx` must be prettier/eslint/typecheck-clean (run `prettier --write` before the gate; every prior story hit a first-run prettier miss).
- Determinism + no-fabrication; `[OPEN]` the response-time N + any attribution option wording Josh hasn't confirmed.

### Project Structure Notes

- New: `web/src/islands/InviteForm.tsx` (first island), `web/src/pages/invite/thanks.astro`, tests under `web/test/`/`web/e2e/`. Modified: `web/src/pages/invite.astro`, `api/src/routes/invite.ts` (content-negotiation), `web/test/build-output.test.ts`, `deferred-work.md`. Possibly `web/playwright.config.ts` (an `invite` project). The `.tsx` is the first React file — confirm tsconfig/eslint/prettier cover it.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4] — the AC source.
- [Source: architecture.md#L293-298 (Islands/State), #L382,#L402,#L437,#L446 (islands dir, error boundaries), #L591-593 (api JSON + CORS)] — React-island architecture (authoritative).
- [Source: …/EXPERIENCE.md#L151,#L166] — the Invite-Me form spec + the default/invalid/submitting/success/offline-fail state machine (authoritative).
- [Source: …/DESIGN.md#L317-327] — the `input` token (field styling + focus + label-always-present).
- [Source: shared/src/schemas.ts] — `InviteInput` (the single contract the island + endpoint share).
- [Source: api/src/routes/invite.ts] — the 3.3 endpoint to extend (content-negotiation; keep JSON path + tests).
- [Source: web/src/pages/invite.astro] — the stub to flesh.
- [Source: web/test/build-output.test.ts] — the NFR-1 per-route script assertions to extend for the island.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md] — `[1.2]` unreferenced React chunk + retro A4 (resolve here).
- [Source: .claude/rules/project-rules.md#2,#4,#5] — trailing-slash; env-gate (mail skipped in the e2e); canonical full-gate verification.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6 (2026-06-07)

### Debug Log References
- Fixed: `invite.astro` moved to `invite/index.astro` to avoid Astro routing conflict with the new `invite/thanks.astro` directory structure.
- Fixed: `<!--astro:end-->` Astro island comment was appearing after `<script>` strip in the "no exclamation marks" test — fixed by also stripping HTML comments in the test regex.
- Fixed: `pg` not in web devDeps — added as devDependency for e2e DB integration test.
- Fixed: Zod 4 `flatten()` deprecation — replaced with direct `error.issues` iteration (no `z.flattenError()` since zod not directly in web deps). React `FormEvent` deprecation — replaced with `React.SyntheticEvent`.
- Fixed: `SITEMAP_ROUTES` → added `UTILITY_ROUTES` section to `routes.ts` and `/invite/thanks` so sitemap === live pages (the "enumerates EXACTLY the live built page set" test would fail without it).

### Completion Notes List
- Task 1: Extended `api/src/routes/invite.ts` with content-negotiation. Detects `application/x-www-form-urlencoded` via `isFormEncoded()` helper; uses `c.req.parseBody()` for form data. Same pipeline (CORS, honeypot, rate-limit, Zod, persist, email); success → `303 Location: /invite/thanks/`; validation failure → HTML 400 + mailto fallback. JSON path (island fetch) unchanged; all 59 existing 3.3 api tests pass.
- Task 2: `web/src/pages/invite/thanks.astro` — MirrorLayout confirmation, 0 JS, answer-first lede naming "Joshua R. Brandt, MSE", response-time copy with `[OPEN: N]`, link back to `/`. Self-canonical to `/invite/thanks/` (Rule 2). No exclamation marks.
- Task 3: `web/src/islands/InviteForm.tsx` — first React island. Renders real `<form action="/api/invite" method="POST">` (SSR'd into dist). All 6 InviteInput fields + honeypot `website` with tabindex=-1/aria-hidden. Hydration: ZodError.issues-based client validation, focus-managed error summary (role=group), aria-invalid/aria-describedby, submitting disabled state, aria-live/role=status success, role=alert non-destructive failure with mailto+about fallback. Error boundary wraps inner component. DESIGN input tokens applied via scoped style block. No exclamation marks in any copy.
- Task 4: `web/src/pages/invite/index.astro` (moved from `invite.astro`) — wired `<InviteForm client:visible />`. SSR confirms `<form action="/api/invite" method="POST">` in `dist/invite/index.html`. 
- Task 5: `web/test/build-output.test.ts` — added Story 3.4 island carve-out describe block (16 tests: island referenced, SSR form present, labeled fields, required-in-text, attribution select, honeypot, no exclamations, non-island routes no React chunk, thanks page 0-JS, thanks page content). Updated MIRROR_ROUTES 0-JS and Umami tests to skip `/invite`. Updated sitemap test to include `/invite/thanks`. Updated `deferred-work.md` to mark [1.2]/A4 RESOLVED. Updated `routes.ts` to add `UTILITY_ROUTES` with `/invite/thanks` + fix sourceFile for `/invite`.
- Task 6: `web/e2e/invite.spec.ts` — 10 tests across 3 groups: (a) JS-off native POST → /invite/thanks/ + optional DB verify+cleanup (skips with warning if DATABASE_URL unset); (b) JS-on: invalid→error-summary+aria-invalid, valid→aria-live success, failure→role=alert+values+mailto, submitting state; (c) axe AA on /invite/ and /invite/thanks/. Added `invite` project to `playwright.config.ts`. Added `pg` + `@types/pg` devDependencies to `web/package.json` for DB access in e2e.
- Task 7: `pnpm test:all` green — typecheck (0 errors/warnings), lint (clean), format:check (clean), test (107+59+614=780 pass), test:e2e (198 pass, 1 skipped — DB skip expected), lh (Lighthouse passes). Deterministic check: two clean builds byte-identical (hash `9e9e0528...`). First `.tsx` is in root prettier/eslint/typecheck globs — verified.

### File List
- `api/src/routes/invite.ts` (modified — content-negotiation added)
- `web/src/islands/InviteForm.tsx` (created — first React island)
- `web/src/pages/invite/index.astro` (moved from `web/src/pages/invite.astro` + island wired)
- `web/src/pages/invite/thanks.astro` (created — 0-JS confirmation page)
- `web/src/lib/routes.ts` (modified — UTILITY_ROUTES added; /invite sourceFile updated)
- `web/test/build-output.test.ts` (modified — Story 3.4 island assertions + carve-out updates)
- `web/e2e/invite.spec.ts` (created — e2e tests: JS-off, JS-on, axe)
- `web/playwright.config.ts` (modified — `invite` project added)
- `web/package.json` (modified — `pg` + `@types/pg` devDependencies added)
- `_bmad-output/implementation-artifacts/deferred-work.md` (modified — [1.2]/A4 RESOLVED)

### Review Findings

**Code Review — 2026-06-07 (opus, adversarial: Blind / Edge-Case / Acceptance layers + full real-runtime verification). Verdict: APPROVE after auto-resolving 2 MED inline.**

**Headline verification — AC2 JS-off resilience GENUINELY RUNS (the directive's HIGH-risk concern):** confirmed the QA harness (`web/e2e/serve-with-api.mjs`) is sound and the JS-off native-POST test is NO LONGER silently skipping. Evidence: the full `pnpm test:all` e2e ran **200 passed, 0 skipped** (a skip would show as "1 skipped"); the WebServer log emitted `[invite] inquiry persisted (id=…, mailStatus=skipped)` proving the native form-encoded POST reached the **real Hono endpoint + real Postgres** (mail skipped, as required); the test reads the row back, asserts source='form'/status='new', then DELETEs it. Verified independently afterward that **no test rows leaked** (DB clean for every marker). The honeypot JS-off path also runs end-to-end (`[invite] honeypot triggered — benign 200 … no persist`). The harness preserves the `Host` header (so the same-origin guard sees Origin===Host) and does NOT follow redirects (the 303→/invite/thanks/ reaches the browser intact) — mirroring nginx AR-8 faithfully.

**Full canonical gate (AC7, Rule 5):** ran the LITERAL `pnpm test:all` end-to-end myself → **EXIT 0**. typecheck 0 hints · eslint clean · `prettier --check .` "All matched files use Prettier code style" (the first `.tsx` IS in the root globs — Rule 5 satisfied) · vitest 789 pass (scripts 107 + api 68 + web 614) · e2e 200 pass / 0 skip · Lighthouse autorun assertions pass. Build is byte-deterministic (two clean builds → identical HTML-tree hash; re-verified after my fixes).

**Backward-compat (content-negotiation is additive):** api went 59→68 tests (9 new content-neg). Mutation-checked: reverting `isFormEncoded` (forcing the JSON path) RED-s 7/9 content-neg tests — they genuinely lock the form-encoded shapes (303+Location, text/html 400, benign-303-no-insert, 403/429 plain-text), and the JSON-path backward-compat test stays green (unchanged). NOT vacuous.

**NFR-1 island carve-out (AC6; resolves [1.2]/A4):** verified on built output that ONLY `/invite/` references the React `client.*.js` chunk (`renderer-url="/_astro/client.*.js"` present) and EVERY non-island route (home, /about, /speaking, /glass-box, /timeline, /work/loandemo, /faq, /browse, /speaking/reel, /invite/thanks/) is clean — 0 React-chunk refs. The isolation test's exact regex was confirmed to discriminate (matches /invite/, rejects /about/, would catch a synthetic leak). [1.2]/A4 accurately marked resolved. (Note: the build-output suite's own `beforeAll` runs a real `astro build`, so dist-file mutation probes are wiped by the rebuild — I verified the assertion logic directly instead.)

**a11y (AC3/4/5):** axe AA = **0 violations on BOTH /invite/ AND /invite/thanks/** (live). Error summary genuinely RECEIVES focus (e2e asserts `document.activeElement.id === summaryId`, strengthened by QA) and links to fields; each invalid field wires aria-describedby → a real non-empty error element; aria-live/role=status success with the response-time copy; role=alert failure preserves values + offers retry + /about. The `role="presentation"` on the field-error span does not break axe or the describedby association (live axe + e2e both green).

**Security / voice:** `api/.env` is gitignored + untracked + absent from `git status`; only `DATABASE_URL` is lifted to the Playwright runner (secrets stay api-side); no secret reaches the web/client build (NFR-5). NO exclamation marks in any new copy (island success/error, thanks page, html400, receipt) — the 3.3 smoke lesson held.

---

**Findings & resolutions:**

- **[MED · RESOLVED inline] `noValidate` leaked into the SSR'd `<form>`, defeating JS-off native validation.** `web/src/islands/InviteForm.tsx` rendered `<form … noValidate>` statically, so the attribute was present in `dist/invite/index.html`. JS-off this DISABLES the browser's native `required`/`type=email` constraints — directly contradicting Decision 3's claim that "native `required`/`type=email` block most invalid submits client-side." A JS-off visitor could submit an empty/invalid form straight to the server (hitting the html400 path) instead of being blocked in-browser. **Fix:** gate it — `noValidate={hydrated}`, where `hydrated` flips true in a `useEffect` after mount. JS-off the SSR baseline keeps native validation ACTIVE; once the island hydrates it suppresses native UI and runs its own richer validation. Verified: rebuilt → `noValidate` ABSENT from SSR, `required`(8)+`type=email` present; all 11 invite e2e (incl. the JS-on error-summary test, which relies on the island's onSubmit interception — unaffected) still green; build still byte-deterministic.

- **[MED · RESOLVED inline] The html400 (JS-off validation-failure) `mailto:` fallback was a malformed address.** `api/src/routes/invite.ts` rendered `mailto:${encodeURIComponent('Joshua R. Brandt, MSE')}` → `mailto:Joshua%20R.%20Brandt%2C%20MSE` — a person's NAME, not an email address (clicking opens a compose window with a garbage recipient). Because the "inquiry is never silently lost" guarantee (AC2) is the entire point of this fallback, a broken fallback link is a real defect. **Fix:** changed to a recipient-less `mailto:?subject=…` (consistent with the island's role=alert mailto) and added an `/about/` fallback link (matching the island's belt-and-suspenders pattern). No real public owner address exists client-side (MAIL_TO is server-side per NFR-5) and fabricating one would violate no-fabrication — so a clean recipient-less mailto + the functional `/about/` path is the correct minimal fix. All 68 api tests (incl. the contentneg mailto + no-exclamation assertions) stay green.

- **[LOW · DEFERRED → 3.5] No public owner contact address ⇒ both `mailto:` fallbacks are recipient-less (`mailto:?subject=…`).** The island role=alert and the html400 both offer a mailto with no `To:`; the user must type the address. This is sub-optimal (not broken — `/about/` + retry are the functional safety nets). Root cause: there is no client-exposed owner email (NFR-5 keeps MAIL_TO server-side; no `PUBLIC_CONTACT_EMAIL`). Proper fix needs Josh to supply a public contact address surfaced via `PUBLIC_*` env, then both mailtos (and ideally an /about contact CTA) point at it. Deferred to Story 3.5 (the Close, which surfaces contact CTAs) — logged in deferred-work.md.

- **[LOW · DISMISSED/observation] JS-off vs JS-on optional-field persistence asymmetry.** The native form persists empty optional fields (`org`,`topic`) as `''`; the island fetch sends `undefined` (omitted). Both validate (the schema has no `.min` on org/topic) and persist acceptably — cosmetic DB-value difference, no functional impact. No action.

- **[LOW · DISMISSED/observation] Error-boundary fallback copy ("the form above still works") can be inconsistent on a hydration crash** if React replaces the SSR'd form with the fallback node. Hydration failures are rare and the native form genuinely works pre-hydration (the real resilience guarantee). Not worth a code change; noted for awareness.

**XSS check (dismissed):** the html400 interpolates only fixed schema field-names + library-generated Zod messages — confirmed empirically that Zod does NOT echo the user's invalid value into messages, so no user input reaches the HTML unescaped.

**Files I modified (auto-resolve):** `web/src/islands/InviteForm.tsx` (noValidate gating), `api/src/routes/invite.ts` (mailto fix). Re-verified green: typecheck, lint, prettier, api tests (68), web build-output (228), invite e2e (11), byte-determinism, DB clean.

### Change Log
- 2026-06-07: Story 3.4 — Invite-Me form (accessible, resilient). First React island shipped on /invite/. Content-negotiation on POST /api/invite (form-encoded → 303 /invite/thanks/; JSON → existing receipt). InviteForm TSX island with full accessibility (labels, required-in-text, aria-invalid/describedby, error summary focus, aria-live success, role=alert failure, focus-visible). NFR-1 carve-out asserted. Deferred [1.2]/A4 resolved. pnpm test:all green.
