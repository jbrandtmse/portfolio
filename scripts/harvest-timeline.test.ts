/**
 * harvest-timeline.test.ts — unit tests for the deterministic git→Dot harvest pipeline
 * (Story 6.1 / FR-17 / NFR-6).
 *
 * Tests exercise the REAL exported `harvestTimeline()` (Rule 8 — real module, scoped
 * assertions, mutation-verified). Covers the five story requirements:
 *
 *  1. Default-deny: only allowlisted entries become Dots; private/unlisted artifacts
 *     are never emitted regardless of what exists on disk.
 *  2. Determinism (NFR-6): two calls with identical inputs return deeply-equal output;
 *     sort is stable; no wall-clock dependency.
 *  3. Fail-loud: an allowlist entry pointing at a missing file throws (mirrors renderGlassbox).
 *  4. Merge (AC4): the runway era + its [ASSUMPTION] ticks survive from the seed;
 *     harvested Dots land in the agentic-turn era.
 *  5. Credibility (AC5): runway ticks match ^~\d{4}$ + contain [ASSUMPTION]; no Dot href
 *     is a fabricated Glass-Box URL for a non-allowlisted slug; harvested dates come from
 *     git committer dates (not wall-clock).
 *
 * MUTATION-VERIFICATION APPROACH:
 *  Each load-bearing assertion is mutation-verified by the test structure itself:
 *  - Default-deny: allowlist with a private path omitted → private path absent in output.
 *  - Determinism: two independent calls compared (not "call once, compare to itself").
 *  - Fail-loud: an allowlist entry with a nonexistent path is expected to throw.
 *  - Merge: the runway era's existence is verified against the REAL TIMELINE_SEED,
 *    not an inline copy (if the seed drifts, the test catches it — Rule 8).
 *  - Credibility: runway tick date pattern + [ASSUMPTION] scoped to the runway era.
 *
 * The pure `harvestTimeline()` is the testable surface — no Astro build required,
 * no generated file on disk. The Generator wrapper is a thin IO shell; its behavior
 * is exercised by the AC6 integration e2e (web/e2e/timeline.spec.ts).
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { TIMELINE_SEED } from '../content/timeline/dots.ts';
import type { EraBand, FlagshipNode } from '../content/timeline/dots.ts';
import { TIMELINE_ALLOWLIST, type TimelineHarvestEntry } from '../content/timeline.allowlist.ts';
import { harvestTimeline } from './harvest-timeline.ts';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptsDir, '..');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten all non-runway Dot labels from a merged EraBand[]. */
function allAgenticLabels(eras: EraBand[]): string[] {
  const agentic = eras.find((e) => e.id === 'agentic-turn');
  if (!agentic) return [];
  return agentic.entries.flatMap((en) => {
    if (en.kind === 'flagship') {
      return [en.label, ...en.cluster.map((d) => d.label)];
    }
    return [];
  });
}

// ── Real harvest output (run once, shared across tests) ───────────────────────

/** Run the real harvestTimeline once to share across assertions. */
const realOutput: EraBand[] = harvestTimeline(TIMELINE_ALLOWLIST, TIMELINE_SEED, repoRoot);

// ── Test suite ────────────────────────────────────────────────────────────────

describe('harvest-timeline — default-deny (AC1 / FR-17)', () => {
  it('iterates ONLY the allowlist — a known-private path absent from allowlist never appears as a Dot', () => {
    // Build an allowlist that includes only one entry.
    // Confirm that a known private artifact (review-adversarial.md) that exists on
    // disk but is NOT in the minimal allowlist produces ZERO Dots for it.
    const privateSourceFile =
      '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/review-adversarial.md';
    const minimalAllowlist: readonly TimelineHarvestEntry[] = [
      {
        sourceFile: '_bmad-output/brainstorming/brainstorming-session-2026-06-02-1723.md',
        kind: 'planning',
        label: 'Brainstorm Session',
        href: '/glass-box/brainstorm/',
        state: 'filled',
      },
    ];

    const output = harvestTimeline(minimalAllowlist, TIMELINE_SEED, repoRoot);
    const labels = allAgenticLabels(output);

    // The private file is NOT in the allowlist → must NOT appear.
    expect(
      labels.some((l) => l.toLowerCase().includes('review')),
      `private artifact label leaked: ${privateSourceFile}`,
    ).toBe(false);

    // Only the ONE allowlisted entry (Brainstorm Session) becomes a harvested Dot.
    const agenticBand = output.find((e) => e.id === 'agentic-turn')!;
    const portfolioFlagship = agenticBand.entries.find(
      (e): e is FlagshipNode => e.kind === 'flagship' && e.label === 'This portfolio',
    )!;
    const clusterLabels = portfolioFlagship.cluster.map((d) => d.label);
    expect(clusterLabels).toContain('Brainstorm Session');
    // No review-adversarial label anywhere.
    expect(labels.some((l) => l.includes('review-adversarial'))).toBe(false);
  });

  it('a .decision-log sibling is never emitted even if it exists on disk', () => {
    // decision-log.md files are private by construction — the allowlist never
    // lists them, so they cannot appear. Assert by running with only the real
    // allowlist and checking no .decision-log content appears in labels.
    const labels = allAgenticLabels(realOutput);
    expect(labels.some((l) => l.toLowerCase().includes('decision-log'))).toBe(false);
    expect(labels.some((l) => l.toLowerCase().includes('reconcile'))).toBe(false);
    expect(labels.some((l) => l.toLowerCase().includes('validation-report'))).toBe(false);
  });

  it('the real allowlist is the complete set — no extra labels appear beyond those declared', () => {
    // Flatten all labels that could come from harvesting.
    const declaredLabels = TIMELINE_ALLOWLIST.map((e) => e.label);
    // Every agentic entry label (excluding seed-only ones) must be in the declared set.
    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    for (const entry of agenticBand.entries) {
      if (entry.kind !== 'flagship') continue;
      // Seed-only entries (loandemo, This portfolio) are in the seed, not the allowlist.
      if (entry.label === 'loandemo' || entry.label === 'This portfolio') continue;
      // All other entries must be from the allowlist.
      expect(declaredLabels, `"${entry.label}" is not in TIMELINE_ALLOWLIST`).toContain(
        entry.label,
      );
    }
  });
});

describe('harvest-timeline — determinism (NFR-6)', () => {
  it('two independent calls with the same inputs return deeply-equal output', () => {
    const first = harvestTimeline(TIMELINE_ALLOWLIST, TIMELINE_SEED, repoRoot);
    const second = harvestTimeline(TIMELINE_ALLOWLIST, TIMELINE_SEED, repoRoot);
    expect(first).toEqual(second);
  });

  it('the output is stable JSON (plain, serializable — no functions or Date objects)', () => {
    const roundTripped = JSON.parse(JSON.stringify(realOutput));
    expect(roundTripped).toEqual(realOutput);
  });

  it('the agentic-turn Dots are sorted by date ascending (deterministic order)', () => {
    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    const dates = agenticBand.entries
      .filter((e) => e.kind === 'flagship')
      .map((e) => (e as FlagshipNode).date);
    // Verify sorted order: each date ≤ the next one (lexicographic ascending).
    for (let i = 0; i < dates.length - 1; i++) {
      expect(
        dates[i]! <= dates[i + 1]!,
        `agentic-turn entry order not deterministic at index ${i}: "${dates[i]}" > "${dates[i + 1]}"`,
      ).toBe(true);
    }
  });

  it('portfolio cluster Dots are sorted by date ascending after merge', () => {
    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    const portfolioFlagship = agenticBand.entries.find(
      (e): e is FlagshipNode => e.kind === 'flagship' && e.label === 'This portfolio',
    )!;
    const clusterDates = portfolioFlagship.cluster.map((d) => d.date);
    for (let i = 0; i < clusterDates.length - 1; i++) {
      expect(
        clusterDates[i]! <= clusterDates[i + 1]!,
        `portfolio cluster not sorted at index ${i}: "${clusterDates[i]}" > "${clusterDates[i + 1]}"`,
      ).toBe(true);
    }
  });
});

describe('harvest-timeline — fail-loud on missing allowlisted file (AC4 mirror)', () => {
  it('throws with a descriptive error when an allowlisted sourceFile does not exist', () => {
    const badAllowlist: readonly TimelineHarvestEntry[] = [
      {
        sourceFile: '_bmad-output/NON_EXISTENT_FILE_FOR_TEST_12345.md',
        kind: 'epic',
        label: 'Ghost Epic',
        href: '[OPEN]',
        state: 'filled',
      },
    ];
    expect(() => harvestTimeline(badAllowlist, TIMELINE_SEED, repoRoot)).toThrow(
      /harvest-timeline.*FAIL.*NON_EXISTENT_FILE_FOR_TEST_12345/,
    );
  });

  it('the error message names the missing file and the resolved path', () => {
    const missingFile = '_bmad-output/definitely-missing-file.md';
    const badAllowlist: readonly TimelineHarvestEntry[] = [
      {
        sourceFile: missingFile,
        kind: 'retrospective',
        label: 'Missing Retro',
        href: '[OPEN]',
        state: 'filled',
      },
    ];
    let errorMessage = '';
    try {
      harvestTimeline(badAllowlist, TIMELINE_SEED, repoRoot);
    } catch (e: unknown) {
      errorMessage = e instanceof Error ? e.message : String(e);
    }
    expect(errorMessage).toContain(missingFile);
    expect(errorMessage).toContain('harvest-timeline');
  });
});

describe('harvest-timeline — merge: seed preserved + harvested Dots placed (AC4)', () => {
  it('emits exactly two era-bands (runway and agentic-turn)', () => {
    expect(realOutput.map((e) => e.id)).toEqual(['runway', 'agentic-turn']);
  });

  it('the runway era is preserved verbatim from the REAL TIMELINE_SEED (not an inline copy)', () => {
    // Rule 8: assert against the REAL module — TIMELINE_SEED from content/timeline/dots.ts.
    const outputRunway = realOutput.find((e) => e.id === 'runway')!;
    const seedRunway = TIMELINE_SEED.find((e) => e.id === 'runway')!;
    expect(outputRunway).toEqual(JSON.parse(JSON.stringify(seedRunway)));
  });

  it('the runway era carries the 3 [ASSUMPTION]-flagged ticks (credibility + merge)', () => {
    const runway = realOutput.find((e) => e.id === 'runway')!;
    const ticks = runway.entries.filter((e) => e.kind === 'tick');
    expect(ticks).toHaveLength(3);
    // Scoped to the runway era only (Rule 8 — scoped assertion).
    expect(ticks[0]).toMatchObject({ date: '~1996', state: 'faint' });
    expect(ticks[1]).toMatchObject({ date: '~2006', state: 'faint' });
    expect(ticks[2]).toMatchObject({ date: '~2016', state: 'faint' });
  });

  it('the agentic-turn era contains the loandemo flagship from the seed', () => {
    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    const loandemo = agenticBand.entries.find(
      (e): e is FlagshipNode => e.kind === 'flagship' && e.label === 'loandemo',
    );
    expect(loandemo, 'loandemo flagship must be in agentic-turn era').toBeDefined();
    expect(loandemo!.cluster).toHaveLength(3);
  });

  it('the "This portfolio" flagship cluster includes harvested planning Dots', () => {
    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    const portfolioFlagship = agenticBand.entries.find(
      (e): e is FlagshipNode => e.kind === 'flagship' && e.label === 'This portfolio',
    )!;
    const clusterLabels = portfolioFlagship.cluster.map((d) => d.label);
    // All planning entries from TIMELINE_ALLOWLIST should be in the portfolio cluster.
    const planningLabels = TIMELINE_ALLOWLIST.filter((e) => e.kind === 'planning').map(
      (e) => e.label,
    );
    for (const planLabel of planningLabels) {
      expect(clusterLabels, `planning Dot "${planLabel}" not found in portfolio cluster`).toContain(
        planLabel,
      );
    }
  });

  it('the agentic-turn era contains harvested epic Dots (not in flagship clusters)', () => {
    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    const epicEntryLabels = agenticBand.entries
      .filter((e): e is FlagshipNode => e.kind === 'flagship' && e.cluster.length === 0)
      .map((e) => e.label);
    const allowlistEpicLabels = TIMELINE_ALLOWLIST.filter((e) => e.kind === 'epic').map(
      (e) => e.label,
    );
    for (const epicLabel of allowlistEpicLabels) {
      expect(
        epicEntryLabels,
        `epic Dot "${epicLabel}" not found in agentic-turn entries`,
      ).toContain(epicLabel);
    }
  });

  it('the agentic-turn era contains harvested retrospective Dots', () => {
    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    const entryLabels = agenticBand.entries
      .filter((e): e is FlagshipNode => e.kind === 'flagship')
      .map((e) => e.label);
    const retroLabels = TIMELINE_ALLOWLIST.filter((e) => e.kind === 'retrospective').map(
      (e) => e.label,
    );
    for (const retroLabel of retroLabels) {
      expect(entryLabels, `retro Dot "${retroLabel}" not found in agentic-turn entries`).toContain(
        retroLabel,
      );
    }
  });

  it('the course-correction Dot is in the agentic-turn era', () => {
    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    const entryLabels = agenticBand.entries
      .filter((e): e is FlagshipNode => e.kind === 'flagship')
      .map((e) => e.label);
    const ccLabel = TIMELINE_ALLOWLIST.find((e) => e.kind === 'course-correction')!.label;
    expect(entryLabels).toContain(ccLabel);
  });
});

describe('harvest-timeline — credibility floor (AC5)', () => {
  it('every runway tick uses an approximate ~YYYY date and is flagged [ASSUMPTION]', () => {
    // Rule 8: scoped to runway era only.
    const runway = realOutput.find((e) => e.id === 'runway')!;
    const ticks = runway.entries.filter((e) => e.kind === 'tick');
    for (const tick of ticks) {
      expect(tick.date, `runway tick date "${tick.date}" must match ^~\\d{4}$`).toMatch(/^~\d{4}$/);
      expect(tick.label, `runway tick label "${tick.label}" must contain [ASSUMPTION]`).toContain(
        '[ASSUMPTION]',
      );
    }
  });

  it('no harvested Dot href is a fabricated Glass-Box URL for a non-allowlisted slug', () => {
    // The Glass Box allowlist slugs (the only ones that have real readers today).
    const GLASSBOX_SLUGS = new Set([
      'product-brief',
      'brainstorm',
      'pre-brief-research',
      'prd',
      'ux-design',
      'ux-experience',
    ]);

    // Collect all hrefs from harvested Dots (agentic-turn era, non-seed entries).
    // Seed entries (loandemo, portfolio flagship itself) are excluded.
    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    const harvestedFlagships = agenticBand.entries.filter(
      (e): e is FlagshipNode =>
        e.kind === 'flagship' && e.label !== 'loandemo' && e.label !== 'This portfolio',
    );

    for (const flagship of harvestedFlagships) {
      // Non-planning harvested Dots should have [OPEN] hrefs (not Glass Box URLs).
      // This asserts no fabricated /glass-box/{slug}/ for non-allowlisted content.
      if (flagship.href && flagship.href.startsWith('/glass-box/')) {
        const slug = flagship.href.replace('/glass-box/', '').replace(/\/$/, '');
        expect(
          GLASSBOX_SLUGS.has(slug),
          `harvested Dot "${flagship.label}" links to /glass-box/${slug}/ which is NOT in GLASSBOX_ALLOWLIST`,
        ).toBe(true);
      }
    }
  });

  it('planning Dots in the portfolio cluster link to real Glass-Box slugs only', () => {
    // Planning Dots may use /glass-box/{slug}/ — but only for slugs actually in the
    // GLASSBOX_ALLOWLIST. This asserts no fabricated Glass-Box URL.
    const GLASSBOX_SLUGS = new Set([
      'product-brief',
      'brainstorm',
      'pre-brief-research',
      'prd',
      'ux-design',
      'ux-experience',
    ]);

    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    const portfolioFlagship = agenticBand.entries.find(
      (e): e is FlagshipNode => e.kind === 'flagship' && e.label === 'This portfolio',
    )!;

    for (const dot of portfolioFlagship.cluster) {
      if (dot.href.startsWith('/glass-box/') && dot.href !== '/glass-box/') {
        const slug = dot.href.replace('/glass-box/', '').replace(/\/$/, '');
        expect(
          GLASSBOX_SLUGS.has(slug),
          `portfolio cluster Dot "${dot.label}" links to /glass-box/${slug}/ which is NOT in GLASSBOX_ALLOWLIST`,
        ).toBe(true);
      }
    }
  });

  it('harvested Dot dates are ISO-8601 committer dates (not wall-clock values)', () => {
    // ISO-8601 with full timestamp (what git --format=%cI emits) or FALLBACK_DATE.
    const ISO_FULL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    // Get all harvested Dot dates (exclude seed-only entries).
    const harvestedDates = agenticBand.entries
      .filter(
        (e): e is FlagshipNode =>
          e.kind === 'flagship' && e.label !== 'loandemo' && e.label !== 'This portfolio',
      )
      .map((e) => e.date);

    for (const date of harvestedDates) {
      expect(
        date,
        `harvested Dot date "${date}" must be ISO-8601 full timestamp (git committer date)`,
      ).toMatch(ISO_FULL);
    }
  });

  it('planning Dot dates in portfolio cluster are ISO-8601 committer dates', () => {
    const ISO_FULL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
    const agenticBand = realOutput.find((e) => e.id === 'agentic-turn')!;
    const portfolioFlagship = agenticBand.entries.find(
      (e): e is FlagshipNode => e.kind === 'flagship' && e.label === 'This portfolio',
    )!;

    // Only check planning Dots (not The Live Site which is seeded with a plain date).
    const planningLabels = new Set(
      TIMELINE_ALLOWLIST.filter((e) => e.kind === 'planning').map((e) => e.label),
    );
    const planningClusterDots = portfolioFlagship.cluster.filter((d) =>
      planningLabels.has(d.label),
    );

    expect(planningClusterDots.length).toBeGreaterThan(0);
    for (const dot of planningClusterDots) {
      expect(
        dot.date,
        `planning cluster Dot "${dot.label}" date "${dot.date}" must be ISO-8601 full timestamp`,
      ).toMatch(ISO_FULL);
    }
  });
});

describe('harvest-timeline — pipeline-guards compatibility (no wall-clock / no network)', () => {
  it('harvest-timeline.ts source contains no Date.now() / Math.random() / argless new Date()', () => {
    // This mirrors what pipeline-guards.test.ts sweeps via readdirSync.
    // Providing a local assertion here makes the intent explicit and the
    // mutation-verification obvious: change harvest-timeline.ts to add Date.now()
    // → this test reds immediately (before the pipeline-guards sweep even runs).
    const source = readFileSync(join(scriptsDir, 'harvest-timeline.ts'), 'utf8');
    // Strip comments so doc-comment mentions of banned APIs don't trip the test.
    const executable = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    expect(executable).not.toMatch(/Date\.now\s*\(/);
    expect(executable).not.toMatch(/Math\.random\s*\(/);
    expect(executable).not.toMatch(/new\s+Date\s*\(\s*\)/);
    expect(executable).not.toMatch(/\bfetch\s*\(/);
    expect(executable).not.toMatch(/https?:\/\//);
  });
});
