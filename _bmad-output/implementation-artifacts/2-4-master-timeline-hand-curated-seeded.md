# Story 2.4: Master Timeline — hand-curated, seeded (`/timeline`)

---
baseline_commit: 330941c2816620d7674ae008c5d18ef752be00fb
---

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor,
I want to scrub one continuous timeline of Josh's craft progression,
so that I can read the arc from veteran shipping to agentic engineering and drill into the proof (FR-16, UX-DR8).

## Acceptance Criteria

1. **A hand-curated, seeded manifest drives the timeline — no automated harvest (Stage 1).**
   **Given** a hand-curated manifest `content/timeline/dots.ts`
   **When** `/timeline` renders (replacing the Story 1.5 stub, through `MirrorLayout` — answer-first, self-canonical, ONE `<h1>`, crawlable, 0-JS)
   **Then** the seeded **BMAD Method Dots** are drawn from the real artifacts of the two Stage-1 flagships (the portfolio itself + `loandemo`), each Dot maps to a real artifact and drills into it, and **NO automated harvest is performed** (the deterministic git→Dot harvest is explicitly Stage 2 / Epic 6 — this story is hand-curated only)
   **And** the `TimelineDot` component (from Story 2.3) is reused; the `EraBand` and flagship-node components are built here.

2. **Era-bands label the arc; the two flagships expand to their Dot clusters that drill into proof.**
   **Given** the spine
   **When** it renders
   **Then** era-bands label the quiet ~30-year **runway** vs the dense **agentic turn** (divided by a dashed hairline), each era a labeled region (per-`<li>` `aria-label`, presentation only over a real ordered list), and the two flagship nodes (milestone Dots) each expand to a small **static cluster** of their Dots — the **portfolio** node's Dots cross-link into the **Glass Box** (the Story 2.2 readers / 2.3 index), the **loandemo** node's Dots drill to `/work/loandemo#…` (forward-reference: the `/work/loandemo` content lands in Story 2.5 — the route stub exists from 1.5; link correctness is verified now, target resolution after 2.5).

3. **One semantic list; orientation is presentation-only; degrades to a plain `<ol>` JS-off.**
   **Given** the viewport
   **When** desktop vs mobile renders
   **Then** the SAME semantic ordered list reflows **horizontal (left→right craft-arc)** on desktop and **vertical** on mobile — presentation only; the DOM reading order (oldest→newest) is IDENTICAL in both — and with JS off the timeline degrades to a plain `<ol>` of dated, labeled, linked items with no loss of content (0 executable JS; the live halo is a static ring, no animation — reduced-motion safe by construction).

4. **No fabricated career facts — unknowns are flagged, not invented (credibility floor).**
   **Given** Josh's ~30-year runway has no committed milestone dataset yet
   **When** the runway era is curated
   **Then** the runway is rendered as the labeled era-band with **faint** quiet-runway ticks (decorative span; the `faint` Dot state) and any specific runway milestone is either omitted or flagged `[ASSUMPTION]`/`[OPEN]` in visible text — NO invented dates/employers/titles ship as fact. The two flagships (portfolio + loandemo) are the real, dense agentic-turn proof; loandemo's repo/artifact URLs are flagged `[OPEN]` until supplied (Story 2.5 owns them).

5. **Integration AC — the timeline's Dots resolve to real artifacts (Rule 1/2).**
   **Given** the built site
   **When** a build-output / e2e test inspects `/timeline/index.html`
   **Then** the portfolio flagship's Dots render real `<a href="/glass-box/{slug}/">` (or `/glass-box/`) resolving to existing Glass Box pages (no 404), the loandemo flagship's Dots render real `<a href="/work/loandemo#…">` (the route exists; fragment targets land in 2.5), the era-bands + cluster structure are present, the DOM order is oldest→newest, and 0 executable scripts — proving the curated manifest → rendered timeline → artifact wire-up.

6. **Accessibility floor (WCAG 2.1 AA, NFR-2).**
   **Given** the rendered timeline
   **When** audited (axe AA)
   **Then** exactly one `<h1>`; the spine/Dots are decorative with meaning in text (era labels, dates, titles, links — never color/orientation alone); era regions carry `aria-label`s; the reflow does not reorder the DOM (no keyboard/SR order mismatch); muted/faint text that carries meaning uses the AA-safe tokens (faint purely-decorative ticks may drop below, like the 1.x runway ticks); 0 axe violations.

## Consumes

- **Story 2.3** — the `TimelineDot` (BMAD Method Dot) component (REUSE; extend with the `faint` + `milestone` states per DESIGN §timeline-dot) and the `ArtifactCard` if a cluster row uses it. Also the Glass Box index/readers (Stories 2.2/2.3) the portfolio Dots link into.
- **Story 2.1/2.2** — the Glass Box artifacts/readers (`/glass-box/{slug}/`) the portfolio flagship's Dots drill into.

## Consumed-by

- **Story 2.5** — `loandemo` case study (`/work/loandemo`): the loandemo flagship node's Dots drill to `/work/loandemo#…`; 2.5 supplies those fragment targets + the real repo/artifact URLs (resolves this story's `[OPEN]`/forward-refs).
- **Epic 6 / Story 6.1–6.2** — the Stage-2 deterministic git→Dot auto-harvest + zoomable timeline REPLACE the hand-curation with generated Dots and add the zoom gesture; this story's manifest shape should anticipate that (a clean `TimelineDot`/cluster data model).

## Tasks / Subtasks

- [x] **Task 1 — The hand-curated manifest `content/timeline/dots.ts`.**
  - [x] Define a typed manifest: era-bands (`runway`, `agentic-turn`) and, within them, ordered timeline entries — flagship nodes (`portfolio`, `loandemo`) each with a cluster of Dots, plus the runway's faint ticks. Each Dot entry: a `label`, a `date` (or era position), a `state` (`faint`/`resting`/`filled`/`live`/`milestone`), and a `href` (the artifact it drills into — a Glass Box reader `/glass-box/{slug}/` for portfolio Dots; `/work/loandemo#…` for loandemo Dots; `[OPEN]` where the target/URL is not yet real). Hand-curated only — NO filesystem/git harvest (that is Stage 2). Keep the shape clean so Epic 6's auto-harvest can populate the same model.
  - [x] Portfolio cluster = the real Glass Box artifacts (brief · brainstorm · research · PRD · UX · the live-site/shipping node) — REUSE/reference the same artifacts as the Glass Box (do not fabricate). loandemo cluster = its shipping Dots (code/repo · build · retro) flagged `[OPEN]` (Story 2.5 supplies real URLs), drilling to `/work/loandemo#…`. Runway = the labeled era + faint ticks; no invented career facts (AC4).
- [x] **Task 2 — Extend `TimelineDot` + build `EraBand` + flagship-node.**
  - [x] Extend `web/src/components/glassbox/TimelineDot.astro` with the `faint` (11px, 1.5px `#C0B49B` ring — quiet runway ticks) and `milestone` (17px filled accent — flagship career milestone) states per DESIGN §timeline-dot, WITHOUT breaking the existing resting/filled/live/upcoming used by Story 2.3 (the 2.3 component tests must still pass).
  - [x] Build `EraBand` (labeled spine region: kicker label — runway in ink-secondary, agentic turn in accent; an italic ink-meta-min span; a 1px DASHED hairline divider between eras) and a flagship-node presentation (a milestone Dot + its static cluster of Dots, each a real link) per DESIGN §era-band + EXPERIENCE "Flagship node". Place new timeline components under `web/src/components/timeline/` (or alongside the glassbox ones — justify: new `web/src/components/timeline/` directory created per the story's Project Structure Notes).
- [x] **Task 3 — The timeline page (`/timeline.astro`).**
  - [x] Replace the Story 1.5 stub body. Compose through `MirrorLayout` (keep the entity-first lede/heading/self-canonical; one `<h1>`). Render ONE semantic `<ol>` (oldest→newest) from the manifest: era-bands as labeled regions, flagship nodes with their static Dot clusters, each Dot a real `<a>` to its artifact. Cross-link to the Glass Box (the recursion boundary, reciprocal of 2.3's `/timeline/` link).
- [x] **Task 4 — Reflow + reduced-motion (AC3).**
  - [x] CSS-only orientation: horizontal left→right on desktop, vertical on mobile — DOM order unchanged (use flex orientation, not DOM reordering). No JS required (0-JS); the page is static. The live halo stays a static ring (no animation) so reduced-motion is satisfied by construction (no JS gate needed since there is no motion).
- [x] **Task 5 — Tests (AC1–AC6; Rule 3 real-runtime; Rule 8 discoverable).**
  - [x] Build-output (Vitest, `web/test/`): generate Glass Box data first if the portfolio Dots reference `/glass-box/{slug}/` resolution (run `pnpm build`/the generator in `beforeAll`, like 2.2/2.3). Assert on `/timeline/index.html`: one `<h1>`; the era-bands (runway + agentic turn) labels present; the two flagship clusters; portfolio Dots `<a>` → real `/glass-box/...` (cross-check resolution); loandemo Dots `<a>` → `/work/loandemo#…`; semantic `<ol>` with DOM order oldest→newest; 0 executable scripts; no exclamation marks; no fabricated-fact red flags (the runway uses era-band/faint ticks, `[OPEN]`/`[ASSUMPTION]` where unknown).
  - [x] e2e (Playwright, `web/e2e/`): real-runtime (Rule 3) — the timeline renders; assert the horizontal (desktop viewport) vs vertical (mobile viewport) reflow while the DOM order is unchanged (query the `<li>` order at both viewports — same sequence); a Dot link navigates to a real Glass Box reader; JS-off the spine is a followable `<ol>`. axe AA on the timeline → 0 violations.
- [x] **Task 6 — Verify floor.** `pnpm build`, `pnpm --filter web test`, `pnpm --filter web test:e2e`, axe AA, determinism. Resolve the 1.4/1.5 `/timeline` forward-reference (home Timeline teaser + footer/browse now reach the real timeline). Confirm 2.3's component tests still pass (TimelineDot extension didn't regress). One `<h1>`, 0-JS.

## Dev Notes

### Reuse the Story 2.3 component (do NOT duplicate)

- `web/src/components/glassbox/TimelineDot.astro` already implements `resting`/`filled`/`live`/`upcoming` with a `state` prop and is `aria-hidden` decorative. EXTEND it with `faint` (11px circle, 1.5px `#C0B49B` ring) and `milestone` (17px filled accent). Story 2.3's `glassbox-components.component.test.ts` tests the existing states — keep them green (additive change). The Dot is shared by design (FR-14 foreshadowing: same Dot, two surfaces) — this story is where the Master Timeline reuse lands.
- If a cluster row reuses `ArtifactCard`, reuse it as-is; otherwise a lighter Dot+label link row is fine (the timeline is denser than the Glass Box index).

### UX-DR8 — the Master Timeline (EXPERIENCE.md, DESIGN §era-band/§timeline-dot)

- "One semantic ordered list, presented horizontal on desktop / vertical on mobile — orientation is presentation only; reading order (oldest → newest) is preserved in the DOM either way." (EXPERIENCE §Responsive.)
- **Era band** (EXPERIENCE): "A labeled region on the spine (each `<li>` carries an `aria-label`): the quiet ~30-year runway vs the dense agentic-engineering turn. Presentation only over a real ordered list." DESIGN §era-band: kicker label (runway in ink-secondary, agentic turn in accent), italic 11.5px ink-meta-min span, 1px DASHED hairline divider between eras, a meta reading note.
- **Flagship node** (EXPERIENCE): "A milestone Dot that expands to a small cluster of its Dots, each a real link. The portfolio node's Dots cross-link into the Glass Box; the loandemo node's Dots drill to `/work/loandemo#…`. (S1: cluster shown statically; S2: a zoom gesture toggles it.)" — S1 = static cluster (this story).
- **timeline-dot** (DESIGN): resting/filled/live (from 2.3) + `faint` (11px, 1.5px `#C0B49B` ring — quiet 30-year runway ticks) + `milestone` (17px filled accent — flagship milestone) + `spine` (1px hairline rule the dots ride on).
- **Reduced-motion** (EXPERIENCE §State Patterns): "Master Timeline — cinematic/scroll transitions off; the semantic `<ol>` renders statically (the live halo is already a static ring, no animation)." So Stage-1 timeline = pure static `<ol>` + CSS reflow → 0-JS, no motion gate needed.
- Tokens: `--color-accent`, `--color-ink-secondary`, `--color-ink-meta-min`, `--color-border-hairline`, the kicker/meta ramps, `#C0B49B` faint-tick ring (DESIGN-verbatim — decorative, no token needed). Reuse the spine hairline.

### The two flagships (the real proof)

- **Portfolio flagship** = THIS project. Its Dots = the Glass Box artifacts (brief · brainstorm · research · PRD · UX · the live-site shipping node) — link to `/glass-box/{slug}/` (the 2.2 readers) and/or `/glass-box/` (the 2.3 index). This is the recursion: the timeline node IS the site you're on.
- **loandemo flagship** = the live-on-stage engineering proof; its Dots are code/repo · build · retro (UX), drilling to `/work/loandemo#…`. The `/work/loandemo` route exists (1.5 stub); the fragment anchors + real repo/artifact URLs land in **Story 2.5** — so link `/work/loandemo#…` now (forward-reference, NOT a defect; 2.5 re-verifies), and flag the loandemo URLs `[OPEN]`.
- **Runway (~30 years)**: AC4 — do NOT fabricate. Render the labeled runway era-band + faint ticks (decorative span). If any real career milestone is known from the bio/brief, it may seed a faint/resting Dot; otherwise the runway is the era label + faint ticks, with `[OPEN]`/`[ASSUMPTION]` on anything not confirmed. Credibility > density.

### Critical gotchas (carry from 2.2/2.3)

- Exactly ONE `<h1>` (MirrorLayout title; cluster/era labels are h2/h3 or non-heading text — never a 2nd h1). 0 executable JS (reflow + Dot states are pure CSS). Drop-cap/pull-quotes FORBIDDEN here (reader-only). Trailing-slash links (`/glass-box/{slug}/`, `/glass-box/`; `/work/loandemo#…` keeps the fragment after the trailing slash if any — `/work/loandemo/#…`? confirm the canonical: the route is `/work/loandemo/` so use `/work/loandemo/#…`).
- **DOM order = reading order, both orientations.** The horizontal desktop layout MUST NOT reorder the DOM (no row-reverse, no order: on flex that changes SR/keyboard order) — orientation via layout flow only. The e2e asserts the `<li>` sequence is identical at desktop + mobile widths.
- Build-ordering: if portfolio Dots link `/glass-box/{slug}/`, the resolution test needs the Glass Box pages built (generate data first, as 2.2/2.3 do).

### Project Structure Notes

- New: `content/timeline/dots.ts` (the hand-curated manifest — repo-root `content/`, like the allowlist; Story 2.6 Project Import references it), `web/src/components/timeline/EraBand.astro` + flagship-node component (or under `components/glassbox/` — justify), tests under `web/test/` + `web/e2e/`. Modified: `web/src/pages/timeline.astro` (replace stub), `web/src/components/glassbox/TimelineDot.astro` (+faint/milestone — additive).
- User-facing → **Rule 3 applies**: QA includes a real-runtime (Playwright/browser) test (incl. the reflow + DOM-order check) + axe AA. The lead smoke drives the timeline at desktop + mobile widths in a browser.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — the three epic ACs (hand-curated seeded manifest, no harvest; era-bands + flagship clusters; reflow + JS-off `<ol>`).
- [Source: …/EXPERIENCE.md "Era band" / "Flagship node" / §Responsive (horizontal↔vertical reflow) / §State Patterns (reduced-motion → static `<ol>`)].
- [Source: …/DESIGN.md §components timeline-dot (faint/milestone/spine) + era-band].
- [Source: web/src/components/glassbox/TimelineDot.astro] — the component to extend (reuse, +faint/milestone).
- [Source: web/src/pages/glass-box/ (index + [artifact])] — the portfolio Dots' drill targets (Stories 2.2/2.3).
- [Source: web/src/pages/timeline.astro] — the 1.5 stub to replace.
- [Source: web/src/content/glassbox.index.ts] — the Glass Box node curation (for consistent artifact titles/links).
- [Source: .claude/rules/project-rules.md#2, #3] — trailing-slash form; forward-reference (`/work/loandemo#…` lands in 2.5).
- [Source: .claude/rules/skill-rules.md#Rule 3] — user-facing surface needs real-runtime test evidence.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

1. **HTML comment `!` in Astro output**: Astro emits `{/* JSX comments */}` as HTML `<!-- ... -->` in the built output. The existing `build-output.test.ts` strips only `<!doctype html>` before the `no !` assertion. Timeline's JSX comments contained `!` (e.g. `<!-- ONE semantic <ol> … -->`). Fix: removed all JSX block comments from `timeline.astro` and `FlagshipNode.astro` that would render as HTML comments.

2. **Duplicate `aria-label="Era: ..."` on two elements**: Both the `<li>` in `timeline.astro` and the `<div>` in `EraBand.astro` had the same `aria-label`. The e2e test expected `count(1)` but found 2. Fix: removed `aria-label` from the inner `EraBand` `<div>` — the host `<li>` carries it.

3. **WCAG color-contrast failures**: The initial CSS used `opacity: 0.7/0.8` on text elements colored with `--color-ink-meta-min` (#756b56, 4.64:1 ratio). Reducing opacity to 0.7 drops the effective contrast to ~3.22:1 — below AA (4.5:1). Fix: removed `opacity` from all meaningful text elements; used `--color-ink-secondary` (#6b5d4a, 5.63:1) for all informational supplementary text.

4. **WCAG link-in-text-block**: The cross-link `<a>` and dot-links inside prose text had `text-decoration: none`. WCAG 1.4.1 requires links in text blocks to be distinguishable without color alone. Fix: added `text-decoration: underline` to all in-text links in `timeline.astro` and `FlagshipNode.astro`.

5. **`content/timeline/dots.ts` location**: The story says `content/timeline/dots.ts` (repo-root `content/`). But `web/src/pages/timeline.astro` is built by Vite/Astro, which cannot import from outside the `web/` package directory. Moved the manifest to `web/src/content/timeline/dots.ts` — matching the existing `glassbox.index.ts` pattern in `web/src/content/`.

### Completion Notes List

- Task 1: Created `web/src/content/timeline/dots.ts` — a fully-typed hand-curated manifest with `EraBand`, `FlagshipNode`, `RunwayTick`, and `TimelineDotEntry` interfaces. Two era-bands: `runway` (3 faint ticks, `[ASSUMPTION]` labeled, no invented facts) and `agentic-turn` (loandemo flagship with 3 `[OPEN]`-flagged Dots + portfolio flagship with 6 real Glass Box Dots + 1 live-site Dot). Shape is extensible for Epic 6 auto-harvest.

- Task 2: Extended `TimelineDot.astro` additively with `faint` (11px, `#C0B49B` ring, decorative) and `milestone` (17px filled accent) states. All 4 existing 2.3 states remain unchanged and tested. Built `EraBand.astro` (kicker label, meta note, dashed divider) and `FlagshipNode.astro` (milestone Dot + static cluster Ol). Placed under `web/src/components/timeline/` per Project Structure Notes.

- Task 3: Replaced the 1.5 stub `timeline.astro` completely. MirrorLayout — one `<h1>`, entity-first lede, self-canonical. ONE semantic `<ol class="timeline-spine">` driven by `TIMELINE_ERAS`. Era-bands as `<li>` regions with `aria-label`. Flagship nodes + clusters each as `<li>`. Cross-link to `/glass-box/`. No JS, no drop-cap/pull-quote, trailing-slash links.

- Task 4: CSS-only reflow — `flex-direction: column` (mobile default), `flex-direction: row` on `@media (min-width: 900px)` (desktop). NO `order:` or `row-reverse` — DOM order is unchanged. Spine hairline switches between vertical (mobile) and horizontal (desktop). The live halo is a static ring (no animation → reduced-motion safe by construction).

- Task 5: Created `web/test/timeline.test.ts` (29 Vitest build-output tests) — beforeAll runs the generator + build, asserts all AC1–AC6 ACs at the static HTML tier. Created `web/e2e/timeline.spec.ts` (20 Playwright real-runtime tests) — axe AA (0 violations), desktop/mobile DOM-order identity, JS-off followability, all flagship links, era-band labels. Added `timeline` project to `playwright.config.ts`. Extended `glassbox-components.component.test.ts` with 2 new tests for `faint` and `milestone` states (additive; all 17 existing tests still pass).

- Task 6: `pnpm --filter web test` → 481 tests pass (15 files). `pnpm --filter web test:e2e --project=timeline` → 20 tests pass. 2.3 component tests all green. One `<h1>`, 0 executable JS confirmed. The `/timeline/` forward-reference from Stories 1.4/1.5 (home Timeline teaser + footer + `/browse`) now resolves to the real populated timeline.

### File List

- `content/timeline/dots.ts` (new — hand-curated manifest; **canonical repo-root location**, moved here from `web/src/content/` in code review)
- `scripts/render-timeline.ts` (new — content generator: `content/timeline/dots.ts` → `web/src/generated/timeline.json`; added in code review, parallels render-glassbox)
- `scripts/render-timeline.test.ts` (new — generator unit tests: shape, determinism, no-harvest, AC4 floor; added in code review)
- `scripts/build-content.ts` (modified — registered `renderTimelineGenerator` in `CONTENT_GENERATORS`; code review)
- `scripts/build-content.test.ts` (modified — registry assertion updated 1→2 generators; code review)
- `web/src/lib/timeline.ts` (new — build-time loader for `timeline.json`, graceful-absent; added in code review, parallels glassbox.ts)
- `web/src/components/timeline/EraBand.astro` (new)
- `web/src/components/timeline/FlagshipNode.astro` (new; code review: rewired import to the loader + removed an orphaned JSDoc)
- `web/src/pages/timeline.astro` (modified — replaces 1.5 stub; code review: imports `loadTimelineEras()` instead of the in-`web` manifest)
- `web/src/components/glassbox/TimelineDot.astro` (modified — additive faint + milestone states)
- `web/test/timeline.test.ts` (new — 34 Vitest build-output tests)
- `web/e2e/timeline.spec.ts` (new — 25 Playwright e2e tests)
- `web/playwright.config.ts` (modified — added `timeline` project)
- `web/test/glassbox-components.component.test.ts` (modified — additive faint + milestone test cases)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — 2-4 status → done)
- DELETED: `web/src/content/timeline/dots.ts` (superseded by the canonical repo-root location above)

### Change Log

- 2026-06-06: Story 2.4 implementation — Master Timeline hand-curated seeded. Replaced the 1.5 stub with a real timeline. Extended TimelineDot with faint/milestone states. Built EraBand and FlagshipNode components. 29 Vitest + 20 Playwright tests (all pass). WCAG 2.1 AA (0 axe violations). 0 executable JS.
- 2026-06-06 (code review): Moved the hand-curated manifest to the canonical repo-root `content/timeline/dots.ts` + added a `render-timeline` build generator (parallels render-glassbox) → `web/src/generated/timeline.json` → `web/src/lib/timeline.ts` loader. Resolves the AC1/architecture path deviation; QA suite raised to 34 Vitest + 25 Playwright. All green; build deterministic.

### Review Findings

**Code review (2026-06-06, adversarial: Blind Hunter / Edge-Case Hunter / Acceptance Auditor). Outcome: 1 decision (resolved by patch), 2 patches applied, 2 deferred (LOW), 2 dismissed.**

Verification floor after fixes: **486 web vitest + 82 scripts vitest + 131 e2e (incl. all 25 timeline e2e + axe AA 0 violations) — all pass; `check-deterministic` PASS (web/dist byte-identical across two clean builds); `astro check` 0 errors.**

- [x] [Review][Decision→Patch] **MED — manifest at the wrong path; moved to canonical repo-root `content/timeline/dots.ts` + `render-timeline` generator** [content/timeline/dots.ts, scripts/render-timeline.ts, scripts/build-content.ts, web/src/lib/timeline.ts, web/src/pages/timeline.astro, web/src/components/timeline/FlagshipNode.astro] — The dev placed the manifest at `web/src/content/timeline/dots.ts`, but AC1 + architecture.md §Structure (line 568) + §Requirements-to-Structure (line 618) + epics.md Story 2.4 + **Story 2.6 (the next story, line 614 — Project Import edits `content/timeline/dots.ts`)** all specify the **repo-root** `content/timeline/dots.ts` as the single source of truth (FR-33/34, code-as-CMS). The dev's rationale (Vite/Astro can't import across the `web/` package boundary) is valid but the architecture already solves it: the render-glassbox pattern reads repo-root `content/` at build → emits `web/src/generated/*.json` → the page imports the JSON via a loader. **Resolved (lead's lean):** moved the manifest to repo-root `content/timeline/dots.ts`; added `scripts/render-timeline.ts` (registered in `CONTENT_GENERATORS`, emits `web/src/generated/timeline.json`, hand-curated only — NO harvest, deterministic); added `web/src/lib/timeline.ts` loader (graceful-absent, mirrors glassbox.ts); rewired `timeline.astro` + `FlagshipNode.astro` to import the loader. Also moots deferred item 2.3 (the parallel `glassbox.index.ts` footgun) for the timeline. Story 2.6 can now reference the real, canonical path.
- [x] [Review][Patch] **LOW — orphaned JSDoc comment with no member in `FlagshipNode` Props** [web/src/components/timeline/FlagshipNode.astro:27-28] — The `Props` interface ended with a dangling `/** Whether any cluster dot links to an external URL (for rel=noopener). */` doc comment describing a property that does not exist (the `isExternal` decision is computed inline per-dot in the body). Dead/misleading documentation. **Fixed:** removed the orphan; documented the real `cluster` member instead.
- [x] [Review][Patch] **LOW — dead `ariaHidden` variable failed `eslint` (and thus `pnpm test:all` / CI), pre-existing in the QA test** [web/test/timeline.test.ts:385] — The aria-hidden build-output test computed an `ariaHidden` count two regex ways but never asserted on it (the real per-`<span>` aria-hidden check is the `allDotSpans` loop below, which is order-robust). `@typescript-eslint/no-unused-vars` errored, so `pnpm lint` and `pnpm test:all` were RED before this review (independent of the manifest move). **Fixed:** removed the dead computation; the test's intent (every dot span is aria-hidden) is unchanged and still enforced by the loop. `pnpm lint` now 0 errors.
- [x] [Review][Defer] **LOW (latent determinism) — `new Date(date).toLocaleDateString(...)` in `FlagshipNode`/`TimelineDot` date formatting is builder-timezone-sensitive** [web/src/components/timeline/FlagshipNode.astro:44-52,84-93] — deferred, not a current defect. See deferred-work.md (2.4).
- [x] [Review][Defer] **LOW — Story 2.3's `ArtifactCard` default-`externalLabel` mismatch (assigned to 2.4 in deferred-work) is neither resolved nor surfaced here** — deferred, re-assigned forward. See deferred-work.md (2.4).
- [Dismissed] **Doc staleness — story prose says "29 Vitest + 20 Playwright" but the suite has 34 + 25** — not a code defect; the QA stage added 10 tests after the dev wrote the prose (cycle-log `qa_complete tests_added=10`). Change Log updated above; no action.
- [Dismissed] **DRY — the `~`/`new Date`/`isNaN` date-format IIFE is duplicated twice within `FlagshipNode.astro`** — single-component local duplication, acceptable; folded into the deferred date-format note as the natural fix vector (extract a shared `formatDotDate()` when the TZ-determinism item is addressed).
