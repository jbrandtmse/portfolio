import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Build-output assertions for the Glass Box index route (Story 2.3).
 *
 * AC1: the index renders a dated vertical spine of BMAD Method Dots + artifact cards.
 * AC2: planning nodes + shipping node + ghosted "As it accrues" nodes; status in
 *       text + shape (ghost = dashed card + "As it accrues" text; no dead link).
 * AC3: recursion beat verbatim; Glass-Box-vs-Timeline cross-link to /timeline/.
 * AC4: 0 executable JS; spine degrades to real <ol> of dated artifact links.
 * AC5: real glassbox.json data consumed; each planning node links /glass-box/{slug}/;
 *       no 404 (slug exists in dist); chronological order matches artifact dates.
 * AC6: exactly ONE <h1>; ghost text uses --color-ink-ghost class marker.
 *
 * BUILD-ORDERING DISCIPLINE (Dev Notes):
 *  This suite GENERATES the render data before building — never relies on a
 *  stale on-disk glassbox.json. In beforeAll:
 *    1. Run `tsx scripts/build-content.ts` (the render-glassbox generator) to
 *       write web/src/generated/glassbox.json.
 *    2. Run `astro build` to produce the static pages under web/dist.
 *
 * Real-runtime evidence (skill-rules Rule 3: browser real-runtime via the e2e
 * spec; build-output here is the static-HTML consumer-observable tier).
 */

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');
const distDir = join(webRoot, 'dist');
const indexHtmlPath = join(distDir, 'glass-box', 'index.html');
// The Story 2.1 render output the index CONSUMES (generated in beforeAll).
const glassboxJsonPath = join(webRoot, 'src', 'generated', 'glassbox.json');

/** A minimal shape of the generated artifact metadata the index consumes. */
interface ArtifactMeta {
  slug: string;
  type: string;
  title: string;
  date: string;
  curatorNote: string;
}

/** Read the real generated glassbox.json (the producer the index consumes). */
function loadGlassboxJson(): ArtifactMeta[] {
  return JSON.parse(readFileSync(glassboxJsonPath, 'utf8')) as ArtifactMeta[];
}

/** All <script …> opening tags in the document. */
function allScriptTags(html: string): string[] {
  return html.match(/<script\b[^>]*>/gi) ?? [];
}

/** Count EXECUTABLE scripts — every <script> that is NOT an ld+json data block. */
function countExecutableScripts(html: string): number {
  return allScriptTags(html).filter(
    (tag) =>
      !/type\s*=\s*["']application\/ld\+json["']/i.test(tag) &&
      !/type\s*=\s*["']importmap["']/i.test(tag),
  ).length;
}

/** Extract all href values from artifact card read links in the index. */
function extractArtifactReadHrefs(html: string): string[] {
  // Matches href attributes pointing to /glass-box/{slug}/ paths.
  const matches = html.matchAll(/href="(\/glass-box\/[^/"]+\/)"/g);
  return [...matches].map((m) => m[1]!);
}

// ─── Known slugs from the 2.1 allowlist ──────────────────────────────────────
const EXPECTED_SLUGS = [
  'brainstorm',
  'pre-brief-research',
  'product-brief',
  'prd',
  'ux-design',
  'ux-experience',
] as const;

// ─── beforeAll: generate data + build ────────────────────────────────────────

let indexHtml = '';

beforeAll(() => {
  // Step 1: Generate web/src/generated/glassbox.json via the render pipeline.
  // MUST happen before `astro build` (discipline: never rely on a stale file).
  const tsxBin = join(repoRoot, 'node_modules', '.bin', 'tsx');
  const buildContentScript = join(repoRoot, 'scripts', 'build-content.ts');
  execFileSync(tsxBin, [buildContentScript], {
    cwd: repoRoot,
    stdio: 'pipe',
  });

  // Step 2: Run astro build to emit static pages into dist/.
  const require = createRequire(import.meta.url);
  const astroPkgJson = require.resolve('astro/package.json');
  const astroBin = join(dirname(astroPkgJson), 'bin', 'astro.mjs');
  execFileSync('node', [astroBin, 'build'], {
    cwd: webRoot,
    stdio: 'pipe',
  });

  indexHtml = readFileSync(indexHtmlPath, 'utf8');
}, 180_000);

// ─── Basic structure (AC1, AC6) ───────────────────────────────────────────────

describe('Story 2.3 AC6 — one <h1> and 0 executable JS', () => {
  it('emits /glass-box/index.html', () => {
    expect(existsSync(indexHtmlPath)).toBe(true);
  });

  it('has exactly one <h1>', () => {
    const h1Matches = indexHtml.match(/<h1[\s>]/gi) ?? [];
    expect(h1Matches).toHaveLength(1);
  });

  it('ships exactly 2 executable scripts — the Guide pill init only (Story 4.4 NFR-1 carve-out)', () => {
    // Story 4.4: ALL routes now ship the site-wide Guide pill (2 exec scripts).
    // /glass-box/ has NO InviteForm chunk, NO GuidePanel chunk — only the pill.
    const execCount = countExecutableScripts(indexHtml);
    expect(execCount, '/glass-box/ must have exactly 2 exec scripts (Guide pill only)').toBe(2);
  });

  it('has exactly one <h1> — card titles are h3, not h1', () => {
    // Cards MUST use <h3> for their titles, not h1/h2.
    const h3Matches = indexHtml.match(/<h3[\s>]/gi) ?? [];
    expect(h3Matches.length).toBeGreaterThan(0);
    // No drop-cap or editorial flourish (reserved for reader).
    // Verify the body contains NO drop-cap class reference.
    expect(indexHtml).not.toContain('artifact-body');
  });
});

// ─── AC3: recursion beat + cross-link ────────────────────────────────────────

describe('Story 2.3 AC3 — recursion beat + Glass-Box-vs-Timeline cross-link', () => {
  it('carries the verbatim recursion beat (core phrase)', () => {
    // The recursion beat must appear verbatim (AC3, UX-DR19). Adjacent words may
    // be separated by a newline + indentation in the built HTML (Astro preserves
    // the source line-wrap inside the <p>), so normalize runs of whitespace to a
    // single space before matching the verbatim phrase — line-wrapping is not a
    // copy change.
    const normalized = indexHtml.replace(/\s+/g, ' ');
    expect(normalized).toContain(
      "You're reading the build history of the site you're reading it on. " +
        "It's being built in the open, right now.",
    );
  });

  it('cross-links /timeline/ (Glass-Box-vs-Timeline boundary)', () => {
    expect(indexHtml).toContain('href="/timeline/"');
  });

  it('contains no exclamation marks in visible copy (positive-assertion voice)', () => {
    // Strip doctype, scripts (JS uses ! for negation), comments, then check body copy.
    // Story 4.4: the site-wide Guide pill adds inline Astro hydration scripts.
    const copyOnly = indexHtml
      .replace(/<!doctype html>/i, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    const bodyMatch = copyOnly.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (!bodyMatch) return;
    const textContent = bodyMatch[1]!.replace(/<[^>]+>/g, '');
    expect(textContent).not.toContain('!');
  });
});

// ─── AC4: semantic <ol> + real links ─────────────────────────────────────────

describe('Story 2.3 AC4 — spine is a semantic <ol>, JS-off degradable', () => {
  it('the build-story spine is a semantic <ol>', () => {
    // The spine MUST be an ordered list for JS-off degradation.
    expect(indexHtml).toContain('<ol class="glass-box__spine"');
  });

  it('every artifact link is a real <a> (no JS event handlers)', () => {
    // All links to /glass-box/{slug}/ are plain anchor tags.
    const hrefs = extractArtifactReadHrefs(indexHtml);
    // Each expected slug should have a real anchor.
    for (const slug of EXPECTED_SLUGS) {
      expect(hrefs).toContain(`/glass-box/${slug}/`);
    }
  });
});

// ─── AC5: real glassbox.json data consumed + chronological order ──────────────

describe('Story 2.3 AC5 — real glassbox.json data, slugs resolve, chronological order', () => {
  it('each planning node links a real /glass-box/{slug}/ reader page (no 404)', () => {
    for (const slug of EXPECTED_SLUGS) {
      // The reader page must exist in dist.
      const readerPath = join(distDir, 'glass-box', slug, 'index.html');
      expect(existsSync(readerPath), `Missing reader: /glass-box/${slug}/index.html`).toBe(true);

      // The index HTML must reference this slug's trailing-slash link.
      expect(indexHtml).toContain(`href="/glass-box/${slug}/"`);
    }
  });

  it('CONSUMES titles + dates from glassbox.json (not hardcoded)', () => {
    // ADVERSARIAL (QA): prove the index reads node titles/dates FROM the
    // generated data, never hardcodes them. We read glassbox.json at test time
    // and require every artifact's EXACT title and its machine date to appear in
    // the rendered index. A hardcoded title that drifts from the producer — or a
    // title typo in the manifest — fails here. Mutating glassbox.json (the
    // dependency) and rebuilding would change these strings; the index must
    // follow, which is what "consumed, not hardcoded" means (AC1/AC5).
    const artifacts = loadGlassboxJson();
    expect(artifacts.length).toBeGreaterThanOrEqual(6);
    for (const a of artifacts) {
      // The exact title from the data is present (ArtifactCard <h3> text).
      expect(indexHtml, `title not consumed from data: "${a.title}"`).toContain(a.title);
      // The machine-readable date is emitted verbatim in the <time datetime="…">
      // attribute (the card renders datetime={date} from the data).
      expect(indexHtml, `date not consumed for ${a.slug}: ${a.date}`).toContain(
        `datetime="${a.date}"`,
      );
      // The type chip text comes from the data too.
      expect(indexHtml, `type not consumed for ${a.slug}: ${a.type}`).toContain(a.type);
    }
  });

  it('the rendered chronological order EQUALS the glassbox.json date order', () => {
    // ADVERSARIAL (QA): stronger than the relative-order spot-check below — the
    // full sequence of artifact links in the HTML must equal the slugs sorted by
    // their real glassbox.json date (ascending). Catches any mis-sort that the
    // two-pair spot-check would miss (e.g. a 06-04 item rendered before a 06-02).
    const artifacts = loadGlassboxJson();
    const expectedOrder = [...artifacts]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((a) => a.slug);

    const renderedOrder = extractArtifactReadHrefs(indexHtml).map((h) =>
      h.replace(/^\/glass-box\//, '').replace(/\/$/, ''),
    );

    // Ties (same date) may resolve in either relative order; compare by date
    // VALUE sequence to stay deterministic across equal-date pairs.
    const dateBySlug = new Map(artifacts.map((a) => [a.slug, a.date]));
    const expectedDates = expectedOrder.map((s) => dateBySlug.get(s));
    const renderedDates = renderedOrder.map((s) => dateBySlug.get(s));
    expect(renderedDates).toEqual(expectedDates);
  });

  it('nodes appear in chronological order (dates from glassbox.json, ascending)', () => {
    // Parse all artifact link hrefs in order of appearance.
    const hrefs = extractArtifactReadHrefs(indexHtml);
    // The artifact links in the HTML should be a subset of EXPECTED_SLUGS in
    // chronological order — check that brainstorm/pre-brief-research/product-brief
    // (all 2026-06-02) appear before prd/ux-experience (2026-06-06).
    // ux-design (2026-06-04) should appear before prd/ux-experience.
    const slugOrder = hrefs
      .filter((h) => EXPECTED_SLUGS.some((s) => h.includes(s)))
      .map((h) => h.replace(/^\/glass-box\//, '').replace(/\/$/, ''));

    // Verify relative order constraints from known dates.
    const brainstormIdx = slugOrder.indexOf('brainstorm');
    const prdIdx = slugOrder.indexOf('prd');
    const uxDesignIdx = slugOrder.indexOf('ux-design');

    // All indexes must be found.
    expect(brainstormIdx).toBeGreaterThanOrEqual(0);
    expect(prdIdx).toBeGreaterThanOrEqual(0);
    expect(uxDesignIdx).toBeGreaterThanOrEqual(0);

    // brainstorm (2026-06-02) appears before prd (2026-06-06).
    expect(brainstormIdx).toBeLessThan(prdIdx);
    // ux-design (2026-06-04) appears before prd (2026-06-06).
    expect(uxDesignIdx).toBeLessThan(prdIdx);
  });

  it('the live site shipping node is present and non-ghosted (real href)', () => {
    // The shipping node links the live site.
    expect(indexHtml).toContain('href="https://joshuabrandt.abacusai.cloud/"');
    // And a "Live · in progress" pill (text, not just color).
    expect(indexHtml).toContain('Live · in progress');
  });

  it('the repo link is gated on repoPublic — no dead 404 anchor when private (AC2)', () => {
    // Code review (Story 2.3): the repo is currently PRIVATE (anonymous GET of
    // the GitHub URL returns 404). AC2 + Dev Notes require the repo URL be
    // flagged "[OPEN]" in VISIBLE TEXT until confirmed public — never shipped as
    // a live anchor that 404s for every public visitor. With repoPublic:false the
    // page must render the [OPEN: …] text and emit NO live repo anchor.
    expect(indexHtml).toContain('[OPEN: public repo/commits URL to be confirmed]');
    expect(indexHtml).not.toContain('href="https://github.com/jbrandtmse/portfolio"');
    // The status is carried in text (WCAG 1.4.1 / AC2 — never color/shape alone).
    expect(indexHtml).toContain('glass-box__repo-open');
  });
});

// ─── AC2: ghost nodes carry "As it accrues" text + no dead links ─────────────

describe('Story 2.3 AC2 — ghost nodes: "As it accrues" text, no missing link href', () => {
  it('carries three "As it accrues" ghost nodes', () => {
    // 3 ghost node types: architecture, epics, retrospective.
    const ghostMatches = indexHtml.match(/As it accrues/g) ?? [];
    // At minimum 3 occurrences (one per ghost card status text).
    expect(ghostMatches.length).toBeGreaterThanOrEqual(3);
  });

  it('ghost nodes carry architecture, epics, retrospective labels', () => {
    expect(indexHtml).toContain('architecture');
    expect(indexHtml).toContain('epics');
    expect(indexHtml).toContain('retrospective');
  });

  it('ghost nodes have no dead artifact reader href (no /glass-box/architecture/, etc.)', () => {
    // Ghost nodes must NOT link to non-existent reader pages.
    const ghostSlugs = ['architecture', 'epics-and-stories', 'retrospectives'];
    for (const ghostSlug of ghostSlugs) {
      // These slugs must not appear as /glass-box/{slug}/ reader links.
      expect(indexHtml).not.toContain(`href="/glass-box/${ghostSlug}/"`);
    }
  });

  it('ghost nodes carry dashed card class (ghost variant)', () => {
    // The ghost variant card class must appear in the HTML.
    expect(indexHtml).toContain('artifact-card--ghost');
  });

  it('ghost cards emit NO <time datetime> (no build-time timestamp — NFR-6 determinism)', () => {
    // Code review (Story 2.3): ghost nodes have no real date. A synthetic
    // `new Date().toISOString()` once leaked a per-build wall-clock timestamp
    // into each ghost card's <time datetime="…"> — making /glass-box/index.html
    // byte-different on every build (the Glass Box teaser is NFR-6 "regenerate
    // deterministically"). Lock it: every ghost card block has no <time>.
    const ghostBlocks = [
      ...indexHtml.matchAll(
        /<article class="artifact-card[^"]*artifact-card--ghost[^"]*"[^>]*>([\s\S]*?)<\/article>/g,
      ),
    ].map((m) => m[1]!);
    expect(ghostBlocks.length).toBe(3);
    for (const block of ghostBlocks) {
      expect(block, 'a ghost card must not emit a <time> element').not.toMatch(/<time\b/i);
    }
    // Defense in depth: no millisecond-precision ISO timestamp anywhere on the
    // page (real artifact dates are second-precision; a ".sssZ" would be `now`).
    expect(indexHtml).not.toMatch(/datetime="[^"]*\.\d{3}Z"/);
  });
});

// ─── AC1: TimelineDot + ArtifactCard present for each artifact ───────────────

describe('Story 2.3 AC1 — timeline-dot and artifact-card for each artifact', () => {
  it('renders filled dots for artifact nodes', () => {
    // timeline-dot--filled for real artifact nodes.
    expect(indexHtml).toContain('timeline-dot--filled');
  });

  it('renders the live dot for the shipping node', () => {
    // timeline-dot--live for the shipping node.
    expect(indexHtml).toContain('timeline-dot--live');
  });

  it('renders upcoming (dashed) dots for ghost nodes', () => {
    // timeline-dot--upcoming for ghost nodes.
    expect(indexHtml).toContain('timeline-dot--upcoming');
  });

  it('renders ArtifactCard components for each artifact (chip class present)', () => {
    // The chip class appears once per node (6 featured + 1 shipping + 3 ghost = 10+).
    const chipMatches = indexHtml.match(/class="artifact-card__chip"/g) ?? [];
    expect(chipMatches.length).toBeGreaterThanOrEqual(9);
  });
});

// ─── Forward-reference: 1.5 stub is resolved ────────────────────────────────

describe('Story 2.3 forward-reference — 1.5 stub resolved', () => {
  it('/glass-box/ no longer contains the Epic-1 stub note', () => {
    // The stub note from Story 1.5 must be gone.
    expect(indexHtml).not.toContain('The build-story index is on its way');
  });

  it('home page "Open the Glass Box" link points to /glass-box/', () => {
    // The home page teaser link from 1.4 must reach the real index.
    const homeHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
    expect(homeHtml).toContain('href="/glass-box/"');
  });

  it('footer /glass-box/ link is present (global footer)', () => {
    // The site footer links /glass-box/ and it now reaches the real index.
    expect(indexHtml).toContain('href="/glass-box/"');
  });
});
