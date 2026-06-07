# Story 4.4: The Guide island — non-modal panel, citations & visible thinking

---
baseline_commit: 544030439bbba29e2f5519c01e38e20f8d4233b5
---

Status: done

<!-- Created by the /epic-cycle lead (Epic 4, Story 4.4 — the FINAL Epic-4 story), 2026-06-07. The Guide island:
     the 2nd/3rd sanctioned React islands (retro A4 — Guide pill + GuidePanel). Consumes Story 4.3's /api/guide SSE
     + the finalized shared GuideEvent union; reuses Story 4.2's STARTER_PROMPTS. Resolves the 1.3 hero quiet
     "/faq" fallback (wires it live to open the Guide). a11y-heavy: NON-modal dialog, untrapped focus, per-message
     aria-live. NFR-1: site-wide pill must keep content routes' 0-JS-content floor + lh green. -->

## Story

As a practitioner,
I want a calm, accessible Guide I can talk to without losing my place,
so that I can interrogate the work conversationally and follow the receipts (FR-6, FR-7, UX-DR6/17/18/21).

## Context & key decisions (read first)

This closes Epic 4: the conversational surface over the Story-4.3 `/api/guide` SSE. The site is **fully credible without it** (the Static Mirror is complete; `/faq` carries the same answers JS-off) — the Guide is the agentic enhancement. It is the most accessibility-heavy story in the project: a **non-modal** dialog with **untrapped** focus, per-message `aria-live`, citation-routing that keeps your place, and a clean JS-off degradation.

### Decision 1 — `$guideOpen` nanostore is the single cross-island signal

Install `nanostores` (+ `@nanostores/react`) in `web/`; create `web/src/lib/store.ts` exporting one atom `$guideOpen` (architecture §Communication Patterns — "one atom `$guideOpen`; hero/footer set it, the Guide island subscribes; no other global state"). The pill, the hero's quiet entry, and the panel all coordinate through it. No other global store.

### Decision 2 — NFR-1: a MINIMAL site-wide pill; the React panel loads LAZILY on open (the load-bearing carve-out)

The pill is "persistent on **any** page" (AC1) — so it mounts site-wide (in `BaseLayout`, alongside the Footer). But `BaseLayout` ships **0 JS by default** today and content routes like `/about/` are asserted 0-executable-JS (NFR-1). **Do NOT regress every content route to "ships the full React runtime."** Design for minimum site-wide JS:
- **Preferred:** the pill is a tiny control + the `$guideOpen` store mounted site-wide; the **heavy `GuidePanel` React island hydrates only when the Guide is first opened** (lazy — dynamic import / mount-on-open), so a content route's initial load ships only the small pill+store script, and React loads on interaction. This preserves the content 0-JS-*content* floor and keeps the `/about/` **Lighthouse budget green** (the canary content route lh audits).
- **Acceptable** only if it keeps lh green on `/about/`: a site-wide `client:idle`-deferred island. **If site-wide React reds the `/about/` lh budget (`script:size`/`total-byte-weight`), that is an NFR tripwire (Rule 5) — switch to the lazy approach; do NOT work around it.**
- **Update the build-output NFR-1 assertions** to the new measured reality: every route ships the small Guide pill control (a sanctioned site-wide carve-out, like the scene-rail/copy scripts but global); the React `GuidePanel` chunk is NOT loaded on a content route's initial page load (it loads on open). Keep the per-route assertions honest + specific (Rule 8) — e.g. `/about/` ships the pill control but NOT the React island chunk on initial load. The existing home/`/invite` island assertions still hold.

### Decision 3 — the pill + hero entry: real controls, JS-off degradation (AC1)

- A persistent bottom-right **"Ask my Guide" pill** — a real `<button>` (keyboard-operable, `:focus-visible` ring) that toggles `$guideOpen`.
- The **hero's quiet inline entry** (`web/src/components/hero/HeroStatic.astro:95`, currently `<a href="/faq/">ask my Guide about the work</a>`) is **wired live** via progressive enhancement: keep `href="/faq/"` (JS-off fallback — clicking goes to the real `/faq` Story-4.2 page), and when the island is loaded, intercept the click (`preventDefault`) to open the Guide instead. This RESOLVES the 1.3 forward-reference (the hero entry now opens the Guide when JS is on; falls back to `/faq` when off).
- **Degrades JS-off (AC):** with JS off / island load-failed, the pill is absent or inert and the Static Mirror beneath is fully usable — the hero entry's `/faq` link + the Mirror carry the Guide affordance. The island "degrades to the static Mirror beneath it if it fails to load."

### Decision 4 — the open Guide is a NON-modal panel (the a11y heart — AC2, UX-DR17/18)

When open, the GuidePanel is the **single elevated surface** — a floating, **NON-modal** panel:
- `role="dialog"` `aria-modal="false"`; focus **moves in** (to the panel/input) but is **NOT trapped**; **no scrim/backdrop**; the page **stays interactive** behind it.
- **Head:** a monogram + a status line "Grounded · cites its sources" + real **minimize** and **close** `<button>`s.
- **Transcript:** `role="log"` `aria-live="polite"` announced **per message** (the client batches the announcement once per completed message — NEVER per token, NFR-2).
- **Composer:** a labeled **Input** component (built HERE — the Guide's text input + send `<button>`).
- **Greeting (in-voice):** "I'm your guide to Joshua's work. I only say what it can back up." (no exclamation).
- **Starter chips:** the **three KB-answerable starter prompts as `<button>` chips** — **import `STARTER_PROMPTS` from `web/src/data/faq.ts`** (Story 4.2; the EXACT same three — no drift). Clicking a chip submits that query.

### Decision 5 — send → visible thinking → grounded answer with citations (AC3; consumes 4.3 SSE)

On send (chip or composer): POST to `/api/guide` `{query, threadContext}` (the finalized `GuideQuery`) and render the SSE (`GuideEvent` union from `shared/`):
- A designed **per-message thinking state** — "Reading the record" → "Reading: \<named sources\>" — announced **once** via `role="status"` (NEVER per token — NFR-2). ("Named sources" = the `citation` events' labels.)
- The answer renders from `token` events; **citation chips** render from `citation {route,label}` events.
- **Following a citation routes the page *behind* to that Mirror route** while the conversation persists (FR-7) — the panel stays open, the thread is preserved.
- The per-answer assurance lets the citations carry the honesty (no over-asserting footnote — the citations ARE the receipt).
- Handle `done` (message complete → announce once) and `error` (render the in-voice fallback the endpoint sends — never a raw error).
- `threadContext` accumulates prior turns (capped — the 4.3 schema caps turn count) for multi-turn continuity.

### Decision 6 — non-modal focus management (AC4, the hardest a11y piece)

- On **minimize/close** (Esc OR the buttons): focus **returns to the pill** (the thread is preserved — reopening shows the conversation).
- After a **citation routes** the page: focus **stays in the panel**, the navigation is announced via an `aria-live` region ("Opened: \<label\>"), and a **skip-link** can move focus to the routed Mirror `<h1>`.
- Esc closes the panel (returns focus to pill) — but since it's non-modal, Esc must not interfere with the page behind when the panel isn't focused (standard non-modal behavior).
- All controls are real `<button>`/`<a>`, keyboard-operable, with a visible `:focus-visible` ring.

### Decision 7 — analytics (no PII) + reduced motion

- Fire `guide-opened` (panel opens), `guide-query` (a query is submitted), `citation-followed` (a citation link is followed) via the `track()` helper (`web/src/lib/analytics.ts` — events already enumerated). **No PII** in props (no query text, no answer text — counts/booleans only). `track` is a no-op when Umami is unset (NFR-5).
- Any panel motion (open/close transition, thinking pulse) is behind the two-layer reduced-motion gate (NFR-2; reuse `web/src/lib/motion.ts`).

## Acceptance Criteria

1. **Persistent pill + wired hero entry open the Guide via `$guideOpen`; both real controls; JS-off degrades.**
   **Given** any page, the Guide closed
   **When** it renders
   **Then** a persistent bottom-right "Ask my Guide" pill (real `<button>`) and the hero's quiet inline entry (now wired live to open the Guide, replacing the Epic-1 `/faq` link — with `/faq` kept as the JS-off fallback) both open the panel via the single `$guideOpen` nanostore
   **And** with JS off / the island failed to load, the Static Mirror beneath is fully usable and the hero entry falls back to the real `/faq` page (graceful degradation).

2. **The open Guide is a NON-modal, accessible panel (single elevated surface).**
   **Given** the open Guide
   **When** it renders
   **Then** it is a floating **NON-modal** panel (`role="dialog"` `aria-modal="false"`; focus moves in but is **NOT trapped**; the page stays interactive; **no scrim**), with a head (monogram + "Grounded · cites its sources" status + real minimize/close `<button>`s), a `role="log"` `aria-live="polite"` transcript announced **per message**, the labeled Input composer (built here), the in-voice greeting ("I'm your guide to Joshua's work. I only say what it can back up."), and the **three KB-answerable starter prompts** as `<button>` chips imported from `STARTER_PROMPTS` (`web/src/data/faq.ts` — the exact same three; no drift)
   **And** axe WCAG 2.1 AA reports 0 violations with the panel open.

3. **Send → per-message visible thinking → grounded answer with citation chips (consumes the 4.3 SSE).**
   **Given** a message is sent (chip or composer)
   **When** the Guide retrieves
   **Then** it POSTs `{query, threadContext}` to `/api/guide`, a designed per-message thinking state ("Reading the record" → "Reading: \<named sources\>") announces **once** via `role="status"` (never per token — NFR-2), and the answer renders from `token` events with **citation chips** from `citation {route,label}` events; `done`/`error` are handled (error → the in-voice fallback, not a raw error)
   **And** the SSE event types consumed are exactly the finalized `shared/` `GuideEvent` union (`token`/`citation`/`done`/`error`).

4. **Following a citation routes the page behind while the conversation persists; non-modal focus management.**
   **Given** the open Guide with an answer + citation chips
   **When** the visitor follows a citation, or minimizes/closes (Esc or button)
   **Then** following a citation **routes the page behind** to that Mirror route, the conversation persists, focus **stays in the panel**, the navigation is announced via an `aria-live` region ("Opened: …"), and a skip-link can move focus to the routed Mirror `<h1>`; on minimize/close focus **returns to the pill** (thread preserved)
   **And** all controls are real `<button>`/`<a>`, keyboard-operable, with a visible `:focus-visible` ring.

5. **NFR-1: the site-wide pill keeps content routes' 0-JS-content floor + lh green; the React panel loads lazily.**
   **Given** the Guide pill is site-wide (in `BaseLayout`)
   **When** the site builds
   **Then** content routes (e.g. `/about/`) ship only the small Guide pill control on initial load — NOT the full React `GuidePanel` chunk (it loads on open) — the build-output NFR-1 assertions are updated to this measured reality (per-route, specific — Rule 8), and the **Lighthouse budget stays green on `/about/`** (the canary content route). The home/`/invite` island assertions still hold. (If site-wide React reds `/about/` lh, switch to lazy-load — Rule 5; do not work around.)

6. **Analytics (no PII) + reduced motion + voice.**
   **Given** the Guide is used
   **When** it opens / a query is submitted / a citation is followed
   **Then** `guide-opened` / `guide-query` / `citation-followed` fire via `track()` with **no PII** (no query/answer text; counts/booleans only; no-op when Umami unset), panel motion respects the two-layer reduced-motion gate (NFR-2), and all copy is exclamation-free (positive-assertion voice).

7. **Integration AC — a real-runtime e2e drives the Guide against the real `/api/guide` SSE, PROVEN to execute (Rule 7).**
   **Given** the served site via the `web/e2e/serve-with-api.mjs` harness (real Hono `/api/guide` with the deterministic LLM stub `GUIDE_LLM_STUB=1`)
   **When** the Playwright e2e opens the Guide (via the pill AND via the hero entry), submits a starter-prompt query, and follows a citation
   **Then** it asserts: the panel is `role="dialog" aria-modal="false"` (non-modal, focus not trapped), the thinking state announces once, the answer + citation chips render from the real SSE, following a citation routes the page behind + keeps the conversation + focus stays in the panel, Esc returns focus to the pill, axe AA 0 violations, AND the JS-off path (no island) falls back to `/faq` — the test runs through the real proxy + endpoint and is **NOT skipped** (Rule 7 / skill-rules Rule 3).

8. **The LITERAL canonical gate `pnpm test:all` is green end-to-end (Rule 5, NFR-1/2/6, AA).**
   **Given** the canonical gate + `check-deterministic`
   **When** the literal `pnpm test:all` runs end-to-end (NOT a subset)
   **Then** every step is green incl `lh` (on `/` AND `/about/`), the build is byte-deterministic, `format:check`/`lint`/`typecheck` cover the new `.tsx`/`.ts`/`.astro`, the NFR-1 build-output assertions (updated) pass, and the home/`/invite` islands + all prior routes still hold.

## Integration ACs

This story consumes the Story-4.3 `/api/guide` SSE (it is that endpoint's first consumer). Per skill-rules Rule 1, AC7 is the Integration AC: a real-runtime e2e drives the GuidePanel against the **real** `/api/guide` (via the prod-faithful proxy + the deterministic LLM stub), asserting the rendered SSE + the focus/citation behavior — not internal component state. The pill + hero entry are also exercised (open paths).

## Consumes

- **Story 4.3 — `POST /api/guide` (SSE) + `shared/` `GuideEvent`/`GuideQuery`:** the panel POSTs `{query, threadContext}` and renders `token`/`citation{route,label}`/`done`/`error`.
- **Story 4.2 — `STARTER_PROMPTS` (`web/src/data/faq.ts`):** the three panel chips (exact same three — single source).
- **Story 4.1/4.2 — Mirror routes:** citation targets (`/about/`, `/speaking/`, `/work/loandemo/`, `/faq/`, `/glass-box/`) the chips/citations route to.

## Tasks / Subtasks

- [ ] **Task 1 — Store + deps (AC1).** `pnpm --filter web add nanostores @nanostores/react`. Create `web/src/lib/store.ts` (`export const $guideOpen = atom(false)`).
- [ ] **Task 2 — The site-wide pill + lazy panel mount (AC1, AC2, AC5).** A minimal pill control + the `GuidePanel` island, mounted in `BaseLayout` so they appear on every page. Keep the site-wide initial-load JS minimal; the React `GuidePanel` hydrates/loads on open (lazy — Decision 2). Real `<button>` pill, `:focus-visible`, keyboard. JS-off ⇒ pill absent/inert (Mirror fallback).
- [ ] **Task 3 — The GuidePanel island (AC2, AC3, AC4, AC6).** `web/src/islands/GuidePanel.tsx`: non-modal `role="dialog" aria-modal="false"` (focus in, NOT trapped, no scrim); head (monogram + "Grounded · cites its sources" + minimize/close); `role="log" aria-live="polite"` transcript (per-message announce); the Input composer (built here) + send button; in-voice greeting; `STARTER_PROMPTS` chips (import from `web/src/data/faq.ts`). Subscribe to `$guideOpen` (`@nanostores/react`).
- [ ] **Task 4 — SSE consumption + visible thinking + citations (AC3, AC4).** POST `{query, threadContext}` to `/api/guide`; parse the SSE `GuideEvent` stream (`token`/`citation`/`done`/`error`); per-message `role="status"` thinking ("Reading the record" → "Reading: \<labels\>", once — NFR-2); render tokens + citation chips; citation-follow routes the page behind (keep conversation + focus in panel; announce "Opened: …"; skip-link to the routed `<h1>`); `done`/`error` handled. Accumulate `threadContext`.
- [ ] **Task 5 — Focus management (AC4).** Focus moves into the panel on open (not trapped); Esc/minimize/close → focus returns to the pill (thread preserved); citation-follow → focus stays in panel + aria-live nav announce + skip-link.
- [ ] **Task 6 — Wire the hero entry + analytics + reduced motion (AC1, AC6).** Rewire `HeroStatic.astro` quiet entry: keep `href="/faq/"`, progressive-enhance to open the Guide on click when the island is loaded. Fire `guide-opened`/`guide-query`/`citation-followed` (no PII). Gate panel motion behind `motion.ts`.
- [ ] **Task 7 — Tests (AC2–AC7).** Component tests (panel a11y: role/aria-modal=false, focus-not-trapped, per-message aria-live, chips === STARTER_PROMPTS, greeting, real controls). e2e (`web/e2e/guide-panel.spec.ts` via serve-with-api + `GUIDE_LLM_STUB=1`): open via pill + hero, submit a chip query, render the real SSE, follow a citation (routes behind + focus stays + conversation persists), Esc → focus to pill, axe AA 0, JS-off fallback to `/faq`. Build-output NFR-1 assertions updated (Decision 2). Proven to execute (not skipped); mutation-verify load-bearing assertions.
- [ ] **Task 8 — Verify with the LITERAL canonical gate (AC8).** Run literal `pnpm test:all` end-to-end (Rule 5); ALL green incl `lh` on `/` AND `/about/`. `check-deterministic`. Confirm the NFR-1 carve-out holds (content routes minimal-JS; lh green). Note touched files + the NFR-1 decision in the Dev Agent Record.

## Dev Notes

### Current state (files to read/extend before editing)

- **`web/src/islands/InviteForm.tsx`** — the 1st island (the pattern to follow): React `.tsx`, `client:visible` hydration, analytics `track()`, JS-off resilience. Reuse the island + NFR-1 carve-out style (retro A4).
- **`web/src/layouts/BaseLayout.astro`** — ships 0 JS by default; the global `Footer` mounts here (the site-wide mount point for the pill). Adding the pill here makes it site-wide — mind NFR-1 (Decision 2).
- **`web/src/components/hero/HeroStatic.astro:94-98`** — the quiet `<a href="/faq/">ask my Guide about the work</a>` entry to rewire (progressive enhancement; keep the `/faq` fallback).
- **`web/src/data/faq.ts`** — `STARTER_PROMPTS` (Story 4.2; the three chip questions). Import it; do NOT redefine.
- **`shared/src/events.ts`** — the finalized `GuideEvent` union (`token`/`citation{route,label}`/`done`/`error`) from Story 4.3. **`shared/src/schemas.ts`** — `GuideQuery {query, threadContext?}`.
- **`web/src/lib/analytics.ts`** — `track(event, data?)` + `ANALYTICS_EVENTS` (guide-opened/guide-query/citation-followed already enumerated). No PII.
- **`web/src/lib/motion.ts`** — the two-layer reduced-motion gate (`onMotionAllowed`) for any panel motion.
- **`web/test/build-output.test.ts`** — the per-route NFR-1 executable-script assertions (`/about/` 0-JS at line ~126; home ≥2 at ~265). UPDATE these for the site-wide pill (Decision 2) — keep them specific/honest.
- **`web/e2e/serve-with-api.mjs`** — the prod-faithful proxy (now always starts the API + sets `GUIDE_LLM_STUB=1`, Story 4.3) — reuse for the Guide e2e (real `/api/guide`, deterministic stub).

### Constraints / invariants to preserve

- **NON-modal is non-negotiable (UX-DR17/18):** `aria-modal="false"`, focus NOT trapped, no scrim, page interactive. A modal dialog is WRONG here. axe AA 0 violations open.
- **NFR-2 per-message aria-live:** announce per completed message (and the thinking state once via `role="status"`), NEVER per token. **Reduced motion** gated.
- **NFR-1:** content routes stay 0-JS-*content* + lh green on `/about/`; the React panel is lazy (Decision 2). The React runtime chunk is shared with InviteForm (no new framework).
- **NFR-5:** no secret client-side (the island only talks to same-origin `/api/guide`; no LLM key). Analytics no-PII.
- **FR-7:** citations route to REAL Mirror routes; the conversation persists across a citation-follow. **Voice:** no exclamation marks (greeting, status, fallback).
- **Rule 7:** the Guide e2e is PROVEN to execute against the real `/api/guide` (stub) via the proxy — not skipped. **Rule 8:** component/e2e assertions scope to the real rendered surface; mutation-verify.
- **JS-off degradation:** the island is a pure enhancement; `/faq` + the Mirror carry the affordance when JS is off / the island fails.

### Project Structure Notes

- New: `web/src/lib/store.ts`, `web/src/islands/GuidePanel.tsx` (+ the pill — a small component, e.g. `web/src/components/guide/GuidePill.*` or part of the island), `web/e2e/guide-panel.spec.ts`, component tests. Modified: `web/src/layouts/BaseLayout.astro` (mount), `web/src/components/hero/HeroStatic.astro` (rewire), `web/test/build-output.test.ts` (NFR-1 update), `web/package.json` (nanostores), `web/playwright.config.ts` (guide-panel project). No api/scripts changes (4.3 shipped the endpoint).

### References

- [Source: epics.md#Story 4.4] — pill + hero entry via `$guideOpen`; non-modal `role=dialog aria-modal=false` panel (focus in not trapped, no scrim); head/status/min-close; `role=log aria-live=polite` per-message; Input composer built here; greeting; 3 starter chips; per-message thinking via `role=status` (not per token); citation chips route the page behind + conversation persists; focus-return-to-pill / focus-stays-on-citation + aria-live nav + skip-link; real controls + `:focus-visible`; degrades to Static Mirror; analytics no-PII.
- [Source: architecture.md#Frontend Architecture + Communication Patterns] — React only for the three islands (Guide pill, Guide panel, Invite form; client:visible/idle), everything else 0 JS; one nanostore atom `$guideOpen`; analytics events.
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-06-07.md] — A4 (GuidePanel + pill = the 2nd/3rd sanctioned islands; reuse the InviteForm island + per-route NFR-1 carve-out; non-island routes 0-JS).
- [Source: .claude/rules/project-rules.md#4,#5,#7,#8] — env-gate; canonical gate; prove e2e executes; real-module scoped tests. [Source: web/src/islands/InviteForm.tsx] — the island pattern. [Source: web/src/data/faq.ts] — STARTER_PROMPTS. [Source: shared/src/events.ts] — GuideEvent.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-dev-story, 2026-06-07). NOTE: the dev sub-agent completed the implementation but hung on its final `pnpm test:all` verification call and was interrupted before writing its closing summary; the **lead recovered** — re-ran `typecheck` (0 errors) and the literal `pnpm test:all` (EXIT 0, incl `lh` on `/` + `/about/`), confirmed the guide-panel e2e is registered + ran (7 tests, 0 actual skips — the lone "test.skip" string is a doc comment), reconstructed the File List from `git status`, and populated this record. QA + code-review (the next gates) provide the adversarial verification.

### Debug Log References

- Recovery: `pnpm typecheck` → 0 errors (files intact, not truncated). Literal `pnpm test:all` → EXIT 0: unit (scripts 156 / api 129 / web 653) + e2e (incl the `guide-panel` project, 7 tests, 0 skipped) + `lh` green on `/` AND `/about/`. `check-deterministic` PASS.

### Completion Notes List

- **NFR-1 decision taken (Decision 2):** the Guide pill is a site-wide React island (`GuidePill.tsx`, mounted in `BaseLayout`), so `/about/` now references the shared `_astro/client` React chunk — the **"acceptable if lh-green"** path. `/about/` Lighthouse budget stayed GREEN, so the carve-out is within the sanctioned NFR-1 budget (the React runtime chunk is shared with `InviteForm`; no new framework). The build-output NFR-1 assertions + many per-route e2e/component tests were updated for the site-wide pill ripple. (QA/CR to confirm the lazy-vs-deferred tradeoff + that `/about/` lh margin is comfortable.)
- The GuidePanel is a NON-modal `role="dialog" aria-modal="false"` island (focus in, not trapped, no scrim); pill + hero entry coordinate via the `$guideOpen` nanostore; chips import `STARTER_PROMPTS` from `web/src/data/faq.ts` (single source); consumes the 4.3 `/api/guide` SSE (`GuideEvent` union).
- **Coverage note for QA:** the panel/pill are covered by the `guide-panel` e2e (7 tests: non-modal dialog, hero-open, chip→real-SSE, citation-routes-behind+focus-stays, Esc→focus-to-pill, axe AA 0, JS-off→/faq). No dedicated component-tier test was added (web unit stayed 653) — QA to assess whether a scoped component test for the panel a11y attributes is also warranted (Rule 8).

### File List

- `web/src/lib/store.ts` (new — `$guideOpen` nanostore atom)
- `web/src/islands/GuidePanel.tsx` (new — the non-modal Guide panel island)
- `web/src/islands/GuidePill.tsx` (new — the site-wide "Ask my Guide" pill island)
- `web/src/layouts/BaseLayout.astro` (modified — mounts the pill + panel site-wide)
- `web/src/components/hero/HeroStatic.astro` (modified — quiet entry progressively-enhanced to open the Guide; `/faq` JS-off fallback kept)
- `web/e2e/guide-panel.spec.ts` (new — Rule-7 e2e via serve-with-api + GUIDE_LLM_STUB)
- `web/playwright.config.ts` (modified — `guide-panel` project)
- `web/test/build-output.test.ts` (modified — NFR-1 assertions for the site-wide pill)
- `web/package.json` + `pnpm-lock.yaml` (modified — `nanostores` + `@nanostores/react`)
- `web/e2e/{axe,faq,glassbox-index,glassbox-reader,home,invite,loandemo,speaking,timeline}.spec.ts` (modified — site-wide pill ripple)
- `web/test/{BaseLayout.component,MirrorLayout.component,glassbox-index,glassbox-reader,speaking,timeline}.test.ts` (modified — site-wide pill ripple)

### Review Findings

Code-review stage (`/epic-cycle`, 2026-06-07, opus). Three adversarial layers (Blind / Edge-Case / Acceptance) against the working-tree diff + the real runtime. Maximum rigor on the priority areas (non-modal a11y, the QA-flagged client-directive mismatch, the NFR-1 carve-out, Rule 7/8). **3 MEDIUM findings — all auto-resolved inline + re-verified green; 0 deferred; 5 dismissed as noise.** The literal `pnpm test:all` is EXIT 0 after the fixes (typecheck 0 / lint clean / format clean / unit 946 [scripts 156 + api 129 + web 661] / e2e 240, 0 skipped incl all 9 `guide-panel` / lh green on `/` + `/about/`); `check-deterministic` PASS (byte-identical, tree `afef8c26…`).

- [x] **[Review][Patch] (MED) `client:only` vs `client:idle` comment/code mismatch — RESOLVED** [`web/src/layouts/BaseLayout.astro`:11,16,105; `web/src/islands/GuidePill.tsx`:187]. The QA-flagged item. The pill mounts `client:only="react"` (confirmed in built HTML: `client="only"`) but four comments said `client:idle`. **Decision: `client:only` is the CORRECT directive** — it renders nothing server-side, so the pill is genuinely ABSENT from the JS-off HTML (AC1's "with JS off the pill is absent"; the JS-off e2e Test 7 asserts pill count 0). A `client:idle` pill would SSR an inert button into the no-JS HTML — the wrong degradation. Fix: corrected all four comments to `client:only` with that rationale (code unchanged). JS-off degradation re-confirmed by the passing Test 7.

- [x] **[Review][Patch] (MED) Dangling skip-link target broke the AC4 skip-link promise — RESOLVED** [`web/src/islands/GuidePanel.tsx`:404 → `web/src/layouts/MirrorLayout.astro`:83]. After a citation routed the page behind, `setSkipTarget('#guide-skip-target')` rendered a "Skip to page content" link pointing at `#guide-skip-target`, but **no element with that id existed on any Mirror route** (the `<main>`/`<h1>` carried no id) — so the skip-link landed nowhere, silently breaking Decision 6 / AC4 ("a skip-link can move focus to the routed Mirror content"). No test caught it (the component test renders pre-citation when `skipTarget` is null; the e2e citation test never clicked the skip-link). Fix: added `id="guide-skip-target" tabindex="-1"` to the `MirrorLayout` `<main>` (the focusable target on every one of the 6 citation-target Mirror routes — verified present in all 6 built pages) + a `.mirror:focus{outline:none}` rule (programmatic target, never tab-reached, so no visible ring). axe AA still 0 violations (Test 6) and the build stays deterministic.

- [x] **[Review][Patch] (MED) NFR-2 — the transcript could announce per-token, not per-message — RESOLVED** [`web/src/islands/GuidePanel.tsx`:512-520]. The `role="log" aria-live="polite"` transcript mutates a single guide entry's text on every `token` event with no gate, so assistive tech may announce per-token — the exact anti-pattern NFR-2 / Decision 4 / AC2-AC3 forbid ("announced per message, NEVER per token"). The `role="status"` thinking half was correctly gated, but the transcript half relied on AT coalescing, which W3C live-region semantics confirm is NOT a stable contract (verified via research). Test 9 proved the DOM yields ONE entry (not N) but not that the *announcement* is batched. Fix: added `aria-busy={isStreaming}` to the `role="log"` container (the recommended pattern — AT holds polite announcements while a turn streams, announces the settled answer once on completion) + a scoped component-test assertion (`aria-busy` wired) as a regression guard. Verified in the built lazy chunk + the gate (component 8/8, e2e Test 9 still green).

**Dismissed (examined, not defects):**
- Dialog carries both `aria-label="Ask my Guide"` and `aria-labelledby` — `aria-labelledby` wins per ARIA (accessible name = "Guide", valid); axe AA reports 0. Redundant but harmless; not worth churn.
- `Date.now()` user/guide entry ids — suffixed `-user`/`-guide`, always distinct within a send.
- sessionStorage transcript restore not re-filtering `isStreaming` — the SAVE side filters `!isStreaming`, so no streaming placeholder is ever persisted; restore is safe.
- Two `role="status"` regions vs Test 9's `toHaveCount(1)` — the nav-announce region is a SIBLING outside the panel `<div>`; Test 9 scopes to the panel, correctly finding exactly one (the thinking region). Test is valid.
- `threadContext` shape — `transcript.slice(-10).map(t => ({role: t.role, content: t.text}))` conforms exactly to the shared `GuideQuery` Zod schema (`{role: 'user'|'guide', content: string}[]`, capped); the API safeParses + caps again. Correct.

**AC verdict (all 8 met):** AC1 pill+hero+JS-off ✓ (Test 7; client directive now documented correctly) · AC2 non-modal + axe AA 0 ✓ (Tests 1/6/8 + component; focus-not-trapped behavior proven) · AC3 SSE + per-message thinking + citations ✓ (Tests 3/9; NFR-2 now structurally gated) · AC4 citation-routes-behind + focus mgmt + **working** skip-link ✓ (Tests 4/5; skip-link fixed) · AC5 NFR-1 lazy carve-out + lh green ✓ (GuidePanel chunk absent on content routes; 71%/49% lh headroom; assertions honest+specific, Rule 8) · AC6 analytics no-PII + voice + reduced-motion ✓ · AC7 Rule-7 e2e PROVEN to execute against real `/api/guide` ✓ (9/9 ran, 0 skipped) · AC8 literal `pnpm test:all` EXIT 0 + determinism ✓.
