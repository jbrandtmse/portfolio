/**
 * web/src/lib/cinematic/bootstrap.ts — Deferred cinematic bootstrap (Story 5.1).
 *
 * This module is the ONLY entry-point that loads the heavy GSAP + R3F stack.
 * It is loaded via a DYNAMIC `import()` triggered by the FIRST real user scroll
 * or interaction, INSIDE `onMotionAllowed`. This ensures:
 *
 *   - Lighthouse's no-interaction trace on `/` NEVER fetches this module or its
 *     transitive deps (GSAP ~50KB gz, three ~150KB gz, R3F ~40KB gz).
 *   - The 256KB script budget on `/` stays green (AC5 / NFR-1).
 *   - Under prefers-reduced-motion the one-shot listener is never attached, so
 *     the entire heavy stack is NEVER loaded (AC3 / NFR-2).
 *
 * GRACEFUL DEGRADATION (AC2 "not supported" path, cycle_iteration=4 fix):
 *   If WebGL context creation FAILS (GPU blocklist, browser setting disabled,
 *   headless/corporate environments, low-end mobile), the static still poster
 *   MUST remain visible — the user must NOT see a blank canvas with nothing rendered.
 *   The fix is a three-layer defense:
 *   (a) probeWebGLSupport() — quick canvas probe BEFORE mounting R3F. If it fails,
 *       we skip R3F entirely; the still remains, no uncaught error.
 *   (b) onWebGLReady callback — the still is faded/removed ONLY AFTER the first
 *       confirmed frame render from GridMesh. If WebGL never renders, the still
 *       remains forever (it is the correct fallback state).
 *   (c) WebGLErrorBoundary — catches any React/R3F/three render error and calls
 *       onWebGLFailed, which restores full still visibility. No uncaught rejection.
 *
 * CALL SITE (index.astro <script>):
 *   import { onMotionAllowed } from '../lib/motion';
 *   onMotionAllowed(() => {
 *     const once = { once: true, passive: true };
 *     const load = () => import('./cinematic/bootstrap').then(m => m.boot());
 *     window.addEventListener('scroll', load, once);
 *     window.addEventListener('pointerdown', load, once);
 *     window.addEventListener('keydown', load, once);
 *   });
 *
 * NEVER `preventDefault` on the trigger events (NFR-2 / FR-2).
 */

import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { init as initCameraPath } from './index';

/** Whether the boot sequence has already run (guard against duplicate calls). */
let booted = false;

/**
 * Fade out and remove the static still poster — called ONLY after a confirmed
 * successful WebGL frame render. Never called unconditionally on mount.
 */
function hideStickerPoster(): void {
  const still = document.getElementById('cinematic-still-poster');
  if (!still) return;
  // Fade out with a CSS transition (GPU-composited, no GSAP needed).
  still.style.transition = 'opacity 0.8s ease';
  still.style.opacity = '0';
  setTimeout(() => {
    if (still.parentNode) still.parentNode.removeChild(still);
  }, 900);
}

/**
 * Restore the static still poster to full visibility — called when WebGL fails
 * (either the pre-mount probe or the error boundary). Ensures the user sees
 * the fallback image, not a blank area.
 */
function restoreStillPoster(): void {
  const still = document.getElementById('cinematic-still-poster');
  if (!still) return;
  still.style.transition = '';
  still.style.opacity = '';
}

/**
 * Mount the WebGL set-piece and start the GSAP camera path.
 * Safe to call multiple times — no-ops after the first call.
 *
 * Graceful degradation: if WebGL is unavailable or fails, the static still
 * poster remains visible (AC2). No uncaught promise rejection is thrown.
 */
export async function boot(): Promise<void> {
  if (booted) return;
  booted = true;

  // ── 1. Create the cinematic overlay element (for GSAP camera path) ─────────
  const overlay = document.createElement('div');
  overlay.id = 'cinematic-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:0;' +
    'background:transparent;will-change:opacity;';
  document.body.appendChild(overlay);

  // ── 2. Init the GSAP + ScrollTrigger camera path ───────────────────────────
  const handle = initCameraPath(overlay);

  // Store the handle on the window for Story 5.4 consumption.
  (window as Window & { __cinematicHandle?: typeof handle }).__cinematicHandle = handle;

  // ── 3. Probe WebGL support BEFORE mounting R3F ────────────────────────────
  // If the browser cannot create a WebGL context (GPU on blocklist, WebGL
  // disabled in settings, headless/corporate env, some low-end mobile), skip
  // the R3F mount entirely and keep the static still visible (AC2 fallback).
  const { probeWebGLSupport, WebGLSetpiece } = await import('../../islands/WebGLSetpiece');

  if (!probeWebGLSupport()) {
    // WebGL unavailable — keep the static still, no canvas, no error.
    // The GSAP camera path still runs (it animates the overlay, not the canvas).
    return;
  }

  // ── 4. Mount the WebGL set-piece (R3F) ────────────────────────────────────
  // Create a mount point ONLY if it doesn't exist (idempotent).
  let mountPoint = document.getElementById('webgl-setpiece-root');
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = 'webgl-setpiece-root';
    mountPoint.setAttribute('aria-hidden', 'true');
    document.body.appendChild(mountPoint);
  }

  // Mount the R3F island with React 19 createRoot.
  // The WebGLSetpiece component's callbacks drive the still poster lifecycle:
  //   onWebGLReady  → called from GridMesh's first successful frame → hide still
  //   onWebGLFailed → called from error boundary on R3F/three failure → restore still
  const root = createRoot(mountPoint);

  // Wrap render in a try/catch as an additional safety net for synchronous mount errors.
  // R3F async errors are handled by the WebGLErrorBoundary inside WebGLSetpiece.
  try {
    root.render(
      createElement(WebGLSetpiece, {
        onWebGLReady: hideStickerPoster,
        onWebGLFailed: () => {
          restoreStillPoster();
        },
      }),
    );
  } catch {
    // Synchronous mount error (very rare) — restore the still and do not rethrow.
    restoreStillPoster();
  }

  // NOTE: Do NOT call hideStickerPoster() here. The still is only hidden AFTER
  // onWebGLReady fires from GridMesh's first rendered frame. If the R3F canvas
  // never renders (context failure, shader error, loader 404), onWebGLReady never
  // fires and the still remains visible — the correct AC2 fallback state.
}
