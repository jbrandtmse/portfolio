# Story 6.1 — Lead per-story smoke evidence

**Date:** 2026-06-08
**Method:** browser (real Chrome via chrome-devtools) + curl (crawlable/JS-off DOM) against a locally built+served `web/dist`.
**Deliverable:** deterministic git→Dot auto-harvest merged with the curated seed → rendered on `/timeline/`.

## What was exercised

1. `pnpm build` (content pipeline incl. `harvestTimelineGenerator` + astro) → 17 pages, `/timeline/index.html` emitted. Served `web/dist` on 127.0.0.1:4399.
2. **Crawlable / JS-off DOM (curl, no JS):** `/timeline/` HTML contains the full MERGED set — `The Runway` era + `Early shipping years` career tick AND every harvested BMAD Dot: `Sprint Course-Correction`, `Epic 1–5 Retrospective`, `Epic 1–5 — <build title>`. Confirms FR-8 degradation (no info gated behind JS).
3. **Credibility — links resolve, no fabrication:** the 6 planning Dots in the "This portfolio" cluster link to `/glass-box/{brainstorm,pre-brief-research,product-brief,prd,ux-design,ux-experience}/` — **all 6 return HTTP 200** (real readers in `GLASSBOX_ALLOWLIST`). **0** `href="[OPEN]"` anchors rendered (the 11 non-planning Dots correctly render as non-link milestone text).
4. **Real-browser visual render** (full-page screenshot `story-6.1-timeline.png`): two era bands render — THE RUNWAY (faint ticks) and THE AGENTIC TURN with the loandemo + "This portfolio" flagship clusters, then the harvested course-correction + Epic 1–5 retros + Epic 1–5 build milestones as VISIBLE milestone Dots (label + "Jun 2026" date). The empty-cluster harvested flagships render as visible milestone nodes (Rule 13 confirmed on the real page), not invisible/broken.

## Verdict

**PASS.** The harvested+merged timeline renders end-to-end on the served build: curated runway preserved, harvested BMAD Dots visible, planning links resolve (200), zero broken/fabricated links, JS-off DOM complete. iterations=1, defects_caught=0 (positive end-to-end confirmation; the link-resolution check independently confirms the credibility floor on the real build).
