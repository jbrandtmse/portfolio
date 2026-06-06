import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Speaker Surface e2e spec (Story 3.1, Task 6, AC1–AC5).
 *
 * Covers:
 *  - /speaking/ — reel poster is the lead item and is a followable <a> to
 *    /speaking/reel/ JS-off; collapsed talk abstracts are in the DOM and
 *    <details> toggles; WCAG 2.1 AA (axe); 0 executable scripts; voice.
 *  - /speaking/reel/ — reel block renders, static link present, VideoObject
 *    JSON-LD; axe AA; 0 executable scripts.
 *
 * Real-runtime evidence (skill-rules Rule 3). Discoverable by playwright.config.ts
 * (testMatch: /speaking\.spec\.ts/; Rule 8).
 */

// ─── Speaking page ────────────────────────────────────────────────────────────

test.describe('/speaking/ — Speaker Surface', () => {
  test('opens with an answer-first lede naming Joshua R. Brandt, MSE (NFR-3)', async ({ page }) => {
    await page.goto('/speaking/');
    const firstP = page.locator('main p').first();
    await expect(firstP).toContainText('Joshua R. Brandt, MSE');
  });

  test('the reel poster is present as a static <a> linking to /speaking/reel/ (AC1)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    const posterLink = page.locator('a[href="/speaking/reel/"]').first();
    await expect(posterLink).toBeVisible();
    // Has an aria-label mentioning the reel.
    const label = await posterLink.getAttribute('aria-label');
    expect(label).toBeTruthy();
    expect(label!.toLowerCase()).toContain('reel');
  });

  test('the reel poster link is followable JS-off — navigates to /speaking/reel/ (AC1)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    const posterLink = page.locator('a[href="/speaking/reel/"]').first();
    await expect(posterLink).toBeVisible();
    await posterLink.click();
    await expect(page).toHaveURL(/\/speaking\/reel\//);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('the first talk abstract is expanded inline (no <details> for the first talk) (AC3)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    // First talk card abstract is inline (expanded prop = true).
    // The first <details> element should not contain the first talk's abstract.
    const firstTalkCard = page.locator('.talk-card').first();
    // First card should not have a <details> within it.
    await expect(firstTalkCard.locator('details')).toHaveCount(0);
    // The abstract text is present inline.
    await expect(firstTalkCard).toContainText('Agentic');
  });

  test('collapsed talk abstracts are in the DOM — text present inside <details> (AC3, crawler-accessible)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    // Second talk card should have a <details> element.
    const secondTalkCard = page.locator('.talk-card').nth(1);
    const details = secondTalkCard.locator('details');
    await expect(details).toHaveCount(1);
    // Full abstract text is present inside the <details> (in the DOM for crawlers).
    // Use a safe substring that doesn't contain " chars (HTML-encoded as &quot;).
    await expect(details).toContainText('agentic and are now confronting');
  });

  test('<details> summary toggles open/closed (JS-off, keyboard-operable) (AC3)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    const secondCard = page.locator('.talk-card').nth(1);
    const details = secondCard.locator('details');
    const summary = details.locator('summary');
    // Initially closed.
    await expect(details).not.toHaveJSProperty('open', true);
    // Click the summary — native <details> toggle.
    await summary.click();
    await expect(details).toHaveJSProperty('open', true);
    // Click again — closes.
    await summary.click();
    await expect(details).toHaveJSProperty('open', false);
  });

  test('veteran-IC-vantage talk is present on the page (AC3)', async ({ page }) => {
    await page.goto('/speaking/');
    // The veteran-IC talk exists — flagged [ASSUMPTION]. Use .filter() to
    // narrow from multiple .talk-card elements (strict-mode-safe).
    const veteranCard = page.locator('.talk-card').filter({ hasText: 'Veteran IC' });
    await expect(veteranCard).toHaveCount(1);
  });

  test('all talk cards render with at least one audience chip', async ({ page }) => {
    await page.goto('/speaking/');
    const cards = page.locator('.talk-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const chips = card.locator('.talk-card__chip');
      await expect(chips).not.toHaveCount(0);
    }
  });

  test('summary :focus-visible is keyboard-operable — tab + enter toggles <details>', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    const secondCard = page.locator('.talk-card').nth(1);
    const details = secondCard.locator('details');
    const summary = details.locator('summary');
    // Focus the summary and press Enter — native keyboard operation.
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(details).toHaveJSProperty('open', true);
  });

  test('WCAG 2.1 AA — zero axe violations on /speaking/ (AC5)', async ({ page }) => {
    await page.goto('/speaking/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });

  test('renders exactly one <h1> on /speaking/ (clean heading hierarchy)', async ({ page }) => {
    await page.goto('/speaking/');
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('/speaking/ ships 0 executable JS (NFR-1)', async ({ page }) => {
    await page.goto('/speaking/');
    const scripts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script')).map((s) => s.type),
    );
    const execScripts = scripts.filter((t) => t !== 'application/ld+json');
    expect(execScripts).toHaveLength(0);
  });
});

// ─── Reel page ────────────────────────────────────────────────────────────────

test.describe('/speaking/reel/ — Speaker reel', () => {
  test('opens with an answer-first lede naming Joshua R. Brandt, MSE (NFR-3)', async ({ page }) => {
    await page.goto('/speaking/reel/');
    const firstP = page.locator('main p').first();
    await expect(firstP).toContainText('Joshua R. Brandt, MSE');
  });

  test('renders the reel poster with a link (AC2)', async ({ page }) => {
    await page.goto('/speaking/reel/');
    // The reel poster is present.
    const poster = page.locator('.reel-poster');
    await expect(poster).toBeVisible();
    // Has a link (the poster <a>).
    await expect(poster.locator('a')).not.toHaveCount(0);
  });

  test('the poster on the reel page links to the hosted video, not a self-link (AC2)', async ({
    page,
  }) => {
    await page.goto('/speaking/reel/');
    const posterLink = page.locator('.reel-poster .reel-poster__link');
    await expect(posterLink).toHaveCount(1);
    const href = await posterLink.getAttribute('href');
    // The play-button affordance must NOT point back at the page it is on.
    expect(href).not.toMatch(/\/speaking\/reel\/?$/);
    // It points at the hosted reel video (the [OPEN] asset).
    expect(href).toMatch(/reel\.mp4/);
  });

  test('reel details section shows duration and [OPEN] hosted video link (AC2)', async ({
    page,
  }) => {
    await page.goto('/speaking/reel/');
    await expect(page.locator('.reel__details')).toBeVisible();
    await expect(page.locator('.reel__details')).toContainText('90');
    // The static link to hosted video is present (labeled [OPEN]).
    await expect(page.locator('.reel__video-link')).toBeVisible();
  });

  test('WCAG 2.1 AA — zero axe violations on /speaking/reel/ (AC5)', async ({ page }) => {
    await page.goto('/speaking/reel/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });

  test('renders exactly one <h1> on /speaking/reel/ (clean heading hierarchy)', async ({
    page,
  }) => {
    await page.goto('/speaking/reel/');
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('/speaking/reel/ ships 0 executable JS (NFR-1)', async ({ page }) => {
    await page.goto('/speaking/reel/');
    const scripts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script')).map((s) => s.type),
    );
    const execScripts = scripts.filter((t) => t !== 'application/ld+json');
    expect(execScripts).toHaveLength(0);
  });
});

// ─── QA gap-fill: reel-as-lead-item ordering + credibility floor (served) ──────
//
// Complements the dev spec (which proves the poster link exists + is followable)
// with the ordering + honesty assertions the QA directive calls out, exercised
// against the real served runtime (skill-rules Rule 3). Reuses the `speaking`
// Playwright project (testMatch /speaking\.spec\.ts/) — no cross-project run.

test.describe('/speaking/ — reel is the lead item & credibility floor is visible', () => {
  test('the reel poster is the FIRST content item below the lede — before any talk card (AC1)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    // DOM-order check: the reel-poster link and the first talk card both exist…
    const posterLink = page.locator('main a[href="/speaking/reel/"]').first();
    const firstTalkCard = page.locator('main .talk-card').first();
    await expect(posterLink).toBeVisible();
    await expect(firstTalkCard).toBeVisible();
    // …and the reel poster appears BEFORE the first talk card in document order.
    // Computed entirely in-page (both nodes resolved via querySelector) so the
    // reel poster being the lead item is asserted on the real served DOM.
    const reelPrecedesTalks = await page.evaluate(() => {
      const reel = document.querySelector('main a[href="/speaking/reel/"]');
      const card = document.querySelector('main .talk-card');
      if (!reel || !card) return null;
      // compareDocumentPosition & DOCUMENT_POSITION_FOLLOWING (4): card follows reel.
      return (reel.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    expect(reelPrecedesTalks).toBe(true);
  });

  test('the reel-poster aria-label names the ~90s duration (AC1, served runtime)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    const posterLink = page.locator('main a[href="/speaking/reel/"]').first();
    const label = (await posterLink.getAttribute('aria-label')) ?? '';
    expect(label.toLowerCase()).toContain('reel');
    // The duration must be named in the accessible label (AC1 explicit requirement).
    expect(label).toMatch(/90/);
  });

  test('the [OPEN] reel placeholder + [ASSUMPTION] veteran-IC angle are VISIBLE text (AC3 honesty)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    // Visible body text of <main> (textContent excludes ld+json DATA blocks).
    const bodyText = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    // Credibility floor: flags are surfaced in visible copy, not color/tint alone.
    expect(bodyText).toContain('[ASSUMPTION]');
    expect(bodyText).toContain('Veteran IC');
    expect(bodyText).toContain('[OPEN');
  });
});
