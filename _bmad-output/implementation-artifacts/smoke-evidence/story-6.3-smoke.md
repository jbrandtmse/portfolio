# Story 6.3 — Lead per-story smoke evidence

**Date:** 2026-06-08
**Method:** browser (real Chrome via chrome-devtools) + curl, against a locally built+served `web/dist`.
**Deliverable:** the Glass Box guided tour (narrated step-through over the existing `/glass-box` index, composing with the reader; deletes dead `resetRecuration`).

## What was exercised

1. **JS-off baseline (AC3 / FR-8), via curl:** the static `/glass-box/` `<ol class="glass-box__spine">` contains all 6 artifact reader links (`/glass-box/{brainstorm,pre-brief-research,product-brief,prd,ux-design,ux-experience}/`) + their curatorNotes (e.g. "47 ideas in 90 minutes…") in build-story order — the full experience with no JS.

2. **Tour mounts + steps (AC1, Rule 13), real browser:**
   - The tour island auto-mounts (deferred idle/timeout — not interaction-gated, per decision #3; available to all JS-on users incl. reduced-motion).
   - Started the tour → step 0 = **"Brainstorm Session · June 2, 2026 · 47 ideas in 90 minutes — the raw, unedited thinking…"** (the REAL curatorNote narration), with "Read this artifact →" → `/glass-box/brainstorm/`.
   - Clicked **Next** → step 1 = **"Pre-Brief Research · June 2, 2026 · The grounding pass…"** — the VISIBLE active step actually changed (`changed: true`), in build-story order (brainstorm → pre-brief-research, matching the date-sort).
   - Screenshot: `story-6.3-tour.png`.

3. **Credibility (AC4, Rule 9):** the narration shown is verbatim the real `curatorNote` data — zero fabricated prose. (CR's broad audit + mutation-verified the same.)

4. **`resetRecuration` deletion (decision #4):** the dead export is gone from `web/src/lib/recuration.ts`; only the deletion-guard test references it (mutation-verified by QA + CR).

## Verdict

**PASS.** The guided tour works end-to-end on the real browser: deferred mount, narrated step-through in build-story order with real curatorNotes, resolvable reader links, and a full JS-off static baseline. iterations=1, defects_caught=0 (QA/CR e2e already cover these; the smoke independently confirms the live step-through + the JS-off baseline on the served build).
