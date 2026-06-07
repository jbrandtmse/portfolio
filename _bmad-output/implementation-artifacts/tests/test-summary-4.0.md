# Test Automation Summary — Story 4.0 (Epic 3 Deferred Cleanup)

QA stage of `/epic-cycle` (Epic 4). Determinism + parse-safety hardening of the
two KB-loader surfaces Story 4.1 will reuse. **No new test files were required** —
the dev stage's tests already exercise the REAL modules with scoped, non-vacuous
assertions (project-rules Rule 8). QA's work was mutation-verification of the
load-bearing assertions, discoverability confirmation, and the canonical gate.

## Tests Verified (dev-authored, QA mutation-checked)

### Unit — `scripts/render-glassbox.test.ts` (6 new Story 4.0 tests)
- [x] `byCodeUnit` comparator: code-unit sign contract incl. non-ASCII (`ä > z`, `café`).
- [x] `renderGlassbox` sort: non-ASCII `ñoño` slug fixture asserts code-unit order
  `['alpha','zeta','ñoño']` — the case the old `localeCompare` was latent on.

### Unit — `scripts/lib/markdown.test.ts` (17 tests, NEW module)
- [x] Real YAML frontmatter stripped (single/multi-key, status, no-trailing-NL, CRLF, brainstorm).
- [x] hr-opened body NOT over-stripped (bare `---`, heading, multi-divider, bullet, numeric, leading-colon).
- [x] No-frontmatter passthrough + `key:` lookahead boundary.

### Real-runtime e2e (existing, confirmed executing — not skipped)
- [x] `web/e2e/glassbox-reader.spec.ts` — `/glass-box/<artifact>/` pages rendered via
  the hardened `ArtifactReader.astro` → `stripFrontmatter` (Rule 7 / Rule 3).
- [x] `web/e2e/glassbox-index.spec.ts` — `/glass-box/` index from `render-glassbox` → `glassbox.json`.
- [x] `web/test/glassbox-reader.test.ts` — built-HTML frontmatter-leak assertions through the real component.

## Mutation Verification (project-rules Rule 8) — each reverted byte-clean

1. **`byCodeUnit` → bare `localeCompare`**: the `ñoño` `renderGlassbox` test RED
   (`['alpha','ñoño','zeta']` ≠ `['alpha','zeta','ñoño']`) + the `byCodeUnit` `ä>z`
   unit test RED. 2 failed. The non-ASCII fixture is what makes it non-vacuous
   (an ASCII-only set would NOT have caught it). Reverted byte-clean (hash restored).
2. **`stripFrontmatter` → old `/^---[\s\S]*?---\n?/`**: 7 RED (6 hr-opened + the
   CRLF real-frontmatter case the hardened CRLF-aware regex improves); 10 PASS
   (the LF real-frontmatter strips + no-frontmatter — unchanged behavior, green
   both ways as required). Reverted byte-clean (hash restored).

## Discoverability (skill-rules Rule 8)
Both new test files run under the default `scripts` vitest (`include: **/*.test.ts`):
`vitest list` shows the 6 render-glassbox Story 4.0 tests + 17 `lib/markdown.test.ts`
tests. Not ignored, not tagged out.

## Canonical Gate (project-rules Rule 5) — literal `pnpm test:all`, exit 0
- typecheck ✓ (0 errors) · lint ✓ · format:check ✓ (covers new .ts + touched .astro)
- test ✓ — scripts 9 files/130, api 7/68, web 18/630
- test:e2e ✓ — **213 passed, 0 skipped, 0 failed** (1.4m); glass-box reader+index specs executed
- lh ✓ — Lighthouse assertions passed (2 URLs), autorun done

## NFR-6 — `pnpm run check-deterministic`: PASS
Two clean builds byte-identical (tree hash `daa4689c…`).
`web/src/generated/glassbox.json` byte-identical to pre-gate reference
(hash `23c69f28…`) — seeded ASCII order preserved.

## Coverage
- Determinism surface (`byCodeUnit`/`renderGlassbox`): covered, non-vacuous.
- Parse-safety surface (`stripFrontmatter`): covered, non-vacuous.
- Both user-facing rendered surfaces: covered by existing real-runtime e2e (executing).

No gaps. No new tests needed.
