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

  test('ships exactly 3 executable scripts — Guide pill (2) + deferred-mount shim (1) (NFR-1, Story 6.2 AC5)', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);
    // Story 6.2: /timeline/ ships 3 executable scripts:
    //   - 2 Guide pill init scripts (site-wide carve-out, Story 4.4)
    //   - 1 deferred ZoomableTimeline mount shim (onMotionAllowed + requestIdleCallback)
    // The ZoomableTimeline island + GSAP are NOT in the initial exec set (they load
    // lazily via dynamic import() inside onMotionAllowed — AC5 / NFR-1).
    // The <script type="application/json" id="timeline-data"> is a data island (not executable).
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
      `/timeline/ must ship exactly 3 exec scripts (2 GuidePill + 1 deferred-mount shim); found ${executableScripts}`,
    ).toBe(3);
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
    // Each era carries aria-label="Era: <name>" — present in the static <ol> (always)
    // and also in the ZoomableTimeline island when JS is enabled (Story 6.2 adds the island).
    // The guarantee is that at least one element with the correct aria-label exists.
    const runwayCount = await page.locator('[aria-label="Era: The Runway"]').count();
    expect(
      runwayCount,
      'Era: The Runway aria-label must be present at least once',
    ).toBeGreaterThanOrEqual(1);
    const agenticCount = await page.locator('[aria-label="Era: The Agentic Turn"]').count();
    expect(
      agenticCount,
      'Era: The Agentic Turn aria-label must be present at least once',
    ).toBeGreaterThanOrEqual(1);
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

/**
 * Story 3.0 (AC5) — visible flagship/cluster date labels are the deterministic
 * "Mon YYYY" form, and the <time datetime> attr carries the VERBATIM manifest
 * ISO string.
 *
 * Why this is the real-runtime delta for 3.0: FlagshipNode.astro used to format
 * the visible date with `new Date(iso).toLocaleDateString(...)` (TZ-dependent —
 * a UTC-midnight date could render the prior month west of UTC). It now routes
 * BOTH the milestone date and every cluster-dot date through the shared
 * `formatDotDate()` helper (timeZone:'UTC', deterministic). The unit test
 * (web/test/timeline-format.test.ts) pins the helper across TZ settings; THIS
 * test proves the built /timeline/ page actually shows the deterministic label
 * to a real browser, and that the machine-readable datetime is still the raw
 * manifest value (not the human label). The existing JS-off block only asserts
 * the <time> elements are *attached* — it never checks the rendered label text,
 * so a regression to a TZ-shifted or mis-formatted visible label would slip past
 * it. These assertions FAIL if formatDotDate is reverted or bypassed.
 *
 * Manifest source of truth (content/timeline/dots.ts → generated/timeline.json):
 *   milestone dates: loandemo "2026-06", portfolio "2026-06-06"  → both "Jun 2026"
 *   cluster dates:   "2026-06" / "2026-06-02" / "2026-06-03" / "2026-06-06" → all "Jun 2026"
 * (Runway ticks render their "~YYYY" date verbatim via the page, NOT via
 *  FlagshipNode/formatDotDate — out of scope here.)
 */
test.describe('Master Timeline — deterministic "Mon YYYY" date labels (Story 3.0, AC5)', () => {
  test('flagship milestone dates render the "Mon YYYY" label (not a full/locale date)', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);
    const milestoneDates = page.locator('.flagship-node__date');
    // Story 6.1 (Stage 2): the agentic-turn era now has many more flagships —
    // the loandemo + portfolio seed flagships plus all harvested epics, retros,
    // and course-corrections from the timeline allowlist. Assert at least 2
    // (the seed flagships) rather than pinning an exact count that grows with
    // each new allowlist entry.
    const milestoneDateCount = await milestoneDates.count();
    expect(
      milestoneDateCount,
      'at least 2 milestone dates (loandemo + portfolio)',
    ).toBeGreaterThanOrEqual(2);
    for (const d of await milestoneDates.all()) {
      // All manifest dates fall in June 2026, so the deterministic label is "Jun 2026".
      await expect(d).toHaveText(/^\s*Jun 2026\s*$/);
      // A regression to the old toLocaleDateString full-style label would include
      // a day number (e.g. "June 6, 2026") — assert no day-of-month leaks in.
      await expect(d).not.toHaveText(/\d{1,2},/);
    }
  });

  test('flagship milestone <time datetime> carries the VERBATIM manifest ISO (not the human label)', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);
    // The two milestone datetime attrs are the raw manifest strings, distinct
    // from each other and from the shared visible "Jun 2026" label.
    await expect(page.locator('time.flagship-node__date[datetime="2026-06"]')).toHaveCount(1);
    await expect(page.locator('time.flagship-node__date[datetime="2026-06-06"]')).toHaveCount(1);
    // The portfolio milestone proves label≠datetime: datetime is the full ISO
    // "2026-06-06" while the visible text is the short "Jun 2026".
    const portfolioMilestone = page.locator('time.flagship-node__date[datetime="2026-06-06"]');
    await expect(portfolioMilestone).toHaveText(/^\s*Jun 2026\s*$/);
  });

  test('every cluster-dot date renders "Mon YYYY" with a verbatim ISO datetime', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);
    const dotDates = page.locator('.flagship-node__dot-date');
    // Story 6.1 (Stage 2): loandemo cluster (3) + portfolio cluster (7) = 10 dated
    // cluster dots. The harvested epic/retro/course-correction entries are top-level
    // FlagshipNode items with EMPTY clusters, so they do NOT add cluster dot dates.
    await expect(dotDates).toHaveCount(10);
    for (const d of await dotDates.all()) {
      // All cluster manifest dates are in June 2026 → deterministic "Jun 2026".
      await expect(d).toHaveText(/^\s*Jun 2026\s*$/);
      // The machine-readable datetime must be an ISO date string (date-only OR
      // full ISO-8601 timestamp from git committer date). The harvested planning
      // Dots carry full ISO-8601 timestamps (git committer date format %cI).
      const dt = await d.getAttribute('datetime');
      expect(dt, 'cluster <time> must carry a datetime attribute').not.toBeNull();
      // Accept both date-only (YYYY-MM or YYYY-MM-DD) and full ISO-8601 timestamp
      // (YYYY-MM-DDTHH:MM:SS+HH:MM) — harvested Dots use git committer dates.
      expect(dt!).toMatch(/^\d{4}-\d{2}(-\d{2}(T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2})?)?$/);
    }
  });

  test('a day-precise cluster date renders as "Jun 2026" (harvested or seeded)', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);
    // Stage 2: planning Dots in the portfolio cluster carry full git committer date
    // timestamps (e.g. 2026-06-02T23:02:06+00:00), not bare date-only strings.
    // The brainstorm Dot (date = 2026-06-02T23:02:06+00:00) should render "Jun 2026".
    // Assert: at least one cluster dot date with a 2026-06-02 prefix renders "Jun 2026".
    const dotDates = page.locator('.flagship-node__dot-date');
    const allDates = await dotDates.all();
    let foundJune = false;
    for (const d of allDates) {
      const dt = await d.getAttribute('datetime');
      if (dt && dt.startsWith('2026-06-02')) {
        await expect(d).toHaveText(/^\s*Jun 2026\s*$/);
        foundJune = true;
        break;
      }
    }
    expect(foundJune, 'at least one 2026-06-02 cluster dot renders as Jun 2026').toBe(true);
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
      // Story 6.1 (Stage 2): harvested epic/retro entries render as FlagshipNode
      // with EMPTY clusters. Only include clusters that have child items to avoid
      // asserting on empty flex containers (empty clusters still have flex layout
      // but contain zero children — they are valid empty <ol>s).
      document.querySelectorAll('.flagship-node__cluster').forEach((c, i) => {
        const result = childVisualVsDom(c);
        if (result.n > 0) out.push({ label: `cluster[${i}]`, ...result });
      });
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
    // Story 6.1 (Stage 2): the agentic-turn era now has many more entries (harvested
    // BMAD Dots: epics, retros, course-correction, planning). Total entries =
    // runway (3 ticks) + agentic-turn (13 flagship entries) = 16 minimum.
    expect(desktopOrder.length).toBeGreaterThanOrEqual(5);
    expect(desktopOrder[0]).toContain('Early shipping years');
    // The last entry is the most recent harvested item (Epic 5 Retrospective or
    // Epic 5 cycle log — whichever has the latest git committer date). It is no
    // longer guaranteed to be "This portfolio" since harvested Dots may be newer.
    expect(desktopOrder.length).toBeGreaterThan(5);
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

    // Portfolio cluster Dots must be followable <a> elements (real links, JS-off).
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
});

test.describe('Master Timeline — URL form (trailing-slash, no 301)', () => {
  test('trailing-slash /timeline/ serves without a redirect hop', async ({ page }) => {
    const response = await page.goto(TIMELINE_PATH);
    expect(response?.status()).toBe(200);
    // Current URL stays at the trailing-slash form (no redirect observed).
    expect(page.url()).toContain(TIMELINE_PATH);
  });
});

/**
 * Story 6.1 AC6 — Integration AC: the existing /timeline/ renders the merged Dots.
 *
 * Asserts the USER-OBSERVABLE rendered outcome (Rule 13): both the curated seed
 * (runway ticks) AND the harvested BMAD Dots (epics, retros) are VISIBLE on the
 * served /timeline/ page, not just present in the JSON. JS-off semantic <ol>
 * contains them. Links resolve (no broken link to a fabricated target).
 *
 * The harvest pipeline (scripts/harvest-timeline.ts) runs as part of the
 * webServer `pnpm build` in playwright.config.ts — the JSON is generated before
 * the Astro build, so the page receives the merged output.
 */
test.describe('Story 6.1 AC6 — Integration: merged Dots visible on served /timeline/', () => {
  test('the runway era IS VISIBLE (seed ticks render with JS on)', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    // Assert the user-observable runway band is present and visible (Rule 13).
    const runwayEra = page.locator('[aria-label="Era: The Runway"]');
    await expect(runwayEra).toBeVisible();
    // The first runway tick text is visible — not just attached.
    await expect(page.locator('body')).toContainText('Early shipping years');
  });

  test('at least one harvested BMAD Dot IS VISIBLE in the agentic-turn era', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    // Assert a harvested epic Dot is rendered and visible (Rule 13 — user-observable).
    // Epic 1 cycle log becomes "Epic 1 — Build Foundation" in the agentic-turn era.
    const agenticEra = page.locator('[aria-label="Era: The Agentic Turn"]');
    await expect(agenticEra).toBeVisible();

    // Rule 8 (scoped) + Rule 13 (user-observable result, not just text-in-body):
    // bind the assertion to the harvested entry's REAL rendered <li>, INSIDE the
    // agentic-turn era, and assert the FULL milestone Dot renders — the milestone
    // marker span + the VISIBLE label + the VISIBLE date. A body-wide toContainText
    // would pass if the string appeared anywhere (e.g. a stray comment); this proves
    // the harvested epic/retro Dots render as real, visible milestone nodes (the
    // empty-cluster FlagshipNode is not an invisible/broken no-op).
    const epicLi = agenticEra.locator(
      'li.timeline-entry--flagship[aria-label="Flagship: Epic 1 — Build Foundation"]',
    );
    await expect(epicLi).toHaveCount(1);
    await expect(epicLi).toBeVisible();
    // The milestone dot marker renders for the harvested (empty-cluster) Dot.
    await expect(epicLi.locator('.timeline-dot--milestone')).toBeAttached();
    // The visible title text is the harvested label.
    await expect(epicLi.locator('.flagship-node__title')).toHaveText('Epic 1 — Build Foundation');
    // Rule 13: the harvested Dot's DATE is actually rendered (deterministic Jun 2026
    // from the real git committer date), carrying the verbatim ISO datetime attr.
    const epicDate = epicLi.locator('time.flagship-node__date');
    await expect(epicDate).toHaveText(/^\s*Jun 2026\s*$/);
    await expect(epicDate).toHaveAttribute(
      'datetime',
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
    );

    // A harvested retro Dot is likewise visible as its own scoped milestone node.
    const retroLi = agenticEra.locator(
      'li.timeline-entry--flagship[aria-label="Flagship: Epic 1 Retrospective"]',
    );
    await expect(retroLi).toHaveCount(1);
    await expect(retroLi).toBeVisible();
    await expect(retroLi.locator('.flagship-node__title')).toHaveText('Epic 1 Retrospective');
  });

  test('JS-off: semantic <ol> contains BOTH runway ticks AND harvested BMAD Dots', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto(TIMELINE_PATH);
    expect(response?.status()).toBe(200);

    // The spine is a real <ol> (not a div) and is visible JS-off.
    const spine = page.locator('ol.timeline-spine');
    await expect(spine).toBeVisible();

    // Runway ticks are visible JS-off (seed, un-harvestable).
    await expect(page.locator('body')).toContainText('Early shipping years');
    await expect(page.locator('time[datetime="~1996"]')).toBeAttached();

    // Harvested BMAD Dot is visible JS-off — assert a real epic entry renders.
    await expect(page.locator('body')).toContainText('Epic 1 — Build Foundation');

    // Portfolio planning Dots still resolve to real Glass Box links JS-off.
    const brainstormLink = page.locator('a[href="/glass-box/brainstorm/"]').first();
    await expect(brainstormLink).toBeAttached();

    // No `href="[OPEN]"` appears in the rendered HTML ([OPEN] items render as
    // non-link spans, not broken anchors — credibility floor, AC5).
    const openLinks = page.locator('a[href="[OPEN]"]');
    await expect(openLinks).toHaveCount(0);

    await context.close();
  });

  test('Dot links resolve (no broken link to a fabricated target)', async ({ page }) => {
    await page.goto(TIMELINE_PATH);
    // Portfolio planning Dots link to real Glass Box readers (slug is in GLASSBOX_ALLOWLIST).
    for (const slug of PORTFOLIO_SLUGS) {
      const link = page.locator(`a[href="/glass-box/${slug}/"]`).first();
      await expect(link, `Reader link present for ${slug}`).toBeAttached();
    }
    // Harvested epic/retro/course-correction Dots with [OPEN] href must NOT render
    // as broken <a href="[OPEN]"> anchors. The FlagshipNode component renders them
    // as plain milestone nodes with no cluster link (empty cluster = no dot links).
    // Assert: zero anchors with href="[OPEN]" exist.
    const brokenOpenLinks = page.locator('a[href="[OPEN]"]');
    await expect(brokenOpenLinks).toHaveCount(0);
  });

  // ── Story 6.2 code-review fix: the internal `[OPEN: no Glass Box reader yet]`
  //    developer sentinel must NEVER leak into user-visible prose. The harvested
  //    epics/retros/course-corrections now show their clean summary + a clearly
  //    labeled "full reader coming (6.3/6.4)" affordance instead (owner decision 2).
  //    This is a credibility/Rule-9 floor — asserted on BOTH the static baseline
  //    (JS-off) and the island-enhanced surface so the two never diverge. ────────
  test('(6.2 fix) NO `[OPEN: …]` reader sentinel leaks into visible prose — STATIC (JS-off)', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(TIMELINE_PATH);

    // The visible body text must not contain the internal "no Glass Box reader yet"
    // developer sentinel (Rule 9). This is the SPECIFIC sentinel class the fix
    // targets — the one that rode on every harvested epic/retro/course-correction
    // description.
    const bodyText = (await page.locator('body').innerText()) ?? '';
    expect(
      bodyText,
      'the internal "[OPEN: no Glass Box reader yet]" sentinel must not appear in visible prose',
    ).not.toContain('[OPEN: no Glass Box reader yet]');
    // Belt-and-suspenders: no "Glass Box reader yet" fragment in any form.
    expect(
      bodyText,
      'no "Glass Box reader yet" developer sentinel fragment in visible text',
    ).not.toMatch(/Glass Box reader yet/);
    // NOTE: a DIFFERENT, intentional placeholder — the loandemo cluster dot's
    // `[OPEN: repo URL — supplied by Story 2.5]` — IS deliberately visible in the
    // static <ol> (Story 2.5 owns it) and is correctly NOT stripped. So we do not
    // assert against the broad `[OPEN:` form here; only the no-reader-yet class.

    // The clean affordance IS rendered for the harvested epics/retros (Rule 13 —
    // the user-observable replacement, not merely the absence of the sentinel).
    const epicLi = page.locator(
      'li.timeline-entry--flagship[aria-label="Flagship: Epic 1 — Build Foundation"]',
    );
    await expect(epicLi.locator('.flagship-node__reader-note')).toHaveText(
      /Full reader coming.*6\.3\/6\.4/i,
    );
    // The clean harvested summary is still present (not blanked by the strip).
    await expect(epicLi.locator('.flagship-node__description')).toHaveText(
      /Scaffold, design system/i,
    );

    await context.close();
  });

  test('(6.2 fix) NO `[OPEN: …]` reader sentinel leaks into visible prose — ISLAND-enhanced', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const motionAllowed = await page.evaluate(
      () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    if (!motionAllowed) {
      test.skip();
      return;
    }

    // Trigger the deferred island mount (scroll is one of the one-shot triggers).
    await page.evaluate(() => window.scrollBy({ top: 50, behavior: 'instant' }));
    const ztRoot = page.locator('[data-testid="zt-root"]');
    await expect.poll(async () => ztRoot.count(), { timeout: 8000 }).toBeGreaterThan(0);

    // The island root's visible text must not carry the sentinel either (the island
    // mirrors the same data, so a divergence would re-introduce the leak — this is
    // exactly the surface the QA flagged as leaking 11×).
    const islandText = (await ztRoot.innerText()) ?? '';
    expect(islandText, 'island must not render the "no Glass Box reader yet" sentinel').not.toMatch(
      /\[OPEN: no Glass Box reader yet\]/,
    );
    expect(
      islandText,
      'island must not render the "Glass Box reader yet" developer sentinel fragment',
    ).not.toMatch(/Glass Box reader yet/);

    // The island renders the clean "reader coming" affordance for a harvested epic
    // flagship (Rule 13 — the user-observable replacement). Epic flagships have an
    // empty cluster; their affordance rides on the .zt-flagship__reader-note element.
    const epicFlagship = page.locator(
      '.zt-flagship:has(.zt-flagship__title:text("Epic 1 — Build Foundation"))',
    );
    await expect(epicFlagship.locator('.zt-flagship__reader-note')).toHaveText(
      /Full reader coming.*6\.3\/6\.4/i,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Story 6.2 — ZoomableTimeline island (semantic zoom)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AC1 — semantic zoom: overview ↔ a project's Dots.
 *
 * Rule 7: proven to run (not skipped). Motion-enabled path only.
 * Rule 13: asserts user-observable outcome — cluster Dots VISIBLE (not just an attribute flip).
 * Mutation-verify instruction: remove the `zt-cluster--visible` CSS rule → cluster stays display:none → test fails.
 */
test.describe('Story 6.2 — ZoomableTimeline: semantic zoom (AC1)', () => {
  test('(AC1) clicking a flagship expands its cluster Dots to VISIBLE — motion-enabled path (Rule 13)', async ({
    page,
  }) => {
    // Rule 7: guard that the test actually RUNS (not vacuously skipped on reduced-motion).
    await page.goto(TIMELINE_PATH);

    const motionAllowed = await page.evaluate(
      () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    if (!motionAllowed) {
      // Only test the on-path (motion allowed) case here; reduced-motion is AC4 below.
      test.skip();
      return;
    }

    // Trigger the one-shot interaction listener (scroll triggers the island load).
    // Rule 7: anti-vacuity — we prove the island actually mounts after interaction.
    await page.evaluate(() => window.scrollBy({ top: 50, behavior: 'instant' }));

    // Wait until the island root appears (the bootstrap creates #zt-island-root).
    const ztRoot = page.locator('[data-testid="zt-root"]');
    await expect
      .poll(async () => ztRoot.count(), {
        timeout: 8000,
        message: 'ZoomableTimeline island must mount after scroll',
      })
      .toBeGreaterThan(0);

    // Find the first flagship trigger button.
    const firstTrigger = page.locator('button.zt-flagship__trigger').first();
    await expect(firstTrigger).toBeVisible();

    // Before clicking: the cluster should NOT be visible (collapsed state).
    const firstFlagshipId = await firstTrigger.evaluate(
      (el) => el.closest('[data-flagship-id]')?.getAttribute('data-flagship-id') ?? '',
    );
    expect(firstFlagshipId).not.toBe('');

    const cluster = page.locator(`[data-testid="cluster-${firstFlagshipId}"]`);
    await expect(cluster).toBeAttached();

    // The cluster must be hidden (collapsed) before click.
    const hiddenBefore = await cluster.evaluate(
      (el) =>
        getComputedStyle(el).display === 'none' || !el.classList.contains('zt-cluster--visible'),
    );
    expect(hiddenBefore, 'cluster must start collapsed (Rule 13 mutation guard)').toBe(true);

    // Click to expand.
    await firstTrigger.click();

    // Rule 13: cluster Dots must be VISIBLE after expand — not just an attribute flip.
    // If the `zt-cluster--visible` CSS rule were a no-op, this would fail.
    await expect(cluster).toHaveClass(/zt-cluster--visible/);
    await expect(cluster).toBeVisible();

    // At least one cluster item must be visible (not display:none, not opacity:0).
    const firstItem = cluster.locator('.zt-cluster__item').first();
    // For flagships with clusters (portfolio, loandemo): item is visible.
    // For flagships with empty clusters (epics, retros): no items — skip.
    const itemCount = await cluster.locator('.zt-cluster__item').count();
    if (itemCount > 0) {
      await expect(firstItem).toBeVisible();
      // Bounding box confirms the element actually takes up space (Rule 13).
      const box = await firstItem.boundingBox();
      expect(
        box,
        'cluster item must have a non-zero bounding box (actually visible)',
      ).not.toBeNull();
      expect(box!.width, 'cluster item width > 0').toBeGreaterThan(0);
      expect(box!.height, 'cluster item height > 0').toBeGreaterThan(0);
    }

    // ── Rule 13 anti-vacuity hardening (QA) ────────────────────────────────────
    // The `.first()` flagship above happens to have a non-empty cluster TODAY
    // (loandemo, 3 Dots), so the item-visibility block runs. But a future harvest
    // reorder could put an EMPTY-cluster flagship (an epic/retro) first, silently
    // skipping the `if (itemCount > 0)` block and making the visible-item assertion
    // vacuous. Guarantee a non-empty cluster's Dots become VISIBLE by explicitly
    // expanding the "This portfolio" flagship (a known 7-Dot cluster) and asserting
    // its cluster items render with a non-zero box. This binds the Rule-13 outcome
    // to a stable target independent of harvest ordering.
    //
    // First collapse back to overview: while a flagship is focused, the OTHER
    // flagships are `.zt-entry--dimmed { pointer-events: none }` (by design), so
    // we must return to overview before targeting a different flagship.
    const overviewBtn = page.locator('[data-testid="zt-overview-btn"]');
    if ((await overviewBtn.count()) > 0) {
      await overviewBtn.click();
      await expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
    }

    const portfolioTrigger = page
      .locator('button.zt-flagship__trigger', { hasText: 'This portfolio' })
      .first();
    expect(
      await portfolioTrigger.count(),
      'the "This portfolio" flagship must exist in the island (a known non-empty cluster)',
    ).toBeGreaterThan(0);
    const portfolioId = await portfolioTrigger.evaluate(
      (el) => el.closest('[data-flagship-id]')?.getAttribute('data-flagship-id') ?? '',
    );
    const portfolioCluster = page.locator(`[data-testid="cluster-${portfolioId}"]`);
    // Collapsed before expand (display:none — Rule 13 mutation guard).
    await expect(portfolioCluster).not.toBeVisible();
    await portfolioTrigger.click();
    // VISIBLE after expand — the CSS consumer turns the class into a real reveal.
    await expect(portfolioCluster).toBeVisible();
    const portfolioItems = portfolioCluster.locator('.zt-cluster__item');
    expect(
      await portfolioItems.count(),
      'the portfolio cluster must have its harvested Dots',
    ).toBeGreaterThan(0);
    const pItem = portfolioItems.first();
    await expect(pItem).toBeVisible();
    const pBox = await pItem.boundingBox();
    expect(pBox, 'portfolio cluster item must occupy real space (Rule 13)').not.toBeNull();
    expect(pBox!.width).toBeGreaterThan(0);
    expect(pBox!.height).toBeGreaterThan(0);
  });

  test('(AC1) keyboard Enter/Space expands a flagship cluster (keyboard accessibility)', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const motionAllowed = await page.evaluate(
      () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    if (!motionAllowed) {
      test.skip();
      return;
    }

    await page.evaluate(() => window.scrollBy({ top: 50, behavior: 'instant' }));
    const ztRoot = page.locator('[data-testid="zt-root"]');
    await expect.poll(async () => ztRoot.count(), { timeout: 8000 }).toBeGreaterThan(0);

    const firstTrigger = page.locator('button.zt-flagship__trigger').first();
    await firstTrigger.focus();
    await page.keyboard.press('Enter');

    // The trigger must have aria-expanded="true" after activation.
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('(AC1) the overview↔detail control button collapses back to overview', async ({ page }) => {
    await page.goto(TIMELINE_PATH);

    const motionAllowed = await page.evaluate(
      () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    if (!motionAllowed) {
      test.skip();
      return;
    }

    await page.evaluate(() => window.scrollBy({ top: 50, behavior: 'instant' }));
    const ztRoot = page.locator('[data-testid="zt-root"]');
    await expect.poll(async () => ztRoot.count(), { timeout: 8000 }).toBeGreaterThan(0);

    // Expand first flagship.
    const firstTrigger = page.locator('button.zt-flagship__trigger').first();
    await firstTrigger.click();
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');

    // The "Back to timeline overview" button must appear.
    const overviewBtn = page.locator('[data-testid="zt-overview-btn"]');
    await expect(overviewBtn).toBeVisible();

    // Clicking it collapses back to overview.
    await overviewBtn.click();
    await expect(firstTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(overviewBtn).not.toBeVisible();
  });
});

/**
 * AC2 — open a Dot → its detail (reuse + link).
 *
 * Rule 9: no fabricated content in the detail panel.
 * Rule 13: detail panel actually SHOWS its text (not just a state attribute flip).
 */
test.describe('Story 6.2 — ZoomableTimeline: Dot detail panel (AC2)', () => {
  test('(AC2) opening a portfolio Dot shows its detail + a real /glass-box/ reader link (Rule 9, Rule 13)', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const motionAllowed = await page.evaluate(
      () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    if (!motionAllowed) {
      test.skip();
      return;
    }

    await page.evaluate(() => window.scrollBy({ top: 50, behavior: 'instant' }));
    const ztRoot = page.locator('[data-testid="zt-root"]');
    await expect.poll(async () => ztRoot.count(), { timeout: 8000 }).toBeGreaterThan(0);

    // Expand the "This portfolio" flagship (known to have /glass-box/ cluster Dots).
    const portfolioTrigger = page
      .locator('button.zt-flagship__trigger', { hasText: 'This portfolio' })
      .first();
    if ((await portfolioTrigger.count()) === 0) {
      // The "This portfolio" flagship may not appear first; skip if not found.
      test.skip();
      return;
    }
    await portfolioTrigger.click();
    await expect(portfolioTrigger).toHaveAttribute('aria-expanded', 'true');

    // Find the first dot-button in the cluster.
    const portfolioId = await portfolioTrigger.evaluate(
      (el) => el.closest('[data-flagship-id]')?.getAttribute('data-flagship-id') ?? '',
    );
    const firstDotBtn = page.locator(`[data-testid="dot-btn-${portfolioId}-0"]`);
    await expect(firstDotBtn).toBeVisible();

    // Click the Dot button to open its detail panel.
    await firstDotBtn.click();

    // Rule 13: the detail panel SHOWS real text (label + reader link).
    const detailPanel = page.locator('.zt-detail-panel');
    await expect(detailPanel).toBeVisible();

    const labelEl = detailPanel.locator('.zt-detail-panel__label');
    await expect(labelEl).toBeVisible();
    const labelText = await labelEl.textContent();
    expect(
      labelText?.trim().length,
      'detail panel label must have real text (Rule 9)',
    ).toBeGreaterThan(0);

    // The reader link must resolve 200 (AC2 — "where a reader exists").
    const readerLink = detailPanel.locator('.zt-detail-panel__reader-link');
    await expect(readerLink).toBeVisible();
    const href = await readerLink.getAttribute('href');
    expect(href, 'reader link must have an href').not.toBeNull();

    if (href && href.startsWith('/glass-box/')) {
      const response = await page.goto(href);
      expect(response?.status(), `reader link ${href} must resolve 200`).toBe(200);
      await page.goto(TIMELINE_PATH);
    }
  });

  test('(AC2) Esc dismisses ONLY the detail panel, keeps the flagship expanded, and returns focus to the opener', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const motionAllowed = await page.evaluate(
      () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    if (!motionAllowed) {
      test.skip();
      return;
    }

    await page.evaluate(() => window.scrollBy({ top: 50, behavior: 'instant' }));
    const ztRoot = page.locator('[data-testid="zt-root"]');
    await expect.poll(async () => ztRoot.count(), { timeout: 8000 }).toBeGreaterThan(0);

    // Target the "This portfolio" flagship — a STABLE non-empty cluster (7 Dots),
    // so the Dot-open path is guaranteed to run (not skipped on data reorder).
    const portfolioTrigger = page
      .locator('button.zt-flagship__trigger', { hasText: 'This portfolio' })
      .first();
    expect(
      await portfolioTrigger.count(),
      'the "This portfolio" flagship (a known non-empty cluster) must exist',
    ).toBeGreaterThan(0);
    await portfolioTrigger.click();
    await expect(portfolioTrigger).toHaveAttribute('aria-expanded', 'true');
    const portfolioId = await portfolioTrigger.evaluate(
      (el) => el.closest('[data-flagship-id]')?.getAttribute('data-flagship-id') ?? '',
    );

    // Open the first Dot's detail.
    const dotBtnTestId = `dot-btn-${portfolioId}-0`;
    const firstDotBtn = page.locator(`[data-testid="${dotBtnTestId}"]`);
    await expect(firstDotBtn).toBeVisible();
    await firstDotBtn.click();
    const detailPanel = page.locator('.zt-detail-panel');
    await expect(detailPanel).toBeVisible();

    // Press Esc — AC2: a SINGLE-LEVEL dismiss.
    await page.keyboard.press('Escape');

    // (1) The detail panel is dismissed.
    await expect(detailPanel).not.toBeVisible();

    // (2) The flagship stays EXPANDED — Esc closes the detail, not the whole zoom.
    // (Regression guard: the island's top-level Esc handler must NOT also collapse
    //  the flagship while a detail panel is open — that would unmount the opener
    //  and drop focus to <body>, breaking AC2's focus-return promise.)
    await expect(portfolioTrigger).toHaveAttribute('aria-expanded', 'true');

    // (3) Focus is RETURNED to the opener Dot button (AC2 — not lost to <body>).
    const focusedTestId = await page.evaluate(
      () => document.activeElement?.getAttribute('data-testid') ?? null,
    );
    expect(focusedTestId, 'AC2: Esc must return focus to the opener Dot button (not <body>)').toBe(
      dotBtnTestId,
    );
  });

  test('(AC2) harvested epic/retro Dot shows harvested summary + "full reader" affordance — no fabricated prose (Rule 9)', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const motionAllowed = await page.evaluate(
      () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    if (!motionAllowed) {
      test.skip();
      return;
    }

    await page.evaluate(() => window.scrollBy({ top: 50, behavior: 'instant' }));
    const ztRoot = page.locator('[data-testid="zt-root"]');
    await expect.poll(async () => ztRoot.count(), { timeout: 8000 }).toBeGreaterThan(0);

    // Find a flagship flagged as "reader coming" (OPEN) — these are the harvested epics/retros.
    // They appear in the island as trigger buttons labeled e.g. "Epic 1 — Build Foundation".
    const epicTrigger = page
      .locator('button.zt-flagship__trigger', { hasText: /Epic \d+/ })
      .first();
    if ((await epicTrigger.count()) === 0) {
      test.skip();
      return;
    }
    await epicTrigger.click();
    await expect(epicTrigger).toHaveAttribute('aria-expanded', 'true');

    // If there are cluster items for this epic, open the first one.
    const epicId = await epicTrigger.evaluate(
      (el) => el.closest('[data-flagship-id]')?.getAttribute('data-flagship-id') ?? '',
    );
    const dotBtn = page.locator(`[data-testid="dot-btn-${epicId}-0"]`);
    if ((await dotBtn.count()) === 0) {
      // Epic flagships have empty clusters in the current data set — the flagship
      // itself carries the description via the .zt-flagship__desc element.
      // Assert the description text is the HARVESTED summary (from timeline.json).
      const flagshipDesc = page.locator(
        `.zt-flagship[data-flagship-id="${epicId}"] .zt-flagship__desc`,
      );
      const descText = await flagshipDesc.textContent();
      // Rule 9: description must not be fabricated prose — it comes from the
      // harvested timeline.json (short factual summary). Assert it's non-empty.
      expect(
        descText?.trim().length,
        'epic flagship description must be non-empty (harvested, not fabricated)',
      ).toBeGreaterThan(0);
      // Rule 9: no invented skill/conclusion prose. The harvested summaries are
      // short factual labels; anything looking like full paragraphs is a red flag.
      // Scope: the description element only (Rule 8 — scoped, not whole-doc).
      expect(
        descText?.length ?? 0,
        'epic description should be a short summary, not a fabricated essay',
      ).toBeLessThan(300);
      return;
    }

    await dotBtn.click();
    const detailPanel = page.locator('.zt-detail-panel');
    await expect(detailPanel).toBeVisible();

    // Rule 9: no fabricated epic-scope/retro-conclusion prose.
    // The detail must NOT contain invented long-form content.
    const descEl = detailPanel.locator('.zt-detail-panel__desc');
    if ((await descEl.count()) > 0) {
      const descText = await descEl.textContent();
      expect(
        descText?.length ?? 0,
        'Dot description must be the harvested summary (not fabricated)',
      ).toBeLessThan(300);
    }

    // If the Dot has an [OPEN] note, it must say "reader coming" (not pretend a reader exists).
    const openNote = detailPanel.locator('.zt-detail-panel__open-note');
    if ((await openNote.count()) > 0) {
      await expect(openNote).toContainText(/reader.*coming|6\.3.*6\.4/i);
    }
  });
});

/**
 * AC4 — reduced-motion: island + GSAP chunk NEVER fetched.
 *
 * Rule 7: proven to run (anti-vacuity guard that emulation is active).
 * This is the FR-8 guarantee: the heavy chunk is NEVER fetched under reduced-motion.
 */
test.describe('Story 6.2 — ZoomableTimeline: reduced-motion (AC4)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('(AC4-a) under reduced-motion, the ZoomableTimeline island chunk + GSAP are NEVER fetched (FR-8 guarantee — Rule 7)', async ({
    page,
  }) => {
    // Rule 7: intercept ALL requests; prove heavy chunks are NEVER fetched.
    const heavyChunkRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      // Track ZoomableTimeline island chunk, GSAP vendor chunk, and bootstrap.
      if (
        url.includes('ZoomableTimeline') ||
        url.includes('timeline-zoom') ||
        url.includes('cinematic-gsap') ||
        url.includes('timeline_zoom') // Vite's chunk naming for lib/timeline-zoom/
      ) {
        heavyChunkRequests.push(url);
      }
    });

    await page.goto(TIMELINE_PATH);

    // Anti-vacuity guard (Rule 7): the preference MUST actually be emulated.
    const isReduced = await page.evaluate(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    expect(isReduced, 'reduced-motion emulation must be active (Rule 7 anti-vacuity)').toBe(true);

    // Simulate interaction — under reduced-motion, onMotionAllowed no-ops, so
    // no listener attaches and no chunk loads.
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'instant' }));
    await page.waitForTimeout(1500); // allow any deferred callbacks to fire.

    // The island root must NOT be mounted (onMotionAllowed gate no-ops).
    const islandRoot = await page.locator('#zt-island-root').count();
    expect(islandRoot, 'ZoomableTimeline island root must NOT mount under reduced-motion').toBe(0);

    // No heavy chunks fetched.
    expect(
      heavyChunkRequests,
      `Heavy chunks must NOT be fetched under reduced-motion (FR-8): ${heavyChunkRequests.join(', ')}`,
    ).toHaveLength(0);
  });

  test('(AC4-b) under reduced-motion, the static <ol class="timeline-spine"> shows BOTH levels — every era, flagship, cluster Dot present + visible', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const isReduced = await page.evaluate(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    expect(isReduced, 'reduced-motion emulation must be active').toBe(true);

    // The static spine is the full experience under reduced-motion.
    const spine = page.locator('ol.timeline-spine');
    await expect(spine).toBeVisible();

    // Era labels must be present (both levels reachable, AC4 / FR-8).
    await expect(page.locator('body')).toContainText('The Runway');
    await expect(page.locator('body')).toContainText('The Agentic Turn');

    // Portfolio cluster Dots must be present + visible in the static <ol>.
    const brainstormLink = page.locator('a[href="/glass-box/brainstorm/"]').first();
    await expect(brainstormLink).toBeAttached();
    await expect(brainstormLink).toBeVisible();

    // Flagship milestone nodes are present.
    await expect(page.locator('body')).toContainText('This portfolio');
    await expect(page.locator('body')).toContainText('loandemo');
  });
});

/**
 * AC4 — JS-off: static <ol> is the full experience, both levels present + visible.
 */
test.describe('Story 6.2 — ZoomableTimeline: JS-off (AC4)', () => {
  test('(AC4-c) JS-off: both levels (every era, flagship, cluster Dot, label, date, link) present and visible', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto(TIMELINE_PATH);

    // The static spine must be the full experience.
    const spine = page.locator('ol.timeline-spine');
    await expect(spine).toBeVisible();

    // Both era levels present.
    await expect(page.locator('body')).toContainText('The Runway');
    await expect(page.locator('body')).toContainText('The Agentic Turn');

    // Flagship labels present at overview level.
    await expect(page.locator('body')).toContainText('This portfolio');
    await expect(page.locator('body')).toContainText('loandemo');

    // Cluster Dots are present AND visible JS-off (not display:none, no JS needed).
    // The static FlagshipNode renders them unconditionally.
    const brainstormLink = page.locator('a[href="/glass-box/brainstorm/"]').first();
    await expect(brainstormLink).toBeAttached();
    await expect(brainstormLink).toBeVisible();

    // /work/loandemo/ cluster is visible.
    const loandemoLink = page.locator('a[href="/work/loandemo/#code"]').first();
    await expect(loandemoLink).toBeAttached();
    await expect(loandemoLink).toBeVisible();

    // No broken [OPEN] anchors.
    const openLinks = page.locator('a[href="[OPEN]"]');
    await expect(openLinks).toHaveCount(0);

    await context.close();
  });
});

/**
 * AC5 — deferred-load script count (extends the existing script-count assertion).
 * The ZoomableTimeline island + GSAP must NOT appear in the initial HTML.
 */
test.describe('Story 6.2 — ZoomableTimeline: deferred load + script count (AC5)', () => {
  test('(AC5) the ZoomableTimeline island chunk and GSAP are NOT in the initial HTML', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    const html = await page.content();
    expect(html).not.toMatch(/ZoomableTimeline\.[a-zA-Z0-9_-]+\.js/);
    expect(html).not.toMatch(/cinematic-gsap\.[a-zA-Z0-9_-]+\.js/);
  });

  test('(AC5) the data island is present in the initial HTML (timeline-data script tag)', async ({
    page,
  }) => {
    await page.goto(TIMELINE_PATH);

    // The data island must be in the initial HTML so the deferred island can read it.
    const dataScript = page.locator('script#timeline-data[type="application/json"]');
    await expect(dataScript).toBeAttached();

    // It must contain valid JSON (not empty).
    const content = await dataScript.textContent();
    expect(
      content?.trim().length,
      'timeline-data script must have non-empty JSON content',
    ).toBeGreaterThan(0);
    expect(() => JSON.parse(content!), 'timeline-data script must be valid JSON').not.toThrow();

    // The JSON must contain era data (non-empty array with entries).
    const eras = JSON.parse(content!) as Array<{ id: string; entries: unknown[] }>;
    expect(eras.length, 'at least 1 era in timeline data').toBeGreaterThan(0);
    const totalFlagships = eras.reduce((sum, era) => sum + era.entries.length, 0);
    expect(totalFlagships, 'timeline data must have flagships').toBeGreaterThan(0);
  });
});
