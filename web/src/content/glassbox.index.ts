/**
 * glassbox.index.ts — the curated node manifest for the Glass Box index (Story 2.3, Task 3).
 *
 * This file defines the DISPLAY ORDER and CURATION STATE of each node in the
 * Glass Box build-story spine. It is SEPARATE from the Story 2.1 allowlist
 * (glassbox.json), which is the publish gate. Here we declare:
 *   • Which artifact slugs appear as real "featured" cards (chronological by date).
 *   • The non-ghosted shipping node (the live site + public repo).
 *   • Ghosted "As it accrues" nodes for still-to-come material.
 *
 * RULE: featured nodes MUST reference real slugs from glassbox.json. Titles and
 * dates are READ from the loaded GlassboxArtifact[] — never hardcoded here — so
 * this file and glassbox.json are the single sources of truth for their domains.
 *
 * CHRONOLOGICAL ORDER: the index page sorts featured nodes by their artifact date.
 * The shipping node is pinned at a specific position (see index.astro).
 * Ghosted nodes appear after the real set (they have no real date yet).
 *
 * Story 6.4 (Explorable Map): this file also exports PHASE_MAP and PHASE_ORDER,
 * which group featured artifacts + the shipping node into build phases for the
 * static clustered phase-map section on /glass-box/. The mapping is an explicit
 * curated const — deterministic, pure, and testable. Ghost nodes are a separate
 * phase entry with no reader links.
 */

/** A featured artifact node — maps to a real glassbox.json entry. */
export interface FeaturedNode {
  kind: 'featured';
  /** Must match a slug in glassbox.json. */
  slug: string;
  /** Dot state for this node (filled = shipped and curated). */
  dotState: 'filled' | 'resting';
}

/** The shipping node — the live site and/or public repo (the recursion proof). */
export interface ShippingNode {
  kind: 'shipping';
  /** Human-readable label for the card type chip. */
  type: string;
  /** Card heading. */
  title: string;
  /** The date the site shipped (ISO-8601). */
  date: string;
  /** Curator note for the shipping node. */
  curatorNote: string;
  /** Primary link (the live site URL). */
  href: string;
  /** Secondary link (public repo — flagged [OPEN] in text if not yet confirmed public). */
  repoHref?: string;
  /** Whether the repo URL is confirmed public. */
  repoPublic: boolean;
}

/** A ghosted "As it accrues" node — no real data yet. */
export interface GhostNode {
  kind: 'ghost';
  /** Artifact type label (small-caps chip). */
  type: string;
  /** Title shown in ghosted state. */
  title: string;
  /** Description of what will appear here. */
  description: string;
}

export type IndexNode = FeaturedNode | ShippingNode | GhostNode;

/**
 * The curated featured slugs, in their expected chronological order
 * (the index page re-sorts by real date from glassbox.json to be safe).
 *
 * UX NOTE: The UX design consists of two allowlisted files (ux-design = DESIGN.md,
 * ux-experience = EXPERIENCE.md). Both are shown as sibling nodes, both real.
 */
export const FEATURED_SLUGS: ReadonlyArray<FeaturedNode> = [
  { kind: 'featured', slug: 'brainstorm', dotState: 'filled' },
  { kind: 'featured', slug: 'pre-brief-research', dotState: 'filled' },
  { kind: 'featured', slug: 'product-brief', dotState: 'filled' },
  { kind: 'featured', slug: 'prd', dotState: 'filled' },
  { kind: 'featured', slug: 'ux-design', dotState: 'filled' },
  { kind: 'featured', slug: 'ux-experience', dotState: 'filled' },
];

/**
 * The shipping node — the site is live and open (the recursion proof: this
 * build story describes the site you are currently reading).
 *
 * Repo URL: the known remote https://github.com/jbrandtmse/portfolio.
 * `repoPublic` MUST be true ONLY when the repo is verifiably reachable
 * anonymously; otherwise the index renders the visible "[OPEN: …]" text flag
 * (never a dead link, never color alone) per AC2 + Dev Notes ("if confirmed
 * public, else flag [OPEN: public repo/commits URL]").
 *
 * Code review (Story 2.3): the repo is currently PRIVATE — an anonymous GET of
 * https://github.com/jbrandtmse/portfolio returns HTTP 404 (web + API). Shipping
 * repoPublic:true would emit a 404 link to every public visitor (a dead external
 * link in production, contradicting the "shipping, not an IOU" recursion proof).
 * Held at `false` until the repo is made public; flip to `true` in the same
 * change that publishes the repo (the [OPEN] flag de-ghosts to a live link).
 */
export const SHIPPING_NODE: ShippingNode = {
  kind: 'shipping',
  type: 'site',
  title: 'The Live Site',
  date: '2026-06-06T00:00:00Z',
  curatorNote:
    'Shipping on day one of Epic 1, not an IOU. The site you are reading is the artifact.',
  href: 'https://joshuabrandt.abacusai.cloud/',
  repoHref: 'https://github.com/jbrandtmse/portfolio',
  repoPublic: false,
};

/**
 * Ghosted nodes — still-to-come material that will de-ghost as it ships.
 * Shown in dashed "As it accrues" cards at the end of the spine.
 */
export const GHOST_NODES: ReadonlyArray<GhostNode> = [
  {
    kind: 'ghost',
    type: 'architecture',
    title: 'Architecture',
    description: 'The technical architecture decisions and design.',
  },
  {
    kind: 'ghost',
    type: 'epics',
    title: 'Epics and Stories',
    description: 'The epic and story breakdowns that drove the build.',
  },
  {
    kind: 'ghost',
    type: 'retrospective',
    title: 'Retrospectives',
    description: 'Post-epic lessons and what would have been done differently.',
  },
];

// ─── Phase Map (Story 6.4 — Explorable Map) ──────────────────────────────────

/**
 * The four build phases, in display order.
 *
 * Each entry names a phase and assigns the artifact slugs (or the special
 * 'shipping' key) that belong to it. Ghost slugs are kept in the separate
 * AS_IT_ACCRUES entry below (they have no readers — Rule 9).
 *
 * This const is PURE and TESTABLE: it contains no runtime logic, no imports.
 * The explorable-map section in index.astro joins this against the live
 * GlassboxArtifact[] at build time. Adding a future artifact means adding it
 * to glassbox.json + FEATURED_SLUGS + the appropriate phase entry here.
 */
export type PhaseName = 'Discovery' | 'Definition' | 'Design' | 'Launch' | 'As it accrues';

export interface PhaseEntry {
  /** Human-readable phase label (h3 in the map). */
  name: PhaseName;
  /**
   * Artifact slugs belonging to this phase.
   * The special value 'shipping' refers to SHIPPING_NODE.
   * Ghost slugs ('architecture', 'epics', 'retrospective') go only in the
   * 'As it accrues' entry below (they have no readers — Rule 9).
   */
  slugs: ReadonlyArray<string>;
  /** Short description of what this phase covers — shown beneath the heading. */
  description: string;
}

/**
 * PHASE_MAP — the curated phase → artifact assignment.
 *
 * Phase order: Discovery → Definition → Design → Launch → As it accrues.
 * Phase membership comes from artifact `type` (brainstorm, research, brief,
 * prd, ux ×2) and the shipping node; ghost nodes occupy the last phase.
 *
 * This is the single source of truth for the phase grouping. index.astro
 * reads this at build time and assembles the static phase-map HTML.
 */
export const PHASE_MAP: ReadonlyArray<PhaseEntry> = [
  {
    name: 'Discovery',
    slugs: ['brainstorm', 'pre-brief-research'],
    description: 'Understanding the problem space before any brief was written.',
  },
  {
    name: 'Definition',
    slugs: ['product-brief', 'prd'],
    description: 'Turning discovery insights into a scoped product definition.',
  },
  {
    name: 'Design',
    slugs: ['ux-design', 'ux-experience'],
    description: 'Translating the product definition into a designed experience.',
  },
  {
    name: 'Launch',
    slugs: ['shipping'],
    description: 'Shipping the work — the live site that is the recursive proof.',
  },
  {
    name: 'As it accrues',
    slugs: ['architecture', 'epics', 'retrospective'],
    description: 'Planning artifacts that will be published as they are completed and reviewed.',
  },
] as const;

/**
 * PHASE_ORDER — the display order of phase names for the map section.
 * Derived from PHASE_MAP to stay in sync automatically.
 */
export const PHASE_ORDER: ReadonlyArray<PhaseName> = PHASE_MAP.map((p) => p.name);
