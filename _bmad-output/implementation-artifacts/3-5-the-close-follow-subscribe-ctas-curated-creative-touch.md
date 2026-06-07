# Story 3.5: The Close — follow/subscribe CTAs & curated creative touch

---
baseline_commit: f0e9a66282d358ed01cbfc5f33ddb3232ea96d18
---

Status: done

<!-- Created by the /epic-cycle lead create-story gate (Epic 3), 2026-06-07. Source: epics.md Epic 3 Story 3.5.
     FINAL Epic-3 story. Fills the Epic-1 home #close scene shell: embeds the Story-3.4 InviteForm island,
     adds follow/subscribe CTAs + the FR-36 conversion events (channel-clicked / invite-submitted), and a single
     curated Stage-1 creative touch. Makes home `/` an island route (NFR-1 carve-out). Closes the SM-1 path. -->

## Story

As a content wanderer (UJ-3, Sam) or an organizer finishing the arc,
I want clear ways to invite, follow, or enjoy more of Joshua R. Brandt, MSE's work at the Close,
so that attention converts into an invite or a follow — without a sales pitch (FR-32, FR-23).

## Context & decisions (read first)

This FINAL Epic-3 story fills the home `#close` scene (Story-1.4 shell: a Kicker + an `<h2>` + a summary + a single `/invite/` link). It ties off the SM-1 conversion path on the home arc: the embedded Invite-Me form (from Story 3.4), follow/subscribe CTAs, and a single curated creative touch for the wanderer's payoff. It wires the FR-36 conversion events (the `web/src/lib/analytics.ts` helper from Story 1.10). The static-build invariants hold (NFR-6 deterministic, AA, no-fabrication), with ONE NFR-1 evolution: **home `/` gains the React island** (the embedded form), in addition to its existing scene-rail script.

### Decision 1 — embed the Story-3.4 `InviteForm` island in the Close (`client:visible`)

Embed `<InviteForm client:visible />` (the Story-3.4 island) into the `#close` scene of `web/src/pages/index.astro`. `client:visible` defers its hydration until the Close scrolls into view, so the cold-landing FCP (NFR-1) is unaffected. The form posts to `/api/invite` exactly as on `/invite` (JS-on island fetch → inline aria-live confirmation; JS-off native POST → 303 `/invite/thanks/`). Keep the existing `#close` heading/summary; replace the lone `/invite/` link with the embedded form + the follow/subscribe actions (the "invite-me / follow-the-work / join-the-audience" trio). Update the index.astro header comment ("No React island here") — that is no longer true.

### Decision 2 — wire the FR-36 conversion events (resolves the Story-3.4 forward-ref)

`web/src/lib/analytics.ts` (Story 1.10) is the typed seam; events fire two ways (both env-gated — no-op without Umami, Rule 4):
- **`channel-clicked`** — the follow/subscribe CTAs are real `<a>` links carrying `data-umami-event="channel-clicked"` (+ a non-PII `data-umami-event-channel="<youtube|github|suno|…>"` prop). This is the **0-JS** form (Umami's own script handles the click; NO app JS) — the CTAs themselves stay 0-JS.
- **`invite-submitted`** — the `InviteForm` island calls `track('invite-submitted', { … non-PII … })` on a successful submission (the JSON receipt path). Story 3.4 explicitly DEFERRED this wiring to 3.5 — add it now in `web/src/islands/InviteForm.tsx`'s success handler. NO PII (no name/email/message — only e.g. `{ source: 'close' | 'invite-page' }` if useful; primitive values only, NFR-7). It fires from the island wherever embedded (home Close + `/invite`).

### Decision 3 — follow/subscribe CTAs link to Josh's channels (`[OPEN]` handles, no fabrication)

The follow/subscribe CTAs link to Josh's channels — YouTube / GitHub / Suno (and any others). Use the existing `CHANNEL_SAMEAS` from `web/src/lib/person.ts` (the `[OPEN]` channel roots already used for the Person `sameAs`) so the home CTAs and the `/about` `sameAs` agree on the SAME `[OPEN]` URLs (single source; consistency). Each handle is `[OPEN]` until Josh confirms — flag the placeholder in visible text (e.g. "Subscribe on YouTube `[OPEN: handle]`"); do NOT invent a real handle/URL. The CTAs are real `<a>` (followable JS-off) with `rel="me noopener"` where appropriate.

### Decision 4 — ONE curated Stage-1 creative touch (FR-23 / Guardrail §9.1: NO live runtime reads)

The wanderer's payoff: a SINGLE curated Stage-1 creative touch — one featured Suno track OR one YouTube video (UJ-3). **It is curated into the repo (a hardcoded, `[OPEN]`-flagged URL/asset); the site performs NO live runtime reads of YouTube/Suno/GitHub** (FR-23 / Guardrail §9.1 — no API calls to fetch a video list/metadata at build or runtime). Render it as a **static poster** (a CSS/`[OPEN]`-image thumbnail) wrapping a **curated `<a>` link** to the `[OPEN]` curated video/track URL that **works JS-off** (clicking goes to the curated piece). The heavy embed (if any) **lazy-loads behind the static poster on click** (no autoplay; the embed URL is the curated one; no live API read) — but the JS-off baseline is the static poster + the real curated link. This is the lightweight Stage-1 stand-in, NOT the Stage-2 Creative Lab.

### Decision 5 — NFR-1: home `/` becomes an island route; CTAs + creative touch stay 0-JS

Home `/` now ships TWO sanctioned executable surfaces: its existing gated scene-rail script AND the React island (the embedded `InviteForm`, `client:visible`-deferred). Everything else 3.5 adds is **0-JS**: the follow/subscribe CTAs (`data-umami-event`, no app JS), the creative-touch static poster + curated link (real `<a>`). **Update `web/test/build-output.test.ts`** to carve out home for the React island (alongside its scene-rail script) and assert the CTAs + creative touch add no app JS; every NON-island route stays unchanged (no new React-runtime references beyond `/` and `/invite/`). Keep the home Lighthouse budget green (`client:visible` defers the island JS; the creative touch is a light static poster, not an eager embed).

## Acceptance Criteria

1. **The Close presents invite / follow / join actions, embeds the form, and fires the conversion events.**
   **Given** the home Close scene (the Epic-1 shell)
   **When** it renders
   **Then** it presents invite-me / follow-the-work / join-the-audience actions, **embeds the Invite-Me form from Story 3.4** (`<InviteForm client:visible />`, posting to `/api/invite`), and the follow/subscribe CTAs link to Josh's channels (handles `[OPEN]`, sourced from `CHANNEL_SAMEAS`, placeholder labeled in visible text)
   **And** the CTAs fire `channel-clicked` (0-JS `data-umami-event` on the real `<a>`) and the embedded form fires `invite-submitted` on success (the island `track()` call) — both via the Story-1.10 FR-36 helper, env-gated (no-op without Umami).

2. **A single curated Stage-1 creative touch, lazy behind a static poster, JS-off-followable, no live reads.**
   **Given** the wanderer's payoff
   **When** the Close renders
   **Then** a single curated Stage-1 creative touch (one featured Suno track or YouTube video) is present, rendered as a static poster with a curated `<a>` link that works JS-off (any heavy embed lazy-loads behind the poster on interaction; no autoplay)
   **And** all such links/embeds are curated into the repo (the URL/asset is hardcoded + `[OPEN]`-flagged) — the site performs NO live runtime reads of YouTube/Suno/GitHub (FR-23, Guardrail §9.1).

3. **NFR-1 — home is now an island route; the CTAs + creative touch add 0 app JS.**
   **Given** the built home `/`
   **When** the build-output NFR-1 assertions run
   **Then** home ships its existing gated scene-rail script PLUS the React island (the embedded `InviteForm`; `client:visible`-deferred) — and NOTHING else executable: the follow/subscribe CTAs use `data-umami-event` (no app JS) and the creative touch is a static poster + a real curated `<a>` (no app JS). The build-output test is updated to carve out home for the island; every non-island route is unchanged (no new React-runtime references beyond `/` and `/invite/`).

4. **Conversion analytics are env-gated (Rule 4, NFR-7).**
   **Given** the analytics wiring
   **When** the build runs with Umami UNSET (default/CI/test)
   **Then** the `channel-clicked` `data-umami-event` attributes are present in the HTML but inert (no Umami script, no network), and the island's `track('invite-submitted')` is a silent no-op — no analytics is required for the page to work (NFR-5); events carry NO PII (no name/email/message).

5. **Quality floor — the literal canonical gate is green (Rule 5, NFR-2, NFR-6).**
   **Given** the literal `pnpm test:all` (= `typecheck && lint && format:check && test && test:e2e && lh`)
   **When** it runs end-to-end after the change
   **Then** every step is green: axe finds 0 WCAG 2.1 AA violations on home `/` (the embedded form's labels/validation/focus, the CTAs as real links, the creative-touch poster has an accessible name + the link is keyboard-operable with visible `:focus-visible`), the build is byte-deterministic (NFR-6; no `new Date()`/wall-clock; curated URLs are fixed constants), the home Lighthouse budget holds (`client:visible` island + light static poster), and copy is positive-assertion, no hype, **no exclamation marks**; internal links trailing-slash (Rule 2).

## Integration ACs

This story consumes the Story-3.4 `InviteForm` island (embeds it on the home Close) and the Story-1.10 `analytics.ts` FR-36 helper — it introduces no NEW service (skill-rules Rule 1 N/A). AC1 + AC3 ARE the integration verification: the embedded form on the real built home `/` posts to `/api/invite` (the same verified path — JS-on inline confirmation / JS-off native POST → `/invite/thanks/`) and the conversion events are wired (`channel-clicked` data-attrs present; `invite-submitted` fired from the island), verified against the real build/served runtime. This CLOSES the Story-3.4 forward-reference (the Close embed + the `invite-submitted` event) and completes the SM-1 conversion path end to end. Forward-reference (not a defect): the real channel handles + the curated creative-touch URL/asset land when Josh confirms them (tracked `[OPEN]`); the speaker-reel `speaker-reel-played` event + the Guide events are Epic-3.1/Epic-4 surfaces, not this story.

## Tasks / Subtasks

- [x] **Task 1 — Fill the home `#close` scene (AC1, Decision 1/3).**
  - [x] In `web/src/pages/index.astro` `#close`: keep the heading + summary; add the invite / follow / join trio; embed `<InviteForm client:visible />`; add the follow/subscribe CTAs (real `<a>` to `CHANNEL_SAMEAS` `[OPEN]` channels, labels naming the channel + `[OPEN]` handle, `data-umami-event="channel-clicked"` + `data-umami-event-channel=…`). Update the file header comment (no longer "No React island here").
- [x] **Task 2 — Wire `invite-submitted` into the island (AC1, AC4, Decision 2).**
  - [x] In `web/src/islands/InviteForm.tsx`, on a successful submit, call `track('invite-submitted', { … non-PII … })` from `web/src/lib/analytics.ts`. No PII. Verify it's a no-op without Umami (SSR-safe; guarded). It fires wherever the island is embedded (home + `/invite`).
- [x] **Task 3 — The curated creative touch (AC2, Decision 4).**
  - [x] Add a single curated creative-touch block to the Close: a static poster (CSS or `[OPEN]` image) wrapping a curated `<a href="[OPEN: curated Suno/YouTube URL]">` that works JS-off; accessible name; visible `:focus-visible`. NO live runtime read of YouTube/Suno (hardcoded curated URL). If a lazy click-to-load embed is added, it loads only on interaction (no autoplay) behind the poster; the JS-off baseline is the poster + the curated link.
- [x] **Task 4 — NFR-1 build-output carve-out for home (AC3, Decision 5).**
  - [x] Update `web/test/build-output.test.ts`: home `/` now ships the scene-rail script AND the React island (assert both; the island chunk referenced) — and the CTAs (`data-umami-event`) + creative touch add NO app JS; non-island routes unchanged (no new React references beyond `/` and `/invite/`). Mirror the `/invite` island carve-out style.
- [x] **Task 5 — Tests (AC1–AC5; Rule 3 + Rule 8).**
  - [x] Component/build-output: the Close renders the embedded form (SSR `<form action="/api/invite">` present), the follow/subscribe CTAs with `data-umami-event="channel-clicked"` + `[OPEN]` handle text, the creative-touch static poster + curated `<a>` (JS-off-followable); the `[OPEN]` flags are visible text; home island carve-out (Task 4).
  - [x] e2e (Playwright): on the served home `/`, the Close form submits (reuse the 3.4 harness for the api path) → inline aria-live confirmation (JS-on) and the native-POST → `/invite/thanks/` (JS-off) both work from the home embed; `channel-clicked` data-attrs present on the CTAs; the creative-touch link is followable JS-off; axe AA 0 on `/`. Mutation-verify the analytics wiring + the carve-out. Rule 8 discoverable (reuse the relevant Playwright project).
- [x] **Task 6 — Verify the floor with the LITERAL canonical gate (AC5).**
  - [x] Run the literal `pnpm test:all` end-to-end (Rule 5). All green incl. `test:e2e` + `lh`. Confirm home ships scene-rail + island only (CTAs/creative-touch 0-JS); non-island routes unchanged; two clean builds byte-identical; axe AA 0 on `/`; no exclamation marks. Note files touched in the Dev Agent Record. Do NOT commit `api/.env`.

## Dev Notes

### Current state (files being modified — read before editing)

- **`web/src/pages/index.astro`** `#close` scene: a `Kicker` ("The close") + `<h2 id="close-title">If the work fits what you are building</h2>` + a `.scene__summary` + a single `.scene__link` to `/invite/`. The file header comment says "No React island here" — update it. Home already ships the gated scene-rail script (the one sanctioned exception today). Adding the island makes home the 2nd island route.
- **`web/src/islands/InviteForm.tsx`** (Story 3.4): the React island; add the `track('invite-submitted')` call on success (Decision 2). It already posts to `/api/invite`, has the full a11y state machine, and the `noValidate={hydrated}` JS-off gate (Story-3.4 CR fix) — don't disturb those.
- **`web/src/lib/analytics.ts`** (Story 1.10): `track(event, data?)` (SSR-safe, env-gated no-op without Umami) + `ANALYTICS_EVENTS` (includes `invite-submitted`, `channel-clicked`). Use `track('invite-submitted', …)` from the island; use `data-umami-event="channel-clicked"` attrs on the CTAs (the 0-JS form). Both env-gated (Rule 4).
- **`web/src/lib/person.ts`** (`CHANNEL_SAMEAS`): the `[OPEN]` channel roots (YouTube/GitHub/Suno) used for the Person `sameAs` on `/about` — reuse them for the home CTAs so both agree (Decision 3).
- **`web/test/build-output.test.ts`**: per-route executable-script assertions (home = scene-rail script; `/speaking` = copy script; `/invite/` = React island; others 0). Add the home React-island carve-out (Task 4).
- **`web/playwright.config.ts` + `web/e2e/serve-with-api.mjs`** (Story 3.4): the prod-faithful e2e harness (astro preview + reverse-proxy `/api` → Hono) — reuse it for the home Close form e2e (the api path).
- **DESIGN/EXPERIENCE:** the Close / creative touch / follow CTAs — EXPERIENCE §UJ-3 (lines 233–242: the wanderer reaches the Close, a curated creative touch, taps a follow/subscribe CTA, channel handles `[OPEN]`; the heavy embed lazy-loads behind a static poster, the curated link works JS-off), §State-Patterns (the Invite-Me form states, line 151/166 — already built in 3.4). The DESIGN spine wins on conflict.

### Constraints / invariants to preserve

- **NFR-1:** home gains ONLY the React island (beyond its scene-rail script); CTAs + creative touch are 0-JS; no other route changes its JS profile. `client:visible` defers the island (FCP/Lighthouse).
- **FR-23 / Guardrail §9.1:** NO live runtime reads of YouTube/Suno/GitHub — the creative-touch URL/asset is curated/hardcoded in the repo; the JS-off baseline is a static poster + a real curated `<a>`.
- **Rule 4 (env-gate analytics):** `channel-clicked` (data-attr) + `invite-submitted` (track()) are no-ops without Umami; test the unset branch (no script/network). NO PII in events (NFR-7).
- **NFR-2 / AA:** the embedded form keeps its 3.4 a11y; the CTAs are real keyboard-operable links; the creative-touch poster has an accessible name + visible `:focus-visible`. axe 0 on `/`.
- **NFR-6:** byte-deterministic (curated URLs are fixed constants; no `new Date()`).
- **Voice ([[copy-positive-assertion-no-hype]]):** positive-assertion, no hype, **NO exclamation marks** (the 3.3 smoke caught one — keep all Close/creative-touch/CTA copy exclamation-free). `[OPEN]` the channel handles + the curated creative-touch URL; no fabrication.
- **Rule 2** trailing-slash. **Rule 5** verify with the literal `pnpm test:all`. **NFR-5** no secret to the client.

### Previous-story intelligence (Stories 3.0–3.4)

- Story 3.4 built the `InviteForm` island + the content-negotiating endpoint + the `serve-with-api.mjs` e2e harness, and DEFERRED the `invite-submitted` event + the home Close embed to THIS story — do both here.
- Story 3.2 set the `data-umami-event` 0-JS analytics pattern is NOT yet used on a home CTA — the `/about` channel links use it (`channel-clicked`); mirror that exact 0-JS form for the home follow CTAs.
- NFR-1 carve-out pattern: 3.2 (`/speaking` copy script) + 3.4 (`/invite` island) set the build-output carve-out style — mirror it for home's island.
- The canonical gate is the literal `pnpm test:all` ending with `lh`; run it whole; new `.astro`/`.tsx` edits must be prettier/eslint/typecheck-clean (run `prettier --write` first — every prior story hit a first-run miss). NO exclamation marks (3.3 lesson).

### Project Structure Notes

- Modified: `web/src/pages/index.astro` (the Close), `web/src/islands/InviteForm.tsx` (the `invite-submitted` event), `web/test/build-output.test.ts` (home carve-out). Possibly a small `web/src/components/` creative-touch component + a `web/e2e/` spec. New: an `[OPEN]` poster asset if used. No `api/` or `shared/` changes (the endpoint is reused as-is).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5] — the AC source.
- [Source: …/EXPERIENCE.md#UJ-3 (L233-242), #L151,#L166 (Invite-Me form states)] — the wanderer journey, the creative touch (curated, lazy behind a static poster, JS-off link), follow/subscribe CTAs (`[OPEN]` handles).
- [Source: web/src/lib/analytics.ts] — the FR-36 `track()` seam + `ANALYTICS_EVENTS` (`invite-submitted`, `channel-clicked`) + the two firing modes (data-attr 0-JS / island track()).
- [Source: web/src/islands/InviteForm.tsx] — the Story-3.4 island to embed + wire `invite-submitted` into.
- [Source: web/src/lib/person.ts] — `CHANNEL_SAMEAS` `[OPEN]` channels (reuse for the CTAs).
- [Source: web/src/pages/index.astro] — the `#close` scene shell to fill.
- [Source: web/test/build-output.test.ts] — the per-route script assertions to extend for the home island.
- [Source: web/playwright.config.ts, web/e2e/serve-with-api.mjs] — the prod-faithful e2e harness (reuse for the home Close form).
- [Source: .claude/rules/project-rules.md#2,#4,#5] — trailing-slash; env-gate analytics (test unset branch); canonical full-gate verification.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6 (via Abacus.AI)

### Debug Log References
1. First e2e run: home "no exclamation marks" test failed because `<!--astro:end-->` island marker comment contained `!`. Fix: strip HTML comments in the test (matching the pattern already used in the /invite and Mirror-route tests).
2. Close form JS-on submit test: failed with timeout because `client:visible` hydration for a bottom-of-page island needs explicit hydration detection. Fix: `waitForFunction` polling `form.noValidate === true` (the hydration signal set by the `hydrated` useEffect) instead of mere `waitForSelector`.

### Completion Notes List
- **Task 1 done**: `web/src/pages/index.astro` `#close` scene filled with: `<InviteForm client:visible />` embed under an `<h3>` "Send an inquiry"; 3 follow/subscribe CTAs sourced from `CHANNEL_SAMEAS` with `data-umami-event="channel-clicked"` + `data-umami-event-channel={channel}` (0-JS form); static CSS poster creative touch with `[OPEN: curated-track-id]` Suno link + `aria-label` accessible name; file header comment updated to remove "No React island here"; CHANNEL_CTAS array (constant) derived from CHANNEL_SAMEAS at build time.
- **Task 2 done**: `InviteForm.tsx` imports `track` from `../lib/analytics` and calls `track('invite-submitted', { source: 'close' | 'invite-page' })` on the successful JSON response path. SSR-safe (returns immediately on server); no-op without Umami (Rule 4); no PII (primitive `source` only).
- **Task 3 done**: Static CSS gradient poster (`close__creative-poster`) wrapping a `<a class="close__creative-link" href="https://suno.com/song/[OPEN: curated-track-id]" aria-label="…" rel="noopener" target="_blank">`. No autoplay, no iframe, no video, no live API reads (FR-23/Guardrail §9.1). Visible `:focus-visible` ring (NFR-2/AA). `[OPEN]` placeholder flagged in visible text.
- **Task 4 done**: `build-output.test.ts` updated: (a) the "exactly ONE executable script" home test replaced with ">= 2 scripts (scene-rail + React island)" assertion; (b) the "no React chunk" home test replaced with "references React chunk" (legitimately); (c) Story 3.4 NFR-1 isolation test updated to exclude home from NON_ISLAND_MIRROR_ROUTES; (d) Story 1.10 Umami gate count assertion updated to `>= 2`; (e) exclamation-mark home test updated to also strip HTML comments (island markers); (f) dedicated Story 3.5 build-output describe suite added (10 tests: island present, SSR form, CTAs, creative touch, no-autoplay, [OPEN] flags, no exclamation, h3 hierarchy, >= 2 scripts).
- **Task 5 done**: `web/e2e/home.spec.ts` extended with 4 new `test.describe` groups: InviteForm island (SSR form present, JS-on submit → success, JS-off native POST → /invite/thanks/), follow CTAs (data-umami-event presence, keyboard operability, [OPEN] flags), creative touch (link present, no-autoplay/iframe/video, focus ring), axe AA 0 on /. All under the existing `desktop` Playwright project (Rule 8 discoverable).
- **Task 6 done**: Canonical gate `pnpm test:all` = typecheck (0 errors) + lint (clean) + format:check (clean) + test (628 web + 107 scripts + 68 api) + test:e2e (210 passed) + lh (passed). Two consecutive builds byte-identical (NFR-6). Axe AA 0 on / with embedded Close island. No exclamation marks in copy. Did NOT commit `api/.env`.

### File List
- web/src/pages/index.astro
- web/src/islands/InviteForm.tsx
- web/test/build-output.test.ts
- web/e2e/home.spec.ts

### Change Log
- 2026-06-07: Story 3.5 implemented — home #close filled: InviteForm island embedded (client:visible), follow/subscribe CTAs sourced from CHANNEL_SAMEAS with 0-JS data-umami-event analytics, curated Stage-1 creative touch (static CSS poster + [OPEN] Suno link). invite-submitted event wired into InviteForm.tsx on success. Build-output test carve-out for home island. New e2e tests for Close scene (17 tests). Canonical gate all green: 628 unit + 210 e2e + lh. (claude-sonnet-4-6)

### Review Findings

**Code-review stage (claude-opus-4-8, 2026-06-07). Verdict: APPROVE.** Adversarial review (Blind / Edge-Case / Acceptance layers) + every AC verified against the real `astro build` output and the served e2e runtime. The literal canonical gate `pnpm test:all` was re-run end-to-end by the reviewer and is GREEN. No HIGH, no MED. ADR registry (`docs/adr/`) does not exist — Rule 6 N/A. Rule 3 (real-runtime, user-facing) SATISFIED. Rule 4 closing-summary present (dev + QA). Rule 5 canonical-gate verification done (root `pnpm test:all`, not a scoped subset). Rule 8 e2e discoverable (`desktop` project). `api/.env` confirmed NOT tracked + gitignored (NFR-5).

**Canonical gate re-run by the reviewer (each stage, exit 0):**
- `typecheck` → web 0 errors / 0 warnings / 0 hints.
- `lint` → 0.
- `format:check` → ROOT `prettier --check .` "All matched files use Prettier code style!" (covers `.astro` via prettier-plugin-astro — Rule 5).
- `test` (vitest) → scripts 107 + api 68 + **web 630** = all passed.
- `test:e2e` (Playwright, all projects) → **213 passed** (1.4m). The home Close JS-off native POST ran against the REAL Hono API + Postgres (`[invite] inquiry persisted, mailStatus=skipped`), row cleaned up. axe AA on `/` with the island present = 0 violations.
- `lh` → 0 failed assertions; the 4 hard budgets (`script:size ≤ 256KB`, `total-byte-weight ≤ 400KB`, `FCP ≤ 2500ms`, `performance ≥ 0.9`) hold on `/` (with the `client:visible` island + CSS poster) and `/about/` (AC5 home Lighthouse budget confirmed).

**AC verification against the real built `dist/index.html` Close (`#close`):**
- **AC1** — SSR `<form action="/api/invite" method="POST">` present on home (JS-off baseline); 3 `channel-clicked` CTAs (youtube/github/suno), each a real `<a href>` carrying `data-umami-event="channel-clicked"` + `data-umami-event-channel="<ch>"` (0-JS form); `invite-submitted` fires from the island on success with `source: 'close'` and NO PII. ✓
- **AC2 / FR-23 / Guardrail §9.1** — single curated creative touch = CSS-gradient static poster wrapping a curated `<a href="https://suno.com/song/[OPEN: curated-track-id]">` (followable JS-off, aria-label accessible name). NO `<iframe>`, NO `<video>`, NO `autoplay`, ZERO provider sub-resources (`script|iframe|img|source[src]` to youtube/suno/github) at build; e2e confirms ZERO live provider network requests on load/reveal. The curated `<a>` is a link TARGET, not an embedded read. ✓
- **AC3 (NFR-1 carve-out)** — home ships exactly its scene-rail script + the React island (≥2 executable scripts, renderer-url + `client.*.js` referenced); CTAs + creative touch add 0 app JS; every non-island route (about/speaking/speaking/reel/glass-box/timeline/work/loandemo/faq/browse/invite/thanks) references 0 React chunks. ✓
- **AC4 (Rule 4 env-gate, NFR-7)** — gate-closed default build: no Umami script, `data-umami-event` attrs inert; the island `track('invite-submitted')` is a silent no-op without `window.umami` (e2e: success still renders, zero uncaught page errors); payload carries only the `source` primitive, none of name/email/message/org/topic/attribution. ✓
- **AC5** — byte-deterministic (reviewer ran two clean builds: `index.html` sha `ecb0360e…` and concatenated CSS `bc2d5657…` identical both times; curated URL is a fixed constant, no `new Date()`); no exclamation marks in home copy; `<h3>` sub-headings under the `<h2>` scene title, no `<h1>` in close; internal links N/A in close (CTAs/creative are external; the form posts to the `/api/invite` endpoint; the island success links to `/`). ✓
- **Integration ACs** — closes the Story-3.4 forward-ref (the Close embed + `invite-submitted`); SM-1 conversion path complete end-to-end. 3.4 NOT disturbed: `noValidate={hydrated}` JS-off gate + `action`/`method` content-negotiation intact and reused by the embed; the existing /invite e2e + 3.3/3.4 api tests stay green (213 e2e, 68 api). ✓

**Mutation checks (reviewer-run; tests are NOT vacuous, files reverted byte-identical):**
- Broke `data-umami-event="channel-clicked"` in `index.astro` → the AC1 CTA build-output test RED (1 failed). Reverted IDENTICAL.
- Removed `<InviteForm client:visible />` from home → all 5 AC3 carve-out assertions RED (renderer-url, ≥2 scripts, `client.*.js`, island-embedded). Reverted IDENTICAL.
- QA-documented + accepted (test logic independently read as sound): removing the `track('invite-submitted')` call → the firing e2e RED; adding `email` to the payload → the no-PII e2e RED; injecting an `<iframe src=…youtube…>` → the no-provider-sub-resource build test RED.

**Findings triage: 0 HIGH, 0 MED, 2 LOW (deferred), 2 DISMISSED.**
- **LOW-1 (deferred → deferred-work.md):** `invite-submitted` `source` attribution uses `window.location.pathname === '/'` → `'close'` else `'invite-page'`. Correct today (island only embeds on `/` and `/invite/`), but a future THIRD embed surface would silently mis-attribute to `'invite-page'`. Latent maintenance footgun, not a current defect.
- **LOW-2 (deferred → deferred-work.md):** `sprint-status.yaml` lists `3-5-…: ready-for-dev` while the story is `Status: review`; the per-story status was not advanced by the dev/QA stages. Tracking drift only — left for the lead's pipeline to reconcile (code-review does not own the status state machine).
- **DISMISSED:** (a) two `suno.com` hrefs in the Close (the CTA root from `CHANNEL_SAMEAS[2]` + the curated track) — both intentional and `[OPEN]`-flagged; (b) the redundant `typeof window !== 'undefined'` guard in the island success handler — defensive and harmless (the handler is browser-only).

No code changes were required by code-review. `api/.env` not committed. No cycle-log entry written by this stage.
