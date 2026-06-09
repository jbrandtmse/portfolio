/**
 * content/wings.ts — the curated Wings manifest (Story 7.1; FR-24).
 *
 * Three Wings — Technical, Creative, Agentic — each a greatest-hits index of
 * grounded, already-shipped work. This is the SINGLE source the three Wing routes
 * read (web/src/pages/{technical,creative,agentic}.astro). No per-route hardcoding.
 *
 * CREDIBILITY FLOOR (Rule 9):
 *  - Every item traces to a real, live surface confirmed in the story allocation table.
 *  - The Stage-2 playables (vector-wars, voyager, christmas-elves) are Story 7.3 work
 *    → NOT listed here. A thin Wing uses moreComing honestly.
 *  - Creative music → [OPEN: Suno profile URL] verbatim; no invented URL or track title.
 *  - No invented project titles, descriptions, or claims.
 *
 * PLACEMENT: repo-root content/ (mirrors content/timeline/dots.ts pattern).
 * NOT under web/src/content/ (the Astro content-collections footgun, deferred-work [2.3]).
 */

/** A single work item in a Wing's greatest-hits list. */
export interface WingItem {
  /** Short, accurate title — traces to a real shipped surface. */
  title: string;
  /** One-line blurb — calm, positive-assertion, no hype, no exclamation. */
  blurb: string;
  /**
   * The canonical href for this item.
   * Use routeHref() on a registry path, or a real absolute URL where appropriate.
   * Use '[OPEN: <reason>]' as the deliberate honest flag (Rule-15-exempt) where
   * the URL is not yet confirmed.
   */
  href: string;
  /**
   * 'live'    — the item is a real, reachable, built surface.
   * 'open'    — the item is real work but the link is an honest [OPEN] flag.
   */
  status: 'live' | 'open';
  /** Trace note for credibility audits — records the real source (Rule 9). */
  sourceNote: string;
}

/** A Wing definition. */
export interface Wing {
  /** Stable identifier — used as the route segment. */
  id: 'technical' | 'creative' | 'agentic';
  /** Display label. */
  label: string;
  /** One-sentence domain descriptor shown as the sub-heading on the Wing page. */
  domain: string;
  /**
   * Answer-first lede for the Wing page. FIRST SENTENCE must name
   * "Joshua R. Brandt, MSE" (GEO floor). Calm, no exclamation marks.
   */
  lede: string;
  /** Document <title> for the Wing page. */
  pageTitle: string;
  /** Meta description for the Wing page. */
  metaDescription: string;
  /** Curated greatest-hits items for this Wing. */
  items: WingItem[];
  /**
   * Honest "more coming" affordance text.
   * false  — Wing is complete as-is (no coming note).
   * string — Visitor-facing calm copy: what is coming and when (Story 7.3, no hype).
   */
  moreComing: false | string;
}

/**
 * The three Wings — the curated manifest read by the Wing index routes.
 * Order: Technical, Creative, Agentic (matches the browsable structure).
 */
export const WINGS: Wing[] = [
  {
    id: 'technical',
    label: 'Technical',
    domain: 'Agentic engineering producing production software, systems, and infrastructure.',
    lede: 'Joshua R. Brandt, MSE has spent thirty years shipping production software — and now applies disciplined, auditable agentic workflows to hard engineering problems. This Wing collects the technical work: production systems built through real engineering practice, not prototypes.',
    pageTitle: 'Technical work — Joshua R. Brandt, MSE',
    metaDescription:
      'The technical work of Joshua R. Brandt, MSE: production software and systems built through disciplined agentic engineering, with the loandemo flagship case study.',
    items: [
      {
        title: 'loandemo — the flagship case study',
        blurb:
          'A real loan origination system built end to end using the BMAD Method — auditable agentic workflows, a real test suite, and a real retrospective.',
        href: '/work/loandemo/',
        status: 'live',
        sourceNote: 'web/src/pages/work/loandemo.astro — live route, confirmed shipped surface.',
      },
    ],
    moreComing:
      'More technical work is coming. The interactive vector-wars and voyager demonstrations land in the next stage.',
  },
  {
    id: 'creative',
    label: 'Creative',
    domain: 'Music, generative art, and design.',
    lede: 'Joshua R. Brandt, MSE makes music as well as software. This Wing collects the creative work — compositions, generative experiments, and design work.',
    pageTitle: 'Creative work — Joshua R. Brandt, MSE',
    metaDescription:
      'The creative work of Joshua R. Brandt, MSE: music on Suno and generative creative projects.',
    items: [
      {
        title: 'Music on Suno',
        blurb:
          'Original music composed and produced on Suno. [OPEN: Suno profile URL] — the profile link will be added when confirmed.',
        href: '[OPEN: Suno profile URL]',
        status: 'open',
        sourceNote:
          'content/kb/about.md / web/src/lib/person.ts CHANNEL_SAMEAS — Suno is a real channel; profile URL is [OPEN].',
      },
    ],
    moreComing:
      'More creative work is coming. An interactive christmas-elves piece lands in the next stage.',
  },
  {
    id: 'agentic',
    label: 'Agentic',
    domain: 'Agent demonstrations, BMAD Method applications, and the live agent.',
    lede: 'Joshua R. Brandt, MSE builds with AI agents in the open — publishing the real, disciplined process so the method is auditable, not asserted. This Wing collects the agentic work: demonstrations, BMAD Method applications, and the live grounded agent on this site.',
    pageTitle: 'Agentic work — Joshua R. Brandt, MSE',
    metaDescription:
      'The agentic work of Joshua R. Brandt, MSE: the auditable portfolio and BMAD Method proof in the Glass Box, the Master Timeline, and the live Guide agent.',
    items: [
      {
        title: 'This portfolio — the BMAD Method proof',
        blurb:
          'The site you are reading, built entirely in the open using the BMAD Method. The Glass Box holds the curated planning artifacts; the Master Timeline shows the process across thirty years.',
        href: '/glass-box/',
        status: 'live',
        sourceNote:
          'web/src/pages/glass-box/index.astro + web/src/pages/timeline.astro — both live routes, confirmed shipped surfaces.',
      },
      {
        title: 'The Guide — a live grounded agent',
        blurb:
          'The grounded agent on this site: ask it about the work, the method, or the timeline. It cites sources and never invents facts.',
        href: '/faq/',
        status: 'live',
        sourceNote:
          'api/src/routes/guide.ts + web/src/islands/GuidePill.tsx — the live Guide, confirmed shipped surface. Entry via /faq/ (the Guide opener).',
      },
    ],
    moreComing: 'More agentic work is coming.',
  },
];

/** Look up a Wing by its id. Returns undefined if not found. */
export function findWing(id: string): Wing | undefined {
  return WINGS.find((w) => w.id === id);
}
