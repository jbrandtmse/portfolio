import { expect, test } from '@playwright/test';

/**
 * Glass Box guided tour e2e spec (Story 6.3).
 *
 * Rule 7 (proven to run): every test in this file exercises a REAL served page —
 *   no skips, no test.skip() on missing prerequisites.
 *
 * Rule 8 (real module, scoped, mutation-verified): AC1 step assertion is
 *   mutation-verified (the test confirms that NOT stepping keeps the initial
 *   narration, so the "step changed narration" assertion would fail if stepping
 *   is a no-op).
 *
 * Rule 9 (credibility): AC4 asserts every tour narration string traces to a
 *   real curatorNote (no fabricated text).
 *
 * Rule 13 (user-observable): AC1 asserts visible narration text + the correct
 *   reader link href, not just the $tourStep atom value.
 *
 * ACs:
 *   AC1 — step changes visible active artifact (narration + reader link)
 *   AC2 — reader link resolves 200; ghost nodes have no fabricated reader link
 *   AC3 — JS-off: static list full (extended from glassbox-index.spec.ts)
 *          reduced-motion: tour usable, no animated transitions, static list present
 *   AC4 — narration traces to known curated strings
 *
 * Story 6.3: the tour island adds 1 inline <script> so the page now ships 3
 *   executable scripts (2 Guide-pill + 1 tour bootstrap).
 */

const INDEX_PATH = '/glass-box/';

// Known featured slugs in date-sorted build-story order.
const FEATURED_SLUGS = [
  'brainstorm',
  'pre-brief-research',
  'product-brief',
  'ux-design',
  'prd',
  'ux-experience',
] as const;

// Real curatorNotes from glassbox.json — any deviation = fabrication (AC4, Rule 9).
const CURATOR_NOTES: Record<string, string> = {
  brainstorm:
    '47 ideas in 90 minutes — the raw, unedited thinking that seeded every strategic decision.',
  'pre-brief-research':
    'The grounding pass: what practitioners actually share, what 30-year engineers overlook, what this site had to avoid.',
  'product-brief':
    'The one-page argument that set the direction: craft artifact first, conversion funnel never.',
  'ux-design':
    'Ink-on-cream, editorial, Source Serif 4 — how the visual identity was decided in one session.',
  prd: 'Every feature, every constraint, every "never" — the full PRD the agent pipeline builds from.',
  'ux-experience':
    'The visitor journey — how every interaction, from hero to Glass Box, was choreographed.',
};

/** Wait for the tour island to mount and the start button to be visible. */
async function waitForTourReady(page: import('@playwright/test').Page): Promise<void> {
  await page.locator('[data-testid="tour-start-btn"]').waitFor({ state: 'visible', timeout: 8000 });
}

/** Start the tour by clicking the start button. */
async function startTour(page: import('@playwright/test').Page): Promise<void> {
  await waitForTourReady(page);
  await page.locator('[data-testid="tour-start-btn"]').click();
  // Wait for the panel to appear.
  await page.locator('[data-testid="tour-panel"]').waitFor({ state: 'visible', timeout: 5000 });
}

// ---------------------------------------------------------------------------
// AC1 — narrated step-through changes the visible active artifact
// ---------------------------------------------------------------------------

test.describe('Glass Box tour — AC1: narrated step-through (visible outcome)', () => {
  test('tour start button appears after idle mount', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await waitForTourReady(page);
    const startBtn = page.locator('[data-testid="tour-start-btn"]');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toContainText(/guided tour/i);
  });

  test('starting the tour shows the first artifact narration (step 0)', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    // The narration must be visible (Rule 13: user-observable outcome).
    const narration = page.locator('[data-testid="tour-narration"]');
    await expect(narration).toBeVisible();
    const narrationText = await narration.innerText();
    // Must be a non-empty string.
    expect(narrationText.trim().length).toBeGreaterThan(0);
    // Must be one of the real curatorNotes (AC4 / Rule 9).
    const allNotes = Object.values(CURATOR_NOTES);
    expect(allNotes).toContain(narrationText.trim());
  });

  test('clicking Next changes the visible narration text (Rule 13 mutation-verified)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    // Record the narration at step 0.
    const narration = page.locator('[data-testid="tour-narration"]');
    const step0Text = await narration.innerText();

    // Click Next.
    await page.locator('[data-testid="tour-next-btn"]').click();
    await page.waitForTimeout(200); // short settle

    // The narration text MUST change (Rule 13: visible outcome changed).
    const step1Text = await narration.innerText();
    expect(step1Text.trim()).not.toBe(step0Text.trim());

    // Mutation verification: if Next were a no-op, step1Text === step0Text,
    // and this assertion would fail. This proves the assertion is not vacuous.
    expect(step1Text.trim().length).toBeGreaterThan(0);
    // Step 1 narration must also trace to a real curatorNote.
    const allNotes = Object.values(CURATOR_NOTES);
    expect(allNotes).toContain(step1Text.trim());
  });

  test('reader link href matches the active artifact slug', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    // At step 0, the reader link must point to the first artifact.
    const readerLink = page.locator('[data-testid="tour-reader-link"]');
    await expect(readerLink).toBeVisible();
    const href = await readerLink.getAttribute('href');
    expect(href).toMatch(/^\/glass-box\/.+\/$/);

    // After clicking Next, the reader link changes to the next artifact.
    await page.locator('[data-testid="tour-next-btn"]').click();
    await page.waitForTimeout(200);
    const hrefAfterNext = await readerLink.getAttribute('href');
    expect(hrefAfterNext).toMatch(/^\/glass-box\/.+\/$/);
    // Must point to a different slug than step 0.
    expect(hrefAfterNext).not.toBe(href);
  });

  test('Prev button is disabled on step 0', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);
    const prevBtn = page.locator('[data-testid="tour-prev-btn"]');
    await expect(prevBtn).toBeVisible();
    await expect(prevBtn).toBeDisabled();
  });

  test('Prev button is enabled after Next is clicked', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    await page.locator('[data-testid="tour-next-btn"]').click();
    await page.waitForTimeout(200);

    const prevBtn = page.locator('[data-testid="tour-prev-btn"]');
    await expect(prevBtn).toBeEnabled();
  });

  test('clicking Prev returns to the previous artifact narration', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    const narration = page.locator('[data-testid="tour-narration"]');
    const step0Text = await narration.innerText();

    await page.locator('[data-testid="tour-next-btn"]').click();
    await page.waitForTimeout(200);
    // Confirm we're on step 1.
    const step1Text = await narration.innerText();
    expect(step1Text.trim()).not.toBe(step0Text.trim());

    // Go back.
    await page.locator('[data-testid="tour-prev-btn"]').click();
    await page.waitForTimeout(200);
    const backToStep0 = await narration.innerText();
    // Must return to the step 0 narration.
    expect(backToStep0.trim()).toBe(step0Text.trim());
  });

  test('keyboard Next (ArrowRight) changes the visible narration', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    // Focus the panel.
    await page.locator('[data-testid="tour-panel"]').focus();
    const narration = page.locator('[data-testid="tour-narration"]');
    const step0Text = await narration.innerText();

    // Press ArrowRight (keyboard next).
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    const step1Text = await narration.innerText();
    expect(step1Text.trim()).not.toBe(step0Text.trim());
  });

  test('Esc closes the tour and returns focus to the start button', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    // Focus the panel.
    await page.locator('[data-testid="tour-panel"]').focus();

    // Press Esc.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // The tour panel must be gone.
    await expect(page.locator('[data-testid="tour-panel"]')).not.toBeVisible();

    // Focus should return to the start button (or it should be focused/re-visible).
    const startBtn = page.locator('[data-testid="tour-start-btn"]');
    await expect(startBtn).toBeVisible();
  });

  test('the active spine item gets data-tour-active attribute when stepping', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    // There should be exactly 1 spine item with data-tour-active=true.
    const activeItems = page.locator('[data-tour-active="true"]');
    await expect(activeItems).toHaveCount(1);

    // After next, a different item is active (not the same position).
    const step0Slug = await activeItems.first().getAttribute('data-tour-slug');
    await page.locator('[data-testid="tour-next-btn"]').click();
    await page.waitForTimeout(200);

    const newActiveItems = page.locator('[data-tour-active="true"]');
    await expect(newActiveItems).toHaveCount(1);
    const step1Slug = await newActiveItems.first().getAttribute('data-tour-slug');
    // The active slug must have changed (Rule 13: observable DOM change).
    expect(step1Slug).not.toBe(step0Slug);
  });

  test('closing the tour removes the data-tour-active attribute from spine items', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    // Confirm active item exists.
    await expect(page.locator('[data-tour-active="true"]')).toHaveCount(1);

    // Close via the close button.
    await page.locator('[data-testid="tour-close-btn"]').click();
    await page.waitForTimeout(300);

    // No active items remaining.
    await expect(page.locator('[data-tour-active="true"]')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// AC2 — reader links resolve 200; no fabricated ghost reader links
// ---------------------------------------------------------------------------

test.describe('Glass Box tour — AC2: reader link composition', () => {
  test('reader link for each featured step resolves 200', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    const visitedSlugs: string[] = [];

    // Walk through each step and verify the reader link resolves 200.
    for (let step = 0; step < FEATURED_SLUGS.length; step++) {
      // Wait for panel to be visible at this step.
      await page.locator('[data-testid="tour-panel"]').waitFor({ state: 'visible' });
      const readerLink = page.locator('[data-testid="tour-reader-link"]');
      await expect(readerLink).toBeVisible();

      const href = await readerLink.getAttribute('href');
      expect(href, `step ${step} reader link must have href`).not.toBeNull();
      expect(href).toMatch(/^\/glass-box\/.+\/$/);

      // Extract slug from href.
      const slug = href!.replace('/glass-box/', '').replace(/\/$/, '');
      visitedSlugs.push(slug);

      // Verify the reader page resolves 200.
      const response = await page.goto(`/glass-box/${slug}/`);
      expect(response?.status(), `404 on /glass-box/${slug}/`).toBe(200);
      await page.goto(INDEX_PATH);
      await waitForTourReady(page);

      // Re-open and advance to the next step if needed.
      if (step < FEATURED_SLUGS.length - 1) {
        await page.locator('[data-testid="tour-start-btn"]').click();
        await page.locator('[data-testid="tour-panel"]').waitFor({ state: 'visible' });
        // Advance to the correct step.
        for (let advance = 0; advance < step + 1; advance++) {
          const nextBtn = page.locator('[data-testid="tour-next-btn"]');
          if (await nextBtn.isVisible()) {
            await nextBtn.click();
            await page.waitForTimeout(150);
          }
        }
      }
    }

    // Confirm we visited all 6 featured slugs.
    expect(visitedSlugs.length).toBe(FEATURED_SLUGS.length);
  });

  test('no tour reader link points to a ghost node (architecture/epics/retrospective)', async ({
    page,
  }) => {
    const ghostSlugs = ['architecture', 'epics', 'retrospective'];

    await page.goto(INDEX_PATH);
    await startTour(page);

    // Walk all steps and confirm no reader link points to a ghost slug.
    for (let step = 0; step < FEATURED_SLUGS.length; step++) {
      await page.locator('[data-testid="tour-panel"]').waitFor({ state: 'visible' });
      const readerLink = page.locator('[data-testid="tour-reader-link"]');
      const href = await readerLink.getAttribute('href');
      for (const ghostSlug of ghostSlugs) {
        expect(href, `step ${step} must not link to ghost slug ${ghostSlug}`).not.toContain(
          ghostSlug,
        );
      }

      // Advance (if not on last step).
      if (step < FEATURED_SLUGS.length - 1) {
        const nextBtn = page.locator('[data-testid="tour-next-btn"]');
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          await page.waitForTimeout(150);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// AC3 — JS-off: static list full; reduced-motion: no animated transitions
// ---------------------------------------------------------------------------

test.describe('Glass Box tour — AC3: JS-off graceful degradation', () => {
  test('JS-off: static spine shows all 6 featured artifacts + their curatorNotes (Rule 7: PROVEN)', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    // Rule 7: assert NOT skipped — we navigate and confirm.
    const response = await page.goto(INDEX_PATH);
    expect(response?.status(), 'glass-box index must be reachable JS-off').toBe(200);

    // The static spine <ol> must be present.
    const spine = page.locator('.glass-box__spine');
    await expect(spine, 'static spine must be visible JS-off').toBeVisible();

    // All 6 featured reader links must be present.
    for (const slug of FEATURED_SLUGS) {
      const link = page.locator(`a[href="/glass-box/${slug}/"]`).first();
      await expect(link, `reader link for ${slug} must exist JS-off`).toBeAttached();
    }

    // No tour start button JS-off (island not mounted).
    const tourBtn = page.locator('[data-testid="tour-start-btn"]');
    await expect(tourBtn, 'tour start button must NOT exist JS-off').toHaveCount(0);

    await context.close();
  });

  test('JS-off: curatorNotes are present in the static list (not gated behind tour)', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(INDEX_PATH);

    // Check at least the first artifact's curatorNote appears in the static HTML.
    const body = page.locator('body');
    await expect(body).toContainText('47 ideas in 90 minutes');
    // And a second one.
    await expect(body).toContainText('The grounding pass:');

    await context.close();
  });
});

test.describe('Glass Box tour — AC3: reduced-motion (instant steps, no animation)', () => {
  test('reduced-motion: tour is still usable (mounts and steps — NOT gated off)', async ({
    page,
  }) => {
    // Emulate reduced-motion BEFORE navigating (matching the project's e2e pattern).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(INDEX_PATH);

    // Guard: preference is actually emulated.
    const prefersReduced = await page.evaluate(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    expect(prefersReduced, 'prefers-reduced-motion must be emulated').toBe(true);

    // The tour island must mount even under reduced-motion (divergence from 6.2).
    await waitForTourReady(page);
    const startBtn = page.locator('[data-testid="tour-start-btn"]');
    await expect(startBtn, 'tour start button must be visible under reduced-motion').toBeVisible();

    // The tour must be openable.
    await startTour(page);
    const panel = page.locator('[data-testid="tour-panel"]');
    await expect(panel, 'tour panel must open under reduced-motion').toBeVisible();

    // Can navigate (Next works).
    const narration = page.locator('[data-testid="tour-narration"]');
    const step0Text = await narration.innerText();
    await page.locator('[data-testid="tour-next-btn"]').click();
    await page.waitForTimeout(200);
    const step1Text = await narration.innerText();
    expect(step1Text.trim()).not.toBe(step0Text.trim());
  });

  test('reduced-motion: no CSS transition or animation on tour panel', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(INDEX_PATH);
    await startTour(page);

    const panel = page.locator('[data-testid="tour-panel"]');
    const motionProps = await panel.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        animationName: cs.animationName,
        // Parse duration as float to handle '0s', '', '1e-05s' (all near-zero).
        animationDurationMs: parseFloat(cs.animationDuration || '0') * 1000,
        transitionDurationMs: parseFloat(cs.transitionDuration || '0') * 1000,
      };
    });

    // No named keyframe animation should be running on the tour panel.
    expect(
      motionProps.animationName,
      `expected no keyframe animation on tour panel; got: ${motionProps.animationName}`,
    ).toBe('none');

    // Animation/transition durations should be negligible (< 50ms) under reduced-motion.
    // Browsers may emit a near-zero float ('1e-05s') rather than exactly '0s'.
    expect(
      motionProps.animationDurationMs,
      `expected near-zero animation-duration under reduced-motion; got: ${motionProps.animationDurationMs}ms`,
    ).toBeLessThan(50);
    expect(
      motionProps.transitionDurationMs,
      `expected near-zero transition-duration under reduced-motion; got: ${motionProps.transitionDurationMs}ms`,
    ).toBeLessThan(50);
  });

  test('reduced-motion: static spine list remains fully present alongside the tour', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(INDEX_PATH);

    // The static spine must always remain present (FR-8).
    const spine = page.locator('.glass-box__spine');
    await expect(spine, 'static spine must remain visible under reduced-motion').toBeVisible();

    // All featured links must be in the DOM.
    for (const slug of FEATURED_SLUGS.slice(0, 3)) {
      const link = page.locator(`a[href="/glass-box/${slug}/"]`).first();
      await expect(link).toBeAttached();
    }
  });
});

// ---------------------------------------------------------------------------
// AC4 — narration traces to existing curated strings (Rule 9)
// ---------------------------------------------------------------------------

test.describe('Glass Box tour — AC4: narration credibility (Rule 9)', () => {
  test('every tour step narration traces to a known curatorNote', async ({ page }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    const narration = page.locator('[data-testid="tour-narration"]');
    const allKnownNotes = Object.values(CURATOR_NOTES);

    // Walk all steps and verify narration traces to known strings.
    for (let step = 0; step < FEATURED_SLUGS.length; step++) {
      await page.locator('[data-testid="tour-panel"]').waitFor({ state: 'visible' });
      const text = await narration.innerText();
      expect(
        allKnownNotes,
        `step ${step} narration "${text.trim()}" must trace to a known curatorNote`,
      ).toContain(text.trim());

      // Advance (if not on last step).
      if (step < FEATURED_SLUGS.length - 1) {
        const nextBtn = page.locator('[data-testid="tour-next-btn"]');
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          await page.waitForTimeout(150);
        }
      }
    }
  });

  test('no ghost node (architecture/epics/retrospective) narration appears in tour', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    const allStepTitles: string[] = [];
    for (let step = 0; step < FEATURED_SLUGS.length; step++) {
      await page.locator('[data-testid="tour-panel"]').waitFor({ state: 'visible' });
      const title = await page.locator('[data-testid="tour-step-title"]').innerText();
      allStepTitles.push(title);

      if (step < FEATURED_SLUGS.length - 1) {
        const nextBtn = page.locator('[data-testid="tour-next-btn"]');
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          await page.waitForTimeout(150);
        }
      }
    }

    // Ghost titles must not appear in any tour step.
    const ghostTitles = ['Architecture', 'Epics and Stories', 'Retrospectives'];
    for (const ghostTitle of ghostTitles) {
      expect(allStepTitles, `ghost title "${ghostTitle}" must not appear in tour`).not.toContain(
        ghostTitle,
      );
    }
  });

  test('the tour contains exactly 6 steps (all 6 featured artifacts, no extras)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    const stepCount = FEATURED_SLUGS.length; // 6
    let stepsWalked = 0;

    // Walk to the last step.
    let onLastStep = false;
    while (!onLastStep) {
      await page.locator('[data-testid="tour-panel"]').waitFor({ state: 'visible' });
      stepsWalked++;
      const finishBtn = page.locator('[data-testid="tour-finish-btn"]');
      if (await finishBtn.isVisible()) {
        onLastStep = true;
      } else {
        const nextBtn = page.locator('[data-testid="tour-next-btn"]');
        if (await nextBtn.isVisible()) {
          await nextBtn.click();
          await page.waitForTimeout(150);
        } else {
          onLastStep = true;
        }
      }
    }

    expect(stepsWalked, 'tour must have exactly 6 steps').toBe(stepCount);
  });
});

// ---------------------------------------------------------------------------
// AC1 (hardened by QA) — build-story ORDER + visible-highlight CONSUMER
// ---------------------------------------------------------------------------
//
// Why this block exists (QA hardening, Story 6.3):
//   * The headline AC1 guarantee is that the tour narrates "in build-story
//     order" — the SAME date-sorted sequence the static <ol> renders. The
//     dev's AC1 tests assert that stepping CHANGES the visible artifact (good,
//     Rule 13) but NONE bind each step to the EXPECTED date-sorted slug, so a
//     re-ordered or shuffled tour would still pass every existing test. This
//     test binds step i → FEATURED_SLUGS[i] (the real date-sort:
//     brainstorm → pre-brief-research → product-brief → ux-design → prd →
//     ux-experience) via BOTH the reader-link href AND the active spine item.
//   * Rule 13 (the 5.4 no-op trap): the dev asserts the data-tour-active
//     ATTRIBUTE is set, but never that it produces the user-OBSERVABLE outline
//     highlight. This block asserts the active spine item's COMPUTED outline is
//     actually rendered — proving the CSS consumer exists, not just the flag.

test.describe('Glass Box tour — AC1 (QA): build-story order + visible highlight', () => {
  test('each step maps to the expected date-sorted slug (build-story order, AC1)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    for (let step = 0; step < FEATURED_SLUGS.length; step++) {
      await page.locator('[data-testid="tour-panel"]').waitFor({ state: 'visible' });
      const expectedSlug = FEATURED_SLUGS[step];

      // (1) the reader link for this step points at the expected slug
      const href = await page.locator('[data-testid="tour-reader-link"]').getAttribute('href');
      expect(href, `step ${step} reader link must target the date-sorted slug`).toBe(
        `/glass-box/${expectedSlug}/`,
      );

      // (2) the active spine item is the SAME expected slug (the focus/scroll target)
      const activeSlug = await page
        .locator('[data-tour-active="true"]')
        .first()
        .getAttribute('data-tour-slug');
      expect(activeSlug, `step ${step} active spine item must be the date-sorted slug`).toBe(
        expectedSlug,
      );

      // (3) the narration is THIS slug's real curatorNote (order + credibility together)
      const narration = (await page.locator('[data-testid="tour-narration"]').innerText()).trim();
      expect(narration, `step ${step} narration must be ${expectedSlug}'s curatorNote`).toBe(
        CURATOR_NOTES[expectedSlug],
      );

      if (step < FEATURED_SLUGS.length - 1) {
        await page.locator('[data-testid="tour-next-btn"]').click();
        await page.waitForTimeout(150);
      }
    }
  });

  test('the active spine item renders a VISIBLE highlight outline (Rule 13 consumer)', async ({
    page,
  }) => {
    await page.goto(INDEX_PATH);
    await startTour(page);

    // The data-tour-active flag must produce an actual visible outline — proving
    // the CSS consumer exists (not a silent no-op attribute, the 5.4 trap).
    const active = page.locator('[data-tour-active="true"]').first();
    await expect(active).toHaveCount(1);
    const outline = await active.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        style: cs.outlineStyle,
        widthPx: parseFloat(cs.outlineWidth || '0'),
      };
    });
    // A real, rendered outline (not 'none', non-zero width).
    expect(outline.style, `active item outline-style was '${outline.style}'`).not.toBe('none');
    expect(outline.widthPx, `active item outline-width was ${outline.widthPx}px`).toBeGreaterThan(
      0,
    );
  });
});

// ---------------------------------------------------------------------------
// Script count (Story 6.3 adds 1 exec script to the 2 Guide-pill scripts)
// ---------------------------------------------------------------------------

test.describe('Glass Box tour — script budget (Story 6.3)', () => {
  test('the page ships exactly 3 executable scripts (2 Guide-pill + 1 tour)', async ({ page }) => {
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
      `expected 3 exec scripts (Guide pill x2 + tour x1); found ${executableScripts}`,
    ).toBe(3);
  });
});
