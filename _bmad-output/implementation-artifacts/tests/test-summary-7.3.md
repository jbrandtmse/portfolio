# Test Automation Summary — Story 7.3 (Playable project embeds)

QA stage, `/epic-cycle`. Verified FRESH (Rule 10) — dev stage did not cleanly complete.

## Canonical gate (Rule 14 — attested exit codes)

- `pnpm test:all` → **exit 0** (typecheck 0 errors/0 warnings · eslint clean · prettier clean · vitest 1283 passed [scripts 184 + api 233 + web 866] · playwright **415 e2e passed** · Lighthouse autorun done)
- `pnpm run check-deterministic` → **exit 0** (web/dist byte-identical, tree hash `cef90746…`; vendored playables byte-stable — NFR-6)

## Headline finding — voyager could NOT be embedded; demoted to honest "coming" (Rule 9 HALT path)

The dev claimed all three games live. Fresh verification found **voyager is non-functional as vendored**:

1. **Wrong Vite base.** Voyager was built with `base: '/'` not `base: '/playables/voyager/'` — its `index.html` + 11 chapter shells `import('/assets/main-*.js')` and `<link href="/assets/main-*.css">` (absolute root → 404 in the iframe). The JS bundle also fetched `/data/manifest.json`, `/models/voyager.glb`, `/basis/`, `/textures`, `/images/pbd/`, `/audio/golden-record/*` at the root.
2. **Assets are Git-LFS pointer stubs.** 39 of 83 voyager files (all `.glb` models, `.ktx2`/`.png` textures, audio) are ~130-byte LFS pointers — the repo was cloned without `git lfs pull`. Worse, every `data/*.bin.br` trajectory file the manifest lists is **entirely absent** (the `data/` dir holds only `manifest.json` + a fixture). The 3D scene cannot render.

Even after fixing the base paths (which I did, and proved the asset 404s resolved), the LFS-stub + missing-data problem is a producer defect requiring a `git lfs pull` + rebuild — a dev Task-1 redo, not a QA fix. Per the story's explicit directive ("if a game genuinely CANNOT be embedded cleanly, HALT and surface it — it stays honest 'more coming'"), **voyager was removed and demoted to honest "coming"** on the Technical Wing; vector-wars + christmas-elves ship live.

## Other MUST-FIX items resolved

- **voyager poster ref↔file mismatch** (page said `poster.png`, file was `poster.jpg`) — moot after removal; added a build-output test that asserts every referenced poster resolves in dist (mutation-verified to red on the exact voyager bug shape).
- **vector-wars fabricated poster** — the SVG had a faux "SCORE: 142800 / LIVES: 3" HUD reading as a literal gameplay screenshot. Made honest: removed the fake HUD, labeled it "TITLE CARD · PLAY LIVE BELOW", and updated the alt text to disclose it is a stylized title card (not a screenshot). The headless env genuinely cannot screenshot the WebGL game ("WebGL 2.0 NOT DETECTED").
- **Removed stray unused `vector-wars/poster.jpeg`** (the WebGL-error capture).
- **Removed dead `PLAYABLES` const** in wings.spec.ts (ts(6133)/eslint).
- Confirmed the lead's `web/tsconfig.json` `exclude: ["dist","public/playables"]` fix is correct (astro check no longer OOMs on the 32MB bundles; 119 files, 0 errors).

## E2E Tests

### Added
- `web/e2e/playables.spec.ts` — real-runtime spec for /work/vector-wars/ + /work/christmas-elves/ (17 tests). Registered as the **`playables`** Playwright project in `web/playwright.config.ts` (Rule 7 — proven to run; the 7.2 unregistered-spec lesson). Covers: page reachable/one-h1/entity-first lede; real source-repo link; static poster loads (not broken); **NFR-1 lazy-load** (no game asset before activation); embed activation → iframe src resolves 200; **vendored-index boot-asset resolution** (the voyager base-path regression guard); JS-off graceful fallback; **christmas-elves BOOTS a `<canvas>` in the iframe** (Phaser JS actually runs). vector-wars WebGL gameplay NOT asserted (headless lacks WebGL2 — documented).

### Updated
- `web/e2e/wings.spec.ts` — vector-wars/christmas-elves are live links; voyager NOT live, only in "more coming"; ALLOWED set + docstring corrected.
- `web/test/build-output.test.ts` — playable route/slug sets reduced to the 2 shipped games; added poster-resolution test + "voyager is NOT a built route" regression.
- `web/test/wings.content.test.ts`, `web/test/Footer.component.test.ts` — voyager removed from live/route sets; assertions inverted to "voyager is coming".

## Coverage
- Playable pages (2 shipped): page render, embed activation, iframe resolution, JS-off fallback, NFR-1 isolation, christmas-elves boot — covered.
- Credibility (Rule 9): every shipped claim traces to a real repo/behavior; source links correct; zero fabrication; voyager honestly "coming".

## Next Steps (for the lead / a future story)
- To ship voyager: re-clone with `git lfs pull`, build with `base: '/playables/voyager/'`, vendor the LFS-complete dist, then re-add the page/route/Wing item + an e2e (the `playables` project already supports a WebGL-aware case).
