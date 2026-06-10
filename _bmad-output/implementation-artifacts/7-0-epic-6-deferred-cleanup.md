# Story 7.0: Epic 6 Deferred Cleanup — confirm the live-Guide latency fix (model switch already landed) and reconcile the NFR-4 abort-ceiling spec↔code drift

---
baseline_commit: f61ec35b92fd4ed78e4ab353a32e1fc08c6dfcaa
---

Status: done (code-review APPROVED 2026-06-09 — 1 MED auto-resolved [arch.md:448/714 missed ceiling refs], 0 HIGH; lead live-Guide smoke PASS — TTFT 1402ms / total 2841ms / no FALLBACK_DEGRADED, see smoke-evidence/story-7.0-smoke.md)

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Created by the /epic-cycle retro-review gate (Epic 6 → Epic 7), 2026-06-09. Cleanup story; NOT in epics.md.
     Absorbs the ONE open item with general value that is ready now and not naturally owned by any 7.1–7.4 feature story:
       INCLUDED: [deploy · MED · NFR-4] the live /api/guide conversational answer hitting the abort ceiling.
                 The MODEL-SWITCH arm of the deferred fix ALREADY landed (commit 223eef6: GUIDE_LLM_MODEL default
                 gpt-5-mini → claude-haiku-4-5-20251001, ~2-3s streaming; live api/.env set to it; portfolio-api
                 active). What remains and is NOT yet locked: (a) a FRESH lead smoke proving the live Guide ANSWERS
                 (the env.ts comment is a claim, not a test); (b) the NFR-4 spec↔code drift — architecture.md +
                 epics.md say "hard ceiling ~10s" while the code is LLM_CEILING_MS = 15_000 (Rule 5 NFR-tripwire →
                 amend the planning artifact in place); (c) a regression test pinning the ceiling value + the
                 fast-streaming default model so a silent revert to a slow default (re-tripping the fallback) is
                 caught by the gate.
     DEFERRED (stay tracked in deferred-work.md): the whole NFR-4/NFR-7 telemetry-tuning cluster ([4.3] threshold
                 calibration + injection-log completeness; [5.2] skim instruction adherence; [5.3] classifier
                 injection-log + double-LLM latency); the launch/operator items (PUBLIC_CONTACT_EMAIL mailto,
                 MAIL_* z.email() tightening, SPF/DKIM + RESEND_API_KEY for live invite email, PUBLIC_UMAMI_*);
                 the latent "next-touch" hardening ([2.3] content-collections relocation, [4.0] stripFrontmatter
                 ×2, [3.5] source-prop); the cosmetic/owner-discretion polish ([1.3] apostrophe house-style,
                 [1.4] halo token, [3.2] aria-label + word-count, [3.3] sliding-window/rate-limiter labels,
                 [3.3] updated_at, [5.1] poster loading=lazy, [5.3] inert transition:order placeholder, [5.4]
                 deepen×skim cosmetic edge); the resetRecuration dead-code (→ the Epic-7 re-curation story 7.1,
                 which composes with the Epic-5 engine and is the natural owner); [1.10] deploy.sh precheck;
                 the [home-grid] blueprint-grid composition (Josh's own choice to revisit AFTER Epic 7 on his
                 real GPU — the SwiftShader harness can't render the WebGL faithfully). Full triage table below.
     DROPPED: the MODEL-SWITCH itself (already ✅ landed in 223eef6, live-verified per env.ts) and the [3.5]
                 sprint-status tracking drift (moot — Epic 3 long done + reconciled by the lead pipeline). -->

## Story

As the site owner (Josh),
I want the live Guide's conversational-answer latency fix proven fresh on the real runtime and the NFR-4 abort-ceiling reconciled so the spec and the code agree, plus a regression test that pins the validated configuration,
so that the flagship Guide reliably returns a real grounded answer (not the `FALLBACK_DEGRADED` "I'm unable to answer right now…" message that the Epic-5 deploy smoke caught), and a future silent revert to a slow default model — or an unmeasured ceiling change — is caught by the gate instead of degrading the live experience.

## Context & decision (read first)

This is the `/epic-cycle` Epic-6 → Epic-7 retro-review cleanup story. The full triage of every still-open `deferred-work.md` item + Epic-6 retro action item is in the **Appendix** at the end of this file. **One** item is **INCLUDED** here; the rest **DEFER** to their natural Epic-7 feature stories, to launch, to NFR-4/NFR-7 telemetry, or to owner decisions, or are **DROPPED** as already-resolved.

The included item comes from the Epic-6 retro **action item A3** (carry-forward of the NFR-4 latency cluster) and the deferred-work entry **`[deploy · MED · NFR-4]`** (surfaced at the Epic-5 deploy smoke, 2026-06-08). It is the ONLY non-LOW open item, and it is user-observable on the **live production site** — the conversational Guide answer degraded to the canned fallback.

**Why most of the deferred fix is already DONE (and what is NOT):** the deferred item's suggested resolution was *"raise the abort ceiling above the model's streaming latency AND/OR switch `GUIDE_LLM_MODEL` to a faster-streaming model, then re-measure TTFT vs NFR-4."* The **model-switch arm already landed** — commit `223eef6` set the default `GUIDE_LLM_MODEL` from `gpt-5-mini` (reasoning-class, ~16.5s streaming tail that intermittently exceeded the ceiling) to **`claude-haiku-4-5-20251001`** (~2-3s end-to-end for a grounded answer, well under the ceiling); the live VM's `api/.env` is set to it and the `portfolio-api` systemd unit is active. So the **user-observable degradation is expected to be resolved**, but three things are NOT yet locked, and that is exactly the cleanup-story work:

1. **No FRESH lead smoke has confirmed the live Guide ANSWERS** post-Epic-6-deploy with the current model. The `api/src/env.ts` doc-comment *claims* "verified live on /api/guide (grounded + cited …)", but a claim in a comment is not a re-runnable proof. The lead per-story smoke will hit the **live** `/api/guide` and assert a real grounded answer streams (not `FALLBACK_DEGRADED`), with TTFT and total stream time recorded against NFR-4.
2. **An NFR-4 spec↔code drift is open (Rule 5 NFR-tripwire).** The architecture + epics planning artifacts state the Guide's *"hard ceiling ~10s"* (4 references), but the implemented `LLM_CEILING_MS` is **15_000** (raised 10s→15s in Epic 4 to absorb the now-removed gpt-5-mini tail). Per project Rule 5, an NFR that the implementation no longer matches must be reconciled **in the planning artifact in place**, not left as silent code/spec divergence. Decision: **keep the 15s ceiling** (a safe upper bound that absorbs per-deployment `GUIDE_LLM_MODEL` variance — the value is intentional and validated) and **amend the four NFR-4 references** to state ~15s with the documented model-tail rationale.
3. **No regression test pins the validated config.** Nothing asserts `LLM_CEILING_MS === 15_000` or that the default `GUIDE_LLM_MODEL` is the fast-streaming Haiku model. A future `chore` that re-defaults to a slow model (re-tripping the fallback) or an unmeasured ceiling drop would ship green. A small Rule-8 test against the **real** exported constants locks the resolution.

### Included item — confirm + reconcile the Guide latency / NFR-4 ceiling (`[deploy · MED · NFR-4]` / Epic-6 retro A3)

**Current state (grounded, verified at `baseline_commit` f61ec35):**

- **Model default already fast.** `api/src/env.ts:49` → `GUIDE_LLM_MODEL: z.string().default('claude-haiku-4-5-20251001')`, with a doc-comment (lines 38–48) documenting the gpt-5-mini→haiku switch and the ~2-3s latency. Live `api/.env` sets `GUIDE_LLM_MODEL=claude-haiku-4-5-20251001`. The `223eef6` commit (`chore(guide): default GUIDE_LLM_MODEL to claude-haiku-4-5 (was gpt-5-mini)`) is in `feature` history (ancestor of HEAD).
- **Ceiling is 15s in code.** `api/src/routes/guide.ts:61` → `const LLM_CEILING_MS = 15_000;` with a doc-comment (lines 56–60) explaining the 10s→15s raise for the gpt-5-mini tail. The route uses `new AbortController()` + `setTimeout(() => controller.abort(), LLM_CEILING_MS)` (guide.ts:294-295); on abort the route emits `FALLBACK_DEGRADED` (`api/src/routes/guide.ts`). A separate per-fetch `AbortSignal.timeout(3000)` guards only the IMDSv2 key fetch in `llm-client.ts:35,42` (NOT the answer stream — do not touch).
- **NFR-4 spec says ~10s in 4 places:** `epics.md:99`, `epics.md:795`, `architecture.md:77`, `architecture.md:281` (all "hard ceiling ~10s"). This is the drift to reconcile.
- **Existing ceiling test covers the BRANCH, not the VALUE.** `api/src/routes/guide.test.ts:467` (`'slow stream exceeding the ~15s ceiling → abort → in-voice fallback (AC5 ceiling)'`) deterministically fake-times the abort and asserts `FALLBACK_DEGRADED` is emitted — it proves the ceiling BRANCH works, but asserts nothing about the literal `15_000` value or the default model id. No test references `LLM_CEILING_MS` as a value or asserts the `GUIDE_LLM_MODEL` default.
- **NFR-5 (no secret/key in the web bundle) must stay intact** — this story touches only `api/` + planning docs + (optionally) a test; the `web/dist` build is unaffected.

**Decision:**

1. **Do NOT re-implement the model switch** — it already landed (DROPPED). Do not change `GUIDE_LLM_MODEL`'s default away from `claude-haiku-4-5-20251001`.
2. **Keep `LLM_CEILING_MS = 15_000`** (intentional safe upper bound; absorbs per-deployment model variance). Update its doc-comment to note the gpt-5-mini default is gone and 15s is now a margin over the fast Haiku default rather than a necessity.
3. **Reconcile NFR-4 (Rule 5).** Amend all four planning-artifact references from "hard ceiling ~10s" → "hard ceiling ~15s" with a brief parenthetical rationale (absorbs reasoning-class tail latency / per-deployment `GUIDE_LLM_MODEL` variance; TTFT target < ~1.5s and the graceful in-voice fallback are unchanged). Keep TTFT "< ~1.5s" and retrieval "< ~200ms" as-is.
4. **Lock with a Rule-8 test** importing the REAL exported constants (not inline copies): assert `LLM_CEILING_MS === 15_000` (the value the spec now matches) and that the env schema's default `GUIDE_LLM_MODEL` is `claude-haiku-4-5-20251001` (the fast-streaming model). Mutation-verify: changing the real constant/default reds the test. Place the test where its package has a runner (the `api` package — `shared` has none, Rule 8); discoverable by the default `pnpm -r test`.
5. **Lead live smoke (gate):** the lead hits the **live** `https://joshuabrandt.abacusai.cloud/api/guide` with a grounded query and asserts a real answer streams (citations + non-fallback prose), recording TTFT + total stream time against the (amended) NFR-4. This proves `[deploy · MED]` is resolved on the real runtime.

**Verified facts (researched/grounded 2026-06-09 — do not guess):**

- The current Anthropic model family is Claude 4.x; `claude-haiku-4-5-20251001` is the pinned fast Haiku 4.5 id and is the validated default (env.ts comment + live `api/.env`). Do not "modernize" or shorten the id.
- This is a process/config + doc-reconciliation + test-lock story. There is no new runtime service or consumer surface (Rule 1: no Integration AC required — see `## Integration ACs`). The only runtime code change is a doc-comment refresh on an existing constant; behavior is unchanged.

## Acceptance Criteria

**AC1 — NFR-4 spec reconciled to the implemented ceiling (Rule 5).**
**Given** the four planning-artifact references to the Guide's abort ceiling (`epics.md:99`, `epics.md:795`, `architecture.md:77`, `architecture.md:281`)
**When** the story completes
**Then** each reads "hard ceiling ~15s" (not "~10s"), with a brief rationale (absorbs reasoning-class tail / per-deployment `GUIDE_LLM_MODEL` variance), and the value agrees with `api/src/routes/guide.ts`'s `LLM_CEILING_MS = 15_000`; TTFT (< ~1.5s) and retrieval (< ~200ms) text is unchanged.

**AC2 — the validated config is locked by a real-module regression test (Rule 8).**
**Given** the `api` package test suite
**When** `pnpm -r test` (and thus `pnpm test:all`) runs
**Then** a discoverable test imports the REAL exported `LLM_CEILING_MS` from `api/src/routes/guide.ts` and the REAL parsed env default and asserts `LLM_CEILING_MS === 15_000` AND the default `GUIDE_LLM_MODEL === 'claude-haiku-4-5-20251001'`; the assertions are mutation-verified (changing either real source value reds the test) and the test is NOT skipped.

**AC3 — no behavior/contract regression; model default unchanged; NFR-5 intact.**
**Given** the existing `/api/guide` contract + the green canonical gate
**When** the story completes
**Then** the `GUIDE_LLM_MODEL` default remains `claude-haiku-4-5-20251001` (model-switch NOT reverted), the existing `guide.test.ts` ceiling-branch test (`:467`) still passes, no `web/dist` byte changes from this story (`check-deterministic` PASS; NFR-5 — no key/model in the bundle), and the literal `pnpm test:all` + `pnpm run check-deterministic` both exit 0 (report the captured exit codes per Rule 14).

## Integration ACs

No consumers in this story; it adds no runtime service, module, or exported surface (it refreshes one existing constant's doc-comment, reconciles spec prose, and adds a regression test). Rule 1 escape clause applies — no Integration AC required.

## Tasks / Subtasks

- [x] **Task 1 (AC1) — reconcile NFR-4 in the planning artifacts.** Edit the four "hard ceiling ~10s" references (`_bmad-output/planning-artifacts/epics.md:99` and `:795`; `_bmad-output/planning-artifacts/architecture.md:77` and `:281`) to "~15s" with the brief rationale. Do not alter TTFT/retrieval figures.
- [x] **Task 2 (AC1) — refresh the `LLM_CEILING_MS` doc-comment** in `api/src/routes/guide.ts` (lines 56–60) to state the gpt-5-mini default is removed and 15s is now a safety margin over the fast Haiku default + per-deployment variance (value stays `15_000`).
- [x] **Task 3 (AC2) — add the regression test.** In the `api` package (e.g. `api/src/routes/guide.config.test.ts` or fold into an existing `api/src/**/*.test.ts`), import the REAL `LLM_CEILING_MS` (export it from `guide.ts` if not already exported — a named `export const`, no behavior change) and the REAL env default; assert the two values. Confirm discoverable by `pnpm -r test` (Rule 8) and mutation-verify (flip each real value → red → revert).
- [x] **Task 4 (AC3) — full canonical gate.** Run `pnpm test:all; echo $?` (must be 0) and `pnpm run check-deterministic; echo $?` (must be 0). Confirm `guide.test.ts:467` still green and the `GUIDE_LLM_MODEL` default is unchanged. Report both exit codes verbatim (Rule 14).

## Dev Notes

- **Rule 5 (NFR tripwire):** the NFR-4 "~10s" text is the planning artifact to amend in place — do NOT instead lower `LLM_CEILING_MS` to 10s to "match the spec" (that would re-narrow the safety margin the Epic-4 raise deliberately added, and the spec is the stale side here). Amend the doc; keep the validated code value.
- **Rule 8 (real-module + scoped assertion):** assert against the REAL exported constant and the REAL parsed env default — never an inline copy of `15000` or the model string. If `LLM_CEILING_MS` is currently module-private in `guide.ts`, promote it to a named `export const` (no behavior change) so the test binds the real value. Mutation-verify both assertions red on a real-source change.
- **Rule 14 (exit-code attestation):** capture and report the literal exit codes of `pnpm test:all` and `pnpm run check-deterministic`; do not claim "green" in prose without the codes. Read `astro check`'s `Failed`/exit code, not the eye.
- **Do NOT touch** the `AbortSignal.timeout(3000)` calls in `llm-client.ts:35,42` — those guard the IMDSv2 key fetch, not the answer stream; they are unrelated to the ceiling.
- **No web build impact** — this story does not edit any `web/` source; `check-deterministic` must stay byte-identical (the model/ceiling live server-side only — NFR-5). If `web/dist` changes, something is wrong.
- **Model id is exact** — `claude-haiku-4-5-20251001`. Do not shorten to `claude-haiku-4-5` or change it; the env default and live `api/.env` both pin the dated id.

## Dev Agent Record

### Context Reference
- Created by the lead `/epic-cycle` retro-review gate (Epic 6 → Epic 7), 2026-06-09.

### File List
- `_bmad-output/planning-artifacts/epics.md` — modified (lines 99, 795: "hard ceiling ~10s" → "~15s" with rationale)
- `_bmad-output/planning-artifacts/architecture.md` — modified (lines 77, 281: "hard ceiling ~10s" → "~15s" with rationale)
- `api/src/routes/guide.ts` — modified (`const LLM_CEILING_MS` → `export const LLM_CEILING_MS`; doc-comment updated to reflect gpt-5-mini removal and 15s as safety margin over fast Haiku default)
- `api/src/routes/guide.config.test.ts` — created (Rule 8 regression test: asserts REAL `LLM_CEILING_MS === 15_000` and REAL `GUIDE_LLM_MODEL` default; mutation-verified both reds)

### Decisions
- Promoted `LLM_CEILING_MS` to `export const` (no behavior change) to enable direct import by the Rule-8 test, per story task and AC2 guidance.
- Used child-process (tsx) approach for GUIDE_LLM_MODEL default assertion, mirroring the established `env.realmodule.test.ts` pattern, to handle the env.ts module-load `process.exit(1)` guard.
- Mutation-verified both assertions red: `LLM_CEILING_MS = 10_000` reds test 1; `GUIDE_LLM_MODEL` default = `'gpt-5-mini'` reds test 2.
- `pnpm test:all` exit code: 0. `pnpm run check-deterministic` exit code: 0. `web/dist` byte-identical (NFR-5 intact). `guide.test.ts:467` ceiling-branch test still passes.

---

**Completion Notes (2026-06-09):**
- AC1 satisfied: all four "hard ceiling ~10s" references in `epics.md` (lines 99, 795) and `architecture.md` (lines 77, 281) amended to "~15s" with rationale absorbing reasoning-class tail latency and per-deployment `GUIDE_LLM_MODEL` variance. TTFT (<~1.5s) and retrieval (<~200ms) text unchanged.
- AC2 satisfied: `guide.config.test.ts` imports REAL `LLM_CEILING_MS` and uses child-process to read REAL env schema default. Both assertions mutation-verified red.
- AC3 satisfied: `GUIDE_LLM_MODEL` default unchanged (`claude-haiku-4-5-20251001`); `guide.test.ts:467` still green; `pnpm test:all` exit 0; `check-deterministic` exit 0; no `web/dist` changes (NFR-5).

---

## Review Findings (code-review stage, 2026-06-09)

Adversarial code review verified the FINAL combined dev+QA state FRESH against the real artifacts (Rule 10 — prior stages not assumed complete; each AC re-derived). Three review lenses applied (Blind correctness / Edge-Case branch+boundary / Acceptance per-AC). Reviewer independently mutation-verified AC2 and re-ran the full canonical gate.

**Outcome: 1 MED (auto-resolved inline) + 0 HIGH; 1 pre-existing flaky e2e tracked in `deferred-work.md`. Story APPROVED.**

### MED · ✅ RESOLVED — AC1 (Rule 5) reconciliation was incomplete in the live `architecture.md`
- **Finding:** AC1 enumerated four "~10s" → "~15s" references and the dev edited exactly those four — but `architecture.md` (the LIVE, non-frozen artifact) carried **two more** references to the SAME Guide abort-ceiling/fallback still reading "~10s": line 448 ("The Guide on timeout (~10s)/endpoint-down → in-voice fallback …") and line 714 (the NFR-4 summary "… + ~10s fallback (targets pending load test)"). This left `architecture.md` internally contradictory (some lines ~15s, some ~10s) on the exact value Story 7.0 exists to reconcile — re-creating the Rule-5 spec↔code drift inside one document.
- **Fix (inline by reviewer):** amended `architecture.md:448` and `:714` to "~15s", consistent with the four AC1 references and `LLM_CEILING_MS = 15_000`. Verified zero "~10s" ceiling refs remain in the live artifacts; the two dated FROZEN snapshots (`prd-portfolio-2026-06-02/prd.md`, `implementation-readiness-report-2026-06-05.md`) were correctly left untouched (rewriting a dated historical record would falsify it — the QA's exclusion judgment was correct, and is extended here only to the additional *live*-artifact hits). Prose-only planning-doc edit — not a `web/` build input/fixture/test source — so the green gate and `check-deterministic` are unaffected.

### AC2 (Rule 8) — independently mutation-verified by the reviewer
- `LLM_CEILING_MS` 15_000 → 10_000 in `guide.ts` ⇒ test 1 RED; reverted byte-clean (diff = dev's intended change only).
- `GUIDE_LLM_MODEL` default haiku → `gpt-5-mini` in `env.ts` ⇒ test 2 RED with `Received: 'gpt-5-mini'` — proving the child-process reads the REAL **schema default**, NOT the `api/.env` value (which is deleted before spawn); reverted byte-clean (env.ts diff EMPTY).
- Discoverability confirmed: `api/vitest.config.ts` `include: ['src/**/*.test.ts']` picks up `src/routes/guide.config.test.ts`; ran in the suite (api 221/221, 0 skipped); not `.skip`-tagged. Binds the REAL exported const + REAL parsed env — no inline `15000`/model-string copy.

### AC3 / NFR-5 — confirmed
- `GUIDE_LLM_MODEL` default unchanged (`claude-haiku-4-5-20251001`); `guide.test.ts:467` ceiling-branch test green; `check-deterministic` PASS (web/dist byte-identical, tree hash `1a39ff34…`); no key/model in the web bundle.

### LOW · flaky e2e — tracked (not blocking)
- `web/e2e/guide-panel.spec.ts:402` flaked on QA's run-1 (focus-timing race under parallel load), passed isolated + on QA's re-run + on the reviewer's independent full gate (test #269, 0 flaky). Pre-existing (zero `web/` changes in Story 7.0; `web/dist` byte-identical) — NOT a regression. Logged to `deferred-work.md` `[7.0 · LOW · flaky-test · TRACKED]` so it is not silently normalized (Rule 14).

### Rule-14 exit-code attestation (reviewer's fresh re-run, post-fix)
- `pnpm test:all` → **exit 0** (typecheck `astro check` Result: **0 errors**, 0 warnings, 75 hints; lint clean; prettier "All matched files use Prettier code style!"; vitest scripts 184 / api 221 / web 754; Playwright **341 passed, 0 failed, 0 skipped, 0 flaky**; lh "All results processed").
- `pnpm run check-deterministic` → **exit 0** ("PASS — web/dist is byte-identical across two clean builds", tree hash `1a39ff34…`).
- The MED fix touched only `architecture.md` prose (not a build input), so the captured gate result remains valid after the fix.

### Rule applicability notes
- Rule 1 (Integration AC): escape clause verified accurate — story adds an `export const` + a test + doc prose; no new runtime service/consumer surface.
- Rule 3 (real-runtime test): N/A — no new user-facing browser surface; the regression test is the correct CLI/library real-runtime tier (real exported const + real parsed env via child process). No spurious "no browser test" HIGH filed.
- Rule 5 (NFR tripwire): the deliverable IS the in-artifact amendment (done, and completed here) — not a code-comment/`deferred-work.md` workaround.
- Rule 6 (ADR): N/A — no `docs/adr/` in this project.

---

## Appendix — Epic-6 retro-review triage (covers Epic 6; 2026-06-09)

Triage of every still-open `deferred-work.md` item and Epic-6 retrospective action item at the Epic-6 → Epic-7 retro-review gate. **Decision key:** INCLUDE = built in this Story 7.0; DEFER = stays tracked in `deferred-work.md` for its named future owner; DROP = already resolved or moot.

| Item | Source | Triage Decision |
| --- | --- | --- |
| `[deploy · MED · NFR-4]` live Guide answer hits the abort ceiling → `FALLBACK_DEGRADED` | deferred-work.md (Epic-5 deploy smoke) + Epic-6 retro A3 | **INCLUDE** (this story) — model-switch arm already landed (`223eef6`, DROP); here we add the fresh live smoke + NFR-4 spec reconciliation + regression test lock |
| Model-switch `GUIDE_LLM_MODEL` gpt-5-mini → claude-haiku-4-5 | deferred-work.md `[deploy]` suggested resolution | **DROP** — already landed in `223eef6`, live `api/.env` set, live-verified per `env.ts` comment |
| `[4.3 · LOW]` `RETRIEVAL_THRESHOLD` 0.5 lets off-topic NL reach the model | deferred-work.md (4.3 smoke) | **DEFER** — NFR-7 production-telemetry calibration; not actionable without live traffic data |
| `[4.3 · LOW]` injection-detection logging completeness | deferred-work.md (4.3 CR) | **DEFER** — observability-only (resistance is structural + verified); NFR-7 telemetry pass |
| `[5.2 · LOW]` `skim` depth instruction only approximately honored | deferred-work.md (5.2 smoke) | **DEFER** — soft-instruction LLM limitation; NFR-7 tuning pass |
| `[5.3 · LOW]` classifier path detects injection but never logs it | deferred-work.md (5.3 CR) | **DEFER** — observability-only (route-level Step-4 log already counts it); NFR-7 pass |
| `[5.3 · LOW]` / `[5.3 · LOW NFR-4]` re-curation adds a 2nd LLM round-trip (latency) | deferred-work.md (5.3 smoke) | **DEFER** — NFR-4 telemetry-driven; fold-into-single-call is a later optimization with production data |
| `[5.3 · LOW]` + `[5.4 · LOW]` `resetRecuration` dead-code (no consumer/test) | deferred-work.md (5.3/5.4 CR) | **DEFER → Story 7.1** — Epic 7 composes with the Epic-5 re-curation engine (Wings blend); the 7.1 dev either consumes it (Guide-close, with a binding e2e) or deletes it |
| `[3.3 · LOW]` `MAIL_FROM`/`MAIL_TO` validated as `z.string()` not `z.email()` | deferred-work.md (3.3 CR) | **DEFER → launch** — tighten at the SPF/DKIM live-email enablement step; trusted operator config, fails safe |
| `[3.4 · LOW]` recipient-less `mailto:` fallbacks (no `PUBLIC_CONTACT_EMAIL`) | deferred-work.md (3.4 CR + 3.5 carry-forward) | **DEFER → launch** — needs Josh's confirmed public contact address; expose via build-time `PUBLIC_CONTACT_EMAIL` (Rule 4) |
| `[3.3 · LOW]` `updated_at` not bumped when `mail_status` is written | deferred-work.md (3.3 CR) | **DEFER** — owned by the future `new→replied` admin workflow; no consumer reads it yet |
| `[2.3 · LOW]` curation manifest in `web/src/content/` content-collections footgun | deferred-work.md (2.3 CR) | **DEFER** — latent; only matters if/when Astro content-collections are adopted |
| `[4.0 · LOW]` `stripFrontmatter` degenerate 2-line over-strip | deferred-work.md (4.0 CR) | **DEFER** — latent; tighten when a KB source first needs it (Story-4.1 lineage) |
| `[4.0 · LOW]` `stripFrontmatter` indented-key no-strip | deferred-work.md (4.0 CR) | **DEFER** — latent; fails safe; only matters for a non-column-0 frontmatter source |
| `[3.5 · LOW]` `invite-submitted` `source` from pathname heuristic | deferred-work.md (3.5 CR) | **DEFER** — latent; thread an explicit `source` prop when a 3rd embed appears |
| `[1.3 · LOW]` curly vs straight apostrophe house-style | deferred-work.md (1.3 CR) | **DEFER** — owner house-style decision; cosmetic |
| `[1.4 · LOW]` current-tick halo literal vs token-derived | deferred-work.md (1.4 CR) | **DEFER** — design-tokens owner; needs an accent alpha/channel token |
| `[3.2 · LOW]` Copy button `aria-label` not updated on copied state | deferred-work.md (3.2 CR) | **DEFER** — a11y polish; success already announced via `role=status` (axe AA 0) |
| `[3.2 · LOW]` short-bio "50 words" label vs 47 actual | deferred-work.md (3.2 CR) | **DEFER** — cosmetic; bio locked to `PERSON.description` |
| `[3.3 · LOW]` rate-limiter "sliding window" label vs fixed window | deferred-work.md (3.3 CR) | **DEFER** — cosmetic comment label |
| `[5.1 · LOW]` cinematic poster `loading="lazy"` above-the-fold | deferred-work.md (5.1 CR) | **DEFER** — cosmetic; lh green, not the LCP element |
| `[5.3 · LOW]` inert `transition: order 0ms` placeholder | deferred-work.md (5.3 CR) | **DEFER** — cosmetic; revisit if a reorder transition is ever authored |
| `[5.4 · LOW]` DEEPEN under a simultaneously-active skim dial cosmetic edge | deferred-work.md (5.4 CR) | **DEFER** — rare JS-on dial cross-product; "more content shown", FR-8-safe |
| `[1.10 · LOW]` `deploy.sh` no clean-tree precheck before `git pull --ff-only` | deferred-work.md (1.10 CR) | **DEFER** — operator-ergonomics polish; `set -euo pipefail` + `--ff-only` already fail-safe |
| `[home-grid · LOW]` home blueprint-grid composition "not completely right" | deferred-work.md (post-Epic-6 live review) | **DEFER → post-Epic-7** — Josh's explicit choice to revisit AFTER Epic 7 on his real GPU (SwiftShader harness can't render the WebGL faithfully) |
| `[6.1 · LOW · DISMISSED]` `renderTimelineGenerator` inert export | deferred-work.md (6.1 CR) | **DROP** — dismissed by story decision; file still consumed by 2.6 import-path test |
| `[3.5 · LOW]` `sprint-status.yaml` tracking drift (3-5 ready-for-dev vs review) | deferred-work.md (3.5 CR) | **DROP** — moot; Epic 3 done + reconciled by the lead pipeline |
| Epic-6 retro A1 (codify Rules 14+15) | epic-6-retro-2026-06-09.md | **DROP** — done in the retro commit (`.claude/rules/project-rules.md` Rules 14, 15) |
| Epic-6 retro A2 (hard exit-code attestation in spawn prompts) | epic-6-retro-2026-06-09.md | **DROP (process, applied)** — the Epic-7 `/epic-cycle` run bakes the Rule-14 exit-code attestation into every dev/QA/CR spawn prompt's verify step (process directive, not a code deliverable) |
| Epic-6 retro A4 (deploy Epic 6 live for review) | epic-6-retro-2026-06-09.md | **DROP** — done; site live at `joshuabrandt.abacusai.cloud` (cycle-log `deployed_live`, 2026-06-09T03:10) with timeline + glass-box tour/map verified |
