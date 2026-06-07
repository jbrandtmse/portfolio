# Story 3.1: Speaker Surface — reel & signature talks (`/speaking`)

---
baseline_commit: e5a6cfa0dfbf6f0f637707475b7663b59d16ba75
---

Status: done

<!-- Created by the /epic-cycle lead create-story gate (Epic 3), 2026-06-06. Source: epics.md Epic 3 Story 3.1.
     First feature story of Epic 3. Fleshes the Epic-1 /speaking + /speaking/reel STUBS (Story 1.5) with the
     real reel-poster, signature talk-cards, and REAL Event/VideoObject JSON-LD (replacing the 1.6 placeholders).
     Story 3.2 (bios & social proof) ADDS to this same /speaking page — leave it structured for that. -->

## Story

As a conference organizer (Mara, UJ-2),
I want the READY 2026 reel and specific, outcome-oriented signature talks front and centre on `/speaking`,
so that I can confirm in seconds that Joshua R. Brandt, MSE can deliver a great talk — without chatting with a bot, often on mobile, frequently arriving by a cold deep link (FR-19, UX-DR9, SM-C1).

## Context & decisions (read first)

This story turns the two Epic-1 STUBS (`web/src/pages/speaking.astro` and `web/src/pages/speaking/reel.astro` — currently a one-line note + a clearly-flagged PLACEHOLDER Event/VideoObject) into the real Speaker Surface. The whole site is a static Astro build (NFR-1 0-executable-JS-by-default, NFR-6 deterministic byte-stable build, AA). The `/speaking` route already exists, is self-canonical via `MirrorLayout`, resolves the hero-fork + Scene-4 teaser forward-refs, and trailing-slash URL form is locked site-wide (Rule 2).

### Decision 1 — curated content lives in a typed web-local data module

Put the reel metadata + the signature talks in **one typed module `web/src/data/speaking.ts`** (exported, strongly-typed shapes), imported by BOTH `/speaking` and `/speaking/reel`. Rationale: this content is **page-specific presentational data** consumed only by these two routes — NOT a cross-package, agent-reachable, or Project-Import surface (the agent-retrievable talk content is separate `content/kb/` markdown that lands in Epic 4; the timeline/glassbox `content/` + generator pattern exists because those are shared/harvested sources). A web-local module avoids the cross-package import boundary and the generator overhead, and is the proportionate choice. (If talks later become agent-reachable or Project-Importable, they migrate to `content/` + a generator — out of scope here.)

### Decision 2 — everything unconfirmed is `[OPEN]` / `[ASSUMPTION]`, labeled in visible text (credibility floor — no fabrication)

Josh has not finalized talk titles, abstracts, the reel video, or venues/dates. Per the project's hard no-fabrication rule (zero invented metrics/dates/URLs; the Epic-2 norm), every unconfirmed fact is a clearly-labeled placeholder **in the visible DOM text** (not tint/style alone): reel video URL, talk titles, abstracts, takeaways, formats, logistics. The veteran-IC-vantage talk is presented as a **pitchable angle flagged `[ASSUMPTION]`**. Seed content is allowed (so the page has real shape) as long as it is honestly flagged.

### Decision 3 — two new presentational components, matching the DESIGN tokens

- **`web/src/components/speaker/ReelPoster.astro`** — the one rich visual element. A static `<a>` (the link-out fallback), 16/9 (mobile 16/10), navy gradient `linear-gradient(155deg,#24456B 0%,var(--color-accent) 34%,#16263F 70%,#101D31 100%)` + a faint `rgba(246,240,230,0.06)` 1px registration-grid overlay, an 88px cream play ring (1.5px ring, translucent cream fill, cream play triangle) — **NO autoplay, no player JS**, cream corner labels "Speaker reel · READY 2026" + "90s", a `{typography.meta}` caption + a static link fallback. The `<a>` carries an `aria-label` naming the reel + its ~90s duration and links to `/speaking/reel/` (and the page also exposes the hosted-video link `[OPEN]`). The decorative gradient/grid is `aria-hidden`; text/links carry the meaning (EXPERIENCE a11y rule).
- **`web/src/components/speaker/TalkCard.astro`** — a signature talk: `{colors.surface-raised}`, 1px hairline border, radius 9px, padding `clamp(20px,2.2vw,28px)`, flat (no shadow). Outcome-oriented `<h3>` title; audience-level chip(s) stacked top-right (the `artifact-card.chip` style — 1px `--color-accent`-outlined small-caps, radius 2px); a 150–200-word abstract; 3–5 takeaways as a hairline-tick list (11px×1px `--color-accent` lead rule per item); formats/durations as `{rounded.full}` pill tags (1px hairline, accent text on surface-base); logistics in `{typography.meta}` `--color-ink-secondary` with key terms in `--color-ink-primary`. **The first talk's abstract is expanded; every other talk's abstract is inside a native `<details><summary>Read the abstract ▾</summary>` — works JS-off, full text in the DOM for crawlers.**

### Decision 4 — REAL Event/VideoObject JSON-LD via the Story-1.6 framework, deterministic

Replace the placeholder JSON-LD using the existing builders in `web/src/lib/jsonld.ts` (`eventJsonLd`, `videoObjectJsonLd`, `serializeJsonLd`) and the real `PERSON` (`web/src/lib/person.ts`) as `performer`:
- **`/speaking`** — emit one **`Event`** per signature talk (use `serializeJsonLd([...])` for the array), `name` = the (seed/`[ASSUMPTION]`-flagged) talk title, `performer` = real `PERSON`, with `startDate` / `location` / `organizer` as **deterministic `[OPEN]` placeholder constants** (fixed strings, NOT `new Date()`) until Josh confirms dates/venues. Where a talk has a recording, also emit its **`VideoObject`**.
- **`/speaking/reel`** — emit the READY 2026 reel's **`VideoObject`**: `name`/`description` real, `duration: 'PT1M30S'` (~90s), `thumbnailUrl`/`contentUrl`/`embedUrl` = `[OPEN]` absolute URLs at `SITE_ORIGIN` (so the schema validates) until the asset lands, `uploadDate` a fixed constant.
All JSON-LD is `application/ld+json` DATA (no executable JS; NFR-1). Determinism: every date is a fixed constant; two clean builds stay byte-identical (NFR-6). Target: passes Google's Rich Results Test for Event + VideoObject.

### Decision 5 — `/speaking` stays structured for Story 3.2

Story 3.2 (Copy-paste bios & social proof) ADDS bio-blocks + a credibility strip (metrics, testimonials, logos) to THIS page. Build `/speaking` as clearly-delimited sections (reel → signature talks) so 3.2 can append the bios + social-proof sections without restructuring. Do NOT build the bios/metrics/testimonials here (that is 3.2) — but leave a forward-reference note where they will go.

## Acceptance Criteria

1. **The READY 2026 reel is the lead item on `/speaking` via the reel-poster component.**
   **Given** `/speaking` (fleshing the Epic-1 stub)
   **When** it renders
   **Then** the first content item below the lede is the READY 2026 reel rendered by `ReelPoster.astro` (navy editorial gradient + faint registration-grid overlay, 88px cream play ring, **no autoplay / no player JS**, cream corner labels "Speaker reel · READY 2026" + "90s"), the poster is a real `<a>` with an `aria-label` naming the reel + its ~90s duration that links to `/speaking/reel/` (a static link-out fallback that works JS-off), and the reel video itself is flagged `[OPEN]` with the placeholder labeled in visible text.

2. **`/speaking/reel` is a server-rendered sub-route hosting the reel metadata so `VideoObject` is satisfiable in the initial HTML.**
   **Given** `/speaking/reel/`
   **When** it is built
   **Then** it renders the reel (poster + caption + a static link to the hosted video, `[OPEN]` until the asset lands) and emits a real `VideoObject` JSON-LD (name/description real; `duration` ~`PT1M30S`; `thumbnailUrl`/`contentUrl`/`embedUrl` `[OPEN]` absolute URLs; fixed `uploadDate`) — all in the initial server-rendered HTML, 0 JS.

3. **Signature talk-cards carry the full talk facts in real HTML.**
   **Given** the signature talks on `/speaking`
   **When** they render
   **Then** each `TalkCard` carries an outcome-oriented title, audience-level chip(s), a 150–200-word abstract (the FIRST talk's abstract expanded inline; every other talk's behind a native `<details>/<summary>` that works JS-off with the full abstract text present in the DOM), 3–5 takeaways, formats/durations pills, and logistics (travel, A/V)
   **And** the veteran-IC vantage is present as a pitchable angle (a seed talk title flagged `[ASSUMPTION]`)
   **And** all unconfirmed talk facts (titles/abstracts/figures) are flagged `[OPEN]`/`[ASSUMPTION]` with the placeholder labeled in visible text (not tint/style alone).

4. **Structured data — real Event (+ VideoObject on recordings) via the Story-1.6 framework.**
   **Given** the page is built
   **When** the JSON-LD is emitted
   **Then** `/speaking` emits one `Event` per signature talk (via `eventJsonLd` + `serializeJsonLd`, `performer` = the real `PERSON`, `startDate`/`location`/`organizer` deterministic `[OPEN]` constants) plus a `VideoObject` for any recorded talk, and `/speaking/reel` emits the reel `VideoObject` — all valid schema.org that passes the Rich Results Test (Event + VideoObject required fields present), emitted as `application/ld+json` DATA (no executable JS).

5. **Quality floor — NFR-1, NFR-6, AA, voice (no regression; Rule 5 canonical gate).**
   **Given** the literal `pnpm test:all` (= `typecheck && lint && format:check && test && test:e2e && lh`)
   **When** it runs end-to-end after the change
   **Then** every step is green: both `/speaking` and `/speaking/reel` ship **0 executable JS** (native `<details>` only; the reel poster is a static `<a>`, no autoplay/player script), the build is **byte-deterministic** across two clean builds (NFR-6; all dates are fixed constants), axe finds **0 WCAG 2.1 AA violations** (chips/pills/links AA-contrast, visible `:focus-visible`, `<details>` keyboard-operable, decorative gradient/grid `aria-hidden`), and the Lighthouse budgets still pass (the reel poster is CSS gradient + grid, not a heavy image — keep `total-byte-weight` under budget; if a raster poster asset is added it must be `[OPEN]`/optimized).
   **And** copy is positive-assertion, no hype, **no exclamation marks**; the page title/`<h1>` Title-case vs running-sentence casing rules hold; internal links are trailing-slash (Rule 2).

## Integration ACs

This is a feature story whose ACs are inherently integration-level: AC1–AC4 assert the **real rendered/built `/speaking` and `/speaking/reel` pages** (the user-observable Speaker Surface) and their emitted structured data, verified against the real `astro build` output + served runtime — not internal component state. The two new components (`ReelPoster`, `TalkCard`) and the `web/src/data/speaking.ts` module are consumed **within this story** by these two routes (no cross-story service contract; skill-rules Rule 1's "introduces a service" clause does not apply). Forward-reference (not a defect): Story 3.2 will consume the same `/speaking` page structure to add bios + social proof, and may reuse `web/src/data/speaking.ts` for talk/figure data; the hosted reel video + final talk titles/abstracts resolve when Josh confirms them (tracked as `[OPEN]`/`[ASSUMPTION]`).

## Tasks / Subtasks

- [x] **Task 1 — Curated content module (AC1, AC3, Decision 1/2).**
  - [x] Create `web/src/data/speaking.ts` with typed exports: the reel metadata (name, description, duration, hosted-video URL `[OPEN]`, thumbnail `[OPEN]`) and an array of signature talks (id, outcome-oriented title, audience levels[], 150–200w abstract, takeaways[] (3–5), formats/durations[], logistics {travel, av}, optional recording {url, …} for VideoObject). Mark the FIRST talk as the expanded one. Include the veteran-IC-vantage talk flagged `[ASSUMPTION]`. Every unconfirmed value is an `[OPEN]`/`[ASSUMPTION]`-flagged string surfaced in visible text.
- [x] **Task 2 — `ReelPoster.astro` component (AC1, Decision 3).**
  - [x] Build per the DESIGN `reel-poster` tokens (gradient, registration-grid overlay, 88px cream play ring, corner labels, caption, 16/9 → mobile 16/10, radius 10px, flat). A static `<a>` to `/speaking/reel/` with an `aria-label` naming the reel + ~90s duration; decorative gradient/grid `aria-hidden`; NO autoplay / no `<script>`. Static link-out fallback works JS-off.
- [x] **Task 3 — `TalkCard.astro` component (AC3, Decision 3).**
  - [x] Build per the DESIGN `talk-card` tokens (surface-raised, hairline, 9px, flat; h3 title; audience-level chips top-right; takeaways hairline-tick list; format pills; logistics meta). Accept an `expanded` prop: expanded → abstract inline; not expanded → wrap the abstract in a native `<details><summary>Read the abstract ▾</summary>` (full text in DOM, works JS-off, keyboard-operable, `:focus-visible`).
- [x] **Task 4 — Flesh `/speaking` (AC1, AC3, AC4, Decision 4/5).**
  - [x] Replace the stub body: lede (keep/refine the answer-first lede naming "Joshua R. Brandt, MSE") → `ReelPoster` (lead item) → a "Signature talks" section mapping `TalkCard` over the talks (first expanded). Add a forward-ref comment marking where 3.2's bios + credibility strip go.
  - [x] Replace the placeholder Event JSON-LD: emit one real `Event` per talk via `eventJsonLd` + `serializeJsonLd([...])` (performer = `PERSON`; deterministic `[OPEN]` startDate/location/organizer constants), plus `VideoObject` for any recorded talk. Keep it in the `jsonld` slot as `application/ld+json`.
- [x] **Task 5 — Flesh `/speaking/reel` (AC2, AC4).**
  - [x] Replace the stub body: render the reel (`ReelPoster` or a larger reel block) + caption + a static link to the hosted video (`[OPEN]`) + reel details. Replace the placeholder `VideoObject` with the real reel `VideoObject` (from `web/src/data/speaking.ts`; deterministic constants). 0 JS.
- [x] **Task 6 — Tests (AC1–AC5; skill-rules Rule 3 + Rule 8).**
  - [x] Component/build-output tests: `ReelPoster` renders the link with the duration-naming aria-label + no `<script>`/autoplay; `TalkCard` renders the chips/takeaways/pills and the first-expanded vs `<details>`-collapsed behavior with full abstract text in the DOM either way; `/speaking` emits N Event nodes with real titles + real performer; `/speaking/reel` emits a valid VideoObject. Build-output assertions on the real `dist` HTML.
  - [x] e2e (Playwright) on the served `/speaking/` + `/speaking/reel/`: reel poster is the lead item and is a followable `<a>` to `/speaking/reel/` JS-off; a collapsed talk's abstract text is in the DOM (and `<details>` toggles); axe AA clean on both routes. Ensure specs are discoverable by `playwright.config.ts` (Rule 8).
- [x] **Task 7 — Verify the floor with the LITERAL canonical gate (AC5).**
  - [x] Run the literal `pnpm test:all` end-to-end (Rule 5 — not a hand-narrowed subset); all steps green incl. `test:e2e` + `lh`. Confirm 0-JS on both routes (no `<script>` except the JSON-LD data block), two clean builds byte-identical (NFR-6), axe AA 0 violations. Validate the emitted Event + VideoObject against the schema.org/Rich-Results shape. Note files touched in the Dev Agent Record.

## Dev Notes

### Current state (files being modified/created — read before editing)

- **`web/src/pages/speaking.astro`** (stub, 70 lines): `MirrorLayout` with `heading="Speaking"`, an answer-first `LEDE` naming "Joshua R. Brandt, MSE", a PLACEHOLDER `eventJsonLd(...)` in the `jsonld` slot, and a `.stub-note` paragraph. Replace the body + the JSON-LD; keep the MirrorLayout wrapper + the answer-first lede pattern.
- **`web/src/pages/speaking/reel.astro`** (stub, 62 lines): `MirrorLayout` with `heading="Speaker reel"`, a PLACEHOLDER `videoObjectJsonLd(...)`, `.stub-note`. Replace the body + JSON-LD with the real reel.
- **`web/src/lib/jsonld.ts`**: typed builders `eventJsonLd(EventInput)`, `videoObjectJsonLd(VideoObjectInput)`, `serializeJsonLd(node | node[])` (XSS-safe, deterministic). `EventInput` requires name/startDate/eventAttendanceMode/location/performer/organizer (+ optional description); `VideoObjectInput` requires name/description/thumbnailUrl/uploadDate/duration (+ optional contentUrl/embedUrl). Reuse these — do NOT hand-roll JSON-LD.
- **`web/src/lib/person.ts`**: exports `PERSON` (real `PersonInput`) + `SITE_ORIGIN`. Use `PERSON` as `performer`; build `[OPEN]` URLs from `SITE_ORIGIN`.
- **`web/src/layouts/MirrorLayout.astro`**: props `heading`, `lede`, `title`, `description`, a `jsonld` slot (rendered in `<head>`), and the default slot (page body). Self-canonical, exactly one `<h1>`.
- **`web/src/components/glassbox/ArtifactCard.astro`**: the closest existing component pattern (Props interface, scoped `<style>` using `var(--color-*)`/`var(--space-*)`/`var(--radius-*)` tokens, hairline/flat). Match its conventions for the new components. Its `chip` style is the model for the talk-card audience-level chips.
- **DESIGN tokens (authoritative `talk-card` + `reel-poster` specs):** `_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/DESIGN.md` lines 262–315 (quoted in Decision 3). Visual reference mock: `…/mockups/speaker-surface.html` (talk-card, bio-block, metric, testimonial, reel-poster) — **the DESIGN/EXPERIENCE spine wins on any conflict with the mock**.

### Constraints / invariants to preserve

- **NFR-1 — 0 executable JS by default.** Native `<details>` for collapsed abstracts (no JS). The reel poster is a static `<a>` (no autoplay, no player script). No `<script>` on either route except the `application/ld+json` DATA block. Re-verify `dist/speaking/index.html` + `dist/speaking/reel/index.html` carry 0 `<script>` (non-JSON-LD).
- **NFR-6 — deterministic byte-stable build.** All dates/`[OPEN]` values are fixed constants (no `new Date()`, no wall-clock). Re-verify two clean builds are byte-identical.
- **NFR-2 / AA.** Chips/pills/links AA-contrast (navy on cream is 10.15:1); visible `:focus-visible` ring on the poster `<a>`, talk links, and `<details>` summaries; decorative gradient/grid `aria-hidden`; no info conveyed by color alone (`[OPEN]`/`[ASSUMPTION]` in text). axe AA = 0 violations.
- **NFR-3 / GEO.** Each Mirror route opens answer-first, first sentence naming "Joshua R. Brandt, MSE"; all talk facts in real crawlable HTML; valid Event/VideoObject JSON-LD (Rich Results).
- **Voice (Josh's preference — [[copy-positive-assertion-no-hype]]).** Positive-assertion, no hype, **no exclamation marks**. Title-case page heading vs running-sentence body casing — do not normalize one to the other. Credibility floor: zero invented facts; everything unconfirmed flagged `[OPEN]`/`[ASSUMPTION]` in text.
- **Rule 2 — trailing-slash internal links** (`/speaking/reel/`, etc.) via the established form.
- **Rule 5 — verify with the LITERAL `pnpm test:all`** (incl. `test:e2e` + `lh`), not a scoped subset.

### Previous-story intelligence (Story 3.0, just committed e5a6cfa)

- The canonical gate is `pnpm test:all` = `typecheck && lint && format:check && test && test:e2e && lh` — **`lh` (Lighthouse on `/` and `/about/`) is part of it** and is now GREEN (3.0 fixed the `lighthouserc.json` `/about/` URL). Keep the reel poster light so the Lighthouse `total-byte-weight`/`performance` budgets still pass.
- Determinism discipline: prefer fixed constants / `timeZone:'UTC'` formatting over `new Date()` wall-clock (3.0 added `formatDotDate`). Mirror that here for any date display.
- Run the LITERAL `pnpm test:all` (not step-by-step) — a scoped subset hid a red `lh` in 3.0 until the lead caught it.
- New `.astro`/`.ts` files must be covered by the root `prettier --check .` / `eslint` / `typecheck` globs (Rule 5).

### Project Structure Notes

- New files: `web/src/data/speaking.ts`, `web/src/components/speaker/ReelPoster.astro`, `web/src/components/speaker/TalkCard.astro`, plus tests under `web/test/` and `web/e2e/`. Modified: `web/src/pages/speaking.astro`, `web/src/pages/speaking/reel.astro`. No `api/`, `shared/`, or `content/` changes.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — the AC source (reel lead item, talk-cards, Event/VideoObject JSON-LD).
- [Source: …/ux-designs/ux-portfolio-2026-06-03/DESIGN.md#L262-315] — `talk-card` + `reel-poster` tokens (authoritative).
- [Source: …/ux-designs/ux-portfolio-2026-06-03/EXPERIENCE.md#Component Patterns] — Talk card / Reel / Bio-copy patterns + the UJ-2 organizer journey (reel front-and-centre; SM-C1 never bury the organizer).
- [Source: …/mockups/speaker-surface.html] — visual composition reference (spine wins on conflict).
- [Source: web/src/lib/jsonld.ts] — `eventJsonLd` / `videoObjectJsonLd` / `serializeJsonLd` (reuse; do not hand-roll).
- [Source: web/src/lib/person.ts] — real `PERSON` (performer) + `SITE_ORIGIN`.
- [Source: web/src/pages/speaking.astro, web/src/pages/speaking/reel.astro] — the stubs being fleshed.
- [Source: web/src/layouts/MirrorLayout.astro] — heading/lede/title/description + jsonld slot.
- [Source: web/src/components/glassbox/ArtifactCard.astro] — component + chip conventions to match.
- [Source: .claude/rules/project-rules.md#2,#5] — trailing-slash URL form; canonical full-gate verification.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6 (2026-06-06)

### Debug Log References
- Prettier format failures on all 6 new files — fixed with `pnpm prettier --write` before canonical gate.
- Two vitest failures: Astro Container API HTML-encodes `"` as `&quot;` in rendered text; tests using `.abstract.slice(0,80)` for the second+third talks hit the quote chars. Fixed by using quote-free substrings for assertions.
- Two Playwright e2e failures: `page.locator('.talk-card')` in strict mode errored when multiple `.talk-card` elements existed; fixed `veteran-IC` test with `.filter({ hasText })` and updated `collapsed-abstract` test to use quote-free snippet.

### Completion Notes List
- Created `web/src/data/speaking.ts`: typed module with `REEL`, `SIGNATURE_TALKS` (3 talks: agentic-patterns-that-ship [expanded], disciplined-agent-workflows, veteran-ic-vantage [ASSUMPTION]). Builder functions `talkEventInput`, `reelVideoObjectInput`, `talkRecordingVideoObjectInput`. All dates fixed constants (NFR-6). All unconfirmed values flagged `[OPEN]`/`[ASSUMPTION]` in visible text (Decision 2).
- Created `web/src/components/speaker/ReelPoster.astro`: naval editorial gradient (linear-gradient 155deg), faint registration-grid overlay, 88px cream play ring (CSS border triangle), cream corner labels, static `<a>` to `/speaking/reel/`, `aria-label` naming reel + ~90s duration, decorative elements `aria-hidden`, 0 executable JS, `:focus-visible` ring. DESIGN tokens honored.
- Created `web/src/components/speaker/TalkCard.astro`: surface-raised background, hairline border, radius 9px, flat. Header row (h3 + chips top-right), audience chips (1px accent outlined small-caps), abstract (inline when `expanded=true`, native `<details>/<summary>` when false), hairline-tick takeaway list (11px × 1px accent rule), format pills (rounded.full, accent text), logistics (meta weight, ink-secondary). `:focus-visible` on summary. 0 JS.
- Fleshed `web/src/pages/speaking.astro`: stub → lede + ReelPoster (lead item) + "Signature talks" section (TalkCard map, first expanded) + forward-ref comment for 3.2. Real Event JSON-LD (3 events via serializeJsonLd array) with performer = PERSON, deterministic [OPEN] constants.
- Fleshed `web/src/pages/speaking/reel.astro`: stub → lede + ReelPoster + reel details (duration, series, [OPEN] hosted video link) + reel description. Real VideoObject JSON-LD (REEL constants, PT1M30S, fixed uploadDate).
- Added `web/test/speaking.test.ts`: 37 tests covering ReelPoster (aria-label, no script, aria-hidden), TalkCard (chips, expanded/collapsed, full abstract in DOM, takeaways, pills, logistics), speaking.ts data module, and build-output assertions for both routes.
- Added `web/e2e/speaking.spec.ts`: 18 tests covering /speaking/ (reel poster link, <details> toggle, veteran-IC card, axe AA, 0 JS, keyboard) + /speaking/reel/ (poster, details section, axe AA, 0 JS).
- Added `speaking` project to `web/playwright.config.ts` (Rule 8 discoverability).
- NFR-1 verified: 0 executable scripts on both routes (1 ld+json DATA block each). NFR-6 verified: two clean builds byte-identical. axe AA: 0 violations on both routes. pnpm test:all exit 0 (176 e2e, 565 unit tests, lh green).

### File List
- web/src/data/speaking.ts (created)
- web/src/components/speaker/ReelPoster.astro (created)
- web/src/components/speaker/TalkCard.astro (created)
- web/src/pages/speaking.astro (modified — stub → real Speaker Surface)
- web/src/pages/speaking/reel.astro (modified — stub → real reel page)
- web/test/speaking.test.ts (created)
- web/e2e/speaking.spec.ts (created)
- web/playwright.config.ts (modified — added `speaking` project)

### Review Findings

**Code-review stage (Epic 3, Story 3.1) — 2026-06-06. Reviewer model: claude-opus-4-8[1m].**
Adversarial layers (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) run against the real `astro build` output + served runtime; key tests mutation-checked; the LITERAL `pnpm test:all` re-run end-to-end by the reviewer.

**Outcome: APPROVED.** 1 MED auto-resolved inline; 3 quality cleanups applied; 0 decision-needed; 0 deferred; 0 unresolved HIGH/MED. Final canonical gate GREEN (exit 0).

#### Auto-resolved (fixed inline by code-review)

- [x] [Review][Patch][MED] Reel-page poster was a self-link no-op — on `/speaking/reel/` the `ReelPoster` primary `<a>` pointed at `/speaking/reel/` (the page it is already on), so its play-button affordance + `aria-label="Watch … approximately 90 seconds"` promised an action it did not perform (reload). **Fix:** added a `posterHref` prop to `ReelPoster.astro` (default `/speaking/reel/`, so `/speaking/` is unchanged — AC1 preserved); `/speaking/reel/` now passes `posterHref={REEL.hostedVideoUrl}` so the poster links to the hosted video `[OPEN]` and the aria-label was updated to "Watch the reel video … [OPEN: hosted video link pending]" to match (satisfies AC2's "static link to the hosted video"). [web/src/components/speaker/ReelPoster.astro, web/src/pages/speaking/reel.astro] Verified in `dist`: `/speaking/` poster → `/speaking/reel/`; `/speaking/reel/` poster → `…/reel.mp4`; 0 executable JS unchanged.
- [x] [Review][Patch][LOW] TalkCard disclosure-marker comments were browser-swapped (the `list-style:none` rule was commented "WebKit" and the `::-webkit-details-marker` rule "Firefox"). Corrected the comments; no behavior change. [web/src/components/speaker/TalkCard.astro]
- [x] [Review][Patch][LOW] Stale doc-comment on the reel page said the poster is a "static `<a>` back to this page" — corrected to reflect the no-self-link fix. [web/src/pages/speaking/reel.astro]
- [x] [Review][Patch][LOW] Removed a dead `// eslint-disable-next-line no-bitwise` directive in the e2e spec (the flat config does not enable `no-bitwise`, so eslint reported it as an unused-disable warning). [web/e2e/speaking.spec.ts]

#### Regression tests added by code-review (lock in the fix)

- [x] Component-tier (vitest): `posterHref overrides the primary <a> target` — asserts the reel-page poster does not self-link. [web/test/speaking.test.ts]
- [x] Served-runtime (Playwright, `speaking` project): `the poster on the reel page links to the hosted video, not a self-link (AC2)`. [web/e2e/speaking.spec.ts]

#### Acceptance-criteria verification (against the real build/runtime)

- [x] **AC1** — On `/speaking/`, `ReelPoster` is the FIRST content item below the lede (e2e DOM-order check via `compareDocumentPosition` passes); static `<a href="/speaking/reel/">`; `aria-label` names the reel + "approximately 90 seconds"; decorative gradient/grid/play-ring all `aria-hidden`; 0 `<script>` except the ld+json DATA block.
- [x] **AC2** — `/speaking/reel/` renders the reel poster + caption + a static link to the hosted video; emits a real `VideoObject` (name/description real; `duration: PT1M30S`; `thumbnailUrl`/`contentUrl`/`embedUrl` absolute `[OPEN]` URLs; fixed `uploadDate 2026-01-01`) in the initial server-rendered HTML; 0 executable JS. (Self-link defect found here, now fixed.)
- [x] **AC3** — Three `TalkCard`s: outcome-oriented titles, audience-level chips, abstracts measured at 166 / 169 / 180 words (within 150–200), first expanded inline + others in native `<details>` with FULL abstract text in the DOM (verified JS-off via dist HTML), 4 takeaways each (within 3–5), format pills, logistics; veteran-IC vantage present as `[ASSUMPTION]`; all `[OPEN]`/`[ASSUMPTION]` flags render as VISIBLE tag-stripped body text (verified).
- [x] **AC4** — `/speaking/` emits exactly 3 `Event` nodes (one per talk) each with the full Rich-Results required set: `@context`, name, `startDate`, `eventAttendanceMode` (`MixedEventAttendanceMode`), typed `location` (VirtualLocation w/ url+name), `performer` = Person "Joshua R. Brandt, MSE" with NO nested `@context` (correct embedding), typed `organizer` (Organization). `/speaking/reel/` emits a valid `VideoObject`. All `application/ld+json` DATA. Deterministic (fixed `2026-01-01` constants; no `new Date()`).
- [x] **AC5** — LITERAL `pnpm test:all` GREEN end-to-end (exit 0): typecheck 0/0/0, eslint 0 errors/0 warnings, prettier clean, vitest 578 passed, Playwright 180 passed (incl. 22 `[speaking]`), Lighthouse passed on `/` + `/about/`. Both routes 0 executable JS. Two clean builds byte-IDENTICAL across the whole `dist` (NFR-6). axe AA 0 violations on both routes. No exclamation marks in copy (verified post-doctype-strip). Internal links trailing-slash (Rule 2): all page links end in `/`; only asset URLs (`/favicon.svg`, `…/reel.mp4`) are slash-less, which is correct.

#### Rule checks

- [x] **Rule 1 (Integration ACs):** feature story; `ReelPoster`/`TalkCard`/`speaking.ts` are self-consumed by `/speaking` + `/speaking/reel` within this story; no cross-story service contract. The story's "Integration ACs" section declares this accurately. ✓
- [x] **Rule 3 (real-runtime test evidence):** present at both tiers — vitest Astro-Container component tests + dist-HTML build-output assertions, and Playwright served-runtime e2e. ✓
- [x] **Rule 5 (canonical gate):** the reviewer re-ran the ROOT `pnpm test:all`, not a scoped subset; it is GREEN. (The reviewer's own edits initially turned `format:check` RED — caught by the canonical gate exactly as Rule 5 intends — then fixed.) ✓
- [x] **Rule 6 (ADRs):** `docs/adr/` does not exist — N/A.
- [x] **Rule 8 (test discoverability):** the `speaking` Playwright project (`testMatch /speaking\.spec\.ts/`) runs in the default suite (confirmed: 22 `[speaking]` tests executed); vitest globs cover the new `test/**` files. ✓

#### Dismissed as noise (not defects)

- `reel-poster__video-link` carries `rel="noopener noreferrer"` without `target="_blank"` — harmless redundancy on a same-tab link.
- `N Event nodes = SIGNATURE_TALKS.length` assertion is self-referential, but the keyed-by-title + absolute veteran-presence tests independently catch a dropped/renamed talk (confirmed by mutation: dropping the veteran talk fails 2 tests).
- Exclamation-mark test strips only `<!doctype html>`; brittle if a future `!important` appeared in inline copy context, but AC5's intent is met and no `!` exists today.

#### Doc-drift note (non-blocking, for the lead)

- The Dev Agent Record states "37" vitest + "18" e2e for `speaking.test.ts` / `speaking.spec.ts`; actual committed counts before review were 42 vitest in `speaking.test.ts` (+12 in `speaking-jsonld.test.ts`) and 21 e2e. Code-review added 1 vitest + 1 e2e (now 43 / 22). Counts in the record are stale but immaterial to acceptance.
