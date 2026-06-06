import { expect, test } from '@playwright/test';

import { NAV_ROUTES, routeHref } from '../src/lib/routes';

/**
 * URL-FORM real-runtime pass (Story 2.0, AC6; project-rules.md Rule 2;
 * skill-rules Rule 3) — the user-observable outcome of the trailing-slash
 * normalization: following any internal route link resolves with a SINGLE 200
 * and NO redirect hop, and the landed page's <link rel="canonical"> equals the
 * URL the visitor actually landed on.
 *
 * This is the served-runtime tier that the AC5 build-output test (web/test/
 * url-form.test.ts) cannot prove: url-form.test.ts asserts link === canonical
 * === sitemap form in the static bytes, while AC6 is explicitly the behavior of
 * the BUILT SITE SERVED the way production serves it — "a single 200 response
 * (no /about → 301 → /about/ hop)". So this spec exercises the real preview
 * server (raw HTTP + a browser navigation), not the dist files on disk.
 *
 * PORTABLE ACROSS PREVIEW vs NGINX (the runtime nuance the dev discovered):
 * under `trailingSlash: 'always'`, the `astro preview` server returns 404 (NOT
 * 301) for the slashless form of a non-root route (e.g. /about), whereas
 * production nginx 301-redirects slashless → trailing-slash via its directory
 * `try_files`. A preview-based e2e therefore MUST NOT assert "slashless → 301 →
 * 200" (that 404s here). The portable, server-independent assertions are:
 *   (a) every rendered internal route link is ALREADY the trailing-slash form —
 *       so no slashless route link exists to trigger ANY redirect; and
 *   (b) navigating the trailing-slash URL returns 200 with zero redirect hops,
 *       and the page's rel=canonical equals the landed URL.
 * Both hold identically under preview and under nginx (nginx serves the
 * directory-index for the trailing-slash URL directly), so this spec proves the
 * Rule 2 outcome without depending on which server is in front of dist/.
 *
 * The route set is imported from the SAME registry (lib/routes.ts) the footer,
 * /browse, and the sitemap derive from, so this spec stays in lockstep as routes
 * are added — a new route is covered automatically.
 */

const SITE_ORIGIN = 'https://joshuabrandt.abacusai.cloud';

// Every Mirror route's trailing-slash href, derived from the single registry +
// the single helper (so the test can never disagree with what the site renders).
const ALL_HREFS = NAV_ROUTES.map((r) => routeHref(r.path));
// The non-root routes are the ones that carry a self-canonical (the home is the
// cinematic entry and does not self-canonicalize — view-source.spec.ts documents
// this), so the canonical-equality assertion is scoped to them.
const CANONICAL_ROUTES = NAV_ROUTES.filter((r) => r.path !== '/').map((r) => routeHref(r.path));

/** Extract the canonical href from served HTML, or null if there is none. */
function canonicalHref(html: string): string | null {
  const link = html.match(/<link\b[^>]*\brel="canonical"[^>]*>/i);
  if (!link) return null;
  const href = link[0].match(/\bhref="([^"]+)"/i);
  return href ? href[1]! : null;
}

/** Every same-origin route-shaped href in a served page's anchors. */
function internalAnchorHrefs(html: string): string[] {
  const hrefs = [...html.matchAll(/<a\b[^>]*\shref="([^"]*)"[^>]*>/gi)].map((m) => m[1]!);
  return hrefs.filter((h) => {
    // Route links are app-absolute paths ("/...") only. Exclude the forms AC2
    // says must NOT be slashed: in-page fragments, asset paths, the api proxy,
    // mailto/external, and the two well-known dotted files.
    if (!h.startsWith('/')) return false; // #frag, mailto:, http(s)://, relative
    if (h.startsWith('//')) return false; // protocol-relative external
    if (h.startsWith('/_astro/') || h.startsWith('/fonts/')) return false; // assets
    if (h.startsWith('/api/')) return false; // same-origin proxy path
    if (h === '/sitemap.xml' || h === '/robots.txt') return false; // dotted files
    return true;
  });
}

test.describe('Story 2.0 / Rule 2 — served-runtime URL form (AC6: no 301 hop)', () => {
  // (a) NO slashless route link exists anywhere the visitor could click. We read
  // the footer (present on EVERY page) on the home and on a Mirror route, and
  // assert every internal route href is the trailing-slash form. This is what
  // guarantees no redirect is ever triggered in the first place — the root cause
  // the story fixes — and it is identical under preview and nginx.
  for (const sourcePath of ['/', '/about/']) {
    test(`every internal route link served on ${sourcePath} is the trailing-slash form (no slashless link to redirect)`, async ({
      request,
    }) => {
      const res = await request.get(sourcePath);
      expect(res.status(), `${sourcePath} serves 200`).toBe(200);
      const html = await res.text();

      const routeHrefs = internalAnchorHrefs(html);
      // Sanity: the page actually has internal route links (the global footer
      // links all 10) — so the assertion below can never pass vacuously.
      expect(routeHrefs.length, `${sourcePath} renders internal route links`).toBeGreaterThan(0);

      for (const href of routeHrefs) {
        // Strip a query/hash if any before checking the path form.
        const pathOnly = href.replace(/[?#].*$/, '');
        expect(
          pathOnly,
          `internal route link "${href}" on ${sourcePath} is trailing-slash`,
        ).toMatch(/\/$/);
      }
    });
  }

  // (b) Navigating each trailing-slash URL returns a SINGLE 200 with zero
  // redirect hops. maxRedirects:0 makes any redirect surface as a non-2xx (so a
  // would-be 301 hop fails the test instead of being silently followed), and
  // res.url() must equal the requested URL (the URL did not change → no hop).
  for (const href of ALL_HREFS) {
    test(`GET ${href} is a single 200 with no redirect hop`, async ({ request }) => {
      const res = await request.get(href, { maxRedirects: 0 });
      expect(res.status(), `${href} returns 200 directly (no 3xx hop)`).toBe(200);
      // The effective URL is unchanged from what we requested — i.e. the server
      // served this URL directly rather than redirecting to another form.
      expect(new URL(res.url()).pathname, `${href} did not redirect to another path`).toBe(href);
    });
  }

  // (b cont.) On every self-canonical route, the rel=canonical equals the URL the
  // visitor landed on (absolute trailing-slash form) — the SEO signal sits on the
  // exact URL served, with no split between a slashless link and a slashed canonical.
  for (const href of CANONICAL_ROUTES) {
    test(`rel=canonical on ${href} equals the landed URL (canonical === served URL)`, async ({
      request,
    }) => {
      const res = await request.get(href, { maxRedirects: 0 });
      expect(res.status(), `${href} serves 200`).toBe(200);
      const html = await res.text();

      const canonical = canonicalHref(html);
      expect(canonical, `canonical present on ${href}`).not.toBeNull();
      // The canonical is the absolute form of the EXACT URL we landed on.
      expect(canonical, `canonical on ${href} === landed URL`).toBe(`${SITE_ORIGIN}${href}`);
    });
  }

  // The user-observable navigation: a visitor clicks a footer link in a real
  // browser and lands on the target with NO intermediate redirect response, and
  // the landed page's canonical matches the URL in the address bar.
  test('clicking a footer route link navigates with no redirect response and a matching canonical', async ({
    page,
  }) => {
    const responses: Array<{ url: string; status: number }> = [];
    page.on('response', (r) => responses.push({ url: r.url(), status: r.status() }));

    await page.goto('/');

    const footer = page.locator('footer.site-footer');
    const aboutLink = footer.locator('a[href="/about/"]');
    await expect(aboutLink, 'footer links /about/ in trailing-slash form').toHaveCount(1);

    await aboutLink.click();
    await page.waitForLoadState('load');

    // Landed on the trailing-slash URL (no client-side or server redirect moved us).
    await expect(page).toHaveURL(/\/about\/$/);

    // No 3xx response was observed for the /about document during the navigation
    // (the click resolved in a single 200, not a 301 → 200 hop).
    const aboutDocResponses = responses.filter((r) => /\/about\/?$/.test(new URL(r.url).pathname));
    expect(
      aboutDocResponses.some((r) => r.status >= 300 && r.status < 400),
      `no 3xx redirect served for the /about document during navigation (saw: ${aboutDocResponses
        .map((r) => r.status)
        .join(', ')})`,
    ).toBe(false);
    expect(
      aboutDocResponses.some((r) => r.status === 200),
      'the /about document resolved with a 200',
    ).toBe(true);

    // The landed page's canonical equals the landed URL.
    const landedCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(landedCanonical, 'canonical on the landed /about/ page').toBe(`${SITE_ORIGIN}/about/`);
  });
});
