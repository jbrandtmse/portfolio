# Story 7.1: Distinct Wings (Technical / Creative / Agentic) — three crawlable, self-navigable greatest-hits Wing routes that compose with the Guide

---
baseline_commit: 579af95fb7e3465018088953ec14ee6a271037a7
---

Status: done (code-review APPROVED 2026-06-09 — 1 HIGH auto-resolved [loandemo.md "recorded in ADRs" Rule-9 fabrication + corpus-wide KB ADR guard], QA fixed 1 HIGH [wings.md Glass-Box fabrication]; lead browser smoke PASS — all 3 Wings crawlable/0-JS/credible, 0 console errors, see smoke-evidence/story-7.1-smoke.md)

<!-- Created by the lead /epic-cycle create-story gate, Epic 7, 2026-06-09. Epic 7 Story 7.1 (FR-24).
     OWNER DECISIONS (Josh, 2026-06-09 AskUserQuestion fork — recorded so the dev does NOT re-litigate):
       (1) STRUCTURE = three DEDICATED Wing routes: /technical/, /creative/, /agentic/ — each its own
           crawlable, self-canonical, 0-JS greatest-hits index, registered ONCE in web/src/lib/routes.ts
           (which auto-wires the footer + /browse + sitemap). NOT a single /work/ hub; NOT a home reframe.
       (2) CONTENT = real work now + honest "more coming". Populate each Wing ONLY with real, grounded,
           already-shipped work; any thin Wing carries an honest "more coming" affordance (NO fabricated
           projects — Rule 9 credibility floor). The Stage-2 playables (vector-wars, voyager, christmas-elves)
           arrive in Story 7.3 — they are "coming", not invented entries here. -->

## Story

As a visitor,
I want three clear Wings — Technical, Creative, Agentic — that I can navigate myself,
So that I can explore Joshua R. Brandt's work by domain without needing the agent, while the Guide can still blend across the Wings on demand.

(Epics.md Story 7.1; FR-24 "Distinct Wings"; composes with FR-25 greatest-hits ordering — the curated DEFAULT order lands here, the intent-responsive re-ordering is Story 7.2.)

## Context & decision (read first)

Epic 7 makes the three Wings the **default browsable structure**. Today the only built work surface is `/work/loandemo/`; the substantive real work is **loandemo** (the agentic-engineering flagship) + **the portfolio/BMAD meta-project itself** (this very site, its auditable Glass Box + Master Timeline, and the live Guide agent). The Stage-2 playables (`vector-wars`, `voyager`, `christmas-elves`) are **not built until Story 7.3** — they are honest "more coming", never invented entries here.

Per Josh's owner-decision fork (above): **three dedicated Wing routes** + **real-work-now-with-honest-"more-coming"**.

### What this story builds

1. **Three crawlable Wing index routes** — `/technical/`, `/creative/`, `/agentic/` — each rendered through `MirrorLayout` (answer-first lede whose FIRST sentence names "Joshua R. Brandt, MSE"; exactly one `<h1>`; self-canonical; **0 executable JS**), listing that Wing's work as a curated greatest-hits with a calm one-line blurb + a real link per item, and an honest "more coming" affordance where a Wing is thin. Modeled on `web/src/pages/browse.astro` (the existing MirrorLayout index pattern).
2. **A single Wings content model** — a new repo-root `content/wings.ts` (mirrors the `content/timeline/dots.ts` curated-manifest pattern) that defines the three Wings and their items, each grounded to a real shipped surface or flagged honestly. This is the ONE source the three routes read (no per-route hardcoding).
3. **Route-registry + nav + sitemap wiring** — add the three Wing routes to `web/src/lib/routes.ts` `NAV_ROUTES` (once → footer + `/browse` + sitemap together, per Story 1.7 / Rule 2). All internal links use `routeHref()` (trailing-slash form; the site is `trailingSlash: 'always'` + `build.format: 'directory'`).
4. **Guide composition (FR-24 "the agent can blend on demand")** — add a concise, grounded `content/kb/wings.md` KB entry describing the three Wings + their real work so the Guide can ground answers like "show me your creative work" and **cite/link the relevant Wing route** — i.e. the Guide blends across Wings via its existing grounded-citation path, WITHOUT removing or gating the self-navigable default. The existing Epic-5 home-scene re-curation engine is NOT modified and MUST keep working unchanged (no regression).

### Grounded content allocation (Rule 9 — every entry traces to a real source; NO fabrication)

| Wing | Real items now (live href) | Honest "more coming" |
| --- | --- | --- |
| **Technical** — *agentic engineering producing production software, systems/infra* | **loandemo** → `/work/loandemo/` (the live flagship case study) | "More technical work is coming" — the playable `vector-wars` (Three.js) + `voyager` (web sim) land in Story 7.3. Do NOT list them as if built. |
| **Agentic** — *agent demonstrations, BMAD-Method applications, the live agent* | **This portfolio / the BMAD Method** → `/glass-box/` (the auditable planning artifacts) + `/timeline/` (the BMAD process Dots) — the agentic-engineering proof behind this site; **the Guide** itself (the live grounded agent on this site, an agent demonstration). Both real/live. | "More agentic work is coming" (honest, no invented titles). |
| **Creative** — *music, generative art, design* | **Music on Suno** — link via the existing `[OPEN: Suno profile URL]` credibility flag (a DELIBERATE honest marker, Rule-15-EXEMPT; do NOT invent a URL or a track title). | "More creative work is coming" — the playable `christmas-elves` (Phaser) lands in Story 7.3. |

The "more coming" affordance is a clearly-labeled, calm, non-fabricated note (no exclamation; positive-assertion voice). It is NOT an internal plumbing sentinel — it is honest visitor-facing copy (distinct from the Rule-15 `[OPEN: no reader yet]` class; the deliberate `[OPEN: <reason>]`/`[ASSUMPTION]` credibility flags are exempt).

## Acceptance Criteria

**AC1 — three Wings independently reachable + browsable without the agent (FR-24, NFR-3).**
**Given** the default static structure (JS off)
**When** a visitor browses
**Then** `/technical/`, `/creative/`, and `/agentic/` are each independently reachable (linked from the global footer + `/browse` + the sitemap, all sourced from `routes.ts`) and browsable as crawlable HTML — each renders through `MirrorLayout` with an answer-first lede whose first sentence names "Joshua R. Brandt, MSE", exactly one `<h1>`, a self-canonical `<link>`, every item link followable with JS off (`routeHref()` trailing-slash form), and **0 executable JS** on the page (no `<script>` that executes; the build-output 0-JS assertion holds for all three routes).

**AC2 — every listed item is real + grounded; thin Wings are honest (Rule 9 credibility floor).**
**Given** the rendered Wing pages
**When** their content is audited against real shipped surfaces
**Then** every listed work item links to a real, resolving surface (loandemo → `/work/loandemo/`; the Agentic items → `/glass-box/`, `/timeline/`, and the live Guide; the Creative music → the Suno `[OPEN: Suno profile URL]` honest flag), there are **zero fabricated project titles/claims**, and any Wing without multiple built items shows an honest "more coming" affordance (calm, no hype, no exclamation) — NOT an invented placeholder project. The served visible prose contains no internal "not-yet" plumbing sentinel (Rule 15; the deliberate `[OPEN: <reason>]` credibility flags are exempt).

**AC3 — the Guide can blend across Wings on demand, without removing the self-navigable default (FR-24).**
**Given** the Guide (`/api/guide`) and the new `content/kb/wings.md` KB entry
**When** a visitor asks the Guide about a domain (e.g. "show me the creative work")
**Then** the Guide can ground its answer in the Wings KB content and cite/link the relevant Wing route (the Wings are in the build-time KB index), AND the three Wing routes remain fully self-navigable with JS off (the default is never gated behind the agent); the existing Epic-5 home-scene re-curation engine (`web/src/lib/recuration.ts` + `api/src/lib/recuration.ts`, the `SCENE_IDS` order/deepen/skip tables) is **unchanged and still passes** (no regression — its tests stay green; `web/dist` home scene order untouched).

**AC4 — canonical conventions + determinism hold.**
**Given** the canonical gate
**When** the story completes
**Then** internal-link form === `rel=canonical` form === sitemap `<loc>` form for the three new routes (Rule 2, all trailing-slash via `routeHref()`); `pnpm test:all` and `pnpm run check-deterministic` both exit 0 (report the captured exit codes — Rule 14); the new routes carry valid JSON-LD where appropriate (e.g. a `CreativeWork`/`CollectionPage`-style node via the existing `web/src/lib/jsonld.ts` builders — do not hand-roll); voice is positive-assertion, no exclamation marks.

## Integration ACs

This story introduces the three Wing surfaces (consumer-facing routes) + the `content/wings.ts` model + the `content/kb/wings.md` KB entry. **AC3 is the Integration AC** (Rule 1): the Guide (an existing consumer, `/api/guide`) reads the new Wings KB content and produces the observable effect of grounding + linking a Wing route, while the self-navigable default is preserved. The `content/wings.ts` model's first consumers are the three Wing routes IN THIS STORY (AC1). No un-consumed producer surface ships.

## Tasks / Subtasks

- [ ] **Task 1 (AC2) — author `content/wings.ts`** (the curated manifest): a typed module exporting the three Wings, each with `{ id, label, lede, items: WingItem[], moreComing: boolean|string }`; `WingItem = { title, blurb, href, status: 'live'|'coming', sourceNote }`. Populate ONLY with the grounded items in the allocation table above. No fabricated titles; the Suno music uses the `[OPEN: Suno profile URL]` honest flag. Place the manifest where the timeline manifest lives (repo-root `content/`), NOT under `web/src/content/` (the content-collections footgun, deferred-work [2.3]).
- [ ] **Task 2 (AC1) — build the three routes** `web/src/pages/technical.astro`, `creative.astro`, `agentic.astro` (or `/work/{wing}/` index form if cleaner — but the chosen public paths MUST be `/technical/`, `/creative/`, `/agentic/`), each reading its Wing from `content/wings.ts`, rendered through `MirrorLayout` (answer-first lede naming "Joshua R. Brandt, MSE"; one `<h1>`; self-canonical; 0-JS), listing items as real `<a href={routeHref(...)}>` greatest-hits with blurbs + the honest "more coming" affordance. Model on `web/src/pages/browse.astro`.
- [ ] **Task 3 (AC1/AC4) — register the routes** in `web/src/lib/routes.ts` `NAV_ROUTES` (one entry each: path, label, description, sourceFile) so footer + `/browse` + sitemap pick them up together. Verify the three appear in the built `sitemap.xml`, the footer, and `/browse` with trailing-slash `<loc>`/href.
- [ ] **Task 4 (AC3) — add `content/kb/wings.md`** (concise, grounded, answer-first; names the three Wings + their real work; every claim traces to the allocation table; carries the honest "more coming"). Confirm the KB indexer (`scripts/build-kb-index.ts`) picks it up so the Guide can ground + cite the Wing routes. Do NOT modify the re-curation engine.
- [ ] **Task 5 (AC4) — JSON-LD + determinism**: emit appropriate schema.org JSON-LD for the Wing pages via the existing `web/src/lib/jsonld.ts` builders (do not hand-roll). Run the full canonical gate (`pnpm test:all; echo $?` and `pnpm run check-deterministic; echo $?` — both must be 0).

## Dev Notes

- **Owner decisions are FIXED (do not re-litigate):** three dedicated routes `/technical/`, `/creative/`, `/agentic/`; real-work-now + honest "more coming"; no fabricated projects.
- **Rule 9 (credibility floor) — the highest-risk failure here.** This is LLM-authored visitor-facing prose about real work. Enumerated fabrication classes to NOT commit: (a) NO invented project titles/descriptions — every item traces to the allocation table's real source; (b) the playables (`vector-wars`/`voyager`/`christmas-elves`) are 7.3 work → "more coming", NEVER listed as built/playable here; (c) NO invented Suno URL or track title — use the `[OPEN: Suno profile URL]` honest flag verbatim; (d) NO claim that a Wing has work it doesn't (a thin Wing says "more coming" honestly). QA/code-review will run a BROAD credibility audit of every claim against real surfaces.
- **Rule 15 (no internal sentinel in visible prose):** the honest "more coming" copy is fine (deliberate visitor-facing affordance). The deliberate `[OPEN: <reason>]`/`[ASSUMPTION]` credibility flags (e.g. `[OPEN: Suno profile URL]`) are EXEMPT — they are honest markers, not plumbing sentinels. Do NOT leak any internal "not-yet"/TODO plumbing token into rendered prose.
- **Rule 2 (URL form):** site is `trailingSlash: 'always'` + `build.format: 'directory'`. EVERY internal link, the `rel=canonical`, and the sitemap `<loc>` for the three new routes MUST be the trailing-slash form, all produced via `routeHref()` on the `routes.ts` registry. The build-output url-form test (`web/test/url-form.test.ts`) covers form-equality — make sure the new routes pass.
- **Rule 3 (real-runtime test evidence):** the three Wing routes are user-facing surfaces → they need real-runtime (Playwright) e2e coverage in the QA suite (crawlable JS-off, links followable, lede/h1/canonical present, 0-JS). QA owns generating these; the dev should leave the surfaces testable.
- **MirrorLayout contract:** `heading`, `lede` (first sentence MUST name "Joshua R. Brandt, MSE"), `title`; emits self-canonical + answer-first + 0-JS. See `web/src/pages/browse.astro` for the exact usage. Do NOT introduce a `<script>` that executes (NFR-1 0-JS-by-default).
- **Re-curation NON-REGRESSION (AC3):** do NOT modify `web/src/lib/recuration.ts`, `api/src/lib/recuration.ts`, the `SCENE_IDS` tables, or the home `index.astro` scene order. The Wings are a NEW navigable layer; the home-scene re-curation is untouched and its tests must stay green. (The `resetRecuration` dead-export is a SEPARATE deferred item — out of scope here; leave it.)
- **NFR-3 / GEO:** each Wing page is self-canonical (it is the indexable surface for that domain), opens with an answer-first lede naming the person, and is in the sitemap with `lastmod`. Add the routes to `SITEMAP_ROUTES`/`NAV_ROUTES` as the registry dictates.
- **KB index:** `content/kb/wings.md` must be discoverable by `scripts/build-kb-index.ts` (same dir + shape as the other `content/kb/*.md`). Keep it concise + grounded; the Guide will cite it. Re-run the KB build and confirm the Wings content is indexed (so AC3's "Guide can blend" is real, not aspirational).
- **Rule 14:** capture + report the literal exit codes of `pnpm test:all` and `pnpm run check-deterministic` (both must be 0). Read `astro check`'s `Failed`/exit code, not the human-summary eye.

## Dev Agent Record

### Context Reference
- Created by the lead `/epic-cycle` create-story gate (Epic 7), 2026-06-09. Owner fork resolved via AskUserQuestion (three dedicated routes; real-work-now + honest "more coming").

### File List

**New (dev + QA):**
- `content/wings.ts` — the curated Wings manifest (single source for the three routes)
- `web/src/pages/technical.astro`, `web/src/pages/creative.astro`, `web/src/pages/agentic.astro` — the three Wing routes (MirrorLayout)
- `content/kb/wings.md` — the Wings KB entry (Guide-grounding; indexed into the gitignored `api/data/kb-index.json` at build)
- `web/e2e/wings.spec.ts` — 41 real-runtime e2e (Rule 3)
- `web/test/wings.content.test.ts` — content-credibility regression suite (Rule 9)

**Modified (dev + QA):**
- `web/src/lib/routes.ts` — added `/technical`, `/creative`, `/agentic` to `NAV_ROUTES`
- `web/playwright.config.ts` — registered the `wings` project
- `web/test/build-output.test.ts`, `web/test/Footer.component.test.ts` — added the 3 Wing routes to the ground-truth route arrays

**Modified (code-review, this stage):**
- `content/kb/loandemo.md` — HIGH Rule-9 fix: removed the "recorded in ADRs" fabrication (no `docs/adr/`); replaced with an honest grounded statement
- `web/test/wings.content.test.ts` — extended with a broad corpus-wide ADR-class regression guard over every `content/kb/*.md`
- `api/data/kb-index.json` (gitignored) — regenerated via `pnpm run build:content` after the loandemo.md fix

### Decisions
- **JSON-LD builder:** the three Wing pages emit a `CreativeWork` node via the existing `creativeWorkJsonLd()` builder (AC4 directive: do not hand-roll). `CreativeWork` is the closest existing builder for a curated collection page; `author` embeds `PERSON` (name "Joshua R. Brandt, MSE"). Accepted — no new builder needed for this story.
- **Creative `[OPEN: Suno profile URL]` rendering:** the Suno item is `status: 'open'` and rendered as a non-link `<span>` (not an `<a>`), with the deliberate `[OPEN: Suno profile URL]` flag shown verbatim in the blurb. This is the Rule-15-EXEMPT honest credibility marker (grounded in `web/src/lib/person.ts` `CHANNEL_SAMEAS` + `content/kb/about.md`). Correct.
- **Agentic "Guide" item links to `/faq/`:** the live Guide is surfaced via the site-wide Guide pill; `/faq/` is the honest, real, resolving entry route (in `NAV_ROUTES` + sitemap). Accepted as grounded.

### Review Findings (code-review stage, 2026-06-09)

Adversarial code-review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) verified the FINAL dev+QA state FRESH against the real artifacts. **Result: 1 HIGH (✅ auto-resolved inline) + 0 MED + 0 LOW new.** Canonical gate re-run to captured exit codes (Rule 14) — all 0.

- **[7.1 · HIGH · ✅ RESOLVED — Rule 9 fabrication, handed over by QA] `content/kb/loandemo.md:25` claimed "The architectural decisions were recorded in ADRs" — but this project has NO `docs/adr/` directory.** This is the EXACT Epic-4 enumerated fabrication class ("no portfolio 'recorded in ADRs' — there is no `docs/adr/`"), and `loandemo.md` is KB content the Guide grounds on — so the live Guide could repeat the false claim verbatim. The existing ADR guard (`web/test/jsonld.test.ts:373`) only covered the FAQ `FAQ_ITEMS` TS data array, never the `content/kb/*.md` markdown corpus the Guide actually indexes — which is why the fabrication slipped through every prior gate.
  - **Fix (inline):** rewrote line 25 to an honest, grounded statement — "The architectural decisions were captured in the story files and the architecture document as they were made." (true to the real BMAD process + consistent with line 39's "The architecture document tracked every constraint and every tradeoff"). No invented artifact type. Regenerated the gitignored `api/data/kb-index.json` via `pnpm run build:content` (41 chunks; the ADR claim is gone from the index).
  - **Regression guard (mutation-verified):** extended `web/test/wings.content.test.ts` with a broad corpus-wide guard that reads EVERY `content/kb/*.md` from disk (the real files the indexer feeds the Guide) and asserts none matches `/\bADRs?\b|architecture decision records?|\bdocs\/adr\//i` — closing the gap the FAQ-scoped guard left. Mutation-verified: re-introducing "recorded in ADRs" into `loandemo.md` reds the `loandemo.md` case (1 failed / 18 passed); reverting greens it (19 passed).

**Independent verification performed by the reviewer:**
- **AC1/AC4 (real built/served pages):** built-HTML audit confirms `/technical/` (1 live link → `/work/loandemo/`), `/creative/` (0 live anchors; Suno is a non-link span + the honest `[OPEN]` flag, no invented URL), `/agentic/` (2 live links → `/glass-box/`, `/faq/`). One `<h1>`, entity-first lede, self-canonical trailing-slash, 0 authored JS (Guide-pill carve-out only), valid `CreativeWork` JSON-LD — all proven by the 41-test `wings` e2e project (all RAN, none skipped — Rule 3/7). E2e non-vacuity mutation-verified (broke the technical lede entity-first naming → GEO-floor test reds → reverted).
- **AC2 (broad credibility audit):** every live item resolves to a real route (loandemo/glass-box/faq, all in the registry + sitemap, e2e 200); zero fabricated titles; the 7.3 playables (vector-wars/voyager/christmas-elves) appear ONLY in honest "more coming" prose (never as a link/built item); the Suno music uses `[OPEN: Suno profile URL]` verbatim. QA's `wings.md` ADR-fabrication guard verified present + mutation-relevant.
- **AC3 (Integration AC, non-regression):** `web/src/lib/recuration.ts`, `api/src/lib/recuration.ts`, `SCENE_IDS`, and home `index.astro` are BYTE-UNCHANGED vs baseline `579af95` (not in the working tree). `content/kb/wings.md` IS indexed (the three Wing routes appear in `kb-index.json`), so the Guide can ground + cite the Wings.
- **Rule 15:** no internal plumbing sentinel in rendered Wing prose (the `[OPEN: Suno profile URL]` flag is the documented EXEMPT deliberate marker); served-output test confirms.

**Canonical gate (Rule 14 — captured exit codes):** typecheck `0` (0 errors / 0 warnings / 75 hints) · lint `0` · format:check `0` · test (vitest: scripts 184 / api 221 / web 803) `0` · test:e2e `0` (387 passed, 1 pre-existing `cinematic.spec.ts` motion-gated skip — NOT a Wings test; all 41 Wing e2e RAN) · lh `0` · **`check-deterministic` PASS** (web/dist byte-identical across two clean builds, tree hash `c682ec39…`).
