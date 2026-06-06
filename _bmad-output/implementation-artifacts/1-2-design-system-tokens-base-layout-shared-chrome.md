---
baseline_commit: 0d57b580f9197a6db2ed9a1ddf8e9743135f2a2f
---

# Story 1.2: Design system — tokens, base layout & shared chrome

Status: done

<!-- Epic 1, Story 1.2. Builds on Story 1.1 (the pnpm monorepo + web/ Astro app exist). Establishes the locked DESIGN.md identity as code: tokens.css, BaseLayout, and the first shared chrome components. Consumed by every later web story. -->

## Story

As a visitor,
I want the site to render in one calm, warm, editorial identity,
so that it reads as the work of someone with taste from the first glance.

## Acceptance Criteria

1. **Given** the locked DESIGN.md tokens **When** `web/src/styles/tokens.css` is authored **Then** all 8 core colors + 2 muted-ink variants, the Source Serif 4 type ramp, the radius scale, the 8px spacing scale, and the single `--shadow-float` exist as kebab-namespaced CSS custom properties with verbatim values **And** no component hardcodes a hex/size a token covers (enforced in review/lint).

2. **Given** the type system **When** the site loads **Then** Source Serif 4 is self-hosted, subset to Latin weights 400/600/700, with `font-display: swap`.

3. **Given** any page **When** it renders **Then** `BaseLayout.astro` provides `<html lang="en">`, head/meta, a JSON-LD slot, and a global footer slot, ships 0 JS by default, and realizes the flat/hairline system (depth via `surface-raised` + hairlines, never shadow except the Guide).

4. **Given** the design system **When** the shared chrome is built **Then** Wordmark (`Joshua R. Brandt, MSE`), Kicker (small-caps + navy lead-tick), and Button (primary/secondary as real `<button>`/`<a>`, `:focus-visible` ring, AA contrast) exist as reusable Astro components matching DESIGN.md and render correctly with JS off.

## Integration ACs

*(Rule 1 — this story introduces shared UI components + a base layout. Integration is exercised by a consumer that renders them.)*

- **IAC-1 (consumer renders chrome via BaseLayout):** A consumer page (the home `index.astro` rewired onto `BaseLayout`, and/or a `web/src/pages/_styleguide.astro` dev-only page) imports `BaseLayout` + `Wordmark` + `Kicker` + `Button` and builds. The built HTML is observably correct: exactly one `<html lang="en">`, the footer slot present, `Wordmark` text is `Joshua R. Brandt, MSE`, the primary Button renders as a real `<button>` (or `<a>`) with the navy fill (token-driven), and the page ships **0 `<script>` tags**. Verifiable via `astro build` + inspecting `web/dist/**/*.html` with JS off (the consumer-observable form of AC3/AC4).
- **IAC-2 (tokens are the single source of truth):** Component styles reference `var(--color-…)` / `var(--space-…)` / `var(--radius-…)` etc. — a grep of the authored component `<style>` blocks finds no raw hex that a token covers (AC1). The built CSS contains the token custom properties.

## Consumed-by

*(Rule 2.)*

- **`tokens.css` + `global.css`:** every later web component/page (1.3–1.10 and Epics 2–4).
- **`BaseLayout.astro`:** Story 1.5 (`MirrorLayout` extends/uses it), 1.3 (hero page), 1.4 (home scenes), 1.6 (JSON-LD slot), 1.7 (footer slot/`/browse`).
- **`Wordmark`, `Kicker`, `Button`:** Story 1.3 (hero fork buttons + wordmark), 1.4 (scene kickers), 1.5/1.7 (Mirror headers + footer), Epic 3 (speaker/invite CTAs).

## Tasks / Subtasks

- [x] **Task 1 — `web/src/styles/tokens.css` (AC: 1)**
  - [x] Author every locked token from DESIGN.md as a kebab-namespaced CSS custom property under `:root`, grouped: `--color-*`, font ramp (`--font-*` / `--text-*`), `--radius-*`, `--space-*` (+ measures), `--shadow-float`. Use the **verbatim values** in the Dev Notes table.
  - [x] Color never the sole signal is a usage rule (not a token) — note it in a comment; the meaningful muted inks (`--color-ink-ghost`, `--color-ink-meta-min`) exist precisely so quiet text stays ≥4.5:1.
- [x] **Task 2 — Source Serif 4 self-hosting (AC: 2)**
  - [x] Self-host Source Serif 4 subset to **Latin**, weights **400/600/700**, `font-display: swap`. Preferred path: `@fontsource-variable/source-serif-4` (variable font → satisfies the DESIGN opsz axis requirement, UX-DR2) OR `@fontsource/source-serif-4` (static 400/600/700); alternatively place subset `woff2` in `web/public/fonts/` with hand-authored `@font-face`. Whichever path, the built site must serve self-hosted Latin-subset woff2 with `font-display: swap` (no Google Fonts runtime request — NFR-5/perf). Wire `--font-family-base` to the loaded family.
  - [x] Keep font payload small (FCP budget, NFR-1). If using the variable font, subset to Latin only.
- [x] **Task 3 — `web/src/layouts/BaseLayout.astro` + `global.css` (AC: 3)**
  - [x] `<html lang="en">`, `<head>` with charset/viewport/meta description slot/title, import `tokens.css` + `global.css` + the font CSS. A **named `<slot name="jsonld" />`** in `<head>` (empty for now; Story 1.6 fills it). A **global footer slot** (`<slot name="footer" />` or a `<Footer/>` placeholder region; the real Footer is Story 1.7 — leave a clearly-marked slot/placeholder).
  - [x] `global.css`: apply `--font-family-base`, base `color: var(--color-ink-primary)` on `var(--color-surface-base)`, the body type (`--text-body`), a visible `:focus-visible` outline pattern (navy), and the flat/hairline baseline. **0 JS by default** — no `<script>`/island in BaseLayout.
  - [x] Realize the flat system: depth only via `surface-raised` + hairline borders; the ONLY shadow token is `--shadow-float` (reserved for the Guide, not used here).
- [x] **Task 4 — Shared chrome components (AC: 4)**
  - [x] `web/src/components/common/Wordmark.astro` — text `Joshua R. Brandt, MSE`, kicker font, weight 600, tracked uppercase, `--color-ink-primary`. Accept an optional `size`/`as` prop (hero vs compact). Pure markup + scoped `<style>`, 0 JS.
  - [x] `web/src/components/common/Kicker.astro` — small-caps eyebrow: uppercase, tracked ~0.30em, `--color-ink-secondary`, preceded by a 26px×1px `--color-accent` lead-tick (`gap` ~12–14px). Slot for the label text.
  - [x] `web/src/components/common/Button.astro` — `variant: 'primary' | 'secondary'`, renders a real `<button>` by default or an `<a>` when `href` is passed; primary = filled `--color-accent` + `--color-surface-base` text (AA 10.15:1), `--radius-md`; secondary = transparent + 1px outline; both have a visible `:focus-visible` navy ring (2px, 2px offset) and `--color-accent-hover` hover. No exclamation marks in any default copy.
  - [x] All three: match DESIGN.md component specs (token-referenced), scoped styles, render correctly JS-off.
- [x] **Task 5 — Wire a consumer + verify (AC: all, IAC-1/2)**
  - [x] Rewire `web/src/pages/index.astro` to use `BaseLayout` and render the chrome (a minimal, on-brand placeholder home is fine — the real hero is Story 1.3); optionally add a dev-only `_styleguide.astro` showcasing tokens + chrome.
  - [x] `pnpm -r typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` all exit 0.
  - [x] Confirm built `web/dist/index.html`: one `<html lang="en">`, Wordmark text present, real `<button>`/`<a>` for buttons, footer slot present, **0 `<script>` tags**; token custom properties present in built CSS.
- [x] **Task 6 — Self-check vs ACs + DESIGN.md.**

### Review Findings

Adversarial code review (Blind Hunter + Edge Case Hunter + Acceptance Auditor) under `/epic-cycle`, 2026-06-06. All five gates re-run green after fixes (`pnpm -r typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test` = api 2 + web 24, `pnpm build` — all exit 0). AC1 token fidelity verified VERBATIM against the built CSS (all 10 colors, full type ramp incl. every `clamp()`, radius scale, 8px spacing + measures, `--shadow-float` exact). AC2 font (self-hosted Latin opsz woff2, `font-display:swap`, weight `400 700`, 0 Google Fonts), AC3 BaseLayout (one `<html lang=en>`, slots, 0 `<script>`, no `box-shadow` on any surface), AC4 chrome (exact wordmark string, 26px×1px navy kicker tick, navy-fill/cream-text primary button, navy `:focus-visible` ring), and IAC-1/IAC-2 all confirmed against `web/dist`. No exclamation marks anywhere. Rule 3 (real-runtime evidence): satisfied — build-output suite asserts on a real `astro build` + Button Container-API render. Rule 5 (NFR tripwire): none triggered. Rule 6 (ADR): `docs/adr/` absent → no-op.

- [x] [Review][Patch] **Wordmark font-size deviated from the DESIGN spine (12px vs locked 13px)** [web/src/components/common/Wordmark.astro:34] — RESOLVED. `.wordmark` used `var(--font-size-kicker)` (12px), but `DESIGN.md §Components → wordmark` pins `fontSize: '13px'` (the wordmark borrows the kicker *family/weight*, not its size — `fontFamily: '{typography.kicker.fontFamily}'`). 13px is not on the ramp, so it is a DESIGN-pinned component one-off (same pattern as Button's 15px). Fixed to `font-size: 13px` with a clarifying comment; built CSS now emits `.wordmark{…font-size:13px…}`. Severity MED (a locked-spec visual deviation on a core chrome component consumed by Stories 1.3/1.4/1.5/1.7 + Epic 3 — caught before propagation; the spine wins on conflict).
- [x] [Review][Defer] **React integration emits an unreferenced ~193KB `_astro/client.*.js` chunk into `dist`** [web/astro.config.mjs:9] — deferred (out of 1.2 scope; dev-noted). The page ships **0 `<script>` tags** and references no `.js`, so NFR-1 (0-JS-by-default) holds at the page level; the chunk is dead weight on the CDN, never loaded by the home. Removing/scoping the React integration is a build-config concern owned by the first island story. See deferred-work.md.
- [x] [Review][Defer] **Empty `<footer class="site-footer">` renders a stray hairline-ruled + padded band on pages with no footer slot content** [web/src/layouts/BaseLayout.astro:57] — deferred (LOW). On the home (no footer slot) the built HTML emits `<footer class="site-footer">  </footer>` with a `border-top: 1px hairline` + `margin-top`/`padding`. The story explicitly sanctions an always-present placeholder ("reserve the region… BaseLayout footer-ready"), and IAC-1 wants the footer slot observable in `dist`; gating render on `Astro.slots.has('footer')` would remove the consumer-observable footer evidence and require reworking the QA test. Proportionate to defer to Story 1.7 (real Footer). See deferred-work.md.
- [x] [Review][Dismiss] **Button `[key: string]: unknown` index signature spreads misspelled props silently** — dismissed. Deliberate, idiomatic attribute-passthrough for a shared primitive (lets consumers pass `aria-*`, `rel`, `target`, `download`, etc.); both real branches (`<button>`/`<a>`) are type-tested.
- [x] [Review][Dismiss] **`format('woff2-variations')` is legacy syntax (modern: `format('woff2') tech('variations')`)** — dismissed. The legacy form is supported in all current browsers and the dev's chrome-devtools runtime evidence confirmed the face loads (`status:"loaded"`, `display:"swap"`). Not a defect.
- Note (doc hygiene, not a code finding): the story File List omits the QA-added `web/test/Button.component.test.ts` (5 assertions, present + passing); File List corrected below.

## Dev Notes

### Authoritative source

DESIGN.md (the visual spine) **wins on any conflict** with mocks/wireframes: `_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/DESIGN.md`. Read its `DESIGN TOKENS` block (lines ~19–328), `## Colors`, `## Typography`, `## Layout & Spacing`, `## Elevation & Depth`, `## Shapes`, `## Components`, `## Do's and Don'ts`. Promoted mocks for visual reference: `mockups/hero.html`, `mockups/guide.html` (do NOT build the Guide here — Epic 4). Architecture styling rules: architecture.md §AR-7, §Naming Patterns (CSS), §Frontend Architecture.

### Verbatim token values (author into `tokens.css` — kebab, grouped)

**Colors** (`--color-*`): surface-base `#F6F0E6` · surface-raised `#FBF7EF` · ink-primary `#211B14` · ink-secondary `#6B5D4A` · border-hairline `#D8CAB3` · grid-line `#ECE3D3` · accent `#1E3A5F` · accent-hover `#162B47` · ink-ghost `#776B55` · ink-meta-min `#756B56`. (AA notes are in DESIGN §Colors; meaningful muted text stays ≥4.5:1.)

**Font family** `--font-family-base`: `'Source Serif 4', 'Spectral', Georgia, 'Times New Roman', serif`.

**Type ramp** (size / weight / line-height / letter-spacing — all Source Serif 4):
- display: `clamp(46px, 6.6vw, 96px)` / 700 / 0.99 / −0.014em (mobile ~33px)
- h1: `clamp(34px, 4.4vw, 52px)` / 700 / 1.05 / −0.012em
- h2: `clamp(24px, 3.0vw, 40px)` / 700 / 1.07 / −0.01em
- h3: `clamp(21px, 2.2vw, 28px)` / 700 / 1.13 / −0.006em
- body: `18px` / 400 / 1.62 (UI body 14.5–15px)
- lede: `clamp(17px, 1.5vw, 19px)` / 400 / 1.6 / 0
- meta: `11.5px` / 600 / 1.4 / 0.12em (UPPERCASE usage)
- kicker: `12px` / 600 / 1.3 / 0.30em (UPPERCASE / small-caps in long-form)

**Radius** (`--radius-*`): sm `2px` · md `6px` · lg `8px` · panel `12px` · full `9999px`.

**Spacing** (`--space-*`): unit `8px` · 1 `4px` · 2 `8px` · 3 `12px` · 4 `16px` · 5 `20px` · 6 `24px` · 7 `32px` · card-pad `20px 24px` · gutter `26px` · margin-mobile `16px` · margin-desktop `clamp(20px, 4vw, 56px)` · section-band `clamp(38px, 4.2vw, 64px)`. Measures: reading `680px` · content `1040px`.

**Elevation**: `--shadow-float: 0 18px 44px -22px rgba(33,27,20,0.42), 0 4px 12px -8px rgba(33,27,20,0.20)` (RESERVED for the Guide — defined now, not applied to any surface in this story). Everything else flat (`none`).

### Shared chrome specs (token-referenced — see DESIGN §Components)

- **Wordmark:** `Joshua R. Brandt, MSE`; kicker font; weight 600; `letter-spacing: 0.30em` (hero) / 0.06–0.16em (compact); `text-transform: uppercase`; `color: var(--color-ink-primary)`.
- **Kicker:** uppercase, `letter-spacing ~0.30em`, `color: var(--color-ink-secondary)`; lead-tick = `26px × 1px` bar in `var(--color-accent)`, gap 12–14px before the label.
- **Button — primary:** bg `var(--color-accent)`, text `var(--color-surface-base)`, `border: 1px solid var(--color-accent)`, `border-radius: var(--radius-md)`, padding `13px 22px`, font 15px/600; hover → `--color-accent-hover`; focus → `2px solid var(--color-accent)` outline, 2px offset.
- **Button — secondary:** transparent, `color: var(--color-ink-primary)` (or accent variant), `border: 1px solid var(--color-ink-primary)` (or hairline), `--radius-md`; hover → faint navy wash `rgba(30,58,95,0.06)`, border+text → accent.

### Voice / copy constraints

- **No exclamation marks anywhere** (DESIGN Do's/Don'ts; user copy preference: positive-assertion, no hype). Any placeholder copy you add (home shell) must be calm/credible, not salesy.
- Canonical string `Joshua R. Brandt, MSE` is exact — do not normalize casing.

### Project Structure Notes

- New: `web/src/styles/{tokens.css, global.css}`, `web/src/layouts/BaseLayout.astro`, `web/src/components/common/{Wordmark,Kicker,Button}.astro`. Optional: `web/src/pages/_styleguide.astro` (dev-only; an underscore-prefixed page is not routed/built by Astro — good for a non-shipping showcase, or gate it out of `dist`).
- Modify: `web/src/pages/index.astro` (rewire onto BaseLayout). If you add `@fontsource*`, it's a `web` dependency (one `pnpm install`).
- Components are Astro (0-JS). Do NOT add React/islands here (NFR-1; islands are the Guide/Invite only, later epics).
- No ADR registry (`docs/adr/` absent) — architecture.md + DESIGN.md govern. No Rule 6 constraints.

### Gotchas

- **Leave the working tree UNCOMMITTED** (lead commits after smoke). Suppress the dev-story skill's auto-commit.
- AC1's "no hardcoded hex/size a token covers": author all component styles with `var(--…)`; the code-review stage enforces this (a stylelint rule is NOT required for this story — review-enforced).
- `font-display: swap` is mandatory; ensure no blocking/render-delaying font load.
- BaseLayout must ship **0 JS** — verify the built home page has 0 `<script>` tags (Story 1.1 already holds this; keep it).
- The footer is a *slot/placeholder* here; the real Footer with all Mirror links is Story 1.7 — don't build the full footer now, just the slot so BaseLayout is ready.
- The hero is Story 1.3 — `index.astro` here is just a minimal, on-brand shell proving the chrome renders.

### References

- [Source: epics.md#Story-1.2 — ACs verbatim]
- [Source: DESIGN.md#DESIGN-TOKENS + #Colors + #Typography + #Layout-Spacing + #Elevation + #Shapes + #Components + #Dos-and-Donts — verbatim token values & component specs]
- [Source: architecture.md#AR-7 (styling) + #Naming-Patterns (CSS: tokens kebab, namespaced) + #Frontend-Architecture]
- [Source: epics.md UX-DR1–UX-DR5 (color, type, shape/space, elevation, shared chrome)]
- [Source: skill-rules.md#Rule-1, #Rule-2]
- [Previous story 1.1: `web/` Astro app scaffold, TS strict, 0-JS-by-default established; build/typecheck/test gates green.]

## Dev Agent Record

### Agent Model Used

Opus 4.8 (1M context) — `claude-opus-4-8[1m]` — via the BMAD `bmad-dev-story` workflow under `/epic-cycle`.

### Debug Log References

- Full DoD gate green: `pnpm -r typecheck` (0 errors/warnings/hints), `pnpm lint` (0), `pnpm format:check` (clean), `pnpm -r --if-present test` (api 2 + web 19 = 21 passing), `pnpm build` (exit 0; only `/index.html` built — the underscore `_styleguide.astro` is correctly not shipped).
- Real-runtime browser verification (chrome-devtools MCP against the built `dist` served locally): 3 network requests, all same-origin (`/`, `/_astro/*.css`, `/fonts/source-serif-4-latin-opsz.woff2`) — **zero** Google Fonts / external requests (NFR-5); `document.scripts.length === 0` (NFR-1); `document.fonts` shows `Source Serif 4` weight `400 700` `status:"loaded"` `display:"swap"`; computed tokens resolve (accent `#1e3a5f`, surface `#f6f0e6`); primary button is a real `<a>` with navy fill + cream text; kicker lead-tick measures 26px×1px navy; `body` box-shadow `none` (flat system).

### Completion Notes List

All four ACs + both Integration ACs satisfied; verified by an automated build-output test suite (`web/test/build-output.test.ts`, 19 assertions) that runs a real `astro build` and asserts on the produced HTML/CSS — the consumer-observable form of AC1/AC3/AC4 and real-runtime evidence per skill-rules Rule 3.

- **AC1 (tokens):** `web/src/styles/tokens.css` authors all 10 locked colors (8 core + `ink-ghost` + `ink-meta-min`), the full Source Serif 4 ramp (per-axis tokens + `--text-*` shorthands), the radius scale, the 8px spacing scale + `--measure-reading`/`--measure-content`, and the single `--shadow-float` — all kebab-namespaced, grouped, with verbatim DESIGN.md values. The "color never the sole signal" usage rule is captured as a comment. Every component/layout style references `var(--…)`; the only raw color literal in component styles is the DESIGN-pinned `rgba(30,58,95,0.06)` secondary-button hover wash (not covered by any token).
- **AC2 (font):** Source Serif 4 self-hosted as a single Latin-subset **variable** woff2 (`web/public/fonts/source-serif-4-latin-opsz.woff2`, 122KB) with a hand-authored `@font-face` (`web/src/styles/fonts.css`): `font-display: swap`, weight range `400 700` (covers 400/600/700), the `opsz` optical-size axis (`format('woff2-variations')` — satisfies UX-DR2), and the Latin `unicode-range`. No Google Fonts runtime request.
- **AC3 (BaseLayout + global):** `web/src/layouts/BaseLayout.astro` provides `<!doctype html>` + `<html lang="en">`, head/meta (charset, viewport, generator, optional description), a named `<slot name="jsonld" />` in `<head>` (empty — Story 1.6), a global `<slot name="footer" />` placeholder region, imports tokens+fonts+global, ships **0 JS**, and applies no shadow (flat/hairline). `web/src/styles/global.css` sets the base type/color on the cream surface, a navy `:focus-visible` ring, and a `prefers-reduced-motion` gate.
- **AC4 (chrome):** `Wordmark` (exact `Joshua R. Brandt, MSE`, kicker font, 600, tracked uppercase, ink-primary; `size` hero/compact + `as` props), `Kicker` (uppercase, 0.30em, ink-secondary, 26px×1px navy lead-tick, decorative `aria-hidden`), `Button` (`variant` primary/secondary; real `<button>` by default or `<a href>`; primary navy-fill/cream-text 10.15:1, `--radius-md`; secondary transparent + ink outline → navy-wash hover; navy `:focus-visible` ring 2px/2px). All token-referenced, scoped, 0-JS. No exclamation marks.
- **IAC-1 / IAC-2:** `index.astro` rewired onto `BaseLayout`, rendering Wordmark + Kicker + Button as a calm placeholder home (positive-assertion copy, no hype, no exclamation marks; the real hero is Story 1.3). Built `dist/index.html`: exactly one `<html lang="en">`, the wordmark string, the primary action as a real `<a>` (token-driven navy), the footer slot region, **0 `<script>` tags**, and the token custom properties present in the built CSS.

NFR tripwire (Rule 5): none triggered — every NFR touched (NFR-1 0-JS, NFR-5 no third-party font) was implementable as worded. ADR registry (Rule 6): `docs/adr/` absent — no-op.

Decisions / non-obvious choices:
- **Font path = hand-authored single-file `@font-face` over the Latin opsz variable woff2** (one of the story's three sanctioned paths) rather than importing `@fontsource-variable/source-serif-4`'s `opsz.css`. The package import ships all 6 subset woff2 (~441KB in `dist`, though only Latin downloads); copying just the Latin opsz file ships exactly 122KB. This keeps the `opsz` axis (UX-DR2) and weights 400/600/700 while honoring the FCP/payload budget (NFR-1). The OFL-1.1 font binary originates from `@fontsource-variable/source-serif-4@5.2.9`.
- **`--shadow-flat: none` included as a token** because DESIGN.md `elevation.flat` is a named token components reference; `--shadow-float` is defined but applied to no surface (reserved for the Guide).
- **React integration left registered** (Story 1.1 scaffold, architecture §Frontend for the three later islands). It emits an unreferenced `_astro/client.*.js` chunk into `dist` that the page never loads — confirmed 0 `<script>` tags and 0 `.js` references in `index.html`, so the 0-JS DoD holds. Removing the integration is out of this story's scope.
- **Build-output test runs a real `astro build`** (resolving the astro bin via `require.resolve`) in `beforeAll`; the `web` package gained a `test` script + `vitest` devDep so the suite is discoverable by `pnpm -r --if-present test` (Rule 8).

### File List

New:
- `web/src/styles/tokens.css`
- `web/src/styles/fonts.css`
- `web/src/styles/global.css`
- `web/src/layouts/BaseLayout.astro`
- `web/src/components/common/Wordmark.astro`
- `web/src/components/common/Kicker.astro`
- `web/src/components/common/Button.astro`
- `web/src/pages/_styleguide.astro` (dev-only; not routed/shipped)
- `web/public/fonts/source-serif-4-latin-opsz.woff2`
- `web/vitest.config.ts`
- `web/test/build-output.test.ts`
- `web/test/Button.component.test.ts` (QA-added; 5 assertions — Container-API render of both Button branches)

Modified:
- `web/src/pages/index.astro` (rewired onto BaseLayout + chrome)
- `web/package.json` (added `test` script + `vitest` devDep)
- `pnpm-lock.yaml` (vitest resolved for the web package)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (1-2 → in-progress → review)
- `_bmad-output/implementation-artifacts/1-2-design-system-tokens-base-layout-shared-chrome.md` (this file: baseline_commit, task checkboxes, Dev Agent Record, Change Log, Status)

## Change Log

| Date | Change |
|---|---|
| 2026-06-06 | Story 1.2 implemented: design tokens (tokens.css), self-hosted Source Serif 4 (Latin opsz variable, font-display: swap), BaseLayout + global.css (0-JS, flat/hairline, JSON-LD + footer slots), shared chrome (Wordmark/Kicker/Button), index.astro rewired onto BaseLayout, and a real-build output test suite (19 assertions). Full DoD gate green. Status → review. |
