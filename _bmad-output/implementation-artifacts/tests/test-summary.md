# Test Automation Summary — Story 6.0 (Epic-5 deferred cleanup / Rule-12 mechanical guard)

QA stage of `/epic-cycle`. Story 6.0 enables `react-hooks/exhaustive-deps` +
`react-hooks/rules-of-hooks` as hard ERRORs scoped to the React `.tsx` islands
(`web/src/islands/**`). This is a lint-config cleanup story — no new product
UI surface — so NO browser/Playwright e2e was generated (a vacuous e2e against a
non-existent surface would violate the project's anti-vacuous-test rules). The
verification is the canonical gate + the AC3 mutation proof, plus ONE durable
config-assertion regression guard.

## Fresh verification (project Rule 10 — independently reproduced, not trusted)

- **AC1** — `eslint --print-config` on each of the four islands shows both
  `react-hooks/exhaustive-deps` and `react-hooks/rules-of-hooks` at severity
  `2` (error). `eslint-plugin-react-hooks ^7.1.1` is a root devDependency; the
  lockfile resolves it (3 references).
- **AC1 scope** — the rules are ABSENT on non-island surfaces (`.astro`, the
  Node/api service, the eslint config itself, non-island web `.ts`). The guard
  is islands-only; no repo-wide noise.
- **AC2** — `pnpm run lint` (root `eslint .`) exits 0; the four existing islands
  are clean (0 react-hooks violations) — the Epic-5 fixes hold, the dev needed
  no island code change.
- **AC3 (mutation, both rules)** — reproduced independently:
  - dropped `currentDepth` from `GuidePanel.sendQuery`'s `useCallback` deps (the
    5.2 bug) → `pnpm run lint` failed exit 1 with
    `react-hooks/exhaustive-deps … missing dependency: 'currentDepth'` at 406:5;
    reverted → green, no residual diff.
  - made a `useEffect` conditional in `GuidePill.tsx` → `pnpm run lint` failed
    exit 1 with `react-hooks/rules-of-hooks … called conditionally`; reverted →
    green, no residual diff.
- **AC4 (canonical gate, Rule 5)** — `pnpm test:all` run verbatim:
  typecheck (0 errors) → lint (0) → format:check (all files, incl. the new test)
  → test (api 219 + web 678 pass) → test:e2e (278 pass, 1 long-standing skip) →
  lh (all assertions pass). `pnpm run check-deterministic` PASS — `web/dist`
  byte-identical across two clean builds (lint/test change did not touch dist).

## Generated Tests

### Config-assertion regression guard (non-vacuous, Rule 8)

- [x] `web/test/eslint-react-hooks-config.test.ts` — 7 tests. Binds the REAL
  resolved ESLint config via `eslint --print-config` (run with cwd = repo root,
  same as `eslint .`):
  - 4 island tests assert both react-hooks rules resolve to error (severity 2)
    for each existing island; the islands glob auto-covers Epic-6's new islands.
  - 3 scope-guard tests assert the rules are absent for representative
    non-island files (`.astro`, an api test, the eslint config).
  - Discoverable by the default `vitest run` suite (`test/**/*.test.ts`),
    confirmed via `vitest list` (7 tests collected); prettier-clean.
  - Mutation-verified to RED: (A) downgrade exhaustive-deps→warn ⇒ 4 island
    tests red; (B) remove rules-of-hooks ⇒ 4 island tests red; (C) widen glob to
    `.astro` ⇒ 1 scope test red. Restored config ⇒ all 7 green.

## Coverage

- Lint-config guard: AC1/AC2/AC3/AC4 fully verified fresh; the bug class
  (stale-closure omitted dep) and the rules-of-hooks class both proven to red.
- No new product behavior to e2e (lint-config + dependency-array-correctness
  change only); existing depth-dial / recuration stale-closure e2e remain green.

## Next Steps

- Lead per-story smoke gate, then commit (QA leaves all changes uncommitted).
