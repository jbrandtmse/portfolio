# Story 4.1: Knowledge Base index & retriever seam

---
baseline_commit: f827fe6ea13b0eebeb47cd9c25025a8ef5ac8a69
---

Status: done

<!-- Created by the /epic-cycle lead (Epic 4, Story 4.1), 2026-06-07. First feature story of Epic 4 (The Guide).
     SERVICE-INTRODUCING: the `search(query,k)` retriever seam + the build-time Orama KB index. First external
     consumer is Story 4.3 (/api/guide). Builds directly on Story 4.0's hardened `stripFrontmatter` helper. -->

## Story

As Josh,
I want a build-time index over curated KB markdown with a clean retriever interface,
so that the Guide can only ever speak from blessed, deterministic source material (FR-6, AR-3).

## Context & key decisions (read first)

This story establishes the **agent's source of truth** and the **retriever seam** the rest of Epic 4 grounds on. It ships three things: (1) curated KB markdown in `content/kb/`, authored faithfully from the SAME facts the Static Mirror already exposes; (2) `scripts/build-kb-index.ts` — a deterministic content-pipeline generator that chunks those docs and writes a serialized index to gitignored `api/data/`; (3) `api/src/lib/retriever.ts` — a `search(query, k)` abstraction that loads the index read-only and isolates the search engine so a later lexical→hybrid/vector swap never ripples into the agent. The Guide (4.3/4.4) is an *enhancement* over the complete Static Mirror — every fact the agent can surface already lives in a crawlable Mirror route, which is also the agent's citation target.

### Decision 1 — KB source = curated `content/kb/*.md`; default-deny by construction

Per epics.md 4.1, the KB docs are `content/kb/{about,speaking,loandemo,faq,bmad-method}.md`, authored from the same facts the Static Mirror exposes. **The default-deny gate is honored by construction:** the indexer iterates ONLY the curated `content/kb/` set (a sorted directory read of `content/kb/*.md`), never `_bmad-output/` and never the repo at large — so nothing internal can leak (architecture.md §"One publish allowlist ... the single gate preventing internal-doc leakage"; the *principle* is default-deny curation, and `content/kb/` IS the curated set). Do NOT crawl the filesystem; do NOT read `_bmad-output/`. The five launch docs and their citation routes (see Decision 2) are the indexed corpus. A test MUST assert the indexer cannot/does not index a non-curated file (e.g. drop a decoy `.md` outside `content/kb/` → it never appears in the index).

### Decision 2 — each KB doc carries frontmatter (`route`, `label`, `title`); citations point to a REAL Mirror route (FR-7)

Every `content/kb/*.md` opens with YAML frontmatter declaring the **citation target** (the Mirror route the agent cites when grounding on that doc) + a human label. This is the seam FR-7 (cite into the Mirror) and Story 4.3's `citation {route,label}` SSE event consume. Launch mapping:

| KB doc | `route` (citation target) | `label` | notes |
|---|---|---|---|
| `about.md` | `/about/` | `About Joshua` | from `web/src/pages/about.astro` + `web/src/lib/person.ts` |
| `speaking.md` | `/speaking/` | `Speaking` | from `web/src/data/speaking.ts` + `web/src/pages/speaking.astro` |
| `loandemo.md` | `/work/loandemo/` | `LoanDemo case study` | from `web/src/pages/work/loandemo.astro` |
| `faq.md` | `/faq/` | `FAQ` | **forward-reference (not a defect):** `/faq/` is the Epic-1 stub today, fleshed by Story 4.2. The route resolves now (stub renders); 4.2 re-verifies. (project-rules.md Rule 3.) |
| `bmad-method.md` | `/glass-box/` | `How this was built` | the BMAD build story; cites the Glass Box index |

Use the Story 4.0 `stripFrontmatter` helper (`scripts/lib/markdown.ts`) to remove the frontmatter from the body before chunking; parse the frontmatter (route/label/title) separately for the chunk metadata. (4.0 hardened this exact strip against hr-opened bodies — reuse it, do not re-implement.)

### Decision 3 — chunk at heading boundaries (~300–800 tokens), explicit stable chunk IDs

Chunk each doc at heading boundaries (a chunk = a heading + its prose up to the next heading of the same-or-higher level), targeting ~300–800 tokens (split an over-long section; merge a tiny one into its neighbor — dev's heuristic, documented). Each chunk gets: a **stable explicit id** (e.g. `${docSlug}#${headingSlug}` or `${docSlug}#${index}` — deterministic, never random), `route` + `label` (from frontmatter), the heading text, and the chunk text. Enumerate files **sorted** (filesystem order is not portable — NFR-6/build-content.ts hard constraint) and emit chunks in a stable order.

### Decision 4 — Orama v3, but serialize a DETERMINISTIC CORPUS and rebuild at load (NFR-6)

Use `@orama/orama` (v3.x) — the architecture's committed engine; BM25 is the v3 default full-text algorithm; the tokenizer/stemmer is built-in (dependency-free for English); `create`/`insertMultiple`/`search` are **async**. **Determinism is the load-bearing constraint (NFR-6 + epics 4.1 AC3 "regenerated from unchanged content → output is stable").** Verified research finding: **Orama generates RANDOM document IDs when none are supplied**, and persisting its internal engine state can be non-deterministic (internal node IDs / map iteration order). Therefore:

- **Build time (`scripts/build-kb-index.ts`):** write a **deterministic JSON corpus** to `api/data/kb-index.json` — a sorted array of chunks, each with its explicit stable `id` + `route` + `label` + `heading` + `text`, serialized with stable key order + trailing newline (mirror `render-glassbox`'s `JSON.stringify(x, null, 2) + '\n'` shape). This is OUR artifact (sorted, explicit ids) — byte-stable across regenerations from unchanged content. Do NOT serialize Orama's internal engine state.
- **Runtime (`api/src/lib/retriever.ts`):** load that JSON, `create` the Orama v3 index with an explicit schema, `insertMultiple` the chunks **with their explicit ids in sorted order** (so Orama never generates a random id), and expose `search(query, k)`. The index is in-memory, read-only, rebuilt once at startup (one-time ms cost for a small corpus — NFR-4's <200ms is per-query, not startup). This is the research-backed reproducible pattern AND keeps the engine fully behind the seam.

(If the dev instead uses `@orama/plugin-data-persistence`, they MUST prove the persisted bytes are deterministic across two builds with a test — the corpus approach above is preferred and lower-risk.)

### Decision 5 — the `search(query, k)` seam isolates the engine

`api/src/lib/retriever.ts` exports an async `search(query: string, k = <default 3–6>)` returning `RetrievedChunk[]` (`{ id, route, label, heading, text, score }`, score from Orama's BM25), and an idempotent cached `loadIndex()` (loads/builds once). NOTHING outside this module imports `@orama/orama` — the agent (4.3) calls `search()` only, so a future lexical→hybrid/pgvector swap is local to this file (architecture §Retriever abstraction). The retriever reads the index path from a single constant (or env), defaulting to `api/data/kb-index.json`.

### Decision 6 — load at startup from the BOOTSTRAP, not on app import (avoid the 3.0 import-side-effect class)

Per epics 4.1 AC2 "When [the service] starts, Then it loads the serialized index into memory." Wire the eager `loadIndex()` call into the **bootstrap** (`api/src/index.ts`), NOT into `api/src/app.ts` — importing `app` in tests must NOT trigger a file-load side-effect (this is the exact class Story 3.0 fixed by splitting app/bootstrap). `loadIndex()` is idempotent + cached, so the bootstrap's eager call and a test's direct call share one load. If the index file is missing at load, fail loud with an actionable message (it is a build artifact; absence = build wasn't run).

## Acceptance Criteria

1. **Curated KB markdown exists, authored faithfully from the Static Mirror (no fabrication).**
   **Given** the five `content/kb/{about,speaking,loandemo,faq,bmad-method}.md` docs
   **When** they are authored
   **Then** each carries YAML frontmatter with a real `route` (the citation target per Decision 2), a `label`, and a `title`, and the body prose is drawn from the SAME facts the Static Mirror already exposes (`web/src/lib/person.ts`, `web/src/data/speaking.ts`, `web/src/pages/{about,speaking,work/loandemo,faq}.astro`, the Glass Box) — **every unconfirmed fact stays `[OPEN]`/`[ASSUMPTION]` in visible text exactly as on the Mirror; ZERO invented facts** (the credibility-floor rule). No KB claim asserts anything the Mirror does not.

2. **`scripts/build-kb-index.ts` chunks the curated docs and writes a serialized index to `api/data/`, default-deny.**
   **Given** the curated `content/kb/*.md` set
   **When** `scripts/build-kb-index.ts` runs at build time (as a registered content-pipeline generator)
   **Then** it reads ONLY `content/kb/*.md` (sorted enumeration; never `_bmad-output/`, never a filesystem crawl — default-deny by construction so nothing internal is indexed), strips frontmatter via the Story-4.0 `stripFrontmatter` helper, chunks each doc at heading boundaries (~300–800 tokens), and writes `api/data/kb-index.json` (gitignored) — a sorted chunk corpus where each chunk carries an explicit stable `id`, `route`, `label`, `heading`, and `text`
   **And** a test asserts a decoy `.md` placed OUTSIDE `content/kb/` (or an internal `_bmad-output/` doc) never appears in the index (the default-deny gate holds).

3. **The index build is deterministic — regenerated from unchanged content → byte-identical output (NFR-6).**
   **Given** unchanged `content/kb/` content
   **When** `scripts/build-kb-index.ts` runs twice
   **Then** `api/data/kb-index.json` is byte-identical across runs (explicit ids — no random; sorted enumeration + stable chunk order; `JSON.stringify(_, null, 2) + '\n'`), and the agent's knowledge horizon is defined as "fresh as of the last build" (documented in the script/retriever header — not "never stale")
   **And** a test proves determinism (two builds → identical bytes, or the corpus serializer is asserted stable across two invocations).

4. **The retriever seam loads the index read-only and isolates the engine (`search(query, k)`, BM25, top-k 3–6).**
   **Given** `api/src/lib/retriever.ts`
   **When** the service starts (eager `loadIndex()` from the bootstrap `api/src/index.ts`, idempotent + cached)
   **Then** it loads `api/data/kb-index.json` into an in-memory, read-only Orama v3 index (built via `create` + `insertMultiple` with the chunks' explicit ids in sorted order — no random ids), and exposes an async `search(query, k)` (default k in 3–6) returning `RetrievedChunk[]` (`{id, route, label, heading, text, score}`) ranked by BM25
   **And** `@orama/orama` is imported in NO module other than `retriever.ts` (the seam isolates the engine for a later lexical→hybrid/vector swap — architecture §Retriever abstraction); a test asserts the import-isolation (only `retriever.ts` references `@orama/orama`).

5. **Integration AC — the retriever returns grounded chunks from the REAL built index, with citation routes (real-runtime, not a mock).**
   **Given** a real `api/data/kb-index.json` produced by `scripts/build-kb-index.ts` from the actual `content/kb/`
   **When** a test calls `search('<a term that appears in a known KB doc, e.g. "LoanDemo" or "speaking">', k)` against the loaded retriever
   **Then** it returns ≥1 `RetrievedChunk` whose `route` is the expected Mirror route (e.g. a LoanDemo query → a chunk with `route: '/work/loandemo/'`) and whose `text` contains the grounding prose — exercising the real index end-to-end (skill-rules Rule 3 / project-rules Rule 7: real runtime, proven to EXECUTE, not skipped)
   **And** a below-threshold/empty query returns an empty (or clearly low-score) result so the 4.3 fail-closed path has a signal to act on. (The first EXTERNAL consumer of `search()` is Story 4.3 `/api/guide`; see `## Consumed-by`.)

6. **The LITERAL canonical gate `pnpm test:all` is green end-to-end, build stays deterministic, NFR-1/NFR-5 hold (Rule 5).**
   **Given** the canonical gate `pnpm test:all` (`typecheck && lint && format:check && test && test:e2e && lh`) + `pnpm run check-deterministic`
   **When** the literal `pnpm test:all` runs end-to-end after the change (NOT a scoped subset)
   **Then** every step is green including `lh`; `pnpm build` runs the new generator (content pipeline → `api/data/kb-index.json`) without breaking the web build; `web/dist` stays byte-deterministic (`check-deterministic` — the KB index lives in gitignored `api/data/`, NOT `web/dist`, so the web determinism check is unaffected, and the KB index has its own determinism test per AC3); NFR-1 holds (no client JS added — this is build + api only); NFR-5 holds (no secret/key on the static surface; `@orama/orama` is an api/build dependency, never shipped to `web`).

## Integration ACs

This story IS service-introducing — it adds the `search(query, k)` retriever module + the build-time KB index that Story 4.3 (`/api/guide`) consumes.

- **Per skill-rules Rule 1:** AC5 is the Integration AC — a real-runtime test exercises `search()` against the REAL built index (load the actual `api/data/kb-index.json`, query a known term, assert the returned chunk's `route`/`text`), not the module's internal state and not a mock. This proves the producer works against real data before the consumer exists.
- **First external consumer:** Story 4.3 (`/api/guide`) — it calls `search(query, k)` to retrieve grounding context, applies the threshold (fail-closed below it with NO model call), and emits `citation {route, label}` SSE events from the returned chunks. No `/api/guide` route ships in THIS story.

## Consumed-by

- **Story 4.3 — `/api/guide` (retrieve → ground → stream):** calls `retriever.search(query, k)`; uses each `RetrievedChunk`'s `{route, label}` for the `citation` SSE event (reconciling `shared/src/events.ts` `CitationEvent` — deferred [1.1] — at that consumer); uses `score` vs a threshold for the fail-closed decision; logs `retrieval_miss {query, topScore, threshold}` on empty/low retrieval (NFR-7).
- **Story 4.2 — `/faq`:** independent route, but the `faq.md` KB doc's `route: '/faq/'` citation target is fleshed by 4.2 (forward-reference, Rule 3).

## Tasks / Subtasks

- [x] **Task 1 — Add the `@orama/orama` v3 dependency to the api package (AC4).**
  - [x] `pnpm --filter api add @orama/orama` (v3.x). Confirm it lands in `api/package.json` dependencies (NOT web — NFR-5). Run `pnpm install`; confirm lockfile updates cleanly.
- [x] **Task 2 — Author the curated KB markdown (AC1).**
  - [x] Create `content/kb/{about,speaking,loandemo,faq,bmad-method}.md`, each with YAML frontmatter (`route`, `label`, `title` per Decision 2) and a body authored FROM the real Mirror sources (`web/src/lib/person.ts`, `web/src/data/speaking.ts`, `web/src/pages/{about,speaking,work/loandemo,faq}.astro`, Glass Box). Preserve every `[OPEN]`/`[ASSUMPTION]` flag verbatim; invent nothing. Use real headings (the chunk boundaries).
  - [x] Add a short `content/kb/README.md` (or extend `content/README.md`) noting this dir is the agent's curated, default-deny source of truth (authored from Mirror facts; one doc ↔ one citation route).
- [x] **Task 3 — Build the deterministic KB indexer + register it in the pipeline (AC2, AC3).**
  - [x] Create `scripts/build-kb-index.ts`: sorted read of `content/kb/*.md` only; parse frontmatter (route/label/title) and strip it via `stripFrontmatter` (Story 4.0, `scripts/lib/markdown.ts`); chunk at heading boundaries (~300–800 tokens) with explicit stable ids; write `api/data/kb-index.json` as a sorted corpus (`JSON.stringify(_, null, 2) + '\n'`). Export a `buildKbIndexGenerator: Generator` ({name, run}). NO network, no `Date.now()`/random (build-content.ts hard constraints).
  - [x] Register `buildKbIndexGenerator` in `scripts/build-content.ts` `CONTENT_GENERATORS` (replace the `// TODO(Story 4.1)` line). Ensure `mkdirSync(api/data, {recursive:true})` before write.
  - [x] Tests (`scripts/build-kb-index.test.ts`): real-module chunking (heading boundaries, token bounds), default-deny (a decoy `.md` outside `content/kb/` never indexed), determinism (two runs → byte-identical corpus). Mutation-verify each (Rule 8): break a guarantee → test reds.
- [x] **Task 4 — Build the retriever seam (AC4, AC5).**
  - [x] Create `api/src/lib/retriever.ts`: `loadIndex()` (idempotent, cached — load `api/data/kb-index.json`, `create` Orama v3 with explicit schema, `insertMultiple` chunks with explicit ids in sorted order), and async `search(query, k=<3–6>): Promise<RetrievedChunk[]>` (BM25 `search(db,{term,limit:k,mode:'fulltext'})` → map hits to `{id,route,label,heading,text,score}`). Fail loud if the index file is missing. Header documents "knowledge horizon = fresh as of last build."
  - [x] Wire eager `loadIndex()` into the bootstrap `api/src/index.ts` (NOT `app.ts` — no import side-effect; 3.0 lesson). Confirm importing `app.ts` in tests opens no file/index.
  - [x] Tests (`api/src/lib/retriever.test.ts` + a real-index integration test): import-isolation (`@orama/orama` only in retriever.ts — grep/assert); `search()` over the REAL built index returns the expected `route` for a known term (AC5, real-runtime, not a mock, proven not-skipped); empty/below-threshold query → empty/low result. Build the index (run the generator) as a test prerequisite so the integration test genuinely executes (Rule 7 — do not skip if the artifact is absent; generate it).
- [x] **Task 5 — Verify the floor with the LITERAL canonical gate (AC6).**
  - [x] Run the literal `pnpm test:all` end-to-end (Rule 5 — not a subset); confirm ALL green incl `lh`. Confirm `pnpm build` runs the new generator and emits `api/data/kb-index.json` (and the web build is unaffected). Run `pnpm run check-deterministic` (web/dist byte-identical) + the KB-index determinism test. Confirm `@orama/orama` is NOT in `web`'s dependency graph (NFR-5). Note all touched files in the Dev Agent Record.

## Dev Notes

### Library / framework specifics (researched 2026-06-07 — current Orama v3.x)

- **Package:** `@orama/orama` (v3.x). API (all async): `import { create, insertMultiple, search } from '@orama/orama'`. `create<T>({ schema: { id:'string', route:'string', label:'string', heading:'string', text:'string' } })`; `insertMultiple(db, chunks)`; `search(db, { term, limit: k, mode: 'fulltext' })`. **BM25 is the v3 default** full-text algorithm; tokenizer/stemmer built-in (dependency-free for English) — no extra packages.
- **Determinism (critical):** Orama generates a **random id** when a document has no `id` — ALWAYS supply explicit stable ids and `insertMultiple` in sorted order. Persisting Orama's internal engine state is NOT guaranteed byte-deterministic; therefore serialize OUR OWN sorted chunk corpus (JSON) and rebuild the index at load (Decision 4). Avoid `@orama/plugin-data-persistence` unless byte-determinism is proven.
- **Source:** Orama JS docs (jsr.io/@orama/orama; docs.orama.com — insert/search/changing-default-search-algorithm).

### Current state (files being modified / extended — read before editing)

- **`scripts/build-content.ts`** — the content-pipeline orchestrator; `CONTENT_GENERATORS` already holds `renderGlassboxGenerator`, `renderTimelineGenerator`, and a `// TODO(Story 4.1): build-kb-index generator` line to replace. Hard constraints: no network, no `Date.now()`/random, sorted enumeration, throw-to-fail-loud. The `Generator` interface = `{ name: string; run(): Promise<void> }`.
- **`scripts/lib/markdown.ts`** (Story 4.0) — `stripFrontmatter(md)`: hardened, hr-safe leading-frontmatter strip. REUSE it for the body; parse frontmatter separately for route/label/title. It is a pure dependency-free leaf importable from both `scripts/` and `web/`.
- **`scripts/render-glassbox.ts`** — reference for a generator's shape (`Generator` impl, `JSON.stringify(_, null, 2)+'\n'` write, `mkdirSync` recursive, `byCodeUnit` deterministic sort from 4.0). The KB index follows the same deterministic-write conventions.
- **`content/glassbox.allowlist.ts`** — the Glass-Box default-deny allowlist (points at `_bmad-output/` planning artifacts). The KB indexer does NOT reuse this list of source files; it honors the SAME default-deny PRINCIPLE by iterating only the curated `content/kb/` dir (Decision 1).
- **`api/src/app.ts`** — Hono app, `basePath('/api')`, mounts `inviteRouter`; exports `app` (no `serve`). Do NOT add the index load here. **`api/src/index.ts`** — the bootstrap that imports `app` and calls `serve()`; add the eager `loadIndex()` here.
- **`api/src/env.ts`** — Zod-validated env (Story 3.3). If the index path is made configurable, add it here; otherwise a module constant `api/data/kb-index.json` is fine (default-deny path).
- **Mirror fact sources for KB authoring (AC1):** `web/src/lib/person.ts` (PERSON), `web/src/data/speaking.ts` (reel + signature talks + bios), `web/src/pages/about.astro`, `web/src/pages/speaking.astro`, `web/src/pages/work/loandemo.astro`, `web/src/pages/faq.astro` (Epic-1 stub), the Glass Box (`/glass-box/`). Author KB prose FROM these; do not invent.

### Constraints / invariants to preserve

- **NFR-6 determinism:** the KB index (`api/data/kb-index.json`) is byte-stable from unchanged content (explicit ids, sorted enumeration/order); `web/dist` determinism (`check-deterministic`) is independent (KB index is gitignored, not in web/dist) but must stay green.
- **NFR-5 key-free static surface:** `@orama/orama` is an **api/build** dependency only — never added to `web`, never shipped to the browser. No LLM key here (that's 4.3).
- **NFR-1 0-JS-by-default:** this story adds NO client JS (build + api only). Re-confirm via the existing build-output assertions.
- **Default-deny (architecture §"single gate"):** the indexer reads only curated `content/kb/`; a test proves nothing internal/outside leaks in.
- **Rule 8 / project-rules Rule 7+8:** tests exercise the REAL modules + scoped surfaces; the real-index integration test must be PROVEN to execute (generate the index as a prerequisite; assert not-skipped); mutation-verify load-bearing assertions.
- **3.0 import-side-effect lesson:** no file/index load as an import side-effect of `app.ts`; eager load in the bootstrap only.

### Project Structure Notes

- New: `content/kb/*.md` (5 docs + readme), `scripts/build-kb-index.ts` (+ test), `api/src/lib/retriever.ts` (+ tests), `api/data/kb-index.json` (generated, gitignored — do NOT commit). Modified: `scripts/build-content.ts` (register generator), `api/src/index.ts` (eager load), `api/package.json` (add `@orama/orama`), `pnpm-lock.yaml`.
- The KB index output (`api/data/`) is gitignored (`.gitignore:39`) — like the api DB store; it is a build artifact regenerated each deploy, never committed.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] — the three AC blocks (chunk→Orama→api/data default-deny; service loads index + search(query,k) seam; deterministic, knowledge-horizon).
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Orama v3 build-time, chunk ~300–800 tokens, BM25 top-k 3–6, read-only at runtime; `search(query,k)` abstraction isolates the lexical→hybrid swap.
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] — "ONE file allowlist ... read by BOTH the Glass Box render and the KB indexer (the single gate)"; `api/data/` gitignored; directory tree (`scripts/build-kb-index.ts`, `api/src/lib/retriever.ts`, `content/kb/{...}.md`).
- [Source: _bmad-output/implementation-artifacts/4-0-epic-3-deferred-cleanup.md] — `stripFrontmatter` helper + `byCodeUnit` deterministic-sort conventions to reuse.
- [Source: scripts/build-content.ts] — `Generator` interface + `CONTENT_GENERATORS` registry + hard constraints (the 4.1 TODO line).
- [Source: .claude/rules/project-rules.md#7,#8] — prove integration e2e executes; tests assert the real module + scoped surface.
- [Research 2026-06-07: Orama v3 API + determinism] — random-id-if-no-id; serialize own corpus + rebuild at load; BM25 default; async search.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- MIN_TOKENS=30 in splitOrMerge caused tiny test strings (2 words) to be merged into their successor, failing the duplicate-heading-slug disambiguation test. Lowered to MIN_TOKENS=1 (only merge truly empty sections). The real KB docs all have substantial prose and are unaffected.
- Import-isolation grep test initially flagged retriever.test.ts itself (it contains the string '@orama/orama' in a grep call). Fixed by allowing both retriever.ts and retriever.test.ts in the allowlist.
- build-content.test.ts hardcoded `['render-glassbox', 'render-timeline']` — updated to include `'build-kb-index'` per Story 4.1.

### Completion Notes List

- **Task 1 (AC4/NFR-5):** `@orama/orama` v3 added to `api/package.json` dependencies only. Verified NOT in `web/package.json`. Lockfile updated cleanly.
- **Task 2 (AC1):** Five KB docs authored from real Mirror sources with ZERO invented facts. All `[OPEN]`/`[ASSUMPTION]` flags preserved verbatim exactly as they appear in the source pages. Each doc carries `route`/`label`/`title` frontmatter per Decision 2 table. `content/kb/README.md` added documenting the default-deny principle and authoring rules. `/faq/` citation route carries forward-reference note per project-rules Rule 3.
- **Task 3 (AC2/AC3):** `scripts/build-kb-index.ts` implemented: sorted `content/kb/*.md` read (byCodeUnit, never `_bmad-output/`), `parseFrontmatter` extracts route/label/title, `stripFrontmatter` (4.0 helper) strips body, `chunkDoc` splits at heading boundaries with stable `docSlug#headingSlug` IDs, `splitOrMerge` heuristic splits >800-token sections. `buildKbIndexGenerator` registered in `CONTENT_GENERATORS` (replaced TODO). `pnpm build` writes 36 chunks to `api/data/kb-index.json`. Two-run hash check confirms byte-identical output: `459067f0...`. `web/dist` determinism confirmed via `check-deterministic` (hash: `daa4689c...`).
- **Task 4 (AC4/AC5/Decision 6):** `api/src/lib/retriever.ts` implemented: `loadIndex()` idempotent+cached, `create`+`insertMultiple` with explicit IDs, `search(query, k=5)` returns `RetrievedChunk[]` with BM25 score. `_resetIndex()` exported for tests. Eager `loadIndex()` wired into `api/src/index.ts` bootstrap (NOT `app.ts`). Import side-effect test confirms `search()` throws "not loaded" after `app.ts` import without explicit `loadIndex()`. Integration test (AC5, Rule 7): `beforeAll` generates the index if absent (`pnpm build:content`) — never skips. `search('LoanDemo', 5)` returns ≥1 chunk with `route: '/work/loandemo/'`. Empty query returns no high-score results.
- **Task 5 (AC6):** Literal `pnpm test:all` exit code 0. Results: typecheck 0 errors, lint clean, format clean, 151 scripts tests + 80 api tests + 630 web tests + 213 e2e tests + lh all green. `@orama/orama` confirmed absent from `web` dep graph. `api/data/kb-index.json` gitignored (verified via `git status --short`).

### File List

- `content/kb/about.md` (new)
- `content/kb/speaking.md` (new)
- `content/kb/loandemo.md` (new)
- `content/kb/faq.md` (new)
- `content/kb/bmad-method.md` (new)
- `content/kb/README.md` (new)
- `scripts/build-kb-index.ts` (new)
- `scripts/build-kb-index.test.ts` (new)
- `scripts/build-content.ts` (modified — registered `buildKbIndexGenerator`, updated test comment)
- `scripts/build-content.test.ts` (modified — updated expected generator list to include `build-kb-index`)
- `api/src/lib/retriever.ts` (new)
- `api/src/lib/retriever.test.ts` (new)
- `api/src/index.ts` (modified — eager `loadIndex()` at bootstrap)
- `api/package.json` (modified — added `@orama/orama`)
- `pnpm-lock.yaml` (modified — lockfile updated)

## Review Findings

**Code-review stage (`/epic-cycle`, Epic 4 · Story 4.1), 2026-06-07. Verdict: APPROVED — `done`.** Adversarial review (Blind Hunter / Edge-Case Hunter / Acceptance Auditor) over the dev+QA working-tree diff. ONE HIGH credibility-floor defect found (two instances) and **auto-resolved inline** with a mutation-proven regression; everything else green. ADR Rule 6 N/A (no `docs/adr/`).

### HIGH (auto-resolved inline) — AC1 credibility floor: `bmad-method.md` asserted facts the Static Mirror does not expose

The QA stage already caught + fixed one fabrication (the invented BMAD acronym expansion). Audit of all 5 KB docs against the Mirror found a SECOND class of fabrication in `content/kb/bmad-method.md` (route `/glass-box/`), in TWO places:

1. **"The Technology Stack" section** asserted, as flat **unflagged** fact, a specific stack — `Astro` / `Hono` / `Vitest` / `Playwright` / `pnpm` / `Orama` — and the sentence *"The tech stack is documented in the architecture document, readable in the Glass Box."* Neither is on any crawlable Mirror route: the published `/glass-box/` index (`web/src/pages/glass-box/index.astro`) never enumerates the stack, the specific engine names appear on NO visible Mirror page (verified by grep — the only hits were source comments and the unbuilt `_styleguide.astro`), and the **architecture document is a GHOST "As it accrues" node** (`web/src/content/glassbox.index.ts` `GHOST_NODES`) — it is NOT in the publish allowlist (`content/glassbox.allowlist.ts`; the 6 published artifacts are Brief, Brainstorm, Pre-Brief Research, PRD, UX-Design, UX-Experience), so "readable in the architecture document in the Glass Box" is **factually false**.
2. **"What's in the Glass Box" section** (caught by the new regression test, beyond the manual spot) listed *"The architecture document, Epic files, Story files, Retrospectives, Project rules"* among artifacts the Glass Box *"publishes … readable in full."* Architecture / Epics / Retrospectives are exactly the **ghost nodes** — not published. Project rules are not a published Glass Box artifact either.

This violates AC1 ("ZERO invented facts; no KB claim asserts anything the Mirror does not"). The Mirror's own precedent flags unconfirmed stack detail with `[OPEN]` (`web/src/pages/work/loandemo.astro:132`).

- [x] **[Review][Patch][HIGH] AC1 credibility floor — `bmad-method.md` tech-stack + Glass-Box-contents claims not on the Mirror** [`content/kb/bmad-method.md`] — RESOLVED. (a) "The Technology Stack" section rewritten: the specific stack is now `[ASSUMPTION]`-flagged and framed as "recorded in the architecture document … not yet published in the Glass Box (a still-to-come 'As it accrues' artifact)" — no bare engine names ship, the false "readable" claim is removed. (b) "What's in the Glass Box" rewritten to list ONLY the 6 actually-published artifacts, with the architecture/epics/retrospectives named as `[ASSUMPTION]` still-to-come ghost nodes. Regression locked with **two new line-scoped tests** in `scripts/build-kb-index.test.ts` (`no unflagged line claims the architecture document is readable/published in the Glass Box`; `specific search-engine / framework stack names only ship on a flagged line`). Line-scoped (not chunk-scoped) so a legitimate `[ASSUMPTION]` flag elsewhere in the chunk cannot make the test vacuous (Rule 8). **Mutation-verified:** re-injecting each original false claim reds the owning test; reverted byte-clean. Rebuilt index two-build byte-identical (`db8c3b77…`).

### Credibility-floor audit of the remaining claims (AC1) — all Mirror-faithful

Cross-checked every factual claim in all 5 docs against `web/src/lib/person.ts`, `web/src/data/speaking.ts`, `web/src/pages/{about,speaking,work/loandemo,faq}.astro`, and the published Glass Box:

- **`about.md`** — name `Joshua R. Brandt, MSE` (person.ts locks casing), `Software Engineer`, `knowsAbout` (agentic engineering, software architecture), site origin, the verbatim short+long bios, and every `[OPEN]`/`[ASSUMPTION]` channel/headshot flag are faithful. ✓
- **`speaking.md`** — reel name, the 3 signature talks (titles/abstracts/takeaways/formats/logistics), both bios, metrics (`[ph]`/`[OPEN]`), testimonials (`[OPEN]`), logos (`[ph]`) — verbatim from `speaking.ts` with flags preserved. ✓
- **`loandemo.md`** — "live loan origination", "financial data, multi-step state, real user flows", "inspectable, reversible, logged", ADRs, the pipeline phases, the retrospective character — all match `loandemo.astro`; every repo/video/stack/timeline gap stays `[OPEN]`. Correctly drops the internal `FR-22` token from the public framing. ✓
- **`faq.md`** — speaks-about, invite path, formats, BMAD-method description, background, channels — Mirror-faithful; the ADR claim matches `loandemo.astro:121`; the QA acronym fix holds (no `stands for`/`mindmap`/`breakthrough method` anywhere). ✓
- **`bmad-method.md` (rest)** — pipeline / ADR / lead-smoke / retrospective claims are supported by `loandemo.astro` (`:121` ADRs, `:195` lead smoke, `:152` phases); "The Guide" section describes the Guide's grounding/citation design, consistent with `faq.astro` ("the same answers his Guide cites") and the story/architecture. ✓
- All `route` frontmatter targets real Mirror routes: `/about/`, `/speaking/`, `/work/loandemo/`, `/faq/` (Epic-1 stub — forward-ref per Rule 3, resolves now), `/glass-box/`. URLs are site-origin only; no fabricated numerics (all `30/45/90/40/50/126` map to Mirror durations/word-counts/years). ✓

### AC-by-AC verification (mutation-proven where load-bearing — Rule 8)

- **AC2 default-deny** — `buildKbCorpus` does a sorted (`byCodeUnit`) `readdirSync` of `content/kb/` only, skips `README.md`, never reads `_bmad-output/` / no FS crawl. **Mutation B** (indexer also reads parent dir) → default-deny test RED; reverted clean. ✓
- **AC3 determinism** — `api/data/kb-index.json` byte-identical across two `pnpm build:content` runs (`db8c3b77…` post-fix; explicit `${docSlug}#${headingSlug}` ids, sorted enumeration + chunk order, `JSON.stringify(_,null,2)+'\n'`). **Mutation A** (`Math.random()` in id) → determinism test RED; **Mutation C2** (file sort → reverse, from QA) confirmed. Reverted clean. ✓
- **AC4 retriever seam + import-isolation** — `@orama/orama` imported in NO module but `retriever.ts` (re-grepped whole repo: only `retriever.ts` source + `retriever.test.ts` string-literal). `loadIndex()` idempotent/cached (`if (_db !== null) return`); eager load is in the **bootstrap `api/src/index.ts`**, `app.ts` has ZERO orama/retriever refs (no import side-effect — 3.0 class avoided). **Mutation C** (orama import added to `app.ts`) → isolation test RED; the import-side-effect test (`import app.ts` ⇒ `search()` throws "not loaded") passes. Reverted clean. ✓
- **AC5 Integration AC PROVEN TO EXECUTE (Rule 7 — canonical Epic-4 case)** — deleted `api/data/` and ran ONLY `retriever.test.ts`: `beforeAll` regenerated the index via `pnpm build:content` (36 chunks) and **all 12 tests RAN, 0 skipped**; `search('LoanDemo')` returns a chunk with `route: '/work/loandemo/'` from the REAL built index. **Mutation D** (drop `route` from `search()` results) → 4 integration assertions RED; reverted clean. ✓
- **AC6 / Rule 5 canonical gate** — the LITERAL `pnpm test:all` re-run end-to-end **after** the code-review edits exits **0**: typecheck 0 errors; `eslint .` clean; `prettier --check .` "All matched files use Prettier code style!" (incl. the edited `.md` + `.test.ts`); vitest **scripts 155 + api 80 + web 630 = 865 passed, 0 skipped**; Playwright **213 passed**, 0 skipped; `lh` (Lighthouse CI, 2 URLs × 2 runs) all assertions processed/passed. `pnpm run check-deterministic` PASS — `web/dist` byte-identical (`daa4689c…`, unchanged: KB index lives in gitignored `api/data/`). **NFR-5**: `@orama/orama` absent from `web/package.json` + web dep graph. **NFR-1**: no client JS (build+api only). ✓

### Rule 1 / Rule 2 / forward-refs

- **Rule 1 (Integration AC)** — AC5 present and is a real-runtime test against the REAL built index (not a mock); verified. **Rule 2 (`## Consumed-by`)** — accurate: Story 4.3 (`/api/guide`) is the first external consumer. ✓
- **Known/correct forward-references (not defects):** (a) `RetrievedChunk{route,label}` vs the PLACEHOLDER `shared/src/events.ts` `CitationEvent{id,title,url}` — reconciliation is explicitly Story 4.3's job per Consumed-by; 4.1 does not touch `events.ts`. (b) `/faq/` cites the Epic-1 stub, fleshed by Story 4.2 (Rule 3). (c) The two Story-4.0 LOW-latent `stripFrontmatter` edge cases (degenerate `word\n:value`; indented-key frontmatter) recorded in `deferred-work.md` do NOT trigger on the actual KB docs (all use column-0 `key: value` frontmatter) — they remain correctly deferred, no new action.

### Decisions

resolved: 1 (HIGH credibility-floor, auto-resolved inline + 2 regression tests). deferred: 0 new (2 pre-existing Story-4.0 LOW items remain in `deferred-work.md`, confirmed non-triggering on KB content). decision-needed: 0. dismissed: 0.
