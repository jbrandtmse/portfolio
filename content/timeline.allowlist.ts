/**
 * timeline.allowlist.ts — the DEFAULT-DENY harvest gate for BMAD-process Dots.
 *
 * DEFAULT-DENY: only artifacts explicitly listed here ever become Dot entries in
 * the harvested portion of the Master Timeline. The harvest pipeline iterates
 * THIS allowlist; it NEVER walks `_bmad-output/` blindly. There is no second
 * gate and no exclusion list to maintain — unlisted artifacts are invisible
 * to the harvest by construction.
 *
 * NEVER-HARVEST SET (excluded by construction — not listed here):
 *  - *.decision-log.md (private decision trails)
 *  - review-*.md (review-adversarial, -downstream, -rubric, etc.)
 *  - reconcile-*.md (process syncs: reconcile-brief, -brainstorm, -research)
 *  - addendum.md files (internal addenda)
 *  - validation-report.md (internal validation gate docs)
 *  - .working/ directory contents (agent scratch space)
 *  - ANYTHING not explicitly listed in TIMELINE_ALLOWLIST below
 *
 * ADDING ARTIFACTS: append an entry here. That is the only change needed for a
 * new artifact to generate Dot(s) in the timeline (AC2 — one edit, auto-harvest).
 *
 * HREF POLICY (credibility floor, AC5):
 *  - Link to `/glass-box/{slug}/` ONLY where that slug is actually in
 *    `content/glassbox.allowlist.ts` today.
 *  - For artifacts not yet exposed in the Glass Box (cycle logs, retros, etc.),
 *    use `href: '[OPEN]'` with a `description` that explains the status.
 *    [OPEN] hrefs are rendered as non-links — never a broken URL to a
 *    fabricated target. Guided-tour and map readers are Story 6.3/6.4.
 *  - Never fabricate a URL, slug, or description not traceable to the real artifact.
 *
 * USED BY:
 *  - scripts/harvest-timeline.ts — Timeline harvest pipeline (Story 6.1)
 */

/** The kind of BMAD-process artifact, used for grouping + labeling harvested Dots. */
export type TimelineHarvestKind =
  | 'planning' // Pre-epic planning artifact (brief, prd, ux-design, brainstorm, research)
  | 'epic' // Completed-epic cycle log (documents the epic's delivery)
  | 'course-correction' // Sprint change proposal / course-correction event
  | 'retrospective'; // Post-epic retrospective artifact

/** A single curated timeline harvest entry (controls one Dot in the harvest output). */
export interface TimelineHarvestEntry {
  /**
   * Repo-root-relative path to the source artifact.
   * Throw-on-missing: the harvest pipeline treats a missing file as a build error
   * (mirroring render-glassbox — fail loud, never silently skip).
   */
  readonly sourceFile: string;
  /** The kind of BMAD-process artifact. */
  readonly kind: TimelineHarvestKind;
  /**
   * Dot display label. Must trace to the real artifact — no invented titles.
   * Example: "Epic 1 — Build Foundation" not "Epic 1 did stuff".
   */
  readonly label: string;
  /**
   * Dot href. Per the credibility floor (AC5):
   *  - Use `/glass-box/{slug}/` ONLY where that slug exists in GLASSBOX_ALLOWLIST.
   *  - Use `[OPEN]` where no Glass Box reader exists yet (Story 6.3/6.4 may add one).
   *  - NEVER fabricate a Glass Box URL for a slug not yet in the allowlist.
   */
  readonly href: string;
  /**
   * Dot visual state. Planning artifacts → 'filled'; epics/retros → 'filled';
   * course-corrections → 'resting'; upcoming → 'upcoming'.
   */
  readonly state: 'faint' | 'resting' | 'filled' | 'live' | 'upcoming' | 'milestone';
  /**
   * Optional short description (one sentence). Trace to the real artifact.
   * Include `[OPEN]` note when href is not yet a live reader URL.
   */
  readonly description?: string;
}

/**
 * The TIMELINE ALLOWLIST — the single, default-deny source of truth for harvested Dots.
 *
 * Ordered oldest-first by artifact creation / completion date (the harvest sorts
 * by git committer date anyway, but keeping this file in chronological order makes
 * it easy to audit and append new entries).
 *
 * PLANNING WORKFLOW artifacts (brief, research, prd, ux-design, ux-experience,
 * brainstorm) → cluster under the "This portfolio" flagship in the agentic-turn era.
 * These are exactly the Dots the Stage-1 hand-curated portfolio cluster listed,
 * now auto-harvested with real git committer dates.
 *
 * EPIC artifacts (cycle logs) → individual Dots in the agentic-turn era.
 * COURSE-CORRECTIONS → individual Dots in the agentic-turn era.
 * RETROSPECTIVES → individual Dots in the agentic-turn era.
 *
 * HREF STATUS:
 *  - Planning artifacts (brainstorm, pre-brief-research, product-brief, prd,
 *    ux-design, ux-experience) are in GLASSBOX_ALLOWLIST → real /glass-box/{slug}/ hrefs.
 *  - Cycle logs and retrospectives are NOT in GLASSBOX_ALLOWLIST → href: '[OPEN]'
 *    with a description note. Story 6.3/6.4 may add readers.
 *  - Sprint change proposal is NOT in GLASSBOX_ALLOWLIST → href: '[OPEN]'.
 */
export const TIMELINE_ALLOWLIST: readonly TimelineHarvestEntry[] = [
  // ── PLANNING WORKFLOW ARTIFACTS ──────────────────────────────────────────────
  // These map to real Glass Box slugs already in GLASSBOX_ALLOWLIST.
  {
    sourceFile: '_bmad-output/brainstorming/brainstorming-session-2026-06-02-1723.md',
    kind: 'planning',
    label: 'Brainstorm Session',
    href: '/glass-box/brainstorm/',
    state: 'filled',
    description: '47 ideas in 90 minutes — the raw thinking that seeded every decision.',
  },
  {
    sourceFile: '_bmad-output/research/portfolio-pre-brief-research-2026-06-02.md',
    kind: 'planning',
    label: 'Pre-Brief Research',
    href: '/glass-box/pre-brief-research/',
    state: 'filled',
    description: 'The grounding pass before strategy.',
  },
  {
    sourceFile: '_bmad-output/planning-artifacts/briefs/brief-portfolio-2026-06-02/brief.md',
    kind: 'planning',
    label: 'Product Brief',
    href: '/glass-box/product-brief/',
    state: 'filled',
    description: 'The one-page argument that set the direction.',
  },
  {
    sourceFile: '_bmad-output/planning-artifacts/prds/prd-portfolio-2026-06-02/prd.md',
    kind: 'planning',
    label: 'Product Requirements Document',
    href: '/glass-box/prd/',
    state: 'filled',
    description: 'Every feature, every constraint, every never.',
  },
  {
    sourceFile: '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/DESIGN.md',
    kind: 'planning',
    label: 'UX Design',
    href: '/glass-box/ux-design/',
    state: 'filled',
    description: 'Ink-on-cream, editorial — the visual identity.',
  },
  {
    sourceFile: '_bmad-output/planning-artifacts/ux-designs/ux-portfolio-2026-06-03/EXPERIENCE.md',
    kind: 'planning',
    label: 'UX Experience',
    href: '/glass-box/ux-experience/',
    state: 'filled',
    description: 'The visitor journey, choreographed.',
  },

  // ── COURSE-CORRECTION ────────────────────────────────────────────────────────
  // Not in GLASSBOX_ALLOWLIST → [OPEN] href.
  {
    sourceFile: '_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-05.md',
    kind: 'course-correction',
    label: 'Sprint Course-Correction',
    href: '[OPEN]',
    state: 'resting',
    description: 'Mid-sprint scope adjustment — documented course-correction for the build.',
  },

  // ── COMPLETED EPIC CYCLE LOGS ─────────────────────────────────────────────
  // Not in GLASSBOX_ALLOWLIST → [OPEN] hrefs. Cycle logs document epic delivery.
  {
    sourceFile: '_bmad-output/implementation-artifacts/cycle-log-epic-1.md',
    kind: 'epic',
    label: 'Epic 1 — Build Foundation',
    href: '[OPEN]',
    state: 'filled',
    description: 'Scaffold, design system, hero, static mirror, pipeline.',
  },
  {
    sourceFile: '_bmad-output/implementation-artifacts/cycle-log-epic-2.md',
    kind: 'epic',
    label: 'Epic 2 — Glass Box & Timeline',
    href: '[OPEN]',
    state: 'filled',
    description: 'Glass Box publish pipeline, artifact reader, Master Timeline seeded.',
  },
  {
    sourceFile: '_bmad-output/implementation-artifacts/cycle-log-epic-3.md',
    kind: 'epic',
    label: 'Epic 3 — Speaker Surface & Invite',
    href: '[OPEN]',
    state: 'filled',
    description: 'Speaker reel, bios, Invite Me form with resilience.',
  },
  {
    sourceFile: '_bmad-output/implementation-artifacts/cycle-log-epic-4.md',
    kind: 'epic',
    label: 'Epic 4 — Knowledge Base & Guide',
    href: '[OPEN]',
    state: 'filled',
    description: 'KB index, FAQ Mirror, Guide endpoint, Guide island.',
  },
  {
    sourceFile: '_bmad-output/implementation-artifacts/cycle-log-epic-5.md',
    kind: 'epic',
    label: 'Epic 5 — Cinematic Canvas & Depth Dial',
    href: '[OPEN]',
    state: 'filled',
    description: "Continuous canvas, depth dial, director's mode.",
  },

  // ── RETROSPECTIVES ────────────────────────────────────────────────────────
  // Not in GLASSBOX_ALLOWLIST → [OPEN] hrefs.
  {
    sourceFile: '_bmad-output/implementation-artifacts/epic-1-retro-2026-06-06.md',
    kind: 'retrospective',
    label: 'Epic 1 Retrospective',
    href: '[OPEN]',
    state: 'filled',
    description: 'Post-Epic 1 retrospective — lessons from the foundation sprint.',
  },
  {
    sourceFile: '_bmad-output/implementation-artifacts/epic-2-retro-2026-06-06.md',
    kind: 'retrospective',
    label: 'Epic 2 Retrospective',
    href: '[OPEN]',
    state: 'filled',
    description: 'Post-Epic 2 retrospective — lessons from Glass Box and Timeline.',
  },
  {
    sourceFile: '_bmad-output/implementation-artifacts/epic-3-retro-2026-06-07.md',
    kind: 'retrospective',
    label: 'Epic 3 Retrospective',
    href: '[OPEN]',
    state: 'filled',
    description: 'Post-Epic 3 retrospective — lessons from speaker surface and invite.',
  },
  {
    sourceFile: '_bmad-output/implementation-artifacts/epic-4-retro-2026-06-07.md',
    kind: 'retrospective',
    label: 'Epic 4 Retrospective',
    href: '[OPEN]',
    state: 'filled',
    description: 'Post-Epic 4 retrospective — lessons from KB index and Guide.',
  },
  {
    sourceFile: '_bmad-output/implementation-artifacts/epic-5-retro-2026-06-08.md',
    kind: 'retrospective',
    label: 'Epic 5 Retrospective',
    href: '[OPEN]',
    state: 'filled',
    description: 'Post-Epic 5 retrospective — lessons from cinematic canvas and depth dial.',
  },
];
