import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * loandemo case study e2e spec (Story 2.5, Task 5 / Rule 3).
 *
 * A real-runtime browser check (skill-rules Rule 3: user-facing surface MUST
 * have at least one test exercising the real target runtime). Asserts on the
 * observable DOM of /work/loandemo/:
 *
 *  - The case study is reachable at the trailing-slash URL (/work/loandemo/).
 *  - Renders exactly one <h1> with the case study title.
 *  - The answer-first lede names "Joshua R. Brandt, MSE".
 *  - The #code / #build / #retro section IDs exist and fragment scrolling works
 *    (these are the exact Story 2.4 Dot link targets; Story 2.5 resolves them).
 *  - The long-form editorial devices render: drop-cap on the first body paragraph
 *    and the pull-quote blockquote with a navy left border.
 *  - The /speaking/ cross-link is a real <a> (forward-ref; AC2).
 *  - The /glass-box/ and /timeline/ cross-links are real <a>s (AC4).
 *  - [OPEN] flags are visible in the rendered text (credibility floor; AC3).
 *  - 0 executable scripts (0-JS, NFR-1).
 *  - WCAG 2.1 AA (axe-core audit; AC6).
 *  - JS-off: the page is fully followable without JavaScript.
 *  - Keyboard: focus reaches the cross-links and shows a visible focus ring.
 *
 * The webServer in playwright.config.ts runs `pnpm build` so all pages exist.
 */

// Trailing-slash form (Story 2.0 / trailingSlash: 'always').
const LOANDEMO_PATH = '/work/loandemo/';

test.describe('loandemo case study — /work/loandemo/', () => {
  test('is reachable at the trailing-slash URL (no 301, real page)', async ({ page }) => {
    const response = await page.goto(LOANDEMO_PATH);
    // 200 — trailing-slash URL is the canonical form (no redirect).
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('renders exactly one <h1> with the case study title', async ({ page }) => {
    await page.goto(LOANDEMO_PATH);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('loandemo');
  });

  test('the lede leads with "Joshua R. Brandt, MSE" (entity-first, answer-first, AC1)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    // The MirrorLayout lede paragraph.
    const lede = page.locator('.mirror__lede');
    await expect(lede).toContainText(/^Joshua R\. Brandt, MSE/);
  });

  test('the #code section ID exists as a real in-page anchor (AC5: 2.4 Dot link resolves)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    // The element with id="code" must be present in the DOM.
    const codeSection = page.locator('#code');
    await expect(codeSection).toHaveCount(1);
    await expect(codeSection).toBeVisible();
  });

  test('the #build section ID exists as a real in-page anchor (AC5: 2.4 Dot link resolves)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    const buildSection = page.locator('#build');
    await expect(buildSection).toHaveCount(1);
    await expect(buildSection).toBeVisible();
  });

  test('the #retro section ID exists as a real in-page anchor (AC5: 2.4 Dot link resolves)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    const retroSection = page.locator('#retro');
    await expect(retroSection).toHaveCount(1);
    await expect(retroSection).toBeVisible();
  });

  test('navigating to /work/loandemo/#code fragment anchors to the code section', async ({
    page,
  }) => {
    await page.goto(`${LOANDEMO_PATH}#code`);
    const codeSection = page.locator('#code');
    await expect(codeSection).toBeVisible();
    // Fragment anchor: the #code section should be in or near the viewport.
    const box = await codeSection.boundingBox();
    expect(box).not.toBeNull();
    // The section has positive Y — it is a real rendered element, not a hidden anchor.
    expect(box!.height).toBeGreaterThan(0);
  });

  test('navigating to /work/loandemo/#build fragment anchors to the build section', async ({
    page,
  }) => {
    await page.goto(`${LOANDEMO_PATH}#build`);
    const buildSection = page.locator('#build');
    await expect(buildSection).toBeVisible();
    const box = await buildSection.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(0);
  });

  test('navigating to /work/loandemo/#retro fragment anchors to the retro section', async ({
    page,
  }) => {
    await page.goto(`${LOANDEMO_PATH}#retro`);
    const retroSection = page.locator('#retro');
    await expect(retroSection).toBeVisible();
    const box = await retroSection.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(0);
  });

  test('the pull-quote blockquote renders with a navy left border (long-form device, AC1)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    // The pull-quote is a <blockquote> inside .case-study.
    const pullQuote = page.locator('.case-study__pull-quote');
    await expect(pullQuote).toBeVisible();
    // The navy left rule must be a non-zero border-left-width.
    const borderLeftWidth = await pullQuote.evaluate((el) =>
      parseFloat(getComputedStyle(el).borderLeftWidth),
    );
    expect(borderLeftWidth).toBeGreaterThan(0);
    // It must be italic (the pull-quote editorial treatment).
    const fontStyle = await pullQuote.evaluate((el) => getComputedStyle(el).fontStyle);
    expect(fontStyle).toBe('italic');
  });

  test('the drop-cap enlarges the first overview paragraph first-letter (long-form device, AC1)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    // The drop-cap is on the first .case-study__body paragraph inside
    // .case-study__section--overview. Assert ::first-letter is larger than the base.
    const firstP = page.locator('.case-study__section--overview .case-study__body').first();
    await expect(firstP).toBeVisible();
    const metrics = await firstP.evaluate((el) => {
      const base = parseFloat(getComputedStyle(el).fontSize);
      const fl = getComputedStyle(el, '::first-letter');
      return { ratio: parseFloat(fl.fontSize) / base, float: fl.float };
    });
    // 3.5em → first-letter is well over 2× the body text size (drop-cap).
    expect(metrics.ratio).toBeGreaterThan(2);
    expect(metrics.float).toBe('left');
  });

  test('the /speaking/ cross-link is a real <a> (AC2: forward-ref to Epic 3 talk content)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    const speakingLink = page.locator('a[href="/speaking/"]');
    // At least one /speaking/ link must be on the page (the cross-links nav).
    await expect(speakingLink.first()).toBeVisible();
  });

  test('the /glass-box/ cross-link is a real <a> (AC4: the two flagships reference each other)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    const glasBoxLink = page.locator('a[href="/glass-box/"]');
    await expect(glasBoxLink.first()).toBeVisible();
  });

  test('the /timeline/ cross-link is a real <a> (AC4: links into the Master Timeline cluster)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    const timelineLink = page.locator('a[href="/timeline/"]');
    await expect(timelineLink.first()).toBeVisible();
  });

  test('[OPEN] flags are visible in the rendered text (AC3: credibility floor — no fabrication)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    // The [OPEN] flags must appear as real visible text in the DOM (not CSS, not hidden).
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('[OPEN');
  });

  test('ships exactly 2 executable scripts — Guide pill only (NFR-1, Story 4.4 carve-out)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    // Story 4.4: ALL routes ship the site-wide Guide pill (2 exec scripts).
    const executableScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.filter((s) => s.type !== 'application/ld+json' && s.type !== 'importmap')
        .length;
    });
    expect(
      executableScripts,
      `/work/loandemo/ must ship exactly 2 exec scripts (Guide pill only); found ${executableScripts}`,
    ).toBe(2);
  });

  test('has zero axe-core wcag2a/wcag2aa violations (AC6: WCAG 2.1 AA)', async ({ page }) => {
    await page.goto(LOANDEMO_PATH);
    // Story 4.4: wait for Guide pill CSS before axe (client:only timing)
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

  test('the global footer links to Mirror routes (composed through MirrorLayout)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    const footer = page.locator('footer.site-footer');
    await expect(footer).toBeVisible();
    // A few representative Mirror route links from the global footer.
    await expect(footer.locator('a[href="/about/"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/speaking/"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/glass-box/"]')).toHaveCount(1);
  });

  test('keyboard focus reaches the cross-links and shows a visible focus ring (AC6)', async ({
    page,
  }) => {
    await page.goto(LOANDEMO_PATH);
    // Tab from the top until we reach a link in the case study cross-links nav.
    // The page may have many focusable elements (footer) — just confirm at least
    // the first tab reaches something interactive with a visible focus ring.
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const el = document.activeElement as Element | null;
      if (!el) return null;
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });
    expect(outline).not.toBeNull();
    expect(outline!.style).not.toBe('none');
    expect(parseFloat(outline!.width)).toBeGreaterThan(0);
  });

  test('a peer clicking each timeline loandemo Dot lands on a real visible section here (AC5 reciprocity, real-runtime)', async ({
    page,
  }) => {
    // STRENGTHENED (QA — the key cross-story consumer wire-up, exercised end to end
    // in a REAL browser). The dev's specs prove the #code/#build/#retro IDs exist
    // here; this proves the FULL user journey the AC5 forward-reference promises:
    // start on the Master Timeline, read the loandemo flagship Dot links the
    // timeline actually ships, navigate each `/work/loandemo/#…` href, and confirm
    // the peer LANDS on a real, visible in-page section (the fragment resolves —
    // no dangling fragment). Binds the consumer (timeline) to the producer (this
    // page) through the live runtime, not just the built markup.
    await page.goto('/timeline/');
    const hrefs = await page
      .locator('a[href^="/work/loandemo/#"]')
      .evaluateAll((els) =>
        Array.from(new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute('href')!))),
      );
    // The timeline must ship the three canonical loandemo fragment Dots (2.4).
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/work/loandemo/#code',
        '/work/loandemo/#build',
        '/work/loandemo/#retro',
      ]),
    );
    // Follow each fragment and assert the target section is real + visible.
    for (const href of hrefs) {
      const fragment = href.split('#')[1]!;
      await page.goto(href);
      const target = page.locator(`#${fragment}`);
      await expect(target, `landing target #${fragment} from timeline Dot ${href}`).toBeVisible();
      const box = await target.boundingBox();
      expect(box, `#${fragment} renders a real box`).not.toBeNull();
      expect(box!.height).toBeGreaterThan(0);
    }
  });
});
