import { getContainerRenderer } from '@astrojs/react';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { beforeAll, describe, expect, it } from 'vitest';

import MirrorLayout from '../src/layouts/MirrorLayout.astro';

/**
 * Isolated component-render assertions for MirrorLayout (Story 1.5, AC1 / IAC-1).
 *
 * The build-output suite (build-output.test.ts) already proves the *page*
 * contract for every Mirror route from a real `astro build`: per-route real
 * HTML, the answer-first lede leading with the entity, self-canonical to each
 * route's own absolute URL, exactly one <h1>, the footer region, 0 JS, no
 * exclamation marks. This file does NOT re-assert those per-route page facts.
 *
 * It closes the one thing the page suite leaves uncovered: MirrorLayout's OWN
 * prop -> DOM contract, in isolation. MirrorLayout is the shared shell every
 * Mirror route in this story AND every Mirror surface authored by Epics 2-4
 * composes through, so a regression in the layout itself (the lede stops being
 * the opening <p>, a second <h1> creeps in, the heading/lede props get swapped,
 * or the body <slot> stops rendering) would silently break every future route.
 * The page suite reads each route's assembled content, so a layout-level swap
 * could hide behind route-specific copy; rendering the layout directly via
 * Astro's Container API (the HeroStatic.component.test.ts pattern) pins the
 * contract to ARBITRARY prop values:
 *
 *   - the `heading` prop becomes the single <h1> (exactly one, verbatim);
 *   - the `lede` prop becomes the opening <p>, AFTER the <h1> (answer-first
 *     order: the entity-first paragraph leads the body);
 *   - the default <slot> body renders after the lede;
 *   - the layout adds no <script> from analytics (NFR-1 Umami gate).
 *
 * NOTE on the self-canonical <link>: its per-route href value is asserted by the
 * build-output suite against real `astro build` output (where Astro.site is set
 * from astro.config.mjs). It is deliberately NOT asserted here because Astro's
 * experimental Container API does not populate Astro.site (withastro/astro#11585),
 * so the layout correctly omits the <link> in isolated rendering. Asserting it
 * here would test the harness limitation, not the contract.
 *
 * Story 4.4: MirrorLayout composes through BaseLayout which now mounts GuidePill
 * (client:idle). The Container API requires the React renderer to be loaded to
 * avoid "no renderer for .tsx" errors.
 *
 * Real-runtime evidence for a user-facing shared component (skill-rules Rule 3);
 * discoverable under the default suite (Rule 8: a co-located *.test.ts file,
 * matched by the vitest.config.ts `test` include glob).
 */

// Arbitrary, route-agnostic sentinel props — deliberately NOT any real route's
// copy, so the assertions pin the layout's prop->DOM mapping rather than a
// route's content. The lede still leads with the entity (the layout's documented
// lede contract) while carrying a unique sentinel the route suite never emits.
const HEADING = 'Mirror Heading Sentinel';
const LEDE =
  'Joshua R. Brandt, MSE leads this sentinel lede paragraph. A second sentence follows the entity-first opener.';
const BODY_SENTINEL = 'MirrorBodySlotSentinel';

let html = '';

beforeAll(async () => {
  // Story 4.4: MirrorLayout → BaseLayout now imports GuidePill (a React island).
  // The Container API needs the React renderer to avoid "no renderer for .tsx" errors.
  const renderers = await loadRenderers([getContainerRenderer()]);
  const container = await AstroContainer.create({ renderers });
  html = await container.renderToString(MirrorLayout, {
    props: { heading: HEADING, lede: LEDE },
    slots: { default: `<p class="probe-body">${BODY_SENTINEL}</p>` },
  });
});

describe('MirrorLayout.astro — prop -> DOM contract in isolation (AC1 / IAC-1)', () => {
  it('renders the `heading` prop as exactly one <h1> (clean hierarchy)', () => {
    const h1s = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g) ?? [];
    expect(h1s).toHaveLength(1);
    const text = h1s[0]!
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(text).toBe(HEADING);
  });

  it('renders the `lede` prop as the opening <p> (answer-first paragraph)', () => {
    // The FIRST <p> in the document is the lede — proves the layout maps `lede`
    // to the opening paragraph (not a later one), independent of route content.
    const firstP = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/);
    expect(firstP).not.toBeNull();
    const text = firstP![1]!
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(text).toBe(LEDE);
    // And its first sentence still names the entity (the layout's lede contract,
    // UX-DR15) — immune to the entity's own "R."/"MSE" periods.
    expect(text.startsWith('Joshua R. Brandt, MSE')).toBe(true);
  });

  it('orders the <h1> before the lede <p> (heading then answer-first opener)', () => {
    // Guards against the heading/lede props being swapped or reordered: the
    // single <h1> must precede the opening lede paragraph in the document.
    expect(html.indexOf(HEADING)).toBeGreaterThanOrEqual(0);
    expect(html.indexOf(HEADING)).toBeLessThan(html.indexOf('sentinel lede paragraph'));
  });

  it('renders the default <slot> body after the lede', () => {
    // The page body slot is rendered, and it comes AFTER the lede paragraph
    // (body follows the answer-first opener).
    expect(html).toContain(BODY_SENTINEL);
    expect(html.indexOf('sentinel lede paragraph')).toBeLessThan(html.indexOf(BODY_SENTINEL));
  });

  it('adds no Umami analytics script from the layout (NFR-1 Umami gate)', () => {
    // Story 4.4: BaseLayout now mounts GuidePill (client:idle) which may emit
    // island markup via the Container API. The NFR-1 Umami invariant: no Umami
    // tracker script is emitted when PUBLIC_UMAMI_* is unset (the default/CI build).
    // The broader NFR-1 per-route script-count floor is proven by build-output.test.ts.
    expect(html).not.toMatch(/<script\b[^>]*data-website-id/i);
    expect(html).not.toMatch(/<script\b[^>]*umami/i);
  });
});
