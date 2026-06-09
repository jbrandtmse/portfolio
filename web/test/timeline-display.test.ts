/**
 * Unit tests for web/src/lib/timeline-display.ts — the shared, browser-safe
 * display helpers used by BOTH the static FlagshipNode.astro and the
 * ZoomableTimeline.tsx island (Story 6.2 code-review fix: the `[OPEN]` sentinel
 * leak).
 *
 * Rule 8 (real module, scoped, mutation-verified):
 *   - Imports the REAL exported helpers (not inline copies).
 *   - Each assertion is scoped to the specific helper under test.
 *   - The negation checks red if the helper drifts (e.g. if cleanDescription
 *     stopped stripping the sentinel, or readerAffordance mis-classified [OPEN]).
 *
 * Discoverable by the default pnpm test suite: named `*.test.ts` under
 * `web/test/`, covered by web/vitest.config.ts.
 */
import { describe, expect, it } from 'vitest';

import {
  cleanDescription,
  isOpenStatusHref,
  isRealReaderHref,
  readerAffordance,
  READER_COMING_AFFORDANCE,
} from '../src/lib/timeline-display.ts';

describe('cleanDescription — strips the leaked [OPEN: …] sentinel (Story 6.2)', () => {
  it('removes a trailing " [OPEN: no Glass Box reader yet]" sentinel', () => {
    expect(cleanDescription('Scaffold, design system, hero. [OPEN: no Glass Box reader yet]')).toBe(
      'Scaffold, design system, hero.',
    );
  });

  it('removes the sentinel even when it is the ONLY content (collapses to empty)', () => {
    expect(cleanDescription('[OPEN: no Glass Box reader yet]')).toBe('');
  });

  it('leaves a clean summary untouched', () => {
    expect(cleanDescription('A live agentic loan origination demo.')).toBe(
      'A live agentic loan origination demo.',
    );
  });

  it('removes any [OPEN: …] colon-form fragment mid-string (belt-and-suspenders)', () => {
    // Mutation guard: if the strip regex regressed, the sentinel would survive here.
    expect(cleanDescription('Before [OPEN: some reason] after')).toBe('Before after');
    expect(cleanDescription('Before [OPEN: some reason] after')).not.toContain('[OPEN');
  });

  it('does NOT strip a bare [OPEN] flag (no colon — a different, visible case)', () => {
    // The bare-bracket [OPEN] inline flag is intentionally visible elsewhere; only
    // the colon-form developer sentinel is stripped.
    expect(cleanDescription('Pending [OPEN] confirmation')).toBe('Pending [OPEN] confirmation');
  });

  it('handles empty / nullish input gracefully', () => {
    expect(cleanDescription('')).toBe('');
    expect(cleanDescription(undefined)).toBe('');
    expect(cleanDescription(null)).toBe('');
  });
});

describe('isOpenStatusHref (Story 6.2)', () => {
  it('the bare [OPEN] sentinel is open', () => {
    expect(isOpenStatusHref('[OPEN]')).toBe(true);
  });

  it('an [OPEN: …] colon-form marker is open', () => {
    expect(isOpenStatusHref('[OPEN: no Glass Box reader yet]')).toBe(true);
  });

  it('a real /glass-box/ href is NOT open', () => {
    expect(isOpenStatusHref('/glass-box/prd/')).toBe(false);
  });

  it('an https external href is NOT open', () => {
    expect(isOpenStatusHref('https://example.com/')).toBe(false);
  });

  it('nullish is not open', () => {
    expect(isOpenStatusHref(undefined)).toBe(false);
    expect(isOpenStatusHref(null)).toBe(false);
    expect(isOpenStatusHref('')).toBe(false);
  });
});

describe('isRealReaderHref (Story 6.2)', () => {
  it('a /glass-box/ reader is real', () => {
    expect(isRealReaderHref('/glass-box/brainstorm/')).toBe(true);
  });

  it('an external https site is real', () => {
    expect(isRealReaderHref('https://joshuabrandt.abacusai.cloud/')).toBe(true);
  });

  it('[OPEN] is NOT a real reader', () => {
    expect(isRealReaderHref('[OPEN]')).toBe(false);
  });

  it('a /work/loandemo/ forward-ref is NOT a real reader (Story 2.5 owns it)', () => {
    expect(isRealReaderHref('/work/loandemo/#code')).toBe(false);
  });
});

describe('readerAffordance — the shared link/coming/none decision (Story 6.2)', () => {
  it('a real Glass Box href → a working "Open in Glass Box →" link', () => {
    const a = readerAffordance('/glass-box/prd/');
    expect(a.kind).toBe('link');
    if (a.kind === 'link') {
      expect(a.href).toBe('/glass-box/prd/');
      expect(a.label).toBe('Open in Glass Box →');
    }
  });

  it('an external https href → a working "Visit live site →" link', () => {
    const a = readerAffordance('https://joshuabrandt.abacusai.cloud/');
    expect(a.kind).toBe('link');
    if (a.kind === 'link') expect(a.label).toBe('Visit live site →');
  });

  it('an [OPEN] href → the clean "reader coming (6.3/6.4)" affordance, NOT the raw sentinel', () => {
    const a = readerAffordance('[OPEN]');
    expect(a.kind).toBe('coming');
    if (a.kind === 'coming') {
      expect(a.text).toBe(READER_COMING_AFFORDANCE);
      // Mutation guard: the affordance text must NOT be the developer sentinel.
      expect(a.text).not.toContain('no Glass Box reader yet');
      expect(a.text).toMatch(/6\.3\/6\.4/);
    }
  });

  it('a /work/loandemo/ forward-ref href → no affordance (kind none)', () => {
    expect(readerAffordance('/work/loandemo/#code').kind).toBe('none');
  });

  it('an absent href → no affordance', () => {
    expect(readerAffordance(undefined).kind).toBe('none');
  });
});
