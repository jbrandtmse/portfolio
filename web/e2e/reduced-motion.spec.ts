import { expect, test } from '@playwright/test';

/**
 * REDUCED-MOTION pass (Story 1.9, AC2 / IAC-2 (c); NFR-2) — under
 * prefers-reduced-motion the scene-rail's JS enhancement MUST NOT run. Each test
 * emulates the preference explicitly via page.emulateMedia({ reducedMotion:
 * 'reduce' }) BEFORE navigating, so Chrome reports it to matchMedia and the
 * shared motion.ts gate (onMotionAllowed, Layer 2) no-ops. (emulateMedia is the
 * reliable per-page API; project-level use.reducedMotion proved flaky with the
 * system-chrome channel here.) This is the IAC-1 guard that the motion.ts
 * refactor did not regress the 1.4 rail (skill-rules Rule 3 real-runtime evidence).
 *
 * Covers: the observer never moves aria-current off #hero (even after scrolling a
 * later scene into view — the positive counterpart runs in home.spec.ts); the
 * meter stays the static bar reading "Scene 1 of 7"; and the page is still fully
 * usable (the rail anchors + the hero are present), proving reduced motion
 * degrades to the static baseline rather than breaking anything.
 */

test.describe('home / under prefers-reduced-motion: the scene-rail stays static', () => {
  // Emulate reduced motion before each navigation so the shared motion.ts gate
  // (onMotionAllowed) sees it when the rail's enhancement script runs and no-ops
  // (the static baseline stands).
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });
  test('aria-current stays on #hero even after scrolling a later scene into view (observer did not run)', async ({
    page,
  }) => {
    await page.goto('/');

    // Guard: the preference is actually emulated (so this test can never pass
    // vacuously if emulateMedia ever stops applying).
    expect(
      await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    ).toBe(true);

    // Baseline: aria-current is on the #hero rail entry.
    const current = page.locator('.rail-d a[aria-current="true"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute('href', '#hero');

    // Scroll a mid-arc scene fully into view and give any (gated-off) observer
    // ample time to (NOT) fire.
    await page.locator('section#flagship').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // Under reduced motion the enhancement no-opped: aria-current is STILL on
    // #hero (it was NOT moved to #flagship), and there is still exactly one.
    await expect(page.locator('.rail-d a[aria-current="true"]')).toHaveCount(1);
    await expect(page.locator('.rail-d a[aria-current="true"]')).toHaveAttribute('href', '#hero');
  });

  test('the meter is the static bar reading "Scene 1 of 7"', async ({ page }) => {
    await page.goto('/');
    // The "Scene N of 7" label stays at 1 (the JS that would update N never ran).
    await expect(page.locator('.rail-d__lab')).toContainText('Scene 1 of 7');
    // And the meter fill is present as the static baseline element.
    await expect(page.locator('.rail-d__meter-fill')).toHaveCount(1);
  });

  test('the page is still fully usable (hero + rail jump anchors present)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Seasoned, building at the frontier');
    const rail = page.locator('nav.scene-rail');
    for (const id of ['hero', 'thesis', 'timeline', 'speaker', 'flagship', 'glass-box', 'close']) {
      await expect(rail.locator(`a[href="#${id}"]`).first()).toHaveCount(1);
    }
  });
});
