# Lead per-story smoke — Story 4.0 (Epic-3 Deferred Cleanup: KB-loader hardening)

- **Date:** 2026-06-07
- **Method:** library/CLI real-runtime exercise (build-time deliverable) + determinism re-verification
- **Branch:** PORT-1-epic4 (uncommitted working tree)
- **Result:** PASS (7/7 real-module assertions + byte-stable regen)
- **Iterations:** 1
- **Defects caught:** 0

## Why this method

Story 4.0's deliverable is two build-time hardenings — `byCodeUnit` (deterministic glass-box sort) in `scripts/render-glassbox.ts` and the hardened `stripFrontmatter` helper in `scripts/lib/markdown.ts` (consumed by `web/src/components/glassbox/ArtifactReader.astro`). The meaningful smoke invokes the REAL exported functions against the real allowlist + the exact edge cases they protect, and re-verifies the NFR-6 byte-stability invariant out-of-band. (An extra check this run: the code-review agent accidentally ran `git checkout -- scripts/render-glassbox.ts` mid-review; the lead independently re-verified the working tree is byte-identical to the post-dev state — `render-glassbox.ts` sha256 `6f4fb66d…` matches — before smoking.)

## Evidence (exercised the REAL modules via `npx tsx`)

```
PASS: real frontmatter stripped (no title: leaks)
PASS: hr-opened body NOT over-stripped (intro survives)         # the [2.2] guarantee
PASS: old regex DID over-strip the same hr body (fix is load-bearing)   # contrast proof
PASS: no-frontmatter passthrough unchanged
PASS: byCodeUnit deterministic non-ASCII order                 # the [2.1] guarantee
PASS: renderGlassbox output already in deterministic order
PASS: renderGlassbox produced the 6 seeded artifacts
=== SMOKE RESULT: 7 passed, 0 failed ===
```

- **`stripFrontmatter` (real module):** real `---\ntitle: …\n---` block stripped; an hr-opened body (`---\n\n<intro>\n\n---\n\n<rest>`) is NOT over-stripped — both intro and rest survive. Contrast: the OLD `/^---[\s\S]*?---\n?/` regex DID eat the intro on the same input → confirms the fix is load-bearing, not cosmetic.
- **`byCodeUnit` (real module):** `['zeta','ñoño','alpha','Zebra']` → `['Zebra','alpha','zeta','ñoño']` (code-unit order: `Z`<`a-z`<`ñ`), identical regardless of host locale.
- **`renderGlassbox` (real run over the real `GLASSBOX_ALLOWLIST`):** output is already in deterministic date→slug code-unit order; 6 seeded artifacts present.

## Determinism re-verification (NFR-6 / AC1)

Re-ran the real content generators (`npx tsx scripts/build-content.ts`) → `git diff web/src/generated/glassbox.json` is **empty** (byte-identical to committed). The `byCodeUnit` source genuinely reproduces the committed seeded order; no generated-file drift. (Dev/QA/CR each also ran `pnpm run check-deterministic` → PASS, two clean builds byte-identical, tree hash `daa4689c…`.)

## Upstream gate corroboration

- `pnpm test:all` re-run to **exit 0** by both QA and code-review (literal canonical gate, not a subset): typecheck/lint/`prettier --check .` clean, vitest scripts 130 / api 68 / web 630, Playwright **213 passed / 0 skipped**, `lh` 0 failed assertions.
- Both hardened surfaces have executing real-runtime e2e (`web/e2e/glassbox-reader.spec.ts`, `web/e2e/glassbox-index.spec.ts`) — Rule 3 / Rule 7 satisfied (proven not-skipped).
