# Story 3.0: Epic 2 Deferred Cleanup — api test port-robustness, external-link label fidelity & timeline date determinism

---
baseline_commit: 7056431f916fa310163a1a35407376b9f0dc7b37
---

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Created by the /epic-cycle retro-review gate (Epic 2 → Epic 3), 2026-06-06. Cleanup story; NOT in epics.md.
     Absorbs the Epic-2-relevant deferred-work.md items that are genuinely actionable now and not better-owned by a
     specific Epic-3 feature story. Full Epic-2 deferred-work + retro triage table is appended at the end of this file.
     INCLUDED here: [2.1 EADDRINUSE] (retro A3, pulled forward so the canonical test:all gate is green for ALL of Epic 3
     per Rule 5), [2.3 ArtifactCard external label], [2.4 timeline date determinism]. DEFERRED to 3.3: API_PORT
     validation + duplicated-default (land with api/src/env.ts). DEFERRED to 3.4: React chunk / 0-JS re-verify (A4). -->

## Story

As the site owner (Josh),
I want the three genuinely-actionable Epic-2 deferred items cleared before Epic 3 builds on top of them — the api test suite reliable on the deploy VM, the shared external-link label honest about its behavior, and the timeline's visible dates deterministic regardless of the build host's timezone,
so that Epic 3's feature stories run against a green canonical `pnpm test:all` gate (project-rules.md Rule 5), reuse a correct external-link component, and never regress NFR-6 (deterministic, byte-stable build).

## Context & decision (read first)

This is the `/epic-cycle` Epic-2 → Epic-3 retro-review cleanup story. The full triage of every Epic-2 deferred-work item + retro action item is in the appendix. Three items are **INCLUDED** here; the rest **DEFER** to their natural Epic-3 feature stories (3.3 api env, 3.4 first React island) or to later epics, or are **DROPPED** as already-resolved. The three included items are small, self-contained, low-risk, and not naturally owned by a 3.1–3.5 feature story:

### Included item 1 — api test is not port-robust (`[2.1 · environmental] EADDRINUSE:8787`; retro A3)

**Root cause (verified):** `api/src/index.ts` calls `serve({ fetch: app.fetch, port })` at **module top level** (line 17). `api/src/health.test.ts` does `import app from './index.ts'` to drive in-process `app.request()` assertions — but that import executes the module body, so `serve()` runs and tries to **bind port 8787**. On the deploy VM the live `portfolio-api` systemd unit already holds 8787, so the bind throws `EADDRINUSE` and `pnpm --filter api test` (hence root `pnpm test:all`) fails. It is environmental — it only manifests where the deployed api is running — but it makes the canonical gate red on the very host Epic 3's stories are verified on.

**Decision — remove the import-time socket bind; keep `dist/index.js` as the production entrypoint.** The test only needs the Hono `app` (it uses `app.request()`, which never opens a socket). So `serve()` must NOT run as an import side-effect. Two acceptable shapes (dev's choice; the split is preferred):

- **Preferred — split app/bootstrap:** move the `app` definition + routes into `api/src/app.ts` (exports `app`, no `serve`); make `api/src/index.ts` the bootstrap that does `import app from './app.ts'; serve({ fetch: app.fetch, port })`. The test imports from `./app.ts`. This is the conventional Hono/Node layout and gives 3.3's `/api/invite` a clean app module to mount onto.
- **Alternative — guard the bootstrap in place:** keep one file but run `serve()` only when the module is the process entrypoint, e.g. `if (process.argv[1] === fileURLToPath(import.meta.url)) serve(...)`. Smaller diff, but mixes app + bootstrap concerns.

**Hard constraint:** the production start path is unchanged — `scripts/deploy.sh` Step 3 `pnpm --filter api build` then the `portfolio-api` systemd unit runs `node dist/index.js` (api/package.json `start`). The refactor MUST keep `api/dist/index.js` the entrypoint that binds the port when run directly. Do NOT pull API_PORT validation forward — that lands with `api/src/env.ts` in Story 3.3 (deferred; see appendix).

### Included item 2 — shared `ArtifactCard` external label claims "new tab" but opens in the same tab (`[2.3 · LOW]`)

`web/src/components/glassbox/ArtifactCard.astro` — the external anchor renders `target="_self"` (line 134, same tab, intentional for curated external links), but the **default** accessible label is `View ${title} (opens in new tab)` (line 48). A screen-reader user is told "new tab" while the link opens in place. Not observable on shipped surfaces today (the `/glass-box` index and `/work/loandemo` both pass an explicit accurate `externalLabel`), but it is a latent reuse-contract defect, and **Epic 3 Story 3.5 (the Close) ships external follow/subscribe links** that may reuse this component without an explicit label. **Decision — align the default label with the actual `target="_self"` behavior** (drop the "(opens in new tab)" parenthetical, or state "(opens in the same tab)"); update the JSDoc on line 17 to match; add an isolated component test asserting the default external label does not claim "new tab" and matches the rendered `target`.

### Included item 3 — timeline visible dates are builder-timezone-sensitive (`[2.4 · LOW latent determinism]`, NFR-6)

`web/src/components/timeline/FlagshipNode.astro` formats the **visible** date with `new Date(date).toLocaleDateString('en-US', { month, year })` in two duplicated IIFEs (milestone line 40–52, cluster-dot line 83–92). The `<time datetime>` attribute carries the verbatim ISO string (deterministic), but ISO date-only strings parse as UTC and `toLocaleDateString` renders in the builder's **local** timezone — so a contributor building west of UTC could see a UTC-midnight date roll back a month in the visible label, diverging from a UTC build. Stable today only because the deploy VM is UTC. **Decision — format deterministically, timezone-independently, from ONE shared helper.** Extract a single `formatDotDate(iso)` helper (e.g. in `web/src/lib/timeline.ts`) that produces the "Mon YYYY" label without a TZ-dependent `Date` (parse the ISO `YYYY-MM` parts directly, or pass `timeZone: 'UTC'` to a fixed formatter), preserving the existing `~`-passthrough and invalid-date-passthrough behavior; replace both IIFEs with it; add a unit test that pins the output independent of `process.env.TZ`.

## Acceptance Criteria

1. **api test suite is port-robust — green even when 8787 is occupied.**
   **Given** the api package on a host where port 8787 is already bound (the deploy VM's live `portfolio-api`)
   **When** `pnpm --filter api test` and the root `pnpm test:all` run
   **Then** they pass — importing the Hono `app` for `app.request()` assertions opens **no socket** (no `serve()` runs as an import side-effect), so no `EADDRINUSE` occurs
   **And** the existing `/api/health` real-runtime assertions (status 200 + `{status:"ok"}` + JSON content-type) still run and pass via `app.request()` (skill-rules Rule 3 in-process runtime tier preserved).

2. **Production server bootstrap is unchanged at the entrypoint level.**
   **Given** `scripts/deploy.sh` Step 3 (`pnpm --filter api build`) + the `portfolio-api` systemd unit running `node dist/index.js` (api/package.json `start`)
   **When** the built api is launched directly as the process entrypoint
   **Then** it still binds `API_PORT` (default 8787) and logs `[api] Hono listening …` exactly as today — the refactor keeps `api/dist/index.js` the entrypoint that serves; `api/package.json` `start`/`dev`/`build` and the deploy/systemd config need no edits (or, if the app/bootstrap split is used, `dev` still points at the entrypoint that serves).

3. **`ArtifactCard` default external label matches the rendered `target` (no false "new tab" claim).**
   **Given** `web/src/components/glassbox/ArtifactCard.astro` rendered with `external` true and **no** explicit `externalLabel`
   **When** the card builds
   **Then** the anchor's `aria-label` does NOT claim "opens in new tab" while `target="_self"` — the default label is honest about the same-tab behavior (parenthetical removed or corrected to "(opens in the same tab)"), and the JSDoc on the `externalLabel` prop matches
   **And** the two current consumers (`/glass-box` index, `/work/loandemo`) that pass an explicit `externalLabel` are visually/semantically unchanged (their explicit labels still win).

4. **Isolated component test locks the label↔target contract.**
   **Given** the default and explicit-label external branches of `ArtifactCard`
   **When** a component test renders both
   **Then** it asserts the default external `aria-label` matches the actual `target` (no "new tab" text when `target="_self"`) and that an explicit `externalLabel` is rendered verbatim — discoverable by the default `pnpm test:all` suite (skill-rules Rule 8).

5. **Timeline visible dates are deterministic and TZ-independent, from one helper.**
   **Given** the milestone date and cluster-dot dates in `FlagshipNode.astro`
   **When** the timeline is built under any `TZ`
   **Then** both visible "Mon YYYY" labels are produced by a single shared `formatDotDate(iso)` helper that does not depend on the runner's timezone (a `2026-06`/`2026-06-06` input renders the same label in `UTC` and in `America/Los_Angeles`), the `~`-prefix passthrough and invalid/`[`-prefixed passthrough behaviors are preserved, and the `<time datetime>` attribute still carries the verbatim manifest string
   **And** a unit test pins `formatDotDate` output across at least two `TZ` settings (e.g. `UTC` and `America/Los_Angeles`) to prove independence.

6. **The LITERAL canonical gate `pnpm test:all` is green end-to-end (NFR-1, NFR-6, AA; Rule 5).**
   **Given** the canonical launch gate `pnpm test:all` = `typecheck && lint && format:check && test && test:e2e && lh` (the final `lh` step is `pnpm build && lhci autorun` — Lighthouse CI IS part of the gate; `launch-check` aliases `test:all`), plus the separate NFR-6 check `pnpm run check-deterministic`
   **When** the **literal `pnpm test:all` command** runs end-to-end after the change (NOT a hand-narrowed step-by-step subset — that is the Rule 5 anti-pattern)
   **Then** every step including `lh` is green — which requires fixing the pre-existing **Rule 2 leftover** in `lighthouserc.json`: it audits the slashless `http://127.0.0.1:4321/about`, which 404s under `trailingSlash:'always'` (set in Story 2.0), reding the `lh` step; normalize that audit URL to the trailing-slash form `/about/` so `lhci` collects it and the four performance budgets (`script:size`, `total-byte-weight`, `FCP`, `categories:performance`) assert
   **And** the build is byte-deterministic across two clean builds (`check-deterministic`, NFR-6), the 0-executable-JS-by-default floor holds (NFR-1; the timeline + ArtifactCard remain static, JS-off-correct), and `prettier --check .` / `eslint` cover any new/changed `.ts`/`.astro` files.

## Integration ACs

This is a cleanup/refactor story. It introduces **no new service, module, or shared component with a new public surface** — it removes an import-time side-effect, corrects one default string + its test, and extracts one pure formatting helper used only inside the timeline. The skill-rules Rule 1 "introduces a service" clause does not apply. The api refactor's "integration" is the existing `/api/health` real-runtime assertion (AC1) plus the unchanged production entrypoint (AC2); both are verified, not internal-state checks. (The first genuinely new service surface in Epic 3 is `/api/invite` in Story 3.3, which will carry its own Integration AC.)

## Tasks / Subtasks

- [x] **Task 1 — Remove the import-time socket bind from the api (AC1, AC2).**
  - [x] Refactor so `serve()` does NOT run when the module is imported. Preferred: create `api/src/app.ts` exporting the Hono `app` (move the `new Hono().basePath('/api')` + `/health` route there, no `serve`); make `api/src/index.ts` import that app and call `serve({ fetch: app.fetch, port })` as the bootstrap. Alternative: guard `serve()` with an `is-main-module` check in the single file.
  - [x] Update `api/src/health.test.ts` to import `app` from wherever it now lives (`./app.ts` if split) and keep the in-process `app.request('/api/health')` assertions exactly.
  - [x] Keep `api/dist/index.js` the production entrypoint that binds the port (do NOT change `api/package.json` `start`/`build`, the systemd unit, or `scripts/deploy.sh`). Keep the `[api] Hono listening` log.
  - [x] Do NOT add API_PORT validation/centralization here — that is deferred to Story 3.3 (`api/src/env.ts`); leave the `Number(process.env.API_PORT ?? 8787)` read as-is in the bootstrap (see appendix).
- [x] **Task 2 — Make the `ArtifactCard` default external label honest (AC3, AC4).**
  - [x] In `web/src/components/glassbox/ArtifactCard.astro`, change the default `externalLabel` (line ~48) so it does not say "(opens in new tab)" while `target="_self"` — drop the parenthetical or use "(opens in the same tab)". Update the prop JSDoc (line ~17) to match the actual behavior.
  - [x] Add/extend an isolated component test (e.g. `web/test/ArtifactCard.component.test.ts`) asserting: (a) default external `aria-label` has no "new tab" text and matches `target="_self"`; (b) an explicit `externalLabel` renders verbatim. Confirm the two existing consumers (`/glass-box` index, `/work/loandemo`) are unaffected (they pass explicit labels).
- [x] **Task 3 — Extract a deterministic, TZ-independent date helper for the timeline (AC5).**
  - [x] Add `formatDotDate(iso: string): string` to `web/src/lib/timeline.ts` (or the existing timeline lib) — produce "Mon YYYY" without a TZ-dependent `Date` (parse `YYYY`/`MM` directly, or use a fixed `Intl.DateTimeFormat('en-US', { month:'short', year:'numeric', timeZone:'UTC' })`); preserve `~`-passthrough, invalid-date passthrough, and `[`-prefixed passthrough.
  - [x] Replace BOTH duplicated IIFEs in `FlagshipNode.astro` (milestone + cluster-dot) with `formatDotDate(...)`. Keep `<time datetime={…}>` carrying the verbatim manifest string.
  - [x] Add a unit test pinning `formatDotDate` across `TZ=UTC` and `TZ=America/Los_Angeles` (and the passthrough cases), discoverable by the default suite.
- [ ] **Task 4 — Fix the pre-existing Rule 2 leftover that reds the `lh` gate (AC6).**
  - [ ] In `lighthouserc.json`, change the audited URL `http://127.0.0.1:4321/about` → `http://127.0.0.1:4321/about/` (trailing-slash, matching the site's `trailingSlash:'always'` canonical form set in Story 2.0). The root `/` URL is already correct. This is the same Rule-2 URL-form class Story 2.0 fixed for links/canonical/sitemap; the LH audit URL was the one internal-URL surface it missed.
- [ ] **Task 5 — Verify the floor with the LITERAL canonical gate (AC1, AC2, AC6).**
  - [ ] Run the **literal** `pnpm test:all` end-to-end (Rule 5 — NOT a step-by-step hand-narrowed subset). Confirm ALL steps green INCLUDING `lh` (lhci autorun: both `/` and `/about/` collected, all four budget assertions pass). Explicitly confirm `pnpm --filter api test` passes on this VM (8787 occupied) — the EADDRINUSE is gone.
  - [ ] Run `pnpm run check-deterministic` (separate NFR-6 check): two clean builds byte-identical, timeline page unchanged in `dist` under UTC. Note any files touched in the Dev Agent Record.

## Dev Notes

### Current state (files being modified — read before editing)

- **`api/src/index.ts`** (21 lines): `const app = new Hono().basePath('/api')`; `app.get('/health', …)`; `const port = Number(process.env.API_PORT ?? 8787)`; **`serve({ fetch: app.fetch, port }, …)` at top level (line 17)**; `export default app`. The top-level `serve()` is the bug — it runs on import.
- **`api/src/health.test.ts`** (28 lines): `import app from './index.ts'` then two `app.request('/api/health')` assertions (status/body, content-type). It needs ONLY the app — never a socket. Update its import path if the app moves to `app.ts`.
- **`api/package.json`**: `dev: tsx watch src/index.ts`, `build: tsc`, `start: node dist/index.js`, `test: vitest run`, `type: module`. If splitting, `index.ts` stays the served entrypoint so `start`/`build`/`dev` need no change.
- **`scripts/deploy.sh`**: Step 3 `pnpm --filter api build`; Step 5 `sudo systemctl restart portfolio-api`. The unit runs `node dist/index.js`. Must keep binding the port when launched directly.
- **`web/src/components/glassbox/ArtifactCard.astro`**: line 17 JSDoc "(default: View {title} (opens in new tab))"; line 47–48 `linkLabel = external ? (externalLabel ?? \`View ${title} (opens in new tab)\`) : …`; line 134 external anchor sets `rel:'noopener noreferrer', target:'_self'`; line 136 visible text `View →`. Consumers: `web/src/pages/glass-box/index.astro`, `web/src/pages/work/loandemo.astro` (both pass explicit `externalLabel`).
- **`web/src/components/timeline/FlagshipNode.astro`**: two near-identical date IIFEs — milestone (lines 40–52) and cluster-dot (lines 83–92), each `new Date(x).toLocaleDateString('en-US',{month:'short',year:'numeric'})` with `~`-passthrough + try/catch passthrough. `<time datetime>` carries the verbatim string. Consumer: `web/src/pages/timeline.astro`. Existing tests: `scripts/render-timeline.test.ts`, `web/src/lib/timeline.ts`.

### Constraints / invariants to preserve

- **NFR-1** 0-executable-JS-by-default on all Mirror routes; the timeline + ArtifactCard are static — no JS added.
- **NFR-6** deterministic, byte-stable build — re-verify two builds byte-identical. The date-helper change must not alter the UTC-built output (so `web/dist` stays byte-identical on the UTC VM).
- **Rule 5 (canonical gate):** verify with the ROOT `pnpm test:all`, not a package-scoped subset. Confirm `format:check`/`lint`/`typecheck` globs cover any new `.ts` test files and the changed `.astro`.
- **Rule 3 (real-runtime test):** the api keeps its `app.request()` in-process runtime assertion; do not downgrade it to a structural/mock check.
- **No API_PORT scope creep:** validation/centralization is Story 3.3's `api/src/env.ts` (deferred). This story only removes the import-time bind.

### Project Structure Notes

- api files under `api/src/` (the Hono service); web files under `web/src/` (the static site). No `shared/` changes. New files limited to (optionally) `api/src/app.ts`, a timeline helper addition to the existing `web/src/lib/timeline.ts`, and 1–2 test files.

### References

- [Source: .claude/rules/project-rules.md#5] — per-story verification runs the canonical full gate (`pnpm test:all`), not a scoped subset (motivation to make api green on the VM).
- [Source: _bmad-output/implementation-artifacts/deferred-work.md#Surfaced during: Story 2.1 pipeline] — `[2.1 · environmental] EADDRINUSE:8787`, suggested resolution: api test port-robustness (~3.3); pulled forward to 3.0.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md#Deferred from: code review of story-2.3] — `[2.3 · LOW]` ArtifactCard default-`externalLabel` "(opens in new tab)" vs `target="_self"`.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md#Deferred from: code review of story-2.4] — `[2.4 · LOW latent determinism]` `toLocaleDateString` builder-TZ-sensitivity; extract one helper + `timeZone:'UTC'`.
- [Source: _bmad-output/implementation-artifacts/epic-2-retro-2026-06-06.md#Action items] — A3 (api test port-robust), A4 (React chunk → 3.4, deferred).
- [Source: api/src/index.ts#L17] — the top-level `serve()` import side-effect (root cause).
- [Source: api/src/health.test.ts#L3] — `import app from './index.ts'` triggers the bind.
- [Source: web/src/components/glassbox/ArtifactCard.astro#L48,L134] — default label vs `target="_self"`.
- [Source: web/src/components/timeline/FlagshipNode.astro#L40-52,L83-92] — the two duplicated date IIFEs.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6 (bmad-dev-story, 2026-06-06)

### Debug Log References
- EADDRINUSE confirmed on deploy VM: `pnpm --filter api test` failed with `Serialized Error: { code: 'EADDRINUSE', errno: -98, ... port: 8787 }` before fix.
- TypeScript error: `api/src/index.ts` import `from './app.ts'` rejected by NodeNext tsconfig (`allowImportingTsExtensions: false`) — fixed to `from './app.js'` (NodeNext resolution convention: source uses `.js`, tsx/Vite resolves to `.ts`). Test file kept `.ts` extension (excluded from tsc build, run by Vitest/tsx).
- `pnpm run lh` (Lighthouse CI) fails with 404 on `/about` — pre-existing issue unrelated to this story. The LH config tests `http://127.0.0.1:4321/about` (no trailing slash), but the site uses `trailingSlash: 'always'`, so `/about` → 404 while `/about/` → 200. Confirmed pre-existing by `git stash` test — same error on the upstream baseline.
- Two new files needed formatting: `web/src/components/glassbox/ArtifactCard.astro` and `web/test/timeline-format.test.ts` — fixed with `pnpm run format`.

### Completion Notes List
- **Task 1 (AC1, AC2):** Split `api/src/index.ts` into `api/src/app.ts` (exports Hono app, no `serve()`) and `api/src/index.ts` (bootstrap that imports app and calls `serve()`). Updated `api/src/health.test.ts` to import from `./app.ts` (no socket bind on import). `pnpm --filter api test` now passes on deploy VM (8787 occupied) — EADDRINUSE eliminated. `api/dist/index.js` still binds port on direct run (AC2 satisfied: `pnpm --filter api build` emits both `dist/app.js` + `dist/index.js`; `start`/`build`/`dev` scripts unchanged).
- **Task 2 (AC3, AC4):** Changed default `externalLabel` in `ArtifactCard.astro` from `` `View ${title} (opens in new tab)` `` to `` `View ${title}` `` (no false "new tab" claim while `target="_self"`). Updated prop JSDoc. Added two tests to `web/test/glassbox-components.component.test.ts` asserting: (a) default external `aria-label` has no "new tab" text when `target="_self"`, (b) explicit `externalLabel` renders verbatim. Existing consumers (glass-box index, loandemo) pass explicit labels — unaffected.
- **Task 3 (AC5):** Added `formatDotDate(iso: string): string` helper to `web/src/lib/timeline.ts` using a module-level `Intl.DateTimeFormat` with `timeZone: 'UTC'` — TZ-independent by construction. Preserves `~`-passthrough, `[`-prefixed passthrough, invalid-date fallback. Replaced both duplicated IIFEs in `FlagshipNode.astro` (milestone + cluster-dot). Added `web/test/timeline-format.test.ts` with 15 tests covering correct label output, passthrough behaviors, and TZ-independence (UTC vs America/Los_Angeles via child-process invocation).
- **Task 4 (AC6/NFR):** ROOT gate results: `pnpm run typecheck` ✅, `pnpm run lint` ✅, `pnpm run format:check` ✅, `pnpm run test` ✅ (107 + 2 + 523 = 632 tests), `pnpm run test:e2e` ✅ (151 e2e tests), `pnpm run check-deterministic` ✅ (byte-identical builds). LH (`pnpm run lh`) fails pre-existing (404 on `/about` due to `trailingSlash: 'always'` + LH config testing without trailing slash) — not a regression from this story.

### File List
- `api/src/app.ts` (new — Hono app module, no `serve()` import side-effect)
- `api/src/index.ts` (modified — bootstrap only: imports app, calls `serve()`)
- `api/src/health.test.ts` (modified — import from `./app.ts` instead of `./index.ts`)
- `web/src/components/glassbox/ArtifactCard.astro` (modified — default `externalLabel` no longer claims "new tab"; JSDoc updated)
- `web/src/components/timeline/FlagshipNode.astro` (modified — both date IIFEs replaced with `formatDotDate()`)
- `web/src/lib/timeline.ts` (modified — added `formatDotDate()` helper with TZ-pinned `Intl.DateTimeFormat`)
- `web/test/glassbox-components.component.test.ts` (modified — two new tests for label↔target contract)
- `web/test/timeline-format.test.ts` (new — 15 unit tests for `formatDotDate` including TZ child-process proof)

### Review Findings

**Code review — 2026-06-06 (epic-cycle code-review stage; model: claude-opus-4-8; finalized by the lead after the review agent verified all ACs but yielded mid-gate-rerun before writing this section).** Adversarial review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) of the uncommitted Story 3.0 diff. Result: **✅ Clean review — APPROVED, status → done.** 0 HIGH, 0 MED, 0 LOW-deferred, 0 patches required. Every AC verified against the real build + runtime, with mutation testing to prove the new tests are non-vacuous, and the LITERAL canonical gate re-run green by both the review agent and the lead.

**Verification evidence (re-run, not taken on faith):**
- **AC1/AC2 (api app/bootstrap split):** the Hono `app` moved to `api/src/app.ts` (no `serve()`); `api/src/index.ts` is now a pure bootstrap. Importing the module under test opens **no socket** — `pnpm --filter api test` is GREEN on this VM with the live `portfolio-api` holding `:8787` (EADDRINUSE eliminated), and the in-process `app.request('/api/health')` assertions (200 + `{status:"ok"}` + JSON content-type) still pass (Rule 3 runtime tier preserved). Production entrypoint unchanged — `node api/dist/index.js` still binds the port; `api/package.json`, `scripts/deploy.sh`, and the systemd unit are untouched. API_PORT validation correctly NOT pulled forward (stays deferred to Story 3.3's `api/src/env.ts`).
- **AC3/AC4 (ArtifactCard label honesty):** default external `externalLabel` is now `View ${title}` (no false "(opens in new tab)" while `target="_self"`); JSDoc updated; explicit consumer labels still win verbatim (`/glass-box/` passes "Visit the live site: …"; `/work/loandemo/` renders no external `ArtifactCard`). Locked by `web/test/glassbox-components.component.test.ts` + 3 real-runtime e2e in `web/e2e/glassbox-index.spec.ts`. Mutation-verified: re-introducing "(opens in new tab)" turns the default-branch test RED. Closes both the `[2.3]` and the `[2.4→carries-2.3]` deferred entries at the component source.
- **AC5 (timeline date determinism, NFR-6):** single shared `formatDotDate(iso)` in `web/src/lib/timeline.ts` built on a module-level `Intl.DateTimeFormat('en-US',{month:'short',year:'numeric',timeZone:'UTC'})` — TZ-independent by construction; both duplicated IIFEs in `FlagshipNode.astro` replaced; `~`/`[`/invalid passthrough preserved; `<time datetime>` still verbatim. Locked by `web/test/timeline-format.test.ts` (label cases + a child-process UTC-vs-America/Los_Angeles proof) + 4 real-runtime e2e in `web/e2e/timeline.spec.ts`. Mutation-verified: dropping `timeZone:'UTC'` reds the LA unit tests; emitting a day-of-month reds all 4 timeline e2e. `check-deterministic` still PASSES.
- **AC6 (Rule 5 LITERAL canonical gate):** `pnpm test:all` (= `typecheck && lint && format:check && test && test:e2e && lh`) re-run end-to-end → **EXIT 0** (632 vitest + 158 e2e + Lighthouse collecting BOTH `/` and `/about/`, all four budgets asserting). The pre-existing Rule-2 leftover in `lighthouserc.json` (slashless `/about` audit URL 404ing under `trailingSlash:'always'`) was fixed to `/about/` — the one internal-URL surface Story 2.0 missed; this is what makes the `lh` step (hence the whole gate) green for all of Epic 3.
- **Rule 1 (Integration ACs):** N/A — cleanup/refactor; the `app.ts` split restructures existing code and introduces no new consumed service. The story's `## Integration ACs` section correctly declares this; the existing `/api/health` `app.request()` assertion + the unchanged prod entrypoint ARE the integration verification. The first new service surface is `/api/invite` in Story 3.3.
- **Rule 3 (real-runtime evidence):** satisfied on every user-facing surface touched — `/glass-box/` (3 e2e) and `/timeline/` (4 e2e) against the built/served site; the api keeps its in-process `app.request()` runtime assertion.
- **Rule 5 (NFR tripwire) / Rule 6 (ADR):** Rule 5 — no NFR was found unmeasurable (NFR-1/NFR-6 measured and pass); the lh gate gap was fixed at the planning-artifact level (AC6 + Task 4/5 amended), not worked around. Rule 6 — no `docs/adr/` registry exists, N/A.

**Findings:** none. No HIGH/MED/LOW findings; no patches; **no new entries added to `deferred-work.md`** (the three included items were marked RESOLVED there with verification notes; no defer-class findings surfaced). The deferred items DEFERRED by this story's triage (API_PORT → 3.3, React chunk → 3.4, etc.) remain tracked for their named stories. Status set to **done**.

---

## Appendix — Epic 2 deferred-work + retrospective triage (created by the /epic-cycle retro-review gate)

Triage performed at Epic 3 start (2026-06-06), covering Epic 2's retrospective action items + every still-open `deferred-work.md` entry. Decision key: **INCLUDE** = built in this Story 3.0; **DEFER** = remains tracked in `deferred-work.md` for a named later story/epic/trigger; **DROP** = no action needed (already resolved, or nothing to fix).

| Item | Source | Triage Decision |
|---|---|---|
| `[2.1 · environmental] EADDRINUSE:8787` api test not port-robust (≡ retro A3) | deferred-work (2.1 pipeline) + retro A3 | **INCLUDE in Story 3.0** — pulled forward from the retro's "~3.3" so the canonical `pnpm test:all` gate is green for ALL of Epic 3 (Rule 5). Root-cause fix: remove the import-time `serve()` bind. |
| `[2.3 · LOW] ArtifactCard default external label "(opens in new tab)" vs target="_self"` (carried fwd from 2.3→2.4→2.5, still open) | deferred-work (2.3 CR, 2.4 CR) | **INCLUDE in Story 3.0** — trivial, self-contained a11y fix; Epic 3 Story 3.5 ships external follow/subscribe links likely to reuse ArtifactCard. Align default label to actual same-tab behavior + isolated test. |
| `[2.4 · LOW latent determinism] timeline toLocaleDateString builder-TZ-sensitive` | deferred-work (2.4 CR) | **INCLUDE in Story 3.0** — cheap NFR-6 hardening before Epic 3 adds dynamic surfaces; extract one `formatDotDate` helper (TZ-independent) + a TZ-pinned test. |
| `[1.1 · LOW] API_PORT coerced with no validation/fail-fast` | deferred-work (1.1 CR) | **DEFER → Story 3.3** — lands with the typed `api/src/env.ts` (first env-consuming story: DATABASE_URL/RESEND_API_KEY). Creating env.ts now (3.0) just for API_PORT would be a partial module 3.3 rebuilds. |
| `[1.1 · LOW] API_PORT default 8787 duplicated as a literal` | deferred-work (1.1 CR) | **DEFER → Story 3.3** — centralize in `api/src/env.ts` with the same trigger as above. |
| `[1.2 · LOW] Unreferenced React _astro/client.*.js chunk (~193KB) in dist` (≡ retro A4) | deferred-work (1.2 CR) + retro A4 | **DEFER → Story 3.4** — belongs with the FIRST React island (the accessible Invite-Me form). Confirm the integration is needed exactly where the island ships + re-verify 0-JS on non-island routes there. |
| `[1.1 · LOW] SSE CitationEvent shape diverges from architecture` | deferred-work (1.1 CR) | **DEFER → Epic 4** — the `/api/guide` SSE wire shape is owned by Story 4.3/4.4; fixing now is speculative. |
| `[2.1 · LOW latent] renderGlassbox localeCompare ICU-sensitive for non-ASCII keys` | deferred-work (2.1 CR) | **DEFER → Epic 4 / when a non-ASCII slug is first added** — ASCII-only today; same allowlist feeds the Epic 4 KB index; pin locale-independent comparison then. |
| `[2.2 · LOW latent] ArtifactReader YAML-frontmatter strip regex could over-strip` | deferred-work (2.2 CR) | **DEFER → Epic 4 KB hardening** — all current artifacts open with real frontmatter; the same loader feeds the Epic 4 KB index — harden (gray-matter / tighter regex) there. |
| `[2.3 · LOW latent] glassbox.index.ts in web/src/content/ (collections footgun)` | deferred-work (2.3 CR) | **DEFER → when Astro content collections are adopted** — no `content.config.ts` exists, so it's an ordinary module today; relocate to `web/src/lib/` if/when collections land. |
| `[1.3 · LOW] Fork CTA curly apostrophe vs spine straight ASCII` | deferred-work (1.3 CR) | **DEFER** — owner house-style decision, non-blocking; rendered glyph is typographically correct and matches the mock. |
| `[1.4 · LOW] #close bottom-of-page aria-current nuance` (+ `[1.9]` same) | deferred-work (1.4, 1.9 CR) | **DEFER → Epic 5** — belongs with the cinematic scroll/observer rework where the active-band heuristic is revisited. Enhancement-quality, not a floor/AC issue. |
| `[1.4 · LOW] current-tick halo literal rgba vs token` | deferred-work (1.4 CR) | **DEFER** — tokens-layer change; no trigger until the accent gains channel/alpha tokens or `color-mix()`. Spec-faithful today. |
| `[1.10 · LOW] deploy.sh no clean-tree precheck before git pull --ff-only` | deferred-work (1.10 CR) | **DEFER** — optional operator-ergonomics polish; safe today (`set -euo pipefail` + `--ff-only` fail fast). No epic assignment. |
| Codify Rule 5 + Rule 6 (retro A1, A2) | epic-2-retro action items | **DROP** — already ✅ done in the Epic-2 retro commit; verified present in `.claude/rules/project-rules.md` (Rules 5–6). |
| `[1.7 · LOW] trailing-slash link↔canonical↔sitemap mismatch` | deferred-work (1.7 smoke) | **DROP** — ✅ RESOLVED by Story 2.0 (trailingSlash 'always' + form-equality test). |
| `[1.8 · LOW] root pnpm build no longer emits api/dist` | deferred-work (1.8 CR) | **DROP** — ✅ RESOLVED by Story 1.10 (`scripts/deploy.sh` builds the api explicitly before restart). |
| `[1.5 · LOW] dev-note "byte-identical" wording imprecise` | deferred-work (1.5 CR) | **DROP** — no action; output correct, only wording was loose. |
| `[1.2 · LOW] empty <footer> stray hairline band` | deferred-work (1.2 CR) | **DROP** — ✅ RESOLVED by Story 1.7 (global footer filled on every Mirror page). |
| `[2.4 · LOW] pnpm format:check RED across ~14 prior-epic files` | deferred-work (2.4 CR) | **DROP** — ✅ RESOLVED between 2.4 and 2.6 (repo-wide format sweep; `format:check` green at Epic-2 close). |

**Triage totals (still-open deferred-work + retro items): INCLUDE = 3 · DEFER = 11 · DROP = 6.** The DEFER items stay tracked in `deferred-work.md` for their named stories/epics/triggers (3.3 api env, 3.4 React island, Epic 4 KB, Epic 5 scroll, owner/low-pri). Retro A3 is resolved early here; A4 defers to 3.4.
