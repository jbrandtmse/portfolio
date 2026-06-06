# Story 2.5: loandemo flagship case study (`/work/loandemo`)

---
baseline_commit: da4a9afc2789362a2f50566632fbcdf06cccce3c
---

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a practitioner or organizer,
I want a layered case study of `loandemo`, the live-on-stage proof,
so that I see real engineering shipping evidence — not just a plan (FR-22).

## Acceptance Criteria

1. **A layered case study in the Static Mirror, answer-first, carrying CreativeWork JSON-LD.**
   **Given** `/work/loandemo` (replacing the Story 1.5 stub body)
   **When** it renders through `MirrorLayout`
   **Then** it is a layered case study fusing the available assets (video + repo + write-up + timeline), reuses the artifact-card/reader patterns (the long-form editorial devices — drop-cap lede, pull-quote — ARE permitted here, as on the Glass Box reader; case studies are the other long-form surface), opens answer-first (the lede's first sentence names "Joshua R. Brandt, MSE"), is self-canonical with exactly ONE `<h1>`, is crawlable JS-off / 0 executable JS, and carries valid `CreativeWork` JSON-LD (ENRICH the Story 1.6 placeholder: keep `name: "loandemo"` + the real `author` Person; supply a real `description` + `dateCreated`; the existing build-output assertion `CreativeWork name "loandemo"` MUST stay green).

2. **The Dots show the BUILD, not only the plan — code/repo · build · retro (the FR-22 shipping evidence).**
   **Given** the case study
   **When** a peer inspects it
   **Then** its BMAD Method Dots include real shipping evidence — **code/repo · build · retro** — not only planning, rendered as sections with the IDs **`#code`, `#build`, `#retro`** (these are the exact fragment targets the Story 2.4 loandemo flagship Dots drill into — `/work/loandemo/#code` etc.; this story RESOLVES that forward-reference), and it cross-links to its READY 2026 talk on `/speaking/` (the route exists from Epic 1; the talk CONTENT lands in Epic 3 — forward-reference, link correctness verified now).

3. **Content gaps are curated substitutes + `[OPEN]`, never fabricated (credibility floor — carry the 2.4 AC4 lesson).**
   **Given** loandemo's real repo/video/artifact URLs and specific metrics are not committed to this repo yet
   **When** the case study renders
   **Then** every such gap is flagged `[OPEN]` in visible text with a curated substitute (e.g. the approach/architecture narrative, which IS real) — NO invented metrics, dates, repo URLs, or results ship as fact; the `#code`/`#build`/`#retro` sections carry the real *method* (agentic engineering / the BMAD Method process) with `[OPEN]` on the specific links/figures Story owners will supply.

4. **The two Stage-1 flagships of FR-22 are complete.**
   **Given** the portfolio-itself flagship is surfaced chiefly via the Glass Box (Stories 2.2/2.3) and this loandemo case study
   **When** a visitor looks for the Stage-1 proof
   **Then** both FR-22 Stage-1 flagships are present (the recursion-proof portfolio via the Glass Box + the non-recursive engineering proof loandemo here), and this page cross-links into the Glass Box and/or the Master Timeline so the two flagships reference each other.

5. **Integration AC — the 2.4 timeline Dots resolve here; the JSON-LD is consumer-valid.**
   **Given** the built site
   **When** a build-output / e2e test inspects `/work/loandemo/index.html`
   **Then** the `#code`, `#build`, `#retro` element IDs exist (so the Story 2.4 `/work/loandemo/#…` Dot links resolve to real in-page targets — no dangling fragment), the `CreativeWork` JSON-LD parses with `name: "loandemo"` + author Person + `description` + `dateCreated` (the consumer-observable structured-data contract), the `/speaking/` cross-link is a real `<a>`, and 0 executable scripts.

6. **Accessibility floor (WCAG 2.1 AA, NFR-2).**
   **Given** the rendered case study
   **When** audited (axe AA)
   **Then** one `<h1>`; clean heading hierarchy (`#code`/`#build`/`#retro` section headings are `<h2>`/`<h3>`, not a 2nd h1); `[OPEN]` status is real text (not color alone); sufficient contrast (tokened inks); keyboard-operable; in-page fragment links + the `/speaking/` link carry the global `:focus-visible` ring; 0 axe violations.

## Consumes

- **Story 2.4** — the Master Timeline's loandemo flagship Dots link to `/work/loandemo/#code|#build|#retro`. THIS story supplies those in-page anchors (resolving 2.4's forward-reference). The Integration AC (AC5) verifies the fragment targets exist.
- **Story 2.2** — the `ArtifactReader`/`ArtifactCard` patterns + the long-form editorial CSS (drop-cap, pull-quote) reused here.
- **Story 1.6** — the placeholder `CreativeWork` JSON-LD on this route (ENRICH it; keep the assertion green).

## Consumed-by

- **Epic 3 / Story 3.x** — `/speaking` (the READY 2026 talk this case study cross-links; talk content lands there). Forward-reference: link now, content later.
- **(Glass Box)** — the portfolio flagship's loandemo cross-links (the two flagships reference each other).

## Tasks / Subtasks

- [x] **Task 1 — The layered case-study page (`/work/loandemo.astro`).**
  - [x] Replace the Story 1.5 stub body. Compose through `MirrorLayout` (keep/refine the entity-first lede; one `<h1>`; self-canonical; 0-JS). Structure it as a layered case study: an answer-first overview → the build story → the `#code` / `#build` / `#retro` sections (each a `<section id="…">` with an `<h2>`), fusing the available assets (a video slot `[OPEN]`, the repo `[OPEN]`, the write-up — curated/real, and a link to the Master Timeline's loandemo cluster).
  - [x] Reuse the long-form editorial devices from the Glass Box reader (drop-cap lede, pull-quote) — case studies are the sanctioned second long-form surface (DESIGN). Reuse `ArtifactCard` for the code/build/retro nodes if it fits, or a case-study-section pattern; token-driven.
- [x] **Task 2 — Enrich the CreativeWork JSON-LD (AC1, AC5).**
  - [x] Update the placeholder in `/work/loandemo.astro` (uses `creativeWorkJsonLd` from `web/src/lib/jsonld.ts`): keep `name: "loandemo"` + the shared `PERSON` author; supply a real `description` (the agentic-engineering case study) + a real `dateCreated` (use a known/curated date or `[OPEN]`-flag if unknown — but `dateCreated` must be a valid ISO string for the schema). Keep the existing build-output CreativeWork assertion green; do NOT regress the 1.6 JSON-LD shape (the test asserts `@context`, `name`, `author.@type=Person`, `description`, `url`, `dateCreated`).
- [x] **Task 3 — Resolve the 2.4 fragment forward-reference + cross-links (AC2, AC4).**
  - [x] Add the `#code`, `#build`, `#retro` section IDs (exact — 2.4's loandemo Dots link `/work/loandemo/#code` etc.). Cross-link `/speaking/` (the READY 2026 talk — forward-ref) and the Glass Box / Master Timeline (the two flagships reference each other).
- [x] **Task 4 — Curated substitutes + `[OPEN]`, no fabrication (AC3).**
  - [x] Flag every unknown (repo URL, video URL, specific metrics/results, exact dates) `[OPEN]` in visible text with a curated substitute (the real method/approach narrative). NO invented figures/links/results. Mirror the 2.4 AC4 credibility posture.
- [x] **Task 5 — Tests (AC1–AC6; Rule 3 real-runtime; Rule 8 discoverable).**
  - [x] Build-output (Vitest, `web/test/`): assert on `/work/loandemo/index.html`: one `<h1>`; the `#code`/`#build`/`#retro` IDs exist (fragment targets for 2.4); the enriched `CreativeWork` parses (name "loandemo" + author Person + description + dateCreated) — KEEP/extend the existing 1.6 assertion; the `/speaking/` cross-link `<a>`; entity-first lede; 0 executable scripts; no exclamation marks; `[OPEN]` flags present where assets are gaps (no fabricated metric leaks).
  - [x] e2e (Playwright, `web/e2e/`): real-runtime (Rule 3) — the case study renders; an in-page `#code`/`#build`/`#retro` fragment scrolls/anchors correctly; the long-form devices (drop-cap, a pull-quote) render; axe AA → 0 violations; followable JS-off.
- [x] **Task 6 — Verify floor.** `pnpm build`, `pnpm --filter web test`, `pnpm --filter web test:e2e`, axe AA, determinism, **root `pnpm format:check`** (avoid the 2.2–2.4 format-gate gap — confirm the new `.astro`/tests are Prettier-clean), `pnpm typecheck`, `pnpm lint`. Confirm one `<h1>`, 0-JS, the 2.4 loandemo Dots now resolve to real fragments.

## Dev Notes

### What `/work/loandemo` is + the forward-refs it resolves

- The flagship case study (FR-22) — the non-recursive engineering proof (loandemo is the live-on-stage demo, complement to the recursion-proof portfolio surfaced via the Glass Box). EXPERIENCE.md: "loandemo (the finished flagship) carries real shipping nodes. Its case-study / Glass-Box Dots include the shipping evidence an engineering peer respects — code/repo · build · retro — not only planning. `[OPEN: loandemo repo + artifact URLs]`."
- **This story RESOLVES Story 2.4's forward-reference:** 2.4's loandemo flagship Dots link `/work/loandemo/#code`, `/work/loandemo/#build`, `/work/loandemo/#retro`. You MUST provide `<section id="code">`, `id="build"`, `id="retro"` so those fragments resolve. (AC5 tests it.)
- The existing route (`web/src/pages/work/loandemo.astro`) is the 1.5 stub + the 1.6 placeholder `CreativeWork` JSON-LD. Enrich, don't replace the JSON-LD wiring.

### Long-form editorial IS allowed here (unlike the Glass Box index)

- DESIGN/EXPERIENCE reserve the drop-cap + pull-quote for "the long-form reader AND case studies." So `/work/loandemo` MAY use them (reuse the Glass Box reader's CSS/patterns). The Glass Box INDEX may not — but this case study may.

### Credibility (carry the Story 2.4 AC4 lesson)

- loandemo is real, but its specific repo/video/metrics are not in this repo. Do NOT fabricate numbers, dates, URLs, or outcomes. Flag `[OPEN]` with a curated substitute (the method/approach, which is genuine). The build-output test asserts no fabricated-metric pattern + that `[OPEN]` flags are present where assets are gaps.

### CreativeWork JSON-LD (keep the 1.6 contract)

- `web/test/build-output.test.ts` (Story 1.6) asserts: `CreativeWork` with `@context: https://schema.org`, `name: "loandemo"`, `author.@type: "Person"`, `description` (string), `url` (string), `dateCreated` (string). Your enrichment must keep ALL of these valid. `creativeWorkJsonLd` + `PERSON` + `SITE_ORIGIN` are imported in the stub already.

### Critical gotchas (carry from 2.2–2.4)

- Exactly ONE `<h1>` (the case-study title via MirrorLayout); `#code`/`#build`/`#retro` headings are `<h2>`/`<h3>`. 0 executable JS. Trailing-slash links (`/speaking/`, `/glass-box/`, `/timeline/`; the in-page fragments are `#code` etc. on `/work/loandemo/`). Self-canonical `/work/loandemo/`.
- **Run the ROOT `pnpm format:check` before finishing** (Stories 2.2–2.4 shipped `.astro` files that the scoped prettier checks missed → the launch gate went RED; do not repeat that — `pnpm format` then `pnpm format:check` must be GREEN, or run `prettier --check .`).
- Drop-cap heading-demotion concern (from 2.2) does NOT apply (this is authored Astro markup, not rendered markdown — no body `#` headings to demote; just keep the one-h1 rule).

### Project Structure Notes

- Modified: `web/src/pages/work/loandemo.astro` (replace stub body, enrich JSON-LD). Possibly new: a small case-study section component under `web/src/components/` (or reuse `ArtifactCard`/the reader CSS). Tests under `web/test/` + `web/e2e/`.
- User-facing → **Rule 3 applies**: QA includes a real-runtime (Playwright/browser) test (incl. a fragment-anchor check + the long-form devices) + axe AA. The lead smoke drives the case study + the `#code`/`#build`/`#retro` fragments in a browser.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — the three epic ACs (layered case study + CreativeWork + `[OPEN]` gaps; code/repo·build·retro Dots + `/speaking` cross-link; portfolio flagship via Glass Box → FR-22 complete).
- [Source: …/EXPERIENCE.md "loandemo (the finished flagship)…code/repo · build · retro…`[OPEN: loandemo repo + artifact URLs]`"] + the §Editorial-restraint note (drop-cap/pull-quote for reader AND case studies).
- [Source: web/src/pages/work/loandemo.astro] — the 1.5 stub + 1.6 placeholder CreativeWork to enrich.
- [Source: web/src/lib/jsonld.ts (`creativeWorkJsonLd`) + web/src/lib/person.ts (`PERSON`, `SITE_ORIGIN`)] — the JSON-LD builders.
- [Source: web/test/build-output.test.ts#/work/loandemo CreativeWork] — the assertion to keep green (name "loandemo" + required fields).
- [Source: content/timeline/dots.ts (Story 2.4)] — the loandemo flagship Dots whose `/work/loandemo/#code|#build|#retro` targets this story provides.
- [Source: web/src/components/glassbox/ArtifactReader.astro / ArtifactCard.astro] — the long-form + card patterns to reuse.
- [Source: .claude/rules/project-rules.md#2, #3] — trailing-slash; forward-reference (`/speaking/` talk content lands Epic 3).
- [Source: .claude/rules/skill-rules.md#Rule 3] — user-facing surface needs real-runtime test evidence.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Test regex `\bid="code"\b` failed because `\b` does not match at quote (`"`) boundaries. Fixed to `toContain('id="code"')` and `/<section\b[^>]*id="code"[^>]*>/`. No other debug issues.

### Completion Notes List

- Task 1 complete: Replaced the 1.5 stub body with a full layered case study through `MirrorLayout`. Structured as: answer-first overview → pull-quote → `#code` / `#build` / `#retro` sections (each `<section id="…">` with `<h2>`) → cross-links nav. Used CSS-only editorial devices matching the Glass Box reader pattern (drop-cap on first overview paragraph, pull-quote blockquote). Evidence cards use the same chip/card token system as `ArtifactCard`. All tokens; no hardcoded values a token covers.
- Task 2 complete: Enriched the CreativeWork JSON-LD — removed `[PLACEHOLDER]` from description, replaced with a real case-study description. `dateCreated: "2026-06-01"` (curated month-start, deterministic fixed constant per NFR-6). All 1.6 assertions kept green: `name: "loandemo"`, `author.@type: "Person"`, `description`, `url`, `dateCreated` all valid.
- Task 3 complete: `id="code"`, `id="build"`, `id="retro"` are on `<section>` elements. Cross-links: `/speaking/` (forward-ref: Epic 3), `/glass-box/` (the recursion flagship), `/timeline/` (Master Timeline cluster). All trailing-slash.
- Task 4 complete: `[OPEN]` flags present for repo URL, technology stack, build video URL, build timeline/sprint dates, and full retrospective document. No invented metrics, dates, repo URLs, or results. Real method/approach narrative is the curated substitute throughout.
- Task 5 complete: 19 new Vitest build-output assertions in `web/test/build-output.test.ts`; 19 new Playwright e2e tests in `web/e2e/loandemo.spec.ts` (new `loandemo` project in `playwright.config.ts`); all pass.
- Task 6 complete: `pnpm build` ✓ (16 pages), `pnpm --filter web test` ✓ (503 tests), e2e loandemo project ✓ (19 tests), full e2e suite ✓ (131 existing), `pnpm format:check` ✓ (GREEN — avoided 2.2–2.4 gap), `pnpm typecheck` ✓, `pnpm lint` ✓.
- Forward-ref AC2 note: `/speaking/` cross-link is a real `<a>` pointing to the READY route from Epic 1. Talk content lands in Epic 3 — this is the explicit "forward-reference (not a defect)" pattern (project-rules.md Rule #3). The link is correct now (`href="/speaking/"` is followable JS-off); Epic 3 will verify resolution.

### File List

- web/src/pages/work/loandemo.astro (modified — full case study replacing 1.5 stub)
- web/test/build-output.test.ts (modified — Story 2.5 build-output assertions appended)
- web/e2e/loandemo.spec.ts (new — Playwright e2e spec for loandemo case study)
- web/playwright.config.ts (modified — added `loandemo` project for the new spec)

## Change Log

- 2026-06-06: Story 2.5 implemented. Replaced /work/loandemo stub with the layered case study (answer-first, #code/#build/#retro sections, drop-cap + pull-quote, [OPEN] gaps, cross-links). Enriched CreativeWork JSON-LD (real description, valid dateCreated). 19 new build-output tests + 19 new e2e tests. All floors green.

## Review Findings

Adversarial code review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) on the uncommitted Story 2.5 diff — 2026-06-06. **Clean review: 0 decision-needed, 0 patch, 0 defer, 3 dismissed as noise.** No HIGH/MEDIUM findings. All six ACs + NFR-1/NFR-6 + skill-rules Rule 1/2/3 verified against real build output.

Verified against ground truth (built `web/dist/work/loandemo/index.html` + `web/dist/timeline/index.html`):

- **AC3 (no fabrication — the recurring Epic-2 credibility floor):** independent scan of the visible `<main>` text found the ONLY digit-bearing tokens are `Stage-1`, `FR-22`, `2026` (talk year, forward-ref), `Epic 3` — zero fabricated metrics/outcomes/dates/repo-URLs. Five `[OPEN: …]` flags cover every asset gap (repo URL, tech stack, build video, sprint dates, retro doc). Method/approach narrative only. HELD.
- **AC5 (cross-story reciprocity):** the built `/timeline/` ships exactly `/work/loandemo/#code|#build|#retro`; all three resolve to real `<section id>` elements here. The QA reciprocity test reads the BUILT timeline HTML (ground truth), not a restated constant — both directions bound.
- **AC1 (CreativeWork JSON-LD):** parses; `name:"loandemo"`, `author.@type:"Person"` (`Joshua R. Brandt, MSE`), real `description` (no `[PLACEHOLDER]`), `dateCreated:"2026-06-01"` valid ISO (curated era-start from dots.ts; exact day `[OPEN]` — honest, not falsely-precise), `url` self-canonical. The 1.6 assertion stays green. One h1, 0 executable scripts, entity-first lede, trailing-slash self-canonical.
- **AC2 (long-form devices):** pull-quote `<blockquote>` ships `border-left:3px solid var(--color-accent)` + `font-style:italic`; drop-cap `::first-letter{font-size:3.5em;float:left}` on the first overview paragraph — both non-vacuous (computed-style e2e green; the real `<blockquote>` + first paragraph both exist, unlike 2.2's vacuous case).
- **AC6:** axe AA = 0 violations; all five `<section>` headings are h2 (h3 card titles deeper); one h1; `[OPEN]` is real italic text (not color-alone); `:focus-visible` rings present on links.
- **Tokens/determinism:** the lone hardcoded hex `#c6b89e` (crosslink hover border) matches the established `ArtifactCard.astro` literal for the identical purpose (no token covers this hover tint) — faithful reuse, not novel hardcoding. `dateCreated` is a fixed constant (NFR-6).

Dismissed (noise, not defects): (1) the AC3 fabrication scan inspects the first match per pattern class — protective for this zero-figure page and QA-mutation-verified; future-robustness only. (2) the keyboard-focus e2e test title ("reaches the cross-links") is slightly broader than its single-Tab assertion — the cross-link rings are covered by axe AA + verified `:focus-visible` CSS. (3) cosmetic hairline space before a period adjacent to the inline "Glass Box" link — below the actionable threshold.

Floors re-run by the reviewer: `pnpm build` ✓ (16 pages); `pnpm --filter web test` ✓ (506/506); `loandemo` e2e project ✓ (20/20, incl. axe AA 0 + cross-page reciprocity journey); `pnpm format:check` ✓ (GREEN — 2.2–2.4 gate gap avoided); `pnpm typecheck` ✓ (0/0/0); `pnpm lint` ✓.
