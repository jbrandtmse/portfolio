/**
 * featured-work.spec.ts — E2e tests for Story 7.2 (FR-25).
 *
 * Rule 7 compliance:
 *   - Exercises the REAL Hono endpoint through the prod-faithful `serve-with-api.mjs` proxy.
 *   - GUIDE_LLM_STUB=1 is set in the harness → deterministic stub classifier.
 *   - No test.skip() on a missing prerequisite (KB index generated if absent).
 *
 * AC1 (Story 7.2): the home page renders the featured-work section with the
 *   curated default order in the DOM (FR-8 crawlable order).
 *
 * AC2 (Story 7.2): the Guide reorders the featured-work items via CSS `order`
 *   on a stated interest — the VISIBLE (computed CSS order) changes.
 *   Rule 13: asserts the USER-OBSERVABLE result (measured CSS order values
 *   changing), not merely that a property was set.
 *   Mutation-verification: removing the featured-work reorder from applyRecuration
 *   → CSS order stays 0 for all items → this test reds.
 *
 * AC2 / FR-8: the DOM order of featured items stays the curated default
 *   even after a Guide reorder (only CSS `order` changes, not DOM order).
 *
 * AC3 (#25): the home page has a featured-work section (curated, not a CV).
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..', '..');
const REAL_INDEX_PATH = join(REPO_ROOT, 'api', 'data', 'kb-index.json');

// ---------------------------------------------------------------------------
// KB index prerequisite (Rule 7 — do NOT skip; generate if needed)
// ---------------------------------------------------------------------------

test.beforeAll(() => {
  if (!existsSync(REAL_INDEX_PATH)) {
    console.log('[featured-work.spec] kb-index.json absent — running build:content...');
    execSync('pnpm build:content', { cwd: REPO_ROOT, stdio: 'inherit' });
  }
  if (!existsSync(REAL_INDEX_PATH)) {
    throw new Error(
      '[featured-work.spec] KB index still missing after build:content — cannot run.',
    );
  }
});

// ---------------------------------------------------------------------------
// Helper: get the CSS `order` of a featured-work item by slug
// ---------------------------------------------------------------------------

async function getFeaturedItemOrder(
  page: import('@playwright/test').Page,
  slug: string,
): Promise<number> {
  return page.evaluate((s) => {
    const item = document.querySelector<HTMLElement>(
      `[data-featured-work-list] [data-featured-slug="${s}"]`,
    );
    if (!item) return -1;
    const styleOrder = item.style.order;
    if (styleOrder !== '' && styleOrder !== null) {
      return parseInt(styleOrder, 10);
    }
    const computed = window.getComputedStyle(item).order;
    return computed ? parseInt(computed, 10) : -1;
  }, slug);
}

// ---------------------------------------------------------------------------
// AC1: featured-work section is present and crawlable (JS off, default order)
// ---------------------------------------------------------------------------

test('AC1: home featured-work section is present with all 4 items in DOM (JS off — FR-8)', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('/');

    // The featured-work section must be in the DOM (present + followable, JS off).
    // Rule 8: scoped to #featured-work section.
    // Mutation-verification: removing the section reds this.
    await expect(
      page.locator('section#featured-work'),
      'AC1: #featured-work section must be present in JS-off DOM',
    ).toBeAttached();

    // All 7 featured items must be present (post-Epic-7 polish: 3 playables added).
    const FEATURED_SLUGS = [
      'loandemo',
      'vector-wars',
      'voyager',
      'christmas-elves',
      'portfolio',
      'guide',
      'music',
    ];
    for (const slug of FEATURED_SLUGS) {
      await expect(
        page.locator(`[data-featured-slug="${slug}"]`),
        `AC1: featured item "${slug}" must be present in JS-off DOM`,
      ).toBeAttached();
    }

    // Live items must have real <a href> links (followable JS-off).
    const liveItems: { slug: string; href: string }[] = [
      { slug: 'loandemo', href: '/work/loandemo/' },
      { slug: 'vector-wars', href: '/work/vector-wars/' },
      { slug: 'voyager', href: '/work/voyager/' },
      { slug: 'christmas-elves', href: '/work/christmas-elves/' },
      { slug: 'portfolio', href: '/glass-box/' },
      { slug: 'guide', href: '/faq/' },
    ];
    for (const { slug, href } of liveItems) {
      const link = page.locator(`[data-featured-slug="${slug}"] a[href="${href}"]`);
      await expect(
        link,
        `AC1: live item "${slug}" must have a real followable link to "${href}"`,
      ).toBeAttached();
    }
  } finally {
    await context.close();
  }
});

test('AC1: curated DOM order (loandemo first, music last — FR-8 crawlable default)', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('/');

    // Collect the slugs in DOM order (the curated default).
    const domOrder = await page.evaluate(() => {
      const items = document.querySelectorAll<HTMLElement>(
        '[data-featured-work-list] [data-featured-slug]',
      );
      return Array.from(items).map((el) => el.getAttribute('data-featured-slug') ?? '');
    });

    // FR-8: DOM order must be the curated default (7-item set, post-Epic-7 polish).
    // Rule 8: deep equality on the ordered array.
    // Mutation-verification: reordering FEATURED_WORK in content/featured-work.ts → reds this.
    expect(domOrder, 'FR-8: featured-work DOM order must be the curated default').toEqual([
      'loandemo',
      'vector-wars',
      'voyager',
      'christmas-elves',
      'portfolio',
      'guide',
      'music',
    ]);
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// AC2: Guide reorders featured-work items via CSS `order` (Rule 13 — visible)
//
// Rule 13: assert the USER-OBSERVABLE result (measured CSS order values changing)
// not merely that a property was set on an element.
//
// We intercept the /api/guide call with a canned `builder` recuration event
// (includes featuredOrder: ['portfolio', 'guide', 'loandemo', 'music'] from the
// server table) and drive the REAL GuidePanel → applyRecuration path.
// The test asserts that the CSS `order` values on the items actually change
// (portfolio gets order=0, loandemo gets order=2) from the default.
//
// Mutation-verification: removing the featured-work reorder block from
// applyRecuration (web/src/lib/recuration.ts) → CSS order stays 0 for all
// items (unchanged from init) → this test reds.
// ---------------------------------------------------------------------------

test('AC2: builder intent reorders featured-work via CSS order (Rule 13 — visible change)', async ({
  page,
}) => {
  // The server-owned builder featuredOrder from INTENT_FEATURED_ORDER_TABLE (7 slugs).
  const builderFeaturedOrder = [
    'vector-wars',
    'voyager',
    'loandemo',
    'portfolio',
    'guide',
    'christmas-elves',
    'music',
  ];
  // Also provide the scene order for the canned event.
  const builderSceneOrder = [
    'hero',
    'glass-box',
    'flagship',
    'thesis',
    'timeline',
    'speaker',
    'close',
  ];

  // Intercept the guide call with a canned builder recuration SSE.
  await page.route('**/api/guide', (route) => {
    if (route.request().method() !== 'POST') {
      void route.continue();
      return;
    }
    void route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        `event: recuration\ndata: ${JSON.stringify({
          type: 'recuration',
          intent: 'builder',
          order: builderSceneOrder,
          deepen: ['glass-box', 'flagship'],
          skip: ['timeline', 'speaker'],
          featuredOrder: builderFeaturedOrder,
        })}\n\n`,
        'event: token\ndata: {"type":"token","value":"Here are the builder picks."}\n\n',
        'event: done\ndata: {"type":"done"}\n\n',
      ].join(''),
    });
  });

  await page.goto('/');

  // Wait for re-curation init.
  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 8000 },
  );

  // Baseline: before any reorder, all items have default CSS order (or none set).
  // The featured list uses a flex container — without explicit order, DOM order applies.
  // We confirm portfolio is NOT at position 0 in CSS order before the Guide fires.
  // (initRecuration only initializes scene sections, not featured-work items.)

  // Drive the REAL production path.
  await page.getByTestId('guide-pill').click();
  const input = page.getByTestId('guide-input');
  await input.waitFor({ state: 'visible', timeout: 8000 });
  await input.fill('I want to see the technical build and the glass box');
  await page.getByTestId('guide-send').click();

  // Wait for applyRecuration to process the builder scene order (glass-box → order 1).
  // This confirms the SSE event was processed (the scene reorder is a parallel signal).
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>('section#glass-box');
      return el ? el.style.order === '1' : false;
    },
    { timeout: 12000 },
  );

  // Now assert the VISIBLE featured-work reorder (Rule 13 — observable outcome).
  // builder order: vector-wars(0), voyager(1), loandemo(2), portfolio(3), guide(4), christmas-elves(5), music(6).
  //
  // Rule 8: scoped to specific item CSS order values.
  // Mutation-verification: removing the featured-work block from applyRecuration
  // → vector-wars stays at '' (no style.order set) → this reds.
  const vectorWarsOrder = await getFeaturedItemOrder(page, 'vector-wars');
  const voyagerOrder = await getFeaturedItemOrder(page, 'voyager');
  const loandemoOrder = await getFeaturedItemOrder(page, 'loandemo');
  const portfolioOrder = await getFeaturedItemOrder(page, 'portfolio');
  const guideOrder = await getFeaturedItemOrder(page, 'guide');
  const christmasElvesOrder = await getFeaturedItemOrder(page, 'christmas-elves');
  const musicOrder = await getFeaturedItemOrder(page, 'music');

  expect(
    vectorWarsOrder,
    'builder: vector-wars must be at CSS order 0 (first in builder view)',
  ).toBe(0);
  expect(voyagerOrder, 'builder: voyager must be at CSS order 1').toBe(1);
  expect(loandemoOrder, 'builder: loandemo must be at CSS order 2').toBe(2);
  expect(portfolioOrder, 'builder: portfolio must be at CSS order 3').toBe(3);
  expect(guideOrder, 'builder: guide must be at CSS order 4').toBe(4);
  expect(christmasElvesOrder, 'builder: christmas-elves must be at CSS order 5').toBe(5);
  expect(musicOrder, 'builder: music must be at CSS order 6 (last)').toBe(6);
});

// ---------------------------------------------------------------------------
// AC2 / FR-8: DOM order of featured items stays the curated default after reorder
// ---------------------------------------------------------------------------

test('AC2 / FR-8: DOM order stays curated default after CSS order reorder', async ({ page }) => {
  const builderSceneOrder = [
    'hero',
    'glass-box',
    'flagship',
    'thesis',
    'timeline',
    'speaker',
    'close',
  ];
  const builderFeaturedOrder = [
    'vector-wars',
    'voyager',
    'loandemo',
    'portfolio',
    'guide',
    'christmas-elves',
    'music',
  ];

  await page.route('**/api/guide', (route) => {
    if (route.request().method() !== 'POST') {
      void route.continue();
      return;
    }
    void route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        `event: recuration\ndata: ${JSON.stringify({
          type: 'recuration',
          intent: 'builder',
          order: builderSceneOrder,
          deepen: ['glass-box', 'flagship'],
          skip: ['timeline', 'speaker'],
          featuredOrder: builderFeaturedOrder,
        })}\n\n`,
        'event: done\ndata: {"type":"done"}\n\n',
      ].join(''),
    });
  });

  await page.goto('/');
  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 8000 },
  );

  await page.getByTestId('guide-pill').click();
  await page.getByTestId('guide-input').waitFor({ state: 'visible', timeout: 8000 });
  await page.getByTestId('guide-input').fill('I want to see the glass box');
  await page.getByTestId('guide-send').click();

  // Wait for the scene reorder (glass-box → order 1 confirms SSE processed).
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>('section#glass-box');
      return el ? el.style.order === '1' : false;
    },
    { timeout: 12000 },
  );

  // Now check the DOM order of featured items — must still be the curated default.
  // FR-8: CSS `order` changes the VISUAL order, NOT the DOM order.
  // Rule 8: deep equality on the DOM slug order (not CSS order).
  // Mutation-verification: if applyRecuration moved items in the DOM, this reds.
  const domOrder = await page.evaluate(() => {
    const items = document.querySelectorAll<HTMLElement>(
      '[data-featured-work-list] [data-featured-slug]',
    );
    return Array.from(items).map((el) => el.getAttribute('data-featured-slug') ?? '');
  });

  expect(
    domOrder,
    'FR-8: featured-work DOM order must stay the curated default after CSS reorder',
  ).toEqual([
    'loandemo',
    'vector-wars',
    'voyager',
    'christmas-elves',
    'portfolio',
    'guide',
    'music',
  ]);
});

// ---------------------------------------------------------------------------
// COMPOSITION GUARD (QA, Story 7.2) — the new #featured-work section must HOLD
// its curated slot in the reorderable flex column and NOT visibly jump.
//
// Helper: the visual (bounding-box top) order of the home <section> ids.
// ---------------------------------------------------------------------------

async function visualSectionOrder(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const secs = Array.from(document.querySelectorAll<HTMLElement>('main.home > section[id]'));
    return secs
      .map((s) => ({ id: s.id, top: s.getBoundingClientRect().top }))
      .sort((a, b) => a.top - b.top)
      .map((m) => m.id);
  });
}

// ---------------------------------------------------------------------------
// COMPOSITION 1 — on a PLAIN JS-on load (no Guide interaction), #featured-work
// holds its curated slot (immediately after #thesis), matching the JS-off
// crawlable order. This catches the order-0 collision: initRecuration sets an
// explicit flex `order` (0..6) on the 7 scenes but #featured-work is not a scene;
// left at the flex default order:0 it would TIE with #hero (order 0) and — the
// flex tie broken by DOM order — jump to visual position 2 (right after hero),
// breaking the curated default arc on EVERY JS-on render. The pin fix
// (pinFeaturedWorkSection in web/src/lib/recuration.ts) gives it thesis's order so
// it trails thesis instead.
//
// Rule 13: asserts the USER-OBSERVABLE visual order (bounding-box), not an
// attribute. Mutation-verification: remove the pinFeaturedWorkSection call in
// initRecuration → #featured-work jumps to right-after-hero → this reds.
// ---------------------------------------------------------------------------

test('COMPOSITION: plain JS-on load holds #featured-work after #thesis (no order-0 collision with hero — Rule 13)', async ({
  page,
}) => {
  await page.goto('/');

  // Let the GuidePanel hydrate and initRecuration run (sets scene CSS order).
  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 8000 },
  );
  // Small settle for the layout to reflect the applied order.
  await page.waitForTimeout(200);

  const order = await visualSectionOrder(page);

  // The curated default visual arc — #featured-work sits between #thesis and
  // #timeline (its DOM slot), NOT jumped up to right-after-hero.
  // Mutation-verification: dropping the init pin → order becomes
  // [hero, featured-work, thesis, ...] → this reds.
  expect(
    order,
    'JS-on default load: #featured-work must hold its curated slot (after #thesis), not collide at order 0 with #hero',
  ).toEqual([
    'hero',
    'thesis',
    'featured-work',
    'timeline',
    'speaker',
    'flagship',
    'glass-box',
    'close',
  ]);

  // Scoped, explicit collision assertion: #featured-work is immediately after
  // #thesis, and is NOT at index 1 (right after hero — the collision symptom).
  const fwIdx = order.indexOf('featured-work');
  expect(order[fwIdx - 1], '#featured-work must be immediately preceded by #thesis').toBe('thesis');
  expect(fwIdx, '#featured-work must NOT jump to visual position 1 (right after hero)').not.toBe(1);
});

// ---------------------------------------------------------------------------
// COMPOSITION 2 — after an ORGANIZER scene re-curation (the existing 5.x scene
// reorder, driven through the REAL GuidePanel SSE → applyRecuration path),
// #featured-work STILL does not collide with #hero at order 0 and STILL trails
// #thesis (it holds a stable, predictable slot rather than jumping above thesis
// or to right-after-hero). This is the lead-flagged composition side effect.
//
// Rule 13: measured visual (bounding-box) order. Mutation-verification: remove
// the re-pin in applyRecuration step (1) → #featured-work (order from init = 1)
// ties with the organizer scene now at order 1 (speaker) instead of trailing
// thesis → its visual position changes (no longer immediately after thesis) →
// this reds.
// ---------------------------------------------------------------------------

test('COMPOSITION: #featured-work holds a stable slot (trails #thesis, no hero collision) across an organizer scene re-curation (Rule 13)', async ({
  page,
}) => {
  const organizerSceneOrder = [
    'hero',
    'speaker',
    'flagship',
    'timeline',
    'glass-box',
    'thesis',
    'close',
  ];
  const organizerFeaturedOrder = [
    'guide',
    'portfolio',
    'loandemo',
    'christmas-elves',
    'voyager',
    'vector-wars',
    'music',
  ];

  await page.route('**/api/guide', (route) => {
    if (route.request().method() !== 'POST') {
      void route.continue();
      return;
    }
    void route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        `event: recuration\ndata: ${JSON.stringify({
          type: 'recuration',
          intent: 'organizer',
          order: organizerSceneOrder,
          deepen: ['speaker', 'flagship'],
          skip: ['thesis', 'timeline'],
          featuredOrder: organizerFeaturedOrder,
        })}\n\n`,
        'event: token\ndata: {"type":"token","value":"On it."}\n\n',
        'event: done\ndata: {"type":"done"}\n\n',
      ].join(''),
    });
  });

  await page.goto('/');
  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 8000 },
  );

  // Drive the REAL production path (organizer scene re-curation).
  await page.getByTestId('guide-pill').click();
  const input = page.getByTestId('guide-input');
  await input.waitFor({ state: 'visible', timeout: 8000 });
  await input.fill("I'm a conference organizer looking to book a talk");
  await page.getByTestId('guide-send').click();

  // Wait for the organizer scene reorder to apply (speaker → order 1).
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>('section#speaker');
      return el ? el.style.order === '1' : false;
    },
    { timeout: 12000 },
  );
  await page.waitForTimeout(200);

  const order = await visualSectionOrder(page);
  const fwIdx = order.indexOf('featured-work');

  // The composition guarantee: #featured-work never collides with #hero at order
  // 0 (never jumps to right-after-hero) and holds a stable slot trailing #thesis.
  // Mutation-verification: removing the applyRecuration re-pin → #featured-work
  // no longer trails thesis (it stays at the init order, colliding with whatever
  // scene now holds that order) → these red.
  expect(fwIdx, '#featured-work must NOT be at visual position 1 (right after hero)').not.toBe(1);
  expect(
    order[fwIdx - 1],
    '#featured-work must trail #thesis (its stable, non-jumping slot) after an organizer re-curation',
  ).toBe('thesis');

  // The 7 real scenes + featured-work are all present (FR-8 — nothing removed).
  expect(order, 'all 8 sections present after re-curation').toHaveLength(8);
});

// ---------------------------------------------------------------------------
// AC3 (#25): home has a featured-work section (curated, not a CV)
// ---------------------------------------------------------------------------

test('AC3 (#25): home page has the curated featured-work section (not a reverse-chron CV)', async ({
  page,
}) => {
  await page.goto('/');

  // The featured-work section must be present with all 4 items.
  // This is the #25 guarantee: the primary work surface is curated, not a CV list.
  // Rule 8: scoped to the specific section + items.
  // Mutation-verification: removing the section → the curated primary surface disappears → reds.
  await expect(
    page.locator('section#featured-work'),
    '#25: home must have a curated #featured-work section as the primary work surface',
  ).toBeAttached();

  const featuredItems = page.locator('[data-featured-work-list] [data-featured-slug]');
  await expect(
    featuredItems,
    '#25: featured-work must have exactly 7 items (post-Epic-7 polish)',
  ).toHaveCount(7);

  // The section heading must be present (curated, labeled clearly).
  await expect(
    page.locator('#featured-work-title'),
    '#25: featured-work section must have a heading',
  ).toBeAttached();
});
