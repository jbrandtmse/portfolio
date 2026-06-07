# Lead per-story smoke — Story 4.4 (The Guide island — non-modal panel, citations & visible thinking)

- **Date:** 2026-06-07
- **Method:** browser (chrome-devtools MCP, real browser) against the prod-faithful served runtime (`serve-with-api.mjs`: built `dist/` + real `/api/guide` with `GUIDE_LLM_STUB=1`)
- **Branch:** PORT-1-epic4 (uncommitted working tree)
- **Result:** PASS — the full headline UX works end-to-end in a real browser
- **Iterations:** 1
- **Defects caught (past the pipeline):** 0 (the code-review already caught + fixed the AC4 dangling skip-link + the NFR-2 aria-busy gate + the client-directive comment; this smoke confirms the user-observable outcome)
- **Evidence:** a11y snapshots below + `smoke-evidence/story-4.4-guide-panel.png` (panel open with the answer + citation chips)

## Why this method

Story 4.4 is the capstone's headline UI deliverable — a non-modal conversational panel. The meaningful smoke drives it in a real browser (not the test harness) through the same prod-faithful proxy + real `/api/guide` SSE the e2e uses, confirming the user-observable outcome the ACs promise. (Extra lead diligence here because the dev sub-agent hung mid-run and was recovered — though QA + code-review then verified fresh + closed 3 gaps.)

## Evidence (real browser, driven via chrome-devtools MCP)

**1. Site-wide pill on a CONTENT route (AC1, NFR-1):** loaded `/about/` (a content route) → the real `<button>` "Ask my Guide" pill is present (it works site-wide; `/about/` ships only the small pill, not the heavy panel chunk — NFR-1 carve-out, lh green).

**2. Pill opens the NON-modal panel (AC1, AC2):** clicking the pill opened the panel. The a11y snapshot showed:
- `button "Close Guide" expandable expanded` (the pill toggled), `StaticText "Guide"`, `StaticText "Grounded · cites its sources"`, `button "Minimize Guide"`, `button "Close Guide"`.
- `log "Conversation transcript" live="polite"` with the in-voice greeting "I'm your guide to Joshua's work. I only say what it can back up."
- The **three starter chips** — "What does Joshua R. Brandt, MSE speak about?", "How do I invite Joshua to speak?", "What is loandemo?" — i.e. exactly `STARTER_PROMPTS` (Story 4.2, single source).
- The labeled composer (`textbox "Ask a question"` — **focused**, focus moved INTO the panel) + a disabled-until-input Send button.
- The page content (`main`, `contentinfo` footer) remained in the tree behind the panel — **non-modal, no scrim, page intact**.

**3. Chip query → real `/api/guide` SSE → grounded answer + citation chips (AC3):** clicking "What is loandemo?" added the query to the transcript and rendered the grounded answer ("Based on the available documentation, Joshua R. Brandt is an agentic engineering expert with over 30 years of experience.") followed by **three citation chips** rendered from the real `citation {route,label}` SSE events: "Source: FAQ", "Source: LoanDemo case study", "Source: How this was built".

**4. Follow a citation → routes the page behind + conversation persists (AC4, FR-7 — the headline guarantee):** clicking the "LoanDemo case study" citation chip → the page navigated to `http://127.0.0.1:4321/work/loandemo/` (the real Mirror route). The post-navigation a11y snapshot showed BOTH: (a) the new page content (the loandemo case study `<h1>` + sections), AND (b) the Guide panel STILL OPEN with the **entire conversation preserved** (greeting + "What is loandemo?" + the answer + all three citation chips), composer focused. The visitor followed a receipt **without losing their place** — exactly the non-modal "interrogate the work conversationally and follow the receipts" promise.

## Gate corroboration

- Code review re-ran literal `pnpm test:all` → exit 0: unit **946** (scripts 156 + api 129 + web 661) + e2e **240, 0 skipped** incl all **9 `guide-panel`** tests running against the real `/api/guide` SSE via the proxy (Rule 7 proven) + **lh green on `/` AND `/about/`**; `check-deterministic` PASS (byte-identical).
- NFR-1 carve-out (QA/CR-verified): the heavy `GuidePanel.*.js` (~22.5 KB) is NOT on `/about/` initial load (lazy inside the pill island); `/about/` lh has ~71% script-size / ~49% byte-weight headroom — comfortable, not a tripwire.
- Code-review auto-resolved 3 MED inline: the dangling post-citation skip-link (added a focusable `#guide-skip-target` to `MirrorLayout <main>` — verified on all citation-target pages), the `aria-busy` NFR-2 gate on the transcript, and the `client:only` comment fix. QA closed 3 coverage gaps (focus-not-trapped e2e, NFR-2 per-message e2e, a component-tier test) — all mutation-verified.
- No PII analytics; exclamation-free voice; JS-off → the hero entry falls back to `/faq` (e2e-covered).

## Recovery note (Epic-4 retro)

The Story-4.4 dev sub-agent **hung on its final `pnpm test:all` call** and was interrupted before writing its closing summary. The lead recovered: confirmed files intact (typecheck 0), re-ran the gate (exit 0), reconstructed the File List from `git status`, populated the Dev Agent Record, and handed to QA — which verified fresh and found that the dev's e2e *named* but did not *assert* two load-bearing guarantees (focus-not-trapped, NFR-2 per-message). Lesson for the retro: a hung/interrupted dev stage MUST be treated as needing full fresh verification (not assumed complete) — QA/CR caught the gaps the unfinished dev left.
