# Story 6.4 — Lead per-story smoke evidence (Epic-6 capstone)

**Date:** 2026-06-09
**Method:** browser (real Chrome via chrome-devtools) + curl, against a locally built+served `web/dist`.
**Deliverable:** the Glass Box explorable map — a static, crawlable, clustered PHASE map (the free-browse secondary path alongside the 6.3 guided tour).

## What was exercised

1. **Static / crawlable JS-off baseline (AC2 / FR-8), via curl (no JS):** the `#glass-box-map` section is in the served HTML with all 6 featured nodes as real `<a href="/glass-box/{slug}/">` + the live-site `<a>`, grouped under the phase names (Discovery/Definition/Design/Launch); the ghosts (architecture/epics/retrospective) carry NO fabricated `/glass-box/` link (honest "as it accrues"). Crawlable by construction; the map adds 0 executable JS (script count stays `.toBe(3)`).

2. **Rendered phase-clustered map (AC1/AC3), real browser (JS on):** the map renders visibly (`mapVisible: true`) as:
   - **Explorable Map** → **Discovery** (Brainstorm Session · Pre-Brief Research) → **Definition** (Product Brief · PRD) → **Design** (UX Design · UX Experience) → **Launch** (The Live Site) → **As it accrues** (Architecture · Epics and Stories · Retrospectives — honest ghost placeholders).
   - Every featured node is a real link (6× "Read →" + the live-site "View →"). Free-browse (no forced order).
   - The **"choose your path"** affordance frames both: "Guided Tour — Narrated, build-story order — the primary path" and "Explorable Map — Phase-grouped, free-browse — explore any artifact in any order."

3. **Composition (AC3):** verified on a fresh load that the 6.4 map, the build-story spine, the phase text, AND the 6.3 tour island all coexist and PERSIST through the tour's deferred mount (checked DOM before + after the idle mount — all present). No clobbering. Screenshot: `story-6.4-map.png`.

4. **Credibility (Rule 9):** ghosts honest ("as it accrues"); no fabricated reader links; all phase/node labels trace to real curated data (CR's broad audit + QA's rendered-label binding test concur).

## Process note (carried to the retro)

The 6.4 dev stage left the gate RED at typecheck (a latent `ts(2538)` in `glassbox-tour.spec.ts:615` shipped byte-identical in 6.3 and missed by 6.3's QA+CR "typecheck green" claims). The lead applied the mechanical `!` fix (in-bounds loop index); QA + CR re-confirmed the full gate green fresh and the fix correct. Flag for the retrospective: consider a per-stage hard exit-code typecheck attestation.

## Verdict

**PASS.** The explorable map works end-to-end: static + crawlable JS-off (every node a real reader link, ghosts honest), renders as the clustered phase map JS-on, composes with the 6.3 tour, zero new executable JS. With 6.3 + 6.4 the "#6" Glass Box experience (narrated primary + free-browse secondary) is complete. iterations=1, defects_caught=0.
