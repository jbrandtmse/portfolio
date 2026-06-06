# Deferred Work

Tracks issues surfaced during `/epic-cycle` stages (dev, QA, code review) that are
real but intentionally not fixed in the originating story. Each entry records the
originating story, severity, the issue, why it was deferred, and a suggested
resolution (usually the story that should own the fix).

---

## Deferred from: code review of story-1.1 (2026-06-06)

- **[1.1 · LOW] SSE `CitationEvent` shape diverges from the documented contract.**
  `shared/src/events.ts` defines `CitationEvent` as `{ type: 'citation'; id; title; url }`,
  but `architecture.md` §Format Patterns specifies the `/api/guide` SSE `citation`
  event as `{ route, label }`. This is a PLACEHOLDER in Story 1.1 (carries an explicit
  `// TODO(Story 4.3): align with /api/guide`), and the Integration ACs declare the
  contract shapes are finalized by their first consumers — so it is not a defect for
  1.1.
  - **Deferral rationale:** the final wire shape is owned by the `/api/guide`
    implementation; fixing it now would be speculative (the citation payload may want
    richer fields than the architecture's two-field sketch).
  - **Suggested resolution:** in **Story 4.3** (`/api/guide`) / **Story 4.4**
    (`GuidePanel`), reconcile `events.ts` against the architecture — either update
    `CitationEvent` to `{ route, label }` (+ any agreed extra fields) OR amend
    `architecture.md` §Format Patterns to the final shape, and keep `shared/` as the
    single source of truth for both `api` and `web`.

- **[1.1 · LOW] `API_PORT` is coerced with no validation/fail-fast.**
  `api/src/index.ts` uses `Number(process.env.API_PORT ?? 8787)`; a non-numeric
  `API_PORT` yields `NaN`, which `serve()` would handle unpredictably. The
  architecture mandates a typed, Zod-validated `env.ts` per package that validates
  required vars at startup (fail-fast) — see §Structure Patterns ("a typed `env.ts`
  per package validates required vars (Zod) at startup, fail-fast") and the
  `api/src/env.ts` entry in the directory tree. That module is not a Story 1.1
  deliverable.
  - **Deferral rationale:** env validation is an explicitly-planned later-story
    component (`api/src/env.ts`); adding ad-hoc validation now would duplicate work
    that the env module will own.
  - **Suggested resolution:** when `api/src/env.ts` is introduced (first env-consuming
    story, e.g. Story 3.3 for `DATABASE_URL`/`RESEND_API_KEY`, or Story 1.10 deploy),
    validate `API_PORT` as a positive integer there and read it through that module in
    both `index.ts` and (ideally) the Astro proxy config.

- **[1.1 · LOW] `API_PORT` default `8787` is duplicated as a literal.**
  The default port appears in two places — `web/astro.config.mjs`
  (`process.env.API_PORT ?? '8787'`) and `api/src/index.ts`
  (`process.env.API_PORT ?? 8787`) — plus `.env.example`. If one changes without the
  others, the dev proxy and the Hono port can drift.
  - **Deferral rationale:** harmless today (all three agree; both correctly read the
    env var first), and the natural place to centralize is the planned `env.ts`.
  - **Suggested resolution:** centralize the default in `api/src/env.ts` when it lands
    (or a tiny shared constant), and have both the proxy and the service read it from
    one source. `.env.example` remains the documented override.

---

## Deferred from: code review of story-1.2 (2026-06-06)

- **[1.2 · LOW] React integration emits an unreferenced ~193KB `_astro/client.*.js` chunk into `dist`.**
  `web/astro.config.mjs` registers `@astrojs/react` (Story 1.1 scaffold, for the three
  later islands). With no island used in Story 1.2, the build still emits
  `web/dist/_astro/client.CUuda7Aw.js` (~193KB). The home page ships **0 `<script>`
  tags** and references no `.js` (verified in `dist/index.html` + the build-output
  test), so **NFR-1 (0-JS-by-default) holds at the page level** — the chunk is just
  dead weight sitting on the CDN, never fetched by the page.
  - **Deferral rationale:** removing or conditionally-scoping the React integration is
    a build-config decision that belongs with the first story that actually ships a
    React island (so the integration is present exactly when needed), not with the
    design-system foundation. Doing it here risks breaking the later island setup.
  - **Suggested resolution:** in the first island story (Guide panel / Invite form,
    Epic 4 / Epic 3), confirm the integration is needed and consider Astro's
    per-page/island opt-in so non-island routes never emit the client runtime; or
    document that the unreferenced chunk is acceptable because it is never linked from
    any zero-JS page. Re-verify `dist/index.html` stays at 0 `<script>`.

- **[1.2 · LOW] Empty `<footer class="site-footer">` renders a stray hairline-ruled band on pages with no footer slot content.**
  `web/src/layouts/BaseLayout.astro` always renders the `<footer>` region; on a page
  that fills no `footer` slot (the Story 1.2 home), the built HTML emits
  `<footer class="site-footer">  </footer>`, and the scoped CSS gives it a
  `border-top: 1px {border-hairline}`, a `margin-top: {section-band}`, and
  `padding: {space-6} {margin-desktop}` — i.e. a visible empty ruled band at the
  bottom of the page. Gating the render on `Astro.slots.has('footer')` was prototyped
  and reverted during review.
  - **Deferral rationale:** the story explicitly sanctions an always-present footer
    *placeholder* ("leave a clearly-marked slot/placeholder… reserve the region… so
    BaseLayout is footer-ready"), and IAC-1 wants the footer slot **observable in
    `dist`**; gating render on slot-presence removes that consumer-observable evidence
    and would require reworking the green build-output test. The blemish is on a
    throwaway placeholder home that Story 1.3 replaces. Proportionate to defer rather
    than rework QA evidence at code-review time.
  - **Suggested resolution:** in **Story 1.7** (the real Footer), the slot is filled on
    every Mirror page so the band is no longer empty; if any page must legitimately
    omit the footer, gate the region with `Astro.slots.has('footer')` (or render the
    placeholder only in dev) and update the build-output footer assertion to verify the
    slot renders **when filled** rather than asserting an empty `<footer>` ships.
