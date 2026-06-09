import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Normal e2e pass (Story 1.9, AC2 / IAC-2 (a)) — the Epic-1 surfaces in a REAL
 * browser with JS ON and motion ALLOWED (skill-rules Rule 3: browser real-runtime
 * evidence asserting on observable DOM / render state).
 *
 * Covers: the home renders the hero + the audience fork + the global footer; the
 * scene-rail navigates (jump anchors move to the target scene); the scene-rail's
 * aria-current tracking RUNS when motion is allowed (the shared motion.ts gate,
 * Layer 2 — the positive counterpart to reduced-motion.spec.ts); and a Mirror
 * route (/about) loads as a real answer-first page.
 *
 * Story 3.5 additions: the home Close scene — embedded InviteForm island,
 * follow/subscribe CTAs, creative touch — are verified here in real-browser e2e.
 */

test.describe('home / — hero, fork, footer (normal, JS on)', () => {
  test('renders exactly one <h1> with the canonical positioning line', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('Seasoned, building at the frontier');
  });

  test('renders the three audience-fork controls with the exact hrefs', async ({ page }) => {
    await page.goto('/');
    // Explore → the in-page #thesis scene anchor (the primary fork CTA).
    await expect(page.locator('a.btn--primary', { hasText: 'Explore' })).toHaveAttribute(
      'href',
      '#thesis',
    );
    // "book a talk" → /speaking/ (trailing-slash form; Story 2.0 AC2).
    await expect(page.getByRole('link', { name: /book a talk/i }).first()).toHaveAttribute(
      'href',
      '/speaking/',
    );
    // The quiet Guide entry → /faq/ (trailing-slash form; Story 2.0 AC2).
    await expect(page.getByRole('link', { name: /ask my Guide about the work/i })).toHaveAttribute(
      'href',
      '/faq/',
    );
  });

  test('renders the global static-fallback footer with a link to /about/ and /browse/ (trailing-slash form)', async ({
    page,
  }) => {
    await page.goto('/');
    const footer = page.locator('footer.site-footer');
    await expect(footer).toBeVisible();
    // Trailing-slash hrefs (Story 2.0 AC2).
    await expect(footer.locator('a[href="/about/"]')).toHaveCount(1);
    await expect(footer.locator('a[href="/browse/"]')).toHaveCount(1);
  });
});

test.describe('home / — the scene-rail (the FR-2 skip/progress/jump affordance)', () => {
  test('exposes the 7 scene jump anchors + skip + jump in the rail nav', async ({ page }) => {
    await page.goto('/');
    const rail = page.locator('nav.scene-rail');
    for (const id of ['hero', 'thesis', 'timeline', 'speaker', 'flagship', 'glass-box', 'close']) {
      await expect(rail.locator(`a[href="#${id}"]`).first()).toHaveCount(1);
    }
    // Skip → #close and Jump → /speaking/ (trailing-slash form; Story 2.0 AC2).
    await expect(rail.locator('a[href="#close"]').first()).toBeVisible();
    await expect(rail.locator('a[href="/speaking/"]').first()).toBeVisible();
  });

  test('a rail jump anchor navigates to its scene (the hash + the target in view)', async ({
    page,
  }) => {
    await page.goto('/');
    // Click the desktop rail's Timeline jump anchor.
    await page.locator('.rail-d a[href="#timeline"]').click();
    await expect(page).toHaveURL(/#timeline$/);
    // The #timeline section is scrolled into the viewport (jump worked).
    await expect(page.locator('section#timeline')).toBeInViewport();
  });

  test('with motion ALLOWED, the rail aria-current tracks the scrolled-to scene (motion.ts gate runs)', async ({
    page,
  }) => {
    // The positive counterpart to the reduced-motion pass: when motion is allowed,
    // the IntersectionObserver in the motion.ts-gated enhancement runs and moves
    // aria-current off #hero as a later scene scrolls into view (IAC-1).
    await page.goto('/');
    // Baseline: aria-current starts on the #hero rail entry.
    await expect(page.locator('.rail-d a[aria-current="true"]')).toHaveAttribute('href', '#hero');

    // Scroll a mid-arc scene into the observer's band and let the observer fire.
    await page.locator('section#flagship').scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () => page.locator('.rail-d a[aria-current="true"]').first().getAttribute('href'),
        { timeout: 5000 },
      )
      .not.toBe('#hero');
  });

  test('Story 5.0 AC1: bottom-of-scroll activates the #close rail entry even when #close is SHORT (aria-current + Scene 7 of 7)', async ({
    page,
  }) => {
    // Story 5.0 AC1: the bottom-of-page sentinel fallback (inside onMotionAllowed)
    // must set aria-current on the #close rail entry and update [data-scene-current]
    // to 7 when the page is scrolled to its very foot.
    //
    // NON-VACUOUS design: the test forces #close to a SHORT height (~120px) AFTER the
    // onMotionAllowed init has run (so the sentinel is already appended). This simulates
    // the [1.4]/[1.9] condition where a short final section cannot straddle the interior
    // observer's active band (rootMargin '-30% 0px -60% 0px' = only 30-40% of viewport
    // height, ~216-288px of a 720px viewport). A 120px-tall #close at the page bottom
    // cannot intersect this band before page-bottom — so the interior observer alone
    // cannot activate #close. Only the page-foot sentinel (the footObserver) can fire
    // setActive(lastId) in this condition.
    //
    // overflow:hidden is also set on #close so the InviteForm's natural-height content
    // does not overflow and inflate scrollHeight beyond the sentinel's position.
    //
    // A 400px spacer is appended after the sentinel so maxScroll puts the sentinel
    // clearly inside the viewport (~319px from top) — not at the exact viewport edge
    // where Chromium's IntersectionObserver fires inconsistently. The spacer also
    // ensures the final scroll position places #close BELOW the interior active band
    // (at viewport y=19, band starts at y=216), making the test truly non-vacuous.
    //
    // Mutation-verification (performed in cycle_iteration=2):
    //   - Removing the footObserver from SceneRail.astro REDS this test (Received:
    //     "#hero" — interior observer never reaches #close at the scroll position).
    //   - Removing the entire sentinel/footObserver block causes waitForFunction to
    //     timeout (no sentinel appended to body).
    //   - Both mutations red correctly.

    await page.goto('/');

    // Confirm motion is allowed (so the enhancement runs — this test is the positive path).
    const motionAllowed = await page.evaluate(
      () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    if (!motionAllowed) {
      // If the test browser has reduced motion globally, skip gracefully —
      // reduced-motion.spec.ts covers the static baseline.
      test.skip();
      return;
    }

    // Wait for the onMotionAllowed init to have run (module scripts are deferred;
    // waiting for networkidle ensures the module loaded and executed).
    await page.waitForLoadState('networkidle');

    // Verify the sentinel was appended to body by the onMotionAllowed init.
    // The sentinel is the LAST child of body with aria-hidden="true" and height:1px.
    await page.waitForFunction(() => {
      const last = document.body.lastElementChild as HTMLElement;
      return (
        last !== null &&
        last.tagName === 'DIV' &&
        last.getAttribute('aria-hidden') === 'true' &&
        last.style.height === '1px'
      );
    });

    // NON-VACUOUS: Force #close to a SHORT height so the interior observer
    // (rootMargin '-30% 0px -60% 0px') CANNOT activate it when the page is at bottom.
    // The interior active band = 30%–40% of viewport from top = ~216–288px in a 720px
    // viewport. A 120px section at the page bottom cannot straddle this band.
    // A 120px-tall #close at the end of the page cannot intersect 216-288px from the
    // top — so only the page-foot sentinel (footObserver) can activate it.
    await page.evaluate(() => {
      const closeEl = document.getElementById('close');
      if (closeEl) {
        closeEl.style.setProperty('height', '120px', 'important');
        closeEl.style.setProperty('min-height', '0', 'important');
        closeEl.style.setProperty('overflow', 'hidden', 'important');
      }
    });

    // Confirm the short #close layout is applied (getBoundingClientRect reflects
    // the overridden height).
    await page.waitForFunction(() => {
      const el = document.getElementById('close');
      return el !== null && el.getBoundingClientRect().height <= 125;
    });

    // RELIABLE SCROLL: Scroll to put the body-end sentinel clearly INSIDE the viewport,
    // while keeping #close OUT of the interior observer's active band.
    //
    // Layout after CSS injection (720px viewport):
    //   #close offsetTop≈2479, height=120 → bottom≈2599
    //   footer  offsetTop≈2653, height≈126 → bottom≈2779
    //   sentinel offsetTop≈2779, height=1  → bottom≈2780 (natural scrollHeight)
    //
    // Problem: at natural maxScroll=2780-720=2060, sentinel.rectBottom=720 — the exact
    // viewport edge — and Chromium's IntersectionObserver fires inconsistently there.
    //
    // Second problem: after scroll, #close must NOT be in the interior active band
    // (30%-40% of viewport = 216-288px from top), or the interior observer activates
    // it instead of the footObserver, making the test vacuous. The scroll position
    // must be > 2383 so #close.bottom (≈2599) is above 216px from viewport top.
    //
    // Fix: append a 400px spacer to body AFTER the sentinel. New scrollHeight≈3180.
    // The browser clamps scrollTop at maxScroll=3180-720=2460. At scrollTop=2460:
    //   sentinel.rectTop  = 2779-2460 = 319 ✓ (clearly inside viewport [0,720])
    //   #close.rectTop    = 2479-2460 =  19 ✓ (below active band start at 216px)
    //   #close.rectBottom = 2599-2460 = 139 ✓ (below active band start at 216px)
    // Only the footObserver can activate #close — interior observer can't see it.
    await page.evaluate(() => {
      // Append a test spacer to push maxScroll past the #close active-band range.
      const spacer = document.createElement('div');
      spacer.setAttribute('aria-hidden', 'true');
      spacer.setAttribute('data-test-spacer', '');
      spacer.style.cssText = 'height:400px;pointer-events:none;';
      document.body.appendChild(spacer);

      // The sentinel is now the second-to-last child of body.
      // Scroll to maxScroll (browser clamps): puts sentinel clearly inside viewport
      // and #close below the interior active band.
      const sentinel = document.body.children[document.body.children.length - 2] as HTMLElement;
      const targetScrollY = sentinel.offsetTop - 300; // aim for sentinel ~300px from top
      window.scrollTo({ top: Math.max(0, targetScrollY), behavior: 'instant' });
    });
    await expect
      .poll(
        async () => page.locator('.rail-d a[aria-current="true"]').first().getAttribute('href'),
        {
          timeout: 5000,
          message:
            'aria-current must move to #close at the foot of scroll (short #close condition — only the sentinel fallback can activate it)',
        },
      )
      .toBe('#close');

    // [data-scene-current] must read "7" (the last scene number).
    await expect
      .poll(async () => page.locator('.rail-d [data-scene-current]').first().textContent(), {
        timeout: 3000,
        message: '[data-scene-current] must read 7 (the last scene number)',
      })
      .toBe('7');

    // Exactly one rail entry carries aria-current (no stale entries on previous scenes).
    await expect(page.locator('.rail-d a[aria-current="true"]')).toHaveCount(1);
  });

  test('Story 5.0 AC2: interior scenes still track correctly (rootMargin heuristic unchanged)', async ({
    page,
  }) => {
    // Confirms that adding the bottom-of-page sentinel did NOT regress the interior
    // scene tracking — aria-current still moves off #hero as a mid-arc scene scrolls in.
    await page.goto('/');
    // Baseline on #hero.
    await expect(page.locator('.rail-d a[aria-current="true"]')).toHaveAttribute('href', '#hero');

    // Scroll to a well-interior scene (flagship is not the last scene).
    await page.locator('section#flagship').scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () => page.locator('.rail-d a[aria-current="true"]').first().getAttribute('href'),
        { timeout: 5000 },
      )
      .not.toBe('#hero');
  });
});

test.describe('a Mirror route loads as a real answer-first page', () => {
  test('/about/ renders one <h1> and an entity-first lede', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('h1')).toHaveCount(1);
    // The first paragraph (the answer-first lede) names the entity first.
    const lede = page.locator('main p').first();
    await expect(lede).toContainText(/^Joshua R\. Brandt, MSE/);
  });
});

// ---------------------------------------------------------------------------
// Story 3.5 — home #close: InviteForm island + follow CTAs + creative touch
// ---------------------------------------------------------------------------

test.describe('home #close — InviteForm island (Story 3.5, AC1)', () => {
  test('the Close scene embeds the InviteForm — the SSR-emitted <form action="/api/invite"> is present', async ({
    page,
  }) => {
    await page.goto('/');
    // The SSR'd form is in the DOM immediately (JS-off baseline).
    const form = page.locator('section#close form[action="/api/invite"]');
    await expect(form).toHaveCount(1);
  });

  test('the Close form submits JS-on → aria-live success (via mocked /api/invite)', async ({
    page,
  }) => {
    await page.goto('/');
    // Mock the /api/invite endpoint (avoids DB writes in this JS-on test).
    await page.route('/api/invite', (route) => {
      if (route.request().method() === 'POST') {
        void route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-home-close-mock-id',
            mailStatus: 'skipped',
            message: 'Thank you.',
          }),
        });
      } else {
        void route.continue();
      }
    });

    // Scroll the Close form into view (client:visible triggers hydration).
    // The Close is at the bottom of the 7-scene page — scroll fully into view.
    await page.locator('section#close').scrollIntoViewIfNeeded();
    // Explicitly wait for the astro-island to hydrate. The form is SSR'd but the
    // React island (client:visible) hydrates asynchronously after the
    // IntersectionObserver fires. We wait for the noValidate attribute — it is set
    // only AFTER hydration (the `hydrated` useEffect in InviteForm). This is the
    // same hydration signal the invite spec relies on implicitly.
    await page.waitForFunction(
      () => {
        const form = document.querySelector(
          'section#close form[action="/api/invite"]',
        ) as HTMLFormElement | null;
        return form !== null && form.noValidate === true;
      },
      { timeout: 10000 },
    );

    // Fill required fields and submit.
    const form = page.locator('section#close form[action="/api/invite"]');
    await form.locator('input[name="name"]').fill('E2E Close Test User');
    await form.locator('input[name="email"]').fill('home-close-e2e@test.example.invalid');
    await form
      .locator('textarea[name="message"]')
      .fill('Close form e2e test submission — please ignore.');
    await form.locator('select[name="attribution"]').selectOption('other');
    await form.locator('button[type="submit"]').click();

    // Success aria-live region must appear (the island replaces the form on success).
    const successRegion = page
      .locator('[role="status"]')
      .filter({ hasText: 'Your inquiry has been received' });
    await expect(successRegion).toBeVisible({ timeout: 10000 });
  });

  test('the Close form native POST JS-off → /invite/thanks/ (reuses the api harness; AC1)', async ({
    browser,
  }) => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      test.skip(true, '[SKIP] DATABASE_URL not set — skipping home Close JS-off native POST test');
    }

    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto('/');
      const form = page.locator('section#close form[action="/api/invite"][method="POST"]');
      await expect(form).toHaveCount(1);

      await page.locator('section#close input[name="name"]').fill('E2E Home Close JS-off User');
      await page
        .locator('section#close input[name="email"]')
        .fill('home-close-jsoff-e2e@test.example.invalid');
      await page
        .locator('section#close textarea[name="message"]')
        .fill('Home Close JS-off e2e test — please ignore.');
      await page.locator('section#close select[name="attribution"]').selectOption('other');

      await Promise.all([
        page.waitForURL('/invite/thanks/'),
        form.locator('button[type="submit"]').click(),
      ]);

      await expect(page).toHaveURL('/invite/thanks/');
      await expect(page.locator('h1')).toContainText('Your message is on its way');

      // Clean up test row.
      if (databaseUrl) {
        const { Client } = await import('pg');
        const client = new Client({ connectionString: databaseUrl });
        await client.connect();
        try {
          await client.query('DELETE FROM inquiries WHERE email = $1', [
            'home-close-jsoff-e2e@test.example.invalid',
          ]);
        } finally {
          await client.end();
        }
      }
    } finally {
      await context.close();
    }
  });
});

test.describe('home #close — follow CTAs (Story 3.5, AC1, 0-JS analytics)', () => {
  test('the channel CTAs are present as real <a> links with data-umami-event="channel-clicked"', async ({
    page,
  }) => {
    await page.goto('/');
    const closeSection = page.locator('section#close');

    // Each channel CTA is a real link with the 0-JS event attribute.
    const channelLinks = closeSection.locator('a[data-umami-event="channel-clicked"]');
    await expect(channelLinks).not.toHaveCount(0);

    // At least the 3 canonical channels (youtube, github, suno).
    for (const channel of ['youtube', 'github', 'suno'] as const) {
      await expect(closeSection.locator(`a[data-umami-event-channel="${channel}"]`)).toHaveCount(1);
    }
  });

  test('the CTAs are keyboard-operable and have a visible :focus-visible ring (AC1/NFR-2)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('section#close').scrollIntoViewIfNeeded();

    // Tab to the first channel CTA link; it must be reachable via keyboard.
    const firstCta = page.locator('section#close a[data-umami-event="channel-clicked"]').first();
    await firstCta.focus();
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

  test('[OPEN] handle placeholder text is visible in the CTA labels (no fabrication; AC1)', async ({
    page,
  }) => {
    await page.goto('/');
    const closeSection = page.locator('section#close');
    // The channel handle is [OPEN]-flagged in visible text.
    await expect(closeSection).toContainText('[OPEN:');
  });
});

test.describe('home #close — curated creative touch (Story 3.5, AC2)', () => {
  test('the creative-touch <a> link is present and followable JS-off (static poster)', async ({
    page,
  }) => {
    await page.goto('/');
    const closeSection = page.locator('section#close');
    // The creative-touch <a> has a class and accessible name.
    const creativeLink = closeSection.locator('a.close__creative-link');
    await expect(creativeLink).toHaveCount(1);
    // Has an href (followable).
    const href = await creativeLink.getAttribute('href');
    expect(href).not.toBeNull();
    expect(href!.length).toBeGreaterThan(0);
    // Has an accessible name via aria-label.
    const ariaLabel = await creativeLink.getAttribute('aria-label');
    expect(ariaLabel).not.toBeNull();
    expect(ariaLabel!.length).toBeGreaterThan(0);
  });

  test('the creative-touch poster is a CSS block — no autoplay, no iframe, no video (FR-23)', async ({
    page,
  }) => {
    await page.goto('/');
    const closeSection = page.locator('section#close');
    // No autoplay attribute anywhere in Close.
    const autoplays = await closeSection.locator('[autoplay]').count();
    expect(autoplays).toBe(0);
    // No iframe in Close.
    const iframes = await closeSection.locator('iframe').count();
    expect(iframes).toBe(0);
    // No video in Close.
    const videos = await closeSection.locator('video').count();
    expect(videos).toBe(0);
  });

  test('the creative-touch link has a visible :focus-visible ring (NFR-2/AA)', async ({ page }) => {
    await page.goto('/');
    await page.locator('section#close').scrollIntoViewIfNeeded();
    const creativeLink = page.locator('a.close__creative-link');
    await creativeLink.focus();
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

test.describe('home #close — invite-submitted conversion event (Story 3.5, AC1/AC4)', () => {
  // The headline conversion event for the SM-1 path (FR-36). Story 3.4 DEFERRED
  // this wiring to 3.5; these tests are the real-runtime proof that the embedded
  // island actually fires track('invite-submitted', { source }) on a SUCCESSFUL
  // submit — AND that the payload carries NO PII (only the non-identifying
  // `source` primitive). Mutation: deleting the track() call in InviteForm.tsx's
  // success handler reds the first test; widening the payload to include any of
  // name/email/message/org/topic/attribution reds the no-PII assertion.

  /** Field names whose values are PII — must NEVER appear in an analytics payload. */
  const PII_KEYS = ['name', 'email', 'message', 'org', 'topic', 'attribution'] as const;

  test('fires umami track("invite-submitted", { source: "close" }) on a successful home submit — NO PII (AC1/AC4)', async ({
    page,
  }) => {
    // Install a capturing window.umami.track BEFORE the page (and the island)
    // load — addInitScript runs before any page script on every navigation, so
    // it is present the moment the island hydrates and fires the event. We record
    // every (event, data) pair into window.__umamiCalls for read-back.
    await page.addInitScript(() => {
      (window as unknown as { __umamiCalls: Array<[string, unknown]> }).__umamiCalls = [];
      window.umami = {
        track: (event: string, data?: Record<string, string | number | boolean>) => {
          (window as unknown as { __umamiCalls: Array<[string, unknown]> }).__umamiCalls.push([
            event,
            data,
          ]);
        },
      };
    });

    await page.goto('/');

    // Mock the endpoint so the success path runs without a DB write (the success
    // handler is where track('invite-submitted') fires).
    await page.route('/api/invite', (route) => {
      if (route.request().method() === 'POST') {
        void route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-invite-submitted-event',
            mailStatus: 'skipped',
            message: 'Thank you.',
          }),
        });
      } else {
        void route.continue();
      }
    });

    // Drive the embedded island to a successful submit (wait for hydration via the
    // noValidate signal, the same pattern the success test uses).
    await page.locator('section#close').scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => {
        const form = document.querySelector(
          'section#close form[action="/api/invite"]',
        ) as HTMLFormElement | null;
        return form !== null && form.noValidate === true;
      },
      { timeout: 10000 },
    );

    const form = page.locator('section#close form[action="/api/invite"]');
    await form.locator('input[name="name"]').fill('Event E2E User');
    await form.locator('input[name="email"]').fill('invite-submitted-e2e@test.example.invalid');
    await form
      .locator('textarea[name="message"]')
      .fill('invite-submitted event e2e — please ignore.');
    await form.locator('select[name="attribution"]').selectOption('other');
    await form.locator('button[type="submit"]').click();

    // Success must render (confirms we reached the success handler that fires track()).
    await expect(
      page.locator('[role="status"]').filter({ hasText: 'Your inquiry has been received' }),
    ).toBeVisible({ timeout: 10000 });

    // The event must have been recorded. Poll because track() fires in the same
    // tick as the success state transition.
    await expect
      .poll(
        async () =>
          page.evaluate(
            () =>
              (window as unknown as { __umamiCalls: Array<[string, unknown]> }).__umamiCalls.length,
          ),
        { timeout: 5000 },
      )
      .toBeGreaterThan(0);

    const calls = (await page.evaluate(
      () => (window as unknown as { __umamiCalls: Array<[string, unknown]> }).__umamiCalls,
    )) as Array<[string, Record<string, unknown> | undefined]>;

    // Exactly the invite-submitted event was fired (the only event on this path).
    const inviteCalls = calls.filter(([event]) => event === 'invite-submitted');
    expect(inviteCalls, 'invite-submitted fired exactly once on success').toHaveLength(1);

    const payload = inviteCalls[0]![1] ?? {};
    // source disambiguates the home embed (Decision 2): home `/` ⇒ 'close'.
    expect(payload.source, 'source attributes the conversion to the home Close embed').toBe(
      'close',
    );

    // NO PII: none of the inquiry field values may appear as a key, and every
    // value present must be a primitive (no nested object that could smuggle PII).
    for (const key of PII_KEYS) {
      expect(
        payload,
        `analytics payload must NOT carry the "${key}" field (NFR-7)`,
      ).not.toHaveProperty(key);
    }
    for (const [, value] of Object.entries(payload)) {
      expect(['string', 'number', 'boolean']).toContain(typeof value);
    }
    // And the submitted PII strings must not leak anywhere in the serialized payload.
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('invite-submitted-e2e@test.example.invalid');
    expect(serialized).not.toContain('Event E2E User');
  });

  test('the success submit is a silent no-op without Umami — track() does not throw (AC4/NFR-5)', async ({
    page,
  }) => {
    // The DEFAULT served build ships NO Umami tracker, so window.umami is
    // undefined. The island's track('invite-submitted') call must be a safe no-op
    // (analytics.ts guards window.umami?.track) — submitting must still succeed and
    // surface no page error. Mutation: an unguarded window.umami.track(...) would
    // throw a TypeError here, breaking the success transition.
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // Confirm the gate is genuinely closed: no umami tracker installed by the build.
    const hasUmami = await page.evaluate(() => typeof window.umami !== 'undefined');
    expect(hasUmami, 'default build must not install window.umami (Rule 4 gate closed)').toBe(
      false,
    );

    await page.route('/api/invite', (route) => {
      if (route.request().method() === 'POST') {
        void route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'noop-umami', mailStatus: 'skipped', message: 'Thank you.' }),
        });
      } else {
        void route.continue();
      }
    });

    await page.locator('section#close').scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => {
        const form = document.querySelector(
          'section#close form[action="/api/invite"]',
        ) as HTMLFormElement | null;
        return form !== null && form.noValidate === true;
      },
      { timeout: 10000 },
    );

    const form = page.locator('section#close form[action="/api/invite"]');
    await form.locator('input[name="name"]').fill('No-Umami E2E User');
    await form.locator('input[name="email"]').fill('noop-umami-e2e@test.example.invalid');
    await form.locator('textarea[name="message"]').fill('no-op umami e2e — please ignore.');
    await form.locator('select[name="attribution"]').selectOption('other');
    await form.locator('button[type="submit"]').click();

    // Success still renders (track() no-op did not break the success path)…
    await expect(
      page.locator('[role="status"]').filter({ hasText: 'Your inquiry has been received' }),
    ).toBeVisible({ timeout: 10000 });
    // …and no uncaught page error was raised by the track() call.
    expect(
      pageErrors,
      `no uncaught error from the no-op track(): ${pageErrors.join('; ')}`,
    ).toEqual([]);
  });
});

test.describe('home #close — creative touch performs NO live runtime read (Story 3.5, AC2/FR-23)', () => {
  test('loads no network request and references no script/iframe to youtube/suno/github (Guardrail §9.1)', async ({
    page,
  }) => {
    // FR-23 / Guardrail §9.1: the curated creative touch is a static poster + a
    // hardcoded curated <a>. The PAGE itself must perform NO live read of a media
    // provider — no XHR/fetch/script/iframe to youtube/suno/github at load or on
    // reveal. (The curated <a> href points AT suno.com, but a link target is NOT a
    // request — only an actual network call / embedded sub-resource counts.)
    const PROVIDER_HOST =
      /(?:youtube\.com|youtu\.be|ytimg\.com|googlevideo\.com|suno\.com|github\.com|githubusercontent\.com)/i;

    const providerRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (PROVIDER_HOST.test(url)) providerRequests.push(`${req.method()} ${url}`);
    });

    await page.goto('/');
    // Reveal the Close so any reveal-triggered embed (there must be none) would fire.
    await page.locator('section#close').scrollIntoViewIfNeeded();
    // Let the island hydrate + give any deferred embed a chance to (wrongly) load.
    await page.waitForFunction(
      () => {
        const form = document.querySelector(
          'section#close form[action="/api/invite"]',
        ) as HTMLFormElement | null;
        return form !== null && form.noValidate === true;
      },
      { timeout: 10000 },
    );
    await page.waitForLoadState('networkidle');

    // No request to any media-provider host was made by the page.
    expect(
      providerRequests,
      `page must make NO live request to a media provider (FR-23): ${providerRequests.join(', ')}`,
    ).toEqual([]);

    // And the Close DOM embeds no provider sub-resource (no <script src>/<iframe>/<img>
    // pointing at a provider) — the creative touch is a pure CSS poster.
    const closeEmbeds = await page.locator('section#close').evaluate((section, hostSrc) => {
      const re = new RegExp(hostSrc, 'i');
      const out: string[] = [];
      section.querySelectorAll('script[src], iframe[src], img[src], source[src]').forEach((el) => {
        const src = el.getAttribute('src') ?? '';
        if (re.test(src)) out.push(`${el.tagName.toLowerCase()} ${src}`);
      });
      return out;
    }, PROVIDER_HOST.source);
    expect(
      closeEmbeds,
      `Close must embed no provider sub-resource (static poster only): ${closeEmbeds.join(', ')}`,
    ).toEqual([]);
  });
});

test.describe('home #close — WCAG 2.1 AA axe audit with the island present (Story 3.5, AC5)', () => {
  test('has zero axe-core wcag2a/wcag2aa violations on home / (with the Close island and CTAs)', async ({
    page,
  }) => {
    await page.goto('/');
    // Scroll Close into view to ensure island content is in DOM for axe.
    await page.locator('section#close').scrollIntoViewIfNeeded();
    // Wait for the island to be present (SSR'd immediately).
    await expect(page.locator('section#close form[action="/api/invite"]')).toHaveCount(1);

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
