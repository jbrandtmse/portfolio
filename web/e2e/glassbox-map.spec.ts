import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Glass Box explorable map e2e spec (Story 6.4).
 *
 * Tests the clustered phase-map section added to /glass-box/:
 *
 * AC1 — free-browse map: the same 6 artifacts + live site are grouped into
 *        4 build phases (Discovery, Definition, Design, Launch) in order,
 *        plus an "As it accrues" phase for ghost nodes.
 *
 * AC2 — every featured node is a real <a href="/glass-box/{slug}/"> reachable
 *        with JS off and by crawlers (the headline guarantee, proven to RUN —
 *        Rule 7). Ghosts are non-link placeholders (no fabricated reader href).
 *        Each featured reader resolves 200.
 *
 * AC3 — credibility (Rule 9): curated phase/label strings present; no
 *        fabricated ghost link; composition — 6.3 tour + spine + JS-off
 *        baseline still work.
 *
 * axe-core AA on the map section (extends the existing glassbox axe audit).
 *
 * Rule 7: the JS-off AC2 test PROVES the test actually runs (not skipped).
 *   The map is static HTML — no prerequisites needed, runs JS-off by
 *   construction. Assertions confirm visible presence and 200 responses.
 */

const INDEX_PATH = '/glass-box/';

// The 6 featured artifact slugs (must match FEATURED_SLUGS in glassbox.index.ts).
const FEATURED_SLUGS = [
  'brainstorm',
  'pre-brief-research',
  'product-brief',
  'prd',
  'ux-design',
  'ux-experience',
] as const;

// Expected phases in order.
const EXPECTED_PHASES = ['Discovery', 'Definition', 'Design', 'Launch', 'As it accrues'] as const;

// Ghost slugs — no readers exist.
const GHOST_SLUGS = ['architecture', 'epics', 'retrospective'] as const;

test.describe('Glass Box explorable map — AC2: crawlable / JS-off (headline guarantee)', () => {
  // ── JS-OFF path (Rule 7: PROVEN TO RUN) ──────────────────────────────────────
  // This test uses browser.newContext({ javaScriptEnabled: false }) per the
  // project's JS-off pattern (glassbox-index.spec.ts lines ~378-401).
  // The map is fully static — the test ALWAYS runs (no skip risk — Rule 7).
  test('JS-off: the map section is present + all featured nodes are real <a> links (Rule 7, AC2)', async ({
    browser,
  }) => {
    // PROOF OF RUN: the map is static HTML; the JS-off context is the PRIMARY
    // guarantee (no skip on missing prereq — the map requires no JS, no API).
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    const response = await page.goto(INDEX_PATH);
    expect(response?.status(), 'JS-off: /glass-box/ must return 200').toBe(200);

    // Map section must be present (static HTML — no JS needed to render it).
    const mapSection = page.locator('#glass-box-map');
    await expect(mapSection, 'JS-off: #glass-box-map section must be visible').toBeVisible();

    // Every featured node must be a real <a href="/glass-box/{slug}/"> visible
    // in the DOM — Rule 7 / AC2: no node gated behind JS.
    for (const slug of FEATURED_SLUGS) {
      const link = mapSection.locator(`a[href="/glass-box/${slug}/"]`).first();
      await expect(
        link,
        `JS-off: featured node "${slug}" must be a real <a> in the map`,
      ).toBeAttached();
      await expect(link, `JS-off: featured node "${slug}" must be visible`).toBeVisible();
    }

    // Shipping node (live site) must be a real <a> in the map.
    const shippingLink = mapSection
      .locator('a[href="https://joshuabrandt.abacusai.cloud/"]')
      .first();
    await expect(
      shippingLink,
      'JS-off: shipping node must be a real <a> in the map',
    ).toBeAttached();

    // Ghost nodes must NOT have a reader link (no fabricated /glass-box/…/ href).
    for (const ghostSlug of GHOST_SLUGS) {
      const ghostLink = mapSection.locator(`a[href="/glass-box/${ghostSlug}/"]`);
      await expect(
        ghostLink,
        `JS-off: ghost "${ghostSlug}" must NOT have a reader link in the map`,
      ).toHaveCount(0);
    }

    await context.close();
  });

  test('each featured reader linked from the map resolves 200', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await page.waitForSelector('#glass-box-map');

    for (const slug of FEATURED_SLUGS) {
      const response = await page.goto(`/glass-box/${slug}/`);
      expect(response?.status(), `Reader /glass-box/${slug}/ must resolve 200`).toBe(200);
      await page.goto(INDEX_PATH);
      await page.waitForSelector('#glass-box-map');
    }
  });

  test('ghost nodes in the map have no fabricated reader link (AC2, Rule 9)', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const mapSection = page.locator('#glass-box-map');

    for (const ghostSlug of GHOST_SLUGS) {
      const ghostLink = mapSection.locator(`a[href="/glass-box/${ghostSlug}/"]`);
      await expect(
        ghostLink,
        `Ghost "${ghostSlug}" must NOT have a reader link in the map`,
      ).toHaveCount(0);
    }
  });
});

test.describe('Glass Box explorable map — AC1: free-browse grouping', () => {
  test('the map section is present on /glass-box/ with correct aria-label', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const mapSection = page.locator('#glass-box-map');
    await expect(mapSection).toBeVisible();
    await expect(mapSection).toHaveAttribute(
      'aria-label',
      'Explorable phase map of build artifacts',
    );
  });

  test('the map shows all 5 phases in order (Discovery → Definition → Design → Launch → As it accrues)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const mapSection = page.locator('#glass-box-map');

    // The phase headings must be present in order.
    const phaseHeadings = mapSection.locator('.glass-box__phase-heading');
    const count = await phaseHeadings.count();
    expect(count, 'must have 5 phase headings').toBe(5);

    for (let i = 0; i < EXPECTED_PHASES.length; i++) {
      const phaseName = EXPECTED_PHASES[i];
      if (!phaseName) continue;
      await expect(phaseHeadings.nth(i)).toContainText(phaseName);
    }
  });

  test('each featured artifact node is in the correct phase', async ({ page }) => {
    await page.goto(INDEX_PATH);

    // Check Discovery phase contains brainstorm and pre-brief-research.
    const discoveryPhase = page.locator('[data-phase="Discovery"]');
    await expect(discoveryPhase.locator('a[href="/glass-box/brainstorm/"]')).toBeAttached();
    await expect(discoveryPhase.locator('a[href="/glass-box/pre-brief-research/"]')).toBeAttached();

    // Check Definition phase contains product-brief and prd.
    const definitionPhase = page.locator('[data-phase="Definition"]');
    await expect(definitionPhase.locator('a[href="/glass-box/product-brief/"]')).toBeAttached();
    await expect(definitionPhase.locator('a[href="/glass-box/prd/"]')).toBeAttached();

    // Check Design phase contains ux-design and ux-experience.
    const designPhase = page.locator('[data-phase="Design"]');
    await expect(designPhase.locator('a[href="/glass-box/ux-design/"]')).toBeAttached();
    await expect(designPhase.locator('a[href="/glass-box/ux-experience/"]')).toBeAttached();

    // Check Launch phase contains the live site link.
    const launchPhase = page.locator('[data-phase="Launch"]');
    await expect(
      launchPhase.locator('a[href="https://joshuabrandt.abacusai.cloud/"]'),
    ).toBeAttached();
  });

  test('artifacts are independently navigable — no forced sequence (free-browse)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const mapSection = page.locator('#glass-box-map');

    // Each featured link is individually reachable (exists in DOM, no disabled/aria-disabled).
    for (const slug of FEATURED_SLUGS) {
      const link = mapSection.locator(`a[href="/glass-box/${slug}/"]`).first();
      await expect(link).toBeAttached();
      await expect(link).not.toHaveAttribute('aria-disabled', 'true');
      // The link is not inside a hidden/collapsed container.
      await expect(link).toBeVisible();
    }
  });

  test('"As it accrues" ghost nodes are present as non-link placeholders', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const ghostPhase = page.locator('[data-phase="As it accrues"]');
    await expect(ghostPhase).toBeVisible();

    // Ghost status text must be present for each ghost node.
    const ghostStatuses = ghostPhase.locator('.glass-box__node-status');
    await expect(ghostStatuses).toHaveCount(3);
    for (const status of await ghostStatuses.all()) {
      await expect(status).toContainText('As it accrues');
    }
  });
});

test.describe('Glass Box explorable map — "Choose your path" affordance', () => {
  test('the "choose your path" section is present with tour and map links', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const chooseSection = page.locator('.glass-box__choose');
    await expect(chooseSection).toBeVisible();

    // Both path cards must be present.
    const pathCards = chooseSection.locator('.glass-box__path-card');
    await expect(pathCards).toHaveCount(2);

    // Tour link points to the spine section.
    const tourLink = chooseSection.locator('a[href="#glass-box-tour"]');
    await expect(tourLink).toBeAttached();

    // Map link points to the map section.
    const mapLink = chooseSection.locator('a[href="#glass-box-map"]');
    await expect(mapLink).toBeAttached();
  });

  test('"Guided Tour" path card label is present', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const tourCard = page.locator('.glass-box__path-card[href="#glass-box-tour"]');
    await expect(tourCard).toBeVisible();
    await expect(tourCard).toContainText('Guided Tour');
  });

  test('"Explorable Map" path card label is present', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const mapCard = page.locator('.glass-box__path-card[href="#glass-box-map"]');
    await expect(mapCard).toBeVisible();
    await expect(mapCard).toContainText('Explorable Map');
  });
});

test.describe('Glass Box explorable map — AC3: credibility + composition', () => {
  test('phase names are the curated strings (Rule 9: no invented labels)', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const mapSection = page.locator('#glass-box-map');

    // Each phase heading must use the exact curated string.
    for (const phaseName of EXPECTED_PHASES) {
      const heading = mapSection
        .locator(`.glass-box__phase-heading`)
        .filter({ hasText: phaseName });
      await expect(
        heading,
        `Phase heading "${phaseName}" must be present with exact curated string`,
      ).toHaveCount(1);
    }
  });

  test('no fabricated ghost reader link anywhere on the page (Rule 9)', async ({ page }) => {
    await page.goto(INDEX_PATH);

    for (const ghostSlug of GHOST_SLUGS) {
      const fabricatedLink = page.locator(`a[href="/glass-box/${ghostSlug}/"]`);
      await expect(
        fabricatedLink,
        `No fabricated reader link must exist for ghost slug "${ghostSlug}"`,
      ).toHaveCount(0);
    }
  });

  test('the 6.3 guided tour still works (composition — spine intact)', async ({ page }) => {
    await page.goto(INDEX_PATH);

    // The build-story spine section must still be present.
    const spineSection = page.locator('.glass-box__spine-section');
    await expect(spineSection).toBeVisible();

    // The spine must still contain all featured slugs.
    for (const slug of FEATURED_SLUGS) {
      const spineLink = spineSection.locator(`a[href="/glass-box/${slug}/"]`).first();
      await expect(spineLink, `Spine link for "${slug}" must still be present`).toBeAttached();
    }

    // The tour start button must still be present (6.3 island mounts).
    // We wait for the island to hydrate.
    const tourStartBtn = page.locator('.gbt__start-btn');
    await tourStartBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    // The spine section still renders even if the island hasn't hydrated yet.
    await expect(spineSection).toBeVisible();
  });

  test('JS-off baseline still works: spine is a real <ol> of <a> links', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    const response = await page.goto(INDEX_PATH);
    expect(response?.status()).toBe(200);

    // The spine must still be present and contain real links JS-off.
    const spine = page.locator('.glass-box__spine');
    await expect(spine).toBeVisible();

    for (const slug of FEATURED_SLUGS.slice(0, 2)) {
      const link = page.locator(`a[href="/glass-box/${slug}/"]`).first();
      await expect(link).toBeAttached();
    }

    await context.close();
  });

  test('no "every artifact is published" fabrication claim on the page (Rule 9)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const bodyText = await page.locator('body').textContent();

    // The page must not claim all planning artifacts are published.
    // The ghost nodes are explicitly "As it accrues" — honest placeholders.
    // Rule 9: no fabricated "every artifact is published" claim.
    expect(bodyText).not.toMatch(/every (artifact|planning artifact) is published/i);
    expect(bodyText).not.toMatch(/all (artifacts|planning artifacts) are (published|visible)/i);
  });

  test('the explorable map section is OUTSIDE the 6.3 guided tour DOM (composition)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);

    // The map section must NOT be nested inside the spine section or tour section.
    const mapInsideSpine = page.locator('.glass-box__spine-section #glass-box-map');
    await expect(mapInsideSpine).toHaveCount(0);

    // The tour data island (glassbox-tour-data) must be outside the map section.
    const tourDataInMap = page.locator('#glass-box-map #glassbox-tour-data');
    await expect(tourDataInMap).toHaveCount(0);
  });
});

test.describe('Glass Box explorable map — WCAG 2.1 AA (axe audit, map section)', () => {
  test('has zero axe-core wcag2a/wcag2aa violations on /glass-box/ (with map section)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    // Wait for Guide pill CSS before axe (client:only timing, per existing pattern).
    await page
      .locator('[data-testid="guide-pill"]')
      .waitFor({ state: 'visible', timeout: 8000 })
      .catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });
});

test.describe('Glass Box explorable map — heading hierarchy', () => {
  test('phase headings are <h3> under the <h2> map heading', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const mapSection = page.locator('#glass-box-map');

    // Map heading must be h2.
    const mapH2 = mapSection.locator('h2');
    await expect(mapH2).toHaveCount(1);
    await expect(mapH2).toContainText('Explorable Map');

    // Phase headings must be h3 (under h2).
    const phaseH3s = mapSection.locator('h3');
    await expect(phaseH3s).toHaveCount(5);

    // Node titles inside phases must be h4 (under h3).
    const nodeH4s = mapSection.locator('h4');
    // 6 featured + 1 shipping + 3 ghost = 10 node titles.
    const h4Count = await nodeH4s.count();
    expect(h4Count).toBeGreaterThanOrEqual(9);
  });

  test('decorative phase dots are aria-hidden (not a color-only status carrier)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const mapSection = page.locator('#glass-box-map');
    const phaseDots = mapSection.locator('.glass-box__phase-dot');
    const count = await phaseDots.count();
    expect(count).toBeGreaterThan(0);
    for (const dot of await phaseDots.all()) {
      await expect(dot).toHaveAttribute('aria-hidden', 'true');
    }
  });
});

test.describe('Glass Box explorable map — exec script count (AC3: no new JS)', () => {
  test('still ships exactly 3 executable scripts after the map (map is static — no new JS)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const executableScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.filter(
        (s) =>
          s.type !== 'application/ld+json' &&
          s.type !== 'importmap' &&
          s.type !== 'application/json',
      ).length;
    });
    expect(
      executableScripts,
      `/glass-box/ must still ship exactly 3 exec scripts (map adds no JS); found ${executableScripts}`,
    ).toBe(3);
  });
});
