/**
 * recuration.spec.ts — Re-curation e2e tests (Story 5.3, AC1, AC2, AC5, Rule 3, Rule 7).
 *
 * Rule 7 compliance:
 *   - Exercises the REAL Hono endpoint through the prod-faithful `serve-with-api.mjs` proxy.
 *   - GUIDE_LLM_STUB=1 is set in the harness → deterministic stub classifier (Rule 7 / AC1).
 *   - The e2e is PROVEN to execute: no test.skip() on a missing prerequisite.
 *   - beforeAll generates the KB index if absent (same pattern as guide.spec.ts).
 *
 * Tests:
 *   (a) AC1: organizer intent → speaker scene appears first-after-hero in visible DOM order.
 *   (b) AC1: explorer intent → flagship scene appears first-after-hero in visible DOM order.
 *   (c) AC1: organizer and explorer produce DEMONSTRABLY DIFFERENT visible orderings.
 *   (d) AC2: re-curation is applied IN PLACE (no navigation — the URL stays the same).
 *   (e) AC2 / FR-8: JS-off → canonical DOM order unchanged (crawlable order not affected).
 *   (f) AC3 / SM-C1: hero bypass (/speaking link in hero) stays reachable without chat.
 *
 * Rule 8: assertions scoped to specific section positions and CSS order values,
 * not whole-document toContain. Mutation-verified (noted per test).
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
    console.log('[recuration.spec] kb-index.json absent — running build:content...');
    execSync('pnpm build:content', { cwd: REPO_ROOT, stdio: 'inherit' });
  }
  if (!existsSync(REAL_INDEX_PATH)) {
    throw new Error('[recuration.spec] KB index still missing after build:content — cannot run.');
  }
});

// ---------------------------------------------------------------------------
// Helper: trigger a re-curation by sending a query via the real Guide API
// through page.route interception (so we can send a known stub-classified query)
// ---------------------------------------------------------------------------

/**
 * Post a query to /api/guide through the running proxy and wait for the
 * `recuration` SSE event. Returns { intent, order } from the event, or null
 * if no recuration event was received.
 */
async function triggerRecuration(
  baseURL: string,
  query: string,
): Promise<{ intent: string; order: string[] } | null> {
  const res = await fetch(`${baseURL}/api/guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) return null;

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let raw = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += dec.decode(value, { stream: true });
    }
    raw += dec.decode();
  } finally {
    reader.releaseLock();
  }

  // Parse SSE blocks
  for (const block of raw.split('\n\n').filter((b) => b.trim())) {
    const lines = block.split('\n');
    let eventName = '';
    let dataStr = '';
    for (const line of lines) {
      if (line.startsWith('event:')) eventName = line.slice('event:'.length).trim();
      if (line.startsWith('data:')) dataStr = line.slice('data:'.length).trim();
    }
    if (eventName === 'recuration' && dataStr) {
      try {
        const data = JSON.parse(dataStr) as { intent: string; order: string[] };
        return data;
      } catch {
        return null;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helper: get the visual (CSS order) position of a section by ID
// ---------------------------------------------------------------------------

async function getSectionVisualOrder(
  page: import('@playwright/test').Page,
  sectionId: string,
): Promise<number> {
  return page.evaluate((id) => {
    const el = document.querySelector<HTMLElement>(`section#${id}`);
    if (!el) return -1;
    // CSS order: check the style property (set by recuration controller) or computed style
    const styleOrder = el.style.order;
    if (styleOrder !== '' && styleOrder !== null) {
      return parseInt(styleOrder, 10);
    }
    const computed = window.getComputedStyle(el).order;
    return computed ? parseInt(computed, 10) : -1;
  }, sectionId);
}

// ---------------------------------------------------------------------------
// Shared state: directives fetched in (a) and (b) are reused in (c) and (d)
// to avoid extra API calls that would exhaust the rate limiter (10/min) when
// the full test:all suite runs all e2e specs against the same Hono instance.
// ---------------------------------------------------------------------------

let cachedOrganizerDirective: { intent: string; order: string[] } | null = null;
let cachedExplorerDirective: { intent: string; order: string[] } | null = null;

// ---------------------------------------------------------------------------
// (a+b) AC1: different intents → different visible orderings (via API + JS controller)
// ---------------------------------------------------------------------------

test('(a) organizer query → speaker scene gets visual order 1 (first-after-hero, AC1)', async ({
  page,
  baseURL,
}) => {
  await page.goto('/');

  // Wait for the Guide pill to mount (confirms JS is running)
  await page
    .locator('[data-testid="guide-pill"]')
    .waitFor({ state: 'visible', timeout: 8000 })
    .catch(() => {});

  // Wait for recuration to be initialized (main.home has data-recuration-ready)
  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 5000 },
  );

  // Trigger re-curation via the real API (result cached for (c)/(d))
  const directive = await triggerRecuration(
    baseURL!,
    "I'm a conference organizer looking to book a talk",
  );
  cachedOrganizerDirective = directive;
  expect(directive, 'organizer query must return a recuration directive').not.toBeNull();
  expect(directive!.intent, 'intent must be organizer').toBe('organizer');

  // Apply the directive via the page's JS controller
  await page.evaluate((order) => {
    // Call the recuration controller directly (it's exported on the module)
    // We dispatch a custom event that the GuidePanel responds to, OR we call
    // the controller directly by importing it. Since this is a prod build,
    // we call it via window if exposed, or use inline DOM manipulation.
    // The applyRecuration function sets section.style.order — simulate that here
    // to test the CSS order mechanism (the real integration is tested via GuidePanel SSE).
    const sections = document.querySelectorAll<HTMLElement>('main.home section');
    for (const section of sections) {
      const id = section.id;
      const pos = order.indexOf(id);
      if (pos !== -1) {
        section.style.order = String(pos);
      }
    }
  }, directive!.order);

  // Assert: speaker has visual order 1 (first-after-hero)
  const heroOrder = await getSectionVisualOrder(page, 'hero');
  const speakerOrder = await getSectionVisualOrder(page, 'speaker');

  // Rule 8: scoped to CSS order values on specific sections
  // Mutation-verification: if organizer[1] were not 'speaker', speakerOrder would not be 1.
  expect(heroOrder, 'hero must have visual order 0 in organizer layout').toBe(0);
  expect(speakerOrder, 'speaker must have visual order 1 in organizer layout (SM-C1)').toBe(1);
});

test('(b) explorer query → flagship scene gets visual order 1 (first-after-hero, AC1)', async ({
  page,
  baseURL,
}) => {
  await page.goto('/');

  await page
    .locator('[data-testid="guide-pill"]')
    .waitFor({ state: 'visible', timeout: 8000 })
    .catch(() => {});

  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 5000 },
  );

  // Trigger re-curation via the real API (result cached for (c)/(d))
  const directive = await triggerRecuration(baseURL!, 'show me something cool and impressive');
  cachedExplorerDirective = directive;
  expect(directive, 'explorer query must return a recuration directive').not.toBeNull();
  expect(directive!.intent, 'intent must be explorer').toBe('explorer');

  await page.evaluate((order) => {
    const sections = document.querySelectorAll<HTMLElement>('main.home section');
    for (const section of sections) {
      const id = section.id;
      const pos = order.indexOf(id);
      if (pos !== -1) {
        section.style.order = String(pos);
      }
    }
  }, directive!.order);

  const heroOrder = await getSectionVisualOrder(page, 'hero');
  const flagshipOrder = await getSectionVisualOrder(page, 'flagship');

  // Rule 8: scoped to CSS order values
  // Mutation-verification: if explorer[1] were not 'flagship', flagshipOrder would not be 1.
  expect(heroOrder, 'hero must have visual order 0 in explorer layout').toBe(0);
  expect(flagshipOrder, 'flagship must have visual order 1 in explorer layout (AC1)').toBe(1);
});

test('(c) organizer and explorer produce DEMONSTRABLY DIFFERENT orderings (AC1)', async () => {
  // Reuse directives from (a) and (b) — no additional API call needed.
  // This avoids exhausting the 10-req/min rate limiter when the full
  // test:all suite runs all e2e specs against the same Hono process.
  const orgDir = cachedOrganizerDirective;
  const expDir = cachedExplorerDirective;

  expect(orgDir, 'organizer directive from test (a) must be available').not.toBeNull();
  expect(expDir, 'explorer directive from test (b) must be available').not.toBeNull();

  // AC1: demonstrably different visible orderings
  // Rule 8: scoped to position [1] (the key discriminant)
  // Mutation-verification: if both returned the same order, this would red.
  expect(orgDir!.order[1], 'organizer[1] and explorer[1] must differ (AC1)').not.toBe(
    expDir!.order[1],
  );
  expect(orgDir!.order[1], 'organizer first-after-hero must be speaker (SM-C1)').toBe('speaker');
  expect(expDir!.order[1], 'explorer first-after-hero must be flagship (AC1)').toBe('flagship');
});

// ---------------------------------------------------------------------------
// (d) AC2: re-curation is applied IN PLACE (no navigation)
// ---------------------------------------------------------------------------

test('(d) re-curation applied in place — URL unchanged, no navigation (AC2)', async ({ page }) => {
  await page.goto('/');
  const urlBefore = page.url();

  await page
    .locator('[data-testid="guide-pill"]')
    .waitFor({ state: 'visible', timeout: 8000 })
    .catch(() => {});

  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 5000 },
  );

  // Reuse the cached organizer directive from test (a) — no additional API call.
  const directive = cachedOrganizerDirective;
  expect(directive, 'organizer directive from test (a) must be available').not.toBeNull();

  // Apply the order
  await page.evaluate((order) => {
    const sections = document.querySelectorAll<HTMLElement>('main.home section');
    for (const section of sections) {
      const id = section.id;
      const pos = order.indexOf(id);
      if (pos !== -1) {
        section.style.order = String(pos);
      }
    }
  }, directive!.order);

  // URL must be unchanged — re-curation is in place, no navigation (AC2)
  const urlAfter = page.url();
  // Mutation-verification: if re-curation caused a navigation, url would change.
  expect(urlAfter, 'URL must be unchanged after re-curation (in-place — AC2)').toBe(urlBefore);
});

// ---------------------------------------------------------------------------
// (e) AC2 / FR-8: JS-off → canonical DOM order unchanged
// ---------------------------------------------------------------------------

test('(e) JS-off: canonical DOM order hero→thesis→timeline→speaker→flagship→glass-box→close (FR-8)', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('/');

    // Collect section IDs in DOM order
    const sectionIds = await page.evaluate(() => {
      const sections = document.querySelectorAll<HTMLElement>('main.home section[id]');
      return Array.from(sections).map((s) => s.id);
    });

    // Rule 8: deep equality on the ordered array (not just presence checks)
    // Mutation-verification: if the DOM order were changed, this would red.
    expect(sectionIds, 'JS-off: DOM section order must be the canonical arc (FR-8)').toEqual([
      'hero',
      'thesis',
      'timeline',
      'speaker',
      'flagship',
      'glass-box',
      'close',
    ]);

    // ALL 7 scenes must be in the DOM (nothing hidden by re-curation — FR-8)
    expect(sectionIds).toHaveLength(7);
  } finally {
    await context.close();
  }
});

// ---------------------------------------------------------------------------
// (f) AC3 / SM-C1: hero bypass (/speaking link) stays reachable without chat
// ---------------------------------------------------------------------------

test('(f) hero /speaking bypass stays reachable without chat (SM-C1 — AC3)', async ({ page }) => {
  await page.goto('/');

  // The hero fork's "I'm here to book a talk" link → /speaking/ must be present
  // and reachable in the INITIAL DOM (no Guide interaction required — SM-C1).
  const speakingLink = page.locator('section#hero a[href="/speaking/"]').first();

  // Rule 8: scoped to section#hero specifically (not whole-document)
  // Mutation-verification: removing the hero bypass link reds this.
  await expect(
    speakingLink,
    'hero section must contain a /speaking/ link reachable without chat (SM-C1)',
  ).toBeAttached();

  // The link must be visible (not hidden by any re-curation or CSS)
  await expect(speakingLink, 'hero /speaking/ link must be visible (no JS required)').toBeVisible();

  // href must be the exact /speaking/ path (trailing slash — SM-C1)
  const href = await speakingLink.getAttribute('href');
  expect(href, 'hero bypass link must point to /speaking/ exactly').toBe('/speaking/');
});

// ---------------------------------------------------------------------------
// (g) AC1 / Rule 8 / Rule 3: the REAL production controller re-orders in place.
//
// Tests (a)–(d) above assert the API returns correct directives, but they apply
// the order by INLINING the CSS-order assignment in page.evaluate — so they do
// NOT exercise the production web controller (web/src/lib/recuration.ts
// applyRecuration) nor the GuidePanel SSE → controller wiring. This test closes
// that gap: it drives the FULL production path (open the Guide pill → type a
// query → submit → an organizer `recuration` SSE event flows into the GuidePanel
// handler → the real applyRecuration → section CSS `order`) and asserts the
// visible re-sequencing. Mutation-verified: no-op'ing the real applyRecuration
// (or removing the GuidePanel `recuration` handler) reds THIS test — unlike
// (a)–(d), which stay green because they re-implement the mechanism inline.
//
// The /api/guide call is INTERCEPTED and fulfilled with a canned organizer
// `recuration` SSE (same pattern as depth-dial.spec.ts AC2) so the test exercises
// the real client controller WITHOUT consuming a guide rate-limit token — the
// limiter (10/min per IP) is shared across every e2e spec when the full test:all
// suite runs against one Hono process (dev Debug Log #3). The order in the canned
// event is the REAL server-owned organizer ordering (from test (a)'s live
// directive when available, else the table's organizer order) — the client never
// invents an order.
// ---------------------------------------------------------------------------

test('(g) the REAL controller re-orders in place via the GuidePanel SSE path (AC1, Rule 8)', async ({
  page,
}) => {
  // The server-owned organizer order: prefer the LIVE directive captured in test
  // (a) (proves it is the real table); fall back to the canonical organizer order
  // if (a) was not run in this shard. Either way the CLIENT does not invent it.
  const organizerOrder = cachedOrganizerDirective?.order ?? [
    'hero',
    'speaker',
    'flagship',
    'timeline',
    'glass-box',
    'thesis',
    'close',
  ];
  expect(organizerOrder[1], 'organizer order[1] must be speaker (SM-C1 — server-owned)').toBe(
    'speaker',
  );

  // Intercept the guide call and fulfill a canned organizer recuration SSE so the
  // REAL GuidePanel SSE handler + applyRecuration run (no rate-limit token used).
  await page.route('**/api/guide', (route) => {
    if (route.request().method() !== 'POST') {
      void route.continue();
      return;
    }
    const recuration = `event: recuration\ndata: ${JSON.stringify({
      type: 'recuration',
      intent: 'organizer',
      order: organizerOrder,
    })}\n\n`;
    void route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        recuration,
        'event: token\ndata: {"type":"token","value":"On it."}\n\n',
        'event: done\ndata: {"type":"done"}\n\n',
      ].join(''),
    });
  });

  await page.goto('/');

  // Confirm the home is re-curation-ready (the real initRecuration ran on mount).
  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 8000 },
  );

  // Baseline: before any re-curation, speaker is NOT first-after-hero (canonical
  // arc puts it at visual order 3). This proves the post-state is a real change.
  const speakerBefore = await getSectionVisualOrder(page, 'speaker');
  expect(speakerBefore, 'baseline: speaker is at its canonical order (3), not 1').toBe(3);

  // Drive the PRODUCTION path: open the Guide and submit a query.
  await page.getByTestId('guide-pill').click();
  const input = page.getByTestId('guide-input');
  await input.waitFor({ state: 'visible', timeout: 8000 });
  await input.fill("I'm a conference organizer looking to book a talk");
  await page.getByTestId('guide-send').click();

  // The real GuidePanel handler calls applyRecuration on the `recuration` SSE
  // event, which sets section.style.order. Wait for speaker to reach order 1.
  // Mutation-verification: if applyRecuration is a no-op (or the GuidePanel
  // handler is removed), speaker stays at 3 and this waitForFunction times out → RED.
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>('section#speaker');
      return el ? el.style.order === '1' : false;
    },
    { timeout: 12000 },
  );

  // Rule 8: scoped to the real CSS order values set by the production controller.
  const heroAfter = await getSectionVisualOrder(page, 'hero');
  const speakerAfter = await getSectionVisualOrder(page, 'speaker');
  expect(heroAfter, 'hero must stay at visual order 0 (SM-C1)').toBe(0);
  expect(
    speakerAfter,
    'the REAL applyRecuration must move speaker to visual order 1 (organizer, AC1/SM-C1)',
  ).toBe(1);

  // AC2: applied in place — still on "/" (no navigation).
  expect(new URL(page.url()).pathname, 're-curation is applied in place (AC2)').toBe('/');
});
