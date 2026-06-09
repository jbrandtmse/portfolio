import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Invite form e2e tests (Story 3.4, AC1–AC7).
 *
 * Three test groups:
 *   (a) JS-OFF — fills + submits the native form → lands on /invite/thanks/
 *       AND persists a row to Postgres (real DB; RESEND unset ⇒ mail skipped;
 *       cleans up test row). Skips with warning if DATABASE_URL is unset.
 *   (b) JS-ON — invalid submit → error summary focused + aria-invalid;
 *       valid submit → aria-live success with response-time copy;
 *       forced fetch failure → role=alert preserves values + mailto fallback.
 *   (c) WCAG 2.1 AA axe audit on /invite/.
 *
 * Database access (JS-off test): the test reads DATABASE_URL from the
 * environment (the Story-3.3 discipline — api/.env on the VM, loaded by the
 * Playwright config via process.env). Cleanup removes rows with the test marker
 * email so each run starts clean.
 *
 * Discoverable (Rule 8): registered in playwright.config.ts under the `invite`
 * project, matching /invite\.spec\.ts/.
 */

// ---------------------------------------------------------------------------
// Test marker — recognizable + invalid TLD so it never reaches a real inbox.
// ---------------------------------------------------------------------------
const TEST_MARKER_EMAIL = 'story-3.4-e2e-invite-test@test.example.invalid';
// Distinct marker for the JS-off honeypot path (must NEVER produce a row).
const HONEYPOT_MARKER_EMAIL = 'story-3.4-e2e-honeypot@test.example.invalid';

// Minimal valid form data for a successful submission.
const VALID_FORM = {
  name: 'E2E Test User',
  email: TEST_MARKER_EMAIL,
  org: 'Test Org',
  message:
    'This is a test message submitted by the Story 3.4 e2e test suite. Please ignore this inquiry.',
  topic: 'E2E testing',
  attribution: 'referral',
};

// ---------------------------------------------------------------------------
// (a) JS-OFF: native POST → /invite/thanks/
// ---------------------------------------------------------------------------

test.describe('Invite form — JS-off native POST (AC2)', () => {
  test('fills and submits the native form JS-off → lands on /invite/thanks/', async ({
    browser,
  }) => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      test.skip(true, '[SKIP] DATABASE_URL not set — skipping JS-off DB integration test');
    }

    // Create a JS-disabled context (the Story-3.3 js-off pattern).
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    try {
      await page.goto('/invite/');
      await expect(page.locator('h1')).toContainText('Invite me');

      // The SSR'd <form> must be present and operable JS-off.
      const form = page.locator('form[action="/api/invite"][method="POST"]');
      await expect(form).toHaveCount(1);

      // Fill required fields using native name= attributes (no JS hydration).
      await page.locator('input[name="name"]').fill(VALID_FORM.name);
      await page.locator('input[name="email"]').fill(VALID_FORM.email);
      await page.locator('input[name="org"]').fill(VALID_FORM.org);
      await page.locator('textarea[name="message"]').fill(VALID_FORM.message);
      await page.locator('input[name="topic"]').fill(VALID_FORM.topic);
      await page.locator('select[name="attribution"]').selectOption(VALID_FORM.attribution);

      // Submit the native form — expect a 303-redirect to /invite/thanks/.
      await Promise.all([
        page.waitForURL('/invite/thanks/'),
        form.locator('button[type="submit"]').click(),
      ]);

      // Must land on the thanks confirmation page.
      await expect(page).toHaveURL('/invite/thanks/');
      await expect(page.locator('h1')).toContainText('Your message is on its way');
      // Response-time copy is present.
      await expect(page.locator('body')).toContainText('[OPEN: N]');
      // A link back to home is present (the thanks-body "Return to the site"
      // link; the global footer also links Home, so assert >= 1, not exactly 1).
      await expect(page.locator('main a[href="/"]')).not.toHaveCount(0);

      // Verify DB row was persisted (real Postgres — the integration guarantee).
      if (databaseUrl) {
        // Use a direct postgres client to verify + clean up.
        const { Client } = await import('pg');
        const client = new Client({ connectionString: databaseUrl });
        await client.connect();
        try {
          const result = await client.query(
            'SELECT id, name, email, source, status FROM inquiries WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
            [TEST_MARKER_EMAIL],
          );
          expect(result.rows.length).toBe(1);
          const row = result.rows[0];
          expect(row.name).toBe(VALID_FORM.name);
          expect(row.source).toBe('form');
          expect(row.status).toBe('new');

          // CLEAN UP the test row.
          await client.query('DELETE FROM inquiries WHERE email = $1', [TEST_MARKER_EMAIL]);
        } finally {
          await client.end();
        }
      }
    } finally {
      await context.close();
    }
  });

  test('/invite/thanks/ is a 0-JS confirmation page accessible JS-off', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto('/invite/thanks/');
      await expect(page.locator('h1')).toContainText('Your message is on its way');
      await expect(page.locator('body')).toContainText('Joshua R. Brandt, MSE');
    } finally {
      await context.close();
    }
  });

  test('JS-off honeypot via the native form → benign /invite/thanks/ but NO row persisted (AC2)', async ({
    browser,
  }) => {
    // The bot path through the REAL native POST (no JS): the hidden `website`
    // honeypot is filled, so the endpoint returns the benign 303 → thanks (the
    // bot gets the same UX, no clue it was rejected) yet writes NOTHING. This
    // verifies the honeypot through the form path end-to-end, against real
    // Postgres. Skips-with-warning if DATABASE_URL is unset (Rule 3).
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      test.skip(true, '[SKIP] DATABASE_URL not set — skipping JS-off honeypot DB test');
    }

    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto('/invite/');
      const form = page.locator('form[action="/api/invite"][method="POST"]');
      await expect(form).toHaveCount(1);

      // Fill the visible fields AND the hidden honeypot `website` field (a bot
      // would fill it). JS-off, the field is in the DOM and submittable; force
      // the fill since it is visually hidden off-screen.
      await page.locator('input[name="name"]').fill('Honeypot Bot');
      await page.locator('input[name="email"]').fill(HONEYPOT_MARKER_EMAIL);
      await page
        .locator('textarea[name="message"]')
        .fill('Bot submission via the native form path.');
      await page.locator('select[name="attribution"]').selectOption('other');
      await page.locator('input[name="website"]').fill('http://spam.example.com', { force: true });

      await Promise.all([
        page.waitForURL('/invite/thanks/'),
        form.locator('button[type="submit"]').click(),
      ]);
      // Benign: the bot still lands on the thanks page (no tip-off).
      await expect(page).toHaveURL('/invite/thanks/');

      // But NO row was persisted for the honeypot marker (the bot path writes nothing).
      if (databaseUrl) {
        const { Client } = await import('pg');
        const client = new Client({ connectionString: databaseUrl });
        await client.connect();
        try {
          const result = await client.query(
            'SELECT count(*)::int AS n FROM inquiries WHERE email = $1',
            [HONEYPOT_MARKER_EMAIL],
          );
          expect(result.rows[0].n, 'honeypot native POST must persist NO row').toBe(0);
        } finally {
          // Defensive cleanup in case a regression DID persist (so we never leak).
          await client.query('DELETE FROM inquiries WHERE email = $1', [HONEYPOT_MARKER_EMAIL]);
          await client.end();
        }
      }
    } finally {
      await context.close();
    }
  });
});

// ---------------------------------------------------------------------------
// (b) JS-ON: hydrated island interactions
// ---------------------------------------------------------------------------

test.describe('Invite form — JS-on island (AC3, AC4, AC5)', () => {
  test('invalid submit → error summary receives focus + fields get aria-invalid (AC3)', async ({
    page,
  }) => {
    await page.goto('/invite/');
    // Wait for the island to hydrate (client:visible — scroll into view if needed).
    await page.locator('form[action="/api/invite"]').scrollIntoViewIfNeeded();
    // Wait for React hydration to kick in — the submit button becomes reactive.
    await page.waitForSelector('form[action="/api/invite"] button[type="submit"]');

    // Submit without filling required fields.
    await page.locator('button[type="submit"]').click();

    // Error summary must appear and receive focus.
    const summary = page.locator('[role="group"]');
    await expect(summary).toBeVisible();
    // The error summary heading is present.
    await expect(summary).toContainText('Please fix the following');

    // STRENGTHENED (QA, AC3 — the explicit "receives focus" requirement): assert
    // focus ACTUALLY moved to the error summary, not merely that it rendered. The
    // island calls errorSummaryRef.current?.focus() on a failed submit; a
    // regression that dropped the focus() call (leaving focus on the submit
    // button) would keep the summary visible but FAIL this — which the prior
    // visibility-only assertion did not catch. Bind to the summary's own id.
    const summaryId = await summary.getAttribute('id');
    expect(summaryId, 'error summary has an id (focus target)').toBeTruthy();
    const activeId = await page.evaluate(() => document.activeElement?.id ?? '');
    expect(activeId, 'focus is on the error summary after an invalid submit').toBe(summaryId);

    // At least one field should be aria-invalid.
    const invalidInputs = page.locator('[aria-invalid="true"]');
    await expect(invalidInputs).not.toHaveCount(0);

    // The error summary links point to the invalid fields.
    const summaryLinks = summary.locator('a');
    await expect(summaryLinks).not.toHaveCount(0);

    // STRENGTHENED (QA, AC3 — aria-describedby wiring): each invalid field must
    // wire aria-describedby → a REAL error element that exists in the DOM and
    // carries text. Assert it for the required name field specifically (a clear,
    // always-invalid-on-empty-submit field). A regression that set aria-invalid
    // but forgot the describedby association (so SR users hear "invalid" with no
    // reason) would fail here.
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await nameInput.getAttribute('aria-describedby');
    expect(describedBy, 'invalid name field wires aria-describedby').toBeTruthy();
    const errEl = page.locator(`#${describedBy}`);
    await expect(errEl, 'the aria-describedby target exists').toHaveCount(1);
    await expect(errEl).not.toBeEmpty();
  });

  test('valid submit → aria-live success with response-time copy (AC4)', async ({ page }) => {
    await page.goto('/invite/');
    await page.locator('form[action="/api/invite"]').scrollIntoViewIfNeeded();
    await page.waitForSelector('form[action="/api/invite"] button[type="submit"]');

    // Mock the /api/invite endpoint to return a successful response (avoids DB writes in JS-on test).
    await page.route('/api/invite', (route) => {
      if (route.request().method() === 'POST') {
        void route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-mock-id',
            mailStatus: 'skipped',
            message: 'Thank you. We will review your inquiry and be in touch.',
          }),
        });
      } else {
        void route.continue();
      }
    });

    // Fill the form.
    await page.locator('input[name="name"]').fill(VALID_FORM.name);
    await page.locator('input[name="email"]').fill(VALID_FORM.email);
    await page.locator('textarea[name="message"]').fill(VALID_FORM.message);
    await page.locator('select[name="attribution"]').selectOption(VALID_FORM.attribution);

    // Submit.
    await page.locator('button[type="submit"]').click();

    // Success region must appear with aria-live="polite" and role="status".
    const successRegion = page.locator('[role="status"]');
    await expect(successRegion).toBeVisible({ timeout: 5000 });
    await expect(successRegion).toContainText('Your inquiry has been received');
    // Response-time copy is present.
    await expect(successRegion).toContainText('[OPEN: N]');
    await expect(successRegion).toContainText('persisted and a notification has been sent');
    await expect(successRegion).toContainText('never an auto-responder');
  });

  test('network failure → role=alert preserves values + mailto fallback (AC5)', async ({
    page,
  }) => {
    await page.goto('/invite/');
    await page.locator('form[action="/api/invite"]').scrollIntoViewIfNeeded();
    await page.waitForSelector('form[action="/api/invite"] button[type="submit"]');

    // Mock the /api/invite endpoint to simulate a network failure.
    await page.route('/api/invite', (route) => {
      if (route.request().method() === 'POST') {
        void route.abort('failed');
      } else {
        void route.continue();
      }
    });

    // Fill the form with values we want to verify are preserved.
    const messageText = 'This message must not be lost on failure.';
    await page.locator('input[name="name"]').fill(VALID_FORM.name);
    await page.locator('input[name="email"]').fill(VALID_FORM.email);
    await page.locator('textarea[name="message"]').fill(messageText);
    await page.locator('select[name="attribution"]').selectOption(VALID_FORM.attribution);

    // Submit (will fail due to network abort).
    await page.locator('button[type="submit"]').click();

    // role=alert error state must appear.
    const alertRegion = page.locator('[role="alert"]');
    await expect(alertRegion).toBeVisible({ timeout: 5000 });
    await expect(alertRegion).toContainText('Your message was not sent');

    // Values must be preserved (non-destructive failure).
    await expect(page.locator('input[name="name"]')).toHaveValue(VALID_FORM.name);
    await expect(page.locator('textarea[name="message"]')).toHaveValue(messageText);

    // A mailto fallback link must be present.
    await expect(alertRegion.locator('a[href^="mailto:"]')).toHaveCount(1);
    // An /about/ fallback link is also present.
    await expect(alertRegion.locator('a[href="/about/"]')).toHaveCount(1);
  });

  test('submit button shows disabled/sending state during submission (AC3)', async ({ page }) => {
    await page.goto('/invite/');
    await page.locator('form[action="/api/invite"]').scrollIntoViewIfNeeded();
    await page.waitForSelector('form[action="/api/invite"] button[type="submit"]');

    // Use a slow mock to observe the submitting state.
    await page.route('/api/invite', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise((resolve) => setTimeout(resolve, 200));
        void route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'test', mailStatus: 'skipped', message: 'OK' }),
        });
      } else {
        void route.continue();
      }
    });

    await page.locator('input[name="name"]').fill(VALID_FORM.name);
    await page.locator('input[name="email"]').fill(VALID_FORM.email);
    await page.locator('textarea[name="message"]').fill(VALID_FORM.message);
    await page.locator('select[name="attribution"]').selectOption(VALID_FORM.attribution);

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // The button should show "Sending…" while in-flight.
    await expect(submitBtn).toContainText('Sending');
    // And it should be disabled during submission.
    await expect(submitBtn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// (c) WCAG 2.1 AA axe audit on /invite/
// ---------------------------------------------------------------------------

test.describe('Invite form — WCAG 2.1 AA axe audit (AC7, NFR-2)', () => {
  test('has zero axe-core wcag2a/wcag2aa violations on /invite/', async ({ page }) => {
    await page.goto('/invite/');
    // Wait for the island to be present in the DOM (SSR'd immediately; island may hydrate).
    await expect(page.locator('form[action="/api/invite"]')).toHaveCount(1);
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

  test('/invite/ renders exactly one <h1>', async ({ page }) => {
    await page.goto('/invite/');
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('/invite/ keyboard focus reaches the first form input (Tab operability, AC3)', async ({
    page,
  }) => {
    await page.goto('/invite/');
    // Scroll the form into view so client:visible triggers hydration.
    await page.locator('form[action="/api/invite"]').scrollIntoViewIfNeeded();
    // Tab until we reach a form control (a, button, input, select, textarea).
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const tagName = await page.evaluate(
        () => document.activeElement?.tagName.toLowerCase() ?? '',
      );
      if (['input', 'select', 'textarea', 'button'].includes(tagName)) {
        break;
      }
    }
    const focusedTag = await page.evaluate(
      () => document.activeElement?.tagName.toLowerCase() ?? '',
    );
    expect(['input', 'select', 'textarea', 'button']).toContain(focusedTag);
  });

  test('/invite/thanks/ has zero axe violations (0-JS confirmation page)', async ({ page }) => {
    await page.goto('/invite/thanks/');
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
