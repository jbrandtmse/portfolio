# Test Automation Summary — Story 9.2 (BMAD Build Walkthrough teaching layer), QA stage

Date: 2026-06-10 · Stage: `qa-generate-e2e-tests` (epic-cycle) · Verified fresh (Rule 10).

## Gate exit codes (Rule 14/16)
- `pnpm test:all` → exit **0** (typecheck `Result (125 files): 0 errors`; scripts 185, api 233, web 968 unit; e2e 464 passed / 0 skipped / 0 failed; Lighthouse pass).
- `pnpm run check-deterministic` → exit **0** (web/dist byte-identical across two clean builds).

## Defect found + fixed (AC4, HIGH — axe AA contrast)
- `.dr__mode-btn--active` (the active Watch/Learn toggle, NEW in 9.2) used `color: var(--color-bg)`.
  `--color-bg` is undefined in `tokens.css`, so the foreground resolved to inherited dark ink
  (`#211b14`) on the dark navy accent (`#1e3a5f`) → **1.48:1 contrast, an AA failure** (need 4.5:1).
  The active toggle text was effectively invisible. AC4 explicitly requires "axe AA 0 on
  `/demonstrator/`", but the dedicated `axe.spec.ts` only audits `/` and `/about/` — so this
  surface had no axe AA coverage and the defect shipped past dev.
  Fixed to `var(--color-surface-base)` (the established on-accent light-cream pattern used by
  GuidePill / InviteForm / GuidePanel). Sibling `.dr__start-btn:hover` and the `.dr__panel`
  background carried the same undefined-token anti-pattern; fixed to defined tokens.

## Tests hardened / added (`web/e2e/demonstrator.spec.ts`, `demonstrator` project — Rule 7)
- [x] AC4 — `/demonstrator/` zero axe wcag2a/wcag2aa violations (default Watch) — NEW, closes the gap.
- [x] AC4 — `/demonstrator/` zero axe wcag2a/wcag2aa violations (Learn mode, replay open) — NEW.
- Demonstrator e2e project now 33 tests, all run (0 skipped).

## Mutation verification (all reverted clean)
1. Inject "Build Measure Adapt Deploy" into a teaching field → both unit acronym guards RED. ✓
2. Break the panel mode consumer (always-narration) → Rule 13 visible-teaching e2e RED. ✓
3. Remove the `data-active-mode` spine effect → Rule 13 static-spine hide/show e2e RED. ✓
4. Revert the AC4 contrast fix → new axe AA test RED (color-contrast serious, 1.48:1). ✓

## Rule 9 credibility audit (BROAD) — CLEAN
Every `teaching` field + `content/kb/demonstrator.md` audited against `content/kb/bmad-method.md`
and the real pipeline/rules: no invented BMAD acronym expansion, no fabricated methodology
step/role/guarantee, no "every artifact published", no ADRs (no `docs/adr/` exists). BDD-shape
(Given/When/Then), the four-pass dev→QA→code-review→smoke pipeline, and the
codification-to-numbered-rules claim all trace to real artifacts.

## Rule 12 / Rule 13 / AC2
- Rule 12: `react-hooks/exhaustive-deps` is a hard ESLint error; `DemonstratorReplay.tsx` lints
  clean — `mode` is in both `useEffect` deps (no stale closure).
- Rule 13: the visible per-stage content change (panel) AND the static-spine hide/show are both
  asserted on observable outcomes, mutation-verified (see above).
- AC2 / NFR-1: build-output test confirms `/demonstrator/` ships exactly 3 executable scripts
  (2 Guide pill + 1 deferred bootstrap) — the toggle added NO second island; both modes' content
  present in the static `<ol>`, labeled per mode.

## No-regression
9.1 Watch replay green; `GlassBoxTour` untouched (no glassbox files modified, no glassbox e2e
failures).
