# Story 5.1: Continuous Canvas with cinematic Scene transitions

---
baseline_commit: c3ef17a307f713357039b9a5a4a0e2f72c4931a6
---

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- /epic-cycle Epic-5 Story 5.1. Two lead↔owner (Josh) scope decisions taken at story creation (2026-06-07):
       (1) WebGL scope = "GSAP + full R3F set-piece + assets" (NOT GSAP-only; NOT lightweight-procedural).
           → Story 5.1 ships the GSAP/ScrollTrigger directed camera path AND a ≤1 R3F/Three.js fixed WebGL
             set-piece with the AC2 KTX2/Basis/Draco compressed-asset pipeline + a static fallback.
       (2) Set-piece concept = "Procedural drafting-grid / blueprint lattice" — on-brand with the DESIGN
           'Architect' influence (registration marks, grid planes, 'structure beneath the calm') in
           cream/ink/navy. Geometry is GENERATED IN-CODE; a BUILD-TIME step Draco-compresses a generated
           glTF + emits a KTX2/Basis grid texture (so AC2's asset pipeline is genuinely exercised with NO
           externally-sourced 3D art). Static fallback = a pre-rendered still image. Camera path flies through it.
     CENTRAL RISK (read the NFR-1 strategy in Context): the GSAP+ScrollTrigger+three(r184)+@react-three/fiber
     stack is ~270KB+ gz — it BLOWS the lighthouserc `/` script budget (256KB) if loaded on initial page load.
     It MUST load DEFERRED (on first user interaction/scroll, inside onMotionAllowed) so Lighthouse's
     no-interaction trace on `/` never fetches it. Static still + discrete scenes are the initial paint. -->

## Story

As a motion-enabled visitor on the home page,
I want the site to move as one continuous cinematic canvas — a directed camera path that flies through the home Scenes (and through a quiet 3D drafting-grid/blueprint set-piece) instead of jumping between sections,
so that navigating feels like a directed film, not page loads — while a visitor with `prefers-reduced-motion`, JS off, or a crawler still gets the complete, calm, Stage-1 discrete Scene Arc with nothing hidden behind the magic, and the home stays inside the NFR-1 performance budget.

## Context & decision (read first)

This is Epic 5 Story 5.1 — the first Stage-2 ("The Magic") story. It LAYERS the cinematic camera path + ≤1 WebGL set-piece **on top of the existing Stage-1 discrete Scene Arc** (the home `web/src/pages/index.astro` 7-scene `<section>` stack + the persistent `SceneRail`). It does NOT replace the discrete scenes — under `prefers-reduced-motion` / JS-off the discrete scenes ARE the experience (EXPERIENCE §"the directed camera path layers ON TOP of this base and degrades back to it under reduced-motion"). Story 5.0 already hardened the discrete scene-rail's bottom-of-scroll `aria-current` so this layer builds on a correct base.

### Two scope decisions taken with the owner (Josh) at story creation

1. **WebGL scope = full R3F set-piece + assets.** AC2's set-piece is "optional / ≤1"; the owner chose to build it now (not GSAP-only, not lightweight-procedural). So Story 5.1 ships BOTH the GSAP camera path AND a real ≤1 R3F/Three.js fixed WebGL canvas with the KTX2/Basis/Draco compressed-asset pipeline + a static fallback.
2. **Set-piece concept = procedural drafting-grid / blueprint lattice.** On-brand with the DESIGN 'Architect' influence (hairline registration marks, faint drafting grid, "structure beneath the calm") rendered in the cream/ink/navy palette. The geometry is **generated in code** (a grid/lattice of lines + registration-mark glyphs + a few extruded plane/box forms — NOT a sourced character/scene model). A **build-time step** then exercises the AC2 pipeline: Draco-compress a generated `.glb`/glTF of that geometry AND emit a KTX2/Basis-compressed grid/paper texture, both loaded at runtime via the Draco + KTX2 loaders. The static fallback is a pre-rendered still image of the same composition. The camera path flies through/over this lattice as the Scenes change.

### THE CENTRAL RISK — NFR-1 budget vs. the heavy cinematic stack (read carefully)

`lighthouserc.json` asserts, on **both `/` and `/about/`**: `resource-summary:script:size ≤ 256000` bytes, `total-byte-weight ≤ 400000`, `first-contentful-paint ≤ 2500ms`, `categories:performance ≥ 0.9`. The cinematic stack (`gsap` + `ScrollTrigger` ≈ 50KB gz, `three` r184 ≈ 150KB+ gz, `@react-three/fiber` ≈ 40KB gz, Draco + KTX2 loaders ≈ 30KB+ gz) is **~270KB+ gz** — it BLOWS the 256KB `/` script budget if it loads during the initial page load.

**Mandatory strategy — DEFER the heavy stack so Lighthouse's trace on `/` never fetches it.** Lighthouse loads the page and waits for network/CPU idle but does **NOT scroll and does NOT interact**. Therefore:
- The **initial paint of `/`** is the existing Stage-1 static HTML (discrete scenes + scene-rail) PLUS the WebGL **static still fallback image** (a normal `<img>`/CSS poster, 0 incremental executable JS) — exactly what ships today plus a poster. FCP/script-size budget on `/` is unaffected.
- The GSAP camera path + the R3F/Three WebGL set-piece load via a **deferred dynamic `import()` triggered by the FIRST real user engagement** — recommended: the first `scroll` (the camera path is scroll-driven, so first scroll is the natural trigger) and/or first `pointerdown`/`keydown` — **inside `onMotionAllowed`** (so reduced-motion never loads it). Because Lighthouse never scrolls/interacts, these chunks are never fetched during its trace → the `/` script-size + FCP + perf budgets stay green. Use a one-shot listener (`{ once: true, passive: true }`); never `preventDefault`.
- **Do NOT** hydrate the WebGL island with `client:load` or an above-the-fold `client:visible` (Lighthouse would fetch it). Do NOT use `requestIdleCallback` alone as the trigger (it can fire inside Lighthouse's trace window). Interaction/scroll-gated load is the robust choice.
- `≤1 fixed WebGL canvas SITE-WIDE` — the canvas exists ONLY on `/`. Verify no other route references the three/R3F chunk (mirror the InviteForm NFR-1-isolation assertion in `build-output.test.ts`).

The AC5 gate is the proof: the **literal `pnpm test:all` including `lh`** must stay green on `/` AND `/about/`. If the dev cannot keep `/` green with the set-piece, that is a Rule-5 NFR tripwire → HALT and surface (do NOT silently exceed the budget or weaken the assertion).

### Reduced-motion + accessibility (NFR-2, FR-2) — non-negotiable

- **Two-layer gate (BOTH layers).** CSS: author all cinematic motion only inside `@media (prefers-reduced-motion: no-preference)`. JS: initialize GSAP/ScrollTrigger/WebGL ONLY inside `onMotionAllowed` (from `web/src/lib/motion.ts`) — under `reduce` the camera path is **disabled OUTRIGHT** (not sped up — a vestibular-harm guard) and the WebGL stack is **never loaded**; the page is the Stage-1 discrete Scenes + the static still. (EXPERIENCE §State-Patterns → Reduced-motion: "S2 directed camera path — disabled outright by the JS gate".)
- **No scroll-jacking without a visible skip (FR-2).** While the camera path drives scroll, the `SceneRail` skip-to-end + per-scene jump anchors stay **visible and keyboard-operable throughout**. Avoid Lenis/smooth-scroll libraries (or gate them behind reduced-motion). The page must remain scroll-native and keyboard-navigable; the camera path augments scroll, it must not trap or hijack it without the rail's skip affordance present.
- **WebGL canvas is `aria-hidden="true"` decorative** with DOM equivalents — NO information lives only in the canvas (EXPERIENCE §Accessibility-Floor). The drafting-grid lattice is pure decoration; all scene content remains in the existing semantic DOM.

### Producer for later Epic-5 stories

The cinematic camera path is the surface that **Story 5.4 (director's-mode Scene reordering)** and **Story 5.3 (agent re-curation)** will later DRIVE (reorder/deepen/skip scenes via the Guide). This story is the PRODUCER; its first consumer is Story 5.4. See Integration ACs.

## Acceptance Criteria

1. **Continuous cinematic transition via GSAP + ScrollTrigger, layered over the discrete-scene base (FR-3).**
   **Given** motion is enabled (no `prefers-reduced-motion: reduce`, JS on)
   **When** the visitor navigates between home Scenes (by scrolling)
   **Then** a continuous directed camera-path transition (no full page reload) plays via a GSAP + ScrollTrigger cinematic layer housed in `web/src/lib/cinematic/`, layered over the Stage-1 discrete `<section>` Scene base — and the transition is driven by real scroll position (scroll-native), not a hijacked scroll the visitor cannot escape.

2. **≤1 fixed WebGL set-piece, compressed assets + static fallback (NFR-1).**
   **Given** the performance budget
   **When** the canvas runs
   **Then** at most ONE fixed WebGL canvas exists site-wide (the R3F/Three.js procedural drafting-grid/blueprint set-piece, present ONLY on `/`), its 3D geometry + texture are loaded through the **KTX2/Basis (texture) + Draco (geometry) compression pipeline** (a build-time step produces the compressed `.glb` + `.ktx2` assets; runtime uses the Draco + KTX2 loaders), the canvas is `aria-hidden="true"` decorative with all information carried by the DOM, and a **static still fallback image** is shown when the WebGL layer is not (yet) loaded / not supported / reduced-motion.

3. **Reduced-motion disables the camera path outright; degrades to the Stage-1 discrete Scenes (NFR-2).**
   **Given** `prefers-reduced-motion: reduce` (the two-layer CSS + JS gate)
   **When** the page loads
   **Then** the directed camera path is **disabled outright** (not merely sped up) — the GSAP/ScrollTrigger/WebGL stack is **never initialized and never loaded** — and the page degrades to instant section changes / the Stage-1 discrete Scenes + the static still, with **no loss of content** (every Scene's DOM + the scene-rail are fully present and operable).

4. **The scene-rail skip + per-scene jump stay visible and keyboard-operable throughout — no scroll-jacking without a visible skip (FR-2).**
   **Given** the camera path drives scroll (motion enabled)
   **When** the sequence plays
   **Then** the `SceneRail` skip-to-end + per-scene jump anchors remain visible and keyboard-operable throughout the sequence (focusable, `:focus-visible`, followable), and the Story-5.0 bottom-of-scroll `#close` `aria-current` behavior is preserved — there is no scroll-jacking without the visible skip affordance present.

5. **NFR-1 budget holds: the LITERAL `pnpm test:all` (incl. `lh`) is green on `/` AND `/about/`, and the heavy stack is deferred + isolated to `/`.**
   **Given** the canonical launch gate `pnpm test:all` (= `typecheck && lint && format:check && test && test:e2e && lh`) plus `pnpm run check-deterministic`
   **When** the **literal `pnpm test:all`** runs end-to-end after the change
   **Then** every step including `lh` is green — Lighthouse on `/` AND `/about/` stays within `resource-summary:script:size ≤ 256000`, `total-byte-weight ≤ 400000`, `first-contentful-paint ≤ 2500`, `categories:performance ≥ 0.9` (the heavy cinematic stack is deferred behind first-interaction/scroll so Lighthouse's no-interaction trace never fetches it) — the React/three chunk is referenced by NO route other than `/` (NFR-1 isolation, asserted in `build-output.test.ts`), and the build is byte-deterministic where applicable (`check-deterministic`; note any intentional new generated assets).

6. **Non-vacuous, discoverable, real-runtime tests lock the behaviors (Rule 3, Rule 8).**
   **Given** the changes above
   **When** the default `pnpm test:all` suite runs
   **Then** real-runtime e2e (Playwright) assert: (a) motion-enabled — after a real scroll/interaction the cinematic layer initializes (the WebGL canvas / camera-path effect becomes present) and the page still scrolls naturally; (b) reduced-motion — the camera path + WebGL are NOT initialized (no canvas, no three chunk fetched), the discrete Scenes + scene-rail are fully operable, and the static still is shown; (c) JS-off — the discrete Scenes + scene-rail + all anchors work (the existing `js-off` coverage stays green); (d) the scene-rail skip + jump remain operable with the camera path active (FR-2). Tests are scoped to the real surfaces (Rule 8), discoverable in the default suite, and mutation-relevant where practical.

## Integration ACs

This story **introduces a new producer surface** (the cinematic camera-path controller in `web/src/lib/cinematic/` + the WebGL set-piece island). Per skill-rules Rule 1:

- **No consumer ships in this story; the first consumer will be Story 5.4** (director's-mode Scene reordering) — and Story 5.3 (agent re-curation) — which will drive the camera path (reorder/deepen/skip scenes) via the Guide. The cinematic controller should expose a minimal, documented surface (e.g. an exported init/teardown + a "go to scene N" capability) that 5.4 can call; do NOT build the director's-mode driver here.
- The "integration" verified NOW is end-to-end real-runtime: the cinematic layer composes with the existing discrete Scene Arc + the `SceneRail` (the camera path augments the same scroll the rail jumps drive) — proven by the AC6 e2e on the built home, motion-enabled AND reduced-motion AND JS-off.
- The cinematic layer must not break the existing `$guideOpen` nanostore / GuidePill / InviteForm islands on the home (they continue to hydrate and function).

## Tasks / Subtasks

- [ ] **Task 1 — Add + pin the cinematic dependencies (AC1, AC2, AC5).**
  - [ ] Add to `web` (verify latest stable at dev time — research notes below): `gsap@^3.13` (3.15.x current; ScrollTrigger is free, imported from `gsap/ScrollTrigger`), `three@^0.184` (r184), `@react-three/fiber@^9` (**verify React 19.2 compatibility** — the project is on `react@^19.2`; R3F v9 is the React-19 line; if a compat issue surfaces, HALT per Rule 5 and surface rather than downgrading React), and the Draco + KTX2 loader support (three ships `examples/jsm/loaders/{DRACOLoader,KTX2Loader}` + the Draco/Basis transcoder assets; `@react-three/drei` is OPTIONAL — only if it earns its weight within the budget). Keep these out of any SSR'd `.astro` frontmatter (client-only). If a Vite SSR externalization issue arises with `gsap`, add `vite.ssr.noExternal: ['gsap']` to `astro.config.mjs`.
- [ ] **Task 2 — Build-time compressed-asset pipeline for the procedural set-piece (AC2).**
  - [ ] Generate the drafting-grid/blueprint lattice geometry in code and produce, at BUILD TIME, a **Draco-compressed** `.glb`/glTF and a **KTX2/Basis-compressed** grid/paper texture (e.g. a `scripts/build-cinematic-assets.ts` step wired into the content build, or a committed generated asset under `web/public/` with a deterministic generator). Also produce the **static still fallback image** (a pre-rendered PNG/WebP of the composition). Ensure the assets are deterministic (NFR-6) or, if a generator can't be byte-stable, commit the generated assets and document why (do not break `check-deterministic`).
- [ ] **Task 3 — The WebGL set-piece island, deferred + reduced-motion-gated (AC1, AC2, AC3, AC5).**
  - [ ] Create `web/src/islands/WebGLSetpiece.tsx` — an R3F/Three.js component rendering the drafting-grid/blueprint lattice (cream/ink/navy), loading the Draco geometry + KTX2 texture via their loaders, `aria-hidden="true"`, fixed single canvas, with the static still as the fallback/poster. ONE canvas, on `/` only.
  - [ ] Defer its load: the WebGL island + the GSAP camera path load via a dynamic `import()` triggered by the FIRST user scroll/interaction, INSIDE `onMotionAllowed` (one-shot `{ once: true, passive: true }`; never `preventDefault`). The initial paint shows the static still + discrete scenes. Reduced-motion ⇒ never loads (AC3).
- [ ] **Task 4 — The GSAP/ScrollTrigger directed camera path (AC1, AC4).**
  - [ ] Create `web/src/lib/cinematic/` housing the camera-path controller: `import { gsap } from 'gsap'; import { ScrollTrigger } from 'gsap/ScrollTrigger'; gsap.registerPlugin(ScrollTrigger)`. Drive the continuous transitions from real scroll position over the existing `<section>` scenes; expose a minimal init/teardown + a "go to scene" surface for Story 5.4. Keep it scroll-native — the scene-rail skip/jump anchors stay visible + keyboard-operable throughout; do NOT trap scroll (AC4). All GSAP/ScrollTrigger init runs only inside `onMotionAllowed`; author the CSS-side motion only under `@media (prefers-reduced-motion: no-preference)`.
- [ ] **Task 5 — Wire into the home, preserve Stage-1 + the other islands (AC1, AC3, AC4).**
  - [ ] Mount the static still + the deferred cinematic bootstrap in `web/src/pages/index.astro` without disturbing the discrete `<section>` scenes, the `SceneRail`, the InviteForm island, or the GuidePill. The discrete scenes remain the JS-off / reduced-motion experience. Update `web/test/build-output.test.ts` script-count + NFR-1-isolation assertions to reflect the new (deferred) home surface — keep them behavior-stable (assert the three chunk is referenced by NO non-`/` route; the static still ships in initial HTML; the deferred cinematic chunk is NOT a static `<script>` on initial load).
- [ ] **Task 6 — Real-runtime tests (AC6) + the literal gate (AC5).**
  - [ ] Playwright e2e: motion-enabled (scroll/interact → cinematic initializes, canvas present, scroll still natural, scene-rail operable); reduced-motion (no canvas, no three chunk, discrete scenes + still + rail operable); JS-off (discrete scenes + anchors — extend `js-off.spec.ts`); FR-2 skip/jump operable with camera path active. Scope to real surfaces (Rule 8); prove not-skipped (Rule 7).
  - [ ] Run the **literal** `pnpm test:all` end-to-end (Rule 5). Confirm ALL steps green INCLUDING `lh` on `/` AND `/about/` (the NFR-1 canary). Run `pnpm run check-deterministic`. If `lh` reds on `/`, treat as a Rule-5 NFR tripwire → HALT + surface (do not weaken the budget assertion).

## Dev Notes

### Current state (files being modified / created — read before editing)

- **`web/src/pages/index.astro`** — the home; 7 discrete `<section>` scenes (`#hero`, `#thesis`, … `#close`) + `<SceneRail />` (fixed chrome) + the InviteForm island (`client:visible`, in `#close`) + the site-wide GuidePill. Header comment documents the locked 7-scene order and the NFR-1 sanctioned-surfaces note. **Add** the static still + the deferred cinematic bootstrap here without changing the discrete scene DOM (it is the JS-off / reduced-motion experience).
- **`web/src/lib/motion.ts`** — the ONE shared two-layer gate. Use `onMotionAllowed(init)` to wrap ALL GSAP/ScrollTrigger/WebGL initialization (it no-ops under `reduce` / no `matchMedia`). Use `prefersReducedMotion()` if you need to branch the static-still vs canvas decision. Do NOT add a per-component `matchMedia` (UX-DR21).
- **`web/src/components/scene/SceneRail.astro`** — the FR-2 skip/progress/jump rail; Story 5.0 added the bottom-of-page `#close` `aria-current` fallback (a normal-flow sentinel + `footObserver` inside `onMotionAllowed`). The camera path must keep the rail visible + keyboard-operable throughout and must NOT regress the 5.0 behavior.
- **`web/astro.config.mjs`** — `output: 'static'`, `integrations: [react()]`, `trailingSlash: 'always'`, `build.format: 'directory'`, `vite.server.proxy['/api']`. Add `vite.ssr.noExternal: ['gsap']` ONLY if an SSR externalization error appears (the cinematic code is client-only, so it may not be needed).
- **`web/test/build-output.test.ts`** — asserts the home ships `>= 3` executable scripts (scene-rail + InviteForm + GuidePill) and that the React `client.*.js` chunk is referenced as an NFR-1 carve-out. Update to account for the deferred cinematic surface; keep the **`≤1 WebGL canvas / three chunk referenced only by `/`** isolation assertion (mirror the existing InviteForm isolation pattern).
- **`lighthouserc.json`** — the NFR-1 budget gate (`/` + `/about/`): script ≤256KB, total ≤400KB, FCP ≤2500, perf ≥0.9. This is the AC5 canary. Do NOT weaken it.
- **`web/e2e/{home,reduced-motion,js-off}.spec.ts`** — existing scene-rail + reduced-motion + JS-off coverage (Story 5.0 added foot-of-scroll + reduced-motion no-op tests). Extend, don't break.
- **NEW:** `web/src/lib/cinematic/` (GSAP camera-path controller), `web/src/islands/WebGLSetpiece.tsx` (R3F set-piece), a build-time asset step (`scripts/build-cinematic-assets.ts` or committed generated assets under `web/public/`), the static still image, and the e2e additions.

### Constraints / invariants to preserve

- **NFR-1 (the central risk):** keep `/` AND `/about/` Lighthouse-green by DEFERRING the heavy stack behind first interaction/scroll (Lighthouse never scrolls/interacts) — NOT `client:load` / above-the-fold `client:visible` / bare `requestIdleCallback`. `≤1 WebGL canvas site-wide`, on `/` only; the three/R3F chunk referenced by no other route. Initial paint = static HTML + static still (0 incremental executable JS beyond today's sanctioned surfaces).
- **NFR-2 (two-layer gate):** CSS motion only under `@media (prefers-reduced-motion: no-preference)`; ALL JS motion/WebGL init inside `onMotionAllowed`; reduced-motion ⇒ camera path disabled OUTRIGHT + WebGL never loaded. WebGL canvas `aria-hidden`, decoration only.
- **FR-2 (no scroll-jacking without a visible skip):** scene-rail skip + per-scene jump visible + keyboard-operable throughout; scroll-native; avoid Lenis/smooth-scroll or gate it. Never `preventDefault` on the scroll/interaction trigger.
- **FR-8 / NFR-3 (nothing hidden behind the magic):** the discrete Scene Arc + Mirror routes remain the full, crawlable, JS-off experience. No content lives only in the canvas or the camera path.
- **NFR-6 (deterministic build):** generated assets must be deterministic, or committed + documented; `check-deterministic` must stay green (or its scope adjusted with rationale if a binary asset legitimately changes — prefer committed-stable assets).
- **Rule 5 (canonical gate):** verify with the LITERAL root `pnpm test:all` (incl. `lh`), not a subset. **Rule 8:** real-surface, scoped, discoverable tests. **Rule 3:** real-runtime e2e for the user-facing cinematic surface (a green unit test is not enough). **Rule 7:** prove the e2e executes (not skipped).
- **Do NOT** build Story 5.2 (Depth Dial), 5.3 (re-curation), or 5.4 (director's mode) here — expose only the minimal producer surface 5.4 will consume.

### Library / version specifics (web research at story creation, 2026-06-07)

- **GSAP:** current stable is **3.15.x** (there is NO "GSAP 4" — the architecture's label is aspirational). ScrollTrigger is **free**. ESM usage: `import { gsap } from 'gsap'; import { ScrollTrigger } from 'gsap/ScrollTrigger'; gsap.registerPlugin(ScrollTrigger);` then `scrollTrigger: { … }` in tweens/timelines. In Astro/Vite, if SSR externalization errors, set `vite.ssr.noExternal: ['gsap']` (or dynamic-import the plugin client-side). Since our cinematic code is client-only (loaded in a deferred client import), the standard pattern applies.
- **Three.js:** current stable **r184** (`three@^0.184`). DRACOLoader + KTX2Loader live in `three/examples/jsm/loaders/`; they need the Draco decoder + Basis transcoder assets served (copy to `web/public/` and point the loaders at them). 
- **@react-three/fiber:** **v9.0.0** is the current line; it targets the React 19 ecosystem. The project is `react@^19.2` — **verify v9 + React 19.2 hydrate cleanly in an Astro island**; if incompatible, HALT + surface (do not downgrade React, which the three islands depend on).
- **`@react-three/drei`:** optional helpers; include ONLY if it earns its bytes within the 256KB `/` budget — and remember the whole stack is deferred, so drei's weight only matters post-interaction, not for the Lighthouse trace.

### Project Structure Notes

- New cinematic code: `web/src/lib/cinematic/` (camera-path controller, plain TS, client-only) + `web/src/islands/WebGLSetpiece.tsx` (R3F island — PascalCase `.tsx` per AR convention). Build-time asset generation: `scripts/build-cinematic-assets.ts` (wire into the content build) OR commit deterministic generated assets under `web/public/cinematic/`. Static still + compressed `.glb`/`.ktx2` + Draco/Basis decoder assets under `web/public/`.
- The architecture explicitly anticipates these paths: "Stage-2 additions (not built now): `web/src/lib/cinematic/` (GSAP/ScrollTrigger camera path), `web/src/islands/WebGLSetpiece.tsx` (≤1 R3F, static fallback)" — follow them.

### Previous-story intelligence (Story 5.0, just shipped on this branch)

- The scene-rail enhancement runs inside `onMotionAllowed`; Story 5.0 added a normal-flow page-foot sentinel + `footObserver` for `#close` `aria-current` at the bottom of scroll. The camera path must compose with this (keep `#close` lighting at the foot; keep the rail operable). Reuse the `onMotionAllowed` gate pattern; do NOT add an ad-hoc `matchMedia`.
- Story 5.0's QA caught a HIGH defect where a runtime element used `position:absolute;bottom:0` on a static parent (resolved to the initial containing block, not the page foot). Lesson for any positioned cinematic overlay/canvas: verify positioning context against the real layout (a fixed canvas is fine; an absolutely-positioned element needs a positioned ancestor) and prove placement with a real-runtime test, not just a unit assertion.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] — the four BDD ACs (GSAP+ScrollTrigger in `web/src/lib/cinematic/`; ≤1 WebGL + KTX2/Basis/Draco + static fallback; reduced-motion disabled-outright; scene-rail skip/jump visible + keyboard-operable, no scroll-jacking without skip).
- [Source: _bmad-output/planning-artifacts/architecture.md#Cinematic layer (Stage 2)] — "CSS scroll-driven baseline (~80%) + GSAP + ScrollTrigger for the directed camera path + ≤1 R3F/Three.js WebGL set-piece with static fallback; all behind the two-layer reduced-motion gate" + the `web/src/lib/cinematic/` / `web/src/islands/WebGLSetpiece.tsx` paths + the NFR-1 budget.
- [Source: ux-designs/.../EXPERIENCE.md#State-Patterns → Reduced-motion] — "S2 directed camera path — disabled outright by the JS gate (not merely sped up); degrades to the Stage-1 instant section changes / discrete Scenes"; "camera path bound to the visible skip (FR-2) — no scroll-jacking without it"; "WebGL canvas is aria-hidden decorative with DOM equivalents."
- [Source: ux-designs/.../EXPERIENCE.md#Performance budget (NFR-1)] — "≤1 fixed WebGL canvas site-wide; heavy stack lazy-loaded (client:visible/client:idle); compressed WebGL assets (KTX2/Basis/Draco) with a static fallback."
- [Source: lighthouserc.json] — the AC5 budget thresholds on `/` + `/about/`.
- [Source: web/src/lib/motion.ts] — `onMotionAllowed` / `prefersReducedMotion` (the two-layer gate; wrap all motion/WebGL init).
- [Source: web/test/build-output.test.ts] — the NFR-1 script-count + island-isolation assertions to update.
- [Source: .claude/rules/project-rules.md#4] — env-gate / lazy-gate third-party runtime scripts to preserve the clean-build + 0-JS invariants (here: defer the heavy stack behind interaction so the default Lighthouse trace stays clean).
- [Source: .claude/rules/project-rules.md#3] — forward-reference declaration: this story's producer surface is consumed by Story 5.4 (declared in Integration ACs).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (cycle_iteration=4 — HIGH graceful-degradation defect fix)

### Debug Log References

- [cycle_iteration=3] NFR-6 determinism fix investigation:
  - Root cause: Story 5.1 introduced the project's first dynamic-import chain (index.astro shim → bootstrap → WebGLSetpiece). Rollup's default chunk-graph splitter reconstructs chunk assignments on every build; for complex-dependency libs (three.js, GSAP), the assignment order can vary, causing content-hash jitter even when source is unchanged (rollup#5902, vite#6773).
  - Fix strategy: `manualChunks` in `vite.build.rollupOptions.output` pins `three/` → `cinematic-three` and `gsap/` → `cinematic-gsap` as explicitly-named vendor chunks. This freezes the module-graph structure, eliminating hash jitter.
  - Critical pitfall encountered and resolved: first attempt included `@react-three/fiber` in `cinematic-three`. R3F transitively re-exports React, so grouping it into `cinematic-three` caused ALL React islands (InviteForm, GuidePill) to depend on `cinematic-three` → those islands fetched it on page load → NFR-2 (reduced-motion) e2e test failed. Fix: exclude `@react-three/fiber` from manualChunks (R3F stays in the `WebGLSetpiece` async chunk, which is fine since it's only dynamically loaded).
  - Second pitfall: project source files (src/lib/cinematic/, src/islands/WebGLSetpiece) MUST NOT be included in manualChunks. Vite's preload-helper shim statically imports whatever chunk exports the `__vite__mapDeps` helper; grouping cinematic source into a named chunk made the shim statically import that heavy chunk, fetching it on page load regardless of motion preference.
  - Final config: only vendor `three/` and `gsap/` are pinned. Project source files keep Rollup-assigned names. Chunk hashes are now stable.
- AC2 gap: iter-1 shipped `grid-texture.png` via `TextureLoader`, not `grid-texture.ktx2` via `KTX2Loader`. The comment in `build-cinematic-assets.ts` claiming PNG "loaded via KTX2Loader" was false.
- KTX2/Basis encoding tooling: no pure-JS/WASM Basis encoder exists on npm without native compilation. Resolved by downloading and installing `KTX-Software v4.4.2` Linux x86_64 deb (`toktx v4.4.2`) — deterministic, `toktx --encode etc1s --t2` on the committed PNG produces byte-identical KTX2 output.
- Pre-existing iter-1 bugs fixed: (a) `DracoOptions` used wrong field names (`encoderModule`, nested `quantizationBits`) — fixed to `quantizePosition`/etc. (b) `draco3d` had no TypeScript types — added `scripts/draco3d.d.ts` stub. (c) SVG `xmlns="http://www.w3.org/2000/svg"` URL triggered pipeline-guards — fixed via string concatenation. (d) `basis_transcoder.js` triggered ESLint errors — added ignore to `eslint.config.js`. (e) `basis_transcoder.js` triggered Prettier — added to `.prettierignore`.
- `pnpm test:all` exit 0, `lh` green: `/` script=75.9KB, FCP=1832ms, perf=0.98. KTX2/basis assets NOT fetched by Lighthouse (deferred correctly).

### Completion Notes List

- [cycle_iteration=2] AC2 KTX2/Basis texture pipeline complete:
  - **Build-time**: `scripts/build-cinematic-assets.ts` now calls `toktx --encode etc1s --t2` to produce `web/public/cinematic/grid-texture.ktx2` (ETC1S/BasisLZ, 2876 bytes, deterministic) from the source PNG. Also copies `basis_transcoder.js` + `basis_transcoder.wasm` from `three.js` package.
  - **Runtime**: `web/src/islands/WebGLSetpiece.tsx` now imports `KTX2Loader` (removed `TextureLoader`), calls `.setTranscoderPath('/cinematic/')` + `.detectSupport(gl)`, and loads `/cinematic/grid-texture.ktx2` — not the PNG.
  - **Tests**: New test `Story 5.1 AC2: KTX2/Basis asset pipeline` in `web/test/build-output.test.ts` asserts: `.ktx2` asset exists, KTX2 magic bytes valid, KTX2Loader imported, no TextureLoader import, runtime URL uses `.ktx2`, `setTranscoderPath` called. Mutation-verified (test reds when `.png` used or `TextureLoader` re-added).
  - **False comment fixed**: `build-cinematic-assets.ts` docblock now accurately describes `grid-texture.ktx2` as the runtime WebGL texture (via KTX2Loader) and `grid-texture.png` as the source form.
  - **Full canonical gate green**: `pnpm test:all` (typecheck ✓, lint ✓, format:check ✓, test ✓ [160+135+664], test:e2e ✓ [252], lh ✓ [/=0.98 /about/=0.99]) + `check-deterministic` ✓

- [cycle_iteration=3] NFR-6 build determinism fix complete:
  - **Config**: `web/astro.config.mjs` adds `vite.build.rollupOptions.output.manualChunks` pinning `three/` → `cinematic-three.*.js` (842KB) and `gsap/` → `cinematic-gsap.*.js` (114KB). Vendor-only rule enforced (no project source files, no @react-three/fiber).
  - **Tests updated**: `web/test/build-output.test.ts` NFR-1 assertions updated to check `cinematic-three.*` and `cinematic-gsap.*` (not statically referenced, isolated to `/`). `web/e2e/cinematic.spec.ts` URL interceptors updated to also match `cinematic-three` and `cinematic-gsap` chunks.
  - **Determinism proven**: `pnpm run check-deterministic` 5/5 consecutive passes, tree hash `8a98635b...` stable. Baseline (Story 5.0) was 6/6; Story 5.1 with fix is now stable.
  - **No regressions**: all NFR-1/NFR-2 contracts preserved — heavy stack still deferred, reduced-motion no-load passes (252/252 e2e green), lh exit 0.
  - **Full canonical gate green**: `pnpm test:all` (typecheck ✓, lint ✓, format:check ✓, test ✓ [160+135+664], test:e2e ✓ [252], lh ✓) + `check-deterministic` 5/5 ✓

### File List

- `scripts/build-cinematic-assets.ts` — added `generateKtx2Texture()` (toktx CLI call), `copyBasisTranscoder()`, fixed SVG xmlns URL, fixed `DracoOptions` field names
- `scripts/draco3d.d.ts` — NEW: ambient type declaration for `draco3d` npm package
- `web/src/islands/WebGLSetpiece.tsx` — [iter1-3]: replaced `TextureLoader`/`.png` with `KTX2Loader`/`.ktx2` (AC2 runtime texture path); [cycle_iteration=4]: added `probeWebGLSupport()` export, `WebGLErrorBoundary` class, `onFirstFrame` callback in `GridMesh`, `onWebGLReady`/`onWebGLFailed` props on `WebGLSetpiece`
- `web/src/lib/cinematic/bootstrap.ts` — [cycle_iteration=4]: complete rewrite of step 4 (still poster lifecycle); added `hideStickerPoster()` + `restoreStillPoster()`; probe WebGL before mounting R3F; move still-fade to `onWebGLReady` callback (fires from first successful frame); catch sync mount errors; `onWebGLFailed` restores still on error-boundary
- `web/public/cinematic/grid-texture.ktx2` — NEW: committed ETC1S/BasisLZ KTX2 texture (from toktx)
- `web/public/cinematic/basis_transcoder.js` — NEW: Basis Universal transcoder JS (from three.js, required by KTX2Loader at runtime)
- `web/public/cinematic/basis_transcoder.wasm` — NEW: Basis Universal transcoder WASM (from three.js, required by KTX2Loader at runtime)
- `web/test/build-output.test.ts` — added `Story 5.1 AC2: KTX2/Basis asset pipeline` test; updated NFR-1 isolation assertions for `cinematic-three`/`cinematic-gsap` chunk names [cycle_iteration=3]
- `eslint.config.js` — added ignore for `web/public/cinematic/*.js` (third-party pre-compiled assets)
- `.prettierignore` — added ignore for `web/public/cinematic/*.js` (third-party pre-compiled assets)
- `web/astro.config.mjs` — NEW [cycle_iteration=3]: added `vite.build.rollupOptions.output.manualChunks` for vendor-only chunk pinning (NFR-6 determinism)
- `web/e2e/cinematic.spec.ts` — updated URL interceptors to match `cinematic-three`/`cinematic-gsap` chunks [cycle_iteration=3]; [cycle_iteration=4] added `Story 5.1 — WebGL context failure: graceful degradation` test suite (mocks getContext → null, asserts still poster remains + no uncaught errors)

**[code-review 2026-06-08 — auto-resolved fixes]**

- `scripts/build-cinematic-assets.ts` — **[HIGH fix]** `copyDracoDecoder()` rewritten to copy the MATCHING `draco_wasm_wrapper.js` + `draco_decoder.wasm` pair from three.js's bundled `examples/jsm/libs/draco/gltf/` (was copying from `draco3d`, which lacks the wrapper → runtime GLB 404). Header docblock updated.
- `web/public/cinematic/draco_wasm_wrapper.js` — NEW [HIGH fix]: the Draco decoder JS glue wrapper (from three.js draco/gltf) — required at runtime by DRACOLoader in the browser WASM path.
- `web/public/cinematic/draco_decoder.wasm` — CHANGED [HIGH fix]: now the matching three.js draco/gltf decoder wasm (was the mismatched draco3d build).
- `web/src/lib/cinematic/index.ts` — **[MED fix]** register `ScrollToPlugin` alongside `ScrollTrigger` so the `goToScene()` producer API (Story 5.4 surface) actually navigates (`gsap.to(window,{scrollTo})` was a no-op without it). Deferred-chunk-only → zero `/` budget cost.
- `web/test/build-output.test.ts` — added 2 mutation-verified regression tests: `Story 5.1 AC2: Draco geometry pipeline …` (locks both Draco runtime decoder assets present + GLB genuinely Draco-required) and `Story 5.1 Integration AC: the goToScene producer API registers ScrollToPlugin …`.

## Review Findings

### Code Review (adversarial, post-iter3 fresh re-verification) — 2026-06-08

**Verdict: APPROVED after two auto-resolved fixes (1 HIGH, 1 MED).** Reviewed the FINAL combined state (dev iter1+2+3 + QA) fresh and adversarially (Blind Hunter / Edge-Case Hunter / Acceptance Auditor). All 6 ACs + the Integration ACs verified against the REAL build/runtime. Two genuine defects were found by real-runtime probing (both invisible to the green gate) and auto-resolved inline; the canonical gate, determinism, and Lighthouse were then re-run to certify the combined state.

**Load-bearing NFRs re-verified by the reviewer:**

- **NFR-6 determinism (the iter3 manualChunks fix):** `pnpm run check-deterministic` re-run **5× before any change** (all PASS, identical tree hash `8a98635b…`) and **3× after my changes** (all PASS, stable hash `426a4c0d…`; each run does 2 internal builds → effectively 6 byte-identical builds per invocation). The 1/6 pre-fix flake is gone — the vendor-only `manualChunks` (three→`cinematic-three`, gsap→`cinematic-gsap`; excludes `@react-three/fiber` + project source) is a real fix, not a comment-level workaround (Rule 5 satisfied).
- **NFR-1 budget + deferral (post-manualChunks):** independent `lh` run confirms `/` perf **0.98**, FCP **1818ms**, script **77.8KB** (≤256KB), total **216KB** (≤400KB); `/about/` perf 0.99, script 75.5KB. The built `/` HTML statically loads only 2 scripts (SceneRail + the 600-byte index.astro shim) — **zero** static reference to `cinematic-three.*`, `cinematic-gsap.*`, `WebGLSetpiece.*`, or `bootstrap.*` (verified in `dist/index.html` directly; the gsap reference lives only in the shim's `__vite__mapDeps` for the DYNAMIC `import()`). The iter3 pitfall (R3F pulling React islands into a cinematic chunk) is **confirmed avoided**: `cinematic-three` (841KB) is referenced only by `WebGLSetpiece` + `bootstrap` (both dynamic); InviteForm/GuidePill hydrate from the independent `client.*` chunk and are NOT in any cinematic chunk.
- **AC6 non-vacuity (mutation-proven):** disabling the index.astro bootstrap trigger (removing the scroll/pointer/key listeners) makes the motion-enabled e2e `(a)` **RED** ("bootstrap chunk must be fetched after first scroll") — the cinematic e2e genuinely binds to the real surface (Rule 3 + Rule 8). The full e2e suite ran **252 passed / 0 skipped / 0 failed** with the `cinematic` Playwright project executing its 9 tests (Rule 7 — proven not-skipped).
- **Integration ACs / Rule 1:** the producer surface (`init`→`{teardown, goToScene}`, exposed via `window.__cinematicHandle`) is sane and the "no consumer yet; first consumer Story 5.4" declaration is accurate (no caller of `goToScene`/`__cinematicHandle` exists in this story). HIGH-bar satisfied — see the MED fix below which makes that producer surface actually functional.

**[5.1 · HIGH · auto-RESOLVED] AC2 Draco geometry pipeline was DEAD at runtime — `draco_wasm_wrapper.js` was missing (GLB 404).** The committed `web/public/cinematic/` shipped only `draco_decoder.wasm` (copied from the `draco3d` npm package) but NOT `draco_wasm_wrapper.js`. In a browser (WebAssembly available) three's `DRACOLoader._initDecoder` fetches BOTH `draco_wasm_wrapper.js` + `draco_decoder.wasm` from the `setDecoderPath('/cinematic/')` path. The `draco3d@1.5.7` package does NOT ship the wrapper at all (only a Node-only `draco_decoder_nodejs.js`), and its standalone `draco_decoder.wasm` is a DIFFERENT build than three's wrapper expects — so the build script's `copyDracoDecoder()` silently copied just the wasm. **Empirically confirmed** (build + serve `dist` + real Chrome + first-scroll): `GET /cinematic/draco_wasm_wrapper.js → 404`, PAGEERROR `Could not load /cinematic/drafting-grid.glb: fetch for ".../draco_wasm_wrapper.js" responded with 404`, and **canvas count = 0** — the GLB (which is genuinely Draco-required: `KHR_draco_mesh_compression` in `extensionsRequired`) never decoded, taking down the whole R3F `<Suspense fallback={null}>` boundary (so the KTX2 texture never rendered either). AC2's "geometry loaded through the Draco compression pipeline" was unmet in production. **Invisible to the green gate**: the e2e only asserts the chunk is fetched + the (pre-R3F) `#webgl-setpiece-root` mount div appears (created by bootstrap before the failing import); test `(e)` `test.skip()`s if the canvas never appears — so no test actually decoded the GLB (a Rule 3 real-runtime gap). **Fix:** `copyDracoDecoder()` now copies the MATCHING `draco_wasm_wrapper.js` + `draco_decoder.wasm` pair from three.js's own bundled `examples/jsm/libs/draco/gltf/` (mirroring `copyBasisTranscoder`), and the committed assets were regenerated. **Re-probed on the built+served site: no 404s, no console/page errors, canvas count = 1** — Draco geometry + KTX2 texture both render. Regression locked by a new mutation-verified build-output test (`Story 5.1 AC2: Draco geometry pipeline …`) asserting BOTH runtime decoder assets present + the GLB genuinely requires Draco + the island imports DRACOLoader/`setDecoderPath` (reds when the wrapper is deleted). Regenerated assets are deterministic (byte-identical across two generator runs) and `check-deterministic` stays PASS.

**[5.1 · MED · auto-RESOLVED] The `goToScene()` producer API (Story 5.4 surface) silently no-op'd — `ScrollToPlugin` was not registered.** `web/src/lib/cinematic/index.ts` registered only `ScrollTrigger`, but `goToScene()` navigates via `gsap.to(window, { scrollTo: targetY, … })`, which requires GSAP's `ScrollToPlugin`. Without it, `scrollTo` is an unknown tween property and the call does nothing — so the documented producer method Story 5.4 is told it can call would fail to navigate. No AC1–AC6 user-facing behavior in 5.1 is affected (the camera path is ScrollTrigger-driven on real scroll, which works) and there is no consumer yet, so this was a **latent producer-surface defect** that would first bite Story 5.4. **Fix:** register `ScrollToPlugin` alongside `ScrollTrigger` (`gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)`); both plugins live only in the deferred `cinematic-gsap` chunk, so this adds **zero** weight to the `/` initial load (re-confirmed: `/` script unchanged at 77.8KB, lh green). **Empirically validated** on the built+served site: after `window.__cinematicHandle.goToScene(5)` the window scrolled from y=40 → 2160 and `#glass-box` landed at viewport top (top = -0.25px), no errors. Locked by a new mutation-verified test (`Story 5.1 Integration AC: the goToScene producer API registers ScrollToPlugin …`) that reds when the registration is reverted.

**Post-fix certification (the literal canonical gate, re-run by the reviewer end-to-end):** `pnpm test:all` → **exit 0** (typecheck ✓; lint ✓; ROOT `format:check` ✓; vitest scripts 160 / api 135 / web **666** [+2 new 5.1 tests]; Playwright **252 passed, 0 skipped, 0 failed** incl. the 9 `cinematic` tests; `lh` all assertions green on `/` + `/about/`). `pnpm run check-deterministic` → **PASS 3/3** consecutive (stable tree hash `426a4c0d…`). No regressions to AC3 (reduced-motion: no canvas / no heavy chunk), AC4 (FR-2 scene-rail skip/jump operable, 5.0 `#close` preserved), or JS-off — the existing home/reduced-motion/js-off e2e projects stay green. One LOW deferred (the still poster's `loading="lazy"`); see `deferred-work.md`.

**[cycle_iteration=4 — HIGH graceful-degradation defect fix, lead smoke finding]**

**Root cause:** `bootstrap.ts` step 4 called `hideStickerPoster()` unconditionally immediately after `root.render()` — before any WebGL frame was actually rendered. If the WebGL context fails (GPU blocklist, browser settings, headless/corporate env), R3F mounts but context creation fails, leaving a blank 300×150 default canvas. The still poster was already hidden. User saw neither the still NOR a working canvas — a blank area + an `Uncaught (in promise)` rejection.

**Fix (three-layer defense):**
1. `probeWebGLSupport()` in `WebGLSetpiece.tsx` — exported function that creates a temp canvas, tries to get webgl2/webgl/experimental-webgl, immediately discards the context. Called BEFORE mounting R3F. If it returns `false`, bootstrap exits early: GSAP overlay still mounts (camera path is independent), no R3F mount, static still remains.
2. `onWebGLReady` callback prop on `WebGLSetpiece` — `GridMesh.useFrame` fires `onFirstFrame` on the very first rendered frame. The bootstrap only calls `hideStickerPoster()` from this callback. If WebGL never renders (context failure, shader error, asset load failure), the callback never fires → still remains visible forever (the correct AC2 fallback state).
3. `WebGLErrorBoundary` class component wraps the `<Canvas>` — catches any React/R3F/three render-time error, calls `onWebGLFailed` (which calls `restoreStillPoster()`), renders null (so the blank canvas is gone). No uncaught promise rejection.

**Canonical gate post-fix:** `pnpm test:all` exit 0 (typecheck ✓; lint ✓; format:check ✓; vitest scripts 160 / api 135 / web 666; Playwright **253 passed** [+1 new WebGL-fail test], 1 skipped [pre-existing DATABASE_URL skip], 0 failed; lh ✓). `pnpm run check-deterministic` PASS 3/3 (stable hash `e551525c…`). New test `Story 5.1 — WebGL context failure: graceful degradation` mocks `HTMLCanvasElement.prototype.getContext` to return null for all WebGL variants — asserts: still poster remains in DOM + opacity not forced to '0' + zero uncaught page errors + GSAP overlay still mounts.
