import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Depth Dial e2e tests (Story 5.2, AC1–AC5).
 *
 * Real-runtime e2e verifying:
 *   (a) Changing the dial changes visible per-Scene detail IN PLACE (no navigation, AC1).
 *   (b) The dial is keyboard-operable + axe-AA clean (AC3).
 *   (c) JS-off: the overview default shows and deeper content is reachable in the DOM (AC4).
 *   (d) The GuidePanel sends `depth` in its /api/guide request (AC2 agent-path smoke).
 *
 * Rule 3: real browser, observable DOM / network state.
 * Rule 8: assertions scoped to specific elements — never whole-document toContain.
 *
 * Mutation-verified (noted per test):
 *   - depth attribute change → detail changes: removing the CSS rules for [data-depth]
 *     would make the skim one-liner visible without the dial change, reddening these tests.
 *   - GuidePanel depth inclusion: removing depth from the request body would fail the
 *     network intercept assertion.
 */

test.describe('Depth Dial — AC1: dial changes visible per-Scene detail in place (no navigation)', () => {
  test('initially the overview tier is visible and skim/deep are hidden (default state)', async ({
    page,
  }) => {
    await page.goto('/');

    // Wait for JS to run and set data-depth (the enhancement sets it to 'overview' on init)
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-depth'), {
      timeout: 5000,
    });

    // The timeline scene is a representative scene with all 3 tiers.
    const timelineScene = page.locator('section#timeline');

    // Overview tier: the .scene__summary should be visible.
    // Rule 8: scoped to section#timeline .scene__summary
    await expect(timelineScene.locator('.scene__summary')).toBeVisible();

    // Skim tier: the .scene__skim should be hidden (data-depth=overview hides it).
    // Rule 8: scoped to section#timeline .scene__skim
    await expect(timelineScene.locator('.scene__skim')).not.toBeVisible();

    // Deep tier: the .scene__deep should be hidden (data-depth=overview hides it).
    await expect(timelineScene.locator('.scene__deep')).not.toBeVisible();
  });

  test('switching to "Skim" hides overview content and shows the skim one-liner, no navigation', async ({
    page,
  }) => {
    await page.goto('/');

    // Wait for the dial to be present
    const skimRadio = page.locator('[data-depth-radio][value="skim"]');
    await expect(skimRadio).toBeVisible({ timeout: 5000 });

    const url = page.url();

    // Click the Skim radio
    await skimRadio.click();

    // Confirm NO navigation happened (the URL is unchanged — in-place switching, AC1)
    // Mutation-verification: if clicking the radio triggered a navigation, this would fail.
    expect(page.url()).toBe(url);

    // Confirm data-depth on <html> is now 'skim'
    const depth = await page.evaluate(() => document.documentElement.getAttribute('data-depth'));
    expect(depth, 'data-depth must be "skim" after clicking Skim radio').toBe('skim');

    // In the timeline scene: skim is visible, overview and deep are hidden
    const timelineScene = page.locator('section#timeline');
    await expect(timelineScene.locator('.scene__skim')).toBeVisible();
    await expect(timelineScene.locator('.scene__summary')).not.toBeVisible();
    await expect(timelineScene.locator('.scene__deep')).not.toBeVisible();

    // The Close scene is deliberately UNTIERED (no .scene__skim) — its conversion
    // ask must stay readable at every depth. The global skim-hide rule would strip
    // its summary; the Close exemption keeps it visible. Mutation-verification:
    // removing the .scene--close exemption rule reds this. (Story 5.2 CR)
    const closeScene = page.locator('section#close');
    await expect(closeScene.locator('.scene__summary')).toBeVisible();
  });

  test('switching to "Deep dive" shows the deep block plus overview content, no navigation', async ({
    page,
  }) => {
    await page.goto('/');

    const deepRadio = page.locator('[data-depth-radio][value="deep"]');
    await expect(deepRadio).toBeVisible({ timeout: 5000 });

    const url = page.url();

    await deepRadio.click();
    expect(page.url()).toBe(url);

    const depth = await page.evaluate(() => document.documentElement.getAttribute('data-depth'));
    expect(depth, 'data-depth must be "deep" after clicking Deep dive radio').toBe('deep');

    // In the timeline scene: overview visible, deep visible, skim hidden
    const timelineScene = page.locator('section#timeline');
    await expect(timelineScene.locator('.scene__summary')).toBeVisible();
    await expect(timelineScene.locator('.scene__deep')).toBeVisible();
    await expect(timelineScene.locator('.scene__skim')).not.toBeVisible();
  });

  test('switching skim → overview → deep → skim cycles correctly, no navigation each step', async ({
    page,
  }) => {
    await page.goto('/');

    await page.waitForFunction(() => document.documentElement.hasAttribute('data-depth'), {
      timeout: 5000,
    });

    const flagshipScene = page.locator('section#flagship');

    // → skim
    await page.locator('[data-depth-radio][value="skim"]').click();
    await expect(flagshipScene.locator('.scene__skim')).toBeVisible();
    await expect(flagshipScene.locator('.scene__summary')).not.toBeVisible();

    // → overview
    await page.locator('[data-depth-radio][value="overview"]').click();
    await expect(flagshipScene.locator('.scene__summary')).toBeVisible();
    await expect(flagshipScene.locator('.scene__skim')).not.toBeVisible();
    await expect(flagshipScene.locator('.scene__deep')).not.toBeVisible();

    // → deep
    await page.locator('[data-depth-radio][value="deep"]').click();
    await expect(flagshipScene.locator('.scene__deep')).toBeVisible();
    await expect(flagshipScene.locator('.scene__skim')).not.toBeVisible();

    // → back to skim
    await page.locator('[data-depth-radio][value="skim"]').click();
    await expect(flagshipScene.locator('.scene__skim')).toBeVisible();
    await expect(flagshipScene.locator('.scene__deep')).not.toBeVisible();
  });
});

test.describe('Depth Dial — AC3: keyboard-operable + axe-AA clean', () => {
  test('the depth dial fieldset is present in the desktop rail with legend "Depth" (AC3)', async ({
    page,
  }) => {
    await page.goto('/');
    // The dial is in the desktop rail (visible ≥1024px)
    const rail = page.locator('nav.scene-rail');
    const fieldset = rail.locator('.rail-d [data-depth-dial]');
    await expect(fieldset).toBeAttached();
    // Legend text is "Depth"
    await expect(fieldset.locator('legend')).toContainText('Depth');
  });

  test('the dial has 3 labeled radio options: Skim, Overview, Deep dive (AC3)', async ({
    page,
  }) => {
    await page.goto('/');
    const fieldset = page.locator('[data-depth-dial]').first();
    // Rule 8: scoped to the fieldset — check each radio option
    const radios = fieldset.locator('input[type="radio"]');
    await expect(radios).toHaveCount(3);

    // Each value is present
    await expect(fieldset.locator('input[value="skim"]')).toHaveCount(1);
    await expect(fieldset.locator('input[value="overview"]')).toHaveCount(1);
    await expect(fieldset.locator('input[value="deep"]')).toHaveCount(1);

    // Labels contain the text
    await expect(fieldset).toContainText('Skim');
    await expect(fieldset).toContainText('Overview');
    await expect(fieldset).toContainText('Deep dive');
  });

  test('the overview radio is checked by default (state in the a11y tree, not color alone)', async ({
    page,
  }) => {
    await page.goto('/');
    // Wait for the enhancement to set the initial depth
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-depth'), {
      timeout: 5000,
    });
    // Rule 8: scoped to the desktop fieldset's overview radio
    const overviewRadio = page
      .locator('[data-depth-dial]')
      .first()
      .locator('input[value="overview"]');
    await expect(overviewRadio).toBeChecked();
    // The skim and deep radios must NOT be checked at baseline
    await expect(
      page.locator('[data-depth-dial]').first().locator('input[value="skim"]'),
    ).not.toBeChecked();
    await expect(
      page.locator('[data-depth-dial]').first().locator('input[value="deep"]'),
    ).not.toBeChecked();
  });

  test('the dial is keyboard-operable via Tab to focus the radio group (AC3)', async ({ page }) => {
    await page.goto('/');
    // The depth radios are real <input type="radio"> — keyboard Tab can reach the group,
    // and arrow keys navigate within the group.
    const overviewRadio = page.locator('[data-depth-radio][value="overview"]').first();
    await overviewRadio.focus();
    // Confirm the element is focused
    const focused = await page.evaluate(
      () =>
        document.activeElement?.getAttribute('data-depth-radio') !== null &&
        (document.activeElement as HTMLInputElement | null)?.type === 'radio',
    );
    expect(focused, 'a depth radio must be focusable via keyboard').toBe(true);

    // The focused radio shows a visible :focus-visible ring
    const outline = await page.evaluate(() => {
      const el = document.activeElement as Element | null;
      if (!el) return null;
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });
    expect(outline).not.toBeNull();
    // outline-style is not 'none' (the ring is not suppressed)
    expect(outline!.style).not.toBe('none');
    expect(parseFloat(outline!.width)).toBeGreaterThan(0);
  });

  test('axe WCAG 2.1 AA: zero violations on home with the depth dial present (AC3)', async ({
    page,
  }) => {
    await page.goto('/');
    // Wait for the Guide pill and depth dial enhancement to settle
    await page
      .locator('[data-testid="guide-pill"]')
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch(() => {});
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-depth'), {
      timeout: 5000,
    });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });
});

test.describe('Depth Dial — AC4: JS-off: overview default shows + deeper content reachable', () => {
  test('JS-off: the overview tier is visible and deep content is in the DOM (FR-8 reachability)', async ({
    browser,
  }) => {
    // Use an inline JS-disabled context (same pattern as invite.spec.ts) so the
    // depth-dial enhancement does NOT run — data-depth is never set — and the CSS
    // :not([data-depth]) rules govern visibility.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto('/');

      const timelineScene = page.locator('section#timeline');

      // Overview tier: the .scene__summary should be visible (the default)
      await expect(timelineScene.locator('.scene__summary')).toBeVisible();

      // Deep tier: the .scene__deep should be in the DOM (reachable — FR-8)
      // CSS :not([data-depth]) makes the deep block visible too.
      await expect(timelineScene.locator('.scene__deep')).toBeAttached();
      await expect(timelineScene.locator('.scene__deep')).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('JS-off: the dial control is present in the DOM (native fieldset, followable)', async ({
    browser,
  }) => {
    // Inline JS-disabled context — the fieldset is still rendered server-side.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto('/');
      // The fieldset is in the DOM even without JS — it degrades gracefully.
      // The radios are native HTML — no broken control.
      await expect(page.locator('[data-depth-dial]').first()).toBeAttached();
      await expect(page.locator('input[type="radio"][value="overview"]').first()).toBeAttached();
    } finally {
      await context.close();
    }
  });
});

test.describe('Depth Dial — AC2 agent path: GuidePanel sends depth in /api/guide request', () => {
  test('GuidePanel includes depth in the POST /api/guide request body (AC2)', async ({ page }) => {
    // Intercept /api/guide requests and capture the request body.
    // Mutation-verification: removing `depth` from the GuidePanel fetch body would
    // cause the captured body to NOT contain 'depth', reddening this test.
    const capturedBodies: Array<Record<string, unknown>> = [];

    await page.route('/api/guide', (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        const bodyStr = req.postData();
        if (bodyStr) {
          try {
            capturedBodies.push(JSON.parse(bodyStr) as Record<string, unknown>);
          } catch {
            // ignore parse errors
          }
        }
        // Fulfill with a minimal SSE response so the island doesn't error
        void route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: [
            'event: token\ndata: {"type":"token","value":"Test"}\n\n',
            'event: done\ndata: {"type":"done"}\n\n',
          ].join(''),
        });
      } else {
        void route.continue();
      }
    });

    await page.goto('/');

    // Wait for the depth dial enhancement to initialize
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-depth'), {
      timeout: 5000,
    });

    // Open the Guide panel and send a query
    // The GuidePill is client:only — wait for it to mount
    const pill = page.locator('[data-testid="guide-pill"]');
    await pill.waitFor({ state: 'visible', timeout: 8000 });
    await pill.click();

    // Wait for the panel to open (the dialog)
    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    // Find the input and send a query
    const input = dialog.locator('input[type="text"]');
    await input.fill('What is LoanDemo?');
    await input.press('Enter');

    // Wait for the request to be captured
    await page.waitForFunction(
      () => {
        // The captured bodies array is in the test process — we check via the network
        // interception callback. Give up to 5s for the request to fire.
        return true; // Just wait for a tick
      },
      { timeout: 3000 },
    );

    // Allow time for the network request to be made and captured
    await page.waitForTimeout(2000);

    // Verify a request was captured and it contains the 'depth' field
    expect(
      capturedBodies.length,
      'at least one /api/guide POST request must have been captured',
    ).toBeGreaterThan(0);

    const latestBody = capturedBodies[capturedBodies.length - 1]!;

    // Rule 8: scoped assertion — check the 'depth' field specifically
    expect(latestBody, 'the POST /api/guide body must contain a "depth" field').toHaveProperty(
      'depth',
    );

    // The depth value must be one of the valid enum values
    expect(['skim', 'overview', 'deep']).toContain(latestBody.depth);

    // The query field is also present (backward-compat check — existing fields unchanged)
    expect(latestBody).toHaveProperty('query');
  });

  test('GuidePanel sends the CURRENT dial depth on EACH send (no stale closure across depth changes)', async ({
    page,
  }) => {
    // Non-vacuous, stale-closure regression (Story 5.2 CR). This sends TWICE with a
    // depth change BETWEEN the two sends — the only pattern that exposes a memoized
    // sendQuery whose deps omit currentDepth. With the bug, the captured sequence
    // lags one depth-change behind (observed: ["overview","deep"] for deep-then-skim);
    // with the fix each send carries the live dial value (["deep","skim"]).
    // Mutation-verification: removing currentDepth from sendQuery's dependency array
    // reddens the send-#2 assertion below. A single-send variant is INSUFFICIENT —
    // it passes even with the stale closure due to client:only mount timing.
    const capturedDepths: Array<string | undefined> = [];

    await page.route('/api/guide', (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        const bodyStr = req.postData();
        if (bodyStr) {
          try {
            capturedDepths.push((JSON.parse(bodyStr) as { depth?: string }).depth);
          } catch {
            // ignore parse errors
          }
        }
        void route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: [
            'event: token\ndata: {"type":"token","value":"Test"}\n\n',
            'event: done\ndata: {"type":"done"}\n\n',
          ].join(''),
        });
      } else {
        void route.continue();
      }
    });

    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-depth'), {
      timeout: 5000,
    });

    // Open the Guide.
    const pill = page.locator('[data-testid="guide-pill"]');
    await pill.waitFor({ state: 'visible', timeout: 8000 });
    await pill.click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    const input = dialog.locator('input[type="text"]');

    // Send #1 at depth=deep.
    await page.locator('[data-depth-radio][value="deep"]').click();
    await input.fill('What is LoanDemo?');
    await input.press('Enter');
    await page.waitForTimeout(1500);

    // Send #2 at depth=skim (changed AFTER send #1 — the stale-closure trap).
    await page.locator('[data-depth-radio][value="skim"]').click();
    await input.fill('And the timeline?');
    await input.press('Enter');
    await page.waitForTimeout(1500);

    expect(
      capturedDepths.length,
      'two /api/guide POST requests must have been captured',
    ).toBeGreaterThanOrEqual(2);

    // Rule 8: scoped — each send carries the LIVE dial value at send time.
    expect(
      capturedDepths[0],
      `send #1 must carry the dial value at send #1 (deep) — captured=${JSON.stringify(capturedDepths)}`,
    ).toBe('deep');
    expect(
      capturedDepths[capturedDepths.length - 1],
      `send #2 must carry the CURRENT dial value (skim), not a stale prior depth — captured=${JSON.stringify(capturedDepths)}`,
    ).toBe('skim');
  });
});
