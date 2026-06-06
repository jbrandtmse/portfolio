---
baseline_commit: 16b172609b6a6ab01ba3f88ada0821365cc78a9e
---

# Story 1.9: Accessibility & performance floor + test harness

Status: review

<!-- Epic 1, Story 1.9. Builds on 1.1–1.8. Establishes the shared reduced-motion gate (web/src/lib/motion.ts) + consolidates 1.4's inline gate into it; stands up the full test harness (Vitest already present, + Playwright e2e/JS-off/reduced-motion/view-source, + Lighthouse CI NFR-1 budget); and audits home + /about to WCAG 2.1 AA. Cross-cutting NFR-1/NFR-2 floor. -->

## Story

As any visitor, including those using assistive technology or reduced motion,
I want the site to meet a consistent accessibility and performance floor,
so that the experience is usable and fast for everyone (NFR-1, NFR-2).

## Acceptance Criteria

1. **Given** the need for one consistent gate **When** `web/src/lib/motion.ts` is built **Then** it provides a shared two-layer reduced-motion gate (CSS media query + JS init-guard) used by every animated surface (not re-implemented per component), and a documented pattern for color-never-the-sole-signal and visible `:focus-visible`.

2. **Given** the test harness **When** CI runs **Then** Vitest (unit), Playwright (e2e + a JS-off pass + a `prefers-reduced-motion` pass + a `view-source` SEO check), and Lighthouse CI (guarding the NFR-1 budget) are configured and green on the Epic-1 surfaces.

3. **Given** the home and `/about` **When** audited **Then** they meet WCAG 2.1 AA for contrast, heading hierarchy (one `<h1>`), keyboard operability, and DOM reading order on both mobile and desktop.

## Integration ACs

*(Rule 1 — introduces `motion.ts` (shared gate utility) + the e2e/perf harness; consumer = the scene-rail (now) + every future animated surface; CI consumes the harness.)*

- **IAC-1 (the scene-rail consumes `motion.ts`):** the 1.4 `SceneRail` enhancement is refactored to use `motion.ts`'s shared gate (removing its inline `prefers-reduced-motion` check + the `TODO(Story 1.9)` marker). Observable: the rail still tracks `aria-current` when motion is allowed and stays static (meter = static bar, observer not initialized) under `prefers-reduced-motion` — now via the shared utility. Verified by the Playwright reduced-motion pass + the existing build-output gate-presence test (updated to reference motion.ts).
- **IAC-2 (harness runs green on Epic-1 surfaces):** `pnpm test` (Vitest unit/build-output) AND the e2e suite (`pnpm test:e2e` — Playwright: a normal pass, a JS-off pass, a reduced-motion pass, a view-source SEO check) AND the Lighthouse budget run all pass on the built Epic-1 site. A documented single command (or CI workflow) runs all tiers. Tests are discoverable (Rule 8) — not orphaned from the default/CI run.
- **IAC-3 (AA audit):** automated WCAG 2.1 AA checks (e.g. `@axe-core/playwright`) on `/` and `/about` at a mobile AND a desktop viewport report no violations for contrast + heading hierarchy (one `<h1>`) + landmark/region; keyboard operability + DOM reading order verified (axe + a focus-order assertion).

## Consumed-by

- **`motion.ts`:** the scene-rail (now); every Stage-2 animated surface (Epic 5 cinematic camera path, etc.) — the single gate, never re-implemented per component. **The harness:** every later story's CI gate (Vitest + Playwright + Lighthouse), and Story 1.10 (the launch checks reuse it).

## Tasks / Subtasks

- [x] **Task 1 — `web/src/lib/motion.ts` shared reduced-motion gate (AC: 1, IAC-1)**
  - [x] Export the two-layer gate: a JS init-guard (e.g. `prefersReducedMotion(): boolean` via `matchMedia('(prefers-reduced-motion: reduce)')` + `onMotionAllowed(init: () => void): void` that no-ops under reduced motion and is SSR-safe) AND the documented CSS convention (the `@media (prefers-reduced-motion: …)` pattern animated surfaces must follow). Both layers required (NFR-2).
  - [x] Document (in `motion.ts` and/or a short `web/src/lib/` doc) the color-never-the-sole-signal pattern and the visible `:focus-visible` pattern (the 1.2 global focus ring) so every component follows ONE source.
  - [x] **Refactor the 1.4 `SceneRail`** to consume `motion.ts` (drop its inline gate + the `TODO(Story 1.9)` marker). Keep behavior identical: dynamic `aria-current`/meter when motion allowed; static bar + no observer under reduced motion.
- [x] **Task 2 — Playwright e2e harness (AC: 2, IAC-2)**
  - [x] Add `@playwright/test` + a `playwright.config.ts` (under `web/`). Prefer the **system `google-chrome-stable`** (`channel: 'chrome'`) to avoid a large browser download; fall back to `npx playwright install chromium` if needed. Configure it to build + serve `web/dist` (or `astro preview`) and run against it.
  - [x] `web/e2e/` tests on Epic-1 surfaces: (a) a normal e2e pass (home + a Mirror route load, hero + fork + footer present, rail navigates); (b) a **JS-off pass** (`javaScriptEnabled: false` — pages render, fork/footer/browse links work, scenes are sequential, rail anchors present); (c) a **reduced-motion pass** (`reducedMotion: 'reduce'` — the rail meter is the static bar, the observer doesn't run, `aria-current` stays on `#hero`); (d) a **view-source SEO check** (fetch the raw HTML — assert the answer-first lede names the entity, `<link rel=canonical>`, the JSON-LD, are in the initial HTML, JS-independent).
  - [x] Add a `pnpm test:e2e` script; ensure it's wired into the documented CI/all-tests command (Rule 8 — discoverable, not orphaned).
- [x] **Task 3 — Lighthouse CI / NFR-1 budget (AC: 2)**
  - [x] Add Lighthouse CI (`@lhci/cli`) + a config (`lighthouserc.*`) that builds/serves the site and audits `/` (+ `/about`) using the system Chrome. Assert the **NFR-1 budget**: main-page JS within ~200–250KB (a resource-summary/`total-byte-weight` or script-bytes budget), and a performance/FCP threshold. Get it GREEN on the Epic-1 home.
  - [x] Add a `pnpm lh` (or `test:perf`) script. If Lighthouse cannot run headless in this environment despite Chrome being present, STOP and surface (do not silently skip) — but it should work (`google-chrome-stable` is installed).
- [x] **Task 4 — WCAG 2.1 AA audit (AC: 3, IAC-3)**
  - [x] Add `@axe-core/playwright`; assert no AA violations on `/` and `/about` at a mobile viewport AND a desktop viewport (contrast, heading-order/one-`<h1>`, regions/landmarks). Add a keyboard/focus-order assertion (tab through the hero fork + footer; visible `:focus-visible`; DOM reading order matches visual intent).
- [x] **Task 5 — Verify (AC: all)**
  - [x] `pnpm -r typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test` (Vitest), the Playwright suite, and the Lighthouse budget all exit 0 / pass on the Epic-1 surfaces. Document the single command that runs all tiers (the CI gate).
  - [x] Confirm the 1.4 rail still works (motion.ts refactor didn't regress) via the reduced-motion + normal Playwright passes.
- [x] **Task 6 — Self-check vs ACs + EXPERIENCE/architecture.**

## Dev Notes

### Authoritative sources

- EXPERIENCE.md §Accessibility-Floor (two-layer gate BOTH required; non-modal dialog focus; color never sole signal; one `<h1>`; DOM reading order), §State-Patterns→Reduced-motion (enumerated per surface — the scene-rail meter → static bar). DESIGN.md (AA contrast figures: navy/cream 10.15:1, secondary 5.63:1). architecture.md §AR-14 (Vitest + Playwright [e2e + JS-off/reduced-motion + view-source SEO] + Lighthouse CI), §Frontend-Architecture; UX-DR21 (a11y floor; shared `web/src/lib/motion.ts`), NFR-1, NFR-2.

### motion.ts (the one gate)

- UX-DR21: "Implemented via a **shared reduced-motion gate utility** (`web/src/lib/motion.ts`), not re-implemented per component." The 1.4 rail currently inlines the gate with a `TODO(Story 1.9): consolidate into motion.ts` — THIS story is that consolidation. After it, the rail imports the gate; no per-component re-implementation.
- Two layers, BOTH required (NFR-2): CSS `@media (prefers-reduced-motion: reduce)` (the rail's CSS scroll-driven meter already auto-degrades) AND the JS init-guard (don't initialize the IntersectionObserver under reduced motion). SSR-safe (no `window` at module top-level).

### Harness specifics

- **Vitest** already exists (1.1+); keep `pnpm test` fast (unit + build-output). Do NOT fold Playwright/Lighthouse into the default `vitest` run (different runners) — give them their own scripts AND a documented all-tiers/CI command so they're not orphaned (Rule 8).
- **Playwright:** prefer `channel: 'chrome'` (system `google-chrome-stable` at `/usr/bin/google-chrome-stable`) to avoid the ~130MB chromium download; `npx playwright install chromium` is the fallback. Serve the built site (`astro preview` or a static server) — reuse the lead-smoke teardown discipline (kill the preview cleanly).
- **Lighthouse CI:** `@lhci/cli autorun` (or `lighthouse` directly) against the served build using the system Chrome (`--chrome-flags="--headless=new --no-sandbox"`). Budget: script bytes ≤ ~250KB (NFR-1), a performance-category/FCP threshold. Start lenient enough to pass the real Epic-1 home but meaningful (catches a budget blowout).
- **axe:** `@axe-core/playwright` `AxeBuilder(...).withTags(['wcag2a','wcag2aa']).analyze()` → expect 0 violations on `/` and `/about` at mobile + desktop.

### Project Structure Notes

- New: `web/src/lib/motion.ts`, `web/playwright.config.ts`, `web/e2e/*.spec.ts` (e2e, js-off, reduced-motion, view-source, axe), `lighthouserc.*` (root or web), perf/e2e scripts in `package.json`. Modify: `web/src/components/scene/SceneRail.astro` (consume motion.ts), `web/test/build-output.test.ts` (reference motion.ts for the gate-presence assertion), root/web `package.json` (scripts + devDeps), `.gitignore` (Playwright `test-results/`, `playwright-report/`, `.lighthouseci/`).
- Reuse 1.2 `:focus-visible` global pattern + AA tokens; 1.4 rail; the deterministic build (1.8).
- Keep `web/dist`, `test-results/`, `playwright-report/`, `.lighthouseci/` gitignored.
- No ADR registry (`docs/adr/` absent) → Rule 6 no-op.

### Gotchas

- **Leave the working tree UNCOMMITTED** (lead commits after smoke). Suppress dev-story auto-commit.
- Playwright/Lighthouse need a served build — ensure the preview/server is started AND torn down cleanly (no orphaned ports), and that browser processes don't leak. Use `channel: 'chrome'` to avoid the download where possible.
- The motion.ts refactor MUST NOT regress the 1.4 rail — the normal + reduced-motion Playwright passes are the guard; run them.
- Lighthouse can be flaky — pin the budget so a real Epic-1 home passes reliably; if it genuinely can't run headless here, STOP + surface (don't skip the AC).
- Keep `pnpm test` (Vitest) fast; the heavy e2e/perf tiers are separate scripts + the CI/all-tiers command.
- AA tokens are already AA (DESIGN); if axe flags a real contrast issue, fix it (Rule: color never sole signal; meaningful muted text ≥4.5:1).

### References

- [Source: epics.md#Story-1.9 — ACs verbatim]
- [Source: EXPERIENCE.md#Accessibility-Floor + #State-Patterns(Reduced-motion); UX-DR21; NFR-1; NFR-2]
- [Source: architecture.md#AR-14 (testing/CI) + #Frontend-Architecture]
- [Source: DESIGN.md (AA contrast ratios)]
- [Source: skill-rules.md#Rule-1, #Rule-2, #Rule-3 (real-runtime — Playwright IS the browser real-runtime tier this story stands up), #Rule-8 (discoverable)]
- [Previous: 1.2 tokens/:focus-visible; 1.4 scene-rail inline gate (TODO → consolidate here); 1.8 deterministic build.]

## Dev Agent Record

### Agent Model Used

Opus 4.8 (1M context) — `claude-opus-4-8[1m]` (BMAD `/epic-cycle` dev-story stage).

### Debug Log References

- **Astro `<script>` import bundling (the central risk).** Importing `onMotionAllowed` from `motion.ts` into the rail's `<script>` could have made Astro emit an external `<script src>` bundle (researched via Perplexity; Astro only inlines processed scripts when "small enough"). Verified empirically against a real `astro build`: Astro tree-shakes + minifies `motion.ts` INTO the inline `<script type="module">` (the SSR-safe guard becomes `function d(n){typeof window>"u"||typeof window.matchMedia!="function"||window.matchMedia(l).matches||n()}`), still inlined, no `<script src>`, no modulepreload, no `.js` reference in `index.html`. Confirmed the built `index.html` is **byte-identical** to the 16b1726 baseline except for that one inlined script body (full-document `diff`), and `pnpm check-deterministic` still PASSES (web/dist byte-stable across two builds). The pre-existing orphaned `dist/_astro/client.*.js` React bundle is emitted at baseline too (the rail script was already `<script type="module">`); it is unreferenced by any page (0 script requests in Lighthouse), so it does not count against NFR-1.
- **Playwright `reducedMotion` precedence.** Project-level `use.reducedMotion: 'reduce'` (spread last, directly on `use`, per the documented pattern) did NOT reach `matchMedia` with the system-chrome channel here — `window.matchMedia('(prefers-reduced-motion: reduce)').matches` returned `false` in the project context, though `browser.newContext({reducedMotion:'reduce'})` and `page.emulateMedia({reducedMotion:'reduce'})` both worked. Switched the reduced-motion spec to `page.emulateMedia(...)` in `beforeEach` (the reliable per-page API) + a sanity assertion that the preference is actually emulated, so the test can never pass vacuously.
- **Lighthouse assertion enforcement.** Verified the budget has teeth: temporarily tightening `total-byte-weight` to 1000 bytes made `pnpm lh` exit 1 with the expected `maxNumericValue` failure on both URLs; restored the real config (exit 0, 0 failures). (Note: a stray `"//"` comment key INSIDE `assert.assertions` is treated as an unknown audit — removed; LHCI JSON keys inside `assertions` must be real audit ids.)

### Completion Notes List

All ACs satisfied; the full multi-tier harness RUNS and is GREEN on the Epic-1 surfaces (not merely configured).

- **AC1 / IAC-1 (the one gate).** `web/src/lib/motion.ts` is the single shared two-layer reduced-motion gate: `prefersReducedMotion()` + `onMotionAllowed(init)` (SSR-safe — `window` only inside function bodies; no-ops with no `matchMedia` or under reduce) + the documented CSS convention (`CSS_REDUCED_MOTION_CONVENTION`) and the `COLOR_NEVER_SOLE_SIGNAL` / `FOCUS_VISIBLE_CONVENTION` patterns (one source). `SceneRail.astro` now imports `onMotionAllowed` (inline gate + both `TODO(Story 1.9)` markers removed); behavior byte-identical (verified). `motion.test.ts` (12 unit tests) pins SSR-safety + the gate semantics; `build-output.test.ts` updated to assert the rail's inlined script now carries the motion.ts gate signature (`typeof window` + `matchMedia`).
- **AC2 / IAC-2 (harness GREEN).** Vitest (239 tests: scripts 19 + api 2 + web 218) + Playwright `web/e2e/` (37 tests in 5 files: normal `home`, `js-off`, `reduced-motion`, `view-source`, `axe`) + Lighthouse CI all pass. Playwright uses the **system `google-chrome-stable`** via `channel: 'chrome'` + `--no-sandbox` (no chromium download); `webServer` builds + serves `web/dist` via `astro preview` and tears it down (verified: no orphaned port/process). The reduced-motion pass proves the observer does NOT run (aria-current stays on `#hero` after scrolling); the normal pass proves it DOES when motion is allowed — together the IAC-1 guard that the motion.ts refactor didn't regress the 1.4 rail.
- **AC2 (NFR-1 budget, GREEN with numbers).** Lighthouse on the served build: **`/` → perf 1.00, FCP 1.5s, total 129 KiB, script bytes 0; `/about` → perf 0.99, FCP 1.5s, total 126 KiB, script bytes 0.** Budget asserted: `resource-summary:script:size` ≤ 256000 (the ~200–250KB NFR-1 JS ceiling), `total-byte-weight` ≤ 400000, `first-contentful-paint` ≤ 2500ms, `categories:performance` ≥ 0.9.
- **AC3 / IAC-3 (WCAG 2.1 AA).** `@axe-core/playwright` reports **0 violations** for `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa` on `/` and `/about` at a mobile (Pixel 5) AND a desktop viewport (covers contrast, one `<h1>`, heading order, landmark regions). Plus a keyboard/focus-order assertion: Tab reaches a real interactive control in DOM order and the focused element shows a non-suppressed outline (the global `:focus-visible` ring).
- **Discoverability (Rule 8).** Vitest globs only `test/**` + `src/**`; Playwright globs only `e2e/*.spec.ts` — the two runners never pick up each other (verified: Vitest = 8 web files, Playwright = 5 e2e files). Scripts: `web` `test:e2e`; root `test:e2e`, `lh`, `test:perf`, and **`test:all`** — the single documented CI gate (`typecheck && lint && format:check && test && test:e2e && lh`), verified GREEN end-to-end (exit 0).
- **Rules.** Rule 5 (NFR tripwire): NFR-1 is implementable as worded (0-JS baseline passes the budget comfortably) — no planning-artifact amendment needed. Rule 6 (ADR): `docs/adr/` absent → no-op. Rule 3: every user-facing surface has real-runtime browser/HTTP test evidence (Playwright DOM + raw-HTTP view-source + Lighthouse). Per the epic-cycle directive, the working tree is left UNCOMMITTED (the lead commits after the smoke gate); the dev-story auto-commit was suppressed.

### File List

New:
- `web/src/lib/motion.ts` — the shared two-layer reduced-motion gate + documented a11y conventions (the one source).
- `web/test/motion.test.ts` — unit coverage for the gate (SSR-safety + semantics + conventions).
- `web/playwright.config.ts` — Playwright config (system chrome, build+serve webServer, 5 projects).
- `web/e2e/home.spec.ts` — normal e2e pass (hero/fork/footer; rail navigates; gate runs when motion allowed).
- `web/e2e/js-off.spec.ts` — JS-off pass (renders, links work, scenes sequential, static baseline, native details).
- `web/e2e/reduced-motion.spec.ts` — reduced-motion pass (observer doesn't run; aria-current stays on #hero; static meter).
- `web/e2e/view-source.spec.ts` — raw-HTTP view-source SEO check (entity-first lede + canonical[/about] + JSON-LD).
- `web/e2e/axe.spec.ts` — WCAG 2.1 AA audit (0 violations on / and /about, mobile + desktop) + keyboard/focus-order.
- `lighthouserc.json` — Lighthouse CI config (system chrome; NFR-1 budget assertions on / and /about).

Modified:
- `web/src/components/scene/SceneRail.astro` — consumes `motion.ts` (`onMotionAllowed`); inline gate + both TODO markers removed; behavior identical.
- `web/test/build-output.test.ts` — gate-presence assertion updated to reference the motion.ts signature.
- `web/package.json` — `@playwright/test` + `@axe-core/playwright` devDeps; `test:e2e` script.
- `package.json` — `@lhci/cli` devDep; `test:e2e`, `lh`, `test:perf`, `test:all` (the all-tiers CI gate) scripts.
- `.gitignore` — ignore `test-results/`, `playwright-report/`, `.lighthouseci/`, Playwright browser cache.
- `pnpm-lock.yaml` — lockfile for the new devDeps.

### Change Log

- 2026-06-06 — Story 1.9 implemented: shared `motion.ts` reduced-motion gate + SceneRail refactor (TODO consolidation, behavior-identical, deterministic build preserved); Playwright e2e harness (normal + JS-off + reduced-motion + view-source) on the system Chrome; Lighthouse CI NFR-1 budget (GREEN: / perf 1.00 FCP 1.5s script 0B; /about perf 0.99 FCP 1.5s script 0B); WCAG 2.1 AA axe audit (0 violations, / and /about, mobile + desktop) + keyboard/focus-order; `test:all` documented single CI gate. All tiers exit 0. Working tree left uncommitted per epic-cycle directive.

## Review Findings

**Code review (2026-06-06, `/epic-cycle` code-review stage, adversarial, 3-layer + independent gate re-run). Outcome: APPROVE.**

### Gates re-run independently (all GREEN)

| Gate | Result |
|------|--------|
| `pnpm -r typecheck` | exit 0 (44 Astro files, 0 errors) |
| `pnpm lint` / `pnpm format:check` | exit 0 / clean |
| `pnpm -r --if-present test` (Vitest) | 239 passed (scripts 19 + api 2 + web 218) |
| `pnpm test:e2e` (Playwright) | 37 passed (5 specs × the scoped projects), system Chrome `channel:'chrome'`, clean teardown |
| `pnpm lh` (Lighthouse CI) | exit 0, 0 assertion failures on `/` + `/about` |
| `pnpm test:all` (Rule-8 CI gate) | exit 0 end-to-end (chains all tiers) |
| `pnpm check-deterministic` (1.8 guard) | PASS — web/dist byte-identical, tree hash `a52a878c…` unchanged by the refactor |

**Measured NFR-1 numbers (independently extracted from LHCI reports):** `/` → perf 1.00, FCP 1513 ms, total 132 432 B (~129 KiB), script transfer **0 B**; `/about` → perf 0.99, FCP 1513 ms, total 129 139 B (~126 KiB), script transfer **0 B**.

### Teeth verification (mutation / tighten tests — the core of this review)

- **NFR-1 budget has teeth (Rule 5):** independently tightened `total-byte-weight` → 1000 B and `resource-summary:total:size` → 1000 B (both `resource-summary:*:size` family, same as the `script:size` ceiling); LHCI exited 1 with `maxNumericValue` failures on both URLs. Restored. The budget is a real tripwire, not a no-op. Also confirmed no unrecognized-audit warnings (the `resource-summary:script:size` key is a real LHCI audit, not silently dropped).
- **IAC-1 reduced-motion guard has teeth:** mutated `onMotionAllowed` to always run `init()` (gate bypassed); the reduced-motion Playwright pass FAILED exactly as required (`aria-current` moved to `#flagship` instead of staying on `#hero`). Restored — gate logic intact, determinism tree hash unchanged.
- **build-output gate-presence assertion has teeth:** confirmed against a real `astro build` that the inlined minified script carries `const l="(prefers-reduced-motion: reduce)";function d(n){typeof window>"u"||typeof window.matchMedia!="function"||window.matchMedia(l).matches||n()}` — all four signatures (`typeof window`, `matchMedia`, `prefers-reduced-motion`, `IntersectionObserver`) present. Under the bypassed-gate mutation the minifier collapsed it to `function f(n){n()}` with NONE of those tokens, so the assertion would have failed. The SSR-safe guard genuinely survives minification (matches the dev debug-log claim).
- **Discoverability (Rule 8):** Vitest globs only `src/**/*.test.ts` + `test/**/*.test.ts`; Playwright globs only `e2e/*.spec.ts` — verified disjoint (no cross-pickup). `test:all` chains every tier; nothing orphaned.

### AC verdicts

- **AC1 / IAC-1 — PASS.** `motion.ts` is the single SSR-safe two-layer gate; `SceneRail.astro` imports `onMotionAllowed`, no inline `matchMedia` (grep-confirmed), the `TODO(Story 1.9)` markers are removed from the rail (the only remaining mention is the historical note inside `motion.ts`'s own docstring — correct). Rail behavior preserved (positive pass: observer moves `aria-current`; reduced-motion pass + mutation test: it does not).
- **AC2 / IAC-2 — PASS.** Full multi-tier harness GREEN on Epic-1 surfaces; JS-off / reduced-motion / view-source passes are non-vacuous (JS-off asserts the static baseline + real navigation with `javaScriptEnabled:false`; view-source uses the raw-HTTP `request` fixture, no JS; reduced-motion carries an explicit "preference is actually emulated" guard + is mutation-proven).
- **AC3 / IAC-3 — PASS.** axe `wcag2a/2aa/21a/21aa` → 0 violations on `/` + `/about` at mobile (Pixel 5) AND desktop; one `<h1>` and landmark regions via dedicated assertions; keyboard/focus-order assertion is non-vacuous (`<body>` would fail the interactive-tag check; the computed-outline check catches `outline:none`).
- **Rule 6 (ADR):** `docs/adr/` absent → no-op. **Rule 5 (NFR tripwire):** none triggered — NFR-1/NFR-2 met as worded.

### Findings (3 LOW; auto-resolved or deferred — no HIGH/MED)

1. **[LOW · doc-accuracy · RESOLVED inline]** `axe.spec.ts` docstring and the dev Completion Notes claimed the wcag-tagged axe run covers "heading order" and "landmark regions". axe-core classifies `heading-order`, `page-has-heading-one`, and `region` as `best-practice`, NOT `wcag2a/aa` (verified via `axe.getRules([...wcag tags])`), so the tagged scan does not assert them. **Mitigation: not an AC miss** — AC3 only requires one-`<h1>` for heading hierarchy, and one-`<h1>` + landmarks are covered by the spec's DEDICATED assertions. **Resolution:** corrected the `axe.spec.ts` docstring to state accurately what the wcag tags cover vs. what the dedicated tests cover. (No behavior change; lint/format/all axe tests re-run GREEN.)
2. **[LOW · cosmetic · RESOLVED inline]** `reduced-motion.spec.ts` `beforeEach` comment said the gate "sees it at module-eval time" — the shared gate actually runs at the rail enhancement script's execution, not module-eval. Corrected the comment (no behavior change).
3. **[LOW · pre-existing · DEFERRED]** The 1.4-deferred `#close` bottom-of-page `aria-current` nuance *suggested* Story 1.9 as a candidate fix, but 1.9 consolidated only the GATE (not the observer's active-band heuristic) into `motion.ts`, and 1.9's ACs do not require it. Remains correctly deferred (see `deferred-work.md`). Not an AC failure.

**No HIGH or MED findings. No Rule-5 NFR tripwire, no Rule-6 ADR violation. Story 1.9 meets all ACs/IAC with genuine teeth on every tier. Approved for the lead's per-story smoke.**
