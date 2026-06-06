/**
 * routes.ts — the single registry of the static Mirror routes (one source of
 * truth). It feeds three surfaces that MUST stay in lockstep (Story 1.7):
 *
 *   • sitemap.xml (Story 1.6) — every route as an absolute <loc> + lastmod.
 *   • the global static-fallback footer (Footer.astro) — a real <a> to every
 *     route on every page (FR-8; UX-DR5).
 *   • /browse (browse.astro) — the crawlable index linking every route with a
 *     one-line description (FR-8; UX-DR13).
 *
 * Keeping the list here means adding a route once (path + label + description +
 * source file) wires it into the sitemap, the footer, and /browse together —
 * never hardcoded in three places (Story 1.7 Task 1). Kept in the locked order
 * the routes appear across the site.
 *
 * Each entry maps a public route path to its Astro source file (relative to the
 * repo root) — the source file is what the sitemap's deterministic `lastmod`
 * reads via `git log -1 --format=%cI` (see sitemap.xml.ts).
 */

export interface RouteEntry {
  /** Public route path (leading slash; site-root is "/"). */
  path: string;
  /**
   * Human label — the link text in the footer + /browse. Meaningful on its own
   * (a screen-reader-navigable name, never "here"/"click here"; UX-DR5,
   * Accessibility Floor).
   */
  label: string;
  /**
   * One-line description for the /browse index entry (calm, no hype, no
   * exclamation; epics refine as route content lands). UX-DR13.
   */
  description: string;
  /** Source file relative to the REPO ROOT (for git lastmod). */
  sourceFile: string;
}

/**
 * The current Stage-1 Mirror routes — the canonical 10 (Story 1.7 adds `/browse`
 * to the nine Story 1.6 enumerated). Order matches the site's route list. This
 * single array is the source for the footer, /browse, AND the sitemap.
 */
export const NAV_ROUTES: RouteEntry[] = [
  {
    path: '/',
    label: 'Home',
    description: 'The home Scene Arc: the calm hero, the thesis, and the path through the work.',
    sourceFile: 'web/src/pages/index.astro',
  },
  {
    path: '/about',
    label: 'About',
    description:
      'Who Joshua R. Brandt, MSE is, in his own words, with the channels where he works.',
    sourceFile: 'web/src/pages/about.astro',
  },
  {
    path: '/timeline',
    label: 'Master Timeline',
    description:
      'The Master Timeline: thirty years of shipping, from the runway to the agentic turn.',
    sourceFile: 'web/src/pages/timeline.astro',
  },
  {
    path: '/speaking',
    label: 'Speaking',
    description: 'Signature talks, formats, and how to book Josh to speak.',
    sourceFile: 'web/src/pages/speaking.astro',
  },
  {
    path: '/speaking/reel',
    label: 'Speaker reel',
    description: 'The speaker reel and its details.',
    sourceFile: 'web/src/pages/speaking/reel.astro',
  },
  {
    path: '/work/loandemo',
    label: 'loandemo case study',
    description: 'The loandemo flagship, built end to end as an agentic-engineering case study.',
    sourceFile: 'web/src/pages/work/loandemo.astro',
  },
  {
    path: '/glass-box',
    label: 'Glass Box',
    description:
      'The curated, read-only record of the real BMAD Method artifacts behind this site.',
    sourceFile: 'web/src/pages/glass-box/index.astro',
  },
  {
    path: '/faq',
    label: 'FAQ',
    description: 'The questions organizers and peers ask most, answered plainly.',
    sourceFile: 'web/src/pages/faq.astro',
  },
  {
    path: '/invite',
    label: 'Invite Josh',
    description: 'Send a short note to invite Josh to speak or collaborate.',
    sourceFile: 'web/src/pages/invite.astro',
  },
  {
    path: '/browse',
    label: 'Browse',
    description: 'This index: every page on the site, reachable without JavaScript.',
    sourceFile: 'web/src/pages/browse.astro',
  },
];

/**
 * Sitemap view of the registry (Story 1.6 consumer). Identical set/order to
 * NAV_ROUTES — kept as a named export so sitemap.xml.ts and its tests read an
 * explicit "these are the sitemap routes" list. Adding a route to NAV_ROUTES
 * above automatically extends the sitemap (now 10 routes with /browse).
 */
export const SITEMAP_ROUTES: RouteEntry[] = NAV_ROUTES;

/**
 * Derive the trailing-slash href for a route path (project-rules.md Rule 2).
 *
 * The `path` values in the registry are stored slashless so existing string
 * comparisons (e.g. aria-current logic) don't churn. This helper is the SINGLE
 * place the trailing-slash form is produced for all consumers (Footer, /browse,
 * sitemap). Rules:
 *   - Site root "/" → "/" (already the canonical form; no double-slash)
 *   - Any other path → append "/" if not already present
 */
export function routeHref(path: string): string {
  if (path === '/') return '/';
  return path.endsWith('/') ? path : `${path}/`;
}
