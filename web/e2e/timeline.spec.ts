import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Master Timeline e2e spec (Story 2.4, Task 5 / Rule 3).
 *
 * A real-runtime browser check (skill-rules Rule 3: user-facing surface MUST
 * have at least one test exercising the real target runtime). Asserts on the
 * observable DOM of the /timeline/ page:
 *
 *  - The timeline is reachable at the trailing-slash URL (/timeline/).
 *  - Renders exactly one <h1> with "The Master Timeline".
 *  - The answer-first lede names "Joshua R. Brandt, MSE".
 *  - Era-bands (runway + agentic turn) are present and labeled.
 *  - The two flagship nodes render (portfolio + loandemo).
 *  - Portfolio Dots link to real /glass-box/{slug}/ readers (no 404).
 *  - Loandemo Dots link to /work/loandemo/#… (forward-ref; route exists).
 *  - The cross-link to /glass-box/ is present (recursion boundary).
 *  - 0 executable scripts (0-JS, NFR-1).
 *  - JS-off: the spine is a followable <ol> of dated, labeled, linked items.
 *  - DOM reading order (oldest → newest) is IDENTICAL at desktop and mobile
 *    viewports — orientation is CSS-only, not DOM reordering (AC3 critical).
 *  - WCAG 2.1 AA on the timeline (axe-core audit).
 *
 * The webServer in playwright.config.ts runs `pnpm build` so all pages exist.
 */

const TIMELINE_PATH = '/timeline/';

// Portfolio flagship Dot slugs — all should be reachable as links from /timeline/.
const PORTFOLIO_SLUGS = [
  'brainstorm',
  'pre-brief-research',
  'product-brief',
  'prd',
  'ux-design',
  'ux-experience',
] as const;

test.describe('Master Timeline — /timeline/', () => {
  test('is reachable at the trailing-slash URL (no 301, real page)', async ({ page }) => {
    const response = await page.goto(TIMELINE_PATH);
    // 200 response — the trailing-slash URL is the canonical form.
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('renders exactly one <h1> with "The Master Timeline"', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('The Master Timeline');
  });

  test('the lede leads with "Joshua R. Brandt, MSE" (entity-first, answer-first)', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);
    const lede = page.locator('.mirror__lede');
    await expect(lede).toContainText(/^Joshua R\. Brandt, MSE/);
  });

  test('ships 0 executable scripts (0-JS, NFR-1)', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    const executableScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.filter((s) => s.type !== 'application/ld+json' && s.type !== 'importmap')
        .length;
    });
    expect(executableScripts).toBe(0);
  });
});

test.describe('Master Timeline — era-bands (AC2)', () => {
  test('renders the "The Runway" era-band label', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    await expect(page.locator('body')).toContainText('The Runway');
  });

  test('renders the "The Agentic Turn" era-band label', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    await expect(page.locator('body')).toContainText('The Agentic Turn');
  });

  test('era regions carry aria-label attributes (AC6)', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    // Each era <li> carries aria-label="Era: <name>"
    const runwayEra = page.locator('[aria-label="Era: The Runway"]');
    const agenticEra = page.locator('[aria-label="Era: The Agentic Turn"]');
    await expect(runwayEra).toHaveCount(1);
    await expect(agenticEra).toHaveCount(1);
  });
});

test.describe('Master Timeline — flagship nodes (AC2)', () => {
  test('renders the portfolio flagship node', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    await expect(page.locator('body')).toContainText('This portfolio');
  });

  test('renders the loandemo flagship node', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    await expect(page.locator('body')).toContainText('loandemo');
  });

  test('milestone dots are present (flagship markers)', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    const milestoneDots = page.locator('.timeline-dot--milestone');
    await expect(milestoneDots.first()).toBeVisible();
  });

  test('faint dots are present (runway ticks)', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    const faintDots = page.locator('.timeline-dot--faint');
    await expect(faintDots.first()).toBeVisible();
  });
});

test.describe('Master Timeline — portfolio Dot links (AC5)', () => {
  test('each portfolio Dot links to a real /glass-box/{slug}/ (no 404)', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    for (const slug of PORTFOLIO_SLUGS) {
      const link = page.locator(`a[href="/glass-box/${slug}/"]`).first();
      await expect(link, `Reader link missing for ${slug}`).toBeAttached();
      // Navigate to the reader to confirm no 404.
      const response = await page.goto(`/glass-box/${slug}/`);
      expect(response?.status(), `404 on /glass-box/${slug}/`).toBe(200);
      await page.goto(TIMELINE_PATH);
    }
  });

  test('loandemo Dots link to /work/loandemo/#… (forward-ref route exists)', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    // The link is present with the fragment — the route exists even if fragments
    // don't resolve until Story 2.5.
    const codeLink = page.locator('a[href="/work/loandemo/#code"]');
    await expect(codeLink).toBeAttached();
  });

  test('the cross-link to /glass-box/ is present (recursion boundary)', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    const gbLink = page.locator('a[href="/glass-box/"]').first();
    await expect(gbLink).toBeAttached();
  });
});

test.describe('Master Timeline — dots are decorative, status lives in text (WCAG 1.4.1)', () => {
  test('every timeline dot is aria-hidden (not a color-only status carrier)', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    const dots = page.locator('.timeline-dot');
    const count = await dots.count();
    expect(count).toBeGreaterThan(0);
    for (const dot of await dots.all()) {
      await expect(dot).toHaveAttribute('aria-hidden', 'true');
    }
  });
});

/**
 * AC3 — Meaningful sequence: visual order === DOM order === reading order, at
 * BOTH widths, and orientation is presentation-only (CSS reflow, not DOM order).
 *
 * This is the highest-risk a11y-correctness item the story calls out. The
 * earlier "compare DOM labels desktop-vs-mobile" check is necessary but NOT
 * sufficient on its own: `document.querySelectorAll` ALWAYS returns nodes in DOM
 * source order regardless of CSS, so comparing DOM order to itself at two
 * viewports is tautologically true — it would still pass if someone added
 * `flex-direction: row-reverse`, `order:`, or `direction: rtl` that visually
 * reverses the spine while leaving the DOM untouched (a WCAG 1.3.2 / 2.4.3
 * meaningful-sequence violation that screen-reader + keyboard users would hit).
 *
 * The authoritative test below measures the ACTUAL on-screen geometry
 * (getBoundingClientRect) of every flex container that lays out timeline items
 * and asserts the VISUAL order of its children matches their DOM order. If
 * anyone reorders via CSS in ANY of those containers (the spine, an era's entry
 * list, or a flagship cluster), the visual sort diverges from DOM order and this
 * test FAILS — exactly the mutation the story demands be caught.
 */
test.describe('Master Timeline — AC3: visual order === DOM order (meaningful sequence, WCAG 1.3.2/2.4.3)', () => {
  /**
   * For each flex container holding timeline items, return whether the visual
   * order of its direct children (sorted by the primary-axis coordinate of the
   * container's computed flex-direction) equals their DOM order — plus the
   * computed flex-direction (so we can also assert it is never `-reverse`).
   */
  async function measureContainers(page: import('@playwright/test').Page) {
    return page.evaluate(() => {
      function childVisualVsDom(container: Element) {
        const kids = Array.from(container.children);
        const dir = getComputedStyle(container).flexDirection;
        const horiz = dir.startsWith('row');
        const withPos = kids.map((el, domIdx) => {
          const r = el.getBoundingClientRect();
          // Primary-axis coordinate: x for row layouts, y for column layouts.
          return { domIdx, key: horiz ? r.left : r.top };
        });
        const visualOrder = [...withPos].sort((a, b) => a.key - b.key).map((k) => k.domIdx);
        const domOrder = withPos.map((k) => k.domIdx);
        return { dir, visualOrder, domOrder, n: kids.length };
      }
      const out: Array<{
        label: string;
        dir: string;
        visualOrder: number[];
        domOrder: number[];
        n: number;
      }> = [];
      const spine = document.querySelector('.timeline-spine');
      if (spine) out.push({ label: 'spine', ...childVisualVsDom(spine) });
      document
        .querySelectorAll('.timeline-era__entries')
        .forEach((c, i) => out.push({ label: `era-entries[${i}]`, ...childVisualVsDom(c) }));
      document
        .querySelectorAll('.flagship-node__cluster')
        .forEach((c, i) => out.push({ label: `cluster[${i}]`, ...childVisualVsDom(c) }));
      return out;
    });
  }

  test('every flex container lays children out in DOM order at DESKTOP (1280) — no row-reverse / order / rtl', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(TIMELINE_PATH);
    const containers = await measureContainers(page);
    // We must actually be inspecting the real spine + its sub-lists, not nothing.
    expect(containers.length).toBeGreaterThanOrEqual(4);
    for (const c of containers) {
      expect(c.n, `${c.label} should hold timeline items`).toBeGreaterThan(0);
      // Visual (on-screen) order must equal DOM (reading/SR/keyboard) order.
      expect(
        c.visualOrder,
        `${c.label}: visual order diverges from DOM order (CSS reordering)`,
      ).toEqual(c.domOrder);
      // Belt-and-suspenders: the flex-direction must never be a *-reverse form.
      expect(c.dir, `${c.label}: flex-direction must not be reversed`).not.toMatch(/-reverse$/);
    }
  });

  test('every flex container lays children out in DOM order at MOBILE (375) — no column-reverse / order / rtl', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(TIMELINE_PATH);
    const containers = await measureContainers(page);
    expect(containers.length).toBeGreaterThanOrEqual(4);
    for (const c of containers) {
      expect(c.n, `${c.label} should hold timeline items`).toBeGreaterThan(0);
      expect(
        c.visualOrder,
        `${c.label}: visual order diverges from DOM order (CSS reordering)`,
      ).toEqual(c.domOrder);
      expect(c.dir, `${c.label}: flex-direction must not be reversed`).not.toMatch(/-reverse$/);
    }
  });

  test('the spine reflows HORIZONTAL on desktop and VERTICAL on mobile (presentation-only; same DOM)', async ({
    page,
  }) => {
    // Desktop: the spine's two era children must lay out left → right (row),
    // with the older runway era to the LEFT of the newer agentic-turn era.
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(TIMELINE_PATH);
    const desktopDir = await page
      .locator('.timeline-spine')
      .evaluate((el) => getComputedStyle(el).flexDirection);
    expect(desktopDir, 'desktop spine should be a horizontal row').toBe('row');
    const runwayDesktop = await page.locator('.timeline-era--runway').boundingBox();
    const agenticDesktop = await page.locator('.timeline-era--agentic-turn').boundingBox();
    expect(runwayDesktop).not.toBeNull();
    expect(agenticDesktop).not.toBeNull();
    // Horizontal craft-arc: runway (older) is left of agentic-turn (newer).
    expect(runwayDesktop!.x).toBeLessThan(agenticDesktop!.x);

    // Mobile: the SAME spine must reflow to a vertical column, runway ABOVE
    // agentic-turn — DOM order is identical (no re-fetch of HTML, just resize).
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(TIMELINE_PATH);
    const mobileDir = await page
      .locator('.timeline-spine')
      .evaluate((el) => getComputedStyle(el).flexDirection);
    expect(mobileDir, 'mobile spine should be a vertical column').toBe('column');
    const runwayMobile = await page.locator('.timeline-era--runway').boundingBox();
    const agenticMobile = await page.locator('.timeline-era--agentic-turn').boundingBox();
    expect(runwayMobile).not.toBeNull();
    expect(agenticMobile).not.toBeNull();
    // Vertical: runway (older) is above agentic-turn (newer).
    expect(runwayMobile!.y).toBeLessThan(agenticMobile!.y);
  });

  test('the labeled <li> sequence is IDENTICAL at desktop and mobile (DOM reading order is stable)', async ({
    page,
  }) => {
    // Complementary to the geometry checks above: confirms the DOM <li> sequence
    // itself does not change between viewports (the manifest/markup is single-
    // source; only CSS flex-direction differs).
    async function getEntryLabels(p: import('@playwright/test').Page): Promise<string[]> {
      return p.evaluate(() => {
        const entries = Array.from(document.querySelectorAll('.timeline-entry'));
        return entries.map(
          (el) =>
            el.querySelector('.timeline-tick__name')?.textContent?.trim() ||
            el.querySelector('.flagship-node__title')?.textContent?.trim() ||
            el.textContent?.trim().slice(0, 40) ||
            '',
        );
      });
    }
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(TIMELINE_PATH);
    const desktopOrder = await getEntryLabels(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(TIMELINE_PATH);
    const mobileOrder = await getEntryLabels(page);

    // Non-vacuous: there are real entries and the expected oldest→newest sequence.
    expect(desktopOrder.length).toBe(5);
    expect(desktopOrder[0]).toContain('Early shipping years');
    expect(desktopOrder[desktopOrder.length - 1]).toBe('This portfolio');
    expect(desktopOrder).toEqual(mobileOrder);
  });

  test('DOM order is oldest → newest: runway era precedes agentic-turn era in source', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);
    // Assert SOURCE order (not just geometry): the runway era <li> is before the
    // agentic-turn era <li> as direct children of the spine.
    const order = await page.evaluate(() => {
      const kids = Array.from(document.querySelectorAll('.timeline-spine > li'));
      return kids.map((el) => el.className);
    });
    const runwayIdx = order.findIndex((c) => c.includes('timeline-era--runway'));
    const agenticIdx = order.findIndex((c) => c.includes('timeline-era--agentic-turn'));
    expect(runwayIdx).toBeGreaterThanOrEqual(0);
    expect(agenticIdx).toBeGreaterThanOrEqual(0);
    expect(runwayIdx).toBeLessThan(agenticIdx);
  });
});

test.describe('Master Timeline — JS-off (AC3)', () => {
  test('timeline is a followable <ol> with real <a> links + dated/labeled items when JS is disabled', async ({
    browser,
  }) => {
    // Launch a new context with JS disabled.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    const response = await page.goto(TIMELINE_PATH);
    expect(response?.status()).toBe(200);

    // The spine is a real <ol> (not a div) and is visible JS-off.
    const spine = page.locator('ol.timeline-spine');
    await expect(spine).toBeVisible();
    await expect(spine).toHaveJSProperty('tagName', 'OL');

    // Era labels (the meaning, in text) render without JS.
    await expect(page.locator('body')).toContainText('The Runway');
    await expect(page.locator('body')).toContainText('The Agentic Turn');

    // Items are DATED + LABELED (no loss of content JS-off): the runway ticks
    // carry their approximate <time> markers and the portfolio Dots their dates.
    await expect(page.locator('time[datetime="~1996"]')).toBeAttached();
    await expect(page.locator('time[datetime="2026-06-06"]').first()).toBeAttached();

    // Portfolio Dots must be followable <a> elements (real links, JS-off).
    const brainstormLink = page.locator('a[href="/glass-box/brainstorm/"]').first();
    await expect(brainstormLink).toBeAttached();
    await expect(brainstormLink).toHaveJSProperty('tagName', 'A');

    // The loandemo #code Dot must be a REAL followable <a> (the forward-ref
    // route exists) — NOT rendered as the dead "[OPEN]" no-link branch. Its
    // [OPEN] flag rides as descriptive text on a working link, not as the only
    // affordance. (AC4 loandemo URLs flagged [OPEN]; AC5 link present + JS-off.)
    const loandemoLink = page.locator('a[href="/work/loandemo/#code"]');
    await expect(loandemoLink).toBeAttached();
    await expect(loandemoLink).toHaveJSProperty('tagName', 'A');

    await context.close();
  });
});

/**
 * Reduced-motion (AC3 / EXPERIENCE §State Patterns): the Stage-1 timeline is a
 * pure static <ol> — the live halo is a static ring, no motion. We assert this
 * at the real runtime under an emulated `prefers-reduced-motion: reduce`:
 *
 *  (1) NO timeline element runs a CSS keyframe `animation` — the timeline is
 *      authored with zero auto-motion (the live halo is a static box-shadow).
 *  (2) Every transition is NEUTRALIZED to effectively zero. The site's global
 *      reset (`src/styles/global.css`: `@media (prefers-reduced-motion: reduce)
 *      { *,*::before,*::after { transition-duration: 0.01ms !important } }`)
 *      collapses any transition to ~0s under reduce, so there is no perceptible
 *      motion. We allow ≤ 0.05ms (the reset's 0.01ms floor) and FAIL on any
 *      element whose transition survives at a perceptible duration — which would
 *      mean a transition escaped the reduced-motion reset.
 *
 * This catches a regression that introduces a real animation OR a transition not
 * covered by the reduced-motion reset, without flagging the reset itself.
 */
test.describe('Master Timeline — reduced-motion safe by construction (no animation)', () => {
  test('under reduced-motion: 0 running animations and every transition is neutralized to ~0', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(TIMELINE_PATH);
    const motion = await page.evaluate(() => {
      // Threshold in seconds: the global reset pins transitions to 0.01ms; allow
      // up to 0.05ms (5e-5s) so the neutralized value passes but a real, e.g.
      // 200ms (0.2s), transition that escaped the reset fails.
      const NEUTRALIZED_MAX_S = 5e-5;
      const els = Array.from(
        document.querySelectorAll(
          '.timeline-spine, .timeline-spine *, .timeline-dot, .era-band, .era-band *',
        ),
      );
      let animated = 0;
      const perceptibleTransitions: string[] = [];
      for (const el of els) {
        const cs = getComputedStyle(el);
        if (cs.animationName && cs.animationName !== 'none') animated++;
        const durs = cs.transitionDuration.split(',').map((d) => parseFloat(d) || 0);
        if (durs.some((d) => d > NEUTRALIZED_MAX_S)) {
          perceptibleTransitions.push(
            `${el.tagName.toLowerCase()} ${cs.transitionProperty}=${cs.transitionDuration}`,
          );
        }
      }
      return { animated, perceptibleTransitions, inspected: els.length };
    });
    expect(motion.inspected).toBeGreaterThan(0);
    expect(motion.animated, 'a timeline element runs a CSS keyframe animation').toBe(0);
    expect(
      motion.perceptibleTransitions,
      `transitions escaped the reduced-motion reset:\n${motion.perceptibleTransitions.join('\n')}`,
    ).toEqual([]);
  });

  test('the live Dot halo is a STATIC ring (box-shadow present, no animation)', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);
    const liveDot = page.locator('.timeline-dot--live').first();
    await expect(liveDot).toBeAttached();
    const halo = await liveDot.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { boxShadow: cs.boxShadow, animationName: cs.animationName };
    });
    // A non-`none` box-shadow proves the halo ring renders…
    expect(halo.boxShadow).not.toBe('none');
    // …and it is static (no keyframe animation driving it).
    expect(halo.animationName).toBe('none');
  });
});

test.describe('Master Timeline — WCAG 2.1 AA (axe audit)', () => {
  test('has zero axe-core wcag2a/wcag2aa violations on /timeline/', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });
});

test.describe('Master Timeline — URL form (trailing-slash, no 301)', () => {
  test('trailing-slash /timeline/ serves without a redirect hop', async ({ page }) => {
    const response = await page.goto(TIMELINE_PATH);
    expect(response?.status()).toBe(200);
    // Current URL stays at the trailing-slash form (no redirect observed).
    expect(page.url()).toContain(TIMELINE_PATH);
  });
});
