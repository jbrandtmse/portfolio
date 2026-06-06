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
