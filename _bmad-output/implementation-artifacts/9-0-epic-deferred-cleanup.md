# Story 9.0: Epic deferred cleanup — speaker-surface bio accuracy + a11y, before the Story-9.3 EPK consumes the bios

---
baseline_commit: 3cf7faee2bc4189975e57b37d2d7e69755b89651
---

Status: done (code-review APPROVED 2026-06-10 — 0 HIGH/MED, auto-resolved 3 stale "50-word" comments; lead browser smoke PASS — 47-word label + copy aria-label updates/reverts)

<!-- Created by the /epic-cycle retro-review gate (→ Epic 9), 2026-06-10. Cleanup story; NOT in epics.md.
     Note: Epic 8 was SKIPPED (Suno content not ready — Josh), so the most-recent COMPLETED retro is Epic 7's
     (epic-7-retro-2026-06-10.md, action items A4/A5). This Story 9.0 triages Epic 7's carry-forwards +
     deferred-work.md against Epic 9 (Demonstrator & Speaker EPK).
       INCLUDED: the two still-open [3.2] speaker-surface LOWs — because Story 9.3 (Speaker one-sheet / EPK)
                 generates a PDF FROM the same signature-talk + bio data (web/src/data/speaking.ts) and the
                 same BioBlock surface. Getting the bio metadata accurate + the copy control's a11y right NOW
                 de-risks the EPK reflecting a wrong word-count or an inaccessible control (mirrors how 6.0/7.0
                 fixed the thing the upcoming epic was about to lean on).
       DEFERRED: everything else (the NFR-4/NFR-7 telemetry cluster; the launch/operator items —
                 PUBLIC_CONTACT_EMAIL, MAIL_* validation, SPF/DKIM + RESEND_API_KEY, PUBLIC_UMAMI_*; the latent
                 "next-touch" hardening; the remaining cosmetic LOWs; the home-grid GPU tuning; 7.4 video) —
                 none are Epic-9-coupled or launch-ready without Josh input. Triage table below.
       DROPPED: nothing new. -->

## Story

As the site owner (Josh),
I want the Speaker-surface bios to display an accurate word-count and the copy control to be fully accessible,
So that Story 9.3's downloadable Speaker EPK — generated from the SAME talks + bios — reflects correct, accessible content instead of inheriting a wrong "50 words" label or an action-only `aria-label`.

## Context & decision (read first)

This is the `/epic-cycle` retro-review cleanup story for Epic 9. Epic 8 was skipped (Suno assets not ready), so the carry-forward sources are the **Epic 7 retro** (A4: 7.4 deferred; A5: deferred LOWs) + **deferred-work.md**. The full triage is in the Appendix. **Two** items are **INCLUDED** (both `[3.2]` speaker-surface LOWs, because Story 9.3's EPK consumes the same bios); the rest **DEFER**.

### Included item A — short-bio word-count label is inaccurate (`[3.2 · LOW · cosmetic copy]`)

**Current state (verified at baseline):** `web/src/data/speaking.ts` `BIOS[0].wordCount = '50 words'`, but `BIOS[0].text` mirrors `PERSON.description` verbatim (AC5 of Story 3.2) which is **47 words**. The label is displayed (`web/src/components/speaker/BioBlock.astro:45` + `:64`), so visitors see "50 words" over a 47-word bio. The long bio's `'126 words'` is accurate.

**Decision:** **derive** `wordCount` from the actual bio text rather than hard-coding it, so the label can NEVER drift from the prose (the deferred-work suggested resolution). Compute it from `text.split(/\s+/).filter(Boolean).length` (a shared helper or a build-time derivation), and render `"<n> words"`. This makes the EPK (9.3) inherit a correct count automatically.

### Included item B — copy-button `aria-label` not updated on copied state (`[3.2 · LOW · a11y nicety]`)

**Current state (verified at baseline):** `web/src/components/speaker/BioBlock.astro:53` sets `aria-label={`Copy ${bio.label}`}` (e.g. "Copy Short bio") and never updates it; on copy the script swaps the visible text + `data-copied` and announces "Copied ✓" via the dedicated `role="status"`/`aria-live="polite"` region (which IS correct + axe-clean). The residual nit: a screen-reader user re-querying the BUTTON after copying still hears the action name "Copy Short bio", not the copied state.

**Decision:** update the button's `aria-label` in lockstep with the copied/revert transitions (e.g. `aria-label = "Copied ✓ — ${bio.label}"` on success, restored to `Copy ${bio.label}` on revert), so the control's accessible name matches its visible state. Keep the existing `role="status"` announcement (do NOT remove it). This stays within the ONE shared copy-script gate; no new `<script>`.

## Acceptance Criteria

**AC1 — the displayed bio word-count is accurate + derived (`[3.2]`).**
**Given** the Speaker surface (`/speaking/`) and the `BioBlock`
**When** a bio renders
**Then** its word-count label equals the ACTUAL word count of that bio's text (47 for the short bio, 126 for the long bio at baseline), derived from the text (not a hard-coded literal that can drift), and a test asserts the rendered count === the computed count of the rendered bio text (Rule 8, mutation-verified — break the derivation and the test reds).

**AC2 — the copy control's accessible name tracks its state (`[3.2]`).**
**Given** the copy `<button>`
**When** it is clicked (copied state) and after it reverts
**Then** its `aria-label` reflects the copied state on success and reverts with the visible state; the existing `role="status"`/`aria-live` "Copied ✓" announcement is unchanged; axe AA stays 0 violations on `/speaking/`. A real-runtime e2e asserts the button's accessible name in both states (Rule 3/13 — the user-observable accessible name, not just an attribute presence).

**AC3 — no regression; EPK-ready; canonical gate.**
**Given** the existing Speaker surface (Epic 3) + the canonical gate
**When** the story completes
**Then** the short bio still mirrors `PERSON.description` verbatim (Story 3.2 AC5 intact — the FIX is the label/derivation, NOT the bio prose), the `Event`/`Person` JSON-LD is unaffected, `pnpm test:all` and `pnpm run check-deterministic` both exit 0 (report captured exit codes — Rule 14), voice unchanged (no exclamation).

## Integration ACs

No new service/consumer. The fixes touch `web/src/data/speaking.ts` (data) + `web/src/components/speaker/BioBlock.astro` (the display surface); the first consumer of the now-accurate bio metadata beyond `/speaking/` will be Story 9.3's EPK. Rule 1 escape clause applies (no Integration AC required).

## Tasks / Subtasks

- [x] **Task 1 (AC1)** — derive `wordCount` from the bio text (a shared helper or build-time computation); render `"<n> words"`; remove the hard-coded `'50 words'`/`'126 words'` literals (or make them computed). Confirm `/speaking/` shows "47 words" for the short bio.
- [x] **Task 2 (AC2)** — update the `BioBlock` copy script to set the button `aria-label` to the copied state on success and revert it with the visible state; keep the `role="status"` announcement.
- [x] **Task 3 (AC1/AC2)** — tests: a scoped assertion that the rendered word-count === the computed count of the rendered bio text (mutation-verified); a real-runtime e2e on `/speaking/` asserting the copy button's accessible name in both copied/reverted states; axe AA stays 0.
- [x] **Task 4 (AC3)** — full canonical gate (`pnpm test:all; echo $?` + `pnpm run check-deterministic; echo $?`, both 0). Confirm the short bio prose === `PERSON.description` is unchanged.

### Review Findings (code-review, 2026-06-10)

**Verdict: APPROVE.** All 3 ACs re-derived fresh and verified against the real runtime. The change set is exactly the 5 files in the File List (data + display surface + 3 test files). All load-bearing claims independently confirmed; 2 mutation spot-checks reded as expected (non-vacuous). Canonical gate + determinism both green (exit codes below). One trivial comment-only accuracy patch auto-resolved inline (sibling stale "50-word" comments the dev missed in `person.ts` + `about.astro`). No HIGH/MED issues.

- [x] [Review][Patch] Stale "50-word" comments in the SAME bio's other source files — auto-resolved [web/src/lib/person.ts:8, web/src/lib/person.ts:50, web/src/pages/about.astro:9] — The dev correctly updated the data-file comment to "47 words", but three sibling comments describing the identical 47-word bio (the file the 9.3 EPK reads `PERSON` from, plus `/about`'s `BIO_SHORT`) still said "50-word". Comment-only fix; zero emitted-HTML change; `check-deterministic` stayed byte-identical after the edit. Resolved inline by code-review.
- [x] [Review][Dismiss] `bioWordCount` plural grammar — `"1 words"` for a 1-word input — Pure cosmetic, never rendered (both bios are 47/126 words); the dev explicitly documented the no-special-casing choice and a unit test pins it. Not a defect.
- [x] [Review][Dismiss] `bioWordCount('')` → `"0 words"` — Unreachable: both bios are non-empty; no crash path. Defense-in-depth only. Not a defect.
- [x] [Review][Dismiss] "1 e2e skip" forecast vs. observed skip variance — The 1 skip (when present) is the pre-existing **Story-5.1 cinematic WebGL guard** `cinematic.spec.ts:294` (`test.skip()` when the optional WebGL canvas isn't initialized that run) — NOT a 9.0 skip. Across two gate runs it varied 0↔1 skips purely on WebGL-availability timing; all 4 new Story 9.0 e2e tests **passed** in both runs. Confirmed, not flagged as a 9.0 gap.

**AC verification evidence:**
- **AC1 (Rule 8, mutation-verified):** `bioWordCount` exported from `speaking.ts`; the rendered `.bio-block__wordcount` span is the derived value (no literal). Served `dist/speaking/index.html` shows **"47 words"** + **"126 words"** (independently recomputed: short=47, long=126). Tests bind the REAL helper + the REAL served text at three tiers (unit `speaking.test.ts`, served-HTML `build-output.test.ts`, e2e `speaking.spec.ts`). Mutation A: helper → hard-coded `'50 words'` reded **7 unit tests** (`expected '50 words' to be '47 words'`). Mutation B: BioBlock span → hard-coded `50 words`, rebuilt, reded **3 served-HTML tests**. Non-vacuous.
- **AC2 (Rule 3/13, user-observable):** copy-button accessible name asserted via `getByRole('button', { name })` in BOTH copied (`Copied ✓ — <label>`) and reverted (`Copy <label>`) states, plus the `role="status"` "Copied ✓" announcement preserved. e2e tests 247/248 **ran in the default suite and passed** (not skipped). SSR initial `aria-label="Copy Short bio"` matches the revert target byte-for-byte. axe AA unchanged.
- **AC3 (no regression):** short bio prose still byte-equal to `PERSON.description` (Story 3.2 AC5 anti-drift test green, data + served-HTML layers). `Person`/`Event` JSON-LD unaffected (description unchanged). NFR-1 preserved — `/speaking/` still ships exactly the sanctioned executable scripts (Guide pill ×2 + 1 copy script; JSON-LD excluded); 9.0 added NO new `<script>`, only a `data-bio-label` attr + runtime aria-label mutations inside the existing copy script. No exclamation in visible prose ("Copied ✓" uses the ✓ glyph — pre-existing UI). No orphaned `bio.wordCount` consumers (typecheck 0 errors). Rule 1 N/A (the helper's first cross-surface consumer is Story 9.3 — accurate).

**Gate attestation (Rule 14 — captured exit codes, re-run AFTER the auto-resolve edits):**
- `pnpm run test:all` → **exit 0** (typecheck `Result (120 files): 0 errors`; lint clean; `format:check` "All matched files use Prettier code style!"; vitest web **896 passed**, api 233, scripts 184; playwright **428 passed / 1 skipped** = the pre-existing Story-5.1 WebGL guard; lighthouse autorun all assertions passed).
- `pnpm run check-deterministic` → **exit 0** (`PASS — web/dist is byte-identical across two clean builds`).

## Dev Notes

- **Do NOT change the bio PROSE** — the short bio MUST stay byte-equal to `PERSON.description` (Story 3.2 AC5). The fix is the label derivation + the aria-label, never the text.
- **Rule 8:** assert the rendered count against the REAL computed count of the REAL bio text (no inline copy of "47"); mutation-verify (break the derivation → red).
- **Rule 13:** the AC2 e2e asserts the user-observable accessible NAME of the button changes (via the accessibility tree / `getByRole('button', { name })`), not merely that a `data-copied` attribute is set.
- **Rule 14:** capture + report the literal exit codes; read `astro check`'s `Failed`/exit code.
- Keep the copy control within the existing single copy `<script>` (no new executable JS; NFR-1 on `/speaking/` unchanged — it already ships the one copy script).

## Dev Agent Record

### Context Reference
- Created by the lead `/epic-cycle` retro-review gate (→ Epic 9), 2026-06-10. Epic 8 skipped; triaged Epic 7 carry-forwards + deferred-work.

### File List
- web/src/data/speaking.ts
- web/src/components/speaker/BioBlock.astro
- web/test/speaking.test.ts
- web/test/build-output.test.ts
- web/e2e/speaking.spec.ts

### Decisions
- Exported `bioWordCount(text: string): string` helper from `speaking.ts`; removed `wordCount` field from `Bio` interface and both BIOS entries entirely (not stored, computed at build time in BioBlock.astro).
- Used `data-bio-label` attribute on the copy button to carry the bio label into JS scope without duplicating it at runtime; the aria-label is set/restored by the existing single copy `<script>` (no new JS).
- Unit tests for `bioWordCount` in `speaking.test.ts`; served-HTML word-count span assertions in `build-output.test.ts`; accessible-name e2e tests in `speaking.spec.ts` using `getByRole('button', { name })` per Rule 13.
- Canonical gate: `pnpm test:all` exit 0; `pnpm run check-deterministic` exit 0 (builds byte-identical). All 896 unit tests pass; 35 speaking e2e tests pass (4 new Story 9.0 tests pass). Short bio prose unchanged (byte-equal to PERSON.description, AC5 guard green).

### Completion Notes
- AC1 satisfied: `/speaking/` now shows "47 words" for the short bio (derived from real text), not "50 words". The `bioWordCount` helper exported from `speaking.ts` is the single source — BioBlock.astro computes at build time. Long bio shows "126 words" (correct at baseline).
- AC2 satisfied: copy button accessible name updates to `"Copied ✓ — Short bio"` on success and reverts to `"Copy Short bio"` after 2200ms. The `role="status"`/`aria-live` announcement is preserved unchanged. axe AA 0 violations confirmed by existing e2e test (test 22, speaking.spec.ts:132).
- AC3 (no regression): short bio prose === PERSON.description (existing anti-drift test at build-output.test.ts:1214 green); BIOS[0].text unchanged. `pnpm test:all` exit 0; `pnpm run check-deterministic` exit 0.

---

## Appendix — retro-review triage (→ Epic 9; 2026-06-10)

Sources: **Epic 7 retro** (`epic-7-retro-2026-06-10.md`, A4/A5) + **deferred-work.md** (Epic 8 was skipped — no Epic-8 retro). Decision key: INCLUDE = built in this Story 9.0; DEFER = stays tracked for a future gate; DROP = resolved/moot.

| Item | Source | Triage |
| --- | --- | --- |
| `[3.2 · LOW]` short-bio word-count "50 words" vs 47 actual | deferred-work.md (3.2 CR) | **INCLUDE** — Story 9.3 EPK consumes the bios; derive the count now |
| `[3.2 · LOW]` copy-button `aria-label` not updated on copied state | deferred-work.md (3.2 CR) | **INCLUDE** — same surface the EPK reflects; cheap a11y fix |
| `[deploy/4.3/5.2/5.3 · NFR-4/NFR-7]` Guide telemetry cluster (threshold calibration, injection-log completeness, skim adherence, classifier-injection-log, double-LLM latency) | deferred-work.md | **DEFER** — needs production telemetry; not actionable without live traffic data |
| `[3.4]` recipient-less `mailto:` (no `PUBLIC_CONTACT_EMAIL`) | deferred-work.md | **DEFER → launch** — needs Josh's public contact address (the EPK may want it too — revisit at launch) |
| `[3.3]` `MAIL_*` `z.email()` tightening; `updated_at` bump | deferred-work.md | **DEFER → launch / admin workflow** |
| `[2.3]` content-collections relocation; `[4.0]` stripFrontmatter ×2; `[3.5]` source-prop | deferred-work.md | **DEFER** — latent "next-touch" hardening |
| `[1.3]` apostrophe house-style; `[1.4]` halo token; `[3.3]` rate-limiter label; `[5.1]` poster lazy; `[5.3]` inert `transition:order`; `[5.4]` deepen×skim; `[1.10]` deploy.sh precheck; resetRecuration dead-code | deferred-work.md | **DEFER** — cosmetic / owner-discretion / dead-code; not Epic-9-coupled |
| `[home-grid]` blueprint-grid composition tuning | deferred-work.md | **DEFER → Josh's GPU** — needs real hardware |
| Epic 7 A4 — **Story 7.4 (Video-Synced Repo)** | epic-7-retro | **DEFER** — no talk video yet; re-open when a video exists |
| Epic 7 A3/A5 — launch/operator cluster | epic-7-retro | **DEFER → launch** |
