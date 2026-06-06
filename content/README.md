# `content/` — the curated source of truth (code-as-CMS)

This directory is the site's **single source of truth for curated content**. It
is plain files in git — there is **no CMS and no admin surface**. Content is
edited as code here, reviewed in pull requests, and turned into the live site by
the **build-time content pipeline** (`scripts/build-content.ts`, run by
`pnpm build` before `astro build`). See architecture.md §AR-9, FR-33 (single git
source of truth; build-time generation; no CMS; no runtime external reads) and
NFR-6 (maintainability; deterministic regeneration).

## Why code-as-CMS

- **One source of truth.** Everything the site says about Josh lives in the repo
  — versioned, diffable, reviewable. No external database, no headless CMS.
- **No runtime external reads.** The site never fetches from GitHub, YouTube,
  Suno, or any third party at request time. Anything sourced from those is
  **curated into this directory** (or another committed location) and rendered at
  build time, so the live site never depends on a third party being up.
- **Deterministic regeneration (NFR-6).** The same repo state rebuilds to a
  byte-identical site. The pipeline introduces no wall-clock / random
  nondeterminism and sorts any directory enumeration; any timestamp is derived
  from git (the committer date, like `web/src/lib/lastmod.ts`).

## What lands here (later epics — not pre-created now)

Story 1.8 establishes this directory + the pipeline scaffold only. The actual
curated content arrives with its epic:

- `content/kb/*.md` — the Guide's knowledge base, chunked at headings. Indexed by
  `scripts/` → `api/data/` (the KB index) in **Story 4.1**. (A `.gitkeep` holds
  the `kb/` folder until then.)
- `content/glassbox.allowlist.ts` — the **default-deny** publish allowlist
  (AR-13): the one gate deciding which real `_bmad-output/` artifacts the Glass
  Box may surface. Read by both the Glass Box render and the KB indexer. Arrives
  in **Story 2.1**.
- `content/timeline/dots.ts` — the hand-curated Stage-1 Master Timeline "dots"
  manifest (FR-16). Arrives in **Epic 2**.

Do **not** add the above ahead of their stories — this README documents the
convention; the content itself is each epic's deliverable.

## Adding a project (Project Import)

The documented path for wiring a new project into the site is
[`docs/project-import.md`](../docs/project-import.md). Follow it — it is the
**code-as-CMS engineering flow** (a `/bmad-correct-course` or new story → dev
→ PR → deploy), not a CMS or admin step.

The import has **three wiring points**, all in this directory:

1. **`content/kb/*.md`** — add the project's Guide KB markdown (agent-retrievable
   once Epic 4 / Story 4.1 ships the KB indexer).
2. **`content/timeline/dots.ts`** — add a hand-curated Dot / flagship cluster to
   `TIMELINE_ERAS` (Stage 1; no automated harvest — that is Stage 2 / Epic 6).
3. **`content/glassbox.allowlist.ts`** — allowlist the project's publishable
   artifacts (default-deny: only listed files ever render in the Glass Box).

After wiring the three points, run `pnpm build` (deterministic regeneration) and
`scripts/deploy.sh`. See [`docs/project-import.md`](../docs/project-import.md)
for the full step-by-step path.

## Conventions

- **Determinism:** never introduce `Date.now()`, `Math.random()`, or argless
  `new Date()` into generated output. Sort globs/dir reads.
- **Generated outputs are gitignored.** The pipeline writes derived artifacts
  (e.g. the KB index) to gitignored locations such as `api/data/`. Nothing
  generated is committed — only the curated _source_ in this directory is.
- **No secrets here.** This directory is curated public content.
