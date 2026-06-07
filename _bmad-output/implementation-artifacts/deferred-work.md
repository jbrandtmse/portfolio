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
  - **✅ RESOLVED (Story 3.3, 2026-06-07):** `api/src/env.ts` created with Zod
    `.refine()` validation that rejects non-numeric / non-positive-integer values at
    startup; `api/src/index.ts` reads `API_PORT` via `env.ts` (not raw `process.env`).
    Locked by `env.test.ts` unit tests (rejects NaN, zero, negative, float).

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
  - **✅ RESOLVED (Story 3.3, 2026-06-07):** `api/src/env.ts` is the ONE canonical
    source for the `8787` default (`API_PORT: z.string().default('8787')…`).
    `api/src/index.ts` reads `env.API_PORT` — no raw `process.env.API_PORT ?? 8787`.
    The web proxy (`web/astro.config.mjs`) still reads `process.env.API_PORT ?? '8787'`
    (its own `.env`-driven default — documented in `.env.example`); this is intentional
    (the web package has its own env context; the api's canonical default is the
    single source). `.env.example` documents the override for both.

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
  - **✅ RESOLVED by Story 2.0** (PORT-1-epic2, 2026-06-06): the site URL form is now decided once in `astro.config.mjs` (`trailingSlash: 'always'` + explicit `build.format: 'directory'`) and every internal link === `rel=canonical` === sitemap `<loc>`, all trailing-slash, wired through the `routeHref()` helper on the single `routes.ts` registry. Locked by `web/test/url-form.test.ts` (build-output form-equality) + `web/e2e/url-form.spec.ts` (served-runtime no-301-hop). Lead smoke confirmed the `/about → 301 → /about/` hop is gone (footer click → `/about/` single 200). project-rules.md Rule 2 satisfied.
  - **⏩ Originally ASSIGNED → Story 2.0** (Epic 1 retrospective decision, 2026-06-06; Josh): confirmed live in prod at 1.10 as `/about → 301 → /about/` redirect hops.
  - **Origin:** surfaced at Story 1.7's lead smoke; root cause is cross-cutting and PRE-EXISTING (introduced in Stories 1.3/1.4, inherited by the 1.7 footer + `/browse`). Not specific to 1.7. Confirmed in prod at the 1.10 deploy smoke.
  - **Issue:** internal navigation links (the hero fork, the home scene teasers, the global footer, and the `/browse` index) use the **no-trailing-slash** form (`/about`, `/speaking`, …), while each route's `rel=canonical` and the generated `sitemap.xml` use the **trailing-slash** form (`/about/`, `/speaking/`, …; the 1.6 CR standardized sitemap↔canonical on trailing-slash). So internal links point at a URL form that differs from the declared canonical.
  - **Deferral rationale:** functionally correct, not a broken outcome — Astro's default `trailingSlash: 'ignore'` serves BOTH forms directly (HTTP 200, no redirect hop), and every page's `rel=canonical` consolidates the SEO signal onto the trailing-slash form. The smoke's user-observable outcome (every page reachable via the footer/browse with JS off) passes. SEO-hygiene consistency nit, not a navigation/accessibility failure.
  - **Suggested resolution (single site-wide pass — Story 1.9 polish or a dedicated cleanup):** pick ONE canonical form site-wide. Recommended: set `trailingSlash: 'never'` in `astro.config.mjs` + emit slashless canonicals + slashless sitemap `<loc>` — MATCHES the existing internal links (smaller, lower-risk change). Alternative: keep trailing-slash canonicals/sitemap and normalize all internal `href`s (footer/browse/hero/teasers — all sourced from `routes.ts`) to trailing-slash. Add a build-output test asserting internal-link form === canonical form === sitemap `<loc>` form per route.

## Deferred from: code review of story-1.8 (2026-06-06)

- **[1.8 · LOW] Root `pnpm build` no longer emits `api/dist` — Story 1.10 (deploy) must build the api explicitly.**
  - **Origin:** code review of Story 1.8. The story's build-wiring task changed root `build` from `pnpm -r --if-present run build` (which also compiled `api/dist` via the api's `tsc`) to `tsx scripts/build-content.ts && pnpm --filter web build`. So `pnpm build` now produces ONLY the (no-op) content pipeline + `web/dist/`; it no longer emits `api/dist`.
  - **Issue:** any later step that assumes `pnpm build` produces a runnable api (`node api/dist/index.js`) would break, because the api `tsc` emit is no longer chained into the root build.
  - **Deferral rationale:** judged ACCEPTABLE at review, NOT a defect. `pnpm build`'s job is to produce the static site (`web/dist/`); the api is a separate Hono service with its own lifecycle. The api remains fully buildable standalone (`pnpm --filter api build` — verified at review, emits `api/dist/index.js`) and is still typechecked by `pnpm -r typecheck`. The dev already flagged this in the story's §Decisions; recorded here so it is visible to Story 1.10 rather than living only in a story doc.
  - **Suggested resolution (Story 1.10 — deploy):** the deploy script MUST build the api explicitly before starting it — e.g. `pnpm --filter api build` (or `pnpm -r build`) ahead of `node api/dist/index.js`. Do NOT assume `pnpm build` emits `api/dist`. Owned by Story 1.10.

## Deferred from: code review of story-1.9 (2026-06-06)

- **[1.9 · LOW] The 1.4-deferred `#close` bottom-of-page `aria-current` nuance was NOT picked up by Story 1.9 — still open.**
  The Story 1.4 code-review deferral (`[1.4 · LOW]`, above) *suggested* Story 1.9 as a candidate home for a bottom-of-page fallback that lights the last scene (`#close`) when `scrollY + innerHeight` reaches `scrollHeight`, on the theory that 1.9 would "consolidate the gate + observer into `web/src/lib/motion.ts`". In practice Story 1.9 consolidated only the reduced-motion GATE (`onMotionAllowed`) into `motion.ts`; the `IntersectionObserver` + its `rootMargin: '-30% 0px -60% 0px'` active-band heuristic stayed inline in `SceneRail.astro`'s `<script>`. So the `#close` nuance is unchanged and remains open.
  - **Deferral rationale:** NOT a Story 1.9 AC failure. Story 1.9's ACs (AC1/IAC-1) scope the consolidation to the shared *gate* utility (the two-layer reduced-motion gate), explicitly "not re-implemented per component" — they do not mandate relocating the observer logic or changing its active-band heuristic. The 1.4 deferral named 1.9 only as a *suggested* candidate, not a hard assignment. The static baseline + the FR-2 "Skip to the end" → `#close` control are unaffected; only the enhancement's last-scene highlight at the very bottom of scroll is impacted (interior scenes track correctly — re-confirmed by the normal Playwright pass that `aria-current` moves off `#hero`).
  - **Suggested resolution:** carry forward to **Epic 5** (the Stage-2 cinematic camera path / Master Timeline work, where the scroll/observer logic is revisited and a natural place to centralize it), OR a dedicated scene-rail polish story: add a page-foot sentinel (or the `scrollY + innerHeight ≈ scrollHeight` epsilon check) so `#close` reliably lights at the end of scroll, and add a Playwright assertion that scrolling to the document bottom puts `aria-current` on the `#close` rail entry. Low priority (enhancement-quality, not a floor/AC issue).

## Deferred from: code review of story-1.10 (2026-06-06)

- **[1.10 · LOW] `deploy.sh` has no clean-working-tree precheck before `git pull --ff-only`.**
  - **Origin:** code review of Story 1.10 (Edge Case Hunter pass). `scripts/deploy.sh` runs `git pull --ff-only` as its first step (after `cd` to the repo root) without first asserting the working tree is clean / on the expected branch.
  - **Issue:** if an operator left uncommitted edits or a diverged branch on the VM, `git pull --ff-only` aborts — which is the SAFE outcome (no silent merge, no half-state), but the failure surfaces only as a git error mid-run rather than a clear "working tree dirty, aborting deploy" message up front.
  - **Deferral rationale:** NOT a defect and NOT a correctness gap. `set -euo pipefail` + `--ff-only` already make this fail-fast and safe — a dirty/diverged tree cannot produce a bad deploy; it just stops. Adding a precheck is operator-ergonomics polish, and over-strict prechecks risk blocking legitimate operator workflows (e.g. a deliberate local hotfix). The script is run by the LEAD on the VM, not in CI.
  - **Suggested resolution (optional, low priority):** add an early guard that, on a non-clean tree or non-fast-forwardable branch, prints a clear actionable message (e.g. `echo "[deploy] working tree not clean / not fast-forwardable — aborting" >&2; exit 1`) before attempting the pull. Purely a UX improvement to the deploy output.

## Surfaced during: Story 2.1 pipeline (2026-06-06)

- **[2.1 · LOW · environmental] `pnpm -r test` (and thus `test:all`) api package test fails with `EADDRINUSE: 8787` on the deploy VM.**
  - **Origin:** surfaced when the Story 2.1 dev ran the full suite on the VM. Root cause: the live `portfolio-api` systemd unit is LISTENing on 8787 (verified: `node` pid holding `*:8787`, unit active), and the api test binds the same fixed port. NOT caused by Story 2.1 (which touches only `content/` + `scripts/`, no api code) — it is a pre-existing api-test design issue that only manifests on a host where the deployed api is running (i.e. this VM).
  - **Deferral rationale:** environmental, not a code defect in any shipped story; the web + scripts suites (the Story 2.1 surface) are fully green, and the lead smoke does not depend on it. Fixing it touches api test infra, which Epic 3 (Invite-Me api work) will be in anyway.
  - **Suggested resolution (Epic 3, first api-touching story, ~3.3):** make the api test port-robust — bind an ephemeral port (`serve({ port: 0 })` / inject `API_PORT=0` in the test) or skip-with-warning when 8787 is occupied, so `pnpm test:all` is reliable on the deploy VM. Do NOT normalize "1 api test fails on the VM" as an accepted baseline.
  - **RESOLVED (2026-06-06, Story 3.0, AC1/AC2).** Pulled forward from ~3.3. Root-cause fix (not a workaround): the Hono `app` was split out of `api/src/index.ts` into a new `api/src/app.ts` (exports `app`, no `serve()`); `index.ts` is now a pure bootstrap that imports `app` and calls `serve()` at top level; `api/src/health.test.ts` imports from `./app.ts`, so importing the module under test opens NO socket. Verified on this VM with the live `portfolio-api` holding `:8787`: `pnpm --filter api test` is GREEN (no EADDRINUSE) and the in-process `app.request('/api/health')` runtime assertions (status 200 + `{status:"ok"}` + JSON content-type) still pass (Rule 3 tier preserved). Production entrypoint unchanged: `node api/dist/index.js` still binds the port and logs `[api] Hono listening …` (proven directly — binds an alt port and serves 200; defaults to 8787, EADDRINUSE-ing against the live unit). `api/package.json` / `scripts/deploy.sh` / systemd unit untouched. API_PORT validation/centralization correctly NOT pulled in (still deferred to 3.3's `api/src/env.ts` — see entries below).

## Deferred from: code review of story-2.1 (2026-06-06)

- **[2.1 · LOW · latent] `renderGlassbox` sorts with `String.prototype.localeCompare`, which is locale/ICU-sensitive in principle for non-ASCII keys.**
  `scripts/render-glassbox.ts:140,142` orders the emitted artifacts by `date.localeCompare` (primary) then `slug.localeCompare` (secondary). Without a locale argument, `localeCompare` can in theory vary with the host's ICU/locale for non-ASCII strings — a latent determinism surface (NFR-6).
  - **Deferral rationale:** NOT a defect today and nothing to fix now. Both sort keys are currently pure ASCII — the primary key is an ISO-8601 git committer date (lexically == chronologically ordered) and the secondary key is a kebab-case `slug`; for ASCII inputs `localeCompare` (default) equals a code-unit sort and is stable. Empirically confirmed: `web/dist` is byte-identical across two `pnpm build`s and `check-deterministic` PASSES, so NFR-6 holds for the seeded launch set. The exposure exists ONLY if a future curated entry introduces a non-ASCII `slug` (and only on the secondary key), which no current or planned entry does.
  - **Suggested resolution (whenever a non-ASCII slug is first added, or as cheap hardening):** pin the comparison to be locale-independent — either `localeCompare(b, 'en-US')` / `localeCompare(b, undefined, { sensitivity: 'variant' })`, or (simplest and fully deterministic) a plain code-unit comparison (`a < b ? -1 : a > b ? 1 : 0`) for both keys, and assert the chosen order in a determinism test. Low priority; track with the Glass Box / KB-index owner since the same allowlist feeds Epic 4.

## Deferred from: code review of story-2.2 (2026-06-06)

- **[2.2 · LOW · latent] YAML-frontmatter strip regex could over-strip a body that opens with a real `---` thematic break.**
  `web/src/components/glassbox/ArtifactReader.astro:57` strips a leading YAML frontmatter block before rendering: `body.replace(/^---[\s\S]*?---\n?/, '')`. The pattern is `^`-anchored and non-greedy, so it correctly removes ONLY a leading `--- … ---` block. The latent edge: a body that OPENED with a genuine markdown `<hr>` (`---`) and contained a later `---` line would have the span between the two `---` lines eaten as if it were frontmatter.
  - **Deferral rationale:** NOT a defect today and nothing to fix now. All 6 current allowlisted artifacts open with genuine YAML frontmatter (verified — `brainstorm`, `pre-brief-research`, `product-brief`, `ux-design`, `prd`, `ux-experience` each begin `---\n…`), which is the universal real shape of these BMAD artifacts; none opens with a bare `---` thematic break. The rendered bodies are byte-stable across builds and the AC2 frontmatter-leak tripwire (the `FRONTMATTER_LEAK_TOKENS` test) passes. The content is the project's own trusted, allowlisted prose.
  - **Suggested resolution (cheap hardening, whenever a more robust front-matter strip is wanted):** parse front matter with a proper extractor (e.g. `gray-matter`, already common in Astro stacks) instead of a regex, or tighten the regex to require the opening fence be immediately followed by a `key:`-shaped line (so a bare `---` hr is never mistaken for frontmatter), and add a test for a body that opens with an `<hr>`. Low priority; the same loader feeds the Epic 4 KB index, so co-own with the Glass Box / render-pipeline owner.

---

## Deferred from: code review of story-2.3 (2026-06-06)

- **[2.3 · LOW] Shared `ArtifactCard` default `externalLabel` says "(opens in new tab)" but the external link opens in the SAME tab (`target="_self"`).**
  `web/src/components/glassbox/ArtifactCard.astro:51,77,111` — when `external` is true the link sets `target="_self"`, yet the DEFAULT accessible label is `View ${title} (opens in new tab)`. On the Glass Box index this is not observable: the page passes an explicit, accurate `externalLabel` ("Visit the live site: …"), so the misleading default is never rendered (verified in dist — the live-site anchor's `aria-label` is the explicit string).
  - **Deferral rationale:** not a defect on the surface shipped by this story; the index never hits the default branch. It is a latent reuse-contract nit: Story 2.4 (Master Timeline) reuses this shared component (`## Consumed-by`) and may render an external card WITHOUT an explicit label, surfacing the "opens in new tab" copy on a same-tab link (a screen-reader inaccuracy).
  - **Suggested resolution:** in **Story 2.4** (or a trivial fix now) align the default label with the actual behavior — either change the default to "(opens in the same tab)"/no parenthetical, or set `target="_blank"` for genuinely-new-tab external links and keep the label. Add an isolated component test asserting the default external label matches the rendered `target`.
  - **RESOLVED (2026-06-06, Story 3.0, AC3/AC4).** The `ArtifactCard` default external label dropped the false "(opens in new tab)" parenthetical — it is now `View ${title}` — so the default no longer claims a new tab while the anchor is `target="_self"`; the `externalLabel` prop JSDoc was updated to match. Explicit consumer labels still win verbatim (the `/glass-box/` index passes `Visit the live site: …`; loandemo renders no external `ArtifactCard`), so the two shipped surfaces are unchanged. Locked by an isolated component test (`web/test/glassbox-components.component.test.ts`: default branch has no "new tab" text with `target="_self"`; explicit label renders verbatim) AND by 3 real-runtime e2e on the built `/glass-box/` page (`web/e2e/glassbox-index.spec.ts`). Mutation-verified: re-introducing "(opens in new tab)" turns the default-branch test RED. (This also closes the 2.4 carry-forward of the same item below.)

- **[2.3 · LOW · latent] The curated node manifest lives in `web/src/content/` with no content-collections config — safe today, a footgun if collections are later introduced.**
  `web/src/content/glassbox.index.ts` is a plain TypeScript module (exports `FEATURED_SLUGS` / `SHIPPING_NODE` / `GHOST_NODES`). Astro v6 treats `src/content/` as a content-collection directory ONLY when a `src/content.config.ts` (or legacy `src/content/config.ts`) exists; this repo has neither, so the file is an ordinary Vite module and the build is clean (16 pages — verified; behavior confirmed against the Astro v5→6 upgrade docs, which deprecated implicit per-folder collections in favor of an explicit config).
  - **Deferral rationale:** NOT a defect now — no content-collection scan happens, no warning/error, byte-stable build. Recording it because the trap is real for a LATER story: the moment someone adds `src/content.config.ts` (e.g. to model Glass Box artifacts or the Master Timeline as a real collection), Astro will begin scanning `src/content/` and a stray non-entry `.ts` there can collide or be misparsed.
  - **Suggested resolution:** if/when Astro content collections are adopted, relocate this curation manifest out of `src/content/` (e.g. `web/src/lib/glassbox.index.ts` or `web/src/data/`), updating the single import in `web/src/pages/glass-box/index.astro`. Until then, leave as-is (moving it now is churn with no benefit).
  - **Note (2026-06-06, story-2.4 code review):** the parallel timeline manifest was ORIGINALLY placed in `web/src/content/timeline/dots.ts` (same footgun), but code review MOVED it to the canonical repo-root `content/timeline/dots.ts` + a `render-timeline` generator — so the timeline is no longer exposed to this trap. The `glassbox.index.ts` instance remains (a curation manifest, not a build-pipeline source); it is a candidate to relocate to `web/src/lib/` whenever this LOW is actioned.

## Deferred from: code review of story-2.4 (2026-06-06)

- **[2.4 · LOW · latent determinism] Human-readable Dot/flagship dates are formatted with `new Date(date).toLocaleDateString('en-US', {month,year})` at build time — builder-timezone-sensitive.**
  `web/src/components/timeline/FlagshipNode.astro:44-52` (milestone date) and `:84-93` (cluster-dot date); the same IIFE is duplicated within the component. The `<time datetime="…">` attribute always carries the **verbatim** manifest string (e.g. `datetime="2026-06"`), so the machine-readable value is deterministic; only the **visible label** is locale/TZ-formatted. ISO date-only strings (`2026-06`, `2026-06-06`) are parsed as UTC, then `toLocaleDateString` renders in the builder's LOCAL timezone. On the deploy VM (UTC) all current dates render stably to "Jun 2026" and `check-deterministic` PASSes (web/dist byte-identical across two clean builds). 
  - **Deferral rationale:** NOT a current defect — the build host is UTC and `check-deterministic` would catch any drift before deploy. It is a latent footgun: a contributor building in a timezone west of UTC could see a UTC-midnight date (e.g. a future `2026-07-01`) roll back a month in the visible label only, diverging from the (correct) `datetime` attribute and from a UTC build. Parallels the codebase's existing "no build-time `new Date()`" discipline (ArtifactCard test asserts ghost nodes with no date emit no `<time>` to avoid baking a wall-clock value).
  - **Suggested resolution:** format the visible label deterministically without a TZ-dependent `Date` — either (a) pass an explicit `timeZone: 'UTC'` to `toLocaleDateString`, or (b) format from the ISO string directly (a small `formatDotDate(iso)` helper). Extract the duplicated IIFE into that ONE shared helper (resolves the in-component DRY nit at the same time). Add a unit test pinning the formatted output independent of the runner's TZ.
  - **RESOLVED (2026-06-06, Story 3.0, AC5).** A single shared `formatDotDate(iso)` helper was added to `web/src/lib/timeline.ts`, built on a module-level `Intl.DateTimeFormat('en-US', { month:'short', year:'numeric', timeZone:'UTC' })` — TZ-independent by construction. BOTH duplicated IIFEs in `FlagshipNode.astro` (milestone date + cluster-dot date) now call it; the `~`-passthrough, `[`-prefix passthrough, and invalid-date fallback are preserved, and `<time datetime>` still carries the verbatim manifest ISO. Verified: an LA runner renders `2026-06-01` → "Jun 2026" with the UTC pin vs "May 2026" without it (the exact bug closed). Locked by a TZ-pinned unit test (`web/test/timeline-format.test.ts` — same-process label cases + a child-process UTC-vs-America/Los_Angeles proof) and 4 real-runtime e2e on the built `/timeline/` page (`web/e2e/timeline.spec.ts`). Mutation-verified non-vacuous: dropping `timeZone:'UTC'` turns the LA unit tests RED; emitting a day-of-month turns all 4 timeline e2e RED. `check-deterministic` still PASSES (web/dist byte-identical across two clean builds) — no NFR-6 regression on the UTC host.

- **[2.4 → carries 2.3 · LOW] Shared `ArtifactCard` default-`externalLabel` "(opens in new tab)" mismatch was ASSIGNED to Story 2.4 but is neither resolved nor surfaced — re-assign forward.**
  The story-2.3 deferral (above) suggested fixing the `ArtifactCard` default external label "in Story 2.4 (or a trivial fix now)". Story 2.4's `FlagshipNode` does NOT reuse `ArtifactCard` for the Dot clusters (it builds a lighter Dot+label link row, which the story's Dev Notes explicitly permit), and the timeline's one external link ("The Live Site") is rendered directly with `rel="noopener noreferrer"` and NO `aria-label` "(opens in new tab)" copy. So 2.4 neither hits the buggy `ArtifactCard` default branch nor fixes it — the latent nit is unchanged.
  - **Deferral rationale:** still not observable on any shipped surface (no consumer renders the `ArtifactCard` external branch without an explicit accurate label). Carrying it so it is not silently dropped now that its originally-assigned story (2.4) has closed without touching it.
  - **Suggested resolution:** fix at the `ArtifactCard` source (align the default label to actual `target`, or set `target="_blank"` for genuinely-new-tab links) with an isolated component test — fold into Story 2.5 (loandemo case study, which DOES plan to reuse the artifact-card/reader patterns and is the next likely `ArtifactCard` external consumer) or a trivial standalone fix.
  - **RESOLVED (2026-06-06, Story 3.0, AC3/AC4)** — same fix as the 2.3 entry above (default external label de-claimed of "new tab"; component + e2e + mutation coverage). This carry-forward is now closed at the `ArtifactCard` source.

- **[2.4 · LOW · pre-existing repo hygiene] `pnpm format:check` is RED across ~14 committed files from prior epics — Prettier style is not enforced in the working tree.**
  Discovered during 2.4 code review. `pnpm format:check` (part of `pnpm test:all`) flags files NONE of which Story 2.4 introduced or modified — e.g. `web/src/pages/glass-box/index.astro`, `web/src/components/glassbox/ArtifactCard.astro`, `web/src/pages/glass-box/[artifact].astro`, `web/e2e/glassbox-reader.spec.ts`, `web/test/build-output.test.ts`, `scripts/render-glassbox.security.test.ts` (all committed, no uncommitted diff). So the repo's Prettier check was already failing before this story; prior stories landed unformatted `.astro`/`.ts` files. (Story 2.4's NEW files — `content/timeline/dots.ts`, `scripts/render-timeline.ts`, `scripts/render-timeline.test.ts`, `web/src/lib/timeline.ts` — were brought to Prettier-clean during review, so 2.4 does not ADD to the debt.)
  - **Deferral rationale:** out of Story 2.4's scope (cross-epic accumulation, not caused by this change); reformatting 14 unrelated files inside a story-scoped code review would muddy the diff and risk unrelated regressions. The functional gates (vitest, e2e, typecheck, determinism, eslint) are all green; only the cosmetic Prettier gate is red.
  - **Suggested resolution:** a dedicated repo-wide `pnpm format` (Prettier `--write`) pass in its own commit/PR (not inside a feature story), then keep it green via a pre-commit hook or CI gate. Verify `.prettierignore` intentionally excludes anything that should not be formatted (e.g. generated dirs) before the sweep.
  - **Note (2026-06-06, story-2.6 code review):** RESOLVED. `pnpm format:check` (root `prettier --check .`) now runs GREEN ("All matched files use Prettier code style!") — the prior-epic debt was swept between 2.4 and 2.6 (Story 2.5 already reported the gate green). No outstanding Prettier debt at the close of Epic 2.

## Deferred from: code review of story-2.6 (2026-06-06)

- **No new deferrals.** The Story 2.6 adversarial code review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) found **zero deferrable items**. The story ships `docs/project-import.md` (the documented Project Import path), a `content/README.md` pointer, `scripts/project-import.test.ts` (25 mechanism + doc-accuracy tests), and `scripts/fixtures/sample-project-artifact.md` (a clearly-labelled test fixture).
  - **Doc accuracy (AC1/AC3):** every concrete instruction in `docs/project-import.md` was cross-checked against reality and is accurate — the three wiring points (`content/kb/`, `content/timeline/dots.ts`, `content/glassbox.allowlist.ts`) exist; symbol names (`TIMELINE_ERAS`, `GLASSBOX_ALLOWLIST`), the `GlassboxType` 9-member union, era IDs (`'runway'`/`'agentic-turn'`), and generated-output paths (`web/src/generated/{timeline,glassbox}.json`) all match the live source; the `pnpm build` → verify → `scripts/deploy.sh` flow matches the real 6-step deploy script step-for-step; the `scripts/build-kb-index.ts` + `api/data/` references are honestly labelled Epic-4/Story-4.1 forward-references (correctly absent today, excluded from the doc-existence guard by design).
  - **Mechanism test non-vacuity (AC2/AC4):** independently mutation-proved both directions during review — mutating `renderGlassbox` to ignore its allowlist arg failed 4 tests; mutating `renderTimeline` to ignore its `eras` arg (serialize the live manifest) failed 2 tests (incl. a negative control catching the live `loandemo`/`This portfolio` flagships leaking in). Both reverted byte-clean; full scripts suite back to 107/107. The negative controls feed non-empty decoys, so they are not trivially-empty-passing.
  - **No live pollution (verified from a fresh build, not just in-test):** `pnpm build` + grep of `web/src/generated/` and `web/dist/` for the fixture/sample/decoy strings → zero matches; the generated `glassbox.json` holds exactly the 6 real artifacts and `timeline.json` exactly the 2 real flagships. The fixture is absent from both live source manifests.
  - **Edge case (dismissed, not a defect):** the fixture is an untracked file, so `gitCommitterDate()` returns the deterministic `FALLBACK_DATE` constant for the sample Glass Box artifact. The test asserts ISO-8601 *form* (regex), not a specific value, so this is stable and deterministic — handled by design, no action.
  - **Determinism (NFR-6):** `pnpm check-deterministic` PASS — two clean builds byte-identical (tree hash `a66a0a67…`, 16 pages / 27 files). Rule 3 EXEMPT (process/tooling/doc story; the mechanism test is the correct CLI/library real-runtime tier) — no HIGH filed for "no browser test."

## Deferred from: code review of story-3.1 (2026-06-06)

- **No new deferrals.** The Story 3.1 (Speaker Surface — reel & signature talks) adversarial code review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) found **one substantive defect, which was auto-resolved inline** (not deferred), plus three quality cleanups (also applied). Nothing remains for a future story.
  - **Auto-resolved MED (not deferred):** on `/speaking/reel/` the `ReelPoster` primary `<a>` self-linked to `/speaking/reel/` (the page it is already on), so the play-button affordance + its "Watch … ~90 seconds" `aria-label` promised an action it did not perform. Fixed by adding a `posterHref` prop to `ReelPoster.astro` (default `/speaking/reel/` keeps `/speaking/` unchanged — AC1 intact) and pointing the reel page's poster at the hosted video `[OPEN]` (satisfies AC2's "static link to the hosted video"). Locked by a new component-tier vitest + a new served-runtime Playwright test (both mutation-relevant); 0-JS and NFR-6 byte-determinism re-verified post-fix.
  - **AC verification (all PASS on the real build/runtime):** AC1 (reel is the lead item, static `<a>` to `/speaking/reel/`, duration-naming aria-label, decorative elements aria-hidden, 0-JS); AC2 (reel page VideoObject in initial HTML, hosted-video link, 0-JS); AC3 (3 talk-cards, abstracts 166/169/180 words, first inline + others in native `<details>` with full text in DOM, 4 takeaways each, format pills, logistics, veteran-IC `[ASSUMPTION]`, all flags visible text); AC4 (3 valid `Event` nodes with real performer + correct embedding, valid reel `VideoObject`, deterministic constants); AC5 (literal `pnpm test:all` GREEN — 578 vitest / 180 e2e / Lighthouse / axe AA 0 / byte-identical builds / no exclamation marks / trailing-slash links).
  - **Rule checks:** Rule 1 (self-consumed components — story declares accurately), Rule 3 (real-runtime evidence at both tiers), Rule 5 (canonical ROOT gate re-run green by the reviewer), Rule 6 (no `docs/adr/` — N/A), Rule 8 (`speaking` Playwright project runs in default suite — 22 tests executed) all satisfied.
  - **Dismissed as noise (no action):** `rel="noopener noreferrer"` without `target="_blank"` on a same-tab link (harmless); the `N Event nodes = SIGNATURE_TALKS.length` self-referential assertion (real regressions caught by the keyed-by-title + veteran-presence tests — mutation-confirmed); the exclamation-mark test stripping only `<!doctype html>` (intent met, no `!` present today).

## Deferred from: code review of story-3.2 (2026-06-07)

The Story 3.2 (copy-paste bios & social proof) adversarial code review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) found **zero HIGH/MED defects**; the highest-risk change (the NFR-1 carve-out) is correctly scoped and the QA anti-drift tests are non-vacuous (mutation-verified). Two **LOW** items are deferred (both intentional trade-offs, no clean must-fix patch).

- **[3.2 · LOW · a11y nicety] The Copy `<button>`'s `aria-label` is not updated when the button enters the copied state.** `web/src/components/speaker/BioBlock.astro:53` sets `aria-label={`Copy ${bio.label}`}` (renders "Copy Short bio" / "Copy Long bio"). When clicked, the copy script swaps the button's visible text to "Copied ✓" and sets `data-copied`, but the `aria-label` stays "Copy Short bio". A screen-reader user re-querying the button (e.g. via the rotor) after copying would still hear the action label "Copy Short bio", not the copied state.
  - **Deferral rationale:** NOT an AC violation and NOT an axe failure — AC1/AC4 require the success to be *announced*, and it IS, via the dedicated `role="status"` / `aria-live="polite"` region (`#bio-status-*`), which fires "Copied ✓" on copy (verified on the served runtime: the `.bio-block__status` text is set, and the e2e asserts it). A permanent action-naming `aria-label` on the control is a defensible, common pattern; mutating the label on a transient 2.2s state is optional polish. axe AA = 0 violations on `/speaking/` with the current design.
  - **Suggested resolution:** when actioned, update the button's `aria-label` in lockstep with the copied/revert transitions (e.g. set `aria-label="Copied ✓ — ${bio.label}"` on success, restore on revert) so the control's accessible name matches its visible state; add an e2e assertion on the button's accessible name in both states. Trivial, low value; fold into any future BioBlock touch.

- **[3.2 · LOW · cosmetic copy] The short-bio word-count label reads "50 words" but the verbatim bio is 47 words.** `web/src/data/speaking.ts` `BIOS[0].wordCount = '50 words'`; the bio text (which MUST mirror `PERSON.description` verbatim per AC5 — confirmed byte-equal, 300 chars / 47 words) is 47 words, so the displayed count over-states by 3. The long bio's "126 words" label is accurate (126 words).
  - **Deferral rationale:** the bio string itself is correct and locked to `PERSON.description` (changing the prose to hit exactly 50 would break the AC5 byte-mirror — the canonical source is the constraint, not the label). The label is an approximate descriptor of a "~50-word" bio; the discrepancy is 3 words and purely cosmetic. The story/Decision-1 itself describes it as the "50-word" bio (an approximation). No functional or credibility-floor impact (it is not a fabricated *claim about Josh*, just a rounded length descriptor of the page's own text).
  - **Suggested resolution:** when actioned, either relabel to the true count ("47 words") or generalize to a non-numeric descriptor ("~50 words" / "Short"); if a precise count is wanted, derive `wordCount` from `text.split(/\s+/).length` so label and prose can never drift. Pairs naturally with the canonical short-bio source if `PERSON.description` is ever re-approved by Josh.

## Deferred from: code review of story-3.3 (2026-06-07)

The Story 3.3 (Invite-Me capture — data model, endpoint & email — the FIRST service-introducing story) adversarial code review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) found **zero HIGH and zero MED defects**. All six ACs + the Integration AC were verified against the **real runtime** (live Postgres `inquiries` table inspected via `psql`; `node dist/index.js` confirmed to bind the port; the literal `pnpm test:all` re-run by the reviewer to **exit 0**, ending with `lh`). The headline persist-first / non-destructive-mail-failure guarantee, the no-PII-in-logs invariant, and the honeypot no-persist guard were each **mutation-verified non-vacuous** (injected a destructive rollback → the real-DB forced-mail-fail test went red; leaked `email` into a log line → the no-PII test went red; defeated the honeypot guard → both the unit and real-DB honeypot tests went red; all reverts byte-clean, DB left at 0 rows). Security: `api/.env` (DATABASE_URL + future keys) is gitignored and untracked; no `.env` is tracked anywhere; `.env.example` carries placeholders only; NFR-5 holds (the web build is untouched). One **MED-shaped doc-comment inaccuracy was auto-resolved inline** (not deferred). Three **LOW** items are deferred (all intentional Stage-1 trade-offs the story's own wording sanctions; no clean must-fix patch).

- **Auto-resolved inline (not deferred):** `api/src/routes/invite.ts` Step-7 comment claimed "Mail failure → HTTP 200 for persistence" while the success path actually returns **201**. Both are "success" per AC3 ("HTTP 200/201"), so behavior was correct — only the comment was wrong/misleading. Rewrote the comment to state 201 (the inquiry was created) and that mail failure is non-destructive. Re-ran prettier/eslint/the 30 invite tests post-edit → all green.

- **[3.3 · LOW · cosmetic label] The rate-limiter is documented as a "sliding window" but is implemented as a fixed window.** `api/src/routes/invite.ts:32-56` resets `windowStart` only once a full `RATE_LIMIT_WINDOW_MS` (60s) has elapsed since the window opened, so requests are counted in fixed 60s buckets, not a true rolling window. A burst can therefore allow up to ~2×`RATE_LIMIT_MAX` across a bucket boundary.
  - **Deferral rationale:** NOT an AC violation — Decision 5 explicitly scopes this to "a simple in-memory per-IP sliding window for Stage 1" and AC3 only requires "rate-limiting rejects floods (429)", which it does (verified + mutation-relevant test green). The fixed-window approximation is the standard, well-understood Stage-1 choice; the boundary-burst behavior is acceptable for a non-authenticated spam control with no Redis. Only the comment label is imprecise.
  - **Suggested resolution:** when the rate-limiter is next touched (e.g. the Story-4.3 `/api/guide` limiter, or a Redis-backed Stage-2 limiter), either relabel the comment to "fixed window" or implement a genuine sliding/rolling window (timestamp ring or token bucket). Low value at Stage 1.

- **[3.3 · LOW · data hygiene] `updated_at` is not bumped when `mail_status` is written after the email step.** `api/src/routes/invite.ts:213` does `db.update(inquiries).set({ mailStatus })` without also setting `updatedAt`, so a row's `updated_at` stays equal to `created_at` even though the row was modified (mail_status went null → sent/failed/skipped). The integration test confirms both timestamps are `Date`s but does not assert they differ.
  - **Deferral rationale:** NOT an AC violation — AC1 only requires `updated_at` to exist as a defaulted `timestamptz` (it does), and the schema comment scopes manual `updated_at` maintenance to the future `new`→`replied` status workflow (not this story). No consumer reads `updated_at` yet; the value is internally consistent for the row's "business" state at creation. No functional impact on Story 3.3 / 3.4.
  - **Suggested resolution:** when the `new`→`replied` admin workflow lands (or any future column mutation), set `updatedAt: new Date()` (or a DB-side trigger / `.$onUpdate()` in the Drizzle column) on every UPDATE so `updated_at` reflects the last write; backfill the mail_status update path at that time.

- **[3.3 · LOW · validation depth] `MAIL_FROM` / `MAIL_TO` are validated as `z.string()`, not `z.email()`.** `api/src/env.ts:52-53` accepts any non-empty string (with placeholder defaults `noreply@example.com` / `owner@example.com`); a malformed address would only surface as a Nodemailer send error at runtime (recorded as `mail_status='failed'`, non-destructive).
  - **Deferral rationale:** NOT an AC violation — Decision 3 specifies these as "optional with sensible `[OPEN]` defaults until set on the VM"; they are operator-supplied server-side config, not untrusted user input, and a bad value fails safe (skipped/failed mail, inquiry still persisted). Tightening to `z.email()` now would add no security value (the values are trusted) and could even reject legitimate display-name forms (`"Josh" <josh@x>`).
  - **Suggested resolution:** when live email is enabled at launch (the SPF/DKIM step in `docs/launch-checklist.md`), optionally tighten `MAIL_FROM`/`MAIL_TO` to a stricter format check (allowing the `Name <addr>` form) so a fat-fingered VM `.env` fails fast at boot rather than silently at first send.
