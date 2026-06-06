import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import { NAV_ROUTES, routeHref } from '../src/lib/routes';

/**
 * URL-form equality build-output test (Story 2.0, AC5; project-rules.md Rule 2).
 *
 * For EVERY Mirror route, asserts exact-string equality across the three surfaces:
 *   • internal-link form (as it appears in the built footer / /browse / home markup)
 *   • rel=canonical form (built from Astro.url.pathname + Astro.site)
 *   • sitemap <loc> form
 *
 * This is the CI lock: any future drift between the three surfaces will fail this
 * test and be caught before it ships, satisfying the Rule 2 mandate.
 *
 * The test is exact-string (not slash-normalized) — it is specifically designed
 * to catch form divergence, so normalization would defeat its purpose.
 *
 * Runs a real `astro build` once in beforeAll (the same path pnpm test:all exercises).
 */

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(webRoot, 'dist');

const SITE_ORIGIN = 'https://joshuabrandt.abacusai.cloud';

let indexHtml = '';
let browseHtml = '';
let sitemap = '';

beforeAll(() => {
  const require = createRequire(import.meta.url);
  const astroPkgJson = require.resolve('astro/package.json');
  const astroBin = join(dirname(astroPkgJson), 'bin', 'astro.mjs');

  execFileSync('node', [astroBin, 'build'], {
    cwd: webRoot,
    stdio: 'pipe',
  });

  indexHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
  browseHtml = readFileSync(join(distDir, 'browse', 'index.html'), 'utf8');
  sitemap = readFileSync(join(distDir, 'sitemap.xml'), 'utf8');
});

/**
 * Extract the footer block from built HTML (same helper pattern as build-output.test.ts).
 */
function footerBlock(html: string): string {
  const m = html.match(/<footer\b[^>]*class="[^"]*site-footer[^"]*"[^>]*>[\s\S]*?<\/footer>/);
  return m ? m[0] : '';
}

/**
 * Extract the <main> region from built HTML for /browse body assertions.
 */
function mainBlock(html: string): string {
  const m = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/);
  return m ? m[0] : '';
}

/**
 * Extract the canonical href from a built page's <link rel="canonical">.
 */
function extractCanonical(html: string): string | null {
  const m = html.match(/<link\b[^>]*\brel="canonical"[^>]*>/);
  if (!m) return null;
  const hrefM = m[0].match(/\bhref="([^"]+)"/);
  return hrefM ? hrefM[1]! : null;
}

/**
 * Extract the sitemap <loc> for a given route from the sitemap XML.
 */
function extractSitemapLoc(sitemapXml: string, route: string): string | null {
  // Build the expected loc form and find it in the sitemap.
  const expectedLoc = `${SITE_ORIGIN}${routeHref(route)}`;
  const m = sitemapXml.match(new RegExp(`<loc>(${expectedLoc.replace(/[/.]/g, '\\$&')})</loc>`));
  return m ? m[1]! : null;
}

// The Mirror routes for which we assert form equality (excludes '/' which has
// no rel=canonical on the home page by design — the cinematic entry does not
// self-canonicalize; its sitemap + link forms are still equal).
const CANONICAL_ROUTES = NAV_ROUTES.filter((r) => r.path !== '/').map((r) => r.path);

describe('Story 2.0 / Rule 2 — URL-form equality: link === canonical === sitemap (AC5)', () => {
  it('every route in the registry uses the trailing-slash href form via routeHref()', () => {
    // routeHref() is the single place the trailing-slash form is derived — assert
    // it produces the expected form for every registry path.
    for (const route of NAV_ROUTES) {
      const href = routeHref(route.path);
      if (route.path === '/') {
        expect(href, `root stays "/"`).toBe('/');
      } else {
        expect(href, `${route.path} → trailing-slash href`).toMatch(/\/$/);
        expect(href, `${route.path} → no double slash`).not.toMatch(/\/\//);
      }
    }
  });

  it('footer on the home page links every Mirror route in the trailing-slash form', () => {
    const footer = footerBlock(indexHtml);
    expect(footer, 'footer present on home').not.toBe('');

    for (const route of NAV_ROUTES) {
      const expectedHref = routeHref(route.path);
      const pattern = new RegExp(`<a\\b[^>]*\\shref="${expectedHref.replace(/\//g, '\\/')}"[^>]*>`);
      expect(footer, `footer link to ${expectedHref}`).toMatch(pattern);
    }
  });

  it('/browse body links every Mirror route in the trailing-slash form', () => {
    const main = mainBlock(browseHtml);
    expect(main, '/browse main block present').not.toBe('');

    for (const route of NAV_ROUTES) {
      const expectedHref = routeHref(route.path);
      const pattern = new RegExp(`<a\\b[^>]*\\shref="${expectedHref.replace(/\//g, '\\/')}"[^>]*>`);
      expect(main, `/browse body link to ${expectedHref}`).toMatch(pattern);
    }
  });

  it.each(CANONICAL_ROUTES)(
    'rel=canonical === routeHref() form on %s (exact-string, no slash-normalization)',
    (route) => {
      // Read the built page for this route.
      const htmlPath = join(distDir, ...route.split('/').filter(Boolean), 'index.html');
      const html = readFileSync(htmlPath, 'utf8');

      const canonical = extractCanonical(html);
      expect(canonical, `canonical present on ${route}`).not.toBeNull();

      // The canonical must be the exact absolute trailing-slash form.
      const expectedCanonical = `${SITE_ORIGIN}${routeHref(route)}`;
      expect(canonical, `canonical form on ${route}`).toBe(expectedCanonical);
    },
  );

  it.each(CANONICAL_ROUTES)(
    'sitemap <loc> === canonical form === link form for %s (three-way exact equality)',
    (route) => {
      const htmlPath = join(distDir, ...route.split('/').filter(Boolean), 'index.html');
      const html = readFileSync(htmlPath, 'utf8');

      const canonical = extractCanonical(html);
      expect(canonical, `canonical present on ${route}`).not.toBeNull();

      const sitemapLoc = extractSitemapLoc(sitemap, route);
      expect(sitemapLoc, `sitemap <loc> present for ${route}`).not.toBeNull();

      // Three-way exact-string equality — the lock against future drift.
      const expectedAbsolute = `${SITE_ORIGIN}${routeHref(route)}`;
      expect(canonical, `canonical === expected on ${route}`).toBe(expectedAbsolute);
      expect(sitemapLoc, `sitemap <loc> === expected on ${route}`).toBe(expectedAbsolute);
    },
  );

  it('the sitemap contains NO double-slash URLs (routeHref double-slash regression guard)', () => {
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    for (const loc of locs) {
      // The only "//" that should appear is in "https://", not in the path.
      expect(loc.replace('https://', ''), `no double-slash in path of ${loc}`).not.toMatch(/\/\//);
    }
  });

  it('link form === canonical form on the home page (footer "/" link === sitemap "/" loc)', () => {
    // The root "/" is special: the footer links to "/" (routeHref('/') === '/'),
    // and the sitemap <loc> is SITE_ORIGIN + "/" — they must agree.
    const footer = footerBlock(indexHtml);
    expect(footer).toMatch(/<a\b[^>]*\shref="\/"[^>]*>/);

    const rootLoc = sitemap.match(
      new RegExp(`<loc>(${SITE_ORIGIN.replace(/\//g, '\\/')}\\/)</loc>`),
    );
    expect(rootLoc, 'sitemap has root <loc>').not.toBeNull();
    expect(rootLoc![1]).toBe(`${SITE_ORIGIN}/`);
  });
});
