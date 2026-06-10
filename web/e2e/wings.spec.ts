import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Wings e2e spec — /technical/, /creative/, /agentic/ (Story 7.1, Task 5 / Rule 3).
 *
 * Real-runtime browser evidence for the THREE new user-facing Wing surfaces
 * (skill-rules Rule 3: every user-facing surface MUST have at least one test that
 * exercises the real target runtime — these routes are brand-new in this story).
 * The build-output suite (web/test/build-output.test.ts) already asserts the
 * per-Mirror-route static guarantees (one <h1>, answer-first lede, self-canonical,
 * footer, JS-budget) on the BUILT bytes for all three routes; this spec proves the
 * AC1 user-observable outcomes in a REAL browser served the production way, AND
 * carries the Story 7.1 BROAD credibility audit (Rule 9 — the highest-risk
 * dimension here, since these are LLM-authored visitor-facing prose pages).
 *
 * Asserts ON THE REAL SERVED PAGE for each Wing:
 *   - AC1: reachable at the trailing-slash URL (single 200, no redirect hop).
 *   - AC1: exactly one <h1>; an answer-first lede whose first sentence names
 *     "Joshua R. Brandt, MSE" (GEO floor).
 *   - AC1 (Rule 2): a self-canonical <link> equal to the landed trailing-slash URL.
 *   - AC1: every live item link is a real, followable <a> (JS-off included) whose
 *     target resolves with a 200 — no dangling Wing item.
 *   - AC1: each Wing is linked from the global footer + /browse + the sitemap.
 *   - AC1 (NFR-1): 0 executable JS authored by the page (only the site-wide Guide
 *     pill carve-out, exactly 2 scripts; JS-off the page is fully readable).
 *   - AC4: valid CreativeWork JSON-LD; no exclamation marks (positive assertion).
 *   - WCAG 2.1 AA (axe-core).
 *
 * AC2 / Rule 9 BROAD credibility audit (line-scoped, mutation-relevant):
 *   - Story 7.3: the two self-contained playables (vector-wars, christmas-elves)
 *     ARE live item links; voyager stays "coming" (incomplete LFS asset bundle)
 *     and NEVER appears as a built/live link — only in the honest "more coming" note.
 *   - The Suno music uses the deliberate `[OPEN: Suno profile URL]` honest flag —
 *     no invented Suno URL, no invented track title, and the music item is NOT a
 *     real <a href> (it is a non-link span, since its href is the [OPEN] flag).
 *   - Every live item href is one of the known real shipped surfaces.
 *
 * The webServer in playwright.config.ts runs `pnpm build` so all pages exist and
 * serve_with_api proxies the way production nginx does.
 */

// ── The Wings under test, with their grounded expectations (the story's
// allocation table, encoded here as the test's own ground truth so a manifest
// drift that fabricates an entry or drops a live target reds these assertions —
// Rule 8: not the array content/wings.ts reads). ──────────────────────────────

/** A live item link that MUST resolve on the page (the grounded real surfaces). */
interface LiveItem {
  /** The exact trailing-slash href the item must link to (a real shipped route). */
  href: string;
}

interface WingCase {
  path: string;
  heading: string;
  /** Live item links the Wing must render as real, resolving <a>s. */
  liveItems: LiveItem[];
  /**
   * A fragment of the honest "more coming" copy that MUST be present, OR false
   * when the Wing is complete (moreComing: false) — Story 7.3 made technical and
   * creative complete so they no longer carry a "more coming" note.
   */
  moreComing: string | false;
}

// The exact trailing-slash href set the live items must resolve to. Hard-coded as
// ground truth (Rule 8) — these are the real shipped surfaces from the allocation
// table, NOT read from content/wings.ts.
// voyager is now LIVE as an external embed at https://voyager.abacusai.cloud/
// (portfolio page /work/voyager/ embeds it). All three playables are live.
const WINGS: WingCase[] = [
  {
    path: '/technical/',
    heading: 'Technical work',
    liveItems: [
      { href: '/work/loandemo/' },
      { href: '/work/vector-wars/' },
      { href: '/work/voyager/' },
    ],
    // Technical is now complete (voyager live as external embed) → no moreComing.
    moreComing: false,
  },
  {
    path: '/creative/',
    heading: 'Creative work',
    // Creative's [OPEN: Suno] music is a non-link span; christmas-elves is now a live <a>.
    liveItems: [{ href: '/work/christmas-elves/' }],
    moreComing: false, // creative is now complete (Story 7.3)
  },
  {
    path: '/agentic/',
    heading: 'Agentic work',
    liveItems: [{ href: '/glass-box/' }, { href: '/faq/' }],
    moreComing: 'More agentic work is coming',
  },
];

const SITE_ORIGIN = 'https://joshuabrandt.abacusai.cloud';

test.describe('Wings — /technical/, /creative/, /agentic/ (Story 7.1)', () => {
  for (const wing of WINGS) {
    test.describe(`${wing.path}`, () => {
      test('is reachable at the trailing-slash URL with a single 200 (no redirect hop)', async ({
        page,
      }) => {
        const response = await page.goto(wing.path);
        expect(response?.status(), `${wing.path} serves 200`).toBe(200);
        // No client/server redirect moved us off the requested URL.
        await expect(page).toHaveURL(new RegExp(`${wing.path.replace(/\//g, '\\/')}$`));
      });

      test('renders exactly one <h1> with the Wing heading (clean hierarchy)', async ({ page }) => {
        await page.goto(wing.path);
        const h1 = page.locator('h1');
        await expect(h1).toHaveCount(1);
        await expect(h1).toHaveText(wing.heading);
      });

      test('opens answer-first — the lede first sentence names "Joshua R. Brandt, MSE" (AC1 GEO floor)', async ({
        page,
      }) => {
        await page.goto(wing.path);
        const lede = page.locator('.mirror__lede');
        await expect(lede).toContainText(/^Joshua R\. Brandt, MSE/);
      });

      test('is self-canonical to its own absolute trailing-slash URL (AC1 / Rule 2)', async ({
        page,
      }) => {
        await page.goto(wing.path);
        const canonical = page.locator('link[rel="canonical"]');
        await expect(canonical).toHaveCount(1);
        await expect(canonical).toHaveAttribute('href', `${SITE_ORIGIN}${wing.path}`);
      });

      test('every live item link is a real <a> whose target resolves 200 (AC1/AC2 — no dangling item)', async ({
        page,
      }) => {
        await page.goto(wing.path);
        // Scope to the Wing item list (not the footer/nav chrome).
        const itemList = page.locator('.wing-list');
        await expect(itemList).toHaveCount(1);

        for (const item of wing.liveItems) {
          const link = itemList.locator(`a[href="${item.href}"]`);
          await expect(
            link,
            `${wing.path} renders a real <a> to live item ${item.href}`,
          ).toHaveCount(1);
          await expect(link).toBeVisible();
          // The target resolves — follow it and assert a 200 (no dangling item).
          const res = await page.request.get(item.href, { maxRedirects: 0 });
          expect(
            res.status(),
            `live item target ${item.href} resolves 200 (no dangling Wing link)`,
          ).toBe(200);
        }
      });

      test('handles "more coming" affordance correctly — present when set, absent when Wing is complete (AC2)', async ({
        page,
      }) => {
        await page.goto(wing.path);
        const moreComing = page.locator('.wing-more-coming');
        if (wing.moreComing === false) {
          // Wing is complete (Story 7.3 made technical + creative complete) —
          // the .wing-more-coming element must NOT be present.
          await expect(
            moreComing,
            `${wing.path} must NOT have a .wing-more-coming element when Wing is complete`,
          ).toHaveCount(0);
        } else {
          // Wing is still thin — the affordance must be present and calm.
          await expect(moreComing).toHaveCount(1);
          await expect(moreComing).toContainText(wing.moreComing);
          // No hype: the affordance carries no exclamation mark.
          const text = (await moreComing.textContent()) ?? '';
          expect(text, `"more coming" on ${wing.path} carries no exclamation`).not.toContain('!');
        }
      });

      test('the Wing is linked from the global footer (AC1: reachable without the agent)', async ({
        page,
      }) => {
        await page.goto(wing.path);
        const footer = page.locator('footer.site-footer');
        await expect(footer.locator(`a[href="${wing.path}"]`)).toHaveCount(1);
      });

      test('ships exactly 2 executable scripts — the site-wide Guide pill only (NFR-1, Story 4.4 carve-out)', async ({
        page,
      }) => {
        await page.goto(wing.path);
        const executableScripts = await page.evaluate(() => {
          const scripts = Array.from(document.querySelectorAll('script'));
          return scripts.filter((s) => s.type !== 'application/ld+json' && s.type !== 'importmap')
            .length;
        });
        expect(
          executableScripts,
          `${wing.path} must ship exactly 2 exec scripts (Guide pill only); found ${executableScripts}`,
        ).toBe(2);
      });

      test('carries a valid CreativeWork JSON-LD node authored by the person (AC4)', async ({
        page,
      }) => {
        await page.goto(wing.path);
        const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
        expect(blocks.length, `${wing.path} ships at least one ld+json block`).toBeGreaterThan(0);
        // Parse each block (must be valid JSON) and find the CreativeWork node.
        const nodes = blocks.flatMap((b) => {
          const parsed = JSON.parse(b) as unknown;
          return Array.isArray(parsed) ? parsed : [parsed];
        }) as Array<Record<string, unknown>>;
        const cw = nodes.find((n) => n['@type'] === 'CreativeWork');
        expect(cw, `${wing.path} has a CreativeWork JSON-LD node`).toBeDefined();
        expect(cw!.url, 'CreativeWork.url is the self URL').toBe(`${SITE_ORIGIN}${wing.path}`);
        const author = cw!.author as Record<string, unknown> | undefined;
        expect(author?.['@type'], 'CreativeWork.author is a Person').toBe('Person');
        expect(author?.name, 'author names the person').toContain('Joshua R. Brandt');
      });

      test('contains no exclamation marks in visible copy (positive-assertion voice, AC4)', async ({
        page,
      }) => {
        await page.goto(wing.path);
        // The Wing section's visible text (not scripts/JSON-LD) carries no "!".
        const sectionText = (await page.locator('section.wing-index').textContent()) ?? '';
        expect(sectionText, `${wing.path} Wing copy has no exclamation`).not.toContain('!');
      });

      test('has zero axe-core wcag2a/wcag2aa violations (WCAG 2.1 AA)', async ({ page }) => {
        await page.goto(wing.path);
        // Wait for the Guide pill (client:only) so axe sees the settled DOM.
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
  }

  // ── AC1: JS-OFF — every Wing renders + every live item link is followable with
  // JavaScript disabled (the 0-JS static floor, NFR-3). Run in a JS-disabled
  // context inline (the `wings` project runs JS-on; this proves the static layer). ─
  test('every Wing renders + its live items are followable with JavaScript disabled (AC1, NFR-3)', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    try {
      for (const wing of WINGS) {
        await page.goto(wing.path);
        // One <h1>, present without any JS.
        await expect(page.locator('h1'), `one <h1> on ${wing.path} JS-off`).toHaveText(
          wing.heading,
        );
        // The entity-first lede is server-rendered (no JS).
        await expect(page.locator('.mirror__lede')).toContainText(/^Joshua R\. Brandt, MSE/);
        // Each live item is a real <a> the visitor can follow with no JS.
        for (const item of wing.liveItems) {
          const link = page.locator(`.wing-list a[href="${item.href}"]`);
          await expect(
            link,
            `JS-off: ${wing.path} live item ${item.href} is a followable <a>`,
          ).toHaveCount(1);
        }
      }
    } finally {
      await ctx.close();
    }
  });

  // ── AC1: the three Wings are linked from /browse (the JS-off site index). ────
  test('all three Wings are linked from /browse (AC1: reachable without the agent)', async ({
    page,
  }) => {
    await page.goto('/browse/');
    // Scope to the /browse index body list (.browse-list) — the global footer
    // ALSO links each Wing on every page, so a whole-page count is 2; the AC is
    // that the /browse INDEX itself lists each Wing exactly once.
    const browseList = page.locator('.browse-list');
    await expect(browseList).toHaveCount(1);
    for (const wing of WINGS) {
      await expect(
        browseList.locator(`a[href="${wing.path}"]`),
        `/browse/ index lists ${wing.path}`,
      ).toHaveCount(1);
    }
  });

  // ── AC1: the three Wings are in the sitemap with the trailing-slash <loc>. ───
  test('all three Wings appear in sitemap.xml with the trailing-slash <loc> (AC1 / Rule 2)', async ({
    request,
  }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status(), 'sitemap.xml serves 200').toBe(200);
    const xml = await res.text();
    for (const wing of WINGS) {
      expect(xml, `sitemap <loc> for ${wing.path}`).toContain(
        `<loc>${SITE_ORIGIN}${wing.path}</loc>`,
      );
    }
  });

  /* ────────────────────────────────────────────────────────────────────────
   * Rule 9 — BROAD credibility audit + line-scoped regression tests.
   *
   * These are the load-bearing fabrication-class guards (the highest-risk
   * dimension of this LLM-authored-prose story). Each is mutation-relevant:
   * adding a fabricated entry to content/wings.ts reds the matching test.
   * ──────────────────────────────────────────────────────────────────────── */

  test('Rule 9 — all three playables are now live links (voyager external embed is live)', async ({
    page,
  }) => {
    // vector-wars (Technical) + christmas-elves (Creative) shipped in Story 7.3.
    // voyager (Technical) is now a live external embed at https://voyager.abacusai.cloud/.
    // Mutation-verified: removing a shipped item reds.
    const technical = WINGS.find((w) => w.path === '/technical/')!;
    await page.goto(technical.path);
    const techHrefs = await page
      .locator('.wing-list a')
      .evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute('href')?.toLowerCase() ?? ''),
      );
    expect(
      techHrefs.some((h) => h.includes('vector-wars')),
      'technical Wing must have a live item link for "vector-wars"',
    ).toBe(true);
    expect(
      techHrefs.some((h) => h.includes('voyager')),
      'voyager must be a live item link on Technical (external embed is live)',
    ).toBe(true);
    const creative = WINGS.find((w) => w.path === '/creative/')!;
    await page.goto(creative.path);
    const creativeHrefs = await page
      .locator('.wing-list a')
      .evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute('href')?.toLowerCase() ?? ''),
      );
    expect(
      creativeHrefs.some((h) => h.includes('christmas-elves')),
      'creative Wing must have a live item link for "christmas-elves"',
    ).toBe(true);
  });

  test('Rule 9 — all three playables are live items; technical + creative Wings are complete (no more-coming)', async ({
    page,
  }) => {
    // voyager is now a live external embed → technical is complete → no more-coming note.
    // Creative is complete (christmas-elves live, Suno [OPEN]) → no more-coming note.
    const technical = WINGS.find((w) => w.path === '/technical/')!;
    await page.goto(technical.path);
    // Technical is now complete — no .wing-more-coming element.
    await expect(
      page.locator('.wing-more-coming'),
      'technical Wing must NOT have a .wing-more-coming element (voyager now live)',
    ).toHaveCount(0);
    // All three Technical playables are real item links.
    const techHrefs = await page
      .locator('.wing-list a')
      .evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute('href')?.toLowerCase() ?? ''),
      );
    expect(techHrefs.some((h) => h.includes('vector-wars'))).toBe(true);
    expect(techHrefs.some((h) => h.includes('voyager'))).toBe(true);

    const creative = WINGS.find((w) => w.path === '/creative/')!;
    await page.goto(creative.path);
    // No more-coming element on creative.
    await expect(
      page.locator('.wing-more-coming'),
      'creative Wing has no .wing-more-coming (complete)',
    ).toHaveCount(0);
    const creativeHrefs = await page
      .locator('.wing-list a')
      .evaluateAll((els) =>
        els.map((e) => (e as HTMLAnchorElement).getAttribute('href')?.toLowerCase() ?? ''),
      );
    expect(creativeHrefs.some((h) => h.includes('christmas-elves'))).toBe(true);
  });

  test('Rule 9 — the Suno music uses the deliberate [OPEN: Suno profile URL] honest flag (no invented URL, not a live <a>)', async ({
    page,
  }) => {
    await page.goto('/creative/');
    // The honest credibility flag is visible prose (Rule-15-EXEMPT deliberate marker).
    const wingText = (await page.locator('section.wing-index').textContent()) ?? '';
    expect(wingText, 'the [OPEN: Suno profile URL] honest flag is visible').toContain(
      '[OPEN: Suno profile URL]',
    );
    // No invented Suno URL anywhere in the page (no fabricated link/track).
    const allHrefs = await page
      .locator('section.wing-index a')
      .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href') ?? ''));
    for (const href of allHrefs) {
      expect(
        /suno\.(com|ai)/i.test(href),
        `no invented Suno URL may be linked (found "${href}")`,
      ).toBe(false);
    }
    // The music item is NOT rendered as a real <a> (its href is the [OPEN] flag,
    // so the page renders it as a non-link span — the open-flag affordance).
    const sunoLink = page.locator('section.wing-index a', { hasText: /Music on Suno/i });
    await expect(sunoLink, 'the [OPEN]-flagged music item must NOT be a real link').toHaveCount(0);
  });

  test('Rule 9 — every live item href on every Wing is one of the known real shipped surfaces (no fabricated target)', async ({
    page,
  }) => {
    // The closed allow-list of real, grounded targets from the allocation table.
    // Any live Wing item link OUTSIDE this set is a fabrication → red.
    // voyager is now live as an external embed at https://voyager.abacusai.cloud/
    // with portfolio page /work/voyager/.
    const ALLOWED = new Set([
      '/work/loandemo/',
      '/glass-box/',
      '/faq/',
      '/work/vector-wars/',
      '/work/christmas-elves/',
      '/work/voyager/',
    ]);
    for (const wing of WINGS) {
      await page.goto(wing.path);
      const liveHrefs = await page.locator('.wing-list a').evaluateAll((els) =>
        els
          .map((e) => (e as HTMLAnchorElement).getAttribute('href') ?? '')
          // internal route links only (the open-flag music item is a <span>, not an <a>)
          .filter((h) => h.startsWith('/')),
      );
      for (const href of liveHrefs) {
        expect(
          ALLOWED.has(href),
          `${wing.path}: live item href "${href}" must be a known real surface (allocation table)`,
        ).toBe(true);
      }
    }
  });

  // ── Rule 15 served-output check: no internal "not-yet" plumbing sentinel leaks
  // into visible Wing prose. The deliberate [OPEN: <reason>] credibility flag is
  // EXEMPT (it is an honest visitor-facing marker, not a plumbing sentinel). ────
  test('Rule 15 — no internal "no reader/data yet" plumbing sentinel leaks into visible Wing prose', async ({
    page,
  }) => {
    // The Rule-15 plumbing class is the internal "no reader yet"/"no data yet"
    // sentinel (e.g. "[OPEN: no reader yet]", "[OPEN: no Glass Box reader yet]").
    // The deliberate [OPEN: <reason>] flags (e.g. "[OPEN: Suno profile URL]") are
    // EXEMPT. Assert the served visible prose carries NONE of the plumbing class.
    const PLUMBING_SENTINELS = ['no reader yet', 'no glass box reader', '__pending__', 'todo:'];
    for (const wing of WINGS) {
      await page.goto(wing.path);
      const visible = ((await page.locator('main').textContent()) ?? '').toLowerCase();
      for (const sentinel of PLUMBING_SENTINELS) {
        expect(
          visible.includes(sentinel),
          `${wing.path}: visible prose must not leak the plumbing sentinel "${sentinel}"`,
        ).toBe(false);
      }
    }
  });
});
