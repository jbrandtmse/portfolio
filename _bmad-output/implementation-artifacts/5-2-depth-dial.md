# Story 5.2: Depth Dial

---
baseline_commit: c78bbad59eab5389c64bc123d5e20aaa450330c0
---

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- /epic-cycle Epic-5 Story 5.2. Lead design decisions (no owner gate needed — these are spec-consistent
     implementation choices the pipeline validates; documented here so the dev follows them):
       (1) Depth state = a new nanostore `$depth` ('skim'|'overview'|'deep', default 'overview') in
           web/src/lib/store.ts, mirroring the $guideOpen pattern (SSR-safe).
       (2) Control = an accessible, labeled, keyboard-operable RADIO fieldset ("Depth": Skim / Overview /
           Deep dive) — native radios carry state in the a11y tree (not color); lives in the scene-rail chrome.
       (3) Per-scene content tiers = PROGRESSIVE DISCLOSURE built on the existing teasers: skim = title +
           one-line essence; overview = the current teaser (the DEFAULT); deep = teaser + an expanded grounded
           detail block. Deep content REUSES/summarizes already-committed content (the teasers + the Mirror
           routes) — NO fabrication (Rule 9). A tiny enhancement sets `data-depth` on a root; CSS shows/hides
           tiers by `[data-depth]`. JS-off ⇒ the 'overview' default is visible AND all deeper content is
           reachable (in DOM / followable) — nothing hidden (FR-8).
       (4) Agent path = add an OPTIONAL `depth` to the shared GuideQuery; GuidePanel sends `$depth`; the api
           grounding tunes ANSWER VERBOSITY/DETAIL by depth (skim ≤2 sentences · overview short paragraph ·
           deep fuller) — WITHOUT relaxing the grounding/safety contract (still answer only from retrieved
           context, still fail-closed below threshold, still cite, no fabrication — FR-6/7/9 unchanged). -->

## Story

As a visitor,
I want to set how deep the experience goes — a 30-second skim, an overview, or a deep technical/process dive,
so that the level of detail surfaced for each Scene matches what I'm here for, on my terms, without navigating away — and the Guide's answers match the same depth.

## Context & decision (read first)

Epic 5 Story 5.2 — the visitor-operated **Depth Dial** (FR-5). It adds a single cross-island state (`$depth`) produced by an accessible dial control and consumed by BOTH paths the AC names:
- **Static path:** the per-Scene level of detail on the home changes IN PLACE (no navigation) when the dial changes.
- **Agent path:** the Guide tailors its answer depth to the dial (verbosity/detail only — the grounding + safety contract is untouched).

This is self-contained (both consumers ship in this story — no forward reference). It composes with Story 5.1's cinematic layer (the dial is a normal control, independent of the camera path) and the existing GuidePanel/Guide endpoint (Epic 4).

### Lead design decisions (spec-consistent; documented for the dev)

1. **`$depth` nanostore.** Add `export const $depth = atom<'skim' | 'overview' | 'deep'>('overview')` to `web/src/lib/store.ts` (the established single-global-store home, alongside `$guideOpen`). SSR-safe. `'overview'` is the default (the current teaser content).

2. **The dial control — accessible + keyboard-operable, state in text (AC3).** A real `<fieldset>` radio group: `<legend>Depth</legend>` + 3 native `<input type="radio" name="depth">` options labeled **Skim** (30-second), **Overview**, **Deep dive** (technical/process), each with a short visible label. Native radios carry checked-state in the accessibility tree (NOT color alone) and are keyboard-operable for free (arrow keys, Tab). Place it in the scene-rail chrome (`SceneRail.astro` desktop rail + the mobile rail menu) so it sits with the other navigation affordances. A tiny enhancement script syncs the radios ↔ `$depth` and sets `data-depth` on a root element (e.g. the home `<main>` / `document.documentElement`). The control itself is NOT motion — it must work regardless of `prefers-reduced-motion` (do NOT gate the dial behind `onMotionAllowed`); only any *transition animation* on the content swap is authored under `@media (prefers-reduced-motion: no-preference)`.

3. **Per-Scene content tiers — progressive disclosure (AC1).** Each home Scene (`web/src/pages/index.astro`, the `scene__inner` blocks) carries up to 3 detail tiers, shown/hidden by the root `[data-depth]` via CSS:
   - **skim** — the Scene title + a one-line essence only (trim to the headline).
   - **overview** (DEFAULT) — the current teaser (`scene__summary`/`scene__lede` + the `scene__more` link) exactly as today.
   - **deep** — the overview PLUS an expanded grounded detail block (`scene__deep`) that REUSES/summarizes content that already exists (the scene's own teaser + the essence of its Mirror route) — **no invented facts (Rule 9)**; every claim traces to existing committed content or the Mirror source. The deep block must remain followable/reachable JS-off.
   - Switching is **in place** (CSS visibility by `[data-depth]`), **no navigation** (AC1). JS-off ⇒ `data-depth` is unset ⇒ author the CSS so the **'overview' default is visible and the deeper content is still reachable** (e.g. the deep block is in the DOM and either visible-by-default-without-data-depth or inside a followable `<details>`) — nothing hidden (FR-8, NFR-3).

4. **Agent path — the Guide matches the depth (AC2), grounding contract UNCHANGED.** Add an OPTIONAL `depth: z.enum(['skim','overview','deep']).optional()` to the shared `GuideQuery` (`shared/src/schemas.ts`). The GuidePanel island reads `$depth` and includes it in its `POST /api/guide` body (alongside `query`/`threadContext`). The api (`grounding.ts` `assembleGroundedPrompt`) appends a DEPTH instruction to the grounded prompt — skim ⇒ answer in ≤2 sentences; overview ⇒ a short paragraph; deep ⇒ a fuller, more technical answer — **strictly tuning verbosity/detail of a grounded answer**. It must NOT relax any safety/grounding rule: still answer ONLY from retrieved context, still fail-closed below the retrieval threshold (no model call), still cite, never fabricate (FR-6/7/9). Default/absent depth behaves exactly as today (backward-compatible).

### Constraints carried from the epic

- **NFR-1:** the dial adds a small control + a tiny inline enhancement script (a sanctioned home executable surface, like the scene-rail) — keep within the budget (Lighthouse `/` script ≤256KB; the dial is tiny). No new heavy JS.
- **NFR-2:** the dial works under reduced motion (it is a control, not motion); only the optional content-swap transition is gated under `@media (prefers-reduced-motion: no-preference)`.
- **NFR-6:** byte-deterministic build (`check-deterministic`).
- **FR-8 / NFR-3:** JS-off + crawlable — the default depth shows and all deeper content is reachable; nothing hidden behind the dial.
- **Credibility floor (Rule 9):** the new 'deep' content is the highest-risk surface — every claim must trace to existing committed content / the Mirror; no invented facts.

## Acceptance Criteria

1. **Changing the dial changes the level of detail for each Scene in place, without navigating (FR-5).**
   **Given** the Depth Dial control on the home
   **When** the visitor changes it (skim → overview → deep dive)
   **Then** the level of detail surfaced for each Scene changes IN PLACE (the page does not navigate; no route change, no full reload) — skim shows the trimmed essence, overview the current teaser, deep the expanded grounded detail — driven by `$depth` + a root `[data-depth]`.

2. **The dial state is reflected by BOTH the static path AND the agent path.**
   **Given** the dial is set to a depth
   **When** the static home renders / the Guide answers
   **Then** (static) the visible per-Scene detail matches the depth, AND (agent) the GuidePanel includes the chosen `depth` in its `POST /api/guide` request and the Guide's answer verbosity/detail matches it (skim ≤2 sentences · overview short paragraph · deep fuller) — while the grounding + safety contract is unchanged (answers only from retrieved context, fail-closed below threshold, cited, no fabrication; absent depth = today's behavior).

3. **The dial is a real, labeled, keyboard-operable control whose state is carried in text, not color alone (NFR-2/a11y).**
   **Given** the dial
   **When** it is operated
   **Then** it is a native, labeled radio group (legend + 3 labeled options), fully keyboard-operable (Tab/arrow keys), its selected state is exposed in the accessibility tree (native `:checked`, not color alone), axe WCAG 2.1 AA = 0 violations on the home with the dial present, and the `:focus-visible` ring is intact.

4. **JS-off + crawlable: a sensible default depth shows and nothing is hidden (FR-8, NFR-3).**
   **Given** JS disabled (or before hydration)
   **When** the home loads
   **Then** the 'overview' default detail is visible, the dial degrades gracefully (no broken control), and ALL deeper content remains present in the DOM and reachable — nothing is hidden behind the dial.

5. **Non-vacuous, discoverable, real-runtime tests lock the behaviors (Rule 3, Rule 8).**
   **Given** the changes
   **When** the default `pnpm test:all` suite runs
   **Then** real-runtime e2e assert: (a) changing the dial changes the visible per-Scene detail in place with NO navigation; (b) the dial is keyboard-operable + axe-AA clean; (c) JS-off shows the default + deeper content reachable; (d) the agent path — the GuidePanel sends `depth` and the api applies it (an api/grounding test asserts the depth instruction is in the assembled prompt and the grounding/fail-closed rules are unchanged; mutation-verified). The `depth` schema addition is tested in the `api` package (the runner-bearing one — `shared` has no test runner, Rule 8). Tests scoped to the real surfaces, mutation-verified.

6. **The LITERAL canonical gate `pnpm test:all` is green and the build stays byte-deterministic (Rule 5, NFR-1, NFR-6).**
   **Given** `pnpm test:all` (= typecheck && lint && format:check && test && test:e2e && lh) + `pnpm run check-deterministic`
   **When** the literal command runs end-to-end after the change
   **Then** every step incl. `lh` is green (Lighthouse `/` + `/about/` within budget — the dial is tiny), and the build is byte-deterministic.

## Integration ACs

This story adds a producer (`$depth`) with BOTH its consumers shipping here (the static per-Scene rendering and the Guide agent path) — so per skill-rules Rule 1 there is no missing Integration AC and no forward reference: the integration is verified now, end-to-end, by AC2 + AC5(d) (the dial → static detail change, and the dial → GuidePanel → /api/guide depth → answer). The `depth` addition to `GuideQuery` is backward-compatible (optional; absent = today's behavior) so it does not disturb the existing Guide e2e.

## Tasks / Subtasks

- [x] **Task 1 — `$depth` store + the accessible dial control (AC1, AC3).**
  - [x] Add `$depth` atom to `web/src/lib/store.ts` (default `'overview'`).
  - [x] Build the dial as a native radio `<fieldset>` (legend "Depth"; Skim / Overview / Deep dive, each labeled) in `SceneRail.astro` (desktop rail + mobile menu). A tiny enhancement script syncs radios ↔ `$depth` and sets `data-depth` on the root; keyboard-operable; state in the a11y tree. NOT gated behind `onMotionAllowed` (it's a control). Any content-swap transition authored only under `@media (prefers-reduced-motion: no-preference)`.
- [x] **Task 2 — Per-Scene content tiers + CSS by `[data-depth]` (AC1, AC4).**
  - [x] In `web/src/pages/index.astro`, give each Scene the skim/overview/deep tiers (overview = current teaser unchanged; skim = trimmed essence; deep = an expanded `scene__deep` block reusing existing committed content — NO fabrication, Rule 9). CSS shows/hides tiers by the root `[data-depth]`. JS-off ⇒ overview visible + deep reachable (nothing hidden). Switching is in place (no navigation).
- [x] **Task 3 — Agent path: depth in GuideQuery + grounding (AC2).**
  - [x] Add optional `depth` to `GuideQuery` (`shared/src/schemas.ts`). GuidePanel (`web/src/islands/GuidePanel.tsx`) reads `$depth` and includes it in the `/api/guide` body. `grounding.ts` `assembleGroundedPrompt` appends a depth instruction (verbosity/detail only) — grounding/fail-closed/citation rules UNCHANGED. Absent depth = today's behavior.
- [x] **Task 4 — Tests (AC5) + the literal gate (AC6).**
  - [x] Playwright e2e: dial changes visible per-Scene detail in place (no nav); keyboard-operable + axe-AA; JS-off default + reachability. api/grounding test: the `depth` schema (in the `api` package) + the assembled-prompt depth instruction + grounding-rules-unchanged, mutation-verified. Then run the LITERAL `pnpm test:all` + `check-deterministic`.

## Dev Notes

### Current state (files to modify — read before editing)

- **`web/src/lib/store.ts`** — currently exports only `$guideOpen` (nanostore atom). Add `$depth` here (same pattern). SSR-safe.
- **`web/src/components/scene/SceneRail.astro`** — the fixed rail chrome (desktop rail + mobile menu) with scene anchors, skip, the "Scene N of 7" meter, and (Story 5.0) the foot-of-scroll sentinel. Add the Depth Dial control here. Reuse the `onMotionAllowed` import ONLY for any optional transition — the dial itself is not motion-gated.
- **`web/src/pages/index.astro`** — the 7 Scenes (`scene__inner` with `scene__title`/`scene__summary`/`scene__lede`/`scene__more`). Add the depth tiers per Scene. Story 5.1's cinematic still + bootstrap also live here — do not disturb them.
- **`shared/src/schemas.ts`** — `GuideQuery` (`query` + optional `threadContext`; Story 5.0 added `threadContext[].content.max(2000)`). Add optional `depth`. Zod 4.
- **`web/src/islands/GuidePanel.tsx`** — POSTs `{query, threadContext}` to `/api/guide` (~line 257). Add `depth` (from `$depth`) to the body.
- **`api/src/lib/grounding.ts`** — `SYSTEM_PERSONA` + `assembleGroundedPrompt(...)` (system message first, then thread, then grounded user message). Append the depth instruction WITHOUT touching the grounding/fail-closed/citation/injection rules. `api/src/routes/guide.ts` validates `GuideQuery` + streams.
- **Test homes:** `web/e2e/*.spec.ts` (home/reduced-motion/js-off/guide-panel), `web/test/*.test.ts` (build-output, SceneRail.component), `api/src/lib/grounding.test.ts` + `api/src/routes/guide.test.ts` (the discoverable home for the `depth` schema + grounding — `shared` has no test runner).

### Constraints / invariants to preserve

- **Grounding/safety contract is sacrosanct:** depth tunes verbosity/detail ONLY. Do not relax "answer only from retrieved context", the fail-closed-below-threshold (no model call) guarantee, citations, or injection resistance (FR-6/7/9). The `depth` is server-validated via the Zod schema; an unexpected value is rejected like any invalid field.
- **NFR-1** (tiny dial script within budget), **NFR-2** (dial works under reduced motion; transitions gated), **NFR-6** (byte-stable), **FR-8/NFR-3** (JS-off default + reachability), **Rule 9** (no fabricated 'deep' content), **Rule 5** (literal root gate), **Rule 8** (real-surface scoped tests; the `depth` test in `api`, not `shared`).
- Backward-compat: absent `depth` ⇒ today's Guide behavior; the existing guide/guide-panel e2e stay green.
- Do NOT build Story 5.3 (intent re-curation) or 5.4 (director's mode) — `depth` is orthogonal to intent/ordering and must compose with them later.

### Project Structure Notes

- `$depth` belongs in `web/src/lib/store.ts` (single global store; AR §Communication Patterns). The dial control can be inline in `SceneRail.astro` or a small `web/src/components/scene/DepthDial.astro` it imports — keep it 0-JS-by-default-friendly (a tiny enhancement script, like the scene-rail). The `depth` contract lives in `shared/src/schemas.ts` (single cross-package source); its test lives in `api` (runner-bearing).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] — the 3 BDD ACs.
- [Source: _bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/prd.md#FR-5] — "Changing the Depth Dial changes the level of detail surfaced for a given Scene without navigating away"; "the site/agent matches that depth."
- [Source: ux-designs/.../EXPERIENCE.md (Depth Dial row)] — "Visitor-operated 30s-skim → overview → deep dive → reflected by both agent and static paths."
- [Source: web/src/lib/store.ts] — the `$guideOpen` nanostore pattern to mirror.
- [Source: web/src/islands/GuidePanel.tsx#L254-259] — the `/api/guide` request body to extend with `depth`.
- [Source: api/src/lib/grounding.ts#assembleGroundedPrompt] — where the depth instruction attaches (verbosity only).
- [Source: .claude/rules/project-rules.md#9] — LLM/authored content fabrication guardrails (the 'deep' tier).
- [Source: .claude/rules/project-rules.md#8] — real-module + scoped + mutation-verified tests; the `shared` schema test goes in the runner-bearing `api` package.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none — clean implementation, no debug issues)

### Completion Notes List

- Task 1: Added `$depth = atom<Depth>('overview')` and `Depth` type export to `web/src/lib/store.ts`. Added native radio `<fieldset data-depth-dial>` with legend "Depth" and 3 labeled options (Skim/Overview/Deep dive) to SceneRail.astro desktop rail and mobile menu. Added a second `<script>` (NOT motion-gated) importing `$depth` from the store; syncs radios ↔ store, sets `data-depth` on `document.documentElement`. Desktop/mobile radio groups use different `name` attributes and the script keeps them in sync manually. Content-swap transition authored under `@media (prefers-reduced-motion: no-preference)` only.
- Task 2: Added `.scene__skim` + `.scene__deep` blocks to all 5 non-hero, non-close scenes in `index.astro`. Rule 9 compliance: every deep-tier sentence traces to the existing committed teaser in the same scene — no new claims. CSS: `:not([data-depth])` and `[data-depth='overview']` hide skim+deep; `[data-depth='skim']` shows skim, hides overview+deep; `[data-depth='deep']` shows all, hides skim. JS-off (no data-depth): overview + deep both visible (FR-8 reachability).
- Task 3: Added `depth: z.enum(['skim','overview','deep']).optional()` to `GuideQuery` in `shared/src/schemas.ts`. GuidePanel imports `$depth` and passes `depth: currentDepth` in the fetch body. `grounding.ts` gains `DEPTH_INSTRUCTIONS` map and `depth?: 'skim' | 'overview' | 'deep'` param to `assembleGroundedPrompt()` — appends depth instruction AFTER the visitor input block, verbosity/detail only; grounding/fail-closed/citation/injection rules UNCHANGED. `guide.ts` destructures `depth` from `parseResult.data` and passes it to `assembleGroundedPrompt`.
- Task 4: Added 20 depth-specific tests to `api/src/lib/grounding.test.ts` (GuideQuery.depth schema + assembleGroundedPrompt depth instruction, all mutation-verified). Created `web/e2e/depth-dial.spec.ts` with 12 real-runtime e2e tests covering AC1–AC4 + agent-path. Registered `depth-dial` project in `web/playwright.config.ts`. Ran `pnpm test:all` (typecheck + lint + format:check + test + test:e2e + lh) → exit 0. Ran `pnpm run check-deterministic` → PASS (byte-identical builds).

### File List

- web/src/lib/store.ts (modified — added `$depth` atom + `Depth` type)
- web/src/components/scene/SceneRail.astro (modified — added depth dial fieldset + enhancement script)
- web/src/pages/index.astro (modified — added depth tiers + CSS to all non-hero scenes)
- shared/src/schemas.ts (modified — added optional `depth` to GuideQuery)
- web/src/islands/GuidePanel.tsx (modified — import `$depth`, add `depth: currentDepth` to fetch body)
- api/src/lib/grounding.ts (modified — DEPTH_INSTRUCTIONS + depth param in assembleGroundedPrompt)
- api/src/routes/guide.ts (modified — destructure depth, pass to assembleGroundedPrompt)
- api/src/lib/grounding.test.ts (modified — added Story 5.2 depth tests)
- web/e2e/depth-dial.spec.ts (created — new e2e spec for depth dial)
- web/playwright.config.ts (modified — registered `depth-dial` project)

## Change Log

- Story 5.2 (2026-06-08): Implemented Depth Dial — `$depth` nanostore, accessible radio fieldset in SceneRail, per-scene content tiers (skim/overview/deep) in index.astro, optional `depth` in GuideQuery, depth instruction in grounding.ts, GuidePanel sends depth. Tests: grounding unit + e2e. All ACs 1–6 satisfied. Rule 9 compliance: all deep-tier content traces to committed teasers.

## Review Findings

Adversarial code review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) of the FINAL state (dev + the lead's Rule-9 Thesis fix + the QA re-audit), verified fresh against the real build/runtime. Found and **auto-resolved inline 1 HIGH + 1 MED** — both genuine defects invisible to the green gate, surfaced only by real-runtime browser probing. The literal `pnpm test:all` was re-run end-to-end by the reviewer to **exit 0** + `check-deterministic` PASS after the fixes.

- [x] **[5.2 · HIGH · ✅ RESOLVED] AC2 agent path posted a STALE depth — `GuidePanel.sendQuery` omitted `currentDepth` from its `useCallback` deps.** `web/src/islands/GuidePanel.tsx` — `sendQuery` is memoized on `[isStreaming, transcript, idPrefix]`, but a depth-only dial change re-renders the component WITHOUT touching any of those deps, so the memoized closure kept the depth captured at its last creation (mount, or the previous query's `transcript` change). Every `/api/guide` request therefore carried a depth lagging one change behind the dial — directly violating AC2 ("the GuidePanel includes the CHOSEN depth"). **Empirically proven** on the un-fixed source via a two-send probe (deep-then-skim): captured sequence `["overview","deep"]` (send #1 at deep posted overview; send #2 at skim posted deep). The dev's AC2 e2e was VACUOUS for this — it sent a SINGLE query at the default depth, so it asserted `depth` is *present* but never that it *tracks a change*; it passed even un-fixed (client:only mount timing happened to capture the changed value on the single-send path). **Fix (inline):** added `currentDepth` to `sendQuery`'s dependency array. Re-probed after the fix: captured `["deep","skim"]` (each send carries the live dial value). **Test (inline):** replaced the vacuous single-send test with a mutation-verified two-send regression test (`GuidePanel sends the CURRENT dial depth on EACH send …`) — it reds when `currentDepth` is removed from the deps (mutation-confirmed), greens with the fix.
- [x] **[5.2 · MED · ✅ RESOLVED] AC1 Skim mode silently stripped the untiered Close scene's summary (global-selector side-effect).** `web/src/pages/index.astro` — the skim-hide CSS rule `html[data-depth='skim'] .scene__summary { display:none }` is GLOBAL, but the `#close` scene (the conversion ask + invite form) was deliberately NOT given a `.scene__skim` replacement (Task 2 tiered "all 5 non-hero, non-close scenes"). So in Skim mode the Close lost its intro line ("The shortest path is a direct ask…"), leaving the title floating above the form with no lead-in. Not a functional break (form/title/CTAs intact, JS-off unaffected, FR-8 fine) but a UX inconsistency: the conversion ask should read at EVERY depth. **Fix (inline):** added a scoped exemption `html[data-depth='skim'] .scene--close .scene__summary { display:block }` so the Close summary stays visible in skim. **Test (inline):** extended the existing skim e2e to assert `section#close .scene__summary` is visible in skim — mutation-verified (removing the exemption reds it; restored).

**Verified CLEAN (no findings):**
- **Rule 9 credibility floor — all 5 `scene__deep` blocks audited broadly.** Every claim traces to the scene's own committed teaser or its linked Mirror route (verified each route exists: `/timeline/`, `/speaking/`, `/work/loandemo/`, `/glass-box/`; "eras" traces to the committed era-bands on `/timeline/`). The Thesis deep block (the lead's fix) makes NO completeness claim ("the curated, chronological build-story is in the Glass Box", not "every artifact is…") — consistent with the curated/default-deny Glass Box. Zero invented facts.
- **Grounding/safety contract UNCHANGED.** Depth instruction is appended AFTER `=== END VISITOR INPUT ===` (verified by test); only the three server-validated enum values map to a `DEPTH_INSTRUCTIONS` entry (absent/unexpected = no-op); `SYSTEM_PERSONA`, the retrieved-context block, the visitor-input block, and the injection patterns are byte-unchanged by depth; the fail-closed Step-6 threshold gate returns BEFORE `assembleGroundedPrompt`, so no depth value can bypass it (no model call below threshold). `depth` is server-validated by `GuideQuery` (rejects unknown values, mutation-verified).
- **AC3 a11y / AC4 JS-off / Rule 7.** Native labeled radio `<fieldset>` (legend "Depth", 3 options), keyboard-operable, `:focus-visible` ring intact, state in the a11y tree via `:checked` with color as REDUNDANT reinforcement, axe WCAG 2.1 AA = 0. JS-off: overview default visible + deep reachable in the DOM, dial degrades gracefully (native fieldset present). The `depth-dial` Playwright project runs through the prod-faithful `serve-with-api.mjs` proxy — not skipped (Rule 7).
- **Rule 1 Integration AC.** `$depth` producer with BOTH consumers shipping here is genuinely wired end-to-end (static `[data-depth]` tier swap AND the agent path POST), now verified after the stale-closure fix.

**Final canonical gate (re-run by reviewer, literal `pnpm test:all` → exit 0):** typecheck 0 errors · lint 0 · ROOT `format:check` clean · vitest scripts 160 / api 150 (incl. 20 depth tests) / web 666 · Playwright **265 passed, 0 skipped, 0 failed** (incl. the depth-dial project; verified 13/13 in an isolated list-reporter run) · `lh` green (`/` + `/about/` within budget — the dial is tiny). `pnpm run check-deterministic` **PASS** (byte-identical across two clean builds).
