import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

import BaseLayout from '../src/layouts/BaseLayout.astro';

/**
 * Isolated component-render assertions for BaseLayout's env-gated Umami wiring
 * (Story 1.10, AC2 / IAC-2).
 *
 * This pins the DEFAULT (env-UNSET) branch of the gate: with no PUBLIC_UMAMI_SRC
 * / PUBLIC_UMAMI_WEBSITE_ID set (the state of the vitest env — and of CI), the
 * layout must render NO analytics script at all, so the 0-JS-by-default floor
 * (NFR-1) holds and the build-output 0-executable-script assertions stay green
 * WITHOUT a live Umami. (`import.meta.env.PUBLIC_*` is statically replaced by
 * Vite at build/transform time — Astro docs: env vars are "statically replaced at
 * build time" — so this is the real gate value the test env compiles with, not a
 * runtime stub.)
 *
 * The env-SET branch (script present, cookieless, with data-website-id) is proven
 * by a REAL `astro build` invoked with PUBLIC_UMAMI_* set, in build-output.test.ts
 * — the authoritative real-runtime form (skill-rules Rule 3), since a single
 * vitest process cannot flip a build-time-inlined `import.meta.env` value.
 *
 * Discoverable under the default suite (Rule 8): co-located test/*.test.ts matched
 * by the vitest.config.ts include glob. Uses Astro's Container API, the same
 * isolated-render pattern as MirrorLayout.component.test.ts.
 */

let html = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(BaseLayout, {
    slots: { default: '<main>probe body</main>' },
  });
});

describe('BaseLayout.astro — env-gated Umami (UNSET branch ⇒ 0 analytics JS)', () => {
  it('renders NO Umami script when PUBLIC_UMAMI_* is unset (the default/CI build)', () => {
    // No reference to the Umami tracker in any form.
    expect(html).not.toMatch(/umami/i);
    expect(html).not.toMatch(/data-website-id/i);
  });

  it('renders NO executable <script> at all from the base shell (NFR-1 0-JS floor)', () => {
    // BaseLayout itself ships zero executable JS; the JSON-LD slot is empty here
    // (a route would fill it with DATA, not executable JS). So there must be no
    // <script> tag whatsoever in the isolated base render.
    expect(html.match(/<script\b/gi) ?? []).toHaveLength(0);
  });

  it('references no external JS bundle / module preload (NFR-1)', () => {
    expect(html).not.toMatch(/<script\b[^>]*\bsrc=/i);
    expect(html).not.toMatch(/<link\b[^>]*\brel="modulepreload"/i);
  });
});
