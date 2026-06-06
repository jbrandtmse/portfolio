---
baseline_commit: e7d0cd06a6d66cefaf1749f1f1ffba37fa2c7459
---

# Story 1.5: Static Mirror layout, route stubs & the canonical /about

Status: done

<!-- Epic 1, Story 1.5. Builds on 1.1–1.4. Creates MirrorLayout + the Stage-1 Mirror route stubs + the full canonical /about. RESOLVES the forward-reference 404s from 1.3 (hero fork → /speaking, /faq) and 1.4 (teasers → /timeline, /work/loandemo, /glass-box, /invite). JSON-LD emission is Story 1.6; /browse + footer is Story 1.7. -->

## Story

As a search engine, answer engine, or JS-off visitor,
I want every key surface to exist as a real, crawlable, answer-first page,
so that Josh's facts are indexable and reachable independent of the agent or JS.

## Acceptance Criteria

1. **Given** any Mirror route **When** it renders **Then** `MirrorLayout.astro` opens with a plain-text answer-first lede whose first sentence names "Joshua R. Brandt, MSE", is self-canonical (`<link rel="canonical">` to itself), has a clean heading hierarchy (one `<h1>`), and includes the footer slot.

2. **Given** the Stage-1 route map **When** the site builds **Then** real crawlable pages exist for `/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box`, `/faq`, and `/invite`, each an answer-first stub (entity-named lede + heading + placeholder body its epic will flesh out) **And** each stub is verifiable via `view-source` + find with JS disabled.

3. **Given** `/about` **When** it renders **Then** it is the canonical home for the long bio + headshot + `sameAs` channel links as real HTML `<a>`s (handles flagged `[OPEN]` until supplied) and opens answer-first **And** the bio text is set verbatim from the approved copy (50-word and 100–150-word forms), with no exclamation marks.

## Integration ACs

*(Rule 1 — introduces `MirrorLayout.astro` (shared layout) consumed by all Mirror routes; and resolves prior stories' forward-reference links.)*

- **IAC-1 (every Mirror route renders via MirrorLayout, answer-first + self-canonical):** Each built route (`/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box`, `/faq`, `/invite`, `/about`) has: a first-paragraph plain-text lede whose **first sentence contains "Joshua R. Brandt, MSE"**; a `<link rel="canonical">` pointing to its own absolute URL; exactly one `<h1>`; the footer slot region; and ships its content as real HTML (verifiable in `web/dist/<route>/index.html` with JS off). 0 `<script>` on these stubs (no islands).
- **IAC-2 (forward-refs from 1.3/1.4 now resolve):** the hero fork's `/speaking` + `/faq` and the home teasers' `/timeline` + `/work/loandemo` + `/glass-box` + `/invite` now navigate to real built pages (no 404). Re-verify the home links resolve to existing routes.
- **Forward-reference note:** `/glass-box/[artifact]` (artifact reader) is Epic 2; `/browse` + the real footer link list is **Story 1.7**; JSON-LD emission (Person/ProfilePage/etc.) is **Story 1.6** — this story ships the HTML content + the empty JSON-LD slot, not the JSON-LD. Those are NOT 1.5 defects.

## Consumed-by

- **`MirrorLayout.astro`:** every Mirror route here, plus Epic 2 (`/glass-box/[artifact]`, `/timeline` content), Epic 3 (`/speaking`, `/speaking/reel`, `/invite` content), Epic 4 (`/faq` content). Story 1.6 fills its JSON-LD slot; Story 1.7 fills its footer.
- **The route stubs:** filled by their owning epics (see route table). **`/about`** is fully authored here (the canonical Person home).

## Tasks / Subtasks

- [x] **Task 1 — `web/src/layouts/MirrorLayout.astro` (AC: 1)**
  - [x] Wrap `BaseLayout` (reuse its `<html lang=en>`, head/meta, JSON-LD slot, footer slot, 0-JS). Add Mirror-route concerns: a self-canonical `<link rel="canonical" href={absolute self URL}>` (set astro.config `site: 'https://joshuabrandt.abacusai.cloud'` and build the URL from `Astro.url.pathname` + `Astro.site`); a required `title` + answer-first `lede` (prop or named slot) rendered as the opening plain-text paragraph; exactly one `<h1>` (from a `heading` prop); a default `<slot/>` for body; pass through the footer slot.
  - [x] The lede contract: the **first sentence names "Joshua R. Brandt, MSE"** (enforce by convention — the per-route lede strings below already do).
- [x] **Task 2 — Answer-first route stubs (AC: 2)** — create each under `web/src/pages/`, all via `MirrorLayout`, each with an entity-named answer-first lede + one `<h1>` + a brief placeholder body noting the owning epic. No islands (0-JS). Use the per-route ledes in Dev Notes.
  - [x] `timeline.astro` (`/timeline`)
  - [x] `speaking.astro` (`/speaking`)
  - [x] `speaking/reel.astro` (`/speaking/reel`)
  - [x] `work/loandemo.astro` (`/work/loandemo`)
  - [x] `glass-box/index.astro` (`/glass-box`)
  - [x] `faq.astro` (`/faq`)
  - [x] `invite.astro` (`/invite`)
- [x] **Task 3 — The canonical `/about` (AC: 3)** — `about.astro` via `MirrorLayout`, fully authored:
  - [x] Answer-first lede naming "Joshua R. Brandt, MSE" (first sentence); one `<h1>`.
  - [x] The **50-word** and **100–150-word** bios set **VERBATIM** from the approved copy in Dev Notes (flag `[ASSUMPTION]` until Josh confirms). No exclamation marks.
  - [x] A headshot placeholder (reuse the hero's museum-mat "JRB" `[OPEN]` treatment / a shared component if sensible) with a meaningful placeholder alt.
  - [x] `sameAs` channel links as **real HTML `<a>`s** — YouTube, GitHub, Suno — with placeholder hrefs flagged `[OPEN]` (handles pending content inventory). These are the links the 1.6 `Person.sameAs` JSON-LD will mirror.
- [x] **Task 4 — Wire + resolve forward-refs (AC: all, IAC-1/2)**
  - [x] Confirm the 1.3 hero fork (`/speaking`, `/faq`) and 1.4 teasers (`/timeline`, `/work/loandemo`, `/glass-box`, `/invite`) now resolve to the new built pages (no 404).
  - [x] Update `web/test/build-output.test.ts` (or add a focused test) to assert the new routes build, each opens answer-first (first sentence has "Joshua R. Brandt, MSE"), is self-canonical, has one `<h1>`, and that the home links resolve to existing dist routes.
  - [x] `pnpm -r typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test`, `pnpm build` exit 0.
- [x] **Task 5 — Self-check vs ACs + EXPERIENCE/DESIGN.**

## Dev Notes

### Authoritative sources

- EXPERIENCE.md §IA (two-layer model + route map), §"SEO/GEO floor" (answer-first intros naming the entity; JSON-LD owners), §Named-strings. DESIGN.md (MirrorLayout reading measure, type). architecture.md §Frontend-Architecture (routing = `src/pages`), §Requirements-to-Structure, §Complete-Project-Directory-Structure (route files).
- UX-DR10 (two-layer IA + self-canonical; teasers don't duplicate Mirror body), UX-DR14 (the 3 GEO routes: /about, /faq, /speaking/reel), UX-DR15 (answer-first ledes naming the entity first).

### Route map (Stage 1) — what this story creates

| Route | File | Status here | Owner epic fills it |
|---|---|---|---|
| `/about` | `about.astro` | **Full** (bio + headshot + sameAs) | — (canonical home; this story) |
| `/timeline` | `timeline.astro` | Stub | Epic 2 (Master Timeline) |
| `/speaking` | `speaking.astro` | Stub | Epic 3 (Speaker Surface) |
| `/speaking/reel` | `speaking/reel.astro` | Stub | Epic 3 (reel + VideoObject) |
| `/work/loandemo` | `work/loandemo.astro` | Stub | Epic 2 (flagship case study) |
| `/glass-box` | `glass-box/index.astro` | Stub | Epic 2 (Glass Box index) |
| `/faq` | `faq.astro` | Stub | Epic 4 (FAQPage Q&A) |
| `/invite` | `invite.astro` | Stub | Epic 3 (Invite-Me form) |

(NOT here: `/glass-box/[artifact]` → Epic 2; `/browse` + real footer → Story 1.7; `robots.txt`/`sitemap.xml` + JSON-LD → Story 1.6.)

### Answer-first ledes (first sentence MUST name "Joshua R. Brandt, MSE") — suggested per-route stub ledes (calm, no hype, no exclamation; epics refine)

- `/timeline`: "Joshua R. Brandt, MSE has spent thirty years shipping software, now building at the frontier of agentic engineering. This is the Master Timeline of that work — a craft progression from the long runway to the agentic turn." (Epic 2 adds the Dots.)
- `/speaking`: "Joshua R. Brandt, MSE is a software engineer and speaker with thirty years of shipping experience. This page lists his signature talks, formats, and how to book him." (Epic 3 adds reel/talks/bios/invite.)
- `/speaking/reel`: "Joshua R. Brandt, MSE's speaker reel previews how he presents the build, live. The full reel and its details live here." (Epic 3 adds the reel + VideoObject.)
- `/work/loandemo`: "Joshua R. Brandt, MSE built loandemo as a real, end-to-end agentic-engineering case study. This is the layered story of how it was made." (Epic 2 adds the case study.)
- `/glass-box`: "Joshua R. Brandt, MSE builds in the open. The Glass Box is the curated, read-only record of the real BMAD Method artifacts behind this work." (Epic 2 adds the build-story index.)
- `/faq`: "Joshua R. Brandt, MSE answers the questions organizers and peers ask most. These answers are the same ones his Guide cites." (Epic 4 adds the Q&A + FAQPage.)
- `/invite`: "Joshua R. Brandt, MSE takes speaking and collaboration inquiries here. Send a short note and he replies personally." (Epic 3 adds the accessible form.)

### /about bios — VERBATIM approved copy ([ASSUMPTION] until Josh confirms; NO exclamation marks)

**50-word (short):**
> Joshua R. Brandt, MSE is a software engineer with 30 years of shipping experience, now building at the frontier of agentic engineering. He speaks on the patterns that outlast hype cycles and on running real software through disciplined, auditable agent workflows — seasoned, building at the frontier.

**100–150-word (long, 126w):**
> Joshua R. Brandt, MSE is a software engineer with three decades of shipping experience who has gone deep on agentic engineering — seasoned, building at the frontier. Having engineered through every "this changes everything" wave from distributed objects to Kubernetes, he now focuses on what experienced ICs actually need: how to tell durable architecture from fashion, and how to make AI agents dependable teammates rather than party tricks. He works in the open, publishing the real, disciplined process behind his projects so the method is auditable, not asserted — including a portfolio built entirely as a public agentic-engineering project, documented as it ships. His talks pair a veteran's skepticism with hands-on practice, and aim to leave senior audiences with patterns they can use the next morning.

- The lowercase "— seasoned, building at the frontier." tail is **by design** (bio running-sentence form) — do NOT normalize to the Title-case hero `<h1>` form.
- `sameAs`: YouTube, GitHub, Suno — real `<a>`s, hrefs `[OPEN]` (e.g. `href="#"` with a visible `[OPEN: channel URL]` note, or a placeholder URL clearly flagged). The 1.6 `Person.sameAs` JSON-LD will use these same channels.

### Self-canonical

- Set `site: 'https://joshuabrandt.abacusai.cloud'` in `web/astro.config.mjs` (also feeds the 1.6 sitemap). Emit `<link rel="canonical" href={new URL(Astro.url.pathname, Astro.site)}>` per route — each route canonical to ITSELF (UX-DR10). Teasers on the home never duplicate Mirror body (already honored in 1.4).

### Project Structure Notes

- New: `web/src/layouts/MirrorLayout.astro`; `web/src/pages/{timeline,speaking,faq,invite}.astro`, `web/src/pages/speaking/reel.astro`, `web/src/pages/work/loandemo.astro`, `web/src/pages/glass-box/index.astro`, `web/src/pages/about.astro`. Modify: `web/astro.config.mjs` (add `site`), `web/test/build-output.test.ts`.
- Reuse BaseLayout (1.2), tokens, chrome (Kicker), the hero headshot-placeholder treatment for /about. 0-JS on all these routes (no islands). Do NOT build the footer link list (1.7), JSON-LD (1.6), /browse (1.7), or any route's real content (Epics 2–4).
- No ADR registry (`docs/adr/` absent) → Rule 6 no-op.

### Gotchas

- **Leave the working tree UNCOMMITTED** (lead commits after smoke). Suppress dev-story auto-commit.
- Each route: exactly ONE `<h1>`; answer-first first sentence names the entity (GEO); self-canonical to itself.
- Astro static routes: `speaking/reel.astro` → `/speaking/reel`; `work/loandemo.astro` → `/work/loandemo`; `glass-box/index.astro` → `/glass-box`. Confirm trailing-slash behavior is consistent (Astro default) so the 1.3/1.4 hrefs (`/speaking`, etc.) resolve.
- No exclamation marks anywhere; bios verbatim; flag `[ASSUMPTION]`/`[OPEN]` in text (not color alone).
- Keep stubs honest: a brief placeholder body that says the owning epic fills it — but the lede + heading are real, crawlable, answer-first now.

### References

- [Source: epics.md#Story-1.5 — ACs verbatim]
- [Source: EXPERIENCE.md#IA(route map) + #SEO-GEO-floor + #Named-strings; UX-DR10/DR14/DR15]
- [Source: bios — speaker-surface.html mock lines ~1025 (50w) + ~1036 (126w), [ASSUMPTION]]
- [Source: architecture.md#Frontend-Architecture(routing) + #Complete-Project-Directory-Structure]
- [Source: skill-rules.md#Rule-1, #Rule-2]
- [Previous: 1.2 BaseLayout (JSON-LD + footer slots); 1.3 hero fork → /speaking,/faq; 1.4 teasers → /timeline,/work/loandemo,/glass-box,/invite (these 404s now resolve).]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (1M context) — `claude-opus-4-8[1m]` (BMAD `dev-story`, under `/epic-cycle`).

### Debug Log References

- Full DoD gate run (all exit 0): `pnpm -r typecheck` (web 25 Astro files, 0 errors; api + shared `tsc` clean), `pnpm lint` (eslint, 0), `pnpm format:check` (prettier, all conformant), `pnpm -r --if-present test` (api 2/2, web 121/121), `pnpm build` (9 pages built).
- Two self-introduced test-assertion bugs found + fixed during the first `vitest` run (implementation was correct; the new assertions were wrong):
  1. Asserted the literal substring `<body>` — Astro emits `<body data-astro-cid-…>` (scoped attribute), so switched to the `/<body[\s>]/` opening-tag-prefix convention the existing home-page tests already use.
  2. Naive sentence-split `lede.split(/(?<=[.?!])\s/)[0]` broke on the entity's own abbreviation period ("Joshua R."), yielding a false first "sentence". Replaced with `lede.startsWith('Joshua R. Brandt, MSE')` — the precise expression of "names the entity first" (UX-DR15), immune to in-entity periods.
- Verified in `web/dist` (JS-off view-source): all 8 routes have a real `index.html`; each has exactly one `<h1>`, 0 `<script>`, and a self-canonical `<link rel="canonical">` to its own absolute URL on `https://joshuabrandt.abacusai.cloud`. All 6 home forward-ref hrefs (`/speaking`, `/faq`, `/timeline`, `/work/loandemo`, `/glass-box`, `/invite`) resolve to built directory-indexes (no 404).

### Completion Notes List

- **MirrorLayout (Task 1):** new `web/src/layouts/MirrorLayout.astro` composes on `BaseLayout`. It computes the self-canonical from `new URL(Astro.url.pathname, Astro.site)` (UX-DR10) and renders a required `heading` prop as the single `<h1>` + a required answer-first `lede` prop as the opening `<p>`, with a default `<slot/>` for body and a `footer` slot forwarded up to BaseLayout (`<slot name="footer" slot="footer" />`). 0-JS (no `<script>`, no island).
- **BaseLayout extension (minimal, backward-compatible):** added an optional `canonical?: string` prop that emits `<link rel="canonical">` in `<head>` only when set. Canonical is the same class of head-meta BaseLayout already owns (`title`/`description`); this keeps all `<head>` emission in BaseLayout rather than slotting raw markup. The home (`index.astro`) leaves it unset → unchanged output (regression-confirmed: the 105 prior tests still pass). Decided against extracting a shared headshot component to avoid touching the 1.3-tested hero mid-epic; the museum-mat treatment is replicated (markup + scoped CSS) in `/about` per the story's "reuse the treatment" guidance.
- **astro.config:** added `site: 'https://joshuabrandt.abacusai.cloud'` (feeds the canonicals now; the 1.6 sitemap/robots will reuse it).
- **Route stubs (Task 2):** 7 stubs, each via MirrorLayout with the per-route Dev-Notes lede verbatim, an entity-appropriate `<h1>` (not a duplicate of the lede), and a brief placeholder body naming the owning epic. Nested routes (`speaking/reel`, `work/loandemo`, `glass-box/index`) build to the expected paths.
- **/about (Task 3):** fully authored. Bios set VERBATIM from Dev Notes via JS string constants (so the text reaches the DOM character-for-character — verified the lowercase `— seasoned, building at the frontier.` tail is preserved in both the 50w and 126w forms and NOT normalized to the Title-case hero `<h1>`). `[ASSUMPTION]` flag rendered as visible text. sameAs channels (YouTube/GitHub/Suno) are real `<a rel="me">`s with `href="#"` and visible `[OPEN: … URL]` flags. Headshot = the reused museum-mat "JRB" placeholder with a meaningful `aria-label`. No exclamation marks.
- **Forward-refs (Task 4):** all 1.3 hero-fork + 1.4 teaser links now resolve; `web/test/build-output.test.ts` extended with 16 new assertions (per-route real-HTML / answer-first / self-canonical / one-`<h1>` / footer-region / 0-JS / no-`!`; /about verbatim-bio + sameAs + mat; a forward-ref-resolution block that regression-guards the home hrefs AND asserts each target route is built).
- **Rule 5 (NFR tripwire):** none triggered — every NFR in scope (0-JS, one `<h1>`, answer-first, self-canonical) is implementable and implemented.
- **Rule 6 (ADR):** `docs/adr/` absent → no-op (no ADR-constrained ACs to cross-check).
- **Out of scope, intentionally not built (per story):** JSON-LD emission (Story 1.6 — the BaseLayout `jsonld` slot stays empty), the footer link list / `/browse` (Story 1.7), `robots.txt`/`sitemap.xml` (1.6), `/glass-box/[artifact]` (Epic 2), and every route's real content (Epics 2–4).
- **Working tree left UNCOMMITTED on `PORT-1-epic1`** (epic-cycle lead commits after the smoke gate; dev-story auto-commit suppressed).

### File List

**Added**
- `web/src/layouts/MirrorLayout.astro`
- `web/src/pages/timeline.astro`
- `web/src/pages/speaking.astro`
- `web/src/pages/speaking/reel.astro`
- `web/src/pages/work/loandemo.astro`
- `web/src/pages/glass-box/index.astro`
- `web/src/pages/faq.astro`
- `web/src/pages/invite.astro`
- `web/src/pages/about.astro`

**Modified**
- `web/astro.config.mjs` (added `site`)
- `web/src/layouts/BaseLayout.astro` (optional `canonical` prop → `<link rel="canonical">`)
- `web/test/build-output.test.ts` (16 new Story 1.5 build-output assertions)

### Change Log

- 2026-06-06 — Story 1.5 implemented: MirrorLayout + 7 answer-first route stubs + the canonical `/about`; resolved the 1.3/1.4 forward-reference 404s; extended build-output tests (16 new assertions). All DoD gates green (typecheck, lint, format:check, test, build). Status → review.
- 2026-06-06 — Code review (`/epic-cycle` stage, adversarial). All 5 gates re-run green: `pnpm -r typecheck` (26 Astro files, 0 errors; api/shared clean), `pnpm lint` (0), `pnpm format:check` (clean), `pnpm -r --if-present test` (api 2/2, web 126/126), `pnpm build` (9 pages). AC/IAC verification against the real `web/dist` output all PASS (see Review Findings). 0 HIGH, 0 MED; 1 LOW recorded as a deferred accuracy note. Code review approved → Status `done` (per `bmad-code-review` step-04: clean review, no unresolved HIGH/MED). The lead's manual smoke + commit run next as separate epic-cycle gates; no `git commit`/`push` performed by code review.

## Review Findings

**Reviewer:** Code Review stage (`/epic-cycle`), adversarial (Blind Hunter + Edge-Case Hunter + Acceptance Auditor layers performed inline). Baseline `e7d0cd0`. Date 2026-06-06.

**Gates (all exit 0, re-run after review):** `pnpm -r typecheck` (web 26 files / 0 errors; api + shared `tsc` clean) · `pnpm lint` (eslint 0) · `pnpm format:check` (prettier clean) · `pnpm -r --if-present test` (api 2/2, web 126/126 — 121 prior + 5 new MirrorLayout component tests) · `pnpm build` (9 pages). No failing gate.

**AC/IAC verification (against real `astro build` → `web/dist`, JS-off):**
- [x] **AC1 / IAC-1** — all 8 routes (`/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box`, `/faq`, `/invite`, `/about`): opening lede's FIRST SENTENCE starts with "Joshua R. Brandt, MSE" (verified `startsWith` on the extracted first `<p>` of each); `<link rel="canonical">` to its OWN absolute URL, **each distinct** (`…/timeline/`, `…/speaking/`, … `…/about/` — no shared/wrong URL); exactly one `<h1>` each; `<footer class="site-footer">` region present each; real `<html lang="en">`+`<body>` document; **0 `<script>` and 0 `.js` references** on every route.
- [x] **AC2** — all 7 stubs build to real crawlable `index.html`, answer-first, with placeholder bodies naming the owning epic.
- [x] **AC3 (/about)** — both bios are **character-exact verbatim** vs Dev Notes (short 300/300 chars, long 811/811 chars; em-dash U+2014 preserved; ASCII apostrophe in `veteran's`; straight `"this changes everything"` quotes — no smart-quote rewriting). The lowercase `— seasoned, building at the frontier.` tail is preserved in BOTH forms and NOT normalized to the Title-case hero form (asserted `Seasoned, building at the frontier` absent from `/about` body). `[ASSUMPTION]` rendered as visible text. 3 `sameAs` `<a rel="me">` (YouTube/GitHub/Suno), each `href="#"` with a visible `[OPEN: … URL]` flag. Museum-mat headshot placeholder (`role="img"` + meaningful `aria-label`, JRB monogram). No exclamation marks. Clean hierarchy (1×`<h1>`, 2×`<h2>`).
- [x] **IAC-2** — all 6 home forward-refs (`/speaking`, `/faq`, `/timeline`, `/work/loandemo`, `/glass-box`, `/invite`) are present in the built home markup AND resolve to existing built `dist/<route>/index.html` (no 404).
- [x] **QA null-safe canonical guard** — independently verified: under Astro's Container API `Astro.site` is unset, so the guard's false-branch runs and BaseLayout omits the `<link rel="canonical">` (render does NOT throw `ERR_INVALID_URL`); in the real `astro build` `Astro.site` IS set, so the true-branch runs and every route emits its correct distinct self-canonical. Guard behavior diverges from production output ONLY when `Astro.site` is unset (never during `astro build`) — production canonicals are correct/unchanged.
- [x] **UX-DR10** — each Mirror route self-canonical (above); home teasers carry links to Mirror routes, not duplicated Mirror body (unchanged from 1.4).
- [x] **Rule 3 (real-runtime evidence)** — satisfied: build-output suite asserts on real `astro build` HTML for every route; MirrorLayout component test renders the shared layout via the Container API. Browser Playwright is Story 1.9 (per directive).
- [x] **Rule 8 (test discoverability)** — `MirrorLayout.component.test.ts` lives in `web/test/` and matches the vitest include glob `test/**/*.test.ts`; confirmed it runs in the default suite (part of the 126 count) and standalone.
- [x] **Rule 5 (NFR tripwire)** — none triggered. **Rule 6 (ADR)** — `docs/adr/` absent → no-op.

**Findings:**

- [x] **[Review][Defer] [1.5 · LOW] Dev completion-note claim "home output byte-identical/unchanged" is imprecise** [`web/src/layouts/BaseLayout.astro`] — deferred, accuracy note only (no code change; output is correct). The built home `index.html` is NOT strictly byte-identical to the `e7d0cd0` baseline: the baseline references ONE stylesheet (`/_astro/index.*.css`), the current build references TWO (`/_astro/BaseLayout.*.css` + `/_astro/index.*.css`). Verified the home DOM is byte-identical once the `<link rel="stylesheet">` tags are removed, and the combined CSS is rule-for-rule identical (126 rule blocks in both, 0 differences, 21741 vs 21740 bytes — a 1-byte newline-join artifact). Root cause: BaseLayout went from 1 consumer (home only) to 9 (home + 8 Mirror routes), so Astro hoists BaseLayout's shared CSS into a separate dedup chunk instead of inlining it into the single page chunk. This is a standard Astro CSS-chunking optimization triggered by adding routes — NOT by the `canonical` prop — and produces no visual or semantic change. The regression tests still pass because they assert on CSS rule content/structure, not the stylesheet filename count. No defect; recorded for accuracy.

**Decision:** Story passes code review. 0 HIGH, 0 MED, 1 LOW (deferred as a note in `deferred-work.md`). No code changes required. Status → `done` (sprint-status.yaml synced). Code review performs no `git commit`/`push`; the lead's manual smoke + commit are separate epic-cycle gates that run next.
