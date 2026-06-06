import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Glass Box artifact reader e2e spec (Story 2.2, Task 5 / Rule 3).
 *
 * A real-runtime browser check (skill-rules Rule 3: user-facing surface MUST
 * have at least one test exercising the real target runtime). Asserts on the
 * observable DOM of a reader page:
 *
 *  - The reader page is reachable at the trailing-slash URL (/glass-box/{slug}/).
 *  - Renders one <h1> with the artifact title.
 *  - The answer-first lede names "Joshua R. Brandt, MSE".
 *  - The type chip is present and styled.
 *  - The artifact body is rendered (real long-form prose visible).
 *  - Drop-cap is applied (::first-letter float — detectable via computed style).
 *  - A pull-quote/blockquote exists in the body and is styled.
 *  - The global footer links back to all Mirror routes.
 *  - WCAG 2.1 AA on at least one reader page (axe-core audit).
 *  - 0 executable scripts (JS-off friendliness).
 *
 * The webServer in playwright.config.ts runs `pnpm build` (which runs the
 * render-glassbox generator first) so the reader pages are present at runtime.
 *
 * Use the `product-brief` artifact for most checks — it is a known seeded
 * artifact with a stable curator note and body text.
 */

// Trailing-slash form (Story 2.0 / Rule 2; trailingSlash: 'always').
const READER_SLUG = 'product-brief';
const READER_PATH = `/glass-box/${READER_SLUG}/`;

// Other seeded slugs to spot-check reachability.
const ALL_SLUGS = [
  'brainstorm',
  'pre-brief-research',
  'product-brief',
  'prd',
  'ux-design',
  'ux-experience',
] as const;

test.describe('Glass Box reader — /glass-box/product-brief/', () => {
  test('is reachable at the trailing-slash URL (no 301, real page)', async ({ page }) => {
    const response = await page.goto(READER_PATH);
    // A 200 response (not a redirect; the trailing-slash URL is the canonical form).
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('renders exactly one <h1> with the artifact title', async ({ page }) => {
    await page.goto(READER_PATH);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    // The title for the product-brief artifact.
    await expect(h1).toContainText('Product Brief');
  });

  test('the lede leads with "Joshua R. Brandt, MSE" (entity-first, answer-first)', async ({
    page,
  }) => {
    await page.goto(READER_PATH);
    // The MirrorLayout lede paragraph.
    const lede = page.locator('.mirror__lede');
    await expect(lede).toContainText(/^Joshua R\. Brandt, MSE/);
  });

  test('the type chip is visible and contains the artifact type', async ({ page }) => {
    await page.goto(READER_PATH);
    const chip = page.locator('.artifact-reader__chip');
    await expect(chip).toBeVisible();
    // The type for product-brief is "brief".
    await expect(chip).toContainText('brief');
  });

  test('the type chip renders small-caps with an accent outline (AC2, computed style)', async ({
    page,
  }) => {
    await page.goto(READER_PATH);
    const chip = page.locator('.artifact-reader__chip');
    await expect(chip).toBeVisible();
    const style = await chip.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        fontVariant: `${cs.fontVariantCaps} ${cs.fontVariant}`,
        borderLeftWidth: parseFloat(cs.borderLeftWidth),
        borderStyle: cs.borderTopStyle,
      };
    });
    // Small-caps is the reserved chip treatment (AC2).
    expect(style.fontVariant).toContain('small-caps');
    // The accent outline is a real, non-zero solid border.
    expect(style.borderLeftWidth).toBeGreaterThan(0);
    expect(style.borderStyle).toBe('solid');
  });

  test('the drop-cap enlarges the first body paragraph first-letter (~3.5em, float left)', async ({
    page,
  }) => {
    await page.goto(READER_PATH);
    // AC2 drop-cap: a CSS ::first-letter on the FIRST body paragraph, float left,
    // ~3.5em. Measure the ::first-letter computed font-size vs the paragraph's own
    // font-size — the ratio must be clearly larger than 1 (a real drop-cap), and
    // the pseudo-element must float left.
    const firstP = page.locator('.artifact-body > p').first();
    await expect(firstP).toBeVisible();
    const metrics = await firstP.evaluate((el) => {
      const base = parseFloat(getComputedStyle(el).fontSize);
      const fl = getComputedStyle(el, '::first-letter');
      return { ratio: parseFloat(fl.fontSize) / base, float: fl.float };
    });
    // 3.5em → the first-letter is well over 2× the body text (allow rendering slack).
    expect(metrics.ratio).toBeGreaterThan(2);
    expect(metrics.float).toBe('left');
  });

  test('the body headings are demoted — NO <h1> inside .artifact-body (AC3, live DOM)', async ({
    page,
  }) => {
    await page.goto(READER_PATH);
    // The single page <h1> is the MirrorLayout title, OUTSIDE .artifact-body. The
    // rendered markdown body must contain zero <h1> (its `#` headings demoted to
    // <h2>+). This is the highest-risk regression, asserted here in the live DOM.
    await expect(page.locator('.artifact-body h1')).toHaveCount(0);
    // And the body DOES carry demoted headings (≥ one <h2>).
    expect(await page.locator('.artifact-body h2').count()).toBeGreaterThan(0);
  });

  test('the curator note is visible and non-empty', async ({ page }) => {
    await page.goto(READER_PATH);
    const curatorNote = page.locator('.artifact-reader__curator-note');
    await expect(curatorNote).toBeVisible();
    const text = await curatorNote.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('the artifact body is rendered with readable prose', async ({ page }) => {
    await page.goto(READER_PATH);
    const body = page.locator('.artifact-body');
    await expect(body).toBeVisible();
    // The body has real prose (not an empty div).
    const text = await body.textContent();
    expect(text?.trim().length).toBeGreaterThan(100);
  });

  test('the artifact body contains real artifact prose (Integration AC5)', async ({ page }) => {
    await page.goto(READER_PATH);
    // Known substring from the real product-brief artifact body
    // (verified against built HTML: the brief says the site's job is to be
    // "a craft artifact remarkable enough that practitioners share it").
    await expect(page.locator('.artifact-body')).toContainText('craft artifact remarkable');
  });

  test('the global footer links to Mirror routes (composed through MirrorLayout)', async ({
    page,
  }) => {
    await page.goto(READER_PATH);
    const footer = page.locator('footer.site-footer');
    await expect(footer).toBeVisible();
    // A few representative Mirror route links from the footer.
    await expect(footer.locator('a[href="/about/"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/glass-box/"]')).toHaveCount(1);
  });

  test('ships 0 executable scripts (0-JS, NFR-1)', async ({ page }) => {
    await page.goto(READER_PATH);
    // Count executable <script> tags (exclude ld+json data blocks).
    const executableScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.filter((s) => s.type !== 'application/ld+json' && s.type !== 'importmap')
        .length;
    });
    expect(executableScripts).toBe(0);
  });

  test('the body has a blockquote (pull-quote candidate) styled with a left border', async ({
    page,
  }) => {
    await page.goto(READER_PATH);
    // The artifact body contains at least one blockquote styled as a pull-quote.
    // If the artifact body has no blockquotes, skip gracefully. (product-brief has
    // none today — the NON-conditional pull-quote proof lives in the ux-experience
    // test below so AC2's pull-quote device is always actually exercised.)
    const blockquotes = page.locator('.artifact-body blockquote');
    const count = await blockquotes.count();
    if (count > 0) {
      const bq = blockquotes.first();
      await expect(bq).toBeVisible();
      // border-left-width should be non-zero (the navy left rule is applied).
      const borderLeftWidth = await bq.evaluate((el) =>
        parseFloat(getComputedStyle(el).borderLeftWidth),
      );
      expect(borderLeftWidth).toBeGreaterThan(0);
    }
  });
});

test.describe('Glass Box reader — pull-quote device (ux-experience has real blockquotes)', () => {
  // STRENGTHENED (QA): the product-brief pull-quote test above is CONDITIONAL and
  // vacuously passes (product-brief renders no blockquote). Exercise the AC2
  // pull-quote device unconditionally on /glass-box/ux-experience/, whose body
  // renders multiple blockquotes — asserting the reserved navy left rule + italic.
  test('renders blockquotes as pull-quotes (navy left rule + italic, computed style)', async ({
    page,
  }) => {
    await page.goto('/glass-box/ux-experience/');
    const bq = page.locator('.artifact-body blockquote').first();
    await expect(bq).toBeVisible();
    const style = await bq.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        borderLeftWidth: parseFloat(cs.borderLeftWidth),
        borderLeftStyle: cs.borderLeftStyle,
        fontStyle: cs.fontStyle,
      };
    });
    // 2–3px navy left rule (AC2): a real, solid, non-zero left border.
    expect(style.borderLeftWidth).toBeGreaterThanOrEqual(2);
    expect(style.borderLeftStyle).toBe('solid');
    // Pull-quotes are italic (AC2).
    expect(style.fontStyle).toBe('italic');
  });
});

test.describe('Glass Box reader — all seeded artifacts are reachable', () => {
  for (const slug of ALL_SLUGS) {
    test(`/glass-box/${slug}/ loads and has one <h1>`, async ({ page }) => {
      await page.goto(`/glass-box/${slug}/`);
      await expect(page.locator('h1')).toHaveCount(1);
      // The reader body is present.
      await expect(page.locator('.artifact-body')).toBeVisible();
    });
  }
});

test.describe('Glass Box reader — WCAG 2.1 AA (axe audit on product-brief)', () => {
  test('has zero axe-core wcag2a/wcag2aa violations on /glass-box/product-brief/', async ({
    page,
  }) => {
    await page.goto(READER_PATH);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });
});

test.describe('Glass Box reader — URL form (trailing-slash, no 301)', () => {
  test('trailing-slash /glass-box/product-brief/ serves without a redirect hop', async ({
    page,
  }) => {
    // Navigate to the trailing-slash canonical URL; should be a direct 200.
    const response = await page.goto(READER_PATH);
    expect(response?.status()).toBe(200);
    // Current URL stays at the trailing-slash form (no redirect observed).
    expect(page.url()).toContain(READER_PATH);
  });
});
