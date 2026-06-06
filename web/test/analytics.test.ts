import { afterEach, describe, expect, it, vi } from 'vitest';

import { ANALYTICS_EVENTS, track } from '../src/lib/analytics';

/**
 * Unit contract for the analytics seam (Story 1.10, AC2 / IAC-2; FR-36).
 *
 * analytics.ts is the ONE typed wrapper around cookieless Umami's
 * `window.umami.track`. These tests pin (a) the exact event vocabulary — the six
 * kebab `area-action` events (architecture.md §Communication-Patterns) — and
 * (b) `track`'s SSR-safety + no-op-without-Umami behavior, which is what lets the
 * key-free static build (and JS-off) work with no analytics present (NFR-5).
 *
 * The web vitest env is `node` (vitest.config.ts), so `window` is undefined by
 * default — the exact SSR / server-build condition. We add/remove a fake `window`
 * per case to drive the three branches: no window, window without Umami, window
 * with Umami. Discoverable under the default suite (skill-rules Rule 8): a
 * co-located test/*.test.ts file matched by the config's include glob.
 */

afterEach(() => {
  // Always tear down any fake window so cases stay isolated and we return to the
  // real SSR/no-window baseline.
  // @ts-expect-error — deleting the optional test global.
  delete globalThis.window;
  vi.restoreAllMocks();
});

describe('analytics event vocabulary (architecture §Communication-Patterns)', () => {
  it('exports EXACTLY the six kebab area-action events, in the locked order', () => {
    expect(ANALYTICS_EVENTS).toEqual([
      'guide-opened',
      'guide-query',
      'citation-followed',
      'invite-submitted',
      'channel-clicked',
      'speaker-reel-played',
    ]);
  });

  it('every event name is kebab-case `area-action` (no spaces, no PII shape)', () => {
    for (const name of ANALYTICS_EVENTS) {
      expect(name).toMatch(/^[a-z]+(-[a-z]+)+$/);
    }
  });

  it('has no duplicate event names', () => {
    expect(new Set(ANALYTICS_EVENTS).size).toBe(ANALYTICS_EVENTS.length);
  });
});

describe('track() — SSR-safe + no-op without Umami (NFR-5)', () => {
  it('is a no-op (does not throw) when there is no window (server build / SSR)', () => {
    // The afterEach baseline: no globalThis.window.
    expect('window' in globalThis).toBe(false);
    expect(() => track('guide-opened')).not.toThrow();
    expect(() => track('channel-clicked', { channel: 'YouTube' })).not.toThrow();
  });

  it('is a no-op (does not throw) when window exists but Umami is absent (JS-off / not stood up)', () => {
    // @ts-expect-error — minimal fake window with no `umami`.
    globalThis.window = {};
    expect(() => track('guide-query')).not.toThrow();
  });

  it('forwards the event name to window.umami.track when Umami is present', () => {
    const trackSpy = vi.fn();
    // @ts-expect-error — fake window carrying the Umami tracker.
    globalThis.window = { umami: { track: trackSpy } };

    track('citation-followed');

    expect(trackSpy).toHaveBeenCalledTimes(1);
    // Called with ONLY the event name when no data is supplied (no undefined arg).
    expect(trackSpy).toHaveBeenCalledWith('citation-followed');
  });

  it('forwards non-PII data props through to window.umami.track when supplied', () => {
    const trackSpy = vi.fn();
    // @ts-expect-error — fake window carrying the Umami tracker.
    globalThis.window = { umami: { track: trackSpy } };

    track('channel-clicked', { channel: 'GitHub' });

    expect(trackSpy).toHaveBeenCalledTimes(1);
    expect(trackSpy).toHaveBeenCalledWith('channel-clicked', { channel: 'GitHub' });
  });

  it('does not invent an undefined second argument when data is omitted', () => {
    const trackSpy = vi.fn();
    // @ts-expect-error — fake window carrying the Umami tracker.
    globalThis.window = { umami: { track: trackSpy } };

    track('guide-opened');

    // Exactly one positional arg — guards against `track(event, undefined)`, which
    // would change call arity for the Umami client.
    expect(trackSpy.mock.calls[0]).toHaveLength(1);
  });
});
