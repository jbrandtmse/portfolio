---
baseline_commit: 568a1a22f35d721f215bcf164273e34f8524eda0
---

# Story 1.7: Lean Static Fallback — /browse + global footer

Status: review

<!-- Epic 1, Story 1.7. Builds on 1.1–1.6. Replaces the placeholder footer slot with the real global footer (links every Mirror route) and adds /browse (the crawlable static index). The FR-8 Lean Static Fallback. Extends the 1.6 route registry/sitemap with /browse. -->

## Story

As a visitor with JS off or using a screen reader,
I want a complete static index and footer that reach every surface,
so that nothing is ever hidden behind the agent or the cinematics (FR-8).

## Acceptance Criteria

1. **Given** any page **When** it renders **Then** a static footer (in `BaseLayout`) carries real `<a>` links to every Mirror route (`/`, `/about`, `/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box`, `/faq`, `/invite`, `/browse`), works with JS off, and is screen-reader navigable.

2. **Given** `/browse` **When** it renders **Then** it is a crawlable index listing/linking every Mirror route with a one-line description each **And** it reaches 100% of the content that the agent (Epic 4) will be able to surface — parity is re-verified as each later epic lands its route content.

3. **Given** keyboard-only navigation **When** the visitor tabs through the footer and `/browse` **Then** every link is reachable and operable with a visible `:focus-visible` indicator.

## Integration ACs

*(Rule 1 — introduces `Footer.astro` (global shared component) + the `/browse` route.)*

- **IAC-1 (global footer on every page):** EVERY built page (home + all 9 Mirror routes + `/browse`) contains the footer with real `<a>` links to all 10 Mirror routes. Verifiable by parsing each `web/dist/**/index.html` for a `<footer>`/`role=contentinfo` `<nav>` containing the 10 hrefs. Works JS-off (real `<a>`, no island).
- **IAC-2 (`/browse` is complete + in the system):** `web/dist/browse/index.html` lists/links all 10 Mirror routes each with a one-line description; `/browse` is added to the route registry so it appears in `sitemap.xml` (now 10 routes) and the dist-derived sitemap guard (1.6 QA) still passes.
- **Note:** "100% agent-reachable parity" (AC2) is re-verified as later epics add route content; for Stage-1 the agent-reachable set == the current Mirror routes, all of which `/browse` + the footer link. Not a defect that future-epic content isn't present yet.

## Consumed-by

- **`Footer.astro`:** global — every page, every later epic (the static fallback floor). **`/browse`:** the FR-8 parity surface re-verified each epic; the Guide (Epic 4) fallback relies on it.

## Tasks / Subtasks

- [x] **Task 1 — `web/src/components/common/Footer.astro` (AC: 1, 3)**
  - [x] A static footer: a `<footer>` with a `<nav aria-label="…">` (or `role="contentinfo"`) containing real `<a>` links to ALL Mirror routes: `/`, `/about`, `/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box`, `/faq`, `/invite`, `/browse`. Include the Wordmark (or a small site identity) per DESIGN's static-fallback footer (UX-DR5).
  - [x] 0-JS, screen-reader navigable (landmark + accessible link text — not "click here"), visible `:focus-visible` ring on every link (reuse the 1.2 global focus pattern), color never the sole signal.
  - [x] Source the route list from the **1.6 route registry** (`web/src/lib/routes.ts`) where reasonable, so footer + sitemap + /browse stay in sync (single source of truth) — or a shared nav-list module. Avoid hardcoding the list in 3 places.
- [x] **Task 2 — Render the footer globally (AC: 1)**
  - [x] Render `<Footer/>` in `BaseLayout` (replacing/realizing the placeholder footer slot 1.2 left) so EVERY page (home + Mirror routes) gets it. Keep the slot as an optional override if cheap; the default is the global Footer.
- [x] **Task 3 — `/browse` route (AC: 2)**
  - [x] `web/src/pages/browse.astro` via `MirrorLayout`: answer-first lede (first sentence names "Joshua R. Brandt, MSE"), one `<h1>`, then a crawlable list linking every Mirror route with a one-line description each (calm, no hype, no exclamation). Real `<a>`s; works JS-off.
  - [x] Add `/browse` to `web/src/lib/routes.ts` (so sitemap includes it) — sitemap now 10 routes.
- [x] **Task 4 — Verify (AC: all, IAC-1/2)**
  - [x] Update `web/test/build-output.test.ts`: footer present on EVERY built page with all 10 Mirror hrefs; `/browse` builds, lists all 10 routes; sitemap now 10 routes (update the count + the dist-derived guard); home/hero/scene tests still green (the footer adds links — adjust any anchor-count assertions). Keep the 0-executable-script assertions intact (footer is 0-JS).
  - [x] `pnpm -r typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test`, `pnpm build` exit 0.
- [x] **Task 5 — Self-check vs ACs + DESIGN/EXPERIENCE.**

## Dev Notes

### Authoritative sources

- EXPERIENCE.md §"The static fallback", §Component-Patterns→"Static fallback footer", §Accessibility-Floor (crawlable + screen-reader navigable; one `<h1>`; color never sole signal). UX-DR5 (static-fallback footer), UX-DR13 (static fallback: /browse + footer reach 100%). DESIGN.md static-fallback footer component. architecture.md §Complete-Project-Directory-Structure (`components/common/Footer.astro`, `pages/browse.astro`), FR-8.

### Route list (the footer + /browse + sitemap must all cover these 10)

`/` (Home), `/about` (About / bio), `/timeline` (Master Timeline), `/speaking` (Speaking), `/speaking/reel` (Speaker reel), `/work/loandemo` (loandemo case study), `/glass-box` (Glass Box), `/faq` (FAQ), `/invite` (Invite Josh), `/browse` (this index). Keep them in sync via `web/src/lib/routes.ts` (1.6) — add `/browse` there.

### Suggested one-line descriptions for /browse (calm, no hype, no exclamation; epics refine)

- `/` — The home Scene Arc: the calm hero, the thesis, and the path through the work.
- `/about` — Who Joshua R. Brandt, MSE is, in his own words, with the channels where he works.
- `/timeline` — The Master Timeline: thirty years of shipping, from the runway to the agentic turn.
- `/speaking` — Signature talks, formats, and how to book Josh to speak.
- `/speaking/reel` — The speaker reel and its details.
- `/work/loandemo` — The loandemo flagship, built end to end as an agentic-engineering case study.
- `/glass-box` — The curated, read-only record of the real BMAD Method artifacts behind this site.
- `/faq` — The questions organizers and peers ask most, answered plainly.
- `/invite` — Send a short note to invite Josh to speak or collaborate.
- `/browse` — This index: every page on the site, reachable without JavaScript.

### Project Structure Notes

- New: `web/src/components/common/Footer.astro`, `web/src/pages/browse.astro`. Modify: `web/src/layouts/BaseLayout.astro` (render the global Footer), `web/src/lib/routes.ts` (add `/browse`), `web/test/build-output.test.ts`.
- The footer goes GLOBAL via BaseLayout → appears on the home + every Mirror route. This will add footer links to the home page — UPDATE the 1.3/1.4 build-output assertions that count anchors/links if needed (don't break them).
- Reuse: MirrorLayout (1.5) for /browse; tokens + Wordmark + global `:focus-visible` (1.2); routes.ts (1.6).
- 0-JS: footer + /browse are pure static (no islands). Keep the home's single gated rail script (1.4) the only executable JS.
- No ADR registry (`docs/adr/` absent) → Rule 6 no-op.

### Gotchas

- **Leave the working tree UNCOMMITTED** (lead commits after smoke). Suppress dev-story auto-commit.
- Adding the global footer changes EVERY page's HTML — re-run the full suite and fix any anchor-count/structure assertions in the 1.3–1.6 tests so they stay green and meaningful (the footer legitimately adds the Mirror links to every page).
- `/browse` added to `routes.ts` → sitemap is now 10 routes; update the 1.6 sitemap count assertion AND the dist-derived route-set guard (it auto-includes `/browse` once built — confirm it passes).
- Single `<h1>` per page (the footer/nav use no `<h1>`). Footer links must have meaningful text (route names, not "here").
- No exclamation marks anywhere.

### References

- [Source: epics.md#Story-1.7 — ACs verbatim]
- [Source: EXPERIENCE.md#static-fallback + #Component-Patterns(Static fallback footer) + #Accessibility-Floor; UX-DR5/DR13; FR-8]
- [Source: DESIGN.md static-fallback footer component]
- [Source: architecture.md#Complete-Project-Directory-Structure (Footer.astro, browse.astro)]
- [Source: skill-rules.md#Rule-1, #Rule-2]
- [Previous: 1.2 footer slot + tokens + Wordmark + focus pattern; 1.5 MirrorLayout + routes; 1.6 routes.ts registry + sitemap + dist-derived guard.]

## Dev Agent Record

### Agent Model Used

claude-opus-4-8[1m] (BMAD dev-story, under /epic-cycle).

### Debug Log References

- `pnpm -r typecheck` → 0 errors (35 Astro files; api/shared/web all clean).
- `pnpm lint` → exit 0.
- `pnpm format:check` → exit 0 (after `prettier --write web/src/lib/routes.ts`; the only formatting fix, pure whitespace string-wrapping, no semantic change).
- `pnpm -r --if-present test` → web 193 passed (6 files) + api 2 passed (1 file).
- `pnpm build` → 10 page(s) built; `/browse/index.html` + `sitemap.xml` emitted.
- Dist verification: footer present on all 10 built pages, each with real `<a>` to all 10 Mirror routes (exact registry order) and 0 executable scripts; `/browse` body has 10 `<li>` (link + description) and exactly one `<h1>`; `sitemap.xml` has exactly 10 `<loc>`; the global `:focus-visible` navy ring is in built CSS and is not overridden on footer/browse links.

### Completion Notes List

- **Single source of truth (Task 1).** Extended `web/src/lib/routes.ts` into the shared registry: `RouteEntry` now carries `label` + `description`; `NAV_ROUTES` is the canonical 10 (adds `/browse`); `SITEMAP_ROUTES` aliases it. The footer, `/browse`, and the sitemap all read this one array — adding a route in one place wires all three (no hardcoding the list in three places).
- **Footer.astro (Task 1).** New `web/src/components/common/Footer.astro`: a `<footer class="site-footer">` landmark wrapping a labelled `<nav aria-label="Site footer">` with a real `<a>` to every route from `NAV_ROUTES`, plus the canonical `Wordmark` as site identity. 0 executable JS; links carry a persistent hairline underline (color never the sole signal) and inherit the 1.2 global `:focus-visible` ring; the current page is marked `aria-current="page"` AND a textual " (current)" marker (non-color signal). Flat/hairline, token-driven.
- **Global render (Task 2).** `BaseLayout` now imports and renders `<Footer/>` unconditionally where the 1.2 placeholder `<footer>` slot was — every page (home + all Mirror routes + `/browse`) gets it. Removed the dead placeholder `<footer>`/scoped styles from BaseLayout and the now-orphaned `footer`-slot passthrough from MirrorLayout (no consumer used it; the global footer is the single footer landmark).
- **/browse (Task 3).** New `web/src/pages/browse.astro` via `MirrorLayout`: answer-first lede whose first sentence names "Joshua R. Brandt, MSE", exactly one `<h1>` (from the layout), and a crawlable `<ul>` (`aria-label="All site pages"`) of all 10 routes — each a real `<a>` (route label) + a one-line description `<p>` (the story's suggested descriptions). Calm, no hype, no exclamation; self-canonical and 0-JS via the shared layout.
- **Tests (Task 4).** Extended `web/test/build-output.test.ts`: added `ALL_MIRROR_ROUTES` (test-owned ground-truth copy) + `footerBlock`/`expectGlobalFooter` helpers; upgraded the prior 1.2/1.5 "footer slot region" checks (home + per-Mirror-route) to assert the realized global footer with all 10 hrefs + labelled nav + 0-JS + Wordmark; added `/browse` to `MIRROR_ROUTES` (inherits answer-first/self-canonical/one-h1/footer/0-JS/no-exclamation); added a dedicated `/browse` index block (links + descriptions for all 10, entity-first lede, no exclamation); added `/browse` to the sitemap test's route list (count guard now 10) — the dist-derived "live built page set" guard auto-includes `/browse` and stays green. The home's single-executable-script and no-exclamation assertions remain intact (the footer is 0-JS and carries no "!").
- **DESIGN/EXPERIENCE self-check (Task 5).** Matches EXPERIENCE §"The static fallback" (footer on every page links all 10; mobile footer unchanged), §Accessibility-Floor (crawlable + screen-reader navigable, one `<h1>`, color never sole signal), UX-DR5/DR13, FR-8. DESIGN pins no footer styling beyond the Wordmark (reused); footer realized in the flat/hairline token system.
- **No NFR tripwire (Rule 5 n/a), no ADR registry (`docs/adr/` absent → Rule 6 no-op).**
- **Working tree left UNCOMMITTED** (dev-story auto-commit suppressed; the lead commits after the smoke gate). Stayed on `PORT-1-epic1`.

### File List

New:
- `web/src/components/common/Footer.astro`
- `web/src/pages/browse.astro`

Modified:
- `web/src/lib/routes.ts`
- `web/src/layouts/BaseLayout.astro`
- `web/src/layouts/MirrorLayout.astro`
- `web/test/build-output.test.ts`

## Change Log

- 2026-06-06 — Story 1.7 implemented (Lean Static Fallback). Added the global static-fallback `Footer` (rendered by `BaseLayout` on every page; real `<a>` to all 10 Mirror routes, sourced from the `lib/routes.ts` registry) and the `/browse` crawlable index (lists/links all 10 with one-line descriptions). Added `/browse` to the route registry → sitemap is now 10 routes. Extended `build-output.test.ts` (footer on every page with all 10 hrefs; `/browse` complete; sitemap 10; prior footer-slot assertions upgraded; 0-JS assertions intact). All gates green (typecheck/lint/format/test/build exit 0; web 193 tests pass).
- 2026-06-06 — Code review (BMAD `/epic-cycle`, `claude-opus-4-8[1m]`). Outcome: **APPROVE — 0 HIGH / 0 MED / 0 LOW**. All gates re-run green; every AC / IAC re-verified independently against the real `web/dist` artifacts (not just via the tests). No code changes required. See Review Findings below.

## Review Findings

**Reviewer:** BMAD Code Review stage (`bmad-code-review`) under `/epic-cycle`, `claude-opus-4-8[1m]`, adversarial (Blind / Edge-Case / Acceptance layers performed inline).
**Baseline:** `568a1a2` · **Branch:** `PORT-1-epic1` (working tree, uncommitted).
**Verdict:** Approve. 0 HIGH, 0 MED, 0 LOW. No auto-resolutions needed; nothing deferred.

### Gates (all exit 0, re-run by the reviewer)

| Gate | Result |
|------|--------|
| `pnpm -r typecheck` | 0 errors (36 Astro files; api/shared/web clean) |
| `pnpm lint` | exit 0 |
| `pnpm format:check` | exit 0 (Prettier clean) |
| `pnpm -r --if-present test` | web 206 passed (7 files) + api 2 passed (1 file) |
| `pnpm build` | 11 HTML pages + `sitemap.xml` + `robots.txt` emitted |

*Note: the dev record cites "193 tests"; the QA stage added `Footer.component.test.ts` (12 runtime cases), bringing the web suite to 206. The `cycle-log` "tests_added=13" over-counts by one vs. the 12 the file emits — cosmetic bookkeeping only, no code impact.*

### AC / IAC verification (independent of the test suite — parsed from `web/dist`)

- **AC1 / IAC-1 (global footer everywhere):** PASS. All 11 built pages (home + 9 Mirror routes + `/browse`) carry `<footer class="site-footer">` with a labelled `<nav aria-label>`, a real `<a>` to all 10 Mirror routes (registry order), and **0 executable `<script>`** inside the footer. Footer is a top-level `<body>` child (sibling of `<main>`, never nested in the article landmark). Works JS-off (real anchors, no island). Link text is the route label on every link — no "here"/"click here".
- **AC2 / IAC-2 (`/browse` complete + in the system):** PASS. `/browse` `<main>` lists all 10 routes, each a real `<a>` + a one-line description `<p>` (10 `<li>`); exactly one `<h1>`; entity-first lede ("Joshua R. Brandt, MSE…"). `sitemap.xml` has exactly 10 `<loc>` including `/browse`; the dist-derived "live built page set" guard (set-equality both directions) passes. FR-8 parity: footer + `/browse` reach 100% of the current Mirror set.
- **AC3 (keyboard / non-color signal):** PASS. The global `:focus-visible` navy ring (`outline:2px solid var(--color-accent); outline-offset:2px`) ships in the bundled CSS that `/browse` and every page load; **no** `outline:` override is scoped to `.site-footer__link` or `.browse-link` (ring never suppressed). Current page is signalled three non-color ways at once: `aria-current="page"` + a visible textual " (current)" marker + a weight class; exactly one current link per page. Footer + browse links carry a persistent hairline underline (affordance never color-alone).

### Adversarial edge cases checked (all clean)

- **Nested-route current-marking:** on `/speaking` only `/speaking` is marked current; on `/speaking/reel` only `/speaking/reel` is. The `normalize()` comparison is exact-match (`===`), so the `/speaking` ⊂ `/speaking/reel` substring trap is avoided.
- **Orphaned `footer` slot removal:** `MirrorLayout` dropped its `<slot name="footer" slot="footer">` and `BaseLayout` replaced the placeholder `<footer><slot name="footer"/></footer>` with `<Footer/>`. Confirmed **no** remaining `slot="footer"` / `name="footer"` consumer anywhere in `web/src` — the removed slot was genuinely orphaned (no silent content drop).
- **Single source of truth:** `Footer.astro` + `browse.astro` import `NAV_ROUTES`; `sitemap.xml.ts` imports `SITEMAP_ROUTES` (= `NAV_ROUTES` alias). No triplicated hardcoded route list. Test files keep an independent ground-truth copy on purpose (drift detection) — correct, not a violation.
- **No regression from the global footer:** home still ships exactly **1** executable script (the gated scene-rail) + 1 ld+json; the 1.3 hero `<h1>` / 1.4 scene-order / 1.5 per-route / 1.6 JSON-LD+sitemap assertions are untouched. The two prior `provides the global footer slot region` checks were **strengthened** (now assert all-10-links + labelled nav + 0-JS via `expectGlobalFooter`), not loosened to vacuity. The `/browse` body block scopes its link assertions to `<main>` so they aren't satisfied incidentally by the global footer.
- **Voice / identity:** Wordmark string `Joshua R. Brandt, MSE` present on all 11 pages; **0 exclamation marks** in copy on every page; descriptions are one-line, calm, no-hype.
- **`routes.ts`:** existed at baseline (1.6) and was extended (`RouteEntry` gains `label`+`description`; `SITEMAP_ROUTES` kept as a back-compat alias) — a sound refactor, not the "pure whitespace" the dev note loosely described.

### Rules

- **Rule 3 (real-runtime evidence):** SATISFIED. User-facing surface backed by real-target evidence — `build-output.test.ts` asserts on real `astro build` HTML/CSS, and `Footer.component.test.ts` renders the component via Astro's Container API and asserts on real DOM. (Browser/Playwright is Story 1.9 per the directive — not required here.)
- **Rule 5 (NFR tripwire):** n/a — no un-implementable NFR encountered.
- **Rule 6 (ADR):** no-op — `docs/adr/` absent.
- **Rule 1 (Integration ACs):** IAC-1 + IAC-2 are real, testable by the consumer tier (build output + component render), and satisfied.

### Deferred / dismissed

None. No items appended to `deferred-work.md`.
