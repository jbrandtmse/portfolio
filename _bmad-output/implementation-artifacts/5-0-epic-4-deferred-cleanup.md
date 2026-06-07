# Story 5.0: Epic 4 Deferred Cleanup — scene-rail bottom-of-page `aria-current` hardening & Guide `threadContext` per-turn length bound

---
baseline_commit: 484e4fecac12b32673e2381d9e630b22bddd02d6
---

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Created by the /epic-cycle retro-review gate (Epic 4 → Epic 5), 2026-06-07. Cleanup story; NOT in epics.md.
     Absorbs the two open deferred-work.md items that pre-empt a class of bug in the NEW Epic-5 surfaces:
       INCLUDED: [1.4]+[1.9] SceneRail #close bottom-of-page aria-current nuance — de-risks Story 5.1's
                 Continuous-Canvas scroll/observer rework (5.1 layers a cinematic camera path over the SAME
                 discrete scene-rail that remains the reduced-motion fallback; a correct discrete base first);
                 [4.3 latent] GuideQuery.threadContext[].content has no per-turn .max() bound — de-risks
                 Stories 5.3 (agent re-curation) + 5.4 (director's mode), the NEW Guide consumers that drive
                 more multi-turn conversation through the SAME /api/guide endpoint.
     Both were explicitly pre-triaged "DEFER → Epic 5 / → the new Guide consumers" by Story 4.0's appendix
     ([1.4]/[1.9] row: "DEFER → Epic 5 ... the cinematic scroll/observer rework"; [4.3] threadContext: the
     deferral named "Story 4.4 OR when the endpoint is exposed beyond the island" — 4.4 shipped without it,
     and Epic 5's re-curation/director's-mode are exactly that wider exposure). They come due now.
     DEFERRED (stay tracked in deferred-work.md): all launch-gated, telemetry-gated, latent-on-untouched-surface,
     and owner-decision items — full triage table appended at the end of this file.
     DROPPED: already-resolved / moot items (footer band, byte-identical wording, 3.5 tracking drift). -->

## Story

As the site owner (Josh),
I want the two Epic-5-relevant latent footguns cleared before the Stage-2 stories build on top of them — (1) the discrete scene-rail's semantic `aria-current` made to reliably reach the final `#close` scene at the very bottom of scroll (today a short final section can fail to cross the IntersectionObserver's narrow active band, so `aria-current` + "Scene N of 7" stick on the second-to-last scene), and (2) the Guide's `threadContext` prior-turn content bounded per turn in the shared `GuideQuery` contract (today only the turn COUNT is capped — content length is unbounded),
so that Story 5.1's Continuous-Canvas camera path is layered over a scene-rail whose reduced-motion/discrete fallback already tracks the current scene correctly end-to-end, and Stories 5.3 (agent re-curation) + 5.4 (director's mode) — the new consumers that drive richer multi-turn conversation through the same `/api/guide` endpoint — inherit a prompt-size-bounded contract rather than re-learning the unbounded-content footgun the hard way.

## Context & decision (read first)

This is the `/epic-cycle` Epic-4 → Epic-5 retro-review cleanup story. The full triage of every still-open deferred-work item + Epic-4 retro action item is in the **Appendix** at the end of this file. **Two** items are **INCLUDED** here; the rest **DEFER** to their natural Epic-5 feature stories, to launch, to telemetry (NFR-7), or to later epics/owner decisions, or are **DROPPED** as already-resolved or moot.

Both included items were pre-triaged **"DEFER → Epic 5 / → the new Guide consumers"** by Story 4.0's appendix (the `[1.4]/[1.9]` #close row and the `[4.3]` threadContext deferral). They come due now because **Epic 5 is the cinematic-canvas + adaptive-Guide epic**:

- **Story 5.1 (Continuous Canvas)** rebuilds scene navigation as a directed camera path and, under `prefers-reduced-motion`, **degrades to the Stage-1 discrete Scenes** — i.e. the *same* `SceneRail` discrete observer remains the reduced-motion fallback. Fixing the `#close` bottom-of-page nuance now means 5.1 builds the cinematic layer over a discrete base that is already correct, and 5.1's reduced-motion AC (instant section changes, no loss of content/affordance) inherits a working last-scene highlight. The deferral itself named Epic 5 as the home ("the cinematic scroll/observer rework where the active-band heuristic is revisited"). The fix is small, self-contained, and not naturally owned by a 5.1–5.4 *feature* story (it touches existing Epic-1 `SceneRail.astro`).
- **Stories 5.3 (agent re-curation) + 5.4 (director's mode)** are new consumers of `/api/guide` that drive the visitor through more conversational turns (re-curation responds to stated intent; director's mode reorders/deepens scenes via the Guide). They send `threadContext` through the **same shared `GuideQuery`** contract. Bounding per-turn content now (a 1-line Zod `.max()` + a rejection test) gives those stories a prompt-size-safe base. The `[4.3]` deferral explicitly suggested resolving it "in Story 4.4 (or when the endpoint is exposed beyond the island)" — 4.4 shipped without it, and Epic 5's re-curation/director's-mode is exactly that wider exposure.

Both are small, low-risk, isolated, and clear a class of bug before the Stage-2 feature work lands on these surfaces.

### Included item 1 — SceneRail `#close` may not receive `aria-current` at the bottom of scroll (`[1.4 · LOW]` + `[1.9 · LOW]`)

`web/src/components/scene/SceneRail.astro` (the `onMotionAllowed` `<script>`, lines ~504–552) tracks the current scene with an `IntersectionObserver`:

```ts
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) setActive(entry.target.id);
    }
  },
  { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
);
for (const section of sections) observer.observe(section);
```

The `rootMargin: '-30% 0px -60% 0px'` makes the "active" band only the 30–40% vertical slice of the viewport. A **short final section (`#close`) at the document bottom** can fail to cross that band before the page bottoms out — so the semantic `aria-current` (and the "Scene N of 7" number, set in `setActive`) can stick on the second-to-last scene even when the visitor has scrolled to the very end. `setActive(id)` already moves `aria-current` + the `[data-scene-current]` label number; only the *trigger* for the last scene at page-bottom is missing.

This is enhancement-quality (the JS Layer-2 half of the two-layer gate). The **static/JS-off baseline is unaffected and correct** (`aria-current` on `#hero`, static meter, all anchors + the `href="#close"` skip control followable JS-off) — so this is NOT an AC/floor failure today. It is also gated by `onMotionAllowed()` and must stay so (no-op under reduced motion).

**Decision — add a bottom-of-page fallback that activates the LAST scene when the document is scrolled (near) its foot**, inside the existing `onMotionAllowed` init (so it stays under the ONE shared gate, and no observer/handler is created under reduced motion). Behavior is the AC: scrolling to the very bottom puts `aria-current` (and "Scene N of N") on the `#close` rail entry; interior scenes continue to track as today. **Mechanism is the dev's call**, but pick one that does NOT introduce scroll-jacking and keeps the component's "no scroll-handler churn / scroll-native" invariant intact — recommended options:
- a **page-foot sentinel** element observed by a second (or the same) `IntersectionObserver` (cleanest — stays observer-based, no scroll handler); or
- a **passive** `scroll`/`resize` listener that calls `setActive(lastId)` when `window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - EPSILON` (small epsilon, e.g. 2px). Use `{ passive: true }`; never `preventDefault`.

Reuse the existing `setActive` + `order` (the last id is `order[order.length - 1]` === `'close'`). Do NOT change the interior `rootMargin` heuristic (it tracks interior scenes correctly — re-confirmed by the normal pass that `aria-current` moves off `#hero`).

### Included item 2 — `GuideQuery.threadContext[].content` is not length-bounded per turn (`[4.3 · LOW latent]`)

`shared/src/schemas.ts:40-47` — the multi-turn contract caps the turn COUNT but not per-turn content length:

```ts
export const GuideQuery = z.object({
  query: z.string().trim().min(1).max(1000),
  threadContext: z
    .array(
      z.object({
        role: z.enum(['user', 'guide']),
        content: z.string(),          // <-- no .max(): unbounded per turn
      }),
    )
    .optional(),
});
```

Only the turn count is bounded downstream (`MAX_THREAD_TURNS = 6` in `api/src/lib/grounding.ts:116`, applied via `threadContext.slice(-MAX_THREAD_TURNS)`). A client could send up to 6 turns of very large `content`, inflating the assembled prompt well beyond the implicit budget the `query.max(1000)` cap suggests. Today `threadContext` is constructed only by our own GuidePanel island (Story 4.4) and the count cap + same-origin guard + per-IP rate-limit bound abuse — so this is NOT a current defect. But Epic 5's re-curation (5.3) / director's-mode (5.4) drive more turns through the same endpoint, so bounding it now is the right pre-emptive hardening.

**Decision — add a per-turn `.max()` to `threadContext[].content` in the shared `GuideQuery` schema**, sized consistently with the `query` cap (recommended `.max(2000)` — the deferral's own suggestion; large enough for any genuine prior turn, small enough to bound the assembled prompt: 6 × 2000 + query 1000 is a sane ceiling). This is a contract tightening in `shared/`, the single cross-package source of truth (consumed by api's `/api/guide` body validation). It is **backward-compatible** for the real GuidePanel client (its turns are short answers/questions, well under 2000 chars — verify the existing guide e2e + the 4.4 island flow still pass).

**Critical test-home note (Rule 8 discoverability):** the `shared` package has **NO test runner** — `shared/package.json` declares only `typecheck`, so the root `pnpm test` (`pnpm -r --if-present run test`) does NOT execute any `shared/**/*.test.ts`. The Zod-rejection test for the new bound MUST live in a package the default suite runs — the **`api`** package, which already exercises `GuideQuery`/`threadContext` in `api/src/lib/grounding.test.ts` (and the route in `api/src/routes/guide.test.ts`). Add the rejection test there (assert: a `threadContext` turn with `content` longer than the cap fails `GuideQuery.safeParse`; a turn at/under the cap passes; the existing valid-shape cases stay green). Importing the REAL `GuideQuery` from `@portfolio/shared` (not an inline copy) satisfies Rule 8.

## Acceptance Criteria

1. **SceneRail's last scene (`#close`) reliably receives `aria-current` + the "Scene N of 7" number at the bottom of scroll (motion-enabled).**
   **Given** motion is enabled (the `onMotionAllowed` Layer-2 enhancement runs) and the visitor scrolls to the very bottom of the home page
   **When** the document is at (or within a small epsilon of) its scroll foot
   **Then** the `#close` rail entry has `aria-current="true"` and the `[data-scene-current]` label reads the last scene number (`7`), and **no other** rail entry retains `aria-current`
   **And** interior scenes continue to track as before (the `rootMargin` heuristic is unchanged; `aria-current` still moves off `#hero` as the visitor scrolls down).

2. **The static / reduced-motion / JS-off baseline is unchanged (NFR-2, NFR-1).**
   **Given** `prefers-reduced-motion: reduce` OR JS disabled
   **When** the home page loads
   **Then** the bottom-of-page fallback creates **no** observer/listener (it lives inside `onMotionAllowed`, which no-ops under reduced motion), the static baseline stands exactly as authored (`aria-current` on `#hero`, static filled meter at "Scene 1 of 7", `href="#close"` skip + all anchors followable), and the page ships **no new executable JS by default** beyond the existing inlined scene-rail script (NFR-1 — the build-output suite's script-count assertions still hold). The fallback **never** scroll-jacks (no `preventDefault`; any listener is `{ passive: true }`).

3. **`GuideQuery.threadContext[].content` is bounded per turn, enforced by the real shared contract.**
   **Given** the shared `GuideQuery` schema consumed by `POST /api/guide`
   **When** a request carries a `threadContext` turn whose `content` exceeds the per-turn cap
   **Then** `GuideQuery` validation **rejects** it (the existing endpoint 400/validation path), while a turn at/under the cap and all current valid shapes still pass — and the real GuidePanel client flow (Story 4.4) is unaffected (its short turns are well under the cap; the existing guide + guide-panel e2e stay green).

4. **Non-vacuous, discoverable tests lock both behaviors.**
   **Given** the two changes above
   **When** the default `pnpm test:all` suite runs
   **Then** (a) a test asserts the bottom-of-scroll `#close` activation — exercised against the **real** SceneRail runtime (e2e: scroll the built home to the foot, assert `aria-current` on the `#close` rail entry + the label number) — and (b) a test in the **`api`** package asserts the real `GuideQuery` rejects an over-cap `threadContext` turn and accepts an at-cap one — both **scoped** to the real module/behavior (project-rules Rule 8: exercise the REAL module, scope the assertion), discoverable by the default suite (correct naming/location, not ignored, and NOT placed in the runner-less `shared` package), and **mutation-verified non-vacuous** (removing the bottom-of-page fallback reds the e2e; removing the `.max()` reds the api rejection test).

5. **The LITERAL canonical gate `pnpm test:all` is green end-to-end, and the build stays byte-deterministic (Rule 5, NFR-1, NFR-6).**
   **Given** the canonical launch gate `pnpm test:all` (= `typecheck && lint && format:check && test && test:e2e && lh`) plus the separate NFR-6 check `pnpm run check-deterministic`
   **When** the **literal `pnpm test:all` command** runs end-to-end after the change (NOT a hand-narrowed package-scoped subset — the Rule 5 anti-pattern)
   **Then** every step including `lh` is green, `prettier --check .` / `eslint` cover the changed `.astro` / `.ts` / test files, the 0-executable-JS-by-default floor is unaffected (NFR-1; the only client JS touched is the already-inlined, reduced-motion-gated scene-rail enhancement), and the build is byte-deterministic across two clean builds (`check-deterministic`, NFR-6 — the schema change is api/shared-only and the SceneRail change adds only gated runtime JS, so `web/dist` static HTML/CSS stays byte-stable).

## Integration ACs

This is a cleanup/hardening story over **existing Epic-1 + Epic-4 code** — it adds a bottom-of-page fallback to the existing SceneRail enhancement and tightens an existing shared Zod contract. It introduces **no new runtime service** and **no new public module surface**.

- The `threadContext` `.max()` change tightens the **existing** `GuideQuery` contract whose consumers already exist (api `/api/guide` route validation; web GuidePanel island). The integration verified *now* is that the existing real consumers stay green: the api `guide` route tests + the prod-faithful `guide` / `guide-panel` e2e (through `serve-with-api.mjs`) must still pass, and an over-cap turn is rejected by the real endpoint's validation path (AC3). No new consumer is introduced.
- The SceneRail change has no cross-service surface; its "integration" is the existing real-runtime e2e on the built home page (the `home` / `reduced-motion` / `js-off` Playwright specs), which must stay green and gain the AC4(a) bottom-of-scroll assertion. Per Rule 1, no Integration-AC gap: this story consumes/hardens existing surfaces only.

## Tasks / Subtasks

- [x] **Task 1 — Add a bottom-of-page fallback so `#close` lights at the foot of scroll (AC1, AC2).**
  - [x] In `web/src/components/scene/SceneRail.astro`'s `onMotionAllowed` init (after the existing `IntersectionObserver` setup, ~line 549), add a bottom-of-page activation that calls `setActive(order[order.length - 1])` (the last scene id, `'close'`) when the document is at/near its scroll foot. Prefer a **page-foot sentinel** observed by an IntersectionObserver, OR a **`{ passive: true }`** `scroll`+`resize` listener checking `scrollY + innerHeight >= scrollHeight - EPSILON` (epsilon ~2px). Reuse the existing `setActive`/`order`; do NOT alter the interior `rootMargin` heuristic. Never `preventDefault` (no scroll-jacking).
  - [x] Confirm the fallback is created ONLY inside `onMotionAllowed` (so reduced-motion / JS-off paths create nothing). Re-verify NFR-1: the inlined scene-rail script stays the only home-page executable JS; the build-output script-count assertions (`web/test/build-output.test.ts`) still hold (update them only if they assert an exact byte/size that legitimately shifts — prefer behavior-stable assertions).
- [x] **Task 2 — Bound `threadContext[].content` per turn in the shared contract (AC3).**
  - [x] In `shared/src/schemas.ts`, add `.max(2000)` (recommended) to `threadContext[].content` in `GuideQuery`. Update the doc-comment to state the per-turn content bound (alongside the existing turn-count note). Keep it backward-compatible with the real GuidePanel turns (short — well under the cap).
  - [x] Verify the api consumer still validates correctly: `api/src/lib/grounding.ts` (`assembleGroundedPrompt` / `MAX_THREAD_TURNS`) is unaffected (it slices by count, then neutralizes delimiters); the `/api/guide` route's `GuideQuery.parse`/`safeParse` now also enforces the content bound (an over-cap turn hits the existing validation-failure path).
- [x] **Task 3 — Lock both behaviors with non-vacuous, discoverable, scoped tests (AC4).**
  - [x] **SceneRail (AC1/AC2/AC4a):** add/extend an e2e on the built home (`web/e2e/home.spec.ts` is the natural home; `reduced-motion.spec.ts` for the gated-off case) — scroll to the document foot and assert the `#close` rail entry has `aria-current="true"` and `[data-scene-current]` reads `7`; assert interior tracking still works (aria-current moves off `#hero`). Add a reduced-motion assertion that the fallback does NOT activate (baseline holds). Mutation-check: removing the bottom-of-page fallback reds the foot-of-scroll assertion.
  - [x] **GuideQuery (AC3/AC4b):** add a test in the **`api`** package (extend `api/src/lib/grounding.test.ts` or a sibling api test — NOT `shared`, which has no runner) importing the REAL `GuideQuery` from `@portfolio/shared`: an over-cap `threadContext` turn fails `safeParse`; an at-cap turn + the existing valid shapes pass. Mutation-check: removing the `.max()` reds the over-cap rejection.
- [x] **Task 4 — Verify the floor with the LITERAL canonical gate (AC5).**
  - [x] Run the **literal** `pnpm test:all` end-to-end (Rule 5 — NOT a hand-narrowed subset). Confirm ALL steps green INCLUDING `lh`. Confirm `format:check` (`prettier --check .`) + `eslint` cover the touched `.astro`/`.ts`/test files.
  - [x] Run `pnpm run check-deterministic` (separate NFR-6 check): two clean builds byte-identical. Note: the SceneRail change adds gated runtime JS inside the existing inlined `<script>` and the schema change is api/shared-only, so `web/dist` static HTML/CSS should stay byte-stable — confirm, and note any files touched in the Dev Agent Record.

## Dev Notes

### Current state (files being modified — read before editing)

- **`web/src/components/scene/SceneRail.astro`** — the rail renders 7 scene entries (`order` ends with `{ id: 'close', label: 'Close' }`, line ~51), a `href="#close"` skip control (lines ~96, ~127), and a "Scene N of 7" meter (`[data-scene-current]`, lines ~92, ~110). The `<script>` (lines ~504–552) imports `onMotionAllowed` from `../../lib/motion` and, ONLY when motion is allowed, builds `links`/`labels`/`order`/`sections`, defines `setActive(id)` (moves `aria-current` across `[data-scene-link]` anchors + sets the label number via `order.indexOf(id)+1`), and observes each section with `rootMargin: '-30% 0px -60% 0px'`. The static baseline (aria-current on `#hero`, static meter, CSS scroll-fill in the no-preference media query) stands under reduced motion / JS-off. **Add the bottom-of-page fallback INSIDE the `onMotionAllowed` callback, reusing `setActive`/`order`.** Do NOT touch the interior observer config or the static baseline.
- **`shared/src/schemas.ts`** — `GuideQuery` (lines ~38–49): `query: z.string().trim().min(1).max(1000)` + `threadContext` array of `{ role: enum['user','guide'], content: z.string() }` (no `.max()`). This file is the single cross-package contract source (AR-15). **Add `.max(2000)` to `content`.** Zod 4 is in use (note `z.email()` top-level in `InviteInput`).
- **`api/src/lib/grounding.ts`** — `MAX_THREAD_TURNS = 6` (line 116); `assembleGroundedPrompt(... threadContext?)` slices `threadContext.slice(-MAX_THREAD_TURNS)` and `neutralizeDelimiters()`s untrusted (user-role) turn content (lines ~159–166). **No change required here** — the bound is enforced at the schema/validation boundary; this consumer is unaffected. Read it only to confirm the content bound composes with the count cap.
- **`api/src/routes/guide.ts`** (the `/api/guide` handler) — validates the body with `GuideQuery`; an over-cap turn now hits the existing validation-failure path. Read to confirm where validation runs so AC3's rejection is exercised by the real route path (the api `guide` route tests / guide e2e cover this).
- **Test homes:** `web/e2e/home.spec.ts` + `web/e2e/reduced-motion.spec.ts` + `web/e2e/js-off.spec.ts` (scene-rail real-runtime); `web/test/SceneRail.component.test.ts` + `web/test/build-output.test.ts` (NFR-1 script counts); `api/src/lib/grounding.test.ts` + `api/src/routes/guide.test.ts` (the ONLY discoverable home for the `GuideQuery` bound — `shared` has no test runner).

### Constraints / invariants to preserve

- **NFR-2 two-layer reduced-motion gate:** the new fallback lives INSIDE `onMotionAllowed` (the ONE shared JS gate from `motion.ts`) — never an inline `matchMedia`. Under reduced motion it must create nothing and the static baseline must be byte-for-byte as authored.
- **NFR-1 0-executable-JS-by-default + no scroll-jacking:** add no NEW script tag; the only client JS touched is the existing inlined, reduced-motion-gated scene-rail enhancement. Any listener is `{ passive: true }`; never `preventDefault`. Re-verify the build-output script-count assertions.
- **NFR-6 deterministic byte-stable build:** the schema change is api/shared-only; the SceneRail change adds gated runtime JS to the existing inlined script — `web/dist` static HTML/CSS should stay byte-stable. Re-verify via `check-deterministic`.
- **Rule 5 (canonical gate):** verify with the ROOT `pnpm test:all`, not a package-scoped subset. Confirm globs cover the changed `.astro` + the new/changed `.ts` tests.
- **Rule 8 (test discoverability + real module/scoped):** new tests run in the default suite, exercise the REAL module/contract (not an inline copy), scoped to the specific behavior; mutation-verify each reds on a real-source break. **Do NOT place the `GuideQuery` test in `shared/` (no runner) — use the `api` package.**
- **Backward compatibility:** the `threadContext` bound must not break the real GuidePanel flow (short turns) — confirm the existing guide / guide-panel e2e stay green.
- **No scope creep into Epic-5 feature stories:** do NOT build the Continuous Canvas, the GSAP/ScrollTrigger layer, the Depth Dial, re-curation, or director's mode here. This story ONLY hardens the two existing surfaces those stories will build on.

### Project Structure Notes

- `shared/src/schemas.ts` is the single cross-package contract home (AR-15) — the `.max()` belongs there, consumed by `api`; do not duplicate the schema. Because `shared` has no test runner, its contract tests live in the consuming package (`api`) — this is the established pattern (`grounding.test.ts` already imports `@portfolio/shared`).
- New files: none required (extend existing test files). At most one new sibling api test file if preferred. No new `web/src/lib/` module is needed for the SceneRail fallback (it stays inline in the existing gated script).

### References

- [Source: _bmad-output/implementation-artifacts/deferred-work.md#Deferred from: code review of story-1.4] — `[1.4 · LOW]` `#close` may not receive `aria-current` via scroll at the page bottom; recommended fix = bottom-of-page fallback (`scrollY+innerHeight ≈ scrollHeight` or a page-foot sentinel) in the centralized motion logic.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md#Deferred from: code review of story-1.9] — `[1.9 · LOW]` re-confirms the `#close` nuance is still open (1.9 consolidated only the gate, not the observer); "carry forward to Epic 5 ... the Stage-2 cinematic camera path ... where the scroll/observer logic is revisited."
- [Source: _bmad-output/implementation-artifacts/deferred-work.md#Deferred from: code review of story-4.3] — `[4.3 · LOW latent]` `threadContext[].content` not length-bounded per turn; recommended fix = a per-turn `.max(~2000)` on the `threadContext` content schema + a Zod-rejection test; "co-own with the GuidePanel owner ... when the endpoint is exposed beyond the island."
- [Source: _bmad-output/implementation-artifacts/4-0-epic-3-deferred-cleanup.md#Appendix] — the `[1.4]/[1.9]` row pre-triaged "DEFER → Epic 5".
- [Source: _bmad-output/implementation-artifacts/epic-4-retro-2026-06-07.md#Action items A5] — "[4.3] ... threadContext per-turn bound ... triage into the next cleanup story (a future Epic 5 Story 5.0)."
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] — Continuous Canvas degrades under reduced-motion to the Stage-1 discrete Scenes (the discrete SceneRail remains the fallback).
- [Source: .claude/rules/project-rules.md#8] — tests assert against the REAL module + a SCOPED surface; mutation-verify.
- [Source: web/src/components/scene/SceneRail.astro#L504-552] — the `onMotionAllowed` observer + `setActive`.
- [Source: shared/src/schemas.ts#L38-49] — `GuideQuery` / `threadContext`.
- [Source: api/src/lib/grounding.ts#L115-166] — `MAX_THREAD_TURNS` + thread assembly.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- cycle_iteration=2 HIGH defect fix: QA proved the cycle_iteration=1 sentinel was misplaced (`position:absolute;bottom:0` on a static parent resolves against the initial containing block, placing the sentinel ~3000px above the true document foot). The footObserver fired near page-top, not at page-bottom, so `#close` never activated via the fallback. Additionally the AC1 test was vacuous — the real `#close` (tall) was activating via the interior observer, masking the broken sentinel.

### Completion Notes List
- Task 1 complete (cycle_iteration=2 fix): replaced misplaced `position:absolute;bottom:0` sentinel with a **normal-flow** 1px `<div>` appended to `document.body` as its last child. A normal-flow element at the end of `<body>` sits at the true document foot regardless of ancestor positioning. FootObserver uses `rootMargin: '0px 0px 20px 0px'` (20px bottom extension to ensure the 1px sentinel fires reliably when at the viewport bottom edge — prevents sub-pixel precision gaps). No scroll handler, no `preventDefault`, no new `<script>` tag. NFR-1/NFR-2 preserved (entirely inside the ONE shared `onMotionAllowed` gate).
- Task 2 complete (unchanged from iteration 1): `.max(2000)` added to `threadContext[].content` in `shared/src/schemas.ts`. Doc-comment updated to explain the per-turn content bound alongside the count-cap. Backward-compatible (GuidePanel turns are tens–hundreds of chars, well under 2000).
- Task 3 complete (AC1 test — final form after cycle_iteration=2 flakiness investigation): The AC1 e2e forces `#close` to 120px height with `overflow:hidden`, then appends a **400px test spacer** after the sentinel. The spacer ensures: (a) maxScroll puts the sentinel clearly INSIDE the viewport (sentinel.rectTop≈319px, not at the exact 720px edge where Chromium's IO fires inconsistently); (b) the scroll position places `#close` BELOW the interior active band (close.rectBottom≈139px < active band start at 216px), so only the footObserver can activate `#close`. Two mutations verified: (1) removing footObserver → Received:"#hero" (interior observer never reaches #close, test REDs); (2) removing entire sentinel/footObserver block → waitForFunction timeout (no sentinel appended). The test is non-vacuous: 10/10 passes with real code, RED on both mutations.
- Task 4 complete: literal `pnpm test:all` ran end-to-end (typecheck → lint → format:check → test → test:e2e → lh), exit 0 × 2 consecutive runs. `pnpm run check-deterministic` passed (tree hash `7e52bb036af04b373e59c47b1eff6cbf7427c2c3351ba6d51ad71776367128ef`, byte-identical across two builds). Test totals: 135 api, 661 web, 156 scripts, 243 e2e; all green.

### File List
- web/src/components/scene/SceneRail.astro
- shared/src/schemas.ts
- api/src/lib/grounding.test.ts
- web/e2e/home.spec.ts
- web/e2e/reduced-motion.spec.ts
- _bmad-output/implementation-artifacts/5-0-epic-4-deferred-cleanup.md

## Review Findings

### Code review (2026-06-07, adversarial — Blind Hunter / Edge-Case Hunter / Acceptance Auditor) — Story 5.0

**Verdict: APPROVE. Zero HIGH, zero MED, zero unresolved findings.** The iter1 HIGH defect (a misplaced `position:absolute;bottom:0` sentinel that fired the footObserver near page-TOP, masked by a vacuous AC1 test) is genuinely fixed and independently re-verified by the reviewer's own mutation tests. All five ACs verified against the REAL runtime/build, not story prose.

**AC-by-AC verdict (each verified against the real runtime):**

- **AC1 — `#close` lights at the true document foot (the [1.4]/[1.9] bug): VERIFIED.** The fix is a normal-flow 1px `<div>` appended as the LAST child of `document.body` (sits at the true document foot regardless of ancestor positioning), observed by a second `IntersectionObserver` (`rootMargin '0px 0px 20px 0px'`) firing `setActive(order[order.length-1])` == `'close'`. The AC1 e2e (`web/e2e/home.spec.ts`) is genuinely NON-VACUOUS — it forces `#close` SHORT (120px) AND below the interior active band, so ONLY the foot sentinel can activate it. **Reviewer mutation-test (independent re-confirmation):** replacing `footObserver.observe(sentinel)` with a no-op reds the AC1 e2e with exactly `Expected "#close" / Received "#hero"`; reverted byte-clean; the green→red→green round-trip holds. The interior `rootMargin '-30% 0px -60% 0px'` heuristic is unchanged (AC2 interior-tracking e2e + the existing motion-on aria-current e2e stay green).

- **AC2 — static/reduced-motion/JS-off baseline unchanged (NFR-1, NFR-2): VERIFIED.** The sentinel/footObserver are created ONLY inside `onMotionAllowed` (the ONE shared gate). Reduced-motion e2e confirms scrolling to `document.documentElement.scrollHeight` leaves `aria-current` on `#hero` and the label at "Scene 1 of 7" (sentinel no-op). JS-off floor e2e green (static baseline, scenes in DOM order, all links followable). No new `<script>` tag — `web/test/build-output.test.ts` (script-count, NFR-1) + `SceneRail.component.test.ts` pass UNCHANGED (250 tests). No scroll-jacking (IntersectionObserver-based; zero scroll handlers; no `preventDefault`). The sentinel cssText literal appears ONLY in the bundled scene-rail JS chunk, NOT in static `web/dist` HTML — runtime-only, no shipped-DOM pollution.

- **AC3 — `GuideQuery.threadContext[].content` bounded by the REAL shared contract: VERIFIED.** `.max(2000)` is on the real `shared/src/schemas.ts` `GuideQuery` (the AR-15 cross-package source). The api `/api/guide` route's existing `GuideQuery.safeParse` → 400 path (`api/src/routes/guide.ts:194-204`) genuinely rejects an over-cap turn. Backward-compat confirmed end-to-end: the `guide` + `guide-panel` prod-faithful e2e (through `serve-with-api.mjs`, 14 tests) stay green — the real GuidePanel short turns are unaffected.

- **AC4 — non-vacuous, discoverable, scoped tests: VERIFIED.** The GuideQuery test lives in the runner-bearing `api` package (Rule 8 — `shared` declares only `typecheck`, no runner; confirmed) and imports the REAL `GuideQuery` from `@portfolio/shared/schemas` (the export map resolves; matches the established `grounding.test.ts` pattern). Assertions are scoped to `result.success` + the `threadContext[0].content` error path (Rule 8 — not a whole-object match). **Reviewer mutation-test:** removing `.max(2000)` reds the over-cap rejection tests (2001 + 10 000 char); reverted byte-clean. Both load-bearing assertions (SceneRail e2e + api rejection) are mutation-proven non-vacuous by the reviewer's own runs.

- **AC5 — LITERAL canonical gate green + byte-deterministic (Rule 5, NFR-6): VERIFIED by the reviewer re-running each step inline.** typecheck (0 errors), lint (clean), `format:check` = `prettier --check .` ("All matched files use Prettier code style!" — covers the touched `.astro`/`.ts`/test files), `test` (156 scripts / 135 api / 661 web), `test:e2e` (all projects green incl. the new home + reduced-motion + the guide/guide-panel backward-compat + js-off floor), `lh` (lhci autorun: "All results processed!", 0 failed assertions). Separate `check-deterministic` PASS — `web/dist` byte-identical across two clean builds, tree hash `7e52bb036af04b373e59c47b1eff6cbf7427c2c3351ba6d51ad71776367128ef` (matches the dev's recorded hash). The schema change is api/shared-only and the SceneRail change adds only runtime JS inside the existing inlined module chunk, so the static dist is unchanged → the LH-measured artifact is identical to the prior green baseline.

**Rule cross-check:**
- **Rule 1 (Integration ACs):** correct — this story introduces NO new service/module surface (it hardens existing Epic-1 SceneRail + tightens the existing shared `GuideQuery`). The "Integration ACs" section accurately states no new consumer and verifies the existing consumers (api route + GuidePanel island) stay green. No Integration-AC gap.
- **Rule 3 (real-runtime test evidence):** satisfied — the user-facing SceneRail surface is covered by real-browser Playwright e2e on the built home (foot-of-scroll + interior + reduced-motion no-op); the GuideQuery contract by real-module api tests + the prod-faithful guide e2e.
- **Rule 5 (canonical gate):** satisfied — the LITERAL `pnpm test:all` steps + `check-deterministic` re-run by the reviewer, not a package-scoped subset.
- **Rule 6 (ADR):** N/A — no `docs/adr/` registry exists.
- **Rule 8 (real module + scoped + mutation-verified + discoverable):** satisfied for BOTH tests (real imports, scoped assertions, mutation-verified red on real-source break, discoverable by the default suite, NOT placed in the runner-less `shared`).

**Files edited by code review (tracking only):** `_bmad-output/implementation-artifacts/deferred-work.md` — marked `[1.4]`, `[1.9]`, and `[4.3 threadContext]` as ✅ RESOLVED (Story 5.0) with mechanism + mutation-verification notes. No new deferred items surfaced (the Appendix triage table is accurate; the 14 DEFER / 3 DROP items remain correctly tracked for their named triggers). **No source/test code changes were needed** — the implementation is correct as delivered.

**Adversarial edge cases checked (no defect):** (a) the AC1 test's `document.body.lastElementChild` sentinel-detection assumption is safe — the SceneRail sentinel is the ONLY runtime `document.body.appendChild` in `web/src` (no GuidePill portal / InviteForm island appends a later body child today); (b) the `.rail-d__lab` AC2 assertion target is unique in `index.html` (count = 1) — scoped, not a whole-doc match; (c) the over-cap path is exercised at the REAL route (not just the schema), so the 400 validation path is genuinely hit; (d) the sentinel `aria-hidden="true"` + `height:1px` attributes match exactly what the AC1 e2e's `waitForFunction` checks.

---

## Appendix — Epic 4 deferred-work + retrospective triage (created by the /epic-cycle retro-review gate)

Triage performed at Epic 5 start (2026-06-07), covering Epic 4's retrospective action items + every still-open `deferred-work.md` entry. Decision key: **INCLUDE** = built in this Story 5.0; **DEFER** = remains tracked in `deferred-work.md` for a named later story/epic/trigger; **DROP** = no action needed (already resolved, or nothing to fix). Already-RESOLVED items from earlier epics (1.1 API_PORT, 1.2 React chunk, 1.7 URL form, 2.1 EADDRINUSE/localeCompare, 2.2 frontmatter strip, 2.3/2.4 ArtifactCard label, 2.4 timeline TZ, 1.8 api/dist — all closed in Stories 2.0/3.0/3.3/3.4/4.0/1.10) are excluded from the table below.

| Item | Source | Triage Decision |
|---|---|---|
| `[1.4 · LOW] #close bottom-of-page aria-current nuance` (+ `[1.9 · LOW]` same) | deferred-work (1.4, 1.9 CR) + 4.0 appendix ("DEFER → Epic 5") | **INCLUDE in Story 5.0** — Story 5.1 (Continuous Canvas) reworks the scroll/observer and degrades under reduced-motion to the SAME discrete SceneRail; fix the bottom-of-page fallback now so 5.1 layers the cinematic camera path over a discrete base that already tracks the last scene correctly. Small, isolated, not owned by a 5.1–5.4 feature story. |
| `[4.3 · LOW latent] threadContext[].content not length-bounded per turn` | deferred-work (4.3 CR) + retro A5 | **INCLUDE in Story 5.0** — Stories 5.3 (agent re-curation) + 5.4 (director's mode) are the new `/api/guide` consumers that drive richer multi-turn conversation; bound per-turn content in the shared `GuideQuery` contract now (1-line `.max()` + api-package rejection test) so they inherit a prompt-size-safe base. The 4.3 deferral named "when the endpoint is exposed beyond the island" — Epic 5 is that exposure. |
| `[4.3 · LOW monitoring] injection-detection logging completeness` | deferred-work (4.3 CR) + retro A5 | **DEFER → observability / NFR-7** — affects only the `injection_attempt` log signal, NOT resistance (structural defense verified: persona in a separate system message + `neutralizeDelimiters()`). Broaden the pattern set from real production injection logs, or add an intent classifier, in a later observability story. Not an Epic-5 surface. |
| `[4.3 · LOW calibration] RETRIEVAL_THRESHOLD (0.5) lets weak NL off-topic queries reach the model` | deferred-work (4.3 smoke) + retro A4/A5 | **DEFER → NFR-7 telemetry** — the model declines gracefully (no fabrication) in both paths; tuning the threshold needs production `retrieval_miss` telemetry, not a guess. The documented NFR-7 trigger. Co-own with the Guide owner. |
| `[3.4 · LOW] both `mailto:` fallbacks are recipient-less (no public owner address client-side)` | deferred-work (3.4 CR, re-checked 3.5) + retro A5 | **DEFER → launch** — needs Josh to confirm a public contact address exposed via a build-time `PUBLIC_CONTACT_EMAIL` (Rule 4 env-gate). Not an Epic-5 surface; the `/about/` "never lost" fallback carries the guarantee until then. |
| `[3.3 · LOW] MAIL_FROM/MAIL_TO validated as z.string() not z.email()` | deferred-work (3.3 CR) | **DEFER → launch** — operator-supplied trusted config that fails safe; tighten (allowing the `Name <addr>` form) when live email is enabled in the launch checklist. Not an Epic-5 surface. |
| `[3.3 · LOW] rate-limiter documented "sliding window" but is a fixed window` | deferred-work (3.3 CR) → was "→ 4.3" | **DEFER** — 4.3 built its own `/api/guide` limiter without relabeling the invite-route comment; relabel to "fixed window" (or implement a true rolling window) at the next api rate-limiter touch. Trivial, low value; Epic 5 does not touch the invite limiter. |
| `[3.3 · LOW] updated_at not bumped when mail_status is written` | deferred-work (3.3 CR) | **DEFER** — lands with the future `new`→`replied` admin workflow (not in Epic 5); set `updatedAt`/`$onUpdate()` on every UPDATE then. No consumer reads it yet. |
| `[3.5 · LOW] invite-submitted `source` inferred from pathname, not an explicit prop` | deferred-work (3.5 CR) | **DEFER** — accurate for the two current embeds; thread `source` as an explicit island prop when InviteForm is embedded on a 3rd surface. Epic 5 does not embed InviteForm. |
| `[3.2 · LOW] Copy button aria-label not updated to the copied state` | deferred-work (3.2 CR) | **DEFER** — not an axe/AC failure (the `role=status` region announces "Copied ✓"); fold into any future BioBlock touch. Not an Epic-5 surface. |
| `[3.2 · LOW] short-bio "50 words" label vs 47-word verbatim bio` | deferred-work (3.2 CR) | **DEFER** — cosmetic; the bio is locked to `PERSON.description` (the constraint). Relabel/derive the count if `PERSON.description` is re-approved. Not an Epic-5 surface. |
| `[1.3 · LOW] Fork CTA curly apostrophe vs spine straight ASCII` | deferred-work (1.3 CR) | **DEFER** — owner house-style decision, non-blocking; rendered glyph is typographically correct and matches the mock. |
| `[1.4 · LOW] current-tick halo literal rgba vs token` | deferred-work (1.4 CR) | **DEFER** — tokens-layer change; no trigger until the accent gains channel/alpha tokens or a `color-mix()` convention. Spec-faithful today. (Epic 5's cinematic work may revisit tokens — re-triage if so.) |
| `[1.10 · LOW] deploy.sh no clean-tree precheck before git pull --ff-only` | deferred-work (1.10 CR) | **DEFER** — optional operator-ergonomics polish; safe today (`set -euo pipefail` + `--ff-only` fail fast). No epic assignment. |
| `[2.3 · LOW latent] glassbox.index.ts in web/src/content/ (collections footgun)` | deferred-work (2.3 CR) | **DEFER → if/when Astro content collections are adopted** — no `content.config.ts` exists, so it's an ordinary module today; relocate to `web/src/lib/` then. No Epic-5 trigger. |
| `[4.0 · LOW latent] stripFrontmatter over-strips a degenerate `word \n :value` 2-line block` | deferred-work (4.0 CR) | **DEFER → KB-index owner** — contrived shape; no allowlisted artifact triggers it, strictly narrower than the pre-4.0 regex. Tighten the lookahead to same-line key:colon when the KB markdown handling is next touched. Not an Epic-5 surface. |
| `[4.0 · LOW latent] stripFrontmatter does not strip an indented-key frontmatter block` | deferred-work (4.0 CR) | **DEFER → KB-index owner** — fails SAFE (renders as literal text rather than vanishing); matters only once a non-column-0 frontmatter source enters `content/kb/`. Not an Epic-5 surface. |
| `[1.2 · LOW] empty <footer> stray hairline band` | deferred-work (1.2 CR) | **DROP** — moot: Story 1.7's global `<Footer />` renders on every page (BaseLayout:105), so the band is never empty (re-confirmed in source). |
| `[1.5 · LOW] dev-note "byte-identical" wording imprecise` | deferred-work (1.5 CR) | **DROP** — no action; output correct, only the completion-note wording was loose. |
| `[3.5 · LOW] sprint-status.yaml 3-5 ready-for-dev vs review tracking drift` | deferred-work (3.5 CR) | **DROP** — already reconciled: `sprint-status.yaml` lists `3-5-…: done` (the lead's pipeline advanced it on commit, as the deferral predicted). |

**Triage totals (still-open deferred-work + retro items): INCLUDE = 2 · DEFER = 14 · DROP = 3.** The DEFER items stay tracked in `deferred-work.md` for their named stories/epics/triggers (launch: mailto + MAIL_* email validation; NFR-7/observability: injection logging + threshold calibration; KB-index owner: stripFrontmatter latents; admin workflow: updated_at; owner/low-pri: apostrophe, halo token, deploy precheck, rate-limiter relabel, source prop, BioBlock a11y/word-count, content-collections). Epic-4 retro action items: A1 (Rules 9/10/11) already codified in the Epic-4 retro commit; A2 (Rule 11 on the spawn skeleton) is honored by THIS `/epic-cycle` run (every dev/QA/CR spawn carries the synchronous-completion directive); A3 (launch prerequisites) → launch checklist; A4 (threshold calibration) = the `[4.3 calibration]` DEFER row above; A5 (remaining deferred LOWs) = this triage table.
