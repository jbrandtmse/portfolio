/**
 * timeline.ts — Build-time loader for the Master Timeline manifest (Story 2.4).
 *
 * Reads `web/src/generated/timeline.json` (written by the render pipeline:
 * scripts/render-timeline.ts ← content/timeline/dots.ts → pnpm build) and
 * returns the typed era-bands for `web/src/pages/timeline.astro`.
 *
 * WHY A LOADER (parallels web/src/lib/glassbox.ts): the hand-curated manifest is
 * the repo-root `content/timeline/dots.ts` (the single source of truth, FR-33/34,
 * architecture §Structure). Vite/Astro cannot import across the `web/` package
 * boundary, so the page reads the generated JSON via this loader rather than
 * importing `content/` directly — exactly as the Glass Box page reads
 * `glassbox.json` via `loadGlassboxArtifacts()`.
 *
 * GRACEFUL ABSENT-DATA: if the JSON file does not yet exist (e.g. a bare
 * `astro build` without the pipeline, or a clean CI checkout), this returns `[]`
 * — never throws. The page renders an empty (but valid) <ol>; the build
 * succeeds. The timeline.test.ts beforeAll runs the generator first so the
 * build-output assertions see the real data.
 *
 * BUILD-TIME ONLY: uses Node's `fs.readFileSync`. Never shipped to the browser
 * (imported only in `.astro` frontmatter / server-side build code).
 *
 * TYPES: mirrors the interfaces in `content/timeline/dots.ts` — declared here to
 * avoid a web → repo-root-content import coupling at build time (same discipline
 * as glassbox.ts mirroring scripts/render-glassbox.ts's GlassboxArtifact).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

/** Dot visual state — matches TimelineDot.astro's DotState union. */
export type DotState = 'faint' | 'resting' | 'filled' | 'live' | 'upcoming' | 'milestone';

/** A single timeline entry (Dot). */
export interface TimelineDotEntry {
  /** Dot label — the artifact name or milestone title. */
  label: string;
  /** ISO-8601 date string, or an approximate era string (e.g. "~1996"). */
  date: string;
  /** Visual state for this dot. */
  state: DotState;
  /** The artifact this dot drills into (a reader URL, a fragment, or "[OPEN]"). */
  href: string;
  /** Optional: a short description shown as supplementary text. */
  description?: string;
}

/** A flagship node — a milestone dot with a static cluster of child dots. */
export interface FlagshipNode {
  kind: 'flagship';
  label: string;
  date: string;
  description: string;
  /**
   * Optional reader href for the flagship ITSELF (Story 6.2). Harvested
   * epics/retros/course-corrections are FlagshipNode-shaped with an empty
   * cluster; this carries their `[OPEN]` (no-reader-yet) status so both the
   * static FlagshipNode and the zoom island can render the same clean
   * "full reader coming (6.3/6.4)" affordance instead of leaking a sentinel.
   * Absent for the multi-artifact seed flagships (loandemo, This portfolio).
   */
  href?: string;
  /** Child dots in this flagship's cluster (ordered oldest → newest). */
  cluster: TimelineDotEntry[];
}

/** A faint decorative tick for the quiet runway era. */
export interface RunwayTick {
  kind: 'tick';
  label: string;
  date: string;
  state: 'faint';
}

/** An era-band labeling a region of the timeline spine. */
export interface EraBand {
  id: 'runway' | 'agentic-turn';
  label: string;
  metaNote: string;
  /** The entries in this era, in oldest → newest order. */
  entries: (RunwayTick | FlagshipNode)[];
}

/**
 * Candidate paths for the generated timeline.json, tried in order. Mirrors the
 * glassbox.ts resolution chain so both loaders behave identically across the
 * `astro build` (cwd = web/), repo-root scripting, and web/test contexts.
 *
 * 1. `process.cwd()/src/generated/timeline.json` — cwd is `web/` during `astro build`.
 * 2. `process.cwd()/web/src/generated/timeline.json` — cwd is the repo root.
 * 3. `process.cwd()/../src/generated/timeline.json` — cwd is web/test → web.
 */
function findGeneratedJson(): string | null {
  const candidates = [
    join(process.cwd(), 'src', 'generated', 'timeline.json'),
    join(process.cwd(), 'web', 'src', 'generated', 'timeline.json'),
    resolve(process.cwd(), '..', 'src', 'generated', 'timeline.json'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Format a timeline ISO date string as a short "Mon YYYY" label, deterministically
 * and independently of the runner's local timezone (Story 3.0, AC5).
 *
 * - ISO date-only strings (e.g. "2026-06" or "2026-06-06") are parsed as UTC
 *   calendar values — `YYYY-MM(-DD)?` — so the visible label never shifts when
 *   built west of UTC (where `new Date("2026-06-01").toLocaleDateString(...)` can
 *   roll back to May in America/Los_Angeles at midnight UTC).
 * - If the input starts with "~" (approximate era marker, e.g. "~1996"), it is
 *   returned verbatim (no formatting — the tilde form is the display value).
 * - If the input starts with "[" (an OPEN/ASSUMPTION flag carried in the datetime
 *   attr, e.g. "[OPEN]"), it is returned verbatim.
 * - On any parse failure (NaN date), the raw string is returned as a fallback.
 *
 * Both IIFEs in FlagshipNode.astro (milestone date + cluster-dot dates) are
 * replaced by this single shared call.
 *
 * @param iso - A timeline date value: an ISO-8601 date string, a "~YYYY"
 *   approximate, or a "[FLAG]" passthrough.
 * @returns A deterministic "Mon YYYY" label, or the raw string for passthroughs.
 */
const _dotDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDotDate(iso: string): string {
  // Passthrough: approximate era markers ("~1996") and flag values ("[OPEN]", "[ASSUMPTION]…").
  if (iso.startsWith('~') || iso.startsWith('[')) return iso;
  // Parse YYYY-MM or YYYY-MM-DD as a UTC calendar value to avoid TZ shift.
  // new Date("2026-06")    → 2026-06-01T00:00:00Z  (UTC midnight — safe)
  // new Date("2026-06-06") → 2026-06-06T00:00:00Z  (UTC midnight — safe)
  // ISO datetime strings with a time component are also handled gracefully.
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return _dotDateFormatter.format(d);
  } catch {
    return iso;
  }
}

/**
 * Load the curated Master Timeline era-bands from the generated JSON.
 *
 * Returns `[]` if the file is absent (graceful degradation — bare `astro build`
 * without the render pipeline runs cleanly and emits an empty timeline spine;
 * no throw, no crash).
 */
export function loadTimelineEras(): EraBand[] {
  const jsonPath = findGeneratedJson();
  if (!jsonPath) return [];
  try {
    const raw = readFileSync(jsonPath, 'utf8');
    return JSON.parse(raw) as EraBand[];
  } catch {
    // Malformed JSON or read error — degrade gracefully.
    return [];
  }
}
