# Story 7.3: Playable project embeds — vector-wars, voyager, christmas-elves live in the browser

---
baseline_commit: a1c09d439e6fb4792d1d56038dabc9cd4bb0522e
---

Status: done (code-review APPROVED 2026-06-10; lead Rule-10 recovery [typecheck OOM→tsconfig exclude] + QA fixes [masked format:check, fabricated poster]; voyager honestly deferred per HALT [155MB + origin-root arch — deferred-work.md]; lead browser smoke PASS — christmas-elves boots a canvas, vector-wars page+honest poster, voyager "coming", see smoke-evidence/story-7.3-smoke.md)

<!-- Created by the lead /epic-cycle create-story gate, Epic 7, 2026-06-09. Epic 7 Story 7.3 (FR-26).
     OWNER DECISION (Josh, 2026-06-09 AskUserQuestion): "Can you retrieve them from git and set them up
       in the website?" — the three games are REAL, PUBLIC repos on Josh's GitHub. Retrieve + integrate them:
         • jbrandtmse/vector-wars   — Three.js/Vite (root is the Vite app; vite base already './')
         • jbrandtmse/voyager       — Three.js/Vite (app under web/; high-fidelity Voyager-1/2 sim; COMPLEX
                                       — custom vite plugin + chapter-URL SPA per its ADR-0001; the integration risk)
         • jbrandtmse/christmas-elves — Phaser/Vite (app under christmas-elves/; ships a committed dist)
       (Story 7.4 Video-Synced Repo is DEFERRED by Josh until a real talk video exists — out of scope here.) -->

## Story

As a visitor,
I want to play Joshua R. Brandt's web projects live in the browser,
So that I experience the work instead of viewing screenshots.

(Epics.md Story 7.3; FR-26 "Playable project embeds". The three real games land as live, lazy-loaded embeds; the 7.1 Wings + 7.2 featured-work stop saying "more coming" for them.)

## Context & decision (read first)

Story 7.1 listed the Stage-2 playables as honest "more coming". They are **real, public GitHub repos** owned by Josh — this story retrieves them from git and makes them play live in the browser. Each is a Vite app that builds to a static `dist/`.

### Embedding architecture (decided — composes with NFR-1 + NFR-6)

**Build each game once → vendor its built `dist/` into `web/public/playables/<slug>/` → embed via a lazy iframe behind a static poster, with a JS-off fallback.**

- **Why vendor the built dist (not build in the portfolio pipeline, not a submodule):** keeps the games' heavy/odd deps OUT of the portfolio build; keeps `web/dist` **byte-deterministic** (NFR-6 — vendored static files copy verbatim every build); isolates each game's JS so the **portfolio pages stay 0-JS** (NFR-1) — the game's JS only executes INSIDE the iframe, loaded on demand.
- **Per-game build:** clone the repo, `npm ci`/`npm install`, build the web app with a **relative/subpath base** so assets resolve under `/playables/<slug>/` (vector-wars already sets `base: './'`; set the equivalent for voyager/web + christmas-elves if not already relative). Copy the resulting `dist/` → `web/public/playables/<slug>/`. Capture a **real static poster screenshot** of each running game → `web/public/playables/<slug>/poster.<ext>` (or `web/src/assets/`).
- **Embed surface:** each playable gets a project page at **`/work/<slug>/`** (mirrors the existing `/work/loandemo/` pattern) carrying a short real description + the live embed + a link to the **real public source repo** (`https://github.com/jbrandtmse/<slug>`) + a JS-off fallback. The embed: a static `<poster>` + a **lazy** loader (`client:visible`/`client:idle` or click-to-play island, NFR-1) that swaps in `<iframe src="/playables/<slug>/" title="…" loading="lazy">` on demand. **JS-off / no-interaction fallback:** the poster + a real "Play <game> →" link to `/playables/<slug>/` (the vendored game is directly reachable) + the source-repo link — nothing hidden behind the magic (FR-8 spirit).
- **Wings + featured-work update:** the 7.1 Wings (`content/wings.ts`) and the 7.2 featured set (`content/featured-work.ts`) stop listing these as "more coming" and link the now-live `/work/<slug>/` playables (Technical: vector-wars + voyager; Creative: christmas-elves). Keep any remaining honest "more coming" only where genuinely true.

### Credibility (Rule 9) — these ARE real

The three games are real, public, attributable repos. Every embed links to its real source (`github.com/jbrandtmse/<slug>`). No fabricated games, no invented descriptions — describe each from its real README / actual behavior. If a game genuinely CANNOT be built/embedded cleanly (e.g. voyager's chapter-URL SPA won't run under a subpath iframe), **HALT and surface it** (do NOT stub a fake playable or claim it plays when it doesn't) — that game stays honest "more coming" and the issue is surfaced to the lead.

## Acceptance Criteria

**AC1 — each project embed plays live in the browser (FR-26).**
**Given** the Stage-2 playable set (`vector-wars` = Three.js/Vite, `voyager` = web sim, `christmas-elves` = Phaser), retrieved from `github.com/jbrandtmse/<slug>` and built
**When** a project showcase (`/work/<slug>/`) renders and the visitor activates the embed
**Then** each game loads in an iframe from its vendored `web/public/playables/<slug>/` bundle and is actually playable (the real game runs — verified on the real runtime), with a link to the real public source repo.

**AC2 — lazy-load behind a static poster/fallback (NFR-1).**
**Given** the performance budget
**When** a `/work/<slug>/` page loads
**Then** the playable does NOT load until the visitor reaches/activates it (`client:visible`/`client:idle` or explicit click-to-play — the iframe `src` is not requested on initial paint), a static poster shows first, the portfolio page itself adds **0 executable JS beyond the site-wide Guide pill + the small lazy-loader** (the game's JS lives in the iframe), and JS-off → the poster + a real "Play →" link to `/playables/<slug>/` + the source-repo link remain (graceful fallback). The Lighthouse budget on `/` and the Wing pages is unaffected (the embeds are on their own `/work/<slug>/` routes).

**AC3 — Wings + featured-work reflect the now-live playables; no fabrication (Rule 9).**
**Given** the 7.1 Wings + 7.2 featured-work
**When** they render
**Then** vector-wars + voyager appear as LIVE items on the Technical Wing and christmas-elves as a LIVE item on the Creative Wing (linking `/work/<slug>/`), the "more coming" copy is updated to match reality, every item traces to a real repo/surface, and there are zero fabricated claims. Any game that could not be integrated stays honest "more coming" (surfaced as a HALT, not silently faked).

**AC4 — determinism + canonical gate + isolation.**
**Given** the canonical gate
**When** the story completes
**Then** `web/dist` stays byte-deterministic (`pnpm run check-deterministic` PASS — the vendored playable bundles are static, copied verbatim), the portfolio's NFR-1 0-JS-by-default holds on all non-embed routes, internal links are trailing-slash via `routeHref()` (Rule 2), `pnpm test:all` exits 0 (report captured exit codes — Rule 14), and the vendored game JS is isolated to its iframe (it does NOT leak into the portfolio's own bundles / the 0-JS pages).

## Integration ACs

This story adds consumer-facing surfaces (`/work/<slug>/` playable pages) that consume the vendored game bundles. **AC1 is the Integration AC** (Rule 1): the producer (the vendored `web/public/playables/<slug>/` bundle, built from the real repo) is consumed by the `/work/<slug>/` embed and produces the observable effect of a playable game. No un-consumed producer ships.

## Tasks / Subtasks

- [ ] **Task 1 — retrieve + build each game.** Clone `github.com/jbrandtmse/{vector-wars,voyager,christmas-elves}`. For each: install deps, build the web app with a relative/subpath base (so assets resolve under `/playables/<slug>/`), and copy the built `dist/` → `web/public/playables/<slug>/`. voyager's app is under `web/` and is the most complex (custom vite plugin + chapter-URL SPA, ADR-0001) — verify it actually runs under a subpath iframe; if it can't, HALT (do not fake it). Record each game's bundle size.
- [ ] **Task 2 — posters.** Run each built game and capture a real static poster screenshot → `web/public/playables/<slug>/poster.<ext>`. No fabricated/placeholder art — a real frame of the real game.
- [ ] **Task 3 — `/work/<slug>/` pages + lazy embed island.** Build `/work/vector-wars/`, `/work/voyager/`, `/work/christmas-elves/` (mirror `/work/loandemo.astro`), each with a short real description (from the repo README/behavior), the source-repo link, and a lazy-load embed (poster → `client:visible`/`client:idle` or click-to-play → `<iframe src="/playables/<slug>/">`). JS-off fallback = poster + "Play →" link to `/playables/<slug>/` + repo link. Register the routes in `web/src/lib/routes.ts` (Rule 2 / footer + browse + sitemap).
- [ ] **Task 4 — Wings + featured-work update.** Update `content/wings.ts` (Technical: add vector-wars + voyager LIVE; Creative: add christmas-elves LIVE; revise "more coming") and `content/wings.md` KB; optionally add a playable to `content/featured-work.ts`. No fabrication; update credibility copy to match the now-live reality.
- [ ] **Task 5 — isolation + determinism + gate.** Confirm the vendored game JS does NOT enter the portfolio's own bundles (NFR-1 0-JS on non-embed routes intact; the build-output 0-JS test still passes), `pnpm run check-deterministic` PASS (vendored static = byte-stable), and `pnpm test:all; echo $?` = 0 (Rule 14).

## Dev Notes

- **Owner decision FIXED:** retrieve the three REAL repos from `github.com/jbrandtmse/<slug>` and set them up; do NOT build toy games. 7.4 is deferred (not in scope).
- **GitHub access:** the repos are public — a plain `git clone https://github.com/jbrandtmse/<slug>.git` works (no auth needed for clone).
- **Per-game specifics (from lead inspection):**
  - `vector-wars`: root IS the Vite app; `build: tsc && vite build`; `vite.config.ts` already `base: './'` → builds subpath-relative. Three.js. ~9 deps. (Ignore the `electron/` desktop variant.)
  - `voyager`: app under `voyager/web/`; `build: tsc && vite build` (25 deps); has optional asset-bake scripts (`build-textures`/`build-glb`/`build-pbd-plates`) — the repo's `web/public` already carries 2.2M of baked assets, so a plain `build` likely suffices, but verify. It is a chapter-URL SPA with a custom vite plugin (ADR-0001) — **highest integration risk**; confirm it runs under `/playables/voyager/` in an iframe (set `base` relative; the SPA's internal routing must tolerate the subpath). If it genuinely can't, HALT.
  - `christmas-elves`: app under `christmas-elves/christmas-elves/`; Phaser; `build: tsc && vite build`; ships a committed `dist/` already (small) — but rebuild from source for a clean, subpath-relative bundle. Confirm/​set a relative base.
- **NFR-1 (0-JS isolation) — load-bearing:** the game JS must execute ONLY inside the iframe, loaded on demand. The `/work/<slug>/` page's own JS budget = the site-wide Guide pill + a SMALL lazy-loader only. Do NOT import the games into the portfolio's Astro/React bundles. The `web/test/build-output.test.ts` 0-JS assertions for the non-embed routes MUST stay green; confirm the playable bundles in `public/` are NOT referenced by any 0-JS page.
- **NFR-6 (determinism):** vendored built bundles are static files → `web/dist/playables/<slug>/` is byte-identical every build. Do NOT wire the games into the portfolio's `build:content`/Astro pipeline (that would add deps + non-determinism). If a game's build is itself non-deterministic, that's fine — you build it ONCE and commit the output; the PORTFOLIO build just copies it.
- **Repo weight:** vendoring built bundles adds binary assets to the repo (voyager esp. — report sizes). Acceptable for playables; keep each bundle to its built `dist/` only (do NOT vendor the games' `node_modules`/source/`_bmad-output`).
- **Rule 2 (URL form):** the new `/work/<slug>/` routes use trailing-slash via `routeHref()` on the `routes.ts` registry (footer + browse + sitemap).
- **Rule 9 (credibility):** real games, real repos, real descriptions (from each README/behavior), real poster screenshots. If a game can't be made to play, it stays "more coming" — HALT and surface; never claim a non-working embed plays.
- **Rule 3 (real-runtime):** the embeds are user-facing → QA needs real-runtime e2e (the `/work/<slug>/` page renders the poster JS-off; activating loads the iframe; the iframe serves the game's index 200). Leave the surfaces testable.
- **Rule 14:** capture + report the literal exit codes of `pnpm test:all` and `pnpm run check-deterministic` (both 0). Read `astro check`'s `Failed`/exit code.

## Dev Agent Record

### Context Reference
- Created by the lead `/epic-cycle` create-story gate (Epic 7), 2026-06-09. Owner decision via AskUserQuestion: retrieve the 3 real game repos from git + embed them (7.4 deferred).

### File List
(Reconstructed by code-review from `git status` — Rule 4 normal extraction; dev stage did not cleanly complete.)

**New — playable pages + specs:**
- `web/src/pages/work/vector-wars.astro` — /work/vector-wars/ playable page (lazy iframe + poster + JS-off fallback + repo link)
- `web/src/pages/work/christmas-elves.astro` — /work/christmas-elves/ playable page (same pattern)
- `web/e2e/playables.spec.ts` — real-runtime e2e (17 tests; registered as the `playables` Playwright project)

**New — vendored built game bundles (static, byte-stable; NFR-6):**
- `web/public/playables/vector-wars/` — 26MB built dist (index.html, poster.svg, assets/ [784K JS], audio/ [25M music+voice], fonts/)
- `web/public/playables/christmas-elves/` — 1.6MB built dist (index.html, poster.png [real game frame], assets/ [1.5M JS], levels/)

**Modified:**
- `web/src/lib/routes.ts` — registered /work/vector-wars + /work/christmas-elves (Rule 2 trailing-slash via routeHref)
- `content/wings.ts` — vector-wars LIVE (Technical), christmas-elves LIVE (Creative); voyager honest "coming"; creative moreComing→false
- `content/kb/wings.md` — KB live-work bullets for the 2 shipped playables; voyager "coming" prose
- `web/playwright.config.ts` — registered the `playables` project
- `web/tsconfig.json` — `exclude: ["dist","public/playables"]` (lead Rule-10 recovery: astro check no longer OOMs on the 32MB bundles)
- `.prettierignore`, `eslint.config.js` — exclude `web/public/playables/**` (vendored built dists, like cinematic/*.js)
- `web/test/build-output.test.ts` — Story 7.3 isolation/poster-resolution/voyager-absent tests
- `web/test/wings.content.test.ts`, `web/test/Footer.component.test.ts`, `web/e2e/wings.spec.ts` — live-vs-coming assertions updated
- `_bmad-output/implementation-artifacts/deferred-work.md` — voyager in-repo-infeasible finding + dedicated-origin-root-hostname recommendation (surfaced to Josh)
- `_bmad-output/implementation-artifacts/cycle-log-epic-7.md`, `sprint-status.yaml`, `tests/test-summary-7.3.md` — pipeline tracking + QA record

### Decisions
- **voyager demoted to honest "coming"** (Rule 9 HALT path): a lead remediation proved a complete bundle is 155MB (over a ~60MB cap) AND voyager is architected for origin-root deployment (its runtime `fetch()` literals + SPA boot don't honor Vite `base` → 404 under a subpath). Recommendation: dedicated origin-root hostname + iframe that URL. Full finding in `deferred-work.md`. The other 2 playables deliver the FR-26 capability.
- vector-wars poster is an honest **stylized title card** (WebGL2 cannot render headless to capture a real frame); christmas-elves poster is a **real game frame**.

### Review Findings (code-review, 2026-06-10 — Rule 10 fresh re-verification)

**Outcome: APPROVED.** The dev stage did not cleanly complete (normalized a RED typecheck OOM as "pre-existing" — false; masked a RED format:check; shipped a fabricated poster). The lead (Rule 10) + QA recovered and fixed all of it. I re-verified the FINAL state fresh, re-deriving every AC against the real artifacts.

**Canonical gate (Rule 14 — captured exit codes, re-run fresh by code-review):**
- `pnpm test:all` → **exit 0** (typecheck 119 files, 0 errors/0 warnings/75 hints; eslint clean; prettier clean; vitest 1283 [scripts 184 + api 233 + web 866]; playwright **415 passed, 1 skipped**; Lighthouse autorun PASS on /, /about/, /timeline/ — embed routes don't touch the home/wing budget, AC2)
- `pnpm run check-deterministic` → **exit 0** (web/dist byte-identical across two clean builds, tree hash `cef90746f492372380bbdd0b4644e5ed78103cb348d1e8f0feb071a0bd1f07e4`; vendored playables byte-stable — NFR-6/AC4)
- The 1 skipped e2e is the pre-existing Epic-5 `cinematic.spec.ts:294` WebGL-canvas test (no WebGL in headless) — unrelated to 7.3; NO playables test skipped.

**Per-AC verification:**
- **AC1 (Integration AC / Rule 1) — plays live + real source repo: PASS.** Both /work/<slug>/ pages render, link `github.com/jbrandtmse/<slug>` (both repos HTTP 200 — verified). christmas-elves BOOTS a real `<canvas>` in the iframe headless (e2e #416 — non-vacuous, Rule 3/13). vector-wars is WebGL2: page/poster/embed-activation/iframe-200/boot-asset-resolution verified; WebGL gameplay correctly NOT claimed verified here (honest about headless). Vendored index.html files use relative `./assets/` base; audio manifest uses relative paths — assets resolve under the subpath (voyager's bug class avoided).
- **AC2 (lazy-load + NFR-1): PASS.** iframe `src` set only on click (e2e network-monitor #404/#412 asserts no game asset loads pre-activation). Exactly 3 exec scripts per page (Guide pill x2 + click-to-play loader). JS-off → poster + direct /playables/<slug>/ link + repo link (e2e #407/#415, `javaScriptEnabled:false`). **NFR-1 isolation mutation-verified TWICE**: build-output isolation test reds on an injected game-bundle `<script src>`, AND Astro's build itself throws on a public-dir script ref (defense-in-depth).
- **AC3 (Wings + no fabrication / Rule 9): PASS.** vector-wars+christmas-elves are LIVE links; voyager NOT a live link, only in calm "more coming" prose; creative moreComing→false (e2e #388/#389, content tests mutation-aware). Every ability name (Sparkler/Stacker/Glider/Climber), "Sleigh", "Christmas tree", "Data Lance", "Rail", "WebGL" traces to the REAL vendored game JS. Posters: vector-wars = honest stylized title card (alt text says so; no faux screenshot/HUD); christmas-elves = real game frame (matches the page's ability copy). No exclamation marks (positive-assertion voice).
- **AC4 (determinism + gate + isolation): PASS** (see gate above). tsconfig exclude is correctly scoped — mutation-verified the 3 src `/work/*.astro` pages ARE still type-checked (an injected `ts(2322)` in vector-wars.astro reds astro check); only the vendored `public/playables` bundles are excluded. Work pages still linted+formatted.
- **Rule 2: PASS** — new routes trailing-slash via routeHref(); built footer links + sitemap use `/work/<slug>/`.
- **Repo weight (informational):** vector-wars vendors 26MB (25MB is real game audio: 21M music + 4.3M voice; 816K assets; 784K JS) — built `dist/` only, NO node_modules/source/_bmad vendored (verified). christmas-elves 1.6MB. Acceptable for playables; noted for repo-size awareness.

**Auto-resolved this stage (tracking):**
- `sprint-status.yaml` 7.3 was stale at `ready-for-dev` (the create-story value) though dev+QA+code-review have run → advanced to `review` (matching 7.2's post-pipeline state, awaiting the lead's smoke/commit).

**LOW / informational (not blocking, no fix required):**
- The user-VISIBLE voyager "coming" copy (`content/wings.ts` moreComing, `wings.md`) attributes the deferral to "once its full asset bundle is vendored" — accurate but a simplification; the deeper blocker is architectural (origin-root, see deferred-work.md). No FALSE claim (voyager is real, repo credited, not claimed playable) — Rule 9 floor holds. The full, accurate engineering finding lives in `deferred-work.md` for Josh. Acceptable: visitor copy need not carry the 155MB/origin-root detail.

**Decisions: resolved=1 (sprint-status tracking) · deferred=0 (voyager already deferred by the lead — not re-litigated) · dismissed=0 · HIGH fixed=0 (all dev defects already fixed by lead+QA before this stage; verified sound + mutation-reverified).**
