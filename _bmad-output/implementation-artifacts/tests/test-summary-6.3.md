# Test Automation Summary — Story 6.3 (Glass Box guided tour)

QA stage of `/epic-cycle`. Verified FRESH (Rule 10 — dev did not confirm the gate).
Date: 2026-06-08.

## Canonical gate (Rule 5 — run verbatim, all green)

| Stage | Result |
|-------|--------|
| `pnpm run typecheck` | PASS (0 errors) |
| `pnpm run lint` (incl. `react-hooks/exhaustive-deps` ERROR) | PASS (0) |
| `pnpm run format:check` | PASS |
| `pnpm run test` (vitest) | PASS — web 734, api 219, scripts 184 |
| `pnpm run test:e2e` (Playwright) | PASS — 317 passed, 1 skipped (documented invite DB-skip, NOT glassbox-tour) |
| `pnpm run lh` (lighthouse-ci) | PASS (assertions) |
| `pnpm run check-deterministic` | PASS — web/dist byte-identical across 2 clean builds |

The `glassbox-tour` Playwright PROJECT is wired into the default run (playwright.config.ts) and
RUNS — 22 dev tests (now 24 with QA additions), 0 skipped (Rule 7 confirmed).

## QA-added tests (web/e2e/glassbox-tour.spec.ts)

- **AC1 build-story ORDER** — binds each step i → the date-sorted slug FEATURED_SLUGS[i]
  (brainstorm → pre-brief-research → product-brief → ux-design → prd → ux-experience) via the
  reader-link href, the active spine-item slug, AND the per-slug curatorNote. The headline AC1
  "in build-story order" guarantee had no order-binding test before. Mutation-verified: reds when
  the tour order is reversed.
- **Rule 13 visible-highlight CONSUMER** — asserts the active spine item's COMPUTED outline is
  actually rendered (outline-style != none, width > 0), not merely that the `data-tour-active`
  attribute is set (the 5.4 no-op trap). Mutation-verified: reds when the `[data-tour-active]`
  outline CSS rule is removed.

## Mutation verifications performed (Rule 8 / Rule 13)

1. Dev's AC1 narration-change e2e → RED when `goNext` is a no-op (restored). Non-vacuous.
2. `resetRecuration` deletion-guard unit test → RED when the export is re-added (restored).
   Genuinely binds the real module export (decision #4).
3. QA order test → RED when tour order reversed (restored).
4. QA visible-highlight test → RED when outline CSS consumer removed (restored).

All mutated source files restored byte-identical via temp `cp` backups (never git). No mutation
residue in the tree.

## AC verdicts

- **AC1** (narrated step-through, build-story order, pointer+keyboard, focus mgmt) — PASS, order now bound.
- **AC2** (composes with reader; 6 featured readers resolve 200; ghosts omitted, no fabricated links) — PASS.
- **AC3** (JS-off static `<ol>` full; reduced-motion tour usable + no animation; all motion CSS under
  `prefers-reduced-motion: no-preference`) — PASS. Decision-#3 divergence from 6.2 honored.
- **AC4** (credibility — every narration traces to a real curatorNote; no fabrication; determinism;
  exactly 3 exec scripts, `application/json` excluded, asserted `.toBe(3)`) — PASS (broad Rule-9 audit clean).

## Next steps

- Lead per-story smoke (separate gate). No open QA defects.
