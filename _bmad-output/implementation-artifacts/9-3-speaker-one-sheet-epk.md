# Story 9.3: Speaker one-sheet / EPK — a build-time-generated, current PDF from the speaking data

---
baseline_commit: d5cdbc81a80e0180294f84031dbad61129960da0
---

Status: done (code-review APPROVED 2026-06-10 — 0 HIGH/MED, clean; QA closed a Rule-8/13 gap [credibility now asserted on the rendered PDF bytes]; lead smoke PASS — EPK downloads, [ASSUMPTION] flags preserved, honest framing, no fabricated contact, deterministic)

<!-- Created by the lead /epic-cycle create-story gate, Epic 9, 2026-06-10. Epic 9 Story 9.3 (FR-21).
     Self-contained (no owner fork): the EPK is a 1–2 page PDF GENERATED at build time from the existing
     speaking data (web/src/data/speaking.ts — PERSON, BIOS, SIGNATURE_TALKS, REEL), so it always reflects
     the current content. Story 9.0 already made the bio word-counts accurate; this story consumes those bios. -->

## Story

As a conference organizer,
I want a downloadable speaker one-sheet (EPK),
So that I can circulate Joshua R. Brandt's talks and bio internally.

(Epics.md Story 9.3; FR-21. The downloadable EPK is generated from the live speaking data so it never goes stale.)

## Context & decision (read first)

The Speaker Surface (`/speaking/`, Epic 3) already holds the canonical speaking data in `web/src/data/speaking.ts`: `PERSON`, `BIOS` (short + long, with the now-derived word-counts from Story 9.0), `SIGNATURE_TALKS` (3 talks — title, audience levels, takeaways, formats, logistics), and `REEL`. Story 9.3 generates a **1–2 page EPK PDF from that data at build time** and links it for download on `/speaking/`. Because it's GENERATED from the data (not hand-made), it automatically reflects the current talks + bios (AC2).

### What this story builds

1. **A build-time EPK generator** — a new `Generator` registered in `scripts/build-content.ts` `CONTENT_GENERATORS` (alongside the KB/Glass Box/timeline generators) that reads `web/src/data/speaking.ts` and emits a 1–2 page EPK PDF to a served static path (e.g. `web/public/epk/joshua-brandt-speaker-epk.pdf` → copied into `web/dist/epk/...` on build). Pure-Node PDF generation is preferred (a lib like `pdf-lib` / `pdfkit` — byte-controllable, no browser in the build); alternatively Playwright `page.pdf()` from an HTML EPK template (Playwright is already a dep) **+ a determinism post-process**. The dev picks; the determinism requirement (below) is the binding constraint.
2. **A download link on `/speaking/`** — a clearly-labeled "Download the speaker one-sheet (PDF)" link to the generated EPK, in the Speaker surface (e.g. near the bios / a dedicated EPK affordance). Followable JS-off (it's a static file link). Rule 2 / `routeHref` is for internal Astro routes; the PDF is a static asset path (`/epk/...pdf`) — link it directly.
3. **Determinism (NFR-6) — the binding constraint.** The EPK PDF is served from `web/dist`, so `check-deterministic` (two clean builds → byte-identical `web/dist`) covers it. The generated PDF MUST be **byte-deterministic** across builds: pin the PDF `/CreationDate` + `/ModDate` to a fixed value (NOT `new Date()` — the project forbids build-time wall-clock) and pin/normalize the `/ID` (and any random object IDs / font-subset nondeterminism). If a byte-stable PDF is genuinely infeasible with the chosen lib, the fallback is to exclude THAT ONE pdf path from `check-deterministic` with a documented rationale (consistent with how generated artifacts are scoped) — but **prefer a deterministic PDF**; a non-deterministic build is a HALT, not a silent pass.

### Credibility (Rule 9) — the EPK preserves the speaking data's honesty

The EPK is generated FROM `speaking.ts`, which carries deliberate `[ASSUMPTION]` / `[OPEN]` credibility flags (e.g. the signature-talk titles are `[ASSUMPTION]`-flagged as representative/proposed, not yet-confirmed booked talks; some logistics are `[OPEN]`). Enumerated fabrication classes to NOT commit:
- **Do NOT strip the `[ASSUMPTION]`/`[OPEN]` flags to make the EPK look more "booked" than it is** — preserve the honesty (present `[ASSUMPTION]` talks as representative/proposed, carrying the flag or an equivalent honest framing). An EPK presenting unconfirmed talks as confirmed is a credibility-floor violation.
- **Do NOT invent a contact email** — there is no `PUBLIC_CONTACT_EMAIL` (deferred [3.4]). The EPK's "how to book" points to the real surfaces: the site (`joshuabrandt.abacusai.cloud`) + the Invite page (`/invite/`). No fabricated address/phone.
- **Every EPK fact traces to `speaking.ts` / `PERSON`** — the bio is the real bio (the short or long `BIOS` entry, byte-equal to its source); the talks/takeaways/formats are the real `SIGNATURE_TALKS`; no invented credentials/stats.

## Acceptance Criteria

**AC1 — a downloadable, current 1–2 page EPK PDF (FR-21).**
**Given** the Speaker Surface
**When** the visitor follows the EPK download link
**Then** it serves a **1–2 page PDF** reflecting the signature talks + bio (generated from `speaking.ts`), with the person's name, a bio, the signature talks (title + key takeaways + formats/audience), the reel reference, and an honest "how to book" (the site + `/invite/`, no fabricated contact); the link is followable JS-off.

**AC2 — the EPK reflects the current content (FR-21).**
**Given** the talks/bios in `speaking.ts`
**When** the content changes and the site rebuilds
**Then** the regenerated EPK reflects the change (it is GENERATED from the data, not a hand-maintained static file) — a test asserts the EPK content is derived from `SIGNATURE_TALKS`/`BIOS`/`PERSON` (e.g. mutate a talk title in a fixture → the generated EPK text changes), mutation-verified (Rule 8).

**AC3 — credibility preserved (Rule 9).**
**Given** the generated EPK
**When** audited against `speaking.ts`
**Then** the `[ASSUMPTION]`/`[OPEN]` honesty is preserved (no talk presented as confirmed-booked when its source is `[ASSUMPTION]`), there is no invented contact email/phone, no invented credentials, and the bio is byte-equal to its `BIOS` source; a test asserts the EPK carries no fabrication-class string + preserves the source flags.

**AC4 — deterministic + composition + gate.**
**Given** the canonical gate
**When** the story completes
**Then** the generated EPK PDF is byte-deterministic across two clean builds (`check-deterministic` PASS — pinned CreationDate/ID; NO build-time `new Date()`), OR (fallback) excluded from the check with a documented rationale; the `/speaking/` page + its existing tests are unaffected; `pnpm test:all` + `pnpm run check-deterministic` both exit 0 (report exit codes — Rule 14); voice positive-assertion (no exclamation).

## Integration ACs

The EPK generator is a build-time producer; its consumer is the `/speaking/` download link IN THIS STORY (the served PDF). No new runtime service. Rule 1 escape clause / build-time content generator (consistent with the KB/Glass Box/timeline generators).

## Tasks / Subtasks

- [x] **Task 1 (AC1/AC2) — the EPK generator**: a new `Generator` in `scripts/build-content.ts` (or a `scripts/build-epk.ts` it registers) that reads `web/src/data/speaking.ts` and emits a 1–2 page EPK PDF to a served static path. Layout: name + bio + the 3 signature talks (title, takeaways, formats/audience) + reel + honest "how to book". Pure-Node PDF lib preferred; deterministic.
- [x] **Task 2 (AC1) — download link on `/speaking/`**: a clearly-labeled, JS-off-followable "Download the speaker one-sheet (PDF)" link to the generated EPK.
- [x] **Task 3 (AC2/AC3 — Rule 8/9) — tests**: assert the EPK content is DERIVED from `SIGNATURE_TALKS`/`BIOS`/`PERSON` (mutate a fixture → generated text changes), mutation-verified; a credibility test asserting the `[ASSUMPTION]`/`[OPEN]` flags are preserved + no invented contact/credentials + the bio is byte-equal to source. Discoverable by the default suite (Rule 8). If the PDF text is hard to assert directly, generate an intermediate deterministic text/HTML the PDF renders from + assert on that.
- [x] **Task 4 (AC4) — determinism + gate**: make the PDF byte-stable (pin CreationDate/ID; no `new Date()`); run `pnpm test:all; echo $?` + `pnpm run check-deterministic; echo $?` (both 0). If determinism is infeasible, exclude the one PDF path from the check WITH a documented rationale (and say so loudly) — do NOT ship a non-deterministic build silently.

## Dev Notes

- **Determinism is the #1 technical risk.** PDFs embed creation timestamps + IDs that vary per build. Do NOT use `new Date()` (the project forbids build-time wall-clock — see the timeline/`formatDotDate` discipline). Pin `/CreationDate` + `/ModDate` to a fixed constant and normalize the `/ID`. Verify with `check-deterministic` (two builds → byte-identical). A non-deterministic EPK is a HALT — fix it or exclude-with-note, never normalize a red `check-deterministic`.
- **Rule 9 (credibility):** preserve the `[ASSUMPTION]`/`[OPEN]` flags from `speaking.ts` — do NOT polish them away. No invented contact email (PUBLIC_CONTACT_EMAIL is deferred [3.4]); use the site + `/invite/`. Bio byte-equal to its `BIOS` source. QA/code-review run a credibility audit of the EPK.
- **Rule 8:** test that the EPK is DERIVED from the data (mutation-verified), not hand-maintained. If asserting on raw PDF bytes is brittle, have the generator produce a deterministic intermediate (text/HTML) it renders, and assert on that intermediate + that the PDF is generated from it.
- **Build pipeline:** register the generator in `CONTENT_GENERATORS` (`scripts/build-content.ts`) in dependency order; it runs at `pnpm build:content`. If it needs a new dep (`pdf-lib`/`pdfkit`), add it to the appropriate package + the committed lockfile.
- **A new dep + a binary PDF in the repo:** if the PDF is vendored under `web/public/`, it's committed (a small 1–2 page PDF is fine). Confirm `tsconfig`/lint don't try to parse the `.pdf` (it's binary — exclude if needed, like the `public/playables` lesson, Rule 16).
- **Rule 14/16:** run the WHOLE gate, capture + report exit codes; read `astro check`'s Failed/exit.

## Dev Agent Record

### Context Reference
- Created by the lead `/epic-cycle` create-story gate (Epic 9), 2026-06-10. Self-contained (EPK generated from existing speaking data); no owner fork.

### File List

**New files:**
- `scripts/build-epk.ts` — EPK generator: `buildEpkData()` (intermediate), `renderEpkToPdf()`, `buildEpkGenerator` (Generator registration)
- `scripts/build-epk.test.ts` — 21 tests covering AC1/AC2/AC3/AC4 + Rule 8 (mutation-verified) + Rule 9 (credibility)
- `web/public/epk/joshua-brandt-speaker-epk.pdf` — Generated EPK PDF (generated by `pnpm build:content`; committed as a build artifact)

**Modified files:**
- `scripts/build-content.ts` — added `buildEpkGenerator` import + registry entry
- `scripts/build-content.test.ts` — updated registry test to expect 4 generators
- `scripts/tsconfig.json` — changed `module`/`moduleResolution` from `NodeNext` to `ESNext`/`bundler` to match tsx's actual runtime resolution semantics (enables cross-package import of `web/src/data/speaking.ts`)
- `scripts/package.json` — added `pdf-lib@^1.17.1` dependency
- `web/src/pages/speaking.astro` — added EPK download section (h2 + note + `<a href="/epk/...pdf" download ...>`) + CSS for `.speaking__epk*` classes
- `web/test/speaking.test.ts` — added 4 build-output tests for EPK: PDF exists in dist, link present in HTML, aria-label, section heading

### Decisions

1. **PDF lib: `pdf-lib@1.17.1`** — pure-Node, no Playwright needed. Installed in `scripts/` package (not `web/`). Byte-deterministic when `setCreationDate`/`setModificationDate` are pinned to `FIXED_EPK_DATE` and the `/ID` trailer is pinned to `EPK_DOC_ID`. Confirmed by two fresh `PDFDocument.create()` calls producing identical bytes.

2. **Determinism achieved without exclusion** — The PDF is byte-stable across clean builds: `check-deterministic` PASS, both build tree hashes identical (`b166ac4...`). No exclusion needed. Method: `FIXED_EPK_DATE = new Date('2026-01-01T00:00:00Z')` (not `new Date()`); `EPK_DOC_ID = '506f72746f6c696f45504b2020202020'`; `useObjectStreams: false` in `doc.save()` for stable cross-reference tables; `StandardFonts` (bundled in pdf-lib — same bytes every run).

3. **Intermediate text layer (`EpkData`) for Rule 8 testability** — `buildEpkData()` assembles the data without touching PDF. Tests assert on `EpkData` fields against the real `speaking.ts` exports (mutation-verified). PDF-level tests are limited to: magic bytes present, page count 1–2, byte-identity across two calls.

4. **scripts tsconfig moduleResolution change** — Changed from `NodeNext` to `bundler` to match tsx's actual import resolution. `NodeNext` requires explicit `.js` extensions on relative imports, but `web/src/data/speaking.ts` uses extension-less imports (valid under `bundler`). All existing scripts use explicit `.ts` extensions — they work under both. The comment "NodeNext matches the runtime" was incorrect; tsx uses bundler-style resolution.

5. **EPK output to `web/public/epk/`** — Astro build copies `web/public/` into `web/dist/`, so the PDF is served at `/epk/joshua-brandt-speaker-epk.pdf`. No tsconfig exclusion needed (TypeScript ignores `.pdf` files). Rule 2 link is a static asset path (not an Astro route), so `routeHref` is not used — linked directly.

6. **Credibility (Rule 9)** — `[ASSUMPTION]` flags preserved verbatim in all 3 talk titles and all takeaways. No invented contact email/phone. Booking points to `SITE_ORIGIN + /invite/`. Bio is `BIOS[0].text` verbatim (byte-equal assertion in tests).

### Completion Notes

- All 4 tasks marked complete.
- `pnpm test:all` exit code: **0** (1413 unit/component tests across scripts/web/api + 463 e2e + LH)
- `pnpm run check-deterministic` exit code: **0** — tree hash `b166ac4166f4b97508766737ef53603b919c94b6b1903219abf32b5922332202` for both builds.
- Story 9.3 status: review.

### Change Log

- 2026-06-10: Implemented Story 9.3 — Speaker EPK PDF generator, download link on /speaking/, determinism + credibility tests.

## Review Findings (code-review stage, 2026-06-10)

Adversarial fresh review of the final dev+QA state. **Outcome: APPROVE — no HIGH/MED, no auto-resolve edits required.** All ACs independently verified against the real artifacts.

### Gate attestation (Rule 14 — captured exit codes, re-run fresh by the reviewer)

- `pnpm test:all` → **exit 0**. Ran the full gate to completion (typecheck → lint → format:check → test → test:e2e → lh).
  - Typecheck read directly (Rule 14): `astro check` → **0 errors, 0 warnings**, 76 hints, Done; `scripts`/`shared`/`api` `tsc --noEmit` all Done. The changed-tsconfig package (`scripts`) typechecks clean.
  - Unit tests: scripts 213 / api 233 / web 972 = **1418 passed, 0 failed, 0 skipped**. `build-epk.test.ts` = **26 passed, 0 skipped** (21 dev + 5 QA rendered-PDF credibility — discoverable in the default suite, Rule 8).
  - EPK e2e (`speaking.spec.ts`) ran against the prod-faithful `serve-with-api.mjs` harness: 3 EPK tests + `/speaking/` axe AA all **passed, not skipped** (Rule 3/7).
- `pnpm run check-deterministic` → **exit 0**. Two clean builds, both tree hash `b166ac4166f4b97508766737ef53603b919c94b6b1903219abf32b5922332202`. EPK PDF is IN `web/dist/epk/` (159-file dist) — NOT excluded; no `epk`/exclude entry in `check-deterministic.ts`. Generator-level determinism independently confirmed: two `build:content` runs produced byte-identical `web/public/epk/...pdf` (sha `c07c142f…`), empty git diff. AC4 fallback (exclusion) NOT used.

### AC verification

- **AC1 (downloadable 1–2 page PDF + JS-off link + axe AA 0):** PASS. `file` reports 1 page; PDF resolves 200 with `pdf` content-type + `%PDF-` magic bytes; `<a download aria-label>` static link is JS-off-followable (e2e direct-nav 200); `/speaking/` axe AA = 0 violations with the EPK section present.
- **AC2 / Rule 8 (DERIVED, not inline copy):** PASS. `buildEpkData()` sources `PERSON`/`BIOS`/`SIGNATURE_TALKS`/`REEL` from the real modules; tests assert against the real exports + scoped fields, mutation-noted.
- **AC3 / Rule 9 (credibility on the RENDERED PDF):** PASS — reviewer extracted the committed PDF text with `pdftotext` and independently audited: all 3 `[ASSUMPTION]` talk titles preserved verbatim (flag attached to each title, NOT stripped); honest framing present ("Signature Talks (Representative …)" + "Talks marked [ASSUMPTION] are representative/proposed working titles, not yet confirmed bookings" + "No email or phone listed — responses go through the site contact form"); NO invented email/phone (booking → `/invite/` + `SITE_ORIGIN`); only the real "30 years"; no `[ph]` leak (METRICS placeholders correctly absent from the EPK); rendered bio byte-equal to `BIOS[0].text` === `PERSON.description`.
  - **Mutation-spot-check (QA test non-vacuous):** stripped `[ASSUMPTION] ` from titles in `renderEpkToPdf` → the rendered-PDF test `…preserves every [ASSUMPTION] talk title` RED at `build-epk.test.ts:241` (`expect text toContain "[ASSUMPTION] Agentic Patterns That Sh"`). Reverted. The QA rendered-PDF credibility suite genuinely binds to the decoded PDF Tj operands — confirmed non-vacuous.
- **AC4 (determinism):** PASS (see gate attestation above) — the #1 risk, independently green.

### tsconfig.json change (NodeNext → ESNext/bundler) — verified SAFE

The base config (`tsconfig.base.json`) ALREADY uses `moduleResolution: "bundler"` + `allowImportingTsExtensions: true`; the `scripts` tsconfig was overriding it with `NodeNext`. The change reverts to inheriting the base — making `scripts` resolve identically to `web`/`shared`/`api` (the consistent monorepo fix, not a one-off). `strict`/`noUncheckedIndexedAccess` are inherited from base and unaffected → type-checking is NOT weakened. Verified: `scripts` `tsc --noEmit` exit 0; all 4 content generators run at `pnpm build:content` (build-epk = 4/4); the full scripts suite (213 tests) green. Right fix, not over-broad.

### Notes (not defects)

- EPK renders the SHORT bio only (1 page) and the first 3 takeaways per talk — AC1 says "a bio" / "key takeaways" (no "all"); a tight 1-page one-sheet is compliant.
- The `if (!speakingHtml) return` guard in the new `web/test/speaking.test.ts` EPK link tests follows the file's pre-existing convention; the companion non-guarded `existsSync` assertions (PDF-in-dist + the page-exists tests) red if the build didn't produce output, so the guards are not a vacuous-pass risk here.

**Rule 6 (ADR):** N/A — no ADR registry. **Deferred items:** none.
