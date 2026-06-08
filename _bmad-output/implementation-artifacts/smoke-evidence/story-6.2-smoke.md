# Story 6.2 — Lead per-story smoke evidence

**Date:** 2026-06-08
**Method:** browser (real Chrome via chrome-devtools) + curl, against a locally built+served `web/dist`.
**Deliverable:** the zoomable Master Timeline (deferred React island) + the CR's credibility fix (sentinel removal via the shared display helper).

## What was exercised

1. **Credibility fix (the CR's MED resolution), verified on the served build:**
   - `no Glass Box reader yet` sentinel in visible (non-data-island) prose: **0** occurrences (was 22× before the fix).
   - The clean affordance "Full reader coming in the guided tour and explorable map (Stories 6.3/6.4)." renders **11×** (one per harvested epic/retro/course-correction Dot).
   - The deliberate loandemo `[OPEN: repo URL — supplied by Story 2.5]` placeholder is **untouched** (intentional, different case); the runway `[ASSUMPTION]` ticks intact.
   - The 12 remaining `[OPEN` strings are all harmless `href:"[OPEN]"` data values inside the non-rendered `<script type="application/json">` data island.

2. **Deferred load (NFR-1 / AC5):** on initial load the `ZoomableTimeline` chunk is NOT fetched. After the FIRST interaction (a `Tab` keypress), the deferred dynamic import fired: `ZoomableTimeline.<hash>.js` loaded, `#timeline-spine` gained `timeline-spine--js-enhanced`, and 191 island `zt-*` nodes mounted. (GSAP/cinematic-gsap not eagerly loaded.)

3. **Semantic zoom — overview ↔ detail (AC1, Rule 13):**
   - Overview: the island renders each flagship as an `expandable` `<button>` (loandemo, This portfolio, Sprint Course-Correction, Epic 1–5 retros, Epic 1–5 builds) with clusters collapsed; the runway era as a list.
   - Clicked "This portfolio" → `aria-expanded="true"` and its cluster Dots became **computed-style VISIBLE** (width/height > 0, display ≠ none): Brainstorm Session, Pre-Brief Research, Product Brief, UX Design, Product Requirements Document, UX Experience — each linking to its real `/glass-box/{slug}/` reader (AC2). Screenshot: `story-6.2-zoom-expanded.png`.

4. **FR-8 baseline:** the static `<ol class="timeline-spine">` retains every era, flagship, cluster Dot, label, date, and link (the a11y tree before island mount shows the full set); the island only changes presentation.

## Verdict

**PASS.** The zoomable timeline works end-to-end on the real browser: deferred island, collapsed overview, click-to-expand reveals visible cluster Dots with resolvable reader links, and the credibility fix removes the leaked sentinel while keeping the honest affordance. iterations=1, defects_caught=0 (the QA/CR e2e already cover these; the smoke independently confirms the credibility fix + the live zoom interaction on the served build).
