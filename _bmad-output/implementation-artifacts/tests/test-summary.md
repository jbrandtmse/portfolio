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

---

# Story 2.5 — `/work/loandemo` flagship case study (QA)

QA stage for the loandemo flagship case study (FR-22). The dev shipped 19 build-output
assertions + a 19-test Playwright `loandemo` project + the `loandemo` config project.
QA verified all are non-vacuous (computed-style/observable-DOM, not existence-only) and
ADVERSARIALLY strengthened three gaps the dev tests left open.

## Strengthening added (QA)

1. **AC5 cross-story reciprocity (the key consumer wire-up).** The dev + `timeline.spec.ts`
   each asserted the loandemo fragment IDs exist HERE and the Dot links exist on `/timeline/`
   — but nothing bound the two. Added (a) a build-output test that reads the BUILT
   `/timeline/index.html`, extracts every `/work/loandemo/#…` href it actually ships, and
   asserts each fragment resolves to a real element `id` on the loandemo page (no dangling
   fragment; also asserts the 3 canonical `code`/`build`/`retro` are present); and (b) a
   real-runtime Playwright test that starts on `/timeline/`, follows each loandemo Dot href,
   and asserts the peer lands on a real VISIBLE in-page section. Integration AC (Rule 1):
   consumer (timeline) → producer (this page) verified observably, both tiers.
2. **AC3 no-fabrication (the 2.4 AC4 credibility lesson, HIGH-value).** The dev's `[OPEN`-present
   check is weak (passes even if a fabricated outcome ships alongside). Added an adversarial
   build-output scan of the visible `<main>` text (tags + `<head>` ld+json stripped) that FAILS
   on any fabricated-OUTCOME numeric pattern (`N%`, `$N`, `Nx`, `N users/ms/loans…`, `N faster`)
   not wrapped in an `[OPEN]`/`[ASSUMPTION]` flag. Manual scan confirmed clean: the only
   numerics in the body are `Stage-1`, `FR-22`, `2026` (talk year), `Epic 3` — none a metric.
3. **AC6 heading hierarchy.** The dev asserted the fragment IDs are on `<section>`s but not the
   heading LEVEL. Added a test binding each `#code`/`#build`/`#retro` section's first heading to
   `<h2>` and asserting no `<h1>` inside any section (clean hierarchy + one-h1 SEO floor).

## Non-vacuity proof (mutation test)

Temporarily mutated `loandemo.astro`: (A) injected "processed loans 40% faster" into a body
paragraph, (B) renamed `<section id="code">` → `id="repository"`. Rebuilt and confirmed the new
AC3 scan FAILED on (A), the AC5 reciprocity test FAILED on (B) (dangling fragment caught), and
the AC6 hierarchy test FAILED too. Reverted; `loandemo.astro` is byte-clean (dev's version
untouched). The strengthening assertions have teeth.

## Generated / modified test files

- [x] `web/test/build-output.test.ts` — +3 QA assertions (AC5 reciprocity, AC3 no-fabrication,
  AC6 h2-hierarchy) on top of the dev's 19 Story-2.5 assertions.
- [x] `web/e2e/loandemo.spec.ts` — +1 QA test (cross-page timeline→loandemo reciprocity journey)
  on top of the dev's 19.

## Real counts (`pnpm --filter web …`; `EADDRINUSE:8787` is a live-api env issue, avoided by the web filter)

- `pnpm --filter web test` → **15 files, 506 tests passed** (was 503; +3 QA assertions).
- `pnpm --filter web test:e2e` (full default suite, all projects) → **151 passed** (was 131
  pre-2.5; +20 = 19 dev + 1 QA). `loandemo` project in isolation → **20/20**; `timeline`
  regression → **25/25**. Build emits **16 pages**. Includes loandemo axe AA (0 violations).
- Root `pnpm format:check` (`prettier --check .`) → **GREEN** (2.2–2.4 format-gate gap avoided).
- `loandemo` project confirmed in the DEFAULT `test:e2e` run (Rule 8 discoverability ✓).

## Coverage vs ACs

- AC1 (layered, answer-first lede, one-h1, 0-JS, self-canonical, enriched CreativeWork
  no-`[PLACEHOLDER]` + ISO `dateCreated`) ✓ · AC2 (`#code/#build/#retro` sections; drop-cap +
  pull-quote, computed-style non-vacuous; `/speaking/` forward-ref link) ✓ · AC3 (curated
  substitutes + `[OPEN]`; NO fabricated metric — adversarial scan) ✓ · AC4 (Glass Box +
  Timeline cross-links; both flagships reference each other) ✓ · AC5 (fragment IDs exist AND
  the 2.4 timeline Dots resolve here — reciprocity, both tiers; CreativeWork consumer-valid) ✓ ·
  AC6 (one h1; section headings h2/h3; axe AA 0 violations; keyboard focus ring) ✓ · NFR-1
  (0 executable scripts) ✓.

## Notes for code review

- No defects found in the dev's implementation. The page holds the AC3 credibility floor
  cleanly (method-only narrative; every asset gap `[OPEN]`-flagged; zero fabricated figures).
- Rule 3 (real-runtime, user-facing surface): SATISFIED — `loandemo.spec.ts` asserts observable
  DOM + computed style (drop-cap `::first-letter` ratio, pull-quote border/italic, axe AA,
  fragment-anchor visibility, cross-page reciprocity), not existence-only.
- The CreativeWork `dateCreated: "2026-06-01"` is a curated deterministic constant (the exact
  date is `[OPEN]`; the era `2026-06` is confirmed from `dots.ts`) — valid ISO, keeps the 1.6
  assertion green. Not a fabricated factual claim; acceptable per the dev's documented rationale.

---

# Story 2.6 — Project Import & `/bmad-correct-course` extension path (QA)

Process/tooling/doc story. Deliverables: `docs/project-import.md` (the documented Project Import
path), a `content/README.md` pointer, and `scripts/project-import.test.ts` (the mechanism test).
No new browser surface.

## Rule 3 EXEMPTION (confirmed)

This story ships documentation + a mechanism-validation test, NOT a user-facing browser surface.
Per skill-rules Rule 3, the browser/Playwright tier is EXEMPT — and the exemption is noted, not
silently skipped (the test file carries an explicit Rule 3 EXEMPTION NOTE). The **real-runtime
tier** here is the CLI/library tier: the mechanism test invokes the REAL `renderGlassbox()` /
`renderTimeline()` and asserts on their output. No HIGH is filed for "no browser test."

## What I scrutinized / strengthened (adversarial)

1. **AC2/AC4 mechanism is GENUINELY data-driven (non-vacuity = the core proof).** Mutation-tested
   BOTH render functions against the dev's test:
   - Mutated `renderGlassbox` to ignore its `allowlist` arg (return `[]`) → **3 tests FAILED**
     (flow-through, ISO-date, data-driven parameterization). Reverted byte-clean.
   - Mutated `renderTimeline` to ignore its `eras` arg (always serialize the live `TIMELINE_ERAS`)
     → the **flow-through test FAILED** (`expected length 1 but got 2`). Reverted byte-clean.
   Conclusion: the test reads the REAL render functions and the sample genuinely flows input →
   output. Not vacuous, not a restatement of the input.
2. **Explicit render-level negative controls added (a project NOT added does NOT appear).** The
   dev's no-pollution tests rely on the live manifest's current contents. I added 2 purer
   negative controls: feed each render a NON-EMPTY decoy input that lacks the sample → assert the
   sample is absent AND the decoy (which WAS in the input) is present (render is honest, not
   trivially empty). Independent of the live manifests.
3. **No-live-pollution — verified from a fresh build, not just in-test.** Ran `pnpm build` and
   scanned the generated `web/src/generated/glassbox.json` + `timeline.json`: contain exactly the
   6 real Glass Box artifacts and the real runway ticks + 2 real flagships (`loandemo`,
   `This portfolio`). Grep for `sample-project-import-fixture` / `Sample Project (test fixture)` /
   `decoy` / `sample-project-artifact` in the generated output → **CLEAN, zero matches.** The live
   site still has exactly its real projects.
4. **Doc-accuracy guard added (AC1/AC3 — a doc can rot).** New `it.each` asserts every repo path
   `docs/project-import.md` instructs the reader to wire/run exists on disk AND is mentioned in
   the doc: `content/kb`, `content/timeline/dots.ts`, `content/glassbox.allowlist.ts`,
   `content/README.md`, `scripts/render-glassbox.ts`, `scripts/render-timeline.ts`,
   `scripts/build-content.ts`, `scripts/deploy.sh`, `docs/launch-checklist.md`. Non-vacuity
   confirmed: a bogus path yields `false` for both `includes` and `existsSync` (the guard has
   teeth). Manually verified the doc's deploy flow matches `scripts/deploy.sh` step-for-step
   (`git pull --ff-only` → `pnpm install --frozen-lockfile` → `pnpm --filter api build` →
   `pnpm build` → `systemctl restart portfolio-api` → `nginx -t`/reload) and `pnpm build` =
   `tsx scripts/build-content.ts && pnpm --filter web build`. (The doc's `scripts/build-kb-index.ts`
   reference is an Epic-4/Story-4.1 forward-reference the doc explicitly labels future — excluded
   from the existence guard by design, not a doc-rot defect.)
5. **KB forward-ref not over-claimed (AC2 forward-ref).** Added 2 assertions that the doc names the
   Epic-4 / Story-4.1 KB step and uses "agent-retrievable" framing, and frames the model as
   `/bmad-correct-course` + "no CMS/admin" (FR-33/FR-34). The doc states KB files are "NOT rendered
   directly to any page today (that is Epic 4 / Story 4.1)" — retrieval is NOT claimed to work now.
6. **Determinism (AC2 / NFR-6).** The dev asserts a deep-equal second render for both functions;
   `pnpm check-deterministic` PASS — two clean builds byte-identical (tree hash `a66a0a67…`).

## Generated / modified test files

- [x] `scripts/project-import.test.ts` — +14 QA tests (2 render-level negative controls;
  9-path doc-existence `it.each`; +3 doc-framing assertions: KB-forward-ref honesty,
  `/bmad-correct-course` no-CMS) on top of the dev's 11 mechanism tests → **25 tests** in the file.

## Real counts (`EADDRINUSE:8787` is a live-api env issue, avoided by package-filtered runs)

- `pnpm --filter @portfolio/scripts test` → **8 files, 107 tests passed** (was 93; +14 QA).
  The `project-import.test.ts` file alone → **25/25**.
- `pnpm --filter web test` → **15 files, 506 tests passed** (no regression; this story adds no
  web tests).
- `pnpm build` → green, 16 pages. `pnpm check-deterministic` → **PASS** (byte-identical, tree
  hash `a66a0a67…`). Generated output **unpolluted** by the fixture (verified by grep).
- Root `pnpm format:check` → **GREEN** (the test file was Prettier-fixed via `pnpm format`;
  `docs/` is `.prettierignore`d so the doc itself is not format-gated). `pnpm typecheck` → 0
  errors (all packages). `pnpm lint` → 0 violations.
- Rule 8 discoverability ✓ — `scripts/project-import.test.ts` matches the scripts vitest
  `include: ['**/*.test.ts']`, runs under `pnpm --filter @portfolio/scripts test`, part of root
  `test`/`test:all`.

## Coverage vs ACs

- AC1 (doc exists, linked from `content/README.md`, names the 3 wiring points + deterministic
  build + `deploy.sh`) ✓ — doc + README read; doc-existence guard added · AC2 (sample flows
  through real `renderGlassbox()`/`renderTimeline()` → Glass Box artifact + timeline Dot;
  deterministic; no live pollution; KB validated in Epic 4) ✓ — mutation-proven non-vacuous +
  fresh-build pollution scan · AC3 (`/bmad-correct-course` engineering flow, no CMS/admin/runtime
  reads) ✓ — doc-framing assertions added · AC4 (Integration: producer doc → consumer render
  pipeline real, not aspirational; deterministic second run) ✓ — negative controls + determinism.

## Notes for code review

- No defects found in the dev's implementation. The mechanism test is genuinely data-driven
  (mutation-confirmed both directions), does NOT pollute the live manifests (fresh-build grep
  clean), and the doc's referenced paths + deploy flow are accurate against the real files.
- Rule 3 EXEMPT (process/tooling/doc, not a browser surface) — noted in the test file and here;
  the real-runtime tier is the actual `renderGlassbox()`/`renderTimeline()` invocations. Do NOT
  file a HIGH for "no browser test."
- The QA additions are pure test/guard code in `scripts/` (Prettier-clean); no production code,
  no `content/` manifest, and no render function was changed (both render files are byte-clean).
