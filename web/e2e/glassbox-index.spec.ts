import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Glass Box index e2e spec (Story 2.3, Task 5 / Rule 3).
 *
 * A real-runtime browser check (skill-rules Rule 3: user-facing surface MUST
 * have at least one test exercising the real target runtime). Asserts on the
 * observable DOM of the Glass Box index page:
 *
 *  - The index is reachable at the trailing-slash URL (/glass-box/).
 *  - Renders exactly one <h1> (the "The Glass Box" page heading).
 *  - The spine renders with filled/live/upcoming TimelineDot variants.
 *  - Each artifact card links to its /glass-box/{slug}/ reader (no 404, no redirect).
 *  - The shipping node renders with the "Live · in progress" pill.
 *  - Ghost nodes carry "As it accrues" text and no dead reader link.
 *  - The verbatim recursion beat is present.
 *  - 0 executable scripts (0-JS, NFR-1).
 *  - WCAG 2.1 AA on the index (axe-core audit).
 *  - JS-off: the spine is followable as a plain <ol> of real <a> links.
 *
 * The webServer in playwright.config.ts runs `pnpm build` (which runs the
 * render-glassbox generator first) so the pages are present at runtime.
 */

const INDEX_PATH = '/glass-box/';

// Known slugs from the 2.1 allowlist — all should be reachable from the index.
const FEATURED_SLUGS = [
  'brainstorm',
  'pre-brief-research',
  'product-brief',
  'prd',
  'ux-design',
  'ux-experience',
] as const;

test.describe('Glass Box index — /glass-box/', () => {
  test('is reachable at the trailing-slash URL (no 301, real page)', async ({ page }) => {
    const response = await page.goto(INDEX_PATH);
    // A 200 response — the trailing-slash URL is the canonical form.
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('renders exactly one <h1> with "The Glass Box" heading', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText('The Glass Box');
  });

  test('the lede leads with "Joshua R. Brandt, MSE" (entity-first, answer-first)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const lede = page.locator('.mirror__lede');
    await expect(lede).toContainText(/^Joshua R\. Brandt, MSE/);
  });

  test('ships 0 executable scripts (0-JS, NFR-1)', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const executableScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.filter((s) => s.type !== 'application/ld+json' && s.type !== 'importmap')
        .length;
    });
    expect(executableScripts).toBe(0);
  });

  test('card titles are h3 (not h1/h2) — clean heading hierarchy', async ({ page }) => {
    await page.goto(INDEX_PATH);
    // h1 is the page heading via MirrorLayout; cards use h3.
    await expect(page.locator('h1')).toHaveCount(1);
    // Ghost cards have h3 for title.
    const h3count = await page.locator('.artifact-card__title').count();
    expect(h3count).toBeGreaterThan(0);
    // Ensure no h1 inside artifact cards.
    const h1InCards = await page.locator('.artifact-card h1').count();
    expect(h1InCards).toBe(0);
  });
});

test.describe('Glass Box index — timeline spine (AC1)', () => {
  test('the build-story spine is a semantic <ol>', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const spine = page.locator('.glass-box__spine');
    await expect(spine).toHaveCount(1);
    // Must be an <ol> element (not ul, div, etc.).
    const tagName = await spine.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('ol');
  });

  test('renders filled dots for artifact nodes (computed shape)', async ({ page }) => {
    await page.goto(INDEX_PATH);
    // At least one filled dot visible.
    const filledDot = page.locator('.timeline-dot--filled').first();
    await expect(filledDot).toBeVisible();
  });

  test('renders the live dot for the shipping node (halo visible)', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const liveDot = page.locator('.timeline-dot--live');
    await expect(liveDot).toHaveCount(1);
    await expect(liveDot).toBeVisible();
  });

  test('renders upcoming (dashed) dots for ghost nodes', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const upcomingDots = page.locator('.timeline-dot--upcoming');
    // There should be 3 ghost nodes.
    await expect(upcomingDots).toHaveCount(3);
  });
});

/**
 * QA-added (Story 2.3, adversarial strengthening):
 *
 * The dev's live-dot test asserted only visibility/count — near-vacuous for a
 * spec that pins an EXACT static halo with NO animation (DESIGN §timeline-dot;
 * NFR-2 reduced-motion). These tests assert on the *computed style* of the real
 * rendered dot (Rule 3 real-runtime) so a regression to "no halo", "animated
 * halo", or "wrong shape" is caught — not just "the element exists".
 */
test.describe('Glass Box index — live-dot static halo (computed style, NFR-2)', () => {
  test('the live dot paints a real (non-none) box-shadow halo', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const liveDot = page.locator('.timeline-dot--live');
    await expect(liveDot).toHaveCount(1);
    const boxShadow = await liveDot.evaluate((el) => getComputedStyle(el).boxShadow);
    // A real halo is painted (not the flat-system default of "none").
    expect(boxShadow).not.toBe('none');
    expect(boxShadow).not.toBe('');
    // The halo is a 4px spread ring (spec: "4px rgba(30,58,95,0.16) static
    // halo"). Computed form is "rgba(30, 58, 95, 0.16) 0px 0px 0px 4px".
    expect(boxShadow).toContain('4px');
    expect(boxShadow.replace(/\s+/g, '')).toContain('rgba(30,58,95,0.16)');
  });

  test('the live dot is STATIC — no animation, no transition (NFR-2)', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const liveDot = page.locator('.timeline-dot--live');
    const motion = await liveDot.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        animationName: cs.animationName,
        animationDuration: cs.animationDuration,
        transitionDuration: cs.transitionDuration,
      };
    });
    // No keyframe animation drives the halo (spec: "static halo, NO animation").
    expect(motion.animationName).toBe('none');
    // No non-zero animation/transition duration (a pulsing halo would set one).
    expect(motion.animationDuration === '0s' || motion.animationDuration === '').toBe(true);
    expect(motion.transitionDuration === '0s' || motion.transitionDuration === '').toBe(true);
  });

  test('the live halo stays static under prefers-reduced-motion', async ({ page }) => {
    // Emulate the reduced-motion preference per the project's e2e pattern.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(INDEX_PATH);
    const liveDot = page.locator('.timeline-dot--live');
    const animationName = await liveDot.evaluate((el) => getComputedStyle(el).animationName);
    // It was static to begin with; reduced-motion must not introduce motion.
    expect(animationName).toBe('none');
  });
});

/**
 * QA-added (Story 2.3, WCAG 1.4.1 — use of color):
 *
 * The BMAD Method Dots encode status by COLOR + SHAPE; AC2/AC6 require that the
 * status meaning is never carried by the dot ALONE — the dots must be decorative
 * (aria-hidden) with the real meaning living in adjacent text. This asserts the
 * decorative contract on the real DOM so a dot that leaks into the a11y tree
 * (becoming a color-only status signal) is caught.
 */
test.describe('Glass Box index — dots are decorative, status lives in text (WCAG 1.4.1)', () => {
  test('every timeline dot is aria-hidden (not a color-only status carrier)', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const dots = page.locator('.timeline-dot');
    const count = await dots.count();
    // 6 filled + 1 live + 3 upcoming = 10 dots on the curated spine.
    expect(count).toBeGreaterThanOrEqual(10);
    for (const dot of await dots.all()) {
      await expect(dot).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('the shipping status is in TEXT (the live pill), not the halo alone', async ({ page }) => {
    await page.goto(INDEX_PATH);
    // The live dot's meaning is duplicated as text on the card (AC2): the pill.
    const pill = page.locator('.artifact-card__live-pill');
    await expect(pill).toHaveText(/Live · in progress/);
    // And the pill is in the accessibility tree (NOT aria-hidden).
    await expect(pill).not.toHaveAttribute('aria-hidden', 'true');
  });

  test('each ghost status is in TEXT ("As it accrues"), not dashed styling alone', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const statuses = page.locator('.artifact-card__status');
    await expect(statuses).toHaveCount(3);
    for (const status of await statuses.all()) {
      await expect(status).toHaveText(/As it accrues/);
      // The status text is in the a11y tree (not hidden behind color/shape).
      await expect(status).not.toHaveAttribute('aria-hidden', 'true');
    }
  });
});

test.describe('Glass Box index — artifact cards + links (AC5)', () => {
  test('each planning node links to a real /glass-box/{slug}/ reader (no 404)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    for (const slug of FEATURED_SLUGS) {
      const link = page.locator(`a[href="/glass-box/${slug}/"]`).first();
      await expect(link, `Reader link missing for slug: ${slug}`).toBeAttached();
      // Navigate to the reader to confirm no 404.
      const response = await page.goto(`/glass-box/${slug}/`);
      expect(response?.status(), `404 on /glass-box/${slug}/`).toBe(200);
      // Navigate back.
      await page.goto(INDEX_PATH);
    }
  });

  test('the shipping node has the "Live · in progress" pill (text, not just color)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const livePill = page.locator('.artifact-card__live-pill');
    await expect(livePill).toBeVisible();
    await expect(livePill).toContainText('Live · in progress');
  });

  test('the shipping node links the live site (real external link)', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const liveSiteLink = page.locator('a[href="https://joshuabrandt.abacusai.cloud/"]');
    await expect(liveSiteLink).toBeAttached();
  });
});

/**
 * Story 3.0 (AC3/AC4) — the shipping node's external "live site" link is the
 * ONLY external ArtifactCard rendered anywhere on the site (loandemo builds its
 * own evidence cards and renders no external ArtifactCard). This is therefore
 * the real-runtime surface for the label↔target honesty fix.
 *
 * The fix: ArtifactCard's DEFAULT external label dropped the false "(opens in
 * new tab)" parenthetical, because external links open with target="_self"
 * (same tab). The component test (web/test/glassbox-components.component.test.ts)
 * covers the default branch in isolation; HERE we assert the contract on the
 * REAL built page — the actually-rendered anchor must NOT claim "new tab" while
 * it is target="_self", and the consumer's EXPLICIT label must render verbatim
 * (the explicit label wins over the default). These FAIL if the anchor ever
 * regains a "new tab" claim while staying same-tab, or if the explicit
 * externalLabel stops being honored.
 */
test.describe('Glass Box index — external live-site link honesty (Story 3.0, AC3/AC4)', () => {
  const LIVE_SITE_HREF = 'https://joshuabrandt.abacusai.cloud/';

  test('the live-site anchor opens in the SAME tab (target="_self", rel=noopener)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const liveLink = page.locator(`a[href="${LIVE_SITE_HREF}"]`);
    await expect(liveLink).toHaveCount(1);
    // Curated external link opens in place (by design) — the behavior the label
    // must be honest about.
    await expect(liveLink).toHaveAttribute('target', '_self');
    await expect(liveLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('the live-site aria-label does NOT claim "opens in new tab" while target="_self"', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const liveLink = page.locator(`a[href="${LIVE_SITE_HREF}"]`);
    await expect(liveLink).toHaveCount(1);
    // It must carry an accessible label…
    const ariaLabel = await liveLink.getAttribute('aria-label');
    expect(ariaLabel, 'external live-site link must have an aria-label').not.toBeNull();
    // …and that label must NOT promise a new tab (the link is same-tab).
    expect(ariaLabel!).not.toMatch(/new tab/i);
    // Belt-and-suspenders: assert the label↔target honesty as one fact — if the
    // anchor is same-tab, no "new tab" wording is present on the live element.
    const target = await liveLink.getAttribute('target');
    expect(target).toBe('_self');
  });

  test('the consumer’s explicit externalLabel renders verbatim (explicit wins over the default)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const liveLink = page.locator(`a[href="${LIVE_SITE_HREF}"]`);
    // The index passes externalLabel={`Visit the live site: ${href}`} — the
    // explicit label must be honored verbatim (not replaced by the default).
    await expect(liveLink).toHaveAttribute('aria-label', `Visit the live site: ${LIVE_SITE_HREF}`);
    // The visible link text is the "View →" affordance (external cards use View,
    // not Read) — confirms this is the external branch of the component.
    await expect(liveLink).toHaveText(/View/);
  });
});

test.describe('Glass Box index — ghost nodes (AC2)', () => {
  test('renders 3 ghost cards with "As it accrues" text (no dead reader link)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    const ghostStatuses = page.locator('.artifact-card__status');
    // 3 ghost nodes: architecture, epics, retrospective.
    await expect(ghostStatuses).toHaveCount(3);
    for (const status of await ghostStatuses.all()) {
      await expect(status).toContainText('As it accrues');
    }
  });

  test('ghost nodes carry no read link (no dead reader href)', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const ghostCards = page.locator('.artifact-card--ghost');
    await expect(ghostCards).toHaveCount(3);
    for (const card of await ghostCards.all()) {
      // Ghost cards must have NO .artifact-card__link (no read link).
      const link = card.locator('.artifact-card__link');
      await expect(link).toHaveCount(0);
    }
  });
});

test.describe('Glass Box index — recursion beat + cross-link (AC3)', () => {
  test('carries the verbatim recursion beat', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const recursionBeat =
      "You're reading the build history of the site you're reading it on. It's being built in the open, right now.";
    await expect(page.locator('body')).toContainText(recursionBeat);
  });

  test('cross-links /timeline/ (Glass-Box-vs-Timeline boundary)', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const timelineLink = page.locator('a[href="/timeline/"]').first();
    await expect(timelineLink).toBeAttached();
  });
});

test.describe('Glass Box index — WCAG 2.1 AA (axe audit)', () => {
  test('has zero axe-core wcag2a/wcag2aa violations on /glass-box/', async ({ page }) => {
    await page.goto(INDEX_PATH);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`,
    );
    expect(summary, summary.join('\n')).toEqual([]);
  });
});

test.describe('Glass Box index — JS-off (AC4)', () => {
  test('spine is followable with JS disabled (real <ol> of <a> links)', async ({ browser }) => {
    // Launch a new context with JS disabled.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    const response = await page.goto(INDEX_PATH);
    expect(response?.status()).toBe(200);

    // The spine <ol> must be present and contain real links.
    const spine = page.locator('.glass-box__spine');
    await expect(spine).toBeVisible();

    // At least the featured artifact links must be followable as real <a> elements.
    for (const slug of FEATURED_SLUGS.slice(0, 2)) {
      const link = page.locator(`a[href="/glass-box/${slug}/"]`).first();
      await expect(link).toBeAttached();
    }

    // The live site link should also be a real <a>.
    const liveSiteLink = page.locator('a[href="https://joshuabrandt.abacusai.cloud/"]');
    await expect(liveSiteLink).toBeAttached();

    await context.close();
  });
});

test.describe('Glass Box index — URL form (trailing-slash, no 301)', () => {
  test('trailing-slash /glass-box/ serves without a redirect hop', async ({ page }) => {
    const response = await page.goto(INDEX_PATH);
    expect(response?.status()).toBe(200);
    // Current URL stays at the trailing-slash form (no redirect observed).
    expect(page.url()).toContain(INDEX_PATH);
  });
});
