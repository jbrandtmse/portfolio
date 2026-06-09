# Story 7.1 — Lead per-story smoke (the three Wings, on the real built/served site)

**Date:** 2026-06-09 · **Method:** browser (chrome-devtools) + curl, against a fresh `pnpm build:content && pnpm --filter web build` served from `web/dist` (port 4399) · **Result: PASS** · **iterations:** 1 · **defects_caught:** 0

## What this smoke proves

Story 7.1 ships the three distinct Wings (Technical / Creative / Agentic) as the default browsable structure. The smoke exercises all three routes on the real built site and verifies the AC1 user-observable outcomes + the AC2 credibility floor (Rule 9 — no fabricated work), the dimension that is the highest-risk for an LLM-authored content surface.

## Result (captured)

| Check | /technical/ | /creative/ | /agentic/ |
| --- | --- | --- | --- |
| HTTP (trailing slash) | 200 | 200 | 200 |
| exactly one `<h1>` | ✅ "Technical work" | ✅ "Creative work" | ✅ "Agentic work" |
| answer-first lede names "Joshua R. Brandt, MSE" | ✅ | ✅ | ✅ |
| self-canonical, trailing-slash (Rule 2) | ✅ `…/technical/` | ✅ `…/creative/` | ✅ `…/agentic/` |
| executable page JS beyond the site-wide Guide-pill | ✅ 0 (2 scripts == identical to `/browse/` baseline) | ✅ 0 | ✅ 0 |
| console errors/warnings (real browser) | ✅ none | ✅ none | ✅ none |
| exclamation marks in body (voice) | ✅ 0 | ✅ 0 | ✅ 0 |
| three Wings linked in footer + `/browse` + sitemap | ✅ (Technical/Creative/Agentic, current-marked) | ✅ | ✅ |

### Credibility floor (Rule 9 — every item grounded; no fabrication)

- **Technical:** live item **loandemo → `/work/loandemo/`** (real flagship). "More technical work is coming. The interactive **vector-wars** and **voyager** demonstrations land in the next stage." — the playables appear ONLY as honest "more coming" text; **0 playable live hrefs**.
- **Creative:** **Music on Suno** carries the honest `[OPEN: Suno profile URL]` credibility flag ("the profile link will be added when confirmed") — rendered as a heading, NOT a broken link; no invented URL/track. "More creative work is coming. An interactive **christmas-elves** piece lands in the next stage." — playable as "more coming" only.
- **Agentic:** **This portfolio — the BMAD Method proof** → `/glass-box/` + `/timeline/` (real); **The Guide — a live grounded agent** → `/faq/` (the real, live, citing agent). "More agentic work is coming." (honest).
- **"thirty years" claim verified grounded:** the Wing copy's "thirty years" traces to the timeline's own canonical source (`content/timeline/dots.ts:121` → `metaNote: 'thirty years of shipping software — before the agentic turn'`; timeline span 1996→2026). Not a fabrication.
- **Zero fabricated project titles/claims** across all three Wings. The QA-fixed `content/kb/wings.md` fabrication (Glass Box "ADRs/epics/stories") and the code-review-fixed `content/kb/loandemo.md` "recorded in ADRs" fabrication are both resolved; the KB the Guide grounds on is clean.

### AC3 — Guide composition + re-curation non-regression

- `content/kb/wings.md` is indexed by `scripts/build-kb-index.ts` (regenerated `api/data/kb-index.json` contains the Wings content) so the Guide can ground + cite a Wing route. The Epic-5 home-scene re-curation engine (`web/src/lib/recuration.ts`, `api/src/lib/recuration.ts`, `SCENE_IDS`, home scene order) is **byte-unchanged** (empty diff vs baseline) and its tests stay green — the self-navigable Wing default is added without gating anything behind the agent.

## Visual evidence

- `smoke-evidence/story-7.1-technical.png` · `story-7.1-creative.png` · `story-7.1-agentic.png` (full-page renders of all three Wings).

## Conclusion

All three Wings are crawlable, self-navigable, 0-JS-by-default (Guide-pill aside), entity-first, self-canonical, and — most importantly — every listed item is grounded to a real shipped surface with the unbuilt 7.3 playables honestly framed as "more coming". The credibility floor holds on the real rendered pages. Defects caught by this smoke that the automated tiers missed: 0 (QA caught + fixed the wings.md fabrication; code-review caught + fixed the loandemo.md fabrication; this smoke is the independent real-runtime confirmation).
