# Test Automation Summary — Story 3.1 (Speaker Surface)

QA stage of the `/epic-cycle` pipeline. The dev stage already shipped substantial
coverage (42 vitest + 18 Playwright). This stage (a) **mutation-verified** the most
important existing tests are non-vacuous and (b) **filled real-runtime gaps** the
QA directive called out, without duplicating passing coverage.

## Mutation verification (existing tests are non-vacuous)

Each mutation was applied to the source, confirmed to turn the relevant test RED,
then reverted (all source files restored byte-identical to the dev baseline).

| # | Mutation | Test(s) confirmed RED |
|---|----------|-----------------------|
| 1 | ReelPoster default `aria-label` drops "90 seconds" | `carries an aria-label naming the reel and its ~90s duration` |
| 2 | TalkCard always renders abstract inline (never `<details>`) | `expanded=false renders … inside a native <details>`; `uses the talk.expanded property as the default` |
| 3 | `/speaking` JSON-LD array sliced to N-1 nodes | build-output `emits N Event nodes = SIGNATURE_TALKS.length` |

## Gaps filled (new tests — real-runtime tier, Rule 3)

### vitest — `web/test/speaking-jsonld.test.ts` (12 tests, NEW)

- **JSON-LD schema.org validity on the real `dist` build** (Rich-Results required-field set):
  - Every emitted `application/ld+json` block parses as valid JSON (serializer escaping reversible).
  - `/speaking` emits exactly one `Event` per signature talk, keyed one-to-one by title.
  - Each `Event` carries the FULL required set: `@context`, `@type`, `name`, `startDate`,
    `eventAttendanceMode`, typed `location`, `performer` (`@type` Person, name = "Joshua R. Brandt, MSE"), typed `organizer`.
  - Embedded performer Person carries NO nested `@context` (JSON-LD embedding rule).
  - `/speaking/reel` `VideoObject` carries the FULL set: `name`, real `description`, `thumbnailUrl`, `uploadDate`, `duration` = `PT1M30S`.
  - All `[OPEN]` URLs in the VideoObject are valid absolute http(s) URLs (so the schema validates).
- **Credibility-floor honesty as VISIBLE TEXT** (tag-stripped built HTML):
  - The `[ASSUMPTION]` veteran-IC talk renders as visible body text on `/speaking`.
  - The `[OPEN]` reel-video placeholder renders as visible text on `/speaking` and `/speaking/reel`.
- **Determinism (NFR-6) of the shipped JSON-LD string**:
  - Serializing the Event graph / reel VideoObject twice is byte-identical.
  - No wall-clock / non-`2026-01-01` date token appears in the serialized JSON-LD.

### Playwright — `web/e2e/speaking.spec.ts` (3 tests appended; reuses the `speaking` project)

- The reel poster is the FIRST content item below the lede — precedes any `.talk-card`
  in document order on the served page (AC1, `compareDocumentPosition`).
- The reel-poster `aria-label` names the ~90s duration on the served runtime (AC1).
- The `[OPEN]` reel placeholder + `[ASSUMPTION]` veteran-IC angle are visible `innerText`
  on `/speaking/` (AC3 honesty).

New-test mutation verification (each reverted after): empty `eventAttendanceMode` → required-field
test RED; veteran title un-flagged → credibility test RED; 2025 date → determinism test RED;
reel moved after talks → e2e ordering test RED.

## Coverage

- Speaker-Surface vitest: **54 pass** (42 dev + 12 new).
- Speaker-Surface Playwright (`speaking` project): **21 pass** (18 dev + 3 new).
- Discoverability (Rule 8): new vitest under `web/test/*.test.ts` (default glob);
  new e2e in `web/e2e/speaking.spec.ts` under the existing `speaking` project
  (`testMatch: /speaking\.spec\.ts/`) — no cross-project double-run.

## Gate

`pnpm test:all` (= `typecheck && lint && format:check && test && test:e2e && lh`) — **green, exit 0**
(179 Playwright passed; Lighthouse on `/` and `/about/` assertions passed). `prettier --write`
run on new/edited files before the gate (Rule 5).

## Next Steps

- Lead per-story smoke + commit (QA stage left changes uncommitted by directive).
