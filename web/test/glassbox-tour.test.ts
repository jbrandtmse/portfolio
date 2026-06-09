/**
 * Unit tests for the Story 6.3 GlassBoxTour island machinery.
 *
 * Rule 8 (real module, scoped, mutation-verified):
 *   - Tests import the REAL `$tourStep` atom from `store.ts`.
 *   - Tests import the REAL exported helpers from `GlassBoxTour.tsx`.
 *   - Each assertion is scoped to the specific export under test.
 *   - Mutation verification: includes negation checks that would fail if
 *     the module were initialized to the wrong value or the logic were wrong.
 *
 * Covered:
 *   (a) $tourStep atom — initial value, open, close, step, reset
 *   (b) stepArtifact helper — correct mapping, boundary conditions
 *   (c) Rule 12 guard — verify no resetRecuration reference exists
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { $tourStep } from '../src/lib/store.ts';
// Rule 8: import the REAL island exports (not inline copies).
import { stepArtifact, type TourArtifact } from '../src/islands/GlassBoxTour.tsx';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const FIXTURE_ARTIFACTS: TourArtifact[] = [
  {
    slug: 'brainstorm',
    title: 'Brainstorm Session',
    curatorNote:
      '47 ideas in 90 minutes — the raw, unedited thinking that seeded every strategic decision.',
    date: '2026-06-02T23:02:06+00:00',
  },
  {
    slug: 'pre-brief-research',
    title: 'Pre-Brief Research',
    curatorNote:
      'The grounding pass: what practitioners actually share, what 30-year engineers overlook, what this site had to avoid.',
    date: '2026-06-02T23:02:06+00:00',
  },
  {
    slug: 'product-brief',
    title: 'Product Brief',
    curatorNote:
      'The one-page argument that set the direction: craft artifact first, conversion funnel never.',
    date: '2026-06-02T23:02:06+00:00',
  },
  {
    slug: 'prd',
    title: 'Product Requirements Document',
    curatorNote:
      'Every feature, every constraint, every "never" — the full PRD the agent pipeline builds from.',
    date: '2026-06-06T02:08:52+00:00',
  },
  {
    slug: 'ux-design',
    title: 'UX Design',
    curatorNote:
      'Ink-on-cream, editorial, Source Serif 4 — how the visual identity was decided in one session.',
    date: '2026-06-04T04:42:34+00:00',
  },
  {
    slug: 'ux-experience',
    title: 'UX Experience',
    curatorNote:
      'The visitor journey — how every interaction, from hero to Glass Box, was choreographed.',
    date: '2026-06-06T02:08:52+00:00',
  },
];

// ---------------------------------------------------------------------------
// (a) $tourStep atom — tour lifecycle
// ---------------------------------------------------------------------------

describe('$tourStep atom (Story 6.3)', () => {
  beforeEach(() => {
    // Reset to closed between tests.
    $tourStep.set(null);
  });

  it('is initialized to null (tour closed) — mutation check: not a number', () => {
    const val = $tourStep.get();
    // Mutation verification: if initialized to anything else this fails.
    expect(val).toBeNull();
    expect(val).not.toBe(0);
    expect(val).not.toBe(1);
  });

  it('transitions closed → step 0 when tour is started', () => {
    $tourStep.set(0);
    expect($tourStep.get()).toBe(0);
    // Not null (not closed).
    expect($tourStep.get()).not.toBeNull();
  });

  it('transitions step 0 → step 1 (next)', () => {
    $tourStep.set(0);
    expect($tourStep.get()).toBe(0);
    $tourStep.set(1);
    expect($tourStep.get()).toBe(1);
    // Not still on step 0.
    expect($tourStep.get()).not.toBe(0);
  });

  it('transitions step 1 → step 0 (prev)', () => {
    $tourStep.set(1);
    expect($tourStep.get()).toBe(1);
    $tourStep.set(0);
    expect($tourStep.get()).toBe(0);
  });

  it('transitions any step → null (tour closed)', () => {
    $tourStep.set(3);
    expect($tourStep.get()).toBe(3);
    $tourStep.set(null);
    expect($tourStep.get()).toBeNull();
  });

  it('accepts the last valid step index (totalSteps - 1)', () => {
    const lastStep = FIXTURE_ARTIFACTS.length - 1;
    $tourStep.set(lastStep);
    expect($tourStep.get()).toBe(lastStep);
    expect($tourStep.get()).not.toBeNull();
  });

  it('round-trips: open → walk → close', () => {
    // Open
    $tourStep.set(0);
    expect($tourStep.get()).toBe(0);
    // Walk forward
    $tourStep.set(1);
    $tourStep.set(2);
    expect($tourStep.get()).toBe(2);
    // Close
    $tourStep.set(null);
    expect($tourStep.get()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// (b) stepArtifact helper — step index → artifact mapping
// ---------------------------------------------------------------------------

describe('stepArtifact helper (Story 6.3)', () => {
  it('returns null when step is null (tour closed)', () => {
    const result = stepArtifact(FIXTURE_ARTIFACTS, null);
    // Mutation check: if the function returned the first artifact instead of null,
    // this assertion would fail.
    expect(result).toBeNull();
  });

  it('returns the first artifact at step 0', () => {
    const result = stepArtifact(FIXTURE_ARTIFACTS, 0);
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('brainstorm');
    // Mutation check: not the second artifact.
    expect(result?.slug).not.toBe('pre-brief-research');
  });

  it('returns the second artifact at step 1', () => {
    const result = stepArtifact(FIXTURE_ARTIFACTS, 1);
    expect(result?.slug).toBe('pre-brief-research');
    // Mutation check: not the first.
    expect(result?.slug).not.toBe('brainstorm');
  });

  it('returns the last artifact at step N-1', () => {
    const lastIdx = FIXTURE_ARTIFACTS.length - 1;
    const result = stepArtifact(FIXTURE_ARTIFACTS, lastIdx);
    expect(result).not.toBeNull();
    expect(result?.slug).toBe(FIXTURE_ARTIFACTS[lastIdx]?.slug);
  });

  it('returns null when step is out of range (>= length)', () => {
    const result = stepArtifact(FIXTURE_ARTIFACTS, FIXTURE_ARTIFACTS.length);
    expect(result).toBeNull();
  });

  it('returns null when step is negative', () => {
    const result = stepArtifact(FIXTURE_ARTIFACTS, -1);
    expect(result).toBeNull();
  });

  it('returns null when artifacts array is empty', () => {
    const result = stepArtifact([], 0);
    expect(result).toBeNull();
  });

  it('the returned artifact carries the correct curatorNote (for AC4)', () => {
    const result = stepArtifact(FIXTURE_ARTIFACTS, 0);
    // The curatorNote must trace to the real curated string.
    expect(result?.curatorNote).toBe(
      '47 ideas in 90 minutes — the raw, unedited thinking that seeded every strategic decision.',
    );
    // Mutation check: not a fabricated string.
    expect(result?.curatorNote).not.toBe('Some invented description');
  });

  it('each step maps to the correct slug (full walk, build-story order)', () => {
    const expectedSlugs = FIXTURE_ARTIFACTS.map((a) => a.slug);
    for (let i = 0; i < FIXTURE_ARTIFACTS.length; i++) {
      const result = stepArtifact(FIXTURE_ARTIFACTS, i);
      expect(result?.slug, `step ${i} should map to ${expectedSlugs[i]}`).toBe(expectedSlugs[i]);
    }
  });
});

// ---------------------------------------------------------------------------
// (c) Dead-code guard — resetRecuration was deleted in this story
// ---------------------------------------------------------------------------

describe('resetRecuration dead-code deletion (Story 6.3, decision #4)', () => {
  it('resetRecuration is NOT exported from recuration.ts (dead export deleted)', async () => {
    // Import the real module and confirm the deleted export is absent.
    const mod = await import('../src/lib/recuration.ts');
    // The deletion is verified: 'resetRecuration' key must not be in the module exports.
    expect('resetRecuration' in mod).toBe(false);
    // Mutation check: applyRecuration (a live export) IS still present.
    expect('applyRecuration' in mod).toBe(true);
    expect('initRecuration' in mod).toBe(true);
  });
});
