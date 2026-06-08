/**
 * content/timeline/dots.ts — the CURATED SEED for the Master Timeline (Story 6.1).
 *
 * ROLE CHANGE (Story 6.1 — Stage 2): this file is now the CURATED SEED only,
 * not the complete manifest. The BMAD-process Dots (planning workflows, completed
 * epics, course-corrections, retrospectives) are auto-harvested at build time by
 * `scripts/harvest-timeline.ts` from the real artifacts via the default-deny
 * timeline allowlist (`content/timeline.allowlist.ts`). This seed provides what
 * CANNOT be harvested from git:
 *
 *  1. The pre-repo "runway" era (three [ASSUMPTION]-flagged career ticks —
 *     these predate this repo and have no git committer date).
 *  2. The era-band structure: ids, labels, metaNotes for the "runway" and
 *     "agentic-turn" bands (the growth-arc narrative, Story 2.4 / Story 6.2).
 *  3. The loandemo flagship and its cluster (links to /work/loandemo/#… case-study
 *     fragments, not to `_bmad-output` artifacts — not harvestable from git).
 *  4. The "This portfolio" flagship stub (the harvester populates its cluster
 *     from TIMELINE_ALLOWLIST planning entries).
 *
 * The `harvestTimeline()` function in `scripts/harvest-timeline.ts` merges this
 * seed with the harvested Dots into the same `EraBand[]` shape and writes the
 * result to `web/src/generated/timeline.json`.
 *
 * CANONICAL BUILD WIRE-UP:
 *   content/timeline/dots.ts (this file — seed)  ┐
 *   content/timeline.allowlist.ts (harvest gate) ├→ scripts/harvest-timeline.ts
 *   _bmad-output/ artifacts (via allowlist)      ┘     → web/src/generated/timeline.json
 *                                                         → web/src/pages/timeline.astro
 *
 * CREDIBILITY FLOOR (Rule 9):
 *  - Runway ticks: approximate ~YYYY + [ASSUMPTION]. Never invent exact dates.
 *  - Loandemo cluster: /work/loandemo/#… forward-refs; [OPEN] where URL unconfirmed.
 *  - "This portfolio" flagship: no cluster here (harvested). date is the live-site date.
 *  - No invented facts — every field is traceable to the public bio or an artifact.
 */

/** Dot visual state — matches TimelineDot.astro's DotState union (extended in 2.4). */
export type DotState = 'faint' | 'resting' | 'filled' | 'live' | 'upcoming' | 'milestone';

/** A single timeline entry (Dot). */
export interface TimelineDotEntry {
  /** Dot label — the artifact name or milestone title. */
  label: string;
  /**
   * ISO-8601 date string, or a descriptive era string if the exact date is
   * unknown/undisclosed (e.g. "~1996", "~2010s"). Never invent exact dates.
   */
  date: string;
  /** Visual state for this dot. */
  state: DotState;
  /**
   * The artifact this dot drills into. Use:
   *  - "/glass-box/{slug}/" for portfolio Glass Box readers
   *  - "/glass-box/" for the Glass Box index
   *  - "/work/loandemo/#…" for loandemo fragments (forward-ref; 2.5 owns targets)
   *  - "[OPEN]" where the target URL is not yet confirmed
   */
  href: string;
  /** Optional: a short description shown as supplementary text. */
  description?: string;
}

/** A flagship node — a milestone dot with a static cluster of child dots. */
export interface FlagshipNode {
  kind: 'flagship';
  /** The milestone-state dot for the flagship itself. */
  label: string;
  date: string;
  description: string;
  /** Child dots in this flagship's cluster (ordered oldest → newest). */
  cluster: TimelineDotEntry[];
}

/** A faint decorative tick for the quiet runway era. */
export interface RunwayTick {
  kind: 'tick';
  /** Approximate era label (no specific date — credibility floor). */
  label: string;
  /** Approximate date string (use "~YYYY" or decade, never fabricated exact dates). */
  date: string;
  state: 'faint';
}

/** An era-band labeling a region of the timeline spine. */
export interface EraBand {
  id: 'runway' | 'agentic-turn';
  /** Kicker label shown in the timeline header for this era. */
  label: string;
  /**
   * Italic meta-note (optional) — e.g. "quiet years of craft" or "the dense proof".
   * Shown in ink-meta-min under the era kicker.
   */
  metaNote: string;
  /** The entries in this era, in oldest → newest order. */
  entries: (RunwayTick | FlagshipNode)[];
}

/**
 * The CURATED SEED — what the harvester merges with the auto-harvested Dots.
 *
 * Contains only un-harvestable content:
 *  - The runway era with [ASSUMPTION]-flagged ticks (pre-repo career)
 *  - The loandemo flagship (links to /work/loandemo/#…, not git artifacts)
 *  - The "This portfolio" flagship stub (harvester populates its cluster)
 *
 * The harvester reads this seed, adds all planning-workflow Dots into the
 * "This portfolio" cluster, and adds epic/retro/course-correction Dots into
 * the agentic-turn era — then sorts everything chronologically.
 */
export const TIMELINE_SEED: readonly EraBand[] = [
  {
    id: 'runway',
    label: 'The Runway',
    metaNote: 'thirty years of shipping software — before the agentic turn',
    entries: [
      // Faint decorative ticks for the quiet career runway.
      // These are era-band markers only — no specific employer/title invented.
      // [ASSUMPTION]: approximate decade-level era labels from the public bio.
      {
        kind: 'tick',
        label: 'Early shipping years [ASSUMPTION]',
        date: '~1996',
        state: 'faint',
      },
      {
        kind: 'tick',
        label: 'Mid-career engineering [ASSUMPTION]',
        date: '~2006',
        state: 'faint',
      },
      {
        kind: 'tick',
        label: 'Senior engineering — speaking begins [ASSUMPTION]',
        date: '~2016',
        state: 'faint',
      },
    ],
  },
  {
    id: 'agentic-turn',
    label: 'The Agentic Turn',
    metaNote: 'the dense proof — building at the frontier of agentic engineering',
    entries: [
      // loandemo flagship — the live-on-stage engineering proof.
      // Dots drill to /work/loandemo/#… (forward-ref; Story 2.5 owns targets).
      // Repo/artifact URLs flagged [OPEN].
      {
        kind: 'flagship',
        label: 'loandemo',
        date: '2026-06',
        description: 'A live agentic loan origination demo — real code, real build, real retro.',
        cluster: [
          {
            label: 'Code and repository',
            date: '2026-06',
            state: 'filled',
            href: '/work/loandemo/#code',
            description: '[OPEN: repo URL — supplied by Story 2.5]',
          },
          {
            label: 'Build story',
            date: '2026-06',
            state: 'filled',
            href: '/work/loandemo/#build',
            description: 'The agentic build process documented.',
          },
          {
            label: 'Retrospective',
            date: '2026-06',
            state: 'filled',
            href: '/work/loandemo/#retro',
            description: 'What was learned, what shipped, what would change.',
          },
        ],
      },
      // portfolio flagship stub — the cluster is populated by the harvester
      // from planning-workflow entries in TIMELINE_ALLOWLIST (Story 6.1).
      // The 'The Live Site' dot is kept here as it links to an external URL,
      // not a _bmad-output artifact.
      {
        kind: 'flagship',
        label: 'This portfolio',
        date: '2026-06-06',
        description:
          'Built in the open using the BMAD Method. The site you are reading is the artifact.',
        cluster: [
          // The Live Site dot stays seeded — it links to the deployed URL,
          // not to a _bmad-output artifact that can be harvested from git.
          {
            label: 'The Live Site',
            date: '2026-06-06',
            state: 'live',
            href: 'https://joshuabrandt.abacusai.cloud/',
            description: 'Shipping on day one. The site you are reading is the artifact.',
          },
        ],
      },
    ],
  },
];

/**
 * @deprecated Use TIMELINE_SEED instead. This alias is kept for a brief
 * transition period so render-timeline.ts can still import it; once
 * render-timeline.ts is removed (Story 6.1), remove this alias too.
 */
export const TIMELINE_ERAS = TIMELINE_SEED;
