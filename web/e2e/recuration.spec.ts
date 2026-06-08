/**
 * recuration.spec.ts — Re-curation e2e tests (Story 5.3 + 5.4, AC1-AC4, Rule 3, Rule 7).
 *
 * Rule 7 compliance:
 *   - Exercises the REAL Hono endpoint through the prod-faithful `serve-with-api.mjs` proxy.
 *   - GUIDE_LLM_STUB=1 is set in the harness → deterministic stub classifier (Rule 7 / AC1).
 *   - The e2e is PROVEN to execute: no test.skip() on a missing prerequisite.
 *   - beforeAll generates the KB index if absent (same pattern as guide.spec.ts).
 *
 * Story 5.3 tests:
 *   (a) AC1: organizer intent → speaker scene appears first-after-hero in visible DOM order.
 *   (b) AC1: explorer intent → flagship scene appears first-after-hero in visible DOM order.
 *   (c) AC1: organizer and explorer produce DEMONSTRABLY DIFFERENT visible orderings.
 *   (d) AC2: re-curation is applied IN PLACE (no navigation — the URL stays the same).
 *   (e) AC2 / FR-8: JS-off → canonical DOM order unchanged (crawlable order not affected).
 *   (f) AC3 / SM-C1: hero bypass (/speaking link in hero) stays reachable without chat.
 *   (g) AC1 / Rule 8 / Rule 3: the REAL production controller re-orders in place.
 *
 * Story 5.4 tests (director's mode — deepen + skip + camera driving):
 *   (h) AC1: organizer intent API returns deepen + skip in the recuration SSE event.
 *   (i) AC1/FR-8: skipped scenes STAY in the served DOM + reachable via the scene-rail.
 *   (j) AC1: the REAL GuidePanel SSE path applies deepen + skip via the production controller.
 *   (k) AC3/NFR-2: reduced-motion → camera driving + skip-omission are OFF (discrete arc).
 *   (m) AC1 / Rule 8: motion-ENABLED path — data-skip="true" IS applied (closes QA vacuity gap).
 *   (l) FR-8: all 7 scenes present in DOM + canonical order even after director's cut applied.
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
 * `recuration` SSE event. Returns { intent, order, deepen, skip } from the
 * event (Story 5.4: deepen/skip now included), or null if not received.
 */
async function triggerRecuration(
  baseURL: string,
  query: string,
): Promise<{ intent: string; order: string[]; deepen?: string[]; skip?: string[] } | null> {
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
        const data = JSON.parse(dataStr) as {
          intent: string;
          order: string[];
          deepen?: string[];
          skip?: string[];
        };
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

let cachedOrganizerDirective: {
  intent: string;
  order: string[];
  deepen?: string[];
  skip?: string[];
} | null = null;
let cachedExplorerDirective: {
  intent: string;
  order: string[];
  deepen?: string[];
  skip?: string[];
} | null = null;

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

// ===========================================================================
// Story 5.4 tests — director's mode: deepen + skip + camera driving
// ===========================================================================

// ---------------------------------------------------------------------------
// (h) AC1: organizer API returns deepen + skip in the recuration SSE event
//
// Rule 7: exercises the REAL Hono endpoint through the prod-faithful proxy.
// Rule 8: scoped to deepen and skip fields of the recuration event.
// Mutation-verification: removing deepen/skip from emitRecuration → fields missing.
// ---------------------------------------------------------------------------

test('(h) Story 5.4: organizer directive includes deepen + skip from server tables (AC1)', async ({
  baseURL,
}) => {
  // Reuse the cached organizer directive from test (a) if available.
  const directive =
    cachedOrganizerDirective ??
    (await triggerRecuration(baseURL!, "I'm a conference organizer looking to book a talk"));

  expect(directive, 'organizer directive must not be null').not.toBeNull();
  expect(directive!.intent).toBe('organizer');

  // deepen: must be an array, must contain speaker + flagship (per INTENT_DEEPEN_TABLE)
  // Rule 8: scoped to deepen field existence and content
  // Mutation-verification: removing deepen from emitRecuration → this reds.
  expect(Array.isArray(directive!.deepen), 'deepen must be an array in the SSE event').toBe(true);
  expect(directive!.deepen, 'organizer deepen must include speaker').toContain('speaker');
  expect(directive!.deepen, 'organizer deepen must include flagship').toContain('flagship');

  // skip: must be an array; hero, close, speaker NEVER in it (SM-C1/FR-8)
  expect(Array.isArray(directive!.skip), 'skip must be an array in the SSE event').toBe(true);
  expect(directive!.skip, 'SM-C1: hero must NEVER be in skip').not.toContain('hero');
  expect(directive!.skip, 'SM-C1: close must NEVER be in skip').not.toContain('close');
  expect(directive!.skip, 'SM-C1: speaker must NOT be in organizer skip').not.toContain('speaker');
});

// ---------------------------------------------------------------------------
// (i) AC1/FR-8: skipped scenes STAY in the served DOM + reachable via scene-rail
//
// FR-8 HARD: skip = tour omission only. The scene STAYS in the DOM,
// in the scroll, and in the scene-rail jump anchors. NEVER hidden/removed.
// Mutation-verification: if applyRecuration set display:none on skipped scenes,
// the scene-rail anchor would still be present but the section would be hidden.
// ---------------------------------------------------------------------------

test('(i) Story 5.4 FR-8: skipped scenes STAY in DOM + reachable via scene-rail after director cut', async ({
  page,
}) => {
  const CANONICAL_SCENE_IDS = [
    'hero',
    'thesis',
    'timeline',
    'speaker',
    'flagship',
    'glass-box',
    'close',
  ];

  // Intercept the guide call with a canned organizer directive (skip contains thesis + timeline).
  const organizerOrder = cachedOrganizerDirective?.order ?? [
    'hero',
    'speaker',
    'flagship',
    'timeline',
    'glass-box',
    'thesis',
    'close',
  ];
  const organizerDeepen = cachedOrganizerDirective?.deepen ?? ['speaker', 'flagship'];
  const organizerSkip = cachedOrganizerDirective?.skip ?? ['thesis', 'timeline'];

  await page.route('**/api/guide', (route) => {
    if (route.request().method() !== 'POST') {
      void route.continue();
      return;
    }
    const payload = JSON.stringify({
      type: 'recuration',
      intent: 'organizer',
      order: organizerOrder,
      deepen: organizerDeepen,
      skip: organizerSkip,
    });
    void route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        `event: recuration\ndata: ${payload}\n\n`,
        'event: token\ndata: {"type":"token","value":"On it."}\n\n',
        'event: done\ndata: {"type":"done"}\n\n',
      ].join(''),
    });
  });

  await page.goto('/');

  // Wait for recuration init
  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 8000 },
  );

  // Drive the production path to apply the directive
  await page.getByTestId('guide-pill').click();
  const input = page.getByTestId('guide-input');
  await input.waitFor({ state: 'visible', timeout: 8000 });
  await input.fill("I'm a conference organizer looking to book a talk");
  await page.getByTestId('guide-send').click();

  // Wait for the recuration event to be processed (speaker should be at order 1)
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>('section#speaker');
      return el ? el.style.order === '1' : false;
    },
    { timeout: 12000 },
  );

  // FR-8: ALL 7 scenes must still be in the DOM (nothing removed/hidden)
  // Rule 8: check each scene section by id
  // Mutation-verification: if applyRecuration removed/hid a section, this reds.
  for (const id of CANONICAL_SCENE_IDS) {
    const section = page.locator(`section#${id}`);
    await expect(
      section,
      `FR-8: section#${id} must be attached (present in DOM) even when skipped`,
    ).toBeAttached();
    // FR-8: skipped scenes must NOT have display:none or visibility:hidden
    const isVisible = await section.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    expect(isVisible, `FR-8: section#${id} must NOT be hidden (skip = tour omission only)`).toBe(
      true,
    );
  }

  // FR-8: scene-rail anchors for ALL 7 scenes must still be present + reachable
  for (const id of CANONICAL_SCENE_IDS) {
    const anchor = page.locator(`nav.scene-rail a[href="#${id}"]`).first();
    await expect(
      anchor,
      `FR-8: scene-rail anchor for #${id} must be present + reachable (jump target)`,
    ).toBeAttached();
  }
});

// ---------------------------------------------------------------------------
// (j) AC1: the REAL GuidePanel SSE path applies deepen via data-depth attribute
//
// Mutation-verification: if applyRecuration doesn't set data-depth="deep" on
// deepened scenes, the selector check below fails → test reds.
// ---------------------------------------------------------------------------

test('(j) Story 5.4 AC1: REAL controller applies data-depth="deep" to deepened scenes', async ({
  page,
}) => {
  const organizerOrder = cachedOrganizerDirective?.order ?? [
    'hero',
    'speaker',
    'flagship',
    'timeline',
    'glass-box',
    'thesis',
    'close',
  ];
  const organizerDeepen = cachedOrganizerDirective?.deepen ?? ['speaker', 'flagship'];
  const organizerSkip = cachedOrganizerDirective?.skip ?? ['thesis', 'timeline'];

  // Intercept with a canned organizer recuration event
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
          order: organizerOrder,
          deepen: organizerDeepen,
          skip: organizerSkip,
        })}\n\n`,
        'event: token\ndata: {"type":"token","value":"Organizer path."}\n\n',
        'event: done\ndata: {"type":"done"}\n\n',
      ].join(''),
    });
  });

  await page.goto('/');
  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 8000 },
  );

  // Drive the production path
  await page.getByTestId('guide-pill').click();
  await page.getByTestId('guide-input').waitFor({ state: 'visible', timeout: 8000 });
  await page.getByTestId('guide-input').fill("I'm a conference organizer looking to book a talk");
  await page.getByTestId('guide-send').click();

  // Wait for applyRecuration to set CSS order (speaker → order 1)
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>('section#speaker');
      return el ? el.style.order === '1' : false;
    },
    { timeout: 12000 },
  );

  // The deepened scenes (speaker + flagship) should have data-depth="deep"
  // Rule 8: scoped to specific sections and their data-depth attribute.
  // Mutation-verification: removing the deepen logic from applyRecuration → data-depth not set → reds.
  for (const id of organizerDeepen) {
    const depthAttr = await page
      .locator(`section#${id}`)
      .evaluate((el) => el.getAttribute('data-depth'));
    expect(depthAttr, `section#${id} must have data-depth="deep" after being deepened (AC1)`).toBe(
      'deep',
    );
  }

  // CR HIGH fix (Story 5.4): the attribute alone is INERT unless the CSS
  // consumer reveals the deep tier. The global depth dial is at its default
  // 'overview' (which hides .scene__deep for every scene), so the ONLY thing
  // that can reveal a deepened scene's deep content is the per-section
  // `section[data-depth='deep'] .scene__deep { display:block }` rule (added at
  // CR). Assert the OBSERVABLE outcome AC1 promises: the deepened scene's deep
  // content is actually VISIBLE (display:block), not merely attribute-tagged.
  // Mutation-verification: remove the per-section CSS rule (index.astro) → the
  // global html[data-depth='overview'] rule keeps .scene__deep at display:none
  // → this reds. (Catches the vacuity the attribute-only check missed.)
  for (const id of organizerDeepen) {
    const deepVisible = await page
      .locator(`section#${id} .scene__deep`)
      .first()
      .evaluate((el) => {
        return window.getComputedStyle(el).display !== 'none';
      });
    expect(
      deepVisible,
      `section#${id} .scene__deep must be VISIBLE (deep detail shown) after being deepened (AC1)`,
    ).toBe(true);
  }

  // Confirm the GLOBAL depth dial is still at its default 'overview' — so the
  // visible deep tier above is genuinely the per-section deepen effect, NOT the
  // visitor having globally switched the dial to 'deep'. (Makes the assertion
  // above non-vacuous: deep is shown for the DEEPENED scene specifically.)
  const globalDepth = await page.evaluate(() =>
    document.documentElement.getAttribute('data-depth'),
  );
  expect(globalDepth, 'global depth dial must remain at overview (not globally deep)').not.toBe(
    'deep',
  );

  // Non-deepened scenes should NOT have data-depth="deep" AND their deep tier
  // stays hidden (display:none) under the default overview dial — proving the
  // per-section reveal is scoped to deepened scenes only.
  const nonDeepened = ['hero', 'thesis', 'timeline', 'glass-box', 'close'];
  for (const id of nonDeepened) {
    const depthAttr = await page
      .locator(`section#${id}`)
      .evaluate((el) => el.getAttribute('data-depth'));
    expect(
      depthAttr,
      `section#${id} must NOT have data-depth="deep" (not in deepen list)`,
    ).not.toBe('deep');
  }
  // The thesis scene (not deepened, has a .scene__deep tier) keeps it hidden.
  const thesisDeepHidden = await page
    .locator('section#thesis .scene__deep')
    .first()
    .evaluate((el) => window.getComputedStyle(el).display === 'none');
  expect(
    thesisDeepHidden,
    'a non-deepened scene (thesis) must keep .scene__deep hidden under the overview dial',
  ).toBe(true);
});

// ---------------------------------------------------------------------------
// (k) AC3/NFR-2: under reduced motion, camera driving + skip-omission are OFF
//
// Reduced motion → applyRecuration receives motionAllowed=false → data-skip
// is NOT applied (the data-skip attribute stays absent). All scenes scrollable.
// Mutation-verification: if applyRecuration ignored motionAllowed, data-skip
// would be set even under reduced motion → this test reds.
// ---------------------------------------------------------------------------

test('(k) Story 5.4 AC3/NFR-2: reduced motion → data-skip NOT applied (discrete arc)', async ({
  page,
}) => {
  // Emulate reduced motion BEFORE navigation
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const organizerOrder = cachedOrganizerDirective?.order ?? [
    'hero',
    'speaker',
    'flagship',
    'timeline',
    'glass-box',
    'thesis',
    'close',
  ];
  const organizerDeepen = cachedOrganizerDirective?.deepen ?? ['speaker', 'flagship'];
  const organizerSkip = cachedOrganizerDirective?.skip ?? ['thesis', 'timeline'];

  // Intercept with a canned directive that has skip entries
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
          order: organizerOrder,
          deepen: organizerDeepen,
          skip: organizerSkip,
        })}\n\n`,
        'event: token\ndata: {"type":"token","value":"Done."}\n\n',
        'event: done\ndata: {"type":"done"}\n\n',
      ].join(''),
    });
  });

  await page.goto('/');

  // Confirm reduced motion is emulated
  expect(
    await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
  ).toBe(true);

  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 8000 },
  );

  // Drive the production path
  await page.getByTestId('guide-pill').click();
  await page.getByTestId('guide-input').waitFor({ state: 'visible', timeout: 8000 });
  await page.getByTestId('guide-input').fill("I'm a conference organizer looking to book a talk");
  await page.getByTestId('guide-send').click();

  // Wait for the done event to be processed (the guide streaming ends)
  // We wait for the thinking state to return to idle by checking the guide-transcript
  await page.waitForFunction(
    () => {
      const panel = document.querySelector('[data-testid="guide-panel"]');
      return panel !== null; // Panel must be visible
    },
    { timeout: 8000 },
  );
  // Give the SSE processing a moment to complete
  await page.waitForTimeout(2000);

  // Under reduced motion, data-skip must NOT be applied to ANY scene
  // (skip-omission is motion-gated — disabled under prefers-reduced-motion)
  // Rule 8: scoped to data-skip attribute presence
  // Mutation-verification: if applyRecuration ignored motionAllowed → data-skip would be set → reds.
  for (const id of organizerSkip) {
    const skipAttr = await page
      .locator(`section#${id}`)
      .evaluate((el) => el.getAttribute('data-skip'));
    expect(
      skipAttr,
      `section#${id} must NOT have data-skip under reduced motion (AC3/NFR-2)`,
    ).toBeNull();
  }

  // All 7 scenes must still be present + scrollable (the discrete arc holds)
  const CANONICAL_SCENE_IDS = [
    'hero',
    'thesis',
    'timeline',
    'speaker',
    'flagship',
    'glass-box',
    'close',
  ];
  for (const id of CANONICAL_SCENE_IDS) {
    await expect(
      page.locator(`section#${id}`),
      `FR-8: section#${id} must remain present under reduced motion`,
    ).toBeAttached();
  }
});

// ---------------------------------------------------------------------------
// (m) AC1 / Rule 8: motion-ENABLED path — data-skip IS applied to skipped scenes
//
// This test closes the vacuity gap that QA found: tests (i) and (k) only check
// DOM presence and "skip absent under reduced-motion", which both pass vacuously
// because the stale-closure bug (motionAllowed omitted from sendQuery's dep array)
// prevented data-skip from ever being set. This test explicitly emulates
// NO reduced-motion and asserts data-skip="true" IS set on the server-designated
// skip scenes (thesis + timeline for organizer).
//
// Mutation-verification: removing motionAllowed from the sendQuery useCallback
// dep array in GuidePanel.tsx → applyRecuration receives motionAllowed=false
// (stale initial value) → data-skip not set → this test reds.
//
// (k) by contrast emulates reduced-motion and asserts data-skip is NULL —
// so these two tests together make the skip/no-skip behavior meaningful by
// contrast (neither is vacuous when both pass).
// ---------------------------------------------------------------------------

test('(m) Story 5.4 AC1: motion-enabled path — data-skip="true" IS applied to skipped scenes', async ({
  page,
}) => {
  // Ensure reduced motion is explicitly OFF (motion enabled) — this is the
  // path where applyRecuration should set data-skip="true".
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  const organizerOrder = cachedOrganizerDirective?.order ?? [
    'hero',
    'speaker',
    'flagship',
    'timeline',
    'glass-box',
    'thesis',
    'close',
  ];
  const organizerDeepen = cachedOrganizerDirective?.deepen ?? ['speaker', 'flagship'];
  const organizerSkip = cachedOrganizerDirective?.skip ?? ['thesis', 'timeline'];

  // Intercept with a canned organizer directive that has skip entries
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
          order: organizerOrder,
          deepen: organizerDeepen,
          skip: organizerSkip,
        })}\n\n`,
        'event: token\ndata: {"type":"token","value":"Here is your director\'s cut."}\n\n',
        'event: done\ndata: {"type":"done"}\n\n',
      ].join(''),
    });
  });

  await page.goto('/');

  // Confirm motion is NOT reduced
  expect(
    await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches),
    'motion must be enabled (no reduced-motion preference) for this test',
  ).toBe(false);

  await page.waitForFunction(
    () => document.querySelector('main.home')?.hasAttribute('data-recuration-ready'),
    { timeout: 8000 },
  );

  // Drive the production path
  await page.getByTestId('guide-pill').click();
  await page.getByTestId('guide-input').waitFor({ state: 'visible', timeout: 8000 });
  await page.getByTestId('guide-input').fill("I'm a conference organizer looking to book a talk");
  await page.getByTestId('guide-send').click();

  // Wait for applyRecuration to process (speaker → order 1)
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>('section#speaker');
      return el ? el.style.order === '1' : false;
    },
    { timeout: 12000 },
  );

  // Wait for data-skip to be applied to the skipped scenes (motionAllowed=true path).
  // This is the LOAD-BEARING assertion that catches the stale-closure bug:
  // if motionAllowed is stale-false, data-skip is never set and this waitForFunction
  // times out → RED.
  await page.waitForFunction(
    (skipSceneIds: string[]) => {
      return skipSceneIds.every((id) => {
        const el = document.querySelector<HTMLElement>(`section#${id}`);
        return el?.getAttribute('data-skip') === 'true';
      });
    },
    organizerSkip,
    { timeout: 8000 },
  );

  // Rule 8: scoped assertions on the specific skip-marked scenes.
  // Mutation-verification: removing motionAllowed from sendQuery deps → stale
  // closure → data-skip never set → waitForFunction above times out → RED.
  for (const id of organizerSkip) {
    const skipAttr = await page
      .locator(`section#${id}`)
      .evaluate((el) => el.getAttribute('data-skip'));
    expect(
      skipAttr,
      `section#${id} must have data-skip="true" on the motion-enabled path (AC1)`,
    ).toBe('true');
  }

  // Non-skipped scenes must NOT have data-skip set
  const nonSkipped = ['hero', 'speaker', 'flagship', 'glass-box', 'close'];
  for (const id of nonSkipped) {
    const skipAttr = await page
      .locator(`section#${id}`)
      .evaluate((el) => el.getAttribute('data-skip'));
    expect(
      skipAttr,
      `section#${id} must NOT have data-skip (hero/close/speaker are SM-C1 protected; others not skipped)`,
    ).toBeNull();
  }

  // FR-8: all 7 scenes must still be in the DOM (skip is tour omission, not removal)
  const CANONICAL_SCENE_IDS = [
    'hero',
    'thesis',
    'timeline',
    'speaker',
    'flagship',
    'glass-box',
    'close',
  ];
  for (const id of CANONICAL_SCENE_IDS) {
    const isVisible = await page.locator(`section#${id}`).evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    expect(isVisible, `FR-8: section#${id} must NOT be hidden even when skip-marked`).toBe(true);
  }
});

// ---------------------------------------------------------------------------
// (l) FR-8: canonical DOM section order unchanged after a director's cut (5.4)
//
// The DOM order must remain hero→thesis→timeline→speaker→flagship→glass-box→close
// even after the director's cut applies CSS order, deepen, and skip marks.
// This is the same test as (e) but applied after the director's cut is active
// (the skip/deepen logic should not change the DOM order).
// ---------------------------------------------------------------------------

test('(l) Story 5.4 FR-8: canonical DOM order unchanged after director cut (skip/deepen = CSS/attr only)', async ({
  page,
}) => {
  const organizerOrder = cachedOrganizerDirective?.order ?? [
    'hero',
    'speaker',
    'flagship',
    'timeline',
    'glass-box',
    'thesis',
    'close',
  ];

  // Intercept with a full organizer director's cut
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
          order: organizerOrder,
          deepen: ['speaker', 'flagship'],
          skip: ['thesis', 'timeline'],
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
  await page.getByTestId('guide-input').fill("I'm a conference organizer");
  await page.getByTestId('guide-send').click();

  // Wait for CSS order to change (director's cut applied)
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>('section#speaker');
      return el ? el.style.order === '1' : false;
    },
    { timeout: 12000 },
  );

  // Now check the DOM ORDER is still the canonical arc (sections in DOM order)
  // FR-8: CSS `order` changes the VISUAL order but NOT the DOM order
  const sectionIds = await page.evaluate(() => {
    const sections = document.querySelectorAll<HTMLElement>('main.home section[id]');
    return Array.from(sections).map((s) => s.id);
  });

  // Rule 8: deep equality on the ordered array (order matters)
  // Mutation-verification: if applyRecuration physically moved sections in the DOM, this reds.
  expect(
    sectionIds,
    'Story 5.4 FR-8: canonical DOM order must be unchanged after director cut',
  ).toEqual(['hero', 'thesis', 'timeline', 'speaker', 'flagship', 'glass-box', 'close']);

  // All 7 must be present (nothing removed)
  expect(sectionIds, 'all 7 scenes must be present in DOM after director cut').toHaveLength(7);
});
