/**
 * web/src/lib/timeline-zoom/bootstrap.ts — deferred bootstrap for ZoomableTimeline (Story 6.2).
 *
 * Mirrors the pattern of web/src/lib/cinematic/bootstrap.ts:
 *   - Called ONLY from a `void import(...).then(m => m.boot())` inside `onMotionAllowed`.
 *   - Reads the timeline data from the `<script type="application/json" id="timeline-data">`
 *     that timeline.astro emits alongside the static <ol>.
 *   - Mounts the ZoomableTimeline React island into a sibling mount node.
 *   - Safe to call multiple times (booted guard).
 *
 * NEVER loaded under prefers-reduced-motion (the onMotionAllowed gate no-ops).
 * NEVER fetched by Lighthouse (which does not interact after page load).
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import type { EraData } from '../../islands/ZoomableTimeline';

let booted = false;

/**
 * Parse the timeline data island — the `<script type="application/json" id="timeline-data">`
 * that timeline.astro emits. Returns [] on parse failure (graceful absent).
 */
function readTimelineData(): EraData[] {
  const dataEl = document.getElementById('timeline-data');
  if (!dataEl) return [];
  try {
    return JSON.parse(dataEl.textContent ?? '[]') as EraData[];
  } catch {
    return [];
  }
}

/**
 * Mount the ZoomableTimeline island.
 * Safe to call multiple times — no-ops after the first call.
 */
export async function boot(): Promise<void> {
  if (booted) return;
  booted = true;

  const eras = readTimelineData();
  if (eras.length === 0) {
    // No data — the static <ol> remains the sole experience (graceful degradation).
    return;
  }

  // Create or reuse the mount point (idempotent).
  let mountPoint = document.getElementById('zt-island-root');
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = 'zt-island-root';
    mountPoint.setAttribute('aria-hidden', 'false');
    // Insert BEFORE the static <ol> so the island overlays/enhances it.
    const spine = document.getElementById('timeline-spine');
    if (spine && spine.parentNode) {
      spine.parentNode.insertBefore(mountPoint, spine);
      // Hide the static spine now that the island mount point is in place.
      // boot() is only called on first user interaction (never on Lighthouse's
      // no-interaction trace), so this never causes a CLS in the LH budget.
      spine.classList.add('timeline-spine--js-enhanced');
    } else {
      document.body.appendChild(mountPoint);
    }
  }

  const { ZoomableTimeline } = await import('../../islands/ZoomableTimeline');
  const root = createRoot(mountPoint);
  root.render(createElement(ZoomableTimeline, { eras }));
}
