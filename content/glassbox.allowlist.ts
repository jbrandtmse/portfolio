/**
 * glassbox.allowlist.ts — the DEFAULT-DENY publish gate for the Glass Box.
 *
 * DEFAULT-DENY: only files explicitly listed here ever render in the Glass Box
 * or (later) surface in the KB index (Epic 4 / Story 4.1). Nothing unlisted
 * can appear — NOT because of an exclusion list, but because the render
 * pipeline iterates THIS allowlist, never the filesystem. There is no second
 * gate and no exclusion list to maintain.
 *
 * NEVER-RENDER SET (excluded by construction — not listed here):
 *  - *.decision-log.md in briefs/, prds/, ux-designs/ (private decision trails)
 *  - review-*.md (review-adversarial, -downstream, -rubric, -accessibility,
 *    -peer-credibility, -seo-geo, -voice — internal quality-gate docs)
 *  - reconcile-*.md (reconcile-brief, -brainstorm, -research — process syncs)
 *  - addendum.md files (internal addenda)
 *  - ANYTHING not explicitly listed in GLASSBOX_ALLOWLIST below
 *
 * ADDING ARTIFACTS: append an entry here. That is the only change needed for a
 * new artifact to be eligible to render. Whether it is featured or ghosted on
 * the index is a Story 2.3 display decision.
 *
 * USED BY:
 *  - scripts/render-glassbox.ts   — Glass Box render pipeline (Story 2.1)
 *  - (future) KB indexer          — Epic 4 / Story 4.1 (one gate, two consumers)
 */

/**
 * The type of a Glass Box artifact. Determines how it is rendered and labeled.
 * Extend this union as curation grows (e.g. 'epics' | 'retrospective' | 'shipping').
 */
export type GlassboxType =
  | 'brief'
  | 'brainstorm'
  | 'research'
  | 'prd'
  | 'ux'
  | 'architecture'
  | 'epics'
  | 'retrospective'
  | 'shipping';

/** A single curated Glass Box artifact entry. */
export interface GlassboxEntry {
  /**
   * Repo-root-relative path to the source artifact.
   * Throw-on-missing: the render pipeline treats a missing file as a build error.
   */
  readonly sourceFile: string;
  /** Artifact type — used for rendering, labeling, and the KB index. */
  readonly type: GlassboxType;
  /**
   * URL slug — forms the `/glass-box/{slug}` reader route (Story 2.2).
   * Must be unique across the allowlist. Use kebab-case.
   */
  readonly slug: string;
  /** Display title shown in the reader and on the index. */
  readonly title: string;
  /**
   * One-line curator note — the human editorial voice that frames the artifact
   * for readers. This is "an act of taste", not a file path.
   */
  readonly curatorNote: string;
}

/**
 * The GLASS BOX ALLOWLIST — the single, default-deny source of truth.
 *
 * Launch set: the six planning artifacts that tell the story of how this site
 * was conceived and built. The order here is NOT the display order on the index
 * (that is a Story 2.3 decision); the render pipeline sorts by date then slug.
 */
export const GLASSBOX_ALLOWLIST: readonly GlassboxEntry[] = [
  {
    sourceFile: '_bmad-output/planning-artifacts/briefs/brief-portfolio-2026-06-02/brief.md',
    type: 'brief',
    slug: 'product-brief',
    title: 'Product Brief',
    curatorNote:
      'The one-page argument that set the direction: craft artifact first, conversion funnel never.',
  },
  {
    sourceFile: '_bmad-output/brainstorming/brainstorming-session-2026-06-02-1723.md',
    type: 'brainstorm',
    slug: 'brainstorm',
    title: 'Brainstorm Session',
    curatorNote:
      '47 ideas in 90 minutes — the raw, unedited thinking that seeded every strategic decision.',
  },
  {
    sourceFile: '_bmad-output/research/portfolio-pre-brief-research-2026-06-02.md',
    type: 'research',
    slug: 'pre-brief-research',
    title: 'Pre-Brief Research',
    curatorNote:
      'The grounding pass: what practitioners actually share, what 30-year engineers overlook, what this site had to avoid.',
  },
  {
    sourceFile: '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/prd.md',
    type: 'prd',
    slug: 'prd',
    title: 'Product Requirements Document',
    curatorNote:
      'Every feature, every constraint, every "never" — the full PRD the agent pipeline builds from.',
  },
  {
    sourceFile: '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/DESIGN.md',
    type: 'ux',
    slug: 'ux-design',
    title: 'UX Design',
    curatorNote:
      'Ink-on-cream, editorial, Source Serif 4 — how the visual identity was decided in one session.',
  },
  {
    sourceFile: '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/EXPERIENCE.md',
    type: 'ux',
    slug: 'ux-experience',
    title: 'UX Experience',
    curatorNote:
      'The visitor journey — how every interaction, from hero to Glass Box, was choreographed.',
  },
];
