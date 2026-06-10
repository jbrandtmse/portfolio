/**
 * DemonstratorReplay — stepped-replay island for /demonstrator/ (Story 9.1).
 *
 * A curated, replayable step-through of how THIS portfolio was built via the
 * BMAD Method (intent → brief → brainstorm/research → PRD → UX/architecture →
 * epics → build pipeline → retrospective → working software), drawn from the
 * real artifacts in content/demonstrator.ts.
 *
 * DISTINCT FROM THE GLASS BOX TOUR (6.3):
 *   The Glass Box tour walks the artifacts (the documents, on /glass-box/).
 *   The Demonstrator replays the BUILD LIFECYCLE using those artifacts as evidence,
 *   plus stage 6 (the real build pipeline) and stage 8 (working software).
 *   Different framing, different route, different island.
 *
 * Interaction model (mirrors GlassBoxTour UX):
 *   - Closed: a "Play the replay" button is the sole affordance.
 *   - Open:   one stage at a time; next / prev / Esc / start-over controls;
 *             each stage shows its label + narration + real artifact link(s);
 *             the corresponding static spine item is focused/scrolled to.
 *   - Closing: Esc returns focus to the start control.
 *
 * Information feature — NOT gated behind onMotionAllowed (like the Glass Box tour):
 *   The replay mounts for all JS-on visitors, including reduced-motion users.
 *   ANIMATED transitions (scroll-into-view) live behind CSS
 *   `@media (prefers-reduced-motion: no-preference)` — under reduced-motion the
 *   replay steps INSTANTLY with no animation.
 *
 * JS-off (FR-8): the static <ol class="demonstrator__spine"> is the full experience;
 *   the replay adds NO information not already in the static list.
 *
 * Rule 9 (credibility): narration = the DEMONSTRATOR_STAGES manifest only.
 *   ZERO newly-invented facts. Unresolved artifact links carry status='open'.
 *
 * Rule 12 (exhaustive-deps): every useCallback/useEffect lists every captured
 *   reactive value. The `react-hooks/exhaustive-deps` ESLint rule is an ERROR.
 *
 * Rule 13: the user-observable outcome (visible narration + focused spine item +
 *   correct artifact links) is what the tests assert — not just the $demoStep value.
 *
 * Accessibility:
 *   - Real <button> controls with aria-label.
 *   - aria-live region for narration (polite).
 *   - focus moves to the active step panel when stepping.
 *   - Esc closes the replay and returns focus to the start button.
 *   - Decorative step-number indicators stay aria-hidden.
 */
import React, { useCallback, useEffect, useId, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $demoStep } from '../lib/store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReplayStage {
  id: number;
  stage: string;
  narration: string;
  artifacts: { label: string; href: string; status: 'live' | 'open' }[];
  observable: string;
}

// ---------------------------------------------------------------------------
// Helpers — exported for unit testing (Rule 8)
// ---------------------------------------------------------------------------

/**
 * Return the stage at the given 0-based step index, or null if out of range.
 */
export function stepStage(stages: ReplayStage[], step: number | null): ReplayStage | null {
  if (step === null || step < 0 || step >= stages.length) return null;
  return stages[step] ?? null;
}

/**
 * Scroll the spine item for the given stage id into view and mark it active.
 * Clears the active mark from all other spine items first.
 *
 * Under `prefers-reduced-motion: reduce` the scroll is `instant`; under
 * no-preference it is `smooth`. Focus is moved unconditionally.
 */
export function scrollToSpineStage(stageId: number): void {
  if (typeof document === 'undefined') return;
  // Clear previous active mark.
  document.querySelectorAll<HTMLElement>('[data-demo-active]').forEach((el) => {
    el.removeAttribute('data-demo-active');
  });
  const item = document.querySelector<HTMLElement>(`[data-demo-stage="${stageId}"]`);
  if (!item) return;
  item.setAttribute('data-demo-active', 'true');
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
 * Clear the active mark from all spine items (called when the replay closes).
 */
export function clearActiveSpineStage(): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<HTMLElement>('[data-demo-active]').forEach((el) => {
    el.removeAttribute('data-demo-active');
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DemonstratorReplayProps {
  /** Ordered lifecycle stages from content/demonstrator.ts. */
  stages: ReplayStage[];
  /** Answer-first framing lead text (for intro hint). */
  framingLead: string;
}

export function DemonstratorReplay({
  stages,
  framingLead,
}: DemonstratorReplayProps): React.ReactElement {
  const step = useStore($demoStep);
  const replayId = useId();
  const startBtnRef = useRef<HTMLButtonElement>(null);
  const stepPanelRef = useRef<HTMLDivElement>(null);

  // Whether the replay is open (step is a number, not null).
  const isOpen = step !== null;

  const totalSteps = stages.length;

  // ---- Open the replay (start or restart) ----------------------------------
  const openReplay = useCallback((): void => {
    $demoStep.set(0);
  }, []); // no captured reactive values

  // ---- Close the replay, return focus to the start button ------------------
  const closeReplay = useCallback((): void => {
    $demoStep.set(null);
    clearActiveSpineStage();
    // Return focus to the start button after the DOM updates.
    requestAnimationFrame(() => {
      startBtnRef.current?.focus();
    });
  }, []); // no captured reactive values

  // ---- Next / Prev ---------------------------------------------------------
  const goNext = useCallback((): void => {
    const current = $demoStep.get();
    if (current === null) return;
    if (current < totalSteps - 1) {
      $demoStep.set(current + 1);
    }
  }, [totalSteps]);

  const goPrev = useCallback((): void => {
    const current = $demoStep.get();
    if (current === null) return;
    if (current > 0) {
      $demoStep.set(current - 1);
    }
  }, []); // totalSteps not captured; only checks current > 0

  // ---- Scroll + focus when step changes ------------------------------------
  useEffect(() => {
    if (step === null) return;
    const activeStage = stepStage(stages, step);
    if (!activeStage) return;
    scrollToSpineStage(activeStage.id);
    // Move focus to the step panel so keyboard users are in context.
    requestAnimationFrame(() => {
      stepPanelRef.current?.focus();
    });
  }, [step, stages]);

  // ---- Keyboard handling ---------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeReplay();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    },
    [closeReplay, goNext, goPrev],
  );

  const activeStage = stepStage(stages, step);

  // ---- Render --------------------------------------------------------------
  return (
    <div className="dr" data-testid="demonstrator-replay" onKeyDown={handleKeyDown}>
      {/* ── Start control (always visible) ──────────────────────────────── */}
      <div className="dr__start-row">
        <button
          ref={startBtnRef}
          className="dr__start-btn"
          data-testid="demo-start-btn"
          onClick={openReplay}
          aria-expanded={isOpen}
          aria-controls={`${replayId}-panel`}
        >
          {isOpen ? 'Restart the replay' : 'Play the replay'}
        </button>

        {isOpen && (
          <button
            className="dr__close-btn"
            data-testid="demo-close-btn"
            onClick={closeReplay}
            aria-label="Close the replay"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Replay panel (only when open) ───────────────────────────────── */}
      {isOpen && activeStage && (
        <div
          id={`${replayId}-panel`}
          ref={stepPanelRef}
          className="dr__panel"
          data-testid="demo-panel"
          tabIndex={-1}
          role="region"
          aria-label={`Replay step ${(step ?? 0) + 1} of ${totalSteps}: ${activeStage.stage}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Step indicator — decorative */}
          <span className="dr__step-indicator" aria-hidden="true">
            {(step ?? 0) + 1} / {totalSteps}
          </span>

          {/* Stage label */}
          <h3 className="dr__step-title" data-testid="demo-step-title">
            {activeStage.stage}
          </h3>

          {/* Narration — from the manifest only (Rule 9) */}
          <p className="dr__narration" data-testid="demo-narration">
            {activeStage.narration}
          </p>

          {/* Artifact links */}
          <div className="dr__artifact-links" data-testid="demo-artifact-links">
            {activeStage.artifacts.map((artifact) =>
              artifact.status === 'live' ? (
                <a key={artifact.href} className="dr__artifact-link" href={artifact.href}>
                  {artifact.label}
                </a>
              ) : (
                <span
                  key={artifact.href}
                  className="dr__artifact-open"
                  title="Coming in the Glass Box"
                >
                  {artifact.label}
                </span>
              ),
            )}
          </div>

          {/* Navigation controls */}
          <div className="dr__nav" role="group" aria-label="Replay navigation">
            <button
              className="dr__nav-btn dr__nav-btn--prev"
              data-testid="demo-prev-btn"
              onClick={goPrev}
              disabled={step === 0}
              aria-label="Previous stage"
            >
              ← Prev
            </button>

            <span className="dr__step-dots" aria-hidden="true">
              {stages.map((_, i) => (
                <span key={i} className={`dr__dot${i === step ? ' dr__dot--active' : ''}`} />
              ))}
            </span>

            {step < totalSteps - 1 ? (
              <button
                className="dr__nav-btn dr__nav-btn--next"
                data-testid="demo-next-btn"
                onClick={goNext}
                aria-label="Next stage"
              >
                Next →
              </button>
            ) : (
              <button
                className="dr__nav-btn dr__nav-btn--close"
                data-testid="demo-finish-btn"
                onClick={closeReplay}
                aria-label="Finish the replay"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Intro hint when replay is closed ────────────────────────────── */}
      {!isOpen && (
        <p className="dr__intro-hint" data-testid="demo-intro-hint" aria-hidden="true">
          {framingLead}
        </p>
      )}
    </div>
  );
}
