# Test Automation Summary — Story 7.0 (Epic 6 Deferred Cleanup)

QA stage of `/epic-cycle`. Verified FRESH per Rule 10 (dev self-report treated as
unreliable). Story 7.0 is a config/spec-reconciliation + regression-test-lock cleanup
(server-side constant + planning-doc prose + one vitest test). **No new user-facing browser
surface** → a Playwright browser e2e is NOT applicable. QA value = mutation-verifying the
dev's regression test is non-vacuous, confirming AC1 spec reconciliation is complete, AC2
discoverability, and AC3 no-regression.

## Verified Tests (existing dev deliverable — NOT vacuous)

### Regression test (Rule 8) — `api/src/routes/guide.config.test.ts` (2 tests)
- [x] `LLM_CEILING_MS equals 15_000` — binds the **REAL** `export const LLM_CEILING_MS`
      via direct named import from `guide.ts` (not an inline copy of `15000`).
- [x] `default GUIDE_LLM_MODEL is claude-haiku-4-5-20251001` — reads the **REAL** parsed
      env-schema default via child-process execution of the real `env.ts` (mirrors
      `env.realmodule.test.ts`), explicitly UNSETting `GUIDE_LLM_MODEL` so the schema
      default is exercised (NOT the `api/.env` value, which happens to equal the default).

### Mutation verification (QA-performed; all reverted byte-clean)
- [x] **Mutation A** — `LLM_CEILING_MS` 15_000 → 10_000 in `guide.ts` ⇒ test 1 RED
      (`expected 10000 to be 15000`). Reverted; `guide.ts` diff vs HEAD = dev's two
      intended changes only.
- [x] **Mutation B** — `GUIDE_LLM_MODEL` default → `'gpt-5-mini'` in `env.ts` ⇒ test 2 RED
      (`expected 'gpt-5-mini' to be 'claude-haiku-4-5-20251001'`). Reverted; `env.ts` diff
      vs HEAD = EMPTY (dev correctly did not modify env.ts).
- [x] **Vacuity guard (implicit in Mutation B)** — Mutation B proved the child returned the
      *schema* default (`gpt-5-mini`), NOT the `.env` value (`claude-haiku-4-5-20251001`),
      confirming the `GUIDE_LLM_MODEL: undefined` override genuinely isolates the schema
      default. Without the override the test would pass for the WRONG reason.

## AC verification

- **AC1 (spec↔code reconciled, Rule 5):** the 4 named references read "~15s" —
  `epics.md:99`, `epics.md:795`, `architecture.md:77`, `architecture.md:282` (line shifted
  281→282 from the edit). Value agrees with `LLM_CEILING_MS = 15_000`. TTFT (<~1.5s) +
  retrieval (<~200ms) unchanged. The two remaining "~10s" hits
  (`prd-portfolio-2026-06-02/prd.md:422`, `implementation-readiness-report-2026-06-05.md:94`)
  are **dated frozen snapshot artifacts** (git: only their original creation commit; dated
  dir names) — correctly preserving the value as-of-date; out of the story's live-spec scope.
  COMPLETE.
- **AC2 (discoverable, runs, not skipped):** matches the api package's default
  `include: ['src/**/*.test.ts']`; appears in `vitest list`; ran (2/2 passed); no `.skip`.
- **AC3 (no regression; NFR-5):** `GUIDE_LLM_MODEL` default unchanged; `guide.test.ts:467`
  ceiling-branch test still passes (api suite 13 files / 221 tests, 0 skipped);
  `check-deterministic` PASS (web/dist byte-identical, two builds same tree hash) → no
  bundle/key/model leak.

## Canonical gate (Rule 14 — captured exit codes)

- `pnpm run check-deterministic` → **exit 0** (PASS, byte-identical; tree hash
  `1a39ff34…` both builds).
- `pnpm run test:all` → run 1 **exit 1** — single failure `guide-panel.spec.ts:402`
  ("focus is NOT trapped") `toBeFocused` 5s timeout under parallel load. Confirmed a
  **pre-existing FLAKY focus-timing race, unrelated to Story 7.0** (zero `web/` changes in
  the diff; `web/dist` byte-identical): isolated re-run PASSED (919ms). Full-gate **re-run →
  exit 0** (340 e2e passed, flake did not recur; typecheck 0 errors; unit scripts 184 / api
  221 / web 754; lh "All results processed"). Clean green attestation obtained.

## No new tests authored
The dev's `guide.config.test.ts` already covered both load-bearing assertions correctly and
non-vacuously (mutation-verified). No hardening was required.
