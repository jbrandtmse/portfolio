import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { BIOS } from '../src/data/speaking';
import { PERSON } from '../src/lib/person';

/**
 * Speaker Surface e2e spec (Story 3.1, Task 6, AC1–AC5; extended Story 3.2).
 *
 * Covers:
 *  - /speaking/ — reel poster is the lead item and is a followable <a> to
 *    /speaking/reel/ JS-off; collapsed talk abstracts are in the DOM and
 *    <details> toggles; WCAG 2.1 AA (axe); voice.
 *    Story 3.2: exactly ONE minimal copy-enhancement script (NFR-1 carve-out);
 *    Copy button copies bio + announces "Copied ✓"; JS-off bio selectable.
 *  - /speaking/reel/ — reel block renders, static link present, VideoObject
 *    JSON-LD; axe AA; 0 executable scripts.
 *
 * Real-runtime evidence (skill-rules Rule 3). Discoverable by playwright.config.ts
 * (testMatch: /speaking\.spec\.ts/; Rule 8).
 */

// ─── Speaking page ────────────────────────────────────────────────────────────

test.describe('/speaking/ — Speaker Surface', () => {
  test('opens with an answer-first lede naming Joshua R. Brandt, MSE (NFR-3)', async ({ page }) => {
    await page.goto('/speaking/');
    const firstP = page.locator('main p').first();
    await expect(firstP).toContainText('Joshua R. Brandt, MSE');
  });

  test('the reel poster is present as a static <a> linking to /speaking/reel/ (AC1)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    const posterLink = page.locator('a[href="/speaking/reel/"]').first();
    await expect(posterLink).toBeVisible();
    // Has an aria-label mentioning the reel.
    const label = await posterLink.getAttribute('aria-label');
    expect(label).toBeTruthy();
    expect(label!.toLowerCase()).toContain('reel');
  });

  test('the reel poster link is followable JS-off — navigates to /speaking/reel/ (AC1)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    const posterLink = page.locator('a[href="/speaking/reel/"]').first();
    await expect(posterLink).toBeVisible();
    await posterLink.click();
    await expect(page).toHaveURL(/\/speaking\/reel\//);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('the first talk abstract is expanded inline (no <details> for the first talk) (AC3)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    // First talk card abstract is inline (expanded prop = true).
    // The first <details> element should not contain the first talk's abstract.
    const firstTalkCard = page.locator('.talk-card').first();
    // First card should not have a <details> within it.
    await expect(firstTalkCard.locator('details')).toHaveCount(0);
    // The abstract text is present inline.
    await expect(firstTalkCard).toContainText('Agentic');
  });

  test('collapsed talk abstracts are in the DOM — text present inside <details> (AC3, crawler-accessible)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    // Second talk card should have a <details> element.
    const secondTalkCard = page.locator('.talk-card').nth(1);
    const details = secondTalkCard.locator('details');
    await expect(details).toHaveCount(1);
    // Full abstract text is present inside the <details> (in the DOM for crawlers).
    // Use a safe substring that doesn't contain " chars (HTML-encoded as &quot;).
    await expect(details).toContainText('agentic and are now confronting');
  });

  test('<details> summary toggles open/closed (JS-off, keyboard-operable) (AC3)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    const secondCard = page.locator('.talk-card').nth(1);
    const details = secondCard.locator('details');
    const summary = details.locator('summary');
    // Initially closed.
    await expect(details).not.toHaveJSProperty('open', true);
    // Click the summary — native <details> toggle.
    await summary.click();
    await expect(details).toHaveJSProperty('open', true);
    // Click again — closes.
    await summary.click();
    await expect(details).toHaveJSProperty('open', false);
  });

  test('veteran-IC-vantage talk is present on the page (AC3)', async ({ page }) => {
    await page.goto('/speaking/');
    // The veteran-IC talk exists — flagged [ASSUMPTION]. Use .filter() to
    // narrow from multiple .talk-card elements (strict-mode-safe).
    const veteranCard = page.locator('.talk-card').filter({ hasText: 'Veteran IC' });
    await expect(veteranCard).toHaveCount(1);
  });

  test('all talk cards render with at least one audience chip', async ({ page }) => {
    await page.goto('/speaking/');
    const cards = page.locator('.talk-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const chips = card.locator('.talk-card__chip');
      await expect(chips).not.toHaveCount(0);
    }
  });

  test('summary :focus-visible is keyboard-operable — tab + enter toggles <details>', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    const secondCard = page.locator('.talk-card').nth(1);
    const details = secondCard.locator('details');
    const summary = details.locator('summary');
    // Focus the summary and press Enter — native keyboard operation.
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(details).toHaveJSProperty('open', true);
  });

  test('WCAG 2.1 AA — zero axe violations on /speaking/ (AC5)', async ({ page }) => {
    await page.goto('/speaking/');
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

  test('renders exactly one <h1> on /speaking/ (clean heading hierarchy)', async ({ page }) => {
    await page.goto('/speaking/');
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('/speaking/ ships exactly 3 executable scripts — Guide pill (2) + copy enhancement (1) (NFR-1, Story 3.2 + 4.4)', async ({
    page,
  }) => {
    // Story 3.2: /speaking has ONE vanilla copy enhancement script.
    // Story 4.4: ALL routes ship the site-wide Guide pill (2 exec scripts).
    // Total: exactly 3 executable scripts.
    await page.goto('/speaking/');
    const scripts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script')).map((s) => s.type),
    );
    const execScripts = scripts.filter((t) => t !== 'application/ld+json');
    expect(
      execScripts,
      `/speaking/ must ship exactly 3 exec scripts (2 Guide pill + 1 copy enhancement)`,
    ).toHaveLength(3);
  });

  test('the Copy button copies the bio text and announces "Copied ✓" (Story 3.2, AC1, AC5 — JS-on)', async ({
    page,
  }) => {
    await page.goto('/speaking/');

    // Find the first Copy button (Short bio).
    const copyBtn = page.locator('button[data-bio-copy]').first();
    await expect(copyBtn).toBeVisible();

    // Click the Copy button.
    await copyBtn.click();

    // The button should transition to "Copied ✓" state.
    await expect(copyBtn).toContainText('Copied');

    // The aria-live status region announces "Copied ✓".
    // Get the status element (sibling .bio-block__status) — it may not be visible
    // (visually hidden) but its textContent must be set.
    const statusRegion = page.locator('.bio-block__status').first();
    await expect(statusRegion).toHaveText(/Copied/);
  });

  test('the Copy button is keyboard-operable and gets a visible :focus-visible ring (Story 3.2, AC4)', async ({
    page,
  }) => {
    await page.goto('/speaking/');

    // Tab to the first Copy button and verify it is focusable.
    const copyBtn = page.locator('button[data-bio-copy]').first();
    await copyBtn.focus();
    await expect(copyBtn).toBeFocused();

    // Press Enter — should trigger the copy action (keyboard-operable).
    await page.keyboard.press('Enter');
    await expect(copyBtn).toContainText('Copied');
  });

  test('the bio text is selectable plain text present in the DOM (JS-off fallback; Story 3.2, AC1/AC3)', async ({
    page,
  }) => {
    await page.goto('/speaking/');

    // The short bio text is present as plain text in the DOM (not inside a script
    // or hidden element) — the manual-copy fallback path.
    const bioText = page.locator('.bio-block__text').first();
    await expect(bioText).toBeVisible();
    await expect(bioText).toContainText('Joshua R. Brandt, MSE');
    await expect(bioText).toContainText('seasoned, building at the frontier.');

    // The fallback note is present and visible.
    const fallnote = page.locator('.bio-block__fallnote').first();
    await expect(fallnote).toBeVisible();
    await expect(fallnote).toContainText('If the copy button fails');
  });

  test('/speaking/ bios section renders two BioBlocks with [ASSUMPTION] flag (Story 3.2, AC1)', async ({
    page,
  }) => {
    await page.goto('/speaking/');

    // Two bio blocks rendered.
    const bioBlocks = page.locator('.bio-block');
    await expect(bioBlocks).toHaveCount(2);

    // [ASSUMPTION] flag is visible in the section note.
    await expect(page.locator('.speaking__section-note')).toContainText('[ASSUMPTION');
  });

  test('/speaking/ credibility strip renders metrics, testimonials, and logo placeholders with [OPEN]/[ph] flags (Story 3.2, AC2)', async ({
    page,
  }) => {
    await page.goto('/speaking/');

    // Metrics grid is present with 4 cells.
    const metrics = page.locator('.metric');
    await expect(metrics).toHaveCount(4);

    // Logo placeholders are present.
    const logoPlaceholders = page.locator('.speaking__logo-placeholder');
    await expect(logoPlaceholders).not.toHaveCount(0);

    // [OPEN]/[ph] flags are visible in text (not color alone).
    const mainText = await page.locator('main').innerText();
    expect(mainText).toContain('[ph]');
    expect(mainText).toContain('[OPEN:');

    // Testimonials are present.
    const testimonials = page.locator('.testimonial');
    await expect(testimonials).toHaveCount(3);

    // Proof note is present.
    await expect(page.locator('.speaking__proof-note')).toContainText('placeholders');
  });
});

// ─── Reel page ────────────────────────────────────────────────────────────────

test.describe('/speaking/reel/ — Speaker reel', () => {
  test('opens with an answer-first lede naming Joshua R. Brandt, MSE (NFR-3)', async ({ page }) => {
    await page.goto('/speaking/reel/');
    const firstP = page.locator('main p').first();
    await expect(firstP).toContainText('Joshua R. Brandt, MSE');
  });

  test('renders the reel poster with a link (AC2)', async ({ page }) => {
    await page.goto('/speaking/reel/');
    // The reel poster is present.
    const poster = page.locator('.reel-poster');
    await expect(poster).toBeVisible();
    // Has a link (the poster <a>).
    await expect(poster.locator('a')).not.toHaveCount(0);
  });

  test('the poster on the reel page links to the hosted video, not a self-link (AC2)', async ({
    page,
  }) => {
    await page.goto('/speaking/reel/');
    const posterLink = page.locator('.reel-poster .reel-poster__link');
    await expect(posterLink).toHaveCount(1);
    const href = await posterLink.getAttribute('href');
    // The play-button affordance must NOT point back at the page it is on.
    expect(href).not.toMatch(/\/speaking\/reel\/?$/);
    // It points at the hosted reel video (the [OPEN] asset).
    expect(href).toMatch(/reel\.mp4/);
  });

  test('reel details section shows duration and [OPEN] hosted video link (AC2)', async ({
    page,
  }) => {
    await page.goto('/speaking/reel/');
    await expect(page.locator('.reel__details')).toBeVisible();
    await expect(page.locator('.reel__details')).toContainText('90');
    // The static link to hosted video is present (labeled [OPEN]).
    await expect(page.locator('.reel__video-link')).toBeVisible();
  });

  test('WCAG 2.1 AA — zero axe violations on /speaking/reel/ (AC5)', async ({ page }) => {
    await page.goto('/speaking/reel/');
    // Story 4.4: wait for the Guide pill island to mount and inject its inline CSS
    // before running axe. Without this wait, the pill button may be in the DOM
    // but its inline <style> tag not yet processed — causing a transient contrast
    // violation that disappears once the CSS is applied (timing-specific to Playwright).
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

  test('renders exactly one <h1> on /speaking/reel/ (clean heading hierarchy)', async ({
    page,
  }) => {
    await page.goto('/speaking/reel/');
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('/speaking/reel/ ships exactly 2 executable scripts — Guide pill only (NFR-1, Story 4.4 carve-out)', async ({
    page,
  }) => {
    // Story 4.4: ALL routes ship the site-wide Guide pill (2 exec scripts).
    await page.goto('/speaking/reel/');
    const scripts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script')).map((s) => s.type),
    );
    const execScripts = scripts.filter((t) => t !== 'application/ld+json');
    expect(
      execScripts,
      `/speaking/reel/ must ship exactly 2 exec scripts (Guide pill only)`,
    ).toHaveLength(2);
  });
});

// ─── QA gap-fill: reel-as-lead-item ordering + credibility floor (served) ──────
//
// Complements the dev spec (which proves the poster link exists + is followable)
// with the ordering + honesty assertions the QA directive calls out, exercised
// against the real served runtime (skill-rules Rule 3). Reuses the `speaking`
// Playwright project (testMatch /speaking\.spec\.ts/) — no cross-project run.

// ─── QA gap-fill (Story 3.2): the copy enhancement copies the RIGHT payload, ───
// and the page DEGRADES with JS truly off (served runtime; skill-rules Rule 3).
//
// The dev spec proves the Copy button flips to "Copied ✓" + announces it, but
// NOT that the clipboard receives the correct bio text. A mutation that copied a
// static/wrong/truncated string (or BioBlock #2's text from #1's button) would
// pass the dev spec yet break the actual feature. These read the OS clipboard
// back on the served page and bind the expected payload to the real BIOS lib
// values — so wrong-payload / wrong-target / drift regressions go red.
//
// JS-off: the dev "selectable text" test runs under the `speaking` project, which
// has JS ENABLED — it never exercises the true 0-JS baseline. Here a real
// javaScriptEnabled:false context proves the page renders, the bios are present
// selectable text, the fallback note shows, and the inert Copy button neither
// throws nor enters the "Copied" state (manual selection is the only copy path).
//
// Reuses the existing `speaking` Playwright project (testMatch /speaking\.spec\.ts/;
// Rule 8) — no new project, no cross-project double-run.

test.describe('/speaking/ — the Copy enhancement copies the RIGHT bio payload (AC1/AC5, served)', () => {
  // Grant clipboard read+write so navigator.clipboard.readText() works headless.
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('clicking BioBlock #1 Copy writes BioBlock #1 exact bio text to the clipboard (not #2, not truncated)', async ({
    page,
  }) => {
    await page.goto('/speaking/');

    // The bio blocks render in BIOS order: #1 = short bio, #2 = long bio.
    const firstCopy = page.locator('button[data-bio-copy]').nth(0);
    await expect(firstCopy).toBeVisible();
    await firstCopy.click();
    // Wait for the click-handler's async clipboard write to settle (button flips).
    await expect(firstCopy).toContainText('Copied');

    const clip1 = await page.evaluate(() => navigator.clipboard.readText());
    // EXACT payload — bound to the real lib value so a wrong/static/truncated
    // copy (e.g. the Mutation-A "STATIC_WRONG_TEXT") fails, and so does any future
    // drift between the rendered bio and BIOS[0].text.
    expect(clip1).toBe(BIOS[0]!.text);
    // And it is NOT the OTHER bio's text (proves per-button targeting).
    expect(clip1).not.toBe(BIOS[1]!.text);
  });

  test('clicking BioBlock #2 Copy writes BioBlock #2 exact bio text (per-button targeting)', async ({
    page,
  }) => {
    await page.goto('/speaking/');

    const secondCopy = page.locator('button[data-bio-copy]').nth(1);
    await expect(secondCopy).toBeVisible();
    await secondCopy.click();
    await expect(secondCopy).toContainText('Copied');

    const clip2 = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip2).toBe(BIOS[1]!.text);
    expect(clip2).not.toBe(BIOS[0]!.text);
  });

  test('the copied short-bio payload equals PERSON.description (AC5 — clipboard agrees with the Person JSON-LD source)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    const firstCopy = page.locator('button[data-bio-copy]').nth(0);
    await firstCopy.click();
    await expect(firstCopy).toContainText('Copied');

    const clip = await page.evaluate(() => navigator.clipboard.readText());
    // What lands on the organizer's clipboard is byte-identical to the canonical
    // short bio that feeds the Person JSON-LD on / and /about. If BIOS[0] is ever
    // edited to diverge from PERSON.description, this reds (the existing
    // build-output "mirrors PERSON.description" check is satisfied by the JSON-LD
    // performer.description leak, so it does NOT guard the visible/copied bio).
    expect(clip).toBe(PERSON.description);
  });
});

test.describe('/speaking/ — degrades correctly with JS OFF (AC5/Decision 2 — true 0-JS baseline)', () => {
  test('with JS disabled: bios are present selectable text, fallback note shows, Copy button is inert and does not throw', async ({
    browser,
  }) => {
    // A REAL JS-off context — the copy <script> never runs (the 0-JS baseline).
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const response = await page.goto('/speaking/');
    // The page itself serves fine (no 5xx) with JS off.
    expect(response?.ok()).toBe(true);

    // Both bios are present as visible plain text (the manual-copy path).
    const bioTexts = page.locator('.bio-block__text');
    await expect(bioTexts).toHaveCount(2);
    await expect(bioTexts.nth(0)).toBeVisible();
    await expect(bioTexts.nth(0)).toContainText('Joshua R. Brandt, MSE');
    await expect(bioTexts.nth(0)).toContainText('seasoned, building at the frontier.');
    // The full short bio is present verbatim (selectable for manual copy).
    await expect(bioTexts.nth(0)).toHaveText(BIOS[0]!.text);

    // The stated fallback note is visible (AC1/AC3 — tells the user selection works).
    const fallnote = page.locator('.bio-block__fallnote').first();
    await expect(fallnote).toBeVisible();
    await expect(fallnote).toContainText('If the copy button fails');

    // The Copy button still renders (does not break layout) and is inert with JS
    // off: clicking it neither throws nor enters the "Copied" state.
    const copyBtn = page.locator('button[data-bio-copy]').first();
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toHaveText(/Copy/);
    await copyBtn.click(); // must not throw / navigate / error
    // It stays the default "Copy" — the enhancement did NOT run (no JS).
    await expect(copyBtn).not.toHaveAttribute('data-copied', '');
    await expect(copyBtn).not.toContainText('Copied');

    // No uncaught page error occurred loading/interacting with JS off.
    expect(pageErrors, pageErrors.join('\n')).toEqual([]);

    await context.close();
  });
});

test.describe('/speaking/ — reel is the lead item & credibility floor is visible', () => {
  test('the reel poster is the FIRST content item below the lede — before any talk card (AC1)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    // DOM-order check: the reel-poster link and the first talk card both exist…
    const posterLink = page.locator('main a[href="/speaking/reel/"]').first();
    const firstTalkCard = page.locator('main .talk-card').first();
    await expect(posterLink).toBeVisible();
    await expect(firstTalkCard).toBeVisible();
    // …and the reel poster appears BEFORE the first talk card in document order.
    // Computed entirely in-page (both nodes resolved via querySelector) so the
    // reel poster being the lead item is asserted on the real served DOM.
    const reelPrecedesTalks = await page.evaluate(() => {
      const reel = document.querySelector('main a[href="/speaking/reel/"]');
      const card = document.querySelector('main .talk-card');
      if (!reel || !card) return null;
      // compareDocumentPosition & DOCUMENT_POSITION_FOLLOWING (4): card follows reel.
      return (reel.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    expect(reelPrecedesTalks).toBe(true);
  });

  test('the reel-poster aria-label names the ~90s duration (AC1, served runtime)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    const posterLink = page.locator('main a[href="/speaking/reel/"]').first();
    const label = (await posterLink.getAttribute('aria-label')) ?? '';
    expect(label.toLowerCase()).toContain('reel');
    // The duration must be named in the accessible label (AC1 explicit requirement).
    expect(label).toMatch(/90/);
  });

  test('the [OPEN] reel placeholder + [ASSUMPTION] veteran-IC angle are VISIBLE text (AC3 honesty)', async ({
    page,
  }) => {
    await page.goto('/speaking/');
    // Visible body text of <main> (textContent excludes ld+json DATA blocks).
    const bodyText = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
    // Credibility floor: flags are surfaced in visible copy, not color/tint alone.
    expect(bodyText).toContain('[ASSUMPTION]');
    expect(bodyText).toContain('Veteran IC');
    expect(bodyText).toContain('[OPEN');
  });
});
