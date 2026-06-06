# Story 2.1: Publish allowlist (default-deny) + Glass Box render pipeline

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Josh,
I want a single default-deny gate that decides which real `_bmad-output/` artifacts ever publish, plus the build-time pipeline that renders the allowlisted ones into structured reader data,
so that the Glass Box is polished glass — proof, never a raw file dump or an internal-doc leak (FR-13, AR-13).

## Acceptance Criteria

1. **One default-deny allowlist, the single source of truth.**
   **Given** the repo's `_bmad-output/` artifacts
   **When** the publish gate is authored
   **Then** ONE file `content/glassbox.allowlist.ts` is the single, default-deny source of truth — an artifact renders ONLY if it is explicitly listed (everything not listed is denied by construction, not by an exclusion list) — and it is structured so the SAME gate is later read by the KB indexer (Epic 4, Story 4.1). The allowlist exports a typed array of curated entries (each: repo-root-relative `sourceFile`, a `type`, a URL `slug`, a display `title`, and a `curatorNote`), plus the TypeScript types, so it carries the curation ("an act of taste") not just a path list.

2. **The render generator emits deterministic reader data from real artifacts.**
   **Given** the Story 1.8 content pipeline (`scripts/build-content.ts` — the empty `CONTENT_GENERATORS` registry with the `// TODO(Story 2.1): render-glassbox` hook)
   **When** `scripts/render-glassbox.ts` runs (registered as the first entry in `CONTENT_GENERATORS`)
   **Then** it reads each allowlisted artifact's body from the repo working tree at build time and emits structured reader data — `{ slug, type, title, date, curatorNote, body }` per artifact — with **no hand-written facsimiles (real repo artifacts only)** and **deterministically**: `date` is the artifact's git committer date (the `web/src/lib/lastmod.ts` `git log -1 --format=%cI` pattern, with a fixed fallback when git is unavailable), entries are emitted in a sorted, stable order, and no `Date.now()` / `Math.random()` / argless `new Date()` influences output (same git state → byte-identical output; NFR-6, the Story 1.8 determinism baseline).

3. **Default-deny is verified by test — the never-render set cannot leak.**
   **Given** the never-render set that exists in the repo today — `.decision-log.md` (briefs/prds/ux-designs), `review-*.md` (review-adversarial / -downstream / -rubric / -accessibility / -peer-credibility / -seo-geo / -voice), `reconcile-*.md` (reconcile-brief / -brainstorm / -research), `addendum.md` internal addenda, and ANYTHING not on the allowlist
   **When** the render pipeline runs and a unit test asserts on the rendered output set
   **Then** NONE of those files appear in the rendered data (default-deny verified by test, asserting on the pure render function's returned set), so internal / process-private content cannot leak into the Glass Box or (later) the KB index.

4. **No network, no CMS, fails loud (the pipeline hard constraints — Story 1.8 / FR-33 / NFR-6).**
   **Given** the render generator
   **When** it executes inside `pnpm build`
   **Then** it performs NO network IO (no fetch/HTTP, no GitHub/YouTube/Suno reads — repo is the single source of truth), adds NO admin/CMS surface, and throws to fail the build loudly if an allowlisted `sourceFile` is missing or unreadable (never silently skips — a missing allowlisted artifact is a build error, not an empty render).

5. **Integration AC — a consumer reads the render output and produces an observable effect.**
   **Given** the emitted Glass Box reader data
   **When** a consumer reads it (see `## Integration ACs` — the first consumer is Story 2.2's `/glass-box/{artifact}` reader; this story's own consumer-observable proof is the default-deny output-set assertion of AC3 plus a test that the render output is a non-empty, well-formed set for the seeded allowlist with each required field present and each `slug` unique)
   **Then** the output is a stable, typed, addressable set: every entry has a unique `slug`, a non-empty `body`, a valid ISO-8601 `date`, and a `type` from the declared union — i.e. the data contract Story 2.2/2.3 will render is satisfied and tested here against the real build output.

## Integration ACs

Story 2.1 **introduces a service** (the publish allowlist + the render pipeline / its reader-data contract). Per skill-rules Rule 1 + Rule 2:

- **No consumer ships in THIS story.** The first consumer is **Story 2.2** (`/glass-box/{artifact}` artifact reader) and **Story 2.3** (`/glass-box` index), with a second consumer in **Epic 4 Story 4.1** (the KB indexer reads the SAME allowlist). The producer-side integration is proven here by AC3 (default-deny output set) + AC5 (the reader-data contract: unique slugs, required fields, real bodies) asserted against the real pipeline output — not by inspecting internal state.
- See `## Consumed-by` below.

## Consumed-by

- **Story 2.2** — `/glass-box/{artifact}` artifact reader: reads an allowlisted entry's reader data (header chip · curator note · drop-cap lede · body · pull-quote) by `slug`. First real consumer.
- **Story 2.3** — `/glass-box` index: reads the full set as the curated chronological build-story (dated nodes → each artifact's reader).
- **Story 2.4** — Master Timeline seed: the portfolio flagship's Dots cross-link into Glass Box artifacts.
- **Epic 4 / Story 4.1** — KB indexer: reads the SAME `content/glassbox.allowlist.ts` so the agent can only surface allowlisted content (one gate, two consumers; architecture §Cross-Component Dependencies).

## Tasks / Subtasks

- [ ] **Task 1 — Author the default-deny allowlist (AC1).**
  - [ ] Create `content/glassbox.allowlist.ts`: export `interface GlassboxEntry { sourceFile: string; type: GlassboxType; slug: string; title: string; curatorNote: string }`, a `type GlassboxType = 'brief' | 'brainstorm' | 'research' | 'prd' | 'ux' | 'architecture' | 'epics' | 'retrospective' | 'shipping'` (extend as curation needs), and `export const GLASSBOX_ALLOWLIST: readonly GlassboxEntry[]`.
  - [ ] Seed it with the launch-set planning artifacts that exist in the repo: the product brief (`_bmad-output/planning-artifacts/briefs/brief-portfolio-2026-06-02/brief.md`), the brainstorm (`_bmad-output/brainstorming/brainstorming-session-2026-06-02-1723.md`), the pre-brief research (`_bmad-output/research/portfolio-pre-brief-research-2026-06-02.md`), the PRD (`_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/prd.md`), and the UX design (`_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/DESIGN.md` and/or `EXPERIENCE.md`). Each entry gets a `slug` (e.g. `product-brief`, `brainstorm`, `pre-brief-research`, `prd`, `ux-design`), a `title`, and a one-line `curatorNote`. (Which artifacts are ghosted/featured on the index is a Story 2.3 display decision — 2.1 just seeds what MAY publish.)
  - [ ] Do NOT list any never-render file. Document at the top of the file that this is DEFAULT-DENY: only listed files publish; the never-render set is excluded by virtue of not being listed (no exclusion list needed).
- [ ] **Task 2 — Build the render generator (AC2, AC4).**
  - [ ] Create `scripts/render-glassbox.ts`: export a pure `renderGlassbox(allowlist, repoRoot): GlassboxArtifact[]` (testable, no IO seam where possible — reads files from `repoRoot`) AND a `Generator` (`name: 'render-glassbox'`, `run()` writes the output). `GlassboxArtifact = { slug; type; title; date; curatorNote; body }`.
  - [ ] For each allowlisted entry: read the file body from `repoRoot/sourceFile` (throw if missing — AC4), derive `date` from the git committer date of that file (reuse the `git log -1 --format=%cI -- <file>` pattern from `web/src/lib/lastmod.ts`; replicate the small helper in `scripts/` or a shared module — do NOT add a network/`web`→`scripts` runtime coupling), and assemble the reader data.
  - [ ] Sort the emitted array deterministically (recommended: by `date` ascending then `slug`) so output is stable; honor all Story 1.8 hard constraints (no network, no `Date.now`/`Math.random`/argless `new Date`, sorted enumeration).
- [ ] **Task 3 — Wire into the pipeline + choose the output location (AC2, AC5).**
  - [ ] Register the generator in `CONTENT_GENERATORS` in `scripts/build-content.ts` (replace the `// TODO(Story 2.1)` hook), keeping the array the single ordered source of truth.
  - [ ] `run()` writes the emitted set to a deterministic, gitignored generated location importable by Astro at build time — RECOMMENDED `web/src/generated/glassbox.json` (add `web/src/generated/` to `.gitignore`). Document for Story 2.2 the build-ordering implication: `pnpm build` runs the pipeline BEFORE `astro build`, so the data exists for the Astro pages; a bare `astro build` (the vitest `build-output.test.ts` path) will NOT have run the generator, so Story 2.2's pages must tolerate absent generated data (empty/forward-ref) until 2.2 wires consumption + its own build-ordering. (Forward-reference, not a defect — 2.2 owns the consumer wiring.)
- [ ] **Task 4 — Default-deny + contract tests (AC3, AC5).**
  - [ ] Add `scripts/render-glassbox.test.ts` (co-located Vitest, discoverable by the scripts vitest config — see `scripts/vitest.config.ts` + the existing `scripts/*.test.ts`). Assert against the real `renderGlassbox()` output: (a) every allowlisted slug is present; (b) NONE of the never-render files appear (assert specific real paths: a `.decision-log.md`, a `review-*.md`, a `reconcile-*.md`, an `addendum.md` — none of their bodies/slugs leak); (c) every entry has a unique `slug`, non-empty `body`, ISO-8601 `date`, and a `type` in the union; (d) determinism — two `renderGlassbox()` calls return deep-equal output.
  - [ ] If you add a no-network assertion in the orchestrator style, mirror `scripts/build-content.test.ts`'s "no network primitive in source" check.
- [ ] **Task 5 — Verify the pipeline + determinism floor.**
  - [ ] Run `pnpm --filter @portfolio/scripts test` (or the scripts vitest) and the determinism check (`scripts/check-deterministic.ts`) — confirm `pnpm build` now generates the Glass Box data and is still byte-stable across two runs at the same git state. Confirm `pnpm test:all` stays green (the additive generator must not break the 1.8 no-op baseline tests — they may need updating from "0 generators" to "1 generator"; update `scripts/build-content.test.ts`/`pipeline-guards.test.ts` assertions if they assert the registry is empty).

## Dev Notes

### The Story 1.8 foundation you plug into (read `scripts/build-content.ts` fully)

- `CONTENT_GENERATORS: readonly Generator[]` is EMPTY today with `// TODO(Story 2.1): render-glassbox` at the registry. `Generator = { readonly name: string; run(): Promise<void> }`. The orchestrator `runPipeline()` runs the registry in array order. **Adding your generator entry is the ONLY change needed to wire it into `pnpm build`.**
- Story 1.8 hard constraints (carry them — they are tested): NO network IO ever; NO admin/CMS; DETERMINISTIC (no `Date.now`/`Math.random`/argless `new Date`; git-derived timestamps; **sorted** directory/glob enumeration — filesystem order is not portable). Same git state → byte-identical output. `scripts/build-content.test.ts` asserts the source contains no network primitive — keep that true for `render-glassbox.ts`.
- The 1.8 no-op baseline (`pnpm build` byte-identical to bare `astro build`) ENDS with this story by design — you are the first generator. Update any test that asserts "0 generators registered" to the new reality (1 generator), and ensure the determinism check still passes (your output is deterministic).

### Allowlist = the single gate (architecture §Structure Patterns, §Cross-Component Dependencies)

- ONE file `content/glassbox.allowlist.ts`, default-deny, read by BOTH the Glass Box render (this story) AND the KB indexer (Epic 4). This is the single control preventing the red-team "internal-doc leak" (architecture §Decision Impact). Default-deny means: render iterates the ALLOWLIST, never the filesystem — so an un-listed file (including any future internal doc) can never appear. Do NOT implement it as "scan `_bmad-output/` minus an exclusion list" — that inverts the safety.
- The never-render set is REAL and present now (verified): `.decision-log.md` in `briefs/`, `prds/`, `ux-designs/`; the `review-*.md` and `reconcile-*.md` families under `prds/` and `ux-designs/`; `addendum.md` files. Your AC3 test asserts these specific real paths never surface.

### Determinism — git-derived dates (reuse the Story 1.6 pattern)

- `web/src/lib/lastmod.ts` already implements the deterministic git-committer-date read (`git log -1 --format=%cI -- <file>`, `FALLBACK_LASTMOD` when git unavailable) and `web/src/pages/sitemap.xml.ts` consumes it. Reuse that exact approach for each artifact's `date`. The script runs from the repo (build cwd is repo root for `pnpm build`); resolve repo-root-relative `sourceFile` paths against the git toplevel as `sitemap.xml.ts`'s `gitRepoRoot()` does. Do NOT import `web/src/lib` into `scripts/` (build-coupling) — replicate the tiny helper or place it in a shared spot.

### Output location + the consumer build-ordering (forward-reference to Story 2.2)

- Generated output is gitignored (`.gitignore` already ignores `dist/`, `.astro/`, `api/data/`). Emit the Glass Box reader data to a new gitignored generated path importable by Astro at build — recommended `web/src/generated/glassbox.json` (add `web/src/generated/` to `.gitignore`). `pnpm build` runs the pipeline before `astro build`, so the file exists for 2.2/2.3's pages. A bare `astro build` (the `web/test/build-output.test.ts` path) does NOT run the pipeline → the file is absent there; Story 2.2's pages will handle that (forward-reference, NOT a 2.1 defect — 2.2 owns consumer wiring + its build-ordering/test approach). For THIS story, the testable surface is the pure `renderGlassbox()` function (AC3/AC5 assert on its return value), which needs no Astro build.

### Naming / structure (architecture §Naming Patterns)

- Library/script modules: kebab-case `.ts` (`render-glassbox.ts`). Functions/vars camelCase; types/interfaces PascalCase; true constants UPPER_SNAKE (`GLASSBOX_ALLOWLIST`). Tests co-located `*.test.ts` (Vitest).
- The render output is build-time DATA, not shipped client JS — it must not introduce any executable JS into the static pages (NFR-1 is a 2.2/2.3 concern, but the data shape must be plain serializable JSON: strings/dates-as-ISO-strings, no functions).

### Project Structure Notes

- New files: `content/glassbox.allowlist.ts`, `scripts/render-glassbox.ts`, `scripts/render-glassbox.test.ts`. Modified: `scripts/build-content.ts` (register generator), `.gitignore` (ignore the generated dir), and possibly `scripts/build-content.test.ts` / `scripts/pipeline-guards.test.ts` (registry-count assertions 0→1).
- No `web/` page/route work in this story (that is 2.2/2.3). No `api/` work. No new runtime dependencies expected (Node `child_process` + `fs` only).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — the three epic ACs (allowlist, render pipeline, default-deny test).
- [Source: scripts/build-content.ts] — the 1.8 orchestrator + empty `CONTENT_GENERATORS` + the `// TODO(Story 2.1)` hook + the Generator interface + hard constraints.
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — "Publish allowlist: ONE file (`content/glassbox.allowlist.ts`), default-deny, read by BOTH the Glass Box render and the KB indexer."
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Component Dependencies] — one allowlist governs Glass Box render AND KB index (prevents internal-doc leak).
- [Source: web/src/lib/lastmod.ts + web/src/pages/sitemap.xml.ts] — the deterministic git-committer-date pattern + `gitRepoRoot()` to reuse.
- [Source: scripts/build-content.test.ts, scripts/check-deterministic.ts, scripts/pipeline-guards.test.ts] — the no-network-source assertion, determinism check, and the registry-state assertions to update.
- [Source: .claude/rules/skill-rules.md#Rule 1, Rule 2] — Integration AC + Consumed-by obligations (satisfied above).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(none — clean run)

### Completion Notes List

- All 5 tasks implemented cleanly. `pnpm --filter @portfolio/scripts test`: 57 tests, 5 test files, all pass. `pnpm --filter web test`: 268 tests, 11 test files, all pass. `pnpm build` runs the render-glassbox generator (6 artifacts) before astro build (10 pages); byte-stable across two consecutive builds (sha256 identical).
- Two lint errors surfaced and fixed during `pnpm test:all`: `prefer-const` (test file) and `preserve-caught-error` (render source); fixed by using `const` and passing `{ cause }` to the thrown Error. Three prettier formatting issues auto-fixed with `npx prettier --write`.
- Pre-existing api test failure (`EADDRINUSE: port 8787`) is a VM environment issue; confirmed pre-existing on the clean branch; not caused by this story.
- `build-content.test.ts` registry-count assertions updated from 0→1 and the "runs clean" tests updated to inject empty registry (the real registry now has render-glassbox with file IO).
- AC3 default-deny test asserts 12 specific never-render paths (addendum, review-*, reconcile-* families). AC5 data contract verified: unique slugs, non-empty bodies, valid ISO-8601 dates, types in union. AC4 fail-loud: missing file throws with cause-chained Error.
- Forward-reference noted in build-content.ts comment and render-glassbox.ts doc: bare `astro build` (web test path) does NOT run the generator; Story 2.2 owns consumer wiring (Rule 3 compliant).

### File List

- content/glassbox.allowlist.ts (NEW)
- scripts/render-glassbox.ts (NEW)
- scripts/render-glassbox.test.ts (NEW)
- scripts/build-content.ts (MODIFIED — import + register render-glassbox generator)
- scripts/build-content.test.ts (MODIFIED — registry-count assertions 0→1; injected-empty-registry for no-IO tests)
- .gitignore (MODIFIED — add web/src/generated/)

### Review Findings

Code review (code-review stage of `/epic-cycle`, 2026-06-06; adversarial — Blind Hunter / Edge-Case Hunter / Acceptance Auditor). Verdict: **APPROVED — done.** Default-deny is correct and mutation-resistant, the render is deterministic and byte-stable, fail-loud holds, no network/CMS, and the generator is correctly wired as the first `CONTENT_GENERATORS` entry. All 5 ACs + the Integration AC are satisfied. 1 deferred (LOW, latent), 0 patch, 0 decision-needed, 5 dismissed as noise.

**Real-runtime evidence (Rule 3 — EXEMPTION noted):** Story 2.1 ships a build-time pipeline/library, NOT a browser surface, so the browser/Playwright tier is EXEMPT (exemption recorded, no HIGH filed for "no browser test"). The correct real-runtime tier IS present: `render-glassbox.security.test.ts` invokes `renderGlassboxGenerator.run()`, reads back the emitted `web/src/generated/glassbox.json`, and asserts it deep-equals the pure render, is plain serializable JSON, and still satisfies default-deny at the serialization boundary.

**Default-deny (SECURITY-CRITICAL) — genuinely proven, not vacuous:** the render iterates `GLASSBOX_ALLOWLIST`, never the filesystem (verified structurally: `render(allowlist)` slug-set === allowlist slug-set, `|out| === |in|`). The QA mutation-resistance is real — a POSITIVE CONTROL (a synthetic allowlist pointing at a real `.decision-log.md` DOES render it → the gate IS the allowlist, not a hard-coded skip) + a full-corpus SWEEP + IDENTITY-based negative assertions (slug + sourceFile + body, not raw substring — benign prose mentions of "decision-log"/"addendum" in allowlisted bodies are NOT leaks). Independently confirmed none of the 6 allowlisted `sourceFile`s is a never-render path. QA's poisoned-allowlist run failed exactly 3 tests, then reverted clean — the suite is not vacuous.

**Determinism (NFR-6):** `date` is the git committer date (`git log -1 --format=%cI`, fixed fallback), independently re-verified to equal raw git per artifact; no `Date.now`/`Math.random`/argless `new Date` in executable code. `web/dist` is byte-identical across two `pnpm build`s (sha256 + the `check-deterministic` gate PASS); `glassbox.json` byte-identical across runs; the gitignored generated dir does not dirty the working tree.

**Edge cases verified (manual, favorable):** empty allowlist → `[]` (valid, default-deny); a `sourceFile` pointing at a directory → EISDIR → fail-loud throw (AC4 covers unreadable, not just missing); no `//` inside string literals in the new files, so the comment-strip source-guards are safe.

- [x] [Review][Defer] `localeCompare` sort is locale/ICU-sensitive in principle for non-ASCII keys [scripts/render-glassbox.ts:140,142] — deferred, LOW latent. Both sort keys are currently ASCII (ISO-8601 `date` primary, kebab-case `slug` secondary); empirically byte-stable and NFR-6 holds for the current set. Only a robustness nuance IF a future non-ASCII slug is ever added (the slug is the secondary key). See deferred-work.md.

**Dismissed as noise (5):** (1) git `%cI` TZ-offset could vary per commit and lexical sort would order by wall-time-with-offset — deterministic for a fixed git state (NFR-6 holds); display-ordering nuance only, all current dates `+00:00`. (2) `FALLBACK_DATE` duplicates `lastmod.ts`'s `FALLBACK_LASTMOD` literal — by design: Dev Notes forbid importing `web/src/lib` into `scripts/` (build coupling); replicating the tiny constant is sanctioned and documented in-code. (3) no explicit empty-allowlist/directory-sourceFile test — behavior verified correct manually; fail-loud IS tested via the phantom-file case; not AC-required branches. (4) no in-story consumer — the declared Rule 1 escape clause (first consumer is Story 2.2; producer proof is AC3 + AC5), explicitly NOT a defect. (5) no browser/Playwright test — Rule 3 EXEMPT for a build-time pipeline (exemption noted above).
