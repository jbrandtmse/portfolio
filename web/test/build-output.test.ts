import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Build-output assertions for the design-system foundation (Story 1.2,
 * IAC-1 / IAC-2). These run a REAL `astro build` and assert on the produced
 * static HTML + CSS — the consumer-observable form of AC1/AC3/AC4 and genuine
 * real-runtime evidence for a user-facing surface (skill-rules Rule 3).
 *
 * The build runs once in beforeAll; every test reads from web/dist.
 */
const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(webRoot, 'dist');
const indexHtmlPath = join(distDir, 'index.html');

let indexHtml = '';
let builtCss = '';
// builtCss with the space after each declaration colon removed, so token-value
// assertions tolerate the minifier emitting `--x: 1px` vs `--x:1px`.
let builtCssNorm = '';

beforeAll(() => {
  // Resolve the real astro CLI bin regardless of where pnpm hoisted it
  // (workspace deps live in the root store, not web/node_modules/astro).
  const require = createRequire(import.meta.url);
  const astroPkgJson = require.resolve('astro/package.json');
  const astroBin = join(dirname(astroPkgJson), 'bin', 'astro.mjs');

  // Real production build — the same path `pnpm build` exercises.
  execFileSync('node', [astroBin, 'build'], {
    cwd: webRoot,
    stdio: 'pipe',
  });

  indexHtml = readFileSync(indexHtmlPath, 'utf8');

  // Concatenate every emitted stylesheet so token/font assertions are
  // location-independent (Astro hashes the filename).
  const cssDir = join(distDir, '_astro');
  builtCss = readdirSync(cssDir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(cssDir, f), 'utf8'))
    .join('\n');

  builtCssNorm = builtCss.replace(/:\s+/g, ':');
});

describe('built home page (web/dist/index.html)', () => {
  it('builds an index.html', () => {
    expect(existsSync(indexHtmlPath)).toBe(true);
  });

  it('has exactly one <html lang="en"> root', () => {
    // Astro appends a scoped data-attribute, so match the opening tag prefix.
    const matches = indexHtml.match(/<html lang="en"[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('renders the canonical Wordmark string', () => {
    expect(indexHtml).toContain('Joshua R. Brandt, MSE');
  });

  it('renders the primary action as a real <a> or <button> (not a div)', () => {
    const primary = indexHtml.match(/<(a|button)\b[^>]*class="[^"]*btn--primary[^"]*"[^>]*>/);
    expect(primary).not.toBeNull();
    expect(['a', 'button']).toContain(primary![1]);
  });

  it('includes the navy-fill primary button driven by the accent token', () => {
    // The built CSS must style .btn--primary with the accent custom property.
    // Astro appends a scoped [data-astro-cid-*] attribute to the selector.
    expect(builtCss).toMatch(/\.btn--primary[^{]*\{[^}]*var\(--color-accent\)/);
  });

  it('provides the global footer slot region', () => {
    expect(indexHtml).toMatch(/<footer[^>]*class="[^"]*site-footer[^"]*"/);
  });

  it('ships 0 <script> tags (0-JS-by-default, NFR-1)', () => {
    const scripts = indexHtml.match(/<script\b/g) ?? [];
    expect(scripts).toHaveLength(0);
  });

  it('references no JavaScript bundle from the document', () => {
    expect(indexHtml).not.toMatch(/\.js(["'?])/);
  });

  it('contains no exclamation marks in copy (only <!doctype> is allowed)', () => {
    const withoutDoctype = indexHtml.replace(/<!doctype html>/i, '');
    expect(withoutDoctype).not.toContain('!');
  });
});

describe('built CSS — tokens as the single source of truth (AC1 / IAC-2)', () => {
  it('emits the locked color custom properties verbatim', () => {
    expect(builtCssNorm).toContain('--color-surface-base:#f6f0e6');
    expect(builtCssNorm).toContain('--color-accent:#1e3a5f');
    expect(builtCssNorm).toContain('--color-ink-primary:#211b14');
  });

  it('emits the spacing scale and reading measures', () => {
    expect(builtCssNorm).toContain('--space-unit:8px');
    expect(builtCssNorm).toContain('--measure-reading:680px');
  });

  it('emits the radius scale', () => {
    expect(builtCssNorm).toContain('--radius-md:6px');
  });

  it('defines the reserved --shadow-float token', () => {
    expect(builtCssNorm).toContain('--shadow-float:');
  });

  it('applies no box-shadow to any surface (flat/hairline system, AC3)', () => {
    expect(builtCss).not.toMatch(/box-shadow:/);
  });
});

describe('built CSS — self-hosted Source Serif 4 (AC2 / NFR-5)', () => {
  it('declares an @font-face for Source Serif 4', () => {
    expect(builtCss).toMatch(/@font-face\{[^}]*Source Serif 4/);
  });

  it('uses font-display: swap', () => {
    expect(builtCss).toContain('font-display:swap');
  });

  it('serves the font self-hosted from /fonts (no Google Fonts request)', () => {
    expect(builtCss).toMatch(/src:url\(\/fonts\/source-serif-4-[^)]+\.woff2\)/);
    expect(builtCss).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  });

  it('ships the self-hosted woff2 asset in dist', () => {
    const fontPath = join(distDir, 'fonts', 'source-serif-4-latin-opsz.woff2');
    expect(existsSync(fontPath)).toBe(true);
  });
});

describe('dev-only style guide is not shipped', () => {
  it('does not emit a _styleguide route into dist (underscore page is unbuilt)', () => {
    const styleguidePaths = [
      join(distDir, '_styleguide', 'index.html'),
      join(distDir, '_styleguide.html'),
    ];
    for (const p of styleguidePaths) {
      expect(existsSync(p)).toBe(false);
    }
  });
});
