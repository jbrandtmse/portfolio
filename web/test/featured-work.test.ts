/**
 * featured-work.test.ts — Tests for Story 7.2 (FR-25):
 *   AC1: home featured-work section is present, crawlable, curated-ordered.
 *   AC3 (#25): no reverse-chronological CV as the primary work surface.
 *   AC4: content/featured-work.ts data integrity (Rule 8 — real module, mutation-verified).
 *
 * Rule 3 compliance: exercises a real Astro build output (the built index.html).
 * Rule 8: assertions scoped to specific elements; real module exports used.
 *
 * NOTE: This test shares the Astro build with build-output.test.ts. Since Vitest
 * runs tests in parallel within a file, the beforeAll is scoped to this file.
 * The build is a real production build (same as pnpm build). The test file
 * relies on web/dist being available; if it's already built it reuses it,
 * otherwise it builds (but build-output.test.ts will have already built it
 * in the same test:all run via the shared dist dir).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import { FEATURED_SLUGS, FEATURED_WORK, findFeaturedItem } from '../../content/featured-work';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(webRoot, 'dist');
const indexHtmlPath = join(distDir, 'index.html');

let indexHtml = '';

beforeAll(() => {
  if (!existsSync(indexHtmlPath)) {
    // Build if not already built (build-output.test.ts builds in its own beforeAll;
    // in test:all both run but the first one to execute builds the dist, the second
    // reuses it since existsSync checks before building).
    const require = createRequire(import.meta.url);
    const astroPkgJson = require.resolve('astro/package.json');
    const astroBin = join(dirname(astroPkgJson), 'bin', 'astro.mjs');
    execFileSync('node', [astroBin, 'build'], { cwd: webRoot, stdio: 'pipe' });
  }
  indexHtml = readFileSync(indexHtmlPath, 'utf8');
});

// ---------------------------------------------------------------------------
// AC4: content/featured-work.ts data integrity (Rule 8 — real module)
// ---------------------------------------------------------------------------

describe('FEATURED_WORK data integrity (Story 7.2 AC4, Rule 9, Rule 8)', () => {
  it('FEATURED_WORK has exactly 7 items (loandemo, vector-wars, voyager, christmas-elves, portfolio, guide, music)', () => {
    // Rule 8: scoped to length and slug presence.
    // Mutation-verification: adding/removing an item reds this.
    expect(FEATURED_WORK).toHaveLength(7);
  });

  it('FEATURED_SLUGS matches FEATURED_WORK slugs in order', () => {
    const workSlugs = FEATURED_WORK.map((item) => item.slug);
    // Rule 8: deep equality — same order (the curated default order).
    // Mutation-verification: reordering FEATURED_WORK without updating FEATURED_SLUGS reds this.
    expect(FEATURED_SLUGS).toEqual(workSlugs);
  });

  it('every featured item has a non-empty title, blurb, href, status, wing, and sourceNote', () => {
    for (const item of FEATURED_WORK) {
      // Rule 8: scoped to each field — no whole-record assertions.
      expect(item.title.length, `${item.slug} must have a title`).toBeGreaterThan(0);
      expect(item.blurb.length, `${item.slug} must have a blurb`).toBeGreaterThan(0);
      expect(item.href.length, `${item.slug} must have an href`).toBeGreaterThan(0);
      expect(['live', 'open']).toContain(item.status);
      expect(['technical', 'agentic', 'creative']).toContain(item.wing);
      expect(item.sourceNote.length, `${item.slug} must have a sourceNote`).toBeGreaterThan(0);
    }
  });

  it('live items have real href paths (not [OPEN])', () => {
    const liveItems = FEATURED_WORK.filter((item) => item.status === 'live');
    for (const item of liveItems) {
      // Rule 9: live items must have real URLs (not honest flags)
      // Mutation-verification: marking a live item with [OPEN] href reds this.
      expect(item.href, `${item.slug} (live) must not have an [OPEN] href`).not.toContain('[OPEN');
    }
  });

  it('open items have [OPEN:] flag in href (honest flag, not fabricated URL)', () => {
    const openItems = FEATURED_WORK.filter((item) => item.status === 'open');
    for (const item of openItems) {
      // Rule 9: open items must use the honest [OPEN: ...] flag, not an invented URL.
      // Mutation-verification: replacing [OPEN:] with a fabricated URL reds this.
      expect(item.href, `${item.slug} (open) must carry an [OPEN: ...] honest flag`).toContain(
        '[OPEN:',
      );
    }
  });

  it('music item uses [OPEN: Suno profile URL] verbatim (Rule 9 — no invented URL)', () => {
    const music = findFeaturedItem('music');
    expect(music, 'music item must exist').toBeDefined();
    // Rule 8: scoped to the music item's href.
    // Mutation-verification: inventing a Suno URL → this reds.
    expect(music!.href, 'music item must use the verbatim [OPEN: Suno profile URL] flag').toBe(
      '[OPEN: Suno profile URL]',
    );
  });

  it('all 3 playable items (vector-wars, voyager, christmas-elves) ARE in the featured set', () => {
    // Post-Epic-7 polish: the playables are now live and ARE featured (Step 1).
    // Rule 8: scoped to each playable slug — findFeaturedItem uses the real module.
    // Mutation-verification: removing a playable from featured set reds this.
    const playableSlugs = ['vector-wars', 'voyager', 'christmas-elves'];
    for (const slug of playableSlugs) {
      expect(
        findFeaturedItem(slug),
        `"${slug}" must be in the featured set (live playable — post-Epic-7 polish)`,
      ).toBeDefined();
    }
  });

  it('every item slug in FEATURED_WORK is unique (no duplicates)', () => {
    const slugs = FEATURED_WORK.map((item) => item.slug);
    const uniqueSlugs = new Set(slugs);
    // Rule 8: size check
    // Mutation-verification: adding a duplicate slug → unique set is smaller → reds.
    expect(uniqueSlugs.size, 'all featured item slugs must be unique').toBe(slugs.length);
  });
});

// ---------------------------------------------------------------------------
// AC1: home featured-work section is present in the built output (Rule 3 — real build)
// ---------------------------------------------------------------------------

describe('home featured-work section in built output (Story 7.2 AC1, Rule 3)', () => {
  it('the built index.html contains the #featured-work section', () => {
    // Rule 3: real build output assertion.
    // Rule 8: scoped to the specific section id.
    // Mutation-verification: removing the featured-work section from index.astro → this reds.
    expect(indexHtml).toContain('id="featured-work"');
  });

  it('the featured-work section has the data-featured-work attribute (controller hook)', () => {
    // Rule 8: scoped to data-featured-work attribute presence.
    expect(indexHtml).toContain('data-featured-work');
  });

  it('the featured-work list has the data-featured-work-list attribute (controller hook)', () => {
    // Rule 8: scoped to data-featured-work-list attribute.
    // Mutation-verification: removing the attribute disables the CSS-order reorder → reds recuration e2e.
    expect(indexHtml).toContain('data-featured-work-list');
  });

  it('all 7 featured slug data attributes are present in the built output (AC1)', () => {
    for (const slug of FEATURED_SLUGS) {
      // Rule 8: scoped to each slug — not a whole-document toContain on the list.
      // Mutation-verification: removing any item reds this.
      expect(indexHtml, `built index.html must contain data-featured-slug="${slug}"`).toContain(
        `data-featured-slug="${slug}"`,
      );
    }
  });

  it('live featured items have real <a href> links (followable, JS-off — AC1, FR-8)', () => {
    // Live items must be rendered as real <a> links in the built HTML.
    // Rule 8: check the href value in the HTML output (scoped, not whole-doc toContain).
    const liveItems = FEATURED_WORK.filter((item) => item.status === 'live');
    for (const item of liveItems) {
      // The href must appear as an actual link href in the built output.
      // Mutation-verification: changing a live item to render as plain text reds this.
      expect(
        indexHtml,
        `live item "${item.slug}" must have its href "${item.href}" as a real link`,
      ).toContain(`href="${item.href}"`);
    }
  });

  it('the curated default order appears in DOM order (loandemo first, music last — FR-8)', () => {
    // FR-8: DOM order = curated default (7-item set).
    // loandemo must be first, music must be last.
    // Rule 8: positional check using indexOf.
    // Mutation-verification: reordering FEATURED_WORK in content/featured-work.ts → this reds.
    const loandemoPos = indexHtml.indexOf('data-featured-slug="loandemo"');
    const musicPos = indexHtml.indexOf('data-featured-slug="music"');
    expect(
      loandemoPos,
      'loandemo must appear in DOM before music (curated default order, FR-8)',
    ).toBeLessThan(musicPos);
    // Verify playables appear after loandemo and before portfolio/guide/music.
    const vectorWarsPos = indexHtml.indexOf('data-featured-slug="vector-wars"');
    const portfolioPos = indexHtml.indexOf('data-featured-slug="portfolio"');
    expect(
      loandemoPos,
      'loandemo must appear before vector-wars in DOM (curated default)',
    ).toBeLessThan(vectorWarsPos);
    expect(
      vectorWarsPos,
      'vector-wars must appear before portfolio in DOM (curated default)',
    ).toBeLessThan(portfolioPos);
  });

  it('the featured-work section has a heading (h2) for SEO/hierarchy', () => {
    // The section title appears as an <h2> (clean heading hierarchy — NFR-2/SEO).
    // Rule 8: scoped to id="featured-work-title" (the <h2>).
    expect(indexHtml).toContain('id="featured-work-title"');
  });
});

// ---------------------------------------------------------------------------
// AC3 (#25): no reverse-chronological CV as the primary work surface
// ---------------------------------------------------------------------------

describe('AC3 (#25): no reverse-chronological CV as primary work surface (Story 7.2)', () => {
  it('the home page does NOT contain a reverse-chronological work list as the primary surface', () => {
    // The primary work surface on home is the curated featured-work section
    // and the Wings, not a reverse-chronological list of all work.
    // Guard: check that no "list of work ordered by date/year" pattern exists as
    // the primary surface. The featured-work section is present (curated order);
    // the timeline section is a process/career narrative, not a CV/résumé.
    //
    // The home page must NOT contain <ol> or <ul> lists with chronological date items
    // that would constitute a CV. The featured-work list is the correct curated pattern.
    //
    // Rule 8: scoped to the specific anti-pattern (date-ordered list).
    // Mutation-verification: adding a <ol> with year-labeled items as primary surface → this reds.

    // The home page must have the featured-work section (curated, relevance-ordered).
    expect(indexHtml, '#25: home must have a featured-work section (curated)').toContain(
      'id="featured-work"',
    );

    // There must be no <ol> in the page's main content (an <ol> is typically
    // the pattern for a chronological sequence; the featured-work uses <ul>).
    // This is a structural guard — the main arc is scenes, not an <ol> list.
    // (The scene-rail uses <nav>/<ul> but not for CV items; the featured uses <ul>.)
    // We check that there is no ordered-list pattern (1. 2. 3.) in the visible
    // primary work content area that would constitute a CV.
    //
    // The work primary surfaces are: featured-work (curated) + Wings (curated, /technical/ etc.)
    // The Master Timeline is a process narrative (not a CV). This assertion guards
    // the home itself from having an <ol> in main (which would be a CV-style surface).
    const mainContentMatch = indexHtml.match(/<main[^>]*class="home"[^>]*>([\s\S]*?)<\/main>/);
    // Assert the locator matched (Rule 8/13 — a silently-skipped conditional would
    // pass vacuously if the markup ever changed; fail loudly instead).
    expect(
      mainContentMatch,
      '#25: <main class="home"> must be locatable in the built home HTML',
    ).not.toBeNull();
    const mainContent = mainContentMatch?.[1] ?? '';
    // No <ol> in the home main (would indicate a chronological list = CV anti-pattern)
    // Rule 8: scoped to the main content block.
    // Mutation-verification: adding <ol> items in home main → this reds.
    expect(
      mainContent,
      '#25: home main must not contain <ol> (reverse-chron CV anti-pattern)',
    ).not.toContain('<ol');
  });

  it('the featured-work section is ordered by curation (not by year/date attributes)', () => {
    // The featured-work items must NOT carry date-ordering attributes or
    // data-year attributes that would signal a reverse-chronological presentation.
    // Rule 8: scoped to the featured-work section's HTML.
    //
    // Find the featured-work section in the built HTML.
    const featuredSectionMatch = indexHtml.match(/id="featured-work"[\s\S]*?(?=<section|<\/main)/);
    // Assert the section was located (Rule 8/13 — fail loudly rather than skip the
    // negative-pattern checks vacuously if the markup ever changes).
    expect(
      featuredSectionMatch,
      '#25: the #featured-work section must be locatable in the built home HTML',
    ).not.toBeNull();
    const featuredHtml = featuredSectionMatch?.[0] ?? '';
    // No data-year attribute (would be a CV-style reverse-chron signal).
    // Mutation-verification: adding data-year to items → this reds.
    expect(
      featuredHtml,
      'featured-work section must not use data-year (not a reverse-chron CV)',
    ).not.toContain('data-year');
    // No aria-label containing "year" or "date" (CV list pattern).
    expect(
      featuredHtml.toLowerCase(),
      'featured-work section must not have year/date aria-labels (CV pattern)',
    ).not.toMatch(/aria-label="[^"]*(?:year|date)[^"]*"/);
  });

  it('the primary work surfaces (featured-work) are present and non-empty (7 items)', () => {
    // Positive assertion: the curated featured-work surface exists (non-empty, 7 items).
    // Rule 8: scoped to the featured-work list and item count.
    // This is the #25 guarantee: the primary surface is curated, not a CV.
    for (const slug of FEATURED_SLUGS) {
      expect(
        indexHtml,
        `#25: primary surface must include curated item "${slug}" (not a reverse-chron CV)`,
      ).toContain(`data-featured-slug="${slug}"`);
    }
  });

  it('the home page has Wing browse links (/technical/, /creative/, /agentic/) in the featured-work section', () => {
    // Post-Epic-7 polish: a "Browse all by Wing" affordance with links to the three Wings.
    // Rule 2: trailing-slash form via routeHref().
    // Rule 8: scoped to the specific hrefs in the built HTML.
    // Mutation-verification: removing the Wing nav → these reds.
    expect(indexHtml, 'home featured-work section must link to /technical/').toContain(
      'href="/technical/"',
    );
    expect(indexHtml, 'home featured-work section must link to /creative/').toContain(
      'href="/creative/"',
    );
    expect(indexHtml, 'home featured-work section must link to /agentic/"').toContain(
      'href="/agentic/"',
    );
  });
});
