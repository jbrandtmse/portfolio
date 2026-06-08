/**
 * harvest-timeline.ts — deterministic git→Dot auto-harvest generator (Story 6.1).
 *
 * Harvests BMAD-process Dots (planning workflows, completed epics, course-corrections,
 * retrospectives) from real `_bmad-output/` artifacts via the DEFAULT-DENY timeline
 * allowlist (`content/timeline.allowlist.ts`). Merges the harvested Dots with the
 * curated seed (`content/timeline/dots.ts`'s TIMELINE_SEED — the pre-repo career
 * runway + era framing + loandemo flagship) into the same `EraBand[]` shape the
 * `/timeline` page already reads.
 *
 * HARD CONSTRAINTS (FR-17 / NFR-6):
 *  - NO network IO. No fetch, no HTTP, no GitHub/YouTube/Suno reads.
 *  - NO filesystem walk. Iterates ONLY the TIMELINE_ALLOWLIST — never readdirSync
 *    or glob on _bmad-output/. Default-deny by construction.
 *  - DETERMINISTIC: no Date.now() / Math.random() / argless new Date().
 *    Dates come from `git log -1 --format=%cI` (committer date, stable for
 *    committed history) via the shared `gitCommitterDate()` from render-glassbox.ts.
 *    Sort order is deterministic (date asc, then label code-unit).
 *  - FAIL LOUD: throws (fails the build) if any allowlisted sourceFile is absent
 *    or unreadable — mirrors renderGlassbox; never silently skips.
 *
 * MERGE STRATEGY:
 *  - Seed runway era → preserved verbatim (pre-repo ticks, era framing).
 *  - Seed agentic-turn era → provides the era label/metaNote + flagship stubs:
 *      • loandemo flagship → preserved verbatim (cluster links to /work/loandemo/#…)
 *      • "This portfolio" flagship → seed cluster merged with harvested planning Dots
 *        (sorted by git committer date asc, then label code-unit asc)
 *  - Harvested epic / retrospective / course-correction Dots → added as additional
 *    entries in the agentic-turn era (alongside the flagships), sorted by date asc.
 *
 * BUILD WIRE-UP:
 *  - Registered as `harvestTimelineGenerator` in CONTENT_GENERATORS
 *    (scripts/build-content.ts), replacing `renderTimelineGenerator`.
 *  - Writes `web/src/generated/timeline.json` (gitignored).
 *  - Page + loader (`web/src/lib/timeline.ts`) are UNCHANGED — same EraBand[] shape.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { TIMELINE_SEED } from '../content/timeline/dots.ts';
import type {
  EraBand,
  FlagshipNode,
  RunwayTick,
  TimelineDotEntry,
} from '../content/timeline/dots.ts';
import { TIMELINE_ALLOWLIST } from '../content/timeline.allowlist.ts';
import type { TimelineHarvestEntry } from '../content/timeline.allowlist.ts';
import { byCodeUnit, getRepoRoot, gitCommitterDate } from './render-glassbox.ts';
import type { Generator } from './build-content.ts';

// ── Harvested Dot (internal shape before merging into EraBand[]) ──────────────

interface HarvestedDot {
  kind: TimelineHarvestEntry['kind'];
  label: string;
  date: string; // ISO-8601 committer date from git
  state: TimelineHarvestEntry['state'];
  href: string;
  description?: string;
}

// ── Core harvest function ──────────────────────────────────────────────────────

/**
 * Harvest all Dots from the allowlist: for each entry, verify the file exists
 * (fail loud if not), read its git committer date, and build a HarvestedDot.
 *
 * NEVER walks the filesystem — iterates ONLY the allowlist (default-deny).
 *
 * @param allowlist The default-deny timeline harvest entries.
 * @param repoRoot  Absolute path to the git work-tree root.
 * @returns Array of harvested Dots in allowlist order (caller sorts).
 */
function harvestDots(allowlist: readonly TimelineHarvestEntry[], repoRoot: string): HarvestedDot[] {
  const dots: HarvestedDot[] = [];

  for (const entry of allowlist) {
    const absPath = join(repoRoot, entry.sourceFile);

    // FAIL LOUD: missing allowlisted artifact is a build error (mirrors renderGlassbox AC4).
    if (!existsSync(absPath)) {
      throw new Error(
        `[harvest-timeline] FAIL — allowlisted artifact not found: ` +
          `"${entry.sourceFile}" (resolved: "${absPath}"). ` +
          `Remove it from TIMELINE_ALLOWLIST or restore the file.`,
      );
    }

    const date = gitCommitterDate(entry.sourceFile, repoRoot);

    dots.push({
      kind: entry.kind,
      label: entry.label,
      date,
      state: entry.state,
      href: entry.href,
      description: entry.description,
    });
  }

  return dots;
}

// ── Dot → TimelineDotEntry conversion ─────────────────────────────────────────

function dotToEntry(dot: HarvestedDot): TimelineDotEntry {
  return {
    label: dot.label,
    date: dot.date,
    state: dot.state,
    href: dot.href,
    ...(dot.description !== undefined ? { description: dot.description } : {}),
  };
}

// ── Sort helpers ───────────────────────────────────────────────────────────────

/**
 * Deterministic comparator for Dots: primary sort by date string (ISO-8601
 * lexicographic, oldest → newest), secondary sort by label (code-unit, stable).
 *
 * The gitCommitterDate fallback is a fixed ISO string, so the sort is stable
 * across identical inputs even when git returns the fallback.
 */
function byDateThenLabel(
  a: { date: string; label: string },
  b: { date: string; label: string },
): number {
  const dateCmp = byCodeUnit(a.date, b.date);
  if (dateCmp !== 0) return dateCmp;
  return byCodeUnit(a.label, b.label);
}

// ── Merge function ─────────────────────────────────────────────────────────────

/**
 * Merge the curated seed with the harvested Dots into the final EraBand[] shape.
 *
 * Merge rules (from the story design decision):
 *  1. Runway era: preserved verbatim from the seed (un-harvestable ticks).
 *  2. Agentic-turn era:
 *     a. loandemo flagship → preserved verbatim from seed.
 *     b. "This portfolio" flagship:
 *        - seed cluster (e.g. The Live Site dot) PLUS harvested 'planning' Dots
 *          → merged and sorted by date asc, then label code-unit asc.
 *     c. Harvested 'epic', 'retrospective', 'course-correction' Dots →
 *        added as individual TimelineDotEntry items alongside the flagships.
 *        These appear as entries in the era (not nested in a flagship cluster).
 *        The full entry list (flagships + harvested non-planning Dots) is sorted
 *        by date asc, then label code-unit asc.
 *
 * @param seed      The curated seed EraBand[] (TIMELINE_SEED).
 * @param harvested All harvested Dots from the allowlist.
 * @returns Merged EraBand[] in the existing JSON shape.
 */
function mergeSeedAndDots(seed: readonly EraBand[], harvested: HarvestedDot[]): EraBand[] {
  // Separate harvested Dots by kind.
  const planningDots = harvested.filter((d) => d.kind === 'planning');
  const nonPlanningDots = harvested.filter((d) => d.kind !== 'planning');

  // Build the merged era array.
  const merged: EraBand[] = [];

  for (const era of seed) {
    if (era.id === 'runway') {
      // Runway era: preserved verbatim (no harvested content belongs here).
      merged.push(JSON.parse(JSON.stringify(era)) as EraBand);
      continue;
    }

    if (era.id === 'agentic-turn') {
      // Build the agentic-turn era entries.
      // Start with seed flagships, augmented for the portfolio.
      const seedEntries: (RunwayTick | FlagshipNode)[] = JSON.parse(
        JSON.stringify(era.entries),
      ) as (RunwayTick | FlagshipNode)[];

      // Find the "This portfolio" flagship and merge planning Dots into its cluster.
      const portfolioFlagship = seedEntries.find(
        (e): e is FlagshipNode => e.kind === 'flagship' && e.label === 'This portfolio',
      );
      if (portfolioFlagship) {
        const harvestedPlanningEntries: TimelineDotEntry[] = planningDots.map(dotToEntry);
        // Merge: seed cluster + harvested planning entries, sorted deterministically.
        portfolioFlagship.cluster = [
          ...portfolioFlagship.cluster,
          ...harvestedPlanningEntries,
        ].sort(byDateThenLabel);
      }

      // Build non-planning Dot entries (epics, retros, course-corrections).
      // These appear as FlagshipNode-shaped items with an empty cluster (they
      // are standalone Dot events, not multi-artifact flagships). We represent
      // them as FlagshipNode with an empty cluster so the existing page
      // components can render them consistently.
      const nonPlanningEntries: FlagshipNode[] = nonPlanningDots.map((dot) => ({
        kind: 'flagship' as const,
        label: dot.label,
        date: dot.date,
        description: dot.description ?? '',
        cluster: [],
      }));

      // Combine flagships (seed) + non-planning harvested entries, then sort.
      // Sort by the entry's own date (FlagshipNode.date), then label code-unit.
      const allEntries = [...seedEntries, ...nonPlanningEntries];
      allEntries.sort((a, b) => {
        const aDate = 'date' in a ? a.date : '';
        const bDate = 'date' in b ? b.date : '';
        const dateCmp = byCodeUnit(aDate, bDate);
        if (dateCmp !== 0) return dateCmp;
        const aLabel = 'label' in a ? a.label : '';
        const bLabel = 'label' in b ? b.label : '';
        return byCodeUnit(aLabel, bLabel);
      });

      merged.push({
        id: era.id,
        label: era.label,
        metaNote: era.metaNote,
        entries: allEntries,
      });
      continue;
    }
  }

  return merged;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Pure harvest-and-merge function: reads allowlisted files' git committer dates,
 * builds Dots, fails loud on missing files, sorts deterministically, and merges
 * into the seed's EraBand[] shape.
 *
 * No IO side effects beyond the file-existence checks + git invocations;
 * fully testable without running the Generator wrapper.
 *
 * @param allowlist  The default-deny timeline harvest entries (default: TIMELINE_ALLOWLIST).
 * @param seed       The curated seed era-bands (default: TIMELINE_SEED).
 * @param repoRoot   Absolute path to the git work-tree root.
 * @returns Merged EraBand[] in the existing JSON shape, deterministic for identical inputs.
 */
export function harvestTimeline(
  allowlist: readonly TimelineHarvestEntry[] = TIMELINE_ALLOWLIST,
  seed: readonly EraBand[] = TIMELINE_SEED,
  repoRoot: string,
): EraBand[] {
  const harvestedDots = harvestDots(allowlist, repoRoot);
  const merged = mergeSeedAndDots(seed, harvestedDots);
  // JSON round-trip: guarantees the emitted structure is plain + serializable.
  return JSON.parse(JSON.stringify(merged)) as EraBand[];
}

/**
 * The Generator registered into CONTENT_GENERATORS (Story 1.8 extension point).
 * Replaces `renderTimelineGenerator`. Writes the harvested+merged timeline
 * manifest to `web/src/generated/timeline.json`.
 */
export const harvestTimelineGenerator: Generator = {
  name: 'harvest-timeline',
  async run(): Promise<void> {
    const repoRoot = getRepoRoot();
    const outputPath = join(repoRoot, 'web', 'src', 'generated', 'timeline.json');

    // Ensure the generated directory exists.
    mkdirSync(dirname(outputPath), { recursive: true });

    const eras = harvestTimeline(TIMELINE_ALLOWLIST, TIMELINE_SEED, repoRoot);

    // Write deterministic JSON (sorted by date+label from harvestTimeline).
    writeFileSync(outputPath, JSON.stringify(eras, null, 2) + '\n', 'utf8');

    const totalDots = eras.reduce((total, e) => {
      return (
        total +
        e.entries.reduce((eTotal, en) => {
          // Count each entry + its cluster items (for flagship nodes).
          return eTotal + 1 + (en.kind === 'flagship' ? en.cluster.length : 0);
        }, 0)
      );
    }, 0);

    console.log(
      `[harvest-timeline] wrote ${eras.length} era-band(s) (${totalDots} total Dot(s)) ` +
        `to web/src/generated/timeline.json`,
    );
  },
};
