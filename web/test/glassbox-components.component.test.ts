import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

import ArtifactCard from '../src/components/glassbox/ArtifactCard.astro';
import TimelineDot from '../src/components/glassbox/TimelineDot.astro';

/**
 * Isolated component-render assertions for the shared Glass Box building blocks
 * (Story 2.3, Task 1 + Task 2) — TimelineDot (the BMAD Method Dot) and
 * ArtifactCard.
 *
 * WHY (QA, the 2.4 reuse contract): both components are SHARED — Story 2.4
 * (Master Timeline) reuses them without modification (Consumed-by). The index
 * page only exercises a SUBSET of each component's props in one composition
 * (e.g. `resting` dot state is never used on the index; the non-external Read
 * link branch and the external View branch are both used but tangled with page
 * markup). These tests render each component DIRECTLY via Astro's Container API
 * to exercise EVERY state/variant in isolation, so a regression that only 2.4
 * would hit (e.g. `resting` styling, the ghost no-link contract, the external
 * rel) is caught now rather than in the next story's integration.
 *
 * Real-runtime evidence for user-facing components (skill-rules Rule 3),
 * discoverable under the default vitest suite (Rule 8: `*.test.ts`, included by
 * vitest.config.ts `test/**`).
 */
let container: Awaited<ReturnType<typeof AstroContainer.create>>;

beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('TimelineDot.astro — every state renders (2.4 reuse contract)', () => {
  // The six states: the four 2.3 states + the two 2.4 extensions (faint / milestone).
  const states = ['resting', 'filled', 'live', 'upcoming', 'faint', 'milestone'] as const;

  for (const state of states) {
    it(`renders the "${state}" state with its state class and is decorative`, async () => {
      const html = await container.renderToString(TimelineDot, {
        props: { state },
      });
      // Carries both the base class and the state modifier.
      expect(html).toMatch(/class="[^"]*\btimeline-dot\b[^"]*"/);
      expect(html).toContain(`timeline-dot--${state}`);
      // Decorative: aria-hidden so the dot is never a color-only status carrier
      // (WCAG 1.4.1 — meaning lives in adjacent text on the page).
      expect(html).toMatch(/aria-hidden="true"/);
      // 0 executable JS: the dot is a pure <span>, no inline script.
      expect(html).not.toMatch(/<script\b/i);
    });
  }

  it('defaults to the "resting" state when no state prop is passed', async () => {
    const html = await container.renderToString(TimelineDot, { props: {} });
    expect(html).toContain('timeline-dot--resting');
  });

  it('only the "live" state carries the halo class hook (filled does not)', async () => {
    const live = await container.renderToString(TimelineDot, {
      props: { state: 'live' },
    });
    const filled = await container.renderToString(TimelineDot, {
      props: { state: 'filled' },
    });
    expect(live).toContain('timeline-dot--live');
    expect(filled).not.toContain('timeline-dot--live');
  });

  // Story 2.4 — faint + milestone extension tests (additive; 2.3 states still green above).
  it('the "faint" state carries the faint modifier (not resting, not filled)', async () => {
    const html = await container.renderToString(TimelineDot, {
      props: { state: 'faint' },
    });
    expect(html).toContain('timeline-dot--faint');
    expect(html).not.toContain('timeline-dot--resting');
    expect(html).not.toContain('timeline-dot--filled');
    // Still decorative.
    expect(html).toMatch(/aria-hidden="true"/);
    // Still 0 JS.
    expect(html).not.toMatch(/<script\b/i);
  });

  it('the "milestone" state carries the milestone modifier (not resting, not filled)', async () => {
    const html = await container.renderToString(TimelineDot, {
      props: { state: 'milestone' },
    });
    expect(html).toContain('timeline-dot--milestone');
    expect(html).not.toContain('timeline-dot--resting');
    expect(html).not.toContain('timeline-dot--filled');
    // Still decorative.
    expect(html).toMatch(/aria-hidden="true"/);
    // Still 0 JS.
    expect(html).not.toMatch(/<script\b/i);
  });
});

describe('ArtifactCard.astro — every variant renders (2.4 reuse contract)', () => {
  const base = {
    type: 'prd',
    title: 'Product Requirements Document',
    date: '2026-06-06T02:08:52+00:00',
    curatorNote: 'Every feature, every constraint.',
  };

  it('default variant: chip + h3 title + curator note + a real "Read →" link', async () => {
    const html = await container.renderToString(ArtifactCard, {
      props: { ...base, href: '/glass-box/prd/' },
    });
    expect(html).toContain('artifact-card__chip');
    expect(html).toMatch(/<h3[^>]*class="[^"]*artifact-card__title[^"]*"[^>]*>/);
    expect(html).toContain('Product Requirements Document');
    expect(html).toContain('artifact-card__note');
    // Real anchor to the trailing-slash reader; "Read →" (not external "View →").
    expect(html).toMatch(/<a\b[^>]*href="\/glass-box\/prd\/"[^>]*>/);
    expect(html).toContain('Read →');
    expect(html).not.toContain('View →');
  });

  it('ghost variant: dashed card, "As it accrues" text, and NO read link', async () => {
    const html = await container.renderToString(ArtifactCard, {
      props: { type: 'architecture', title: 'Architecture', date: base.date, ghost: true },
    });
    expect(html).toContain('artifact-card--ghost');
    // Status is carried in TEXT (WCAG 1.4.1), not dashed styling alone.
    expect(html).toContain('As it accrues');
    expect(html).toContain('artifact-card__status');
    // The ghost contract: NO read link (no dead/placeholder anchor).
    expect(html).not.toContain('artifact-card__link');
    expect(html).not.toMatch(/<a\b/);
    // No curator note rendered in the ghost branch.
    expect(html).not.toContain('artifact-card__note');
  });

  it('ghost variant with NO date renders no <time> (NFR-6: no build-time now)', async () => {
    // Code review (Story 2.3): `date` is optional. Ghost / not-yet-shipped nodes
    // pass no date — a synthetic build-time `new Date()` would bake a per-build
    // wall-clock timestamp into the static HTML (breaks determinism). With no
    // date, the component must emit NO <time> element.
    const html = await container.renderToString(ArtifactCard, {
      props: { type: 'architecture', title: 'Architecture', ghost: true },
    });
    expect(html).not.toMatch(/<time\b/i);
    // Still renders its status text (the ghost contract is intact).
    expect(html).toContain('As it accrues');
  });

  it('live-pill variant: renders the "Live · in progress" pill (text, not color alone)', async () => {
    const html = await container.renderToString(ArtifactCard, {
      props: {
        type: 'site',
        title: 'The Live Site',
        date: base.date,
        curatorNote: 'Shipping on day one.',
        href: 'https://joshuabrandt.abacusai.cloud/',
        showLivePill: true,
        external: true,
      },
    });
    expect(html).toContain('artifact-card__live-pill');
    expect(html).toContain('Live · in progress');
  });

  it('external variant: sets rel="noopener noreferrer" and renders "View →"', async () => {
    const html = await container.renderToString(ArtifactCard, {
      props: {
        ...base,
        href: 'https://joshuabrandt.abacusai.cloud/',
        external: true,
        externalLabel: 'Visit the live site',
      },
    });
    const anchor = html.match(/<a\b[^>]*>/)?.[0] ?? '';
    expect(anchor).toContain('rel="noopener noreferrer"');
    expect(html).toContain('View →');
    expect(html).not.toContain('Read →');
  });

  it('renders no executable script in any variant (0-JS, NFR-1)', async () => {
    const html = await container.renderToString(ArtifactCard, {
      props: { ...base, href: '/glass-box/prd/' },
    });
    expect(html).not.toMatch(/<script\b/i);
  });

  it('contains no exclamation mark in rendered copy (positive-assertion voice)', async () => {
    const html = await container.renderToString(ArtifactCard, {
      props: { ...base, href: '/glass-box/prd/' },
    });
    expect(html).not.toContain('!');
  });
});
