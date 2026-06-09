/**
 * GlassBoxTour — guided tour island for /glass-box/ (Story 6.3).
 *
 * Narrated, story-driven step-through of the allowlisted Glass Box artifacts
 * in build-story order (the same date-sorted sequence the static <ol> renders).
 *
 * Interaction model:
 *   - Closed: a "Start the guided tour" button is the sole affordance.
 *   - Open:   one step at a time; next / prev / Esc / start-over controls;
 *             each step shows the artifact title + existing curatorNote;
 *             a "Read this artifact →" link to /glass-box/{slug}/;
 *             the corresponding static spine item is focused/scrolled to.
 *   - Closing: Esc returns focus to the start control.
 *
 * Information feature — NOT gated behind onMotionAllowed (unlike 6.2 decorative zoom):
 *   The tour mounts for all JS-on visitors, including reduced-motion users.
 *   ANIMATED transitions (scroll-into-view, fade in/out) live behind CSS
 *   `@media (prefers-reduced-motion: no-preference)` — under reduced-motion the
 *   tour steps INSTANTLY with no animation.
 *
 * JS-off (FR-8): the static <ol class="glass-box__spine"> is the full experience;
 *   the tour adds NO information not already in the static list.
 *
 * Rule 9 (credibility): narration = EXISTING curatorNotes + framing prose ONLY.
 *   ZERO newly-invented facts. Ghost nodes (no readers) are omitted from the tour.
 *
 * Rule 12 (exhaustive-deps): every useCallback/useEffect lists every captured
 *   reactive value. The `react-hooks/exhaustive-deps` ESLint rule is an ERROR.
 *
 * Rule 13: the user-observable outcome (visible narration + focused spine item +
 *   correct reader link) is what the tests assert — not just the $tourStep value.
 *
 * Accessibility:
 *   - Real <button> controls with aria-label.
 *   - aria-live region for narration (polite).
 *   - focus moves to the active step panel when stepping.
 *   - Esc closes the tour and returns focus to the start button.
 *   - Decorative step-number indicators stay aria-hidden.
 */
import React, { useCallback, useEffect, useId, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $tourStep } from '../lib/store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TourArtifact {
  slug: string;
  title: string;
  curatorNote: string;
  /** ISO-8601 date string (for sort order). */
  date: string;
}

// ---------------------------------------------------------------------------
// Helpers — exported for unit testing (Rule 8)
// ---------------------------------------------------------------------------

/**
 * Return the artifact at the given 0-based step index, or null if out of range.
 */
export function stepArtifact(artifacts: TourArtifact[], step: number | null): TourArtifact | null {
  if (step === null || step < 0 || step >= artifacts.length) return null;
  return artifacts[step] ?? null;
}

/**
 * Scroll the spine item for the given slug into view and mark it active.
 * Clears the active mark from all other spine items first.
 *
 * Under `prefers-reduced-motion: reduce` the scroll is `instant`; under
 * no-preference it is `smooth`. Focus is moved unconditionally.
 */
export function scrollToSpineItem(slug: string): void {
  if (typeof document === 'undefined') return;
  // Clear previous active mark.
  document.querySelectorAll<HTMLElement>('[data-tour-active]').forEach((el) => {
    el.removeAttribute('data-tour-active');
  });
  const item = document.querySelector<HTMLElement>(`[data-tour-slug="${CSS.escape(slug)}"]`);
  if (!item) return;
  item.setAttribute('data-tour-active', 'true');
  const prefersReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  item.scrollIntoView({
    behavior: prefersReduced ? 'instant' : 'smooth',
    block: 'center',
  });
}

/**
 * Clear the active mark from all spine items (called when the tour closes).
 */
export function clearActiveSpineItem(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('[data-tour-active]').forEach((el) => {
    el.removeAttribute('data-tour-active');
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface GlassBoxTourProps {
  /** Date-sorted featured artifacts (no ghost nodes — they have no readers). */
  artifacts: TourArtifact[];
  /** The Glass Box framing lead text (for intro narration). */
  framingLead: string;
  /**
   * The Glass Box recursion beat text — passed through for completeness
   * but rendered only statically in the page (the island does not duplicate it).
   */
  recursionBeat?: string;
}

export function GlassBoxTour({ artifacts, framingLead }: GlassBoxTourProps): React.ReactElement {
  const step = useStore($tourStep);
  const tourId = useId();
  const startBtnRef = useRef<HTMLButtonElement>(null);
  const stepPanelRef = useRef<HTMLDivElement>(null);

  // Whether the tour is open (step is a number, not null).
  const isOpen = step !== null;

  const totalSteps = artifacts.length;

  // ---- Open the tour (start or restart) -----------------------------------
  const openTour = useCallback((): void => {
    $tourStep.set(0);
  }, []); // no captured reactive values

  // ---- Close the tour, return focus to the start button -------------------
  const closeTour = useCallback((): void => {
    $tourStep.set(null);
    clearActiveSpineItem();
    // Return focus to the start button after the DOM updates.
    requestAnimationFrame(() => {
      startBtnRef.current?.focus();
    });
  }, []); // no captured reactive values

  // ---- Next / Prev --------------------------------------------------------
  const goNext = useCallback((): void => {
    const current = $tourStep.get();
    if (current === null) return;
    if (current < totalSteps - 1) {
      $tourStep.set(current + 1);
    }
  }, [totalSteps]);

  const goPrev = useCallback((): void => {
    const current = $tourStep.get();
    if (current === null) return;
    if (current > 0) {
      $tourStep.set(current - 1);
    }
  }, []); // totalSteps not captured; only checks current > 0

  // ---- Scroll + focus when step changes -----------------------------------
  useEffect(() => {
    if (step === null) return;
    const artifact = stepArtifact(artifacts, step);
    if (!artifact) return;
    scrollToSpineItem(artifact.slug);
    // Move focus to the step panel so keyboard users are in context.
    requestAnimationFrame(() => {
      stepPanelRef.current?.focus();
    });
  }, [step, artifacts]);

  // ---- Keyboard handling --------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeTour();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    },
    [closeTour, goNext, goPrev],
  );

  const activeArtifact = stepArtifact(artifacts, step);

  // ---- Render -------------------------------------------------------------
  return (
    <div className="gbt" data-testid="glassbox-tour" onKeyDown={handleKeyDown}>
      {/* ── Start control (always visible) ──────────────────────────────── */}
      <div className="gbt__start-row">
        <button
          ref={startBtnRef}
          className="gbt__start-btn"
          data-testid="tour-start-btn"
          onClick={openTour}
          aria-expanded={isOpen}
          aria-controls={`${tourId}-panel`}
        >
          {isOpen ? 'Restart the guided tour' : 'Start the guided tour'}
        </button>

        {isOpen && (
          <button
            className="gbt__close-btn"
            data-testid="tour-close-btn"
            onClick={closeTour}
            aria-label="Close the guided tour"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Tour panel (only when open) ──────────────────────────────────── */}
      {isOpen && activeArtifact && (
        <div
          id={`${tourId}-panel`}
          ref={stepPanelRef}
          className="gbt__panel"
          data-testid="tour-panel"
          tabIndex={-1}
          role="region"
          aria-label={`Guided tour step ${(step ?? 0) + 1} of ${totalSteps}: ${activeArtifact.title}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Step indicator — decorative */}
          <span className="gbt__step-indicator" aria-hidden="true">
            {(step ?? 0) + 1} / {totalSteps}
          </span>

          {/* Artifact title */}
          <h3 className="gbt__step-title" data-testid="tour-step-title">
            {activeArtifact.title}
          </h3>

          {/* Narration — existing curatorNote only (Rule 9) */}
          <p className="gbt__narration" data-testid="tour-narration">
            {activeArtifact.curatorNote}
          </p>

          {/* Reader link — composes with the artifact reader (AC2) */}
          <a
            className="gbt__reader-link"
            data-testid="tour-reader-link"
            href={`/glass-box/${activeArtifact.slug}/`}
          >
            Read this artifact →
          </a>

          {/* Navigation controls */}
          <div className="gbt__nav" role="group" aria-label="Tour navigation">
            <button
              className="gbt__nav-btn gbt__nav-btn--prev"
              data-testid="tour-prev-btn"
              onClick={goPrev}
              disabled={step === 0}
              aria-label="Previous artifact"
            >
              ← Prev
            </button>

            <span className="gbt__step-dots" aria-hidden="true">
              {artifacts.map((_, i) => (
                <span key={i} className={`gbt__dot${i === step ? ' gbt__dot--active' : ''}`} />
              ))}
            </span>

            {step < totalSteps - 1 ? (
              <button
                className="gbt__nav-btn gbt__nav-btn--next"
                data-testid="tour-next-btn"
                onClick={goNext}
                aria-label="Next artifact"
              >
                Next →
              </button>
            ) : (
              <button
                className="gbt__nav-btn gbt__nav-btn--close"
                data-testid="tour-finish-btn"
                onClick={closeTour}
                aria-label="Finish the tour"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Intro panel when tour is closed — framing prose (not active) ── */}
      {!isOpen && (
        <p className="gbt__intro-hint" data-testid="tour-intro-hint" aria-hidden="true">
          {framingLead}
        </p>
      )}
    </div>
  );
}
