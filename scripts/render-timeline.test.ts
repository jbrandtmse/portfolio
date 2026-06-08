/**
 * render-timeline.test.ts — unit tests for the Stage-1 timeline render function (Story 2.4).
 *
 * Story 6.1 UPDATE: `renderTimeline()` still exists but is no longer the active
 * pipeline generator — it has been superseded by `harvestTimelineGenerator` (Stage 2).
 * The `content/timeline/dots.ts` manifest is now the CURATED SEED (runway era +
 * loandemo flagship + "This portfolio" flagship stub with only the live-site dot),
 * NOT the full cluster. The auto-harvested Dots (planning workflows, epics, retros,
 * course-corrections) live in `content/timeline.allowlist.ts` and are produced by
 * `scripts/harvest-timeline.ts` (see `scripts/harvest-timeline.test.ts`).
 *
 * These tests cover the SEED shape only — what `renderTimeline(TIMELINE_SEED)` emits.
 * The `harvest-timeline.test.ts` covers the full harvest + merge contract.
 *
 * Tests that remain valid:
 *  (a) Two era-bands in order (runway → agentic-turn) — still true of the seed.
 *  (b) Agentic-turn era has exactly two flagship STUBS: loandemo + "This portfolio".
 *  (c) Runway era has exactly 3 faint ticks.
 *  (d) Determinism: two renderTimeline() calls return deep-equal output.
 *  (e) Output survives a JSON round-trip unchanged.
 *  (f) Credibility floor: runway ticks use ~YYYY + [ASSUMPTION]; loandemo [OPEN] flag.
 *
 * The "Stage-1 hand-curated only — NO automated harvest" test has been REMOVED:
 * it asserted render-timeline.ts contains no readFileSync/execFileSync, which was
 * Stage-1 only (AC1 of Story 2.4). Stage 2 (Story 6.1) legitimately uses git reads
 * in harvest-timeline.ts. That class of assertion now lives in harvest-timeline.test.ts
 * as the default-deny / allowlist-only assertion (the harvester reads git, but ONLY
 * for allowlisted files — never via filesystem enumeration).
 */
import { describe, expect, it } from 'vitest';

import { TIMELINE_SEED } from '../content/timeline/dots.ts';
import { renderTimeline } from './render-timeline.ts';

describe('render-timeline — mirrors the curated seed (two era-bands)', () => {
  it('emits exactly the two curated era-bands in order (runway → agentic-turn)', () => {
    const eras = renderTimeline();
    expect(eras.map((e) => e.id)).toEqual(['runway', 'agentic-turn']);
  });

  it('the agentic-turn era holds the two flagship stubs in order (loandemo → portfolio)', () => {
    const eras = renderTimeline();
    const agentic = eras.find((e) => e.id === 'agentic-turn')!;
    const flagships = agentic.entries.filter(
      (en): en is Extract<typeof en, { kind: 'flagship' }> => en.kind === 'flagship',
    );
    expect(flagships.map((f) => f.label)).toEqual(['loandemo', 'This portfolio']);
    // Story 6.1: The portfolio flagship is now a STUB in the seed.
    // Its cluster contains only the seeded "The Live Site" dot.
    // Planning-workflow Dots are auto-harvested by harvest-timeline.ts.
    expect(flagships[1]!.cluster).toHaveLength(1);
    expect(flagships[1]!.cluster[0]!.label).toBe('The Live Site');
  });

  it('the runway era holds exactly the 3 faint decorative ticks', () => {
    const eras = renderTimeline();
    const runway = eras.find((e) => e.id === 'runway')!;
    const ticks = runway.entries.filter(
      (en): en is Extract<typeof en, { kind: 'tick' }> => en.kind === 'tick',
    );
    expect(ticks).toHaveLength(3);
    expect(ticks.every((t) => t.state === 'faint')).toBe(true);
  });
});

describe('render-timeline — deterministic + plain-serializable', () => {
  it('two calls return deep-equal output (determinism, NFR-6)', () => {
    expect(renderTimeline()).toEqual(renderTimeline());
  });

  it('output deep-equals the source seed (static data, no transform)', () => {
    // The generator serializes the static seed verbatim.
    expect(renderTimeline()).toEqual(JSON.parse(JSON.stringify(TIMELINE_SEED)));
  });

  it('output survives a JSON round-trip unchanged (no functions / Date objects)', () => {
    const eras = renderTimeline();
    const roundTripped = JSON.parse(JSON.stringify(eras));
    expect(roundTripped).toEqual(eras);
  });
});

describe('render-timeline — credibility floor (AC4 — seed only)', () => {
  it('every runway tick uses an approximate ~YYYY date and is flagged [ASSUMPTION]', () => {
    const eras = renderTimeline();
    const runway = eras.find((e) => e.id === 'runway')!;
    const ticks = runway.entries.filter(
      (en): en is Extract<typeof en, { kind: 'tick' }> => en.kind === 'tick',
    );
    for (const tick of ticks) {
      expect(tick.date, `runway tick date "${tick.date}" must be approximate (~YYYY)`).toMatch(
        /^~\d{4}$/,
      );
      expect(tick.label, `runway tick "${tick.label}" must be flagged [ASSUMPTION]`).toContain(
        '[ASSUMPTION]',
      );
    }
  });

  it('the loandemo cluster flags its unconfirmed repo URL [OPEN] (in description, real href)', () => {
    const eras = renderTimeline();
    const agentic = eras.find((e) => e.id === 'agentic-turn')!;
    const loandemo = agentic.entries.find(
      (en): en is Extract<typeof en, { kind: 'flagship' }> =>
        en.kind === 'flagship' && en.label === 'loandemo',
    )!;
    const codeDot = loandemo.cluster.find((d) => d.href === '/work/loandemo/#code')!;
    // The Dot href is a REAL forward-ref link; the [OPEN] flag rides in the text.
    expect(codeDot.href).toBe('/work/loandemo/#code');
    expect(codeDot.description ?? '').toContain('[OPEN');
  });
});
