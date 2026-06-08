# Story 6.0: Epic 5 Deferred Cleanup — enable `react-hooks/exhaustive-deps` (Rule 12 mechanical guard) before Epic-6's new React islands

---
baseline_commit: 8a844c01a8b4a765c1af94dcf8d2ae0f9d4d1ea8
---

Status: done (code-review APPROVED 2026-06-08; lead per-story smoke PASS — new-island stale closure blocked by `pnpm run lint`, see smoke-evidence/story-6.0-smoke.md)

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Created by the /epic-cycle retro-review gate (Epic 5 → Epic 6), 2026-06-08. Cleanup story; NOT in epics.md.
     Absorbs the ONE open item that pre-empts a class of bug in the NEW Epic-6 surfaces:
       INCLUDED: [Epic-5 retro A6 / Rule 12 mechanical guard] enable `react-hooks/exhaustive-deps` (+ rules-of-hooks)
                 as an ESLint ERROR scoped to the React .tsx islands, fix/annotate any surfaced violations, and
                 PROVE-by-mutation that the rule catches the exact Epic-5 stale-closure class. De-risks Epic 6,
                 which adds MULTIPLE new React islands (6.2 zoomable Master Timeline, 6.3 Glass Box guided tour,
                 6.4 explorable map) — exactly the surfaces where the 5.2 `currentDepth` / 5.4 `motionAllowed`
                 stale-closure bug (shipped TWICE behind a green gate) would recur. Small, isolated, cross-cutting,
                 and not naturally owned by any 6.1–6.4 feature story.
     DEFERRED (stay tracked in deferred-work.md): resetRecuration dead-code (→ Story 6.3 Guide-lifecycle pass);
                 all NFR-4/telemetry latency items (retro A3 ceiling re-confirm, A4 + [5.3]/[deploy] double-LLM
                 latency); [5.3] classifier injection-log; [5.3] inert `transition: order` placeholder; [5.1]
                 poster loading=lazy; [5.4] deepen×skim cosmetic edge; [5.2] skim instruction adherence; and the
                 carry-forward launch/operator items (PUBLIC_CONTACT_EMAIL mailto, MAIL_* validation, SPF/DKIM +
                 RESEND for live invite email, PUBLIC_UMAMI_*). Full triage table appended at the end of this file.
     DROPPED: the three already-✅-RESOLVED HIGH/MED items (5.1 Draco wrapper, 5.1 goToScene ScrollToPlugin,
                 5.4 deepen CSS consumer) — fixed inline during their own code reviews. -->

## Story

As the site owner (Josh),
I want the mechanical guard for Rule 12 — ESLint's `react-hooks/exhaustive-deps` (and `react-hooks/rules-of-hooks`) — enabled as a hard **error** across the React `.tsx` islands, with any currently-latent violations fixed (or each given a documented, justified inline exception) and a mutation proof that the rule reds on the exact Epic-5 stale-closure pattern,
so that Epic 6's new interactive React islands (the zoomable Master Timeline in 6.2, the Glass Box guided tour in 6.3, and the explorable map in 6.4) cannot ship the `useCallback`/`useEffect` stale-closure bug that escaped a green gate **twice** in Epic 5 (5.2 `currentDepth` posting a depth one dial-change behind; 5.4 `motionAllowed` silently disabling director's-mode SKIP + camera-driving on the real browser path) — the next dev/CI catches the omitted dependency at lint time instead of in production.

## Context & decision (read first)

This is the `/epic-cycle` Epic-5 → Epic-6 retro-review cleanup story. The full triage of every still-open `deferred-work.md` item + Epic-5 retro action item is in the **Appendix** at the end of this file. **One** item is **INCLUDED** here; the rest **DEFER** to their natural Epic-6 feature stories, to launch, to NFR-4/NFR-7 telemetry, or to owner decisions, or are **DROPPED** as already-resolved.

The included item comes from **Epic-5 retro action item A6** and is the codified **Rule 12** mechanical guard. Rule 12 was written precisely because the *same* React stale-closure bug shipped **twice** in Epic 5 — each disabling a load-bearing behavior on the real runtime path behind a green gate, because the e2e asserted the *off* case (vacuously passing) rather than the *on* case. The retro's own words: "an eslint `react-hooks/exhaustive-deps` rule is the mechanical guard for Rule 12 — enable/heed it." A6's done-when: "rule enabled + clean, or a documented exception" and "confirm it would have flagged the 5.2/5.4 stale closures."

**Why it comes due now (Epic 6 is the trigger):** Epic 6 adds **three new heavy interactive React islands** — the zoomable Master Timeline (6.2), the Glass Box guided tour (6.3), and the explorable map (6.4) — each with the same shape that produced the Epic-5 bugs: a memoized callback/effect that reads state set asynchronously after mount (a zoom level, a motion-allowed flag, a store subscription, a tour step index). Enabling the lint guard *before* those islands are written means the bug class is caught at authoring time on the new surfaces, not re-learned a third time. The fix is small, self-contained (one ESLint config block + dependency + any violation fixes), cross-cutting (protects every island), and not naturally owned by any single 6.1–6.4 feature story — exactly the cleanup-story profile (mirrors how Story 5.0 took on the `#close` aria-current + `threadContext` bound that de-risked Epic 5's surfaces).

### Included item — enable `react-hooks/exhaustive-deps` + `rules-of-hooks` as ERROR on the islands (`[Epic-5 retro A6]` / Rule 12)

**Current state (grounded, verified at `baseline_commit`):**

- The repo uses a **single root ESLint flat config** at `eslint.config.js` (project root), run by the root script `"lint": "eslint ."` (in root `package.json`). It composes `js.configs.recommended`, `...tseslint.configs.recommended`, and `...astro.configs.recommended`, plus three override blocks (Node-context files, ambient `*.d.ts`). It has a global `ignores` block (build output, `node_modules`, `web/public/cinematic/*.js`).
- **No React-hooks linting exists today.** `eslint-plugin-react-hooks` is **not installed** (not in root `package.json` devDependencies, not in `node_modules`) and no `react-hooks/*` rule is configured. So the Rule-12 bug class is currently caught by NOTHING mechanical.
- ESLint is **v10.4.1** (`@eslint/js ^10.0.1`, `typescript-eslint ^8.60.1`, `eslint-plugin-astro ^1.7.0`). The plugin is added to the **root** `package.json` devDependencies (the flat config imports its plugins from root).
- The React islands that must be covered live in **`web/src/islands/`**. At baseline there are **four**: `GuidePanel.tsx`, `GuidePill.tsx`, `InviteForm.tsx`, `WebGLSetpiece.tsx`. (These are the only `.tsx` React components; Astro components are `.astro` and are linted by `eslint-plugin-astro`, not react-hooks.) Epic 6 will add more islands under the same directory — the glob must cover them automatically.

**Decision — install `eslint-plugin-react-hooks` (latest, v6+) and add a scoped flat-config block** that turns on `react-hooks/rules-of-hooks: 'error'` and `react-hooks/exhaustive-deps: 'error'` for the React islands glob, then make the suite green (fix real violations; annotate any deliberate, justified exception inline).

**Verified library facts (researched 2026-06-08 — ESLint 10 is new; do not guess):**

- `eslint-plugin-react-hooks` **v6+** (current npm latest) supports **ESLint 9+** and the **flat config** API, and runs under **ESLint 10** even though its declared `peerDependencies` range may not yet name `>=10` explicitly. Expect a **peer-dep install warning** under pnpm — that is NOT a functional blocker. If pnpm's strict-peer-dependencies blocks the install, relax it for this package (e.g. a `pnpm.peerDependencyRules.allowedVersions` / `overrides` entry, or `--config.strict-peer-dependencies=false` scoped appropriately) rather than pinning an old plugin version.
- The plugin ships a flat preset at `reactHooks.configs['recommended-latest']` (for ESLint 9+/flat). There is **no** `flat/recommended` export. You may EITHER use that preset (scoped via `files`, then force `exhaustive-deps` to `'error'`) OR declare the plugin + the two rules directly. The direct form is preferred here for an explicit, minimal, glob-scoped block:

```js
// eslint.config.js — new block, scoped to the React islands only
import reactHooks from 'eslint-plugin-react-hooks';
// ...
{
  files: ['web/src/islands/**/*.{ts,tsx}'],
  plugins: { 'react-hooks': reactHooks },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
  },
},
```

- Scope deliberately to the islands glob (`web/src/islands/**`). Do NOT enable react-hooks repo-wide — `.astro` files and the Node/api/scripts surfaces have no React hooks and the rule would be noise there. If a future React `.tsx` lands outside `web/src/islands/`, widen the glob then (out of scope now).

## Acceptance Criteria

**AC1 — the rule is enabled as an ERROR on the islands.**
**Given** the root `eslint.config.js`
**When** the project runs `pnpm run lint` (root `eslint .`)
**Then** `react-hooks/exhaustive-deps` AND `react-hooks/rules-of-hooks` are active at severity `error` for every file matching `web/src/islands/**/*.{ts,tsx}` (verified by `eslint --print-config web/src/islands/GuidePanel.tsx` showing both rules at `"error"`), and `eslint-plugin-react-hooks` is a declared devDependency in the root `package.json` (resolvable — committed lockfile updated).

**AC2 — the suite is green (clean, or documented exception).**
**Given** the rule is enabled
**When** `pnpm run lint` runs over the whole repo
**Then** it exits 0 with no `react-hooks/*` errors: every currently-latent `exhaustive-deps`/`rules-of-hooks` violation in the four existing islands (`GuidePanel.tsx`, `GuidePill.tsx`, `InviteForm.tsx`, `WebGLSetpiece.tsx`) is **fixed by correcting the dependency array** (the Rule-12-correct resolution) — OR, only where a dep genuinely must be omitted, a line-level `// eslint-disable-next-line react-hooks/exhaustive-deps` carrying a one-line written justification of why the omission is correct and not a stale closure. (Prefer fixing over disabling. A blanket file/rule disable is NOT acceptable.)

**AC3 — proven to catch the Epic-5 stale-closure class (mutation proof, Rule 12 + Rule 8).**
**Given** the rule enabled and green
**When** a dependency is deliberately removed from a real island callback/effect that captures it — reproducing the exact Epic-5 pattern (e.g. drop `currentDepth` from `GuidePanel`'s `sendQuery` `useCallback` deps, the 5.2 bug; or drop a comparable captured reactive value)
**Then** `pnpm run lint` **fails** with a `react-hooks/exhaustive-deps` error naming the missing dependency; reverting restores green. The mutation, the observed lint error, and the revert-to-green are recorded in the Dev Notes / Debug Log (this is the A6 done-when: "confirm it would have flagged the 5.2/5.4 stale closures").

**AC4 — no regression to the canonical gate.**
**Given** the change
**When** the project's canonical full gate runs — the literal `pnpm test:all` (`typecheck` → `lint` → `format:check` → `test` → `test:e2e` → `lh`)
**Then** every stage passes (lint now includes the new rule), the build stays **byte-deterministic** (`pnpm run check-deterministic` PASS — though a lint-only/config-only change should not touch build output), and no app behavior changes (this is a lint-config + dependency-array-correctness change only; any dep-array fix must be behavior-preserving and, where it changes when an effect/callback re-runs, verified not to break the island's existing e2e). The root `format:check` must cover the edited `eslint.config.js` (Rule 5 — canonical gate, not a scoped subset).

## Dev Notes

### Exact change set (grounded)

1. **Add the dependency (root):** `eslint-plugin-react-hooks` at the current latest (v6+) to root `package.json` `devDependencies`; run the install so the lockfile updates and it resolves from root `node_modules`. Handle the ESLint-10 peer-dep warning per the "Verified library facts" above (warning is fine; a hard strict-peer block gets a scoped relaxation/override, NOT an old-version pin).
2. **Edit `eslint.config.js`:** add `import reactHooks from 'eslint-plugin-react-hooks';` at the top with the other plugin imports, and append the scoped block shown above (`files: ['web/src/islands/**/*.{ts,tsx}']`, `plugins: { 'react-hooks': reactHooks }`, both rules `'error'`). Keep the existing blocks and the global `ignores` intact. Place the new block after the base configs (so it layers on top for the islands glob).
3. **Run `pnpm run lint`; fix every surfaced `react-hooks/*` error** in the four islands per AC2. For `exhaustive-deps`, the Rule-12-correct fix is to ADD the missing captured reactive value(s) to the dependency array (verify the effect/callback still behaves — adding a dep changes re-run timing; confirm against the island's existing e2e, especially `GuidePanel`/`InviteForm` which have Playwright coverage). Only disable a line where omission is provably correct, with a written reason.
4. **Mutation-prove AC3:** temporarily reproduce the 5.2 omission (drop `currentDepth` from the relevant `GuidePanel` `useCallback` deps — or an equivalent real captured value), run `pnpm run lint`, capture the `react-hooks/exhaustive-deps` error, then revert to green. Record the evidence.

### Watch-outs / do-NOT

- **Do NOT** weaken the rule to `'warn'` to make the gate pass — A6's intent is a hard error that blocks CI. `'error'` is the AC.
- **Do NOT** widen the glob to lint `.astro` or Node/api/scripts files with react-hooks (noise / false positives). Islands-only.
- **Do NOT** add `eslint-plugin-react` (the broader React rules) — out of scope; only the two `react-hooks/*` rules are wanted. (The Perplexity note mentions `eslint-plugin-react`'s ESLint-10 peer-dep lag — not relevant here; we add only `eslint-plugin-react-hooks`.)
- **Reduced-motion / async-set-state context (Rule 12 background):** the islands gate behaviors on values set after mount — `WebGLSetpiece`/`GuidePill` read `motionAllowed` (set by an `onMotionAllowed` effect), `GuidePanel` reads `currentDepth` (a store subscription) and `motionAllowed`. These are exactly the captured-reactive-values the rule polices. If `exhaustive-deps` flags one of these and adding it to the deps would change behavior, that is a *latent bug being surfaced* — fix it (and consider whether an existing e2e should assert the on-path per Rule 12/13), do not suppress it blindly.
- A lint/config-only change should not alter `dist` — but still run `check-deterministic` per AC4 to be safe (the canonical gate, Rule 5).

### Testing requirements

- This story's verification is primarily the **canonical gate itself** (`pnpm test:all`) plus the **mutation proof** (AC3) — the rule's value IS that lint reds on the bug class. There is no new product behavior to e2e.
- Run the **canonical ROOT gate verbatim** (Rule 5): `pnpm run typecheck && pnpm run lint && pnpm run format:check && pnpm run test && pnpm run test:e2e && pnpm run lh` (i.e. `pnpm test:all`). A scoped/narrowed lint is NOT sufficient — the root `eslint .` and root `format:check` (which formats the edited `eslint.config.js`) must both be green.
- Record the AC3 mutation evidence (the exact command, the `react-hooks/exhaustive-deps` error text naming the dropped dep, and the revert-to-green) in the Debug Log per Rule 12.
- If any island dep-array fix changes effect/callback re-run timing, confirm the affected island's existing Playwright e2e still passes (Rule 12: assert the gated behavior on the real path — these should already exist for GuidePanel/InviteForm; if the fix exposes a vacuous off-case-only test, note it for QA).

## File List

Dev + QA combined (confirmed against `git status` at code-review):

- `package.json` (root) — added `eslint-plugin-react-hooks ^7.1.1` devDependency
- `pnpm-lock.yaml` — lockfile update (resolves the plugin from the root store)
- `eslint.config.js` — `import reactHooks` + islands-scoped flat-config block (`files: ['web/src/islands/**/*.{ts,tsx}']`, both `react-hooks/*` rules `'error'`)
- `web/test/eslint-react-hooks-config.test.ts` (NEW, QA) — 7-test config-assertion regression guard
- `_bmad-output/implementation-artifacts/tests/test-summary.md` (QA) — test summary
- No `web/src/islands/*.tsx` change was needed — the four existing islands were already clean (the Epic-5 `currentDepth`/`motionAllowed` fixes hold).

## Tasks

- [ ] Add `eslint-plugin-react-hooks` (latest v6+) to root devDependencies; install; commit lockfile. Resolve the ESLint-10 peer-dep warning per Dev Notes (warning OK; strict block → scoped relaxation, not an old-version pin).
- [ ] Edit `eslint.config.js`: import `reactHooks`; add the islands-scoped block with `rules-of-hooks` + `exhaustive-deps` both `'error'`. Keep existing blocks + `ignores`.
- [ ] `pnpm run lint`; fix every `react-hooks/*` error (prefer correcting the dep array; line-level documented disable only where omission is provably correct).
- [ ] Verify AC1 via `eslint --print-config web/src/islands/GuidePanel.tsx` (both rules `"error"`).
- [ ] AC3 mutation proof: drop a real captured dep (e.g. `currentDepth` in `GuidePanel.sendQuery`), confirm `pnpm run lint` reds with the exhaustive-deps error, revert to green; record evidence.
- [ ] Run the canonical gate `pnpm test:all` (verbatim) + `pnpm run check-deterministic`; all green.

---

## Appendix — Epic-5 → Epic-6 retro-review triage

**Triage covers:** Epic-5 retrospective (`epic-5-retro-2026-06-08.md`) action items A1–A6 + every still-open entry in `deferred-work.md` (the Epic-5 sections: 5.1 / 5.2 / 5.3 / 5.4 code-review + smoke + the Epic-5 deploy smoke). Older Epic 1–4 deferred items were triaged and closed in the prior Story 2.0 / 3.0 / 4.0 / 5.0 cleanup rounds and are not re-litigated here. Date: 2026-06-08.

**Legend:** INCLUDE = built in this Story 6.0 · DEFER = stays tracked in `deferred-work.md` with a named home · DROP = already resolved / moot.

| Item | Source | Triage decision |
|---|---|---|
| **A6 — enable `react-hooks/exhaustive-deps` (Rule 12 mechanical guard)** | Epic-5 retro A6 | **INCLUDE** — the one item that pre-empts a class of bug (the 5.2/5.4 stale-closure recurrence) in Epic 6's NEW React islands (6.2/6.3/6.4). Built here. |
| A1 — codify Rules 12 + 13 | Epic-5 retro A1 | **DROP (done)** — completed in the Epic-5 retro commit; both rules present in `.claude/rules/project-rules.md`. |
| A2 — make claude-haiku-4-5 the committed `GUIDE_LLM_MODEL` default | Epic-5 retro A2 | **DROP (done)** — committed `223eef6`; `env.ts` + `.env.example` updated, gate green. |
| A3 — re-confirm the `/api/guide` 15s answer-latency ceiling is comfortable now the default model is fast (or raise it if a slow model is re-selected) | Epic-5 retro A3 | **DEFER** — NFR-4; default is now claude-haiku-4-5 (~2-3s, comfortably under 15s). Re-measure at the next Guide model change. Operator/telemetry, not code work now. |
| A4 / [5.3 NFR-4] / [5.3-smoke NFR-4] — re-curation adds a 2nd LLM round-trip per grounded turn; consider folding classification into the answer call (structured output) or caching per-thread intent | Epic-5 retro A4 + deferred-work [5.3] (CR + smoke) | **DEFER** — NFR-4/NFR-7 latency tuning; best driven by production telemetry, not a guess. Co-own with Guide owner. |
| [deploy · MED · NFR-4] live Guide answer hit the 15s ceiling because gpt-5-mini streaming (~16.5s) exceeded it | deferred-work, Epic-5 deploy smoke | **DEFER (mitigated)** — root cause was the model; A2 switched the committed default to fast claude-haiku-4-5, so the live ceiling trip no longer reproduces. The ceiling-vs-model re-measure folds into A3. Keep tracked under NFR-4. |
| [5.2 · LOW] `skim` Depth Dial instruction only approximately honored; skim↔deep contrast modest | deferred-work, 5.2 smoke | **DEFER** — soft-instruction LLM limitation; AC2 core ("Guide matches chosen depth") holds + mutation-verified. Strengthen the `DEPTH_INSTRUCTIONS` skim entry / post-process under NFR-7 telemetry. |
| [5.3 · LOW · observability] classifier path runs `detectInjection` for side-effect but discards it (never logged) | deferred-work, 5.3 CR | **DEFER** — not a security hole (route-level Step-4 log already counts the injection signal; order is server-owned from the table). Delete the dead call or wire a distinct `classifier_injection_attempt` signal under NFR-7. |
| [5.3 · LOW · dead-code] / [5.4 · LOW · dead-code] `resetRecuration` exported with no consumer / no test (carryover 5.3→5.4) | deferred-work, 5.3 + 5.4 CR | **DEFER → Story 6.3** — the Glass Box guided tour (6.3) is the natural Guide-lifecycle pass that decides wire-to-Guide-close (with a binding e2e per Rule 8) vs. delete the export. Named home assigned. |
| [5.3 · LOW · cosmetic] inert `transition: order 0ms` placeholder on `.home > section` | deferred-work, 5.3 CR | **DEFER** — inert (CSS `order` is not animatable), correctly comment-flagged, byte-deterministic. Revisit only if a reorder transition is ever authored (would use FLIP/transform). |
| [5.1 · LOW · cosmetic] cinematic still poster `<img loading="lazy">` on an above-the-fold fixed element | deferred-work, 5.1 CR | **DEFER** — owner discretion; lh green at perf 0.98, the still is not LCP, the SVG is ~6KB; patching risks an unmeasured FCP change with no proven benefit. |
| [5.4 · LOW · edge-case cosmetic] DEEPEN while the GLOBAL dial is simultaneously at `skim` shows the deep block but not the overview prose | deferred-work, 5.4 CR | **DEFER** — rare JS-on dial × deepen cross-product; not an FR-8 issue (nothing the static/JS-off fallback protects is hidden); patching risks re-showing prose the visitor skimmed away. |
| Launch/operator: `PUBLIC_CONTACT_EMAIL` mailto; `MAIL_*` email validation; SPF/DKIM + `RESEND_API_KEY` for live invite email; `PUBLIC_UMAMI_*` analytics | Epic-5 retro A5 + carry-forward launch items | **DEFER** — operator launch steps (secrets / DNS config), not code work. Stay tracked as launch gates. |
| [5.1 · HIGH · ✅ RESOLVED] Draco `draco_wasm_wrapper.js` 404 → canvas=0 | deferred-work, 5.1 CR | **DROP** — auto-resolved inline during the 5.1 code review (matching wrapper/decoder pair copied; mutation-locked). |
| [5.1 · MED · ✅ RESOLVED] `goToScene()` no-op — `ScrollToPlugin` unregistered | deferred-work, 5.1 CR | **DROP** — auto-resolved inline during the 5.1 code review (`registerPlugin(ScrollTrigger, ScrollToPlugin)`; mutation-locked). |
| [5.4 · HIGH · ✅ RESOLVED] DEEPEN visual no-op — section-scoped `data-depth` had no CSS consumer | deferred-work, 5.4 CR | **DROP** — auto-resolved inline during the 5.4 code review (per-section CSS consumer added; e2e (j) strengthened to assert visible-deep; mutation-locked). |

**Summary:** INCLUDED 1 (A6 / Rule-12 guard) · DEFERRED 9 (NFR-4/telemetry latency cluster, classifier-log, resetRecuration→6.3, two cosmetics, skim-adherence, launch/operator set) · DROPPED 5 (A1, A2 done; three ✅-RESOLVED HIGH/MED).

---

## Code Review (2026-06-08, model=claude-opus-4-8[1m]) — APPROVED

Adversarial code review of the FINAL combined dev+QA state, fresh against the real config/runtime (skill-rules Rule 3/8, project Rules 5/8/12/13). Branch `PORT-1-epic6`; no `git checkout`/`commit`/`push`; mutation tests used absolute-path `cp` backup/restore (not git) and verified zero residual diff.

**Verdict: clean review — 0 findings (0 decision-needed, 0 patch, 0 defer, 0 dismissed). All four ACs PASS, reproduced independently.**

### Independently reproduced evidence (not trusting upstream)

- **AC1 (rule enabled as ERROR, islands-scoped).** `eslint --print-config web/src/islands/GuidePanel.tsx` → `react-hooks/exhaustive-deps` and `react-hooks/rules-of-hooks` both resolve to `[2]` (error). On the non-island `web/src/components/hero/HeroStatic.astro`, both are `undefined` (absent). Scope is correct — islands-only, no repo-wide leak. `eslint-plugin-react-hooks ^7.1.1` is a root devDependency, lockfile resolves it.
- **Peer-dep situation is CLEAN.** Installed `eslint-plugin-react-hooks@7.1.1` declares `peerDependencies.eslint` including `^10.0.0` — so under ESLint `10.4.1` there is NO peer-dep warning/conflict at all (the story anticipated a v6 warning; v7.1.1 explicitly supports ESLint 10). No strict-peer relaxation/override was needed; install is clean.
- **AC2 (suite green).** `pnpm run lint` (root `eslint .`) exits 0 with zero `react-hooks/*` errors. The four existing islands are genuinely clean — no island `.tsx` edit was required (the Epic-5 `currentDepth`/`motionAllowed` fixes hold; `GuidePanel.sendQuery` deps at line 406 already list both, with explanatory comments).
- **AC3 (mutation proof, reproduced fresh — Rule 12).** Backed up `GuidePanel.tsx` to `/tmp`, dropped `currentDepth` from the `sendQuery` `useCallback` deps (the exact 5.2 bug) → `pnpm run lint` FAILED **exit 1** with `406:5 error React Hook useCallback has a missing dependency: 'currentDepth'. … react-hooks/exhaustive-deps`. Restored from backup → `git diff HEAD` empty, `pnpm run lint` exit 0. The rule catches the bug CLASS, not merely that it is installed.
- **AC4 (canonical gate, Rule 5 — run verbatim).** `pnpm test:all`: typecheck exit 0 (0 errors; pre-existing unrelated `ts(6196)` hint only) → lint exit 0 → `format:check` (root `prettier --check .`, covers the new test + edited `eslint.config.js`) exit 0 → test exit 0 (web 678 / api 219 / scripts 160 pass; the new guard runs in the default web suite) → test:e2e exit 0 (278 passed, 1 long-standing conditional motion/WebGL skip — unrelated, not a regression) → lh exit 0. `pnpm run check-deterministic` PASS — `web/dist` byte-identical across two clean builds (tree hash `17e4db77…`); the config/dep-only change does not touch `dist`.

### QA guard scrutiny (`web/test/eslint-react-hooks-config.test.ts`, Rule 8 — verified, not assumed)

- Binds the **REAL resolved config** via `eslint --print-config` (cwd = repo root, same surface as `eslint .`) — NOT an inline copy of the rule values.
- Each assertion is **scoped** to a specific rule's resolved severity for a specific file — not a whole-output `toContain` a different surface could satisfy.
- **Discoverable** by the default `vitest run`: `web/vitest.config.ts` `include` matches `test/**/*.test.ts`; the `test` script is `vitest run`; not ignore-excluded. Baseline 7/7 pass; prettier-clean.
- **Mutation-verified RED (reproduced independently):** (A) downgrade `exhaustive-deps`→`warn` ⇒ 4 island tests red; (B) remove `rules-of-hooks` entirely ⇒ 4 island tests red; (C) widen glob to `**/*.{ts,tsx}` ⇒ exactly 1 scope-guard test red. Config restored byte-identical each time (final `eslint.config.js` md5 unchanged; `git diff HEAD` shows only the legit +18-line block).

### Rules check

- **Rule 3 (real-runtime evidence):** the "surface" here is the lint rule; its real-runtime evidence is the fresh mutation proof (lint reds on the real island) + the non-vacuous config-assertion guard. Both confirmed real, not vacuous. Satisfied.
- **Rule 5 (NFR tripwire):** N/A — no NFR worked around.
- **Rule 6 (ADR):** N/A — no `docs/adr/` registry.
- **Rule 1/2 (Integration ACs):** N/A — config/dep-only; introduces no service/consumer.
- **Rule 12/13 (the point of the story):** the guard asserts the ON-path bug class (mutation reds), not mere presence — and the protected behaviors (`currentDepth`/`motionAllowed` in `GuidePanel`) are already correctly wired. Satisfied.

### Tracking-doc fixes applied by code review (no code change)

- `sprint-status.yaml`: `6-0-epic-5-deferred-cleanup` advanced `ready-for-dev` → `review` (dev+QA had completed but left it stale); `last_updated` bumped. The lead flips to `done` after the per-story smoke gate.
- This story file: filled the previously-`_(dev fills in)_` File List with the confirmed combined dev+QA file set; added this Code Review section.

No findings to add to `deferred-work.md` (the 9 Epic-5 deferrals are already tracked there from the triage above).
