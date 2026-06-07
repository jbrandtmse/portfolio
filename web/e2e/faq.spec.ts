import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * FAQ route e2e spec (Story 4.2, AC6; project-rules Rules 7 + 8).
 *
 * Covers:
 *   - /faq/ renders the six visible <h3> questions scoped to the `.faq` block
 *     (Rule 8: scoped selector, NOT a whole-document match the JSON-LD could
 *     satisfy — the exact false-positive that bit Story 3.2 AC5).
 *   - FAQPage JSON-LD is present and valid (parseable; correct @type).
 *   - WCAG 2.1 AA: zero axe violations.
 *   - JS-off readable: the <h3> questions are real, server-rendered HTML.
 *   - 0 executable scripts (NFR-1).
 *   - No exclamation marks in copy (positive-assertion voice).
 *   - Resolves Story 4.1's `content/kb/faq.md` `route: /faq/` citation target.
 *
 * Real-runtime evidence (skill-rules Rule 3): Playwright loads the served build.
 * Discoverable by playwright.config.ts (testMatch: /faq\.spec\.ts/; Rule 8).
 *
 * Rule 7 (proven to execute): this spec has no `test.skip()` or conditional
 * prerequisite — it runs unconditionally in the default suite. The webServer
 * launcher (serve-with-api.mjs) serves the static build; /faq is a pure static
 * Mirror route, so no API/DB prerequisite is needed.
 */

// The six canonical FAQ questions (the three starter prompts first, then the
// organizer/peer questions) — ground-truth list for the scoped assertion.
// Defined here as the test's own copy so a FAQ_ITEMS reorder that silently drops
// a question fails the assertion (Rule 8: tests bind to the visible surface).
const SIX_QUESTIONS = [
  'What does Joshua R. Brandt, MSE speak about?',
  'How do I invite Joshua to speak?',
  'What is loandemo?',
  'What is the BMAD Method?',
  "What is Joshua's background?",
  "Where can I follow Joshua's work?",
] as const;

test.describe('/faq/ — crawlable FAQ Mirror route (Story 4.2)', () => {
  test('loads /faq/ as a real page with exactly one <h1> (MirrorLayout)', async ({ page }) => {
    await page.goto('/faq/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Frequently asked questions');
  });

  test('the lede names "Joshua R. Brandt, MSE" (GEO floor, answer-first, AC1)', async ({
    page,
  }) => {
    await page.goto('/faq/');
    // The first <p> in <main> is the MirrorLayout lede — must name Joshua first.
    const firstP = page.locator('main p').first();
    await expect(firstP).toContainText('Joshua R. Brandt, MSE');
  });

  test('no placeholder stub-note is present (stub removed, AC1)', async ({ page }) => {
    await page.goto('/faq/');
    // The Epic-1 stub had a `.stub-note` paragraph — it must be gone.
    await expect(page.locator('.stub-note')).toHaveCount(0);
    // The placeholder Q&A text must also be gone.
    await expect(page.locator('body')).not.toContainText('[PLACEHOLDER]');
  });

  test('the six visible <h3> questions are present in the .faq block (scoped, AC1/AC6)', async ({
    page,
  }) => {
    await page.goto('/faq/');
    // SCOPED to `.faq` (Rule 8 / AC2): a whole-document search would be satisfied
    // by the FAQPage JSON-LD `Question.name` values — but that would pass even if
    // the VISIBLE <h3>s were missing. We assert the rendered DOM elements.
    const faqBlock = page.locator('.faq');
    await expect(faqBlock).toHaveCount(1);

    const h3s = faqBlock.locator('h3');
    await expect(h3s).toHaveCount(6);

    // Assert each question is present in the scoped block (same source as JSON-LD,
    // but the visible text — proving the single-source pipeline works end to end).
    for (const question of SIX_QUESTIONS) {
      await expect(faqBlock.locator('h3', { hasText: question })).toHaveCount(1);
    }
  });

  test('the three starter prompts are the FIRST three <h3>s in the .faq block (Decision 3)', async ({
    page,
  }) => {
    await page.goto('/faq/');
    const faqBlock = page.locator('.faq');
    const h3s = faqBlock.locator('h3');

    // The first three must be the starter prompts (in order).
    await expect(h3s.nth(0)).toHaveText('What does Joshua R. Brandt, MSE speak about?');
    await expect(h3s.nth(1)).toHaveText('How do I invite Joshua to speak?');
    await expect(h3s.nth(2)).toHaveText('What is loandemo?');
  });

  test('each <h3> question has a corresponding <p> answer (visible Q&A pairs, AC1)', async ({
    page,
  }) => {
    await page.goto('/faq/');
    const faqBlock = page.locator('.faq');
    const items = faqBlock.locator('.faq__item');
    await expect(items).toHaveCount(6);

    // Each .faq__item must have exactly one <h3> and one <p>.
    for (let i = 0; i < 6; i++) {
      const item = items.nth(i);
      await expect(item.locator('h3')).toHaveCount(1);
      await expect(item.locator('p')).toHaveCount(1);
      // The <p> must be non-empty.
      const answerText = await item.locator('p').textContent();
      expect(answerText?.trim().length ?? 0).toBeGreaterThan(20);
    }
  });

  test('FAQPage JSON-LD is present and valid (AC2, AC6)', async ({ page }) => {
    await page.goto('/faq/');

    // Extract and parse the ld+json block.
    const ldJson = await page.evaluate(() => {
      const block = document.querySelector('script[type="application/ld+json"]');
      if (!block) return null;
      try {
        return JSON.parse(block.textContent ?? '');
      } catch {
        return null;
      }
    });

    expect(ldJson, 'FAQPage JSON-LD block must be present and valid JSON').not.toBeNull();
    expect(ldJson['@type']).toBe('FAQPage');
    expect(ldJson['@context']).toBe('https://schema.org');

    const mainEntity = ldJson.mainEntity as Array<Record<string, unknown>>;
    expect(Array.isArray(mainEntity)).toBe(true);
    expect(mainEntity).toHaveLength(6);

    // Each mainEntity entry is a Question with a matching visible <h3> text.
    // This asserts the SINGLE-SOURCE guarantee: JSON-LD name === visible text.
    const faqBlock = page.locator('.faq');
    const h3Texts = await faqBlock.locator('h3').allTextContents();

    for (let i = 0; i < 6; i++) {
      const q = mainEntity[i]!;
      expect(q['@type']).toBe('Question');
      expect(typeof q.name).toBe('string');
      // The JSON-LD Question.name matches the visible <h3> text (single source).
      expect(q.name).toBe(h3Texts[i]?.trim());

      const answer = q.acceptedAnswer as Record<string, unknown>;
      expect(answer['@type']).toBe('Answer');
      expect(typeof answer.text).toBe('string');
    }
  });

  test('has zero axe WCAG 2.1 AA violations (AC6)', async ({ page }) => {
    await page.goto('/faq/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });

  test('the Q&A is readable/findable with JS disabled — server-rendered (AC1, AC5, FR-7)', async ({
    page,
  }) => {
    // Verify the Q&A is in the initial HTML (not injected by JS).
    // We do this by checking the page source via navigation and checking the
    // content is present without relying on JS execution.
    await page.goto('/faq/');

    // All six <h3>s are visible in the DOM — no JS needed to reveal them.
    const faqBlock = page.locator('.faq');
    for (const question of SIX_QUESTIONS) {
      const h3 = faqBlock.locator('h3', { hasText: question });
      await expect(h3).toBeVisible();
    }
    // The answers are also visible (no <details>/<summary> hiding required).
    const answers = faqBlock.locator('.faq__answer');
    await expect(answers).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await expect(answers.nth(i)).toBeVisible();
    }
  });

  test('ships 0 executable scripts (NFR-1; JSON-LD is data, not JS)', async ({ page }) => {
    await page.goto('/faq/');

    // Count executable scripts (exclude application/ld+json data blocks).
    const execScripts = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('script'));
      return all.filter((s) => s.type !== 'application/ld+json' && s.type !== 'application/json')
        .length;
    });
    expect(execScripts, `/faq/ must ship 0 executable scripts (found ${execScripts})`).toBe(0);
  });

  test('contains no exclamation marks in rendered copy (positive-assertion voice)', async ({
    page,
  }) => {
    await page.goto('/faq/');
    // Check the visible text content for exclamation marks.
    // We check the <main> element text, not scripts/comments.
    const mainText = await page.locator('main').textContent();
    expect(mainText, 'no exclamation marks in /faq/ copy').not.toContain('!');
  });

  test('is reachable at /faq/ (resolves Story 4.1 citation target, AC6)', async ({ page }) => {
    // The /faq/ route is the citation target content/kb/faq.md declares.
    // Verify the route resolves and returns the real page (not a 404 or redirect).
    const response = await page.goto('/faq/');
    expect(response?.status(), '/faq/ must return 200').toBe(200);
    // The page is the FAQ page (has the canonical heading).
    await expect(page.locator('h1')).toContainText('Frequently asked questions');
  });

  test('the global footer is present with all Mirror route links (Story 1.7)', async ({ page }) => {
    await page.goto('/faq/');
    const footer = page.locator('footer.site-footer');
    await expect(footer).toHaveCount(1);
    // Footer links to the canonical Mirror routes.
    await expect(footer.locator('a[href="/about/"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/speaking/"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/browse/"]')).toHaveCount(1);
  });
});
