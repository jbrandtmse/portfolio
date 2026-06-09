# Story 6.3: Glass Box guided tour

---
baseline_commit: 8791455
---

Status: done (code-review APPROVED 0 HIGH/0 MED; lead browser+curl smoke PASS — tour mounts, steps through real curatorNotes in build-story order, reader links resolve, JS-off <ol> full; see smoke-evidence/story-6.3-smoke.md)

<!-- Created by the /epic-cycle lead create-story gate (Epic 6), 2026-06-08. In epics.md (FR-15, FR-17). -->

## Story

As a practitioner,
I want a narrated, story-driven tour of the Glass Box,
so that I'm walked through how the site went from idea to deployed.

## Lead design decisions (baked in — read first)

The epics.md ACs + the existing Glass Box surfaces strongly constrain this story (it is a guided narration over the EXISTING `/glass-box` index + reader, not a new content surface), so no new owner-fork was needed. The lead's reasoned defaults:

1. **In-place narrated step-through on `/glass-box` that COMPOSES with the existing reader (does NOT duplicate it).** A deferred, light React island adds a "Start the guided tour" affordance to the existing index. Stepping walks the **build-story order** (the same date-sorted featured artifacts the static spine already renders), narrating each step with **the curated prose that already exists** (the framing lead + recursion beat as the intro; each artifact's existing `curatorNote` as its per-step narration — Rule 9: ZERO new fabricated narration), highlighting/scrolling to that artifact's spine item, with **next / prev / Esc** and a **"Read this artifact →" link to its `/glass-box/{slug}/` reader** (this is how it "composes with the artifact reader" — it leverages the reader, it does not re-render the body).
2. **The static `<ol class="glass-box__spine">` is the JS-off baseline (FR-8) — unchanged.** Every artifact, its `curatorNote`, and its reader link are already in the static `<ol>` (Story 2.3). The tour adds NO information not already present statically; JS-off loses nothing (the curated chronological build-story IS the static list). Do NOT hide information behind the tour.
3. **The tour is an INFORMATION affordance, so it is available under reduced-motion (unlike the 6.2 zoom).** Rationale: 6.2's zoom island deferred entirely under reduced-motion because it was a decorative MOTION enhancement; a guided tour is a NAVIGATION/INFORMATION feature a reduced-motion user still benefits from. So: the tour island mounts for all JS-on users, but every ANIMATED transition (scroll-into-view, fades) is gated behind `@media (prefers-reduced-motion: no-preference)` — under reduced-motion the tour steps **instantly** (no animated scroll), and JS-off falls back to the static `<ol>`. (Document this divergence from 6.2 so review does not flag it as inconsistent.) The island is LIGHT (DOM step-through + scroll-into-view; no GSAP/WebGL needed) so the heavy-defer treatment is not required — but load it deferred (first-interaction or `client:idle`) to keep the page's initial script footprint at its baseline.
4. **Resolve the deferred `resetRecuration` dead-code (triaged here from Story 5.3/5.4): DELETE the unused export.** `web/src/lib/recuration.ts` `resetRecuration()` is exported-but-unused (zero importers, zero tests) and only manipulates the HOME `<section>`s — the Glass Box tour (a `/glass-box` feature) has no reason to call it. Per the 5.4 deferral ("wire to Guide-close OR delete"), and since 6.3 is not the home Guide-close lifecycle, **delete the dead export** (+ confirm nothing else references it; the `pnpm test:all` gate must stay green).

## Acceptance Criteria

**AC1 — narrated guided tour in build-story order (the primary Glass Box experience, #6).**
**Given** `/glass-box/`
**When** the visitor starts the guided tour (a clear "Start the guided tour" control)
**Then** it presents a narrated path through the selected artifacts in **build-story order** (the same date-sorted sequence the static spine renders: brainstorm → pre-brief-research → product-brief → ux-design → prd → ux-experience → the shipping/live-site node — corrected at code-review to match the real date-sort: ux-design `2026-06-04` precedes prd/ux-experience `2026-06-06`), one step at a time, each step showing that artifact's title + its existing curated narration (`curatorNote`) and visually focusing/scrolling to it. Navigation is **next / prev / Esc / start-over**, operable by **pointer AND keyboard**, with focus managed (focus moves to the active step; Esc closes the tour and returns focus to the start control).

**AC2 — composes with the artifact reader.**
**Given** a tour step
**When** the visitor chooses to read the artifact
**Then** a "Read this artifact →" affordance links to that artifact's existing `/glass-box/{slug}/` reader (Story 2.2) — the tour LEVERAGES the reader, it does not duplicate the body. The 6 featured slugs link to readers that resolve **200** (no fabricated/broken links — Rule 9). Ghost/not-yet-published nodes (architecture/epics/retrospective) are presented honestly (e.g. an "as it accrues" step or omitted) — never a fabricated reader link.

**AC3 — degrades to the static ordered list with JS off (FR-8).**
**Given** JS off (or before the island mounts)
**When** `/glass-box/` loads
**Then** the static `<ol class="glass-box__spine">` is the full experience — every artifact, its `curatorNote`, and its reader link present and reachable, in build-story order — exactly as Story 2.3 ships today. The tour adds NO information not already in the static list; nothing is gated behind the tour. (Under **reduced-motion**, the tour is usable but performs NO animated transitions — instant steps; all motion CSS under `prefers-reduced-motion: no-preference`.)

**AC4 — credibility floor (Rule 9) + determinism.**
**Given** all tour narration
**When** it renders
**Then** every narration string traces to EXISTING curated content (the framing lead, the recursion beat, the per-artifact `curatorNote`s) — ZERO newly-invented facts/claims about the artifacts; no "every artifact is published" class claim; ghost nodes honestly labeled. The build stays byte-deterministic (`pnpm run check-deterministic` PASS) and the page's initial executable-script count stays at its baseline (the deferred/light tour island is not statically eager-loaded into the budget).

## Dev Notes

### Grounded machinery map (verified at baseline — reuse, do not reinvent)

- **Index page (the surface to enhance):** `web/src/pages/glass-box/index.astro` — renders `<section class="glass-box__spine-section">` → `<ol class="glass-box__spine" role="list">` of `<li class="glass-box__spine-item">`, each an `ArtifactCard` (with `TimelineDot`) linking to `/glass-box/{slug}/`. Build-story order = `FEATURED_SLUGS` (in `web/src/content/glassbox.index.ts`) **sorted by artifact `date`** (index.astro lines ~56–58). Existing curated prose to REUSE as narration: `.glass-box__framing-lead`, `.glass-box__recursion-beat` ("You're reading the build history of the site you're reading it on…"), `.glass-box__boundary-note`. Today the page has ZERO page-specific JS (e2e asserts exactly 2 site-wide scripts = GuidePill).
- **Reader (compose with, don't duplicate):** `web/src/pages/glass-box/[artifact].astro` → `ArtifactReader` (chip/curatorNote/date/body). It has NO prev/next nav today. The tour links OUT to it (`/glass-box/{slug}/`); you may optionally add prev/next to the reader, but the primary tour lives on the index. `getStaticPaths` from `loadGlassboxArtifacts()`.
- **Data:** `web/src/lib/glassbox.ts loadGlassboxArtifacts()` → `{ slug, type, title, date, curatorNote, body }[]` (reads `web/src/generated/glassbox.json`, Node fs — build-time). `content/glassbox.allowlist.ts` = the 6 entries + their curatorNotes (the narration source). `web/src/content/glassbox.index.ts` = `FEATURED_SLUGS` (order) + `SHIPPING_NODE` + `GHOST_NODES` (architecture/epics/retrospective — no readers).
- **Deferred-island pattern (COPY 6.2's, just-shipped):** `web/src/pages/timeline.astro` lines ~177–197 — a `<script>` with `onMotionAllowed(...)` or a light idle/first-interaction trigger → `void import('../lib/glassbox-tour/bootstrap').then(m => m.boot())`; bootstrap reads a `<script type="application/json" id="glassbox-tour-data">` data island, creates a mount node, `createRoot(...).render(<GlassBoxTour .../>)`, and adds a `--js-enhanced` class to manage the static spine. **DIVERGENCE for 6.3 (per decision #3):** the tour is an information feature — do NOT gate the whole mount behind `onMotionAllowed`; mount it for all JS-on users (deferred/idle for perf) and gate only the ANIMATED transitions behind `prefers-reduced-motion: no-preference`. (If you reuse the `onMotionAllowed`-gated bootstrap verbatim, reduced-motion users lose the tour — that's acceptable per AC3's "degrades to the static list," but the more inclusive instant-step approach is preferred; pick one and make the e2e match.)
- **Store:** `web/src/lib/store.ts` (`$guideOpen`, `$depth`, `$timelineFocus`). Add `$tourStep: atom<number | null>(null)` (null = tour closed; 0..N-1 = active step) and/or `$tourOpen`.
- **`resetRecuration` (decision #4):** `web/src/lib/recuration.ts` lines ~203–216 — DELETE the export (zero importers, zero tests; `grep -rn resetRecuration` should return only the definition before you delete it, and nothing after).
- **e2e patterns:** `web/e2e/glassbox-index.spec.ts` (JS-off test lines ~371–396: `browser.newContext({ javaScriptEnabled: false })`); `web/e2e/reduced-motion.spec.ts` (`page.emulateMedia({ reducedMotion: 'reduce' })`). New `web/e2e/glassbox-tour.spec.ts`.

### Watch-outs / do-NOT

- **Rule 9 (credibility):** narration = EXISTING curated prose only. Do NOT invent new descriptive claims about the artifacts. Do NOT imply unpublished artifacts are readable (the architecture/epics/retrospective ghosts have NO readers — present them honestly, e.g. an "as it accrues" closing step or omit them; never link to a non-existent reader).
- **FR-8 / AC3:** the static `<ol>` must remain the full experience JS-off — every artifact + curatorNote + reader link present. The tour must not be the ONLY way to reach any artifact.
- **Rule 12 (the active exhaustive-deps guard):** the tour island reads state (`$tourStep`, maybe a `motionAllowed`/reduced-motion flag) — every `useCallback`/`useEffect`/`useMemo` lists every captured reactive value. `react-hooks/exhaustive-deps` is an ERROR (Story 6.0) — heed it.
- **Rule 13:** assert the USER-OBSERVABLE outcome — stepping actually CHANGES the visible active artifact (the narration text + focus/scroll move; the right reader link is shown), not merely that `$tourStep` incremented. Mutation-verify.
- **Accessibility:** the tour is a real interactive region — proper roles/labels, keyboard next/prev/Esc, visible focus, focus moves to the active step, Esc returns focus to the start control. The decorative `TimelineDot`s stay `aria-hidden`; the meaningful content carries semantics.
- **NFR-6:** a new dynamic-import chunk → run `check-deterministic`; the tour island should be light (no new heavy vendor lib) — if you DO add one, pin it in `manualChunks`.
- **Determinism of order:** the build-story order is the date-sort already used by the index — reuse it (do NOT introduce a second divergent ordering). If a tour-specific order is ever wanted, that's a curated `glassbox.index.ts` change, out of scope here.

### Testing requirements

- **Unit (vitest, Rule 8 — real module, scoped, mutation-verified):** the `$tourStep` transitions (start → step → next/prev → close); any pure helper mapping step index → artifact (build-story order). If you delete `resetRecuration`, confirm no test referenced it (none does).
- **e2e (Playwright — real-runtime, Rule 3/13, PROVEN TO RUN per Rule 7):**
  - **AC1 on-path:** drive the real browser; start the tour; next/prev (pointer AND keyboard) → assert the VISIBLE active step changes (the narration text + the focused/scrolled artifact + the correct "Read this artifact" link), in build-story order. Mutation-verify the assertion reds if stepping is a no-op (Rule 13).
  - **AC2 compose:** the "Read this artifact →" link for a featured step points to `/glass-box/{slug}/` and RESOLVES 200; ghost nodes show no fabricated reader link.
  - **AC3 JS-off:** `browser.newContext({ javaScriptEnabled: false })` → the static `<ol>` shows all 6 artifacts + curatorNotes + reader links, in order, visible (extend `glassbox-index.spec.ts`). **AC3 reduced-motion:** `emulateMedia({ reducedMotion: 'reduce' })` → assert the tour is usable but performs NO animated transition (no animated scroll; computed `animation-name: none` / instant), AND the static list remains fully present.
  - **AC4 credibility:** assert every tour narration string is one of the known curated strings (curatorNotes / framing copy) — no stray/fabricated text; assert no "every artifact" class claim.
- **Run the CANONICAL ROOT gate verbatim (Rule 5):** `pnpm test:all` (`typecheck` → `lint` [incl. exhaustive-deps] → `format:check` → `test` → `test:e2e` → `lh`) + `pnpm run check-deterministic` — all green.

## File List

_(dev fills in)_

Expected:
- `web/src/lib/store.ts` (UPDATE) — `$tourStep`/`$tourOpen`
- `web/src/islands/GlassBoxTour.tsx` (NEW) — the guided-tour island
- `web/src/lib/glassbox-tour/bootstrap.ts` (NEW) — deferred boot/createRoot
- `web/src/pages/glass-box/index.astro` (UPDATE) — data island + deferred-mount `<script>` + start affordance; keep the static `<ol>` baseline; motion-gated tour CSS
- `web/src/lib/recuration.ts` (UPDATE) — DELETE the dead `resetRecuration` export
- `web/e2e/glassbox-tour.spec.ts` (NEW) + maybe `web/e2e/glassbox-index.spec.ts` (UPDATE) — AC1–AC4 e2e
- unit tests for `$tourStep`/the step→artifact helper

## Tasks

- [ ] Add `$tourStep` (+`$tourOpen` if needed) to `store.ts`.
- [ ] Build `GlassBoxTour.tsx` (start control; step-through in build-story order; narration from existing curatorNotes/framing prose; next/prev/Esc/start-over; pointer+keyboard; focus mgmt; "Read this artifact →" reader links; transitions gated behind no-preference; exhaustive-deps clean).
- [ ] Update `glass-box/index.astro`: data island, deferred light mount `<script>`, start affordance; keep the static `<ol>`; add motion-gated tour CSS.
- [ ] DELETE the dead `resetRecuration` export from `web/src/lib/recuration.ts` (confirm zero references first + after).
- [ ] e2e `glassbox-tour.spec.ts`: AC1 (step changes visible active artifact, mutation-verified), AC2 (reader link resolves 200 + no fabricated ghost link), AC3 JS-off (static list full) + reduced-motion (no animated transition, list present), AC4 (narration traces to curated strings). Unit tests for the store/helper.
- [ ] `pnpm test:all` (verbatim) + `pnpm run check-deterministic` — all green.

## Integration ACs

This story is a **consumer/UI** over the existing Glass Box index + reader (Story 2.2/2.3) — it introduces no new service. Rule 3 (real-runtime test) is satisfied by the AC1/AC2/AC3 Playwright e2e against the served build. No new producer/Integration AC is required. Story 6.4 (explorable map) is the sibling consumer of the same artifact set; the tour and the map are the two paths of the "#6" Glass Box experience.

## Review Findings (code-review stage, 2026-06-08)

**Verdict: APPROVED.** Reviewed the FINAL combined dev+QA state fresh against the real build/runtime. Zero defects requiring code changes; one minor doc-accuracy nit auto-corrected in the story file (no code change). All adversarial focus points independently reproduced — not trusted.

### Real-runtime verification performed (fresh, this run)

- **Build** — clean (`pnpm run build`, 17 pages). Built `/glass-box/index.html` ships **exactly 3 executable scripts** (`application/json` data island correctly excluded); the heavy `GlassBoxTour.*.js` chunk is NOT eager-loaded (deferred via `requestIdleCallback`). AC4 / NFR-1 budget honored.
- **Determinism (NFR-6)** — root `pnpm run check-deterministic` **PASS** (web/dist byte-identical across two clean builds; tree hash `e1d16351…`). The deferred dynamic-import chunk introduced no nondeterminism.
- **Unit** — `glassbox-tour.test.ts` + `glassbox-index.test.ts` + `build-output.test.ts` → **298 passed**. Script-count assertions are genuine `.toBe(3)` (not loosened).
- **e2e `glassbox-tour` project** — **24 passed, 0 skipped** (Rule 7 confirmed — proven to run, no `test.skip`). AC1/AC2/AC3/AC4 all exercise the real served runtime.
- **Regression** — `glassbox-index` + `glassbox-reader` → **50 passed** (incl. the axe-core WCAG2a/2aa audit on `/glass-box/`, the verbatim recursion beat, JS-off followability, ghost-node honesty/no-dead-links). `axe-desktop` project → **8 passed**. No regression.
- **Lint** — eslint on island/bootstrap/recuration/store → **0 errors** (`react-hooks/exhaustive-deps` is ERROR and clean — Rule 12 mechanical guard satisfied).

### Mutation verifications (Rules 8/12/13 — backed up via temp `cp`, never git; all restored byte-identical, no residue)

1. **AC1 stepping / Rule 13 (the Epic-5 no-op trap)** — made `goNext` a no-op in the real island, rebuilt: 3 AC1 e2e tests RED (narration-change, `data-tour-active` slug-change, build-story-order). The on-path stepping outcome is genuinely asserted (not vacuous). Restored → green.
2. **Rule 13 visible-highlight CONSUMER** — removed the `[data-tour-active]` outline CSS rule, rebuilt: the "VISIBLE highlight outline" test RED (`outline-style was 'none'`). The CSS consumer (not just the attribute) is verified — the 5.4 trap is covered. Restored → green.
3. **Decision #4 deletion-guard** — re-added the `resetRecuration` export: the deletion-guard unit test RED. The test genuinely binds the real module export. Restored → green.

### AC verdicts

- **AC1 (narrated step-through, build-story order, pointer+keyboard, focus mgmt)** — PASS. Order is bound on the real runtime to the **actual date-sort** (`brainstorm, pre-brief-research, product-brief, ux-design, prd, ux-experience` — confirmed against `glassbox.json` dates AND the built static spine `data-tour-slug` sequence; JS stable-sort preserves source order for tied dates). Focus moves to the step panel; Esc returns focus to the start button.
- **AC2 (composes with reader)** — PASS. All 6 featured reader links resolve **200** against the served build; ghost nodes (architecture/epics/retrospective) are **omitted from the tour** and carry **no fabricated reader link** (verified in both the tour and the static `<ol>`, where they render honestly as dashed "As it accrues" cards with no `href`).
- **AC3 (JS-off + reduced-motion)** — PASS. JS-off: the static `<ol>` is the full experience (all 6 artifacts + curatorNotes + reader links present, in order); the tour gates NO information. Reduced-motion: the tour **mounts and is usable** (decision #3 divergence from 6.2 honored — it is an information feature), but performs **no animated transition** (computed `animation-name: none`, near-zero durations; all motion CSS under `@media (prefers-reduced-motion: no-preference)`).
- **AC4 (credibility — Rule 9 + determinism)** — PASS. **Broad audit**: every one of the 6 narration strings in the built data island traces byte-for-byte to a real `glassbox.json` `curatorNote`; the framing-lead and recursion-beat match the static curated copy verbatim; no ghost slugs in tour data; **zero fabrication**. No "every artifact is published" class claim. Determinism PASS; script budget = 3.

### Auto-resolved (this review)

- **[LOW / doc-accuracy, NOT a code defect]** Story AC1 parenthetical listed the build-story order as `…product-brief → prd → ux-design…`, but the real date-sort (and the implementation + all tests) puts `ux-design` (`2026-06-04`) before `prd` (`2026-06-06`). Corrected the parenthetical in-place (the authoritative definition — "date-sorted, same as the static spine" — was already correct; this only fixes the illustrative slug sequence). No code change.

No deferred findings. No HIGH/MED findings.
