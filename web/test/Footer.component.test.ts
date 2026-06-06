import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

import Footer from '../src/components/common/Footer.astro';

/**
 * Isolated component-render assertions for Footer (Story 1.7, AC1 / AC3;
 * IAC-1). The global static-fallback footer is the JS-off / screen-reader floor
 * (FR-8, UX-DR5): a real <footer> landmark whose <nav> links EVERY Mirror route,
 * present on every page, with the current page marked WITHOUT relying on color.
 *
 * Real-runtime evidence for a user-facing shared component (skill-rules Rule 3 —
 * rendered via Astro's Container API, the Button/SceneRail/MirrorLayout pattern),
 * discoverable under the default suite (Rule 8: a co-located *.test.ts matched by
 * the vitest.config.ts `test.include` glob).
 *
 * The build-output suite (build-output.test.ts) already proves the footer's
 * contract on the ASSEMBLED page from a real `astro build`: present on the home +
 * every Mirror route + /browse, a labelled <nav>, a real <a> to all 10 routes,
 * 0 executable JS, and the Wordmark identity. This file does NOT re-assert those
 * page-level facts. It closes what the page suite leaves uncovered, pinned at the
 * COMPONENT boundary (independent of any page or BaseLayout):
 *
 *   1. The current-page marker is NEVER color alone (AC3 / Accessibility Floor).
 *      The page suite never asserts how the active route is marked. The footer
 *      marks it three non-color ways at once — aria-current="page" (assistive
 *      tech), a textual " (current)" affordance (visible text), and a weight
 *      class — and exactly ONE link is current per render. The active link is
 *      driven by Astro.url, so rendering the component against a chosen request
 *      URL pins that logic in isolation (the per-page assembled HTML can't vary
 *      the URL freely the way a direct render can).
 *   2. The component's OWN prop/URL -> DOM contract: the labelled <nav> landmark,
 *      a real <a> to every one of the canonical 10 routes, the Wordmark identity,
 *      and 0 <script> — proven on the component directly, not via index.astro.
 *
 * NOTE on Astro.url under the Container API: routeData does NOT populate
 * Astro.url, but a `request` does — `renderToString(Footer, { request })` sets
 * Astro.url.pathname from the request URL, which is how the current-page marker
 * is exercised against an arbitrary route below. A default render (no request)
 * resolves Astro.url.pathname to "/" (the site root), so Home is current.
 */

// The canonical 10 Mirror routes (registry order, lib/routes.ts) — the footer
// must link every one. Kept as the test's own ground-truth copy so a registry
// drift that silently drops a route still fails here (not the same array the
// component reads).
const ALL_MIRROR_ROUTES = [
  '/',
  '/about/',
  '/timeline/',
  '/speaking/',
  '/speaking/reel/',
  '/work/loandemo/',
  '/glass-box/',
  '/faq/',
  '/invite/',
  '/browse/',
] as const;

const ORIGIN = 'https://joshuabrandt.abacusai.cloud';

/** Render the Footer in isolation as served for `pathname` (drives Astro.url). */
async function renderFooterAt(pathname: string): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Footer, { request: new Request(`${ORIGIN}${pathname}`) });
}

describe('Footer.astro — the global static-fallback contract in isolation (AC1 / IAC-1)', () => {
  let html = '';
  beforeAll(async () => {
    html = await renderFooterAt('/');
  });

  it('is a <footer> landmark wrapping a labelled <nav> (screen-reader navigable)', () => {
    expect(html).toMatch(/<footer\b[^>]*class="[^"]*site-footer[^"]*"[^>]*>/);
    // The nav inside the footer carries an accessible name (aria-label).
    expect(html).toMatch(/<nav\b[^>]*\saria-label="[^"]+"/);
  });

  it('renders a real <a> to every one of the canonical 10 Mirror routes (followable JS-off)', () => {
    for (const route of ALL_MIRROR_ROUTES) {
      const hrefPattern = new RegExp(`<a\\b[^>]*\\shref="${route.replace(/\//g, '\\/')}"[^>]*>`);
      expect(html, `footer link to ${route}`).toMatch(hrefPattern);
    }
  });

  it('links EXACTLY the 10 canonical routes — no missing / extra link (registry parity)', () => {
    // Every <a href> in the footer, in DOM order, must equal the canonical set
    // exactly (count + membership). Guards a registry drift adding/removing a
    // route from the footer (the single-source-of-truth contract, Task 1).
    const hrefs = [...html.matchAll(/<a\b[^>]*\shref="([^"]+)"[^>]*>/g)].map((m) => m[1]);
    expect(hrefs).toEqual([...ALL_MIRROR_ROUTES]);
  });

  it('carries the canonical Wordmark site identity (UX-DR5)', () => {
    expect(html).toContain('Joshua R. Brandt, MSE');
  });

  it('ships 0 executable JS — pure markup, no island (NFR-1)', () => {
    // The footer is the 0-JS fallback floor: no <script> of any kind.
    expect(html.match(/<script\b/g) ?? []).toHaveLength(0);
  });

  it('contains no exclamation marks (positive-assertion voice)', () => {
    expect(html).not.toContain('!');
  });
});

describe('Footer.astro — the current page is marked, never by color alone (AC3 / Accessibility Floor)', () => {
  // Exercise the current-page logic against several routes (incl. the site root
  // and a nested route) so the normalize()/aria-current mapping is pinned, not
  // just the default. For each, exactly ONE link is current and it is the right
  // one, marked by aria-current + a textual affordance + a weight class.
  // CASES: request pathname (slashless; the Container API receives slashless requests)
  // and the expected href in the rendered footer (trailing-slash; Story 2.0 AC2).
  const CASES = [
    { pathname: '/', expectedHref: '/' },
    { pathname: '/about', expectedHref: '/about/' },
    { pathname: '/speaking/reel', expectedHref: '/speaking/reel/' },
    { pathname: '/browse', expectedHref: '/browse/' },
  ] as const;

  it.each(CASES)(
    'marks exactly one link current — the active route — on $pathname',
    async ({ pathname, expectedHref }) => {
      const html = await renderFooterAt(pathname);

      // Exactly one link carries aria-current="page" (the assistive-tech signal).
      const currentAnchors = [
        ...html.matchAll(/<a\b[^>]*\saria-current="page"[^>]*>[\s\S]*?<\/a>/g),
      ];
      expect(currentAnchors, `one aria-current on ${pathname}`).toHaveLength(1);

      const currentAnchor = currentAnchors[0]![0];
      // …and it is the link to the active route (href is the trailing-slash form).
      const hrefPattern = new RegExp(`\\shref="${expectedHref.replace(/\//g, '\\/')}"`);
      expect(currentAnchor, `current link href on ${pathname}`).toMatch(hrefPattern);

      // Color is NEVER the sole signal — two non-color carriers ride along:
      //  (a) a VISIBLE textual marker inside the current link …
      expect(currentAnchor, `textual "(current)" marker on ${pathname}`).toMatch(/\(current\)/);
      //  (b) … and a state class (weight, not color) on the current link.
      expect(currentAnchor, `current state class on ${pathname}`).toMatch(
        /class="[^"]*site-footer__link--current[^"]*"/,
      );
    },
  );

  it('the textual "(current)" affordance appears exactly once per render (no leak to other links)', async () => {
    // The non-color marker must mark ONLY the active link — exactly one "(current)"
    // in the whole footer, matching the single aria-current.
    for (const { pathname } of CASES) {
      const html = await renderFooterAt(pathname);
      const markers = [...html.matchAll(/\(current\)/g)];
      expect(markers, `single "(current)" on ${pathname}`).toHaveLength(1);
    }
  });

  it('non-current links carry no aria-current and no "(current)" marker', async () => {
    // On /about, the Home link (a sibling) must be a plain link — no state leak.
    const html = await renderFooterAt('/about');
    const homeAnchor = html.match(/<a\b[^>]*\shref="\/"[^>]*>[\s\S]*?<\/a>/);
    expect(homeAnchor).not.toBeNull();
    expect(homeAnchor![0]).not.toMatch(/aria-current/);
    expect(homeAnchor![0]).not.toMatch(/\(current\)/);
  });
});
