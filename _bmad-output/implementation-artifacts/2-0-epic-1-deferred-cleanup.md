# Story 2.0: Epic 1 Deferred Cleanup — site-wide URL-form consistency (trailing-slash)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Created by the /epic-cycle retro-review gate (Epic 1 → Epic 2). Cleanup story; NOT in epics.md.
     Absorbs Epic 1 retrospective Action A5 + deferred-work.md [1.7]. Full Epic-1 deferred-work triage
     table is appended at the end of this file. -->

## Story

As the site owner (Josh),
I want every internal link, `rel=canonical`, and `sitemap.xml` `<loc>` to use ONE agreed URL form for every route,
so that internal navigation never incurs a 301 redirect hop and the SEO/GEO signal is consolidated on a single canonical URL per page (project-rules.md Rule 2).

## Context & decision (read first)

**The defect (deferred-work.md [1.7], confirmed live in prod at Story 1.10):** internal navigation links use the **slashless** form (`/about`, `/speaking`, …) while each page's `<link rel="canonical">` and the generated `sitemap.xml` `<loc>` use the **trailing-slash** form (`/about/`, …). On the deployed nginx this makes every internal nav `/about → 301 → /about/`, and the SEO signal is split across two URL forms. Functional (Astro serves both) but a class-of-bug per Rule 2.

**The decision — normalize to the TRAILING-SLASH form site-wide.** Set `trailingSlash: 'always'` + explicit `build.format: 'directory'` in `astro.config.mjs`, and change the internal *link* forms to trailing-slash so links === canonical === sitemap, all `/about/`.

**Why trailing-slash and NOT slashless (this REVERSES the tentative "slashless" recommendation in deferred-work.md [1.7]):** the deferred note assumed `trailingSlash: 'never'` alone would yield slashless canonicals. It does not. Per the Astro v6 configuration reference, URL form follows `build.format`, not `trailingSlash` in isolation: `directory` format → trailing-slash pathnames; **slashless canonicals require `build.format: 'file'`** (emitting `about.html` instead of `about/index.html`), and the docs explicitly advise against mixing `directory` + `never`. Choosing slashless would therefore force THREE higher-risk changes that trailing-slash avoids entirely:

1. **nginx** — the live vhost (`deploy/nginx/joshuabrandt.conf` → `/etc/nginx/conf.d/joshuabrandt.conf`) serves `root …/web/dist;` with `try_files $uri $uri/ /index.html =404`. That already serves `/about/` → `about/index.html` with **no change**. `build.format: 'file'` (`about.html`) would need `try_files $uri $uri.html $uri/ …`.
2. **the build-output test suite** — `web/test/build-output.test.ts` is built around directory-index output: `routeHtmlPath()` reads `<route>/index.html`, and `liveRouteLocs()` walks dist for `index.html`. `build.format: 'file'` would break both and force a large rewrite.
3. **the sitemap** — already emits trailing-slash `<loc>` (`web/src/pages/sitemap.xml.ts`); slashless would require changing it (and its tests).

Trailing-slash keeps canonical, sitemap, file layout, AND nginx all UNCHANGED — only the internal *link* forms flip. Smallest, lowest-risk change that fully satisfies Rule 2. (Astro v6 config reference: `build.format` / `trailingSlash` — verified 2026-06-06.)

## Acceptance Criteria

1. **URL form decided once, in config.**
   **Given** `web/astro.config.mjs`
   **When** the URL convention is set
   **Then** it declares `trailingSlash: 'always'` and an explicit `build.format: 'directory'` (no longer relying on the defaults), with a short comment citing project-rules.md Rule 2 as the single source of the site's URL-form decision.

2. **Every internal route link uses the trailing-slash form.**
   **Given** every internal link to a Mirror route across the site — the global Footer, `/browse`, the hero audience-fork (`HeroStatic.astro`), and the scene-rail jumps/teasers (`SceneRail.astro`) — all of which are either sourced from the `routes.ts` registry or hardcoded
   **When** the site is built
   **Then** each such `href` is the trailing-slash form (`/about/`, `/speaking/`, `/speaking/reel/`, `/work/loandemo/`, `/glass-box/`, `/timeline/`, `/faq/`, `/invite/`, `/browse/`; site root stays `/`)
   **And** non-route hrefs are untouched: in-page fragments (`#thesis`, `#close`, …), asset paths (`/fonts/…`, `/_astro/…`), the `/api/*` proxy path, `mailto:`, and absolute `http(s)://` externals must NOT receive a trailing slash.

3. **Canonical form is unchanged and equals the link form.**
   **Given** each Mirror route's `<link rel="canonical">` (built in `MirrorLayout.astro` from `Astro.url.pathname` + `Astro.site`)
   **When** the site is built with `trailingSlash: 'always'` + `build.format: 'directory'`
   **Then** every canonical href is the trailing-slash form (`https://joshuabrandt.abacusai.cloud/about/`), matching the link form from AC2 and the sitemap form (unchanged).

4. **Sitemap `<loc>` form equals the canonical/link form.**
   **Given** `web/src/pages/sitemap.xml.ts`
   **When** the sitemap is generated
   **Then** every `<loc>` is the trailing-slash absolute form (unchanged from today) and equals the per-route canonical and link forms — and the sitemap code does not double-slash if the registry representation changes (no `//`).

5. **Form-equality build-output test (the lock; Rule 2 mandate).**
   **Given** a real `astro build`
   **When** a new build-output test runs per Mirror route
   **Then** it asserts, for EVERY route, that the internal-link form (as it appears in the built footer/`/browse`/home markup) === the `rel=canonical` form === the sitemap `<loc>` form — exact-string equality, not slash-normalized — so any future drift between the three surfaces fails CI. This test is discoverable by the default `pnpm test:all` suite (skill-rules Rule 8).

6. **Integration verification — no 301 hop on internal navigation (the user-observable outcome).**
   **Given** the built site served the way production serves it (the directory-format `web/dist` behind the existing nginx `try_files $uri $uri/ /index.html`, or an equivalent `astro preview`)
   **When** a visitor follows any internal route link with JavaScript off
   **Then** the request resolves with a single 200 response (no `/about → 301 → /about/` hop), because the link now points at the trailing-slash form nginx serves directly.

7. **No regression to the Epic-1 quality floor.**
   **Given** the full suite `pnpm test:all`
   **When** it runs after the change
   **Then** the existing Vitest build-output, component, and Playwright e2e/JS-off/reduced-motion/view-source/axe suites pass (assertions updated to the trailing-slash link form where they currently hardcode the slashless form), the deterministic byte-stable build holds (NFR-6), and the 0-executable-JS-by-default floor (NFR-1) is unchanged.

## Integration ACs

This is a cleanup/refactor story. It introduces **no new service, module, or shared component** — it changes one config option, normalizes link forms across existing consumers of the existing `routes.ts` registry, and adds one test. The skill-rules Rule 1 "introduces a service" clause therefore does not apply. AC5 (the cross-surface form-equality build-output test) and AC6 (the no-301 integration check) ARE the integration verification: they exercise the real `astro build` output and the real served behavior across all three consumer surfaces (links, canonical, sitemap), not internal state.

## Tasks / Subtasks

- [ ] **Task 1 — Set the URL convention in config (AC1).**
  - [ ] In `web/astro.config.mjs`, add `trailingSlash: 'always'` and explicit `build.format: 'directory'`, with a comment citing project-rules.md Rule 2.
- [ ] **Task 2 — Derive the link form from ONE place (AC2, AC4).**
  - [ ] Add a single helper to `web/src/lib/routes.ts` that maps a registry `path` to its canonical link href (e.g. `routeHref(path) => path === '/' ? '/' : path.endsWith('/') ? path : path + '/'`). Keep the stored `path` values slashless (internal representation) so existing string comparisons elsewhere don't churn; the helper is the single place the trailing-slash form is produced.
  - [ ] Update the Footer (`web/src/components/common/Footer.astro`) and `/browse` (`web/src/pages/browse.astro`) to render hrefs via that helper.
  - [ ] Update `web/src/pages/sitemap.xml.ts` to build `<loc>` via the same helper (replacing the inline `${route.path}/`) so links === sitemap by construction and there is no `//` risk.
- [ ] **Task 3 — Normalize the hardcoded route links (AC2).**
  - [ ] `web/src/components/hero/HeroStatic.astro`: `/speaking` → `/speaking/`, `/faq` → `/faq/` (leave `#thesis` and the `Explore` fragment untouched).
  - [ ] `web/src/components/scene/SceneRail.astro`: both `/speaking` jumps → `/speaking/` (leave `#hero`/`#thesis`/`#close`/… fragments untouched).
  - [ ] Grep the whole of `web/src` for `href="/…"` to catch any other internal route link (Wordmark, scene teasers `/timeline`, `/work/loandemo`, `/glass-box`, `/invite`); normalize ROUTE links only. Exclusions (do NOT slash): `#…` fragments, `/fonts/…`, `/_astro/…`, `/api/…`, `mailto:`, `http(s)://…`, `/sitemap.xml`, `/robots.txt`.
- [ ] **Task 4 — Check structured-data / internal URLs for form consistency (AC3).**
  - [ ] Inspect `web/src/lib/jsonld.ts` and `web/src/lib/person.ts` for any emitted internal URL (e.g. Person `url`, `@id`, `sameAs` is external so excluded). If any internal-route URL is emitted, make it use the same trailing-slash form so the page's structured data agrees with its canonical.
- [ ] **Task 5 — Add the form-equality build-output test (AC5).**
  - [ ] In `web/test/build-output.test.ts` (or a new `web/test/url-form.test.ts` discoverable by the default suite), add a per-route assertion that link-form === canonical-form === sitemap-`<loc>`-form, exact-string, against the real build.
  - [ ] Tighten the existing canonical assertion if needed so it no longer slash-normalizes away the form (it currently does `.replace(/\/$/, '')`), OR keep it and rely on the new exact-form test — but the suite as a whole must now PROVE the trailing-slash form, not tolerate either.
- [ ] **Task 6 — Update existing assertions to the trailing-slash link form (AC7).**
  - [ ] `web/test/build-output.test.ts`: footer-link patterns (`expectGlobalFooter` / `ALL_MIRROR_ROUTES`), `/browse` link patterns, the home hero-fork hrefs (`/speaking`, `/faq`), the scene-rail jump (`/speaking`), the teaser hrefs (`/timeline`, `/work/loandemo`, `/glass-box`, `/invite`), and the `HOME_FORWARD_REFS` block — update each hardcoded slashless href to the trailing-slash form. (`routeHtmlPath()`/`liveRouteLocs()` stay as-is — directory format is unchanged.)
  - [ ] `web/test/Footer.component.test.ts`, `web/test/HeroStatic.component.test.ts`, `web/test/SceneRail.component.test.ts`: update any hardcoded slashless route-href assertions to trailing-slash.
  - [ ] Playwright e2e (`web/e2e/*.spec.ts`): any navigation/assertion that uses a slashless route URL → trailing-slash, so the `astro preview` server (which now enforces `trailingSlash: 'always'`) does not redirect mid-test.
- [ ] **Task 7 — Verify the floor (AC6, AC7).**
  - [ ] Run `pnpm test:all`; confirm green. Confirm the build stays deterministic/byte-stable and 0-executable-JS-by-default. Note in the Dev Agent Record any assertion files touched.

## Dev Notes

### Current state (what exists today)

- **`web/astro.config.mjs`** — `site: 'https://joshuabrandt.abacusai.cloud'`, `output: 'static'`, `integrations: [react()]`. **No `trailingSlash`, no `build.format`** → Astro defaults: `build.format: 'directory'`, `trailingSlash: 'ignore'`. (This story makes the directory format explicit and pins `trailingSlash: 'always'`.)
- **`web/src/lib/routes.ts`** — the single registry (`NAV_ROUTES`, re-exported as `SITEMAP_ROUTES`). `path` values are **slashless** (`/about`, …; root is `/`). Feeds Footer, `/browse`, and the sitemap. This is the "one route registry" Rule 2 wants link/canonical/sitemap wired from.
- **`web/src/layouts/MirrorLayout.astro:66`** — canonical = `Astro.site ? new URL(Astro.url.pathname, Astro.site).href : undefined`. With `build.format: 'directory'`, `Astro.url.pathname` is `/about/` → canonical already trailing-slash. **No code change needed for canonical**; setting `trailingSlash: 'always'` only makes the existing behavior explicit/consistent in dev + preview.
- **`web/src/pages/sitemap.xml.ts:70`** — `<loc>` = `route.path === '/' ? \`${origin}/\` : \`${origin}${route.path}/\`` → already **trailing-slash**. Switch it to the shared helper so it can't drift from the link form.
- **Internal route links are currently slashless:** Footer + `/browse` (via `route.path`), `HeroStatic.astro` (`/speaking`, `/faq`), `SceneRail.astro` (`/speaking` ×2), and the home teasers (`/timeline`, `/work/loandemo`, `/glass-box`, `/invite`).

### Astro v6 semantics (verified against the official config reference, 2026-06-06)

- Emitted file depends on `build.format` only: `directory` → `about/index.html`; `file` → `about.html`.
- `Astro.url.pathname` form follows `build.format`: `directory` → trailing-slash (`/about/`); `file` → slashless (`/about`). `trailingSlash` aligns dev/preview/redirect behavior with that and should be set to MATCH the format (`'always'` for directory).
- ∴ `directory` + `always` ⇒ `about/index.html`, canonical `/about/`. This is exactly today's output, now made explicit and enforced in dev/preview. The canonical line in `MirrorLayout.astro` needs no edit.

### Deployment — NO nginx change required

The live vhost serves `root /home/ubuntu/git/portfolio/web/dist;` with `location / { try_files $uri $uri/ /index.html =404; }`. Directory-format `about/index.html` is served for `/about/` directly. The 301 today is nginx's directory-redirect for slashless `/about`; pointing links at `/about/` eliminates the hop. The tracked vhost `deploy/nginx/joshuabrandt.conf` and the deployed copy both stay as-is. (Had we chosen slashless, `try_files` would have needed `$uri.html` — another reason trailing-slash is the lower-risk call.)

### Test implications (the bulk of the diff)

`web/test/build-output.test.ts` currently hardcodes the **slashless** link form in: `ALL_MIRROR_ROUTES` footer-link patterns (`expectGlobalFooter`), the `/browse` body link patterns, the home hero-fork hrefs (lines ~198, ~200), the scene-rail jump (line ~368), the teaser hrefs (lines ~392–396), and `HOME_FORWARD_REFS` (lines ~716–728). The **sitemap** test (lines ~907–922) already asserts trailing-slash — leave it. The **canonical** test (lines ~560–570) slash-normalizes before comparing — either tighten it to assert the exact trailing-slash form or rely on the new AC5 exact-form test. Directory-index machinery (`routeHtmlPath`, `liveRouteLocs`) is unaffected. Update the three component tests + the e2e specs for the trailing-slash link form so `astro preview` (now `trailingSlash: 'always'`) does not redirect during e2e navigation.

### Constraints / invariants to preserve

- **NFR-1** 0-executable-JS-by-default on every Mirror route + the single gated scene-rail script on home. Unchanged by this story.
- **NFR-6** deterministic, byte-stable build. The link-form change is deterministic; re-verify a second build is byte-identical.
- **Positive-assertion voice / no exclamation** in copy (unchanged — link hrefs only).
- **project-rules.md Rule 2** is the governing rule; this story IS its first implementation. After this story, the rule's "form-equality test in CI" obligation is satisfied by AC5.

### Project Structure Notes

- Files touched are all under `web/` (the static site package). No `api/` or `shared/` changes. No new files except (optionally) `web/test/url-form.test.ts`.
- The "one registry, one helper" approach (Task 2) is the structural realization of Rule 2's "wire links/canonical/sitemap from ONE route registry."

### References

- [Source: .claude/rules/project-rules.md#2. URL-form consistency] — the governing rule (pick `trailingSlash` once; links === canonical === sitemap; form-equality test in CI).
- [Source: _bmad-output/implementation-artifacts/deferred-work.md#Deferred from: lead per-story smoke of story-1.7] — [1.7 · LOW] the trailing-slash mismatch, assigned to Story 2.0; both fix options.
- [Source: _bmad-output/implementation-artifacts/epic-1-retro-2026-06-06.md#Action items] — A5 (Story 2.0 fixes trailing-slash site-wide).
- [Source: web/src/lib/routes.ts] — the single route registry (Footer + /browse + sitemap source).
- [Source: web/src/pages/sitemap.xml.ts#L70] — sitemap `<loc>` trailing-slash construction.
- [Source: web/src/layouts/MirrorLayout.astro#L66] — self-canonical from `Astro.url.pathname` + `Astro.site`.
- [Source: web/test/build-output.test.ts] — existing real-build assertions (directory-index; slashless link patterns; trailing-slash sitemap; normalized canonical).
- [Source: deploy/nginx/joshuabrandt.conf] — `try_files $uri $uri/ /index.html =404` (directory format served with no change).
- [Source: Astro v6 configuration reference — `build.format`, `trailingSlash` (docs.astro.build), verified 2026-06-06].

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Debug Log References
None — clean implementation.

### Completion Notes List
- Task 1: `web/astro.config.mjs` — added `trailingSlash: 'always'` + explicit `build.format: 'directory'` with Rule 2 citation comment.
- Task 2: `web/src/lib/routes.ts` — added `routeHref(path)` helper (the single place trailing-slash href form is produced). Updated `Footer.astro`, `browse.astro`, and `sitemap.xml.ts` to use the helper.
- Task 3: Normalized all hardcoded route hrefs to trailing-slash: `HeroStatic.astro` (`/speaking/`, `/faq/`), `SceneRail.astro` (desktop + mobile `/speaking/`), `index.astro` scene teasers (`/timeline/`, `/speaking/`, `/work/loandemo/`, `/glass-box/`, `/invite/`).
- Task 4: `jsonld.ts` / `person.ts` — no changes needed; `person.ts` already uses `SITE_ORIGIN + '/'` for `url`, and all page-level JSON-LD `url` fields already used trailing-slash form.
- Task 5: Created `web/test/url-form.test.ts` — new AC5 form-equality build-output test. Asserts for every Mirror route that routeHref() === link form === canonical form === sitemap loc form, exact-string.
- Task 6: Updated existing assertions — `build-output.test.ts` (ALL_MIRROR_ROUTES, fork hrefs, rail jump, teaser hrefs, canonical assertion tightened to exact trailing-slash, HOME_FORWARD_REFS refactored to object array), `Footer.component.test.ts` (ALL_MIRROR_ROUTES + CASES → object array), `HeroStatic.component.test.ts` (fork hrefs), `SceneRail.component.test.ts` (jump hrefs), all five e2e specs (href assertions + navigation URLs updated to trailing-slash form; `axe.spec.ts` ROUTES, `home.spec.ts`/`js-off.spec.ts` goto('/about') → '/about/', `view-source.spec.ts` requests).
- Task 7: `pnpm test` → 11 files, 268 tests, all green. `pnpm test:e2e` → 37 tests, all green. Build is byte-stable (two consecutive builds produce identical HTML hashes). NFR-1 (0-JS) and NFR-6 (deterministic build) unchanged.
- AC6 integration note: `astro preview` with `trailingSlash: 'always'` returns 404 for slashless routes (not a redirect), so all e2e `page.goto` and `request.get` calls for non-root routes were updated to the trailing-slash form. In production, nginx's `try_files $uri $uri/ /index.html` serves `/about/` (directory-index) directly for links that now point to `/about/` — eliminating the 301 hop entirely.

### File List
- web/astro.config.mjs
- web/src/lib/routes.ts
- web/src/components/common/Footer.astro
- web/src/pages/browse.astro
- web/src/pages/sitemap.xml.ts
- web/src/components/hero/HeroStatic.astro
- web/src/components/scene/SceneRail.astro
- web/src/pages/index.astro
- web/test/url-form.test.ts (new)
- web/test/build-output.test.ts
- web/test/Footer.component.test.ts
- web/test/HeroStatic.component.test.ts
- web/test/SceneRail.component.test.ts
- web/e2e/home.spec.ts
- web/e2e/js-off.spec.ts
- web/e2e/view-source.spec.ts
- web/e2e/axe.spec.ts

### Review Findings

**Code review — 2026-06-06 (epic-cycle code-review stage; model: claude-opus-4-8[1m]).** Adversarial review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) of the uncommitted Story 2.0 diff. Result: **✅ Clean review — APPROVED, status → done.** 0 decision-needed, 0 patch, 0 defer, 1 dismissed-as-noise. Every AC verified against the real build + served runtime, with mutation-testing to prove the new tests are non-vacuous.

**Verification evidence (re-run by the reviewer, not taken on faith):**
- **`pnpm --filter web test` → 11 files, 268 tests, all green** (reviewer-run; matches dev's count).
- **`pnpm test:e2e` → 59 tests, all green** (reviewer-run; the full multi-project run — desktop + axe-desktop + axe-mobile + js-off + reduced-motion. The dev's "37" was an undercount; actual coverage is higher, not lower.)
- **AC5 non-vacuity (mutation test):** temporarily mutated `routeHref()` to emit the slashless form → `web/test/url-form.test.ts` went **19/23 RED** (the explicit `/$/` href assertion + the canonical-arm and three-way-equality assertions all failed; the canonical is anchored to the real Astro build, independent of `routeHref`, so it cannot move with the mutation). Reverted; suite green. The AC5 lock genuinely catches a slashless regression.
- **AC6 / skill-rules Rule 3 non-vacuity (mutation test):** under the same slashless mutation, `web/e2e/url-form.spec.ts` went **21/22 RED** — the served-HTML "every internal route link is trailing-slash" arm (reads anchors off the live preview response, registry-independent) and the `GET /x` "single 200, no redirect hop" arm (maxRedirects:0; slashless → 404 under `trailingSlash:'always'`) both failed. Real-runtime test evidence on a user-facing surface is present and rigorous. **Rule 3 satisfied.**
- **AC2 exhaustiveness (adversarial grep of all `web/src`):** every internal route link is now trailing-slash (Footer + `/browse` via `routeHref()`; `HeroStatic`/`SceneRail`/`index.astro` teasers hardcoded). Exclusions correctly untouched: `/favicon.svg` (asset), `#thesis`/`#close`/`#hero`/… fragments, the `about.astro` Channels `href:'#'` placeholders (`rel="me"` sameAs, `[OPEN]`-flagged). No `mailto:`, `/api/*`, `http(s)://`, `/sitemap.xml`, or `/robots.txt` literal route-links exist in src to mis-slash. `_styleguide.astro` is underscore-prefixed → not emitted to `dist/` (confirmed absent), and its `href="/"` Button demos are root anyway.
- **AC3 canonical genuinely tightened:** the prior `.replace(/\/$/, '')` slash-normalization was removed; the build-output canonical assertion now demands exact `${SITE_ORIGIN}${route}/`. Verified on the real build incl. the nested route `/speaking/reel/` → `…/speaking/reel/` (single slashes).
- **AC4 no-double-slash:** real `dist/sitemap.xml` inspected — all 10 `<loc>` clean trailing-slash, root `/`, nested `/speaking/reel/` + `/work/loandemo/` correct; the double-slash guard test passes.
- **NFR-6 byte-stable build:** two clean `pnpm --filter web build` runs are byte-identical (`diff -rq` clean). (An initial "differ" reading was a reviewer-harness artifact from a wrong hand-rolled astro-bin path — the pnpm-driven build is deterministic.)
- **NFR-1 0-JS:** the link-form change adds zero executable JS — Mirror pages carry only `application/ld+json` data; home retains only its single pre-existing env-gated scene-rail enhancement.
- **Rule 8 discoverability:** `url-form.test.ts` is under `test/**` (matched by `vitest.config` include) and runs in the default suite; `url-form.spec.ts` matches the `desktop` Playwright project only (no double-run). Both confirmed.
- **Rule 1 (Integration ACs):** N/A — cleanup/refactor, introduces no service; the story's "Integration ACs" section correctly declares this, and AC5+AC6 ARE the integration verification. Not flagged.
- **Rule 5 (NFR tripwire):** N/A — no NFR was found unmeasurable; NFR-1/NFR-6 both measured and pass.
- **Rule 6 (ADR):** N/A — no `docs/adr/` registry exists.

**Findings:**
- [x] [Review][Dismiss] `js-off.spec.ts` `toHaveURL(/\/browse\/?$/)` uses an optional trailing slash — dismissed as noise. This is a post-navigation *landing* assertion whose click target is explicitly `a[href="/browse/"]` (asserted count===1 immediately above); the rigorous no-301/form-equality lock lives in the dedicated `url-form.spec.ts` (mutation-proven). The `\/?` tolerance is pre-existing and does not weaken any AC.
- [x] [Review][Dismiss] Dev File List omits two genuinely-changed files (`web/playwright.config.ts` — added `url-form` to the `desktop` testMatch; `web/e2e/url-form.spec.ts` — the new AC6 spec) — doc-accuracy nit only, no code impact. Recorded here for completeness; the actual diff and this review's Files-Modified list are authoritative.

**No HIGH or MED findings. No patches required. Nothing added to `deferred-work.md`** (no defer-class findings; the originating `[1.7]` item was the work this story completed). Status set to **done**.

---

## Appendix — Epic 1 deferred-work triage (created by the /epic-cycle retro-review gate)

Triage of Epic 1's retrospective action items + every `deferred-work.md` entry, performed at Epic 2 start (2026-06-06). Decision key: **INCLUDE** = built in this Story 2.0; **DEFER** = remains tracked in `deferred-work.md` for a named later epic/trigger; **DROP** = no action needed (already resolved by a completed Epic-1 story, or nothing to fix).

| Item | Source | Triage Decision |
|---|---|---|
| Trailing-slash internal-link ↔ canonical ↔ sitemap mismatch (retro A5 ≡ deferred [1.7]) | epic-1-retro A5 + deferred-work (1.7 lead smoke) | **INCLUDE in Story 2.0** — this story. Normalize to trailing-slash per Rule 2 + add the form-equality build-output test. |
| Codify Rules 2–4 + pin per-stage models (A1–A4) | epic-1-retro action items | **DROP** — already ✅ done in the retro commit; verified present in `.claude/rules/project-rules.md` (Rules 2–4) and the skill frontmatter (dev→sonnet, qa/cr→opus). |
| [1.1 · LOW] SSE `CitationEvent` shape diverges from architecture | deferred-work (1.1 CR) | **DEFER → Epic 4** — the `/api/guide` SSE wire shape is owned by Story 4.3/4.4; fixing now would be speculative. |
| [1.1 · LOW] `API_PORT` coerced with no validation/fail-fast | deferred-work (1.1 CR) | **DEFER → Epic 3** — lands with the planned typed `api/src/env.ts` (first env-consuming story, ~3.3). Epic 2 is web/content-only; no trigger here. |
| [1.1 · LOW] `API_PORT` default `8787` duplicated as a literal | deferred-work (1.1 CR) | **DEFER → Epic 3** — centralize in `api/src/env.ts` when it lands (same trigger as above). |
| [1.2 · LOW] Unreferenced React `_astro/client.*.js` chunk (~193KB) in dist | deferred-work (1.2 CR) | **DEFER → Epic 3/4** — belongs with the first story that actually ships a React island (Invite form / Guide panel). Confirmed Epic 2 ships **no** React island (every 2.x surface is Static Mirror, JS-off-degradable), so no trigger in Epic 2. |
| [1.2 · LOW] Empty `<footer>` stray hairline band on slot-less pages | deferred-work (1.2 CR) | **DROP** — RESOLVED by Story 1.7 (the global footer is filled on every Mirror page; verified no empty `<footer>…</footer>` in `web/dist/about/index.html`). |
| [1.3 · LOW] Fork CTA curly apostrophe (`I&rsquo;m`) vs spine's straight ASCII | deferred-work (1.3 CR) | **DEFER** — owner house-style decision, non-blocking. The rendered curly glyph is typographically correct and matches the visual mock; no word/meaning change. Revisit if/when a site-wide copy-style convention is set. |
| [1.4 · LOW] `#close` bottom-of-page `aria-current` nuance | deferred-work (1.4 CR) | **DEFER → Epic 5** — belongs with the cinematic scroll/observer rework where the active-band heuristic is revisited. Enhancement-quality, not an AC/floor issue. |
| [1.4 · LOW] Current-tick halo literal `rgba(30,58,95,0.2)` vs token | deferred-work (1.4 CR) | **DEFER** — tokens-layer change; no trigger until the accent gains channel/alpha tokens or a `color-mix()` convention is adopted. Spec-faithful today. |
| [1.5 · LOW] Dev-note "byte-identical" wording imprecise | deferred-work (1.5 CR) | **DROP** — no action required; output is correct (same DOM + same CSS rule set), only the completion-note wording was loose. Nothing to fix. |
| [1.8 · LOW] Root `pnpm build` no longer emits `api/dist` | deferred-work (1.8 CR) | **DROP** — RESOLVED by Story 1.10: `scripts/deploy.sh` Step 3/6 runs `pnpm --filter api build` before starting the unit (verified). |
| [1.9 · LOW] `#close` nuance not picked up by Story 1.9 | deferred-work (1.9 CR) | **DEFER → Epic 5** — same scroll/observer rework as the [1.4] `#close` nuance; 1.9 scoped only the reduced-motion gate, not the observer. |
| [1.10 · LOW] `deploy.sh` no clean-working-tree precheck before `git pull --ff-only` | deferred-work (1.10 CR) | **DEFER** — optional operator-ergonomics polish, low priority, no epic assignment. Safe today (`set -euo pipefail` + `--ff-only` already fail fast on a dirty/diverged tree). |

**Triage totals (deferred-work.md, 13 entries): included = 1 · deferred = 9 · dropped = 3.** Retro action items A1–A4 were already completed in the retrospective commit (DROP/no-op); A5 ≡ the single INCLUDE above. The DEFER and remaining-open items stay tracked in `deferred-work.md` for their named epics/triggers.
