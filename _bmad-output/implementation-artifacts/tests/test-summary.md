# Test Automation Summary — Story 1.1 (Scaffold the pnpm monorepo)

QA stage of `/epic-cycle`. Story 1.1 is a non-user-facing scaffold / build-pipeline
story; its only runtime surface is `GET /api/health` in the Hono `api` package.

## Scope decision

- The project's **canonical multi-tier test harness (Vitest workspace + Playwright
  e2e + Lighthouse CI) is Story 1.9's deliverable** — deliberately NOT built here.
  No Playwright, no browser/Lighthouse tests, no root test-orchestration framework,
  no `web/e2e/` setup were added (those would cause rework/conflict with Story 1.9).
- Added the **minimal** discoverable test surface: one real-runtime integration
  test for `/api/health`, co-located in the `api` package per the architecture's
  "co-located `*.test.ts` (Vitest)" convention.

## Generated Tests

### API / service integration tests

- [x] `api/src/health.test.ts` — real-runtime test of `GET /api/health`.
  Imports the actual Hono `app` (default export of `api/src/index.ts`) and drives
  a real request through it via Hono's in-process `app.request('/api/health')`
  (the same router code path `@hono/node-server` runs). Asserts:
  - HTTP **200**
  - JSON body `{ status: 'ok' }`
  - `content-type` is `application/json`

  This is a genuine status-code + response-body assertion (skill-rules Rule 3 form
  for a service/API). Story 1.1 is Rule-3-**exempt** (non-user-facing), but the
  real-runtime evidence is provided anyway.

### E2E tests

- None. The web UI is an empty scaffold (0-JS home page); browser/e2e coverage is
  Story 1.9's deliverable.

## Supporting changes (minimal, api-package-only)

- `api/package.json` — added `vitest@^4.1.8` devDependency and `"test": "vitest run"`
  script (`run` = single-shot, no watch, CI-safe).
- `api/vitest.config.ts` — minimal config: `environment: 'node'`,
  `include: ['src/**/*.test.ts']`.
- `api/tsconfig.json` — excluded `src/**/*.test.ts` from the production `tsc`
  build/typecheck so tests don't emit into `dist/` and don't require vitest types
  in the service compile. Vitest discovers them independently.
- Root `package.json` — added `"test": "pnpm -r --if-present run test"` so the test
  is discoverable from the default root suite (**skill-rules Rule 8**).

## Coverage

- API endpoints: 1/1 covered (`GET /api/health` — the only endpoint in Story 1.1).
- UI features: 0 (none in scope; deferred to Story 1.9).

## Verification (all run, all pass)

- `pnpm --filter api test` → 1 file, 2 tests **passed** (vitest 4.1.8), exit 0.
- `pnpm test` (root default suite) → discovers & runs the api test, **passed**,
  exit 0 (Rule 8 confirmed).
- Regression sweep (no breakage from additions):
  - `pnpm -r typecheck` → exit 0 (shared/api `tsc` Done; web `astro check` 0/0/0).
  - `pnpm lint` → exit 0 (test file passes ESLint via explicit `vitest` imports;
    no globals config change needed).
  - `pnpm format:check` → exit 0 (new files Prettier-clean).
  - `pnpm build` → exit 0; `api/dist/` contains only `index.js` (no test leaked).

## Next Steps

- Story 1.9 establishes the canonical harness (Vitest workspace config, Playwright
  e2e, Lighthouse CI). At that point, fold `api/vitest.config.ts` into the workspace
  config and add browser/e2e + a11y coverage for the web app.
- Add more `/api/*` endpoint tests as Stories 3.3 (`/api/invite`) and 4.3
  (`/api/guide`) land.

---

# Test Automation Summary — Story 1.3 (Calm, credible hero + audience fork)

QA stage of `/epic-cycle`. Story 1.3 **is** user-facing (FR-1, the cold-landing
hero). Real-runtime evidence is appropriate (skill-rules Rule 3) and already
present: the dev stage updated `web/test/build-output.test.ts` to run a real
`astro build` and assert on the produced static HTML — the runtime for a 0-JS
static page.

## Scope decision

- The canonical Playwright (browser e2e) + Lighthouse harness is **Story 1.9** —
  deliberately NOT built here. No `web/e2e/`, no Playwright, no Lighthouse.
- Verified the dev's hero assertions in `build-output.test.ts` are **discoverable**
  in the default suite (Rule 8) and **green**.
- Assessed AC1/AC2/AC3 + IAC-1/IAC-2 coverage; added **one** focused, minimal
  Container-API render test of `HeroStatic` to close the genuine gaps the
  page-level suite left uncovered. Did NOT duplicate the page-level h1 / 0-script
  / no-exclamation / fork-href coverage already in `build-output.test.ts`.

## Coverage assessment (against ACs + Integration ACs)

Already covered by the dev's `build-output.test.ts` (real `astro build` → built
`dist/index.html`): exactly one `<h1>` = `Seasoned, building at the frontier`;
the `Joshua R. Brandt, MSE` Wordmark; the `built in the open · a BMAD Method
project` framing; `<section id="hero">`; the three fork hrefs `#thesis` /
`/speaking` / `/faq` as real `<a>`; Explore = `.btn--primary`; the quiet Guide
link distinct (NOT a `.btn`); **0 `<script>`** (IAC-1 / NFR-1); no JS bundle
referenced; no exclamation marks (IAC-2).

**Gaps found (and now closed):**

1. **The `[OPEN]` headshot placeholder (AC1 / IAC-2)** — AC1 requires "a
   headshot/portrait (styled placeholder until the real asset, flagged
   `[OPEN]`)". No test checked the portrait existed or was flagged as a
   placeholder. (The `[OPEN]` source marker is a build-stripped comment — correctly
   absent from rendered HTML — so the runtime-observable proof is the portrait's
   accessible label, which reads "…(placeholder — headshot to come)".)
2. **The fork at the component boundary (AC2 / IAC-2)** — proving the three fork
   controls are real `<a>` with the exact hrefs and the quiet Guide entry is a
   real link that is NOT a `.btn`, isolated on `HeroStatic` rather than only inside
   the assembled page (the `Button.component.test.ts` pattern).

## Generated Tests

### E2E / component real-runtime tests

- [x] `web/test/HeroStatic.component.test.ts` — renders `HeroStatic` directly via
  Astro's Container API (real-runtime evidence for a user-facing component, Rule 3;
  discoverable `*.test.ts`, Rule 8). 7 tests:
  - **[OPEN] headshot placeholder (AC1 / IAC-2):** a `role="img"` portrait region
    whose accessible label names the subject AND flags it a *placeholder*; the
    placeholder is CSS/markup (no `<img>`, NFR-1); the `JRB` monogram mark is
    decorative (`aria-hidden`); a museum-style `<figcaption>` names the subject.
  - **The fork at the component boundary (AC2 / IAC-2):** Explore (`#thesis`) and
    "book a talk" (`/speaking`) are real `<a>` (JS-off-followable); the quiet Guide
    entry is a real `<a href="/faq">` that is NOT a `.btn`; the component emits
    exactly the three canonical hrefs `['#thesis', '/speaking', '/faq']` and no
    stray nav.

## Coverage

- UI features: the Story 1.3 hero contract (AC1/AC2 + IAC-1/IAC-2) is covered by
  `build-output.test.ts` (page-level, real build) + `HeroStatic.component.test.ts`
  (component-level placeholder + fork semantics).
- AC3 (FCP/Lighthouse budget, NFR-1/NFR-2 perf): formal enforcement is **Story
  1.9/1.10** per the story; the 0-`<script>` / no-`<img>` floor is asserted here.

## Verification (all run, all pass)

- `pnpm --filter web test` → **3 files, 36 tests passed** (was 29 → +7), exit 0.
- `pnpm -r --if-present test` (root) → api **2/2**, web **36/36**, exit 0
  (Rule 8 — the new tests run in the default suite).
- Regression sweep (no breakage):
  - `pnpm -r typecheck` → web `astro check` 0 errors / 0 warnings / 0 hints.
  - `pnpm lint` → exit 0. `pnpm format:check` → exit 0 (new file Prettier-clean).

## Next Steps

- Story 1.9 establishes the Playwright JS-off + Lighthouse harness; add browser
  e2e (real JS-disabled navigation of the fork) + FCP/perf-budget enforcement
  there. Once `/speaking` and `/faq` land (Story 1.5), the fork hrefs resolve and
  e2e can follow them end-to-end (the pre-1.5 404 is not a 1.3 defect).

---

# Test Automation Summary — Story 2.1 (Publish allowlist + Glass Box render pipeline)

QA stage of `/epic-cycle`. Framework: **Vitest** (existing). Branch: `PORT-1-epic2`.

## Scope & Rule 3 exemption

Story 2.1 delivers a **build-time pipeline / library** (the default-deny publish
allowlist `content/glassbox.allowlist.ts` + the `render-glassbox` generator), **not
a user-facing browser surface** — the Glass Box PAGES are Stories 2.2/2.3. Per
skill-rules **Rule 3**, the browser/Playwright real-runtime tier is **EXEMPT for
this story**. The correct real-runtime tier is **actual invocation of
`renderGlassbox()` / `renderGlassboxGenerator.run()` with assertions on the
produced output** (return value + the emitted `web/src/generated/glassbox.json`).
Both are exercised.

## Generated Tests

### QA-added (this stage)

- [x] `scripts/render-glassbox.security.test.ts` — **14 tests**, the adversarial /
  security-critical tier (complements the dev's file, does not duplicate it):
  - **Default-deny mutation-resistance (AC3):** NEGATIVE (the FULL real never-render
    corpus never appears, asserted by artifact IDENTITY — slug + sourceFile + body,
    NOT raw substring, since allowlisted bodies legitimately mention
    "decision-log"/"addendum"/"reconcile" in prose); POSITIVE CONTROL (a synthetic
    allowlist pointing at a real `.decision-log.md` DOES render it — proving the gate
    IS the allowlist, not a hard-coded skip); corpus SWEEP (every never-render file
    renders iff listed); STRUCTURAL (`render(allowlist)` is EXACTLY the allowlist
    set → the render iterates the allowlist, not the filesystem; an unlisted file
    structurally cannot enter).
  - **Corpus integrity:** every never-render path actually exists in the repo (no
    silent-skip typos) and ALL THREE `.decision-log.md` files are covered — the
    AC3-named family the dev corpus omitted entirely.
  - **Git-date determinism (AC2 / NFR-6):** each `date` equals the independently
    recomputed `git log -1 --format=%cI` of its sourceFile (proves git-derived, not
    wall-clock); no date exceeds HEAD's committer date; the same-date slug tie-break
    is provably exercised (launch set has shared dates).
  - **Generator real-runtime tier (Rule 3):** invokes `renderGlassboxGenerator.run()`,
    reads back `glassbox.json`, asserts it deep-equals the pure function, is plain
    serializable JSON (every field a string — no Date objects / functions), default-
    deny still holds at the serialization boundary, and `render-glassbox` is the
    first registered generator (wired into `pnpm build`).
  - **No-network (FR-33):** extends the source-scan guard to
    `content/glassbox.allowlist.ts`.

### Dev-authored (verified rigorous, retained as-is)

- [x] `scripts/render-glassbox.test.ts` — 23 tests: allowlist slug coverage, no-leak
  (body + path), contract (unique slug / non-empty body / ISO-8601 date / type-in-
  union), two-call determinism, fail-loud on missing file (throws + message names
  the file), source-level no-network / no-nondeterminism guard.
- [x] `scripts/build-content.test.ts` — registry-count assertions updated 0→1
  (`render-glassbox` registered as the first generator).

## Mutation verification (the default-deny suite is NOT vacuous)

Poisoned the allowlist with a real `.decision-log.md` entry → **exactly 3 security
tests failed** as designed (NEGATIVE identity, corpus sweep, serialization
boundary). Reverted the allowlist, regenerated `glassbox.json` from the clean
source, and confirmed the working tree is clean. This proves the suite genuinely
fails on a leak rather than passing for the wrong reason.

## Coverage (Story 2.1 ACs)

| AC | Covered by | Status |
|----|-----------|--------|
| AC1 — one default-deny allowlist, single source of truth | structural `render ⊆ allowlist` + dev slug-coverage | ✅ |
| AC2 — deterministic render, git-committer date | git-date equality + byte-stable build (sha256 ×2) + dev two-call deep-equal | ✅ |
| AC3 — default-deny never-render set cannot leak | NEGATIVE + POSITIVE CONTROL + SWEEP + STRUCTURAL (mutation-verified) | ✅ |
| AC4 — fail-loud on missing/unreadable sourceFile | dev throw tests | ✅ |
| AC5 — data contract (unique slug, non-empty body, ISO-8601 date, type-in-union) | dev contract tests + generator serializable-JSON test | ✅ |
| FR-33 — no network | source-scan guards on `render-glassbox.ts` (dev) + `glassbox.allowlist.ts` (QA) | ✅ |
| NFR-6 — byte-identical at same git state | generator byte-stability (sha256) + git-date mechanism | ✅ |

## Verification (all run, all pass)

- `pnpm --filter @portfolio/scripts test` → **6 files, 71 tests passed** (was 5/57;
  +1 file / +14 tests). The new file is discoverable by the scripts vitest config
  (`include: ['**/*.test.ts']`) and runs under root `pnpm test` / `test:all` →
  **Rule 8 satisfied**.
- `pnpm --filter web test` → **11 files, 268 tests passed** (unaffected — QA work is
  scripts-only).
- Determinism: `glassbox.json` sha256 identical across two generator runs (NFR-6).
- API package test (`EADDRINUSE: 8787`) intentionally NOT gated — environmental
  (deployed `portfolio-api` owns the port), tracked in `deferred-work.md`, unrelated
  to Story 2.1 (which touches no api code).

## Next Steps

- Stories 2.2/2.3 add the browser/Playwright real-runtime tier when the Glass Box
  pages consume this reader data (the consumer side of Rule 1 / Rule 3).

---

# Test Automation Summary — Story 2.3 (Glass Box index — curated chronological build-story)

QA stage of `/epic-cycle`. Story 2.3 is a **user-facing surface** (`/glass-box`) →
**Rule 3 real-runtime is REQUIRED** and satisfied (Playwright DOM + computed-style +
axe AA + JS-off). The dev shipped tests; QA verified non-vacuousness, proved the
narrowed flat-system guard still has teeth, and strengthened four adversarial gaps.

## Dev tests verified (baseline, all passing)

- `web/test/glassbox-index.test.ts` — build-output (vitest), 23 → **25** assertions.
- `web/e2e/glassbox-index.spec.ts` — real-runtime (Playwright), 19 → **25** tests.
- `web/playwright.config.ts` — `glassbox-index` project (`testMatch /glassbox-index\.spec\.ts/`).
  Discoverable (Rule 8): vitest globs `test/**/*.test.ts`; Playwright `testDir ./e2e` + project.
- `web/test/build-output.test.ts` — flat-system "no box-shadow" assertion narrowed to
  exempt the spec-verbatim `timeline-dot` halo.

## Box-shadow guard — adversarial teeth check (the directive's key concern)

The dev replaced `expect(builtCss).not.toMatch(/box-shadow:/)` with a per-block parse
that exempts any CSS block containing `timeline-dot`. **Verified the narrowing is NOT
too broad:** injected `box-shadow: 0 2px 8px rgba(0,0,0,.2)` onto `.artifact-card` (a
non-dot content surface), rebuilt, ran the single test → it **FAILED** with the exact
violating block (`.artifact-card[data-astro-cid-…]{…box-shadow:…}`). Reverted; test
passes again. The flat-system guard still has teeth for cards/panels/any non-dot
surface — the exemption is correctly scoped (Astro keeps the literal `timeline-dot`
class in the scoped selector, and a non-dot block does not contain that substring).

## Gaps strengthened (QA-added, all non-vacuous — each proven to fail on regression)

1. **Live-dot static halo — computed style + NO animation (NFR-2).** Dev test asserted
   only `toBeVisible()`/count. Added 3 Playwright tests on the real computed style:
   the halo is a non-`none` `4px rgba(30,58,95,0.16)` box-shadow; `animationName ===
   'none'` + zero animation/transition duration; stays static under
   `prefers-reduced-motion`. **Teeth proven:** injected `animation: pulse 2s infinite`
   on `.timeline-dot--live` → the two no-animation tests FAILED (`animationName`
   received `"pulse"`); reverted.
2. **Data CONSUMED, not hardcoded (AC1/AC5).** Added 2 vitest assertions that read the
   real `glassbox.json` at test time and require every artifact's exact title +
   machine `datetime` + type chip to appear in the rendered index, and that the full
   rendered link order equals the JSON date-sorted order (deterministic across the
   three 06-02 ties + two 06-06 ties). A hardcoded/ drifted title or a mis-sort fails.
   (Manifest stores only slugs — titles/dates can only come from the data.)
3. **WCAG 1.4.1 — dots decorative, status in text (AC2/AC6).** Added 3 Playwright
   tests: every `.timeline-dot` carries `aria-hidden="true"` (≥10 dots; not a
   color-only status carrier); the shipping status is in the `Live · in progress` pill
   text and the pill is NOT aria-hidden; each ghost status is the `As it accrues` text
   and NOT aria-hidden — proving meaning lives in the a11y tree, never color/shape alone.
4. **Component-reuse contract for Story 2.4 (Consumed-by).** New file
   `web/test/glassbox-components.component.test.ts` — 12 isolated Astro Container-API
   render tests covering EVERY `TimelineDot` state (resting/filled/live/upcoming +
   default) and EVERY `ArtifactCard` variant (default Read-link, ghost no-link, live
   pill, external `rel="noopener noreferrer"` + "View →", 0-JS, no `!`). Exercises
   states the index does not use (`resting`) so a 2.4-only regression is caught now.

## Generated / modified test files

- [x] `web/test/glassbox-components.component.test.ts` — NEW (12 tests, Container API).
- [x] `web/e2e/glassbox-index.spec.ts` — +6 tests (live-halo computed style ×3; WCAG
  1.4.1 decorative ×3).
- [x] `web/test/glassbox-index.test.ts` — +2 tests (data-consumed; full date-order).

## Real counts (`pnpm --filter web ...`; the `EADDRINUSE:8787` live-api issue avoided by the web filter)

- `pnpm --filter web test` → **14 files, 445 tests passed** (was 13/431; +1 file /+14).
- `pnpm --filter web test:e2e` → **106 tests passed** across all projects (was 100;
  +6 in `glassbox-index`). Includes the index axe AA (0 violations) + JS-off pass.
- `glassbox-index` project in isolation → **25/25**. Full build emits **16 pages**
  incl. all 6 `/glass-box/{slug}/` readers (AC5 no-404 verified by real navigation).
- ESLint + Prettier clean on all three test files.

## Coverage vs ACs

- AC1 (spine of Dots + cards) ✓ · AC2 (launch set + ghost; status in text+shape) ✓
- AC3 (recursion beat verbatim; `/timeline/` cross-link; 0 `!`) ✓ · AC4 (JS-off `<ol>`) ✓
- AC5 (data consumed; readers resolve; chronological order) ✓ · AC6 (one h1; axe AA;
  AA-safe ink-ghost) ✓ · NFR-1 (0-JS) ✓ · NFR-2 (static halo, reduced-motion) ✓.

## Notes for code review

- The narrowed box-shadow guard is sound (teeth verified). No action needed; the
  exemption is scoped to `timeline-dot` blocks only.
- Minor (non-blocking): the index uses `<h2>` "Build Story" inside `MirrorLayout`;
  heading order is h1 → h2 → h3 (cards) — clean, asserted by the one-h1 + h3-card tests.
