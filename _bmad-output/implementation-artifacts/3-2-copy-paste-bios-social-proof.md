# Story 3.2: Copy-paste bios & social proof (`/speaking`)

---
baseline_commit: 6c19dc4d6786bbd3241b9271c82674c11b48389e
---

Status: done

<!-- Created by the /epic-cycle lead create-story gate (Epic 3), 2026-06-06. Source: epics.md Epic 3 Story 3.2.
     ADDS to the /speaking page Story 3.1 built (at the marked forward-ref slot). Introduces the FIRST sanctioned
     progressive-enhancement script on a Mirror route (the Copy button) — see Decision 2 / AC3 (a deliberate,
     measurable NFR-1 policy change, NOT a workaround). -->

## Story

As a conference organizer (Mara, UJ-2),
I want copy-paste-ready bios and credible social proof on `/speaking`,
so that I can drop Joshua R. Brandt, MSE straight into my program and trust the audience draw — without retyping anything or chasing references (FR-20, UX-DR9).

## Context & decisions (read first)

This story APPENDS two sections to the existing `/speaking` page (built in Story 3.1) at its marked forward-ref slot (`web/src/pages/speaking.astro` lines ~12 and ~74: "[FORWARD-REF: Story 3.2] bios + credibility strip"): a **copy-paste bios** block and a **credibility strip** (metrics + testimonials + logos). It reuses the Story-3.1 `web/src/data/speaking.ts` module (extend it) and matches the DESIGN component tokens. The static-build invariants hold (NFR-6 deterministic, AA), with ONE deliberate NFR-1 evolution (Decision 2).

### Decision 1 — bios are sourced verbatim, flagged `[ASSUMPTION]`, and consistent with the Person JSON-LD

Two bios: a **50-word short bio** and a **100–150-word long bio** (≈126w as drafted), both ending the running sentence **"seasoned, building at the frontier."** — **lowercase + trailing period by design** (it is the tail of a prose sentence, NOT the Title-case hero `<h1>` "Seasoned, building at the frontier"; do NOT normalize one to the other). Source the verbatim strings from `mockups/speaker-surface.html` (the promoted mock), flagged `[ASSUMPTION]` until Josh confirms. **The 50-word short bio MUST mirror `PERSON.description` in `web/src/lib/person.ts`** (the canonical short-bio source already emitted in the Person/ProfilePage JSON-LD on `/` and `/about`) so the page text and the structured data agree (AC5 consistency; the no-fabrication floor). The long bio extends it (same facts, no new claims). No exclamation marks; positive-assertion voice (Josh's preference, [[copy-positive-assertion-no-hype]]).

### Decision 2 — the Copy button is the FIRST sanctioned progressive-enhancement script on a Mirror route (explicit NFR-1 evolution, NOT a workaround)

Today's NFR-1 invariant (verified): **Mirror routes ship 0 executable JS**; the home `/` is the SINGLE exception — exactly one gated sub-1KB scene-rail enhancement `<script type="module">` (asserted by `web/test/build-output.test.ts:262`). `/speaking` is currently 0-executable-JS.

FR-20 + EXPERIENCE require a **real Copy `<button>` → "Copied ✓"** on each bio-block (so an organizer copies the bio in one click). A functional Copy button needs JS. Therefore this story **deliberately makes `/speaking` the SECOND route with a single sanctioned, minimal, gated progressive-enhancement script** (the copy enhancement) — and the **0-JS baseline still holds**: the bio text is fully selectable plain text present in the DOM, copyable manually with JS off, with a stated note that manual selection works if the copy JS fails. The copy enhancement is **vanilla** (the scene-rail `<script>` pattern), sub-1KB, NOT a React island (the first React island stays Story 3.4 / the Invite form, per retro A4). This is a measurable, intended change: **the dev MUST UPDATE the build-output NFR-1 test** to assert `/speaking` ships exactly ONE minimal executable script (the copy enhancement) — mirroring the home's scene-rail assertion — AND that the bios are selectable/present JS-off. This is sanctioned by AC3; it is NOT a Rule-5 "work around an NFR with a comment" — the planning artifact (this story) authorizes it, and code-review MUST NOT flag `/speaking`'s one copy script as an NFR-1 violation.

### Decision 3 — three new presentational components, matching the DESIGN tokens

- **`web/src/components/speaker/BioBlock.astro`** (DESIGN `bio-block`, lines 276–285): surface-raised, 1px hairline, radius 9px, padding 22px 24px; head = word-count label (`{typography.meta}`) + a real Copy `<button>` (outline 1px `--color-accent`, radius md; hover fills accent/#FFF), divided by a hairline; copied-state = filled accent + #FFF check "Copied ✓"; body = the bio in `{typography.body}` `--color-ink-primary`, **always selectable text**. The Copy button is keyboard-operable with a visible `:focus-visible` ring; success is announced via an `aria-live="polite"`/`role="status"` region ("Copied ✓"). A small note states selection works if copy JS fails.
- **`web/src/components/speaker/Metric.astro`** (DESIGN `metric`, lines 287–293): navy figure (Source Serif 700, `clamp(26px,3vw,34px)`, `--color-accent`) + uppercase `{typography.meta}` label in ink-secondary + an italic 11.5px source line (AA-safe). Rendered in a hairline-gridded grid (4-up desktop / 2-up mobile). Real figures `[OPEN]`/`[ph]` labeled in visible text.
- **`web/src/components/speaker/Testimonial.astro`** (DESIGN `testimonial`, lines 295–302): surface-raised, 2px `--color-accent` left rule, radius `0 8px 8px 0`, italic quote + attribution (name in ink-primary, role/event in ink-secondary). Real ones `[OPEN]` labeled in visible text.
- Conference/company **logos**: a logo wall of `[OPEN]`-labeled placeholders (text labels, not tint/box alone) until real assets land.

### Decision 4 — social-proof facts stay consistent with the JSON-LD (credibility floor)

Metrics/testimonials are **displayed** (not new JSON-LD types this story). Any audience-draw figure (subscribers/views/talks/years) is `[OPEN]`/`[ph]` until Josh confirms — zero invented numbers. Keep displayed `Person`/`Event` facts consistent with the existing Person JSON-LD (`/about`, `/`) and the Story-3.1 Event JSON-LD (e.g. don't display a talk count that contradicts the 3 Event nodes). No new fabricated claims.

## Acceptance Criteria

1. **Copy-paste bios with a real Copy button + a selectable-text fallback.**
   **Given** the Speaker Surface
   **When** the bios render
   **Then** a 50-word bio and a 100–150-word bio each appear in a `BioBlock` with a real Copy `<button>` that, when activated, copies that bio's text and confirms "Copied ✓" (announced via `aria-live`/`role="status"`), and the bio is **always plain selectable text** present in the DOM so it can be copied manually if the copy JS fails (a stated note says so)
   **And** the bios are set verbatim from the approved copy (sourced from the mock, flagged `[ASSUMPTION]` until Josh confirms): no exclamation marks; the lowercase running-sentence tail "seasoned, building at the frontier." (distinct from the Title-case hero `<h1>` form — not normalized); and the **50-word short bio mirrors `PERSON.description`** so the page text agrees with the Person JSON-LD.

2. **Social proof — metrics, testimonials, logos (credibility floor honored).**
   **Given** social proof
   **When** it renders
   **Then** audience-draw metrics (subscribers / views / talks / years) appear in `Metric` components (navy figure + label + source line), testimonials appear in `Testimonial` components (italic quote + attribution + navy left rule), and conference/company logos are present
   **And** all real figures/testimonials/logos that Josh has not confirmed are flagged `[OPEN]`/`[ph]` with the placeholder labeled in **visible text** (not tint/box/style alone), and every displayed `Person`/`Event` fact stays consistent with the existing Person + Story-3.1 Event JSON-LD (no contradictions, no invented numbers).

3. **NFR-1 — `/speaking` ships exactly ONE sanctioned minimal copy-enhancement script; the 0-JS baseline holds (Decision 2).**
   **Given** the built `/speaking/` page
   **When** the build-output NFR-1 assertions run
   **Then** `/speaking` ships **at most one** executable `<script>` — a minimal, gated, sub-1KB **vanilla** copy-button enhancement (NOT a React island; no `client.*.js` React chunk referenced) — plus the JSON-LD data block; the bios are **fully selectable and present in the DOM with JS off** (the baseline copy path works without the script); and the build-output test is **updated** to assert this `/speaking` carve-out explicitly (mirroring the home scene-rail assertion) rather than asserting 0 executable scripts on `/speaking`. Every OTHER Mirror route stays at 0 executable JS (unchanged).

4. **Accessibility, determinism, voice (no regression; AA).**
   **Given** the literal `pnpm test:all` (= `typecheck && lint && format:check && test && test:e2e && lh`)
   **When** it runs end-to-end after the change
   **Then** every step is green: axe finds **0 WCAG 2.1 AA violations** on `/speaking/` (Copy button keyboard-operable with visible `:focus-visible`, "Copied ✓" announced via `aria-live`/`role="status"`, metric figures/labels AA-contrast, testimonial/logo placeholders labeled in text not color), the build is **byte-deterministic** across two clean builds (NFR-6; no `new Date()`/wall-clock), Lighthouse budgets hold (the copy script is sub-1KB; no heavy assets — logos are `[OPEN]` text placeholders), and copy is **positive-assertion, no hype, no exclamation marks**; internal links trailing-slash (Rule 2).

5. **Integration — the copy enhancement works on, and degrades from, the served page.**
   **Given** the served `/speaking/` page
   **When** a real browser with JS clicks a bio's Copy button **and** when the page is loaded with JS off
   **Then** JS-on: the button copies the exact bio text and shows/announces "Copied ✓"; JS-off: the button does not break the page and the bio remains selectable plain text (manual copy works), with the stated fallback note present — verified by a real-runtime e2e test (skill-rules Rule 3).

## Integration ACs

This is a feature story that EXTENDS the existing `/speaking` Mirror route; it introduces no new cross-story service (the `BioBlock`/`Metric`/`Testimonial` components + the copy enhancement are consumed within this story on `/speaking`; skill-rules Rule 1's "introduces a service" clause does not apply). AC5 IS the integration verification: the copy enhancement is exercised on the real served page (JS-on copy + "Copied ✓") and its JS-off degradation (selectable bios) is confirmed — a real-runtime test on a user-facing surface (Rule 3), not internal state. Forward-reference (not a defect): the Close scene (Story 3.5) and `/about` may later reuse `BioBlock`/`Metric`; the real bio strings, audience figures, testimonials, and logos resolve when Josh confirms them (tracked as `[ASSUMPTION]`/`[OPEN]`).

## Tasks / Subtasks

- [x] **Task 1 — Extend `web/src/data/speaking.ts` (AC1, AC2, Decision 1/4).**
  - [x] Add typed exports: `BIOS` (short ≈50w = a mirror of `PERSON.description`; long ≈100–150w `[ASSUMPTION]` extension — both ending "seasoned, building at the frontier."), `METRICS` (subscribers/views/talks/years — figures `[OPEN]`/`[ph]`, each with a source line), `TESTIMONIALS` (`[OPEN]` quote+attribution), `LOGOS` (`[OPEN]` labeled placeholders). Every unconfirmed value flagged in visible text. Keep figures consistent with the Person/Event JSON-LD.
- [x] **Task 2 — `BioBlock.astro` + the copy enhancement (AC1, AC3, AC5, Decision 2/3).**
  - [x] Build per DESIGN `bio-block`: head (word-count label + Copy `<button>` + hairline) → selectable bio body → fallback note. Copy button keyboard-operable, `:focus-visible`, "Copied ✓" via `aria-live`/`role="status"`.
  - [x] Add ONE minimal, gated, **vanilla** `<script>` (the scene-rail `<script>` pattern — a component `<script>` Astro bundles once) that wires every Copy button: on click, `navigator.clipboard.writeText(bioText)` then show/announce "Copied ✓" (revert after a beat). Guard for absent clipboard API. NOT React. Sub-1KB.
- [x] **Task 3 — `Metric.astro` + `Testimonial.astro` + logo wall (AC2, Decision 3/4).**
  - [x] Build per DESIGN `metric` (hairline-gridded 4-up/2-up), `testimonial` (navy left rule), and a logo wall of `[OPEN]`-labeled placeholders. Static, 0 JS. Real values `[OPEN]`/`[ph]` in visible text.
- [x] **Task 4 — Append the two sections to `/speaking` (AC1, AC2, Decision 4).**
  - [x] At the forward-ref slot in `web/src/pages/speaking.astro`, add a "Bios" section (the two `BioBlock`s) and a "Social proof" / credibility-strip section (the `Metric` grid + `Testimonial`s + logo wall), after the signature-talks section. Keep the existing reel + talks sections unchanged. Remove the now-resolved forward-ref comment (or update it to "resolved by 3.2").
- [x] **Task 5 — Update the NFR-1 build-output test for the `/speaking` carve-out (AC3, Decision 2).**
  - [x] Update `web/test/build-output.test.ts` so the Mirror-route 0-executable-JS assertion CARVES OUT `/speaking`: assert `/speaking` ships exactly ONE minimal executable script (the copy enhancement) + the bios are selectable/present JS-off; every other Mirror route stays 0 executable JS. Mirror the home scene-rail assertion's style. Do NOT weaken the assertion to "any number of scripts" — assert exactly one, and assert it is NOT a React `client.*.js` chunk.
- [x] **Task 6 — Tests (AC1–AC5; Rule 3 + Rule 8).**
  - [x] Component/build-output: `BioBlock` renders both bios verbatim with the lowercase tail + Copy button + fallback note; the short bio === `PERSON.description`; `Metric`/`Testimonial`/logos render with `[OPEN]`/`[ph]` labels in text; `/speaking` carve-out script assertion (Task 5).
  - [x] e2e (Playwright, the `speaking` project): JS-on Copy click copies the bio + announces "Copied ✓" (assert clipboard content or the status text); JS-off the bio is selectable and the page/button don't break; axe AA clean on `/speaking/`. Mutation-verify the copy + carve-out tests are non-vacuous. Rule 8 discoverable.
- [x] **Task 7 — Verify the floor with the LITERAL canonical gate (AC4).**
  - [x] Run the literal `pnpm test:all` end-to-end (Rule 5 — not a subset); all steps green incl. `test:e2e` + `lh`. Confirm `/speaking` has exactly one minimal copy script + bios selectable JS-off; every other Mirror route 0-JS; two clean builds byte-identical; axe AA 0 violations. Note files touched in the Dev Agent Record.

## Dev Notes

### Current state (files being modified/created — read before editing)

- **`web/src/pages/speaking.astro`** (post-3.1): renders the lede + a `speaking__reel` section (`ReelPoster`) + a `speaking__talks` section (`TalkCard` map), with a `[FORWARD-REF: Story 3.2]` comment at lines ~12 and ~74 marking where the bios + credibility strip go. Append the two new sections there; leave the reel + talks intact.
- **`web/src/data/speaking.ts`** (from 3.1): typed reel + signature-talks data with `[OPEN]`/`[ASSUMPTION]` flags. Extend it with bios/metrics/testimonials/logos.
- **`web/src/lib/person.ts`**: `PERSON.description` is the canonical 50-word short bio ("…seasoned, building at the frontier.") already in the Person JSON-LD. The short BioBlock MUST mirror it (AC1/AC5 consistency).
- **`web/src/components/scene/SceneRail.astro`** (lines ~504–512): the existing gated component-`<script>` pattern (`<script> import {…} from '../../lib/motion'; …`) — the model for the copy enhancement's minimal vanilla script (Astro bundles a component `<script>` once; it ships as the page's single executable script).
- **`web/test/build-output.test.ts`** (line ~262): asserts the HOME ships exactly ONE executable script (the scene-rail enhancement) and Mirror routes ship 0 executable scripts. Task 5 updates it to carve out `/speaking`'s one copy script.
- **`web/src/components/glassbox/ArtifactCard.astro`** / **`web/src/components/speaker/{ReelPoster,TalkCard}.astro`** (from 3.1): component + token conventions to match (Props interface, scoped `<style>` with `var(--…)` tokens, chip style).
- **DESIGN tokens (authoritative):** `…/DESIGN.md` lines 276–302 (`bio-block`, `metric`, `testimonial`), quoted in Decision 3. **Visual reference:** `…/mockups/speaker-surface.html` (bio-block w/ Copy/Copied, `m-metric` w/ `[ph]`, logo wall, testimonials) — the DESIGN/EXPERIENCE spine wins on conflict. The verbatim bio prose is in the mock (flagged `[ASSUMPTION]`).

### Constraints / invariants to preserve

- **NFR-1 — the ONE sanctioned change:** `/speaking` gains exactly one minimal vanilla copy-enhancement script (Decision 2 / AC3); the 0-JS baseline (selectable bios) holds; NO React island / `client.*.js` chunk; every other Mirror route stays 0 executable JS. Update the test to match (not work around).
- **NFR-6 — deterministic byte-stable build.** No `new Date()`/wall-clock in any displayed value; two clean builds byte-identical.
- **NFR-2 / AA.** Copy button keyboard-operable, visible `:focus-visible`, "Copied ✓" announced (`aria-live`/`role="status"`); metric/testimonial AA-contrast; `[OPEN]`/`[ph]` in text not color alone.
- **NFR-3 / consistency.** Page bio text agrees with the Person JSON-LD (short bio === `PERSON.description`); displayed Person/Event facts don't contradict the structured data.
- **Voice ([[copy-positive-assertion-no-hype]]).** Positive-assertion, no hype, **no exclamation marks**. Bio lowercase running-sentence tail vs Title-case hero `<h1>` — do not normalize. Credibility floor: zero invented figures/testimonials/logos; everything unconfirmed flagged `[OPEN]`/`[ASSUMPTION]` in visible text.
- **Rule 2 — trailing-slash internal links.** **Rule 5 — verify with the LITERAL `pnpm test:all`.**

### Previous-story intelligence (Stories 3.0 + 3.1)

- The canonical gate is the literal `pnpm test:all` ending with `lh` — run it whole, not a subset (3.0 lesson). New `.astro`/`.ts` files must be `prettier --check .` / `eslint` / `typecheck` clean (run `prettier --write` before the gate; 3.0 + 3.1 both hit this).
- 3.1 added `web/src/data/speaking.ts`, the `speaker/` components, and a `speaking` Playwright project — extend these, don't duplicate. Match the established component conventions.
- Determinism discipline: fixed constants, no wall-clock.

### Project Structure Notes

- New: `web/src/components/speaker/{BioBlock,Metric,Testimonial}.astro`, tests under `web/test/` + `web/e2e/`. Modified: `web/src/data/speaking.ts`, `web/src/pages/speaking.astro`, `web/test/build-output.test.ts`. No `api/`, `shared/`, or `content/` changes.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — AC source (bios + Copy button + social proof).
- [Source: …/DESIGN.md#L276-302] — `bio-block` / `metric` / `testimonial` tokens (authoritative).
- [Source: …/EXPERIENCE.md#L123-124,L146-148,L165,L182] — bio strings ([ASSUMPTION]), Bio-copy block / Metric / Testimonial patterns, Copy default/Copied state, copy-to-clipboard with selectable-text fallback.
- [Source: …/mockups/speaker-surface.html] — verbatim bio prose + social-proof composition (spine wins on conflict).
- [Source: web/src/lib/person.ts] — `PERSON.description` (the canonical short bio the BioBlock mirrors).
- [Source: web/src/components/scene/SceneRail.astro#L504-512] — the gated component-`<script>` enhancement pattern to mirror for the copy button.
- [Source: web/test/build-output.test.ts#L262] — the NFR-1 single-script assertion to extend for the `/speaking` carve-out.
- [Source: web/src/pages/speaking.astro] — the forward-ref slot to fill.
- [Source: .claude/rules/project-rules.md#2,#5] — trailing-slash URL form; canonical full-gate verification.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
- 4 test failures on first `pnpm test` run; all fixed before final gate:
  1. `speaking.test.ts:/speaking ships 0 executable JS` — updated to assert 1 (carve-out).
  2. `speaking.test.ts:/speaking contains no exclamation marks` — strip `<script>` blocks before checking.
  3. `build-output.test.ts:proof-note present` — assertion used full multiline string; fixed to shorter substring.
  4. `build-output.test.ts:keeps the home + every Mirror route at 0 executable scripts` — added `/speaking` carve-out skip.

### Completion Notes List
- Task 1: Extended `web/src/data/speaking.ts` with typed `BIOS`, `METRICS`, `TESTIMONIALS`, `LOGOS` exports. `BIOS[0].text` mirrors `PERSON.description` exactly (AC5 consistency). All unconfirmed values flagged `[OPEN]`/`[ph]`/`[ASSUMPTION]` in visible text. No fabricated figures.
- Task 2: Created `web/src/components/speaker/BioBlock.astro` per DESIGN `bio-block` tokens. Includes ONE vanilla component `<script>` (the copy enhancement — Astro bundles once per page). `navigator.clipboard` guarded. Keyboard-operable with `:focus-visible` ring. "Copied ✓" announced via `aria-live="polite"`/`role="status"`. Bio text always selectable plain text; fallback note present.
- Task 3: Created `web/src/components/speaker/Metric.astro` (navy figure, AA-safe source line) and `web/src/components/speaker/Testimonial.astro` (2px accent left rule). Both static, 0 JS. Logo wall built inline in speaking.astro with `[ph]` text labels. All per DESIGN tokens.
- Task 4: Appended Bios section + Social proof section to `web/src/pages/speaking.astro` at the resolved forward-ref slot. Existing reel + talks sections untouched. Forward-ref comment updated to "resolved by 3.2".
- Task 5: Updated `web/test/build-output.test.ts` with a `Story 3.2 — /speaking NFR-1 carve-out` describe block (7 assertions). Carved out `/speaking` from the `MIRROR_ROUTES` 0-JS assertion and the Umami 0-JS assertion. Asserts exactly 1 script, not React, contains clipboard API call, bios selectable, short bio === PERSON.description, placeholders visible, proof-note present.
- Task 6: Updated `web/e2e/speaking.spec.ts` with 6 new tests: Copy button copies + announces, keyboard-operable, bio selectable JS-off, two BioBlocks present, credibility strip renders. Updated existing NFR-1 script count test to expect 1. Updated `web/test/speaking.test.ts` to expect 1 executable script (carve-out) and strip scripts before exclamation check.
- Task 7: Full gate confirmed green — typecheck (0 errors), lint (clean), format:check (clean), test (586 passed), test:e2e (185 passed), lh (all assertions pass). Two clean builds byte-identical (hash `71b11608d1655922da18758386211e30`). No NFR violations.

### File List
- web/src/data/speaking.ts (modified — added BIOS, METRICS, TESTIMONIALS, LOGOS exports)
- web/src/components/speaker/BioBlock.astro (created)
- web/src/components/speaker/Metric.astro (created)
- web/src/components/speaker/Testimonial.astro (created)
- web/src/pages/speaking.astro (modified — added Bios + Social proof sections)
- web/test/build-output.test.ts (modified — NFR-1 carve-out for /speaking; Umami test carve-out)
- web/test/speaking.test.ts (modified — updated NFR-1 script count + exclamation strip)
- web/e2e/speaking.spec.ts (modified — updated NFR-1 test + 6 new Story 3.2 tests)
- _bmad-output/implementation-artifacts/3-2-copy-paste-bios-social-proof.md (this file)

### Change Log
- 2026-06-06: Story 3.2 implemented. Extended speaking.ts with BIOS/METRICS/TESTIMONIALS/LOGOS; created BioBlock.astro + Metric.astro + Testimonial.astro; appended Bios + Social proof sections to /speaking; updated build-output NFR-1 test with /speaking carve-out + 7 new assertions; updated speaking.test.ts + e2e/speaking.spec.ts. Full pnpm test:all gate green (586 unit + 185 e2e + lh pass); two builds byte-identical.

### Review Findings

**Code review complete (2026-06-07).** Adversarial review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) against the real build + runtime. **0 decision-needed, 0 patch, 2 defer (LOW), 2 dismissed.** No HIGH/MED defects. Story status → `done`.

**Highest-risk change — the NFR-1 carve-out (AC3 / Decision 2) — verified CORRECTLY SCOPED, not weakened:**
- Built `/speaking/index.html` ships **exactly 1 executable script** (one inlined `<script type="module">`) + 1 `application/ld+json` data block — confirmed by direct inspection of `web/dist/speaking/index.html`, not just the test. It is **NOT a React island**: no `<script src=>`, no `modulepreload`, no `client.*.js`, and **zero `.js` references at all** (fully inlined). The inlined copy script is **951 bytes < 1KB** (AC4 sub-1KB holds) and contains `navigator.clipboard` + `writeText` + `data-bio-copy`.
- The build-output test was **strengthened, not weakened**: `build-output.test.ts:636` skips the 0-JS count for `/speaking` ONLY (`if (route === '/speaking') return;`) — every OTHER Mirror route still asserts `countExecutableScripts === 0` (verified the guard still fires for the other 8 routes). The new `Story 3.2 — /speaking NFR-1 carve-out` describe block asserts exactly `toBe(1)`, NOT React (`not.toMatch(/client\.[a-zA-Z0-9]+\.js/)`, no `src=`, no `modulepreload`), script body has the clipboard call, bios present JS-off, short bio === `PERSON.description`, placeholders visible. Precise, not "≥0".
- **JS-off baseline holds:** a real `javaScriptEnabled:false` Playwright context (e2e) proves bios render as selectable plain text, the fallback note shows, the Copy button is inert (no throw, stays "Copy"), and no page error fires. Confirmed in built HTML: both `<p class="bio-block__text">` paragraphs present with full verbatim bio text.

**AC5 / anti-drift — QA's scoped tests are non-vacuous (MUTATION-VERIFIED by the reviewer):**
- `BIOS[0].text` is **byte-equal to `PERSON.description`** (both 300 chars / 47 words; confirmed by exact string compare).
- Confirmed the dev's ORIGINAL whole-document `toContain(PERSON.description)` assertion (still present at `build-output.test.ts:710-719`) **IS a false positive**: `PERSON.description` appears **4×** in the HTML — once as the visible bio and **3× inside the Event JSON-LD** (each `Event.performer` = the full `PERSON` object, which carries `PERSON.description`). I mutated `BIOS[0].text` to a wrong string, rebuilt, and the whole-doc check **stayed GREEN** (false positive proven) while QA's scoped checks **went RED**:
  - served-HTML scoped `<p class="bio-block__text">` extraction === `PERSON.description` → RED under mutation ✓ (regex verified to match the real Astro output, which emits `class="bio-block__text"` as a discrete attribute before `data-astro-cid-*`, so `[^>]*` consumes the cid — 2 paragraphs matched, not vacuous);
  - data-layer `BIOS[0].text === PERSON.description` → RED ✓;
  - the e2e clipboard tests read `navigator.clipboard.readText()` and assert exact `BIOS[0].text` / `BIOS[1].text` (per-button targeting, not-truncated) and `=== PERSON.description` → RED ✓.
  - Source restored byte-clean afterward (no mutation residue).

**Acceptance Criteria — all PASS on the real build/runtime:**
- **AC1** — two `BioBlock`s (short + long); real Copy `<button>` (per-button `aria-label` "Copy Short bio" / "Copy Long bio"), keyboard-operable with `:focus-visible` ring, "Copied ✓" announced via `role="status"`/`aria-live="polite"`; bios always selectable plain text; fallback note present; verbatim, no `!`, lowercase running tail "seasoned, building at the frontier." (NOT normalized to the Title-case hero h1 — `/about` test even asserts `not.toContain('Seasoned, building at the frontier')`); short bio === `PERSON.description`. ✓
- **AC2** — 4 `Metric`s (navy figure via `--font-family-base` which IS "Source Serif 4" + weight 700 = DESIGN's "Source Serif 700"; uppercase label; italic source), 3 `Testimonial`s (italic quote + attribution + 2px accent left rule + radius `0 8px 8px 0`), 4 logo placeholders. All unconfirmed values `[OPEN]`/`[ph]`/`[ASSUMPTION]` in **visible text** (verified in rendered copy, not tint/box). The only real number in the social-proof strip is "30" (Years shipping), consistent with `PERSON.description`'s "30 years"; QA's allowlist test asserts no other bare number leaks. No new fabricated claims; consistent with Person/Event JSON-LD. ✓
- **AC3** — carve-out (above). ✓
- **AC4** — literal `pnpm test:all` GREEN end-to-end (re-run by the reviewer, **exit 0**): typecheck (astro check), lint (eslint, clean), format:check (`prettier --check .` — "All matched files use Prettier code style!", incl. the 3 new `.astro` files — Rule 5 ROOT gate, not a scoped subset), test (vitest: scripts 107 / api 2 / **web 591** = 18 files, all passed), test:e2e (Playwright **189 passed**), `lh` (Lighthouse autorun, all assertions pass). axe AA = **0 violations** on `/speaking/`. **NFR-6 byte-deterministic**: `pnpm check-deterministic` PASS — two clean builds byte-identical (tree hash `94e242c8…`). No exclamation marks in visible copy; all internal links trailing-slash (Rule 2): `/`, `/about/`, `/browse/`, `/faq/`, `/glass-box/`, `/invite/`, `/speaking/`, `/speaking/reel/`, `/timeline/`, `/work/loandemo/`. ✓
- **AC5** — anti-drift (above); integration verified on the served page (JS-on copy of the right per-button payload + "Copied ✓"; JS-off degradation). ✓

**Rule checks:** Rule 1 (self-consumed components on `/speaking`; story declares accurately — N/A service clause) ✓; Rule 3 (real-runtime evidence: build-output reads `web/dist`, e2e exercises the served page incl. clipboard + JS-off) ✓; Rule 5 (canonical ROOT `pnpm test:all` re-run green by reviewer, not a package-scoped subset) ✓; Rule 6 (no `docs/adr/` — N/A); Rule 8 (`speaking` Playwright project runs in the default suite — 189 e2e executed) ✓.

**Deferred (LOW) — recorded in deferred-work.md:**
- [x] [Review][Defer] Copy button `aria-label` not updated in the copied state [web/src/components/speaker/BioBlock.astro:53] — deferred. Not an AC/axe failure; success IS announced via the dedicated `role=status` aria-live region. A permanent action-naming label is a defensible pattern; updating it on the transient copied state is optional polish.
- [x] [Review][Defer] Short-bio word-count label reads "50 words" but the verbatim bio is 47 words [web/src/data/speaking.ts BIOS[0].wordCount] — deferred. The bio is locked byte-for-byte to `PERSON.description` (AC5); the label is an approximate length descriptor of the page's own text (not a fabricated claim about Josh). Cosmetic; relabel or derive from `text.split` when next touched.

**Dismissed as noise (no action):**
- "Metric figure font is `--font-family-base`, not Source Serif" — DISMISSED: `--font-family-base` resolves to `'Source Serif 4', …, serif` (the project's base IS the serif), so `var(--font-family-base)` + `font-weight:700` faithfully realizes DESIGN's "Source Serif 700".
- "The redundant whole-doc `toContain(PERSON.description)` assertion is a false positive" — DISMISSED as actionable: it is genuinely a false positive, but QA already added the scoped anti-drift tests that DO catch drift (mutation-verified above). Leaving the redundant whole-doc assertion is harmless belt-and-suspenders; removing it is optional and out of scope for this review.
