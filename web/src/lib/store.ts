/**
 * store.ts — the single global nanostore for the Guide island (Story 4.4, Decision 1).
 *
 * Architecture §Communication Patterns: "one atom `$guideOpen`; hero/footer set it,
 * the Guide island subscribes; no other global state."
 *
 * The pill, the hero's quiet inline entry, and the GuidePanel coordinate through
 * `$guideOpen`. No other global store.
 *
 * SSR-safe: nanostores atoms work in both Node (Astro SSR build) and the browser.
 */
import { atom } from 'nanostores';

/**
 * Whether the Guide panel is open. The pill toggles it; the hero entry sets it
 * true on click (JS-on path); the GuidePanel subscribes and renders accordingly.
 */
export const $guideOpen = atom(false);
