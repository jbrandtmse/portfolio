# Test Automation Summary — Story 6.4 (Glass Box explorable map)

QA stage of `/epic-cycle`. Verified FRESH per Rule 10 (dev self-report treated as
unreliable). Full canonical gate run verbatim (Rule 5).

## Canonical gate — `pnpm test:all` + `check-deterministic` (all GREEN)

| Stage | Result |
|-------|--------|
| typecheck | 0 errors (lead's `!` fix at glassbox-tour.spec.ts:595 held; sanity-checked correct — loop index always in-bounds) |
| lint (`eslint .`) | clean |
| format:check (`prettier --check .`) | clean (caught + fixed a format issue in my added test — Rule 5) |
| test (unit) | scripts 184 + api 219 + web **754** (was 750 + 4 QA-added) = 1157 pass |
| test:e2e | **340 passed, 1 skipped** (pre-existing DATABASE_URL-gated invite/home native-POST test — NOT a 6.4 guarantee, Rule 7 verified) |
| lh (Lighthouse CI) | PASS (all assertions) |
| check-deterministic | PASS — byte-identical (tree hash 9253691d…) |

## Coverage verified

- **AC2 JS-off headline (Rule 7):** `glassbox-map` Playwright project DISCOVERED + RUNS (21/21, 0 skipped). JS-off test (`javaScriptEnabled:false`) proves the `#glass-box-map` section + all 6 featured nodes are real `<a href="/glass-box/{slug}/">`, visible JS-off; 6 readers resolve 200; 3 ghosts non-link.
- **AC1 free-browse:** same 6 artifacts + live-site grouped into 4 phases (+ "As it accrues") in order; independently navigable.
- **AC3 credibility (Rule 9 broad audit):** served HTML scanned — no fabrication-class phrases; ghosts honestly "as it accrues / will be published as they are completed"; live-site node = real URL; composition (6.3 tour + spine + JS-off baseline) intact.
- **NFR-6 / script budget:** exec-script count `.toBe(3)` (not loosened); map adds 0 executable JS; build byte-deterministic.
- **axe-core AA:** zero violations on `/glass-box/` with the map section.

## Mutation verification (Rule 8 — non-vacuous, real module)

- Unit: moved `prd` Discovery→Definition → "prd in Definition" reds; ghost slug into featured phase → ghost-isolation + no-duplicate guards red. Restored.
- E2E: fabricated ghost reader link in `.astro` → 4 assertions red (JS-off headline, 2× ghost-no-link, non-link-placeholder). Restored.
- New tests: fabricated map title in `.astro` → new "renders REAL title" test reds. Restored.

## QA hardening added

`web/test/glassbox-index.test.ts` — new describe block "Story 6.4 AC3 / Rule 9 —
map node labels trace to real artifact data" (4 tests). Closed a gap: no prior test
bound the RENDERED map node titles/notes to the REAL `loadGlassboxJson()` output —
a hardcoded/fabricated map title would have passed the whole green gate. Scoped to
`#glass-box-map` (Rule 8), bound to real loader data, mutation-verified.

## Verdict

All ACs verified fresh and green. One credibility-binding gap hardened. Ready for
code-review.
