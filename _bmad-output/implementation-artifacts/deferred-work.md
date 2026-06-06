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
