---
baseline_commit: aff6049b4404efcf5e25a1806f6fbdfc6002f952
---

# Story 1.8: Build-time content pipeline foundation

Status: done

<!-- Epic 1, Story 1.8. Builds on 1.1–1.7. Establishes the scripts/ build-time content pipeline that `pnpm build` runs (deterministically, from content/ + the repo, no external reads), with extension hooks for the Epic-4 KB index and Epic-2 Glass Box render. Non-user-facing build infrastructure (Rule 3 exempt). Code-as-CMS (FR-33, NFR-6). -->

## Story

As Josh, the builder,
I want the site to deterministically generate itself from the git repo at build time with no CMS and no runtime external reads,
so that the site is maintainable as code and never depends on a live third party (FR-33, NFR-6).

## Acceptance Criteria

1. **Given** a `scripts/` build pipeline **When** `pnpm build` runs **Then** it produces the prerendered Static Mirror (`astro build` → `web/dist/`) deterministically from `content/` + the repo, and exposes extension points for the KB index (Epic 4) and Glass Box data (Epic 2) without requiring them to exist yet **And** no admin/CMS surface exists and the build performs no reads from GitHub/YouTube/Suno.

2. **Given** the same inputs **When** the build runs twice **Then** the output is byte-stable (deterministic), confirming code-as-CMS reproducibility.

## Integration ACs

*(Rule 1 — introduces the `scripts/` content-pipeline module; consumer = `pnpm build`; future consumers = Epic 2/4 generators.)*

- **IAC-1 (`pnpm build` runs the pipeline → Static Mirror):** Root `pnpm build` invokes the content pipeline (`scripts/`) and then `astro build`, producing `web/dist/` with all 10 Mirror routes + sitemap + robots. Verifiable: `pnpm build` exits 0 and `web/dist/index.html` (+ the other routes) are produced; the pipeline step runs (observable in its log output) and reads only `content/` + the repo (no network).
- **IAC-2 (byte-stable determinism, AC2):** Running `pnpm build` twice from a clean state yields a **byte-identical** `web/dist/` (verifiable by hashing the tree both times — e.g. `find web/dist -type f -exec sha256sum` sorted, identical). No `Date.now()`/`Math.random()`/wall-clock in the pipeline or the build inputs.
- **`scripts/` has NO functional content consumer yet** (the KB index is Epic 4, the Glass Box render is Epic 2). This story ships the orchestrator + documented extension hooks (stubs/no-ops with `TODO(Epic 2/4)` markers); the first real generators land in **Story 2.1** (Glass Box render) and **Story 4.1** (KB index). Per Rule 1, this is the explicit "no consumers yet" declaration.

## Consumed-by

- **The content pipeline (`scripts/`):** consumed by `pnpm build` now; the extension hooks are consumed by Epic 2 (`render-glassbox`) and Epic 4 (`build-kb-index`), and the deploy script (Story 1.10) calls `pnpm build`.
- **`content/`** (source-of-truth dir): the KB markdown (Epic 4), the publish allowlist (Epic 2, AR-13), the Timeline dots manifest (Epic 2) all live here.

## Tasks / Subtasks

- [x] **Task 1 — `scripts/` content-pipeline orchestrator (AC: 1)**
  - [x] Create `scripts/build-content.ts` (run via `tsx`, matching the architecture's `.ts` scripts convention) — a documented orchestrator that runs an ordered list/registry of content **generators**, each reading only from `content/` + the repo and writing deterministic outputs. The registry is EMPTY/stubbed now, with clearly-marked extension hooks: `// TODO(Story 2.1): render-glassbox generator (AR-13 allowlist → Glass Box data)` and `// TODO(Story 4.1): build-kb-index generator (content/kb/*.md → Orama index)`.
  - [x] The orchestrator logs what it runs (so the build is observable) and is a **no-op-safe** foundation (runs clean with zero generators). It MUST perform no network reads (no GitHub/YouTube/Suno/fetch). Document this constraint in the file.
  - [x] Keep it deterministic: NO `Date.now()`/`Math.random()`/`new Date()` affecting output; if a timestamp is ever needed, derive it from git (like 1.6 lastmod).
- [x] **Task 2 — `content/` source-of-truth dir (AC: 1)**
  - [x] Create `content/` with a `content/README.md` explaining code-as-CMS (the curated source of truth; KB markdown, allowlist, timeline dots land here in Epics 2/4; no CMS/admin surface; no runtime external reads). Optionally a `.gitkeep`'d structure (`content/kb/`) if helpful — but do NOT pre-create Epic-2/4 content.
- [x] **Task 3 — Wire `pnpm build` (AC: 1)**
  - [x] Make root `pnpm build` run the pipeline THEN the web build: e.g. root `build` = `tsx scripts/build-content.ts && pnpm --filter web build` (or a documented equivalent). Ensure `web`'s own `build` (astro build) still works standalone for the smoke/preview flow. Confirm the pipeline runs as part of `pnpm build`.
- [x] **Task 4 — Determinism + no-CMS/no-external (AC: 1, 2 / IAC-2)**
  - [x] Verify NO admin/CMS surface exists (there is none — assert/document; the site is pure static + the later api). Verify the pipeline + build do NO external reads (grep the pipeline for `fetch`/network; document the guarantee).
  - [x] Verify byte-stable: run `pnpm build` twice from clean and confirm `web/dist/` is byte-identical (hash the file tree both times). Add a small `scripts/check-deterministic.ts` (or a documented command) that builds twice and diffs the dist hashes, usable by CI/the smoke.
- [x] **Task 5 — Tests (AC: all)**
  - [x] Add a focused test: a unit test for the orchestrator (runs clean with the empty registry; performs no network; is deterministic) AND/OR a determinism assertion. A FULL build-twice-diff is heavy for the default unit suite — if you add it to the suite, keep it tagged/fast or assert at the pipeline level; the FULL dist byte-stability is also the lead's smoke gate + a documented CI step. Keep tests discoverable (Rule 8).
  - [x] `pnpm -r typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test`, `pnpm build` exit 0.
- [x] **Task 6 — Self-check vs ACs + architecture.**

## Dev Notes

### Authoritative sources

- architecture.md §AR-9 (build-time content pipeline: KB index + Static Mirror data + Glass Box render + JSON-LD/sitemap/robots, deterministic from real artifacts), §Infrastructure-Deployment (`pnpm build` runs the content pipeline + astro build), §Complete-Project-Directory-Structure (`scripts/build-kb-index.ts`, `scripts/render-glassbox.ts`, `content/`). FR-33 (single git source of truth; build-time generation; no CMS; no runtime external reads), NFR-6 (maintainability; deterministic regeneration).

### What this story delivers (the FOUNDATION, not the generators)

- The Static Mirror itself is already produced by `astro build` (routes from 1.5); sitemap/robots/JSON-LD are already generated (1.6). This story does NOT add new rendered content — it establishes the **pipeline scaffold**: the `scripts/` orchestrator + `content/` dir + the `pnpm build` wiring + the determinism guarantee + the extension hooks. The real generators (Glass Box render → Story 2.1; KB index → Story 4.1) plug into the hooks later.
- Determinism is the headline AC (IAC-2): `pnpm build` twice → byte-identical `web/dist/`. Astro's content-hashed assets are deterministic; 1.6's sitemap lastmod is git-based (deterministic). Ensure the new pipeline adds NO nondeterminism.

### Determinism guardrails

- No `Date.now()`/`Math.random()`/argless `new Date()` in the pipeline or any generator. Sort any directory/glob enumeration (filesystem order is not guaranteed). Derive any needed timestamp from git (per 1.6 `lastmod.ts`). The check: hash `web/dist` twice → identical.

### Project Structure Notes

- New: `scripts/build-content.ts`, `scripts/check-deterministic.ts` (or a documented command), `content/README.md` (+ optional `content/.gitkeep`/`content/kb/.gitkeep`). Modify: root `package.json` (`build` script wiring; add `tsx` to root devDeps if not resolvable from root), and a determinism test.
- Reuse 1.6's git-based determinism pattern. Do NOT build the KB index (Epic 4), Glass Box render (Epic 2), the allowlist (Epic 2 AR-13), or the timeline dots (Epic 2) — only the hooks/dir.
- `web/dist` and `api/data` remain gitignored. The pipeline writes generated data to gitignored locations (e.g. `api/data/` for the future KB index) — establish the convention; nothing generated is committed.
- No ADR registry (`docs/adr/` absent) → Rule 6 no-op. Non-user-facing build infra → Rule 3 exempt (note it).

### Gotchas

- **Leave the working tree UNCOMMITTED** (lead commits after smoke). Suppress dev-story auto-commit.
- Root `pnpm build` must still produce the SAME `web/dist/` the prior stories' smokes used (don't break the existing build/preview). The pipeline step is additive (an empty-registry no-op now) — `pnpm build` output should be byte-identical to a plain `astro build` today (the pipeline generates nothing yet).
- Keep the determinism check runnable without committing build artifacts (build to dist, hash, rebuild, hash, compare — operate on the gitignored dist).
- The `pnpm build` wiring change affects how the lead smoke builds for ALL later stories — make it robust (the web build must still be invokable directly too).

### References

- [Source: epics.md#Story-1.8 — ACs verbatim]
- [Source: architecture.md#AR-9 + #Infrastructure-Deployment + #Complete-Project-Directory-Structure (scripts/, content/); FR-33; NFR-6]
- [Source: skill-rules.md#Rule-1 (no-consumers-yet declaration), #Rule-2; Rule-3 exemption (build infra)]
- [Previous: 1.5 routes + astro build; 1.6 sitemap.xml.ts/robots.txt.ts endpoints + git-based deterministic lastmod (lastmod.ts) + routes.ts registry; 1.7 footer/browse.]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (1M context) — `claude-opus-4-8[1m]` — via `/epic-cycle` dev-story stage.

### Debug Log References

- **Byte-stability false alarm (investigated, resolved):** an early hash comparison showed a 26-file `web/dist` vs the 18-file baseline. Root cause was a measurement artifact, NOT the pipeline: piping `pnpm build` through `head -12` closed the pipe (SIGPIPE) and interrupted `astro build` mid-prerender, leaving its internal `web/dist/.prerender/` staging dir behind. Re-running `pnpm build` to completion (no truncation) produces a clean 18-file dist with no `.prerender/`. Confirmed: two complete clean `pnpm build`s are byte-identical, and equal to the pre-pipeline plain-`astro build` baseline (`6304cfa6…`). Lesson: never pipe a real build through `head`/`tail`/early-exit consumers when asserting on its output tree.
- **eslint `no-undef` for `scripts/*.ts`:** typescript-eslint's recommended config disables `no-undef` for TS files (TS's own checker handles undefined refs), so `console`/`process` in the new scripts do NOT need Node globals added to `eslint.config.js`. The globals matter only for `tsc`, satisfied by the scripts package's `@types/node` + `"types": ["node"]`. No eslint config change was needed.

### Completion Notes List

Story 1.8 ships the build-time content-pipeline **foundation** (scaffold + determinism + extension hooks), not the generators (those are Story 2.1 / 4.1). Summary of what was actually implemented and verified:

- **Orchestrator (`scripts/build-content.ts`):** a documented `runPipeline()` over an ORDERED, currently-EMPTY `CONTENT_GENERATORS` registry with the two extension hooks marked verbatim (`TODO(Story 2.1): render-glassbox`, `TODO(Story 4.1): build-kb-index`). No-op-safe (logs start / 0-generators / complete and resolves with zero generators). Runnable as a CLI via `tsx` (the `isMain()` guard means importing it in tests does not execute it). Logs every step so the build is observable in `pnpm build` output. Hard constraints documented in-file: no network, no admin/CMS, deterministic (no `Date.now()`/`Math.random()`/argless `new Date()`; sort enumeration; git-derived timestamps per 1.6 `lastmod.ts`).
- **`content/` source-of-truth dir:** `content/README.md` (code-as-CMS doctrine, FR-33/NFR-6, what lands here in Epics 2/4, the gitignored-generated-output convention) + `content/kb/.gitkeep` (holds the future KB folder; no KB content pre-created).
- **`pnpm build` wiring:** root `build` = `tsx scripts/build-content.ts && pnpm --filter web build`. The pipeline runs FIRST (observable: `[content-pipeline] starting…`), then `astro build`. Added root devDep `tsx` (pnpm's isolated layout means only root devDeps populate root `.bin`; `tsx` previously lived only in `api/`). The web build still works standalone (`pnpm --filter web build`).
- **`scripts/` as a workspace package (`@portfolio/scripts`):** added to `pnpm-workspace.yaml` with its own `package.json` / `tsconfig.json` (NodeNext, `noEmit`, `@types/node`) / `vitest.config.ts`, matching the existing per-package convention. This makes the pipeline code covered by `pnpm -r typecheck` (now 4 of 5 projects) and `pnpm -r --if-present test` automatically — so the DoD gates genuinely exercise the new code.
- **Determinism check (`scripts/check-deterministic.ts`):** builds twice from clean and diffs a content-hash manifest of the whole `web/dist/` tree; exits 0 on byte-identical, 1 with a precise file diff otherwise. Usable by CI / the lead's smoke (`pnpm check-deterministic`). Intentionally a documented command, NOT a default unit test (it does two full builds); the cheap pure helpers (`treeHash`, `diffManifests`) ARE unit-tested.
- **Tests (discoverable, Rule 8):** `scripts/build-content.test.ts` (7) — empty registry, no-op-safe run, observable logging, runs the registry in order, surfaces a failing generator, and source-level no-nondeterminism / no-network guards. `scripts/check-deterministic.test.ts` (5) — order-independent/content-sensitive tree hash + precise diff. All under the package's `**/*.test.ts` glob, run by `pnpm -r test`.

**Verification (all from repo root):**
- DoD gates ALL exit 0: `pnpm -r typecheck` (4/5 projects incl. scripts), `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test` (scripts 19 + api 2 + web 206 = 227 — the scripts count is 19 once the QA stage's `pipeline-guards.test.ts` (7) is included; this line originally read "scripts 12 … = 220", written before the QA tests landed — corrected at code review), `pnpm build`.
- IAC-1: `pnpm build` runs the pipeline (log observed) then `astro build` → `web/dist/` with all 10 Mirror routes + `sitemap.xml` + `robots.txt`. Reads only `content/` + the repo (no network).
- IAC-2 / AC2: two clean `pnpm build`s → byte-identical `web/dist/` (tree hash `6304cfa6…`, both runs), AND byte-identical to the pre-pipeline plain-`astro build` baseline (the pipeline is a true additive no-op today). `pnpm check-deterministic` PASS, exit 0.
- No-CMS / no-external: grep across `web/src api/src scripts content` finds no admin/CMS/headless-CMS surface and no network primitive (`fetch`/http/https/axios/got/undici) in the pipeline — only the documented guarantee in `build-content.ts` and the tests asserting their absence. Standalone `pnpm --filter web build` and `pnpm --filter api build` both still work.

**Rule notes:**
- **Rule 1 (no-consumers-yet):** honored — the story's Integration ACs already declare it; the registry is empty and the first consumers are Story 2.1 / 4.1. Tests assert the registry IS empty.
- **Rule 3 (real-runtime evidence):** this is non-user-facing build infrastructure → EXEMPT. (Real-runtime evidence nonetheless exists: `check-deterministic.ts` + the existing `web/test/build-output.test.ts` exercise a real `astro build`; the orchestrator runs as a real CLI.)
- **Rule 5 (NFR tripwire):** none triggered — no NFR was found unmeasurable/contradictory; no planning-artifact amendment needed.
- **Rule 6 (ADR):** `docs/adr/` absent → no-op.
- **Rule 8 (discoverability):** the new tests use the package's `*.test.ts` glob, are not ignored, and run in the default `pnpm -r test`.

### Decisions

- **Root `pnpm build` no longer chains the api `tsc` emit.** Per the directive's explicit form, root `build` = `tsx scripts/build-content.ts && pnpm --filter web build` (was `pnpm -r --if-present run build`, which also compiled `api/dist`). The api compile is still available via `pnpm --filter api build` and the api is still typechecked by `pnpm -r typecheck`. **Forward consideration for Story 1.10 (deploy):** the deploy script must run the api build explicitly (e.g. `pnpm --filter api build`, or `pnpm -r build`) before `node dist/index.js`, since `pnpm build` alone now produces only `web/dist/` + the (no-op) pipeline. Flagged here so 1.10 doesn't assume `pnpm build` emits `api/dist`.
- **`scripts/` is a workspace package**, not a loose root folder, so `pnpm -r typecheck`/`test` cover it with zero root-script wiring — consistent with web/api/shared. `tsx` is ALSO a root devDep (separate from the scripts package's own) so the root `build` script resolves it from root `.bin` under pnpm's isolated node_modules.
- **The heavy build-twice byte-diff is a documented command (`pnpm check-deterministic`)**, not a default unit test, to keep the default suite fast; only its pure helpers are unit-tested. Justified by the story (the full dist byte-stability is also the lead's smoke gate + a CI step).

### File List

**New:**
- `scripts/build-content.ts` — content-pipeline orchestrator (empty registry + extension hooks)
- `scripts/check-deterministic.ts` — two-build byte-stability check (CI/smoke command)
- `scripts/build-content.test.ts` — orchestrator unit tests (7)
- `scripts/check-deterministic.test.ts` — determinism-helper unit tests (5)
- `scripts/package.json` — `@portfolio/scripts` workspace package (typecheck/test/tsx)
- `scripts/tsconfig.json` — NodeNext, noEmit, @types/node
- `scripts/vitest.config.ts` — discoverable `*.test.ts` for the scripts package
- `content/README.md` — code-as-CMS source-of-truth doctrine
- `content/kb/.gitkeep` — holds the future KB folder (no content pre-created)

**Modified:**
- `package.json` — root `build` = pipeline + web build; added `build:content` + `check-deterministic` scripts; added `tsx` root devDep
- `pnpm-workspace.yaml` — added `scripts` to `packages`
- `pnpm-lock.yaml` — lockfile updated for the new package + root `tsx`
- `_bmad-output/implementation-artifacts/1-8-build-time-content-pipeline-foundation.md` — frontmatter `baseline_commit`, task checkboxes, this Dev Agent Record, Status
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 1.8 → in-progress → review

### Review Findings

Adversarial code review (Blind Hunter / Edge Case Hunter / Acceptance Auditor) under `/epic-cycle`, baseline `aff6049`, branch `PORT-1-epic1`. **Outcome: clean — 0 decision-needed, 1 patch (resolved inline), 1 defer, 3 dismissed. No HIGH/MED correctness findings; the headline determinism NFR-6 is fully met.**

**Rule notes (reviewer):**

- **Rule 3 — EXEMPT.** This is non-user-facing build infrastructure (the `scripts/` content-pipeline orchestrator + `pnpm build` wiring + `content/` dir). No user-facing surface, so the real-runtime-test obligation is waived. Noted per Rule 3's "note the exemption" clause. (Real-build evidence nonetheless exists: `pnpm check-deterministic` runs two real `astro build`s; `web/test/build-output.test.ts` exercises a real build.)
- **Rule 5 — satisfied (NFR tripwire is the core AC, verified).** NFR-6 (deterministic regeneration) is AC2/IAC-2. Verified BYTE-IDENTICAL two ways: (a) `pnpm check-deterministic` ran two clean builds → identical tree hash `833438283cdbc7…`, PASS, exit 0; (b) the empty-pipeline `pnpm build` dist (`27721bf9f4…`) is IDENTICAL to a plain `pnpm --filter web build` dist (`27721bf9f4…`) — the pipeline is a true additive no-op. No `Date.now()`/`Math.random()`/argless `new Date()` anywhere in non-test `scripts/*.ts` (independently grepped — the only hits are doc comments that NAME the banned APIs to forbid them). No NFR found unmeasurable/contradictory → no planning-artifact amendment.
- **Rule 6 — no-op.** `docs/adr/` absent; no ADR registry to cross-check.
- **Rule 1 — declaration present + future consumers named.** Story §Integration ACs declares "`scripts/` has NO functional content consumer yet"; future consumers named: Story 2.1 (render-glassbox) and Story 4.1 (build-kb-index). The registry is empty (`build-content.test.ts` asserts `toHaveLength(0)`); the verbatim hooks `TODO(Story 2.1)` / `TODO(Story 4.1)` are present in `build-content.ts`.
- **Rule 8 — satisfied.** The 3 scripts test files run under `pnpm -r test` (scripts 19 tests: build-content 7 + check-deterministic 5 + pipeline-guards 7), not silently excluded. Confirmed by running the suite (scope "4 of 5 workspace projects"; `shared` correctly skipped — no `test` script).

**Gates re-run by reviewer (all exit 0):** `pnpm -r typecheck` (4/5 incl. scripts), `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test` (227 total: scripts 19 + api 2 + web 206), `pnpm build` (pipeline log observed FIRST, then `astro build` → `web/dist/` = 18 files, 10 HTML routes + `sitemap.xml` + `robots.txt`, no stray `.prerender/`). Standalone `pnpm --filter web build` and `pnpm --filter api build` (emits `api/dist/index.js`) both work.

**Findings:**

- [x] [Review][Patch] Stale test-count in the Dev Agent Record verification line — corrected inline. The line read "scripts 12 … = 220", written before the QA stage added `pipeline-guards.test.ts` (7). Actual current count is scripts 19 / 227 total; corrected at `_bmad-output/implementation-artifacts/1-8-build-time-content-pipeline-foundation.md:113`. (Line 110's narrower description still lists only the dev's two original test files (7+5); left as the dev's original attestation — the QA file is documented in the File List and counted in the corrected line 113.)
- [x] [Review][Defer] Root `pnpm build` no longer emits `api/dist` — forward-flag for Story 1.10 (deploy). [`package.json`] — deferred, by design. Judged ACCEPTABLE (not a finding): `pnpm build` should produce the static site (`web/dist/`); the api is a separate service, still typechecked by `pnpm -r typecheck` and buildable via `pnpm --filter api build` (verified, emits `api/dist/index.js`). The dev already documented this in §Decisions. Recorded in `deferred-work.md` so Story 1.10's deploy explicitly builds the api before `node dist/index.js`.

**Dismissed (noise / false-positive / out-of-scope):**

- The dev record's specific dist tree-hash value `6304cfa6…` (story line 115) does not reproduce in this environment (reviewer got `833438283…`/`27721bf9…`). DISMISSED — Astro content-hash values are environment/version-specific; the load-bearing claim is byte-stability ACROSS two builds AND equality to a plain web build, both independently re-verified here. The specific literal is the dev's machine value and is not a correctness claim.
- `cleanBuildAndHash` re-reads files already walked by `listFilesSorted` in `check-deterministic.ts` (a tiny double-walk). DISMISSED — negligible in a two-full-build CI/smoke command; not a defect.
- A future generator could write into `web/dist` before `astro build` and be clobbered. DISMISSED — Story 2.1/4.1 concern; the orchestrator doc + `content/README.md` already steer generated output to gitignored `api/data/`. Empty registry today → no exposure.
- The comment-stripping regex in the guard tests is heuristic (could miss a `//` inside a string literal). DISMISSED — the test files document the assumption and the authored `scripts/` sources contain no such string literals; the sweep's "sanity: sees real files" test prevents a vacuous pass.
