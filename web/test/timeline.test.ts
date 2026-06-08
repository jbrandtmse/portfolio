import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Build-output assertions for the Master Timeline route (Story 2.4).
 *
 * AC1: a hand-curated manifest drives the timeline (no automated harvest)
 * AC2: era-bands + flagship clusters rendered from real manifest
 * AC3: one semantic <ol>; DOM order oldest→newest; 0 executable JS
 * AC4: no fabricated career facts (runway = era-band + faint ticks + ASSUMPTION/OPEN flags)
 * AC5: portfolio Dots → real /glass-box/{slug}/ (Glass Box pages exist);
 *      loandemo Dots → /work/loandemo/#… (forward-ref)
 * AC6: exactly ONE <h1>; aria-labels on era regions; 0 axe violations (e2e handles that)
 *
 * BUILD-ORDERING DISCIPLINE (Dev Notes):
 *  This suite runs `tsx scripts/build-content.ts` first (generates glassbox.json)
 *  then `astro build` — the same discipline as Story 2.2/2.3.
 *
 * Real-runtime evidence (skill-rules Rule 3): the static HTML is the consumer-
 * observable form. Browser real-runtime is in timeline.spec.ts (e2e).
 */

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');
const distDir = join(webRoot, 'dist');
const timelineHtmlPath = join(distDir, 'timeline', 'index.html');

/** All <script …> opening tags in the document. */
function allScriptTags(html: string): string[] {
  return html.match(/<script\b[^>]*>/gi) ?? [];
}

/** Count EXECUTABLE scripts — every <script> that is NOT an ld+json data block. */
function countExecutableScripts(html: string): number {
  return allScriptTags(html).filter((tag) => !/type\s*=\s*["']application\/ld\+json["']/i.test(tag))
    .length;
}

// ─── beforeAll: generate data + build ────────────────────────────────────────

beforeAll(() => {
  // Step 1: Generate web/src/generated/glassbox.json via the render pipeline.
  // The portfolio flagship Dots link /glass-box/{slug}/ — those pages must exist
  // when the test verifies link resolution. Generate first (AC5 discipline).
  const tsxBin = join(repoRoot, 'node_modules', '.bin', 'tsx');
  const buildContentScript = join(repoRoot, 'scripts', 'build-content.ts');
  execFileSync(tsxBin, [buildContentScript], {
    cwd: repoRoot,
    stdio: 'pipe',
  });

  // Step 2: Run astro build to emit the timeline + glass-box pages into dist/.
  const require = createRequire(import.meta.url);
  const astroPkgJson = require.resolve('astro/package.json');
  const astroBin = join(dirname(astroPkgJson), 'bin', 'astro.mjs');
  execFileSync('node', [astroBin, 'build'], {
    cwd: webRoot,
    stdio: 'pipe',
  });
}, 180_000);

// ─── AC1: the timeline page is built ─────────────────────────────────────────

describe('Story 2.4 AC1 — /timeline builds as a real static page (hand-curated manifest)', () => {
  it('builds /timeline/index.html', () => {
    expect(existsSync(timelineHtmlPath)).toBe(true);
    const html = readFileSync(timelineHtmlPath, 'utf8');
    expect(html).toMatch(/<html lang="en"[\s>]/);
    expect(html).toMatch(/<body[\s>]/);
  });

  it('renders the MirrorLayout heading "The Master Timeline"', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    expect(html).toContain('The Master Timeline');
  });

  it('the lede starts with "Joshua R. Brandt, MSE" (GEO floor, answer-first)', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // The answer-first lede paragraph in MirrorLayout has class mirror__lede.
    const ledeMatch = html.match(/<p\b[^>]*class="[^"]*mirror__lede[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    expect(ledeMatch, 'mirror__lede paragraph').not.toBeNull();
    const ledeText = ledeMatch![1]!.replace(/<[^>]+>/g, '').trim();
    expect(ledeText.startsWith('Joshua R. Brandt, MSE')).toBe(true);
  });
});

// ─── AC3: one <h1>, semantic <ol>, 0 executable JS ────────────────────────────

describe('Story 2.4 AC3 — one <h1>, semantic <ol>, 0 executable JS', () => {
  it('has exactly ONE <h1>', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    const h1s = html.match(/<h1\b[^>]*>/g) ?? [];
    expect(h1s).toHaveLength(1);
  });

  it('contains a semantic <ol> with aria-label for the timeline spine', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // The main timeline spine is an <ol> (not <ul> or <div>).
    expect(html).toMatch(/<ol\b[^>]*class="[^"]*timeline-spine[^"]*"[^>]*>/);
  });

  it('ships exactly 2 executable scripts — Guide pill only (NFR-1, Story 4.4 carve-out)', () => {
    // Story 4.4: ALL routes ship the site-wide Guide pill (2 exec scripts).
    // /timeline/ has no InviteForm chunk, no GuidePanel chunk, no external src= scripts.
    const html = readFileSync(timelineHtmlPath, 'utf8');
    expect(
      countExecutableScripts(html),
      '/timeline/ must have exactly 2 exec scripts (Guide pill only)',
    ).toBe(2);
    expect(html).not.toMatch(/<script\b[^>]*\bsrc=/);
    expect(html).not.toMatch(/<link\b[^>]*\brel="modulepreload"/);
    expect(html).not.toMatch(/InviteForm\.[a-zA-Z0-9_-]+\.js/);
    expect(html).not.toMatch(/GuidePanel\.[a-zA-Z0-9_-]+\.js/);
  });

  it('carries no exclamation marks in copy (positive-assertion voice)', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // Strip doctype, scripts (JS uses ! for negation), HTML comments.
    // Story 4.4: the site-wide Guide pill adds inline Astro hydration scripts.
    const noComments = html
      .replace(/<!doctype html>/i, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    expect(noComments).not.toContain('!');
  });
});

// ─── AC2: era-bands + flagship clusters present ───────────────────────────────

describe('Story 2.4 AC2 — era-bands and flagship clusters rendered', () => {
  it('renders the runway era-band label', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    expect(html).toContain('The Runway');
  });

  it('renders the agentic-turn era-band label', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    expect(html).toContain('The Agentic Turn');
  });

  it('renders the portfolio flagship node', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    expect(html).toContain('This portfolio');
  });

  it('renders the loandemo flagship node', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    expect(html).toContain('loandemo');
  });

  it('renders timeline-dot--milestone for flagship nodes', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    expect(html).toMatch(/timeline-dot--milestone/);
  });

  it('renders timeline-dot--faint for runway ticks', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    expect(html).toMatch(/timeline-dot--faint/);
  });

  it('era regions carry aria-label attributes (AC6 a11y)', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // Each era <li> has aria-label="Era: <name>"
    expect(html).toMatch(/aria-label="Era: The Runway"/);
    expect(html).toMatch(/aria-label="Era: The Agentic Turn"/);
  });

  it('renders exactly 3 faint runway-tick DOT ELEMENTS and at least 2 milestone flagship DOT ELEMENTS', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // Count the actual <span class="timeline-dot timeline-dot--{state}"> ELEMENTS
    // (not the single inlined CSS rule that also mentions the modifier). This
    // asserts the curated runway ticks (3 faint) are present and that flagships
    // are rendered (milestone dots). Story 6.1 (Stage 2) auto-harvests BMAD Dots
    // so the agentic-turn era now contains more than 2 milestone dots (epics,
    // retros, course-corrections are harvested alongside the loandemo + portfolio
    // flagships). The minimum threshold is 2 (the seed flagships) plus at least
    // all allowlisted harvested entries.
    const dotSpans = [
      ...html.matchAll(/<span\b[^>]*class="[^"]*\btimeline-dot\b[^"]*"[^>]*>/g),
    ].map((m) => m[0]);
    const faint = dotSpans.filter((s) => /timeline-dot--faint/.test(s)).length;
    const milestone = dotSpans.filter((s) => /timeline-dot--milestone/.test(s)).length;
    expect(faint, '3 faint runway ticks').toBe(3);
    // At minimum: loandemo + portfolio (seed) + harvested epics/retros/course-correction.
    // The exact count grows as the allowlist grows — assert it is at least 13
    // (2 seed flagships + 11 harvested entries: 6 planning-cluster + 5 epics +
    //  5 retros + 1 course-correction; note planning Dots are in the cluster, not
    //  milestone dots — only top-level flagship entries get milestone dots).
    // Actually: 2 seed flagships + 11 harvested top-level entries = 13 total.
    expect(
      milestone,
      'at least 13 milestone flagship dots (seed + harvested)',
    ).toBeGreaterThanOrEqual(13);
  });

  it('renders the 1px DASHED era divider between the runway and agentic-turn eras', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // The dashed hairline divider (decorative, aria-hidden) sits before the
    // agentic-turn era. Its class hook proves the era boundary is drawn.
    expect(html).toMatch(/class="[^"]*\bera-band__divider\b[^"]*"/);
    // The divider is decorative — aria-hidden so it is not announced.
    expect(html).toMatch(
      /<div\b[^>]*class="[^"]*\bera-band__divider\b[^"]*"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*class="[^"]*\bera-band__divider\b/,
    );
  });
});

// ─── AC4: no fabricated career facts — flagged unknowns only ─────────────────

describe('Story 2.4 AC4 — no fabricated career facts (credibility floor)', () => {
  it('the runway uses [ASSUMPTION] labels for approximate career markers', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // The runway faint ticks carry [ASSUMPTION] in their labels (not invented facts).
    expect(html).toContain('[ASSUMPTION]');
  });

  it('the loandemo cluster URL is flagged [OPEN] for unconfirmed URLs', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // The loandemo repo URL is not yet real — flagged [OPEN] in text.
    expect(html).toContain('[OPEN');
  });

  it('the runway does NOT contain fabricated specific employer/title names', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // We can't enumerate ALL possible inventions, but we can assert that the
    // runway section contains no years except approximate era markers.
    // The faint ticks use ~YYYY form; no real ISO dates for runway entries.
    // Assert the runway era does not contain any year in the 1990s-2010s as
    // a real date in a <time datetime="YYYY-"> (only ~YYYY text is allowed).
    const timeElems = html.match(/<time\b[^>]*datetime="([^"]+)"[^>]*>/g) ?? [];
    // Runway ticks must use ~YYYY form (not ISO) in datetime attr.
    for (const t of timeElems) {
      const datetimeMatch = t.match(/datetime="([^"]+)"/);
      if (!datetimeMatch) continue;
      const val = datetimeMatch[1]!;
      // Runway tick dates start with ~; real agentic-turn dates are ISO 2026-*
      // Valid: "~1996", "~2006", "~2016", "2026-06", "2026-06-02", etc.
      expect(val).toMatch(/^~\d+$|^20\d{2}/);
    }
  });

  it('the RUNWAY era block carries ONLY approximate ~YYYY dates — no real ISO date is fabricated there', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // Scope to the runway era's entries list specifically (the prior test allows
    // any "20YY" datetime ANYWHERE; this one proves the runway itself never
    // smuggles a fabricated exact date). Extract from the runway entries <ol> up
    // to the agentic-turn era marker.
    const runwayStart = html.indexOf('timeline-era__entries--runway');
    const agenticStart = html.indexOf('timeline-era--agentic-turn');
    expect(runwayStart, 'runway entries list present').toBeGreaterThan(-1);
    expect(agenticStart, 'agentic-turn era present').toBeGreaterThan(runwayStart);
    const runwayBlock = html.slice(runwayStart, agenticStart);
    const runwayDatetimes = [...runwayBlock.matchAll(/datetime="([^"]+)"/g)].map((m) => m[1]!);
    // There must BE runway tick dates (non-vacuous) and EVERY one is ~YYYY.
    expect(runwayDatetimes.length).toBeGreaterThan(0);
    for (const dt of runwayDatetimes) {
      expect(
        dt,
        `runway datetime "${dt}" must be approximate (~YYYY), never a real ISO date`,
      ).toMatch(/^~\d{4}$/);
    }
    // And the visible runway text must not contain a bare 19xx/20xx year that
    // would read as a hard career fact (only the "~" approximations are allowed).
    const runwayText = runwayBlock.replace(/<[^>]+>/g, ' ');
    expect(runwayText).not.toMatch(/(?<![~\d])(?:19|20)\d{2}(?!\d)/);
  });

  it('every runway tick label that asserts a career marker is flagged [ASSUMPTION]', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    const runwayStart = html.indexOf('timeline-era__entries--runway');
    const agenticStart = html.indexOf('timeline-era--agentic-turn');
    const runwayBlock = html.slice(runwayStart, agenticStart);
    // Each runway tick name lives in a .timeline-tick__name span.
    const tickNames = [...runwayBlock.matchAll(/timeline-tick__name[^>]*>([^<]*)</g)].map((m) =>
      m[1]!.trim(),
    );
    expect(tickNames.length).toBeGreaterThan(0);
    for (const name of tickNames) {
      expect(
        name,
        `runway tick "${name}" must be flagged [ASSUMPTION] (no invented fact)`,
      ).toContain('[ASSUMPTION]');
    }
  });

  it('the loandemo [OPEN] flag rides on a REAL forward-ref link — not a dead "[OPEN]" no-link node', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // The unconfirmed loandemo repo URL is flagged [OPEN] in TEXT, but the Dot is
    // still a working <a> to /work/loandemo/#code (the route exists; the fragment
    // lands in 2.5). Guard against a regression that drops the link and leaves a
    // dead [OPEN] placeholder as the only loandemo affordance.
    expect(html).toContain('[OPEN');
    // No dot is rendered via the dead href="[OPEN]" branch.
    expect(html).not.toMatch(/href="\[OPEN\]"/);
    // The #code Dot is a real anchor, and the [OPEN ...] flag is nearby text.
    const codeAnchorBlock = html.match(
      /<a\b[^>]*href="\/work\/loandemo\/#code"[^>]*>[\s\S]*?<\/li>/,
    );
    expect(codeAnchorBlock, 'loandemo #code anchor + its list item').not.toBeNull();
    expect(codeAnchorBlock![0]).toContain('[OPEN');
  });
});

// ─── AC5: portfolio Dots resolve to real Glass Box pages (Integration AC) ────

describe('Story 2.4 AC5 — portfolio Dots resolve to existing Glass Box pages', () => {
  const PORTFOLIO_SLUGS = [
    'brainstorm',
    'pre-brief-research',
    'product-brief',
    'prd',
    'ux-design',
    'ux-experience',
  ] as const;

  it('all portfolio flagship Dots render real /glass-box/{slug}/ links', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    for (const slug of PORTFOLIO_SLUGS) {
      const pattern = new RegExp(`href="/glass-box/${slug}/"`);
      expect(html, `link to /glass-box/${slug}/`).toMatch(pattern);
    }
  });

  it('each portfolio Dot href resolves to an existing built page (no 404)', () => {
    // The glass-box reader pages were generated + built in beforeAll.
    for (const slug of PORTFOLIO_SLUGS) {
      const readerPath = join(distDir, 'glass-box', slug, 'index.html');
      expect(existsSync(readerPath), `/glass-box/${slug}/index.html exists`).toBe(true);
    }
  });

  it('loandemo Dots render /work/loandemo/#… links (forward-ref to Story 2.5)', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // The loandemo route exists (1.5 stub); fragments land in 2.5.
    expect(html).toMatch(/href="\/work\/loandemo\/#code"/);
    expect(html).toMatch(/href="\/work\/loandemo\/#build"/);
    expect(html).toMatch(/href="\/work\/loandemo\/#retro"/);
  });

  it('the /work/loandemo/ route is built (the forward-ref target exists)', () => {
    const loandemoPath = join(distDir, 'work', 'loandemo', 'index.html');
    expect(existsSync(loandemoPath)).toBe(true);
  });

  it('the cross-link to /glass-box/ is present (Glass Box integration AC)', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    expect(html).toMatch(/href="\/glass-box\/"/);
  });

  it('is self-canonical to its trailing-slash URL (Rule 2 / Story 2.0 AC3)', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    const SITE_ORIGIN = 'https://joshuabrandt.abacusai.cloud';
    const canonicalMatch = html.match(/<link\b[^>]*\brel="canonical"[^>]*>/);
    expect(canonicalMatch, 'rel=canonical present').not.toBeNull();
    const hrefMatch = canonicalMatch![0].match(/\bhref="([^"]+)"/);
    expect(hrefMatch).not.toBeNull();
    expect(hrefMatch![1]).toBe(`${SITE_ORIGIN}/timeline/`);
  });
});

// ─── AC3: DOM order is oldest → newest (both orientations share the same HTML) ─

describe('Story 2.4 AC3 — DOM reading order is oldest → newest', () => {
  it('the runway era appears before the agentic-turn era in DOM order', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    const runwayPos = html.indexOf('timeline-era--runway');
    const agenticPos = html.indexOf('timeline-era--agentic-turn');
    expect(runwayPos).toBeGreaterThan(-1);
    expect(agenticPos).toBeGreaterThan(-1);
    // Runway (older) must appear before agentic-turn (newer) in DOM.
    expect(runwayPos).toBeLessThan(agenticPos);
  });

  it('loandemo flagship appears before portfolio flagship in DOM order', () => {
    // loandemo is earlier in the agentic-turn era than the portfolio.
    const html = readFileSync(timelineHtmlPath, 'utf8');
    const loandemoPos = html.indexOf('loandemo');
    const portfolioPos = html.indexOf('This portfolio');
    expect(loandemoPos).toBeGreaterThan(-1);
    expect(portfolioPos).toBeGreaterThan(-1);
    expect(loandemoPos).toBeLessThan(portfolioPos);
  });
});

// ─── Story 2.3 regression: TimelineDot extension didn't break existing states ─

describe('Story 2.4 — 2.3 faint/milestone extension does not regress (TimelineDot)', () => {
  it('the timeline page uses the extended dot states (faint + milestone)', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // Both new states must appear in the built page (proves the extension works).
    expect(html).toContain('timeline-dot--faint');
    expect(html).toContain('timeline-dot--milestone');
  });

  it('all timeline dots carry aria-hidden="true" (decorative; meaning in text)', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    // There must BE dots on the page (non-vacuous).
    const dots = (html.match(/class="[^"]*\btimeline-dot\b[^"]*"/g) ?? []).length;
    expect(dots).toBeGreaterThan(0);
    // Every dot <span> must be aria-hidden (decorative; meaning lives in adjacent
    // text). Match the full span and check it contains aria-hidden — this is
    // robust to Astro emitting the class/aria-hidden attributes in either order.
    const allDotSpans = [
      ...html.matchAll(/<span[^>]*class="[^"]*\btimeline-dot\b[^"]*"[^>]*>/g),
    ].map((m) => m[0]);
    for (const span of allDotSpans) {
      expect(span, `dot span should be aria-hidden: ${span}`).toMatch(/aria-hidden="true"/);
    }
  });
});

// ─── Global footer + site structure ───────────────────────────────────────────

describe('Story 2.4 — global footer and site structure', () => {
  it('renders the global site-footer (MirrorLayout via BaseLayout)', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    expect(html).toMatch(/<footer\b[^>]*class="[^"]*site-footer[^"]*"/);
  });

  it('the footer links /timeline/ (the timeline is in the nav)', () => {
    const html = readFileSync(timelineHtmlPath, 'utf8');
    const footer =
      html.match(/<footer\b[^>]*class="[^"]*site-footer[^"]*"[^>]*>[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(footer).toMatch(/href="\/timeline\/"/);
  });
});
