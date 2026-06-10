/**
 * content/featured-work.ts — the curated home "featured work" set (Story 7.2, FR-25).
 *
 * A cross-Wing greatest-hits selection drawn ONLY from the real items already
 * grounded in `content/wings.ts`. These are the items the Guide re-orders on the
 * home page when a visitor states an interest.
 *
 * CREDIBILITY FLOOR (Rule 9):
 *  - Every item traces to a real `content/wings.ts` entry — no fabrication.
 *  - The unbuilt Story 7.3 playables are NOT here; they stay "more coming" on the Wings.
 *  - The Suno item uses `[OPEN: Suno profile URL]` verbatim (no invented URL).
 *  - `status: 'open'` items are rendered as text + honest flag, NOT as broken `<a>`.
 *
 * CURATED DEFAULT ORDER (FR-8 / FR-25):
 *  The default order below is the curated default for the home section.
 *  The Guide's re-curation engine maps intent → a permutation of this same set
 *  (server-owned `INTENT_FEATURED_ORDER_TABLE` in `api/src/lib/recuration.ts`);
 *  the DOM order is ALWAYS this curated default; only CSS `order` changes on intent.
 *
 *  7-item default (post-Epic-7 polish):
 *    loandemo       — flagship case study (anchors the set)
 *    vector-wars    — most immediately impressive playable (3D rail shooter)
 *    voyager        — stunning technical showpiece (NASA trajectory sim)
 *    christmas-elves — creative playable (Phaser puzzle game)
 *    portfolio      — agentic Wing (the BMAD proof)
 *    guide          — agentic Wing (the live grounded agent)
 *    music          — open item (honest flag, always last)
 */

import type { WingItem } from './wings.js';

/** Stable slug — must match `INTENT_FEATURED_ORDER_TABLE` keys in the api. */
export type FeaturedSlug =
  | 'loandemo'
  | 'vector-wars'
  | 'voyager'
  | 'christmas-elves'
  | 'portfolio'
  | 'guide'
  | 'music';

/** A featured-work entry with its stable slug. */
export interface FeaturedItem extends WingItem {
  slug: FeaturedSlug;
  /** Wing the item lives in — for cross-Wing clarity. */
  wing: 'technical' | 'agentic' | 'creative';
}

/**
 * The curated featured-work set, in default order.
 *
 * ITEMS (all traced to real `content/wings.ts` entries):
 *   loandemo        — technical Wing, loandemo case study — live
 *   vector-wars     — technical Wing, Three.js 3D rail shooter — live
 *   voyager         — technical Wing, Voyager 1/2 cinematic mission replay — live
 *   christmas-elves — creative Wing, Phaser puzzle game — live
 *   portfolio       — agentic Wing, this portfolio / BMAD proof — live
 *   guide           — agentic Wing, the Guide agent — live
 *   music           — creative Wing, Music on Suno — open (honest flag)
 *
 * This is the CURATED DEFAULT order (FR-8 crawlable order = this DOM order).
 * The api INTENT_FEATURED_ORDER_TABLE permutes these slug names; it never
 * adds or drops items.
 */
export const FEATURED_WORK: FeaturedItem[] = [
  {
    slug: 'loandemo',
    title: 'loandemo — the flagship case study',
    blurb:
      'A real loan origination system built end to end using the BMAD Method — auditable agentic workflows, a real test suite, and a real retrospective.',
    href: '/work/loandemo/',
    status: 'live',
    wing: 'technical',
    sourceNote: 'content/wings.ts — technical Wing, item 0.',
  },
  {
    slug: 'vector-wars',
    title: 'Vector Wars — retro 3D rail shooter',
    blurb:
      'A retro-styled 3D rail shooter in the vein of the 1983 Star Wars arcade game, built with Three.js and Vite and playable live in the browser.',
    href: '/work/vector-wars/',
    status: 'live',
    wing: 'technical',
    sourceNote: 'content/wings.ts — technical Wing, item 1.',
  },
  {
    slug: 'voyager',
    title: 'Voyager — cinematic mission replay',
    blurb:
      'A high-fidelity, browser-based cinematic replay of the Voyager 1 and Voyager 2 missions. Real NASA/NAIF SPICE-kernel trajectories drive Three.js 3D rendering through the planetary encounters.',
    href: '/work/voyager/',
    status: 'live',
    wing: 'technical',
    sourceNote: 'content/wings.ts — technical Wing, item 2.',
  },
  {
    slug: 'christmas-elves',
    title: 'Christmas Elves — puzzle game',
    blurb:
      "A Lemmings-inspired Christmas puzzle game built with Phaser 3 and TypeScript. Guide elves from the sleigh to the tree by assigning abilities to overcome each level's obstacles.",
    href: '/work/christmas-elves/',
    status: 'live',
    wing: 'creative',
    sourceNote: 'content/wings.ts — creative Wing, item 1.',
  },
  {
    slug: 'portfolio',
    title: 'This portfolio — the BMAD Method proof',
    blurb:
      'The site you are reading, built entirely in the open using the BMAD Method. The Glass Box holds the curated planning artifacts; the Master Timeline shows the process across thirty years.',
    href: '/glass-box/',
    status: 'live',
    wing: 'agentic',
    sourceNote: 'content/wings.ts — agentic Wing, item 0.',
  },
  {
    slug: 'guide',
    title: 'The Guide — a live grounded agent',
    blurb:
      'The grounded agent on this site: ask it about the work, the method, or the timeline. It cites sources and never invents facts.',
    href: '/faq/',
    status: 'live',
    wing: 'agentic',
    sourceNote: 'content/wings.ts — agentic Wing, item 1.',
  },
  {
    slug: 'music',
    title: 'Music on Suno',
    blurb:
      'Original music composed and produced on Suno. [OPEN: Suno profile URL] — the profile link will be added when confirmed.',
    href: '[OPEN: Suno profile URL]',
    status: 'open',
    wing: 'creative',
    sourceNote: 'content/wings.ts — creative Wing, item 0.',
  },
];

/** The canonical ordered slug list for the featured-work set. */
export const FEATURED_SLUGS: FeaturedSlug[] = FEATURED_WORK.map((item) => item.slug);

/** Look up a featured item by slug. Returns undefined if not found. */
export function findFeaturedItem(slug: string): FeaturedItem | undefined {
  return FEATURED_WORK.find((item) => item.slug === slug);
}
