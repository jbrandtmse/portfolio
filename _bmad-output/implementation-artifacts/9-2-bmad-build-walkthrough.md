# Story 9.2: BMAD Build Walkthrough — a "learn the method" teaching layer on the Demonstrator

---
baseline_commit: 6a3982457d620850a940cbad9699d6883818ec0d
---

Status: done

<!-- Created by the lead /epic-cycle create-story gate, Epic 9, 2026-06-10. Epic 9 Story 9.2 (FR / #9).
     OWNER DECISION (Josh, 2026-06-10 AskUserQuestion): "Teaching layer on the Demonstrator" — extend the
     EXISTING /demonstrator/ surface (built in 9.1) with a 'learn the method' mode: the same 8 real stages,
     each gaining a step-by-step BMAD teaching explanation (what the method prescribes + why). ONE surface,
     TWO modes — 'watch it' (9.1 replay) and 'learn it' (9.2). Crawlable; the Guide can elaborate. NOT a new
     /walkthrough/ route; NOT a Guide-only mode. -->

## Story

As a practitioner,
I want a step-by-step walkthrough of the BMAD Method as I look at how this site was built,
So that I learn Josh's approach while watching it demonstrated — the "why" of each stage, not just the "what happened".

(Epics.md Story 9.2; guardrail #9. Sibling to 9.1 "The Demonstrator" — 9.1 is "watch it happen" (the `narration`), 9.2 is "learn the method" (a new `teaching` layer on the SAME stages). Curated/pre-approved, never live arbitrary execution — consistent with 9.1 / §9.1.)

## Context & decision (read first)

Story 9.1 shipped `/demonstrator/` — 8 real BMAD lifecycle stages (brief → brainstorm/research → PRD → UX/architecture → epics → the dev/QA/review/smoke pipeline → retro → working software), each with a `narration` of what happened + its real artifact links. Story 9.2 adds the **teaching dimension** to that SAME surface: each stage gains a step-by-step explanation of **what the BMAD Method prescribes at that stage and why** — so the visitor learns the methodology, not just sees the trail. A **"Watch / Learn" mode toggle** switches each stage's displayed content between the 9.1 `narration` and the 9.2 `teaching`.

### What this story builds

1. **A `teaching` field on each `content/demonstrator.ts` stage** — a concise, step-by-step BMAD-Method lesson for that stage: what the method prescribes (the discipline) + why it matters, grounded in the REAL methodology (`content/kb/bmad-method.md` + the real pipeline + the project's own rules/process). The 9.1 `narration` ("what happened") and the 9.2 `teaching` ("what the method prescribes + why") sit side by side per stage.
2. **A "Watch / Learn" mode toggle on `/demonstrator/`** — a labeled, keyboard-operable control switching the stages between **Watch** (9.1 narration — "how THIS site was built") and **Learn** (9.2 teaching — "the BMAD Method, step by step"). BOTH modes' content is present in the static crawlable `<ol>` (FR-8 — a JS-off visitor reads both); the toggle is a JS-on enhancement (default Watch; the static baseline shows both, clearly labeled).
3. **Replay island handles the mode** — the `DemonstratorReplay` island (9.1) steps through whichever mode is active, showing the right per-stage content. Rule 12 (deps incl. the mode), Rule 13 (the visible per-stage content actually changes with the mode — assert the observable outcome).
4. **Guide composition** — extend `content/kb/demonstrator.md` (and/or lean on the existing `content/kb/bmad-method.md`) so the Guide can teach the BMAD Method step-by-step + cite `/demonstrator/` (Learn mode). The bmad-method KB already describes the methodology; ensure the teaching layer is consistent with it.

### Credibility (Rule 9) — the teaching is real, the methodology is not fabricated

The teaching content describes the REAL BMAD Method as actually practiced on this project. Enumerated fabrication classes to NOT commit (Epic-4 Rule-9 lesson + the bmad-method KB):
- **NO invented BMAD acronym expansion** — the acronym is NOT expanded anywhere in the project (`bmad-method.md` does not define it); do NOT make one up. Refer to it as "the BMAD Method" (as the KB does).
- **NO fabricated methodology** — every teaching point traces to `content/kb/bmad-method.md` (the real phases: brief → brainstorm/research → PRD → UX/architecture → epics → the dev→QA→code-review→smoke→commit pipeline → retrospective) and/or the project's REAL process (the cycle logs, the `.claude/rules/project-rules.md` rules, the real per-stage gates). Do NOT invent steps, role names, or guarantees the method doesn't make.
- **NO "every artifact published"** — only the 6 published Glass Box readers exist (brainstorm, prd, pre-brief-research, product-brief, ux-design, ux-experience); architecture/epics/retro/shipping are ghost nodes (honest "open" in 9.1).
- **NO "recorded in ADRs"** — there is no `docs/adr/`.

## Acceptance Criteria

**AC1 — a step-by-step teaching walkthrough on the Demonstrator (#9).**
**Given** `/demonstrator/` in Learn mode
**When** a visitor follows it
**Then** each of the 8 stages presents a step-by-step explanation of what the BMAD Method prescribes at that stage and why (the `teaching` content), teaching the methodology — and the replay (9.1) steps through the Learn content when Learn mode is active.

**AC2 — curated/pre-approved, never live (consistent with 9.1 / §9.1).**
**Given** the walkthrough
**When** it runs
**Then** it is pre-approved/curated static content (the per-stage teaching prose), with NO live arbitrary execution; JS-off, both the Watch narration and the Learn teaching are present + readable in the static crawlable `<ol>` (FR-8); reduced motion steps instantly; the page adds 0 executable JS beyond the Guide pill + the deferred replay island (NFR-1 — the mode toggle adds no new island).

**AC3 — the teaching is real (Rule 9 credibility floor).**
**Given** the teaching content (`content/demonstrator.ts` `teaching` fields + `content/kb/demonstrator.md`)
**When** audited against `content/kb/bmad-method.md` + the real project process
**Then** every teaching point traces to the real methodology; there is **no invented BMAD acronym expansion**, no fabricated methodology step/role/guarantee, no "every artifact published", no "ADRs"; a served-output test asserts no fabrication-class string (incl. an acronym-expansion guard), mutation-verified.

**AC4 — mode toggle + composition + gate.**
**Given** the Watch/Learn toggle + the canonical gate
**When** the story completes
**Then** the toggle is labeled + keyboard-operable (axe AA 0 on `/demonstrator/`), default Watch, and switching to Learn shows the teaching content (Rule 13 — the visible per-stage content changes, mutation-verified); the Guide can ground + teach the method (KB indexed); the existing 9.1 Watch replay + the `GlassBoxTour` are unaffected; `pnpm test:all` + `pnpm run check-deterministic` both exit 0 (report exit codes — Rule 14); voice positive-assertion (no exclamation).

## Integration ACs

No new service/route. This extends the 9.1 `/demonstrator/` surface + the `content/demonstrator.ts` manifest (a new `teaching` field) + `content/kb/demonstrator.md`. The Guide (existing consumer) grounding the BMAD-Method teaching is the integration; the `teaching` fields' first consumer is the `/demonstrator/` Learn mode IN THIS STORY. Rule 1 escape clause / extension of an existing surface.

## Tasks / Subtasks

- [x] **Task 1 (AC1/AC3) — add `teaching` to each `content/demonstrator.ts` stage**: a step-by-step BMAD-Method lesson per stage (what the method prescribes + why), grounded in `content/kb/bmad-method.md` + the real process. No fabrication (no invented acronym; no invented methodology). Update the `DemonstratorStage` interface.
- [x] **Task 2 (AC2/AC4) — Watch/Learn toggle on `/demonstrator.astro`**: a labeled, keyboard-operable toggle (default Watch); BOTH the narration + the teaching present in the static crawlable `<ol>` (clearly labeled per mode for JS-off); the toggle switches the JS-on display.
- [x] **Task 3 (AC1/AC4) — `DemonstratorReplay.tsx` honors the mode**: the replay steps through the active mode's per-stage content; the visible content changes with the mode. Rule 12 (mode in the deps), Rule 13 (assert the visible content changes, mutation-verified).
- [x] **Task 4 (AC3/AC4) — KB + tests**: extend `content/kb/demonstrator.md` (consistent with `bmad-method.md`) so the Guide teaches the method; a served-output credibility test (no acronym-expansion / no fabricated-methodology / no "every artifact published" — class-guarded, mutation-verified); an e2e asserting the mode toggle shows the teaching content (Rule 13), in the registered `demonstrator` Playwright project (Rule 7).
- [x] **Task 5 (AC4) — gate**: `pnpm test:all; echo $?` → exit 0; `pnpm run check-deterministic; echo $?` → exit 0.

## Dev Notes

- **Owner decision FIXED:** teaching LAYER on the existing `/demonstrator/` (one surface, Watch/Learn modes). Do NOT build a new `/walkthrough/` route; do NOT make it Guide-only.
- **Rule 9 (credibility — highest risk, this is LLM-authored methodology prose):** the enumerated fabrication classes above are load-bearing. The BMAD acronym is NOT expanded in the project — do NOT invent an expansion (the exact Epic-4 4.1 defect). Ground every teaching point to `content/kb/bmad-method.md` / the real pipeline / the real rules. QA + code-review run a BROAD credibility audit + a class-guarded served-output test (incl. an acronym-expansion regex guard).
- **Rule 13:** the Watch↔Learn toggle must produce a VISIBLE content change per stage (assert the rendered teaching text appears in Learn mode), mutation-verified — not just a `data-mode` attribute with no consumer.
- **Rule 12:** if the replay island reads the mode, the mode must be in the `useCallback`/`useEffect` deps (exhaustive-deps guard).
- **FR-8 / NFR-1:** both modes' content in the static `<ol>` (JS-off reads both, clearly labeled); the toggle is a JS-on enhancement that adds NO new executable JS beyond the existing deferred replay island (do NOT add a second island for the toggle — handle it in the existing one or with a tiny inline handler within the island's script).
- **Do NOT disturb 9.1's Watch replay or the GlassBoxTour** — both stay green; the `teaching` field is additive.
- **Rule 14/16:** run the WHOLE gate, capture + report exit codes; read `astro check`'s Failed/exit code; a red gate is FIXED or HALTED.

## Dev Agent Record

### Context Reference
- Created by the lead `/epic-cycle` create-story gate (Epic 9), 2026-06-10. Owner fork via AskUserQuestion: teaching layer on the Demonstrator (Watch/Learn modes).

### File List
- content/demonstrator.ts
- content/kb/demonstrator.md
- web/src/islands/DemonstratorReplay.tsx
- web/src/lib/demonstrator/bootstrap.ts
- web/src/pages/demonstrator.astro
- web/test/demonstrator.test.ts
- web/e2e/demonstrator.spec.ts
- _bmad-output/implementation-artifacts/9-2-bmad-build-walkthrough.md

### Decisions
- Teaching layer implemented as `teaching: string` on `DemonstratorStage` interface; all 8 stages grounded to `content/kb/bmad-method.md` phases and the real pipeline.
- Watch/Learn mode toggle managed as React `useState` inside the existing `DemonstratorReplay` island (no second island, per NFR-1 / FR-8).
- `data-active-mode` attribute written to `.demonstrator__spine-section` via a `useEffect` (in deps: `mode`); CSS rules `[data-active-mode='watch'] .demonstrator__mode-section--learn { display: none }` / vice versa provide the visible outcome (Rule 13 / Rule 12).
- Both modes' static content present in the `<ol>` spine with `data-spine-mode` attributes; labeled `Watch — how this site was built` / `Learn — what the BMAD Method prescribes`; JS-off reads both.
- `framingLeadLearn` added to the replay data JSON payload and passed through `bootstrap.ts` → `DemonstratorReplay` props.
- `mode` added to `useEffect` deps (Rule 12 exhaustive-deps).
- All fabrication-class guards (no acronym expansion, no invented methodology, no ADRs, no "every artifact published") tested in both unit (`demonstrator.test.ts`) and e2e (`demonstrator.spec.ts`), mutation-verified.

### Completion Notes
- `pnpm test:all` exit code: 0 (968 web unit tests + 233 api tests + full e2e suite including 31 demonstrator tests, Lighthouse).
- `pnpm run check-deterministic` exit code: 0 (byte-identical builds across two runs).
- 9.1 Watch replay and GlassBoxTour unchanged and green.
- No new executable JS added beyond the existing deferred bootstrap (NFR-1 still holds).

### Review Findings

Adversarial code-review (epic-cycle code-review stage), 2026-06-10, verified FRESH against baseline `6a39824` (all 9.2 work is uncommitted in the working tree; HEAD == baseline). Both gates re-run end-to-end by the reviewer.

**Outcome: APPROVED — 0 decision-needed, 0 patch, 1 defer (LOW, pre-existing/out-of-scope), 0 unresolved HIGH/MED.**

Gate (Rule 14/16 — verbatim captured exit codes):
- `pnpm test:all` → **exit 0**. typecheck `Result (125 files): 0 errors / 0 warnings / 76 hints`; unit scripts 185 + api 233 + web 968 all passed; e2e **464 passed, 0 skipped, 0 failed** (the demonstrator Playwright project ran in full — Rule 7); `format:check` "All matched files use Prettier code style"; `lint` clean (so `react-hooks/exhaustive-deps`, a hard ESLint error, passed — Rule 12 mode-in-deps confirmed); Lighthouse pass.
- `pnpm run check-deterministic` → **exit 0** (158 files; build #1 == build #2 tree hash `c551674d…`, byte-identical).

Review focus verification:
1. **Rule 9 — broad credibility audit: CLEAN.** Re-read `content/kb/bmad-method.md` + the real pipeline + `.claude/rules/project-rules.md`, then re-audited all 8 `teaching` fields + the `content/kb/demonstrator.md` additions. No invented BMAD acronym expansion (re-grepped manifest + the built `web/dist/demonstrator/index.html` — zero `B__ M__ A__ D__` patterns, no "stands for"/"Build, Measure"); no ADRs (only the dev-comment prohibitions reference the word); no "every artifact published in the Glass Box" (the borderline phrases — stage-4 "architecture decisions recorded → auditable constraints", stage-8 "every decision has a corresponding artifact" — are methodology rhetoric, not Glass-Box-publication claims, and the regex guards don't trip). Every teaching point traces to the real method: the four-pass **dev→QA→code-review→smoke** order in stage 6 matches the REAL practiced pipeline (cycle-log-epic-9: dev_complete→qa_complete→…→smoke) and `project-rules.md`, even though the legacy `bmad-method.md` numbered list lists code-review before QA — the teaching is grounded to reality (Story 9.1's already-shipped narration uses the same order). **Mutation spot-check (non-vacuity):** injected "Build Measure Adapt Deliver" into a teaching field → BOTH acronym guards (`INVENTED_EXPANSION` + `FOUR_WORD_EXPANSION`) RED (2 failed); reverted byte-clean.
2. **AC4 axe fix SOUND.** `.dr__mode-btn--active` `color: var(--color-bg)` (undefined → inherited `#211b14` on navy `#1e3a5f` = **1.48:1**, the QA-found AA failure) → `var(--color-surface-base)` (`#f6f0e6` cream on navy = **10.15:1**, passes AA). Computed both ratios independently. The 2 new axe AA tests (Watch default + Learn replay-open) run in the `demonstrator` project and are non-vacuous (QA's revert-the-fix mutation reds them; the existing `axe.spec.ts` covered only `/` + `/about/`, so this closed a real coverage gap). The same dev/QA correctly ALSO fixed the identical undefined-token on `.dr__start-btn:hover` and `.dr__panel` background (in 9.2's file).
3. **AC1 / Rule 13 — user-observable: VERIFIED.** The island's `visibleContent = mode === 'learn' ? teaching : narration` is the real consumer; the e2e drives the real toggle and asserts `learnText !== watchText` AND `data-demo-content === 'learn'` (panel) plus the static-spine hide/show (Learn section visible, Watch section `.not.toBeVisible()`). Round-trip back-to-Watch restores narration. QA mutation-verified (break the consumer → red; remove the `data-active-mode` effect → red).
4. **AC2 — crawlable + safe + NFR-1: VERIFIED on the real build.** Built `web/dist/demonstrator/index.html` carries 8 `data-spine-mode="watch"` + 8 `data-spine-mode="learn"` sections (both modes, all 8 stages, per-mode labeled) with NO `data-active-mode` preset → JS-off reads both; the island sets the attribute only after mount. No live execution (data island is `type="application/json"`). NFR-1: the build-output test asserts `/demonstrator/` ships exactly 3 executable scripts (2 Guide pill + 1 deferred bootstrap) — the toggle is `useState` inside the EXISTING island, no second island, no new `client:` directive (confirmed in `demonstrator.astro` + `bootstrap.ts`).
5. **Rule 12 — exhaustive-deps CLEAN.** `mode` is in both `useEffect` dep arrays (`[step, stages, mode]` and `[mode]`); `react-hooks/exhaustive-deps` is `'error'` in `eslint.config.js` and `lint` passed in the gate — no stale closure.
6. **No-regression: CONFIRMED.** `GlassBoxTour.tsx`, its spec, and `store.ts` are untouched by the diff (`$demoStep` vs `$tourStep` independent); 9.1 Watch replay unchanged (additive `teaching` field + new prop only); full e2e (464) green.

- [x] [Review][Defer] Undefined `--color-bg` token on `/glass-box/` `.gbt__start-btn:hover` (+ `.gbt__start-btn` subtle bg) [web/src/pages/glass-box/index.astro:873,906] — deferred, pre-existing (Story 6.3), out of scope for 9.2; hover-only so not a default-state AA failure (axe does not flag it). QA flagged it; code-review agrees out-of-scope. Logged in deferred-work.md with the one-shot `grep -rn "var(--color-bg" web/src` sweep suggestion.
