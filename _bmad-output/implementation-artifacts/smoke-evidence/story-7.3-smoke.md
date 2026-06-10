# Story 7.3 — Lead per-story smoke (playable embeds: 2 live games + voyager honestly "coming")

**Date:** 2026-06-09/10 · **Method:** browser (chrome-devtools, real DOM/iframe measurement) + curl, against a fresh `pnpm build:content && pnpm --filter web build` served from `web/dist` (port 4403) · **Result: PASS** · **iterations:** 1 · **defects_caught:** 0 by this smoke (the dev's masked failures were caught by the lead Rule-10 recovery + QA before this gate; this smoke is the independent real-runtime confirmation)

## What this smoke proves

Story 7.3 retrieves Josh's REAL game repos from git and embeds them as lazy iframes. **2 of 3 ship LIVE** (vector-wars, christmas-elves); **voyager is honestly "coming"** (a complete bundle is 155MB + it's architected for origin-root, not subpath, deployment — see deferred-work.md; surfaced to Josh). The smoke verifies the FR-26 capability on the real built site + the Rule-9 credibility floor.

## Result (captured, real browser)

### `/work/christmas-elves/` (Phaser — actually plays)
| Check | Result |
| --- | --- |
| route 200, one `<h1>` "Christmas Elves — Lemmings-inspired puzzle game" | ✅ |
| **NFR-1 lazy: no iframe before activation** | ✅ `nfr1_no_iframe_before_activation: true` |
| static poster present (a REAL gameplay frame) | ✅ |
| real source-repo link | ✅ `github.com/jbrandtmse/christmas-elves` |
| activate embed → iframe `src=/playables/christmas-elves/` | ✅ |
| **the real Phaser game BOOTS A `<canvas>` in the iframe** | ✅ `canvasBootsInIframe: true` — the game actually runs |
| grounded description (Sparkler/Stacker/Glider/Climber abilities = the real game) | ✅ |

### `/work/vector-wars/` (Three.js/WebGL — page verified; WebGL gameplay not claimable headless)
| Check | Result |
| --- | --- |
| route 200, one `<h1>` "Vector Wars — retro 3D rail shooter" | ✅ |
| NFR-1 lazy: no iframe before activation | ✅ |
| **poster is an HONEST stylized title card (Rule 9 — NOT a faux screenshot)** | ✅ alt = "Vector Wars — stylized title card … Click to play the live WebGL game." |
| real source-repo link | ✅ `github.com/jbrandtmse/vector-wars` |
| JS-off fallback "Play →" link to `/playables/vector-wars/` | ✅ |
| no exclamation (voice) | ✅ |
(WebGL2 cannot render in this headless env — the iframe/page/poster/links are verified; WebGL gameplay is NOT claimed verified here. The game is real + covered by its own suite + real hardware.)

### Wings reflect the live state (credibility)
- **Technical Wing** (`/technical/`): vector-wars LIVE link present; **voyager is honest "coming"** copy ("…is coming as a live embed once its full asset bundle is vendored. The source is public at github.com/jbrandtmse/voyager") — **0** `/work/voyager/` live links.
- **Creative Wing** (`/creative/`): christmas-elves LIVE link present.

## NFR / determinism

- **NFR-1 isolation:** the game JS executes ONLY inside the iframe (no iframe before activation; the `/work/<slug>/` pages add only the Guide pill + a small lazy-loader); code-review mutation-verified the portfolio 0-JS pages never reference the vendored bundles.
- **NFR-6 determinism:** vendored static bundles → `check-deterministic` PASS (tree hash `cef90746…`).
- **Gate:** `pnpm test:all` exit 0 (typecheck 119/0 errors after the lead's `tsconfig` exclude of `public/playables`; 1283 unit; 415 e2e incl. 17 registered `playables` tests; lh PASS); `check-deterministic` exit 0.

## Visual evidence

- `smoke-evidence/story-7.3-christmas-elves.png` (the playable page) · `story-7.3-vector-wars.png` (honest title-card poster page).

## Conclusion

FR-26 is delivered: two of Josh's real games play live in the browser as lazy, NFR-1-isolated, deterministic embeds linked to their real public repos — christmas-elves provably boots its Phaser canvas on the real runtime; vector-wars renders its page + honest title-card poster + real WebGL game bundle (gameplay on real hardware). Voyager stays honestly "coming" rather than shipping a hollow 155MB origin-root-only bundle (Rule-9 floor preserved); its dedicated-hostname path is recorded for Josh. Defects caught by this smoke beyond the automated tiers: 0 (the dev's masked typecheck-OOM / format:check / fabricated-poster / hollow-voyager were caught by the lead Rule-10 recovery + QA; this smoke independently confirms the honest final state on the real runtime).

---

## Voyager external-embed addendum (2026-06-10) — all three playables now live

After Josh created `voyager.abacusai.cloud`, the voyager sim was deployed to its own origin-root hostname (the lead remediation's finding: it's 155MB + origin-root-architected, so it can't be a subpath bundle). The portfolio `/work/voyager/` page now embeds it cross-origin. **Lead smoke (browser, real runtime) — PASS:**

| Check | Result |
| --- | --- |
| `/work/voyager/` route 200, one `<h1>` "Voyager — cinematic mission replay" | yes |
| NFR-1 lazy: no iframe before activation | yes |
| poster real provenance (real Saturn-encounter sim frame; alt makes no faux-screenshot claim) | yes — `/playables/voyager/poster.png` |
| real source-repo link | yes — `github.com/jbrandtmse/voyager` |
| activate -> iframe `src` = the LIVE hostname | yes — `https://voyager.abacusai.cloud/` (200) |
| credibility (Rule 9): real SPICE-kernel trajectories, real encounter dates (Jupiter 1979 -> Neptune 1989), Three.js | yes, all grounded |
| console on activation | only `THREE.WebGLRenderer: WebGL context could not be created` — FROM the loaded sim (confirms the cross-origin embed loaded the real game); headless env lacks WebGL2, so 3D renders on real hardware. Not a defect. |
| gate | `pnpm test:all` exit 0 (884 vitest + 425 e2e incl. 7 new voyager e2e in the registered `playables` project); `check-deterministic` exit 0 (23 pages, byte-identical) |

All three of Josh's real games are live: vector-wars + christmas-elves vendored in-repo; voyager embedded from its dedicated origin-root hostname. Technical Wing complete (loandemo + vector-wars + voyager); `moreComing: false`.
