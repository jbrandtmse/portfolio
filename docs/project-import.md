# Project Import — adding a new project to the portfolio

This document describes the **Project Import path**: the step-by-step engineering
flow that wires a new project's content into the three source-of-truth surfaces
and regenerates the site deterministically. There is no CMS and no admin
surface — adding a project is a code change, reviewed in a PR, built by the
pipeline (FR-33, FR-34).

## Framing: engineering flow, not CMS

Every project addition follows a standard **`/bmad-correct-course` (or new
epic/stories) → dev → PR review → deploy** cycle:

1. Open a `/bmad-correct-course` to propose the project content change (or
   create a dedicated story/epic for a large project).
2. Implement the three wiring points below (Tasks 1–4 of the import).
3. Run `pnpm build` (deterministic regeneration) and verify.
4. Merge the PR.
5. Run `scripts/deploy.sh` on the VM.

Nothing is administered at runtime. The repo is the single source of truth
(FR-33). The same git state always rebuilds to a byte-identical site (NFR-6).

---

## The three wiring points

Every project plugs into exactly three curated data structures. Wire them in
order.

### Wiring point 1: `content/kb/*.md` — the Guide Knowledge Base

Add one or more Markdown files under `content/kb/` documenting the project
in a form the future Guide agent (Epic 4 / Story 4.1) can retrieve. Each file
should cover a coherent chunk of the project (e.g. overview, technical
decisions, retrospective learnings).

**Rules:**
- File names: `<project-slug>-<topic>.md` (kebab-case).
- Content: factual, curated prose. Flag anything not yet confirmed:
  `[OPEN: …]` for unknowns, `[ASSUMPTION: …]` for inferences. Never fabricate
  metrics, dates, or URLs.
- These files are NOT rendered directly to any page today (that is Epic 4 /
  Story 4.1 — the KB indexer). They are committed now so the import is complete.

**Example:**

```
content/kb/myproject-overview.md
content/kb/myproject-retro.md
```

### Wiring point 2: `content/timeline/dots.ts` — Master Timeline (hand-curated)

Add a `FlagshipNode` (or a `RunwayTick` for minor milestones) to the
appropriate era-band in `TIMELINE_ERAS` inside `content/timeline/dots.ts`.

This is **Stage 1: hand-curated only.** The deterministic git→Dot auto-harvest
is Stage 2 (Epic 6 / Stories 6.1–6.2). Do NOT attempt to automate the import;
edit the manifest by hand.

**Rules:**
- Add to the `'agentic-turn'` era for current projects; `'runway'` for
  historical milestones.
- Use real, confirmed dates (ISO-8601 or approximate `~YYYY`). Never invent
  exact dates. Flag unknowns `[OPEN]`.
- `href` values: use `/glass-box/{slug}/` for Glass Box readers, `/work/{slug}/`
  for dedicated work pages, or `[OPEN]` where the target URL is not yet confirmed.
- Carry the credibility rule from Stories 2.4/2.5: `[OPEN]`/`[ASSUMPTION]` for
  unknowns, never fabricate.
- Ordering: oldest → newest within each era.

**Example entry:**

```ts
{
  kind: 'flagship',
  label: 'My New Project',
  date: '2026-07',
  description: 'One sentence of real context. No hype.',
  cluster: [
    {
      label: 'Design doc',
      date: '2026-07-01',
      state: 'filled',
      href: '/glass-box/myproject-design/',
      description: 'The design decisions.',
    },
    // ... more cluster dots ...
  ],
},
```

### Wiring point 3: `content/glassbox.allowlist.ts` — Glass Box publish gate

Add an entry to `GLASSBOX_ALLOWLIST` in `content/glassbox.allowlist.ts` for
each planning artifact or document you want to surface in the Glass Box reader.

This is the **default-deny** gate (AR-13). Only files listed here ever render
in the Glass Box. Nothing unlisted can appear — the render pipeline iterates
this allowlist, never the filesystem.

**Rules:**
- `sourceFile`: repo-root-relative path to the committed artifact. The render
  pipeline throws (fails the build) if the file is missing — so commit the
  artifact BEFORE adding the allowlist entry (or add them in the same commit).
- `slug`: unique, kebab-case, forms the `/glass-box/{slug}/` reader route.
- `type`: one of `'brief' | 'brainstorm' | 'research' | 'prd' | 'ux' |
  'architecture' | 'epics' | 'retrospective' | 'shipping'`.
- `curatorNote`: one sentence of editorial voice — "an act of taste, not a file
  path." Assert, don't defend.
- Do NOT list private/process artifacts: `*.decision-log.md`, `review-*.md`,
  `reconcile-*.md`, `addendum.md`. These are excluded by construction (not listed
  → not rendered).

**Example entry:**

```ts
{
  sourceFile: '_bmad-output/planning-artifacts/prds/myproject-2026-07/prd.md',
  type: 'prd',
  slug: 'myproject-prd',
  title: 'My Project — Product Requirements',
  curatorNote: 'The decisions that shaped the build, and the constraints that held.',
},
```

Allowlisting an artifact gives it a **reader page** at `/glass-box/{slug}/`
(Story 2.2) — that is what the allowlist drives. It does **not** automatically
add the artifact as a node on the **`/glass-box/` index** (Story 2.3): the index
is a separately **curated** build-story, driven by the next wiring point.

### Wiring point 4: `web/src/content/glassbox.index.ts` — Glass Box index featuring (curated)

To feature the artifact (or the project) as a node on the curated `/glass-box/`
index — the dated build-story spine — add (or extend) an entry in
`web/src/content/glassbox.index.ts`. This is the **display curation** (which
nodes show, in what order, featured vs ghosted vs the shipping node), kept
deliberately separate from the publish gate: the allowlist decides what *may*
render (a reader exists); the index manifest decides what is *featured on the
build-story*. Reference the artifact's `slug` so the index card's `Read →` links
to its reader. (Omit it from the index if the artifact should be reachable as a
reader but not headlined on the build-story.)

---

## Steps to complete a Project Import

1. **Curate artifacts and media into the repo.** Commit any source documents,
   images, or write-ups that the project needs under appropriate paths
   (e.g. `_bmad-output/planning-artifacts/…`, `public/…`). Never reference
   external URLs for content that must survive a rebuild — commit it.

2. **Add `content/kb/*.md`** — the Guide KB markdown (Wiring point 1 above).

3. **Add a Dot / flagship cluster to `content/timeline/dots.ts`** — the hand-
   curated Stage-1 timeline entry (Wiring point 2 above). Flag unknowns `[OPEN]`.
   Do not fabricate dates, metrics, or URLs.

4. **Allowlist publishable artifacts in `content/glassbox.allowlist.ts`** — only
   the artifacts you want to have a Glass Box **reader page** at
   `/glass-box/{slug}/` (Wiring point 3 above). Default-deny: if it is not listed,
   it cannot appear.

4b. **(Optional) Feature it on the `/glass-box/` index** — to headline the
   artifact/project as a node on the curated build-story spine, add an entry to
   `web/src/content/glassbox.index.ts` (Wiring point 4 above). Allowlisting alone
   gives a reader page but does NOT add an index node.

5. **Run `pnpm build`.** This executes the content pipeline (Wiring points 2 and
   3 above regenerate `web/src/generated/timeline.json` and
   `web/src/generated/glassbox.json`) and then runs `astro build` to prerender
   the full static site into `web/dist/`. The build is deterministic — the same
   git state always produces byte-identical output (NFR-6).

6. **Verify.** Spot-check the local output:
   - `pnpm --filter @portfolio/scripts test` — mechanism tests green (verifies the
     data-driven import path is intact).
   - `pnpm --filter web test` — no regressions in the web build tests.
   - `pnpm typecheck && pnpm lint && pnpm format:check` — all clean.
   - Browse locally (`pnpm dev` or inspect `web/dist/`) and confirm:
     - The new Dot appears on `/timeline/`.
     - Each allowlisted artifact has a reader page at `/glass-box/{slug}/`.
     - If you added an index node (step 4b), it appears on the `/glass-box/`
       build-story spine; allowlisting alone gives only the reader page.

7. **Merge the PR.** The change is a normal code review (the repo is the CMS).

8. **Deploy with `scripts/deploy.sh`.** Run this on the VM from anywhere. It:
   `git pull --ff-only` → `pnpm install --frozen-lockfile` → builds the api
   (`pnpm --filter api build`) → runs the content pipeline + web build
   (`pnpm build`) → restarts the Hono api systemd unit → validates and reloads
   nginx. See the deploy script for the full annotated flow.

---

## Epic 4: KB retrievability

The `content/kb/*.md` files committed in step 2 become **agent-retrievable**
once Epic 4 / Story 4.1 ships the KB indexer (`scripts/build-kb-index.ts` →
`api/data/`). Until then, they are committed and ready — the indexer
automatically picks them up when it runs. No additional import step is needed
at that point.

---

## Stage 2: auto-harvest (future)

This document describes **Stage 1** (hand-curated `content/timeline/dots.ts`).
**Stage 2** (Epic 6 / Stories 6.1–6.2) will replace the manual dots.ts edit
with a deterministic git→Dot auto-harvest. When Stage 2 ships, the auto-harvest
will generate Dots from committed git history; Wiring point 2 above will be
automated. The KB and Glass Box wiring points remain manual (curated by design).

---

## Credibility rule (carry this into every import)

Sourced from Stories 2.4, 2.5, and the project norm:

> **Never fabricate.** If a date, metric, URL, or fact is not confirmed, flag it
> `[OPEN: …]` (unknown) or `[ASSUMPTION: …]` (inferred) and supply a curated
> substitute (e.g. an approximate date `~2026-Q3`, an honest description, a
> placeholder href). Unflagged unknowns corrupt the credibility the portfolio
> exists to establish.

---

## Related files

| File | Purpose |
|---|---|
| `content/README.md` | Code-as-CMS doctrine + directory conventions |
| `content/glassbox.allowlist.ts` | Default-deny Glass Box publish gate |
| `content/timeline/dots.ts` | Hand-curated Master Timeline manifest |
| `content/kb/` | Guide KB markdown (Epic 4 / Story 4.1 indexes it) |
| `scripts/render-glassbox.ts` | Glass Box render pipeline (Story 2.1) |
| `scripts/render-timeline.ts` | Timeline render pipeline (Story 2.4) |
| `scripts/build-content.ts` | Content pipeline orchestrator (Story 1.8) |
| `scripts/deploy.sh` | Deploy to VM (Story 1.10) |
| `docs/launch-checklist.md` | One-time VM bring-up and first-deploy checklist |
