# Story 7.2 — Lead per-story smoke (home featured-work greatest-hits + the composition fix)

**Date:** 2026-06-09 · **Method:** browser (chrome-devtools, real DOM measurement) + curl, against a fresh `pnpm build:content && pnpm --filter web build` served from `web/dist` (port 4401) · **Result: PASS** · **iterations:** 1 · **defects_caught:** 0 (the 2 HIGH were caught by QA/code-review; this smoke independently re-confirms the lead-flagged composition fix on the real runtime)

## What this smoke proves

Story 7.2 adds a curated home "featured work" greatest-hits set the Guide reorders by stated interest (curated default with no interest). The smoke verifies the user-observable outcomes on the real built/served page, with special attention to the **composition fix** the lead flagged at dev time (the new non-scene section colliding with the flex `order:0` scene reorder).

## Result (captured, real browser)

| Check | Result |
| --- | --- |
| `/` featured-work section present, between #thesis and #timeline (DOM) | ✅ `thesis → featured-work → timeline` |
| featured items in curated default DOM order (FR-8 crawlable) | ✅ `loandemo, portfolio, guide, music` |
| **Composition fix (lead-flagged): featured-work holds its slot JS-on (does NOT jump above thesis)** | ✅ visual order `hero → thesis → featured-work → timeline → speaker → flagship → glass-box → close`; `#featured-work` `style.order=1` (pinned to thesis), DOM tie-break keeps it AFTER thesis (top 1202 > thesis 787) |
| scene-rail still shows 7 tour scenes (featured-work is NOT a tour scene) | ✅ "SCENE 1 OF 7" — Hero/Thesis/Timeline/Speaker/Flagship/Glass Box/Close |
| **AC2 reorder mechanism (Rule 13): featured items visibly reorder via CSS `order`** | ✅ applied a reversed order → visual order became `music, guide, portfolio, loandemo` (`reorderWorked: true`) |
| **FR-8: DOM order unchanged after the visual reorder** | ✅ DOM stayed `loandemo, portfolio, guide, music` (`domUnchanged: true`) |
| 0 executable JS beyond the site-wide Guide pill | ✅ |
| console errors/warnings | ✅ none |
| voice (no exclamation) | ✅ 0 |

### Credibility floor (Rule 9 — every item grounded; no fabrication)

The rendered cards (verified visually + in source):
- **TECHNICAL — loandemo → `/work/loandemo/`** (real flagship).
- **AGENTIC — This portfolio → `/glass-box/`** (the real auditable BMAD proof; "thirty years" traces to the timeline's own `content/timeline/dots.ts` metaNote, span 1996→2026).
- **AGENTIC — The Guide → `/faq/`** (the real, live, citing agent).
- **CREATIVE — Music on Suno** — honest `[OPEN: Suno profile URL]` flag rendered as text ("the profile link will be added when confirmed"), NOT a broken link.
- The 7.3 playables are NOT in the featured set (correct — they remain "more coming" on the Wings). Zero fabricated items.

## Visual evidence

- `smoke-evidence/story-7.2-featured-work.png` (the "The work, curated" featured-work section rendered, with the scene-rail showing 7 scenes).

## Conclusion

The home featured-work greatest-hits renders crawlable in curated default order, the items reorder visibly on a stated interest while the DOM order stays the curated default (FR-8), and — the lead-flagged risk — the new non-scene section holds its curated slot (trailing thesis) on every JS-on arc instead of colliding with hero at flex `order:0`. The scene re-curation's 7-scene tour is unperturbed. Credibility floor holds. The composition defect (jump above thesis on every JS-on load) and the Rule-7 silent-skip (the featured-work e2e were registered in no Playwright project) were both caught and fixed in QA/code-review; this smoke is the independent real-runtime confirmation.
