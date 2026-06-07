/**
 * GuidePill — the persistent site-wide "Ask my Guide" pill control (Story 4.4).
 *
 * This is the MINIMAL site-wide React island (Decision 2 NFR-1 carve-out):
 *   - A real <button> pill in the bottom-right corner of every page.
 *   - Toggles $guideOpen (the single nanostore atom).
 *   - The heavy GuidePanel is LAZILY imported — it does NOT load on a content
 *     route's initial page load. React.lazy + Suspense ensures the GuidePanel
 *     chunk is only fetched when the Guide is first opened.
 *   - On content routes like /about/, only this small pill script ships on
 *     initial load (shared React runtime + tiny pill chunk). The GuidePanel
 *     chunk loads on interaction. This is the NFR-1 carve-out (AC5, Decision 2).
 *
 * JS-off degradation (AC1): with JS off / island load-failed, the pill is absent
 * or inert — the Static Mirror beneath is fully usable and the hero entry's /faq
 * link + the Mirror carry the Guide affordance.
 *
 * Analytics: fires guide-opened on panel open (no PII). No-op when Umami unset (NFR-5).
 *
 * Focus management: the pill button receives focus back from the GuidePanel when
 * the panel is closed (AC4). It passes its own ref to GuidePanel so GuidePanel can
 * return focus here on close/minimize/Esc.
 *
 * Reduced motion: the pill's appearance animation is gated behind onMotionAllowed.
 * The GuidePanel manages its own motion gate.
 */
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';

import { track } from '../lib/analytics';
import { onMotionAllowed } from '../lib/motion';
import { $guideOpen } from '../lib/store';

// LAZY import: GuidePanel only loads its chunk when the Guide is first opened.
// This is the NFR-1 load-bearing carve-out — content routes do NOT ship the
// GuidePanel chunk on initial page load.
const GuidePanel = lazy(() => import('./GuidePanel').then((m) => ({ default: m.GuidePanel })));

// ---------------------------------------------------------------------------
// GuidePill component
// ---------------------------------------------------------------------------

function GuidePillInner() {
  const isOpen = useStore($guideOpen);
  const pillRef = useRef<HTMLButtonElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    onMotionAllowed(() => setMotionAllowed(true));
  }, []);

  // Restore open state from sessionStorage — if the Guide was open when a
  // citation-link navigation happened, reopen it after the page loads.
  // This is part of AC4 FR-7: "conversation persists" across citation navigations.
  // No analytics fired on restore (it was already counted when first opened).
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    try {
      if (sessionStorage.getItem('guide-open') === '1') {
        $guideOpen.set(true);
        // No track() call here — the open was already counted when first triggered
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist guide-open state to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem('guide-open', isOpen ? '1' : '0');
    } catch {
      // ignore
    }
  }, [isOpen]);

  // Mark the island as ready + listen for the hero's progressive-enhancement
  // 'guide:open' event (AC1, Decision 3). The hero entry dispatches this event
  // on click when the island is booted; we intercept it to open the Guide
  // instead of letting the browser navigate to /faq/.
  useEffect(() => {
    // Signal readiness: the hero script checks this before intercepting clicks
    document.documentElement.dataset.guideReady = '1';

    function onGuideOpen() {
      $guideOpen.set(true);
      track('guide-opened');
    }

    window.addEventListener('guide:open', onGuideOpen);
    return () => {
      window.removeEventListener('guide:open', onGuideOpen);
      delete document.documentElement.dataset.guideReady;
    };
  }, []);

  // Toggle the Guide open/closed. Analytics: guide-opened fires only on open.
  const handleToggle = () => {
    const opening = !isOpen;
    $guideOpen.set(opening);
    if (opening) {
      track('guide-opened');
    }
  };

  return (
    <>
      {/* The pill — persistent, bottom-right, real <button> */}
      <button
        ref={pillRef}
        type="button"
        className={`guide-pill${motionAllowed ? ' guide-pill--animated' : ''}`}
        aria-label={isOpen ? 'Close Guide' : 'Ask my Guide'}
        aria-expanded={isOpen}
        onClick={handleToggle}
        data-testid="guide-pill"
      >
        <span className="guide-pill__label" aria-hidden="true">
          {isOpen ? '×' : 'Ask my Guide'}
        </span>
      </button>

      {/* Lazily rendered panel — only when open (the NFR-1 lazy carve-out) */}
      <Suspense fallback={null}>
        <GuidePanel pillRef={pillRef} />
      </Suspense>

      <style>{`
        /* Guide pill — persistent, bottom-right, real <button> (AC1) */
        .guide-pill {
          position: fixed;
          bottom: 24px;
          right: 20px;
          z-index: 1001;
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: 10px 18px;
          background: var(--color-accent);
          color: var(--color-surface-base);
          border: none;
          border-radius: 24px;
          font-family: var(--font-family-base);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.01em;
          white-space: nowrap;
          transition: background-color 0.1s ease;
          /* Flat (no box-shadow — the flat/hairline system; the panel uses --shadow-float) */
        }

        .guide-pill:hover {
          background: var(--color-accent-hover);
        }

        .guide-pill:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 3px;
        }

        @media (prefers-reduced-motion: no-preference) {
          .guide-pill--animated {
            animation: guide-pill-in 200ms ease both;
          }
          @keyframes guide-pill-in {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        }

        /* Desktop home only: the SceneRail is a fixed 208px right sidebar whose
           foot holds "Skip to the end" + "Jump: book a talk". Offset the pill to
           the LEFT of the rail so it never covers those controls. body:has(.rail-d)
           targets the home page (the only SceneRail consumer); the rail is the
           right sidebar at >=1024px. */
        @media (min-width: 1024px) {
          body:has(.rail-d) .guide-pill {
            right: 228px;
          }
        }

        @media (max-width: 480px) {
          .guide-pill {
            bottom: 16px;
            right: 12px;
          }
        }
      `}</style>
    </>
  );
}

/**
 * GuidePill — the exported island default export.
 *
 * Mounted site-wide in BaseLayout with client:only="react" so it renders
 * client-side only (no SSR) — the pill is genuinely ABSENT from the JS-off HTML
 * (clean degradation, AC1: the JS-off e2e asserts pill count 0), rather than an
 * SSR'd-but-inert button. If hydration fails / JS is off, the pill is absent and
 * the Mirror / /faq carry the Guide affordance (JS-off degradation, AC1).
 */
export default function GuidePill() {
  return <GuidePillInner />;
}
