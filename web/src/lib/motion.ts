/**
 * motion.ts — the ONE shared reduced-motion gate + the documented accessibility
 * conventions every animated/interactive surface follows (Story 1.9, AC1; UX-DR21).
 *
 * UX-DR21 / EXPERIENCE §Accessibility-Floor mandate ONE reduced-motion gate
 * "implemented via a shared reduced-motion gate utility (web/src/lib/motion.ts),
 * not re-implemented per component." This file IS that utility. Story 1.4's
 * scene-rail originally inlined the gate with a `TODO(Story 1.9): consolidate
 * into motion.ts` — this file is that consolidation; the rail now imports from
 * here and no surface re-implements the gate.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE TWO-LAYER GATE (BOTH layers are REQUIRED — NFR-2 / EXPERIENCE §State-Patterns
 * → Reduced-motion). Animation must degrade for `prefers-reduced-motion: reduce`
 * at BOTH the CSS layer and the JS layer, because each covers what the other cannot:
 *
 *   ┌─ LAYER 1 — CSS (the documented convention; see CSS_REDUCED_MOTION_CONVENTION).
 *   │   Visual motion (transitions, keyframes, scroll-driven animation-timeline)
 *   │   is authored ONLY inside `@media (prefers-reduced-motion: no-preference)`,
 *   │   so the static baseline stands under `reduce` with zero JS and in engines
 *   │   without scroll-driven-animation support. global.css also ships a blanket
 *   │   reduce reset as a backstop.
 *   │
 *   └─ LAYER 2 — JS (this module's init-guard). Behavior CSS cannot express
 *       (e.g. moving a semantic `aria-current`, running an IntersectionObserver)
 *       must NOT initialize under `reduce`. Wrap that init in `onMotionAllowed`.
 *
 * SSR-SAFE: this module references `window` ONLY inside function bodies (never at
 * top level), so importing it during Astro's server build / SSR does not touch a
 * non-existent `window`. Both functions treat "no `window` / no `matchMedia`"
 * (the server, and very old engines) as "motion allowed is unknowable" and fall
 * back to the static, motion-free baseline (the safe default).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** The single media-query string for the reduced-motion preference. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * JS LAYER, part 1 — does the user (or their OS/browser) ask for reduced motion?
 *
 * Returns `true` when `prefers-reduced-motion: reduce` matches. SSR-safe: with no
 * `window`/`matchMedia` (server build, ancient engine) it returns `false` so the
 * caller does not assume motion is wanted — pair it with `onMotionAllowed`, which
 * additionally requires `matchMedia` to be present before running motion code.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * JS LAYER, part 2 — the init-guard every motion/observer enhancement runs through.
 *
 * Calls `init` exactly once IF AND ONLY IF motion is allowed: there is a real
 * `matchMedia` AND the user has NOT requested reduced motion. Under reduced motion
 * (or with no `matchMedia` — the server, JS-off has already skipped this) it
 * NO-OPS, leaving the CSS-layer static baseline (e.g. the scene-rail's static
 * filled meter + the `aria-current` authored on `#hero`) exactly as rendered.
 *
 * This is the ONE place component JS asks "may I animate / observe?" — never an
 * ad-hoc `matchMedia` per component (UX-DR21).
 *
 * @example
 *   onMotionAllowed(() => {
 *     const observer = new IntersectionObserver(...);
 *     // ...wire up motion / scroll-spy / aria-current tracking here.
 *   });
 */
export function onMotionAllowed(init: () => void): void {
  // No matchMedia ⇒ cannot prove motion is safe ⇒ keep the static baseline.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return;
  }
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
    return;
  }
  init();
}

/* ─────────────────────────────────────────────────────────────────────────────
 * DOCUMENTED CONVENTIONS — ONE source every component reads from, so the floor is
 * applied uniformly rather than re-derived per surface (EXPERIENCE §Accessibility-
 * Floor). These are documentation strings (and the prose above); the CSS itself
 * lives in each component's scoped <style> / global.css, authored to match.
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * CSS LAYER convention (Layer 1). Author ALL motion inside a no-preference query
 * so the static baseline is what ships under `reduce`:
 *
 *   @media (prefers-reduced-motion: no-preference) {
 *     .thing { animation: reveal 300ms ease both; }
 *   }
 *
 * NEVER author motion unconditionally and then try to undo it; start from the
 * static baseline and ADD motion only when allowed. (global.css also ships a
 * blanket `@media (prefers-reduced-motion: reduce)` reset as defense-in-depth.)
 */
export const CSS_REDUCED_MOTION_CONVENTION = REDUCED_MOTION_QUERY;

/**
 * Color-is-never-the-sole-signal convention (EXPERIENCE §Accessibility-Floor;
 * DESIGN §Colors USAGE RULE). State/meaning is ALWAYS carried by text + weight +
 * shape (or an ARIA attribute) IN ADDITION to color — never by color alone.
 * Example: the scene-rail's current scene rides `aria-current="true"` + bold
 * weight + the "Scene N of 7" text; the navy tint is redundant reinforcement,
 * and meaningful muted text uses the AA-safe inks (≥4.5:1), never a sub-AA hue.
 */
export const COLOR_NEVER_SOLE_SIGNAL =
  'State is carried by text + weight + shape (or ARIA), never by color alone.';

/**
 * Visible focus convention. The global `:focus-visible` ring (a 2px navy
 * `--color-accent` outline + 2px offset) is defined ONCE in global.css (Story
 * 1.2) and inherited everywhere. Components MUST NOT remove it (`outline: none`)
 * without an equally-visible replacement. Keyboard focus order follows DOM order.
 */
export const FOCUS_VISIBLE_CONVENTION =
  ':focus-visible shows the global 2px navy outline (offset 2px); never suppress it.';
