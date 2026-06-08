/**
 * web/src/lib/cinematic/index.ts — GSAP + ScrollTrigger directed camera-path
 * controller (Story 5.1, AC1 / FR-3).
 *
 * This module is CLIENT-ONLY (never imported in Astro frontmatter / SSR).
 * All initialization runs inside `onMotionAllowed` — under prefers-reduced-motion
 * the module is NEVER imported (the dynamic import() is gated on reduced motion
 * before it fires, per AC3 / NFR-2).
 *
 * Public surface (minimal producer API for Story 5.4 consumption):
 *   - init(containerEl): set up the camera path; returns teardown().
 *   - teardown(): destroy all GSAP / ScrollTrigger instances.
 *   - goToScene(n): programmatically navigate to a scene (0-indexed). Story 5.4
 *     (director's mode) will call this; do NOT build the director's-mode driver here.
 *
 * DESIGN: the "camera path" is a GSAP/ScrollTrigger scroll-driven opacity/transform
 * transition on a fixed overlay element that creates the cinematic depth effect as
 * the user scrolls through the 7 home scenes. The overlay is NOT an additional
 * fixed canvas — it's a CSS-positioned element that GSAP animates in lock-step with
 * scroll position (real scroll, never hijacked). The scene-rail skip/jump anchors
 * remain visible and keyboard-operable throughout (FR-2).
 *
 * The WebGL set-piece (WebGLSetpiece.tsx) is a separate fixed canvas layered BELOW
 * the scene content. GSAP also animates a subtle camera-dolly effect on it via a
 * CSS custom property that the R3F camera reads each frame.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// ScrollToPlugin powers the goToScene() producer API's `gsap.to(window, { scrollTo })`.
// Without registering it, `scrollTo` is an unknown property and the tween no-ops —
// so goToScene() would silently fail to navigate when Story 5.4 first calls it.
// Both plugins live ONLY in the deferred cinematic-gsap chunk (loaded on first
// interaction inside onMotionAllowed), so this adds ZERO weight to the `/` initial
// load and the NFR-1 Lighthouse budget is unaffected.
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Scene IDs in the locked order (Story 1.4 / EXPERIENCE §"Scene order").
const SCENE_IDS = [
  'hero',
  'thesis',
  'timeline',
  'speaker',
  'flagship',
  'glass-box',
  'close',
] as const;

export type SceneId = (typeof SCENE_IDS)[number];

/** Opaque handle to an active cinematic session (for teardown). */
export interface CinematicHandle {
  /** Destroy all GSAP/ScrollTrigger instances created by this session. */
  teardown(): void;
  /** Programmatically navigate to a scene index (0-indexed). Story 5.4 API. */
  goToScene(index: number): void;
}

/**
 * Initialize the GSAP + ScrollTrigger camera path over the home scenes.
 *
 * Call this ONLY inside `onMotionAllowed()`—never at module level—so the entire
 * cinematic stack remains unreachable under prefers-reduced-motion.
 *
 * @param cinematicOverlay - The `.cinematic-overlay` element (fixed, pointer-events-none)
 *   that GSAP will animate to create the depth effect.
 * @returns A {@link CinematicHandle} with teardown + goToScene.
 */
export function init(cinematicOverlay: HTMLElement): CinematicHandle {
  const triggers: ScrollTrigger[] = [];
  const tweens: gsap.core.Tween[] = [];
  const timelines: gsap.core.Timeline[] = [];

  // Set initial overlay state (invisible until the camera path activates).
  gsap.set(cinematicOverlay, { opacity: 0, scale: 1 });

  // ── Per-scene ScrollTriggers ──────────────────────────────────────────────
  // Each scene section gets a ScrollTrigger that fires as the scene enters/exits
  // the viewport. The overlay animates a subtle vignette/depth shift, creating
  // the sense of a directed camera moving through the sequence.

  SCENE_IDS.forEach((id, i) => {
    const section = document.getElementById(id);
    if (!section) return;

    // Camera path: each scene smoothly transitions the overlay's properties.
    // The overlay is a fixed element that adds atmospheric depth (very subtle —
    // the scene content itself remains the primary visual).
    const isFirst = i === 0;
    const isLast = i === SCENE_IDS.length - 1;

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      end: 'bottom 40%',
      // Scrub: smooth scroll-driven animation (1 = 1-second smoothing lag).
      scrub: 1,
      onEnter: () => {
        // Announce scene transition for screen readers (no-op here; the rail handles it).
        cinematicOverlay.dataset['currentScene'] = String(i + 1);
      },
      onUpdate: (self) => {
        // Drive the overlay's subtle depth effect based on scroll progress (0→1 through the scene).
        const progress = self.progress;
        const opacity = isFirst
          ? Math.min(progress * 2, 0.04) // fade in gently on first scene
          : isLast
            ? Math.max(0.04 - progress * 0.04, 0)
            : 0.04; // constant ambient presence mid-arc

        // Camera-dolly signal for the WebGL set-piece: a CSS variable the R3F
        // component reads each frame to position the virtual camera.
        // Ranges from 0 (page top) to 1 (page bottom).
        const scrollRatio =
          (window.scrollY + window.innerHeight / 2) /
          (document.documentElement.scrollHeight - window.innerHeight / 2);
        document.documentElement.style.setProperty(
          '--cinematic-camera-t',
          String(Math.max(0, Math.min(1, scrollRatio)).toFixed(4)),
        );

        gsap.set(cinematicOverlay, { opacity });
      },
    });

    triggers.push(st);
  });

  // ── Global scroll-to-scene capability (producer API for Story 5.4) ────────
  // A simple, deterministic approach: scroll to the section's top offset.
  function goToScene(index: number): void {
    const clampedIndex = Math.max(0, Math.min(SCENE_IDS.length - 1, index));
    const id = SCENE_IDS[clampedIndex];
    if (!id) return;
    const section = document.getElementById(id);
    if (!section) return;
    // Smooth scroll (only under motion-allowed, which we already are here).
    const targetY = section.getBoundingClientRect().top + window.scrollY;
    gsap.to(window, {
      scrollTo: targetY,
      duration: 1.2,
      ease: 'power2.inOut',
      onStart: () => {
        ScrollTrigger.update();
      },
      onComplete: () => {
        ScrollTrigger.update();
      },
    });
  }

  function teardown(): void {
    // Kill all created ScrollTriggers.
    for (const st of triggers) st.kill();
    // Kill any GSAP tweens.
    for (const t of tweens) t.kill();
    for (const tl of timelines) tl.kill();
    // Remove the camera-t CSS variable.
    document.documentElement.style.removeProperty('--cinematic-camera-t');
    // Reset the overlay.
    gsap.set(cinematicOverlay, { clearProps: 'all' });
  }

  return { teardown, goToScene };
}
