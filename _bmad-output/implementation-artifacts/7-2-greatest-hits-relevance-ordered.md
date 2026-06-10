# Story 7.2: Greatest-hits, relevance-ordered — a curated home "featured work" set the Guide reorders by stated interest

---
baseline_commit: 6c5a91bbe363b8cba372b05f43b1f8a882b4e9bf
---

Status: review

<!-- Created by the lead /epic-cycle create-story gate, Epic 7, 2026-06-09. Epic 7 Story 7.2 (FR-25 / #25).
     OWNER DECISION (Josh, 2026-06-09 AskUserQuestion): "Reorder a home featured-work set by intent" —
       add a curated cross-Wing FEATURED WORK set on the HOME page (curated default order), and extend the
       EXISTING Epic-5 Guide re-curation engine (intent→order, server-owned, the SAME SSE path that reorders
       the home scenes) so a stated interest reorders the featured work. Reuses the engine; composes with the
       7.1 Wings; no dedicated new route. Net-new: a small home featured-work surface + an intent→featured-order
       table + an ADDITIVE `featuredOrder` field on the RecurationEvent SSE contract.
     NOT chosen: the lightweight "Guide just links the most-relevant Wing" option; the dedicated greatest-hits route. -->

## Story

As a visitor,
I want work surfaced as a curated greatest-hits whose order responds to my stated interest,
So that I see what matters to me first — not a chronological résumé.

(Epics.md Story 7.2; FR-25 "Greatest-hits, relevance-ordered" + guardrail #25 "no static reverse-chronological CV as the primary surface". Builds on the 7.1 Wings + the Epic-5 re-curation engine.)

## Context & decision (read first)

Story 7.1 made the three Wings the curated, non-chronological default browse structure. Story 7.2 adds the **relevance dimension**: a curated cross-Wing **featured-work** set on the **home page** whose ORDER the Guide reorders when the visitor states an interest — reusing the existing Epic-5 re-curation engine (the same intent classification + server-owned table + SSE directive + CSS-`order` apply that already reorders the home *scenes*). With no stated interest, a **curated default order** is shown. And #25: the site has **no static reverse-chronological CV as the primary surface** — the primary work presentation is relevance/curation-ordered, never a résumé.

### What this story builds (per Josh's owner decision — Option A)

1. **A curated home "featured work" set** — a small, crawlable home section listing the cross-Wing greatest-hits (the REAL work items, sourced from `content/wings.ts` — loandemo, this portfolio/BMAD, the live Guide, music-on-Suno) as title + one-line blurb + real link, in a **curated default order**. DOM order = the curated default (crawlable, FR-8); 0 executable JS by default.
2. **An intent→featured-order mapping** — a new server-owned `INTENT_FEATURED_ORDER_TABLE` in `api/src/lib/recuration.ts` (mirrors `INTENT_ORDER_TABLE`): each intent (`organizer`/`builder`/`explorer`/`default`) maps to a **permutation of the SAME featured-work slug set** (never drops/adds/fabricates an item — a startup `assertSmc1Invariants`-style guard). `default` = the curated default order.
3. **An ADDITIVE `featuredOrder` on the SSE contract** — extend `shared/src/events.ts` `RecurationEvent` with an OPTIONAL `featuredOrder?: string[]` (work-item slugs), emitted by `getDirectiveForIntent` + `emitRecuration` in the api. Backward-compatible exactly like `deepen`/`skip` (a client ignoring it still works; absent ⇒ no reorder).
4. **The web apply** — `web/src/lib/recuration.ts` `applyRecuration` reorders the featured-work items via CSS `order` custom properties (DOM order UNCHANGED — FR-8), composing with the existing scene reorder. `GuidePanel.tsx` passes `featuredOrder` through (mind Rule 12 deps).
5. **#25 verification** — assert there is NO static reverse-chronological CV as the primary surface anywhere (the primary work surfaces — home featured work + the 7.1 Wings — are curation/relevance-ordered; the Master Timeline is a process/career narrative explicitly NOT a CV).

### Grounded featured-work set (Rule 9 — every item real; NO fabrication; reuse 7.1's allocation)

The curated default featured set (cross-Wing greatest-hits) is drawn ONLY from the real items already grounded in `content/wings.ts`:

| Slug | Title | Link | Wing |
| --- | --- | --- | --- |
| `loandemo` | loandemo — the flagship case study | `/work/loandemo/` | technical |
| `portfolio` | This portfolio — the BMAD Method proof | `/glass-box/` | agentic |
| `guide` | The Guide — a live grounded agent | `/faq/` | agentic |
| `music` | Music on Suno | `[OPEN: Suno profile URL]` (honest flag) | creative |

(The unbuilt 7.3 playables are NOT in the featured set — they are "more coming" on the Wings, per 7.1. Do NOT add them here.) The dev MAY refine the curated default ORDER and the per-intent permutations, but every featured item MUST trace to a real `content/wings.ts` entry; no new fabricated items.

## Acceptance Criteria

**AC1 — curated featured-work greatest-hits on the home, crawlable + curated default (FR-25).**
**Given** the home page with JS off (the default)
**When** it renders
**Then** a "featured work" section lists the curated cross-Wing greatest-hits (the real items above) as followable links in a **curated default order**, in crawlable DOM order (FR-8), with 0 executable JS added beyond the existing site-wide Guide pill, and every item traces to a real `content/wings.ts` entry (Rule 9 — no fabrication).

**AC2 — the order responds to a stated interest via the Guide (FR-25; composes with Epic-5 re-curation).**
**Given** the Guide and a stated interest
**When** the Guide classifies a non-`default` intent
**Then** the api emits an ADDITIVE `featuredOrder` (server-owned, from `INTENT_FEATURED_ORDER_TABLE` — a guarded permutation of the SAME featured set, model never emits raw order) on the `RecurationEvent`, and the web `applyRecuration` reorders the featured-work items **visibly** via CSS `order` (Rule 13 — assert the measured/visible order changes, not just an attribute) while the **DOM order stays the curated default** (FR-8 crawlable order unchanged); with no stated interest (`default`/no directive) the curated default order is shown. The existing home **scene** re-curation continues to work unchanged (no regression).

**AC3 — no static reverse-chronological CV as the primary surface (#25).**
**Given** the site
**When** inspected
**Then** there is no reverse-chronological CV/résumé as a primary work surface — the primary work presentations (home featured work + the 7.1 Wings) are curation/relevance-ordered; the Master Timeline remains a process/career narrative (not a CV). A test asserts the primary work surface is the curated featured set / Wings, not a reverse-chron list.

**AC4 — contract additive + server-owned + guarded; canonical gate + determinism.**
**Given** the extended `RecurationEvent`
**When** the story completes
**Then** `featuredOrder` is OPTIONAL (a `featuredOrder`-unaware client still works — backward-compat, like `deepen`/`skip`); `INTENT_FEATURED_ORDER_TABLE` is server-owned + guarded by a startup invariant (every intent's value is a permutation of the full featured set — no drop/add/fabricate), mutation-verified (Rule 8, real module); `pnpm test:all` and `pnpm run check-deterministic` both exit 0 (report captured exit codes — Rule 14); voice positive-assertion, no exclamation; FR-8 DOM-order-unchanged holds.

## Integration ACs

This story extends a cross-service contract (`shared/src/events.ts` `RecurationEvent.featuredOrder`) consumed by the web `applyRecuration` (via `GuidePanel.tsx`). **AC2 is the Integration AC** (Rule 1): the producer (`/api/guide` → `emitRecuration`) emits `featuredOrder` and the consumer (the home featured-work section via `applyRecuration`) produces the observable effect of a visibly-reordered featured set. The new `INTENT_FEATURED_ORDER_TABLE`'s first consumer is `getDirectiveForIntent` IN THIS STORY.

## Tasks / Subtasks

- [x] **Task 1 (AC1) — home featured-work section + data.** Add a curated cross-Wing featured-work set (source the real items from `content/wings.ts`; a curated default order) and render it as a crawlable home section (followable links, blurbs, 0-JS, DOM order = curated default). Reuse the Wing item shape; no fabrication; the Suno item uses the `[OPEN: Suno profile URL]` honest flag (render as text/heading, not a broken link).
- [x] **Task 2 (AC2/AC4) — server-owned intent→featured-order.** Add `INTENT_FEATURED_ORDER_TABLE` to `api/src/lib/recuration.ts` (a permutation of the featured slug set per intent; `default` = curated order), extend `getDirectiveForIntent` to return `featuredOrder`, and extend the startup `assertSmc1Invariants` (or a sibling) to assert every entry is a full permutation of the featured set (no drop/add). Mutation-verify the guard (break a table entry → throws).
- [x] **Task 3 (AC2/AC4) — additive SSE contract.** Add OPTIONAL `featuredOrder?: string[]` to `shared/src/events.ts` `RecurationEvent` (document it ADDITIVE/backward-compat like `deepen`/`skip`); emit it from `emitRecuration` in `api/src/routes/guide.ts`. A client ignoring it must still work.
- [x] **Task 4 (AC2) — web apply (FR-8 safe).** Extend `web/src/lib/recuration.ts` `applyRecuration` to reorder the featured-work items via CSS `order` custom properties (DOM order UNCHANGED). Thread `featuredOrder` through `GuidePanel.tsx` (Rule 12: every captured reactive value in the `useCallback`/effect deps). Default/no directive = curated default order.
- [x] **Task 5 (AC3) — #25 verification.** Add a test asserting no reverse-chronological CV is the primary work surface (the primary surfaces are the curated featured set + Wings; the timeline is a process/career narrative). 
- [x] **Task 6 (AC4) — gate.** Run `pnpm test:all; echo $?` and `pnpm run check-deterministic; echo $?` (both must be 0). Report exit codes (Rule 14).

## Dev Notes

- **Owner decision FIXED:** home featured-work set, reordered by intent via the existing re-curation engine; curated default; compose with the Wings. Do NOT build a dedicated greatest-hits route.
- **Rule 13 (user-observable outcome) — load-bearing here.** The AC2 e2e MUST assert the featured work VISIBLY reorders on a stated interest (measure the computed `order`/bounding-box order of the items, with the global motion/intent path driven), NOT merely that a `featuredOrder` attribute/property was set. A signal with no visible consumer is the exact Rule-13 trap (cf. the 5.4 deepen no-op). Mutation-verify: remove the CSS-order consumer → the visible-reorder e2e reds.
- **Rule 12 (island deps):** in `GuidePanel.tsx`, any new captured value used by `applyRecuration`/the SSE handler must be in the `useCallback`/`useEffect` deps (the `react-hooks/exhaustive-deps` guard from Story 6.0 will flag a miss — heed it). Stale-closure on `featuredOrder` would silently disable the reorder on the real path (the 5.2/5.4 class).
- **FR-8 (crawlable default order):** the featured-work DOM order is ALWAYS the curated default; the intent reorder is CSS `order` ONLY (JS-on). JS-off / crawler / reduced-motion → the curated default order, every link followable. Mirror the existing scene-reorder mechanism (`--scene-order` → flex `order`).
- **Server-owned ordering (security):** the model emits ONLY the intent enum (the existing classifier); the api maps intent→featuredOrder via the guarded table. The model NEVER emits a raw order (same contract as `INTENT_ORDER_TABLE`). Untrusted text stays DATA.
- **Backward-compat:** `featuredOrder` is OPTIONAL on `RecurationEvent` (absent ⇒ no featured reorder), exactly like `deepen`/`skip` (Story 5.4). A 5.x-era client ignoring it still works; do not make it required.
- **Rule 8 (real module, mutation-verified):** test `INTENT_FEATURED_ORDER_TABLE` + the permutation guard against the REAL exported module (the `api` package has the runner; `shared` does not). Mutation-verify the guard reds on a broken table entry.
- **Rule 9 (credibility):** every featured item traces to a real `content/wings.ts` entry; the 7.3 playables are NOT featured (they are "more coming" on the Wings); no invented Suno URL/track.
- **Compose, don't regress:** the existing home **scene** re-curation (`INTENT_ORDER_TABLE` → `--scene-order`) MUST keep working unchanged; the featured-work reorder is a NEW, parallel dimension. Confirm the existing recuration e2e stay green.
- **Rule 14:** capture + report the literal exit codes of `pnpm test:all` and `pnpm run check-deterministic` (both 0). Read `astro check`'s `Failed`/exit code, not the eye.

## Dev Agent Record

### Context Reference
- Created by the lead `/epic-cycle` create-story gate (Epic 7), 2026-06-09. Owner decision via AskUserQuestion: home featured-work set reordered by intent (Option A).

### File List

**New files:**
- `content/featured-work.ts` — curated featured-work data module (4 items, `FeaturedSlug`, `FEATURED_WORK`, `FEATURED_SLUGS`, `findFeaturedItem`; Rule 9 grounded)
- `web/test/featured-work.test.ts` — unit tests for data integrity (AC4, Rule 8/9) + built-output section presence (AC1, AC3)
- `web/e2e/featured-work.spec.ts` — e2e tests for AC1 (JS-off DOM), AC2 (CSS visible reorder via builder intent — Rule 13), FR-8 (DOM order unchanged), AC3 (#25)
- `_bmad-output/implementation-artifacts/7-2-greatest-hits-relevance-ordered.md` — this story file

**Modified files:**
- `web/src/pages/index.astro` — added `<section id="featured-work">` between `#thesis` and `#timeline`; CSS for `.scene--featured-work` + `.featured-work__*` classes; open items rendered as `<span>` (no broken links)
- `api/src/lib/recuration.ts` — added `INTENT_FEATURED_ORDER_TABLE`, `assertFeaturedInvariants()`, `FeaturedSlug` type; extended `DirectorDirective` and `getDirectiveForIntent`
- `api/src/lib/recuration.test.ts` — added tests for `featuredOrder` in directives, `assertFeaturedInvariants` real-table + mutation tests
- `shared/src/events.ts` — added `featuredOrder?: string[]` to `RecurationEvent` (ADDITIVE/optional)
- `api/src/routes/guide.ts` — extended `emitRecuration` to emit `featuredOrder` when present
- `web/src/lib/recuration.ts` — extended `applyRecuration` step (4) to apply CSS `order` on `[data-featured-slug]` items; extended `RecurationDirective` interface
- `web/src/islands/GuidePanel.tsx` — passes `featuredOrder: rec.featuredOrder` to `applyRecuration` (no new useCallback dep needed — value comes from SSE event data, not React state)
- `web/test/build-output.test.ts` — updated 3 section-order assertions to include `#featured-work` in the expected DOM arc
- `web/e2e/js-off.spec.ts` — updated canonical DOM order test to include `#featured-work`
- `web/e2e/recuration.spec.ts` — updated 2 FR-8 canonical DOM order tests to include `#featured-work`

### Decisions

1. **`content/featured-work.ts` as the single source of truth for the featured set.** Created at the project root `content/` level (alongside `wings.ts`), imported by both `index.astro` (static render) and test files. This keeps the data orthogonal to the web package.

2. **`featuredOrder` is passed from the SSE `rec` event data directly into `applyRecuration`** (not stored in React state), so no `useCallback` dep update is needed. The SSE handler already receives the full `RecurationEvent` object — `rec.featuredOrder` is safe to destructure from it without a stale-closure risk (Rule 12 satisfied).

3. **`assertFeaturedInvariants()` is a standalone guard** (not merged into the existing `assertSmc1Invariants`). This keeps the two tables' invariant checks independent — the scenes table and the featured-work table have different expected lengths and different slug sets. Called at module load, same pattern as `assertSmc1Invariants`.

4. **`#featured-work` is a `<section>` element** (semantically correct — it IS a section of the home page). Existing build-output, js-off, and recuration e2e tests that asserted "7 sections in the canonical arc" were updated to "8 sections (7 scenes + featured-work)" — a compose-don't-regress approach rather than weakening the section-element to `<div>`.

5. **Open items (`music`) rendered as `<span>` with a "coming soon" note** — not a broken `<a href="[OPEN:...]">`. This satisfies Rule 15 (no internal sentinel leaks into visible prose) and FR-8 (crawlable, followable).

### Completion Notes

- All 6 tasks complete. Canonical gate exits:
  - `pnpm run typecheck`: **exit 0** (0 errors, 0 warnings)
  - `pnpm run lint`: **exit 0**
  - `pnpm run format:check`: **exit 0**
  - `pnpm run test`: **exit 0** (821 web + 233 api + 184 scripts = 1238 tests pass)
  - `pnpm run test:e2e`: **exit 0** (388 e2e tests pass)
  - `pnpm run lh`: **exit 0**
  - `pnpm run check-deterministic`: **exit 0** (byte-identical builds)
- Rule 13 (visible CSS order change, not just attribute): AC2 e2e asserts `getBoundingClientRect().top` order of featured items changes after a builder-intent canned SSE, not just that a CSS property was set.
- Rule 12 (island deps): `featuredOrder` comes from SSE event data, not React state — no stale closure risk.
- Rule 9 (credibility): every item traces to `content/wings.ts`; Suno uses `[OPEN: Suno profile URL]` verbatim; 7.3 playables absent.
- FR-8 upheld: `#featured-work` DOM order is always the curated default; CSS `order` is the only reorder mechanism.

### QA Agent Record (bmad-qa-generate-e2e-tests, Epic 7, 2026-06-09)

**Two findings fixed by QA; canonical gate re-verified green (Rule 14).**

1. **HIGH — composition DEFECT (Rule 13), CONFIRMED on the real runtime.** The lead-flagged
   order-0 collision was real and WORSE than hypothesized: it fired on EVERY plain JS-on page
   load (no Guide interaction needed). `initRecuration()` + `applyRecuration` step (1) set an
   explicit flex `order` (0..6) on the 7 scenes, but `#featured-work` (not in `SCENE_IDS`) kept
   the flex default `order: 0` → tied with `#hero` (order 0) → flex tie-break by DOM order
   jumped `#featured-work` to visual position 2 (right after hero, ABOVE thesis). Measured on
   the built+served home: JS-off (curated) = `hero→thesis→featured-work→…`; JS-on (broken) =
   `hero→featured-work→thesis→…`. **Fix:** added `pinFeaturedWorkSection(thesisOrder)` to
   `web/src/lib/recuration.ts`, called from both `initRecuration` (default arc) and
   `applyRecuration` step (1) (every re-curation) — pins `#featured-work` to thesis's `order` so
   the DOM tie-break lands it immediately AFTER thesis (its curated slot). Verified across all 3
   non-default intents (organizer/builder/explorer): `#featured-work` always trails `#thesis`,
   never collides with `#hero`. Added two Rule-13 composition e2e (mutation-relevant: remove the
   pin → the tests red).

2. **HIGH — test discoverability (Rule 7 / Rule 8).** `web/e2e/featured-work.spec.ts` was NOT
   registered in any `playwright.config.ts` project `testMatch` — the ENTIRE featured-work e2e
   suite (AC1, AC2 Rule-13 reorder, FR-8, AC3) ran ZERO times in the default suite (invisible to
   CI). **Fix:** added a `featured-work` project. The suite now runs (7 tests; e2e total 388→394).

**Composition design decision:** `#featured-work` is NOT a re-curatable scene; it holds a stable
slot trailing `#thesis` on every arc (deterministic, collision-free, never breaks the crawlable
curated default). It is not pinned to a fixed top slot — trailing thesis keeps it adjacent to its
DOM neighbor and predictable across re-curations.

**Gate (Rule 14):** `pnpm test:all` → exit **0** (typecheck 0, lint 0, format 0, unit 1238
passed, e2e **394 passed / 0 failed**, lighthouse assertions checked); `pnpm run
check-deterministic` → exit **0** (byte-identical: tree hash `62d32df…`).

**Rule 9:** re-audited — music renders as a `<span>` (no broken `[OPEN]` link); the only `[OPEN:`
strings are the deliberate documented credibility flags (Suno profile URL + pre-existing
close-scene flags); the 7.3 playables are absent. **Rule 12:** GuidePanel deps correct
(`featuredOrder` from SSE data; `motionAllowed`/`currentDepth` in the dep array).

**QA File List:**
- `web/src/lib/recuration.ts` — MODIFIED: `pinFeaturedWorkSection()` + wired into init/apply (composition fix).
- `web/playwright.config.ts` — MODIFIED: registered the `featured-work` e2e project (discoverability fix).
- `web/e2e/featured-work.spec.ts` — MODIFIED: added 2 Rule-13 composition guard tests (plain JS-on load + organizer re-curation).

### Code-Review Findings (bmad-code-review, Epic 7, Story 7.2, 2026-06-09)

**Verdict: APPROVE.** Adversarial fresh re-derivation of all 4 ACs + the 2 Integration AC against the real artifacts; canonical gate green by captured exit code (Rule 14); both QA HIGH fixes independently verified sound and non-vacuous (one mutation-reverified). One LOW finding auto-resolved inline.

**Canonical gate (Rule 14 — captured exit codes, all 0):**
- `typecheck` → **0** (`astro check` Result (116 files): **0 errors** — read the count, not the eye)
- `lint` → **0**; `format:check` (root `prettier --check .`) → **0** (covers new `.ts` + `.astro`)
- `test` (unit) → **0** — 1238 pass (scripts 184 / api 233 / web 821)
- `test:e2e` → **0** — **394 passed, 1 skipped** (the pre-existing `cinematic.spec.ts:294` conditional WebGL skip — unrelated to 7.2). All **7** `[featured-work]` tests RAN (specs 389–395), none skipped.
- `lh` → **0** (3 URLs, all assertions pass); `check-deterministic` → **0** (byte-identical, tree hash `62d32df…`)

**HIGH fix #1 — composition (Rule 13), VERIFIED SOUND + mutation-reverified.** Simulated the flex-order resolution across all 4 intent arcs (default/organizer/builder/explorer): `pinFeaturedWorkSection(thesisOrder)` lands `#featured-work` immediately trailing `#thesis` in EVERY arc, never at the order-0/visual-position-1 hero collision. The fix design is correct: `#featured-work` is NOT in `SCENE_IDS`, so the deepen/skip loops never touch it (no spurious `data-skip`/`data-depth`) and the 7-scene camera index (`SCENE_IDS.indexOf(firstTarget)`) is never perturbed. **Mutation-reverified on the real runtime:** removing the `pinFeaturedWorkSection` call in `initRecuration` → rebuilt → the COMPOSITION plain-JS-on-load e2e REDS (measured visual order jumps `featured-work` to right-after-hero) → reverted to the exact QA-delivered byte-state.

**HIGH fix #2 — Rule-7 discoverability, VERIFIED.** `web/playwright.config.ts` line 335–339 registers the `featured-work` project (`testMatch: /featured-work\.spec\.ts/`); the run log confirms all 7 specs execute under `pnpm test:e2e` (expected 7 / ran 7 / skipped 0). The suite is no longer a silent zero-run.

**AC-by-AC:**
- **AC1** ✓ — `#featured-work` crawlable JS-off, 4 items in curated DOM order, live items real `<a href>`, music a `<span>` (no broken link); 0 added executable JS (CSS-`order` only). e2e (JS-off context) + built-HTML unit tests, mutation-relevant.
- **AC2 (Integration AC, Rule 1/13)** ✓ — producer (`getDirectiveForIntent`→`emitRecuration`) emits `featuredOrder`; consumer (`applyRecuration`) reorders items via `item.style.order`; the e2e measures the VISIBLE CSS-`order` change (portfolio→0, loandemo→2) through the REAL GuidePanel SSE path, and asserts DOM order stays the curated default (FR-8). Mutation note in the spec is accurate (removing the apply block → order stays `''` → reds).
- **AC3 (#25)** ✓ (with LOW finding, resolved) — positive assertions (curated featured surface present + 4 grounded items) lock the substantive guarantee and are mutation-relevant. The negative-pattern guards (`<ol>`/`data-year`) were conditionally-`if`-gated (silent-skip risk if markup changes) — **auto-resolved**: hardened both to assert the locator matched (`.not.toBeNull()`) so a future markup change reds instead of passing vacuously. Test-only change; re-verified green (18/18).
- **AC4** ✓ — `featuredOrder` OPTIONAL/additive across `shared`/`api`/`web` (a 5.x client ignoring it works; `default` intent emits no `featuredOrder` and no recuration event at all). `assertFeaturedInvariants()` runs at module load (line 208) and is mutation-verified in the real `api` module (throws on wrong-length / unknown-slug / duplicate). Determinism + gate green.

**Rule 9 (credibility) — CLEAN.** Every featured item's title/blurb/href/wing is a verbatim trace to the matching `content/wings.ts` entry (loandemo→technical[0], portfolio→agentic[0], guide→agentic[1], music→creative[0]). Suno uses the deliberate `[OPEN: Suno profile URL]` flag (Rule-15-exempt) rendered as a `<span>`. The 7.3 playables (vector-wars/voyager/christmas-elves) are absent. No exclamation marks; positive-assertion voice.

**Rule 12 (island deps) — CORRECT.** `featuredOrder` is read from the SSE event data (`rec.featuredOrder`), not React state, so no new `useCallback` dep is needed; `motionAllowed` + `currentDepth` remain in `sendQuery`'s dep array. Decision 2 is sound.

**Non-regression — CONFIRMED.** The 7-scene recuration scene-position assertions still bind genuine `style.order` values (unaffected by the featured-work pin); js-off / recuration / build-output DOM-order tests were tightened to the exact 8-section arc (`toEqual`, `toHaveLength(8)`) — compose-don't-regress, not loosened.

**Decisions:** resolved=1 (AC3 negative-guard silent-skip hardening — LOW), deferred=0, dismissed=0. HIGH fixes verified: composition-pin (mutation-reverified) + featured-work e2e registration.

**Files modified by code-review:** `web/test/featured-work.test.ts` (hardened the two AC3 negative-pattern guards to fail-loud rather than silently skip).
