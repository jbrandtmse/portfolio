import { expect, test } from '@playwright/test';

/**
 * Playable project embeds e2e spec — /work/vector-wars/ + /work/christmas-elves/
 * (Story 7.3, FR-26 / Rule 3 real-runtime, Rule 7 discoverability).
 *
 * This spec is registered as the `playables` Playwright project in
 * playwright.config.ts (testMatch /playables\.spec\.ts/) so it is PROVEN to run
 * in the default suite (the 7.2 lesson: an unregistered spec runs 0 times).
 *
 * What it verifies on the REAL built runtime:
 *   - The /work/<slug>/ page is reachable (single 200, no hop) with one <h1>.
 *   - The answer-first lede names "Joshua R. Brandt, MSE" (GEO floor).
 *   - The real public source-repo link (github.com/jbrandtmse/<slug>) is present.
 *   - JS-OFF: the static poster renders and a real "Play →" link to
 *     /playables/<slug>/ + the repo link remain (graceful fallback, NFR-1).
 *   - NFR-1 lazy-load: the iframe src is NOT requested on initial paint; only a
 *     click sets <iframe src="/playables/<slug>/">.
 *   - The activated iframe's src (/playables/<slug>/) resolves 200 and the
 *     vendored game's index/boot assets load (no 404 on the game's entry JS).
 *   - christmas-elves (Phaser / Canvas2D) actually BOOTS — a <canvas> appears in
 *     the iframe and the game JS runs (verifiable in this headless env).
 *   - vector-wars (Three.js / WebGL 2.0) — verify what IS verifiable headless:
 *     page + poster + embed activation + the game index/boot JS resolve 200. The
 *     game requires WebGL 2.0, which is NOT available in this headless browser
 *     (the game prints "WebGL 2.0 NOT DETECTED"), so WebGL GAMEPLAY is NOT
 *     asserted here — it is covered by the game's own suite + real hardware.
 *
 * voyager is intentionally ABSENT — its Git-LFS-backed asset bundle (3D models,
 * KTX2 textures, trajectory data) was not vendored, so the embed cannot render;
 * it stays honest "coming" (asserted in build-output.test.ts + wings specs).
 */

interface PlayableCase {
  slug: string;
  path: string;
  /** Phaser (Canvas2D) boots headless → assert canvas. WebGL games do not. */
  bootsHeadless: boolean;
}

const PLAYABLES: PlayableCase[] = [
  { slug: 'vector-wars', path: '/work/vector-wars/', bootsHeadless: false },
  { slug: 'christmas-elves', path: '/work/christmas-elves/', bootsHeadless: true },
];

test.describe('Playable project embeds — /work/<slug>/ (Story 7.3)', () => {
  for (const game of PLAYABLES) {
    test.describe(game.slug, () => {
      test('is reachable at the trailing-slash URL (single 200, no redirect) with one <h1>', async ({
        page,
      }) => {
        const response = await page.goto(game.path);
        expect(response?.status(), `${game.path} must be a 200 (canonical trailing-slash)`).toBe(
          200,
        );
        await expect(page.locator('h1')).toHaveCount(1);
      });

      test('the lede leads with "Joshua R. Brandt, MSE" (entity-first, GEO floor)', async ({
        page,
      }) => {
        await page.goto(game.path);
        await expect(page.locator('.mirror__lede')).toContainText(/^Joshua R\. Brandt, MSE/);
      });

      test('links the real public GitHub source repo (Rule 9 credibility)', async ({ page }) => {
        await page.goto(game.path);
        const repoLink = page.locator(`a[href="https://github.com/jbrandtmse/${game.slug}"]`);
        await expect(
          repoLink.first(),
          `${game.path} must link github.com/jbrandtmse/${game.slug}`,
        ).toBeVisible();
      });

      test('the static poster image renders (the JS-off / pre-activation surface)', async ({
        page,
      }) => {
        await page.goto(game.path);
        const poster = page.locator('.playable-embed__trigger .playable-embed__poster');
        await expect(poster).toBeVisible();
        // The poster <img> must have a non-empty src that points at the vendored bundle.
        const src = await poster.getAttribute('src');
        expect(src, `${game.slug} poster src must point at /playables/${game.slug}/`).toMatch(
          new RegExp(`^/playables/${game.slug}/poster\\.`),
        );
        // And it must actually load (naturalWidth > 0 → not a broken image).
        const naturalWidth = await poster.evaluate((img) => (img as HTMLImageElement).naturalWidth);
        expect(naturalWidth, `${game.slug} poster must load (not a broken <img>)`).toBeGreaterThan(
          0,
        );
      });

      test('NFR-1 lazy-load — the iframe src is NOT requested on initial paint', async ({
        page,
      }) => {
        const playableRequests: string[] = [];
        page.on('request', (req) => {
          const url = req.url();
          if (url.includes(`/playables/${game.slug}/`)) playableRequests.push(url);
        });
        await page.goto(game.path);
        await page.waitForLoadState('networkidle');
        // No game bundle / index request before the visitor activates the embed.
        // (The poster image IS allowed — it is the static pre-activation surface.)
        const nonPoster = playableRequests.filter((u) => !/\/poster\.[a-z]+(\?|$)/.test(u));
        expect(
          nonPoster,
          `no /playables/${game.slug}/ game asset must load before activation (NFR-1 lazy). Got: ${nonPoster.join(', ')}`,
        ).toHaveLength(0);
      });

      test('activating the embed loads the iframe whose src (/playables/<slug>/) resolves 200', async ({
        page,
      }) => {
        await page.goto(game.path);
        // Click the play button (the click-to-play loader swaps in the iframe).
        await page.locator('.playable-embed__play-btn').click();
        const iframe = page.locator('iframe.playable-embed__iframe');
        await expect(iframe).toBeVisible();
        const src = await iframe.getAttribute('src');
        expect(src, 'activated iframe src is the vendored bundle index').toBe(
          `/playables/${game.slug}/`,
        );
        // The game's index resolves 200 (the bundle is reachable).
        const resp = await page.request.get(`/playables/${game.slug}/`);
        expect(resp.status(), `/playables/${game.slug}/ index must resolve 200`).toBe(200);
      });

      test('the vendored game index references only resolvable boot assets (no 404 entry JS)', async ({
        page,
      }) => {
        // Fetch the game's index.html and assert every same-origin asset it
        // references (script/link href/src under /playables/<slug>/ or relative)
        // resolves 200 — the regression guard for a base-path mismatch (the bug
        // that left voyager's /assets/ refs pointing at the portfolio root).
        const indexResp = await page.request.get(`/playables/${game.slug}/`);
        expect(indexResp.status()).toBe(200);
        const html = await indexResp.text();
        // Collect script src + stylesheet/modulepreload href + dynamic import('...').
        const refs = new Set<string>();
        for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)) refs.add(m[1]!);
        for (const m of html.matchAll(/<link\b[^>]*\bhref="([^"]+)"/g)) refs.add(m[1]!);
        for (const m of html.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) refs.add(m[1]!);
        // Resolve each ref against the game's index URL and require 200 for
        // same-origin (relative or /playables-rooted) assets; skip absolute http(s).
        const base = new URL(`/playables/${game.slug}/`, 'http://127.0.0.1');
        let checked = 0;
        for (const ref of refs) {
          if (/^https?:\/\//.test(ref) || ref.startsWith('data:')) continue;
          const resolved = new URL(ref, base).pathname;
          const r = await page.request.get(resolved);
          expect(
            r.status(),
            `${game.slug} index references ${ref} → ${resolved} which must resolve 200 (got ${r.status()})`,
          ).toBe(200);
          checked++;
        }
        expect(
          checked,
          `${game.slug} index must reference at least one boot asset`,
        ).toBeGreaterThan(0);
      });

      test('JS-OFF — poster + "Play →" link to /playables/<slug>/ + repo link remain (graceful fallback)', async ({
        browser,
      }) => {
        const ctx = await browser.newContext({ javaScriptEnabled: false });
        const p = await ctx.newPage();
        const resp = await p.goto(game.path);
        expect(resp?.status(), 'page is server-rendered (reachable JS-off)').toBe(200);
        // The <noscript> fallback link to the vendored game is followable.
        const directLink = p.locator(`a[href="/playables/${game.slug}/"]`);
        expect(
          await directLink.count(),
          'a direct /playables/<slug>/ link is present JS-off',
        ).toBeGreaterThan(0);
        // The repo link is present JS-off too.
        await expect(
          p.locator(`a[href="https://github.com/jbrandtmse/${game.slug}"]`).first(),
        ).toBeVisible();
        // And the direct game link resolves 200 (the bundle is directly reachable).
        const gameResp = await p.request.get(`/playables/${game.slug}/`);
        expect(gameResp.status(), `/playables/${game.slug}/ reachable JS-off`).toBe(200);
        await ctx.close();
      });

      if (game.bootsHeadless) {
        test('the game BOOTS inside the iframe — a <canvas> renders (Phaser / Canvas2D)', async ({
          page,
        }) => {
          await page.goto(game.path);
          await page.locator('.playable-embed__play-btn').click();
          const frameEl = page.locator('iframe.playable-embed__iframe');
          await expect(frameEl).toBeVisible();
          const frame = page.frameLocator('iframe.playable-embed__iframe');
          // Phaser mounts a <canvas> when the game boots. Wait for it to appear —
          // this proves the vendored bundle's JS actually ran in the iframe.
          await expect(
            frame.locator('canvas'),
            `${game.slug} must boot a <canvas> inside the iframe (game JS ran)`,
          ).toBeVisible({ timeout: 15000 });
        });
      }
    });
  }
});
