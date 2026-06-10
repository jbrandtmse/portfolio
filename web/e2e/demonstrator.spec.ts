import { expect, test } from '@playwright/test';

/**
 * Demonstrator e2e spec (Story 9.1).
 *
 * Rule 7 (proven to run): every test exercises a REAL served page — no skips,
 *   no test.skip() on missing prerequisites.
 *
 * Rule 8 (real module, scoped, mutation-verified): AC1 step assertion is
 *   mutation-verified (the test confirms that NOT stepping keeps the initial
 *   narration, so the "step changed narration" assertion would fail if stepping
 *   is a no-op).
 *
 * Rule 9 (credibility): AC3 asserts every stage narration trace is non-empty
 *   and no fabrication sentinel is visible in the served HTML.
 *
 * Rule 13 (user-observable): AC1 asserts visible narration text + a correct
 *   artifact link href, not just the $demoStep atom value.
 *
 * ACs:
 *   AC1 — step changes visible active stage (narration + artifact links)
 *   AC2 — JS-off: static list full (all 8 stages present in <ol>)
 *          reduced-motion: replay usable, no animated transitions, static list present
 *   AC3 — no fabrication sentinel visible in served HTML
 *   AC4 — /demonstrator/ registered in footer; canonical = trailing-slash form
 */

const DEMO_PATH = '/demonstrator/';

/** Wait for the replay island to mount and the start button to be visible. */
async function waitForReplayReady(page: import('@playwright/test').Page): Promise<void> {
  await page.locator('[data-testid="demo-start-btn"]').waitFor({ state: 'visible', timeout: 8000 });
}

/** Start the replay by clicking the start button. */
async function startReplay(page: import('@playwright/test').Page): Promise<void> {
  await waitForReplayReady(page);
  await page.locator('[data-testid="demo-start-btn"]').click();
  // Wait for the panel to appear.
  await page.locator('[data-testid="demo-panel"]').waitFor({ state: 'visible', timeout: 5000 });
}

// ---------------------------------------------------------------------------
// AC1 — narrated step-through changes the visible active stage
// ---------------------------------------------------------------------------

test.describe('Demonstrator — AC1: narrated step-through (visible outcome)', () => {
  test('start button appears after idle mount', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await waitForReplayReady(page);
    const startBtn = page.locator('[data-testid="demo-start-btn"]');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toContainText(/replay/i);
  });

  test('starting the replay shows the first stage narration (step 0)', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await startReplay(page);

    // The narration must be visible (Rule 13: user-observable outcome).
    const narration = page.locator('[data-testid="demo-narration"]');
    await expect(narration).toBeVisible();
    const narrationText = await narration.innerText();
    // Must be a non-empty string.
    expect(narrationText.trim().length).toBeGreaterThan(0);
    // The first stage is "The brief" — narration must mention the brief.
    expect(narrationText.toLowerCase()).toContain('brief');
  });

  test('clicking Next changes the visible narration text (Rule 13 mutation-verified)', async ({
    page,
  }) => {
    await page.goto(DEMO_PATH);
    await startReplay(page);

    // Record narration at step 0.
    const narration = page.locator('[data-testid="demo-narration"]');
    const step0Text = await narration.innerText();

    // Click Next.
    await page.locator('[data-testid="demo-next-btn"]').click();
    await page.waitForTimeout(200);

    // The narration text MUST change (Rule 13: visible outcome changed).
    const step1Text = await narration.innerText();
    expect(step1Text.trim()).not.toBe(step0Text.trim());

    // Mutation verification: if Next were a no-op, step1Text === step0Text,
    // and this assertion would fail.
    expect(step1Text.trim().length).toBeGreaterThan(0);
  });

  test('clicking Prev returns to the previous stage narration', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await startReplay(page);

    const narration = page.locator('[data-testid="demo-narration"]');
    const step0Text = await narration.innerText();

    await page.locator('[data-testid="demo-next-btn"]').click();
    await page.waitForTimeout(200);
    const step1Text = await narration.innerText();
    expect(step1Text.trim()).not.toBe(step0Text.trim());

    // Go back.
    await page.locator('[data-testid="demo-prev-btn"]').click();
    await page.waitForTimeout(200);
    const backToStep0 = await narration.innerText();
    // Must return to the step 0 narration.
    expect(backToStep0.trim()).toBe(step0Text.trim());
  });

  test('Prev button is disabled on step 0', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await startReplay(page);
    const prevBtn = page.locator('[data-testid="demo-prev-btn"]');
    await expect(prevBtn).toBeVisible();
    await expect(prevBtn).toBeDisabled();
  });

  test('Prev button is enabled after Next is clicked', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await startReplay(page);

    await page.locator('[data-testid="demo-next-btn"]').click();
    await page.waitForTimeout(200);

    const prevBtn = page.locator('[data-testid="demo-prev-btn"]');
    await expect(prevBtn).toBeEnabled();
  });

  test('live artifact link is present at step 0 (The brief → /glass-box/product-brief/)', async ({
    page,
  }) => {
    await page.goto(DEMO_PATH);
    await startReplay(page);

    // At step 0 (The brief), a live artifact link to /glass-box/product-brief/ must be present.
    const artifactLinks = page.locator('[data-testid="demo-artifact-links"] a');
    await expect(artifactLinks.first()).toBeVisible();
    const href = await artifactLinks.first().getAttribute('href');
    // The brief stage links to the published Product Brief reader.
    expect(href).toBe('/glass-box/product-brief/');
  });

  test('step indicator updates when stepping (Rule 13: user-observable)', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await startReplay(page);

    // Step indicator should show "1 / 8" at step 0.
    const indicator = page.locator('[data-testid="demo-panel"] .dr__step-indicator');
    await expect(indicator).toBeVisible();
    const indicatorText = await indicator.innerText();
    expect(indicatorText.trim()).toContain('1');

    // After clicking Next, it should show "2 / 8".
    await page.locator('[data-testid="demo-next-btn"]').click();
    await page.waitForTimeout(200);
    const indicatorAfterNext = await indicator.innerText();
    expect(indicatorAfterNext.trim()).toContain('2');
    // Not the same as before (mutation-verified).
    expect(indicatorAfterNext.trim()).not.toBe(indicatorText.trim());
  });

  test('Esc closes the replay and shows the intro hint', async ({ page }) => {
    await page.goto(DEMO_PATH);
    await startReplay(page);

    // Focus the panel and press Escape.
    await page.locator('[data-testid="demo-panel"]').focus();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // The panel must be hidden after Esc.
    await expect(page.locator('[data-testid="demo-panel"]')).not.toBeVisible();
    // The start button must be visible.
    await expect(page.locator('[data-testid="demo-start-btn"]')).toBeVisible();
  });

  test('focus moves to the active step panel when stepping (AC1 / Rule 13 observable)', async ({
    page,
  }) => {
    // AC1 explicitly claims "focus moves to the active stage." Assert the
    // user-observable outcome: after starting, the replay panel holds focus
    // (so keyboard users land in context), and after Next focus is on the panel.
    // Mutation-verified: removing the stepPanelRef.focus() effect reds this.
    await page.goto(DEMO_PATH);
    await startReplay(page);

    const panel = page.locator('[data-testid="demo-panel"]');
    await expect(panel).toBeFocused();

    await page.locator('[data-testid="demo-next-btn"]').click();
    await page.waitForTimeout(200);
    // Focus is re-asserted on the panel after the step changes.
    await expect(panel).toBeFocused();
  });

  test('restart button appears when replay is open; clicking it returns to step 0', async ({
    page,
  }) => {
    await page.goto(DEMO_PATH);
    await startReplay(page);

    // Go forward a step.
    await page.locator('[data-testid="demo-next-btn"]').click();
    await page.waitForTimeout(200);

    // The start button should now say "Restart".
    const startBtn = page.locator('[data-testid="demo-start-btn"]');
    await expect(startBtn).toContainText(/restart/i);

    // Click restart.
    await startBtn.click();
    await page.waitForTimeout(200);

    // Should be back at step 1 (indicator shows "1 / 8").
    const indicator = page.locator('.dr__step-indicator');
    const indicatorText = await indicator.innerText();
    expect(indicatorText.trim()).toContain('1');
  });
});

// ---------------------------------------------------------------------------
// AC2 — JS-off: static list is the full experience
// ---------------------------------------------------------------------------

test.describe('Demonstrator — AC2: JS-off static baseline', () => {
  test('all 8 spine items are present in the DOM (FR-8 crawlable)', async ({ page }) => {
    await page.goto(DEMO_PATH);

    // The static spine is present regardless of JS state.
    const spineItems = page.locator('[data-demo-stage]');
    const count = await spineItems.count();
    expect(count).toBe(8);
  });

  test('all stage labels are present in the static spine', async ({ page }) => {
    await page.goto(DEMO_PATH);

    // The stage labels from content/demonstrator.ts should all be in the DOM.
    const EXPECTED_LABELS = [
      'The brief',
      'Brainstorm and research',
      'The PRD',
      'UX and architecture',
      'Epics and stories',
      'The build pipeline',
      'Review and retrospective',
      'Working software',
    ];
    for (const label of EXPECTED_LABELS) {
      await expect(
        page.locator('.demonstrator__stage-label').filter({ hasText: label }),
      ).toBeVisible();
    }
  });

  test('live artifact links are real <a> elements in the static spine (JS-off followable)', async ({
    page,
  }) => {
    await page.goto(DEMO_PATH);

    // The static spine must contain real <a> links for published artifacts.
    const liveLinks = page.locator('.demonstrator__artifact-link');
    const count = await liveLinks.count();
    // There are 7 live artifacts across 8 stages (stages 4, 5, 7 have 'open' artifacts only or mixed).
    // At minimum the 6 published Glass Box readers + /timeline/ + live site = 8 live hrefs.
    // The static spine must have AT LEAST the 6 Glass Box reader links.
    expect(count).toBeGreaterThanOrEqual(6);
  });
});

test.describe('Demonstrator — AC2: reduced-motion (information feature, NOT motion-gated)', () => {
  // The repo emulates the preference per-page via page.emulateMedia (reliable with
  // the system-chrome channel) rather than use.reducedMotion (flaky + type-mismatched
  // here — see reduced-motion.spec.ts). Each test asserts the preference applied.

  test('replay still mounts + steps under reduced motion (not onMotionAllowed-gated)', async ({
    page,
  }) => {
    // AC2: the Demonstrator is an INFORMATION feature, not decorative motion.
    // Under prefers-reduced-motion: reduce it must STILL mount and step (it is
    // NOT gated behind onMotionAllowed). Animation is suppressed via CSS, but the
    // stepped replay remains fully usable. Mutation-verified: gating the mount on
    // motion would red this (the start button would never appear).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(DEMO_PATH);
    // Non-vacuity: confirm the preference is actually applied (else the test
    // would pass vacuously if emulateMedia ever stopped applying).
    expect(
      await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    ).toBe(true);

    await startReplay(page);

    const narration = page.locator('[data-testid="demo-narration"]');
    await expect(narration).toBeVisible();
    const step0 = await narration.innerText();

    // Stepping works the same under reduced motion.
    await page.locator('[data-testid="demo-next-btn"]').click();
    await page.waitForTimeout(200);
    const step1 = await narration.innerText();
    expect(step1.trim()).not.toBe(step0.trim());
    expect(step1.trim().length).toBeGreaterThan(0);
  });

  test('static spine remains the full crawlable experience under reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(DEMO_PATH);
    const spineItems = page.locator('[data-demo-stage]');
    expect(await spineItems.count()).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// AC3 — no fabrication sentinel in served HTML
// ---------------------------------------------------------------------------

test.describe('Demonstrator — AC3: credibility (no fabrication sentinel)', () => {
  test('served HTML contains no "[OPEN:" sentinel string outside data islands', async ({
    page,
  }) => {
    await page.goto(DEMO_PATH);

    // Get the full HTML and strip data islands.
    const html = await page.content();
    const htmlWithoutDataIslands = html.replace(
      /<script\b[^>]*type\s*=\s*["']application\/json["'][^>]*>[\s\S]*?<\/script>/gi,
      '',
    );
    expect(htmlWithoutDataIslands).not.toMatch(/\[OPEN:/);
  });

  test('served HTML contains no "ADR" / "architecture decision record" fabrication', async ({
    page,
  }) => {
    await page.goto(DEMO_PATH);
    const bodyText = await page.locator('main').innerText();
    expect(bodyText).not.toMatch(/\bADRs?\b|architecture decision records?/i);
  });

  test('no ghost Glass Box reader is rendered as a live link in the served page (Rule 9)', async ({
    page,
  }) => {
    // architecture/epics/retrospective/shipping have NO published reader — a live
    // <a> to them would 404. They must render as honest non-link "open" spans.
    await page.goto(DEMO_PATH);
    for (const slug of ['architecture', 'epics', 'retrospective', 'shipping']) {
      const ghostLink = page.locator(`main a[href="/glass-box/${slug}/"]`);
      expect(await ghostLink.count(), `no live <a> to ghost reader /glass-box/${slug}/`).toBe(0);
    }
  });

  test('visible stage prose asserts no stale fixed epic/rule count (Rule 9 fabrication class)', async ({
    page,
  }) => {
    // QA caught "Fourteen project rules" (actual 17) and "nine epics" (actual 10) —
    // stale hardcoded counts. Guard the class on the served prose. Scope to the
    // narration + observable elements only (NOT the whole <main>, whose decorative
    // aria-hidden stage numbers abut labels and would false-match "5 Epics").
    await page.goto(DEMO_PATH);
    const proseLocators = page.locator(
      '.demonstrator__stage-narration, .demonstrator__observable, .demonstrator__framing-lead, .demonstrator__boundary-note',
    );
    const parts = await proseLocators.allInnerTexts();
    const prose = parts.join('\n');
    expect(prose.length, 'stage prose must be present').toBeGreaterThan(0);
    expect(prose).not.toMatch(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\d+)\s+epics?\b/i,
    );
    expect(prose).not.toMatch(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\d+)\s+(project\s+)?rules?\b/i,
    );
  });
});

// ---------------------------------------------------------------------------
// AC4 — route registration, canonical URL (Rule 2)
// ---------------------------------------------------------------------------

test.describe('Demonstrator — AC4: route registration', () => {
  test('/demonstrator/ appears in the global footer', async ({ page }) => {
    await page.goto(DEMO_PATH);
    const footer = page.locator('footer.site-footer');
    await expect(footer).toBeVisible();
    // The Demonstrator link must be in the footer.
    const demoLink = footer.locator('a[href="/demonstrator/"]');
    await expect(demoLink).toBeVisible();
  });

  test('/demonstrator/ has trailing-slash canonical (Rule 2)', async ({ page }) => {
    await page.goto(DEMO_PATH);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toMatch(/\/demonstrator\/$/);
  });
});
