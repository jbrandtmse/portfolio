# Story 6.1: Deterministic git→Dot auto-harvest

---
baseline_commit: 11a15a0
---

Status: done (code-review APPROVED 0 HIGH/0 MED; lead browser+curl smoke PASS — merged timeline renders, 6 planning Dot links resolve 200, 0 broken/[OPEN] anchors; see smoke-evidence/story-6.1-smoke.md)

<!-- Created by the /epic-cycle lead create-story gate (Epic 6), 2026-06-08. In epics.md (FR-15, FR-17). -->

## Story

As Josh, the builder,
I want BMAD Dots harvested deterministically from real git artifacts at build time,
so that the timeline regenerates itself as I add projects — no manual manifest.

## Owner decision (baked in — read first)

The epics.md AC says the harvest "replaces the Stage-1 hand-curated manifest." But the current manifest (`content/timeline/dots.ts`) also carries **pre-repo career milestones** (the "runway" era — `~1996` / `~2006` / `~2016`, `[ASSUMPTION]`-flagged) that **cannot be harvested from git** (they predate this repo), plus a curated era-band **narrative** (runway → agentic-turn) that Story 6.2's AC explicitly requires we "do **not** sand off." Josh chose the **Hybrid** approach (2026-06-08):

> **Auto-harvest the BMAD-process Dots** (completed epics, retrospectives, course-corrections, planning workflows) **deterministically from a NEW default-deny timeline allowlist** — so adding a project regenerates its Dots with no hand-editing (UJ-4). **Keep a small committed curated SEED** for the pre-repo career "runway" era + the era-band framing/metaNotes (the growth-arc narrative) + the flagship scaffolding that links to non-harvestable surfaces (e.g. loandemo's `/work/loandemo/#…` cluster). **The harvester MERGES seed + harvested Dots** into the same `EraBand[]` shape the page already reads.

This honors "replacing the manifest" for the part that GROWS (the BMAD-process Dots), while keeping the un-harvestable career runway + narrative intact and credible.

## Acceptance Criteria

**AC1 — deterministic build-time harvest from real artifacts, default-deny (FR-17, OQ#10).**
**Given** the repo's `_bmad-output/` artifacts
**When** `scripts/harvest-timeline.ts` runs at build time (as a `Generator` in `CONTENT_GENERATORS`)
**Then** it deterministically harvests BMAD Dots — **planning workflows, completed epics, course-corrections, retrospectives** — from the real artifacts, governed by the **same default-deny allowlist pattern** as the Glass Box (it iterates a curated allowlist; it NEVER walks `_bmad-output/` blindly), and it **replaces** the Stage-1 `renderTimelineGenerator` (`scripts/render-timeline.ts`) in the `CONTENT_GENERATORS` registry. Output is written to the existing path `web/src/generated/timeline.json` in the existing `EraBand[]` shape (so `web/src/lib/timeline.ts` `loadTimelineEras()` and `web/src/pages/timeline.astro` are UNCHANGED).

**AC2 — new project/artifact regenerates automatically (UJ-4).**
**Given** a newly added/imported artifact (a new epic completes, a retro lands, a project is imported)
**When** the curator adds ONE entry to the timeline allowlist and the site rebuilds
**Then** that artifact's Dot(s) are regenerated automatically into the timeline — no hand-editing of the generated JSON, no hand-editing of per-Dot data beyond the single allowlist entry.

**AC3 — byte-stable across runs (NFR-6).**
**Given** identical inputs (the committed artifacts + allowlist)
**When** the harvest runs twice
**Then** the emitted Dot set is **byte-identical**. Dates come from **git committer dates** (`git log -1 --format=%cI -- <file>`, mirroring `scripts/render-glassbox.ts gitCommitterDate()`) — stable for committed history — NOT `Date.now()`/`new Date()`. Enumeration is **sorted/deterministic**. No `Math.random()`, no `fetch`/network, no wall-clock. The script passes the `scripts/pipeline-guards.test.ts` sweep and the full `pnpm run check-deterministic` (two clean builds → identical `web/dist/` tree hash).

**AC4 — hybrid merge: curated seed preserved.**
**Given** the curated seed (the runway era ticks + era-band framing/metaNotes + the flagship scaffolding for non-harvestable surfaces)
**When** the harvester runs
**Then** the emitted `EraBand[]` MERGES the committed seed with the harvested BMAD Dots: the runway era (career ticks) and the era narrative appear exactly as curated; the harvested epics/retros/course-corrections/planning-workflow Dots populate the agentic-turn era; the merge order is deterministic (oldest → newest within each era; flagships/clusters sorted by date then a stable key).

**AC5 — credibility floor (Rule 9, no fabrication).**
**Given** every harvested Dot
**When** its label/date/description/href is produced
**Then** each traces to a **real artifact** (the allowlist entry + the real file + its real git date) — **zero invented facts**. Runway ticks keep their approximate `~YYYY` date + `[ASSUMPTION]` flag; any unconfirmed URL is flagged `[OPEN]` (never a fabricated link). Default-deny guarantees private/never-publish artifacts (addenda, `.decision-log.md`, `review-*`, `reconcile-*`, `validation-report.md`, `.working/`) are NEVER emitted as Dots — only allowlisted entries become Dots.

**AC6 — Integration AC: the existing `/timeline` renders the merged Dots.**
**Given** the harvested + merged `web/src/generated/timeline.json`
**When** `/timeline/` is built and served
**Then** the page renders the merged set end-to-end: the curated **runway** era AND the harvested BMAD Dots (epics/retros/course-corrections/planning workflows) in the **agentic-turn** era are visible; the page degrades to the semantic `<ol>` with **JS off / reduced-motion** exactly as today (no info gated behind JS — FR-8); and clicking a Dot resolves to its target (a `/glass-box/{slug}/` reader where allowlisted, else a documented `[OPEN]`/non-link — no broken link to a fabricated target). _(Consumer exists NOW: `/timeline` reads the same JSON; this story re-verifies it renders the merged output.)_

## Dev Notes

### Grounded surface map (verified at baseline)

- **Page (UNCHANGED):** `web/src/pages/timeline.astro` → calls `loadTimelineEras()` from `web/src/lib/timeline.ts` (reads `web/src/generated/timeline.json`, graceful-absent → `[]`). Renders `<ol>` of `EraBand`s; entries are `kind:'tick'` (→ `TimelineDot`) or `kind:'flagship'` (→ `FlagshipNode` with a `cluster`). Do NOT change the page or the loader's contract — emit the same `EraBand[]` JSON.
- **Data shape (must conform):** `EraBand { id, label, metaNote, entries: (RunwayTick | FlagshipNode)[] }`; `RunwayTick { kind:'tick', label, date, state:'faint' }`; `FlagshipNode { kind:'flagship', label, date, description, cluster: TimelineDotEntry[] }`; `TimelineDotEntry { label, date, state, href, description? }`; `DotState = 'faint'|'resting'|'filled'|'live'|'upcoming'|'milestone'`. Types are declared in BOTH `content/timeline/dots.ts` and mirrored in `web/src/lib/timeline.ts` (no `shared/` timeline types) — keep them in sync if you extend them.
- **Current curated manifest (becomes the SEED):** `content/timeline/dots.ts` exports `TIMELINE_ERAS` = `[runway (3 [ASSUMPTION] ticks), agentic-turn (2 flagships: loandemo + "This portfolio")]`. The **portfolio flagship's cluster** today hand-lists the planning-workflow Dots (brainstorm, research, brief, prd, ux-design, ux-experience, live site) → these are exactly "planning workflows" and should become **harvested** Dots. The **loandemo flagship's cluster** (code/build/retro → `/work/loandemo/#…`) links to a case-study surface, NOT a `_bmad-output` artifact → keep it **seeded**.
- **Default-deny reference:** `content/glassbox.allowlist.ts` exports `GLASSBOX_ALLOWLIST: readonly GlassboxEntry[]` ({ sourceFile, type, slug, title, curatorNote }); `scripts/render-glassbox.ts renderGlassbox(allowlist, repoRoot)` iterates the allowlist (never the FS), throws on a missing allowlisted file (fail-loud). Mirror this exactly for the timeline allowlist.
- **Generator plumbing:** `scripts/build-content.ts` → `export interface Generator { name; run(): Promise<void> }` + `export const CONTENT_GENERATORS = [renderGlassboxGenerator, renderTimelineGenerator, buildKbIndexGenerator]`. Replace `renderTimelineGenerator` with your `harvestTimelineGenerator`. Build = `tsx scripts/build-content.ts && pnpm --filter web build`; generated output is gitignored (`web/src/generated/`).
- **Git-date pattern (copy this):** `scripts/render-glassbox.ts` lines ~63–75 — `gitCommitterDate(sourceFile, repoRoot)` = `execFileSync('git', ['log','-1','--format=%cI','--', sourceFile], {cwd: repoRoot, encoding:'utf8', stdio:['ignore','pipe','ignore']})`, validated against an ISO-8601 regex with a committed FALLBACK_DATE. Reuse/share this (do not re-invent a different date source).
- **Determinism gates:** `scripts/check-deterministic.ts` (two builds → compare `web/dist/` tree hash) and `scripts/pipeline-guards.test.ts` (sweeps every `scripts/*.ts` for `Date.now()`/`Math.random()`/argless `new Date()`/`fetch`/http URLs — your new script is swept automatically and MUST pass).

### Implementation shape (recommended)

1. **New timeline allowlist** `content/timeline.allowlist.ts` — `export const TIMELINE_ALLOWLIST: readonly TimelineHarvestEntry[]`, each `{ sourceFile, kind: 'planning'|'epic'|'course-correction'|'retrospective', label, href, state, … }`. This is the default-deny curation surface — adding a project = appending entries here (AC2). Seed it with the real current artifacts: the planning workflows (brief/research/prd/ux-design/ux-experience/brainstorm — paths from `GLASSBOX_ALLOWLIST`), the completed epics (`cycle-log-epic-{1..5}.md`), the course-correction (`planning-artifacts/sprint-change-proposal-2026-06-05.md`), and the retrospectives (`epic-{1..5}-retro-*.md`). Decide each Dot's `href` per the credibility floor — link to a `/glass-box/{slug}/` reader ONLY where that slug is actually allowlisted in `GLASSBOX_ALLOWLIST` today; otherwise use a documented `[OPEN]` placeholder in `description` with a non-broken `href` (do NOT fabricate a Glass-Box URL for an artifact that has no reader yet — guided-tour/map readers are Story 6.3/6.4).
2. **Curated seed** — refactor `content/timeline/dots.ts` into the seed: keep the `runway` era (ticks) + era-band ids/labels/metaNotes + the loandemo flagship (label/date/description/cluster). Drop the hand-listed portfolio-flagship cluster Dots that the harvest now produces (or keep the flagship NODE and let the harvest fill its cluster — your call, documented). Keep the credibility-floor invariants (runway `~YYYY` + `[ASSUMPTION]`; `[OPEN]` for unconfirmed URLs).
3. **`scripts/harvest-timeline.ts`** — `export function harvestTimeline(allowlist, seed, repoRoot): EraBand[]` (pure, testable, no IO side-effects beyond reading the allowlisted files + git): for each allowlist entry, read its real git committer date, build the Dot, fail-loud if the sourceFile is missing (mirror `renderGlassbox`); sort deterministically; MERGE into the seed's `EraBand[]`; JSON round-trip for a plain serializable structure. Plus `export const harvestTimelineGenerator: Generator` writing `web/src/generated/timeline.json` (mkdir + writeFileSync, `JSON.stringify(..., null, 2) + '\n'`).
4. **Registry swap** in `scripts/build-content.ts`: `renderTimelineGenerator` → `harvestTimelineGenerator`. Remove/retire `scripts/render-timeline.ts` (and its import) — or keep it unused; prefer removing to avoid a dead second timeline generator. Update `content/timeline/dots.ts`'s role comment.

### Watch-outs / do-NOT

- **Do NOT walk the filesystem to discover Dots** — that breaks default-deny (private artifacts would leak) AND determinism (dir order). Iterate the ALLOWLIST.
- **Do NOT introduce `Date.now()`/`Math.random()`/argless `new Date()`/`fetch`** anywhere in the script — `pipeline-guards.test.ts` will red, and it breaks NFR-6. Dates are git committer dates of committed files.
- **Do NOT fabricate** Dot labels, descriptions, dates, or hrefs (Rule 9). Every field traces to the allowlist entry + the real artifact + its real git date. No "every artifact is in the Glass Box" class claims. Unconfirmed URL → `[OPEN]`, never invented.
- **Do NOT change** `web/src/pages/timeline.astro`, `web/src/lib/timeline.ts`'s loader contract, or the `EraBand[]` JSON shape. The whole point is the page reads the SAME JSON, now harvested.
- **NFR-6 / build-graph:** this changes the content pipeline, not the web bundle graph — but still run `check-deterministic` (Epic-5 lesson: re-check NFR-6 whenever a generator changes).
- **The git-date determinism caveat:** `git log` committer dates are stable for committed history, but an UNCOMMITTED working-tree artifact has no commit date → the `gitCommitterDate` FALLBACK_DATE applies (already deterministic). The `check-deterministic` smoke runs two builds of the SAME tree, so this is stable; just be aware harvested dates reflect the last commit that touched each artifact.

### Testing requirements

- **Replace the stale Stage-1 assertion:** `scripts/render-timeline.test.ts` asserts "the source performs no filesystem/git enumeration" (Stage-1-only). That assertion is now FALSE by design for the harvester — update/replace this test file for `harvest-timeline.ts`: the harvester legitimately reads git/fs, so instead assert the **default-deny** (iterate allowlist, not FS), **determinism**, **merge**, and **credibility** properties below. Do NOT just delete the credibility-floor tests — port them to run against the harvested/merged output.
- **New `scripts/harvest-timeline.test.ts` (pure-function, Rule 8 — exercise the REAL exported `harvestTimeline`, scoped assertions, mutation-verified):**
  - **Default-deny:** an artifact present in `_bmad-output/` but ABSENT from `TIMELINE_ALLOWLIST` never appears as a Dot (add a known-private path mentally, assert it's not emitted); a private sibling (`.decision-log.md`, `review-*`) is never emitted.
  - **Determinism (NFR-6):** `harvestTimeline(...)` called twice on the same inputs returns deeply-equal output; the emitted JSON is a stable sort.
  - **Fail-loud:** an allowlist entry pointing at a missing file throws (mirror `renderGlassbox` AC4).
  - **Merge (AC4):** the runway era + its `[ASSUMPTION]` ticks survive into the output; the harvested Dots land in the agentic-turn era.
  - **Credibility (AC5):** runway ticks match `^~\d{4}$` + contain `[ASSUMPTION]`; no Dot href is a fabricated Glass-Box URL for a non-allowlisted slug; harvested dates equal the real `gitCommitterDate` of the source (not a wall-clock).
- **Integration / real-runtime (AC6, Rule 3/13):** a Playwright e2e (or the existing timeline build-output test path) that builds the content pipeline + the page and asserts the SERVED `/timeline/` shows BOTH a runway tick AND at least one harvested BMAD Dot (e.g. an epic or retro Dot), and that with JS off / reduced-motion the semantic `<ol>` still contains them (assert the user-observable rendered content, not just that the JSON has them — Rule 13). Confirm Dot links resolve (no 404 to a fabricated target).
- **Run the CANONICAL ROOT gate verbatim (Rule 5):** `pnpm test:all` (`typecheck` → `lint` → `format:check` → `test` → `test:e2e` → `lh`) AND `pnpm run check-deterministic` — both green. A scoped subset is insufficient.

## File List

- `scripts/harvest-timeline.ts` (NEW) — the harvester + `harvestTimelineGenerator`
- `content/timeline.allowlist.ts` (NEW) — the default-deny timeline allowlist
- `content/timeline/dots.ts` (UPDATE) — reduced to the curated seed (runway + era framing + loandemo flagship); role comment updated; TIMELINE_ERAS alias retained for brief transition
- `scripts/build-content.ts` (UPDATE) — swap `renderTimelineGenerator` → `harvestTimelineGenerator`
- `scripts/render-timeline.ts` (NO CHANGE) — kept but inactive (superseded; render-timeline.test.ts updated to test seed shape)
- `scripts/render-timeline.test.ts` (UPDATE) — updated for Stage-2 seed shape; "no automated harvest" assertion removed
- `scripts/harvest-timeline.test.ts` (NEW) — full harvest unit test suite (default-deny, determinism, fail-loud, merge, credibility)
- `scripts/build-content.test.ts` (UPDATE) — updated generator name assertion
- `web/e2e/timeline.spec.ts` (UPDATE) — Stage-2 assertions updated; AC6 integration block added
- `web/test/timeline.test.ts` (UPDATE) — milestone dot count assertion updated for Stage-2

## Dev Agent Record

### Implementation Notes

**Approach:** Hybrid merge pattern as specified by the owner decision. `harvestTimeline()` is a pure function that (1) iterates TIMELINE_ALLOWLIST to collect Dots with real git committer dates, (2) fails loud on missing files, (3) merges with TIMELINE_SEED — planning Dots into the "This portfolio" cluster, epic/retro/course-correction Dots as top-level FlagshipNode entries with empty clusters.

**Key decision — non-planning Dots as empty-cluster FlagshipNodes:** Epic/retro/course-correction Dots are rendered as FlagshipNode with `cluster: []`. This keeps the page components unchanged (they already handle FlagshipNode). Empty-cluster nodes render as a milestone dot + label + description with no child list. The `href: '[OPEN]'` on these entries is NOT passed to FlagshipNode component (which has no href prop), so no broken anchors appear in the HTML.

**Shared `gitCommitterDate()`:** Reused from `scripts/render-glassbox.ts` — no new date utility written, per the story's instruction to reuse the pattern.

**Stage-1 test updates:** The existing e2e and build-output tests had Stage-1-specific count assertions (2 milestones, 5 entries, cluster count = 10). Updated to `toBeGreaterThanOrEqual` and `toBeGreaterThan` thresholds that stay valid as the allowlist grows. The `cluster[n]` DOM-order test was updated to filter out empty clusters before asserting n > 0.

**Determinism verified:** `pnpm run check-deterministic` confirms byte-identical `web/dist/` across two clean builds (tree hash identical).

### Completion Notes

All 7 tasks complete. All ACs satisfied:
- AC1: `harvestTimeline()` iterates TIMELINE_ALLOWLIST, never the filesystem; replaces renderTimelineGenerator in CONTENT_GENERATORS.
- AC2: Adding a new artifact = appending one entry to TIMELINE_ALLOWLIST; the next build auto-regenerates.
- AC3: `check-deterministic` passes — byte-identical builds. `pipeline-guards.test.ts` sweep passes.
- AC4: Runway era + loandemo flagship + era framing preserved verbatim from TIMELINE_SEED.
- AC5: All planning Dots link to real GLASSBOX_ALLOWLIST slugs; epic/retro/course-correction Dots use `href: '[OPEN]'` (rendered as non-link text, never broken anchor).
- AC6: Served `/timeline/` shows both runway ticks (seed) and harvested BMAD Dots (e.g. "Epic 1 — Build Foundation", "Epic 1 Retrospective") — 4 new AC6 e2e tests verify user-observable rendered outcome, JS-off, and link resolution.

Gates: `pnpm test:all` — 184 scripts + 678 web + 219 api + 283 e2e + lh: all pass. `pnpm run check-deterministic`: PASS.

## Review Findings (code-review stage — 2026-06-08)

Adversarial code review of the FINAL combined dev+QA state, verified fresh against the real build/runtime (branch `PORT-1-epic6`). **Outcome: APPROVED — 0 HIGH, 0 MED, 1 LOW (accepted by story decision).** No auto-resolution edits to source were needed.

**Canonical gate re-run (verbatim, this stage):** `pnpm test:all` → **EXIT 0** — typecheck 0 errors; `eslint .` clean; `prettier --check .` clean (covers the new `scripts/harvest-timeline.ts`, `content/timeline.allowlist.ts` — Rule 5 satisfied); vitest **scripts 184 / api 219 / web 678** (1081); Playwright **283 passed, 0 skipped, 0 failed** (Rule 7); `lh` green on `/` + `/about/`. `pnpm run check-deterministic` → **PASS** (byte-identical `web/dist/` across two clean builds, hash `54d6ab2f…`).

**Adversarial focus — all verified:**
- **Determinism / NFR-6 (PASS):** no `Date.now()`/`Math.random()`/argless `new Date()`/`fetch`/http in `harvest-timeline.ts` (the `pipeline-guards.test.ts` `readdirSync` sweep covers it automatically — 19 tests pass; plus a source-scan unit test in `harvest-timeline.test.ts`). Dates are real `git log -1 --format=%cI` committer dates via the shared `gitCommitterDate()`. Sort is `byDateThenLabel` (locale-independent code-unit). **Tiebreak edge probed live:** 3 planning Dots share git date `2026-06-02T23:02:06+00:00` and order correctly by label code-unit (Brainstorm < Pre-Brief < Product). FALLBACK_DATE is a fixed constant → deterministic for any uncommitted artifact (moot for the all-committed real allowlist).
- **Default-deny (PASS):** harvester iterates `TIMELINE_ALLOWLIST` only — never the FS. Confirmed the private siblings (`review-adversarial.md`, `review-rubric.md`, `reconcile-*.md`, `addendum.md`) genuinely exist on disk next to allowlisted artifacts yet are absent from the allowlist → can never become Dots (the unit default-deny test is non-vacuous). Fail-loud on a missing allowlisted file (2 unit tests).
- **Credibility floor / Rule 9 (PASS):** audited every allowlist entry against the generated `timeline.json`. All 6 planning Dots link to real slugs present in `GLASSBOX_ALLOWLIST` (`brainstorm`, `pre-brief-research`, `product-brief`, `prd`, `ux-design`, `ux-experience`). The 11 `[OPEN]` Dots (1 course-correction + 5 epics + 5 retros) render as empty-cluster `FlagshipNode`s — `[OPEN]` is NOT passed as an `href` (FlagshipNode has no href prop), so NO `<a href="[OPEN]">` ever appears (e2e asserts `toHaveCount(0)`). Runway ticks keep `~YYYY` + `[ASSUMPTION]`. Zero invented labels/dates/descriptions.
- **Rule 13 — user-observable, MUTATION-VERIFIED by the reviewer:** the epic/retro/course-correction Dots render as VISIBLE milestone nodes (17px `.timeline-dot--milestone` + visible `.flagship-node__title` label + rendered `Jun 2026` date with verbatim ISO `datetime`). Reviewer reproduced one mutation (dropped the harvested non-planning entries in `mergeSeedAndDots` via a temp-`cp` backup, NOT git) → the AC6 "Epic 1 — Build Foundation IS VISIBLE" test **RED** (harvested `<li>` resolved to 0) → restored byte-clean. The QA-hardened AC6 assertion genuinely binds to the real rendered `<li>`, not a body-wide text match.
- **Rule 3/7 (PASS):** the 4 Story-6.1 AC6 integration e2e tests RAN (0 skipped) against the real served `/timeline/` DOM. The harvester unit tests exercise the REAL exported `harvestTimeline` (Rule 8 — scoped, mutation-aware assertions).
- **Rule 1 — Integration AC (PASS):** AC6 verifies the genuine producer→consumer wire-up (the harvest generator runs inside `pnpm build` → the unchanged `/timeline` page + loader render the merged dataset), not a mock.
- **Regression (PASS):** loandemo flagship cluster intact (3 real `/work/loandemo/#…` links), JS-off semantic `<ol>` intact, `project-import.test.ts` (Story 2.6 import path) still green via the retained `renderTimeline()` + `TIMELINE_ERAS` alias.

**LOW (accepted — no action):** `renderTimelineGenerator` remains exported in `scripts/render-timeline.ts` but is no longer registered in `CONTENT_GENERATORS` (an inert/dead export). This is intentional per the story File List ("`render-timeline.ts` kept but inactive") — the pure `renderTimeline()` it co-exports is still consumed by `scripts/project-import.test.ts` and `scripts/render-timeline.test.ts`, so the file is not orphaned and the unused generator export is harmless (not lint-flagged by `noUnusedLocals`, which ignores exports). Logged in `deferred-work.md` as dismissed.

## Change Log

- 2026-06-08: Story 6.1 implemented — deterministic git→Dot auto-harvest pipeline (harvest-timeline.ts, timeline.allowlist.ts, seed refactor, generator swap, tests updated + added).

## Tasks

- [x] Create `content/timeline.allowlist.ts` (default-deny) seeded with the real planning workflows + epics 1–5 + the course-correction + retros 1–5; set each Dot's href per the credibility floor.
- [x] Refactor `content/timeline/dots.ts` into the curated seed (runway + era framing + loandemo flagship).
- [x] Write `scripts/harvest-timeline.ts`: pure `harvestTimeline(allowlist, seed, repoRoot)` (git dates via the shared `gitCommitterDate` pattern, fail-loud, sorted, merge) + `harvestTimelineGenerator` writing `web/src/generated/timeline.json`.
- [x] Swap the generator in `scripts/build-content.ts`; remove/retire `render-timeline.ts`.
- [x] Replace `render-timeline.test.ts` + add `harvest-timeline.test.ts` (default-deny, determinism, fail-loud, merge, credibility — mutation-verified, real module).
- [x] AC6 e2e: served `/timeline/` shows a runway tick + a harvested BMAD Dot; JS-off `<ol>` contains them; links resolve.
- [x] Run `pnpm test:all` (verbatim) + `pnpm run check-deterministic`; all green.

## Integration ACs

This story is **service-introducing** (it produces the Dot dataset the `/timeline` page consumes). The consumer EXISTS now (`/timeline` already reads `web/src/generated/timeline.json`). **AC6** is the Integration AC: the existing page renders the harvested+merged Dots end-to-end (runway + harvested BMAD Dots visible; JS-off `<ol>` intact; links resolve). 6.2 (Zoomable Master Timeline) is the next consumer and will build on this harvested dataset.
