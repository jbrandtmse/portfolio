# Story 4.2: Crawlable FAQ Mirror route (`/faq`)

---
baseline_commit: ec0429b48ac081cc9c4d573a133cf67143d53704
---

Status: done

<!-- Created by the /epic-cycle lead (Epic 4, Story 4.2), 2026-06-07. Fleshes the Epic-1 /faq stub with real
     crawlable Q&A + FAQPage JSON-LD. RESOLVES the forward-reference from Story 4.1's content/kb/faq.md (route /faq/)
     and the 1.3 hero's quiet "ask my Guide" → /faq fallback. NOT service-introducing (a Mirror route). -->

## Story

As an answer engine or a JS-off visitor,
I want a real, crawlable Q&A page,
so that the Guide's answers have a citable home that exists independent of the agent (FR-7, UX-DR14).

## Context & key decisions (read first)

`/faq` is one of the three GEO routes (UX-DR14) and the **citable home** the two-layer model depends on: the Guide (4.3/4.4) cites `/faq/` for its answers, so those answers must exist as crawlable, JS-off HTML independent of the agent. The Epic-1 stub (`web/src/pages/faq.astro`) already wires `MirrorLayout` (single `<h1>`), the GEO-floor LEDE (names "Joshua R. Brandt, MSE"), and the Story-1.6 `faqPageJsonLd` helper with **placeholder** Q&A. This story replaces the placeholders with the real Q&A and renders it visibly.

### Decision 1 — ONE web-side source feeds BOTH the visible Q&A and the FAQPage JSON-LD (no drift)

Define the Q&A once in a small data module (recommended `web/src/data/faq.ts`, exporting an ordered `FAQ_ITEMS: { question, answer }[]`), and use it for BOTH (a) the visible server-rendered `<h3>` question + `<p>` answer pairs and (b) the `faqPageJsonLd(FAQ_ITEMS)` structured data. **This is load-bearing (Epic-3 Rule-8 lesson):** Story 3.2's AC5 bug was a whole-document `toContain` that the JSON-LD satisfied while the *visible* text could drift. Here, one source guarantees the visible Q&A === the JSON-LD `mainEntity`, and the tests MUST scope to the **visible** element (an `.faq` `<h3>`/`<p>` selector), not a whole-document match the JSON-LD could satisfy.

### Decision 2 — content is consistent with `content/kb/faq.md` (the two-layer model) and fabricates nothing

The LEDE already promises "These answers are the same ones his Guide cites." So `/faq`'s Q&A MUST be consistent with the KB source `content/kb/faq.md` (Story 4.1) — same questions, same facts, **same `[OPEN]`/`[ASSUMPTION]` flags preserved verbatim in visible text**. The KB doc's six questions are the canonical set:

1. What does Joshua R. Brandt, MSE speak about?
2. How do I invite Joshua to speak?
3. What is the BMAD Method?
4. What is loandemo?
5. What is Joshua's background?
6. Where can I follow Joshua's work?

**Credibility floor (HIGH risk — enforced):** Story 4.1 surfaced THREE fabrications in LLM-authored KB prose (an invented BMAD acronym; a fabricated tech-stack + "architecture readable in the Glass Box"; an "every planning artifact is published" falsehood across 3 docs). `/faq` authors the same kind of prose — so **every claim must trace to a Mirror source** (`content/kb/faq.md`, `web/src/lib/person.ts`, `web/src/data/speaking.ts`, `web/src/pages/{about,speaking,work/loandemo}.astro`) or carry an `[OPEN]`/`[ASSUMPTION]` flag. In particular: do NOT claim "every/all planning artifacts are published in the Glass Box" (only the six allowlisted artifacts are — see `content/glassbox.allowlist.ts`); do NOT assert this portfolio recorded decisions "in ADRs" (it has no `docs/adr/`); do NOT invent the BMAD acronym expansion. Add a credibility regression test (reuse the patterns from `scripts/build-kb-index.test.ts`'s credibility-floor block, scoped to the `/faq` data).

### Decision 3 — answer-first; the three starter prompts lead

Each answer opens **answer-first** (the answer in the first sentence, not throat-clearing), and the page's lede names "Joshua R. Brandt, MSE" (already does). The **three Guide starter prompts** — the KB-answerable questions Story 4.4 will render as panel chips — lead the list and seed `/faq`'s first three entries:

1. "What does Joshua R. Brandt, MSE speak about?" (→ /speaking/)
2. "How do I invite Joshua to speak?" (→ /speaking/)
3. "What is loandemo?" (→ /work/loandemo/)

Establish these three as a named export (e.g. `STARTER_PROMPTS` in `web/src/data/faq.ts`, a subset/reference of `FAQ_ITEMS`) so **Story 4.4 reuses the exact same three** for the panel chips (single source — no drift between the /faq seed and the Guide chips). The remaining organizer/peer questions (BMAD Method, background, follow channels) follow.

### Decision 4 — 0 JS, JS-off verifiable, voice-clean

`/faq` stays 0-executable-JS (NFR-1) — pure server-rendered HTML; the JSON-LD `<script type="application/ld+json">` is DATA, not executable JS. The page is verifiable via `view-source` + browser find with JS disabled (FR-7/UX-DR14). Voice: positive-assertion, **no exclamation marks** (the project voice rule — extends to all copy).

### Decision 5 — resolves forward-references (Rule 3)

This story RESOLVES: (a) Story 4.1's `content/kb/faq.md` `route: /faq/` citation target (now a real, fleshed page); (b) the 1.3 hero's quiet "Or ask my Guide about the work" → `/faq` fallback (stays valid; Story 4.4 later switches that link to open the Guide island in place of the route). The hero link change is 4.4's job — do NOT change it here; just keep `/faq` a valid fallback.

## Acceptance Criteria

1. **`/faq` renders real, crawlable, server-rendered Q&A (answer-first, names Joshua).**
   **Given** `/faq` (fleshing the Epic-1 stub)
   **When** it renders
   **Then** it presents visible server-rendered `<h3>` question + `<p>` answer pairs (the six canonical questions, the three starter prompts first), each answer **answer-first**, the page lede names "Joshua R. Brandt, MSE" (GEO floor), and the placeholder stub-note is gone
   **And** every Q&A pair is real HTML in the initial response (not injected by JS) — verifiable via `view-source` with JS disabled.

2. **FAQPage JSON-LD is emitted from the SAME source as the visible Q&A (valid; no drift).**
   **Given** the Q&A defined once (e.g. `web/src/data/faq.ts` `FAQ_ITEMS`)
   **When** the page builds
   **Then** it emits a valid schema.org `FAQPage` (via the Story-1.6 `faqPageJsonLd`) whose `mainEntity` Question/`acceptedAnswer`→Answer set is **exactly** the visible Q&A — built from the same `FAQ_ITEMS` array, so the visible text and the JSON-LD can never drift
   **And** a test asserts the JSON-LD is valid FAQPage shape AND that each visible `<h3>` question has a matching JSON-LD `Question.name` (scoped to the `.faq` block, not a whole-document match — Rule 8 / project-rules Rule 8).

3. **Content is consistent with the KB (`content/kb/faq.md`) and fabricates nothing (credibility floor).**
   **Given** the LEDE's promise "the same answers his Guide cites" and the two-layer model
   **When** the Q&A is authored
   **Then** the `/faq` question set is consistent with `content/kb/faq.md`'s six questions, every factual claim traces to a Mirror source or carries an `[OPEN]`/`[ASSUMPTION]` flag verbatim, and there is **no fabrication** — specifically NO "every/all planning artifacts published in the Glass Box" claim (only the six allowlisted artifacts are published), NO portfolio "recorded in ADRs" claim (no `docs/adr/`), NO invented BMAD acronym expansion
   **And** a credibility regression test (scoped to the real `FAQ_ITEMS`/rendered `/faq`) locks these — mutation-verified non-vacuous.

4. **The three starter prompts are a single source reused by Story 4.4.**
   **Given** the three Guide starter prompts (Decision 3)
   **When** they are defined
   **Then** they are a named export (e.g. `STARTER_PROMPTS`) seeding `/faq`'s first three entries, and documented as the source Story 4.4's panel chips will reuse (so the /faq seed and the Guide chips never drift)
   **And** each starter prompt is KB-answerable (the Story-4.1 retriever returns a chunk with the expected Mirror route for it — a sanity assertion, optional but recommended).

5. **0 JS, JS-off verifiable, voice-clean (NFR-1, FR-7, voice).**
   **Given** `/faq`
   **When** it is built and served
   **Then** it ships 0 executable JS (the JSON-LD is `application/ld+json` DATA, not JS — NFR-1 build-output assertion holds), is fully readable/findable with JS disabled, and contains no exclamation marks (positive-assertion voice).

6. **Integration AC — a real-runtime e2e proves `/faq` serves the Q&A and resolves the 4.1 citation target.**
   **Given** the built/served site
   **When** a Playwright e2e loads `/faq/` (JS-off where relevant)
   **Then** it asserts the visible `<h3>` questions render (the six, scoped to the `.faq` block), the FAQPage JSON-LD is present + valid, axe WCAG 2.1 AA shows 0 violations, and `/faq/` is reachable as the citation target Story 4.1's `content/kb/faq.md` declares (`route: /faq/`) — resolving that forward-reference (Rule 3). The e2e is discoverable in the default suite and proven to execute (not skipped).

7. **The LITERAL canonical gate `pnpm test:all` is green end-to-end (Rule 5, NFR-1/6, AA).**
   **Given** the canonical gate (`typecheck && lint && format:check && test && test:e2e && lh`) + `check-deterministic`
   **When** the literal `pnpm test:all` runs end-to-end (NOT a scoped subset)
   **Then** every step is green incl `lh`, the build is byte-deterministic (`/faq` is static), `format:check` covers the new/changed `.astro`/`.ts`, and the existing 0-JS + trailing-slash + JSON-LD-validity assertions still hold for `/faq/`.

## Integration ACs

`/faq` is a static Mirror ROUTE (not a new service/module). It does not introduce a consumed service — skill-rules Rule 1's "introduces a service" clause does not apply. Its integration is twofold and verified by AC6: (a) it resolves the citation target `content/kb/faq.md` declares (`route: /faq/`, Story 4.1 forward-ref); (b) Story 4.4's hero "ask my Guide" entry uses `/faq` as the JS-off/no-Guide fallback. The real-runtime e2e (AC6) exercises the served route, not internal state.

## Consumes

- **Story 4.1 — `content/kb/faq.md`:** the KB source whose `route: /faq/` this route fulfills; `/faq`'s Q&A is kept consistent with it (Decision 2). (Consistency is a content invariant + a test; `/faq` does not import the KB markdown at runtime — it is a static page.)

## Tasks / Subtasks

- [x] **Task 1 — Define the FAQ Q&A as one web-side source (AC1, AC2, AC4).**
  - [x] Create `web/src/data/faq.ts`: `FAQ_ITEMS: { question: string; answer: string }[]` (the six canonical questions, starter-prompt three first), authored consistent with `content/kb/faq.md` — answer-first, `[OPEN]`/`[ASSUMPTION]` flags preserved verbatim, no fabrication (Decision 2). Export `STARTER_PROMPTS` (the three) for Story 4.4 reuse.
- [x] **Task 2 — Flesh `web/src/pages/faq.astro` (AC1, AC2, AC5).**
  - [x] Render visible `<h3>` question + `<p>` answer pairs from `FAQ_ITEMS` (a `.faq` block; semantic, keyboard-irrelevant since static). Remove the placeholder stub-note.
  - [x] Build the FAQPage JSON-LD from the SAME `FAQ_ITEMS` (`faqPageJsonLd(FAQ_ITEMS)`), replacing the placeholder pairs. Keep the `slot="jsonld"` inline script (DATA, not JS).
  - [x] Keep the GEO-floor LEDE (names Joshua). Confirm 0 JS + no exclamation marks.
- [x] **Task 3 — Tests (AC2, AC3, AC4, AC6).**
  - [x] Component/build-output test: visible `<h3>` questions render (scoped to `.faq`), the JSON-LD `mainEntity` matches the visible questions (same source), FAQPage shape valid. Extend `web/test/jsonld.test.ts` for the real FAQ.
  - [x] Credibility regression test (scoped to `FAQ_ITEMS`/rendered `/faq`): no "every/all planning artifacts published", no portfolio-ADR claim, no invented BMAD acronym; unflagged claims trace to the Mirror. Mutation-verify.
  - [x] e2e (`web/e2e/faq.spec.ts`): load `/faq/`, assert the six visible `<h3>` questions (scoped), FAQPage JSON-LD present+valid, axe AA 0 violations, JS-off readable. Discoverable + proven to execute.
  - [x] (Optional) starter-prompt KB-answerable sanity: each `STARTER_PROMPTS` entry → the 4.1 retriever returns the expected route. — SKIPPED (marked optional; the retriever path is covered by Story 4.1's own tests; AC4's "optional but recommended" explicitly allows this.)
- [x] **Task 4 — Verify with the LITERAL canonical gate (AC7).**
  - [x] Run the literal `pnpm test:all` end-to-end (Rule 5 — not a subset); ALL green incl `lh`. Run `check-deterministic` (web/dist byte-identical). Confirm `/faq/` 0-JS + trailing-slash + JSON-LD assertions hold. Note touched files in the Dev Agent Record.

## Dev Notes

### Current state (files being modified — read before editing)

- **`web/src/pages/faq.astro`** — the Epic-1 stub: `MirrorLayout` (heading="Frequently asked questions", lede names Joshua), imports `faqPageJsonLd` + `serializeJsonLd` from `../lib/jsonld`, emits PLACEHOLDER FAQPage JSON-LD (2 `[PLACEHOLDER]` pairs), body has only a `.stub-note`. Replace the placeholders + render visible Q&A. Keep the LEDE + the `slot="jsonld"` pattern.
- **`web/src/lib/jsonld.ts`** — `faqPageJsonLd(items: FaqItem[])` where `FaqItem = { question, answer }`; emits `{'@context','@type':'FAQPage', mainEntity: [{'@type':'Question', name, acceptedAnswer:{'@type':'Answer', text}}]}`. `serializeJsonLd` stringifies. Reuse as-is.
- **`content/kb/faq.md`** (Story 4.1) — the KB source: six `## ` questions + answer-first prose + an `[ASSUMPTION]` bio + `[OPEN]` channel URLs. `/faq`'s Q&A must be consistent with this (same questions/facts/flags). NOT imported at runtime — author `FAQ_ITEMS` consistent with it.
- **`web/test/jsonld.test.ts`** — existing JSON-LD validity tests (extend for the real FAQ). **`web/test/build-output.test.ts`** — 0-JS + structured-data + no-exclamation assertions (confirm globs cover `/faq/`).
- **MirrorLayout** — provides the single `<h1>` (from `heading`), canonical (self), trailing-slash URL form. `/faq` → `/faq/` (trailingSlash:'always').

### Constraints / invariants to preserve

- **Credibility floor (HIGH):** no fabrication; every claim traces to the Mirror or is `[OPEN]`/`[ASSUMPTION]`-flagged. (4.1 had 3 fabrications — do not repeat the class.)
- **Visible↔JSON-LD single source (Rule 8):** the visible Q&A and the FAQPage `mainEntity` come from ONE `FAQ_ITEMS`; tests scope to the visible `.faq` element, never a whole-document match.
- **NFR-1:** 0 executable JS on `/faq/` (JSON-LD is data); re-confirmed by e2e + build-output suite.
- **NFR-6:** byte-deterministic build — PASS (check-deterministic tree hash: f41eaf5a). **Voice:** no exclamation marks. **URL form:** `/faq/` trailing-slash (Rule 2).
- **Rule 3 forward-ref:** this story resolves 4.1's `/faq/` citation target; the e2e re-verifies it.

### Project Structure Notes

- New: `web/src/data/faq.ts` (Q&A single source + STARTER_PROMPTS), `web/e2e/faq.spec.ts`. Modified: `web/src/pages/faq.astro`, `web/test/jsonld.test.ts`, `web/playwright.config.ts`. No api/scripts/content changes (pure web Mirror route).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — server-rendered `<h3>`/`<p>` Q&A seeded from the 3 starter prompts + organizer/peer questions, answer-first naming Joshua, FAQPage JSON-LD via the 1.6 framework; mirrors the Guide's answers; view-source/JS-off verifiable.
- [Source: content/kb/faq.md] — the KB source (six questions) `/faq` stays consistent with (two-layer model).
- [Source: web/src/pages/faq.astro] — the Epic-1 stub (MirrorLayout + faqPageJsonLd placeholder).
- [Source: web/src/lib/jsonld.ts#faqPageJsonLd] — the FAQPage builder to reuse.
- [Source: _bmad-output/implementation-artifacts/3-2-copy-paste-bios-social-proof.md + Epic-3 retro] — Rule 8: visible↔JSON-LD drift (the AC5 whole-doc false positive); scope assertions to the visible element.
- [Source: .claude/rules/project-rules.md#8] + [_bmad-output/implementation-artifacts/smoke-evidence/story-4.1-kb-index-retriever.md] — the credibility-floor fabrication class to guard against.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6 (2026-06-07)

### Debug Log References
(none — no blockers or retries needed)

### Completion Notes List

1. **Task 1 complete:** `web/src/data/faq.ts` created. `FAQ_ITEMS: FaqItem[]` (6 items) with the three Guide starter prompts first (Decision 3), then the BMAD Method, background, and follow-channels questions. All answers are answer-first. `[ASSUMPTION]` flag preserved on bio item. `[OPEN:]` flags on channel URLs and travel availability. `STARTER_PROMPTS = FAQ_ITEMS.slice(0, 3)` exported as a reference slice (not a copy) for Story 4.4 reuse.

2. **Task 2 complete:** `web/src/pages/faq.astro` fleshed. Removed the `.stub-note` placeholder paragraph. Added a `<section class="faq" aria-label="Frequently asked questions">` block rendering `.faq__item` divs with `<h3 class="faq__question">` and `<p class="faq__answer">` from `FAQ_ITEMS`. FAQPage JSON-LD built from the same `FAQ_ITEMS`. Kept LEDE, `slot="jsonld"` pattern, 0 executable JS. No exclamation marks.

3. **Task 3 complete:**
   - `web/test/jsonld.test.ts` extended with 4 new `describe` blocks: FAQ_ITEMS shape (6 items, order, answer-first, no exclamation), STARTER_PROMPTS (3 items, correct reference to FAQ_ITEMS[0-2]), FAQPage JSON-LD from real FAQ_ITEMS (6 mainEntity entries, Question.name === FAQ_ITEMS[i].question), credibility regression (no "every/all artifacts", no ADR claim, no BMAD acronym expansion, [ASSUMPTION] on bio, [OPEN] on channels). All mutation-verified: the test asserts the REAL module.
   - `web/e2e/faq.spec.ts` created: 13 Playwright tests covering `/faq/` load, lede, stub removal, six scoped `<h3>` questions, starter prompt order, Q&A pairs, FAQPage JSON-LD (valid + single-source check: JSON-LD name === visible `<h3>` text), axe WCAG 2.1 AA (0 violations), JS-off readable, 0 executable scripts, no exclamation marks, HTTP 200 / citation-target reachability, global footer.
   - `web/playwright.config.ts` updated: added `faq` project pointing to `faq\.spec\.ts`.

4. **Task 4 complete:** `pnpm test:all` ran end-to-end — 226 e2e tests passed (13 new faq tests among them), 650 web unit tests passed, 156 scripts tests, 80 api tests. Lighthouse passed. `check-deterministic` passed (tree hash f41eaf5a matches across two clean builds). All canonical gate steps green (typecheck 0 errors, lint clean, format:check clean, tests all pass, e2e 226/226, lh pass).

5. **Credibility floor verified:** No fabrications introduced. The three specifically-forbidden claims (every/all planning artifacts, ADRs, BMAD acronym expansion) are absent from `FAQ_ITEMS`. The [ASSUMPTION] bio flag and [OPEN:] channel flags are present and tested.

6. **Rule 7 (proven-to-execute):** The e2e `web/e2e/faq.spec.ts` has NO `test.skip()` calls, no conditional prerequisites, and runs unconditionally. Proven to execute: 13/13 faq tests ran and passed in the `test:all` run above.

7. **Rule 8 (real module + scoped):** Tests import the real `FAQ_ITEMS` and `STARTER_PROMPTS` from `../src/data/faq`. E2e assertions are scoped to `.faq` (not whole-document). The build-output suite already covers `/faq` 0-JS and FAQPage JSON-LD shape; the new tests extend `jsonld.test.ts` with real-module assertions.

### File List

- `web/src/data/faq.ts` (NEW)
- `web/src/pages/faq.astro` (MODIFIED)
- `web/test/jsonld.test.ts` (MODIFIED)
- `web/e2e/faq.spec.ts` (NEW)
- `web/playwright.config.ts` (MODIFIED)

### Change Log

- 2026-06-07: Story 4.2 implemented — fleshed /faq stub with real Q&A (FAQ_ITEMS, 6 items), FAQPage JSON-LD from same source, STARTER_PROMPTS export for Story 4.4, credibility regression tests, e2e suite (13 tests), all canonical gate steps green.
- 2026-06-07: Code review (opus, adversarial Blind/Edge-Case/Acceptance) — APPROVED. 0 findings (0 decision-needed, 0 patch, 0 defer, 0 dismissed). Every priority area independently mutation-verified (5 mutations, all red on real-source break). Status → done.

## Review Findings

**Code review — 2026-06-07 (model: claude-opus-4-8, adversarial: Blind Hunter + Edge-Case Hunter + Acceptance Auditor performed inline; sub-agent spawn unavailable in this harness).**

**Verdict: APPROVED — clean review.** 0 decision-needed, 0 patch, 0 defer, 0 dismissed. No HIGH/MED/LOW findings. The dev + QA implementation is fully compliant; the QA hardening (broadened credibility patterns, the KB question-set consistency test, the scoped single-source e2e assertion) is exactly what Rule 8 and the credibility floor require. Every priority area was independently CONFIRMED by the reviewer via mutation testing, not merely accepted.

### Adversarial verification performed (each mutation reverted; working tree restored byte-clean)

1. **Credibility floor (AC3, HIGH-risk class — Story 4.1 had 3 fabrications).** Audited all 6 `FAQ_ITEMS` answers claim-by-claim against the Mirror sources (`content/kb/faq.md`, `web/src/lib/person.ts`, `web/src/data/speaking.ts`, `web/src/pages/{about,speaking,work/loandemo}.astro`, `content/glassbox.allowlist.ts`). **Every factual claim traces to a Mirror source or carries an `[OPEN]`/`[ASSUMPTION]` flag verbatim.** Specifically confirmed: NO "every/all (planning) artifacts published" — the Glass Box enumeration ("Product Brief, Brainstorm Session, Pre-Brief Research, PRD, and the two UX documents") exactly matches the 6 allowlisted artifact titles in `content/glassbox.allowlist.ts` and uses the honest "curated planning artifacts" framing; NO portfolio "recorded in ADRs" (the dev correctly DROPPED the KB's borderline "Architectural decisions are recorded as they are made" line); NO invented BMAD acronym. The credibility regression suite is non-vacuous — mutation-verified 3 forbidden classes each red the corresponding guard: (a) injected broad "All of the artifacts ... are published" (no "planning" qualifier — the exact variant the 4.1 retro flagged) → red; (b) injected spelled-out "architecture decision records" → red; (c) injected "The name stands for Brainstorm, Mindmap, Architecture, Design" → red.
2. **Visible↔JSON-LD single source (Rule 8 / AC2 — the Epic-3 AC5 class).** Confirmed both the visible `.faq` `<h3>` questions and the FAQPage JSON-LD `mainEntity` are built from the SAME `FAQ_ITEMS` (cannot drift by construction). Confirmed the anti-drift assertions are SCOPED to the visible element (`page.locator('.faq').locator('h3')`), not a whole-document `toContain` the JSON-LD alone could satisfy. **Decisive mutation:** broke ONLY the visible `<h3>` render (appended `[MUTATED]`) while leaving the JSON-LD from the unmodified `FAQ_ITEMS` — the scoped e2e assertions `expect(q.name).toBe(h3Texts[i])` (faq.spec.ts:148) and `expect(h3s.nth(0)).toHaveText(...)` (faq.spec.ts:92) BOTH red, exactly the guard that was missing in Story 3.2 AC5.
3. **AC1/AC5 — real server-rendered Q&A + 0-JS.** Verified directly in the raw built `web/dist/faq/index.html` (view-source equivalent, no JS): all 6 `<h3 class="faq__question">` + 6 `<p class="faq__answer">` present in the initial HTML (not JS-injected); answer-first; lede names "Joshua R. Brandt, MSE"; exactly one `application/ld+json` data block (`@type:FAQPage`); 0 executable script refs (no `src=`/modulepreload/`.js`); canonical = `https://joshuabrandt.abacusai.cloud/faq/` (trailing-slash, Rule 2); no exclamation marks (covered by build-output suite + faq e2e).
4. **AC4 — STARTER_PROMPTS single source for Story 4.4.** `STARTER_PROMPTS = FAQ_ITEMS.slice(0, 3)` is a reference slice; the unit test asserts `STARTER_PROMPTS[i] === FAQ_ITEMS[i]` by reference (`.toBe`), locking no-drift between the /faq seed and the future Guide chips.
5. **AC6 / Rule 7 — faq e2e proven to execute.** The `faq` Playwright project is wired (`testMatch: /faq\.spec\.ts/`) and discoverable in the default suite; all 13 faq specs RAN and passed in the literal `pnpm test:all` (e2e #214–226, zero skips). It asserts the 6 visible `<h3>` (scoped), FAQPage JSON-LD present+valid, axe WCAG 2.1 AA = 0 violations, JS-off readable, and resolves the Story-4.1 `route: /faq/` citation target. The spec has no `test.skip()`/conditional prerequisite (/faq is a pure static route — no API/DB prereq), so the Rule-7 silent-skip risk does not apply here.
6. **AC7 / Rule 5 — literal canonical gate.** Re-ran the LITERAL `pnpm test:all` end-to-end myself: exit 0. Counts — typecheck/lint/format:check clean; unit 653 web + 156 scripts + 80 api passed; e2e 226 passed; Lighthouse (`lh`) passed (built + lhci autorun on `/` and `/about/`). `pnpm run check-deterministic` PASS — `web/dist` byte-identical across two clean builds (tree hash `f41eaf5a…`, matching the dev's recorded hash). No orphaned `astro preview`/`serve-with-api` processes left (port 4321 free).

### Rule / ADR cross-check
- **skill-rules Rule 1 (Integration ACs):** `/faq` is a static Mirror ROUTE, not a service/module — the story's Integration ACs section declares this accurately; the "introduces a service" clause does not apply. ✓
- **skill-rules Rule 3 (real-runtime evidence):** `/faq` is user-facing; the faq Playwright e2e is the real-runtime evidence and it executes. ✓
- **skill-rules Rule 6 / project Rule 6 (ADR):** `docs/adr/` does NOT exist — no ADR registry to cross-check; exemption noted (N/A). ✓
- **project Rules 2, 5, 7, 8:** all satisfied (URL-form trailing-slash; canonical full gate; integration e2e proven-to-execute; real-module + scoped + mutation-verified assertions). ✓
