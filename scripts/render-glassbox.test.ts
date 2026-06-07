/**
 * render-glassbox.test.ts — unit tests for the Glass Box render pipeline (Story 2.1).
 *
 * Tests assert:
 *  (a) Every allowlisted slug is present in the rendered output.
 *  (b) NONE of the never-render files appear (default-deny verified by test).
 *  (c) Every entry has a unique `slug`, non-empty `body`, ISO-8601 `date`,
 *      and a `type` in the declared union.
 *  (d) Determinism: two renderGlassbox() calls return deep-equal output.
 *  (e) Fail-loud: missing allowlisted file throws, not silently skips.
 *  (f) No network primitive in the render-glassbox.ts source.
 *
 * The pure `renderGlassbox()` function is the testable surface — no Astro
 * build required, no side effects, no generated file on disk.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  GLASSBOX_ALLOWLIST,
  type GlassboxEntry,
  type GlassboxType,
} from '../content/glassbox.allowlist.ts';
import { byCodeUnit, renderGlassbox, type GlassboxArtifact } from './render-glassbox.ts';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptsDir, '..');

/** Valid GlassboxType values — must match the union in glassbox.allowlist.ts. */
const VALID_TYPES: GlassboxType[] = [
  'brief',
  'brainstorm',
  'research',
  'prd',
  'ux',
  'architecture',
  'epics',
  'retrospective',
  'shipping',
];

/** ISO-8601 pattern as emitted by git --format=%cI or the fallback constant. */
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

/**
 * NEVER-RENDER CORPUS — the real internal/process-private paths that must
 * never appear in the Glass Box output. At least one representative per family:
 *  - *.decision-log.md  (private decision trails)
 *  - review-*.md        (review-adversarial, -downstream, -rubric, etc.)
 *  - reconcile-*.md     (process syncs)
 *  - addendum.md        (internal addenda)
 */
const NEVER_RENDER_SOURCE_FILES: string[] = [
  // decision-log family
  '_bmad-output/planning-artifacts/briefs/brief-portfolio-2026-06-02/addendum.md',
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/addendum.md',
  // review family
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/review-adversarial.md',
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/review-downstream.md',
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/review-rubric.md',
  '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-accessibility.md',
  '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-peer-credibility.md',
  '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-seo-geo.md',
  '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/review-voice.md',
  // reconcile family
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/reconcile-brief.md',
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/reconcile-brainstorm.md',
  '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/reconcile-research.md',
];

// Run the real renderGlassbox once and share the result across all tests.
// (Determinism test runs a second call independently.)
const rendered: GlassboxArtifact[] = renderGlassbox(GLASSBOX_ALLOWLIST, repoRoot);

describe('render-glassbox — AC1/AC3: default-deny — allowlist is the ONLY source of truth', () => {
  it('renders exactly the slugs declared in GLASSBOX_ALLOWLIST (no more, no less)', () => {
    const expectedSlugs = GLASSBOX_ALLOWLIST.map((e) => e.slug).sort();
    const actualSlugs = rendered.map((a) => a.slug).sort();
    expect(actualSlugs).toEqual(expectedSlugs);
  });

  it('NONE of the never-render source files appear as a body in the output', () => {
    // Build a set of the bodies of files that must never render.
    // We check that no rendered entry's body equals the body of a never-render file.
    // This is the definitive default-deny proof: the render iterates the ALLOWLIST,
    // not the filesystem, so these bodies can only appear if they were somehow listed.
    for (const neverPath of NEVER_RENDER_SOURCE_FILES) {
      let neverBody: string;
      try {
        neverBody = readFileSync(join(repoRoot, neverPath), 'utf8');
      } catch {
        // File might not exist in CI; the point is: if it exists, it must not appear.
        continue;
      }
      const leaked = rendered.find((a) => a.body === neverBody);
      expect(leaked, `never-render file body leaked: ${neverPath}`).toBeUndefined();
    }
  });

  it('NONE of the never-render source files match any rendered slug (path-based check)', () => {
    const allowlistedPaths = new Set(GLASSBOX_ALLOWLIST.map((e) => e.sourceFile));
    for (const neverPath of NEVER_RENDER_SOURCE_FILES) {
      expect(
        allowlistedPaths.has(neverPath),
        `never-render path is in allowlist: ${neverPath}`,
      ).toBe(false);
    }
  });
});

describe('render-glassbox — AC5: data contract — every entry has required fields', () => {
  it('every rendered artifact has a unique slug', () => {
    const slugs = rendered.map((a) => a.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('every rendered artifact has a non-empty body', () => {
    for (const artifact of rendered) {
      expect(artifact.body.trim().length, `empty body for slug "${artifact.slug}"`).toBeGreaterThan(
        0,
      );
    }
  });

  it('every rendered artifact has a valid ISO-8601 date', () => {
    for (const artifact of rendered) {
      expect(
        ISO_8601.test(artifact.date),
        `invalid date "${artifact.date}" for slug "${artifact.slug}"`,
      ).toBe(true);
    }
  });

  it('every rendered artifact has a type within the declared union', () => {
    for (const artifact of rendered) {
      expect(
        VALID_TYPES.includes(artifact.type as GlassboxType),
        `unknown type "${artifact.type}" for slug "${artifact.slug}"`,
      ).toBe(true);
    }
  });

  it('every rendered artifact has a non-empty title and curatorNote', () => {
    for (const artifact of rendered) {
      expect(
        artifact.title.trim().length,
        `empty title for slug "${artifact.slug}"`,
      ).toBeGreaterThan(0);
      expect(
        artifact.curatorNote.trim().length,
        `empty curatorNote for slug "${artifact.slug}"`,
      ).toBeGreaterThan(0);
    }
  });

  it('rendered set is non-empty for the seeded launch allowlist', () => {
    expect(rendered.length).toBeGreaterThan(0);
  });
});

describe('render-glassbox — AC2/AC3: determinism — same git state → identical output', () => {
  it('two renderGlassbox() calls return deep-equal output', () => {
    const second = renderGlassbox(GLASSBOX_ALLOWLIST, repoRoot);
    expect(second).toEqual(rendered);
  });

  it('output is sorted by date ascending then slug (stable order)', () => {
    for (let i = 1; i < rendered.length; i++) {
      const prev = rendered[i - 1]!;
      const curr = rendered[i]!;
      const dateCmp = prev.date.localeCompare(curr.date);
      if (dateCmp < 0) continue; // earlier date before later date — correct
      if (dateCmp === 0) {
        // Same date: slug must be ascending
        expect(prev.slug.localeCompare(curr.slug)).toBeLessThanOrEqual(0);
      } else {
        // Later date before earlier — sort violation
        expect(dateCmp).toBeLessThanOrEqual(0);
      }
    }
  });
});

describe('render-glassbox — AC4: fail-loud on missing allowlisted file', () => {
  it('throws (does not silently skip) when an allowlisted sourceFile is missing', () => {
    const phantom: GlassboxEntry = {
      sourceFile: '_bmad-output/this-does-not-exist-sentinel.md',
      type: 'brief',
      slug: 'phantom',
      title: 'Phantom',
      curatorNote: 'Should never render.',
    };
    expect(() => renderGlassbox([phantom], repoRoot)).toThrow();
  });

  it('the thrown error message identifies the missing file', () => {
    const phantom: GlassboxEntry = {
      sourceFile: '_bmad-output/this-does-not-exist-sentinel.md',
      type: 'brief',
      slug: 'phantom',
      title: 'Phantom',
      curatorNote: 'Should never render.',
    };
    expect(() => renderGlassbox([phantom], repoRoot)).toThrow(/this-does-not-exist-sentinel\.md/);
  });
});

describe('render-glassbox — source-level no-network guard (mirrors build-content.test.ts)', () => {
  const renderSource = readFileSync(join(scriptsDir, 'render-glassbox.ts'), 'utf8');
  // Strip block then line comments — doc comments legitimately name banned APIs.
  const renderCode = renderSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

  it('introduces no wall-clock nondeterminism (no Date.now / Math.random / argless new Date)', () => {
    expect(renderCode).not.toMatch(/Date\.now\s*\(/);
    expect(renderCode).not.toMatch(/Math\.random\s*\(/);
    expect(renderCode).not.toMatch(/new\s+Date\s*\(\s*\)/);
  });

  it('performs no network reads (no fetch / http client / network import)', () => {
    expect(renderCode).not.toMatch(/\bfetch\s*\(/);
    expect(renderCode).not.toMatch(/\bimport\b[^;]*\bnode:https?\b/);
    expect(renderCode).not.toMatch(/\b(?:axios|got|undici|node-fetch)\b/);
    expect(renderCode).not.toMatch(/https?:\/\//);
  });
});

// ─── Story 4.0 AC1/AC3: locale-independent code-unit sort (determinism hardening) ─
//
// The old localeCompare() was ICU/host-locale-sensitive for non-ASCII strings —
// a latent NFR-6 surface once a non-ASCII slug entered the allowlist (secondary
// key). byCodeUnit() replaces it with a fully-deterministic code-unit compare.
//
// Non-vacuousness guarantee: an ASCII-only set produces the same sort order under
// any locale; we MUST use non-ASCII slugs to distinguish byCodeUnit() from
// localeCompare() (the case the old code was latent on). The tests below use a
// fixture with a non-ASCII slug so a revert to bare localeCompare() does NOT
// vacuously pass.
//
// Rule 8 compliance: tests import the REAL byCodeUnit from render-glassbox.ts
// (not an inline copy), and renderGlassbox is called with a synthetic allowlist
// so the sort behaviour is isolated from git IO.

describe('Story 4.0 AC1/AC3 — byCodeUnit: locale-independent comparator', () => {
  // byCodeUnit must return the same sign as code-unit order, regardless of locale.

  it('returns negative when a < b in code-unit order', () => {
    expect(byCodeUnit('abc', 'abd')).toBeLessThan(0);
  });

  it('returns zero when a === b', () => {
    expect(byCodeUnit('abc', 'abc')).toBe(0);
  });

  it('returns positive when a > b in code-unit order', () => {
    expect(byCodeUnit('abd', 'abc')).toBeGreaterThan(0);
  });

  // The non-ASCII cases that distinguish byCodeUnit from locale-sensitive localeCompare.
  // Swedish locale treats 'ä' (U+00E4) as coming after 'z', but German locale places it
  // near 'a'. Code-unit order: 'a' < 'z' < 'ä' (U+00E4 = 228 > 'z' = 122).
  it('orders non-ASCII slugs by code-unit value, not locale (ä > z in code-unit)', () => {
    // U+00E4 'ä' = 228, 'z' = 122 → 'ä' > 'z' by code-unit
    expect(byCodeUnit('ä', 'z')).toBeGreaterThan(0);
    expect(byCodeUnit('z', 'ä')).toBeLessThan(0);
  });

  it('is consistent: byCodeUnit(a,b) and byCodeUnit(b,a) are opposite signs', () => {
    expect(byCodeUnit('café', 'cafe') * byCodeUnit('cafe', 'café')).toBeLessThan(0);
  });
});

describe('Story 4.0 AC1/AC3 — renderGlassbox sort is locale-independent for non-ASCII slugs', () => {
  // Synthetic minimal allowlist with a mix of ASCII and non-ASCII slugs on the SAME
  // date. The non-ASCII slug 'ñoño' (U+00F1 = 241) sorts AFTER all ASCII slugs in
  // code-unit order. Under some locale-collation rules it would sort differently.
  // This test asserts that renderGlassbox places it LAST — which is correct under
  // code-unit ordering, and would differ under e.g. Spanish locale-collation.
  //
  // We inject a fake repoRoot path that resolves to the real fixture directory so
  // that readFileSync + gitCommitterDate can find real files. We use the fixture
  // pattern (write temp files + pass their real paths) to keep IO minimal.

  const tmpDir = '/tmp/rg-nonascii-test-' + process.pid;

  beforeAll(async () => {
    const { mkdirSync, writeFileSync } = await import('node:fs');
    mkdirSync(`${tmpDir}/content`, { recursive: true });
    // Write three minimal markdown files: ASCII slugs 'alpha', 'zeta', plus 'ñoño'.
    writeFileSync(`${tmpDir}/content/alpha.md`, '# Alpha\nContent alpha.\n', 'utf8');
    writeFileSync(`${tmpDir}/content/zeta.md`, '# Zeta\nContent zeta.\n', 'utf8');
    writeFileSync(`${tmpDir}/content/nonascii.md`, '# Ñoño\nContent ñoño.\n', 'utf8');
  });

  afterAll(async () => {
    const { rmSync } = await import('node:fs');
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('sorts a non-ASCII slug after ASCII slugs on the same date (code-unit order, not locale)', () => {
    // All three entries share the same FALLBACK date (no git log in tmpDir),
    // so order is determined entirely by the slug secondary key.
    const allowlist: import('../content/glassbox.allowlist.ts').GlassboxEntry[] = [
      {
        sourceFile: 'content/nonascii.md',
        type: 'brief',
        slug: 'ñoño', // U+00F1 = 241 → code-unit sorts AFTER 'z' (122) and 'alpha'
        title: 'Ñoño',
        curatorNote: 'Non-ASCII slug fixture.',
      },
      {
        sourceFile: 'content/zeta.md',
        type: 'brief',
        slug: 'zeta', // 'z' = 122 → code-unit sorts after 'alpha'
        title: 'Zeta',
        curatorNote: 'ASCII slug zeta.',
      },
      {
        sourceFile: 'content/alpha.md',
        type: 'brief',
        slug: 'alpha', // 'a' = 97 → code-unit sorts first
        title: 'Alpha',
        curatorNote: 'ASCII slug alpha.',
      },
    ];

    const result = renderGlassbox(allowlist, tmpDir);
    const slugOrder = result.map((a) => a.slug);

    // Code-unit order: 'alpha' (a=97) < 'zeta' (z=122) < 'ñoño' (ñ=241)
    expect(slugOrder).toEqual(['alpha', 'zeta', 'ñoño']);

    // Mutation-check anchor: if byCodeUnit were reverted to localeCompare() with a
    // Spanish locale ('ñ' near 'n'), 'ñoño' would sort BEFORE 'zeta', breaking
    // this assertion. The non-ASCII fixture is what makes this test non-vacuous.
  });
});
