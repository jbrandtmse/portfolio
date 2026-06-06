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
