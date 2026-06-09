import { expect, test } from '@playwright/test';

/**
 * JS-OFF pass (Story 1.9, AC2 / IAC-2 (b); NFR-1 0-JS static floor) — the site is
 * fully functional with JavaScript DISABLED. The `js-off` project sets
 * javaScriptEnabled:false (playwright.config.ts), so NO enhancement script runs;
 * every assertion below is satisfied by the static HTML alone (skill-rules Rule 3
 * real-runtime evidence for the JS-off experience the Mirror layer guarantees).
 *
 * Covers: the home + a Mirror route render; the audience fork, the global footer
 * links, and /browse work as real <a>s; the 7 scenes are present in the locked
 * sequential DOM order; the rail's 7 jump anchors are present; the static
 * baseline holds (aria-current on #hero, the static meter); and the mobile "Jump
 * to section" <details> is a native, JS-off-operable disclosure.
 */

const SCENE_IDS = ['hero', 'thesis', 'timeline', 'speaker', 'flagship', 'glass-box', 'close'];

test.describe('home / with JavaScript disabled', () => {
  test('renders the hero (one <h1>) without any JS', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Seasoned, building at the frontier');
  });

  test('the 7 scenes are present in the locked sequential DOM order', async ({ page }) => {
    await page.goto('/');
    const ids = await page.locator('main section[id]').evaluateAll((els) => els.map((el) => el.id));
    expect(ids).toEqual(SCENE_IDS);
  });

  test('the audience fork + footer + /browse are real, followable links (JS-off)', async ({
    page,
  }) => {
    await page.goto('/');
    // Fork CTAs.
    await expect(page.locator('a.btn--primary', { hasText: 'Explore' })).toHaveAttribute(
      'href',
      '#thesis',
    );
    await expect(page.getByRole('link', { name: /book a talk/i }).first()).toHaveAttribute(
      'href',
      '/speaking/',
    );
    // Global footer links to every key Mirror route + /browse/ (trailing-slash form; Story 2.0 AC2).
    const footer = page.locator('footer.site-footer');
    await expect(footer.locator('a[href="/about/"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/browse/"]')).toHaveCount(1);

    // Following the /browse/ link works with no JS (real navigation).
    await footer.locator('a[href="/browse/"]').click();
    await expect(page).toHaveURL(/\/browse\/?$/);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('the rail jump anchors are present and the static baseline holds (no enhancement ran)', async ({
    page,
  }) => {
    await page.goto('/');
    const rail = page.locator('nav.scene-rail');
    for (const id of SCENE_IDS) {
      await expect(rail.locator(`a[href="#${id}"]`).first()).toHaveCount(1);
    }
    // Static baseline (no JS): exactly one aria-current and it is the #hero entry.
    const current = page.locator('.rail-d a[aria-current="true"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute('href', '#hero');
    // The meter label reads the static "Scene 1 of 7".
    await expect(page.locator('.rail-d__lab')).toContainText('Scene 1 of 7');
  });

  test('the mobile "Jump to section" <details> is a native disclosure that opens JS-off', async ({
    page,
  }) => {
    // Mobile reflow is a native <details>/<summary> — operable with no JS.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const details = page.locator('details.rail-m__menu');
    await expect(details).toHaveCount(1);
    // Toggling the native disclosure works without JS (clicking the summary).
    await expect(details).not.toHaveJSProperty('open', true);
    await details.locator('summary').click();
    await expect(details).toHaveJSProperty('open', true);
    // The same 7 scene anchors live inside the menu. (#close appears twice — once
    // as scene 7 and once as the separate "Skip to the end" link — so assert each
    // scene anchor is present at least once rather than exactly once.)
    for (const id of SCENE_IDS) {
      expect(await details.locator(`a[href="#${id}"]`).count()).toBeGreaterThanOrEqual(1);
    }
    // And the skip + jump affordances are in the menu too (trailing-slash form; Story 2.0 AC2).
    await expect(details.locator('a[href="/speaking/"]')).toHaveCount(1);
  });
});

test.describe('a Mirror route with JavaScript disabled', () => {
  test('/about/ renders as a real page with one <h1> and an entity-first lede', async ({
    page,
  }) => {
    await page.goto('/about/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main p').first()).toContainText(/^Joshua R\. Brandt, MSE/);
  });
});
