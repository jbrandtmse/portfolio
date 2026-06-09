# Test Automation Summary — Story 4.1 (Knowledge Base index & retriever seam)

QA stage of `/epic-cycle` (Epic 4, Story 4.1). Branch: `PORT-1-epic4`. Date: 2026-06-07.

This story is **service-introducing**: the `search(query, k)` retriever seam + the build-time
Orama KB index. First external consumer is Story 4.3 (`/api/guide`). The QA focus was the
Rule-7 integration proof, Rule-8 non-vacuity (mutation testing), the AC1 credibility floor,
and the literal `pnpm test:all` canonical gate (Rule 5).

## Test surface (from dev stage)

- `scripts/build-kb-index.ts` (+ `scripts/build-kb-index.test.ts`) — deterministic KB indexer.
- `api/src/lib/retriever.ts` (+ `api/src/lib/retriever.test.ts`) — `loadIndex()` + `search()` seam.
- `content/kb/{about,speaking,loandemo,faq,bmad-method}.md` (+ `README.md`) — curated KB.

## Tests added (this QA stage)

- `scripts/build-kb-index.test.ts` — **credibility-floor regression block (AC1, 2 tests)**:
  - `no KB chunk invents an acronym expansion for the BMAD Method` — asserts the real chunk
    corpus contains no `Mindmap` and no `stands for … Brainstorm` fabrication.
  - `any unflagged "stands for" acronym claim must be Mirror-faithful (none ship)` — guards
    the no-fabrication default for any future acronym claim.
  - Scoped to the REAL `buildKbCorpus()` chunk text (Rule 8 — real surface, specific assertion).

## Issue found + corrected (credibility floor — AC1 defect)

The dev draft asserted an **invented BMAD acronym expansion** — "The name stands for
Brainstorm, Mindmap, Architecture, Design" — as flat, unflagged fact in **`faq.md`** and
**`bmad-method.md`**. This:

- is **absent from every Static Mirror source** (the Mirror — `loandemo.astro`, `faq.astro` —
  never expands the acronym at all);
- is **factually wrong** (authoritative expansion: "Breakthrough Method for Agile AI-Driven
  Development" / "Build More Architect Dreams", verified via web research);
- carried **no `[OPEN]`/`[ASSUMPTION]` flag** — it read as confirmed fact.

This violated AC1 ("ZERO invented facts; no KB claim asserts anything the Mirror does not").
**QA correction:** removed the fabricated sentence from both docs (Mirror-faithful framing
kept: "a disciplined multi-agent development workflow"). Added the regression block above so
the fabrication cannot return. No other unflagged fabricated claim found (URLs, metrics, dates
all either match the Mirror or stay `[OPEN]`/`[ph]`).

## Verifications performed

### Rule 7 — integration test PROVEN to execute (the Epic-4 canonical case)

Deleted `api/data/` (clean-checkout simulation) and ran ONLY `retriever.test.ts`:

- `beforeAll` detected the absent index, logged "kb-index.json absent — running build:content
  to generate…", and ran `pnpm build:content` (wrote 36 chunks).
- **All 12 retriever tests RAN and passed — 0 skipped.** The AC5 integration block (7 tests)
  executed in full, including "returns ≥1 chunk for 'LoanDemo' with route `/work/loandemo/`".
- No `test.skip()` on missing prerequisite. The integration path genuinely exercises the real
  built index end to end.

### Rule 8 — mutation-verification (every load-bearing assertion is non-vacuous)

Each mutation broke the REAL source, confirmed the owning test RED, then reverted byte-clean:

| Mutation | Target | Result |
|---|---|---|
| A | retriever `search()` drops `route` from results (AC5 integration) | RED — 4 tests fail incl. LoanDemo/about/speaking route assertions |
| B | throwaway `import '@orama/orama'` added to `app.ts` (AC4 import-isolation) | RED — isolation test fails (`isAllowed` false) |
| C1 | `Math.random()` injected into chunk `id` (AC3 determinism) | RED — two-build byte-identical test fails |
| C2 | file `.sort(byCodeUnit)` removed → `.reverse()` (AC3 sort order) | RED — sorted-chunks test fails |
| D | indexer also reads parent dir, outside `content/kb/` (AC2 default-deny) | RED — decoy `/decoy/` route appears |
| E | re-inject fabricated BMAD expansion into `faq.md` (AC1, NEW QA test) | RED — both credibility-floor tests fail |

All source files reverted byte-clean (verified via diff + `git status`); no stray markers.

### Rule 5 — literal `pnpm test:all` canonical gate (AC6) — EXIT 0

| Stage | Result |
|---|---|
| typecheck (`tsc --noEmit` × scripts/shared/api/web) | 0 errors |
| lint (`eslint .`) | clean |
| format:check (`prettier --check .`) | "All matched files use Prettier code style!" |
| test (vitest) | scripts **153** + api **80** + web **630** = **863 passed**, 0 failed, 0 skipped |
| test:e2e (Playwright) | **213 passed**, 0 skipped, 0 failed (1.5m) |
| lh (Lighthouse CI `lhci autorun`) | assertions vs 2 URLs / 2 runs — passed |
| **Exit code** | **0** |

(scripts went 151→153 with the +2 credibility-floor tests.)

### AC3 / AC6 build + determinism

- `pnpm build` runs the `build-kb-index` generator → `api/data/kb-index.json` (36 chunks, all 5
  routes), web build "Complete!". Artifact is **gitignored** (absent from `git status`).
- KB-index determinism: two clean builds → byte-identical (`sha256 4e12a00b…`).
- `pnpm run check-deterministic`: `web/dist` byte-identical across two builds (tree hash
  `daa4689c…`, unchanged from dev — the KB content fix lives in gitignored `api/data/`, not
  `web/dist`).
- NFR-5: `@orama/orama` confirmed **absent** from web's dependency graph (`pnpm why` empty).

## Discoverability (skill-rules Rule 8)

- `scripts/build-kb-index.test.ts` matched by `scripts/vitest.config.ts` `include: **/*.test.ts`.
- `api/src/lib/retriever.test.ts` matched by `api/vitest.config.ts` `include: src/**/*.test.ts`.
- Both run under each package's `vitest run` and the root `pnpm test`. No `.skip`/`exclude`/`xit`.

## Coverage

- AC1 credibility floor: regression-tested (no invented acronym expansion). ✓
- AC2 default-deny: real-module test + mutation-verified. ✓
- AC3 determinism: two-build byte-identical + mutation-verified (random + sort). ✓
- AC4 retriever seam + import-isolation: real-source grep test + mutation-verified. ✓
- AC5 integration (real built index): proven-to-execute (Rule 7) + mutation-verified. ✓
- AC6 canonical gate: literal `pnpm test:all` exit 0 + determinism + build artifact. ✓
