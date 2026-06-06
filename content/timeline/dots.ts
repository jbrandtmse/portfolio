/**
 * content/timeline/dots.ts — the hand-curated Master Timeline manifest (Story 2.4).
 *
 * CANONICAL LOCATION (architecture.md §Structure line 568 + §Requirements-to-
 * Structure line 618; epics.md Story 2.4 + Story 2.6): this manifest lives at
 * the REPO-ROOT `content/` — the single source of truth (FR-33/FR-34, code-as-
 * CMS) — exactly like `content/glassbox.allowlist.ts`. Story 2.6 (Project Import)
 * grows the site by EDITING this file.
 *
 * BUILD WIRE-UP (parallels render-glassbox, AR-9 / Story 1.8 pipeline):
 *   content/timeline/dots.ts  (this file, the source of truth)
 *     → scripts/render-timeline.ts        (generator; registered in CONTENT_GENERATORS)
 *     → web/src/generated/timeline.json    (deterministic, gitignored build output)
 *     → web/src/lib/timeline.ts            (loader; graceful-absent)
 *     → web/src/pages/timeline.astro       (imports the loader; respects the Vite boundary)
 * Vite/Astro cannot import from outside the `web/` package, so the page never
 * imports this file directly — it reads the generated JSON, just as the Glass
 * Box page reads `glassbox.json` rather than importing `glassbox.allowlist.ts`.
 *
 * Stage 1: HAND-CURATED ONLY. NO automated git/filesystem harvest.
 * The deterministic git→Dot auto-harvest is Stage 2 (Epic 6 / Story 6.1–6.2).
 *
 * DATA MODEL: the shape is intentionally clean so Epic 6's auto-harvest can
 * populate the same model (Era + TimelineDotEntry, including cluster nesting).
 *
 * TWO ERA-BANDS:
 *  • "runway"      — the quiet ~30-year career before the agentic turn.
 *                    Rendered as a labeled era-band with faint ticks (decorative).
 *                    NO invented dates/employers/titles. AC4 — credibility floor.
 *  • "agentic-turn" — the dense proof: the two Stage-1 flagships.
 *
 * TWO FLAGSHIPS (each with a static Dot cluster):
 *  • portfolio — this site (the recursion). Dots → /glass-box/{slug}/ readers.
 *  • loandemo  — the live-on-stage engineering proof. Dots → /work/loandemo/#…
 *                forward-reference (Story 2.5 owns the real fragment targets + URLs).
 *                Repo/artifact URLs flagged [OPEN].
 *
 * ORDERING: chronological, oldest → newest (matches the DOM reading order; the
 * horizontal desktop layout reflects this left → right without DOM reordering).
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
 * The Master Timeline: two era-bands in reading order (oldest → newest).
 *
 * The runway band renders the labeled era + faint decorative ticks only.
 * No invented career facts. Any real career milestone that is not confirmed
 * from the bio/brief is omitted. AC4 — credibility > density.
 *
 * The agentic-turn band holds the two Stage-1 flagships with their real Dot
 * clusters. These are the dense proof.
 */
export const TIMELINE_ERAS: readonly EraBand[] = [
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
      // portfolio flagship — this site (the recursion proof).
      // Dots → real /glass-box/{slug}/ readers (Story 2.2/2.3).
      {
        kind: 'flagship',
        label: 'This portfolio',
        date: '2026-06-06',
        description:
          'Built in the open using the BMAD Method. The site you are reading is the artifact.',
        cluster: [
          {
            label: 'Brainstorm Session',
            date: '2026-06-02',
            state: 'filled',
            href: '/glass-box/brainstorm/',
            description: '47 ideas in 90 minutes — the raw thinking that seeded every decision.',
          },
          {
            label: 'Pre-Brief Research',
            date: '2026-06-02',
            state: 'filled',
            href: '/glass-box/pre-brief-research/',
            description: 'The grounding pass before strategy.',
          },
          {
            label: 'Product Brief',
            date: '2026-06-02',
            state: 'filled',
            href: '/glass-box/product-brief/',
            description: 'The one-page argument that set the direction.',
          },
          {
            label: 'Product Requirements Document',
            date: '2026-06-02',
            state: 'filled',
            href: '/glass-box/prd/',
            description: 'Every feature, every constraint, every never.',
          },
          {
            label: 'UX Design',
            date: '2026-06-03',
            state: 'filled',
            href: '/glass-box/ux-design/',
            description: 'Ink-on-cream, editorial — the visual identity.',
          },
          {
            label: 'UX Experience',
            date: '2026-06-03',
            state: 'filled',
            href: '/glass-box/ux-experience/',
            description: 'The visitor journey, choreographed.',
          },
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
