# Story 2.2 — lead per-story smoke (Glass Box artifact reader)

**Method:** browser + served-runtime. Fresh `pnpm build` (pipeline → 6 reader pages) → `web/dist` served by `python3 -m http.server` (mirrors prod nginx) → curl + chrome-devtools MCP. Did NOT touch the live deployment. **Result: PASS (1 iteration, 0 defects caught beyond automated tiers).**

## AC1/AC2/AC3 — reader reading-order + one-h1 (a11y snapshot of /glass-box/prd/)
- `<h1>` "Product Requirements Document" (the artifact title — the SINGLE h1).
- Answer-first lede leads with "Joshua R. Brandt, MSE built this prd artifact …" (GEO entity-first).
- Type chip "PRD" · italic curator note · date "JUNE 6, 2026" · then the body.
- **Heading demotion verified live:** the body's own `#` → `<h2>` ("PRD: Josh Brandt Portfolio Site"), `##` → `<h3>` ("0. Document Purpose") — page keeps exactly ONE `<h1>`.

## AC2 editorial fidelity — the code-review MEDIUM fix verified
- The PRD body's inline code in headings renders as **36 `<code>` spans** (e.g. `[S1]` markers); **0 literal-backtick headings** — confirming the code-review fix (heading renderer now `parseInline`s tokens) shipped correctly.

## AC4 — 0-JS (NFR-1)
- `/glass-box/prd/` ships **0 executable `<script>`** (only static HTML/CSS). Browser console: **0 messages** (clean).

## AC1 — routing / form
- `/glass-box/prd/` and `/glass-box/ux-experience/` → HTTP 200 (trailing-slash form). Drop-cap (`::first-letter`) + small-caps chip CSS present in the built page.

## Evidence
- Screenshot: `smoke-evidence/story-2.2-reader-prd.png` (the PRD reader rendering the long-form).
