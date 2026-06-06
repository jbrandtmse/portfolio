/**
 * render-timeline.test.ts — unit tests for the Master Timeline render pipeline (Story 2.4).
 *
 * Tests assert:
 *  (a) The rendered output mirrors the hand-curated manifest (two era-bands:
 *      runway + agentic-turn) — the curated shape is pinned.
 *  (b) Determinism: two renderTimeline() calls return deep-equal output, and the
 *      output equals the source manifest (static data → byte-identical).
 *  (c) NO automated harvest (AC1): the generator does not read the filesystem or
 *      git for entries — verified by the source containing no fs/child_process
 *      enumeration primitive (only the JSON write + the static import).
 *  (d) Plain-serializable output: the emitted structure survives a JSON round-trip
 *      unchanged (no functions, no Date objects) — safe to write as timeline.json.
 *  (e) Credibility floor (AC4): every runway tick uses an approximate ~YYYY date
 *      (never a fabricated ISO date) and is flagged [ASSUMPTION].
 *
 * The pure `renderTimeline()` function is the testable surface — no Astro build
 * required, no generated file on disk. (The no-network / no-wall-clock guarantee
 * for this file is additionally covered by pipeline-guards.test.ts's whole-
 * scripts/ sweep.)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { TIMELINE_ERAS } from '../content/timeline/dots.ts';
import { renderTimeline } from './render-timeline.ts';

const scriptsDir = dirname(fileURLToPath(import.meta.url));

describe('render-timeline — mirrors the hand-curated manifest', () => {
  it('emits exactly the two curated era-bands in order (runway → agentic-turn)', () => {
    const eras = renderTimeline();
    expect(eras.map((e) => e.id)).toEqual(['runway', 'agentic-turn']);
  });

  it('the agentic-turn era holds the two flagships in order (loandemo → portfolio)', () => {
    const eras = renderTimeline();
    const agentic = eras.find((e) => e.id === 'agentic-turn')!;
    const flagships = agentic.entries.filter(
      (en): en is Extract<typeof en, { kind: 'flagship' }> => en.kind === 'flagship',
    );
    expect(flagships.map((f) => f.label)).toEqual(['loandemo', 'This portfolio']);
    // The portfolio cluster carries the 7 real Glass Box / live-site Dots.
    expect(flagships[1]!.cluster).toHaveLength(7);
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

  it('output deep-equals the source manifest (static data, no transform)', () => {
    // The generator serializes the static manifest verbatim (no harvest, AC1).
    expect(renderTimeline()).toEqual(JSON.parse(JSON.stringify(TIMELINE_ERAS)));
  });

  it('output survives a JSON round-trip unchanged (no functions / Date objects)', () => {
    const eras = renderTimeline();
    const roundTripped = JSON.parse(JSON.stringify(eras));
    expect(roundTripped).toEqual(eras);
  });
});

describe('render-timeline — Stage-1 hand-curated only (NO automated harvest, AC1)', () => {
  it('the source performs no filesystem/git enumeration for entries', () => {
    // Stage 1 is hand-curated. The generator may write its OUTPUT file
    // (mkdirSync/writeFileSync) but must NOT read the repo working tree / git
    // to DISCOVER entries — that deterministic git→Dot harvest is Stage 2 (Epic 6).
    const code = readFileSync(join(scriptsDir, 'render-timeline.ts'), 'utf8');
    // No directory enumeration, no git/child_process, no file reads for input.
    expect(code).not.toMatch(/\breaddirSync\b/);
    expect(code).not.toMatch(/\breadFileSync\b/);
    expect(code).not.toMatch(/\bexecFileSync\b|\bexecSync\b|\bspawnSync\b|child_process/);
  });
});

describe('render-timeline — credibility floor (AC4)', () => {
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
