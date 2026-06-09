/**
 * web/src/lib/glassbox-tour/bootstrap.ts — deferred bootstrap for GlassBoxTour (Story 6.3).
 *
 * Pattern mirrors web/src/lib/timeline-zoom/bootstrap.ts (Story 6.2) but with a
 * key DIVERGENCE: the tour is an INFORMATION feature, not decorative motion. It
 * mounts for ALL JS-on users — it is NOT gated behind onMotionAllowed. The page
 * script calls boot() from a requestIdleCallback (or setTimeout fallback) so the
 * initial page load is not blocked by the island import.
 *
 * Reads tour data from `<script type="application/json" id="glassbox-tour-data">`.
 * Mounts GlassBoxTour into a `<div id="gbt-island-root">` inserted BEFORE the
 * static `<ol class="glass-box__spine">`.
 *
 * Safe to call multiple times (booted guard).
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import type { TourArtifact } from '../../islands/GlassBoxTour';

/** Payload embedded in the page as JSON. */
interface TourData {
  artifacts: TourArtifact[];
  framingLead: string;
  recursionBeat: string;
}

let booted = false;

/**
 * Parse the tour data island — the `<script type="application/json" id="glassbox-tour-data">`.
 * Returns null on parse failure (graceful absent).
 */
function readTourData(): TourData | null {
  const dataEl = document.getElementById('glassbox-tour-data');
  if (!dataEl) return null;
  try {
    return JSON.parse(dataEl.textContent ?? '') as TourData;
  } catch {
    return null;
  }
}

/**
 * Mount the GlassBoxTour island.
 * Safe to call multiple times — no-ops after the first call.
 */
export async function boot(): Promise<void> {
  if (booted) return;
  booted = true;

  const data = readTourData();
  if (!data || data.artifacts.length === 0) {
    // No data — the static <ol> remains the sole experience (graceful degradation).
    return;
  }

  // Create or reuse the mount point (idempotent).
  let mountPoint = document.getElementById('gbt-island-root');
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = 'gbt-island-root';

    // Insert BEFORE the spine section so the tour affordance precedes the static list.
    const spineSection = document.querySelector('.glass-box__spine-section');
    if (spineSection && spineSection.parentNode) {
      spineSection.parentNode.insertBefore(mountPoint, spineSection);
    } else {
      // Fallback: append to the main content area.
      const main = document.querySelector('main') ?? document.body;
      main.appendChild(mountPoint);
    }
  }

  const { GlassBoxTour } = await import('../../islands/GlassBoxTour');
  const root = createRoot(mountPoint);
  root.render(
    createElement(GlassBoxTour, {
      artifacts: data.artifacts,
      framingLead: data.framingLead,
      recursionBeat: data.recursionBeat,
    }),
  );
}
