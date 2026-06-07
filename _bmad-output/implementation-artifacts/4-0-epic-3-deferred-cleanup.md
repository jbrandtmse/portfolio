# Story 4.0: Epic 3 Deferred Cleanup — KB-loader hardening: deterministic glass-box sort & frontmatter-strip robustness

---
baseline_commit: b21e95fea20fea83349b8cf426e2cbed1a140f1e
---

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Created by the /epic-cycle retro-review gate (Epic 3 → Epic 4), 2026-06-07. Cleanup story; NOT in epics.md.
     Absorbs the two Epic-relevant deferred-work.md items that pre-empt a class of bug in the NEW Story 4.1 KB
     index/loader (which reads the SAME glass-box allowlist and strips the SAME markdown frontmatter):
       INCLUDED: [2.1] renderGlassbox localeCompare → deterministic locale-independent sort (NFR-6);
                 [2.2] ArtifactReader frontmatter-strip regex → robust to an hr-opened body.
     Both were pre-triaged "DEFER → Epic 4 KB hardening" by Story 3.0's appendix; they come due now.
     DEFERRED to Story 4.3/4.4: [1.1] SSE CitationEvent shape (owned by /api/guide's first consumer; retro A5).
     DEFERRED to Story 4.3: [3.3] rate-limiter "sliding window" relabel (when the /api/guide limiter is built).
     Full Epic-3 deferred-work + retro triage table is appended at the end of this file. -->

## Story

As the site owner (Josh),
I want the two Epic-relevant latent footguns cleared before Story 4.1 builds the Knowledge Base index on top of them — the glass-box artifact sort made locale-independent (deterministic regardless of the build host's ICU/locale), and the markdown frontmatter strip hardened so it can never over-strip a body that legitimately opens with a `---` thematic break,
so that the Story 4.1 KB indexer (which reads the SAME `content/glassbox.allowlist.ts` allowlist and chunks the SAME curated markdown) inherits a deterministic, parse-safe foundation rather than re-learning these the hard way, and NFR-6 (byte-stable build) holds even if a future curated entry introduces a non-ASCII slug.

## Context & decision (read first)

This is the `/epic-cycle` Epic-3 → Epic-4 retro-review cleanup story. The full triage of every still-open Epic-3 deferred-work item + retro action item is in the appendix. **Two** items are **INCLUDED** here; the rest **DEFER** to their natural Epic-4 feature stories (4.3 `/api/guide`, 4.4 GuidePanel), to launch, or to later epics, or are **DROPPED** as already-resolved or moot.

Both included items were explicitly pre-triaged **"DEFER → Epic 4 KB hardening"** by Story 3.0's appendix (rows for `[2.1]` and `[2.2]`) and named in the Epic-3 retro's "Deferred items that become live in Epic 4" list. They come due now because **Story 4.1 builds `scripts/build-kb-index.ts` over the same allowlist + the same artifact markdown** — so the determinism surface and the frontmatter-strip surface are about to gain a second consumer. Clearing them in 4.0 means 4.1 builds on a solid base and can reuse the hardened frontmatter handling rather than duplicating an under-hardened regex. Both are small, self-contained, low-risk, and not naturally owned by a 4.1–4.4 feature story (they touch existing Epic-2 code).

### Included item 1 — glass-box artifact sort is locale/ICU-sensitive (`[2.1 · LOW latent determinism]`, NFR-6)

`scripts/render-glassbox.ts:138-143` orders the emitted artifacts deterministically by date then slug — but with `String.prototype.localeCompare` and **no locale argument**:

```ts
artifacts.sort((a, b) => {
  const dateCmp = a.date.localeCompare(b.date);   // primary: ISO-8601 git committer date
  if (dateCmp !== 0) return dateCmp;
  return a.slug.localeCompare(b.slug);            // secondary: kebab-case slug
});
```

Without a locale, `localeCompare` is ICU/host-locale-sensitive **for non-ASCII strings** — a latent determinism surface (NFR-6). It is stable today only because both keys are pure ASCII (ISO date + kebab slug), so the default `localeCompare` collapses to a code-unit order on this UTC host. The exposure opens the moment a future curated entry introduces a non-ASCII `slug` (on the secondary key) — and **the same `GLASSBOX_ALLOWLIST` feeds the Story 4.1 KB index**, which will sort/iterate the same set.

**Decision — replace `localeCompare` with a fully-deterministic, locale-independent code-unit comparison on BOTH keys.** The simplest fully-deterministic shape (the deferred-work's own first recommendation) is a plain code-unit compare: `a < b ? -1 : a > b ? 1 : 0`. Extract it as one tiny named helper (e.g. `byCodeUnit(a, b)` exported from `render-glassbox.ts`, or a local const) and use it for both the date and slug comparisons so the order is identical under any host locale. Preserve the exact current order for the seeded ASCII set (the existing 6 artifacts must serialize in the same order → `web/src/generated/glassbox.json` stays byte-identical on the UTC VM, NFR-6). Add a determinism test that proves the order is independent of locale using a **non-ASCII slug fixture** (the case the current code is latent on).

### Included item 2 — markdown frontmatter-strip regex can over-strip an hr-opened body (`[2.2 · LOW latent]`)

`web/src/components/glassbox/ArtifactReader.astro:62-64` strips a leading YAML frontmatter block before rendering the artifact body:

```ts
const strippedBody = body.replace(/^---[\s\S]*?---\n?/, '');
```

The pattern is `^`-anchored and non-greedy, so today it removes ONLY a leading `--- … ---` block — correct for all 6 current allowlisted artifacts, which each open with genuine YAML frontmatter (`---\n<key>: …`). The latent edge: a body that legitimately **OPENS with a markdown `<hr>`** (a bare `---` thematic break) and contains a **later** `---` line would have the entire span between the two `---` lines eaten as if it were frontmatter — silently dropping real content. **The same artifact markdown feeds the Story 4.1 KB index** (which will chunk these docs); a robust strip there is load-bearing for grounding fidelity, so hardening the existing instance + establishing the pattern now de-risks 4.1.

**Decision — tighten the strip so a leading `<hr>` is never mistaken for frontmatter.** Require the opening fence to be a *frontmatter* fence — i.e. the line after the opening `---` must look like a YAML key (`key:` shape), which a thematic break never satisfies. A robust, dependency-free form:

```ts
// Only strip a leading block that is REAL YAML frontmatter: opening fence
// immediately followed by a `key:`-shaped line, then a closing fence.
body.replace(/^---\r?\n(?=[^\n]*?:\s)[\s\S]*?\r?\n---\r?\n?/, '');
```

(Exact regex is the dev's call — the **behavior** is the AC: a leading real-frontmatter block is stripped; a body opening with a bare `---` thematic break is NOT over-stripped.) **Preferred shape:** lift the hardened strip into one small reusable plain-TS helper (e.g. `stripFrontmatter(md: string): string`) so the Story 4.1 `build-kb-index.ts` can import the *same* hardened logic instead of re-implementing it — a natural home is a new `scripts/lib/markdown.ts` (the KB indexer is a build-time script; Astro build-time frontmatter can import it) or `web/src/lib/`. **Acceptable fallback** if a clean cross-package home proves awkward: harden the regex in place in `ArtifactReader.astro` and Story 4.1 reuses the proven pattern (its story will carry that AC). Either way, add a scoped test for the hr-opened body (the exact case the current regex over-strips) AND keep the existing real-frontmatter strip behavior (all 6 current artifacts render identically — `web/dist` byte-stable).

## Acceptance Criteria

1. **Glass-box artifact sort is deterministic and locale-independent (NFR-6).**
   **Given** `scripts/render-glassbox.ts` ordering the rendered artifacts by date (primary) then slug (secondary)
   **When** the generator runs under any host locale / ICU
   **Then** both comparisons use a locale-independent code-unit ordering (no bare `localeCompare`), so a set containing a **non-ASCII slug** sorts into the same order regardless of the runner's locale
   **And** the seeded ASCII set's order is unchanged — `web/src/generated/glassbox.json` is byte-identical to the pre-change output on the UTC build host (the 6 current artifacts serialize in the same order), and `pnpm run check-deterministic` still PASSES (two clean builds byte-identical).

2. **Markdown frontmatter strip is robust to an hr-opened body (no over-strip).**
   **Given** the artifact frontmatter-strip logic (`web/src/components/glassbox/ArtifactReader.astro`, optionally extracted to a reusable `stripFrontmatter` helper)
   **When** it processes (a) a body that opens with genuine YAML frontmatter (`---\n<key>: …\n---\n<body>`) and (b) a body that opens with a bare `---` thematic break followed by content and a later `---` line
   **Then** case (a) has ONLY its leading frontmatter block removed (unchanged from today — all 6 current artifacts render identically; `web/dist` byte-stable), and case (b) is **NOT** over-stripped — the `<hr>`-opened content between the two `---` lines is preserved in the rendered body.

3. **Non-vacuous, discoverable tests lock both behaviors.**
   **Given** the two changes above
   **When** the default `pnpm test:all` suite runs
   **Then** a test asserts the locale-independent glass-box order via a **non-ASCII slug fixture** (the case the old `localeCompare` was latent on), and a test asserts the frontmatter strip preserves an hr-opened body while still stripping a real leading frontmatter block — both **scoped** to the real module/behavior they verify (skill-rules Rule 8 + project-rules Rule 8: exercise the REAL module, scope the assertion), discoverable by the default suite (correct naming, not ignored), and **mutation-verified non-vacuous** (reverting either fix reds the corresponding test).

4. **The LITERAL canonical gate `pnpm test:all` is green end-to-end, and the build stays byte-deterministic (Rule 5, NFR-1, NFR-6).**
   **Given** the canonical launch gate `pnpm test:all` (= `typecheck && lint && format:check && test && test:e2e && lh`) plus the separate NFR-6 check `pnpm run check-deterministic`
   **When** the **literal `pnpm test:all` command** runs end-to-end after the change (NOT a hand-narrowed package-scoped subset — the Rule 5 anti-pattern)
   **Then** every step including `lh` is green, `prettier --check .` / `eslint` cover the new/changed `.ts` test files and any touched `.astro`, the 0-executable-JS-by-default floor is unaffected (NFR-1; render-glassbox is build-time, ArtifactReader stays static/JS-off-correct), and the build is byte-deterministic across two clean builds (`check-deterministic`, NFR-6 — including the unchanged seeded `glassbox.json` order from AC1).

## Integration ACs

This is a cleanup/hardening story over **existing Epic-2 code** — it changes a sort comparator and tightens a frontmatter-strip regex. It introduces **no new runtime service**.

- If the dev takes the **preferred** shape and extracts a reusable `stripFrontmatter` helper (or a `byCodeUnit` comparator) into a shared module, that module's **first consumer is Story 4.1** (the KB indexer `scripts/build-kb-index.ts`, which reads the same allowlist + strips the same frontmatter). Per skill-rules Rule 1's no-consumer-yet clause: **no consumer ships in this story; the first consumer will be Story 4.1.** Story 4.1's ACs will exercise the helper against the real KB markdown.
- The "integration" verified *now* is the existing real-runtime coverage of the two surfaces being hardened: `render-glassbox` is exercised by the scripts vitest suite + the `/glass-box/` e2e (the generated `glassbox.json` order), and `ArtifactReader` is exercised by the `/glass-box/<artifact>/` reader e2e — both real-runtime, not internal-state checks. The change must leave both green (AC2/AC4).

## Tasks / Subtasks

- [x] **Task 1 — Make the glass-box artifact sort locale-independent (AC1, AC3).**
  - [x] In `scripts/render-glassbox.ts`, replace both `localeCompare` calls (lines ~140, ~142) with a fully-deterministic code-unit comparison (e.g. a tiny `byCodeUnit(a, b)` helper returning `a < b ? -1 : a > b ? 1 : 0`), applied to the date (primary) and slug (secondary) keys. Keep the date-then-slug precedence.
  - [x] Confirm the seeded set's order is unchanged: re-generate and diff `web/src/generated/glassbox.json` against the committed file — it must be byte-identical (the 6 current ASCII slugs already sort by code unit, so order holds).
  - [x] Add a determinism test (extend `scripts/render-glassbox.test.ts` or a sibling) that feeds a small set including a **non-ASCII slug** and asserts the resulting order is the deterministic code-unit order — the case the old `localeCompare` was latent on. Mutation-check: reverting to bare `localeCompare` must NOT change *this ASCII set*, so the test MUST use a non-ASCII fixture (or assert the comparator directly) to be non-vacuous.
- [x] **Task 2 — Harden the markdown frontmatter strip against an hr-opened body (AC2, AC3).**
  - [x] Tighten the strip so the opening `---` fence is only treated as frontmatter when immediately followed by a `key:`-shaped line (so a bare `---` thematic break is never mistaken for frontmatter). **Preferred:** extract `stripFrontmatter(md: string): string` to a reusable plain-TS module (recommend new `scripts/lib/markdown.ts`, importable by both the web ArtifactReader and the Story-4.1 build-time KB indexer; `web/src/lib/` is an acceptable alternative). **Fallback:** harden the regex in place in `web/src/components/glassbox/ArtifactReader.astro:64` if a clean shared home is awkward — Story 4.1 then reuses the proven pattern.
  - [x] Wire `ArtifactReader.astro` to the hardened logic (call the helper, or use the tightened regex). Verify all 6 current artifacts still strip their real leading frontmatter and render identically (`web/dist` byte-stable for the reader pages).
  - [x] Add a scoped test asserting: (a) a body opening with genuine `---\n<key>: …\n---\n<body>` has ONLY the frontmatter removed; (b) a body opening with a bare `---` thematic break + later `---` is NOT over-stripped (the between-content is preserved). Scope to the real module/helper (Rule 8). Mutation-check: the old `/^---[\s\S]*?---\n?/` regex must red test (b).
- [x] **Task 3 — Verify the floor with the LITERAL canonical gate (AC4).**
  - [x] Run the **literal** `pnpm test:all` end-to-end (Rule 5 — NOT a step-by-step hand-narrowed subset). Confirm ALL steps green INCLUDING `lh`. Confirm `format:check` (`prettier --check .`) and `eslint` cover the new test file(s) and any touched `.astro`/`.ts`.
  - [x] Run `pnpm run check-deterministic` (separate NFR-6 check): two clean builds byte-identical; confirm `web/src/generated/glassbox.json` is unchanged from the committed version (seeded order preserved). Note any files touched in the Dev Agent Record.

## Dev Notes

### Current state (files being modified — read before editing)

- **`scripts/render-glassbox.ts`** — `renderGlassbox(allowlist, repoRoot)` reads each allowlisted artifact body, attaches `gitCommitterDate`, pushes `{slug,type,title,date,curatorNote,body}`, then sorts (lines 138–143) with `a.date.localeCompare(b.date)` primary / `a.slug.localeCompare(b.slug)` secondary. `renderGlassboxGenerator.run()` writes the sorted array to `web/src/generated/glassbox.json` as `JSON.stringify(artifacts, null, 2) + '\n'`. Consumers of the JSON: the `/glass-box/` index + the per-artifact reader. Existing tests: `scripts/render-glassbox.test.ts`, `scripts/render-glassbox.security.test.ts`. The allowlist source is `content/glassbox.allowlist.ts` (`GLASSBOX_ALLOWLIST`) — the SAME file the Story 4.1 KB indexer reads.
- **`web/src/components/glassbox/ArtifactReader.astro`** — build-time markdown→HTML (0 client JS) via a custom `marked` renderer that demotes headings. Line 64: `const strippedBody = body.replace(/^---[\s\S]*?---\n?/, '');` then `articleMarked.parse(strippedBody)`. The `displayDate` already uses `timeZone:'UTC'` (deterministic — leave as-is). Consumer: `web/src/pages/glass-box/[artifact].astro`. Existing tests: `web/test/glassbox-reader.test.ts`, e2e `web/e2e/glassbox-reader.spec.ts`.
- **`content/kb/`** — does NOT exist yet; Story 4.1 creates it + `scripts/build-kb-index.ts`. This story does NOT create the KB index — it only hardens the two surfaces 4.1 will reuse.

### Constraints / invariants to preserve

- **NFR-6** deterministic, byte-stable build — the seeded `glassbox.json` order MUST be unchanged (AC1); re-verify two builds byte-identical via `check-deterministic`. The whole POINT of item 1 is *more* determinism, so any change to the seeded output is a regression.
- **NFR-1** 0-executable-JS-by-default — `render-glassbox` is build-time tooling; `ArtifactReader` stays a static server-rendered component. No client JS added.
- **Rule 5 (canonical gate):** verify with the ROOT `pnpm test:all`, not a package-scoped subset. Confirm globs cover any new `.ts` test files and the changed `.astro`.
- **Rule 8 (test discoverability + real module/scoped):** new tests must run in the default suite, exercise the REAL module/helper (not an inline copy), and be scoped to the specific behavior; mutation-verify each reds on a real-source break.
- **No scope creep into 4.1:** do NOT build the KB index, `content/kb/`, or `build-kb-index.ts` here. This story only hardens the two existing surfaces (+ optionally extracts a helper 4.1 will consume).

### Project Structure Notes

- `scripts/` is flat (no `scripts/lib/` yet) — creating `scripts/lib/markdown.ts` for the shared `stripFrontmatter` helper is the recommended (optional) home, since the primary future consumer is the build-time `scripts/build-kb-index.ts` (Story 4.1). `web/src/lib/` (holds `glassbox.ts`, `timeline.ts`) is an acceptable alternative. `shared/src/` is reserved for cross-package *contracts* (`events.ts`, `schemas.ts`) — not a markdown-util home.
- New files limited to (optionally) `scripts/lib/markdown.ts` + 1–2 test files. No `api/` changes, no `shared/` changes.

### References

- [Source: _bmad-output/implementation-artifacts/deferred-work.md#Deferred from: code review of story-2.1] — `[2.1 · LOW latent]` `renderGlassbox` `localeCompare` ICU-sensitivity; recommended fix = locale-independent / code-unit compare; "same allowlist feeds Epic 4 KB index."
- [Source: _bmad-output/implementation-artifacts/deferred-work.md#Deferred from: code review of story-2.2] — `[2.2 · LOW latent]` `ArtifactReader` YAML-frontmatter strip could over-strip an hr-opened body; recommended fix = require a `key:`-shaped line after the fence / proper extractor + an hr-opened test; "same loader feeds the Epic 4 KB index."
- [Source: _bmad-output/implementation-artifacts/3-0-epic-2-deferred-cleanup.md#Appendix] — both items pre-triaged "DEFER → Epic 4 KB hardening" (rows for `[2.1]`, `[2.2]`).
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-06-07.md#Epic 4 preparation] — "Deferred items that become live in Epic 4 (triage into Story 4.0): `[2.1] localeCompare`, `[2.2] ArtifactReader frontmatter regex`."
- [Source: .claude/rules/project-rules.md#8] — tests assert against the REAL module + a SCOPED surface; mutation-verify.
- [Source: scripts/render-glassbox.ts#L138-143] — the two `localeCompare` calls.
- [Source: web/src/components/glassbox/ArtifactReader.astro#L64] — the `^---[\s\S]*?---\n?` strip.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (2026-06-07)

### Debug Log References

None — implementation was straightforward. One regex iteration required (initial `(?=[^\n]*?:\s)` lookahead was too loose, matching embedded `key:` in prose; tightened to `(?=[a-zA-Z_][\w-]*\s*:(?:\s|$))` to anchor the YAML-key check to the START of the second line).

### Completion Notes List

- **Task 1 (AC1/AC3):** Exported `byCodeUnit(a, b)` helper from `scripts/render-glassbox.ts`; replaced both `localeCompare` calls in the sort. `glassbox.json` regenerated and confirmed byte-identical to committed version. Added 6 new tests in `render-glassbox.test.ts`: 5 unit tests for `byCodeUnit` (including non-ASCII ä vs z) and 1 integration test using a synthetic allowlist with a `ñoño` slug asserting code-unit order `['alpha', 'zeta', 'ñoño']`. Mutation-verified: `localeCompare` places `ñoño` between `alpha` and `zeta` (Spanish-locale collation), causing the test to fail — the non-ASCII fixture is non-vacuous per Rule 8.

- **Task 2 (AC2/AC3):** Preferred shape taken — extracted `stripFrontmatter(md: string): string` to new `scripts/lib/markdown.ts`. The regex `^---\r?\n(?=[a-zA-Z_][\w-]*\s*:(?:\s|$))[\s\S]*?\r?\n---\r?\n?` anchors the YAML-key check to the start of the second line, so a bare `---` thematic break (even one with prose containing `key:`) is never stripped. `ArtifactReader.astro` updated to import and call the helper. Added 17 tests in `scripts/lib/markdown.test.ts` covering: real frontmatter stripped (6 cases incl. brainstorm style + CRLF), hr-opened body preserved (6 cases), no-frontmatter unchanged (3 cases), key: boundary (2 cases). All 6 seeded artifacts still strip + render identically (confirmed by web test suite + byte-stable build).

- **Task 3 (AC4):** Ran `pnpm test:all` literal end-to-end: typecheck ✓ (0 errors), lint ✓, format:check ✓ (all files incl. new .ts), test ✓ (scripts 9 files/130 tests, api 7/68, web 18/630), test:e2e ✓ (213 passed), lh ✓. Ran `pnpm run check-deterministic`: two builds hash `daa4689ca24f11faeb8c50160fe434c95d2390faa4e6e9b90b9cae40b76164b8` — byte-identical. `web/src/generated/glassbox.json` has zero git diff vs committed version.

- **Mutation verification performed (Rule 8):** (1) `byCodeUnit` test with `ñoño` slug — `localeCompare` produces `['alpha', 'ñoño', 'zeta']` vs code-unit `['alpha', 'zeta', 'ñoño']` (different → test reds on revert). (2) `stripFrontmatter` hr-opened test — old regex `/^---[\s\S]*?---\n?/` strips content between fences (result differs from input → test reds on revert).

### File List

- `scripts/render-glassbox.ts` — added exported `byCodeUnit` helper, replaced 2 `localeCompare` calls
- `scripts/render-glassbox.test.ts` — added `byCodeUnit` import + 2 new `describe` blocks (6 new Story 4.0 tests); added `afterAll`/`beforeAll` to vitest imports
- `scripts/lib/markdown.ts` — NEW: `stripFrontmatter(md: string): string` helper
- `scripts/lib/markdown.test.ts` — NEW: 17 tests for `stripFrontmatter` (real-frontmatter strip + hr-body preservation + no-frontmatter passthrough + key: boundary) <!-- code-review: corrected from "14" to the actual file count of 17 (6 real-frontmatter + 6 hr-opened + 3 no-frontmatter + 2 boundary), matching the QA summary -->

- `web/src/components/glassbox/ArtifactReader.astro` — import `stripFrontmatter` from `scripts/lib/markdown.ts`; replace inline regex with helper call

## Review Findings

**Code-review stage of `/epic-cycle` (Epic 4), 2026-06-07. Reviewer model: claude-opus-4-8 (1M). Adversarial layers: Blind Hunter / Edge-Case Hunter / Acceptance Auditor.**

### Verdict: APPROVED — Status → done

Zero HIGH, zero MED defects. Both INCLUDED items resolved with mutation-proven non-vacuous tests; the canonical gate and NFR-6 determinism check both re-run by the reviewer to exit 0; the cross-package import decision verified sound. 1 patch auto-resolved inline (doc-only). 2 LOW-latent items deferred to Story 4.1. 3 findings dismissed.

### AC verification (against the real runtime, re-run by the reviewer)

- **AC1 (deterministic locale-independent sort, NFR-6) — PASS.** Both sort keys use the new exported `byCodeUnit()` code-unit comparator (no bare `localeCompare`). Seeded `web/src/generated/glassbox.json` is byte-identical to committed (sha256 `23c69f28…`, zero git diff after a fresh `build:content`). `pnpm run check-deterministic` PASS — two clean builds byte-identical (tree hash `daa4689c…`). Non-ASCII `ñoño` determinism test present and **mutation-proven non-vacuous**: reverting the sort to bare `localeCompare()` reds it (this host's ICU collates `['alpha','ñoño','zeta']` vs code-unit `['alpha','zeta','ñoño']`); reverted byte-clean.
- **AC2 (frontmatter-strip robust to hr-opened body) — PASS.** `stripFrontmatter` (new `scripts/lib/markdown.ts`) requires a `key:`-shaped line after the opening fence. All 6 seeded artifacts (genuine column-0 frontmatter — verified) still strip + render identically; `web/dist` byte-stable. hr-opened bodies preserved (6 cases). **Mutation-proven non-vacuous:** reverting to the old `/^---[\s\S]*?---\n?/` regex reds 7 tests (6 hr-opened + the CRLF real-frontmatter case the hardened regex improves), with the LF real-frontmatter + no-frontmatter cases green both ways; reverted byte-clean.
- **AC3 (non-vacuous, discoverable, scoped tests, Rule 8) — PASS.** Tests import + exercise the REAL `byCodeUnit`, `renderGlassbox`, and `stripFrontmatter` (no inline copies); assertions scoped to the function/order under test (not whole-document). Discoverable by the default `scripts` vitest (`render-glassbox.test.ts` ran 21 tests incl. the 6 Story-4.0 additions; `lib/markdown.test.ts` ran 17). Both mutations above confirm non-vacuity.
- **AC4 (literal `pnpm test:all` green + byte-deterministic, Rule 5, NFR-1/6) — PASS.** Reviewer re-ran the **literal** `pnpm test:all` end-to-end → **exit 0**: typecheck 0 errors (web `astro check` 80 files, 0 errors/0 warnings/1 pre-existing benign hint); `eslint .`; `prettier --check .` clean (covers the new `.ts` + touched `.astro`); vitest scripts 130 / api 68 / web 630; Playwright **213 passed, 0 skipped, 0 failed** (incl. glass-box reader #73–94 + index #95–122); `lh` 0 failed assertions (2 URLs). `check-deterministic` PASS. NFR-1 0-JS floor intact (reader e2e asserts 0 executable scripts; render-glassbox is build-time).
- **Integration ACs / Rule 1 — PASS.** No new runtime service introduced. The no-consumer-yet clause is accurate: `byCodeUnit`/`stripFrontmatter`'s first consumer is the Story-4.1 KB indexer, which does not exist (`content/kb/`, `scripts/build-kb-index.ts` confirmed absent). Existing real-runtime coverage of both hardened surfaces (reader + index e2e) confirmed executing (Rule 3).

### Cross-package import decision (sanctioned by the story; verified SOUND)

`web/src/components/glassbox/ArtifactReader.astro` → `../../../../scripts/lib/markdown.ts` (`.ts` extension):
- (a) **web builds correctly** — exercised by `lh` (full `pnpm build`), Playwright `webServer` (`pnpm build`), and `check-deterministic` (two `astro build`s); all green, reader pages render with frontmatter stripped.
- (b) **No circular dependency** — `scripts/lib/markdown.ts` is a pure zero-import leaf; `render-glassbox.ts` imports nothing from `web`.
- (c) **`.ts`-extension resolves + is typechecked** — `tsconfig.base.json` (extended by web) sets `moduleResolution: "bundler"` + `allowImportingTsExtensions: true`; `astro check` typechecks `ArtifactReader.astro` (incl. this import) with 0 errors. Genuinely covered, not skipped.

### Triage summary

- **decision-needed: 0**
- **patch (auto-resolved inline): 1** — [Review][Patch] story File-List + completion-note said `scripts/lib/markdown.test.ts` has "14 tests"; actual file + QA summary = **17** (6 real-frontmatter + 6 hr-opened + 3 no-frontmatter + 2 boundary). Corrected in this file. [`_bmad-output/implementation-artifacts/4-0-epic-3-deferred-cleanup.md`]
- **defer: 2** (both LOW-latent, → Story 4.1; logged in `deferred-work.md` under "code review of story-4.0"):
  - [x] [Review][Defer] `stripFrontmatter` over-strips a degenerate `word \n :value` 2-line block (the key-shape lookahead's `\s*` spans a newline) — contrived, no allowlisted artifact triggers it, strictly narrower than the old regex. [`scripts/lib/markdown.ts:54`]
  - [x] [Review][Defer] `stripFrontmatter` does not strip an *indented*-key frontmatter block (lookahead requires column-0 key) — fails safe; matters only once a non-column-0 frontmatter source enters `content/kb/`. [`scripts/lib/markdown.ts:54`]
- **dismissed: 3** — (a) stripping an hr-opened body whose 2nd line is genuinely `word:` prose (by-design per AC2); (b) the pre-existing `'Props' is declared but never used` `astro check` hint (predates this diff; benign TS6196); (c) no completion-note vitest-count discrepancy.

### Source deferred items closed by this story

`[2.1] localeCompare` and `[2.2] ArtifactReader frontmatter regex` in `deferred-work.md` are marked **RESOLVED (Story 4.0)** with the evidence above.

---

## Appendix — Epic 3 deferred-work + retrospective triage (created by the /epic-cycle retro-review gate)

Triage performed at Epic 4 start (2026-06-07), covering Epic 3's retrospective action items + every still-open `deferred-work.md` entry. Decision key: **INCLUDE** = built in this Story 4.0; **DEFER** = remains tracked in `deferred-work.md` for a named later story/epic/trigger; **DROP** = no action needed (already resolved, or nothing to fix). Already-RESOLVED items from earlier epics (1.1 API_PORT, 1.2 React chunk, 1.7 URL form, 2.1 EADDRINUSE, 2.3/2.4 ArtifactCard label, 2.4 timeline TZ — all closed in Stories 2.0/3.0/3.3/3.4) are excluded from the table below.

| Item | Source | Triage Decision |
|---|---|---|
| `[2.1 · LOW latent] renderGlassbox localeCompare ICU-sensitive for non-ASCII keys` | deferred-work (2.1 CR) + retro Epic-4 prep | **INCLUDE in Story 4.0** — the same `GLASSBOX_ALLOWLIST` feeds the Story 4.1 KB index; pin a locale-independent code-unit sort + non-ASCII-fixture determinism test now so 4.1 inherits a deterministic base (NFR-6). |
| `[2.2 · LOW latent] ArtifactReader YAML-frontmatter strip could over-strip an hr-opened body` | deferred-work (2.2 CR) + retro Epic-4 prep | **INCLUDE in Story 4.0** — the same artifact markdown feeds the Story 4.1 KB index; harden the strip (require a `key:`-line after the fence) + hr-opened test, preferably as a reusable `stripFrontmatter` helper 4.1 can import. |
| `[1.1 · LOW] SSE CitationEvent shape diverges from architecture (`shared/src/events.ts` `{id,title,url}` vs `{route,label}`)` | deferred-work (1.1 CR) + retro A5 | **DEFER → Story 4.3 / 4.4** — the final wire shape is owned by `/api/guide`'s first consumer; finalizing it blind in 4.0 would be speculative (same rationale as the original 1.1 deferral). Retro A5 assigns it to the endpoint/panel stories; `shared/` stays the single source of truth for both `api` and `web`. |
| `[3.3 · LOW] rate-limiter documented "sliding window" but is a fixed window` | deferred-work (3.3 CR) | **DEFER → Story 4.3** — the suggested trigger is "the Story-4.3 `/api/guide` limiter"; relabel to "fixed window" or implement a true rolling window when that endpoint's rate-limiting is built. |
| `[3.4 · LOW] both `mailto:` fallbacks are recipient-less (no public owner address client-side)` | deferred-work (3.4 CR, re-checked 3.5) | **DEFER → launch** — needs Josh to confirm a public contact address exposed via a build-time `PUBLIC_CONTACT_EMAIL` (Rule 4 env-gate). Not an Epic-4 surface; the `/about/` "never lost" fallback carries the guarantee until then. |
| `[3.3 · LOW] MAIL_FROM/MAIL_TO validated as z.string() not z.email()` | deferred-work (3.3 CR) | **DEFER → launch** — operator-supplied trusted config that fails safe; tighten (allowing the `Name <addr>` form) when live email is enabled in the launch checklist. |
| `[3.3 · LOW] updated_at not bumped when mail_status is written` | deferred-work (3.3 CR) | **DEFER** — lands with the future `new`→`replied` admin workflow (not in Epic 4); set `updatedAt`/`$onUpdate()` on every UPDATE then. No consumer reads it yet. |
| `[3.5 · LOW] invite-submitted `source` inferred from pathname, not an explicit prop` | deferred-work (3.5 CR) | **DEFER** — accurate for the two current embeds; thread `source` as an explicit island prop when InviteForm is embedded on a 3rd surface. The Guide does not embed InviteForm, so not an Epic-4 trigger. |
| `[3.2 · LOW] Copy button aria-label not updated to the copied state` | deferred-work (3.2 CR) | **DEFER** — not an axe/AC failure (the `role=status` region announces "Copied ✓"); fold into any future BioBlock touch. Not Epic 4. |
| `[3.2 · LOW] short-bio "50 words" label vs 47-word verbatim bio` | deferred-work (3.2 CR) | **DEFER** — cosmetic; the bio is locked to `PERSON.description` (the constraint). Relabel/derive the count if `PERSON.description` is re-approved. Not Epic 4. |
| `[1.4 · LOW] #close bottom-of-page aria-current nuance` (+ `[1.9]` same) | deferred-work (1.4, 1.9 CR) | **DEFER → Epic 5** — belongs with the cinematic scroll/observer rework where the active-band heuristic is revisited. Enhancement-quality, not a floor/AC issue. |
| `[1.3 · LOW] Fork CTA curly apostrophe vs spine straight ASCII` | deferred-work (1.3 CR) | **DEFER** — owner house-style decision, non-blocking; rendered glyph is typographically correct and matches the mock. Not Epic 4. |
| `[1.4 · LOW] current-tick halo literal rgba vs token` | deferred-work (1.4 CR) | **DEFER** — tokens-layer change; no trigger until the accent gains channel/alpha tokens or a `color-mix()` convention. Spec-faithful today. Not Epic 4. |
| `[1.10 · LOW] deploy.sh no clean-tree precheck before git pull --ff-only` | deferred-work (1.10 CR) | **DEFER** — optional operator-ergonomics polish; safe today (`set -euo pipefail` + `--ff-only` fail fast). No epic assignment. |
| `[2.3 · LOW latent] glassbox.index.ts in web/src/content/ (collections footgun)` | deferred-work (2.3 CR) | **DEFER → if/when Astro content collections are adopted** — no `content.config.ts` exists, so it's an ordinary module today; relocate to `web/src/lib/` then. No Epic-4 trigger. |
| `[1.2 · LOW] empty <footer> stray hairline band` | deferred-work (1.2 CR) | **DROP** — moot: Story 1.7 fills the global footer slot on every Mirror page, so the band is no longer empty. |
| `[1.5 · LOW] dev-note "byte-identical" wording imprecise` | deferred-work (1.5 CR) | **DROP** — no action; output correct, only the completion-note wording was loose. |
| `[1.8 · LOW] root pnpm build no longer emits api/dist` | deferred-work (1.8 CR) | **DROP** — ✅ RESOLVED by Story 1.10 (`scripts/deploy.sh` builds the api explicitly before restart; confirmed in the Epic-3 retro readiness). |
| `[3.5 · LOW] sprint-status.yaml 3-5 ready-for-dev vs review tracking drift` | deferred-work (3.5 CR) | **DROP** — already reconciled: `sprint-status.yaml` now lists `3-5-…: done` (the lead's pipeline advanced it on commit, as the deferral predicted). |

**Triage totals (still-open deferred-work + retro items): INCLUDE = 2 · DEFER = 13 · DROP = 4.** The DEFER items stay tracked in `deferred-work.md` for their named stories/epics/triggers (4.3 CitationEvent + rate-limiter, launch mailto + MAIL_* email validation, Epic 5 scroll, owner/low-pri). Retro action items A1/A2 (Rules 7/8) were already codified in the Epic-3 retro commit; A3 (`/api/guide` SSE proven-to-execute harness) → Story 4.3; A4 (GuidePanel island NFR-1 carve-out) → Story 4.4; A5 (finalize `GuideQuery` + reconcile `CitationEvent`) → Story 4.3/4.4.
