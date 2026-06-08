# Story 5.3: Agent re-curation by stated intent

---
baseline_commit: 1dd615ce63f674b3243940714cc90229d7eebddd
---

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- /epic-cycle Epic-5 Story 5.3. Two lead↔owner (Josh) decisions taken at story creation (2026-06-08):
       (1) Re-curation FORM = "Actually reorder the on-page scenes (DOM)" — the home scene SEQUENCE is
           re-ordered per intent (not just a jump-list, not only a guided camera tour).
       (2) Intent DETECTION = "LLM-classified intent (most agentic)" — a server-side step classifies the
           visitor's free-form conversation into a constrained intent.
     SAFE REALIZATION of those choices (read the Central Risks):
       - "Reorder the DOM" is realized via CSS `order` on a flex `<main class="home">`: the served DOM /
         JS-off / crawler order stays CANONICAL (FR-8/NFR-3 + SEO safe); JS-on visually re-sequences the
         scenes. So we get "the page itself re-curates" WITHOUT hiding content from the static fallback or
         changing the crawlable order.
       - "LLM-classified intent" = the LLM picks ONLY a constrained ENUM intent; the api owns a fixed,
         SM-C1-guarded intent→order TABLE (the model never emits a raw order). Untrusted input stays DATA
         (injection-safe, same contract as the Guide answer). A GUIDE_LLM_STUB path makes the classifier
         deterministic so AC1 ("two intents → demonstrably different orderings") is reliably testable.
     SM-C1 is a HARD guard: hero always first; the Speaker scene is NEVER removed/buried (organizer →
     Speaker right after hero); the hero "I'm here to book a talk" bypass + the /speaking deep link are
     untouched + always reachable without chat. Wings/playables (the FR-10 examples) are Epic 7 — the
     mapping is over the 7 EXISTING scenes (hero/thesis/timeline/speaker/flagship/glass-box/close). -->

## Story

As a visitor telling the Guide what I'm here for,
I want the site to re-curate around my intent — re-ordering the home Scenes so what matters to me comes first,
so that an organizer is taken to the Speaker Surface first, a "show me something cool" visitor gets the flagship demo first, and a builder/agentic-curious visitor gets the Glass Box / flagship first — while a visitor who says nothing gets the sensible default arc, nothing is ever hidden from the static fallback, and the organizer fast path is never buried (SM-C1).

## Context & decision (read first)

Epic 5 Story 5.3 — **agent-adaptive re-curation (FR-10)**. The Guide classifies the visitor's stated intent and the home Scenes re-order around it. This is the producer of the re-curation engine that **Story 5.4 (director's-mode)** extends (deepen/skip + conversational driving). It composes with Story 5.1's camera path (`window.__cinematicHandle.goToScene`) and Story 5.2's `$depth`.

**Wings & playables don't exist yet** (Epic 7). FR-10's examples name them, but the mapping here is over the **7 existing scenes**: `hero`, `thesis`, `timeline`, `speaker`, `flagship` (loandemo), `glass-box`, `close`.

### The two owner decisions (LOCKED) + their safe realization

1. **Re-curation FORM = reorder the on-page scenes (DOM).** Realized via **CSS `order`** on a flex `<main class="home">`: each `<section>` gets a CSS `order` value set by a JS controller from the re-curation directive. The **served DOM order stays CANONICAL** — crawlers and JS-off visitors see `hero → thesis → timeline → speaker → flagship → glass-box → close` with ALL content (FR-8/NFR-3 + SEO unaffected); only the JS-on VISUAL sequence re-orders. This delivers "the page re-curates around me" without hiding anything from the static fallback or changing the crawlable order. (Do NOT physically move the `<section>` nodes in the DOM at runtime — use CSS `order` so the canonical DOM + a11y/reading order baseline is preserved and SM-C1/FR-8 hold by construction. Manage focus/scroll so keyboard order tracks the visual order when a re-curation is applied.)

2. **Intent DETECTION = LLM-classified intent.** A **server-side** classification step (in the api) maps the visitor's free-form conversation to ONE of a small constrained set of intents: `organizer` · `builder` · `explorer` · `default`. **The model picks only the enum token** (a structured/constrained classification — a cheap LLM call returning a single label, or folded into the guide turn). **The api owns a fixed intent→order TABLE** and emits the resulting order — the LLM never emits a raw ordering, so a confused/adversarial classification can at worst pick the wrong *bucket*, never an arbitrary/malicious sequence. Untrusted visitor text stays DATA (injection-safe; reuse the Guide's `role:'system'` separation + `detectInjection`/`neutralizeDelimiters`). The classified intent + order are emitted to the client as a NEW SSE event on `/api/guide` (e.g. `recuration` → `{ intent, order: SceneId[] }`).

### Central risks (the load-bearing constraints)

- **SM-C1 (HARD guard — never bury the organizer).** The intent→order TABLE MUST: keep `hero` first in every ordering; keep `speaker` PRESENT in every ordering (never removed); place `speaker` early for `organizer` (right after hero). The hero fork's "I'm here to book a talk" → `/speaking` bypass and the `/speaking` deep link are UNTOUCHED and reachable without the Guide. Add a server-side assertion that every table entry is a permutation of all 7 scenes with `hero` first (no scene dropped — dropping/skipping is Story 5.4, not 5.3).
- **FR-8 / NFR-3 (nothing hidden; crawlable).** The served DOM order is canonical; JS-off + crawlers get the full default arc. The reorder is CSS-`order`-only (visual), never a content removal or a DOM mutation that changes the crawlable order.
- **Security (the Guide is the product's security core).** Classifying untrusted input must NOT weaken FR-6/7/9: the classification prompt is server-side, untrusted input is DATA, injection patterns are detected/neutralized, and the model's output is constrained to the enum (validated server-side; an out-of-set label falls back to `default`). The existing grounded-answer path + fail-closed behavior are unchanged.
- **Testability (AC1 reliability).** A real LLM classifier is nondeterministic. Provide a **deterministic classifier path under `GUIDE_LLM_STUB`** (the stub returns a fixed intent for a given input, mirroring the existing guide stub) so the e2e can assert "intent A → order X; intent B → order Y; X ≠ Y" reliably (Rule 7/8). The real-LLM classification is verified by the lead smoke (like Story 5.2's agent smoke).
- **Reduced-motion / NFR-2.** Applying a new order is allowed under reduced motion (it's a layout change, not an animation) but any TRANSITION between orders is authored under `@media (prefers-reduced-motion: no-preference)`; if the camera path is driven to the re-ordered tour, that driving stays inside the existing `onMotionAllowed` gate (reduced-motion → the order still applies, just no camera animation).

### Intent → order table (over the 7 existing scenes; SM-C1-guarded)

| intent | order (hero always first; speaker always present) |
|---|---|
| `default` | hero · thesis · timeline · speaker · flagship · glass-box · close |
| `organizer` | hero · **speaker** · flagship · timeline · glass-box · thesis · close |
| `builder` | hero · **glass-box** · flagship · thesis · timeline · speaker · close |
| `explorer` | hero · **flagship** · glass-box · timeline · speaker · thesis · close |

(`close` stays last in every order. The dev may refine the non-leading positions, but the lead-elements + SM-C1 invariants above are fixed.)

## Acceptance Criteria

1. **Two visitors stating different intents get demonstrably different orderings (FR-10).**
   **Given** two visitors who state different intents to the Guide (e.g. an organizer vs a "show me something cool" explorer)
   **When** each converses with the Guide
   **Then** they receive demonstrably different home Scene orderings — the organizer is taken to the Speaker Surface first, the explorer gets the flagship demo first, the builder/agentic-curious gets the Glass Box / flagship first — driven by the server-classified intent + the SM-C1-guarded intent→order table, applied as the visible scene sequence.

2. **Re-curation is reflected in-place without losing static reachability (FR-8).**
   **Given** a re-curation is applied
   **When** it takes effect
   **Then** it is reflected in place (the visible Scene sequence re-orders via CSS `order`, no navigation/reload), AND the Lean Static Fallback still reaches ALL content — the served DOM order is canonical, JS-off + crawlers see the full default arc with every scene present, and nothing is hidden by the re-curation.

3. **The organizer fast path is never buried (counter-metric SM-C1).**
   **Given** any re-curation
   **When** it runs
   **Then** the hero "I'm here to book a talk" → `/speaking` bypass and the `/speaking` deep link remain reachable WITHOUT chat, `hero` stays first, the `speaker` scene is never removed/buried (present in every ordering; first-after-hero for `organizer`), and a server-side guard asserts every intent→order entry is a permutation of all 7 scenes with `hero` first.

4. **A sensible default always exists; classification is safe + bounded.**
   **Given** a visitor who states no intent (or an unclassifiable / adversarial input)
   **When** the Guide processes it
   **Then** the default arc is used (no re-curation, or `intent=default`), the model's classification is constrained to the 4-intent enum (an out-of-set/empty result → `default`), untrusted input is treated as DATA (injection-safe — FR-9 unchanged), and the grounded-answer + fail-closed behavior of `/api/guide` is unchanged (re-curation is additive — absent it, today's Guide behavior holds).

5. **Non-vacuous, discoverable, real-runtime tests lock the behaviors (Rule 3, 7, 8).**
   **Given** the changes
   **When** the default `pnpm test:all` suite runs
   **Then** with the deterministic `GUIDE_LLM_STUB` classifier path: an e2e asserts two different stated intents produce two DIFFERENT visible orderings (organizer → speaker first; explorer → flagship first) applied in place with no navigation; an api test asserts the intent→order table is SM-C1-valid (every entry a permutation of all 7 with hero first, speaker present) and that classification is constrained to the enum (out-of-set → default) and injection-safe; a JS-off/crawler test asserts the canonical DOM order is unchanged (FR-8). Tests scoped to the real surfaces, discoverable (the api/shared additions tested in the runner-bearing `api` package), mutation-verified; the re-curation SSE e2e proven to RUN (not skipped, via the prod-faithful proxy).

6. **The LITERAL canonical gate `pnpm test:all` is green and the build stays byte-deterministic (Rule 5, NFR-1/6).**
   **Given** `pnpm test:all` (+ `pnpm run check-deterministic`)
   **When** the literal command runs end-to-end
   **Then** every step incl. `lh` is green (Lighthouse `/` + `/about/` within budget — re-curation adds only a small controller + a server step, no heavy initial JS), and the build is byte-deterministic.

## Integration ACs

This story introduces the re-curation engine (a producer) AND wires its first end-to-end use here (intent → ordering → applied to the page), so the integration is verified now (AC1/AC5), not forward-referenced. Per skill-rules Rule 1: the engine's NEXT consumer is **Story 5.4 (director's-mode deepen/skip + conversational driving)** — 5.3 exposes a clean surface (the `recuration` SSE directive + the web apply-order controller) that 5.4 extends; 5.3 does NOT build skip/deepen. The `recuration` event is additive to the existing `/api/guide` SSE contract (`token`/`citation`/`done`/`error`) and backward-compatible (a client that ignores it still works; absent classification = today's behavior).

## Tasks / Subtasks

- [x] **Task 1 — Server-side intent classification + the SM-C1-guarded order table (AC1, AC3, AC4).**
  - [x] In the api, add a constrained intent classifier: maps the visitor conversation → one of `organizer|builder|explorer|default` (the model emits ONLY the enum label — a cheap structured call or folded into the guide turn; a `GUIDE_LLM_STUB` deterministic path for tests). Untrusted input stays DATA (reuse `SYSTEM_PERSONA`-style separation + `detectInjection`/`neutralizeDelimiters`); out-of-set/empty → `default`.
  - [x] Add the fixed intent→order TABLE + a guard asserting every entry is a permutation of all 7 SceneIds with `hero` first + `speaker` present (no drop). Order comes from the table, never from the model.
  - [x] Emit a `recuration` SSE event `{ intent, order: SceneId[] }` from `/api/guide` (additive; define its wire shape in `shared/src/events.ts` alongside the existing events).
- [x] **Task 2 — Web: apply the order via CSS `order`, canonical DOM preserved (AC1, AC2, AC3).**
  - [x] Make `<main class="home">` a flex column; give each `<section>` a CSS custom-property-driven `order`. Default (no directive / JS-off) = canonical DOM order. A controller (e.g. `web/src/lib/recuration.ts`) consumes the `recuration` directive (via the GuidePanel) and sets per-scene `order`; compose with the camera (`__cinematicHandle.goToScene`) + `$depth`. Manage focus/scroll so keyboard order follows the visual order. Reduced-motion: the order still applies; only transitions are gated.
  - [x] GuidePanel reads the `recuration` SSE event and invokes the controller. The hero bypass + `/speaking` + the scene-rail anchors stay intact (SM-C1).
- [x] **Task 3 — Tests (AC5) + the literal gate (AC6).**
  - [x] e2e (stub classifier): two intents → two different visible orderings in place (organizer → speaker first; explorer → flagship first), no navigation; JS-off → canonical DOM order unchanged (FR-8). api tests: the order table is SM-C1-valid (permutation+hero-first+speaker-present, mutation-verified), classification constrained to the enum (out-of-set → default) + injection-safe, the grounded-answer/fail-closed path unchanged. Run the LITERAL `pnpm test:all` + `check-deterministic`.

## Dev Notes

### Current state (files to modify / create — read before editing)

- **`web/src/pages/index.astro`** — `<main class="home">` wraps the 7 `<section>` scenes (hero/thesis/timeline/speaker/flagship/glass-box/close). Make `<main.home>` a flex column + per-section `order` (default = source order). Story 5.1's cinematic still + bootstrap and Story 5.2's depth tiers live here — don't disturb them. The hero fork ("I'm here to book a talk" → `/speaking`) is in `HeroStatic` — must stay (SM-C1).
- **`api/src/routes/guide.ts`** — the SSE handler (same-origin guard → rate-limit → GuideQuery validate → retrieve → ground → stream `token`/`citation`/`done`/`error`). Add the classification step + emit the `recuration` event. Keep the existing flow + fail-closed (no model call below threshold) intact; classification must not break that.
- **`api/src/lib/grounding.ts`** — `SYSTEM_PERSONA`, `detectInjection`, `neutralizeDelimiters`, `assembleGroundedPrompt`. Reuse the injection-safety primitives for the classifier; the classifier's system prompt is server-side; untrusted input is DATA.
- **`shared/src/events.ts`** — the SSE event wire shapes (`token`/`citation`/`done`/`error`). Add `recuration` `{ type:'recuration', intent, order }`. **`shared/src/schemas.ts`** — `GuideQuery` (query/threadContext/depth). (No new request field needed — intent is classified from the conversation; if a field helps testing, keep it optional + test in `api`.)
- **`web/src/islands/GuidePanel.tsx`** — consumes the SSE events; add handling for `recuration` → call the web re-curation controller.
- **`web/src/lib/cinematic/index.ts`** — exposes `__cinematicHandle.goToScene(n)`; the controller may drive the re-ordered tour. **`web/src/lib/store.ts`** — `$guideOpen`, `$depth`; consider a `$sceneOrder` atom if cross-island state helps (optional).
- **Test homes:** `api/src/lib/grounding.test.ts` + `api/src/routes/guide.test.ts` (classifier + table + SSE event — the runner-bearing package; `shared` has NO test runner); `web/e2e/*.spec.ts` (a new `recuration`/re-curation spec via the prod-faithful `serve-with-api.mjs` proxy, stub classifier); `web/test/build-output.test.ts` (canonical DOM order / NFR-1).

### Constraints / invariants to preserve

- **SM-C1 (hard):** hero first; speaker never buried/removed; hero bypass + `/speaking` reachable without chat; server-side permutation guard.
- **FR-8/NFR-3:** canonical served DOM order; JS-off + crawlers get the full default arc; reorder is CSS-`order`-only (visual), no content removal, no crawlable-order change.
- **Security (FR-6/7/9):** classification of untrusted input stays injection-safe; model output constrained to the enum (out-of-set → default); grounded-answer + fail-closed unchanged; re-curation additive.
- **Rule 5** (literal root gate incl. `lh`), **Rule 7** (the re-curation SSE e2e proven to run via the prod-faithful proxy, not skipped), **Rule 8** (real-surface scoped mutation-verified; api/shared additions tested in `api`), **Rule 3** (real-runtime e2e for the user-facing reorder), **NFR-1** (only a small controller + a server step — keep `/` lh in budget), **NFR-6** (byte-stable).
- Do NOT build Story 5.4 (deepen/skip + conversational scene driving). 5.3 = classify intent → reorder all 7 scenes (no drops). 5.4 adds skip/deepen on top.

### Project Structure Notes

- Web re-curation controller: `web/src/lib/recuration.ts` (plain TS; consumed by the GuidePanel). The `recuration` SSE wire shape: `shared/src/events.ts` (single cross-package contract; tested in `api`). The classifier + order table: api-side (`grounding.ts` / a new `api/src/lib/recuration.ts`), with the order owned server-side (never the model).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3] — the 3 BDD ACs (different intents → different orderings; in-place + static reachability FR-8; SM-C1 never buries the organizer).
- [Source: _bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/prd.md#FR-10] — "the agent re-curates which Wings/Scenes/projects surface based on a visitor's stated intent ('show me something cool' → playable; 'I'm an organizer' → Speaker Surface)."
- [Source: prd.md#§6 Default Scene Arc + SM-C1] — Speaker early-mid by design; SM-C1 guards re-order regressions; the default cut always exists.
- [Source: ux-designs/.../EXPERIENCE.md] — "I'm here to book a talk → /speaking, bypassing the Guide + cinematic (SM-C1)"; "director's-mode re-curation … never hides content from the fallback; never regresses SM-C1."
- [Source: api/src/routes/guide.ts + api/src/lib/grounding.ts] — the SSE flow + injection-safety primitives to reuse for the classifier.
- [Source: shared/src/events.ts] — add the `recuration` event here.
- [Source: web/src/lib/cinematic/index.ts] — `__cinematicHandle.goToScene` (drive the re-ordered tour).
- [Source: .claude/rules/project-rules.md#7] — the re-curation SSE e2e must be PROVEN to execute (prod-faithful proxy, not skipped).
- [Source: .claude/rules/project-rules.md#9] — if any classifier/Guide prose is authored, no fabrication; the order comes from a fixed table, not free model output.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-dev-story)

### Debug Log References

1. **Test (e) false positive** — query `'loandemo case study fintech agentic engineering'` intended to produce `default` intent was stub-classified as `builder` (keyword `agentic` matches). Fixed: changed to `"What is Joshua's educational background and work history?"`.
2. **Prettier format failures** — 4 files failed `format:check` after initial implementation. Fixed by running `pnpm prettier --write` on all affected files.
3. **Rate limiter exhaustion in test:all** — tests (c) and (d) used `Promise.all([triggerRecuration(...), triggerRecuration(...)])` which pushed total guide API calls past the 10/min rate limit when all e2e specs ran sequentially against the same Hono process. Fixed by sharing cached directives from tests (a)/(b) in tests (c)/(d) — no extra API calls.
4. **Missing playwright project entry** — `recuration.spec.ts` existed in `web/e2e/` but was not included in any `playwright.config.ts` project's `testMatch`. Added `recuration` project entry after `depth-dial`.

### Completion Notes List

- SM-C1 startup assertion (`assertSmc1Invariants()`) runs at module load in `api/src/lib/recuration.ts` — a misconfigured table throws immediately on server start.
- Classification is additive: `default` intent emits no `recuration` event → today's guide behavior unchanged.
- `GUIDE_LLM_STUB=1` activates keyword-based deterministic classifier; the real LLM path (`assembleClassifierMessages` + `parseClassifierResponse`) is in place for production.
- CSS `order` approach: `<main class="home">` is `display: flex; flex-direction: column`. Each `<section>` gets `section.style.order = String(i)` from `applyRecuration()`. `initRecuration()` sets `data-recuration-ready` on `main.home` (used by e2e for readiness wait).
- `pnpm test:all`: 272 e2e + 668 web unit + 192 api unit + 160 scripts unit all pass. `check-deterministic`: PASS (byte-identical).

### File List

**New files:**
- `api/src/lib/recuration.ts`
- `api/src/lib/recuration.test.ts`
- `web/src/lib/recuration.ts`
- `web/e2e/recuration.spec.ts`

**Modified files:**
- `shared/src/events.ts` — added `RecurationEvent` + updated `GuideEvent` union
- `api/src/routes/guide.ts` — added classification step (Step 7b) + `emitRecuration` helper
- `api/src/routes/guide.test.ts` — appended `describe('Story 5.3 — Re-curation SSE event')` block (8 tests)
- `web/src/pages/index.astro` — added `display: flex; flex-direction: column` to `.home` CSS
- `web/src/islands/GuidePanel.tsx` — added `recuration` SSE event handling + `initRecuration()` call
- `web/test/build-output.test.ts` — added 2 Story 5.3 FR-8 tests
- `web/playwright.config.ts` — added `recuration` project entry

## Review Findings

### Code review (2026-06-08) — adversarial (Blind / Edge-Case / Acceptance), FINAL state verified fresh

**Verdict: APPROVED. 0 HIGH, 0 MED unresolved. 3 LOW deferred (none block).** Every load-bearing guarantee (SM-C1, fail-closed security, FR-8 canonical DOM, AC1 real-controller binding, Rule 7) was mutation-verified against the REAL build/runtime, not just read.

**Canonical gate (re-run inline by the reviewer):**
- `pnpm test:all` → **exit 0**: typecheck + lint + ROOT `format:check` + vitest (api 192 / web 668 / scripts 160) + Playwright **272 passed, 1 skipped, 0 failed** + `lh` green on `/` (script ≤256KB, perf ≥0.9) and `/about/`. The 1 skip is the pre-existing invite DB test (no local Postgres), NOT a recuration test.
- `pnpm run check-deterministic` → **PASS** (byte-identical, tree hash `4e98a94c…`). NFR-6 holds.

**Focus-area verifications (each mutation-confirmed):**
1. **SM-C1 (HARD) — confirmed.** `assertSmc1Invariants()` runs at module load (`recuration.ts:128`) and HARD-throws on a misconfigured table. Independently mutation-verified twice against the REAL table: (a) breaking organizer hero-first (`['speaker','hero',…]`) → `SM-C1 VIOLATION … does not start with "hero"` thrown at import → the whole `recuration.test.ts` suite reds (0 tests run); (b) dropping `speaker` from organizer (thesis-dup) → the permutation check throws `… not a permutation … Missing/extra: thesis vs speaker`. Reverted byte-clean both times. The table is a permutation of all 7 with hero first + speaker present (organizer → speaker first-after-hero). The hero `/speaking/` bypass is present + visible JS-off without chat (e2e (f), real build, green).
2. **Security (FR-6/7/9) — confirmed.** Step 7b classification fires ONLY on the grounded path: `guide.ts` returns early at the fail-closed threshold gate (`:242–250`) BEFORE classification (`:280`). guide.test.ts (f) confirms below-threshold → NO recuration event + no model call (fail-closed UNCHANGED). The model emits ONLY the enum (`parseClassifierResponse` normalizes + `VALID_INTENTS.includes` → out-of-set/empty/multi-word → `default`, tested + mutation-noted); the order is server-owned (`getOrderForIntent` → `INTENT_ORDER_TABLE`), never model-emitted. Untrusted text stays DATA: `assembleClassifierMessages` applies the SAME `={3,}…={3,}` delimiter-neutralization as grounding's `neutralizeDelimiters` (inlined, byte-identical regex) + `detectInjection`, in a `role:'system'` separated prompt.
3. **FR-8 / NFR-3 — confirmed.** Reorder is CSS-`order`-only on a flex `<main class="home">` (index.astro `:606–609`); the DOM section order is canonical (build-output FR-8 test + e2e (e) JS-off, both green). **AC1 non-vacuous — confirmed by mutation:** no-op'ing the real `applyRecuration` and running ONLY the `recuration` project → test **(g) RED** (timed out waiting for speaker→order 1) while **(a)–(d) stayed GREEN** (they inline the CSS-order assignment in `page.evaluate`). This proves (g) is the ONLY test binding the production `applyRecuration` + GuidePanel SSE wiring end-to-end — exactly the Rule-8 gap QA closed. Reverted byte-clean.
4. **Integration ACs / Rule 1 — confirmed.** The producer (the `recuration` SSE directive + the web `applyRecuration` controller) is wired end-to-end here (AC1/AC5 verified now, not forward-referenced); the "next consumer is Story 5.4" declaration is present + accurate. `RecurationEvent` is additive to `GuideEvent` (typecheck green across shared→api→web); a client ignoring it still works; `default` intent emits no event (today's behavior — guide.test.ts (e)).
5. **NFR-1 / NFR-6 — confirmed** (`lh` green within the 256KB `/` budget; `check-deterministic` byte-stable). No regression to 5.0/5.1/5.2 (their e2e projects all green in the same run).

**LOW findings (deferred → deferred-work.md, story 5.3 — none block):**
- **[5.3 · LOW · observability]** `assembleClassifierMessages` calls `detectInjection(conversationText)` for side-effect only (`recuration.ts:213`) and discards the result; neither it nor `classifyIntent` logs an `injectionAttempt` for the classifier path. Not a security hole — the route already logs injection on the query (`guide.ts:223–228`), neutralization still runs, and the enum constraint is the real guard. Cosmetic/observability only.
- **[5.3 · LOW · dead-code]** `resetRecuration` (web/src/lib/recuration.ts) is exported but has no consumer and no test. A plausible Story-5.4 surface (clear re-curation on Guide close), but unused/untested as shipped.
- **[5.3 · LOW · cosmetic]** index.astro `:613–617` `@media (prefers-reduced-motion: no-preference) { .home > section { transition: order 0ms; } }` is a self-described placeholder (CSS `order` is not animatable). Inert; the comment correctly flags it. No order-change transition is actually authored — acceptable (the order applies; no animation needed).

**Dismissed (no action):** (a) The table comment claims "close stays last in every ordering" but the startup assertion does not assert it — by design (the story makes close-last a soft preference: "the dev may refine the non-leading positions, but the lead-elements + SM-C1 invariants … are fixed"); all 4 entries do keep close last anyway. (b) `getSectionVisualOrder` reads `el.style.order` before computed style — correct, since the real controller sets `section.style.order`. (c) Tests (c)/(d) reuse cached directives from (a)/(b) to avoid the 10/min rate-limit when the full suite runs against one Hono process (dev Debug Log #3) — sound, no extra API calls; verified green in the full `test:all` run.
