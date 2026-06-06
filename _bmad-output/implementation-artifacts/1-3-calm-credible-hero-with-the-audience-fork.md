---
baseline_commit: a0dca83741ea8136c38c61525623a4c161180403
---

# Story 1.3: Calm, credible hero with the audience fork

Status: done

<!-- Epic 1, Story 1.3. Builds on 1.1 (scaffold) + 1.2 (tokens, BaseLayout, Wordmark/Kicker/Button). Replaces the 1.2 placeholder home content with the real hero + audience fork. The hero is the cold-landing first impression (FR-1). -->

## Story

As a visitor landing cold,
I want a calm hero that tells me who Josh is in seconds and offers clear ways in,
so that I'm oriented and can choose my path without being hit with spectacle.

## Acceptance Criteria

1. **Given** a cold visit on mobile or desktop **When** the hero renders **Then** it shows the wordmark, a headshot/portrait (styled placeholder until the real asset, flagged `[OPEN]`), and the `<h1>` positioning line "Seasoned, building at the frontier", all above the fold **And** the "built in the open · a BMAD Method project" framing is present with no hype and no exclamation marks.

2. **Given** the hero **When** the visitor chooses a path **Then** "Explore" enters the home Scene Arc, "I'm here to book a talk" is a real `<a>` to `/speaking` that bypasses any agent/cinematic layer (SM-C1), and a quiet "Or ask my Guide about the work" entry is present (wired to open the Guide in Epic 4; until then it gracefully links to `/faq`) **And** all fork controls are real links/buttons, keyboard-operable, and followable with JS off.

3. **Given** a mid-range mobile device **When** the hero loads **Then** FCP is < ~2s with no blocking WebGL and main-page JS within the ~200–250KB gz budget (NFR-1) **And** under `prefers-reduced-motion` or JS-off the visitor still gets a complete, styled static hero (NFR-2).

## Integration ACs

*(Rule 1 — introduces `HeroStatic.astro`, consumed by the home page.)*

- **IAC-1 (home renders the hero + working fork):** The home `/` (built) renders `HeroStatic` with: exactly one `<h1>` reading `Seasoned, building at the frontier`; the Wordmark `Joshua R. Brandt, MSE`; a flagged `[OPEN]` headshot placeholder; the "built in the open · a BMAD Method project" framing; and three real fork controls whose `href`s are exactly `#thesis` (Explore → Scene-Arc anchor), `/speaking` ("I'm here to book a talk"), and `/faq` ("Or ask my Guide about the work"). Verifiable in `web/dist/index.html` with JS off. The page ships **0 `<script>` tags**.
- **IAC-2 (JS-off completeness, NFR-2):** With JS disabled the hero is complete and styled, and all three fork controls are present and followable (real `<a>`/`<button>`). No content depends on JS.
- **Forward-reference note (not a defect):** `/speaking` and `/faq` are route stubs created in **Story 1.5**; until then those hrefs 404. The hero's job here is the correct hrefs + JS-off followability — target resolution is verified once 1.5 lands. The code-review/smoke must NOT treat the pre-1.5 404 as a 1.3 defect.

## Consumed-by

- **`HeroStatic.astro`:** the home `index.astro` (this story); revisited by Story 1.4 (scene arc wires the `#thesis` Explore target) and Epic 4 (the quiet Guide entry switches from `/faq` link → opens the Guide island) and Epic 5 (cinematic layer wraps it, behind the reduced-motion gate).

## Tasks / Subtasks

- [x] **Task 1 — `web/src/components/hero/HeroStatic.astro` (AC: 1, 2)**
  - [x] Compose the hero: `Wordmark` (`Joshua R. Brandt, MSE`), a `Kicker` eyebrow, the `<h1>` display-type positioning line **`Seasoned, building at the frontier`** (Title-case, NO trailing period, NO exclamation), a short lede with the **"built in the open · a BMAD Method project"** framing (calm, no hype), and the headshot placeholder.
  - [x] Headshot placeholder: a styled `[OPEN: headshot asset]` element — a "JRB" monogram on a `surface-raised` mat with a small museum-style label (per DESIGN [OPEN: headshot asset]); NOT stock/AI imagery. Give it a meaningful `alt`/`aria-label` placeholder. Mark `[OPEN]` in a comment.
  - [x] Layout: two-column (copy + portrait) on desktop; compact stacked name+headshot lockup on mobile; the wordmark, h1, framing, and fork all **above the fold** on both (display type compresses to ~33px mobile per DESIGN).
- [x] **Task 2 — The audience fork (AC: 2)**
  - [x] Three real, keyboard-operable, JS-off-followable controls using the `Button` component (or real `<a>`):
    - **Primary** `Button` "Explore" → `href="#thesis"` (in-page anchor to the Scene Arc; the `#thesis` scene is built in Story 1.4 — a same-page anchor, harmless if not yet present).
    - **Secondary** `Button` "I'm here to book a talk" → `href="/speaking"` (real `<a>`; bypasses Guide/cinematic — in Stage 1 that simply means a plain navigation).
    - **Quiet/tertiary** entry "Or ask my Guide about the work" → `href="/faq"` (a quiet inline link, visually distinct from the two fork buttons; Epic 4 will switch it to open the Guide). Use the canonical strings EXACTLY.
  - [x] All three: real `<a>`/`<button>`, visible `:focus-visible` ring, keyboard-operable, work with JS off.
- [x] **Task 3 — Wire into the home + NFR floor (AC: 1, 3)**
  - [x] Replace the 1.2 placeholder hero content in `web/src/pages/index.astro` with `HeroStatic` (still via `BaseLayout`). Wrap the hero in a `<section id="hero">` (the locked scene order starts at Hero; the scene-rail/anchors are Story 1.4).
  - [x] **0 JS** — no islands, no WebGL (NFR-1). The static hero IS the reduced-motion/JS-off experience (NFR-2) — nothing to gate yet, but do not introduce motion that lacks a static fallback.
  - [x] Keep within the NFR-1 budget (no heavy assets; the placeholder headshot is CSS/SVG, not a large image).
- [x] **Task 4 — Verify (AC: all, IAC-1/2)**
  - [x] `pnpm -r typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test`, `pnpm build` exit 0.
  - [x] Built `web/dist/index.html`: one `<h1>` = `Seasoned, building at the frontier`; Wordmark present; framing present; fork hrefs exactly `#thesis`, `/speaking`, `/faq`; **0 `<script>`**; no exclamation marks.
- [x] **Task 5 — Self-check vs ACs + DESIGN/EXPERIENCE.**

### Review Findings

Code-review stage of `/epic-cycle` (adversarial, three layers — Blind Hunter / Edge Case Hunter / Acceptance Auditor — run in-session; sub-agent dispatch unavailable, so the roles were executed as distinct analytical passes per skill-rules Rule 7, with all gates and the built artifact verified by the reviewer directly). Reviewer: Claude Opus 4.8 (1M) · 2026-06-06.

**Gates (re-run by review, all exit 0):** `pnpm -r typecheck` (web `astro check` 0/0/0), `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test` (api 2/2, web 36/36 across build-output + Button + HeroStatic), `pnpm build` (1 static page). No failing gate.

**Built-artifact verification (`web/dist/index.html`, by the reviewer):** exactly one `<h1>` = `Seasoned, building at the frontier` (Title-case, no period); `Joshua R. Brandt, MSE` wordmark; `built in the open · a BMAD Method project` framing (lowercase, spine form); `<section id="hero">`; the three fork `<a>` hrefs in DOM order `['#thesis', '/speaking', '/faq']` (Explore = `.btn--primary`, book-a-talk = `.btn--secondary`, quiet Guide = inline link, NOT a `.btn`); **0 `<script>`**, 0 `.js` asset references, **0 `<img>`**, **0 exclamation marks** (post-doctype). Built CSS ships `:focus-visible` (incl. the quiet guide-link ring), `prefers-reduced-motion`, and the `max-width:760px` compact-lockup query. All 40 CSS custom properties referenced by `HeroStatic.astro` are defined in `tokens.css`. AC1/AC2/AC3 + IAC-1/IAC-2 satisfied.

**Rules:** Rule 1 (Integration ACs) — IAC-1/IAC-2 real, exercised by the consumer's automation tier (real `astro build` page + Container-API component render), satisfied. Rule 3 (real-runtime evidence) — satisfied: `build-output.test.ts` runs a real `astro build` via `execFileSync` and asserts on produced HTML/CSS; `HeroStatic.component.test.ts` renders via the real Astro Container API; both discoverable (Rule 8). Rule 5 (NFR tripwire) — none; no NFR unmeasurable/contradictory (formal FCP/Lighthouse is Story 1.9, correctly deferred, not worked-around). Rule 6 (ADR) — `docs/adr/` absent → no-op (confirmed).

**Findings:** 0 HIGH, 0 MED, 1 LOW (deferred). No `decision-needed`, no `patch`.

- [x] [Review][Defer] Fork CTA renders the curly apostrophe (`I&rsquo;m` → U+2019) where the spine's canonical string uses a straight ASCII apostrophe (`I'm`) [web/src/components/hero/HeroStatic.astro:85] — LOW, deferred. The rendered glyph is the typographically correct apostrophe and matches the visual mockup (`mockups/hero.html:672` also uses `&rsquo;`); neither EXPERIENCE.md nor DESIGN.md gives any smart-quote directive, and the substring tests (match on `book a talk`) are unaffected. Not a meaning/word change; the spine's "use canonical strings EXACTLY / do not normalize" guidance targets the enumerated casing/period hazards (Title-case vs lowercase, no-period vs period), not ASCII-vs-Unicode apostrophe glyphs. Recorded in `deferred-work.md`; see suggested resolution there.

## Dev Notes

### Authoritative sources (spines win on conflict)

- **EXPERIENCE.md** (behavior/IA): `_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/EXPERIENCE.md` §"The hero fork" (the two ways in + quiet third), §"Named strings (canonical)", §"Microcopy rules", §Responsive (hero two-column ↔ compact lockup).
- **DESIGN.md**: hero visual in `mockups/hero.html` (composition reference — spine wins; the mock may carry stale strings). Use the locked tokens/type ramp from Story 1.2's `tokens.css`.
- architecture.md §Frontend-Architecture (0-JS default), §Requirements-to-Structure (FR-1,2 → `pages/index.astro` + `components/hero,scene`).

### Canonical strings (use EXACTLY — do not normalize)

- Wordmark: `Joshua R. Brandt, MSE`
- Hero `<h1>` (Title-case, no period): `Seasoned, building at the frontier`
- Fork CTAs: `Explore` · `I'm here to book a talk` · `Or ask my Guide about the work`
- Framing: `built in the open · a BMAD Method project` (calm, positive-assertion; NO hype, NO exclamation marks anywhere — DESIGN Do's/Don'ts + user copy preference).
- (The lowercase "seasoned, building at the frontier." with trailing period is the BIO tail form — NOT used here; the hero h1 is the Title-case no-period form.)

### Behavior

- **"Explore"** → enters the Scene Arc (in-page). The arc + scene anchors are Story 1.4; for now `href="#thesis"` (the first scene after Hero in the locked order Hero→Thesis→…). A same-page anchor that doesn't yet resolve is harmless; 1.4 finalizes it.
- **"I'm here to book a talk"** → `/speaking`, **bypassing the Guide + cinematic layer** (protects SM-C1 — never bury the organizer). In Stage 1 this is just a plain `<a>` navigation.
- **"Or ask my Guide about the work"** → a quiet inline entry, distinct from the two fork buttons; links to `/faq` now, becomes the Guide-opener in Epic 4.
- `/speaking` and `/faq` are created in **Story 1.5** — correct hrefs now, targets resolve after 1.5 (sequencing; not a defect).

### NFR floor

- NFR-1: 0 JS on the hero, no blocking WebGL, stay within ~200–250KB gz (trivial — static hero, CSS/SVG placeholder). Formal FCP/Lighthouse budget enforcement is Story 1.9/1.10; here just don't violate it (no heavy image/script).
- NFR-2: the static hero IS the reduced-motion/JS-off experience. Real `<a>`/`<button>`, visible focus, color never the sole signal, one `<h1>`.

### Project Structure Notes

- New: `web/src/components/hero/HeroStatic.astro`. Modify: `web/src/pages/index.astro` (swap placeholder → HeroStatic, wrap in `<section id="hero">`).
- Reuse 1.2's `Wordmark`, `Kicker`, `Button`, tokens, BaseLayout. Do NOT re-author tokens or chrome. Do NOT build the scene-rail/scenes (1.4), Mirror routes (1.5), or the Guide (Epic 4).
- 0-JS: no React islands here (the hero is static in Stage 1; the Guide entry is a link, not the island, until Epic 4).
- No ADR registry (`docs/adr/` absent) → Rule 6 no-op.

### Gotchas

- **Leave the working tree UNCOMMITTED** (lead commits after smoke). Suppress dev-story auto-commit.
- Keep exactly ONE `<h1>` on the page (the positioning line) — clean heading hierarchy (NFR-2/SEO).
- Do not add a period or exclamation to the h1; do not normalize the canonical casing.
- The 1.2 build-output test asserts the home page; if you change home copy/structure, UPDATE that test's expectations so it stays green (the headline text/CTA strings changed from the 1.2 placeholder). Keep tests discoverable + green.

### References

- [Source: epics.md#Story-1.3 — ACs verbatim]
- [Source: EXPERIENCE.md#The-hero-fork + #Named-strings-canonical + #Microcopy-rules + #Responsive (hero)]
- [Source: DESIGN.md#Components (Wordmark/Kicker/Button), mockups/hero.html, [OPEN: headshot asset]]
- [Source: architecture.md#Frontend-Architecture + #Requirements-to-Structure-Mapping (FR-1)]
- [Source: skill-rules.md#Rule-1, #Rule-2]
- [Previous stories: 1.1 scaffold; 1.2 tokens/BaseLayout/Wordmark/Kicker/Button + build-output test.]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (1M context) — `claude-opus-4-8[1m]` — via the `/epic-cycle` dev-story stage (`bmad-dev-story`).

### Debug Log References

- RED → GREEN: updated `web/test/build-output.test.ts` first with the Story 1.3 IAC-1/IAC-2 assertions (one `<h1>` = exact positioning line, framing string, `<section id="hero">`, the three fork hrefs `#thesis` / `/speaking` / `/faq`, the quiet Guide link distinct from the `.btn` fork). Confirmed 6 failures against the 1.2 placeholder, then implemented `HeroStatic.astro` to green.
- One self-inflicted test miss: the initial "Explore primary action" regex assumed `class` preceded `href`, but Astro's `Button` emits `<a href=… class:list=…>` (href first). Fixed the assertion to be attribute-order-agnostic (match the opening `<a href="#thesis">` tag, then assert it carries `btn--primary`).
- `astro check` (TS strict) flagged `h1s[0]` as possibly undefined after `.match()`; resolved with the same `!` non-null pattern already used elsewhere in the suite (guarded by the preceding `toHaveLength(1)`).
- DoD command set (repo root) all exit 0: `pnpm -r typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test` (api 2/2, web 29/29), `pnpm build`.

### Completion Notes List

- **AC1 (calm credible hero, above the fold):** `HeroStatic.astro` renders the `Wordmark` (`Joshua R. Brandt, MSE`), the `Kicker` eyebrow, the single display-type `<h1>` `Seasoned, building at the frontier` (Title-case, no period, no exclamation), a calm positive-assertion lede, the `built in the open · a BMAD Method project` framing (in the hero-top marker, the mock's canonical placement), and the styled headshot placeholder — two-column on desktop, a compact horizontal name+headshot lockup on mobile (display tightens to ~33px to hold the fold).
- **AC2 (the fork):** three real controls — primary `Button` "Explore" → `#thesis`; secondary `Button` "I'm here to book a talk" → `/speaking` (bypasses Guide/cinematic, protects SM-C1); a quiet inline `<a>` "Or ask my Guide about the work" → `/faq`, visually distinct from the two buttons (not a `.btn`). All keyboard-operable with visible `:focus-visible` rings and followable JS-off.
- **AC3 / NFR-1 / NFR-2:** 0 `<script>` tags in `dist/index.html`; 0 `<img>` (the headshot is a CSS mat + monogram, no heavy/stock/AI image); fonts stay self-hosted (no Google Fonts request); the static hero IS the reduced-motion/JS-off experience (`:focus-visible` + `prefers-reduced-motion` present in built CSS; color never the sole signal; exactly one `<h1>`). Formal FCP/Lighthouse budget enforcement remains Story 1.9/1.10 per the story; no NFR was violated here.
- **IAC-1 / IAC-2 (verified against built `web/dist/index.html`):** exactly one `<h1>` with the exact string; Wordmark present; framing present; `<section id="hero">`; the three fork hrefs exactly `#thesis`, `/speaking`, `/faq`; 0 `<script>`; 0 exclamation marks (after the `<!doctype>` strip).
- **Spine-over-mock resolutions:** used the story/spine fork hrefs (the mock's `#speaking`/`#guide` are stale); kept the framing string in the story's exact lowercase form `built in the open · a BMAD Method project` (the mock capitalizes "Built"); rendered the `<h1>` as one contiguous canonical string rather than the mock's two-`<span>` split (the split would drop the space after the comma in the DOM text and break the canonical string). Did NOT build the scene-rail (Story 1.4) or the Guide pill/island (Epic 4) — out of scope.
- **Rule 5 (NFR tripwire):** no NFR was found unmeasurable/impossible/contradictory — no planning-artifact amendment was needed.
- **Rule 6 (ADR):** `docs/adr/` does not exist — no-op.
- **Working tree left UNCOMMITTED** for the lead to commit after the smoke gate (dev-story auto-commit suppressed); stayed on branch `PORT-1-epic1`.

### File List

- `web/src/components/hero/HeroStatic.astro` (new) — the calm hero + audience fork component.
- `web/src/pages/index.astro` (modified) — swapped the 1.2 placeholder hero for `HeroStatic`, wrapped in `<section id="hero">` via `BaseLayout`.
- `web/test/build-output.test.ts` (modified) — updated home-page expectations to the new hero (one `<h1>` exact string, framing, `section#hero`, the three fork hrefs, the quiet Guide link distinct from the fork buttons).
- `_bmad-output/implementation-artifacts/1-3-calm-credible-hero-with-the-audience-fork.md` (modified) — frontmatter `baseline_commit`, task checkboxes, Dev Agent Record, File List, Change Log, Status.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — story status `ready-for-dev` → `in-progress` → `review`.

## Change Log

| Date | Change |
|---|---|
| 2026-06-06 | Story 1.3 implemented: new `HeroStatic.astro` (calm hero + audience fork), rewired `index.astro`, updated `build-output.test.ts` to the new hero. All DoD checks (typecheck, lint, format:check, test, build) exit 0; IAC-1/IAC-2 verified against built `dist/index.html`. Status → review. |
| 2026-06-06 | Code review (adversarial, 3-layer): all 5 gates re-run exit 0; built `dist/index.html` independently verified (one exact `<h1>`, 0 `<script>`/`<img>`/`!`, three fork hrefs `#thesis`/`/speaking`/`/faq`, quiet Guide link distinct; focus-visible + reduced-motion in built CSS; all referenced tokens defined). 0 HIGH, 0 MED, 1 LOW (apostrophe glyph) deferred to `deferred-work.md`. Rules 1/3/5/6/8 satisfied. Status → done. |
