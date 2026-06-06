# Story 2.5 — lead per-story smoke (loandemo flagship case study)

**Method:** browser + served-runtime. Fresh `pnpm build` → `web/dist` served by `python3 -m http.server` (mirrors prod nginx) → chrome-devtools MCP. **Result: PASS (1 iteration, 0 defects caught beyond automated tiers).**

## AC1/AC2 — the layered case study (full-page screenshot of /work/loandemo/)
- Single `<h1>` "loandemo — the flagship case study"; entity-first lede.
- Long-form editorial devices render (case-study surface): a **pull-quote** ("Real value. Real build. Real retro. The agentic turn is not a prototype exercise — it is a disciplined engineering practice.") + a **drop-cap** opening "The proof" section.
- The three FR-22 shipping sections: **Code and repository** (`#code`, [CODE] chip), **The build story** (`#build`, [BUILD] chip), **Retrospective** (`#retro`, [RETRO] chip) — each method/approach narrative + `[OPEN]` asset gaps.
- "Related work" cross-link row → the Glass Box (recursion proof), the Master Timeline, the READY talk.

## AC3 — no fabricated facts (credibility floor)
- Visible body carries only `Stage-1`, `FR-22`, `2026`, `Epic 3` numerics; every asset gap (repo URL, stack, video, timeline, retro doc) is `[OPEN: …]` text. No invented metrics/outcomes/dates/URLs.

## AC5 — cross-story recursion journey (the 2.4 → 2.5 integration, real browser)
- From `/timeline/`, the loandemo flagship Dots link `/work/loandemo/#code`, `#build`, `#retro`. **Clicked the timeline "Code and repository" Dot → navigated to `/work/loandemo/#code`** — the fragment resolves to the real `<section id="code">`. The Master-Timeline → case-study drill-in works end-to-end (no dangling fragment).

## AC6 / floor
- Browser console: **0 messages** (clean) on the case study. 0 executable JS. axe AA 0 violations (e2e). CreativeWork JSON-LD valid (name "loandemo", real description, dateCreated). One `<h1>`; `#code`/`#build`/`#retro` headings are h2/h3.

## FR-22 complete
- Both Stage-1 flagships now present: the recursion-proof **portfolio** (via the Glass Box, 2.2/2.3) + the non-recursive engineering proof **loandemo** (here). They cross-reference each other.

## Evidence
- Full-page screenshot: `smoke-evidence/story-2.5-loandemo.png`.
