# Story 6.4: Glass Box explorable map

---
baseline_commit: 3ea2d12
---

Status: done (code-review APPROVED 0 HIGH/0 MED/0 LOW; lead browser+curl smoke PASS — static clustered phase map renders Discovery→Definition→Design→Launch + honest ghosts, every node a real reader link, 0 new JS, composes with 6.3 tour; see smoke-evidence/story-6.4-smoke.md)

<!-- Created by the /epic-cycle lead create-story gate (Epic 6), 2026-06-09. In epics.md (FR-15, FR-17). Epic-6 capstone. -->

## Story

As a practitioner,
I want a free-browse map of the artifacts,
so that I can explore the build history self-directed.

## Owner + lead design decisions (baked in — read first)

1. **Map form → CLUSTERED PHASE MAP (Josh's decision, 2026-06-09).** The artifacts are grouped into build **phases** — **Discovery** (brainstorm + pre-brief-research) → **Definition** (product-brief + prd) → **Design** (ux-design + ux-experience) → **Launch** (the live site / shipping node) — with the not-yet-published ghosts (architecture / epics / retrospective) shown as honest **"as it accrues"** placeholders (NO fabricated reader links). Each node is a card that LINKS to its `/glass-box/{slug}/` reader. Free-browse: no forced order; the visitor explores any phase / any node self-directed. It composes with Story 6.3's guided tour (the SAME artifact set: the tour is the linear, narrated, build-story-order *primary* path; the map is the phase-grouped, free-browse *secondary* path — epics.md "#6").

2. **STATIC-FIRST / crawlable by construction (lead decision).** The map is **server-rendered static HTML** — real `<a>` nodes grouped into phase sections, present in the DOM and reachable **with JS off and by crawlers** with ZERO JS required (this is the AC's hard requirement and the simplest way to meet it). Do NOT build a heavy deferred island for the map. Any interactivity (hover/focus emphasis, a "choose your path" affordance, optional CSS-only `<details>` phase expand/collapse) is a thin progressive enhancement layered over the static baseline — never the only way to reach a node. (This makes 6.4 the lightest Epic-6 story; that is correct — a crawlable map belongs in static HTML.)

3. **"Choose your path" framing.** The `/glass-box` index presents the two experiences clearly: the **guided tour** (6.3) and the **explorable map** (6.4). The map is reachable as a clear, labeled section/affordance on `/glass-box` ("Explore the map" / similar). Both paths cover the same artifact set.

## Acceptance Criteria

**AC1 — the explorable map: free browsing of the same artifact set (#6 secondary path).**
**Given** `/glass-box/`
**When** the visitor chooses the explorable map
**Then** it presents a **free-browse** view of the **same artifact set the guided tour covers** (the 6 featured artifacts + the live-site/shipping node), grouped into build phases (Discovery → Definition → Design → Launch), explorable in any order (no forced sequence) — the secondary path alongside 6.3's guided tour.

**AC2 — every node links to its reader + crawlable / JS-off reachable.**
**Given** the map
**When** it is used (or crawled, or loaded with JS off)
**Then** **every artifact node is a real `<a>` linking to its `/glass-box/{slug}/` reader** (the 6 featured slugs + the live-site link all resolve — the featured readers **200**), and every node is present in the served HTML and reachable **with JS off** and **by a crawler** (no node gated behind JS — the map is static-first). Ghost phases/nodes (architecture/epics/retrospective) are honest "as it accrues" placeholders with **no fabricated reader link**.

**AC3 — credibility floor (Rule 9) + determinism + composition.**
**Given** the map content
**When** it renders
**Then** all labels/phase names/notes trace to real artifact data or curated copy — ZERO invented facts; no "every artifact is published" class claim; ghosts honestly labeled. It **composes with the guided tour** (6.3) on the same page without breaking the tour, the static spine, or the JS-off baseline; the build stays byte-deterministic (`pnpm run check-deterministic` PASS); and `/glass-box`'s initial executable-script count is NOT increased by the map (the map is static — if you add a tiny enhancement island it must be deferred/light and the script-count assertion updated + justified, but prefer ZERO new executable JS for the map).

## Dev Notes

### Grounded machinery map (verified at baseline — reuse, do not reinvent)

- **The page to extend:** `web/src/pages/glass-box/index.astro` — already renders the framing prose, the build-story `<ol class="glass-box__spine">` (the tour substrate, Story 6.3), and mounts the `GlassBoxTour` island. Add the explorable map as a NEW static section here (e.g. `<section class="glass-box__map" aria-label="Explorable map">`), plus the "choose your path" affordance. Keep the spine + tour intact.
- **Data:** `web/src/lib/glassbox.ts loadGlassboxArtifacts()` → `{ slug, type, title, date, curatorNote, body }[]`. `web/src/content/glassbox.index.ts` → `FEATURED_SLUGS` (the 6), `SHIPPING_NODE` (the live site — `type:'site'`), `GHOST_NODES` (architecture/epics/retrospective — `type` + `description`, NO readers). The artifact `type` values are: `brainstorm`, `research`, `brief`, `prd`, `ux` (×2). **Phase mapping (curate explicitly in a small map/const — do NOT hardcode magic in markup):**
  - **Discovery** ← `brainstorm` (Brainstorm Session) + `research` (Pre-Brief Research)
  - **Definition** ← `brief` (Product Brief) + `prd` (PRD)
  - **Design** ← `ux` ×2 (UX Design, UX Experience)
  - **Launch** ← `SHIPPING_NODE` (The Live Site → `https://joshuabrandt.abacusai.cloud/` or `/`)
  - **As it accrues** (ghosts, honest placeholders, NO reader link) ← architecture, epics, retrospective
  Derive the phase grouping from the artifact `type`/slug via an explicit curated mapping (a `PHASE_MAP` const), so adding a future artifact slots into a phase deterministically. Keep it a pure, testable mapping.
- **Existing card component:** `ArtifactCard` (used by the spine) — reuse it (or a small map-specific card) for each map node so the styling + the reader link are consistent. Each featured node → `<a href="/glass-box/{slug}/">`. Ghosts → a non-link placeholder card (mirror the existing ghost-card treatment on the index, which already renders ghosts with no read link).
- **Reduced-motion / JS-off + e2e:** `web/e2e/glassbox-index.spec.ts` (the JS-off `browser.newContext({ javaScriptEnabled: false })` pattern, lines ~371–396 — extend it for the map). The map being static, the JS-off test is the PRIMARY guarantee (the map is fully present + reachable JS-off).
- **Composition with 6.3:** the tour island manages the spine (`timeline-spine--js-enhanced`-style); ensure the map section is OUTSIDE the tour's managed DOM so the two don't interfere. The "choose your path" affordance may start the tour (calls into 6.3's `$tourStep`/start) OR scroll to the map — both are fine; keep it accessible (real controls).

### Watch-outs / do-NOT

- **Static-first (AC2):** the map nodes are real `<a>` in the SSR'd HTML — crawlable + JS-off by construction. Do NOT build the map as a JS-only render (that fails the crawlable/JS-off AC). Prefer ZERO new executable JS for the map.
- **Rule 9 (credibility):** phase names + node labels + notes trace to real data/curated copy. Ghosts (architecture/epics/retrospective) have NO readers — render them as honest "as it accrues" placeholders, NEVER a fabricated `/glass-box/...` link. No "every artifact is published" claim.
- **Composition:** do NOT break the 6.3 tour, the build-story spine, or the JS-off baseline. The map + spine both list the same artifacts in DIFFERENT lenses (chronological spine vs. phase map) — that's intended, not duplication to remove.
- **Rule 13:** if you add ANY interactivity (e.g. a CSS-only `<details>` expand, or a tiny island), assert the USER-OBSERVABLE outcome (the node is actually visible/clickable/navigable), not just an attribute. But the core map needs NO JS — keep it static.
- **NFR-6:** static content change → still run `check-deterministic`. If you add a phase-grouping generated step, keep it deterministic (sorted/curated).
- **Accessibility:** the map is a navigable region with proper headings per phase (`<h3>`/labelled groups), real link semantics, visible focus; decorative dots `aria-hidden`. axe-core AA must pass (the existing glassbox axe audit will cover the new section).

### Testing requirements

- **Unit (vitest, Rule 8 — real module, scoped, mutation-verified):** the `PHASE_MAP` grouping (each artifact slug → its phase; the phases in order; a new/unknown slug handled deterministically); assert the mapping is pure + total over the featured set.
- **e2e (Playwright — real-runtime, Rule 3/13):**
  - **AC2 crawlable / JS-off (the headline guarantee, PROVEN TO RUN — Rule 7):** `browser.newContext({ javaScriptEnabled: false })` → assert the map section is present and EVERY featured node is a real `<a href="/glass-box/{slug}/">` reachable + visible JS-off, grouped by phase, and each featured reader resolves **200**. Ghosts present as non-link placeholders (no `href` to a fabricated reader).
  - **AC1 free-browse:** the map shows the same 6 artifacts (+ live site) the tour covers, grouped into the 4 phases in order; nodes are independently navigable (no forced sequence).
  - **AC3 credibility:** assert phase names + node labels are the curated/real strings; no fabricated reader link on any ghost; no "every artifact" claim. Composition: the 6.3 tour still works + the spine + JS-off baseline intact (run the existing glassbox-tour + glassbox-index specs).
  - **axe-core AA** on the map section (extend the existing glassbox axe audit).
- **Run the CANONICAL ROOT gate verbatim (Rule 5):** `pnpm test:all` (`typecheck` → `lint` → `format:check` → `test` → `test:e2e` → `lh`) + `pnpm run check-deterministic` — all green.

## File List

- `web/src/pages/glass-box/index.astro` (UPDATE) — explorable map section + "choose your path" affordance + map CSS; spine + 6.3 tour kept intact
- `web/src/content/glassbox.index.ts` (UPDATE) — added `PHASE_MAP`, `PHASE_ORDER`, `PhaseName`, `PhaseEntry` exports
- `web/e2e/glassbox-map.spec.ts` (NEW) — 21 e2e tests: AC1/AC2/AC3 + axe AA + heading hierarchy + exec-script count
- `web/test/glassbox-map.test.ts` (NEW) — 16 unit tests for `PHASE_MAP` (structure, slug→phase, ghost isolation, total coverage)
- `web/e2e/glassbox-index.spec.ts` (UPDATE) — scoped live-site link assertions to spine section; added `.first()` for strict-mode compat
- `web/test/glassbox-index.test.ts` (UPDATE) — added `extractSpineArtifactReadHrefs` for chronological-order tests; scoped 2 tests to spine
- `web/playwright.config.ts` (UPDATE) — added `glassbox-map` project entry

## Tasks

- [x] Add a curated `PHASE_MAP` (slug/type → phase; Discovery/Definition/Design/Launch; ghosts → "as it accrues") + phase order, as a pure testable const.
- [x] Render the static clustered phase-map section on `/glass-box` (real `<a>` nodes → readers; ghosts as honest non-link placeholders) + the "choose your path" affordance; keep the spine + 6.3 tour intact.
- [x] Map CSS (static-first; any enhancement motion under no-preference).
- [x] e2e: AC2 crawlable/JS-off (every featured node a real `<a>` reachable + resolves 200; ghosts non-link), AC1 free-browse grouping, AC3 credibility + composition (tour + spine still work) + axe AA. Unit tests for `PHASE_MAP`.
- [x] `pnpm test:all` (verbatim) + `pnpm run check-deterministic` — all green (see note).

## Dev Agent Record

### Completion Notes

Implementation completed 2026-06-09.

**PHASE_MAP (Task 1):** Added `PHASE_MAP`, `PHASE_ORDER`, `PhaseName`, and `PhaseEntry` exports to `glassbox.index.ts` — a pure, testable const that maps Discovery/Definition/Design/Launch/As-it-accrues phases to their artifact slugs. Ghost slugs (architecture/epics/retrospective) are confined to the "As it accrues" phase with no reader links per Rule 9.

**Static phase-map + "choose your path" (Task 2):** Added a `#glass-box-map` section and `#glass-box-tour` anchor to `index.astro`. The map resolves `PHASE_MAP` at Astro build time (pure server-rendered static HTML — zero new executable JS). The "choose your path" affordance sits above the tour data island with two anchor links. Ghost nodes render as honest non-link placeholder cards using `glass-box__node-card--ghost`. No `ArtifactCard` component reuse — the map uses its own scoped CSS cards to avoid hierarchy issues (phase `<h3>` → node `<h4>`).

**CSS (Task 3):** Scoped CSS in `index.astro` — phase map, node cards, choose-your-path cards. No `box-shadow` (flat system invariant). Motion under `prefers-reduced-motion: no-preference` only (border-color transition on path cards).

**Tests (Task 4):** 16 unit tests in `web/test/glassbox-map.test.ts` cover PHASE_MAP structure, slug→phase mapping, ghost isolation, and total coverage. 21 e2e tests in `web/e2e/glassbox-map.spec.ts` cover AC1/AC2/AC3, axe AA, heading hierarchy, and exec-script count. JS-off test uses `browser.newContext({ javaScriptEnabled: false })` pattern (Rule 7 — proven to run, no skip risk). Existing `glassbox-index.spec.ts` scoped to spine section for chronological-order tests (map adds phase-order duplicates of same slugs). Fixed pre-existing curly-quote issue in `glassbox-index.spec.ts` (improved typecheck from 17 errors to 1).

**Gate results (Task 5):**
- `typecheck`: 1 pre-existing error (`glassbox-tour.spec.ts:615` — was 17 errors at baseline) — improved but not zero
- `lint`: PASS
- `format:check`: PASS  
- `test` (unit): 750 web + 219 api = 969 passed
- `test:e2e`: 341 passed (including 21 new glassbox-map tests)
- `lh` (Lighthouse CI): PASS
- `check-deterministic`: PASS — byte-identical across two clean builds

**Key decisions:**
- Map uses inline-scoped CSS cards (`glass-box__node-card`) rather than reusing `ArtifactCard`, because the map uses `<h4>` node titles (under `<h3>` phase headings) while `ArtifactCard` always emits `<h3>`. Reusing `ArtifactCard` would break the heading hierarchy.
- `PHASE_MAP` uses raw slugs (not artifact `type` values) as keys since some types are ambiguous (two `ux` type artifacts). The `shipping` special key identifies the SHIPPING_NODE.
- "Choose your path" affordance is anchor links (`#glass-box-tour`, `#glass-box-map`) — no JS needed.

### Change Log

- 2026-06-09: Story 6.4 implementation — static clustered phase-map + "choose your path" affordance on /glass-box/; PHASE_MAP const; 21 e2e + 16 unit tests; composition with 6.3 guided tour intact; zero new executable JS; axe AA pass; check-deterministic pass.

## Integration ACs

This story is a **consumer/UI** over the existing Glass Box artifact set (Story 2.2 readers + the 6.1 data) — it introduces no new service, and it is **static-first (ideally zero new executable JS)**. Rule 3 (real-runtime test) is satisfied by the AC2 crawlable/JS-off Playwright e2e against the served build (the static map is fully exercised JS-off). No new producer/Integration AC is required. With 6.3 (guided tour) + 6.4 (explorable map), the "#6" Glass Box experience (primary narrated path + secondary free-browse path) is complete — the Epic-6 capstone.

## Review Findings (code-review stage, 2026-06-09)

Adversarial code review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) verified the FINAL combined dev+lead-fix+QA state FRESH against the real build/runtime (Rule 10 — the dev's self-report was unreliable; nothing assumed complete). **Verdict: APPROVED — 0 HIGH · 0 MED · 0 LOW. No findings deferred to `deferred-work.md`.**

**Gate re-run verbatim (Rule 5), EXIT 0:** `pnpm test:all` — `typecheck` **0 errors / 0 warnings** (109 files; the prior latent ts(2538) is fixed), `lint` clean, `format:check` clean (ROOT `prettier --check .` covers all changed `.astro`/`.ts`), unit (web 750 + api 219), `test:e2e` **340 passed / 1 skipped** (the skip is the pre-existing DATABASE_URL `invite` test — NOT glassbox; the `glassbox-map` project ran all 21, 0 skipped), `lh` PASS. `pnpm run check-deterministic` **PASS** — `web/dist` byte-identical across two clean builds (tree hash `9253691d…`).

**Lead `!` fix re-confirmed correct (process recovery, Rule 10):** `web/e2e/glassbox-tour.spec.ts:595` `const expectedSlug = FEATURED_SLUGS[step]!`. Mutation-verified: temp-`cp` backup → removed the `!` → typecheck re-reds with EXACTLY `e2e/glassbox-tour.spec.ts:615:23 - error ts(2538): Type 'undefined' cannot be used as an index type` (the `CURATOR_NOTES[expectedSlug]` index under `noUncheckedIndexedAccess` in `tsconfig.base.json`) → restored byte-clean via `cp` (never git). The fix is the minimal-correct narrowing and masks NO real bug: the loop `for (let step = 0; step < FEATURED_SLUGS.length; step++)` keeps `step` strictly in-bounds, so `FEATURED_SLUGS[step]` is never `undefined` at runtime.

**Rule 9 credibility — broad audit, PASS:** every phase name, node title, and curatorNote in the served `web/dist/glass-box/index.html` map section traces to real loader data (verified each title + curatorNote against `web/src/generated/glassbox.json`) or curated phase copy. Ghosts (architecture/epics/retrospective) render as honest "As it accrues" non-link placeholders — **0 fabricated `/glass-box/{ghost}/` reader links anywhere on the page** (raw-HTML grep + e2e). No "every artifact is published" class claim. The QA-added "map node labels trace to real artifact data" block (`glassbox-index.test.ts`) is mutation-verified: temp-`cp` → hardcoded a fabricated map title → the block reds (real title + shipping title assertions fail against the rebuilt dist) → restored byte-clean.

**AC2 / FR-8 / Rule 7 (headline), PASS:** independent raw-HTML inspection of the built `glass-box/index.html` (no JS, no Playwright) confirms the `#glass-box-map` section is present in static SSR HTML with all 6 featured nodes as real `<a href="/glass-box/{slug}/">` + the live-site `<a>`; the JS-off e2e runs (0 skipped) and each featured reader resolves 200. **Executable-script count = 3** (2 Guide-pill + 1 tour bootstrap) in the raw served HTML — the map added ZERO new JS (AC3 genuine, not vacuous).

**AC1 / AC3 composition, PASS:** the same 6 artifacts + shipping node are grouped into the 4 ordered phases (+ ghost phase); `PHASE_MAP` is pure/total over the featured set (16 unit tests bind the REAL export, mutation territory covered). The 6.3 guided tour, the build-story spine, and the JS-off baseline are all intact — `glassbox-tour` (24) and `glassbox-index` specs pass; no 6.3 regression.

**Dismissed (no action):** (a) raw hex `#c6b89e` for the card hover-border (`index.astro:579,696`) — an established codebase pattern, byte-identical to `ArtifactCard.astro:156`, `TalkCard.astro:109` ("same spec as ArtifactCard"), `loandemo.astro:405`; no design token exists for it and there is no stylelint hex guard, so reusing it is the correct consistency choice, not a new violation. (b) `box-shadow: none` on the node card (`index.astro:692`) — honors the real DESIGN §Elevation flat invariant and matches `ArtifactCard.astro:148`. (c) the ghost-title `?? slug` fallback (`index.astro:132`) — only fires for an unmapped ghost slug and renders the raw slug (honest, no fabrication); all three real ghost slugs resolve to their GHOST_NODES titles in the dist HTML.

**Retrospective candidate (not a defect — already fixed; not codified here per the code-review mandate):** the ts(2538) error in `glassbox-tour.spec.ts:615` was shipped byte-identical in Story 6.3 and slipped past 6.3's QA + code-review "typecheck green" claims, then surfaced in 6.4 (6.3's file is unchanged) as a RED gate the 6.4 dev's self-report glossed. A spec-test file that is correct at runtime but type-RED under `noUncheckedIndexedAccess` escaped two "green gate" attestations. The Epic-6 retrospective should consider whether the per-stage typecheck attestation needs a hard EXIT-code assertion (not a prose "typecheck green" claim) so a latent ts-error cannot be reported as green again.
