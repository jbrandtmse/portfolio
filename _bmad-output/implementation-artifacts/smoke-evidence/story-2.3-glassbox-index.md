# Story 2.3 — lead per-story smoke (Glass Box index — curated chronological build-story)

**Method:** browser + served-runtime. Fresh `pnpm build` → `web/dist` served by `python3 -m http.server` (mirrors prod nginx) → chrome-devtools MCP + curl. Did NOT touch the live deployment. **Result: PASS (1 iteration, 0 defects caught beyond automated tiers).**

## AC1/AC2 — the dated chronological spine (a11y snapshot of /glass-box/)
- Single `<h1>` "The Glass Box"; entity-first lede.
- Build-story spine (h2), chronological JUNE 2 → JUNE 6: **Brainstorm · Pre-Brief Research · Product Brief · UX Design · PRD · UX Experience** — each a card (type chip + h3 title + date + curator note) with a real `READ →` link to `/glass-box/{slug}/`.
- **Shipping node "The Live Site"** carries a **"Live · in progress"** pill (text) + a real `VIEW →` link to `https://joshuabrandt.abacusai.cloud/` + `[OPEN: PUBLIC REPO/COMMITS URL TO BE CONFIRMED]` (the code-review HIGH fix — the repo is private, so NO dead 404 link; the URL is shown as visible [OPEN] text, not a broken anchor).
- Ghosted nodes **Architecture · Epics and Stories · Retrospectives** each carry the literal **"AS IT ACCRUES"** status text (WCAG 1.4.1 — status in text, not color/shape alone).

## AC3 — copy (read verbatim in the snapshot)
- Default-deny-as-taste: "The Glass Box is default-deny: only artifacts that reward reading … Curation is an act of taste, not gatekeeping."
- Recursion beat VERBATIM: "You're reading the build history of the site you're reading it on. It's being built in the open, right now."
- Cross-link: "Glass Box = the build history of this specific project … see the **Master Timeline**" → `/timeline/`.

## AC5 — integration (index → reader, real browser click)
- Clicked the PRD card's `READ →` → navigated to `/glass-box/prd/` → single `GET … [200]`, **zero redirect hops**. The index→reader wire-up resolves against the real Story-2.2 reader pages (no 404).

## AC4/AC6 — floor
- 0 executable scripts on /glass-box; browser console: **0 messages** (clean). Determinism: `/glass-box/index.html` byte-identical across two builds (the code-review NFR-6 fix — ghost cards no longer bake `new Date()`).

## Evidence
- Full-page screenshot: `smoke-evidence/story-2.3-glassbox-index.png`.
