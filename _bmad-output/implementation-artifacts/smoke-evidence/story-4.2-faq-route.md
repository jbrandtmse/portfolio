# Lead per-story smoke — Story 4.2 (Crawlable FAQ Mirror route `/faq`)

- **Date:** 2026-06-07
- **Method:** browser / view-source of the built static `web/dist/faq/index.html` (the truest JS-off check — the static file IS what nginx serves)
- **Branch:** PORT-1-epic4 (uncommitted working tree)
- **Result:** PASS — 6/6 visible questions + valid FAQPage JSON-LD + 0 JS + clean credibility
- **Iterations:** 1
- **Defects caught (past the pipeline):** 0 (the dev applied Story 4.1's credibility lessons — content was Mirror-faithful from the start; CR confirmed clean)

## Why this method

`/faq` is a static Mirror route whose whole point is JS-off crawlability (FR-7, UX-DR14): "verifiable via view-source + find with JS disabled." The built `web/dist/faq/index.html` is exactly what nginx serves — inspecting it directly is the canonical view-source / JS-off smoke.

## Evidence (built static HTML — view-source equivalent)

```
6 visible <h3> questions in the initial HTML (starter prompts first):
  What does Joshua R. Brandt, MSE speak about?
  How do I invite Joshua to speak?
  What is loandemo?
  What is the BMAD Method?
  What is Joshua's background?
  Where can I follow Joshua's work?
FAQPage JSON-LD present: "@type":"FAQPage" with 6 Question nodes
Executable JS on /faq/: 0 (only the <script type="application/ld+json"> DATA block)
Credibility on served HTML: no "every planning artifact published" / no "recorded in ADRs" / no invented acronym
Exclamation marks: none
```

- All six Q&A pairs are real server-rendered HTML in the initial response (AC1) — not JS-injected; findable with JS disabled.
- The FAQPage JSON-LD `mainEntity` has exactly 6 Question nodes (one per visible `<h3>`), built from the same `FAQ_ITEMS` source (AC2 — no visible↔JSON-LD drift; the Epic-3 AC5 class is closed).
- 0 executable JS (NFR-1); the `/faq/` route stays static.
- Credibility floor held: the dev's `FAQ_ITEMS` content traces to the Mirror (the BMAD answer uses "the curated planning artifacts … with more de-ghosting as they ship", not "every artifact"; no portfolio-ADR claim; no invented acronym) — Mirror-faithful from the dev stage, unlike Story 4.1.

## Gate corroboration

- Code review re-ran literal `pnpm test:all` → exit 0: web unit 653 + scripts 156 + api 80, e2e **226** (faq specs 214–226 ran, **0 skipped** — Rule 7), Lighthouse pass; `check-deterministic` PASS (tree hash f41eaf5a, byte-identical). Lead independently mutation-verified the credibility regression suite is non-vacuous (injected "every planning artifact published" → 2 guards red; reverted byte-clean) and re-ran the full gate to exit 0.
- Resolves the Story-4.1 `content/kb/faq.md` `route: /faq/` citation target (Rule 3 forward-ref) and the 1.3 hero `/faq` fallback (verified reachable).

## Process note (for the Epic-4 retro)

The QA-stage agent **backgrounded the gate run and yielded without its closing summary** (the Epic-3 "background-and-yield" anti-pattern). The lead completed the QA verification (mutation-check + full gate) and cleaned up three orphaned `astro preview` processes the QA run left. The CR spawn prompt's emphatic "run synchronously, do NOT background-and-yield" directive (already present for CR) held for the CR stage; the same directive was **missing from the QA spawn prompt** — added to the remaining (4.3/4.4) QA prompts.
