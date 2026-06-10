/**
 * web/src/lib/demonstrator/bootstrap.ts — deferred bootstrap for DemonstratorReplay (Story 9.1).
 *
 * Pattern mirrors web/src/lib/glassbox-tour/bootstrap.ts (Story 6.3).
 * The replay is an INFORMATION feature, not decorative motion. It mounts for
 * ALL JS-on users — NOT gated behind onMotionAllowed. The page script calls
 * boot() from a requestIdleCallback (or setTimeout fallback) so the initial
 * page load is not blocked by the island import.
 *
 * Reads replay data from `<script type="application/json" id="demonstrator-replay-data">`.
 * Mounts DemonstratorReplay into a `<div id="dr-island-root">` inserted BEFORE
 * the static `<ol class="demonstrator__spine">`.
 *
 * Safe to call multiple times (booted guard).
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import type { ReplayStage } from '../../islands/DemonstratorReplay';

/** Payload embedded in the page as JSON. */
interface ReplayData {
  stages: ReplayStage[];
  framingLead: string;
}

let booted = false;

/**
 * Parse the replay data island — `<script type="application/json" id="demonstrator-replay-data">`.
 * Returns null on parse failure (graceful absent).
 */
function readReplayData(): ReplayData | null {
  const dataEl = document.getElementById('demonstrator-replay-data');
  if (!dataEl) return null;
  try {
    return JSON.parse(dataEl.textContent ?? '') as ReplayData;
  } catch {
    return null;
  }
}

/**
 * Mount the DemonstratorReplay island.
 * Safe to call multiple times — no-ops after the first call.
 */
export async function boot(): Promise<void> {
  if (booted) return;
  booted = true;

  const data = readReplayData();
  if (!data || data.stages.length === 0) {
    // No data — the static <ol> remains the sole experience (graceful degradation).
    return;
  }

  // Create or reuse the mount point (idempotent).
  let mountPoint = document.getElementById('dr-island-root');
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = 'dr-island-root';

    // Insert BEFORE the spine section so the replay affordance precedes the static list.
    const spineSection = document.querySelector('.demonstrator__spine-section');
    if (spineSection && spineSection.parentNode) {
      spineSection.parentNode.insertBefore(mountPoint, spineSection);
    } else {
      // Fallback: append to the main content area.
      const main = document.querySelector('main') ?? document.body;
      main.appendChild(mountPoint);
    }
  }

  const { DemonstratorReplay } = await import('../../islands/DemonstratorReplay');
  const root = createRoot(mountPoint);
  root.render(
    createElement(DemonstratorReplay, {
      stages: data.stages,
      framingLead: data.framingLead,
    }),
  );
}
