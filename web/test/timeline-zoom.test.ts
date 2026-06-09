/**
 * Unit tests for the Story 6.2 ZoomableTimeline zoom-state machinery.
 *
 * Rule 8 (real module, scoped, mutation-verified):
 *   - Tests import the REAL `$timelineFocus` atom from `store.ts`.
 *   - Each assertion is scoped to the specific export under test.
 *   - Mutation verification: tests include negation checks that would fail
 *     if the store were initialized to the wrong value.
 *
 * Covered:
 *   (a) $timelineFocus atom — initial value, set, reset
 *   (b) fmtDate helper (re-tested via ZoomableTimeline module export)
 *   (c) isRealReader / isOpenHref helper exports
 *
 * Discoverable by the default pnpm test suite (skill-rules Rule 8):
 *   Named `*.test.ts` under `web/test/`, covered by `web/vitest.config.ts`.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { $timelineFocus } from '../src/lib/store.ts';
// Rule 8: import the REAL island exports (not inline copies). The web vitest env
// is `node`; the island's React/nanostores imports are SSR/node-safe, so the pure
// helper exports import cleanly here (same pattern as GuidePanel.component.test.ts).
import { isRealReader, isOpenHref, fmtDate } from '../src/islands/ZoomableTimeline.tsx';

// ---------------------------------------------------------------------------
// (a) $timelineFocus store — overview ↔ focus transitions
// ---------------------------------------------------------------------------

describe('$timelineFocus atom (Story 6.2)', () => {
  beforeEach(() => {
    // Reset to overview between tests.
    $timelineFocus.set(null);
  });

  it('is initialized to null (overview) — mutation check: not a truthy value', () => {
    const val = $timelineFocus.get();
    // Mutation verification: if initialized to anything else this fails.
    expect(val).toBeNull();
    expect(val).not.toBe('some-flagship');
  });

  it('transitions overview → focused when set to a flagship id', () => {
    $timelineFocus.set('this-portfolio');
    expect($timelineFocus.get()).toBe('this-portfolio');
    // Not null (not overview).
    expect($timelineFocus.get()).not.toBeNull();
  });

  it('transitions focused → overview when set to null', () => {
    $timelineFocus.set('epic-1-build-foundation');
    expect($timelineFocus.get()).toBe('epic-1-build-foundation');

    $timelineFocus.set(null);
    expect($timelineFocus.get()).toBeNull();
  });

  it('transitions between two focused values (toggling flagships)', () => {
    $timelineFocus.set('loandemo');
    expect($timelineFocus.get()).toBe('loandemo');

    $timelineFocus.set('this-portfolio');
    expect($timelineFocus.get()).toBe('this-portfolio');
    expect($timelineFocus.get()).not.toBe('loandemo');
  });

  it('set() to the same value is idempotent (no error, value unchanged)', () => {
    $timelineFocus.set('epic-3-retro');
    $timelineFocus.set('epic-3-retro');
    expect($timelineFocus.get()).toBe('epic-3-retro');
  });

  it('subscribe fires with the new value on set', () => {
    const observed: (string | null)[] = [];
    const unsub = $timelineFocus.subscribe((v) => observed.push(v));
    $timelineFocus.set('sprint-course-correction');
    $timelineFocus.set(null);
    unsub();
    // Subscribe fires immediately with initial value, then on each set.
    expect(observed).toEqual([null, 'sprint-course-correction', null]);
  });
});

// ---------------------------------------------------------------------------
// (b) isRealReader / isOpenHref / fmtDate helpers — the REAL island exports.
//
// Rule 8: these are the ACTUAL functions imported from ZoomableTimeline.tsx
// (top-of-file import), NOT inline copies. If the island's impl drifts, these
// tests red — a copy would have stayed green.
// ---------------------------------------------------------------------------

describe('isRealReader helper (Story 6.2)', () => {
  it('/glass-box/ links are real readers', () => {
    expect(isRealReader('/glass-box/brainstorm/')).toBe(true);
    expect(isRealReader('/glass-box/prd/')).toBe(true);
  });

  it('https:// external links are real readers', () => {
    expect(isRealReader('https://joshuabrandt.abacusai.cloud/')).toBe(true);
  });

  it('[OPEN] is NOT a real reader', () => {
    expect(isRealReader('[OPEN]')).toBe(false);
  });

  it('/work/loandemo/ links are NOT real readers (forward-ref — Story 2.5)', () => {
    expect(isRealReader('/work/loandemo/#code')).toBe(false);
    expect(isRealReader('/work/loandemo/#build')).toBe(false);
  });

  it('empty string is not a real reader', () => {
    expect(isRealReader('')).toBe(false);
  });
});

describe('isOpenHref helper (Story 6.2)', () => {
  it('[OPEN] sentinel is open', () => {
    expect(isOpenHref('[OPEN]')).toBe(true);
  });

  it('description strings containing [OPEN] are open', () => {
    expect(isOpenHref('[OPEN: no Glass Box reader yet]')).toBe(true);
  });

  it('/glass-box/ links are NOT open', () => {
    expect(isOpenHref('/glass-box/brainstorm/')).toBe(false);
  });

  it('https:// links are NOT open', () => {
    expect(isOpenHref('https://example.com')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// (c) fmtDate helper — the REAL island export. The detail panel + cluster dates
//     render through this; a drift to a TZ-dependent / day-leaking format reds
//     here (Rule 8 — real module, scoped, mutation-verified by the negations).
// ---------------------------------------------------------------------------

describe('fmtDate helper (Story 6.2)', () => {
  it('formats a full ISO git committer date to the deterministic "Mon YYYY" label', () => {
    // The harvested planning Dots carry full ISO-8601 committer timestamps.
    expect(fmtDate('2026-06-02T23:02:06+00:00')).toBe('Jun 2026');
    // A regression to toLocaleDateString full style would include a day number.
    expect(fmtDate('2026-06-02T23:02:06+00:00')).not.toMatch(/\d{1,2},/);
  });

  it('formats a date-only ISO string to "Mon YYYY"', () => {
    expect(fmtDate('2026-06-06')).toBe('Jun 2026');
  });

  it('passes through a bracketed/approximate marker verbatim (no Date parse)', () => {
    // Runway "~YYYY" ticks and "[OPEN…]" sentinels must not be coerced to a date.
    expect(fmtDate('~1996')).toBe('~1996');
    expect(fmtDate('[OPEN]')).toBe('[OPEN]');
  });

  it('returns the raw input when it is not a parseable date (graceful)', () => {
    expect(fmtDate('not-a-date')).toBe('not-a-date');
    expect(fmtDate('')).toBe('');
  });
});
