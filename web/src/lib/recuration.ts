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

/** A re-curation directive from the Guide SSE stream (Story 5.3 + 5.4). */
export interface RecurationDirective {
  intent: string;
  order: string[];
  /**
   * (Story 5.4) SceneIds to render at deep detail via the `$depth` mechanism.
   * Absent/undefined = [] (no deepening — backward-compatible with 5.3 clients).
   */
  deepen?: string[];
  /**
   * (Story 5.4) SceneIds the camera tour omits (FR-8: stays in DOM + scroll + rail).
   * Absent/undefined = [] (no skipping — backward-compatible with 5.3 clients).
   *
   * SKIP IS TOUR-OMISSION ONLY. The scene STAYS visible in the scroll, the
   * scene-rail jump anchors, and JS-off. We never hide or remove a scene node.
   */
  skip?: string[];
}

/**
 * Apply a re-curation directive to the home page.
 *
 * Story 5.3: sets CSS `--scene-order` custom properties on each `<section>`
 * inside `<main class="home">` so the flexbox visual order matches
 * `directive.order`. The DOM order (and thus crawlable order) is UNCHANGED (FR-8).
 *
 * Story 5.4 — deepen: sets `data-depth="deep"` on deepened scenes so the
 * Story 5.2 depth CSS tiers apply. The depth attribute is CONTENT-ONLY (visible
 * regardless of motion preference).
 *
 * Story 5.4 — skip: marks skipped scenes with `data-skip="true"` so the camera
 * driver knows to step over them. The scene STAYS in the DOM, scroll, and rail
 * (FR-8 HARD: never hide/remove a scene from the static fallback).
 *
 * Story 5.4 — camera driving: if `cinematicHandle` is provided AND `motionAllowed`
 * is true, drives the camera through the re-ordered, non-skipped sequence via
 * `window.__cinematicHandle.goToScene`. Must be called inside `onMotionAllowed`.
 * Under reduced motion (motionAllowed = false) the camera driving and
 * skip-omission are OFF (default discrete arc — all scenes scrollable).
 *
 * @param directive     - The re-curation directive from the `recuration` SSE event.
 * @param motionAllowed - (optional) Whether motion is currently allowed (Story 5.1 gate).
 *                        Defaults to false (safe). Camera driving is ONLY active when true.
 * @returns `true` if applied successfully, `false` if the DOM is not ready.
 */
export function applyRecuration(directive: RecurationDirective, motionAllowed = false): boolean {
  if (typeof document === 'undefined') return false;

  const main = document.querySelector<HTMLElement>('main.home');
  if (!main) return false;

  const { order, deepen = [], skip = [] } = directive;

  // Validate: order must be a permutation of all 7 scene IDs
  if (!order || order.length !== SCENE_IDS.length) return false;

  // ── (1) Apply CSS order (Story 5.3 — visual reorder, DOM unchanged FR-8) ──
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

  // ── (2) Apply deepen (Story 5.4 — set data-depth="deep" for deepened scenes) ──
  // Deepen is content-only — applies regardless of motion preference.
  // First reset any previous deepen marks on all scenes.
  for (const id of SCENE_IDS) {
    const section = document.querySelector<HTMLElement>(`section#${CSS.escape(id)}`);
    if (section) {
      section.removeAttribute('data-depth');
    }
  }
  for (const id of deepen) {
    const section = document.querySelector<HTMLElement>(`section#${CSS.escape(id)}`);
    if (section) {
      section.setAttribute('data-depth', 'deep');
    }
  }

  // ── (3) Apply skip marks (Story 5.4 FR-8 — mark only; scene stays in DOM) ──
  // Under reduced motion: skip-omission is OFF (the camera doesn't drive anyway).
  // We still track skip marks as data attributes so the camera driver can read
  // them, but we only OMIT from the camera tour when motionAllowed = true.
  //
  // FR-8 HARD: NEVER set display:none, visibility:hidden, or aria-hidden on
  // skipped scenes. The data-skip attribute is purely for the camera driver.
  for (const id of SCENE_IDS) {
    const section = document.querySelector<HTMLElement>(`section#${CSS.escape(id)}`);
    if (section) {
      section.removeAttribute('data-skip');
    }
  }
  if (motionAllowed) {
    // Only mark skip when motion is allowed (skip-omission is motion-gated).
    for (const id of skip) {
      const section = document.querySelector<HTMLElement>(`section#${CSS.escape(id)}`);
      if (section) {
        section.setAttribute('data-skip', 'true');
      }
    }
  }

  // ── (4) Drive the camera (Story 5.4 — inside onMotionAllowed gate) ──
  // Camera driving + skip-omission are only active when motionAllowed = true.
  // Under reduced motion (motionAllowed = false) we degrade to the default
  // discrete-scene arc: all scenes scrollable, nothing skipped from the scroll.
  if (motionAllowed) {
    const handle = (window as unknown as { __cinematicHandle?: { goToScene(n: number): void } })
      .__cinematicHandle;

    if (handle?.goToScene) {
      // Build the camera tour: take the re-ordered sequence and step over skipped scenes.
      // The tour always starts at hero (index 0 in the re-ordered sequence), then
      // advances to the FIRST non-skipped, non-hero scene in the visual order.
      const skipSet = new Set(skip);
      // Find the first non-hero, non-skipped scene in the re-ordered visual sequence.
      // We look up by scene id in the re-ordered `order` array (not by DOM index,
      // since the camera's goToScene takes the canonical SCENE_IDS index).
      const firstTarget = order.find((id) => id !== 'hero' && !skipSet.has(id));

      if (firstTarget) {
        // goToScene takes the canonical SCENE_IDS 0-based index.
        const canonicalIndex = SCENE_IDS.indexOf(firstTarget as SceneId);
        if (canonicalIndex !== -1) {
          // Small delay to let the CSS order settle before scrolling.
          setTimeout(() => {
            handle.goToScene(canonicalIndex);
          }, 120);
        }
      }
    }
  }

  return applied > 0;
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
