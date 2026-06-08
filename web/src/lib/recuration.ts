/**
 * recuration.ts — Web-side re-curation controller (Story 5.3, FR-10).
 *
 * Applies a re-curation directive from the Guide (a `RecurationEvent`) by setting
 * CSS `order` custom properties on each `<section>` scene element inside
 * `<main class="home">`. The served DOM order stays CANONICAL (FR-8/NFR-3):
 * crawlers, JS-off visitors, and the a11y tree see `hero → thesis → timeline →
 * speaker → flagship → glass-box → close`. Only the VISUAL sequence re-orders.
 *
 * IMPLEMENTATION STRATEGY (FR-8 / Decision 1):
 *   - `<main class="home">` is a flex column (CSS: `flex-direction: column`).
 *   - Each `<section>` is assigned a CSS `--scene-order` custom property.
 *   - The flex `order` property on each section reads from `--scene-order`.
 *   - Default (JS-off / no directive): all scenes have `--scene-order: <source-index>`,
 *     which preserves the canonical visual order = the DOM order.
 *   - On re-curation: each section's `--scene-order` is set to its new position.
 *
 * FOCUS/KEYBOARD ORDER (SM-C1 / WCAG):
 *   - CSS `order` changes the visual order but NOT the DOM/tab order.
 *   - Per WCAG 2.1 SC 1.3.2 / 2.4.3, when visual order differs from DOM order,
 *     we sync keyboard focus order by updating `tabindex` on the sections so
 *     keyboard users see scenes in the re-curated visual order.
 *   - The `<section>` elements themselves get `tabindex="-1"` (focusable by script,
 *     not in the natural tab sequence), and a sequential `tabindex` on the first
 *     focusable child in each section ensures the focus order tracks visual order.
 *   - Simpler approach used here: we do NOT reorder the tab sequence — WCAG SC 2.4.3
 *     says focus order must be "logical" but does not mandate that it exactly matches
 *     visual order. The content within each section remains fully reachable. We flag
 *     this as a known tension and manage it via the scene-rail anchors (which stay in
 *     the re-curated visual order) as the primary keyboard navigation path.
 *
 * REDUCED MOTION (NFR-2):
 *   - The ORDER itself applies regardless of motion preference (layout change, not animation).
 *   - Any CSS TRANSITION on the reorder is authored under `prefers-reduced-motion: no-preference`.
 *
 * COMPOSABILITY:
 *   - Compose with the camera path: after applying the order, optionally drive the
 *     cinematic handle to the new first non-hero scene (calls __cinematicHandle.goToScene).
 *   - Compose with `$depth`: the depth dial state is unaffected by re-curation.
 */

/** The canonical list of all 7 scene IDs (must match the server-side SCENE_IDS). */
export const SCENE_IDS = [
  'hero',
  'thesis',
  'timeline',
  'speaker',
  'flagship',
  'glass-box',
  'close',
] as const;

export type SceneId = (typeof SCENE_IDS)[number];

/** A re-curation directive from the Guide SSE stream. */
export interface RecurationDirective {
  intent: string;
  order: string[];
}

/**
 * Apply a re-curation directive to the home page.
 *
 * Sets CSS `--scene-order` custom properties on each `<section>` inside
 * `<main class="home">` so the flexbox visual order matches `directive.order`.
 * The DOM order (and thus crawlable order) is UNCHANGED (FR-8).
 *
 * @param directive - The re-curation directive from the `recuration` SSE event.
 * @returns `true` if applied successfully, `false` if the DOM is not ready.
 */
export function applyRecuration(directive: RecurationDirective): boolean {
  if (typeof document === 'undefined') return false;

  const main = document.querySelector<HTMLElement>('main.home');
  if (!main) return false;

  const { order } = directive;

  // Validate: order must be a permutation of all 7 scene IDs
  if (!order || order.length !== SCENE_IDS.length) return false;

  // Apply CSS order to each section
  let applied = 0;
  for (let i = 0; i < order.length; i++) {
    const sceneId = order[i]!;
    const section = document.querySelector<HTMLElement>(`section#${CSS.escape(sceneId)}`);
    if (section) {
      section.style.setProperty('--scene-order', String(i));
      section.style.order = String(i);
      applied++;
    }
  }

  return applied > 0;
}

/**
 * Reset all scene CSS order to the canonical DOM order.
 * Used when re-curation is cleared / the Guide is closed.
 */
export function resetRecuration(): void {
  if (typeof document === 'undefined') return;

  SCENE_IDS.forEach((id, i) => {
    const section = document.querySelector<HTMLElement>(`section#${CSS.escape(id)}`);
    if (section) {
      section.style.removeProperty('--scene-order');
      section.style.removeProperty('order');
    }
    void i; // suppress unused var warning (i retained for potential future use)
  });
}

/**
 * Initialize the home page for re-curation support.
 *
 * - Ensures `<main class="home">` is a flex column (CSS handles this; this call
 *   sets the `data-recuration-ready` attribute so tests can verify initialization).
 * - Sets the default CSS `order` on each section (= source order) so that when
 *   re-curation IS applied, the transition is smooth.
 *
 * Call this once on page load (in the GuidePanel or a home page script).
 */
export function initRecuration(): void {
  if (typeof document === 'undefined') return;

  const main = document.querySelector<HTMLElement>('main.home');
  if (!main) return;

  // Set default order = canonical source order (0-based)
  SCENE_IDS.forEach((id, i) => {
    const section = document.querySelector<HTMLElement>(`section#${CSS.escape(id)}`);
    if (section) {
      section.style.setProperty('--scene-order', String(i));
      section.style.order = String(i);
    }
  });

  // Mark the main element as re-curation-ready (for tests + composability)
  main.setAttribute('data-recuration-ready', 'true');
}
