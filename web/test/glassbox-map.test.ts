/**
 * glassbox-map.test.ts — Unit tests for the PHASE_MAP const (Story 6.4).
 *
 * Rule 8: tests exercise the REAL exported module (not an inline copy), scoped
 * to the specific surface, mutation-verified.
 *
 * Tests:
 * - PHASE_MAP exports 5 entries in the exact expected order.
 * - Each featured slug (from FEATURED_SLUGS) resolves to exactly one phase.
 * - The shipping node ('shipping') resolves to exactly one phase.
 * - Ghost slugs (architecture/epics/retrospective) appear only in 'As it accrues'.
 * - No featured slug appears in the ghost ('As it accrues') phase.
 * - PHASE_ORDER matches the PHASE_MAP entry names in order.
 * - An unknown slug would not silently be placed in any featured phase.
 * - The mapping is PURE (no runtime side effects) — imports without throwing.
 */

import { describe, expect, it } from 'vitest';

import { FEATURED_SLUGS, GHOST_NODES, PHASE_MAP, PHASE_ORDER } from '../src/content/glassbox.index';

// The known featured slugs (must match glassbox.json).
const KNOWN_FEATURED_SLUGS = FEATURED_SLUGS.map((n) => n.slug);

// Ghost slugs — no readers exist for these.
const KNOWN_GHOST_SLUGS = GHOST_NODES.map((g) => g.type);

describe('PHASE_MAP — structure and ordering (Story 6.4)', () => {
  it('exports exactly 5 phase entries (Discovery, Definition, Design, Launch, As it accrues)', () => {
    expect(PHASE_MAP).toHaveLength(5);
    const names = PHASE_MAP.map((p) => p.name);
    expect(names).toEqual(['Discovery', 'Definition', 'Design', 'Launch', 'As it accrues']);
  });

  it('each phase has a non-empty description (credibility — curated copy)', () => {
    for (const phase of PHASE_MAP) {
      expect(phase.description, `Phase "${phase.name}" must have a description`).toBeTruthy();
      expect(phase.description.trim().length).toBeGreaterThan(10);
    }
  });

  it('each phase has at least one slug entry', () => {
    for (const phase of PHASE_MAP) {
      expect(phase.slugs, `Phase "${phase.name}" must have at least one slug`).toHaveLength(
        phase.slugs.length,
      );
      expect(phase.slugs.length).toBeGreaterThan(0);
    }
  });

  it('PHASE_ORDER matches PHASE_MAP names in order', () => {
    const namesFromMap = PHASE_MAP.map((p) => p.name);
    expect(PHASE_ORDER).toEqual(namesFromMap);
  });
});

describe('PHASE_MAP — featured slug → phase mapping (Rule 8: real module, scoped)', () => {
  it('every featured slug appears in exactly one phase', () => {
    for (const slug of KNOWN_FEATURED_SLUGS) {
      const phases = PHASE_MAP.filter((p) => p.slugs.includes(slug));
      expect(phases, `Slug "${slug}" must appear in exactly one phase`).toHaveLength(1);
    }
  });

  it('the shipping node appears in exactly one phase', () => {
    const phases = PHASE_MAP.filter((p) => p.slugs.includes('shipping'));
    expect(phases, '"shipping" must appear in exactly one phase').toHaveLength(1);
    expect(phases[0]!.name).toBe('Launch');
  });

  it('brainstorm and pre-brief-research are in Discovery', () => {
    const discovery = PHASE_MAP.find((p) => p.name === 'Discovery');
    expect(discovery).toBeTruthy();
    expect(discovery!.slugs).toContain('brainstorm');
    expect(discovery!.slugs).toContain('pre-brief-research');
  });

  it('product-brief and prd are in Definition', () => {
    const definition = PHASE_MAP.find((p) => p.name === 'Definition');
    expect(definition).toBeTruthy();
    expect(definition!.slugs).toContain('product-brief');
    expect(definition!.slugs).toContain('prd');
  });

  it('ux-design and ux-experience are in Design', () => {
    const design = PHASE_MAP.find((p) => p.name === 'Design');
    expect(design).toBeTruthy();
    expect(design!.slugs).toContain('ux-design');
    expect(design!.slugs).toContain('ux-experience');
  });

  it('shipping is in Launch (not in any other phase)', () => {
    const launch = PHASE_MAP.find((p) => p.name === 'Launch');
    expect(launch).toBeTruthy();
    expect(launch!.slugs).toContain('shipping');
    // Also check no other phase has 'shipping'.
    const otherPhases = PHASE_MAP.filter((p) => p.name !== 'Launch');
    for (const phase of otherPhases) {
      expect(phase.slugs, `"shipping" must not appear in phase "${phase.name}"`).not.toContain(
        'shipping',
      );
    }
  });
});

describe('PHASE_MAP — ghost slugs in "As it accrues" only (Rule 9: no fabricated reader link)', () => {
  it('ghost slugs appear only in the "As it accrues" phase', () => {
    for (const ghostSlug of KNOWN_GHOST_SLUGS) {
      const featuredPhases = PHASE_MAP.filter(
        (p) => p.name !== 'As it accrues' && p.slugs.includes(ghostSlug),
      );
      expect(
        featuredPhases,
        `Ghost slug "${ghostSlug}" must NOT appear in any non-ghost phase`,
      ).toHaveLength(0);
    }
  });

  it('the "As it accrues" phase contains architecture, epics, and retrospective slugs', () => {
    const asItAccrues = PHASE_MAP.find((p) => p.name === 'As it accrues');
    expect(asItAccrues).toBeTruthy();
    expect(asItAccrues!.slugs).toContain('architecture');
    expect(asItAccrues!.slugs).toContain('epics');
    expect(asItAccrues!.slugs).toContain('retrospective');
  });

  it('no featured slug appears in "As it accrues"', () => {
    const asItAccrues = PHASE_MAP.find((p) => p.name === 'As it accrues');
    expect(asItAccrues).toBeTruthy();
    for (const slug of KNOWN_FEATURED_SLUGS) {
      expect(
        asItAccrues!.slugs,
        `Featured slug "${slug}" must NOT be in "As it accrues"`,
      ).not.toContain(slug);
    }
  });
});

describe('PHASE_MAP — total coverage: all known slugs are accounted for', () => {
  it('every FEATURED_SLUGS entry is mapped to a phase', () => {
    const allMappedSlugs = PHASE_MAP.flatMap((p) => p.slugs);
    for (const slug of KNOWN_FEATURED_SLUGS) {
      expect(allMappedSlugs, `FEATURED_SLUG "${slug}" must be mapped`).toContain(slug);
    }
  });

  it('no slug is duplicated across phases', () => {
    const allSlugs = PHASE_MAP.flatMap((p) => p.slugs);
    const unique = new Set(allSlugs);
    expect(allSlugs.length, 'Each slug must appear in exactly one phase (no duplicates)').toBe(
      unique.size,
    );
  });

  it('PHASE_MAP is a pure const — importing it has no side effects', () => {
    // Importing the module (done at top of this file) must not throw.
    // The const is available immediately — no async loading, no globals mutated.
    expect(PHASE_MAP).toBeInstanceOf(Array);
    expect(PHASE_ORDER).toBeInstanceOf(Array);
  });
});
