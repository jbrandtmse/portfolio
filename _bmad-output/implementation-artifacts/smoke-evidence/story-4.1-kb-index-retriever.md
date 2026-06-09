# Lead per-story smoke — Story 4.1 (Knowledge Base index & retriever seam)

- **Date:** 2026-06-07
- **Method:** library/api real-runtime exercise (retriever over the real built index) + credibility-floor audit of the KB content
- **Branch:** PORT-1-epic4 (uncommitted working tree)
- **Result:** PASS (10/10 retriever assertions) — after fixing a smoke-caught credibility defect (iteration 2)
- **Iterations:** 2 (first pass surfaced a credibility-floor fabrication class → fixed inline + regression test → re-smoke pass)
- **Defects caught (that dev + QA + code-review all passed):** 1 systemic credibility-floor class (details below)

## Smoke-caught defect (HIGH, non-deferrable — the credibility floor)

The lead smoke's KB-content audit caught a **systemic fabrication the pipeline missed** — the KB docs over-asserted the Glass Box's publication state. QA had caught an invented BMAD acronym; code-review had caught the architecture-doc/tech-stack claims in `bmad-method.md`; but the same *class* persisted, unflagged, across THREE docs:

- `bmad-method.md` (line 9): "Every planning artifact — the PRD, architecture decisions, epics, story files, retrospectives — is published and readable through the Glass Box" — **false**: the publish allowlist (`content/glassbox.allowlist.ts`) carries exactly SIX artifacts (Brief, Brainstorm, Pre-Brief Research, PRD, UX Design, UX Experience); architecture/epics/stories/retrospectives are ghost "As it accrues" nodes, NOT published.
- `faq.md` (lines 37, 59): "every planning artifact for this portfolio is published and readable there" / "is published there" — same falsehood.
- `loandemo.md` (line 55): "Every planning artifact is readable there" — same falsehood.
- Plus the **portfolio-ADR** sub-class: `faq.md:35` + `bmad-method.md:35,44` asserted this portfolio's decisions are "recorded in ADRs" — but the portfolio has NO `docs/adr/` (it uses a single `architecture.md`). (`loandemo.md:25` keeps "recorded in ADRs" — it is faithful to the loandemo Mirror page, a separate project that asserts it.)

**Fix (inline, lead):** reworded all instances to the Mirror-faithful framing (the curated set is published; "more de-ghosts as they ship"); softened the portfolio-ADR claims to "recorded in the architecture document" / "recorded as they are made". Added a **line-scoped, real-`buildKbCorpus`-surface regression test** ("no unflagged line claims EVERY/ALL planning artifacts are published/readable") — **mutation-verified**: it flags all 3 original lines (true) and passes all 3 fixes (false). Regenerated `api/data/kb-index.json` (36 chunks). Re-ran the literal gate (green) and re-smoked (10/10).

> **Retro note:** this is the 3rd distinct credibility-floor fabrication in LLM-authored KB content for 4.1 (acronym → QA; tech-stack/architecture-readable → CR; every-artifact-published/ADRs → smoke). LLM-authored Mirror/KB prose is a high fabrication risk; the narrow per-incident regression tests each missed the next instance. Candidate Epic-4 retro rule: KB/Mirror prose needs a *broad* credibility audit against the allowlist + Mirror, not just per-incident spot tests.

## Evidence — real retriever over the real built index (the deliverable)

```
PASS: "LoanDemo loan origination ca…" → top route /work/loandemo/ (want /work/loandemo/)
PASS:   …top hit carries text + label + score
PASS: "signature talks speaking con…" → top route /speaking/ (want /speaking/)
PASS:   …top hit carries text + label + score
PASS: "thirty years background bio …" → top route /about/ (want /about/)
PASS:   …top hit carries text + label + score
PASS: "BMAD method how this portfol…" → top route /glass-box/ (want /glass-box/)
PASS:   …top hit carries text + label + score
PASS: nonsense query → empty or low-score (fail-closed signal): 0 hits
PASS: all returned routes are real Mirror routes
=== SMOKE: 10 passed, 0 failed ===
```

- `loadIndex()` + `search()` exercised against the REAL `api/data/kb-index.json` (36 chunks, regenerated post-fix). Every query's top hit routes to the correct Mirror citation target (FR-7); each hit carries text + label + BM25 score.
- A nonsense query returns 0 hits — the fail-closed signal Story 4.3 needs (below-threshold → canned "I don't have that documented", no model call).
- Every returned `route` is a real Mirror route (`/about/`, `/speaking/`, `/work/loandemo/`, `/faq/`, `/glass-box/`) — no fabricated citation targets.

## Gate corroboration (post-fix)

- Literal `pnpm test:all` re-run end-to-end → green through `lh` (`&&`-chain: lh ran last ⇒ all prior steps passed). Unit: **866 passed** (scripts 156 + api 80 + web 630), EXIT=0; e2e 213; Lighthouse autorun complete.
- KB index byte-deterministic; `@orama/orama` api-only (NFR-5); `api/data/kb-index.json` gitignored (not committed).
