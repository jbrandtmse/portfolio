# content/kb/ — Agent's Curated Knowledge Base

This directory contains the curated knowledge base (KB) that powers the Guide's retriever.

## What this is

These five Markdown docs are the **default-deny source of truth** for the Guide agent. Each doc corresponds to exactly one citation route on the Static Mirror:

| Doc              | Citation route    | Label               |
| ---------------- | ----------------- | ------------------- |
| `about.md`       | `/about/`         | About Joshua        |
| `speaking.md`    | `/speaking/`      | Speaking            |
| `loandemo.md`    | `/work/loandemo/` | LoanDemo case study |
| `faq.md`         | `/faq/`           | FAQ                 |
| `bmad-method.md` | `/glass-box/`     | How this was built  |

## Authoring rules

1. **Authored from Mirror facts only.** Every claim in these docs is drawn from the same facts the Static Mirror already exposes (`web/src/lib/person.ts`, `web/src/data/speaking.ts`, `web/src/pages/*.astro`). No new facts are introduced here.
2. **No fabrication.** Every unconfirmed fact is flagged `[OPEN]` or `[ASSUMPTION]` in visible text, exactly as it appears on the Mirror. Do not remove or soften these flags.
3. **One doc ↔ one citation route.** The `route` frontmatter field is the Mirror route the Guide cites when grounding on this doc. Do not change routes without updating the citation target.
4. **Default-deny by construction.** The KB indexer reads ONLY `content/kb/*.md` — never `_bmad-output/`, never the repo at large. Do not add docs here that contain internal planning artifacts or non-public information.

## Build artifact

The KB indexer (`scripts/build-kb-index.ts`) chunks these docs at heading boundaries and writes a deterministic index to `api/data/kb-index.json` (gitignored). The Guide loads this index at startup.

**Knowledge horizon:** the Guide's knowledge is "fresh as of the last build." To update the Guide's knowledge, edit these docs and rebuild (`pnpm build`).
