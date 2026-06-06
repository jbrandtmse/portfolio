import { expect, test } from '@playwright/test';

/**
 * Normal e2e pass (Story 1.9, AC2 / IAC-2 (a)) — the Epic-1 surfaces in a REAL
 * browser with JS ON and motion ALLOWED (skill-rules Rule 3: browser real-runtime
 * evidence asserting on observable DOM / render state).
 *
 * Covers: the home renders the hero + the audience fork + the global footer; the
 * scene-rail navigates (jump anchors move to the target scene); the scene-rail's
 * aria-current tracking RUNS when motion is allowed (the shared motion.ts gate,
 * Layer 2 — the positive counterpart to reduced-motion.spec.ts); and a Mirror
 * route (/about) loads as a real answer-first page.
 */

test.describe('home / — hero, fork, footer (normal, JS on)', () => {
  test('renders exactly one <h1> with the canonical positioning line', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('Seasoned, building at the frontier');
  });

  test('renders the three audience-fork controls with the exact hrefs', async ({ page }) => {
    await page.goto('/');
    // Explore → the in-page #thesis scene anchor (the primary fork CTA).
    await expect(page.locator('a.btn--primary', { hasText: 'Explore' })).toHaveAttribute(
      'href',
      '#thesis',
    );
    // "book a talk" → /speaking (bypasses the Guide; protects SM-C1).
    await expect(page.getByRole('link', { name: /book a talk/i }).first()).toHaveAttribute(
      'href',
      '/speaking',
    );
    // The quiet Guide entry → /faq.
    await expect(page.getByRole('link', { name: /ask my Guide about the work/i })).toHaveAttribute(
      'href',
      '/faq',
    );
  });

  test('renders the global static-fallback footer with a link to /about and /browse', async ({
    page,
  }) => {
    await page.goto('/');
    const footer = page.locator('footer.site-footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator('a[href="/about"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/browse"]')).toHaveCount(1);
  });
});

test.describe('home / — the scene-rail (the FR-2 skip/progress/jump affordance)', () => {
  test('exposes the 7 scene jump anchors + skip + jump in the rail nav', async ({ page }) => {
    await page.goto('/');
    const rail = page.locator('nav.scene-rail');
    for (const id of ['hero', 'thesis', 'timeline', 'speaker', 'flagship', 'glass-box', 'close']) {
      await expect(rail.locator(`a[href="#${id}"]`).first()).toHaveCount(1);
    }
    // Skip → #close and Jump → /speaking.
    await expect(rail.locator('a[href="#close"]').first()).toBeVisible();
    await expect(rail.locator('a[href="/speaking"]').first()).toBeVisible();
  });

  test('a rail jump anchor navigates to its scene (the hash + the target in view)', async ({
    page,
  }) => {
    await page.goto('/');
    // Click the desktop rail's Timeline jump anchor.
    await page.locator('.rail-d a[href="#timeline"]').click();
    await expect(page).toHaveURL(/#timeline$/);
    // The #timeline section is scrolled into the viewport (jump worked).
    await expect(page.locator('section#timeline')).toBeInViewport();
  });

  test('with motion ALLOWED, the rail aria-current tracks the scrolled-to scene (motion.ts gate runs)', async ({
    page,
  }) => {
    // The positive counterpart to the reduced-motion pass: when motion is allowed,
    // the IntersectionObserver in the motion.ts-gated enhancement runs and moves
    // aria-current off #hero as a later scene scrolls into view (IAC-1).
    await page.goto('/');
    // Baseline: aria-current starts on the #hero rail entry.
    await expect(page.locator('.rail-d a[aria-current="true"]')).toHaveAttribute('href', '#hero');

    // Scroll a mid-arc scene into the observer's band and let the observer fire.
    await page.locator('section#flagship').scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () => page.locator('.rail-d a[aria-current="true"]').first().getAttribute('href'),
        { timeout: 5000 },
      )
      .not.toBe('#hero');
  });
});

test.describe('a Mirror route loads as a real answer-first page', () => {
  test('/about renders one <h1> and an entity-first lede', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1')).toHaveCount(1);
    // The first paragraph (the answer-first lede) names the entity first.
    const lede = page.locator('main p').first();
    await expect(lede).toContainText(/^Joshua R\. Brandt, MSE/);
  });
});
