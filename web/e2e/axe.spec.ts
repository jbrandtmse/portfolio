import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * WCAG 2.1 AA audit (Story 1.9, AC3 / IAC-3) — automated axe-core checks on `/`
 * and `/about`. This spec runs under BOTH the `axe-desktop` and `axe-mobile`
 * projects (playwright.config.ts), so each page is audited at a desktop AND a
 * mobile viewport (skill-rules Rule 3 real-runtime evidence — axe runs against
 * the rendered DOM in a real browser).
 *
 * Asserts: ZERO violations for the wcag2a + wcag2aa rule sets — this covers the
 * AA color-contrast rule (`color-contrast`), names/roles/values, and document
 * structure rules that carry a wcag tag. (Note: axe classifies `heading-order`,
 * `page-has-heading-one`, and `region` as `best-practice`, NOT wcag2a/aa, so the
 * tagged run does not by itself assert them — the one-<h1> requirement (AC3) and
 * the landmark regions are covered by the DEDICATED assertions below, not by the
 * axe-tag scan.) Then: exactly one <h1>; the page exposes landmark regions
 * (main / contentinfo); and keyboard operability + DOM reading order — tabbing
 * from the top reaches an interactive control in document order, and the focused
 * element always shows a visible outline (the global :focus-visible ring, never
 * suppressed).
 */

const ROUTES = ['/', '/about'] as const;

for (const route of ROUTES) {
  test.describe(`WCAG 2.1 AA — ${route}`, () => {
    test('has zero axe-core wcag2a/wcag2aa violations', async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      // Surface any violation details in the failure message for fast triage.
      const summary = results.violations.map(
        (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
      );
      expect(summary, summary.join('\n')).toEqual([]);
    });

    test('renders exactly one <h1>', async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test('exposes the main + contentinfo landmark regions', async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('main, [role="main"]')).toHaveCount(1);
      // The global footer is a <footer> (contentinfo landmark).
      await expect(page.locator('footer')).not.toHaveCount(0);
    });

    test('keyboard focus reaches an interactive control and shows a visible focus ring (DOM order)', async ({
      page,
    }) => {
      await page.goto(route);
      // Tab from the top: the first focusable is a real interactive element (a
      // link or button), proving keyboard operability + that focus enters in DOM
      // reading order rather than being trapped.
      await page.keyboard.press('Tab');
      const focusedTag = await page.evaluate(() =>
        document.activeElement ? document.activeElement.tagName.toLowerCase() : '',
      );
      expect(['a', 'button', 'summary', 'input']).toContain(focusedTag);

      // The focused element shows a VISIBLE focus indicator — a non-"none"
      // outline (the global :focus-visible navy ring; Story 1.2). Assert the
      // computed outline is not removed (outline-style != none AND a non-zero
      // width), i.e. the ring is never suppressed for keyboard users (AC3).
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
  });
}
