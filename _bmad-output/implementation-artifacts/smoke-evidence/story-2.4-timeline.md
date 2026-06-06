# Story 2.4 — lead per-story smoke (Master Timeline)

**Method:** browser + served-runtime. Fresh `pnpm build` → `web/dist` served by `python3 -m http.server` (mirrors prod nginx) → chrome-devtools MCP (desktop 1280×900 + mobile 390×844). **Result: PASS (1 iteration, 0 defects caught beyond automated tiers).**

## AC1/AC2 — the curated, seeded spine (desktop screenshot)
- Single `<h1>` "The Master Timeline"; entity-first lede; "the planning artifacts and build story are documented in the Glass Box" cross-link.
- **Two era-bands**: "THE RUNWAY" (the quiet ~30-year runway, faint ticks) and "THE AGENTIC TURN" (the dense turn), divided by the dashed hairline.
- **Two flagship nodes**, each expanding to a static Dot cluster:
  - **loandemo** — Dots "Code and constraint", "Build log", "Retrospective" (all `[OPEN]`-flagged, drilling to `/work/loandemo/#…` — Story 2.5 supplies the real URLs/anchors).
  - **This portfolio** — Dots Brainstorm · Pre-Brief Research · Product Brief · UX Design · PRD · UX Experience (→ the Glass Box `/glass-box/{slug}/` readers) + "The Live Site" (Live · in progress).

## AC4 — no fabricated career facts (credibility floor)
- The runway era is the labeled era-band + faint ticks; the only runway entries are visibly `[ASSUMPTION]`-flagged (no invented dates/employers/titles ship as fact). loandemo URLs are `[OPEN]`.

## AC3 — reflow (desktop horizontal / mobile vertical), DOM order preserved
- Desktop (1280px): the era bands lay out as the left→right craft-arc (runway left of agentic turn). Mobile (390px): vertical reflow (screenshot `story-2.4-timeline-mobile.png`). The e2e tier proves visual order === DOM order (oldest→newest) at BOTH widths via geometry (WCAG 1.3.2/2.4.3), mutation-verified.

## AC6 / floor
- Browser console: **0 messages** (clean). 0 executable JS on `/timeline/` (pure static `<ol>` + CSS reflow; the live halo is a static ring, no animation — reduced-motion safe by construction). axe AA 0 violations (e2e). One `<h1>`.

## Lead-applied cleanup folded into this commit (not a smoke defect)
- During post-code-review verification the lead found `pnpm format:check` (a `test:all` launch gate) was RED on 13 Epic-2 `.astro`/test files — the per-stage scoped prettier checks had missed the `.astro` files since Story 2.2, so 2.2/2.3 shipped format-RED. Ran `pnpm format` (repo-scaffold only; `.prettierignore` excludes `_bmad-output/` so the cycle log's literal tabs are untouched) → format:check GREEN. The re-wrap surfaced one brittle exact-substring assertion (the recursion-beat test) which was made whitespace-tolerant. Re-verified: web vitest 486, scripts vitest 82, e2e 131, typecheck 0, lint clean, build byte-stable.

## Evidence
- `smoke-evidence/story-2.4-timeline-desktop.png` (full-page desktop), `story-2.4-timeline-mobile.png` (mobile vertical reflow).
