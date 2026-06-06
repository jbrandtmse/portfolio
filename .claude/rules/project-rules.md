# Project Rules

Durable rules for AI dev + code-review agents working on this project. Rules are accumulated from completed epic retrospectives and any other moment where a general pattern is recognized. Each rule captures a reusable lesson, with a short citation of the bug, anti-pattern, or situation that motivated it.

**How rules land here:** every retrospective ends with a "Rules to codify" step. Any lesson with general-pattern shape (would prevent a recurrence of a class of issues in a future epic, not just the specific incident at hand) is added to this file. Narrow one-off fixes stay in the source retro/story document and do NOT become rules.

**Template usage:** this header and Rule #1 (the meta-rule below) are intentionally project-agnostic — they can be dropped into any new project's `.claude/rules/project-rules.md` as the starting template. Subsequent rules (#2 onwards) are project-specific and accumulate from that project's retrospectives.

---

## 1. Meta-rule — codify retrospective lessons as rules

**Context:** Every completed epic retrospective (and any other moment a reusable lesson is explicitly identified).

**Rule:** At the end of every retrospective, add a "Rules to codify" step. For each lesson with general-pattern shape, append a new rule to this file following the format below. Narrow one-off fixes stay in the retrospective document and do NOT become rules.

**Format per rule:**
- Numbered heading with short title
- `**Context:**` — when the rule applies
- `**Rule:**` — what to do (or not do)
- `**Why:**` — the bug, anti-pattern, or cost that motivated the rule (with commit hash or bug number from the source retro if useful)
- Optional code snippet or example

**Why:** Retrospectives without a codification step produce lessons that age. The next epic then re-learns them the hard way. The value of a retro compounds only when its lessons become durable guidance the next dev/review agent actually sees before making a decision. Story files, commit messages, and retrospective prose do not survive as agent-visible context beyond the session that wrote them — `.claude/rules/*.md` does.

**How to apply:** when closing any retrospective:
1. Review the retrospective's "What could've gone better" and "Lessons learned" sections.
2. For each lesson, ask: *does this prevent a class of future bugs, or is it specific to the one that already happened?*
3. If class-of-bugs → append to this file.
4. Commit the rule file update in the same commit as the retrospective document.

**Cross-project library note:** rules here are project-scoped by default. When multiple projects adopt this system, rules with evidence from 2+ projects can be elevated into a shared library (shared npm package, git submodule, or copy-and-curate sync). Tag rules with `id:` slugs and `scopes:` frontmatter when that cross-project moment arrives so merging is mechanical rather than manual.

---

## 2. URL-form consistency — pick `trailingSlash` once; links === canonical === sitemap

**Context:** Any static-site story that emits internal links, `rel=canonical`, or `sitemap.xml` `<loc>` entries (route stubs, layouts, footers, JSON-LD/sitemap generators).

**Rule:** Decide the site's URL form ONCE up front (Astro `trailingSlash` + `build.format`) and make all three agree for every route: the internal `<a href>` form, the `<link rel="canonical">` form, and the sitemap `<loc>` form. Wire links/canonical/sitemap from ONE route registry, and add a build-output test asserting per route that link-form === canonical-form === sitemap-form.

**Why:** Epic 1 shipped internal links as `/about` while canonicals + sitemap used `/about/`. Functional (Astro `trailingSlash: 'ignore'` serves both) but every internal navigation incurs a 301 redirect hop and the SEO signal splits across two URL forms. Caught twice — the 1.7 lead smoke and again **live in production** at 1.10 (`/about → 301 → /about/`) — a class of bug, not a one-off. (deferred-work.md → story-1.7 smoke; assigned to **Story 2.0**.)

**How to apply:** at the first routing/SEO story of any site, set the convention in `astro.config` and derive every URL form from the shared route registry; assert form-equality in CI.

## 3. Forward-reference declarations for not-yet-built routes/surfaces

**Context:** A story that links to (or depends on) a route, component, or service a LATER story will create — common when a navigational surface ships before its targets.

**Rule:** The linking story MUST (a) carry an explicit "forward-reference (not a defect)" note naming the target + the story that lands it, and (b) include an Integration AC stating the link's correctness now (right `href`, JS-off followable) with target-resolution verified after the target story lands. Code-review and the lead smoke MUST NOT flag the interim 404 as a defect.

**Why:** Epic 1 stories 1.3 (hero fork → `/speaking`, `/faq`) and 1.4 (teasers → `/timeline`, `/work/loandemo`, `/glass-box`) linked routes that only existed after 1.5. Without the explicit declaration every downstream reviewer/smoke would re-litigate the "broken link," and a genuinely missing link could hide among accepted ones. The declaration made the interim state auditable and resolution verifiable (1.5 re-checked all forward-refs). Worked cleanly across four stories — codify it.

**How to apply:** in `create-story`, when an AC links a surface not yet in the route registry / not yet built, add the forward-ref note + the verify-after Integration AC; the target's story re-verifies resolution.

## 4. Env-gate third-party / runtime scripts to preserve the clean-build + 0-JS invariants

**Context:** Any story integrating a third-party browser script or runtime-config-dependent feature (analytics, embeds, players, live widgets).

**Rule:** Gate the integration behind build-time env (`import.meta.env.PUBLIC_*` in Astro) so that when the config is unset (default/CI/test) the build emits NOTHING for it — no script tag, no network, no JS. The live instance is supplied via env at deploy time. Test BOTH branches (unset ⇒ absent + invariants hold; set ⇒ correct emission).

**Why:** Epic 1's Umami analytics (1.10) had no live instance at build time. Env-gating kept the default static build at 0-executable-JS, kept the build deterministic (1.8), and let CI/tests run without a live Umami — while the same code lights up once `PUBLIC_UMAMI_*` is set on the VM. An ungated third-party `<script>` would have broken the 0-JS-by-default assertions and the byte-stable build. (story-1.10.)

**How to apply:** never hardcode a third-party script/URL/key into shipped client code; read it from `PUBLIC_` env, render conditionally, test both branches; non-PUBLIC secrets stay server-side (NFR-5).

---

## Project configuration notes (not rules — durable decisions the next epic-cycle run should honor)

- **Per-stage model assignment (Epic 1 retro decision, 2026-06-06):** to balance cost/quality, the pipeline stages are pinned via each skill's `SKILL.md` frontmatter `model:` (which `/epic-cycle` reads on every spawn): **`bmad-dev-story` → sonnet**, **`bmad-qa-generate-e2e-tests` → opus**, **`bmad-code-review` → opus**. Epic 1 ran every stage on opus (the skills declared no model, so they inherited the lead); from Epic 2 on, dev runs on sonnet to cut cost while QA + code-review keep opus's rigor. Lead-run gates (sprint-planning, create-story, retrospective) still run on the lead's model by design.
