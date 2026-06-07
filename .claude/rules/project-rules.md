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

## 5. Per-story verification runs the project's CANONICAL full gate, not a scoped subset

**Context:** Any story whose dev / QA / code-review verification or lead smoke runs a quality gate that the project also runs as its launch/CI gate (lint, format, typecheck, test, e2e) — especially in a monorepo where the root gate's file globs differ from a single package's.

**Rule:** Each pipeline stage (and the lead smoke) MUST run the project's **canonical full gate** — the exact command the launch/`test:all` gate runs (e.g. root `pnpm format:check` / `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm test:e2e`) — NOT a hand-narrowed, package-scoped subset. If you scope a check for speed during iteration, you MUST re-run the root gate before the stage is "green." A story is not done until the root gate it will be measured by is green.

**Why:** Epic 2 stories 2.2 and 2.3 ran *scoped* prettier checks (`prettier --check "src/**" "test/**"`) that passed, but the ROOT `pnpm format:check` (`prettier --check .`, which formats `.astro` via `prettier-plugin-astro`) was RED on those new `.astro` components/pages — so format-RED files were committed and the `test:all` launch gate was silently broken from 2.2 until the lead caught it at 2.4's verification. A scoped subset that "passes" gives false confidence; only the canonical gate reflects reality. (Epic 2 retro, 2026-06-06.)

**How to apply:** in every spawn prompt's verify step and the lead smoke, name the ROOT gate commands explicitly; treat "scoped check passed" as insufficient. When a new file *type* or path enters the repo (e.g. the first `.astro`, the first `.tsx`), confirm the root gate's globs cover it.

## 6. Documentation / runbook deliverables get a LITERAL doc-follow smoke

**Context:** Any story whose deliverable is a document, runbook, or path a human or agent is meant to FOLLOW (a how-to, an import/migration guide, an onboarding doc, a deploy runbook) — distinct from stories that ship code with an underlying mechanism.

**Rule:** The lead per-story smoke MUST execute the document's steps **verbatim against the real runtime** and assert the document's *claimed* user-observable outcome — not merely test the underlying mechanism the doc describes. If the doc says "do X and Y appears," the smoke does exactly X and verifies exactly Y (then reverts any state it changed).

**Why:** Epic 2 Story 2.6's Project-Import doc was *wrong* about a user-observable outcome — it claimed allowlisting an artifact makes it "appear on `/glass-box/`" (the index), but allowlisting only creates a per-artifact *reader* page; the `/glass-box/` index is separately curated. The mechanism tests + code-review all passed (the render functions were correct), because they tested the mechanism, not the doc's claim. Only following the doc literally (add a sample → build → observe) surfaced the inaccuracy. A wrong runbook is the defect that matters most for a doc deliverable — it misleads the next builder. (Epic 2 retro, 2026-06-06.)

**How to apply:** for a doc/runbook story, the smoke method is "follow the doc as written"; assert each claimed outcome; flag any step that is stale, wrong, incomplete, or out-of-order as a smoke defect (not deferrable). Mechanism tests verify the doc *can* be true; the doc-follow smoke verifies the doc *is* true.

## 7. Integration / cross-service e2e must be PROVEN to execute — a silent skip is not a pass

**Context:** Any story whose verification includes an integration or cross-service end-to-end test for a *stated guarantee* — a UI talking to the api, a JS-off native form post, an SSE stream, anything spanning web↔api or relying on a runtime prerequisite (a proxy, a DB, an env var).

**Rule:** The integration e2e MUST be proven to actually RUN — assert it is NOT skipped (or surface the skip loudly as an uncovered gap). A test that `test.skip()`s because a prerequisite is absent (no `/api` proxy under the test server, `DATABASE_URL`/key unset, etc.) MUST NOT be counted as a passing verification of the guarantee it claims to protect. For api-backed e2e, provide a **production-faithful harness** (reverse-proxy `/api/*` → the real service, mirroring the prod nginx topology — the `web/e2e/serve-with-api.mjs` pattern) so the integration path genuinely exercises end to end; do NOT rely on a dev-only proxy the test runner doesn't honor (e.g. Vite `server.proxy` / Astro `preview`). The QA stage and the lead smoke each confirm the integration test executed.

**Why:** Epic 3 Story 3.4's headline JS-off resilience test (native form POST → persisted row → `/invite/thanks/`) **silently `test.skip()`'d** — `astro preview` does not proxy `/api` and `DATABASE_URL` was unset in the Playwright env — so "198 pass, 1 skipped" MASKED a completely unverified resilience guarantee (the story's #1 promise). QA caught it only by building the `serve-with-api.mjs` reverse-proxy harness, after which it ran and passed against real Postgres. A skipped integration test reads as green while the path it guards is untested. (Epic 3 retro, 2026-06-07.)

**How to apply:** for any cross-service/integration AC, wire a prod-faithful harness for the service path; assert the e2e is not-skipped (count expected vs run, or fail on a missing prerequisite in CI-relevant envs); treat a skip-on-missing-prereq as a coverage GAP surfaced in QA/smoke, never as a pass. Epic 4's `/api/guide` SSE e2e inherits this directly (same proxy + env-gate + skip risk).

## 8. Tests assert against the REAL module + a SCOPED surface — never an inline copy or a whole-document match

**Context:** Any test verifying a value or behavior owned by a specific module, or rendered into a specific element/surface.

**Rule:** A test MUST exercise the REAL exported module/surface and SCOPE its assertion to the specific element/value it claims to check. Never test an inline COPY of the logic (it passes even when the real module drifts), and never use a whole-document / whole-output `toContain`-style match that a DIFFERENT surface can satisfy (a false positive). Mutation-verify every load-bearing assertion: break the real source, confirm the test reds, revert.

**Why:** Epic 3 surfaced two vacuous tests that passed the dev stage — Story 3.3's `env.test.ts` asserted an inline COPY of the Zod env schema (would stay green if the real `env.ts` drifted; QA added a real-module child-process test), and Story 3.2's AC5 "the visible short bio === `PERSON.description`" used a whole-**document** `toContain` that the `Event` JSON-LD's `performer.description` ALSO satisfied — so the *visible* bio could drift and the test stayed green (QA re-scoped it to the `.bio-block__text` element). Both were caught only by QA mutation-testing. A test that doesn't bind to the real, specific surface verifies nothing. (Epic 3 retro, 2026-06-07.)

**How to apply:** import + exercise the real module (use a child-process/real-import if module-load side-effects matter); scope DOM/output assertions to the owning element (a class/test-id selector), not the whole document; mutation-verify each assertion reds on a real-source break.

## 9. LLM-authored Mirror/KB content gets explicit fabrication guardrails up front + a BROAD credibility audit

**Context:** Any story whose deliverable is human/agent-facing PROSE authored by the LLM dev — KB docs, Mirror page copy, FAQ answers, bios, any content asserting facts about the person/work/project (distinct from code).

**Rule:** (a) The STORY hands the dev an explicit, enumerated list of the project's fabrication classes to NOT commit (e.g. for this project: no "every/all planning artifacts are published in the Glass Box" — only the allowlisted set is; no portfolio "recorded in ADRs" — there is no `docs/adr/`; no invented BMAD acronym expansion; every claim traces to a Mirror source or carries an `[OPEN]`/`[ASSUMPTION]` flag verbatim). (b) QA/code-review/smoke run a BROAD credibility audit of EVERY claim against the allowlist + the Mirror sources — not a narrow per-incident spot test — and lock the class with a line-scoped regression test (Rule 8), mutation-verified. The credibility floor ("zero invented facts") is a HIGH finding when violated.

**Why:** Epic 4's LLM-authored KB/Mirror prose introduced a fabrication in EVERY content story until the guardrails were explicit: an invented BMAD acronym (QA caught it, 4.1), a fabricated tech-stack + a false "the architecture doc is readable in the Glass Box" (code-review caught it, 4.1), and a SYSTEMIC "every planning artifact is published" across THREE docs (the lead SMOKE caught it, past QA *and* code-review, 4.1). Each narrow per-incident regression test missed the *next* instance of the same class. Story 4.2 then shipped **0 fabrications** — precisely because the story baked the enumerated fabrication-class guardrails in up front. Content fabrication is the highest-risk, lowest-visibility failure for an LLM author. (Epic 4 retro, 2026-06-07.)

**How to apply:** in `create-story` for any content-authoring story, enumerate the known fabrication classes + the Mirror sources of truth in the story; in QA/code-review, audit every claim against those sources (broad, not spot) + add a class-level line-scoped regression test; the lead smoke greps the served/built content for the fabrication classes. Treat an unflagged claim absent from the Mirror as HIGH.

## 10. A hung / interrupted pipeline stage is verified FRESH — never assumed complete

**Context:** Any `/epic-cycle` pipeline stage (dev/QA/code-review) whose sub-agent hangs, is interrupted, backgrounds-and-yields, or otherwise ends WITHOUT its closing summary — even if the canonical gate is green.

**Rule:** A stage that did not cleanly complete is treated as INCOMPLETE regardless of how "done" it looks. The lead recovers the mechanical state (re-run the gate, reconstruct the File List from `git status`, populate the record) BUT the downstream stage(s) MUST verify the work FRESH — re-deriving the ACs against the real artifacts, not trusting that named guarantees were actually implemented/asserted. A green gate proves the tests that EXIST pass; it does not prove the right tests exist.

**Why:** Epic 4 Story 4.4's dev sub-agent hung on its final `pnpm test:all` call (interrupted, no closing summary). The implementation *looked* complete and the gate was green — but when QA verified fresh, it found the dev's e2e **named** two load-bearing guarantees (focus-NOT-trapped, NFR-2 per-message-not-per-token) in comments/titles but never actually **asserted** them; code-review then found a third (a post-citation skip-link pointing at an id that existed on no Mirror route — a dangling AC promise). All three were invisible to the green gate. (Epic 4 retro, 2026-06-07.)

**How to apply:** when a stage hangs/yields incomplete, the lead logs the recovery (`closing_sections_present=false` + a note), re-runs the canonical gate, and the next stage's spawn prompt explicitly says "the prior stage was interrupted — verify fresh, do not assume completeness." Mutation-verify the load-bearing assertions actually exist + red on a real break.

## 11. Every spawned stage runs SYNCHRONOUSLY to completion — no background-and-yield

**Context:** Every `/epic-cycle` spawned pipeline stage (dev/QA/code-review), in its spawn prompt.

**Rule:** EVERY stage's spawn prompt MUST carry the directive: "Run all verification SYNCHRONOUSLY in THIS run. Do NOT start a background process (Monitor/`&`) and yield; do NOT wait for any notification. Run each gate inline, read the result, THEN write the closing summary before the turn ends." This directive belongs on ALL spawned stages — not just code-review.

**Why:** Epic 3's retro added this directive to the *code-review* spawn after the 3.0 CR agent backgrounded a gate run and yielded its findings unwritten. In Epic 4 the SAME anti-pattern recurred at the **QA** stage (Story 4.2) — because the directive was on the CR prompt but NOT the QA prompt. The QA agent backgrounded `pnpm test:all` and yielded with no closing summary, leaving the lead to complete the verification + clean up orphaned `astro preview` processes. The fix is to put the synchronous-completion directive on every spawned stage uniformly. (Epic 4 retro, 2026-06-07.)

**How to apply:** the `/epic-cycle` spawn-prompt skeleton carries the synchronous-completion directive for dev, QA, AND code-review identically; treat a stage that yields without its closing summary as an incomplete stage (Rule 10).

---

## Project configuration notes (not rules — durable decisions the next epic-cycle run should honor)

- **Per-stage model assignment (Epic 1 retro decision, 2026-06-06):** to balance cost/quality, the pipeline stages are pinned via each skill's `SKILL.md` frontmatter `model:` (which `/epic-cycle` reads on every spawn): **`bmad-dev-story` → sonnet**, **`bmad-qa-generate-e2e-tests` → opus**, **`bmad-code-review` → opus**. Epic 1 ran every stage on opus (the skills declared no model, so they inherited the lead); from Epic 2 on, dev runs on sonnet to cut cost while QA + code-review keep opus's rigor. Lead-run gates (sprint-planning, create-story, retrospective) still run on the lead's model by design.
