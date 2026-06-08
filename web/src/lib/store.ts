/**
 * store.ts — the single global nanostore for the Guide island (Story 4.4, Decision 1).
 *
 * Architecture §Communication Patterns: "one atom `$guideOpen`; hero/footer set it,
 * the Guide island subscribes; no other global state."
 *
 * The pill, the hero's quiet inline entry, and the GuidePanel coordinate through
 * `$guideOpen`. No other global store.
 *
 * Story 5.2 adds `$depth` (the Depth Dial state) — the same SSR-safe atom pattern.
 *
 * SSR-safe: nanostores atoms work in both Node (Astro SSR build) and the browser.
 */
import { atom } from 'nanostores';

/**
 * Whether the Guide panel is open. The pill toggles it; the hero entry sets it
 * true on click (JS-on path); the GuidePanel subscribes and renders accordingly.
 */
export const $guideOpen = atom(false);

/**
 * The visitor-selected content depth for the home page scenes and the Guide.
 *   'skim'     — trimmed essence (one-line per scene; ≤2 sentences in the Guide)
 *   'overview' — the current teaser content (DEFAULT; short paragraph in the Guide)
 *   'deep'     — expanded grounded detail block (fuller in the Guide)
 *
 * The default 'overview' preserves the current site behaviour for all consumers.
 * The Depth Dial control (SceneRail.astro) writes to this atom; the GuidePanel
 * island reads it and includes it in every /api/guide request.
 */
export type Depth = 'skim' | 'overview' | 'deep';
export const $depth = atom<Depth>('overview');

/**
 * The currently focused flagship on the /timeline/ page — drives the ZoomableTimeline
 * island's overview ↔ detail semantic zoom (Story 6.2).
 *
 *   null         — overview: all eras visible, clusters collapsed
 *   <string>     — a flagship `data-flagship-id` value → that flagship's cluster expanded
 *
 * The ZoomableTimeline island subscribes via useStore($timelineFocus); other surfaces
 * (e.g. a guided tour) can drive the zoom by writing $timelineFocus.set(id).
 */
export const $timelineFocus = atom<string | null>(null);

/**
 * The active step index for the Glass Box guided tour (Story 6.3).
 *
 *   null    — tour is closed (default); the static <ol> is the sole experience
 *   number  — 0-based index into the date-sorted featured artifacts; the tour
 *             is open and showing that step
 *
 * The GlassBoxTour island writes/reads this atom. The tour is an INFORMATION
 * feature (not decorative motion), so it mounts for all JS-on users under both
 * no-preference and reduced-motion. Animated transitions (scroll-into-view, fades)
 * are gated behind CSS `@media (prefers-reduced-motion: no-preference)`.
 */
export const $tourStep = atom<number | null>(null);
