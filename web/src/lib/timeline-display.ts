/**
 * timeline-display.ts — shared, browser-safe display helpers for the Master Timeline
 * (Story 6.2 code-review fix — the [OPEN] sentinel leak).
 *
 * WHY A SEPARATE MODULE (not timeline.ts): `timeline.ts` imports `node:fs` at the
 * top level (the build-time JSON loader), so it can NEVER be imported into the
 * browser island bundle. These helpers are PURE and browser-safe — they are
 * imported by BOTH surfaces that render a harvested Dot/flagship:
 *   • the static `FlagshipNode.astro` (Astro frontmatter / SSR), and
 *   • the `ZoomableTimeline.tsx` React island (browser),
 * so the two surfaces render the SAME "reader" decision and NEVER diverge.
 *
 * THE LEAK THIS FIXES: harvested epics/retros/course-corrections carry
 * `href: '[OPEN]'` and previously a `description` suffixed with the internal
 * sentinel `[OPEN: no Glass Box reader yet]`. That developer sentinel leaked into
 * user-visible prose (11 island flagship descriptions + 22× in the static
 * `dist/timeline/index.html`). The sentinel suffix is now removed from the data
 * (`content/timeline.allowlist.ts`); the `href: '[OPEN]'` already encodes the
 * "no reader yet" status. These helpers turn that status into a CLEAN,
 * visitor-facing affordance — never the raw sentinel.
 *
 * CREDIBILITY (Rule 9): no fabrication. The summaries are the real harvested text
 * minus the sentinel; the affordance names the real future surfaces (Stories
 * 6.3 guided tour / 6.4 explorable map). Deliberate placeholders that are a
 * DIFFERENT case — the loandemo `[OPEN: repo URL — supplied by Story 2.5]` and
 * the runway `[ASSUMPTION]` ticks — are NOT touched by these helpers.
 */

/** The visitor-facing "full reader coming" affordance copy (Stories 6.3/6.4). */
export const READER_COMING_AFFORDANCE =
  'Full reader coming in the guided tour and explorable map (Stories 6.3/6.4).';

/**
 * Is this href an `[OPEN]` / `[OPEN: …]` status marker (a Dot/flagship whose
 * Glass Box reader does not exist yet)? Matches the bare `[OPEN]` sentinel and
 * any `[OPEN: …]`-prefixed variant.
 */
export function isOpenStatusHref(href: string | undefined | null): boolean {
  if (!href) return false;
  return href === '[OPEN]' || href.startsWith('[OPEN');
}

/**
 * A real, resolvable reader link: a `/glass-box/…` Glass Box reader or a full
 * external `https://…` URL. NOT `[OPEN]`, NOT a `/work/loandemo/…` forward-ref
 * fragment (those are case-study anchors, not Glass Box readers).
 */
export function isRealReaderHref(href: string | undefined | null): boolean {
  if (!href) return false;
  return (
    (href.startsWith('/glass-box/') || href.startsWith('https://')) &&
    !isOpenStatusHref(href) &&
    !href.startsWith('/work/loandemo/')
  );
}

/**
 * Strip a leaked internal `[OPEN: …]` sentinel from a description before it is
 * shown to a visitor. Belt-and-suspenders: the sentinel suffix is already removed
 * from the source data, but if any description still carries an `[OPEN: …]`
 * fragment it is removed here so the raw sentinel can NEVER reach user-visible
 * prose. A description that is ONLY a sentinel collapses to an empty string
 * (the caller then shows the affordance instead).
 *
 * Note: a bare `[OPEN]` token (no colon) is the loandemo-style inline flag that
 * is intentionally visible elsewhere; this strip targets the `[OPEN: …]` colon
 * form (the "no Glass Box reader yet" developer sentinel class).
 */
export function cleanDescription(description: string | undefined | null): string {
  if (!description) return '';
  // Remove a trailing " [OPEN: …]" or standalone "[OPEN: …]" colon-form sentinel.
  return description
    .replace(/\s*\[OPEN:[^\]]*\]\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** What a timeline Dot/flagship's "reader" affordance should render. */
export interface ReaderAffordance {
  /** Render a real reader link to this href. */
  kind: 'link';
  href: string;
  /** Visitor-facing link text. */
  label: string;
}

export interface ReaderComingAffordance {
  /** Render the clean "full reader coming (6.3/6.4)" note — no raw sentinel. */
  kind: 'coming';
  text: string;
}

export interface NoReaderAffordance {
  /** No reader link and no "coming" note (e.g. a forward-ref fragment dot). */
  kind: 'none';
}

export type DotAffordance = ReaderAffordance | ReaderComingAffordance | NoReaderAffordance;

/**
 * Decide the reader affordance for a Dot/flagship given its href.
 *   • real reader (`/glass-box/…` or external `https://…`) → a working link
 *   • `[OPEN]` / `[OPEN: …]` status → the clean "reader coming (6.3/6.4)" note
 *     (NEVER the raw sentinel)
 *   • anything else (e.g. a `/work/loandemo/#…` forward-ref) → no affordance
 *
 * Used by BOTH FlagshipNode.astro and ZoomableTimeline.tsx so the surfaces agree.
 */
export function readerAffordance(href: string | undefined | null): DotAffordance {
  if (isRealReaderHref(href)) {
    const isExternal = href!.startsWith('https://');
    return {
      kind: 'link',
      href: href!,
      label: isExternal ? 'Visit live site →' : 'Open in Glass Box →',
    };
  }
  if (isOpenStatusHref(href)) {
    return { kind: 'coming', text: READER_COMING_AFFORDANCE };
  }
  return { kind: 'none' };
}
