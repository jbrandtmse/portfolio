---
baseline_commit: 0d71918c91e4f0d794d2ed72dd0374fe51f1eca0
---

# Story 1.4: Home Scene scaffold + scene-rail (skip/progress)

Status: done

<!-- Epic 1, Story 1.4. Builds on 1.1–1.3. Lays the locked 7-scene home arc + the persistent scene-rail (the FR-2 skip/progress affordance). Hero (#hero) already exists from 1.3; this story adds the remaining 6 scenes (Thesis authored; Timeline/Speaker/Flagship/Glass-Box teasers; Close shell) + the rail. -->

## Story

As a visitor,
I want to move through the home's Scenes and always know where I am and how to skip ahead,
so that I am never trapped in scroll-jacking and can jump straight to what I want.

## Acceptance Criteria

1. **Given** the home `/` **When** it renders **Then** it presents the locked 7-scene order (Hero → Thesis → Master Timeline → Speaker → Flagship → Glass Box → Close) as discrete sections each with a stable in-page anchor (`#hero`…`#close`), the Thesis scene content ("The medium is the message.") is authored here **And** the Timeline/Speaker/Flagship/Glass Box scenes are teaser slots (filled by their epics) and the Close is a shell (CTAs filled by Epic 3), each summarize-and-link to its Mirror route without duplicating the Mirror body (UX-DR10).

2. **Given** desktop **When** the visitor scrolls **Then** a slim right scene-rail shows all 7 scenes as real in-page anchor links (each a ≥44×44px target with a visible `:focus-visible` ring), a progress meter ("Scene N of 7"), a "Skip to the end", and a "Jump: book a talk" shortcut to `/speaking` **And** the current scene is indicated via `aria-current` + weight, never color alone.

3. **Given** mobile **When** the visitor scrolls **Then** the rail collapses to a sticky top progress bar + a "Jump to section" menu carrying the same anchors and skip/jump affordances.

4. **Given** the home **When** motion is reduced or JS is off **Then** the progress meter is a static filled bar, scenes are plain sequential sections, and there is no scroll-jacking without the visible skip affordance.

## Integration ACs

*(Rule 1 — introduces the `SceneRail` component + the scene scaffold; consumer = the home page.)*

- **IAC-1 (rail navigates the scenes):** The built home `/` contains 7 `<section>`s with ids exactly `hero, thesis, timeline, speaker, flagship, glass-box, close` (in that DOM order), and the `SceneRail` contains 7 real `<a>` whose hrefs are exactly `#hero … #close` (matching the section ids), plus a "Skip to the end" → `#close` and "Jump: book a talk" → `/speaking`. Verifiable in `web/dist/index.html`. Clicking/activating any rail anchor (a real fragment link) targets its section — followable JS-off.
- **IAC-2 (JS-off / reduced-motion completeness, NFR-2, AC4):** With JS disabled the 7 scenes are plain sequential sections, every rail anchor + skip/jump is present and followable, and the progress meter renders as a static filled bar (no dynamic dependency). Any dynamic current-scene tracking is a gated enhancement with this static baseline.
- **Forward-reference note (not a defect):** the teaser scenes link to `/timeline`, `/speaking`, `/work/loandemo`, `/glass-box` and the rail's "Jump: book a talk" → `/speaking` — these Mirror routes are created in **Story 1.5** and 404 until then. Correct hrefs now; target resolution verified after 1.5. The Explore→`#thesis` target from 1.3 now resolves (this story creates `#thesis`).

## Consumed-by

- **`SceneRail.astro` + the scene scaffold:** the home `index.astro` (this story). The teaser scenes are filled by Epic 2 (Timeline/Flagship/Glass-Box) and Epic 3 (Speaker/Close CTAs). The reduced-motion gate used here is consolidated into `web/src/lib/motion.ts` in **Story 1.9**. Epic 5 layers the cinematic camera-path on this base (degrading back to it under reduced-motion).

## Tasks / Subtasks

- [x] **Task 1 — Scene scaffold in `web/src/pages/index.astro` (AC: 1)**
  - [x] Lay the locked 7-scene order as discrete `<section>`s with stable ids: `#hero` (the 1.3 HeroStatic), `#thesis`, `#timeline`, `#speaker`, `#flagship`, `#glass-box`, `#close`. DOM order = the locked order.
  - [x] **Thesis** (`#thesis`): author the scene content — the thesis line **"The medium is the message."** with a brief, calm framing (no hype, no exclamation). This is the one fully-authored non-hero scene.
  - [x] **Teaser scenes** (Timeline/Speaker/Flagship/Glass-Box): each a `Kicker` + 1–2 sentence summary + a real link to its Mirror route (`/timeline`, `/speaking`, `/work/loandemo`, `/glass-box`). **Summarize-and-link only — do NOT duplicate Mirror body text** (UX-DR10 duplicate-content guard). Mark clearly that the epic owning each fills it.
  - [x] **Close** (`#close`): a shell scene — placeholder for the invite/follow CTAs (filled by Epic 3). A calm closing line + a real link to `/invite` is fine; no form here.
  - [x] Keep exactly one `<h1>` on the page (the hero positioning line); scenes use `<h2>`/`<h3>` — clean heading hierarchy (NFR-2/SEO).
- [x] **Task 2 — `web/src/components/scene/SceneRail.astro` (AC: 2)**
  - [x] Desktop slim right rail (per DESIGN `scene-rail`): 7 entries, each a real `<a href="#…">` with the scene-name link text carrying the meaning; the decorative tick glyph is `aria-hidden`; each entry's hit area ≥44×44px (pad the row); visible `:focus-visible` navy ring.
  - [x] A progress meter labeled "Scene N of 7"; a "Skip to the end" control → `#close`; a "Jump: book a talk" → `/speaking`. (This whole rail IS the FR-2 skip/progress affordance.)
  - [x] Current scene indicated via `aria-current="true"` + weight (and the lit tick) — **never color alone** (status also in weight/text).
- [x] **Task 3 — Current-scene + meter behavior, gated (AC: 2, 4)**
  - [x] Static baseline (JS-off / reduced-motion): `aria-current` on the first scene (`#hero`), the meter a **static filled bar** at "Scene N of 7", scenes plain sequential sections — fully functional with 0 JS.
  - [x] Enhancement (motion allowed): as the visitor scrolls, the current scene's `aria-current` + weight track the in-view scene and the meter reflects progress. Prefer **CSS scroll-driven animation** for the visual meter fill/highlight (auto-degrades under `@media (prefers-reduced-motion: reduce)`); if JS is needed for the semantic `aria-current`, use a **minimal vanilla** `IntersectionObserver` behind a **two-layer reduced-motion gate** (CSS media query AND a JS init-guard that checks `prefers-reduced-motion` and does nothing if reduced). Keep any JS tiny (NFR-1).
  - [x] **No scroll-jacking** — the page scrolls natively; the rail only reflects/jumps. (The Stage-2 camera path is out of scope.)
  - [x] NOTE: the shared `web/src/lib/motion.ts` gate is Story 1.9 — implement a MINIMAL inline gate here and leave a `// TODO(Story 1.9): consolidate into motion.ts` marker. Do NOT pre-build motion.ts.
- [x] **Task 4 — Mobile reflow (AC: 3)**
  - [x] On mobile the rail collapses to a **sticky top progress bar + a "Jump to section" menu** carrying the same 7 anchors + skip + jump-to-`/speaking`. Presentation-only (same DOM/anchors); reading order preserved.
- [x] **Task 5 — Wire + verify (AC: all, IAC-1/2)**
  - [x] Render `SceneRail` on the home (via `index.astro` or a home wrapper). Keep it 0-JS-by-default except the minimal gated enhancement.
  - [x] Update `web/test/build-output.test.ts` for the 7 sections/ids, the rail anchors + skip/jump, and the script-count expectation (if a tiny rail script now ships, assert it's the minimal gated enhancement, not a regression — keep the assertion meaningful).
  - [x] `pnpm -r typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test`, `pnpm build` exit 0.
- [x] **Task 6 — Self-check vs ACs + DESIGN/EXPERIENCE.**

## Dev Notes

### Authoritative sources (spines win)

- EXPERIENCE.md §"Scene order (Stage 1, locked)", §Component-Patterns→Scene-rail, §State-Patterns (JS-off, Reduced-motion enumeration), §Interaction-Primitives (scroll-native arc + scene-rail; banned scroll-jacking), §Accessibility-Floor, §Responsive (rail reflow). DESIGN.md `scene-rail` component spec (tokens, tick, meter, current-state halo/edge-bar).
- architecture.md §Frontend-Architecture (0-JS default), §Requirements-to-Structure (FR-2 → index + components/scene).

### Locked scene order + anchors

`#hero` → `#thesis` → `#timeline` → `#speaker` → `#flagship` → `#glass-box` → `#close`. (Speaker sits early–mid by design — SM-C1.) The hero (#hero) is the 1.3 HeroStatic; this story adds the other six.

### Scene content rules

- **Thesis** (authored here): **"The medium is the message."** + calm framing. No hype, no exclamation marks.
- **Teasers** (Timeline/Speaker/Flagship/Glass-Box): summarize-and-link — 1–2 sentences + a real link to the Mirror route. **Never duplicate the Mirror body** (UX-DR10 — the clean Mirror wins the citation). Each is a slot its epic fills (Epic 2: Timeline/Flagship/Glass-Box; Epic 3: Speaker).
- **Close**: a shell — calm closing line + `/invite` link; the invite/follow CTAs are Epic 3.
- Mirror routes (`/timeline`,`/speaking`,`/work/loandemo`,`/glass-box`,`/invite`) are created in **Story 1.5** — correct hrefs now, 404 until 1.5 (not a defect).

### Scene-rail (DESIGN `scene-rail`)

- Desktop: slim right rail on `surface-raised`, left hairline, width ~208px; 7 ticks (9px circle, 1px accent ring), current = filled accent + soft halo + 3px navy edge-bar + label weight 700 + `aria-current`; tick+label row is one ≥44×44px target; `:focus-visible` 2px navy outline. Meter = 5px track in `grid-line`, fill `accent`. "Skip to the end" = outline button. Flat (no shadow).
- The **scene-name link text** carries meaning/navigation; the decorative tick glyph is `aria-hidden`. Color is never the sole signal (current also shown by weight + `aria-current`).
- Mobile: sticky top progress bar + "Jump to section" menu (same anchors + skip + jump).

### Reduced-motion / JS-off (the two-layer gate)

- **Both layers required:** CSS `@media (prefers-reduced-motion: reduce)` AND a JS init-guard (don't initialize the scroll observer if reduced). Per EXPERIENCE State-Patterns: the scene-rail meter's animated width-fill becomes a **static filled bar at "Scene N of 7."**
- JS-off: scenes are plain sequential sections; rail anchors + skip/jump all work; meter static. No scroll-jacking (the page is scroll-native — there's no camera path in Stage 1).
- The shared gate utility `web/src/lib/motion.ts` is **Story 1.9**; implement minimal inline now + leave a TODO to consolidate. Do not re-implement motion globally.

### Project Structure Notes

- New: `web/src/components/scene/SceneRail.astro` (+ any tiny gated rail script — Astro `<script>` or a small `web/src/lib/` helper; keep minimal). Modify: `web/src/pages/index.astro` (add the 6 scenes + render SceneRail), `web/test/build-output.test.ts`.
- Reuse 1.2 chrome (Kicker, Button) + tokens; reuse 1.3 hero. Do NOT build Mirror routes (1.5), the real Timeline/Speaker/Glass-Box content (Epics 2–3), or the Guide (Epic 4).
- 0-JS-by-default holds except the minimal gated rail enhancement (NFR-1 budget easily holds; it's <1KB). No React island for the rail (it's not one of the 3 islands).
- No ADR registry (`docs/adr/` absent) → Rule 6 no-op.

### Gotchas

- **Leave the working tree UNCOMMITTED** (lead commits after smoke). Suppress dev-story auto-commit.
- The home page may now ship ONE tiny scene-rail enhancement script — UPDATE the build-output test's script-count assertion accordingly (it was 0; if a rail script ships, assert exactly the expected minimal enhancement and that it's gated). If you achieve the rail with pure CSS scroll-driven + static `aria-current`, 0-script can hold — either is acceptable, but the test must match reality and stay meaningful.
- Keep exactly ONE `<h1>` (hero). Scene titles are `<h2>`.
- Don't let the teasers duplicate Mirror body text (UX-DR10).
- Every rail entry + skip + jump must be keyboard-operable with a visible focus ring; current state never by color alone.

### References

- [Source: epics.md#Story-1.4 — ACs verbatim]
- [Source: EXPERIENCE.md#Scene-order + #Component-Patterns(Scene-rail) + #State-Patterns(JS-off, Reduced-motion) + #Interaction-Primitives + #Accessibility-Floor + #Responsive]
- [Source: DESIGN.md scene-rail component spec + tokens]
- [Source: architecture.md#Frontend-Architecture + #Requirements-to-Structure (FR-2)]
- [Source: skill-rules.md#Rule-1, #Rule-2]
- [Previous: 1.3 HeroStatic (#hero, Explore→#thesis); 1.2 Kicker/Button/tokens; build-output test pattern.]

## Dev Agent Record

### Agent Model Used

Opus 4.8 (1M context) — `claude-opus-4-8[1m]` — via the BMAD `bmad-dev-story` workflow under `/epic-cycle`.

### Debug Log References

- `pnpm -r typecheck` → 0 errors (15 Astro files checked, incl. new `SceneRail.astro`).
- `pnpm lint` → exit 0.
- `pnpm format:check` → exit 0 (3 new/modified files formatted with Prettier).
- `pnpm -r --if-present test` → exit 0 (api 2/2, web **48/48**).
- `pnpm build` → exit 0 (static `web/dist/index.html`).
- Real-runtime browser smoke (chrome-devtools, served `web/dist`): desktop rail (fixed, 208px, `aria-current` on `#hero`, edge-bar + weight, rail-row hit area 167×44px), enhancement (on scroll, `aria-current` + "Scene N of 7" + meter fill track the in-view scene — verified `#speaker` → "4"), reduced-motion JS init-guard bails (after scrolling, `aria-current` stays `#hero`, label stays "1"), mobile reflow (sticky bar + `<details>` "Jump to section" menu with 9 links), native fragment nav (skip → `#close`, scene anchor → `#timeline`), 0 console errors. Screenshots: `smoke-evidence/1-4-desktop-hero-rail.png`, `smoke-evidence/1-4-mobile-rail-menu-open.png`.

### Completion Notes List

- **All 4 ACs + IAC-1/IAC-2 satisfied**, verified against the REAL built `web/dist/index.html` (skill-rules Rule 3 real-runtime evidence) and a browser smoke.
- **Locked 7-scene scaffold** (`index.astro`): `#hero` (1.3 HeroStatic, reused), `#thesis` (authored: "The medium is the message." + the answer-first entity-named lede for `/`), `#timeline`/`#speaker`/`#flagship`/`#glass-box` (Kicker + 1–2-sentence summarize-and-link teasers → their Mirror routes, UX-DR10 — no Mirror body duplicated), `#close` (shell: calm line + `/invite`). Exactly one `<h1>` (hero); six `<h2>` scene titles.
- **`SceneRail.astro`** — desktop slim right rail: 7 real `<a href="#…">` (scene-NAME carries meaning; tick `aria-hidden`; each row ≥44×44px; `:focus-visible` navy ring), "Scene N of 7" meter, "Skip to the end" → `#close`, "Jump: book a talk" → `/speaking`. Current scene = `aria-current="true"` + weight + navy edge-bar (never color alone). Mobile: sticky top progress bar + native `<details>` "Jump to section" menu (same 7 anchors + skip + jump); presentation-only reflow, reading order preserved.
- **Two-layer reduced-motion gate** (Task 3): (1) CSS — the scroll-driven meter fill (`animation-timeline: scroll(root block)`) lives inside `@media (prefers-reduced-motion: no-preference)`, so it auto-degrades to the static filled bar under `reduce`/unsupported browsers; (2) JS — the single inlined enhancement script bails immediately if `matchMedia('(prefers-reduced-motion: reduce)').matches`. The script does ONLY what CSS cannot: move the semantic `aria-current` + the "Scene N of 7" number via a minimal `IntersectionObserver`. No scroll-jacking (native scroll only). `// TODO(Story 1.9): consolidate into motion.ts` markers left in both the CSS block and the script; `motion.ts` NOT pre-built.
- **JS-off baseline complete** (AC4/IAC-2): scenes are plain sequential sections; the static markup ships `aria-current` on `#hero` + a static 14.3% meter bar; every rail anchor/skip/jump is a real fragment `<a>` (followable JS-off). The reduced-motion runtime check is the JS-off-equivalent for the rail (observer never runs) and confirmed the baseline holds.
- **0-JS-by-default holds** (NFR-1): the page/scaffold ship no JS; the rail adds exactly ONE tiny inlined script (no external `.js` bundle, no modulepreload, no React island). Build-output test updated from "0 scripts" → "exactly ONE gated enhancement", asserting it carries the `prefers-reduced-motion` guard + `IntersectionObserver` (meaningful, not a regression).
- **Decision — current-tick "soft halo" rendered with `outline`, not `box-shadow`.** DESIGN §Elevation: the flat system reserves the sole site-wide shadow for the Guide ("if any other element grows a shadow, the system is broken"); scene-rail is `elevation.flat`. The mockup's `box-shadow` halo conflicts with the spine (spine wins), so the halo is a flat `outline` ring — keeping the existing "no box-shadow on any surface" invariant/test intact.
- **Two existing 1.3 tests amended for the new DOM ordering (not regressions):** the rail now introduces the first `#thesis` anchor, so the "Explore primary action" test was scoped to the anchor whose text is exactly "Explore"; the "no exclamation marks in copy" test now strips `<script>` bodies before asserting (the gated script legitimately uses `!`/`!==` operators — the voice rule governs copy, not code).
- **Forward-reference (not a defect):** teaser/jump hrefs (`/timeline`, `/speaking`, `/work/loandemo`, `/glass-box`, `/invite`) 404 until Story 1.5 creates the Mirror route stubs. Explore→`#thesis` from 1.3 now resolves (this story creates `#thesis`).
- **Rule 5 (NFR tripwire):** none triggered — all NFRs implementable as worded. **Rule 6 (ADR):** `docs/adr/` absent → no-op.

### File List

- `web/src/components/scene/SceneRail.astro` (new) — the persistent scene-rail (desktop rail + mobile reflow + the single gated enhancement script).
- `web/src/pages/index.astro` (modified) — the locked 7-scene scaffold; renders `SceneRail`; authored Thesis + 4 teasers + Close shell.
- `web/test/build-output.test.ts` (modified) — added Story 1.4 IAC-1/IAC-2 assertions (7 sections/ids in order, rail anchors + skip/jump, "Scene N of 7", single aria-current on `#hero`, thesis line, teaser Mirror links, mobile `<details>` menu, CSS two-layer gate); updated the script-count + exclamation-mark + Explore-button assertions for the new reality.
- `_bmad-output/implementation-artifacts/1-4-home-scene-scaffold-scene-rail-skip-progress.md` (modified) — story tracking (frontmatter `baseline_commit`, status, tasks, this Dev Agent Record).
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — story status `ready-for-dev` → `in-progress` → `review`.
- `_bmad-output/implementation-artifacts/smoke-evidence/1-4-desktop-hero-rail.png`, `…/1-4-mobile-rail-menu-open.png` (new) — browser smoke screenshots.

### Change Log

- 2026-06-06 — Implemented Story 1.4 (home 7-scene scaffold + scene-rail). Added `SceneRail.astro`, the locked scene scaffold in `index.astro`, and Story 1.4 build-output assertions. All DoD gates green (typecheck/lint/format/test/build exit 0; web 48/48). Real-runtime browser smoke passed (desktop + mobile + reduced-motion + JS-off-equivalent + fragment nav). Status → review.
- 2026-06-06 — Code review (`/epic-cycle`): effectively clean. All 5 gates re-run green (typecheck 16 files/0 errors, lint 0, format 0, test api 2/2 + **web 54/54** [+6 from `SceneRail.component.test.ts`], build 0). All 4 ACs + IAC-1/IAC-2 re-verified against the REAL built `web/dist/index.html`. 0 HIGH, 0 MED, 0 patch, 0 decision-needed; 2 LOW deferred, 3 edge-cases dismissed. The one inlined rail script was assessed against the architecture's islands invariant and ACCEPTED (see Review Findings). Status → done.

### Review Findings

**Code review (`/epic-cycle`, 2026-06-06) — adversarial, 3 layers (Blind Hunter / Edge Case Hunter / Acceptance Auditor). Verdict: effectively clean (0 HIGH / 0 MED / 0 patch / 0 decision-needed; 2 LOW deferred, 3 dismissed).**

Gates (re-run by reviewer): `pnpm -r typecheck` 0 (16 Astro files, 0 errors) · `pnpm lint` 0 · `pnpm format:check` 0 · `pnpm -r --if-present test` 0 (api 2/2, **web 54/54** — the +6 are QA's `SceneRail.component.test.ts`; the Dev Record's "48/48" predates that addition) · `pnpm build` 0.

AC / invariant verification against the REAL built `web/dist/index.html` + emitted CSS (Rule 3 real-runtime evidence):
- **AC1 / IAC-1** ✓ — 7 `<section>`s with ids `hero,thesis,timeline,speaker,flagship,glass-box,close` in exact locked DOM order; rail exposes 7 real `<a href="#hero…#close">` matching the ids; skip → `#close`; jump → `/speaking`; Thesis "The medium is the message." authored; exactly one `<h1>`; six `<h2>`; **zero `!` in copy** (script `!`/`!==` correctly excluded from the copy assertion).
- **AC2** ✓ — current scene via `aria-current="true"` + `font-weight: bold` (CSS keyed on `[aria-current]`) + navy edge-bar + lit tick — never color alone; every rail row `min-height:44px` (3 occurrences: desktop row, mobile summary, mobile link); `:focus-visible` 2px navy ring on every interactive element (`.rail-d__link`, `.rail-d__skip`/`__jump`, `.rail-m__summary`, `.rail-m__link`, `.scene__link`); decorative tick `aria-hidden` (component test asserts EVERY tick is hidden).
- **AC3** ✓ — mobile reflow = sticky top bar + native `<details>` "Jump to section" menu carrying all 7 anchors + skip + jump; `display:none` correctly swaps the desktop rail / mobile bar per breakpoint, so only ONE variant is ever in the tab order (no double-focus pollution).
- **AC4 / IAC-2** ✓ (critical) — static baseline complete: `aria-current` on `#hero`, meter is a STATIC filled bar (`width:14.3%` ≈ 1/7), all anchors/skip/jump are real fragment `<a>` (followable JS-off). Two-layer gate genuinely present in the built artifact: CSS `@media (prefers-reduced-motion: no-preference)` wraps the `animation-timeline: scroll(root block)` fill (auto-degrades under reduce/unsupported); JS bails on `matchMedia('(prefers-reduced-motion: reduce)').matches`. No scroll-jacking (native scroll; the script never touches scroll). The minified enhancement is 721 bytes.
- **UX-DR10** ✓ — teasers are summarize-and-link (Kicker + 1–2 sentences + Mirror-route link); no Mirror body text duplicated.
- **One-shadow invariant** ✓ — **NO `box-shadow` anywhere** in the built CSS. The DESIGN `tick-current` "soft halo" is rendered as `outline:3px solid rgba(30,58,95,.2)` — matches the spec's halo color/width verbatim while keeping shadow reserved for the Guide (DESIGN §Elevation). Correct spine-faithful call.
- **Forward-reference (not a defect)** — `/timeline`,`/speaking`,`/work/loandemo`,`/glass-box`,`/invite` 404 until Story 1.5; the 1.4 requirement is correct hrefs, which are present.
- **Rule 5 (NFR tripwire)** — none. **Rule 6 (ADR)** — `docs/adr/` absent → no-op. **Rule 8** — both test files are `*.test.ts`, discovered by the default vitest run (proven by the 54/54).

**NOTE — JUDGMENT CALL on the one inlined vanilla script (ACCEPTED, not a finding).** The home now ships ONE tiny inlined vanilla `<script>` where prior stories shipped 0. Assessed against architecture's "0 JS by default; the three React islands are the ONLY shipped JS" invariant (architecture.md §Component-boundaries, lines 469/535/595):
- The invariant's load-bearing concern is **React hydration runtime + bundle weight** (the NFR-1 ~200–250KB budget). This script is **vanilla, not a React island**, **inlined** (no external `.js`, no `modulepreload`, no hydration bundle — the build-output test asserts all three negatives), and **721 bytes** — NFR-1 holds with enormous margin.
- The dynamic behavior it provides — moving the **semantic `aria-current`** to the in-view scene as the visitor scrolls (AC2) — **genuinely cannot be done in CSS**: CSS scroll-driven animation can fill the visual meter (and does), but cannot relocate an ARIA DOM attribute by scroll position. So the JS is *necessary* for the AC, *minimal*, *gated* (two-layer), and *fully degrading* (a complete static baseline stands when it's absent/reduced).
- The story spec itself explicitly authorized exactly this (Task 3 + Gotchas: "if JS is needed for the semantic `aria-current`, use a minimal vanilla `IntersectionObserver` behind a two-layer gate … UPDATE the build-output test's script-count assertion").
- **Conclusion:** sanctioned progressive enhancement, not a violation of the islands principle. Documented here for the Story 1.9 consolidation (the `// TODO(Story 1.9): consolidate into motion.ts` markers are present in both the CSS block and the script).

Deferred (LOW — see `deferred-work.md`):
- [x] [Review][Defer] **Last scene (`#close`) may not receive `aria-current` via scroll at the page bottom.** [web/src/components/scene/SceneRail.astro:531-540] — deferred, enhancement-quality nuance. The `IntersectionObserver` active band is the 30–40% viewport slice (`rootMargin: -30% 0px -60% 0px`); a short final section at the document bottom can fail to cross the 40% line before scroll bottoms out, so `aria-current` can stick on the second-to-last scene. The AC4 static baseline, the "Skip to the end" control, and the Close rail anchor all reach `#close` regardless; AC2's "indicated … as the visitor scrolls" holds for the interior scenes. Suggested resolution: Story 1.9 (motion.ts consolidation) — add a bottom-of-page fallback (e.g. activate the last scene when `scrollY + innerHeight ≈ scrollHeight`) when the observer logic is centralized.
- [x] [Review][Defer] **Current-tick halo color is a literal `rgba(30,58,95,0.2)` rather than token-derived.** [web/src/components/scene/SceneRail.astro:266] — deferred, intentional + spec-faithful. The literal equals `--color-accent` (`#1E3A5F`) at 20% and matches the DESIGN `tick-current` spec verbatim; deriving alpha from the hex token would need `color-mix()` or rgb-channel tokens (a tokens-system change out of scope here). Suggested resolution: when the tokens layer gains channel/alpha tokens (or a `color-mix()` convention), replace the literal — track with the design-tokens owner.

Dismissed (noise / false-positive / handled):
- IntersectionObserver multi-intersect ordering — when two sections briefly co-occupy the 10%-tall band on a fast scroll, the loop's last-intersecting entry (the lower/further-along scene) wins; reads correctly as "further along." Not a defect.
- Initial-load `aria-current` flash — none: `#hero` is tall and intersects the band at scroll-top, matching the static baseline; no flicker.
- "Two `<nav>` landmarks / duplicate anchors" — single `<nav aria-label="Scene navigation: progress, jump, and skip">` wraps both variants; duplicate `#hero`/`#close` hrefs are the desktop+mobile presentation variants of the SAME DOM (Responsive: "presentation only — same DOM"), only one focusable per breakpoint via `display:none`. Correct.
