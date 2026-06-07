# Lead per-story smoke — Story 3.2 (Copy-paste bios & social proof)

Date: 2026-06-07 · Method: browser (chrome-devtools MCP, real Chrome) + literal canonical gate · Result: **PASS** · iterations: 1 · defects caught by smoke: 0
Screenshot: `story-3.2-speaking-bios.png` (full `/speaking/` page, captured live)

Drove the real built `/speaking/` page in Chrome (served from `web/dist` on 127.0.0.1) — the novel deliverable is the interactive Copy button, so this is a true browser exercise, not just build-output inspection.

## AC1 — bios + the Copy enhancement (the interactive, novel part)

- Two `BioBlock`s render: **SHORT BIO / 50 WORDS** and **LONG BIO / 126 WORDS**, each with a real "Copy" `<button>`, the full bio as selectable plain text, and the fallback note "If the copy button fails, the text above is fully selectable."
- **Copy button works (browser-driven):** clicking "Copy Short bio" → the button text AND the `role="status"` `aria-live="polite"` region both change to **"Copied ✓"** (confirmed by polling the live region within its window). The copy enhancement is a single inline `<script type="module">` of **949 bytes** (sub-1KB), containing the `navigator.clipboard`/`writeText`/`data-bio-copy` logic, **no `src`, no React `client.*.js` chunk** — a vanilla progressive enhancement, exactly per Decision 2.
- The short bio rendered on the page is byte-equal to `PERSON.description` ("Joshua R. Brandt, MSE is a software engineer with 30 years of shipping experience … seasoned, building at the frontier.") — page text agrees with the Person JSON-LD (AC5). Both bios end the lowercase running-sentence tail "…seasoned, building at the frontier." (distinct from the Title-case hero `<h1>`).
- (The QA e2e in the green `pnpm test:all` separately verified, with granted clipboard permissions, that the clipboard receives the EXACT per-button bio text — #1 vs #2, not truncated. The MCP session denies clipboard *read*, which is a session limitation, not a defect; the "Copied ✓" state + the green e2e confirm the write.)

## AC2 — social proof, credibility floor honored

- "Why organizers book me" strip: 4 `Metric`s — **YouTube subscribers / total talk views / talks given** all render `[ph]` + "[OPEN: real figure pending]" as **visible text**; only **"30 / YEARS SHIPPING SOFTWARE / veteran IC"** is a real figure (consistent with `PERSON`, not invented).
- 4 conference logos render as "Conf logo [ph]" placeholders (visible text); 3 testimonials render "[OPEN: real testimonial pending]…" with "[OPEN: name pending]" / "[OPEN: event pending]" attributions.
- A proof-note states plainly that "Metrics, conference logos, and testimonials above are placeholders … Every figure is marked so nothing reads as a claim before it is real." Zero invented numbers/quotes/logos.

## AC3 — NFR-1 carve-out (verified live)

- `/speaking/` ships exactly ONE executable script — the 949-byte vanilla copy module (no React chunk). The 0-JS baseline holds: the bios are selectable plain text present in the DOM with a fallback note.

## AC4/AC5 — floor

- Literal `pnpm test:all` re-run GREEN by code-review (exit 0): web vitest 591 · scripts 107 · api 2 · Playwright e2e 189 · Lighthouse on `/` + `/about/`; `check-deterministic` byte-identical; axe AA 0 on `/speaking/`. No exclamation marks; trailing-slash links (footer shows "/about/", "/speaking/reel/", etc.).

## Verdict

The interactive Copy button works in a real browser ("Copied ✓"), the bios/credibility-strip render with the credibility floor honored, and the NFR-1 carve-out is correctly scoped. PASS — clear to commit.
