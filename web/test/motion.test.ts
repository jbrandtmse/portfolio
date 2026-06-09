import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  COLOR_NEVER_SOLE_SIGNAL,
  CSS_REDUCED_MOTION_CONVENTION,
  FOCUS_VISIBLE_CONVENTION,
  onMotionAllowed,
  prefersReducedMotion,
  REDUCED_MOTION_QUERY,
} from '../src/lib/motion';

/**
 * Unit coverage for the shared reduced-motion gate (Story 1.9, AC1 / IAC-1;
 * UX-DR21). motion.ts is the ONE gate every animated surface consumes (the
 * scene-rail now, every Stage-2 surface later), so its three contracts are
 * pinned here directly (skill-rules Rule 3 — real invocation with assertions;
 * Rule 8 — *.test.ts, discoverable by the default vitest run):
 *
 *   1. SSR-safe — with no `window`/`matchMedia` (the server build, JS-off,
 *      ancient engines) nothing throws and motion code never runs (the static
 *      baseline stands).
 *   2. Honors `prefers-reduced-motion: reduce` — `prefersReducedMotion()` is true
 *      and `onMotionAllowed` no-ops.
 *   3. Runs the init exactly once when motion IS allowed.
 *
 * The gate's consolidation into the rail's inlined script (the consumer side) is
 * proven by build-output.test.ts against a real `astro build`.
 */

// The module references `window` only inside function bodies, so we can toggle a
// stub per test. Each test restores globals via afterEach.
const originalWindow = (globalThis as { window?: unknown }).window;

afterEach(() => {
  if (originalWindow === undefined) {
    delete (globalThis as { window?: unknown }).window;
  } else {
    (globalThis as { window?: unknown }).window = originalWindow;
  }
  vi.restoreAllMocks();
});

/** Install a fake `window.matchMedia` that reports the given reduce preference. */
function stubMatchMedia(reduceMatches: boolean): ReturnType<typeof vi.fn> {
  const matchMedia = vi.fn((query: string) => ({
    matches: query === REDUCED_MOTION_QUERY ? reduceMatches : false,
    media: query,
  }));
  (globalThis as { window?: unknown }).window = { matchMedia };
  return matchMedia;
}

describe('motion.ts — REDUCED_MOTION_QUERY is the single canonical query string', () => {
  it('is exactly "(prefers-reduced-motion: reduce)"', () => {
    expect(REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)');
  });
});

describe('motion.ts — prefersReducedMotion()', () => {
  it('is SSR-safe: returns false (does not throw) when there is no window', () => {
    delete (globalThis as { window?: unknown }).window;
    expect(() => prefersReducedMotion()).not.toThrow();
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns false when matchMedia is absent (very old engine)', () => {
    (globalThis as { window?: unknown }).window = {};
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns true when prefers-reduced-motion: reduce matches', () => {
    const matchMedia = stubMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY);
  });

  it('returns false when the user has no reduced-motion preference', () => {
    stubMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('motion.ts — onMotionAllowed() (the JS-layer init-guard)', () => {
  it('is SSR-safe: does not throw and does not run init when there is no window', () => {
    delete (globalThis as { window?: unknown }).window;
    const init = vi.fn();
    expect(() => onMotionAllowed(init)).not.toThrow();
    expect(init).not.toHaveBeenCalled();
  });

  it('does NOT run init when matchMedia is absent (cannot prove motion is safe)', () => {
    (globalThis as { window?: unknown }).window = {};
    const init = vi.fn();
    onMotionAllowed(init);
    expect(init).not.toHaveBeenCalled();
  });

  it('does NOT run init under prefers-reduced-motion: reduce (the gate no-ops)', () => {
    stubMatchMedia(true);
    const init = vi.fn();
    onMotionAllowed(init);
    expect(init).not.toHaveBeenCalled();
  });

  it('runs init exactly once when motion is allowed', () => {
    stubMatchMedia(false);
    const init = vi.fn();
    onMotionAllowed(init);
    expect(init).toHaveBeenCalledTimes(1);
  });
});

describe('motion.ts — documented a11y conventions are exported as one source', () => {
  it('exposes the CSS reduced-motion convention (the query string surfaces are authored under)', () => {
    expect(CSS_REDUCED_MOTION_CONVENTION).toBe(REDUCED_MOTION_QUERY);
  });

  it('documents color-is-never-the-sole-signal as a non-empty convention', () => {
    expect(typeof COLOR_NEVER_SOLE_SIGNAL).toBe('string');
    expect(COLOR_NEVER_SOLE_SIGNAL.length).toBeGreaterThan(0);
  });

  it('documents the visible :focus-visible convention as a non-empty convention', () => {
    expect(typeof FOCUS_VISIBLE_CONVENTION).toBe('string');
    expect(FOCUS_VISIBLE_CONVENTION).toContain(':focus-visible');
  });
});
