# Test Automation Summary — Story 4.4 (The Guide island — non-modal panel, citations, visible thinking)

QA stage of `/epic-cycle` (Epic 4, Story 4.4 — the FINAL Epic-4 story). Branch: `PORT-1-epic4`. Date: 2026-06-07.

The most accessibility-heavy story in the project: a **NON-modal** dialog with **untrapped** focus,
per-message `aria-live`, citation-routing that keeps your place, and a clean JS-off degradation. The
dev sub-agent hung on its final gate and was interrupted; the lead recovered. QA verified the
implementation **fresh** — focusing on the hardest a11y guarantees (mutation-verified), the Rule-7
integration proof, the NFR-1 carve-out honesty + lh margin, and the dev-noted component-tier gap.

## Test surface (from dev stage)

- NEW: `web/src/lib/store.ts` (`$guideOpen`), `web/src/islands/GuidePanel.tsx` (non-modal panel),
  `web/src/islands/GuidePill.tsx` (site-wide lazy pill), `web/e2e/guide-panel.spec.ts` (7 tests).
- MOD: `web/src/layouts/BaseLayout.astro` (mount), `web/src/components/hero/HeroStatic.astro`
  (rewire), `web/playwright.config.ts` (`guide-panel` project), `web/test/build-output.test.ts`
  (NFR-1), + per-route e2e/component tests updated for the site-wide pill ripple.

## Tests added (this QA stage)

- **`web/test/GuidePanel.component.test.ts` (NEW — 8 tests).** Closes the dev's own coverage gap
  (panel/pill had NO component-tier test). Renders the REAL `GuidePanel` via Astro's Container API
  (the established `.component.test.ts` pattern; web vitest env is `node`, no jsdom) with `$guideOpen`
  forced open, and pins the STATIC a11y + single-source contract scoped to real elements (Rule 8):
  - `role="dialog"` + `aria-modal="false"` (and NOT `"true"`) — non-modal.
  - No scrim/backdrop/overlay element.
  - Head: monogram + "Grounded · cites its sources" + real minimize/close `<button>`s.
  - Transcript `role="log" aria-live="polite"`; thinking `role="status" aria-live="polite"`.
  - Greeting === the exact in-voice string, **exclamation-free**.
  - Chips === `STARTER_PROMPTS` (the REAL import) EXACTLY three, in order (anti-drift binding).
  - Composer: labeled `<input type=text>` (programmatic `<label for>`) + real submit `<button>`.
- **`web/e2e/guide-panel.spec.ts` (+2 tests → 9 total).** Closes two behavioral gaps the dev e2e
  named but did NOT assert:
  - **Test 8 — focus is NOT trapped (the directive's #1 ask).** With the panel open: an element
    BEHIND the panel (hero "book a talk" fork) can take focus while the panel stays open
    (page interactive — non-modal); and Tab from the composer input ESCAPES the panel subtree
    (a focus trap would wrap focus back inside). Tests 1/2 asserted the `aria-modal="false"`
    *attribute*; nothing asserted the *behavior* it promises.
  - **Test 9 — NFR-2 per-message, not per-token.** After a real-SSE chip query, the streamed
    `token` events accumulate into EXACTLY ONE guide answer entry (not one entry per token), and the
    thinking `role="status"` region is a single node — the runtime evidence that the announcement is
    batched per message, never per token.

## Verifications performed

### Rule 7 — integration e2e PROVEN to execute (the Epic-4 canonical case)

The `guide-panel` Playwright project ran against the **real** `/api/guide` SSE via the prod-faithful
`serve-with-api.mjs` proxy (`GUIDE_LLM_STUB=1`, real retriever + threshold gate + SSE stream):

- **All 9 guide-panel tests RAN and passed — 0 skipped.** The chip-query test exercises the real
  endpoint and renders token text; the citation test follows a real citation chip and verifies the
  page routes behind + the conversation persists (sessionStorage) + the panel reopens.
- `beforeAll` generates the KB index if absent (no `test.skip()` on a missing prerequisite).
- Expected-vs-run confirmed: 9 expected, 9 run, 0 skipped.

### Rule 8 — mutation-verification (every load-bearing assertion is non-vacuous)

Each mutation broke the REAL source, confirmed the owning test RED, then reverted byte-clean
(verified via `diff`):

| Mutation | Target | Result |
|---|---|---|
| A | `GuidePanel` `aria-modal="false"` → `"true"` (non-modal, dev e2e) | RED — guide-panel Tests 1 + 2 fail |
| B | `closePanel` drops `pillRef.current.focus()` (focus-return, dev e2e) | RED — Esc→focus-to-pill (Test 5) fails |
| A' | same `aria-modal` flip (NEW component test) | RED — component non-modal test fails |
| C | panel renders 2 chips, not `STARTER_PROMPTS`'s 3 (NEW component test) | RED — `toHaveLength(3)` fails |
| D | add a focus TRAP (Tab wraps inside panel) (NEW e2e Test 8) | RED — "Tab … must escape the panel" fails |
| E | render one guide entry PER TOKEN (NEW e2e Test 9) | RED — `toHaveCount(1)` got 4 |

All source files reverted byte-clean; `git diff` on `GuidePanel.tsx`/`GuidePill.tsx`/`store.ts`/
`faq.ts` shows NO QA modifications (only additive test files + the dev's own changes remain).

### NFR-1 carve-out — HONEST, specific, and lh-green with COMFORTABLE margin (AC5)

- **Build reality confirmed:** `/about/index.html` references only `GuidePill.*.js` (155 B init) +
  the shared `client.*.js` React runtime — the **`GuidePanel.*.js` (22.5 KB) chunk is NOT on initial
  load** (it's a lazy `React.lazy` chunk loaded on open). The build-output assertion
  `not.toMatch(/GuidePanel\.[…]\.js/)` is genuinely true. The React runtime is the same chunk
  InviteForm uses (no new framework).
- **The build-output NFR-1 assertions are updated honestly (Rule 8):** per-route, specific — content
  routes ship exactly 2 pill-init scripts (`/speaking` 3 = +copy, `/invite` 3 = +InviteForm island),
  the GuidePanel + InviteForm chunks are asserted ABSENT on content routes. Not loosened to vacuity.
- **lh margins (NOT razor-thin → the "acceptable if lh-green" path is properly satisfied; NOT a
  Rule-5 tripwire):**
  - `/about/` `script:size` **73.3 KB / 256 KB** budget → **71.3 % headroom**.
  - `/about/` `total-byte-weight` **204.5 KB / 400 KB** → **48.9 % headroom**. FCP 1136 ms (budget
    2500); performance score **1.0**.
  - `/` comparable (script 74.4 KB; tbw 211.5 KB).

  Note: BaseLayout mounts the pill `client:only="react"` (not the `client:idle` named in some
  comments). Either way the heavy panel is lazy and the content-route initial-load JS is the small
  pill + the shared runtime — the carve-out holds with wide margin. (Flagged for code-review as a
  comment/impl wording mismatch, not a budget issue.)

### Privacy + voice (AC6, Decision 7)

- **No PII:** every `track()` call in the Guide islands is a bare event name —
  `track('guide-opened')` / `track('guide-query')` / `track('citation-followed')`. No query/answer
  text passed (confirmed by source grep; the `'guide-query'` literal merely *contains* "query").
- **Voice:** no exclamation marks in any panel/pill string literal (greeting, error fallback,
  thinking states, nav-announce, status badge). The component test asserts the rendered panel copy
  is exclamation-free as a regression guard.

### Rule 5 — literal `pnpm test:all` canonical gate (AC8) — EXIT 0

| Stage | Result |
|---|---|
| typecheck (`tsc --noEmit` × scripts/shared/api + `astro check` web) | 0 errors |
| lint (`eslint .`) | clean |
| format:check (`prettier --check .`) | "All matched files use Prettier code style!" (caught + fixed format on the 2 new test files first) |
| test (vitest) | scripts **156** + api **129** + web **661** = **946 passed**, 0 failed, 0 skipped |
| test:e2e (Playwright) | **240 passed**, 0 skipped, 0 failed (1.9m) — incl. all 9 `guide-panel` tests |
| lh (Lighthouse CI) | assertions vs 2 URLs (`/`, `/about/`) / 2 runs — passed |
| **Exit code** | **0** |

(web unit 653→661 with the +8 component tests; e2e 238→240 with the +2 guide-panel tests.)

### Determinism + hygiene

- `pnpm run check-deterministic`: `web/dist` byte-identical across two clean builds (tree hash
  `cc37f60c…`). EXIT 0.
- No orphaned `astro preview`/`tsx src/index`/`serve-with-api`/`lhci`/Playwright processes; e2e ports
  4321/4329/8799 free. (One orphaned `astro preview` from a mid-session restart was found by port and
  killed.)
- `api/.env` + `api/data/kb-index.json` are gitignored — absent from `git status` (not staged).

## Discoverability (skill-rules Rule 8)

- `web/test/GuidePanel.component.test.ts` matched by `web/vitest.config.ts`
  `include: ['src/**/*.test.ts','test/**/*.test.ts']` — ran under `web vitest run` + root `pnpm test`.
- The +2 e2e tests live in `web/e2e/guide-panel.spec.ts`, run by the `guide-panel` Playwright project
  (testMatch `/guide-panel\.spec\.ts/`) under `pnpm test:e2e`. No `.skip`/`.only`/`exclude`.

## Coverage

- AC1 pill + hero entry + JS-off degrade: dev e2e (pill open, hero open, JS-off → /faq). ✓
- AC2 NON-modal panel + axe AA 0: dev e2e (aria-modal, no scrim, axe) + **NEW focus-not-trapped e2e**
  + **NEW component a11y contract**; mutation-verified. ✓
- AC3 send → visible thinking → grounded answer + citations (real SSE): dev e2e (chip→SSE) +
  **NEW NFR-2 per-message** e2e; Rule-7 proven. ✓
- AC4 citation routes behind + conversation persists + focus-return-to-pill: dev e2e;
  focus-return mutation-verified. ✓
- AC5 NFR-1 carve-out + lh green: build-chunk inspection + lh margin (71 %/49 % headroom) +
  build-output assertions (honest, specific). ✓
- AC6 analytics no-PII + voice: source-verified + component-test regression guard. ✓
- AC7 integration e2e PROVEN to execute (Rule 7): 9/9 ran, 0 skipped, real `/api/guide`. ✓
- AC8 literal `pnpm test:all` EXIT 0 + determinism: confirmed. ✓
