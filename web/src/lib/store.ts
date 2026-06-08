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
