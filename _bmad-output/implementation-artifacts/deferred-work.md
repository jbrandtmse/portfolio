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

---

## Deferred from: code review of story-1.3 (2026-06-06)

- **[1.3 · LOW] Fork CTA renders the curly apostrophe (`I&rsquo;m`, U+2019) where the spine's canonical string uses a straight ASCII apostrophe (`I'm`).**
  `web/src/components/hero/HeroStatic.astro:85` emits `I&rsquo;m here to book a talk`, which builds to the U+2019 right-single-quote glyph in `dist/index.html`. EXPERIENCE.md §"Named strings (canonical)" writes the CTA with a straight ASCII apostrophe (`"I'm here to book a talk"`). The Dev Notes direct "use the canonical strings EXACTLY … do not normalize," so this is a (minor) deviation from the spine's literal string.
  - **Deferral rationale:** the rendered glyph is the typographically correct apostrophe and faithfully matches the visual mockup (`mockups/hero.html:672` itself uses `&rsquo;` for this exact CTA, and the spine designates the mock as the composition/visual reference). Neither EXPERIENCE.md nor DESIGN.md gives any smart-quote/typographic-apostrophe directive, and a markdown source naturally types `'` even when the intended rendered glyph is `'`. The "do not normalize" guidance is, in context, aimed at the enumerated casing/period hazards (Title-case vs lowercase, no trailing period vs period on the `<h1>`), not at an ASCII-vs-Unicode apostrophe. No word/meaning changes; the page- and component-level tests match on `book a talk` and are unaffected. Forcing a straight ASCII apostrophe would arguably be *less* faithful to the mock and to good typography. Classified LOW and deferred rather than patched to avoid pre-empting a house-style decision the owner has not made.
  - **Suggested resolution:** a one-line owner decision on house style for apostrophes/quotes in user-facing copy. If straight ASCII apostrophes are preferred site-wide, change `I&rsquo;m` → `I'm` here (and codify the convention, e.g. a lint/format rule or a `.claude/rules` copy-style note) so future copy is consistent; otherwise keep the curly form and consider adding a one-line "smart-quotes in user copy" note to the spine's Microcopy rules so the canonical strings and the rendered output agree on the glyph.

---

## Deferred from: code review of story-1.4 (2026-06-06)

- **[1.4 · LOW] The last scene (`#close`) may not receive `aria-current` via scroll at the page bottom.**
  `web/src/components/scene/SceneRail.astro:531-540` — the scroll enhancement's
  `IntersectionObserver` uses `rootMargin: '-30% 0px -60% 0px'`, so the "active" band is
  only the 30–40% horizontal slice of the viewport. A short final section (`#close`) at
  the document bottom can fail to cross the 40% line before the page bottoms out, so the
  semantic `aria-current` (and the "Scene N of 7" number) can stick on the second-to-last
  scene even when the visitor has scrolled to the very end.
  - **Deferral rationale:** this is an enhancement-quality nuance, not an AC failure. The
    AC4 static baseline is complete and unaffected (`aria-current` on `#hero`, static
    meter, all anchors followable JS-off); the FR-2 "Skip to the end" control and the
    Close rail/menu anchors all navigate to `#close` regardless; AC2's "current scene …
    indicated via `aria-current` … as the visitor scrolls" holds for the interior scenes.
    The fix belongs with the centralized motion logic, not as an ad-hoc patch now.
  - **Suggested resolution:** in **Story 1.9** (consolidate the gate + observer into
    `web/src/lib/motion.ts`), add a bottom-of-page fallback that activates the last scene
    when `scrollY + innerHeight` is within a small epsilon of `scrollHeight` (or observe a
    sentinel at the page foot), so the final scene reliably lights at the end of scroll.

- **[1.4 · LOW] Current-tick halo color is a literal `rgba(30,58,95,0.2)` rather than token-derived.**
  `web/src/components/scene/SceneRail.astro:266` renders the current-tick "soft halo" as
  `outline: 3px solid rgba(30,58,95,0.2)`. The literal equals `--color-accent` (`#1E3A5F`)
  at 20% alpha and matches the DESIGN `tick-current` halo spec (`3px rgba(30,58,95,0.20)`)
  verbatim, but it is a hardcoded color value rather than derived from the accent token.
  - **Deferral rationale:** intentional and spec-faithful. There is currently no
    channel/alpha token for the accent, and applying alpha to a hex custom property would
    require `color-mix()` or rgb-channel tokens — a change to the tokens layer that is out
    of scope for this story. The story's Dev Agent Record already documents this decision.
    Not a defect; the box-shadow→outline substitution is the load-bearing correctness call
    (and is correct — it preserves the one-shadow invariant).
  - **Suggested resolution:** when the tokens layer gains channel/alpha tokens (or a
    `color-mix()` convention is adopted), replace the literal with a token-derived value so
    the halo tracks any future accent change. Track with the design-tokens owner; low
    priority.

## Deferred from: code review of story-1.5 (2026-06-06)

- **[1.5 · LOW] Dev completion-note claim that the home output is "byte-identical / unchanged" is imprecise (output is correct, but not byte-identical).**
  `web/src/layouts/BaseLayout.astro` — the Dev Agent Record states the home (`index.astro`,
  which leaves `canonical` unset) produces "unchanged output … byte-identical". Against the
  `e7d0cd0` baseline the built `web/dist/index.html` is NOT strictly byte-identical: the
  baseline references ONE stylesheet (`/_astro/index.*.css`); the current build references
  TWO (`/_astro/BaseLayout.*.css` + `/_astro/index.*.css`). Verified the home DOM is
  byte-identical once the two `<link rel="stylesheet">` tags are removed, and the COMBINED
  CSS is rule-for-rule identical (126 rule blocks in both, 0 differences; 21741 vs 21740
  bytes — a 1-byte newline-join artifact). Root cause: `BaseLayout` went from 1 consumer
  (home only, at baseline) to 9 (home + the 8 new Mirror routes), so Astro hoists
  BaseLayout's shared CSS into a separate dedup chunk rather than inlining it into the
  single page chunk.
  - **Deferral rationale:** not a defect and nothing to fix — the home renders the exact
    same DOM and the exact same set of CSS rules, with no visual or semantic change. The
    stylesheet split is a standard Astro CSS-deduplication optimization triggered by adding
    routes (more consumers of a shared layout), NOT by the `canonical` prop the story added
    (the prop is unset for the home and emits nothing). The 1.2–1.4 regression tests still
    pass because they assert on CSS rule content/structure, not the stylesheet filename
    count. The only inaccuracy is the wording of the completion note.
  - **Suggested resolution:** none required for correctness. If future stories want to
    assert "home output unchanged" as a hard gate, assert on the home DOM (with stylesheet
    `<link>`s normalized) and/or the combined CSS rule set, NOT the raw byte stream or the
    stylesheet file count — Astro's chunk boundaries legitimately shift as the number of
    shared-layout consumers grows.

## Deferred from: lead per-story smoke of story-1.7 (2026-06-06)

- **[1.7 · LOW] Site-wide internal-link ↔ canonical trailing-slash form mismatch.**
  - **Origin:** surfaced at Story 1.7's lead smoke; root cause is cross-cutting and PRE-EXISTING (introduced in Stories 1.3/1.4, inherited by the 1.7 footer + `/browse`). Not specific to 1.7.
  - **Issue:** internal navigation links (the hero fork, the home scene teasers, the global footer, and the `/browse` index) use the **no-trailing-slash** form (`/about`, `/speaking`, …), while each route's `rel=canonical` and the generated `sitemap.xml` use the **trailing-slash** form (`/about/`, `/speaking/`, …; the 1.6 CR standardized sitemap↔canonical on trailing-slash). So internal links point at a URL form that differs from the declared canonical.
  - **Deferral rationale:** functionally correct, not a broken outcome — Astro's default `trailingSlash: 'ignore'` serves BOTH forms directly (HTTP 200, no redirect hop), and every page's `rel=canonical` consolidates the SEO signal onto the trailing-slash form. The smoke's user-observable outcome (every page reachable via the footer/browse with JS off) passes. SEO-hygiene consistency nit, not a navigation/accessibility failure.
  - **Suggested resolution (single site-wide pass — Story 1.9 polish or a dedicated cleanup):** pick ONE canonical form site-wide. Recommended: set `trailingSlash: 'never'` in `astro.config.mjs` + emit slashless canonicals + slashless sitemap `<loc>` — MATCHES the existing internal links (smaller, lower-risk change). Alternative: keep trailing-slash canonicals/sitemap and normalize all internal `href`s (footer/browse/hero/teasers — all sourced from `routes.ts`) to trailing-slash. Add a build-output test asserting internal-link form === canonical form === sitemap `<loc>` form per route.
