---
baseline_commit: 6c529a6242408ad2129eaa53bdb9a17eab06b29c
---

# Story 1.6: Structured-data emission, sitemap & robots

Status: done

<!-- Epic 1, Story 1.6. Builds on 1.1–1.5. Adds JSON-LD (Person/ProfilePage/Event/VideoObject/CreativeWork/FAQPage) into BaseLayout's JSON-LD slot, plus generated sitemap.xml + robots.txt (AI-crawler allow-list). Fills the slot 1.2 created; uses the routes 1.5 created. -->

## Story

As a conference organizer who Googles Josh,
I want the site to surface accurate structured data and be fully indexable,
so that Josh's speaker facts and identity are credible before I even click (NFR-3, FR-35).

## Acceptance Criteria

1. **Given** the JSON-LD framework **When** `web/src/lib/jsonld.ts` is built **Then** it exposes builders for `Person`, `ProfilePage`, `Event`, `VideoObject`, `CreativeWork`, and `FAQPage`, emitted server-rendered into the `BaseLayout` JSON-LD slot **And** home + `/about` emit `Person` + `ProfilePage` now; the `/speaking`, `/speaking/reel`, `/work/loandemo`, and `/faq` stubs emit their type with placeholder data their epic completes.

2. **Given** any emitted schema **When** validated **Then** each route type passes the Rich Results Test.

3. **Given** the build **When** the pipeline runs **Then** a generated `sitemap.xml` enumerates every existing Mirror route with `lastmod` and is referenced from a generated `robots.txt` whose AI-crawler allow-list includes at minimum ClaudeBot, GPTBot, OAI-SearchBot, PerplexityBot, and Google-Extended (plus related current tokens; final list confirmed at build).

## Integration ACs

*(Rule 1 — introduces `jsonld.ts` (builder module) + the sitemap/robots endpoints; consumers = the routes + crawlers.)*

- **IAC-1 (routes emit valid JSON-LD via the slot):** In `web/dist`, the home `/` and `/about` each contain a `<script type="application/ld+json">` whose parsed JSON includes a `Person` (name "Joshua R. Brandt, MSE") AND a `ProfilePage`; `/speaking` emits `Event`, `/speaking/reel` emits `VideoObject`, `/work/loandemo` emits `CreativeWork`, `/faq` emits `FAQPage` (placeholder data OK). Every emitted block is **valid parseable JSON** with `@context: "https://schema.org"` and the required fields per type (below). Verifiable by parsing the `ld+json` script(s) in the built HTML.
- **IAC-2 (sitemap ↔ robots wired):** `web/dist/sitemap.xml` is valid XML listing every existing Mirror route (absolute URL + `lastmod`); `web/dist/robots.txt` contains a `Sitemap:` line pointing to the absolute sitemap URL AND `Allow: /` directives for the AI-crawler tokens (does NOT block them — NFR-3). Verifiable by reading both built files.
- **Note (NOT a defect):** the live Google Rich Results Test (AC2) is an external service — this story validates structurally (valid schema.org JSON-LD, required fields per type); the live Rich Results check is on the **Story 1.10** launch checklist. `ld+json` is DATA, not executable JS — it does NOT violate the 0-JS budget; update the build-output "0 script" assertions to count only executable `<script>` (exclude `type="application/ld+json"`).

## Consumed-by

- **`jsonld.ts`:** every route here, plus Epic 2 (`CreativeWork` on real loandemo/portfolio), Epic 3 (`Event`/`VideoObject` on real talks/reel), Epic 4 (`FAQPage` on real Q&A). **`sitemap.xml`/`robots.txt`:** extended as routes are added (Story 1.7 `/browse`; Epic 2 `/glass-box/[artifact]`).

## Tasks / Subtasks

- [x] **Task 1 — `web/src/lib/jsonld.ts` typed builders (AC: 1)**
  - [x] Export typed builder functions returning schema.org objects (each with `@context: "https://schema.org"`, `@type`): `personJsonLd()`, `profilePageJsonLd()`, `eventJsonLd()`, `videoObjectJsonLd()`, `creativeWorkJsonLd()`, `faqPageJsonLd()`. Required/recommended fields per Dev Notes. TS strict (typed inputs).
  - [x] A helper to serialize one-or-many JSON-LD objects into `<script type="application/ld+json">` safe JSON (escape `<` to avoid breaking the tag).
- [x] **Task 2 — Emit via BaseLayout JSON-LD slot (AC: 1)**
  - [x] Wire pages to pass their JSON-LD into the `jsonld` slot 1.2 created (BaseLayout renders it server-side in `<head>`). Confirm MirrorLayout passes it through.
  - [x] **Home `/`** + **`/about`**: `Person` + `ProfilePage` with REAL data (name "Joshua R. Brandt, MSE", jobTitle "Software Engineer", description from the bio, `sameAs` = the /about channel URLs (YouTube/GitHub/Suno, `[OPEN]` placeholders), `image` = headshot `[OPEN]`). ProfilePage `mainEntity` → the Person.
  - [x] **`/speaking`** → `Event` (placeholder talk); **`/speaking/reel`** → `VideoObject` (placeholder reel, ~90s); **`/work/loandemo`** → `CreativeWork` (placeholder); **`/faq`** → `FAQPage` (1–2 placeholder Q&A). Mark placeholder values clearly; the owning epic fills real data.
- [x] **Task 3 — `sitemap.xml` (AC: 3)**
  - [x] `web/src/pages/sitemap.xml.ts` (Astro static endpoint) → valid `<urlset>` XML listing every existing Mirror route as an absolute URL (use `Astro.site`/the config `site`) + a `<lastmod>` per URL. Make `lastmod` **deterministic** (prefer the route source file's last git-commit ISO date via `git log -1 --format=%cI -- <file>`; fall back to a fixed build constant if git is unavailable) — Story 1.8 verifies byte-stability.
  - [x] Enumerate the current routes: `/`, `/about`, `/timeline`, `/speaking`, `/speaking/reel`, `/work/loandemo`, `/glass-box`, `/faq`, `/invite`. (Story 1.7 adds `/browse`; later epics extend.)
- [x] **Task 4 — `robots.txt` (AC: 3)**
  - [x] `web/src/pages/robots.txt.ts` (Astro static endpoint) → robots content with a `Sitemap: https://joshuabrandt.abacusai.cloud/sitemap.xml` line and an **AI-crawler allow-list** (see Dev Notes for the verified 2026 token set) — explicit `Allow: /` per token; a final `User-agent: *` `Allow: /`. Do NOT block AI crawlers (NFR-3). Confirm/extend the token set at build (UX-DR23 — tokens drift; the dev may re-verify via web search).
- [x] **Task 5 — Verify (AC: all, IAC-1/2)**
  - [x] Update `web/test/build-output.test.ts`: parse the `ld+json` in built routes and assert the right `@type`(s) per route + required fields + valid JSON; assert `sitemap.xml` lists all routes with lastmod; assert `robots.txt` has the Sitemap line + the required AI tokens with Allow. **Update the "0 script" assertions to exclude `type="application/ld+json"`** (count only executable scripts).
  - [x] `pnpm -r typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm -r --if-present test`, `pnpm build` exit 0.
- [x] **Task 6 — Self-check vs ACs + EXPERIENCE/architecture.**

## Review Findings

Code review (adversarial; Blind Hunter + Edge Case Hunter + Acceptance Auditor lenses) by the `/epic-cycle` Code Review stage, 2026-06-06. Baseline `6c529a6`, branch `PORT-1-epic1`. All gates re-run green after the fix below (typecheck, lint, format:check, test [170 web + 2 api], build — all exit 0; sitemap.xml + robots.txt byte-identical across two builds → NFR-6 holds).

- [x] [Review][Patch] **MED — sitemap `<loc>` URLs did not match each page's own `rel=canonical` (trailing-slash mismatch)** [web/src/pages/sitemap.xml.ts] — RESOLVED inline. The sitemap emitted the slashless form (`https://joshuabrandt.abacusai.cloud/about`) while Astro's default directory build (`build.format: 'directory'`, `trailingSlash: 'ignore'`) serves every route as a directory index and the page's own `<link rel="canonical">` uses the trailing-slash form (`.../about/`) — verified in `web/dist` (e.g. `dist/about/index.html` canonical = `.../about/`). A slashless `<loc>` advertises a non-canonical variant and splits the SEO signal, violating the story's explicit "sitemap absolute URLs must match the self-canonical URLs from 1.5 (trailing-slash consistent)" requirement (Dev Notes §Gotchas; Task 3) and UX-DR10. **Fix:** `sitemap.xml.ts` now appends a trailing slash to every non-root `<loc>`; for consistency the `/about` `ProfilePage.url` (`about.astro`) and the `/work/loandemo` `CreativeWork.url` (`work/loandemo.astro`) were aligned to the same canonical form. **Tests:** updated `build-output.test.ts` — the per-route `<loc>` expectation now asserts the trailing-slash form, and the IAC-2 ground-truth `liveRouteLocs` dist-walk now derives trailing-slash URLs (the directory-index page IS the trailing-slash URL), so the sitemap↔built-pages set-equality check still binds to ground truth. Verified post-fix: all 9 sitemap `<loc>` entries match their page canonicals exactly; determinism preserved (sitemap sha256 `8b1ea221…`).

**Verified clean (no findings):**

- **AC1 / IAC-1** — every owner route in `web/dist` emits valid, parseable `ld+json` with `@context: "https://schema.org"`: home `/` + `/about` = `Person` (name EXACTLY "Joshua R. Brandt, MSE", jobTitle "Software Engineer", description, url, image, sameAs = 3) + `ProfilePage` (mainEntity → Person; embedded Person carries NO own `@context`); `/speaking` = `Event` (performer = embedded Person); `/speaking/reel` = `VideoObject` (`duration` `PT1M30S`); `/work/loandemo` = `CreativeWork` (name "loandemo", author = embedded Person); `/faq` = `FAQPage` (Question → acceptedAnswer → Answer). Home Person === /about Person byte-identical (one source `lib/person.ts`). No exclamation marks in any JSON-LD node.
- **Serializer XSS/tag-break safety** — `serializeJsonLd` escapes `<`/`>`/`&` → `<`/`>`/`&` (valid JSON, inert HTML). Confirmed against a hostile `</script><script>…</script> &` input (round-trips to the original string; no raw `<`/`>`/`&` survive) and confirmed zero raw `<`/`>`/`&` leak into any real `ld+json` block in `dist`. Covered by `jsonld.test.ts`.
- **AC3 / IAC-2** — `dist/sitemap.xml` is valid `<urlset>` XML enumerating all 9 routes (absolute URL + ISO-8601 `<lastmod>`); `dist/robots.txt` has the absolute `Sitemap:` line, every AC3-minimum AI token (ClaudeBot, GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended) plus the related 2026 tokens each `Allow: /`, zero `Disallow`, and a catch-all `User-agent: *` / `Allow: /`. Both served as flat files (`dist/robots.txt`, `dist/sitemap.xml`).
- **NFR-6 determinism** — `lastmod` is the per-file git commit date (deterministic); no `new Date()`/build-now in runtime code (only in lastmod.ts comments explaining the avoidance). sitemap.xml + robots.txt byte-identical across two builds.
- **NFR-1 0-JS budget** — home ships exactly 1 executable script (the 1.4 reduced-motion-gated IntersectionObserver rail) + 1 `ld+json` data block; all Mirror routes ship 0 executable scripts; routes without a JSON-LD owner (`/timeline`, `/glass-box`, `/invite`) ship 0 `ld+json` + 0 executable. `ld+json` is DATA — the "0 script" assertions correctly exclude `type="application/ld+json"`. No new `<script src>` / modulepreload introduced.
- **Rule 3** (real-runtime evidence) — satisfied: `build-output.test.ts` parses the real `astro build` output (dist) for JSON-LD per route + sitemap + robots. **Rule 5** (NFR tripwire) — no un-implementable NFR; NFR-6 met. **Rule 6** (ADR) — `docs/adr/` absent → no-op. **Do-not-flag items** (`[OPEN]` sameAs/image/thumbnail placeholders; placeholder Event/VideoObject/CreativeWork/FAQPage data; live Rich Results Test → Story 1.10; `/browse` → Story 1.7) left as-is per directive.

## Dev Notes

### Authoritative sources

- EXPERIENCE.md §"SEO/GEO floor" (JSON-LD owners: Person+ProfilePage on /about + home; FAQPage on /faq; Event + VideoObject on /speaking/reel; CreativeWork on flagships); UX-DR23 (sitemap + robots AI-crawler allow-list; tokens drift, confirm at build); FR-35; NFR-3. architecture.md §AR-9 (build-time JSON-LD + sitemap + robots), §Complete-Project-Directory-Structure (`pages/robots.txt.ts`, `pages/sitemap.xml.ts`, `lib/jsonld.ts`).

### JSON-LD per-type required/recommended fields (schema.org; `@context: "https://schema.org"`)

- **Person** (home + /about, REAL): `name` "Joshua R. Brandt, MSE", `jobTitle` "Software Engineer", `description` (the short bio), `url` (site), `image` (headshot `[OPEN]`), `sameAs` [YouTube, GitHub, Suno URLs `[OPEN]`], optional `knowsAbout` ["agentic engineering","software architecture"].
- **ProfilePage** (home + /about): `mainEntity` → the Person object; optional `dateModified`.
- **Event** (/speaking, placeholder): `name`, `startDate`, `eventAttendanceMode`, `location` (Place/VirtualLocation), `performer` → Person, `organizer`. Flag placeholder.
- **VideoObject** (/speaking/reel, placeholder): `name`, `description`, `thumbnailUrl` `[OPEN]`, `uploadDate`, `duration` (~PT1M30S), `contentUrl`/`embedUrl` `[OPEN]`. Flag placeholder.
- **CreativeWork** (/work/loandemo, placeholder): `name` "loandemo", `author` → Person, `description`, `url`, `dateCreated`. Flag placeholder.
- **FAQPage** (/faq, placeholder): `mainEntity` → [ `Question`{`name`, `acceptedAnswer`→`Answer`{`text`}} ] (1–2 placeholder pairs). Flag placeholder.

Escape `<`/`>`/`&` when serializing into the `<script>` tag (prevent injection / tag-breaking).

### Verified AI-crawler allow-list (2026 — confirmed via web search 2026-06-06; ALLOW all — GEO-first, NFR-3)

OpenAI: `GPTBot`, `OAI-SearchBot`, `ChatGPT-User` · Anthropic: `ClaudeBot`, `anthropic-ai`, `Claude-User`, `Claude-SearchBot` · Perplexity: `PerplexityBot`, `Perplexity-User` · Google: `Google-Extended`, `Google-CloudVertexBot` · Apple: `Applebot-Extended` · Amazon: `Amazonbot` · Meta: `Meta-ExternalAgent` · Common Crawl: `CCBot` · Cohere: `cohere-ai`.
- **Minimum required by AC3:** ClaudeBot, GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended. The rest are the "related current tokens." Each gets `Allow: /`. End with `User-agent: *` / `Allow: /`. (Bytespider is commonly blocked for non-compliance — optional; default to allow per "do not block AI crawlers" or omit; the dev's call, documented.)
- Tokens drift — the dev MAY re-confirm the current set via web search at build (UX-DR23) and extend.

### Determinism (NFR-6; Story 1.8 verifies)

`sitemap.xml` `lastmod` must be deterministic (same git state → byte-identical sitemap). Prefer git last-commit date per route file. Avoid `new Date()`/build-time-now for lastmod (non-stable). robots.txt is static text (deterministic).

### Project Structure Notes

- New: `web/src/lib/jsonld.ts`, `web/src/pages/sitemap.xml.ts`, `web/src/pages/robots.txt.ts`. Modify: route pages (pass JSON-LD into the slot), `web/test/build-output.test.ts`.
- Reuse BaseLayout's existing `jsonld` slot (1.2) + MirrorLayout passthrough; the /about `sameAs` channels (1.5). Do NOT change route copy/structure (1.5) beyond adding JSON-LD.
- `ld+json` is data — keep the 0-JS budget (no executable JS added). The home's one gated rail script (1.4) is unchanged.
- No ADR registry (`docs/adr/` absent) → Rule 6 no-op.

### Gotchas

- **Leave the working tree UNCOMMITTED** (lead commits after smoke). Suppress dev-story auto-commit.
- **Update the build-output "0 script" assertions** to exclude `type="application/ld+json"` (else they'll false-fail now that JSON-LD ships). Count only executable `<script>` (no `type`, or `type=module`, or with `src`).
- Each route emits ONE consolidated `ld+json` (an array/`@graph`) or multiple `ld+json` scripts — either is valid; keep it parseable.
- Person `name` is EXACTLY "Joshua R. Brandt, MSE". No exclamation marks anywhere.
- sitemap absolute URLs must match the self-canonical URLs from 1.5 (same `site`, trailing-slash consistent).

### References

- [Source: epics.md#Story-1.6 — ACs verbatim]
- [Source: EXPERIENCE.md#SEO-GEO-floor; UX-DR23; FR-35; NFR-3]
- [Source: architecture.md#AR-9 + #Complete-Project-Directory-Structure (jsonld.ts, sitemap.xml.ts, robots.txt.ts)]
- [Source: AI-crawler tokens — web search 2026-06-06 (nohacks.co, momentic, searchenginejournal, evolveamz 2026 references)]
- [Source: skill-rules.md#Rule-1, #Rule-2]
- [Previous: 1.2 BaseLayout JSON-LD slot; 1.5 MirrorLayout + routes + /about sameAs channels + site config.]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.8 (1M context) — `claude-opus-4-8[1m]` (BMAD dev-story under /epic-cycle).

### Debug Log References

- `pnpm -r typecheck` → exit 0 (web `astro check`: 0 errors/0 warnings/0 hints; shared + api `tsc --noEmit` clean).
- `pnpm lint` (eslint .) → exit 0.
- `pnpm format:check` (prettier --check .) → exit 0 ("All matched files use Prettier code style").
- `pnpm -r --if-present test` → exit 0 (web: 6 files / 169 tests; api: 1 file / 2 tests). New: `web/test/jsonld.test.ts` (13 builder/serializer unit tests) + Story-1.6 build-output blocks.
- `pnpm build` → exit 0 (9 pages; `/sitemap.xml` + `/robots.txt` emitted).
- Determinism (NFR-6): built twice → `sitemap.xml` and `robots.txt` byte-identical (sitemap sha256 `09aa055d…`).
- Dist validation: parsed `ld+json` on `/`, `/about` (Person+ProfilePage), `/speaking` (Event), `/speaking/reel` (VideoObject), `/work/loandemo` (CreativeWork), `/faq` (FAQPage) — all valid JSON, `@context: https://schema.org`, required fields present; Person.name EXACT "Joshua R. Brandt, MSE"; no `!` in any JSON-LD.

### Completion Notes List

- **JSON-LD module (`web/src/lib/jsonld.ts`):** typed builders `personJsonLd/profilePageJsonLd/eventJsonLd/videoObjectJsonLd/creativeWorkJsonLd/faqPageJsonLd`, each returning a schema.org object with `@context: "https://schema.org"` + `@type`. Embedded nodes (Person as `mainEntity`/`performer`/`author`) drop their own `@context` via an `embed()` helper (JSON-LD embedding rule). Serializer `serializeJsonLd()` escapes `<`/`>`/`&` → `<`/`>`/`&` (inert HTML, still valid JSON) so the block can never break out of the `<script>` tag; output is deterministic.
- **Slot wiring:** home (`index.astro`) emits Person + ProfilePage straight into BaseLayout's `jsonld` slot. MirrorLayout now forwards a `jsonld` slot up to BaseLayout; `/about` (REAL Person+ProfilePage), `/speaking` (Event), `/speaking/reel` (VideoObject), `/work/loandemo` (CreativeWork), `/faq` (FAQPage) pass their block through it. All use `<script type="application/ld+json" slot="jsonld" is:inline set:html={…}>` — `is:inline` keeps Astro from bundling it (it stays inline DATA in `<head>`, no JS bundle).
- **Canonical Person (`web/src/lib/person.ts`):** one source of the REAL Person facts so home + /about are byte-identical (verified by a test). `description` mirrors /about's approved short bio. `sameAs` (YouTube/GitHub/Suno) + `image` headshot are `[OPEN]` placeholders flagged in the module (valid absolute URLs so the schema validates) — when the real channel URLs/headshot land, update here and both GEO routes follow.
- **Placeholder data flagged:** Event/VideoObject/CreativeWork/FAQPage carry `[PLACEHOLDER]` text and fixed (non-`new Date()`) dates; the owning epic (3/3/2/4) fills real data. VideoObject duration is the ~90s reel target `PT1M30S`.
- **sitemap.xml (`web/src/pages/sitemap.xml.ts`):** static endpoint (`prerender = true`) listing all 9 routes as absolute URLs from `context.site` (matches the 1.5 self-canonicals) with deterministic `<lastmod>` = each route source file's `git log -1 --format=%cI` (helper `web/src/lib/lastmod.ts`; fixed `FALLBACK_LASTMOD` if git unavailable). Route registry in `web/src/lib/routes.ts` (extend for 1.7 `/browse`, Epic 2 `/glass-box/[artifact]`).
- **robots.txt (`web/src/pages/robots.txt.ts`):** static endpoint with `Sitemap:` line (absolute) + the verified 2026 AI-crawler set, each `Allow: /`, ending `User-agent: *` / `Allow: /`. GEO-first (NFR-3): ALLOW all, zero `Disallow`. Token set re-confirmed via web search 2026-06-06 (nohacks.co, searchenginejournal Dec-2025, momentic, ai-robots-txt registry) — matches the story list.
- **build-output "0 script" assertions updated (per story directive):** added `countExecutableScripts`/`countLdJsonScripts`/`parseLdJson`/`findNodeByType` helpers; home "exactly ONE script" and the per-route "ships 0 JS" assertions now count only EXECUTABLE `<script>` (exclude `type="application/ld+json"`). Also re-scoped the 1.4 "IntersectionObserver script" assertion to the executable script (the ld+json now precedes it in `<head>`). `ld+json` is DATA — does not violate the 0-JS budget (NFR-1).
- **Rule 5 (NFR tripwire):** no NFR found unmeasurable/impossible — NFR-6 determinism is achievable (git-per-file lastmod, verified byte-identical). No planning-artifact amendment required.
- **Rule 6 (ADR):** `docs/adr/` absent → no-op (confirmed).
- **Decision — Bytespider omitted:** the verified set omits Bytespider (commonly ignores robots.txt; listing a non-compliant token is moot). Documented per the story's "dev's call" note; the GEO-first `User-agent: *` / `Allow: /` already permits everything else.
- **AC2 note:** the live Google Rich Results Test is an external service on the Story 1.10 launch checklist; this story validates structurally (valid schema.org JSON-LD + required fields per type) per the story's IAC-1 note.
- Left the working tree UNCOMMITTED (lead commits after the smoke gate); stayed on `PORT-1-epic1`.

### File List

New:

- `web/src/lib/jsonld.ts` — typed schema.org JSON-LD builders + safe serializer.
- `web/src/lib/person.ts` — canonical Person facts (shared by home + /about).
- `web/src/lib/routes.ts` — Mirror-route registry feeding the sitemap.
- `web/src/lib/lastmod.ts` — deterministic git-commit-date lastmod helper.
- `web/src/pages/sitemap.xml.ts` — generated sitemap endpoint.
- `web/src/pages/robots.txt.ts` — generated robots endpoint (AI-crawler allow-list).
- `web/test/jsonld.test.ts` — unit tests for the builders + serializer.

Modified:

- `web/src/layouts/MirrorLayout.astro` — forward a `jsonld` slot to BaseLayout.
- `web/src/pages/index.astro` — emit Person + ProfilePage (REAL) via the slot.
- `web/src/pages/about.astro` — emit Person + ProfilePage (REAL) via the slot.
- `web/src/pages/speaking.astro` — emit placeholder Event.
- `web/src/pages/speaking/reel.astro` — emit placeholder VideoObject.
- `web/src/pages/work/loandemo.astro` — emit placeholder CreativeWork.
- `web/src/pages/faq.astro` — emit placeholder FAQPage.
- `web/test/build-output.test.ts` — JSON-LD/sitemap/robots assertions; "0 script" assertions now exclude `ld+json`.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — 1.6 → in-progress → review.
- `_bmad-output/implementation-artifacts/1-6-structured-data-emission-sitemap-robots.md` — this record.

### Change Log

| Date       | Change                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| 2026-06-06 | Implemented Story 1.6 — JSON-LD builders + slot emission (Person/ProfilePage/Event/VideoObject/CreativeWork/FAQPage), deterministic sitemap.xml, AI-crawler-allow robots.txt; build-output "0 script" assertions updated to exclude ld+json. All DoD gates green; sitemap/robots byte-deterministic. Status → review. |
| 2026-06-06 | Code review (/epic-cycle) — resolved 1 MED inline: sitemap `<loc>` now uses the trailing-slash form to match each page's `rel=canonical` (UX-DR10; story §Gotchas). Aligned `/about` ProfilePage.url + `/work/loandemo` CreativeWork.url to the canonical form; updated `build-output.test.ts` (per-route `<loc>` + IAC-2 ground-truth walk). All gates re-run green; sitemap/robots still byte-deterministic. Status → done. Code-review edits: `web/src/pages/sitemap.xml.ts`, `web/src/pages/about.astro`, `web/src/pages/work/loandemo.astro`, `web/test/build-output.test.ts`. |
