# Story 5.4: Director's-mode Scene reordering

---
baseline_commit: 44f44e3d9148a855662bb21c8595072c11e15541
---

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- /epic-cycle Epic-5 Story 5.4 — the CAPSTONE. It EXTENDS the Story 5.3 re-curation engine with the two
     director's-mode verbs the epic still owes: DEEPEN (per-scene depth via Story 5.2's $depth) and SKIP
     (guided-tour omission — the camera doesn't stop at a scene, but it STAYS in the DOM + reachable; NEVER a
     content removal — FR-8), and it DRIVES the canvas (Story 5.1's window.__cinematicHandle.goToScene) through
     the resulting director's cut. The big engine forks were decided at 5.3 (DOM-reorder via CSS order +
     LLM-classified enum intent + the api-owned, SM-C1-guarded directive table) and carry over — 5.4 adds
     deepen/skip to that SAME table + the camera driving. No new owner gate.
     HARD guards (unchanged from 5.3, extended for skip): SM-C1 — never skip `hero`; never skip/bury `speaker`
     for an organizer; the hero "I'm here to book a talk" → /speaking bypass + deep link untouched. FR-8 —
     SKIP is a guided-tour omission only; every scene stays in the served DOM + reachable (scroll/rail/Mirror/
     JS-off); the canonical crawlable order is unchanged. A default cut ALWAYS exists (no intent → default arc,
     no deepen, no skip). Reduced-motion (AC3) → degrades to the default discrete-scene arc (no camera driving,
     no skip-omission; all scenes scrollable). -->

## Story

As a visitor in conversation with the Guide,
I want the Guide to reorder, deepen, and skip Scenes for me so the cinematic journey adapts to my goals,
so that — telling it what I'm here for — I'm driven through a director's cut tailored to me (e.g. an organizer is taken Speaker → Flagship at depth, skipping past what doesn't serve them), while a visitor who does nothing gets the sensible default cut, nothing is ever hidden from the static fallback, the organizer fast path is never buried (SM-C1), and under reduced motion it degrades to the default discrete-scene arc.

## Context & decision (read first)

Epic 5 Story 5.4 — **director's-mode Scene reordering (FR-4)**, the capstone that COMPOSES the whole cinematic epic:
- **Story 5.1** — the GSAP/ScrollTrigger Continuous Canvas + the `window.__cinematicHandle.goToScene(n)` / `teardown()` producer API (the camera 5.4 drives).
- **Story 5.2** — the `$depth` Depth Dial (the mechanism 5.4's "deepen" reuses).
- **Story 5.3** — the re-curation engine: the LLM-classified enum intent, the api-owned SM-C1-guarded directive table, the additive `recuration` SSE event `{intent, order}`, and the web `applyRecuration` controller (CSS `order`, canonical DOM preserved). 5.4 EXTENDS this engine.

5.4 adds the two director's-mode verbs 5.3 deliberately left out: **DEEPEN** (set a scene's depth) and **SKIP** (omit a scene from the GUIDED camera tour — never from the DOM), and it DRIVES the camera through the director's cut. The epics list 5.3 (re-curation) and 5.4 (director's mode) separately, but mechanically 5.4 = 5.3's engine + deepen + skip + camera driving.

### Lead design decisions (extending the established 5.3 engine; documented for the dev)

1. **Extend the directive, server-owned + guarded.** Add OPTIONAL `deepen?: SceneId[]` (scenes to render at deep depth) and `skip?: SceneId[]` (scenes the camera tour omits) to the `RecurationEvent` (`shared/src/events.ts`) — backward-compatible (a 5.3-era client ignoring them still works; absent = no deepen/skip). Add api-owned **intent→deepen** and **intent→skip** tables in `api/src/lib/recuration.ts` alongside the existing `INTENT_ORDER_TABLE`. The LLM still picks ONLY the enum intent; the api owns the deepen/skip sets (the model never emits them). Extend `assertSmc1Invariants()` to GUARD skip: `skip` MUST NOT contain `hero`; MUST NOT contain `speaker` for `organizer`; MUST NOT contain `close`; and every skipped scene must still be a real SceneId present in the DOM (skip is omission-from-tour, not deletion). `default` intent → empty deepen + empty skip (the default cut).

2. **DEEPEN reuses Story 5.2 `$depth` per scene.** Apply deep detail to the deepened scenes via the existing depth tiers (set the scene's depth tier to `deep`, or set `$depth`/a per-scene `data-depth` for those scenes). Do NOT invent a new depth mechanism. Deepen is content adaptivity (works regardless of motion).

3. **SKIP = guided-tour omission only (FR-8 HARD).** A skipped scene is omitted from the CAMERA tour (5.1's `goToScene` sequence steps over it) and may be visually de-emphasized in the guided flow, but it REMAINS in the served DOM, in the scroll, in the scene-rail (still a reachable jump anchor), in the Mirror, and JS-off — nothing is hidden from the static fallback. NEVER remove a scene node or hide it from crawlers/JS-off.

4. **DRIVE the camera through the director's cut.** When motion is enabled, the Guide drives `window.__cinematicHandle.goToScene` through the re-ordered, non-skipped sequence (composing with 5.3's `applyRecuration` order + 5.2's depth). All camera driving runs inside the existing `onMotionAllowed` gate (5.1).

5. **Default cut + reduced-motion (AC1, AC3).** No intent (or `default`) → the canonical arc, no deepen, no skip. Reduced motion → the camera driving + skip-omission are OFF (degrade to the **default discrete-scene arc**: the discrete scenes, all present + scrollable, nothing skipped from the scroll); `$depth`/deepen (content, not motion) and 5.3's reorder may persist as static layout, but no cinematic driving (AC3: "degrades under reduced-motion to the default discrete-scene arc").

### Hard guards (carried + extended)

- **SM-C1:** `hero` first + never skipped; `speaker` never skipped/buried for an organizer; the hero "I'm here to book a talk" → `/speaking` bypass + the `/speaking` deep link untouched + reachable without chat. The skip guard asserts these.
- **FR-8/NFR-3:** every scene stays in the canonical served DOM + reachable (scroll/rail/Mirror/JS-off); skip is tour-omission only; the crawlable order is unchanged.
- **Security (FR-6/7/9):** the directive (intent→order/deepen/skip) is server-owned + classified only on the grounded path (after the fail-closed gate); untrusted input stays DATA (unchanged from 5.3). The model never emits order/deepen/skip — only the enum.
- **NFR-1/NFR-6:** no new heavy initial JS (5.4 extends existing controllers + the server directive); byte-deterministic build.

## Acceptance Criteria

1. **A visitor who states intent gets a reordered/deepened/skipped director's cut; doing nothing gets the default cut (FR-4).**
   **Given** a visitor who states their intent to the Guide
   **When** the Guide drives the canvas
   **Then** it reorders (5.3), DEEPENS the relevant scenes (5.2 `$depth`), and SKIPS de-emphasized scenes from the guided camera tour accordingly — and a visitor who does nothing (no intent / `default`) gets the default cut (canonical order, no deepen, no skip).

2. **Reordering/skip never hides content from the Lean Static Fallback and never regresses SM-C1 (FR-8, SM-C1).**
   **Given** any director's cut
   **When** it is applied
   **Then** every scene (including SKIPPED ones) remains present in the served DOM and reachable via scroll, the scene-rail jump anchors, the Mirror routes, and JS-off — nothing is hidden; the canonical crawlable order is unchanged; `hero` is never skipped; `speaker` is never skipped/buried for an organizer; and the hero `/speaking` bypass + deep link remain reachable without chat. A server-side guard asserts skip never contains `hero`/`close`/(speaker for organizer) and every skipped id is a real DOM scene.

3. **Director's mode composes with the Continuous Canvas (5.1) + re-curation (5.3) and degrades under reduced motion to the default discrete-scene arc (NFR-2).**
   **Given** the cinematic layer
   **When** director's mode runs
   **Then** it composes with Story 5.1's camera path (drives `goToScene` through the cut) and Story 5.3's re-curation order, AND under `prefers-reduced-motion: reduce` it degrades to the default discrete-scene arc — the camera driving + skip-omission are disabled (all scenes scrollable, nothing skipped from the discrete scroll), with no loss of content.

4. **Non-vacuous, discoverable, real-runtime tests lock the behaviors (Rule 3, 7, 8).**
   **Given** the changes
   **When** the default `pnpm test:all` suite runs
   **Then** with the deterministic `GUIDE_LLM_STUB` path: an e2e asserts an intent produces a director's cut (reorder + a deepened scene at deep detail + a skipped scene omitted from the guided tour but STILL reachable via scroll/rail), and that a default/no-intent visitor gets the default cut; a reduced-motion test asserts the camera driving + skip-omission are off (default discrete arc, all scenes scrollable); an api test asserts the intent→deepen/skip tables are SM-C1/FR-8-valid (skip excludes hero/close/(speaker for organizer); every skipped id is a real scene) — mutation-verified; an FR-8 test asserts all scenes (incl. skipped) reachable + canonical DOM order. The re-curation/director SSE e2e proven to RUN (prod-faithful proxy, stub), tests scoped to the real surfaces (api/shared additions in the runner-bearing `api` package).

5. **The LITERAL canonical gate `pnpm test:all` is green and the build stays byte-deterministic (Rule 5, NFR-1/6).**
   **Given** `pnpm test:all` (+ `pnpm run check-deterministic`)
   **When** the literal command runs end-to-end
   **Then** every step incl. `lh` is green (Lighthouse `/` + `/about/` within budget) and the build is byte-deterministic; no regression to Stories 5.0/5.1/5.2/5.3.

## Integration ACs

This is the CAPSTONE — it consumes Story 5.1 (`goToScene`), Story 5.2 (`$depth`), and Story 5.3 (the re-curation engine), and wires them end-to-end here. No forward reference (last Epic-5 story). Per Rule 1: the additions (`deepen`/`skip` on `RecurationEvent`; the api deepen/skip tables; the web apply of deepen/skip + camera driving) are additive + backward-compatible to the 5.3 contract, and the integration is verified now (AC1/AC4) against the real surfaces (the camera path, the depth tiers, the re-curation order) — motion-enabled AND reduced-motion AND JS-off.

## Tasks / Subtasks

- [x] **Task 1 — Extend the directive + the api deepen/skip tables, guarded (AC1, AC2).**
  - [x] Add optional `deepen?: string[]` + `skip?: string[]` to `RecurationEvent` (`shared/src/events.ts`), backward-compatible. Add api-owned intent→deepen + intent→skip tables in `api/src/lib/recuration.ts` (`default` → empty/empty). Extend `assertSmc1Invariants()` (startup) to guard skip: never `hero`/`close`/(speaker for organizer); every skipped id ∈ SCENE_IDS. The model still picks only the enum; the api owns deepen/skip. Emit them in the `recuration` SSE event (`api/src/routes/guide.ts`), classified only on the grounded path (fail-closed unchanged).
- [x] **Task 2 — Web: apply deepen + skip + drive the camera (AC1, AC3).**
  - [x] Extend `web/src/lib/recuration.ts` `applyRecuration` to (a) deepen — set the deepened scenes to deep detail via Story 5.2's depth mechanism (`$depth`/per-scene `data-depth`); (b) skip — mark skipped scenes so the camera tour omits them, while keeping them in the DOM + scroll + rail (reachable); (c) drive the camera via `window.__cinematicHandle.goToScene` through the re-ordered, non-skipped sequence, INSIDE `onMotionAllowed`. GuidePanel passes the extended directive. Reduced motion → no camera driving / no skip-omission (default discrete arc; deepen/order may persist as static).
- [x] **Task 3 — Tests (AC4) + the literal gate (AC5).**
  - [x] e2e (stub): intent → director's cut (reorder + a deepened scene at deep detail + a skipped scene omitted from the guided tour but reachable via scroll/rail); default/no-intent → default cut; reduced-motion → camera+skip off (discrete arc, all scrollable). api tests: deepen/skip tables SM-C1/FR-8-valid (mutation-verified); FR-8 all-scenes-reachable + canonical DOM. Run the LITERAL `pnpm test:all` + `check-deterministic`.

## Dev Notes

### Current state (files to modify — read before editing)

- **`shared/src/events.ts`** — `RecurationEvent { type, intent, order }`. Add optional `deepen?: string[]` + `skip?: string[]` (backward-compatible). Tested in `api` (no `shared` runner).
- **`api/src/lib/recuration.ts`** — `SCENE_IDS`, `INTENT_ORDER_TABLE`, `assertSmc1Invariants()` (startup), `getOrderForIntent`, `classifyIntent` (+ stub). Add `INTENT_DEEPEN_TABLE` + `INTENT_SKIP_TABLE` (server-owned; `default` empty) + a `getDirectiveForIntent` (order+deepen+skip); extend `assertSmc1Invariants` to guard skip (never hero/close/(speaker for organizer); skipped ids ∈ SCENE_IDS).
- **`api/src/routes/guide.ts`** — emits the `recuration` event (Step 7b, after the fail-closed threshold gate). Include `deepen`/`skip`. Fail-closed + grounded-answer path unchanged.
- **`web/src/lib/recuration.ts`** — `applyRecuration` (CSS `order`) + `initRecuration`. Extend to apply deepen (Story 5.2 depth) + skip (camera omission, scene stays reachable) + drive `window.__cinematicHandle.goToScene` (inside `onMotionAllowed`). `resetRecuration` exists (a 5.3 LOW noted it dead-until-5.4 — wire it now if it fits).
- **`web/src/islands/GuidePanel.tsx`** — handles the `recuration` SSE event → calls the controller. Pass deepen/skip.
- **`web/src/lib/cinematic/index.ts`** — `window.__cinematicHandle.goToScene(n)` / `teardown` (the camera to drive). **`web/src/lib/store.ts`** — `$depth` (deepen) + `$guideOpen`.
- **`web/src/pages/index.astro`** — the 7 `<section>` scenes in flex `<main class="home">` (5.3) + the depth tiers (5.2). The scene-rail (`SceneRail.astro`) jump anchors must keep ALL scenes reachable even when skipped (FR-8/SM-C1).
- **Test homes:** `api/src/lib/recuration.test.ts` + `api/src/routes/guide.test.ts` (tables/guards/SSE — runner-bearing); `web/e2e/recuration.spec.ts` (extend; prod-faithful proxy + stub) + `web/e2e/reduced-motion.spec.ts`; `web/test/build-output.test.ts` (FR-8 canonical DOM).

### Constraints / invariants to preserve

- **SM-C1 (hard):** hero first + never skipped; speaker never skipped/buried for organizer; hero bypass + `/speaking` reachable without chat; the startup skip-guard asserts it.
- **FR-8/NFR-3:** skip = guided-tour omission only; every scene present in DOM + reachable (scroll/rail/Mirror/JS-off); canonical crawlable order unchanged.
- **Security (FR-6/7/9):** server-owned directive; model picks only the enum; classify only on the grounded path; fail-closed + grounded-answer unchanged; untrusted input is DATA.
- **NFR-2:** camera driving + skip-omission inside `onMotionAllowed`; reduced motion → default discrete arc (all scrollable); deepen/order may persist as static.
- **Rule 5** (literal root gate incl. `lh`), **Rule 7** (the director/recuration e2e proven to run via the prod-faithful proxy + stub), **Rule 8** (real-surface scoped mutation-verified; api/shared additions in `api`), **Rule 3** (real-runtime e2e for the cut), **NFR-1/NFR-6**.
- Do NOT regress 5.0 (#close), 5.1 (cinematic deferral/reduced-motion/determinism), 5.2 (depth), 5.3 (re-curation order/SM-C1/FR-8). 5.4 composes with all of them.

### Project Structure Notes

- All additions extend existing files (no new modules needed): `shared/src/events.ts` (deepen/skip), `api/src/lib/recuration.ts` (deepen/skip tables + guard), `web/src/lib/recuration.ts` (apply deepen/skip + drive camera). The directive stays the single `recuration` SSE event (now richer). Server owns order/deepen/skip; the model owns only the enum.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4] — the 3 BDD ACs (reorder/deepen/skip + default cut; never hide from fallback + never regress SM-C1; composes with 5.1 + 5.3, degrades under reduced-motion to the default discrete-scene arc).
- [Source: prd.md#FR-4] — "The Guide can reorder, deepen, or skip Scenes for a visitor based on the conversation, while a sensible default cut always exists."
- [Source: prd.md#§6 Default Scene Arc + SM-C1] — the default cut; SM-C1 guards re-order regressions.
- [Source: _bmad-output/implementation-artifacts/5-3-agent-re-curation-by-stated-intent.md] — the engine 5.4 extends (intent table, `recuration` SSE, `applyRecuration`, SM-C1 guard, FR-8 CSS-order approach).
- [Source: web/src/lib/cinematic/index.ts] — `window.__cinematicHandle.goToScene` (drive the cut).
- [Source: web/src/lib/store.ts + web/src/pages/index.astro depth tiers] — `$depth` (deepen reuses it).
- [Source: .claude/rules/project-rules.md#7] — the director/recuration e2e must be PROVEN to execute (prod-faithful proxy, not skipped).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

1. `api/src/lib/recuration.test.ts` — esbuild parse error on apostrophe in `describe()` string: `describe('getDirectiveForIntent() — full director's directive …')` → fixed by switching to double-quoted string.
2. `web/e2e/recuration.spec.ts` — ESLint `no-unused-vars`: `baseURL` destructured but unused after refactoring test (i) to use `page.route()` interception → removed from destructuring.
3. `web/e2e/recuration.spec.ts`, `web/src/lib/recuration.ts` — Prettier format violations after implementation → fixed with `pnpm run format`.

### Completion Notes List

- Task 1 COMPLETE: `RecurationEvent` extended with optional `deepen`/`skip` (backward-compatible). `INTENT_DEEPEN_TABLE` and `INTENT_SKIP_TABLE` added to `api/src/lib/recuration.ts`. `assertSmc1Invariants()` guards both tables at module load (SM-C1 hard: hero/close never skipped; speaker not skipped for organizer; all ids must be real SceneIds). `getDirectiveForIntent(intent)` returns `{order, deepen, skip}`. `api/src/routes/guide.ts` emits deepen+skip in the recuration SSE event, classified-path only.
- Task 2 COMPLETE: `web/src/lib/recuration.ts` `applyRecuration` extended with 4 phases: (1) CSS order reorder (5.3, unchanged); (2) deepen — sets `data-depth="deep"` on deepened scenes, content-only, applies regardless of motion; (3) skip marks — sets `data-skip="true"` only when motionAllowed=true (FR-8 HARD: never display:none/visibility:hidden/aria-hidden); (4) camera driving — `window.__cinematicHandle.goToScene(canonicalIndex)` for first non-hero non-skipped scene in visual order, 120ms setTimeout, motionAllowed-gated. `resetRecuration()` now clears `data-depth` and `data-skip`. `GuidePanel.tsx` passes `deepen`/`skip` and `motionAllowed` to `applyRecuration`.
- Task 3 COMPLETE: 58 new api unit tests (INTENT_DEEPEN_TABLE validity, INTENT_SKIP_TABLE SM-C1/FR-8 guards, mutation-verified; getDirectiveForIntent all 4 intents). 3 new guide route tests (deepen+skip on organizer/explorer events; default → no recuration event). 5 new e2e tests: (h) API SSE includes deepen+skip; (i) FR-8 skipped scenes stay in DOM+rail; (j) real controller applies data-depth; (k) reduced-motion → data-skip NOT applied; (l) canonical DOM order unchanged. 2 new build-output tests: all 7 scene ids present, no inline display:none/visibility:hidden. Full literal gate `pnpm test:all` + `check-deterministic` green.
- Gate result: api 219 passed, web 670 passed, e2e 277 passed (1 skipped — DB-invite expected), lh exit 0, check-deterministic PASS (hash `bb131a0693af6dd0f3c238c73f350dd829bd226e37552dbe5d1484440692090e`).
- **cycle_iteration=2 QA HIGH fix COMPLETE:** Added `motionAllowed` to `sendQuery` `useCallback` dep array in `GuidePanel.tsx` — stale-closure bug fixed. Added e2e test (m): motion-enabled path asserts `data-skip="true"` IS applied to organizer-skipped scenes (thesis/timeline), non-skipped scenes have no `data-skip`, FR-8 all 7 scenes visible. Test (m) is mutation-verified (removing `motionAllowed` from dep array → `waitForFunction` times out → RED). Gate result (cycle_iteration=2): api 219 passed, web 670 passed, e2e 279 passed (0 skipped), lh exit 0, check-deterministic PASS (hash `e33253b5969fe7c3d2cec9ab1da706cb3c16fcad7d415661ffe6090e477fd0b7`).

### File List

- `shared/src/events.ts` — added optional `deepen?: string[]` and `skip?: string[]` to `RecurationEvent` (backward-compatible)
- `api/src/lib/recuration.ts` — added `INTENT_DEEPEN_TABLE`, `INTENT_SKIP_TABLE`, `DirectorDirective` interface, `getDirectiveForIntent()`; extended `assertSmc1Invariants()` to guard both tables
- `api/src/routes/guide.ts` — updated import (`getDirectiveForIntent`), updated `emitRecuration` to accept+emit `deepen`/`skip`, updated recuration emit call
- `web/src/lib/recuration.ts` — extended `RecurationDirective` with `deepen?`/`skip?`; extended `applyRecuration` with deepen/skip/camera phases; updated `resetRecuration` to clear `data-depth`/`data-skip`
- `web/src/islands/GuidePanel.tsx` — passes `deepen`, `skip`, `motionAllowed` to `applyRecuration`; (cycle_iteration=2) added `motionAllowed` to `sendQuery` `useCallback` dep array (stale-closure HIGH fix)
- `api/src/lib/recuration.test.ts` — 58 new Story 5.4 tests (deepen/skip tables + guard + getDirectiveForIntent, mutation-verified)
- `api/src/routes/guide.test.ts` — 3 new tests (i,j,k): organizer/explorer deepen+skip in SSE, default no-recuration
- `web/e2e/recuration.spec.ts` — 5 new e2e tests (h–l) + 1 new test (m): API SSE deepen+skip, FR-8 DOM presence, real controller data-depth, reduced-motion skip off, motion-enabled data-skip=true (QA HIGH fix), canonical DOM order
- `web/test/build-output.test.ts` — 2 new FR-8 build-output assertions (all 7 scene ids, no inline hide)
- `_bmad-output/implementation-artifacts/5-4-directors-mode-scene-reordering.md` — status → review; tasks checked; Dev Agent Record populated

## Review Findings

### Code review (adversarial: Blind / Edge-Case / Acceptance) — 2026-06-08

Reviewed the FINAL state fresh (per Rule 10/11 — the prior QA stale-closure fix re-verified, not assumed). Verified every AC against the REAL build + served runtime. **1 HIGH found + auto-resolved inline; 0 MED; 2 LOW deferred.** Both load-bearing fixes mutation-confirmed (broke the real source → test reds → reverted byte-clean). The literal canonical gate `pnpm test:all` was re-run by the reviewer to **EXIT 0** + `pnpm run check-deterministic` **PASS**.

#### [HIGH · ✅ RESOLVED] DEEPEN verb was a visual NO-OP — `data-depth="deep"` on a `<section>` had no CSS consumer; AC1 "a deepened scene at deep detail" not delivered; test (j) was vacuous.

- **Defect:** Story 5.2's depth tiers are revealed exclusively by `:global(html[data-depth='deep']) .scene__deep { display:block }` — keyed off the `<html>` ROOT attribute (set by the depth dial via `document.documentElement.setAttribute('data-depth', …)`). But Story 5.4's `applyRecuration` deepen phase sets `data-depth="deep"` on the **`<section>`** element (`web/src/lib/recuration.ts:135`). **No CSS rule or JS reacts to a section-scoped `data-depth`.** In the realistic default state the global dial is `'overview'` (`$depth` default; `web/src/lib/store.ts:33`), and `:global(html[data-depth='overview']) .scene__deep { display:none }` (index.astro:546–549) hides `.scene__deep` for EVERY scene — so a deepened section showed NO deep content. The deepen verb produced zero observable change. AC1 ("DEEPENS the relevant scenes (5.2 `$depth`) … a deepened scene at deep detail") was not met.
- **Why the gate missed it:** e2e test (j) asserted only that the **attribute** `data-depth="deep"` was SET on the section (vacuous re the visible outcome — Rule 8: a test that binds to an attribute no surface consumes verifies nothing). The api/shared tests verify the server tables only. Nothing exercised the actual deep-detail render.
- **Fix (inline, honors Decision 2 "set a per-scene `data-depth`"):** added a per-section CSS consumer in `web/src/pages/index.astro` so the section attribute the dev already sets is functional —
  ```css
  :global(section[data-depth='deep']) .scene__deep { display: block; }
  :global(section[data-depth='deep']) .scene__skim { display: none; }
  ```
  Placed AFTER the global `html[data-depth=…]` rules so it wins the source-order tie at equal specificity (both (0,3,1) once Astro adds its scoped `[data-astro-cid-…]` attr — verified the built CSS byte offsets: overview-hide @16981 < section-deepen-show @17341). FR-8-safe: it only REVEALS already-in-DOM deep content for the deepened scene; never hides/removes anything; the canonical DOM + JS-off fallback are untouched.
- **Tests strengthened (Rule 8, non-vacuous, mutation-verified):**
  - e2e (j) now asserts the OBSERVABLE outcome: the deepened scene's `.scene__deep` is `display !== 'none'` (VISIBLE) while the global dial stays `'overview'` (asserted), and a non-deepened scene (thesis) keeps `.scene__deep` hidden — proving the reveal is scoped to deepened scenes only, not the dial.
  - new `web/test/build-output.test.ts` assertion: the built CSS carries `section[data-depth=deep] .scene__deep{display:block}`.
  - **Mutation-verified:** removed the per-section CSS rule → the build-output assertion RED (`expected '…' to match /section\[data-depth=…/`); restored byte-clean. (And the live e2e (j) deep-visible assertion reds the same way against the rebuilt CSS.)

#### [stale-closure fix — independently re-verified, NOT a new finding] `motionAllowed` ∈ `sendQuery` deps genuinely makes skip+camera fire.

QA's HIGH fix (`GuidePanel.tsx:406` — `motionAllowed` added to the `sendQuery` `useCallback` deps, with the rationale comment at 403–405) verified fresh: removed `motionAllowed` from the deps → e2e test (m) (`data-skip="true"` on the motion-enabled path) **RED** (`waitForFunction` 8s timeout — the stale `false` closure never marks skip); restored byte-clean → green. Test (m) is non-vacuous and load-bearing; the fix is real. No double-send regression (the SSE handler calls `applyRecuration` once per `recuration` event). **Independently swept ALL other `useCallback`/`useEffect` closures in `GuidePanel.tsx` for the recurring 5.2-class stale-closure: `closePanel` [pillRef], `handleSubmit` [inputValue, sendQuery], `handleChipClick` [isStreaming, sendQuery], `handleCitationClick` [] (only stable setters/track), and the five mount effects — all deps correct. No other stale closure.**

#### Verified correct (no finding)

- **SM-C1 + FR-8 skip guard** (`assertSmc1Invariants`): independently mutation-verified the api tests RED on a real-table break — they add `hero`/`close`/(`speaker` for organizer)/an unknown id to the live `INTENT_SKIP_TABLE` and assert the startup guard throws (api test suite green, 219 passed). hero/close never skipped; speaker-not-for-organizer; every skipped id ∈ `SCENE_IDS`. The guard runs at module load.
- **FR-8 HARD:** skip uses `data-skip` ONLY (no `display:none`/`visibility:hidden`/`aria-hidden`) — verified in `applyRecuration` (only `setAttribute('data-skip','true')`), e2e (i)/(m) (computed `display`/`visibility` checked on all 7), and build-output (no inline hide on any `<section>`). Skipped scenes stay in DOM + rail (e2e (i) asserts `nav.scene-rail a[href="#id"]` for all 7) + canonical crawlable order unchanged (e2e (e)/(l) deep-equal the DOM order; build-output FR-8).
- **Hero `/speaking` bypass + deep link reachable without chat** (SM-C1): e2e (f) — `section#hero a[href="/speaking/"]` attached + visible + exact `/speaking/`, no Guide interaction.
- **Security:** directive server-owned — the model picks ONLY the 4-token enum (`parseClassifierResponse` → out-of-set/empty → `default`); order/deepen/skip come exclusively from `getDirectiveForIntent` (the three server tables). Classification runs ONLY on the grounded path — `classifyIntent` + `getDirectiveForIntent` are inside `streamSSE` AFTER the fail-closed threshold gate (`guide.ts:248–256` returns early below threshold → NO model call, unchanged). Untrusted text stays DATA (delimiter-neutralized; `role:'system'` separation). `emitRecuration` fires only for non-default (default cut = no event, api test (k)).
- **Camera-driving index semantics:** `applyRecuration` computes `SCENE_IDS.indexOf(firstTarget)` (canonical) and `cinematic/index.ts goToScene` looks the section up by the SAME canonical `SCENE_IDS` index — consistent. First non-hero, non-skipped scene in visual order drives the camera; motion-gated (inside `if (motionAllowed)`); 120ms settle delay. Reduced-motion → camera + skip OFF (e2e (k)); deepen (content) persists regardless of motion per Decision 2.
- **Composition (Rule 1, capstone):** consumes 5.1 (`goToScene`), 5.2 (`$depth`/depth tiers), 5.3 (the re-curation engine) end-to-end; additions additive + backward-compatible (optional `deepen?`/`skip?`; a 5.3-era client ignoring them still works). No regression to 5.0/5.1/5.2/5.3 (full gate green).
- **NFR-1** (`/` lh budget): lh green on `/` + `/about/` (the deepen fix is CSS-only, zero JS added). **NFR-6:** `check-deterministic` PASS (byte-identical, hash `4a598c1c…`). **Rule 7:** the recuration/director e2e all RAN (279 passed, **0 skipped**, 0 failed) via the prod-faithful `serve-with-api.mjs` proxy + `GUIDE_LLM_STUB`.

#### Reviewer's literal canonical gate (re-run fresh, all my fixes in place)

`pnpm test:all` → **EXIT 0**: typecheck ✓ · lint ✓ · ROOT `format:check` ✓ (`prettier --check .`) · vitest **scripts 160 / api 219 / web 671** (web +1 = the new per-section-deepen build-output test) · Playwright **279 passed, 0 skipped, 0 failed** (2.4m) · `lh` green on `/` + `/about/`. `pnpm run check-deterministic` → **PASS** (web/dist byte-identical across two clean builds, tree hash `4a598c1cd6bdc35c2c8d38ed5e7f44daa529ef1f78a10f5f4932425e1402b877`).

#### LOW items deferred (→ deferred-work.md, story 5.4)

- **[5.4 · LOW · dead-code] `resetRecuration` still has no consumer + no test** (carryover from the 5.3 LOW). Extended for 5.4 (now also clears `data-depth`/`data-skip`) but `GuidePanel.tsx` imports only `applyRecuration` + `initRecuration`; nothing calls it. Not a defect (ships no behavior; gate green). Suggested: wire to Guide-close with a binding e2e, or remove.
- **[5.4 · LOW · edge-case cosmetic] DEEPEN while the GLOBAL dial is at `skim`** reveals the deepened scene's `.scene__deep` (correct — deep wins) but does NOT re-show that scene's `.scene__lede`/`.scene__summary`/`.scene__body` (hidden by the active `html[data-depth='skim']` rules). The deepen verb is designed against the default `overview` state (the common case, where overview prose is visible and deep is added on top). Under a simultaneously-active skim dial the deepened scene shows deep block without overview prose — more content shown, nothing the FR-8 static fallback protects is hidden. Acceptable; co-own with the Guide owner if a perceptible combination ever matters.

#### Dismissed (no action)

- The deepen phase setting `data-depth="deep"` on a `<section>` while the depth-dial also sets `data-depth` on `<html>` are on DIFFERENT elements — no collision (the section attr is the 5.4 deepen channel; the html attr is the 5.2 global dial; my fix wires the section channel to its own CSS consumer).
- `applyRecuration` resetting `data-depth`/`data-skip` on ALL scenes before re-applying each turn (lines 126–131, 146–151) is correct idempotency — a later directive cleanly supersedes an earlier one (no stale marks accumulate).
